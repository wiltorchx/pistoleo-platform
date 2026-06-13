import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireUser } from '@/lib/getUser';

export async function POST(req: Request) {
  try {
    const user = await requireUser();

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const columnMappingStr = formData.get('columnMapping') as string;

    if (!file) {
      return NextResponse.json({ error: 'No se proporcionó un archivo' }, { status: 400 });
    }

    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls') && !file.name.endsWith('.csv')) {
      return NextResponse.json(
        { error: 'Formato no soportado. Use .xlsx, .xls o .csv' },
        { status: 400 }
      );
    }

    const columnMapping = columnMappingStr ? JSON.parse(columnMappingStr) : null;
    if (!columnMapping || !columnMapping.codigo || !columnMapping.nombre) {
      return NextResponse.json(
        { error: 'Debe mapear al menos las columnas "codigo" y "nombre"' },
        { status: 400 }
      );
    }

    const buffer = await file.arrayBuffer();

    let importModule;
    try {
      importModule = await import('@/lib/inventario/excelImport');
    } catch {
      return NextResponse.json(
        { error: 'El módulo de importación no está disponible. Instale exceljs.' },
        { status: 500 }
      );
    }

    const { parseExcelFile } = importModule;
    const items = await parseExcelFile(buffer, columnMapping);

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'No se encontraron datos en el archivo' }, { status: 400 });
    }

    const maxBatch = 500;
    const results = { created: 0, skipped: 0, errors: [] as string[] };

    for (let i = 0; i < items.length; i += maxBatch) {
      const batch = items.slice(i, i + maxBatch);

      for (const item of batch) {
        const { data: existing } = await db
          .from('inventario_productos')
          .select('id')
          .eq('codigo', item.codigo)
          .maybeSingle();

        if (existing) {
          results.skipped++;
          continue;
        }

        const { error } = await db
          .from('inventario_productos')
          .insert({
            codigo: item.codigo,
            nombre: item.nombre,
            descripcion: item.descripcion || null,
            codigo_barras: item.codigo_barras || null,
            unidad_medida: item.unidad_medida || 'UN',
            categoria_id: item.categoria_id || null,
            ubicacion_id: item.ubicacion_id || null,
            stock_minimo: item.stock_minimo || 0,
            stock_maximo: item.stock_maximo || null,
            costo_promedio: item.costo_promedio || 0,
            precio_venta: item.precio_venta || null,
          });

        if (error) {
          results.errors.push(`Fila ${i + results.created + results.skipped + 1}: ${error.message}`);
        } else {
          results.created++;
        }
      }
    }

    return NextResponse.json({
      message: `Importación completada: ${results.created} creados, ${results.skipped} omitidos, ${results.errors.length} errores`,
      results,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al importar productos' },
      { status: 500 }
    );
  }
}
