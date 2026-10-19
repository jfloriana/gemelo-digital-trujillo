import html2canvas from 'html2canvas';
import { supabase } from '../lib/supabase';

export interface CaptureResult {
  ok: boolean;
  error?: string;
}

/**
 * Captura un nodo del DOM (un gráfico) como PNG, lo sube al bucket de
 * Storage "thesis-annex" y crea la fila correspondiente en
 * thesis_annex_items para que aparezca de inmediato en el módulo
 * "Anexos de Tesis". Requiere rol privilegiado (RLS en Supabase).
 */
export async function captureChartToAnnex(
  element: HTMLElement,
  code: string,
  caption: string
): Promise<CaptureResult> {
  let canvas: HTMLCanvasElement;
  try {
    canvas = await html2canvas(element, { backgroundColor: '#ffffff', scale: 2, useCORS: true });
  } catch (e) {
    return { ok: false, error: `No se pudo renderizar el gráfico: ${e instanceof Error ? e.message : String(e)}` };
  }

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
  if (!blob) return { ok: false, error: 'No se pudo generar la imagen PNG.' };

  const safeCode = code.trim().replace(/\s+/g, '_').replace(/[^\w-]/g, '');
  const path = `captures/${Date.now()}_${safeCode || 'grafico'}.png`;

  const { error: upErr } = await supabase.storage
    .from('thesis-annex')
    .upload(path, blob, { contentType: 'image/png', upsert: false });
  if (upErr) return { ok: false, error: `Error al subir la imagen: ${upErr.message}` };

  const { data: pub } = supabase.storage.from('thesis-annex').getPublicUrl(path);

  const { data: maxRow } = await supabase
    .from('thesis_annex_items')
    .select('sort_order')
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextOrder = (maxRow?.sort_order ?? 0) + 1;

  const { error: insErr } = await supabase.from('thesis_annex_items').insert({
    kind: 'figure',
    code: code.trim(),
    file_path: pub.publicUrl,
    caption,
    sort_order: nextOrder,
  });
  if (insErr) return { ok: false, error: `Imagen subida, pero no se pudo registrar en Anexos: ${insErr.message}` };

  return { ok: true };
}
