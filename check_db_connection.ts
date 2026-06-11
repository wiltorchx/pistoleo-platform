import { supabase } from './lib/supabase';

async function checkDbConnection() {
  try {
    const { error } = await supabase.from('users').select('id').limit(1);
    if (error) {
      console.error('Failed to connect to Supabase:', error.message);
    } else {
      console.log('Successfully connected to Supabase!');
    }
  } catch (err) {
    console.error('Failed to connect to Supabase:', err);
  }
}

checkDbConnection();
