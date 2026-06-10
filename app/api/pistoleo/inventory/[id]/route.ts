import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { PistoleoInventory } from '@/models/PistoleoInventory';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await connectDB();
  try {
    const { id: itemId } = await params;
    const { actualQuantity } = await req.json();
    
    if (actualQuantity === undefined || actualQuantity < 0) {
      return NextResponse.json({ error: 'Invalid quantity' }, { status: 400 });
    }
    
    const inventory = await PistoleoInventory.findById(itemId);
    if (!inventory) return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    
    inventory.actualQuantity = actualQuantity;
    
    // Recalculate status
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
    return NextResponse.json(inventory);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}
