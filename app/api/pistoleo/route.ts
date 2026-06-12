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
 
        const buffer = Buffer.from(await file.arrayBuffer());
        const items = await parseInventoryPdf(buffer);
 
        const inventoryDocs = items.map(item => ({
          batch_id: batchId,
          upc: item.upc,
          description: item.description,
          expected_quantity: item.quantity,
          actual_quantity: 0,
          status: item.quantity > 0 ? 'missing' : 'complete',
        }));
 
        const { error: insertError } = await db
          .from('pistoleo_inventory')
          .insert(inventoryDocs);
 
        if (insertError) throw insertError;
 
        return NextResponse.json({ message: `Imported ${items.length} items` });
      }
 
      if (action === 'commit-inventory') {
        const batchId = formData.get('batchId') as string;
        const itemsStr = formData.get('items') as string;
 
        if (!batchId || !itemsStr) {
          return NextResponse.json({ error: 'Missing batchId or items' }, { status: 400 });
        }
 
        try {
          const items = JSON.parse(itemsStr);
          const inventoryDocs = items.map((item: any) => ({
            batch_id: batchId,
            upc: item.upc,
            description: item.description,
            expected_quantity: item.quantity,
            actual_quantity: 0,
            status: item.quantity > 0 ? 'missing' : 'complete',
          }));
 
          const { error: insertError } = await db
            .from('pistoleo_inventory')
            .insert(inventoryDocs);
 
          if (insertError) throw insertError;
 
          return NextResponse.json({ message: `Committed ${items.length} items` });
        } catch (e: any) {
          return NextResponse.json({ error: e.message || 'Commit failed' }, { status: 500 });
        }
      }
 
      if (action === 'upload-excel') {
        const batchId = formData.get('batchId') as string;
        const file = formData.get('file') as File;
        const mappingStr = formData.get('mapping') as string;
 
        if (!file || !mappingStr) {
          return NextResponse.json({ error: 'Missing file or mapping' }, { status: 400 });
        }
 
        try {
          const mapping = JSON.parse(mappingStr);
          const buffer = Buffer.from(await file.arrayBuffer());
          const items = await parseInventoryExcel(buffer, mapping);
 
          const inventoryDocs = items.map(item => ({
            batch_id: batchId,
            upc: item.upc,
            description: item.description,
            expected_quantity: item.expectedQuantity,
            actual_quantity: 0,
            status: item.expectedQuantity > 0 ? 'missing' : 'complete',
          }));
 
          const { error: insertError } = await db
            .from('pistoleo_inventory')
            .insert(inventoryDocs);
 
          if (insertError) throw insertError;
 
          return NextResponse.json({ message: `Imported ${items.length} items from Excel` });
        } catch (e: any) {
          return NextResponse.json({ error: e.message || 'Excel processing failed' }, { status: 500 });
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
