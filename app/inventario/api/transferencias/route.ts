import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireUser } from '@/lib/getUser';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const estado = searchParams.get('estado');
    const ubicacion_origen_id = searchParams.get('ubicacion_origen_id');
    const ubicacion_destino_id = searchParams.get('ubicacion_destino_id');
    const fecha_desde = searchParams.get('fecha_desde');
    const fecha_hasta = searchParams.get('fecha_hasta');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);

    let query = db
      .from('inventario_transferencias')
      .select('*, ubicacion_origen:inventario_ubicaciones!ubicacion_origen_id(codigo, nombre), ubicacion_destino:inventario_ubicaciones!ubicacion_destino_id(codigo, nombre), solicitado_por_usuario:users!solicitado_por(first_name, last_name), recibido_por_usuario:users!recibido_por(first_name, last_name)', { count: 'exact' });

    if (estado) query = query.eq('estado', estado);
    if (ubicacion_origen_id) query = query.eq('ubicacion_origen_id', ubicacion_origen_id);
    if (ubicacion_destino_id) query = query.eq('ubicacion_destino_id', ubicacion_destino_id);
    if (fecha_desde) query = query.gte('created_at', fecha_desde);
    if (fecha_hasta) query = query.lte('created_at', fecha_hasta + 'T23:59:59');

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    const enriched = await Promise.all((data || []).map(async (t) => {
      const { count: totalItems } = await db
        .from('inventario_transferencia_items')
        .select('*', { count: 'exact', head: true })
        .eq('transferencia_id', t.id);

      const { count: enviados } = await db
        .from('inventario_transferencia_items')
        .select('*', { count: 'exact', head: true })
        .eq('transferencia_id', t.id)
        .neq('cantidad_enviada', 0);

      const { count: recibidos } = await db
        .from('inventario_transferencia_items')
        .select('*', { count: 'exact', head: true })
        .eq('transferencia_id', t.id)
        .neq('cantidad_recibida', 0);

      return {
        ...t,
        total_items: totalItems || 0,
        items_enviados: enviados || 0,
        items_recibidos: recibidos || 0,
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
      { error: error instanceof Error ? error.message : 'Error al obtener transferencias' },
      { status: 500 }
    );
  }
}

async function generarNumeroTransferencia(): Promise<string> {
  const anio = new Date().getFullYear();
  const { data } = await db
    .from('inventario_transferencias')
    .select('numero')
    .like('numero', `TRF-${anio}-%`)
    .order('created_at', { ascending: false })
    .limit(1);

  let nextNum = 1;
  if (data && data.length > 0) {
    const last = data[0].numero;
    const parts = last.split('-');
    nextNum = parseInt(parts[parts.length - 1] || '0') + 1;
  }

  return `TRF-${anio}-${String(nextNum).padStart(4, '0')}`;
}

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = await req.json();

    if (!body.ubicacion_origen_id || !body.ubicacion_destino_id) {
      return NextResponse.json(
        { error: 'ubicacion_origen_id y ubicacion_destino_id son obligatorios' },
        { status: 400 }
      );
    }

    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json(
        { error: 'Se requiere al menos un item' },
        { status: 400 }
      );
    }

    const numero = await generarNumeroTransferencia();

    const { data: transferencia, error: trfError } = await db
      .from('inventario_transferencias')
      .insert({
        numero,
        ubicacion_origen_id: body.ubicacion_origen_id,
        ubicacion_destino_id: body.ubicacion_destino_id,
        solicitado_por: user.id,
        observaciones: body.observaciones || null,
      })
      .select()
      .single();

    if (trfError) throw trfError;

    const items = body.items.map((item: { producto_id: string; cantidad_solicitada: number }) => ({
      transferencia_id: transferencia.id,
      producto_id: item.producto_id,
      cantidad_solicitada: item.cantidad_solicitada,
    }));

    const { error: itemsError } = await db
      .from('inventario_transferencia_items')
      .insert(items);

    if (itemsError) throw itemsError;

    return NextResponse.json(transferencia, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al crear transferencia' },
      { status: 500 }
    );
  }
}
