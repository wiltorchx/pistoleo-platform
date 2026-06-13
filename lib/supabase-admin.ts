import { createClient, SupabaseClient } from '@supabase/supabase-js'

let _admin: SupabaseClient | null = null

export function getAdminClient(): SupabaseClient {
  if (_admin) return _admin

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    if (process.env.NODE_ENV === 'production' && !process.env.NEXT_PHASE_BUILD) {
      throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable')
    }
    return createClient('https://placeholder.supabase.co', 'placeholder-key')
  }

  _admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
  return _admin
}

export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getAdminClient()
    return client[prop as keyof SupabaseClient]
  },
}) as SupabaseClient
