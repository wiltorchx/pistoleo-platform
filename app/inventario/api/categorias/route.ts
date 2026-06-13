import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireUser } from '@/lib/getUser';

export async function GET() {
  try {
    const { data: categorias, error } = await db
      .from('inventario_categorias')
      .select('*')
      .order('nombre', { ascending: true });

    if (error) throw error;

    const withCounts = await Promise.all(
      (categorias || []).map(async (cat) => {
        const { count } = await db
          .from('inventario_productos')
          .select('*', { count: 'exact', head: true })
          .eq('categoria_id', cat.id);
        return { ...cat, total_productos: count || 0 };
      })
    );

    return NextResponse.json(withCounts);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al obtener categorías' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = await req.json();

    if (!body.nombre || body.nombre.trim().length === 0) {
      return NextResponse.json({ error: 'El nombre es obligatorio' }, { status: 400 });
    }

    const { data: existing } = await db
      .from('inventario_categorias')
      .select('id')
      .eq('nombre', body.nombre.trim())
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: `Ya existe una categoría con el nombre "${body.nombre.trim()}"` },
        { status: 409 }
      );
    }

    const { data, error } = await db
      .from('inventario_categorias')
      .insert({
        nombre: body.nombre.trim(),
        descripcion: body.descripcion || null,
        color: body.color || '#6B7280',
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
      { error: error instanceof Error ? error.message : 'Error al crear categoría' },
      { status: 500 }
    );
  }
}
