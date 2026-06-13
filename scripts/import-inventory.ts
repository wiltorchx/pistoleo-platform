import { createClient } from '@supabase/supabase-js';
import ExcelJS from 'exceljs';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Error: Missing Supabase environment variables in .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function importInventory() {
  const UPC_CATALOG_PATH = 'C:\\Users\\Comunicaciones\\Downloads\\20260611T120403.602-Report.csv';
  const MERCHANDISE_PATH = 'C:\\Users\\Comunicaciones\\Downloads\\LRA SAN FRANCISCO NASH 11-061.csv';

  console.log('🚀 Starting inventory import...');

  try {
    // 1. Load UPC Catalog into a Map
    console.log('📖 Loading UPC Catalog...');
    const catalogMap = new Map<string, string>(); // SKU -> UPC
    const catalogWorkbook = new ExcelJS.Workbook();
    await catalogWorkbook.csv.readFile(UPC_CATALOG_PATH);
    const catalogSheet = catalogWorkbook.worksheets[0];

    catalogSheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // Skip header if exists (though CSV here doesn't seem to have one)
      const sku = row.getCell(1).value?.toString().trim();
      const upc = row.getCell(3).value?.toString().trim();
      if (sku && upc) {
        catalogMap.set(sku, upc);
      }
    });
    console.log(`✅ Loaded ${catalogMap.size} UPCs into catalog.`);

    // 2. Create a new Batch
    console.log('📦 Creating new batch...');
    // We need an admin user ID. Fetch or create one.
    const { data: adminUser, error: adminError } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'admin')
      .single();

    if (adminError || !adminUser) {
      console.log('👤 No admin user found. Creating one...');
      const { data: newAdmin, error: createError } = await supabase
        .from('users')
        .insert({
          first_name: 'Admin',
          last_name: 'Sistema',
          email: 'admin@pistoleo.com',
          password: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.PZvO.S', // 'Test1234' hashed
          role: 'admin',
          terms_accepted: true,
          email_verified: true,
        })
        .select('id')
        .single();

      if (createError) throw createError;
      adminUser = newAdmin;
      console.log('✅ Created admin user');
    }

    const { data: batch, error: batchError } = await supabase
      .from('pistoleo_batches')
      .insert({
        name: 'Carga Inicial LRA San Francisco 11-06',
        status: 'in_progress',
        created_by: adminUser.id,
      })
      .select()
      .single();

    if (batchError) throw batchError;
    const batchId = batch.id;
    console.log(`✅ Created batch: ${batch.name} (${batchId})`);

    // 3. Load Merchandise and Insert
    console.log('🚚 Processing merchandise data...');
    const merchWorkbook = new ExcelJS.Workbook();
    await merchWorkbook.csv.readFile(MERCHANDISE_PATH);
    const merchSheet = merchWorkbook.worksheets[0];

    const inventoryItems: unknown[] = [];
    let processedCount = 0;

    merchSheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // Skip header

      const sku = row.getCell(1).value?.toString().trim();
      const description = row.getCell(2).value?.toString().trim();
      const expectedQty = parseFloat(row.getCell(3).value?.toString().replace(',', '.') || '0');
      const actualQty = parseFloat(row.getCell(4).value?.toString().replace(',', '.') || '0');
      const revision = row.getCell(6).value?.toString().trim() || 'PENDING';

      if (!sku) return;

      const upc = catalogMap.get(sku) || sku; // Fallback to SKU if UPC not found
      
      let status = 'missing';
      if (actualQty > 0 && actualQty < expectedQty) status = 'partial';
      else if (actualQty >= expectedQty && actualQty <= expectedQty) status = 'complete';
      else if (actualQty > expectedQty) status = 'over';
      else if (actualQty === 0) status = 'missing';

      inventoryItems.push({
        batch_id: batchId,
        upc: upc,
        description: description,
        expected_quantity: Math.round(expectedQty),
        actual_quantity: Math.round(actualQty),
        status: status,
        revision: revision,
        updated_at: new Date().toISOString(),
      });

      processedCount++;

      // Batch insert every 500 items
      if (inventoryItems.length >= 500) {
        insertBatch(inventoryItems);
        inventoryItems.length = 0;
      }
    });

    if (inventoryItems.length > 0) {
      await insertBatch(inventoryItems);
    }

    async function insertBatch(items: unknown[]) {
      const { error } = await supabase.from('pistoleo_inventory').insert(items);
      if (error) {
        console.error('Error inserting batch:', error);
        throw error;
      }
    }

    console.log(`✨ Successfully imported ${processedCount} items into batch ${batchId}!`);

  } catch (error) {
    console.error('❌ Import failed:', error);
    process.exit(1);
  }
}

importInventory();
