import { createClient } from '@supabase/supabase-js';

// Extraemos las credenciales del archivo .env.local que configuramos
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Este es el cliente centralizado. 
 * Lo exportamos para usarlo en page.tsx y cualquier otro componente.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);