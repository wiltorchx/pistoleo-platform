import * as ExcelJS from 'exceljs';

export interface UpcMasterEntry {
  codigo: string;
  descripcion: string;
  upc: string;
}

const COLUMN_ALIASES: Record<string, string[]> = {
  codigo: ['código', 'codigo', 'cod', 'producto', 'id', 'sku'],
  descripcion: ['descripción', 'descripcion', 'description', 'nombre', 'name', 'detalle'],
  upc: ['upc', 'ean', 'código de barras', 'cod. barras', 'codigo_barras', 'barcode'],
};

function normalize(str: string): string {
  return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

export async function parseUpcMaster(buffer: Buffer, fileName: string): Promise<{ entries: UpcMasterEntry[]; advertencias: string[] }> {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  const advertencias: string[] = [];

  if (ext === 'csv') return parseCsvMaster(buffer, advertencias);
  if (ext === 'xlsx' || ext === 'xls') return parseExcelMaster(buffer, advertencias);
  if (ext === 'pdf') return parsePdfMaster(buffer, advertencias);

  throw new Error(`Formato no soportado: .${ext}`);
}

function detectColumns(headers: string[]): { codigo: number; descripcion: number; upc: number } {
  const result = { codigo: -1, descripcion: -1, upc: -1 };
  const normalizedHeaders = headers.map(h => normalize(h));

  for (let i = 0; i < normalizedHeaders.length; i++) {
    const h = normalizedHeaders[i];
    if (result.codigo === -1 && COLUMN_ALIASES.codigo.some(a => h.includes(a))) result.codigo = i;
    else if (result.descripcion === -1 && COLUMN_ALIASES.descripcion.some(a => h.includes(a))) result.descripcion = i;
    else if (result.upc === -1 && COLUMN_ALIASES.upc.some(a => h.includes(a))) result.upc = i;
  }

  return result;
}

async function parseExcelMaster(buffer: Buffer, advertencias: string[]): Promise<{ entries: UpcMasterEntry[]; advertencias: string[] }> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer);
  const ws = wb.worksheets[0];
  if (!ws) throw new Error('El archivo Excel no contiene hojas');

  const allRows: string[][] = [];
  ws.eachRow((row: any) => {
    const values: string[] = [];
    row.eachCell((cell: any) => values.push(String(cell.value ?? '').trim()));
    allRows.push(values);
  });

  if (allRows.length < 2) throw new Error('El archivo no tiene datos');

  const headers = allRows[0];
  let cols = detectColumns(headers);

  if (cols.codigo === -1 || cols.upc === -1) {
    if (headers.length >= 3) {
      cols = { codigo: 0, descripcion: 1, upc: 2 };
      advertencias.push('No se detectaron encabezados. Usando orden por defecto: Código, Descripción, UPC.');
    } else {
      throw new Error('No se pudieron identificar las columnas Código y UPC. Asegúrate que la primera fila contenga estos encabezados.');
    }
  }

  const entries: UpcMasterEntry[] = [];
  for (let r = 1; r < allRows.length; r++) {
    const row = allRows[r];
    const codigo = row[cols.codigo]?.trim();
    const upc = row[cols.upc]?.trim();
    if (!codigo || !upc) continue;
    const descripcion = cols.descripcion >= 0 && cols.descripcion < row.length ? row[cols.descripcion] : '';
    entries.push({ codigo, descripcion, upc });
  }

  if (entries.length === 0) throw new Error('No se encontraron productos con código y UPC en el archivo');

  return { entries, advertencias };
}

async function parseCsvMaster(buffer: Buffer, advertencias: string[]): Promise<{ entries: UpcMasterEntry[]; advertencias: string[] }> {
  const content = buffer.toString('utf-8');
  const lines = content.split('\n').filter(l => l.trim());

  if (lines.length < 2) throw new Error('El archivo CSV no tiene datos');

  const parseLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') { inQuotes = !inQuotes; continue; }
      if ((ch === ',' || ch === ';') && !inQuotes) { result.push(current.trim()); current = ''; continue; }
      current += ch;
    }
    result.push(current.trim());
    return result;
  };

  const headers = parseLine(lines[0]);
  let cols = detectColumns(headers);

  if (cols.codigo === -1 || cols.upc === -1) {
    if (headers.length >= 3) {
      cols = { codigo: 0, descripcion: 1, upc: 2 };
    } else {
      throw new Error('No se pudieron identificar las columnas Código y UPC en el CSV');
    }
  }

  const entries: UpcMasterEntry[] = [];
  for (let r = 1; r < lines.length; r++) {
    const row = parseLine(lines[r]);
    const codigo = row[cols.codigo]?.trim();
    const upc = row[cols.upc]?.trim();
    if (!codigo || !upc) continue;
    const descripcion = cols.descripcion >= 0 && cols.descripcion < row.length ? row[cols.descripcion] : '';
    entries.push({ codigo, descripcion, upc });
  }

  return { entries, advertencias };
}

async function parsePdfMaster(buffer: Buffer, advertencias: string[]): Promise<{ entries: UpcMasterEntry[]; advertencias: string[] }> {
  const pdfParse = (await import('pdf-parse')).default;
  const data = await pdfParse(buffer);
  const text = data.text;
  const lines = text.split('\n');
  const entries: UpcMasterEntry[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const match = trimmed.match(/^([A-Za-z0-9]{4,})\s+([A-Za-zÀ-ÿ0-9\s\-.,/#]+?)\s+(\d{8,14})$/);
    if (match) {
      entries.push({
        codigo: match[1],
        descripcion: match[2].trim(),
        upc: match[3],
      });
    }
  }

  if (entries.length === 0) {
    advertencias.push('No se encontraron registros con código + UPC en el PDF. Intentando extracción genérica...');
    const codeUpcPairs: Array<[string, string]> = [];
    let lastCode = '';
    for (const line of lines) {
      const t = line.trim();
      if (!t) continue;
      const codeMatch = t.match(/^([A-Za-z0-9]{4,})\s/);
      if (codeMatch) lastCode = codeMatch[1];
      const upcMatch = t.match(/\b(\d{8,14})\b/);
      if (upcMatch && lastCode) {
        codeUpcPairs.push([lastCode, upcMatch[1]]);
        lastCode = '';
      }
    }
    for (const [code, upc] of codeUpcPairs) {
      entries.push({ codigo: code, descripcion: '', upc });
    }
  }

  return { entries, advertencias };
}
