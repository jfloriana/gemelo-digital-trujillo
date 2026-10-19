import React, { useEffect, useState } from 'react';
import { Download, Image as ImageIcon, Table as TableIcon, ZoomIn, X, Trash2, Eye, Loader2 } from 'lucide-react';
import { THESIS_FIGURES, THESIS_TABLES } from '../../data/thesisAnnexManifest';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

interface ThesisAnnexItem {
  dbId: string | null;
  kind: 'figure' | 'table';
  id: string;
  file: string;
  caption: string;
}

function downloadFile(url: string, filename: string) {
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// Parser CSV mínimo pero correcto: respeta comillas dobles, comas y saltos
// de línea dentro de un campo (RFC 4180), que es lo que escribe csv.writer.
function parseCSV(text: string): string[][] {
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1); // strip BOM (csv escrito con utf-8-sig)
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      row.push(field);
      field = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field);
      field = '';
      rows.push(row);
      row = [];
    } else {
      field += c;
    }
  }
  if (field !== '' || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ''));
}

const FIGURE_GROUPS: { label: string; filter: (f: ThesisAnnexItem) => boolean }[] = [
  { label: 'Figuras del cuerpo del informe', filter: (f) => /^Figura \d+$/.test(f.id) },
  { label: 'Anexo A — Reporte automático de la plataforma', filter: (f) => f.id.startsWith('Figura A') },
  { label: 'Anexo B — Capturas del prototipo web', filter: (f) => f.id.startsWith('Figura B') },
];

const FALLBACK_ITEMS: ThesisAnnexItem[] = [
  ...THESIS_FIGURES.map((f) => ({ dbId: null, kind: 'figure' as const, id: f.id, file: f.file, caption: f.caption })),
  ...THESIS_TABLES.map((t) => ({ dbId: null, kind: 'table' as const, id: t.id, file: t.file, caption: t.caption })),
];

