import { useEffect, useState } from 'react';

export interface LiveBaseline {
  zone_id: string;
  temp: number;
  pm25: number;
  source: 'calibrated' | 'public_ref' | 'baseline';
  sensor_code: string | null;
  measured_at: string | null;
}

// Lee /api/baseline-live solo cuando el toggle está activo (Fase B).
// OFF por defecto: la tesis usa baselines estáticos reproducibles.
export function useLiveBaseline(zoneId: string, enabled: boolean) {
  const [data, setData] = useState<LiveBaseline | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setData(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetch(`/api/baseline-live?zone_id=${encodeURIComponent(zoneId)}`)
      .then((r) => r.json())
      .then((j) => {
        if (!cancelled && j && !j.error && Number.isFinite(j.temp) && Number.isFinite(j.pm25)) {
          setData(j as LiveBaseline);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [enabled, zoneId]);

  return { data, loading };
}
