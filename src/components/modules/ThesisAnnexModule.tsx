import React, { useState } from 'react';
import { Download, Image as ImageIcon, Table as TableIcon, ZoomIn, X } from 'lucide-react';
import { THESIS_FIGURES, THESIS_TABLES, ThesisFigure } from '../../data/thesisAnnexManifest';

function downloadFile(url: string, filename: string) {
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

const FIGURE_GROUPS: { label: string; filter: (f: ThesisFigure) => boolean }[] = [
  { label: 'Figuras del cuerpo del informe', filter: (f) => /^Figura \d+$/.test(f.id) },
  { label: 'Anexo A — Reporte automático de la plataforma', filter: (f) => f.id.startsWith('Figura A') },
  { label: 'Anexo B — Capturas del prototipo web', filter: (f) => f.id.startsWith('Figura B') },
];

export const ThesisAnnexModule: React.FC = () => {
  const [preview, setPreview] = useState<ThesisFigure | null>(null);

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
          para descargar directamente desde la aplicación, tal como se citan en el documento:
          {THESIS_FIGURES.length} figuras (PNG) y {THESIS_TABLES.length} tablas (CSV).
        </p>
      </div>

      {FIGURE_GROUPS.map((group) => {
        const figures = THESIS_FIGURES.filter(group.filter);
        if (figures.length === 0) return null;
        return (
          <div key={group.label} className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-sm dark:shadow-none">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-4">
              <ImageIcon className="w-4 h-4 text-emerald-600" />
              {group.label}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {figures.map((fig) => (
                <div
                  key={fig.id}
                  className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden flex flex-col bg-slate-50 dark:bg-slate-950"
                >
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
          {THESIS_TABLES.map((tbl) => (
            <div
              key={tbl.id}
              className="border border-slate-200 dark:border-slate-800 rounded-xl p-3 flex items-center justify-between gap-3 bg-slate-50 dark:bg-slate-950"
            >
              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-800 dark:text-slate-100">{tbl.id}</div>
                <div className="text-[11px] text-slate-600 dark:text-slate-400 truncate">{tbl.caption}</div>
              </div>
              <button
                onClick={() => downloadFile(tbl.file, `${tbl.id.replace(/\s+/g, '_')}.csv`)}
                className="shrink-0 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                CSV
              </button>
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
            <button
              onClick={() => downloadFile(preview.file, `${preview.id.replace(/\s+/g, '_')}.png`)}
              className="self-start px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700"
            >
              <Download className="w-3.5 h-3.5" />
              Descargar PNG
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
