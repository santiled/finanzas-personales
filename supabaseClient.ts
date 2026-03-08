import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Usar valores dummy si faltan las variables para evitar que la app explote (crash) al iniciar.
// Esto permitirá que la página cargue y puedas ver los errores en la consola.
const url = supabaseUrl || "https://tu-proyecto.supabase.co";
const key = supabaseAnonKey || "tu-anon-key";

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("⚠️ ADVERTENCIA CRÍTICA: No se detectaron las variables de entorno de Supabase. La conexión a la base de datos fallará.");
}

export const supabase = createClient(url, key);