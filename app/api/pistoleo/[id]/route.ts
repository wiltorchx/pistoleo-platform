import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { status } = await req.json();

    if (!['pending', 'in_progress', 'completed'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const { data: batch, error } = await db
      .from('pistoleo_batches')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error || !batch) {
      return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
    }

    return NextResponse.json(batch);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { data: items, error } = await db
      .from('pistoleo_inventory')
      .select('*')
      .eq('batch_id', id);

    if (error) throw error;

    const mapped = (items || []).map(i => ({
      _id: i.id,
      id: i.id,
      batchId: i.batch_id,
      upc: i.upc,
      description: i.description,
      expectedQuantity: i.expected_quantity,
      actualQuantity: i.actual_quantity,
      status: i.status,
      updatedAt: i.updated_at,
    }));

    const summary = {
      totalItems: mapped.length,
      complete: mapped.filter(i => i.status === 'complete').length,
      partial: mapped.filter(i => i.status === 'partial').length,
      missing: mapped.filter(i => i.status === 'missing').length,
      over: mapped.filter(i => i.status === 'over').length,
      items: mapped,
    };

    return NextResponse.json(summary);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}
