import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

/**
 * Check if Supabase is properly configured.
 * Returns false if using placeholder values.
 */
export function isSupabaseConfigured(): boolean {
  return !!(supabaseUrl && supabaseServiceRoleKey &&
    supabaseUrl !== 'http://placeholder:54321' &&
    supabaseServiceRoleKey !== 'placeholder-key' &&
    supabaseUrl.startsWith('https://'))
}

/**
 * Supabase client with service_role key — bypasses RLS.
 * Use ONLY in backend API routes. Never expose to the client.
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
