import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://ntqucluneqcygbhqpqaq.supabase.co', 'sb_publishable_2mqg7w49iRXK5oC_38u6CQ_uXelkD0c');

async function getUserId() {
    const { data, error } = await supabase.from('users').select('id').eq('email', 'sanfra@example.com').single();
    if (error) {
        console.error('Error:', error.message);
        return;
    }
    console.log('USER_ID:', data.id);
}

getUserId();