export const ThesisAnnexModule: React.FC = () => {
  const { permissions } = useAuth();
  const [items, setItems] = useState<ThesisAnnexItem[]>(FALLBACK_ITEMS);
  const [preview, setPreview] = useState<ThesisAnnexItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [tablePreview, setTablePreview] = useState<ThesisAnnexItem | null>(null);
  const [tableRows, setTableRows] = useState<string[][] | null>(null);
  const [tableLoadError, setTableLoadError] = useState<string | null>(null);

  const openTablePreview = async (tbl: ThesisAnnexItem) => {
    setTablePreview(tbl);
    setTableRows(null);
    setTableLoadError(null);
    try {
      const res = await fetch(tbl.file);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      setTableRows(parseCSV(text));
    } catch (e) {
      setTableLoadError(e instanceof Error ? e.message : 'Error al cargar la tabla');
    }
  };

  useEffect(() => {
    let active = true;
    (async () => {
      const { data, error } = await supabase
        .from('thesis_annex_items')
        .select('*')
        .order('sort_order');
      if (!active) return;
      if (!error && data && data.length > 0) {
        setItems(
          data.map((r: any) => ({
            dbId: r.id,
            kind: r.kind,
            id: r.code,
            file: r.file_path,
            caption: r.caption,
          }))
        );
      }
      // Si falla o la tabla aún no existe/está vacía, se mantiene el fallback estático.
    })();
    return () => { active = false; };
  }, []);

  const figures = items.filter((i) => i.kind === 'figure');
  const tables = items.filter((i) => i.kind === 'table');

  const handleDelete = async (item: ThesisAnnexItem) => {
    if (!confirm(`¿Eliminar "${item.id}" del catálogo de anexos? Esta acción no se puede deshacer.`)) return;
    setDeletingId(item.id);
    try {
      if (item.dbId) {
        const { error } = await supabase.from('thesis_annex_items').delete().eq('id', item.dbId);
        if (error) {
          alert(`No se pudo eliminar de la base de datos: ${error.message}`);
          return;
        }
      }
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      if (preview?.id === item.id) setPreview(null);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-sm dark:shadow-none">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="px-2.5 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800 text-[11px] font-bold">
            Material suplementario
          </span>
        </div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
          Anexos de la Tesis — Figuras y Tablas Descargables
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-3xl">
          Todas las figuras y tablas del informe (GemeloDigital_SBN.docx) quedan disponibles aquí
          para descargar directamente desde la aplicación: {figures.length} figuras (PNG) y{' '}
          {tables.length} tablas (CSV).
          {permissions.canModifyZones && ' Como usuario con permisos de edición, puedes eliminar cualquier elemento que no corresponda.'}
        </p>
      </div>

      {FIGURE_GROUPS.map((group) => {
        const groupFigures = figures.filter(group.filter);
        if (groupFigures.length === 0) return null;
        return (
          <div key={group.label} className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-sm dark:shadow-none">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-4">
              <ImageIcon className="w-4 h-4 text-emerald-600" />
              {group.label}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {groupFigures.map((fig) => (
                <div
                  key={fig.id}
                  className="relative border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden flex flex-col bg-slate-50 dark:bg-slate-950"
                >
                  {permissions.canModifyZones && (
                    <button
                      onClick={() => handleDelete(fig)}
                      disabled={deletingId === fig.id}
                      title="Eliminar esta imagen del catálogo"
                      className="absolute top-2 right-2 z-10 w-7 h-7 rounded-lg bg-white/90 dark:bg-slate-900/90 border border-rose-200 dark:border-rose-800 grid place-items-center hover:bg-rose-50 dark:hover:bg-rose-950 shadow-sm disabled:opacity-50"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                    </button>
                  )}
                  <button
                    onClick={() => setPreview(fig)}
                    className="relative group aspect-video bg-white dark:bg-slate-900 overflow-hidden"
                    title="Ver en grande"
                  >
                    <img src={fig.file} alt={fig.id} className="w-full h-full object-contain" loading="lazy" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                      <ZoomIn className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </button>
                  <div className="p-3 flex-1 flex flex-col gap-2">
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-100">{fig.id}</div>
                    <div className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-3 flex-1">
                      {fig.caption}
                    </div>
                    <button
                      onClick={() => downloadFile(fig.file, `${fig.id.replace(/\s+/g, '_')}.png`)}
                      className="self-start px-2.5 py-1.5 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Descargar PNG
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-sm dark:shadow-none">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-4">
          <TableIcon className="w-4 h-4 text-emerald-600" />
          Tablas del informe (CSV)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {tables.map((tbl) => (
            <div
              key={tbl.id}
              className="border border-slate-200 dark:border-slate-800 rounded-xl p-3 flex items-center justify-between gap-3 bg-slate-50 dark:bg-slate-950"
            >
              <button
                onClick={() => openTablePreview(tbl)}
                className="min-w-0 text-left flex-1 hover:opacity-80 transition-opacity"
                title="Previsualizar contenido de la tabla"
              >
                <div className="text-xs font-bold text-slate-800 dark:text-slate-100">{tbl.id}</div>
                <div className="text-[11px] text-slate-600 dark:text-slate-400 truncate">{tbl.caption}</div>
              </button>
              <div className="shrink-0 flex items-center gap-1.5">
                <button
                  onClick={() => openTablePreview(tbl)}
                  title="Previsualizar"
                  className="w-7 h-7 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 grid place-items-center hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <Eye className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
                </button>
                <button
                  onClick={() => downloadFile(tbl.file, `${tbl.id.replace(/\s+/g, '_')}.csv`)}
                  className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  CSV
                </button>
                {permissions.canModifyZones && (
                  <button
                    onClick={() => handleDelete(tbl)}
                    disabled={deletingId === tbl.id}
                    title="Eliminar esta tabla del catálogo"
                    className="w-7 h-7 rounded-lg bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-800 grid place-items-center hover:bg-rose-50 dark:hover:bg-rose-950 disabled:opacity-50"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {preview && (
        <div
          className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-6"
          onClick={() => setPreview(null)}
        >
          <div className="max-w-5xl w-full max-h-full flex flex-col gap-3" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between text-white">
              <div>
                <div className="font-bold">{preview.id}</div>
                <div className="text-xs text-slate-300 max-w-2xl">{preview.caption}</div>
              </div>
              <button onClick={() => setPreview(null)} className="p-2 rounded-lg bg-white/10 hover:bg-white/20">
                <X className="w-5 h-5" />
              </button>
            </div>
            <img src={preview.file} alt={preview.id} className="max-h-[75vh] w-full object-contain rounded-xl bg-white" />
            <div className="flex items-center gap-2">
              <button
                onClick={() => downloadFile(preview.file, `${preview.id.replace(/\s+/g, '_')}.png`)}
                className="px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700"
              >
                <Download className="w-3.5 h-3.5" />
                Descargar PNG
              </button>
              {permissions.canModifyZones && (
                <button
                  onClick={() => handleDelete(preview)}
                  disabled={deletingId === preview.id}
                  className="px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Eliminar
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {tablePreview && (
        <div
          className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-6"
          onClick={() => setTablePreview(null)}
        >
          <div
            className="max-w-5xl w-full max-h-[85vh] flex flex-col gap-3 bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="font-bold text-slate-900 dark:text-white">{tablePreview.id}</div>
                <div className="text-xs text-slate-600 dark:text-slate-400 max-w-2xl mt-0.5">{tablePreview.caption}</div>
              </div>
              <button
                onClick={() => setTablePreview(null)}
                className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 shrink-0"
              >
                <X className="w-5 h-5 text-slate-700 dark:text-slate-300" />
              </button>
            </div>

            <div className="flex-1 overflow-auto border border-slate-200 dark:border-slate-800 rounded-xl">
              {tableLoadError && (
                <div className="p-6 text-sm text-rose-600 dark:text-rose-400">
                  No se pudo cargar la tabla: {tableLoadError}
                </div>
              )}
              {!tableLoadError && !tableRows && (
                <div className="p-10 flex items-center justify-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Cargando contenido…
                </div>
              )}
              {tableRows && tableRows.length > 0 && (
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-950 sticky top-0">
                    <tr>
                      {tableRows[0].map((cell, i) => (
                        <th
                          key={i}
                          className="text-left px-3 py-2 font-bold text-slate-800 dark:text-slate-100 border-b border-slate-200 dark:border-slate-800 whitespace-nowrap"
                        >
                          {cell}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {tableRows.slice(1).map((row, ri) => (
                      <tr key={ri} className="even:bg-slate-50/60 dark:even:bg-slate-950/40">
                        {row.map((cell, ci) => (
                          <td
                            key={ci}
                            className="px-3 py-2 text-slate-700 dark:text-slate-300 border-b border-slate-100 dark:border-slate-800/60 align-top"
                          >
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => downloadFile(tablePreview.file, `${tablePreview.id.replace(/\s+/g, '_')}.csv`)}
                className="px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700"
              >
                <Download className="w-3.5 h-3.5" />
                Descargar CSV
              </button>
              {permissions.canModifyZones && (
                <button
                  onClick={() => { handleDelete(tablePreview); setTablePreview(null); }}
                  disabled={deletingId === tablePreview.id}
                  className="px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Eliminar
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
