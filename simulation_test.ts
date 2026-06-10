import { supabase } from './lib/supabase';
import fs from 'fs';

async function runSimulation() {
  try {
    const products = JSON.parse(fs.readFileSync('extracted_products.json', 'utf8'));
    const sampleProducts = products.slice(0, 20);

    // 1. Create Batch
    const { data: batch } = await supabase.from('pistoleo_batches').insert({
      name: `SIMULATION TEST ${new Date().toISOString()}`,
      status: 'in_progress',
      created_by: '00000000-0000-0000-0000-000000000000',
    }).select().single();

    console.log(`Created Batch: ${batch.id}`);

    // 2. Populate Inventory
    console.log('Populating inventory...');
    const inventoryItems = [];
    for (let i = 0; i < sampleProducts.length; i++) {
      const product = sampleProducts[i];
      const expected = Math.floor(Math.random() * 5) + 1;
      inventoryItems.push({
        batch_id: batch.id,
        upc: product.upc,
        description: product.description,
        expected_quantity: expected,
        actual_quantity: 0,
        status: 'missing',
      });
    }
    await supabase.from('pistoleo_inventory').insert(inventoryItems);

    // 3. Simulate Scans
    console.log('Simulating scans...');
    const { data: items } = await supabase.from('pistoleo_inventory').select('*').eq('batch_id', batch.id);

    for (let i = 0; i < (items || []).length; i++) {
      const item = items![i];
      let scanCount = 0;

      if (i % 4 === 0) {
        scanCount = item.expected_quantity;
      } else if (i % 4 === 1) {
        scanCount = Math.max(1, item.expected_quantity - 1);
      } else if (i % 4 === 2) {
        scanCount = item.expected_quantity + 2;
      } else {
        scanCount = 0;
      }

      console.log(`Simulating ${scanCount} scans for ${item.upc} (Expected: ${item.expected_quantity})`);

      const scanDocs = [];
      for (let s = 0; s < scanCount; s++) {
        scanDocs.push({
          batch_id: batch.id,
          upc: item.upc,
          user_id: '00000000-0000-0000-0000-000000000000',
          scanned_at: new Date().toISOString(),
        });
      }
      if (scanDocs.length > 0) {
        await supabase.from('pistoleo_scans').insert(scanDocs);
      }

      let status: string;
      if (scanCount === 0) status = 'missing';
      else if (scanCount < item.expected_quantity) status = 'partial';
      else if (scanCount === item.expected_quantity) status = 'complete';
      else status = 'over';

      await supabase.from('pistoleo_inventory').update({ actual_quantity: scanCount, status }).eq('id', item.id);
    }

    // 4. Validate Summary
    const { data: finalItems } = await supabase.from('pistoleo_inventory').select('*').eq('batch_id', batch.id);
    const summary = {
      totalItems: finalItems?.length || 0,
      complete: (finalItems || []).filter(it => it.status === 'complete').length,
      partial: (finalItems || []).filter(it => it.status === 'partial').length,
      missing: (finalItems || []).filter(it => it.status === 'missing').length,
      over: (finalItems || []).filter(it => it.status === 'over').length,
    };

    console.log('\n--- FINAL SUMMARY ---');
    console.log(summary);
    console.log('---------------------\n');

    await supabase.from('pistoleo_batches').update({ status: 'completed' }).eq('id', batch.id);
    console.log('Batch marked as completed.');
  } catch (err) {
    console.error('Simulation Error:', err);
  }
}

runSimulation();
