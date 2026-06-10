const ExcelJS = require('exceljs');
const fs = require('fs');

async function extractProducts() {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile('C:/Users/Comunicaciones/Desktop/Moza/Proyecto Extreme V6.9/20260609T120210.027-Report.xlsx');
    const worksheet = workbook.getWorksheet(1);
    
    const products = [];
    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
        const values = row.values;
        const code = values[1];
        const description = values[2];
        const upc = values[3];
        
        if (code && upc) {
            products.push({ code, description, upc });
        }
    });
    
    fs.writeFileSync('extracted_products.json', JSON.stringify(products, null, 2));
    console.log(`Extracted ${products.length} products to extracted_products.json`);
}

extractProducts().catch(console.error);
