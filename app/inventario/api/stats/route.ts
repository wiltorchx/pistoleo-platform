import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const { count: totalProductos } = await db
      .from('inventario_productos')
      .select('*', { count: 'exact', head: true })
      .eq('activo', true);

    const { data: stocks } = await db
      .from('inventario_productos')
      .select('stock_actual, stock_minimo, costo_promedio')
      .eq('activo', true);

    let totalStock = 0;
    let totalValor = 0;
    let stockBajo = 0;
    let stockCritico = 0;

    for (const p of stocks || []) {
      totalStock += p.stock_actual || 0;
      totalValor += (p.stock_actual || 0) * (p.costo_promedio || 0);
      if (p.stock_minimo > 0 && p.stock_actual <= p.stock_minimo) {
        stockBajo++;
        if (p.stock_actual <= p.stock_minimo * 0.5) stockCritico++;
      }
    }

    const { count: movimientosHoy } = await db
      .from('inventario_movimientos')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString());

    return NextResponse.json({
      totalProductos: totalProductos || 0,
      totalStock,
      totalValor,
      stockBajo,
      stockCritico,
      movimientosHoy: movimientosHoy || 0,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al obtener estadísticas' },
      { status: 500 }
    );
  }
}
