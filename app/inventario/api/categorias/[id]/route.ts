import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireUser } from '@/lib/getUser';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data: categoria, error } = await db
      .from('inventario_categorias')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Categoría no encontrada' }, { status: 404 });
      }
      throw error;
    }

    const { count } = await db
      .from('inventario_productos')
      .select('*', { count: 'exact', head: true })
      .eq('categoria_id', id);

    const { data: productos } = await db
      .from('inventario_productos')
      .select('id, codigo, nombre, stock_actual')
      .eq('categoria_id', id)
      .order('nombre', { ascending: true });

    return NextResponse.json({
      ...categoria,
      total_productos: count || 0,
      productos: productos || [],
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al obtener categoría' },
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

    const allowedFields = ['nombre', 'descripcion', 'color', 'activo'];
    const updates: Record<string, unknown> = {};

    for (const field of allowedFields) {
      if (field in body) {
        updates[field] = field === 'nombre' ? body[field].trim() : body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No hay campos para actualizar' }, { status: 400 });
    }

    if (updates.nombre) {
      const { data: existing } = await db
        .from('inventario_categorias')
        .select('id')
        .eq('nombre', updates.nombre)
        .neq('id', id)
        .maybeSingle();

      if (existing) {
        return NextResponse.json(
          { error: `Ya existe otra categoría con el nombre "${updates.nombre}"` },
          { status: 409 }
        );
      }
    }

    const { data, error } = await db
      .from('inventario_categorias')
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
      { error: error instanceof Error ? error.message : 'Error al actualizar categoría' },
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

    const { count } = await db
      .from('inventario_productos')
      .select('*', { count: 'exact', head: true })
      .eq('categoria_id', id);

    if (count && count > 0) {
      return NextResponse.json(
        { error: `No se puede eliminar la categoría porque tiene ${count} producto(s) asociado(s)` },
        { status: 409 }
      );
    }

    const { error } = await db
      .from('inventario_categorias')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ message: 'Categoría eliminada correctamente' });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al eliminar categoría' },
      { status: 500 }
    );
  }
}
