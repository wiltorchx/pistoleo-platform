import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireUser } from '@/lib/getUser';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search');
    const categoria_id = searchParams.get('categoria_id');
    const ubicacion_id = searchParams.get('ubicacion_id');
    const activo = searchParams.get('activo');
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
      query = query.or(`nombre.ilike.%${search}%,codigo.ilike.%${search}%,codigo_barras.ilike.%${search}%`);
    }
    if (categoria_id) {
      query = query.eq('categoria_id', categoria_id);
    }
    if (ubicacion_id) {
      query = query.eq('ubicacion_id', ubicacion_id);
    }
    if (activo === 'true') {
      query = query.eq('activo', true);
    } else if (activo === 'false') {
      query = query.eq('activo', false);
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
      valor_stock: p.stock_actual * p.costo_promedio,
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

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = await req.json();

    const { data: existing } = await db
      .from('inventario_productos')
      .select('id')
      .eq('codigo', body.codigo)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: `Ya existe un producto con el código "${body.codigo}"` },
        { status: 409 }
      );
    }

    const { data, error } = await db
      .from('inventario_productos')
      .insert({
        codigo: body.codigo,
        codigo_barras: body.codigo_barras || null,
        nombre: body.nombre,
        descripcion: body.descripcion || null,
        unidad_medida: body.unidad_medida || 'UN',
        categoria_id: body.categoria_id || null,
        ubicacion_id: body.ubicacion_id || null,
        stock_minimo: body.stock_minimo || 0,
        stock_maximo: body.stock_maximo || null,
        costo_promedio: body.costo_promedio || 0,
        precio_venta: body.precio_venta || null,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al crear producto' },
      { status: 500 }
    );
  }
}
