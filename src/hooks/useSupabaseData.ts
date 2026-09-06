import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { UrbanZone, SensorNode, AiModelMetric, NbsIntervention, ThesisObjectiveEvaluation } from '../types';
import { TRUJILLO_ZONES as FALLBACK_ZONES, SENSOR_NODES as FALLBACK_SENSORS, AI_MODELS_BENCHMARK as FALLBACK_MODELS, NBS_CATALOG as FALLBACK_NBS, THESIS_OBJECTIVES_DATA as FALLBACK_OBJECTIVES } from '../data/trujilloData';

const hasSupabase = Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY && !String(import.meta.env.VITE_SUPABASE_URL).includes('placeholder'));

function mapZone(r: any): UrbanZone {
  return {
    id: r.id,
    name: r.name,
    district: r.district,
    description: r.description,
    vulnerabilityLevel: r.vulnerability_level,
    targetPopulation: r.target_population,
    vulnerablePopulation: r.vulnerable_population,
    baselineTemp: Number(r.baseline_temp),
    baselinePM25: Number(r.baseline_pm25),
    treeCover: Number(r.tree_cover),
    builtDensity: Number(r.built_density),
    primaryPollutionSource: r.primary_pollution_source,
    geometryCoords: r.geometry_coords ?? [],
    sensorsCount: r.sensors_count,
  };
}
function mapSensor(r: any): SensorNode {
  return {
    id: r.id,
    code: r.code,
    name: r.name,
    zoneId: r.zone_id,
    zoneName: r.zone_name,
    lat: Number(r.lat),
    lng: Number(r.lng),
    elevation: Number(r.elevation),
    streetCanyonHWRatio: Number(r.street_canyon_hw_ratio),
    canopyCoverPercent: Number(r.canopy_cover_percent),
    sealedSurfacePercent: Number(r.sealed_surface_percent),
    trafficDensity: r.traffic_density,
    sensorType: r.sensor_type,
    calibrationStatus: r.calibration_status,
    r2ScoreRaw: Number(r.r2_score_raw),
    r2ScoreCalibrated: Number(r.r2_score_calibrated),
    status: r.status,
    rssi: r.rssi ?? undefined,
    batteryPct: r.battery_pct ?? undefined,
    lastReading: r.last_reading ?? FALLBACK_SENSORS.find(s=>s.id===r.id)?.lastReading ?? { timestamp:'', pm25:0, pm10:0, no2:0, o3:0, co:0, co2:0, temperature:0, humidity:0, windSpeed:0, windDirection:'SO', solarRadiation:0, heatIndex:0, uhiDelta:0, petScore:0, tcsScore:0, aqiIndex:0, aqiCategory:'Moderada' },
    hourlyHistory: [],
  };
}
function mapModel(r: any): AiModelMetric {
  return {
    id: r.id,
    name: r.name,
    modelType: r.model_type ?? undefined,
    architecture: r.architecture,
    referenceAuthor: r.reference_author,
    year: r.year,
    r2: Number(r.r2),
    rmse: Number(r.rmse),
    mae: Number(r.mae),
    mape: Number(r.mape),
    trainingTimeSec: r.training_time_sec,
    inferenceTimeMs: Number(r.inference_time_ms),
    spatialResolution: r.spatial_resolution,
    bestFitUse: r.best_fit_use,
    status: r.status,
    features: r.features ?? [],
  };
}
function mapNbs(r: any): NbsIntervention {
  return {
    id: r.id,
    name: r.name,
    type: r.type,
    description: r.description,
    recommendedFlora: r.recommended_flora ?? [],
    unitCostPEN: Number(r.unit_cost_pen),
    unitMaintenancePENYear: Number(r.unit_maintenance_pen_year),
    coolingCapacityC: Number(r.cooling_capacity_c),
    pmReductionPercent: Number(r.pm_reduction_percent),
    waterRetentionLPerM2: Number(r.water_retention_l_m2),
    co2SequestrationKgYear: Number(r.co2_sequestration_kg_year),
    acousticDampingDb: Number(r.acoustic_damping_db),
  };
}
function mapObjective(r: any, metrics: any[]): ThesisObjectiveEvaluation {
  return {
    code: r.code,
    title: r.title,
    status: r.status,
    progressPercent: r.progress_percent,
    summary: r.summary,
    metrics: metrics.filter(m=>m.objective_code===r.code).map(m=>({ name:m.name, target:m.target, achieved:m.achieved, compliance:m.compliance })),
  };
}

