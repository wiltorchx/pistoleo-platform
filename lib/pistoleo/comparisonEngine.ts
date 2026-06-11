import { db } from '../db';

export async function processScan(batchId: string, upc: string) {
  const { data: inventory, error } = await db
    .from('pistoleo_inventory')
    .select('*')
    .eq('batch_id', batchId)
    .eq('upc', upc)
    .single();

  if (error || !inventory) {
    throw new Error('Item not found in batch inventory');
  }

  const newActual = inventory.actual_quantity + 1;

  let status: string;
  if (newActual === 0) {
    status = 'missing';
  } else if (newActual < inventory.expected_quantity) {
    status = 'partial';
  } else if (newActual === inventory.expected_quantity) {
    status = 'complete';
  } else {
    status = 'over';
  }

  const { data: updated, error: updateError } = await db
    .from('pistoleo_inventory')
    .update({ actual_quantity: newActual, status })
    .eq('id', inventory.id)
    .select()
    .single();

  if (updateError) throw updateError;

  return {
    _id: updated.id,
    id: updated.id,
    batchId: updated.batch_id,
    upc: updated.upc,
    description: updated.description,
    expectedQuantity: updated.expected_quantity,
    actualQuantity: updated.actual_quantity,
    status: updated.status,
    updatedAt: updated.updated_at,
  };
}

export async function getBatchComparison(batchId: string) {
  const { data: items, error } = await db
    .from('pistoleo_inventory')
    .select('*')
    .eq('batch_id', batchId);

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

  return {
    totalItems: mapped.length,
    complete: mapped.filter(i => i.status === 'complete').length,
    partial: mapped.filter(i => i.status === 'partial').length,
    missing: mapped.filter(i => i.status === 'missing').length,
    over: mapped.filter(i => i.status === 'over').length,
    items: mapped,
  };
}
