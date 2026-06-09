import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('⚠ Faltan las variables VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en .env.local')
}

export const supabase = createClient(supabaseUrl, supabaseKey)
