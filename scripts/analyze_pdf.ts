import fs from 'fs';
import * as pdfjsLib from 'pdfjs-dist';

async function analyzePdf(filePath: string) {
  try {
    const data = new Uint8Array(fs.readFileSync(filePath));
    const loadingTask = pdfjsLib.getDocument({ data });
    const pdfDocument = await loadingTask.promise;
    
    let fullText = '';
    for (let i = 1; i <= pdfDocument.numPages; i++) {
      const page = await pdfDocument.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: { str: string }) => item.str).join(' ');
      fullText += `--- Page ${i} ---\\n${pageText}\\n\\n`;
    }
    
    console.log('--- PDF TEXT START ---');
    console.log(fullText);
    console.log('--- PDF TEXT END ---');
  } catch (error) {
    console.error('Error reading PDF:', error);
  }
}

analyzePdf('C:\\Users\\Comunicaciones\\Desktop\\Moza\\Proyecto Extreme V6.9\\Reporte de Inventario-20260610-103507.pdf');
