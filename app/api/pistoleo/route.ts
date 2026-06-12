import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { parseInventoryPdf } from '@/lib/pistoleo/pdfParser';
import { parseInventoryExcel } from '@/lib/pistoleo/excelParser';
import { processScan } from '@/lib/pistoleo/comparisonEngine';

export async function POST(req: Request) {
  const contentType = req.headers.get('content-type') || '';

  try {
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const action = formData.get('action');

      if (action === 'create-batch') {
        const name = formData.get('name') as string;
        const userId = formData.get('userId') as string;

        const { data: batch, error } = await db
          .from('pistoleo_batches')
          .insert({ name, created_by: userId, status: 'pending' })
          .select()
          .single();

        if (error) throw error;
        return NextResponse.json(batch);
      }

      if (action === 'parse-pdf') {
        const file = formData.get('file') as File;
        if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        const buffer = Buffer.from(await file.arrayBuffer());
        const items = await parseInventoryPdf(buffer);
        return NextResponse.json({ items });
      }
 
      if (action === 'upload-pdf') {
        const batchId = formData.get('batchId') as string;
        const file = formData.get('file') as File;

        if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

        // Validate batch exists
        const { data: batch, error: batchError } = await db
          .from('pistoleo_batches')
          .select('id')
          .eq('id', batchId)
          .single();
        if (batchError || !batch) {
          return NextResponse.json({ error: 'Lote no encontrado' }, { status: 404 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const items = await parseInventoryPdf(buffer);

        // Deduplicate by UPC
        const uniqueItems = items.reduce<typeof items>((acc, item) => {
          if (!acc.find(i => i.upc === item.upc)) acc.push(item);
          return acc;
        }, []);

        const inventoryDocs = uniqueItems.map(item => ({
          batch_id: batchId,
          upc: item.upc,
          description: item.description,
          expected_quantity: Math.round(Number(item.quantity) || 0),
          actual_quantity: 0,
          status: (Number(item.quantity) || 0) > 0 ? 'missing' : 'complete',
        }));

        const { error: upsertError } = await db
          .from('pistoleo_inventory')
          .upsert(inventoryDocs, { onConflict: 'batch_id,upc' });

        if (upsertError) throw upsertError;

        return NextResponse.json({ message: `Imported ${uniqueItems.length} items` });
      }
 
      if (action === 'commit-inventory') {
        const batchId = formData.get('batchId') as string;
        const itemsStr = formData.get('items') as string;

        if (!batchId || !itemsStr) {
          return NextResponse.json({ error: 'Missing batchId or items' }, { status: 400 });
        }

        // Validate batch exists
        const { data: batch, error: batchError } = await db
          .from('pistoleo_batches')
          .select('id')
          .eq('id', batchId)
          .single();
        if (batchError || !batch) {
          return NextResponse.json({ error: 'Lote no encontrado' }, { status: 404 });
        }

        try {
          const items = JSON.parse(itemsStr) as Array<{ upc: string; description: string; quantity: number }>;
          
          // Deduplicate by UPC
          const uniqueItems = items.reduce<typeof items>((acc, item) => {
            if (!acc.find(i => i.upc === item.upc)) acc.push(item);
            return acc;
          }, []);

          const inventoryDocs = uniqueItems.map((item: typeof items[0]) => ({
            batch_id: batchId,
            upc: item.upc,
            description: item.description,
            expected_quantity: Math.round(Number(item.quantity) || 0),
            actual_quantity: 0,
            status: (Number(item.quantity) || 0) > 0 ? 'missing' : 'complete',
          }));

          // Use upsert to handle both new and existing inventory items
          const { error: upsertError, data } = await db
            .from('pistoleo_inventory')
            .upsert(inventoryDocs, { onConflict: 'batch_id,upc' });

          if (upsertError) {
            console.error('Upsert error:', upsertError);
            throw upsertError;
          }

          return NextResponse.json({ message: `Committed ${uniqueItems.length} items`, data });
        } catch (e: any) {
          console.error('Commit inventory error:', e);
          return NextResponse.json({ 
            error: e.message || 'Commit failed',
            details: e.details,
            code: e.code,
            hint: e.hint
          }, { status: 500 });
        }
      }

      if (action === 'clear-inventory') {
        const batchId = formData.get('batchId') as string;

        if (!batchId) {
          return NextResponse.json({ error: 'Missing batchId' }, { status: 400 });
        }

        try {
          // Delete inventory items only (keep the batch)
          const { error: invError } = await db
            .from('pistoleo_inventory')
            .delete()
            .eq('batch_id', batchId);

          if (invError) throw invError;

          return NextResponse.json({ message: 'Inventory cleared successfully' });
        } catch (e: any) {
          return NextResponse.json({ error: e.message || 'Clear failed' }, { status: 500 });
        }
      }
 
      if (action === 'upload-excel') {
        const batchId = formData.get('batchId') as string;
        const file = formData.get('file') as File;
        const mappingStr = formData.get('mapping') as string;

        if (!file || !mappingStr) {
          return NextResponse.json({ error: 'Missing file or mapping' }, { status: 400 });
        }

        // Validate batch exists
        const { data: batch, error: batchError } = await db
          .from('pistoleo_batches')
          .select('id')
          .eq('id', batchId)
          .single();
        if (batchError || !batch) {
          return NextResponse.json({ error: 'Lote no encontrado' }, { status: 404 });
        }

        try {
          const mapping = JSON.parse(mappingStr);
          const buffer = await file.arrayBuffer();
          const items = await parseInventoryExcel(buffer, mapping);

          // Deduplicate by UPC
          interface ExcelParsedItem { upc: string; description: string; expectedQuantity: number; }
          const uniqueItems = items.reduce<ExcelParsedItem[]>((acc, item) => {
            if (!acc.find(i => i.upc === item.upc)) acc.push(item);
            return acc;
          }, []);

          const inventoryDocs = uniqueItems.map(item => ({
            batch_id: batchId,
            upc: item.upc,
            description: item.description,
            expected_quantity: Math.round(Number(item.expectedQuantity) || 0),
            actual_quantity: 0,
            status: (Number(item.expectedQuantity) || 0) > 0 ? 'missing' : 'complete',
          }));

          const { error: upsertError } = await db
            .from('pistoleo_inventory')
            .upsert(inventoryDocs, { onConflict: 'batch_id,upc' });

          if (upsertError) throw upsertError;

          return NextResponse.json({ message: `Imported ${uniqueItems.length} items from Excel` });
        } catch (e: any) {
          console.error('Excel import error:', e);
          return NextResponse.json({ 
            error: e.message || 'Excel processing failed',
            details: e.details,
            code: e.code,
            hint: e.hint
          }, { status: 500 });
        }
      }

    } else {
      const body = await req.json();
      if (body.action === 'scan') {
        const { batchId, upc, userId } = body;
        const updatedInventory = await processScan(batchId, upc);

        await db.from('pistoleo_scans').insert({
          batch_id: batchId,
          upc,
          user_id: userId,
        });

        return NextResponse.json(updatedInventory);
      }
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
