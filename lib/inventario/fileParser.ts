import * as ExcelJS from 'exceljs';

export interface ParsedItem {
  codigo: string;
  descripcion: string;
  cantidad: number;
}

export interface ParseResult {
  items: ParsedItem[];
  totalItems: number;
  fileName: string;
  fileType: string;
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') { inQuotes = !inQuotes; continue; }
    if (ch === ';' && !inQuotes) { result.push(current.trim()); current = ''; continue; }
    current += ch;
  }
  result.push(current.trim());
  return result;
}

function detectCsvColumns(headers: string[]): { colCodigo: number; colCantidad: number } {
  let colCodigo = -1;
  let colCantidad = -1;
  const lowerHeaders = headers.map(h => h.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''));
  for (let i = 0; i < lowerHeaders.length; i++) {
    const h = lowerHeaders[i];
    if (/producto|codigo|código|cod|upc|sku|referencia/.test(h)) {
      colCodigo = i;
    }
    if (/cantidad.*pistoleo|cantidad.*fisic|existencia|cantidad|qty|quantity|unds/.test(h)) {
      colCantidad = i;
    }
  }
  if (colCodigo === -1) {
    for (let i = 0; i < lowerHeaders.length; i++) {
      const h = lowerHeaders[i];
      if (/producto|codigo|código|cod|upc|sku/.test(h)) { colCodigo = i; break; }
    }
  }
  if (colCantidad === -1) {
    for (let i = 0; i < lowerHeaders.length; i++) {
      const h = lowerHeaders[i];
      if (/cantidad|existencia|qty|unds/.test(h)) { colCantidad = i; break; }
    }
  }
  return { colCodigo, colCantidad };
}

