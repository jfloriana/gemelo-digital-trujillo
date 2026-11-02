import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  computeNbs, ventilationIndex, canopyCoverFraction, appendRuleEvent, readRuleLog, resolveTwinMitigation,
  NBS_COEF, RULE_LOG_KEY, ILLUSTRATIVE_LABEL, type NbsInputs, type RuleEvent,
} from '../utils/nbsModel';
import { SENSOR_NODES } from '../data/trujilloData';
import { isSimulatedReading, originLabel, SIMULATED_LABEL, isPendingMetric, formatProgress, type SensorNode } from '../types';
import { buildTelemetryCsv } from '../utils/exportUtils';

const base: NbsInputs = {
  modelType: 'xgboost',
  baselineTemp: 28.9,
  baselinePm25: 46.8,
  canyonHWRatio: 2.1,
  windSpeed: 2.2,
  surfaceAlbedo: 0.2,
  studyAreaM2: NBS_COEF.DEFAULT_STUDY_AREA_M2,
  lai: NBS_COEF.DEFAULT_LAI,
  treeCrownRadiusM: NBS_COEF.DEFAULT_CROWN_RADIUS_M,
  treeCount: 180,
  greenRoofArea: 3200,
  greenWallArea: 1400,
  permeableArea: 4500,
  rainGardenArea: 950,
};

