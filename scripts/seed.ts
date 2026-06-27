import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function init() {
  const { createClient } = await import('@supabase/supabase-js');
  const bcrypt = (await import('bcryptjs')).default;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  return { supabase, bcrypt };
}

const { supabase, bcrypt } = await init();

async function seed() {
  const passwordHash = await bcrypt.hash('1234', 12);

  // Clean existing data
  await supabase.from('enrollments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('courses').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('users').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  // Create Admin User
  const { data: admin } = await supabase.from('users').insert({
    first_name: 'Will',
    last_name: 'Admin',
    email: 'will@pistoleo.com',
    password: passwordHash,
    role: 'admin',
    terms_accepted: true,
    email_verified: true,
  }).select().single();

  console.log('Usuario creado:', admin?.email);
  console.log('Password: 1234');
}

seed().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
