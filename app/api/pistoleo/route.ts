import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { PistoleoBatch } from '@/models/PistoleoBatch';
import { parseInventoryPdf } from '@/lib/pistoleo/pdfParser';
import { PistoleoInventory } from '@/models/PistoleoInventory';
import { PistoleoScan } from '@/models/PistoleoScan';
import { processScan } from '@/lib/pistoleo/comparisonEngine';
import { connectDB } from '@/lib/db';

export async function POST(req: Request) {
  await connectDB(); // Ensure DB connection
  
  const contentType = req.headers.get('content-type') || '';
  
  try {
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const action = formData.get('action');

      if (action === 'create-batch') {
        const name = formData.get('name') as string;
        const userId = formData.get('userId') as string;
        
        const batch = await PistoleoBatch.create({
          name,
          createdBy: new mongoose.Types.ObjectId(userId),
          status: 'pending',
        });
        
        return NextResponse.json(batch);
      }

      if (action === 'upload-pdf') {
        const batchId = formData.get('batchId') as string;
        const file = formData.get('file') as File;
        
        if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        
        const buffer = Buffer.from(await file.arrayBuffer());
        const items = await parseInventoryPdf(buffer);
        
        const inventoryDocs = items.map(item => ({
          batchId: new mongoose.Types.ObjectId(batchId),
          upc: item.upc,
          description: item.description,
          expectedQuantity: item.quantity,
          actualQuantity: 0,
          status: item.quantity > 0 ? 'missing' : 'complete',
        }));
        
        await PistoleoInventory.insertMany(inventoryDocs);
        
        return NextResponse.json({ message: `Imported ${items.length} items` });
      }
    } else {
      const body = await req.json();
      if (body.action === 'scan') {
        const { batchId, upc, userId } = body;
        const updatedInventory = await processScan(batchId, upc);
        
        await PistoleoScan.create({
          batchId: new mongoose.Types.ObjectId(batchId),
          upc,
          userId: new mongoose.Types.ObjectId(userId),
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
