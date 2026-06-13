import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireUser } from '@/lib/getUser';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data: ubicacion, error } = await db
      .from('inventario_ubicaciones')
      .select('*, ubicacion_padre:inventario_ubicaciones!ubicacion_padre_id(*)')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Ubicación no encontrada' }, { status: 404 });
      }
      throw error;
    }

    const { data: hijos } = await db
      .from('inventario_ubicaciones')
      .select('*')
      .eq('ubicacion_padre_id', id)
      .order('codigo', { ascending: true });

    const { count: total_productos } = await db
      .from('inventario_productos')
      .select('*', { count: 'exact', head: true })
      .eq('ubicacion_id', id);

    const { data: productos } = await db
      .from('inventario_productos')
      .select('id, codigo, nombre, stock_actual, stock_minimo')
      .eq('ubicacion_id', id)
      .order('nombre', { ascending: true });

    return NextResponse.json({
      ...ubicacion,
      hijos: hijos || [],
      total_productos: total_productos || 0,
      productos: (productos || []).map(p => ({
        ...p,
        stock_bajo: p.stock_minimo > 0 && p.stock_actual <= p.stock_minimo,
      })),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al obtener ubicación' },
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

    const allowedFields = ['codigo', 'nombre', 'tipo', 'ubicacion_padre_id', 'activo'];
    const updates: Record<string, unknown> = {};

    for (const field of allowedFields) {
      if (field in body) {
        updates[field] = field === 'codigo' ? body[field].trim().toUpperCase() : body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No hay campos para actualizar' }, { status: 400 });
    }

    if (updates.ubicacion_padre_id && updates.ubicacion_padre_id === id) {
      return NextResponse.json(
        { error: 'Una ubicación no puede ser padre de sí misma' },
        { status: 400 }
      );
    }

    if (updates.codigo) {
      const { data: existing } = await db
        .from('inventario_ubicaciones')
        .select('id')
        .eq('codigo', updates.codigo)
        .neq('id', id)
        .maybeSingle();

      if (existing) {
        return NextResponse.json(
          { error: `Ya existe otra ubicación con el código "${updates.codigo}"` },
          { status: 409 }
        );
      }
    }

    const { data, error } = await db
      .from('inventario_ubicaciones')
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
      { error: error instanceof Error ? error.message : 'Error al actualizar ubicación' },
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

    const { count: hijosCount } = await db
      .from('inventario_ubicaciones')
      .select('*', { count: 'exact', head: true })
      .eq('ubicacion_padre_id', id);

    if (hijosCount && hijosCount > 0) {
      return NextResponse.json(
        { error: `No se puede eliminar la ubicación porque tiene ${hijosCount} sub-ubicaciones` },
        { status: 409 }
      );
    }

    const { count: productosCount } = await db
      .from('inventario_productos')
      .select('*', { count: 'exact', head: true })
      .eq('ubicacion_id', id);

    if (productosCount && productosCount > 0) {
      return NextResponse.json(
        { error: `No se puede eliminar la ubicación porque tiene ${productosCount} producto(s)` },
        { status: 409 }
      );
    }

    const { error } = await db
      .from('inventario_ubicaciones')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ message: 'Ubicación eliminada correctamente' });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al eliminar ubicación' },
      { status: 500 }
    );
  }
}
