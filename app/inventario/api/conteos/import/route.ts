import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/supabase-admin';
import { requireUser } from '@/lib/getUser';
import { parseFile } from '@/lib/inventario/fileParser';

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const nombre = (formData.get('nombre') as string) || '';

    if (!file) {
      return NextResponse.json({ error: 'No se proporcionó ningún archivo' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const parsed = await parseFile(buffer, file.name, file.type);

    if (parsed.items.length === 0) {
      return NextResponse.json({ error: 'No se pudieron extraer items del archivo. Verifica el formato.' }, { status: 400 });
    }

    const conteoNombre = nombre || `Conteo desde ${file.name} - ${new Date().toLocaleDateString('es-CL')}`;

    const { data: conteo, error: conteoError } = await adminDb
      .from('inventario_conteos')
      .insert({ nombre: conteoNombre, usuario_id: user.id })
      .select()
      .single();

    if (conteoError) throw conteoError;

    const codigos = [...new Set(parsed.items.map(i => i.codigo))];

    const { data: productosExistentes } = await adminDb
      .from('inventario_productos')
      .select('id, codigo')
      .in('codigo', codigos);

    const prodMap = new Map((productosExistentes || []).map(p => [p.codigo, p.id]));

    const itemsToInsert: Record<string, unknown>[] = [];

    for (const item of parsed.items) {
      let productoId = prodMap.get(item.codigo);

      if (!productoId) {
        const { data: newProd, error: newProdError } = await adminDb
          .from('inventario_productos')
          .insert({
            codigo: item.codigo,
            nombre: item.descripcion || item.codigo,
            unidad_medida: 'unidad',
            activo: true,
          })
          .select('id')
          .single();

        if (newProdError) throw newProdError;
        productoId = newProd.id;
        prodMap.set(item.codigo, productoId);
      }

      itemsToInsert.push({
        conteo_id: conteo.id,
        producto_id: productoId,
        stock_sistema: item.cantidad,
        estado: 'pendiente',
      });
    }

    const { error: itemsError } = await adminDb
      .from('inventario_conteo_items')
      .insert(itemsToInsert);

    if (itemsError) throw itemsError;

    return NextResponse.json({
      conteo,
      resumen: {
        totalArchivo: parsed.totalItems,
        itemsCreados: itemsToInsert.length,
      },
    }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al importar archivo' },
      { status: 500 }
    );
  }
}
