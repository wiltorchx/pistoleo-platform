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

    const { id: itemId } = await params;
    const { actualQuantity } = await req.json();

    if (actualQuantity === undefined || actualQuantity < 0) {
      return NextResponse.json({ error: 'Invalid quantity' }, { status: 400 });
    }

    const { data: inventory } = await db
      .from('pistoleo_inventory')
      .select('*, pistoleo_batches!inner(created_by)')
      .eq('id', itemId)
      .single();

    if (!inventory) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    // Check access
    const batch = inventory.pistoleo_batches as { created_by: string };
    const hasAccess = authUser.role === 'admin' || batch.created_by === authUser.id;
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    let status: string;
    if (actualQuantity === 0) {
      status = 'missing';
    } else if (actualQuantity < inventory.expected_quantity) {
      status = 'partial';
    } else if (actualQuantity === inventory.expected_quantity) {
      status = 'complete';
    } else {
      status = 'over';
    }

    const { data: updated, error } = await db
      .from('pistoleo_inventory')
      .update({ actual_quantity: actualQuantity, status })
      .eq('id', itemId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      _id: updated.id,
      id: updated.id,
      batchId: updated.batch_id,
      upc: updated.upc,
      description: updated.description,
      expectedQuantity: updated.expected_quantity,
      actualQuantity: updated.actual_quantity,
      status: updated.status,
      updatedAt: updated.updated_at,
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}
