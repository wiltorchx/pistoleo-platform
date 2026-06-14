import { createClient } from '@supabase/supabase-js';

let _admin: ReturnType<typeof createClient> | null = null;

export function getAdminClient() {
  if (_admin) return _admin;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase admin environment variables');
  }

  _admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return _admin;
}

export const adminDb = new Proxy({} as ReturnType<typeof createClient>, {
  get(_target, prop) {
    return getAdminClient()[prop as keyof ReturnType<typeof createClient>];
  },
}) as ReturnType<typeof createClient>;