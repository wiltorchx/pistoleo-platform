import { NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import { db } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/api-auth';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthenticatedUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const { data: batch, error: batchError } = await db
      .from('pistoleo_batches')
      .select('*')
      .eq('id', id)
      .single();

    if (batchError || !batch) {
      return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
    }

    // Check access
    const hasAccess = authUser.role === 'admin' || batch.created_by === authUser.id;
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data: inventory, error: invError } = await db
      .from('pistoleo_inventory')
      .select('*')
      .eq('batch_id', id);

    if (invError) throw invError;

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Inventory Report');

    const headerStyle = {
      font: { bold: true, color: { argb: 'FFFFFFFF' } },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } },
      alignment: { horizontal: 'center' },
    } as const;

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

    worksheet.addRow([]);

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

    (inventory || []).forEach(item => {
      const diff = item.actual_quantity - item.expected_quantity;
      const row = worksheet.addRow({
        upc: item.upc,
        description: item.description,
        expected: item.expected_quantity,
        actual: item.actual_quantity,
        diff: diff,
      });

      if (diff !== 0) {
        const diffCell = row.getCell(5);
        diffCell.font = { color: { argb: diff < 0 ? 'FFFF0000' : 'FF008000' }, bold: true };
      }
    });

    worksheet.addRow([]);
    const summaryRow = worksheet.addRow(['', '', 'TOTALS', '', '']);
    summaryRow.getCell(3).font = { bold: true };

    const totalExpected = (inventory || []).reduce((sum, i) => sum + i.expected_quantity, 0);
    const totalActual = (inventory || []).reduce((sum, i) => sum + i.actual_quantity, 0);

    const totalsRow = worksheet.addRow(['', '', totalExpected, totalActual, totalActual - totalExpected]);
    totalsRow.eachCell((cell) => {
      cell.font = { bold: true };
    });

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
