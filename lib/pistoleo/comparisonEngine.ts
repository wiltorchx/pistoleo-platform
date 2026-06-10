import { PistoleoInventory } from '../../models/PistoleoInventory';

export async function processScan(batchId: string, upc: string) {
  const inventory = await PistoleoInventory.findOne({ batchId, upc });
  
  if (!inventory) {
    throw new Error('Item not found in batch inventory');
  }
  
  inventory.actualQuantity += 1;
  
  // Update status
  if (inventory.actualQuantity === 0) {
    inventory.status = 'missing';
  } else if (inventory.actualQuantity < inventory.expectedQuantity) {
    inventory.status = 'partial';
  } else if (inventory.actualQuantity === inventory.expectedQuantity) {
    inventory.status = 'complete';
  } else {
    inventory.status = 'over';
  }
  
  await inventory.save();
  return inventory;
}

export async function getBatchComparison(batchId: string) {
  const items = await PistoleoInventory.find({ batchId }).lean();
  
  const summary = {
    totalItems: items.length,
    complete: items.filter(i => i.status === 'complete').length,
    partial: items.filter(i => i.status === 'partial').length,
    missing: items.filter(i => i.status === 'missing').length,
    over: items.filter(i => i.status === 'over').length,
    items,
  };
  
  return summary;
}
