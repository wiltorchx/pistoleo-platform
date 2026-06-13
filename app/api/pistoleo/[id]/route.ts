import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/api-auth';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthenticatedUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { status, signature, closedAt } = await req.json();

    if (!['pending', 'in_progress', 'completed'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const { data: batch, error } = await db
      .from('pistoleo_batches')
      .select('id, created_by')
      .eq('id', id)
      .single();

    if (error || !batch) {
      return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
    }

    // Check access
    const hasAccess = authUser.role === 'admin' || batch.created_by === authUser.id;
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const updateData: Record<string, unknown> = { status };
    if (signature) updateData.signature = signature;
    if (closedAt) updateData.closed_at = closedAt;

    const { data: updatedBatch, error: updateError } = await db
      .from('pistoleo_batches')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError || !updatedBatch) {
      return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
    }

    return NextResponse.json(updatedBatch);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthenticatedUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Check access
    const { data: batch } = await db
      .from('pistoleo_batches')
      .select('id, created_by')
      .eq('id', id)
      .single();

    if (!batch) {
      return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
    }

    const hasAccess = authUser.role === 'admin' || batch.created_by === authUser.id;
    if (!hasAccess) {
      // Check if user has scanned this batch
      const { data: existingScan } = await db
        .from('pistoleo_scans')
        .select('id')
        .eq('batch_id', id)
        .eq('user_id', authUser.id)
        .limit(1)
        .single();

      if (!existingScan) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

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
