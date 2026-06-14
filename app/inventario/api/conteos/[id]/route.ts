import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/supabase-admin';
import { requireUser } from '@/lib/getUser';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const { data: conteo, error } = await adminDb
      .from('inventario_conteos')
      .select('*, ubicacion:inventario_ubicaciones(*), categoria:inventario_categorias(*), usuario:users!usuario_id(first_name, last_name, email), aprobado_por_usuario:users!aprobado_por(first_name, last_name, email)')
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!conteo) {
      return NextResponse.json({ error: 'Conteo no encontrado' }, { status: 404 });
    }

    const { data: items, error: itemsError } = await adminDb
      .from('inventario_conteo_items')
      .select('*, producto:inventario_productos(codigo, nombre, unidad_medida, stock_actual), ubicacion:inventario_ubicaciones(codigo, nombre), contado_por_usuario:users!contado_por(first_name, last_name)')
      .eq('conteo_id', id)
      .order('created_at', { ascending: true });

    if (itemsError) throw itemsError;

    return NextResponse.json({ ...conteo, items: items || [] });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al obtener conteo' },
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

    const updates: Record<string, unknown> = {};

    if (body.estado) {
      const transitions: Record<string, string[]> = {
        borrador: ['en_progreso'],
        en_progreso: ['finalizado'],
        finalizado: ['aprobado', 'rechazado', 'en_progreso'],
      };

      const allowed = transitions[conteo.estado] || [];
      if (!allowed.includes(body.estado)) {
        return NextResponse.json(
          { error: `No se puede cambiar de "${conteo.estado}" a "${body.estado}"` },
          { status: 409 }
        );
      }

      updates.estado = body.estado;

      if (body.estado === 'en_progreso') {
        updates.fecha_inicio = new Date().toISOString();
      }
      if (body.estado === 'finalizado') {
        updates.fecha_fin = new Date().toISOString();
      }
      if (body.estado === 'aprobado') {
        updates.aprobado_por = user.id;
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No hay campos para actualizar' }, { status: 400 });
    }

    const { data, error } = await adminDb
      .from('inventario_conteos')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    if (body.estado === 'aprobado') {
      const { data: items } = await adminDb
        .from('inventario_conteo_items')
        .select('*')
        .eq('conteo_id', id)
        .neq('stock_fisico', null)
        .neq('diferencia', 0);

      if (items) {
        for (const item of items) {
          const diff = (item.stock_fisico || 0) - item.stock_sistema;
          const mov = {
            tipo: diff > 0 ? 'ajuste_positivo' : 'ajuste_negativo',
            cantidad: Math.abs(diff),
            cantidad_anterior: item.stock_sistema,
            cantidad_nueva: item.stock_fisico || 0,
            costo_unitario: 0,
            observaciones: `Aprobación conteo: ${body.nombre || id}`,
            documento_referencia: id,
            documento_tipo: 'inventario' as const,
            usuario_id: user.id,
          } as Record<string, unknown>;
          if (item.producto_id) mov.producto_id = item.producto_id;
          if (item.codigo) mov.observaciones = `${mov.observaciones} (${item.codigo})`;
          await adminDb.from('inventario_movimientos').insert(mov);
        }
      }
    }

    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al actualizar conteo' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireUser();
    const { id } = await params;

    const { data: conteo } = await adminDb
      .from('inventario_conteos')
      .select('estado')
      .eq('id', id)
      .single();

    if (!conteo) {
      return NextResponse.json({ error: 'Conteo no encontrado' }, { status: 404 });
    }

    if (conteo.estado !== 'borrador') {
      return NextResponse.json(
        { error: 'Solo se pueden eliminar conteos en estado borrador' },
        { status: 409 }
      );
    }

    const { error } = await adminDb.from('inventario_conteos').delete().eq('id', id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al eliminar conteo' },
      { status: 500 }
    );
  }
}
