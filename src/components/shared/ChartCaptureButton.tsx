import React, { useRef, useState } from 'react';
import { Camera, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { captureChartToAnnex } from '../../utils/captureToAnnex';

interface CaptureWrapperProps {
  /** Código sugerido para el Anexo, ej. "Gráfico OE1 - Temperatura por zona". El usuario puede editarlo. */
  defaultCode: string;
  /** Descripción sugerida que se guarda como leyenda en Anexos de Tesis. */
  defaultCaption: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Envuelve un gráfico (recharts u otro) y le agrega, solo para usuarios
 * con permiso de edición, un botón flotante para capturarlo como PNG y
 * agregarlo al catálogo de Anexos de Tesis (Supabase Storage + tabla
 * thesis_annex_items). Aparece de inmediato en ese módulo.
 */
export const CaptureWrapper: React.FC<CaptureWrapperProps> = ({ defaultCode, defaultCaption, children, className }) => {
  const { permissions } = useAuth();
  const ref = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);

  const handleCapture = async () => {
    if (!ref.current) return;
    const code = window.prompt('Código para este gráfico en Anexos de Tesis:', defaultCode);
    if (!code || !code.trim()) return;
    const caption = window.prompt('Descripción breve (leyenda):', defaultCaption) ?? defaultCaption;

    setBusy(true);
    const result = await captureChartToAnnex(ref.current, code, caption);
    setBusy(false);

    if (result.ok) {
      window.alert(`"${code}" se agregó al catálogo de Anexos de Tesis.`);
    } else {
      window.alert(`No se pudo capturar el gráfico.\n${result.error ?? ''}`);
    }
  };

  return (
    <div ref={ref} className={`relative group/capture ${className ?? ''}`}>
      {permissions.canModifyZones && (
        <button
          onClick={handleCapture}
          disabled={busy}
          title="Capturar este gráfico y agregarlo a Anexos de Tesis"
          className="absolute top-1.5 right-1.5 z-10 w-7 h-7 rounded-lg bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700 grid place-items-center opacity-0 group-hover/capture:opacity-100 hover:bg-emerald-50 dark:hover:bg-emerald-950 shadow-sm transition-opacity disabled:opacity-50"
        >
          {busy ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
          ) : (
            <Camera className="w-3.5 h-3.5 text-emerald-600" />
          )}
        </button>
      )}
      {children}
    </div>
  );
};
