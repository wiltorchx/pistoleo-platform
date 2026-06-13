import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireUser } from '@/lib/getUser';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const { data: transferencia, error } = await db
      .from('inventario_transferencias')
      .select('*, ubicacion_origen:inventario_ubicaciones!ubicacion_origen_id(*), ubicacion_destino:inventario_ubicaciones!ubicacion_destino_id(*), solicitado_por_usuario:users!solicitado_por(first_name, last_name, email), recibido_por_usuario:users!recibido_por(first_name, last_name, email)')
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!transferencia) {
      return NextResponse.json({ error: 'Transferencia no encontrada' }, { status: 404 });
    }

    const { data: items, error: itemsError } = await db
      .from('inventario_transferencia_items')
      .select('*, producto:inventario_productos(codigo, nombre, unidad_medida, stock_actual)')
      .eq('transferencia_id', id);

    if (itemsError) throw itemsError;

    return NextResponse.json({ ...transferencia, items: items || [] });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al obtener transferencia' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const body = await req.json();

    const { data: trf } = await db
      .from('inventario_transferencias')
      .select('*, items:inventario_transferencia_items(*)')
      .eq('id', id)
      .single();

    if (!trf) {
      return NextResponse.json({ error: 'Transferencia no encontrada' }, { status: 404 });
    }

    const updates: Record<string, unknown> = {};

    if (body.estado === 'enviada') {
      if (trf.estado !== 'borrador') {
        return NextResponse.json({ error: 'Solo se pueden enviar transferencias en borrador' }, { status: 409 });
      }

      for (const item of trf.items || []) {
        const { data: prod } = await db
          .from('inventario_productos')
          .select('stock_actual')
          .eq('id', item.producto_id)
          .single();

        if (!prod || prod.stock_actual < (item.cantidad_enviada || item.cantidad_solicitada)) {
          const { data: p } = await db
            .from('inventario_productos')
            .select('codigo, nombre')
            .eq('id', item.producto_id)
            .single();
          return NextResponse.json(
            { error: `Stock insuficiente para ${p?.codigo || 'producto'}. Disponible: ${prod?.stock_actual || 0}` },
            { status: 409 }
          );
        }
      }

      for (const item of trf.items || []) {
        const cant = item.cantidad_enviada || item.cantidad_solicitada;
        const { data: prod } = await db
          .from('inventario_productos')
          .select('stock_actual')
          .eq('id', item.producto_id)
          .single();

        await db.from('inventario_movimientos').insert({
          tipo: 'transferencia_origen',
          producto_id: item.producto_id,
          ubicacion_origen_id: trf.ubicacion_origen_id,
          cantidad: cant,
          cantidad_anterior: prod?.stock_actual || 0,
          cantidad_nueva: (prod?.stock_actual || 0) - cant,
          documento_referencia: trf.numero,
          documento_tipo: 'transferencia' as const,
          observaciones: `Envío transferencia ${trf.numero}`,
          usuario_id: user.id,
        });

        await db
          .from('inventario_transferencia_items')
          .update({ cantidad_enviada: cant, estado: 'enviado' })
          .eq('id', item.id);
      }

      updates.estado = 'enviada';
      updates.fecha_envio = new Date().toISOString();
    } else if (body.estado === 'recibida') {
      if (trf.estado !== 'enviada') {
        return NextResponse.json({ error: 'Solo se pueden recibir transferencias enviadas' }, { status: 409 });
      }

      updates.estado = 'recibida';
      updates.fecha_recepcion = new Date().toISOString();
      updates.recibido_por = user.id;
    } else if (body.estado === 'cancelada') {
      if (!['borrador', 'enviada'].includes(trf.estado)) {
        return NextResponse.json({ error: 'No se puede cancelar esta transferencia' }, { status: 409 });
      }
      updates.estado = 'cancelada';
    } else {
      return NextResponse.json({ error: 'Estado inválido' }, { status: 400 });
    }

    const { data, error } = await db
      .from('inventario_transferencias')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al actualizar transferencia' },
      { status: 500 }
    );
  }
}
