import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireUser } from '@/lib/getUser';

function buildTree(items: any[], parentId: string | null = null): any[] {
  return items
    .filter(item => item.ubicacion_padre_id === parentId)
    .map(item => ({
      ...item,
      hijos: buildTree(items, item.id),
    }));
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const tree = searchParams.get('tree') === 'true';
    const solo_activos = searchParams.get('solo_activos') !== 'false';

    let query = db
      .from('inventario_ubicaciones')
      .select('*');

    if (solo_activos) {
      query = query.eq('activo', true);
    }

    const { data: ubicaciones, error } = await query
      .order('codigo', { ascending: true });

    if (error) throw error;

    const withStock = await Promise.all(
      (ubicaciones || []).map(async (ubic) => {
        const { count } = await db
          .from('inventario_productos')
          .select('*', { count: 'exact', head: true })
          .eq('ubicacion_id', ubic.id);
        return { ...ubic, total_productos: count || 0 };
      })
    );

    if (tree) {
      return NextResponse.json(buildTree(withStock));
    }

    return NextResponse.json(withStock);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al obtener ubicaciones' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = await req.json();

    if (!body.codigo || body.codigo.trim().length === 0) {
      return NextResponse.json({ error: 'El código es obligatorio' }, { status: 400 });
    }
    if (!body.nombre || body.nombre.trim().length === 0) {
      return NextResponse.json({ error: 'El nombre es obligatorio' }, { status: 400 });
    }
    if (!body.tipo) {
      return NextResponse.json({ error: 'El tipo es obligatorio' }, { status: 400 });
    }

    if (body.ubicacion_padre_id) {
      const { data: padre } = await db
        .from('inventario_ubicaciones')
        .select('id')
        .eq('id', body.ubicacion_padre_id)
        .single();

      if (!padre) {
        return NextResponse.json({ error: 'La ubicación padre no existe' }, { status: 404 });
      }
    }

    const { data: existing } = await db
      .from('inventario_ubicaciones')
      .select('id')
      .eq('codigo', body.codigo.trim())
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: `Ya existe una ubicación con el código "${body.codigo.trim()}"` },
        { status: 409 }
      );
    }

    const { data, error } = await db
      .from('inventario_ubicaciones')
      .insert({
        codigo: body.codigo.trim().toUpperCase(),
        nombre: body.nombre.trim(),
        tipo: body.tipo,
        ubicacion_padre_id: body.ubicacion_padre_id || null,
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
      { error: error instanceof Error ? error.message : 'Error al crear ubicación' },
      { status: 500 }
    );
  }
}
