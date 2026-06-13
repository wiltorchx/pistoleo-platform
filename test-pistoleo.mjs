import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ntqucluneqcygbhqpqaq.supabase.co';
const SUPABASE_KEY = 'sb_publishable_2mqg7w49iRXK5oC_38u6CQ_uXelkD0c';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function processScan(batchId, upc) {
    const { data: inventory, error } = await supabase
        .from('pistoleo_inventory')
        .select('*')
        .eq('batch_id', batchId)
        .eq('upc', upc)
        .single();

    if (error || !inventory) {
        throw new Error(`Item ${upc} not found in batch inventory`);
    }

    const newActual = inventory.actual_quantity + 1;
    let status;
    if (newActual === 0) status = 'missing';
    else if (newActual < inventory.expected_quantity) status = 'partial';
    else if (newActual === inventory.expected_quantity) status = 'complete';
    else status = 'over';

    const { data: updated, error: updateError } = await supabase
        .from('pistoleo_inventory')
        .update({ actual_quantity: newActual, status })
        .eq('id', inventory.id)
        .select()
        .single();

    if (updateError) throw updateError;
    return updated;
}

async function runTests() {
    console.log('🚀 Starting Pistoleo System Tests...');

    // 1. Create Test Batch
    const { data: batch, error: batchErr } = await supabase
        .from('pistoleo_batches')
        .insert({ name: 'TEST_SISTEMA_LOGICA', created_by: '79c2977b-4a77-45ff-9622-7cdca7b8b121', status: 'in_progress' })
        .select().single();
    
    if (batchErr) {
        console.error('❌ Failed to create batch:', batchErr.message);
        return;
    }
    const batchId = batch.id;
    console.log(`✅ Created Test Batch: ${batchId}`);

    // 2. Setup Controlled Inventory
    const testItems = [
        { upc: 'TEST-A', desc: 'Prod A (1 exp)', exp: 1 },
        { upc: 'TEST-B', desc: 'Prod B (3 exp)', exp: 3 },
        { upc: 'TEST-C', desc: 'Prod C (1 exp - will stay missing)', exp: 1 },
    ];

    const inventoryToInsert = testItems.map(item => ({
        batch_id: batchId,
        upc: item.upc,
        description: item.desc,
        expected_quantity: item.exp,
        actual_quantity: 0,
        status: 'missing'
    }));

    const { error: invErr } = await supabase.from('pistoleo_inventory').insert(inventoryToInsert);
    if (invErr) {
        console.error('❌ Failed to insert inventory:', invErr.message);
        return;
    }
    console.log('✅ Inventory Setup Complete.');

    const results = [];

    try {
        // --- TEST CASE A: 1 expected ---
        console.log('Testing Item A (1 expected)...');
        let itemA = await processScan(batchId, 'TEST-A');
        results.push({ item: 'A', scan: 1, status: itemA.status, expected: 'complete', ok: itemA.status === 'complete' });
        
        itemA = await processScan(batchId, 'TEST-A');
        results.push({ item: 'A', scan: 2, status: itemA.status, expected: 'over', ok: itemA.status === 'over' });

        // --- TEST CASE B: 3 expected ---
        console.log('Testing Item B (3 expected)...');
        let itemB = await processScan(batchId, 'TEST-B');
        results.push({ item: 'B', scan: 1, status: itemB.status, expected: 'partial', ok: itemB.status === 'partial' });
        
        itemB = await processScan(batchId, 'TEST-B');
        results.push({ item: 'B', scan: 2, status: itemB.status, expected: 'partial', ok: itemB.status === 'partial' });
        
        itemB = await processScan(batchId, 'TEST-B');
        results.push({ item: 'B', scan: 3, status: itemB.status, expected: 'complete', ok: itemB.status === 'complete' });
        
        itemB = await processScan(batchId, 'TEST-B');
        results.push({ item: 'B', scan: 4, status: itemB.status, expected: 'over', ok: itemB.status === 'over' });

        // --- TEST CASE C: Not found ---
        console.log('Testing Item Unknown...');
        try {
            await processScan(batchId, 'UNKNOWN-UPC');
            results.push({ item: 'Unknown', scan: 1, status: 'Found (ERROR)', expected: 'Error', ok: false });
        } catch (e) {
            results.push({ item: 'Unknown', scan: 1, status: 'Error (Correct)', expected: 'Error', ok: true });
        }

    } catch (e) {
        console.error('❌ Unexpected error during scans:', e.message);
    }

    console.log('\n--- FINAL TEST RESULTS ---');
    console.table(results);

    // Cleanup
    await supabase.from('pistoleo_batches').delete().eq('id', batchId);
    await supabase.from('pistoleo_inventory').delete().eq('batch_id', batchId);
    console.log('\n🧹 Cleanup finished.');
}

runTests();
