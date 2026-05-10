import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Only throw in production runtime (not during build)
const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build'

if (!supabaseUrl && process.env.NODE_ENV === 'production' && !isBuildTime) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL is required in production')
}
if (!supabaseServiceRoleKey && process.env.NODE_ENV === 'production' && !isBuildTime) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY is required in production')
}

/**
 * Supabase client with service_role key — bypasses RLS.
 * Use only in backend API routes.
 */
export const supabase: SupabaseClient = createClient(
  supabaseUrl || 'http://placeholder:54321',
  supabaseServiceRoleKey || 'placeholder-key',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)

/**
 * Supabase client with anon key — respects RLS.
 * Safe to use on the client side.
 */
export const supabaseAnon: SupabaseClient = createClient(
  supabaseUrl || 'http://placeholder:54321',
  supabaseAnonKey || 'placeholder-key'
)
