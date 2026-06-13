import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireUser } from '@/lib/getUser';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const estado = searchParams.get('estado');
    const ubicacion_id = searchParams.get('ubicacion_id');
    const categoria_id = searchParams.get('categoria_id');
    const fecha_desde = searchParams.get('fecha_desde');
    const fecha_hasta = searchParams.get('fecha_hasta');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);

    let query = db
      .from('inventario_conteos')
      .select('*, ubicacion:inventario_ubicaciones(codigo, nombre), categoria:inventario_categorias(nombre, color), usuario:users!usuario_id(first_name, last_name), aprobado_por_usuario:users!aprobado_por(first_name, last_name)', { count: 'exact' });

    if (estado) query = query.eq('estado', estado);
    if (ubicacion_id) query = query.eq('ubicacion_id', ubicacion_id);
    if (categoria_id) query = query.eq('categoria_id', categoria_id);
    if (fecha_desde) query = query.gte('created_at', fecha_desde);
    if (fecha_hasta) query = query.lte('created_at', fecha_hasta + 'T23:59:59');

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    const enriched = await Promise.all((data || []).map(async (c) => {
      const { count: totalItems } = await db
        .from('inventario_conteo_items')
        .select('*', { count: 'exact', head: true })
        .eq('conteo_id', c.id);

      const { count: itemsContados } = await db
        .from('inventario_conteo_items')
        .select('*', { count: 'exact', head: true })
        .eq('conteo_id', c.id)
        .neq('stock_fisico', null);

      const { count: itemsConDiferencia } = await db
        .from('inventario_conteo_items')
        .select('*', { count: 'exact', head: true })
        .eq('conteo_id', c.id)
        .neq('diferencia', 0)
        .neq('stock_fisico', null);

      const { data: diffs } = await db
        .from('inventario_conteo_items')
        .select('diferencia')
        .eq('conteo_id', c.id)
        .neq('stock_fisico', null);

      const totalDiferencias = (diffs || []).reduce((sum, d) => sum + Math.abs(d.diferencia || 0), 0);

      return {
        ...c,
        total_items: totalItems || 0,
        items_contados: itemsContados || 0,
        items_con_diferencia: itemsConDiferencia || 0,
        total_diferencias: totalDiferencias,
      };
    }));

    return NextResponse.json({
      data: enriched,
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al obtener conteos' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = await req.json();

    if (!body.nombre) {
      return NextResponse.json({ error: 'El nombre del conteo es obligatorio' }, { status: 400 });
    }

    const { data: conteo, error: conteoError } = await db
      .from('inventario_conteos')
      .insert({
        nombre: body.nombre,
        ubicacion_id: body.ubicacion_id || null,
        categoria_id: body.categoria_id || null,
        usuario_id: user.id,
      })
      .select()
      .single();

    if (conteoError) throw conteoError;

    let query = db.from('inventario_productos').select('id, stock_actual');

    if (body.ubicacion_id) {
      query = query.eq('ubicacion_id', body.ubicacion_id);
    }
    if (body.categoria_id) {
      query = query.eq('categoria_id', body.categoria_id);
    }

    const { data: productos } = await query;

    if (productos && productos.length > 0) {
      const items = productos.map((p) => ({
        conteo_id: conteo.id,
        producto_id: p.id,
        ubicacion_id: body.ubicacion_id || null,
        stock_sistema: p.stock_actual,
      }));

      const { error: itemsError } = await db
        .from('inventario_conteo_items')
        .insert(items);

      if (itemsError) throw itemsError;
    }

    return NextResponse.json(conteo, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al crear conteo' },
      { status: 500 }
    );
  }
}
