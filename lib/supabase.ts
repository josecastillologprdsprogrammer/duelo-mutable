import { createClient } from '@supabase/supabase-js';

// Escribimos los valores directamente para forzar el build
export const supabase = createClient(
  'https://ssepshdoovqssiovtrih.supabase.co', 
  'sb_publishable_4v-YfRGSmJvi_AK9HaGxMw_f8Qxry_s'
);