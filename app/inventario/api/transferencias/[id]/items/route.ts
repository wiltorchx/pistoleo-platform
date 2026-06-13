import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireUser } from '@/lib/getUser';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const body = await req.json();

    const { data: trf } = await db
      .from('inventario_transferencias')
      .select('estado, numero, ubicacion_origen_id, ubicacion_destino_id')
      .eq('id', id)
      .single();

    if (!trf) {
      return NextResponse.json({ error: 'Transferencia no encontrada' }, { status: 404 });
    }

    const items = body.items as Array<{ id: string; cantidad_enviada?: number; cantidad_recibida?: number }>;
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Se requiere un array de items' }, { status: 400 });
    }

    const resultados = [];

    for (const item of items) {
      const updateData: Record<string, unknown> = {};

      if (trf.estado === 'borrador' && item.cantidad_enviada !== undefined) {
        updateData.cantidad_enviada = item.cantidad_enviada;
        if (item.cantidad_enviada > 0) updateData.estado = 'enviado';
      }

      if (trf.estado === 'enviada' && item.cantidad_recibida !== undefined) {
        const { data: existing } = await db
          .from('inventario_transferencia_items')
          .select('cantidad_enviada, cantidad_solicitada')
          .eq('id', item.id)
          .single();

        updateData.cantidad_recibida = item.cantidad_recibida;
        const enviada = existing?.cantidad_enviada || existing?.cantidad_solicitada || 0;
        if (item.cantidad_recibida >= enviada) {
          updateData.estado = 'recibido';
        } else if (item.cantidad_recibida > 0) {
          updateData.estado = 'parcial';
        }

        if (item.cantidad_recibida > 0) {
          const { data: prod } = await db
            .from('inventario_transferencia_items')
            .select('producto_id')
            .eq('id', item.id)
            .single();

          if (prod) {
            const { data: prodStock } = await db
              .from('inventario_productos')
              .select('id, stock_actual, costo_promedio')
              .eq('id', prod.producto_id)
              .single();

            if (prodStock) {
              await db.from('inventario_movimientos').insert({
                tipo: 'transferencia_destino',
                producto_id: prod.producto_id,
                ubicacion_destino_id: trf.ubicacion_destino_id,
                cantidad: item.cantidad_recibida,
                cantidad_anterior: prodStock.stock_actual,
                cantidad_nueva: prodStock.stock_actual + item.cantidad_recibida,
                costo_unitario: prodStock.costo_promedio,
                documento_referencia: trf.numero,
                documento_tipo: 'transferencia' as const,
                observaciones: `Recepción transferencia ${trf.numero}`,
                usuario_id: user.id,
              });
            }
          }
        }
      }

      if (Object.keys(updateData).length === 0) continue;

      const { data, error } = await db
        .from('inventario_transferencia_items')
        .update(updateData)
        .eq('id', item.id)
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
