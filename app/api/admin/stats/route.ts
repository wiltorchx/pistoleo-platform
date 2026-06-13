import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/jwt';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    if (!token) return NextResponse.json({ message: 'No autenticado' }, { status: 401 });

    const payload = await verifyToken(token);
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
    }

    const [
      { count: totalBatches },
      { count: totalItems },
      { count: scannedItems },
      { count: activeBatches },
      { count: missingItems },
      { data: recentBatches },
    ] = await Promise.all([
      db.from('pistoleo_batches').select('*', { count: 'exact', head: true }),
      db.from('pistoleo_inventory').select('*', { count: 'exact', head: true }),
      db.from('pistoleo_scans').select('*', { count: 'exact', head: true }),
      db.from('pistoleo_batches').select('*', { count: 'exact', head: true }).neq('status', 'completed'),
      db.from('pistoleo_inventory').select('*', { count: 'exact', head: true }).neq('status', 'complete'),
      db.from('pistoleo_batches').select('*').order('created_at', { ascending: false }).limit(10),
    ]);

    type BatchRow = { id: string; name: string; status: string; created_at: string };
    const mappedBatches = ((recentBatches as BatchRow[]) || []).map(b => ({
      _id: b.id,
      name: b.name,
      status: b.status,
      createdAt: b.created_at,
    }));

    return NextResponse.json({
      stats: { totalBatches, totalItems, scannedItems, activeBatches, missingItems },
      recentBatches: mappedBatches,
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json({ message: 'Error interno' }, { status: 500 });
  }
}
