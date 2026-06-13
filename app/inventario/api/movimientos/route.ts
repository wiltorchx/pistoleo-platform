import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireUser } from '@/lib/getUser';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const producto_id = searchParams.get('producto_id');
    const tipo = searchParams.get('tipo');
    const ubicacion_origen_id = searchParams.get('ubicacion_origen_id');
    const ubicacion_destino_id = searchParams.get('ubicacion_destino_id');
    const fecha_desde = searchParams.get('fecha_desde');
    const fecha_hasta = searchParams.get('fecha_hasta');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);

    let query = db
      .from('inventario_movimientos')
      .select('*, producto:inventario_productos(codigo, nombre, unidad_medida), ubicacion_origen:inventario_ubicaciones!ubicacion_origen_id(codigo, nombre), ubicacion_destino:inventario_ubicaciones!ubicacion_destino_id(codigo, nombre), usuario:users(first_name, last_name, email)', { count: 'exact' });

    if (producto_id) query = query.eq('producto_id', producto_id);
    if (tipo) query = query.eq('tipo', tipo);
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

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = await req.json();

    if (!body.producto_id || !body.tipo || body.cantidad === undefined) {
      return NextResponse.json(
        { error: 'producto_id, tipo y cantidad son obligatorios' },
        { status: 400 }
      );
    }

    if (body.cantidad <= 0) {
      return NextResponse.json(
        { error: 'La cantidad debe ser mayor a 0' },
        { status: 400 }
      );
    }

    const { data: producto } = await db
      .from('inventario_productos')
      .select('id, stock_actual, costo_promedio')
      .eq('id', body.producto_id)
      .single();

    if (!producto) {
      return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });
    }

    const tiposSalida = ['salida', 'ajuste_negativo', 'transferencia_origen', 'devolucion_proveedor'];
    if (tiposSalida.includes(body.tipo) && producto.stock_actual < body.cantidad) {
      return NextResponse.json(
        { error: `Stock insuficiente. Actual: ${producto.stock_actual}, solicitado: ${body.cantidad}` },
        { status: 409 }
      );
    }

    const cantidadAnterior = producto.stock_actual;
    const tiposEntrada = ['entrada', 'ajuste_positivo', 'transferencia_destino', 'inventario_inicial'];
    const cantidadNueva = tiposEntrada.includes(body.tipo)
      ? cantidadAnterior + body.cantidad
      : cantidadAnterior - body.cantidad;

    const costoUnitario = body.costo_unitario || producto.costo_promedio;
    const costoTotal = body.costo_unitario
      ? body.costo_unitario * body.cantidad
      : producto.costo_promedio * body.cantidad;

    const { data, error } = await db
      .from('inventario_movimientos')
      .insert({
        tipo: body.tipo,
        producto_id: body.producto_id,
        ubicacion_origen_id: body.ubicacion_origen_id || null,
        ubicacion_destino_id: body.ubicacion_destino_id || null,
        cantidad: body.cantidad,
        cantidad_anterior: cantidadAnterior,
        cantidad_nueva: cantidadNueva,
        costo_unitario: costoUnitario,
        costo_total: costoTotal,
        documento_referencia: body.documento_referencia || null,
        documento_tipo: body.documento_tipo || null,
        lote_pistoleo_id: body.lote_pistoleo_id || null,
        observaciones: body.observaciones || null,
        usuario_id: user.id,
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
      { error: error instanceof Error ? error.message : 'Error al registrar movimiento' },
      { status: 500 }
    );
  }
}
