import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { PistoleoBatch } from '@/models/PistoleoBatch';

export async function GET() {
  await connectDB();
  try {
    const batches = await PistoleoBatch.find({}).sort({ createdAt: -1 }).lean();
    return NextResponse.json(batches);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}