describe('1. Sin topes fijos (5,6 °C y 42 %)', () => {
  it('el código fuente ya no contiene Math.min(5.6 ...) ni Math.min(42 ...)', () => {
    const model = readFileSync('src/utils/nbsModel.ts', 'utf8');
    const comp = readFileSync('src/components/modules/NbsSimulatorModule.tsx', 'utf8');
    for (const src of [model, comp]) {
      expect(src).not.toMatch(/Math\.min\(\s*5\.6/);
      expect(src).not.toMatch(/Math\.min\(\s*42\b/);
    }
  });

  it('la reducción térmica crece de forma continua y estrictamente monótona con la intervención', () => {
    const t = [40, 80, 160, 320, 640].map((n) => computeNbs({ ...base, treeCount: n }).tempReduction);
    for (let k = 1; k < t.length; k++) expect(t[k]).toBeGreaterThan(t[k - 1]);
  });

  it('la saturación se deriva de la mayor media documentada, no de 5,6 °C', () => {
    const big = computeNbs({ ...base, studyAreaM2: 1000, treeCount: 500, greenRoofArea: 1000, greenWallArea: 1000, permeableArea: 1000, rainGardenArea: 1000, canyonHWRatio: 1 });
    expect(big.tempReduction).toBeLessThanOrEqual(NBS_COEF.DT_SATURATION);
    expect(big.tempReduction).toBeGreaterThan(4);
  });

  it('la reducción de PM2.5 puede superar 42 % cuando los parámetros lo permiten', () => {
    const open = computeNbs({
      ...base, studyAreaM2: 1000, treeCount: 500, greenRoofArea: 1000, greenWallArea: 1000,
      permeableArea: 1000, rainGardenArea: 1000, canyonHWRatio: 0.2, windSpeed: 4, lai: 6,
    });
    expect(open.pm25ReductionPercent).toBeGreaterThan(42);
  });

  it('el área de estudio, el LAI y la cobertura cambian el resultado (límites derivados de parámetros)', () => {
    const a = computeNbs(base).tempReduction;
    expect(computeNbs({ ...base, studyAreaM2: 40000 }).tempReduction).toBeLessThan(a);
    expect(computeNbs({ ...base, lai: 1 }).tempReduction).toBeLessThan(a);
    expect(canopyCoverFraction(180, 3, 20000)).toBeCloseTo(0.2545, 3);
  });
});

describe('2. Efecto de la vegetación sobre PM2.5 con signo variable', () => {
  const treesOnly: NbsInputs = { ...base, greenRoofArea: 0, greenWallArea: 0, permeableArea: 0, rainGardenArea: 0 };

  it('es negativo (aumenta PM2.5) en cañón profundo y con poco viento', () => {
    const r = computeNbs({ ...treesOnly, canyonHWRatio: 2.4, windSpeed: 1.0 });
    expect(r.pm25TreeNetPercent).toBeLessThan(0);
    expect(r.pm25ReductionPercent).toBeLessThan(0);
  });

  it('es positivo con buena ventilación y PM2.5 alto', () => {
    const r = computeNbs({ ...treesOnly, canyonHWRatio: 0.4, windSpeed: 3.5, baselinePm25: 60 });
    expect(r.pm25TreeNetPercent).toBeGreaterThan(0);
  });

  it('el signo depende del rango de PM2.5 con la misma ventilación', () => {
    const vent = { canyonHWRatio: 0.5, windSpeed: 2.5 };
    const high = computeNbs({ ...treesOnly, ...vent, baselinePm25: 60 });
    const low = computeNbs({ ...treesOnly, ...vent, baselinePm25: 7 });
    expect(high.pm25TreeNetPercent).toBeGreaterThan(0);
    expect(low.pm25TreeNetPercent).toBeLessThan(0);
  });

  it('los muros y techos verdes no introducen penalización por ventilación', () => {
    const r = computeNbs({ ...base, treeCount: 0, canyonHWRatio: 2.4, windSpeed: 0.5 });
    expect(r.pm25ReductionPercent).toBeGreaterThan(0);
  });

  it('el índice de ventilación sigue los regímenes de Oke (1988)', () => {
    expect(ventilationIndex(3, 0.2)).toBe(1);
    expect(ventilationIndex(3, 0.65)).toBeCloseTo(NBS_COEF.V_AT_WAKE, 5);
    expect(ventilationIndex(3, 3)).toBeCloseTo(NBS_COEF.V_AT_DEEP, 5);
    expect(ventilationIndex(0, 1)).toBe(0);
  });
});

describe('3. Regla R1 (ventilación)', () => {
  it('se activa con arbolado denso y ventilación baja, y bloquea la recomendación', () => {
    const r = computeNbs(base);
    expect(r.r1.canopyCover).toBeGreaterThanOrEqual(NBS_COEF.R1_DENSE_CANOPY);
    expect(r.r1.ventilation).toBeLessThan(NBS_COEF.R1_MIN_VENT);
    expect(r.r1.active).toBe(true);
    expect(r.recommendationBlocked).toBe(true);
    expect(r.r1.reason).toContain('R1');
    expect(r.r1.maxRecommendedTrees).toBe(Math.floor((NBS_COEF.R1_SPARSE_CANOPY * base.studyAreaM2) / (Math.PI * 9)));
  });

  it('no se activa con buena ventilación', () => {
    expect(computeNbs({ ...base, canyonHWRatio: 0.4, windSpeed: 3.5 }).r1.active).toBe(false);
  });

  it('no se activa con arbolado ralo aunque la ventilación sea baja', () => {
    expect(computeNbs({ ...base, treeCount: 40 }).r1.active).toBe(false);
  });

  it('registra cada activación con marca de tiempo y la conserva (máx. 200)', () => {
    const mem: Record<string, string> = {};
    const storage = { getItem: (k: string) => mem[k] ?? null, setItem: (k: string, v: string) => { mem[k] = v; } };
    const r = computeNbs(base);
    const ev: RuleEvent = { ts: new Date().toISOString(), rule: 'R1', zoneId: 'zona-centro', canopyCover: r.r1.canopyCover, ventilation: r.r1.ventilation, message: r.r1.reason };
    appendRuleEvent(storage, ev);
    appendRuleEvent(storage, ev);
    expect(readRuleLog(storage)).toHaveLength(2);
    expect(JSON.parse(mem[RULE_LOG_KEY])[0].rule).toBe('R1');
    for (let i = 0; i < 250; i++) appendRuleEvent(storage, ev);
    expect(readRuleLog(storage)).toHaveLength(200);
  });

  it('el registro tolera un almacenamiento no disponible', () => {
    const broken = { getItem: () => { throw new Error('x'); }, setItem: () => { throw new Error('x'); } };
    expect(() => appendRuleEvent(broken, { ts: '', rule: 'R1', zoneId: 'z', canopyCover: 0, ventilation: 0, message: '' })).not.toThrow();
    expect(readRuleLog(broken)).toEqual([]);
  });
});

describe('4. Serie de respaldo marcada como SIMULADA / FALLBACK', () => {
  it('todas las lecturas horarias generadas por fórmula llevan origin SIMULADA/FALLBACK', () => {
    const all = SENSOR_NODES.flatMap((s) => s.hourlyHistory);
    expect(all.length).toBeGreaterThan(0);
    expect(all.every((r) => r.origin === 'SIMULADA/FALLBACK')).toBe(true);
    expect(all.every(isSimulatedReading)).toBe(true);
  });

  it('una lectura sin origen se trata como simulada y solo MEDICION cuenta como medición', () => {
    expect(isSimulatedReading({})).toBe(true);
    expect(isSimulatedReading({ origin: 'MEDICION' })).toBe(false);
    expect(originLabel({ origin: 'MEDICION' })).toBe('MEDICIÓN');
    expect(originLabel({})).toBe(SIMULATED_LABEL);
  });

  it('el CSV exportado marca cada fila con su origen', () => {
    const csv = buildTelemetryCsv(SENSOR_NODES as SensorNode[]);
    const lines = csv.split('\n');
    expect(lines[0].endsWith('origen_dato')).toBe(true);
    expect(lines.slice(1).every((l) => l.endsWith(`"${SIMULATED_LABEL}"`))).toBe(true);
  });

  it('una lectura medida se exporta como MEDICIÓN', () => {
    const measured = { ...SENSOR_NODES[0], hourlyHistory: SENSOR_NODES[0].hourlyHistory.map((r) => ({ ...r, origin: 'MEDICION' as const })) } as SensorNode;
    const lines = buildTelemetryCsv([measured]).split('\n').slice(1);
    expect(lines.every((l) => l.endsWith('"MEDICIÓN"'))).toBe(true);
  });
});

describe('5. Portada (gemelo 3D) calculada con nbsModel.ts', () => {
  const canvas = readFileSync('src/components/digitaltwin/DigitalTwinCanvas.tsx', 'utf8');
  const i18n = readFileSync('src/context/I18nContext.tsx', 'utf8');
  const app = readFileSync('src/App.tsx', 'utf8');

  it('el gemelo 3D ya no usa topes fijos 4,8 °C / 36 % ni coeficientes propios', () => {
    expect(canvas).not.toMatch(/Math\.min\(\s*4\.8/);
    expect(canvas).not.toMatch(/Math\.min\(\s*36\b/);
    expect(canvas).toContain('computeNbs(');
  });

  it('la tarjeta de mitigación no usa el texto fijo "-3.2 °C a -3.8 °C" en ningún idioma', () => {
    expect(i18n).not.toMatch(/cards\.mitigationVal/);
    expect(app).not.toMatch(/cards\.mitigationVal/);
    expect(app).toContain('cards.mitigationNone');
  });

  it('toda cifra de escenario lleva el rótulo "ilustrativa, modelo heurístico no validado"', () => {
    expect(ILLUSTRATIVE_LABEL).toBe('ilustrativa, modelo heurístico no validado');
    expect(i18n).toContain("'canvas.illustrative': 'Cifra ilustrativa, modelo heurístico no validado'");
    expect(canvas).toContain("t('canvas.illustrative')");
    expect(readFileSync('src/components/modules/NbsSimulatorModule.tsx', 'utf8')).toContain('ILLUSTRATIVE_LABEL');
  });

  it('con la configuración inicial de la portada, el Centro Histórico da un valor acotado por el modelo', () => {
    const r = computeNbs({
      ...base, modelType: '1d_cnn', baselineTemp: 29.4, baselinePm25: 48.2, canyonHWRatio: 2.1,
      treeCount: 123, greenRoofArea: 1800, greenWallArea: 650, permeableArea: 0, rainGardenArea: 0,
    });
    expect(r.tempReduction).toBeGreaterThan(0);
    expect(r.tempReduction).toBeLessThan(NBS_COEF.DT_SATURATION);
    expect(r.pm25ReductionPercent).toBeLessThan(36);
  });
});

describe('6. Portada = escenario OE4; OE4 pendiente de validación; cifras fijas rotuladas', () => {
  const read = (p: string) => readFileSync(p, 'utf8');

  it('si hay escenario guardado en OE4, la portada usa su resultado (mismos valores)', () => {
    const saved = { tempReduction: 1.6, pm25ReductionPercent: 4.1 };
    expect(resolveTwinMitigation(saved, { tempReduction: 0.9, pm25ReductionPercent: 0.6 })).toEqual(saved);
    expect(resolveTwinMitigation(null, { tempReduction: 0.9, pm25ReductionPercent: 0.6 })).toEqual({ tempReduction: 0.9, pm25ReductionPercent: 0.6 });
    expect(resolveTwinMitigation(null, null)).toBeNull();
  });

  it('App pasa al gemelo las NbS del escenario guardado y el gemelo parte de su línea base', () => {
    const app = read('src/App.tsx');
    const canvas = read('src/components/digitaltwin/DigitalTwinCanvas.tsx');
    expect(app).toContain('selectedNbs={twinScenario ? twinScenario.selectedNbs : appliedNbs}');
    expect(app).toContain('scenario={twinScenario}');
    expect(canvas).toContain('scenario.results.initialTemp');
    expect(canvas).toContain('scenario.results.tempReduction');
  });

  it('OE4 ya no está cumplido: en ejecución, métricas pendientes y sin las cifras 3,2 / 3,8 / 28,5', () => {
    const data = read('src/data/trujilloData.ts');
    const oe4 = data.slice(data.indexOf("code: 'OE4'"), data.indexOf("code: 'OE5'"));
    expect(oe4).toContain("status: 'En Ejecución'");
    expect(oe4).not.toMatch(/3\.2 °C|3\.8 °C|28\.5%/);
    expect((oe4.match(/Pendiente de validación/g) ?? []).length).toBe(3);
    expect((oe4.match(/compliance: false/g) ?? []).length).toBe(3);
    expect(isPendingMetric({ achieved: 'Pendiente de validación: x' })).toBe(true);
    expect(isPendingMetric({ achieved: 'R² = 0.99' })).toBe(false);
  });

  it('seed.sql y la migración 0009 dejan OE4 pendiente en la base de datos', () => {
    const seed = read('supabase/seed.sql');
    expect(seed).not.toMatch(/ΔT = 3\.2 °C \(Arbolado\)/);
    expect(seed).not.toMatch(/28\.5% en corredores arbolados/);
    const mig = read('supabase/migrations/0009_oe4_pendiente_validacion.sql');
    expect(mig).toContain("status = 'En Ejecución'");
    expect(mig).toContain('compliance = false');
  });

  it('las cifras fijas llevan el rótulo en la interfaz, los informes y los 6 idiomas', () => {
    const i18n = read('src/context/I18nContext.tsx');
    expect((i18n.match(/'ui\.fixedUnvalidated'/g) ?? []).length).toBe(6);
    expect(read('src/components/modules/ValidationPolicyModule.tsx')).toContain("t('ui.fixedUnvalidated')");
    const exp = read('src/utils/exportUtils.ts');
    expect(exp).toContain('t(5) = 8.42, p < .001, d = 1.9 (efecto grande) (valor fijo, ilustrativo, no validado)');
    expect(exp).toContain('metas de diseño ΔT 2.0–3.5 °C y ΔPM2.5 >20 %; valor fijo, ilustrativo, no validado');
    for (const k of ['assistant.g.nbs.a1', 'assistant.g.nbs.a2', 'assistant.g.pm.body', 'crispdm.p1.task2', 'validation.rec2.desc', 'cards.populationSub', 'nbs.metric.budgetSub']) {
      const lines = i18n.split('\n').filter((l) => l.includes(`'${k}':`));
      expect(lines).toHaveLength(6);
      expect(lines.every((l) => /\((valor fijo|fixed value|固定值|fester Wert|valeur fixe|valor fixo)/.test(l) || /_\((valor fijo|fixed value|固定值|fester Wert|valeur fixe|valor fixo)/.test(l))).toBe(true);
    }
  });
});

describe('7. OE5 pendiente, OE4 sin porcentaje, textos del asistente rotulados', () => {
  const read = (p: string) => readFileSync(p, 'utf8');
  const data = read('src/data/trujilloData.ts');
  const oe = (code: string, next?: string) => data.slice(data.indexOf(`code: '${code}'`), next ? data.indexOf(`code: '${next}'`) : undefined);

  it('OE4 y OE5 están en ejecución, sin porcentaje validado', () => {
    for (const block of [oe('OE4', 'OE5'), oe('OE5')]) {
      expect(block).toContain("status: 'En Ejecución'");
      expect(block).toContain('progressPercent: null');
    }
    expect(oe('OE4', 'OE5')).not.toContain('75');
    expect(formatProgress(null)).toBe('sin porcentaje validado');
    expect(formatProgress(100)).toBe('100%');
  });

  it('OE5: resumen reescrito y sus 3 métricas pendientes y no cumplidas', () => {
    const b = oe('OE5');
    expect(b).toContain("summary: 'Sin validación empírica; resultados ilustrativos'");
    expect(b).not.toContain('Se valida la hipótesis');
    expect((b.match(/Pendiente de validación: sin validación empírica;/g) ?? []).length).toBe(3);
    expect((b.match(/compliance: false/g) ?? []).length).toBe(3);
    expect(b).not.toContain('compliance: true');
  });

  it('seed.sql y la migración 0010 reflejan lo mismo y son idempotentes', () => {
    const seed = read('supabase/seed.sql');
    expect(seed).not.toContain('Se valida la hipótesis');
    expect(seed).not.toMatch(/'En Ejecución',75,/);
    const mig = read('supabase/migrations/0010_oe5_pendiente_validacion.sql');
    expect(mig).toContain('drop not null');
    expect(mig).toContain("summary = 'Sin validación empírica; resultados ilustrativos'");
    expect(mig).not.toMatch(/insert into/i);
    expect((mig.match(/compliance = false/g) ?? []).length).toBe(3);
    expect(read('supabase/schema.sql')).not.toMatch(/progress_percent integer not null/);
  });

  it('las respuestas del asistente con cifras de escenario llevan rótulo en los 6 idiomas', () => {
    const i18n = read('src/context/I18nContext.tsx');
    for (const k of ['assistant.g.heat.body', 'assistant.r.thesis.body', 'assistant.g.pm.body']) {
      const lines = i18n.split('\n').filter((l) => l.includes(`'${k}':`));
      expect(lines).toHaveLength(6);
      expect(lines.every((l) => /_\((valor fijo|fixed value|固定值|fester Wert|valeur fixe|valor fixo)/.test(l))).toBe(true);
    }
  });
});
