import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

if (!isSupabaseConfigured) {
  console.error(
    '[روح الأناقة] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY غير مضبوطة. أنشئ ملف .env من .env.example وعبئ القيم من Supabase Dashboard > Project Settings > API.'
  )
}

// Use placeholder values only to avoid crashing the React tree (white screen).
// All Supabase queries will fail gracefully with network error until real env is set.
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  }
)