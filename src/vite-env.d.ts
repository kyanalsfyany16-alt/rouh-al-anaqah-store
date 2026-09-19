/// <reference types="vite/client" />
/// <reference types="@supabase/supabase-js" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_SITE_URL?: string
  readonly VITE_GOOGLE_VERIFICATION?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}