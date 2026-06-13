import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireUser } from '@/lib/getUser';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data: producto, error } = await db
      .from('inventario_productos')
      .select('*, categoria:inventario_categorias(*), ubicacion:inventario_ubicaciones(*)')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });
      }
      throw error;
    }

    const { data: movimientos, error: movError } = await db
      .from('inventario_movimientos')
      .select('*, usuario:users(first_name, last_name, email)')
      .eq('producto_id', id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (movError) throw movError;

    return NextResponse.json({
      ...producto,
      stock_bajo: producto.stock_minimo > 0 && producto.stock_actual <= producto.stock_minimo,
      valor_stock: producto.stock_actual * producto.costo_promedio,
      movimientos: movimientos || [],
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al obtener producto' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const body = await req.json();

    const allowedFields = [
      'codigo', 'codigo_barras', 'nombre', 'descripcion',
      'unidad_medida', 'categoria_id', 'ubicacion_id',
      'stock_minimo', 'stock_maximo', 'costo_promedio', 'precio_venta', 'activo',
    ];

    const updates: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (field in body) {
        updates[field] = body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No hay campos para actualizar' }, { status: 400 });
    }

    if (updates.codigo) {
      const { data: existing } = await db
        .from('inventario_productos')
        .select('id')
        .eq('codigo', updates.codigo)
        .neq('id', id)
        .maybeSingle();

      if (existing) {
        return NextResponse.json(
          { error: `Ya existe otro producto con el código "${updates.codigo}"` },
          { status: 409 }
        );
      }
    }

    const { data, error } = await db
      .from('inventario_productos')
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
      { error: error instanceof Error ? error.message : 'Error al actualizar producto' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id } = await params;

    const { data: producto } = await db
      .from('inventario_productos')
      .select('id')
      .eq('id', id)
      .single();

    if (!producto) {
      return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });
    }

    const { data: movimientos } = await db
      .from('inventario_movimientos')
      .select('id')
      .eq('producto_id', id)
      .limit(1);

    if (movimientos && movimientos.length > 0) {
      return NextResponse.json(
        { error: 'No se puede eliminar el producto porque tiene movimientos asociados. Desactívelo en su lugar.' },
        { status: 409 }
      );
    }

    const { error } = await db
      .from('inventario_productos')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ message: 'Producto eliminado correctamente' });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al eliminar producto' },
      { status: 500 }
    );
  }
}
