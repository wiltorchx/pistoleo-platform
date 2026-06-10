import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { PistoleoBatch } from '@/models/PistoleoBatch';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await connectDB();
  try {
    const { id } = await params;
    const { status } = await req.json();
    
    if (!['pending', 'in_progress', 'completed'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }
    
    const batch = await PistoleoBatch.findByIdAndUpdate(
      id, 
      { status }, 
      { new: true }
    );
    
    if (!batch) return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
    
    return NextResponse.json(batch);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}
