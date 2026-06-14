import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/supabase-admin';
import { requireUser } from '@/lib/getUser';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const estado = searchParams.get('estado');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 500);

    let query = adminDb
      .from('inventario_conteo_items')
      .select('*, producto:inventario_productos(codigo, nombre, unidad_medida, stock_actual), ubicacion:inventario_ubicaciones(codigo, nombre), contado_por_usuario:users!contado_por(first_name, last_name)', { count: 'exact' })
      .eq('conteo_id', id);

    if (estado) query = query.eq('estado', estado);

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await query
      .order('created_at', { ascending: true })
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
      { error: error instanceof Error ? error.message : 'Error al obtener items' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const body = await req.json();

    const { data: conteo } = await adminDb
      .from('inventario_conteos')
      .select('estado')
      .eq('id', id)
      .single();

    if (!conteo) {
      return NextResponse.json({ error: 'Conteo no encontrado' }, { status: 404 });
    }

    if (!['borrador', 'en_progreso'].includes(conteo.estado)) {
      return NextResponse.json(
        { error: 'Solo se pueden modificar items en conteos en progreso' },
        { status: 409 }
      );
    }

    const items = body.items as Array<{ id: string; stock_fisico: number; observaciones?: string }>;
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Se requiere un array de items' }, { status: 400 });
    }

    const resultados = [];
    for (const item of items) {
      const updateData: Record<string, unknown> = {
        stock_fisico: item.stock_fisico,
        estado: 'contado',
        contado_por: user.id,
        contado_at: new Date().toISOString(),
      };

      if (item.observaciones) updateData.observaciones = item.observaciones;

      const { data, error } = await adminDb
        .from('inventario_conteo_items')
        .update(updateData)
        .eq('id', item.id)
        .eq('conteo_id', id)
        .select()
        .single();

      if (error) {
        resultados.push({ id: item.id, error: error.message });
      } else {
        resultados.push(data);
      }
    }

    return NextResponse.json(resultados);
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al actualizar items' },
      { status: 500 }
    );
  }
}
