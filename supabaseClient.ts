import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Faltan las variables de entorno de Supabase. Asegúrate de configurarlas en Vercel.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);