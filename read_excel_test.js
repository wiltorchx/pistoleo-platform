const ExcelJS = require('exceljs');

async function readExcel() {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile('C:/Users/Comunicaciones/Desktop/Moza/Proyecto Extreme V6.9/20260609T120210.027-Report.xlsx');
    const worksheet = workbook.getWorksheet(1);
    
    console.log('First 5 rows:');
    worksheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
        if (rowNumber <= 5) {
            console.log(`Row ${rowNumber}: ${JSON.stringify(row.values)}`);
        }
    });
}

readExcel().catch(console.error);