function parseNumber(value: string, format: 'chilean' | 'english' = 'chilean'): number {
  let cleaned: string;
  if (format === 'english') {
    cleaned = value.replace(/,/g, '').replace(/[^0-9.\-]/g, '');
  } else {
    cleaned = value.replace(/\./g, '').replace(',', '.').replace(/[^0-9.\-]/g, '');
  }
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

function parsePdfQuantity(value: string): number {
  return parseNumber(value, 'english');
}

export async function parseFile(buffer: Buffer, fileName: string, mimeType: string): Promise<ParseResult> {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';

  if (ext === 'pdf' || mimeType === 'application/pdf') {
    return parsePdf(buffer, fileName);
  }
  if (ext === 'xlsx' || mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
    return parseExcel(buffer, fileName);
  }
  if (ext === 'csv' || mimeType === 'text/csv' || mimeType === 'text/plain') {
    return parseCsv(buffer, fileName);
  }

  throw new Error(`Formato no soportado: .${ext}`);
}

async function parsePdf(buffer: Buffer, fileName: string): Promise<ParseResult> {
  const pdfParse = (await import('pdf-parse')).default;
  const data = await pdfParse(buffer);
  const text = data.text;
  const lines = text.split('\n');
  const items: ParsedItem[] = [];

  let i = 0;
  while (i < lines.length) {
    const line = lines[i].trim();
    if (!line) { i++; continue; }

    if (line.match(/^(Reporte|Fecha|Extreme|Bodega|Conteo|Producto|Ubicación|Existencias|Unidades|Página|\d{1,2}\/\d{1,2}\/\d{4})/i)) { i++; continue; }

    const codeMatch = line.match(/^([A-Za-z0-9]{4,})\s*\((.*)/);
    if (!codeMatch) { i++; continue; }

    const codigo = codeMatch[1];
    let description = codeMatch[2];

    const qtyMatchSameLine = line.match(/\)(\d+[\d,]*\.?\d*)\s*Unidad/);
    if (qtyMatchSameLine) {
      const cantidad = parsePdfQuantity(qtyMatchSameLine[1]);
      description = description.replace(/\)[\d,]+\.?\d*\s*Unidad$/, ')').trim();
      items.push({ codigo, descripcion: cleanDesc(description), cantidad });
      i++;
      continue;
    }

    const descLines: string[] = [description];
    i++;

    while (i < lines.length) {
      const nextLine = lines[i].trim();
      if (!nextLine) { i++; continue; }

      if (nextLine.match(/^(Reporte|Fecha|Extreme|Bodega|Conteo|Producto|Ubicación|Existencias|Unidades|Página|\d{1,2}\/\d{1,2}\/\d{4})/i)) { break; }

      if (nextLine.match(/^[A-Za-z0-9]{4,}\s*\(/)) { break; }

      const qtyMatch = nextLine.match(/^(\d+[\d,]*\.?\d*)\s*Unidad/);
      if (qtyMatch) {
        const cantidad = parsePdfQuantity(qtyMatch[1]);
        const fullDesc = descLines.join(' ').trim();
        items.push({ codigo, descripcion: cleanDesc(fullDesc), cantidad });
        i++;
        break;
      }

      descLines.push(nextLine);
      i++;
    }
  }

  return { items, totalItems: items.length, fileName, fileType: 'pdf' };
}

async function parseExcel(buffer: Buffer, fileName: string): Promise<ParseResult> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer);
  const ws = wb.worksheets[0];
  if (!ws) { return { items: [], totalItems: 0, fileName, fileType: 'xlsx' }; }

  const allRows: string[][] = [];
  ws.eachRow((row: any) => {
    const values: string[] = [];
    row.eachCell((cell: any) => { values.push(String(cell.value ?? '').trim()); });
    allRows.push(values);
  });

  if (allRows.length < 2) return { items: [], totalItems: 0, fileName, fileType: 'xlsx' };

  const headers = allRows[0];
  const { colCodigo, colCantidad } = detectCsvColumns(headers);

  const items: ParsedItem[] = [];

  for (let r = 1; r < allRows.length; r++) {
    const row = allRows[r];
    let codigo = '';
    if (colCodigo >= 0 && colCodigo < row.length) {
      codigo = row[colCodigo]?.trim() || '';
    } else if (row.length >= 2) {
      codigo = row[1]?.trim() || '';
    }

    if (!codigo) continue;

    let cantidad = 0;
    if (colCantidad >= 0 && colCantidad < row.length && row[colCantidad]) {
      cantidad = parseNumber(row[colCantidad]);
    }

    let descripcion = '';
    const descIdx = headers.findIndex(h => /descripcion|descripción|description|nombre|name/i.test(h));
    if (descIdx >= 0 && descIdx < row.length) descripcion = row[descIdx] || '';
    else if (row.length >= 3 && colCodigo !== 2) descripcion = row[2] || '';

    items.push({ codigo, descripcion, cantidad: Math.round(cantidad) });
  }

  return { items, totalItems: items.length, fileName, fileType: 'xlsx' };
}

async function parseCsv(buffer: Buffer, fileName: string): Promise<ParseResult> {
  const content = buffer.toString('utf-8');
  const lines = content.split('\n').filter(l => l.trim());

  if (lines.length < 2) return { items: [], totalItems: 0, fileName, fileType: 'csv' };

  const headers = parseCsvLine(lines[0]);
  const { colCodigo, colCantidad } = detectCsvColumns(headers);

  const items: ParsedItem[] = [];

  for (let r = 1; r < lines.length; r++) {
    const cols = parseCsvLine(lines[r]);
    if (cols.length < 2) continue;

    let codigo = '';
    if (colCodigo >= 0 && colCodigo < cols.length) codigo = cols[colCodigo]?.trim() || '';
    if (!codigo) continue;

    let cantidad = 0;
    if (colCantidad >= 0 && colCantidad < cols.length && cols[colCantidad]) {
      cantidad = parseNumber(cols[colCantidad]);
    }

    let descripcion = '';
    const descIdx = headers.findIndex(h => /descripcion|descripción|description|nombre|name/i.test(h));
    if (descIdx >= 0 && descIdx < cols.length) descripcion = cols[descIdx] || '';

    items.push({ codigo, descripcion, cantidad: Math.round(cantidad) });
  }

  return { items, totalItems: items.length, fileName, fileType: 'csv' };
}

function cleanDesc(desc: string): string {
  return desc.replace(/\s+/g, ' ').replace(/^\(/, '').replace(/\)$/, '').trim();
}
