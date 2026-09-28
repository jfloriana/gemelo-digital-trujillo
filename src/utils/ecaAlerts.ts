import { SensorNode } from '../types';
import { isVirtualSensor } from '../types';

export type EcaLevel = 'danger' | 'warning';

export interface EcaAlert {
  sensorId: string;
  code: string;
  zoneName: string;
  level: EcaLevel;
  kind: 'pm' | 'heat';
  pm25: number;
  temperature: number;
  timestamp: string;
  isPublic: boolean;
}

// Umbrales: ECA-Aire Perú D.S. 003-2017-MINAM (PM2.5 24h: 50) y episodio de
// calor (T ≥ 32 °C). Warning = supera guía OMS (15) o categoría sensible.
// Solo en pantalla y reportes: no hay push (fuera del alcance gratuito).
export const ECA_PM25 = 50;
export const OMS_PM25 = 15;
export const HEAT_TEMP = 32;

export function buildEcaAlerts(sensors: SensorNode[]): EcaAlert[] {
  const out: EcaAlert[] = [];
  for (const s of sensors) {
    const r = s.lastReading;
    if (!r || !r.timestamp || (r.pm25 <= 0 && r.temperature <= 0)) continue; // sin telemetría real
    const isPublic = isVirtualSensor(s);
    if (r.pm25 >= ECA_PM25) {
      out.push({ sensorId: s.id, code: s.code, zoneName: s.zoneName, level: 'danger', kind: 'pm', pm25: r.pm25, temperature: r.temperature, timestamp: r.timestamp, isPublic });
    } else if (r.pm25 >= OMS_PM25 || r.temperature >= HEAT_TEMP) {
      out.push({
        sensorId: s.id, code: s.code, zoneName: s.zoneName, level: 'warning',
        kind: r.temperature >= HEAT_TEMP && r.pm25 < OMS_PM25 ? 'heat' : 'pm',
        pm25: r.pm25, temperature: r.temperature, timestamp: r.timestamp, isPublic,
      });
    }
  }
  return out.sort((a, b) => (a.level === b.level ? b.pm25 - a.pm25 : a.level === 'danger' ? -1 : 1));
}
