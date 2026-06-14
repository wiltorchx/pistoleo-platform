import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/supabase-admin';

export async function GET() {
  try {
    const { data: batches } = await adminDb
      .from('pistoleo_batches')
      .select('id, status');

    const { count: totalItems } = await adminDb
      .from('pistoleo_inventory')
      .select('*', { count: 'exact', head: true });

    const { count: scannedItems } = await adminDb
      .from('pistoleo_inventory')
      .select('*', { count: 'exact', head: true })
      .not('scanned_at', 'is', null);

    const totalBatches = batches?.length || 0;
    const activeBatches = batches?.filter(b => b.status !== 'completed' && b.status !== 'cancelled').length || 0;

    return NextResponse.json({
      totalBatches,
      totalItems: totalItems || 0,
      scannedItems: scannedItems || 0,
      activeBatches,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
