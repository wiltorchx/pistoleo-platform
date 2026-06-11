import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { parseInventoryPdf } from '@/lib/pistoleo/pdfParser';
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
