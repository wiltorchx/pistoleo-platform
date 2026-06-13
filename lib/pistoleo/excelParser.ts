import * as ExcelJS from 'exceljs';

export interface ExcelMapping {
  upc: string;
  description: string;
  quantity: string;
}

export interface ParsedInventoryItem {
  upc: string;
  description: string;
  expectedQuantity: number;
}

export async function parseInventoryExcel(buffer: ArrayBuffer, mapping: ExcelMapping): Promise<ParsedInventoryItem[]> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  const worksheet = workbook.getWorksheet(1);

  if (!worksheet) {
    throw new Error('No worksheet found in the Excel file');
  }

  const headers = worksheet.getRow(1).values as unknown[];
  // ExcelJS values are 1-indexed.-
  const headerMap: Record<string, number> = {};
  
  headers.forEach((value, index) => {
    if (value) {
      headerMap[value.toString().trim()] = index;
    }
  });

  const upcIdx = headerMap[mapping.upc];
  const descIdx = headerMap[mapping.description];
  const qtyIdx = headerMap[mapping.quantity];

  if (upcIdx === undefined || qtyIdx === undefined) {
    throw new Error('Missing required columns in Excel based on the provided mapping');
  }

  const items: ParsedInventoryItem[] = [];

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // Skip header

    const upc = row.getCell(upcIdx).value?.toString().trim();
    const description = descIdx !== undefined ? (row.getCell(descIdx).value?.toString().trim() ?? 'No description') : 'No description';
    const qtyValue = row.getCell(qtyIdx).value;
    const expectedQuantity = typeof qtyValue === 'number' ? qtyValue : parseFloat(qtyValue?.toString().replace(',', '.') || '0');

    if (upc) {
      items.push({
        upc,
        description,
        expectedQuantity: Math.round(expectedQuantity),
      });
    }
  });

  return items;
}
