import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
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

    const codigos = [...new Set(parsed.items.map(i => i.codigo))];

    const { data: productos, error: prodError } = await db
      .from('inventario_productos')
      .select('id, codigo, nombre, stock_actual, unidad_medida')
      .in('codigo', codigos)
      .eq('activo', true);

    if (prodError) throw prodError;

    const productoMap = new Map((productos || []).map(p => [p.codigo, p]));

    const matchedItems: { codigo: string; descripcion: string; cantidad: number; producto: typeof productos[0] }[] = [];
    const unmatchedItems: { codigo: string; descripcion: string; cantidad: number }[] = [];

    for (const item of parsed.items) {
      const prod = productoMap.get(item.codigo);
      if (prod) {
        matchedItems.push({ ...item, producto: prod });
      } else {
        unmatchedItems.push(item);
      }
    }

    if (matchedItems.length === 0) {
      return NextResponse.json({
        error: 'Ningún código del archivo coincide con productos del inventario',
        matched: 0,
        unmatched: unmatchedItems.length,
        unmatchedItems: unmatchedItems.slice(0, 20),
      }, { status: 400 });
    }

    const conteoNombre = nombre || `Conteo desde ${file.name} - ${new Date().toLocaleDateString('es-CL')}`;

    const { data: conteo, error: conteoError } = await db
      .from('inventario_conteos')
      .insert({
        nombre: conteoNombre,
        usuario_id: user.id,
      })
      .select()
      .single();

    if (conteoError) throw conteoError;

    const seenProductIds = new Set<string>();
    const itemsToInsert = matchedItems
      .filter(mi => {
        if (seenProductIds.has(mi.producto.id)) return false;
        seenProductIds.add(mi.producto.id);
        return true;
      })
      .map(mi => ({
        conteo_id: conteo.id,
        producto_id: mi.producto.id,
        stock_sistema: mi.producto.stock_actual,
        stock_fisico: mi.cantidad,
        estado: 'contado' as const,
      }));

    const { error: itemsError } = await db
      .from('inventario_conteo_items')
      .insert(itemsToInsert);

    if (itemsError) throw itemsError;

    return NextResponse.json({
      conteo,
      resumen: {
        totalArchivo: parsed.totalItems,
        totalCoincidencias: matchedItems.length,
        totalSinCoincidencia: unmatchedItems.length,
      },
      sinCoincidencia: unmatchedItems.slice(0, 50),
      advertencia: unmatchedItems.length > 0
        ? `${unmatchedItems.length} producto(s) del archivo no se encontraron en el inventario. Puedes agregarlos manualmente después.`
        : undefined,
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
