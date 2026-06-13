import ExcelJS from 'exceljs';

interface ImportItem {
  codigo: string;
  nombre: string;
  descripcion?: string;
  codigo_barras?: string;
  unidad_medida?: string;
  categoria_id?: string;
  ubicacion_id?: string;
  stock_minimo?: number;
  stock_maximo?: number;
  costo_promedio?: number;
  precio_venta?: number;
}

interface ColumnMapping {
  codigo: string;
  nombre: string;
  descripcion?: string;
  codigo_barras?: string;
  unidad_medida?: string;
  stock_minimo?: string;
  stock_maximo?: string;
  costo_promedio?: string;
  precio_venta?: string;
  categoria?: string;
  ubicacion?: string;
}

export async function parseExcelFile(
  buffer: ArrayBuffer,
  mapping: ColumnMapping
): Promise<ImportItem[]> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(Buffer.from(buffer));

  const worksheet = workbook.worksheets[0];
  if (!worksheet) {
    throw new Error('El archivo no contiene hojas de trabajo');
  }

  const rows = worksheet.getRows(2, worksheet.rowCount - 1) || [];
  const items: ImportItem[] = [];

  for (const row of rows) {
    const values = row.values as (string | number | null | undefined)[];

    const getVal = (colName: string): string | undefined => {
      if (!colName) return undefined;
      const colIndex = getColumnIndex(worksheet, colName);
      if (colIndex === undefined) return undefined;
      const val = values[colIndex];
      if (val === null || val === undefined) return undefined;
      return String(val).trim();
    };

    const getNum = (colName: string): number | undefined => {
      const val = getVal(colName);
      if (val === undefined || val === '') return undefined;
      const num = parseFloat(val.replace(/[$,]/g, ''));
      return isNaN(num) ? undefined : num;
    };

    const codigo = getVal(mapping.codigo);
    const nombre = getVal(mapping.nombre);

    if (!codigo || !nombre) continue;

    items.push({
      codigo,
      nombre,
      descripcion: mapping.descripcion ? getVal(mapping.descripcion) : undefined,
      codigo_barras: mapping.codigo_barras ? getVal(mapping.codigo_barras) : undefined,
      unidad_medida: mapping.unidad_medida ? getVal(mapping.unidad_medida) : undefined,
      stock_minimo: mapping.stock_minimo ? getNum(mapping.stock_minimo) : undefined,
      stock_maximo: mapping.stock_maximo ? getNum(mapping.stock_maximo) : undefined,
      costo_promedio: mapping.costo_promedio ? getNum(mapping.costo_promedio) : undefined,
      precio_venta: mapping.precio_venta ? getNum(mapping.precio_venta) : undefined,
    });
  }

  return items;
}

function getColumnIndex(worksheet: any, columnName: string): number | undefined {
  const headerRow = worksheet.getRow(1);
  const values = headerRow.values as (string | number | null | undefined)[];
  for (let i = 1; i < values.length; i++) {
    if (String(values[i]).toLowerCase().trim() === columnName.toLowerCase().trim()) {
      return i;
    }
  }
  return undefined;
}
