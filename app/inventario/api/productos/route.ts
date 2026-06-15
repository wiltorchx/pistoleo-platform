import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search');
    const stock_bajo = searchParams.get('stock_bajo');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);
    const sort_by = searchParams.get('sort_by') || 'nombre';
    const sort_order = searchParams.get('sort_order') || 'asc';

    const validSortFields = ['codigo', 'nombre', 'stock_actual', 'created_at'];
    const sortField = validSortFields.includes(sort_by) ? sort_by : 'nombre';
    const order = sort_order === 'desc' ? { ascending: false } : { ascending: true };

    let query = db
      .from('inventario_productos')
      .select('*, categoria:inventario_categorias(*), ubicacion:inventario_ubicaciones(*)', { count: 'exact' });

    if (search) {
      query = query.or(`nombre.ilike.%${search}%,codigo.ilike.%${search}%`);
    }
    if (stock_bajo === 'true') {
      query = query.lt('stock_actual', db.rpc('get_column_max', { tbl: 'inventario_productos', col: 'stock_minimo' }));
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data: productos, error, count } = await query
      .order(sortField, order)
      .range(from, to);

    if (error) throw error;

    let mapped = (productos || []).map(p => ({
      ...p,
      stock_bajo: p.stock_minimo > 0 && p.stock_actual <= p.stock_minimo,
      valor_stock: (p.stock_actual || 0) * (p.costo_promedio || 0),
    }));

    if (stock_bajo === 'true') {
      mapped = mapped.filter(p => p.stock_bajo);
    }

    return NextResponse.json({
      data: mapped,
      total: stock_bajo === 'true' ? mapped.length : (count || 0),
      page,
      limit,
      totalPages: stock_bajo === 'true' ? 1 : Math.ceil((count || 0) / limit),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al obtener productos' },
      { status: 500 }
    );
  }
}
