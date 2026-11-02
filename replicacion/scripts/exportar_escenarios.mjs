// Regenera salidas/escenarios_simulador.csv con el modelo vigente (src/utils/nbsModel.ts).
// Uso (desde la raíz del repositorio):  node replicacion/scripts/exportar_escenarios.mjs
// Requiere `npm install` (usa esbuild, que ya viene con vite, para compilar el TypeScript).
import { build } from 'esbuild';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const tmp = join(tmpdir(), 'nbs_export_' + process.pid);
mkdirSync(tmp, { recursive: true });
const out = join(tmp, 'bundle.mjs');
await build({
  stdin: {
    contents: `export * from './src/utils/nbsModel.ts'; export { TRUJILLO_ZONES } from './src/data/trujilloData.ts';`,
    resolveDir: process.cwd(), loader: 'ts',
  },
  bundle: true, format: 'esm', platform: 'node', outfile: out, logLevel: 'silent',
  external: ['@supabase/supabase-js'],
});
const { computeNbs, TRUJILLO_ZONES, NBS_COEF } = await import(pathToFileURL(out).href);

// Escenario por defecto del simulador (mismos valores iniciales que la interfaz).
const escenario = {
  modelType: '1d_cnn', canyonHWRatio: 2.1, windSpeed: 2.2, surfaceAlbedo: 0.2,
  studyAreaM2: NBS_COEF.DEFAULT_STUDY_AREA_M2, lai: NBS_COEF.DEFAULT_LAI,
  treeCrownRadiusM: NBS_COEF.DEFAULT_CROWN_RADIUS_M,
  treeCount: 180, greenRoofArea: 3200, greenWallArea: 1400, permeableArea: 4500, rainGardenArea: 950,
};

// Fórmula anterior (con topes fijos), solo para documentar el cambio.
function previo(z) {
  const tf = 1.05, pf = 1.08;
  const trap = 1 + (escenario.canyonHWRatio - 1) * 0.18;
  const wind = Math.max(0.6, 1 - (escenario.windSpeed - 1.5) * 0.12);
  const dt = ((escenario.treeCount / 100) * 1.85 * tf + (escenario.greenRoofArea / 1000) * 0.92 * (1 + (0.5 - 0.2) * 0.4)
    + (escenario.greenWallArea / 1000) * 0.74 + (escenario.permeableArea / 1000) * 0.42 * (1 + 0.2 * 0.6)
    + (escenario.rainGardenArea / 1000) * 0.48) / trap;
  const pm = ((escenario.treeCount / 100) * 15.2 * pf + (escenario.greenRoofArea / 1000) * 5.8 + (escenario.greenWallArea / 1000) * 7.4
    + (escenario.permeableArea / 1000) * 2.4 + (escenario.rainGardenArea / 1000) * 3.8) * wind;
  return { dtSinTope: dt, pmSinTope: pm, dt: Math.min(5.6, dt), pm: Math.min(42, pm) };
}

const f = (x) => x.toFixed(1);
const filas = [['zona_id', 'zona', 'temp_base_c', 'pm25_base_ugm3', 'reduccion_temp_c', 'temp_simulada_c', 'reduccion_pm25_pct', 'pm25_simulado_ugm3',
  'aporte_neto_arbolado_pm25_pct', 'ventilacion', 'cobertura_copas', 'regla_R1_activa', 'previo_reduccion_temp_c', 'previo_reduccion_pm25_pct', 'origen']];
for (const z of TRUJILLO_ZONES) {
  const r = computeNbs({ ...escenario, baselineTemp: z.baselineTemp, baselinePm25: z.baselinePM25 });
  const p = previo(z);
  filas.push([z.id, `"${z.name}"`, z.baselineTemp, z.baselinePM25, f(r.tempReduction), f(z.baselineTemp - r.tempReduction),
    f(r.pm25ReductionPercent), f(z.baselinePM25 * (1 - r.pm25ReductionPercent / 100)), f(r.pm25TreeNetPercent),
    r.ventilation, r.canopyCover, r.r1.active ? 1 : 0, f(p.dt), f(p.pm), 'SIMULADO (modelo heurístico; no es medición)']);
}
const csv = filas.map((r) => r.join(',')).join('\n') + '\n';
writeFileSync(join(process.cwd(), 'replicacion', 'salidas', 'escenarios_simulador.csv'), '\ufeff' + csv, 'utf8');
console.log(csv);
rmSync(tmp, { recursive: true, force: true });