export function useSupabaseData() {
  const [zones, setZones] = useState<UrbanZone[]>(FALLBACK_ZONES);
  const [sensors, setSensors] = useState<SensorNode[]>(FALLBACK_SENSORS);
  const [models, setModels] = useState<AiModelMetric[]>(FALLBACK_MODELS);
  const [nbs, setNbs] = useState<NbsIntervention[]>(FALLBACK_NBS);
  const [objectives, setObjectives] = useState<ThesisObjectiveEvaluation[]>(FALLBACK_OBJECTIVES);
  const [loading, setLoading] = useState(hasSupabase);

  useEffect(() => {
    if (!hasSupabase) { setLoading(false); return; }
    let mounted = true;
    (async () => {
      try {
        const [zRes, sRes, mRes, nRes, oRes, omRes] = await Promise.all([
          supabase.from('urban_zones').select('*').order('id'),
          supabase.from('sensor_nodes').select('*').order('code'),
          supabase.from('ai_models').select('*').order('r2', { ascending: false }),
          supabase.from('nbs_interventions').select('*').order('id'),
          supabase.from('thesis_objectives').select('*').order('code'),
          supabase.from('thesis_objective_metrics').select('*'),
        ]);
        if (!mounted) return;
        if (zRes.data?.length) setZones(zRes.data.map(mapZone));
        // enrich sensors hourlyHistory desde environmental_readings (últimas 12)
        let mappedSensors = sRes.data?.length ? sRes.data.map(mapSensor) : FALLBACK_SENSORS;
        if (mappedSensors !== FALLBACK_SENSORS) {
          const { data: readings } = await supabase.from('environmental_readings').select('*').order('measured_at', { ascending: true }).limit(200);
          if (readings?.length) {
            const bySensor: Record<string, any[]> = {};
            readings.forEach((r:any)=>{
              const arr = bySensor[r.sensor_id] ??= [];
              arr.push({
                timestamp: new Date(r.measured_at).toLocaleTimeString('es-PE', { hour:'2-digit', minute:'2-digit' }),
                pm25: Number(r.pm25), pm10: Number(r.pm10), no2: Number(r.no2), o3: Number(r.o3), co: Number(r.co), co2: Number(r.co2),
                temperature: Number(r.temperature), humidity: Number(r.humidity), windSpeed: Number(r.wind_speed), windDirection: r.wind_direction,
                solarRadiation: Number(r.solar_radiation), heatIndex: Number(r.heat_index), uhiDelta: Number(r.uhi_delta),
                petScore: Number(r.pet_score), tcsScore: Number(r.tcs_score), aqiIndex: Number(r.aqi_index), aqiCategory: r.aqi_category,
              });
            });
            mappedSensors = mappedSensors.map(sn => ({ ...sn, hourlyHistory: bySensor[sn.id]?.slice(-12) ?? sn.hourlyHistory }));
          }
        }
        setSensors(mappedSensors);
        if (mRes.data?.length) setModels(mRes.data.map(mapModel));
        if (nRes.data?.length) setNbs(nRes.data.map(mapNbs));
        if (oRes.data?.length) setObjectives(oRes.data.map((r:any)=> mapObjective(r, omRes.data ?? [])));
      } catch (e) {
        console.warn('[SupabaseData] fallback a hardcoded', e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    // Realtime: lecturas nuevas actualizan last_reading
    const ch = supabase.channel('realtime-readings')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'environmental_readings' }, payload => {
        const r: any = payload.new;
        setSensors(prev => prev.map(s => s.id === r.sensor_id ? {
          ...s,
          lastReading: {
            timestamp: new Date(r.measured_at).toLocaleTimeString('es-PE', { hour:'2-digit', minute:'2-digit' }),
            pm25: Number(r.pm25), pm10: Number(r.pm10), no2: Number(r.no2), o3: Number(r.o3), co: Number(r.co), co2: Number(r.co2),
            temperature: Number(r.temperature), humidity: Number(r.humidity), windSpeed: Number(r.wind_speed), windDirection: r.wind_direction,
            solarRadiation: Number(r.solar_radiation), heatIndex: Number(r.heat_index), uhiDelta: Number(r.uhi_delta),
            petScore: Number(r.pet_score), tcsScore: Number(r.tcs_score), aqiIndex: Number(r.aqi_index), aqiCategory: r.aqi_category,
          },
          hourlyHistory: [...s.hourlyHistory.slice(-11), {
            timestamp: new Date(r.measured_at).toLocaleTimeString('es-PE', { hour:'2-digit', minute:'2-digit' }),
            pm25: Number(r.pm25), pm10: Number(r.pm10), no2: Number(r.no2), o3: Number(r.o3), co: Number(r.co), co2: Number(r.co2),
            temperature: Number(r.temperature), humidity: Number(r.humidity), windSpeed: Number(r.wind_speed), windDirection: r.wind_direction,
            solarRadiation: Number(r.solar_radiation), heatIndex: Number(r.heat_index), uhiDelta: Number(r.uhi_delta),
            petScore: Number(r.pet_score), tcsScore: Number(r.tcs_score), aqiIndex: Number(r.aqi_index), aqiCategory: r.aqi_category,
          }]
        } : s))
      })
      .subscribe();

    return () => { mounted = false; supabase.removeChannel(ch); };
  }, []);

  return { zones, sensors, models, nbs, objectives, loading, hasSupabase };
}
