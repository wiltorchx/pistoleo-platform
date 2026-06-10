import { supabase } from './supabase'

export const db = supabase

export async function connectDB() {
  const { error } = await supabase.from('users').select('id').limit(1)
  if (error) throw new Error(`Database connection failed: ${error.message}`)
  return supabase
}
