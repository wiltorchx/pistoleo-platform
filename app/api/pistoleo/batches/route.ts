import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { BatchRow } from '@/lib/supabase-types';

export async function GET() {
  try {
    const { data: batches, error } = await db
      .from('pistoleo_batches')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const typedBatches = batches as BatchRow[] | null;

    const mapped = (typedBatches || []).map(b => ({
      _id: b.id,
      id: b.id,
      name: b.name,
      status: b.status,
      createdBy: b.created_by,
      createdAt: b.created_at,
      updatedAt: b.updated_at,
    }));

    return NextResponse.json(mapped);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const batchId = searchParams.get('batchId');

    if (!batchId) {
      return NextResponse.json({ error: 'Missing batchId' }, { status: 400 });
    }

    // Delete inventory items first (FK cascade should handle this, but being explicit)
    const { error: invError } = await db
      .from('pistoleo_inventory')
      .delete()
      .eq('batch_id', batchId);

    if (invError) throw invError;

    // Delete scans
    const { error: scansError } = await db
      .from('pistoleo_scans')
      .delete()
      .eq('batch_id', batchId);

    if (scansError) throw scansError;

    // Delete batch
    const { error: batchError } = await db
      .from('pistoleo_batches')
      .delete()
      .eq('id', batchId);

    if (batchError) throw batchError;

    return NextResponse.json({ message: 'Batch deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}
