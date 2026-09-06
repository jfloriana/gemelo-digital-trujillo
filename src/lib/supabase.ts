import { createClient } from '@supabase/supabase-js';

// Variables requeridas en .env.local y Vercel:
// VITE_SUPABASE_URL="https://<project>.supabase.co"
// VITE_SUPABASE_ANON_KEY="<anon key>"
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

// Fallback para desarrollo sin credenciales: no rompe build, solo advierte
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('[Supabase] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY no configuradas — usa .env.local o variables Vercel. Modo sin DB activado.');
}

export const supabase = createClient(
  supabaseUrl ?? 'https://placeholder.supabase.co',
  supabaseAnonKey ?? 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);

// Helper tipado opcional para tablas
export type SupabaseClientType = typeof supabase;
