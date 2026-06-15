import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/getUser';
import { parseFile } from '@/lib/inventario/fileParser';

export async function POST(req: Request) {
  try {
    await requireUser();
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No se proporcionó ningún archivo' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const parsed = await parseFile(buffer, file.name, file.type);

    const preview = parsed.items.slice(0, 5).map(item => ({
      codigo: item.codigo,
      descripcion: item.descripcion,
      cantidad: item.cantidad,
    }));

    return NextResponse.json({ preview, total: parsed.totalItems });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al procesar archivo' },
      { status: 500 }
    );
  }
}
