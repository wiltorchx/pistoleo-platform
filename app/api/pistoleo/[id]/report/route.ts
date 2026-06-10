import { NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import { connectDB } from '@/lib/db';
import { PistoleoBatch } from '@/models/PistoleoBatch';
import { PistoleoInventory } from '@/models/PistoleoInventory';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await connectDB();
  try {
    const { id } = await params;
    
    const batch = await PistoleoBatch.findById(id).lean();
    if (!batch) return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
    
    const inventory = await PistoleoInventory.find({ batchId: id }).lean();
    
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Inventory Report');
    
    // Styles
    const headerStyle = {
      font: { bold: true, color: { argb: 'FFFFFFFF' } },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } }, // Primary-600
      alignment: { horizontal: 'center' }
    } as const;
    
    // Report Header
    worksheet.mergeCells('A1:E1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = `Inventory Report: ${batch.name}`;
    titleCell.font = { size: 16, bold: true };
    titleCell.alignment = { horizontal: 'center' };
    
    worksheet.mergeCells('A2:E2');
    worksheet.getCell('A2').value = `Generated on: ${new Date().toLocaleString()}`;
    worksheet.getCell('A2').alignment = { horizontal: 'center' };
    
    worksheet.mergeCells('A3:E3');
    worksheet.getCell('A3').value = `Status: ${batch.status.toUpperCase()}`;
    worksheet.getCell('A3').alignment = { horizontal: 'center' };
    
    worksheet.addRow([]); // Spacer
    
    // Table Headers
    const columns = [
      { header: 'UPC', key: 'upc', width: 15 },
      { header: 'Description', key: 'description', width: 50 },
      { header: 'Expected', key: 'expected', width: 12 },
      { header: 'Actual', key: 'actual', width: 12 },
      { header: 'Difference', key: 'diff', width: 15 },
    ];
    
    const headerRow = worksheet.addRow(columns.map(c => c.header));
    headerRow.eachCell((cell) => {
      cell.style = headerStyle;
    });
    
    // Data Rows
    inventory.forEach(item => {
      const diff = item.actualQuantity - item.expectedQuantity;
      const row = worksheet.addRow({
        upc: item.upc,
        description: item.description,
        expected: item.expectedQuantity,
        actual: item.actualQuantity,
        diff: diff,
      });
      
      // Highlight differences
      if (diff !== 0) {
        const diffCell = row.getCell(5);
        diffCell.font = { color: { argb: diff < 0 ? 'FFFF0000' : 'FF008000' }, bold: true };
      }
    });
    
    // Summary Section
    worksheet.addRow([]);
    const summaryRow = worksheet.addRow(['', '', 'TOTALS', '', '']);
    summaryRow.getCell(3).font = { bold: true };
    
    const totalExpected = inventory.reduce((sum, i) => sum + i.expectedQuantity, 0);
    const totalActual = inventory.reduce((sum, i) => sum + i.actualQuantity, 0);
    
    const totalsRow = worksheet.addRow(['', '', totalExpected, totalActual, totalActual - totalExpected]);
    totalsRow.eachCell((cell) => {
      cell.font = { bold: true };
    });
    
    // Set column widths
    worksheet.columns = columns.map(c => ({ header: c.header, key: c.key, width: c.width }));
    
    const buffer = await workbook.xlsx.writeBuffer();
    
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="Inventory_Report_${id}.xlsx"`,
      },
    });
    
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}
