import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const producto_id = searchParams.get('producto_id');
    const tipo = searchParams.get('tipo');
    const fecha_desde = searchParams.get('fecha_desde');
    const fecha_hasta = searchParams.get('fecha_hasta');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);

    let query = db
      .from('inventario_movimientos')
      .select('*, producto:inventario_productos(codigo, nombre, unidad_medida), ubicacion_origen:inventario_ubicaciones!ubicacion_origen_id(codigo, nombre), ubicacion_destino:inventario_ubicaciones!ubicacion_destino_id(codigo, nombre), usuario:users(first_name, last_name, email)', { count: 'exact' });

    if (producto_id) query = query.eq('producto_id', producto_id);
    if (tipo) query = query.eq('tipo', tipo);
    if (fecha_desde) query = query.gte('created_at', fecha_desde);
    if (fecha_hasta) query = query.lte('created_at', fecha_hasta + 'T23:59:59');

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    return NextResponse.json({
      data: data || [],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al obtener movimientos' },
      { status: 500 }
    );
  }
}
