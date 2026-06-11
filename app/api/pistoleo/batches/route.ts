import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const { data: batches, error } = await db
      .from('pistoleo_batches')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const mapped = (batches || []).map(b => ({
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
