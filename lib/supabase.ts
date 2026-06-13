import { createClient, SupabaseClient } from '@supabase/supabase-js'

let _supabase: SupabaseClient | null = null

function getSupabaseClient(): SupabaseClient {
  if (_supabase) return _supabase

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    if (process.env.NODE_ENV === 'production' && !process.env.NEXT_PHASE_BUILD) {
      throw new Error('Missing Supabase environment variables')
    }
    // Return a mock client for build phase - use a properly typed mock
    return createClient('https://placeholder.supabase.co', 'placeholder-key')
  }

  _supabase = createClient(supabaseUrl, supabaseAnonKey)
  return _supabase
}

// Export a getter that returns the properly typed client
export const getSupabase = (): SupabaseClient => getSupabaseClient()

// For backward compatibility, export a proxy that works at runtime but has correct types at compile time
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getSupabaseClient()
    return client[prop as keyof SupabaseClient]
  }
}) as SupabaseClient