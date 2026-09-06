import React, { useState, useEffect } from 'react';
import { UrbanZone } from '../../types';
import { supabase } from '../../lib/supabase';
import { X, MapPin, Save } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  editingZone: UrbanZone | null;
  onSaved: () => void;
}

const slugify = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,30) || 'zona';

export const ZoneFormModal: React.FC<Props> = ({ isOpen, onClose, editingZone, onSaved }) => {
  const [form, setForm] = useState<Partial<UrbanZone>>({
    name: '', district: '', description: '', vulnerabilityLevel: 'Media', targetPopulation: 10000, vulnerablePopulation: 3000,
    baselineTemp: 28, baselinePM25: 35, treeCover: 5, builtDensity: 70, primaryPollutionSource: '', sensorsCount: 0,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editingZone) setForm({ ...editingZone });
    else setForm({ name: '', district: '', description: '', vulnerabilityLevel: 'Media', targetPopulation: 10000, vulnerablePopulation: 3000, baselineTemp: 28, baselinePM25: 35, treeCover: 5, builtDensity: 70, primaryPollutionSource: '', sensorsCount: 0, geometryCoords: [{x:10,y:10},{x:90,y:10},{x:90,y:90},{x:10,y:90}] });
  }, [editingZone, isOpen]);

  if (!isOpen) return null;

  const handleSave = async () => {
    setError(null);
    if (!form.name?.trim() || !form.district?.trim() || !form.description?.trim()) { setError('Nombre, distrito y descripción son obligatorios.'); return; }
    setSaving(true);
    const id = editingZone ? editingZone.id : `zona-${slugify(form.name!)}-${Date.now().toString(36).slice(-4)}`;
    const payload = {
      id,
      name: form.name!.trim(),
      district: form.district!.trim(),
      description: form.description!.trim(),
      vulnerability_level: form.vulnerabilityLevel,
      target_population: Number(form.targetPopulation),
      vulnerable_population: Number(form.vulnerablePopulation),
      baseline_temp: Number(form.baselineTemp),
      baseline_pm25: Number(form.baselinePM25),
      tree_cover: Number(form.treeCover),
      built_density: Number(form.builtDensity),
      primary_pollution_source: form.primaryPollutionSource?.trim() || '—',
      geometry_coords: form.geometryCoords ?? [{x:10,y:10},{x:90,y:10},{x:90,y:90},{x:10,y:90}],
      sensors_count: Number(form.sensorsCount ?? 0),
    };
    const { error } = editingZone
      ? await supabase.from('urban_zones').update(payload).eq('id', editingZone.id)
      : await supabase.from('urban_zones').insert(payload);
    setSaving(false);
    if (error) { setError(error.message); return; }
    onSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[80] bg-black/50 backdrop-blur-sm grid place-items-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-auto shadow-2xl">
        <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-5 py-4 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2"><MapPin className="w-4 h-4 text-emerald-600" />{editingZone ? 'Editar Zona' : 'Registrar Nueva Zona'}</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-4">
          {error && <div className="bg-rose-50 dark:bg-rose-950 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs p-3 rounded-xl">{error}</div>}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="md:col-span-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Nombre *</label>
              <input value={form.name} onChange={e=>setForm({...form, name:e.target.value})} placeholder="Zona 7: Av. Fátima / UPAO" className="w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
            </div>
            <div>
              <label className="text-xs font-semibold">Distrito *</label>
              <input value={form.district} onChange={e=>setForm({...form, district:e.target.value})} placeholder="Trujillo" className="w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs" />
            </div>
            <div>
              <label className="text-xs font-semibold">Vulnerabilidad</label>
              <select value={form.vulnerabilityLevel} onChange={e=>setForm({...form, vulnerabilityLevel: e.target.value as any})} className="w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs">
                <option>Media</option><option>Alta</option><option>Muy Alta</option><option>Crítica</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-semibold">Descripción *</label>
              <textarea value={form.description} onChange={e=>setForm({...form, description:e.target.value})} rows={2} placeholder="Cañón urbano, tráfico, cobertura vegetal..." className="w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs" />
            </div>
            <div><label className="text-xs font-semibold">Población total</label><input type="number" value={form.targetPopulation} onChange={e=>setForm({...form, targetPopulation: Number(e.target.value)})} className="w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs" /></div>
            <div><label className="text-xs font-semibold">Población vulnerable</label><input type="number" value={form.vulnerablePopulation} onChange={e=>setForm({...form, vulnerablePopulation: Number(e.target.value)})} className="w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs" /></div>
            <div><label className="text-xs font-semibold">Temp base (°C)</label><input type="number" step="0.1" value={form.baselineTemp} onChange={e=>setForm({...form, baselineTemp: Number(e.target.value)})} className="w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs" /></div>
            <div><label className="text-xs font-semibold">PM2.5 base (µg/m³)</label><input type="number" step="0.1" value={form.baselinePM25} onChange={e=>setForm({...form, baselinePM25: Number(e.target.value)})} className="w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs" /></div>
            <div><label className="text-xs font-semibold">Cobertura arbórea (%)</label><input type="number" step="0.1" value={form.treeCover} onChange={e=>setForm({...form, treeCover: Number(e.target.value)})} className="w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs" /></div>
            <div><label className="text-xs font-semibold">Densidad edificada (%)</label><input type="number" step="0.1" value={form.builtDensity} onChange={e=>setForm({...form, builtDensity: Number(e.target.value)})} className="w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs" /></div>
            <div className="md:col-span-2"><label className="text-xs font-semibold">Fuente principal de contaminación</label><input value={form.primaryPollutionSource} onChange={e=>setForm({...form, primaryPollutionSource:e.target.value})} placeholder="Tráfico, industria, polvo..." className="w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs" /></div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={onClose} className="px-4 py-2 text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50">Cancelar</button>
            <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl flex items-center gap-1.5 disabled:opacity-50"><Save className="w-3.5 h-3.5" />{saving ? 'Guardando…' : editingZone ? 'Actualizar' : 'Registrar Zona'}</button>
          </div>
        </div>
      </div>
    </div>
  );
};
