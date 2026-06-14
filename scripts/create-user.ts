import { createClient } from '@supabase/supabase-js';

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  const { data, error } = await admin
    .from('users')
    .insert({
      first_name: 'dylan',
      last_name: '',
      email: 'dylan@pistoleo.local',
      password: '$2b$12$2Uw9crUQUUZ8uUwYFcQy/OClsKglHabiw/D6qZWEYjWgFD1UhbQW2',
      role: 'admin',
      terms_accepted: true,
      email_verified: true,
    })
    .select()
    .single();

  if (error) {
    console.error('Error:', error.message);
  } else {
    console.log('Usuario dylan creado:', data.id);
  }
}

main();
