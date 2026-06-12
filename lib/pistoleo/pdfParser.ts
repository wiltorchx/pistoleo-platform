import pdfParse from 'pdf-parse';

export interface InventoryItem {
  upc: string;
  description: string;
  quantity: number;
}

export async function parseInventoryPdf(buffer: Buffer): Promise<InventoryItem[]> {
  try {
    const data = await pdfParse(buffer);
    const text = data.text;
    const items: InventoryItem[] = [];
    const lines = text.split('\n');
    
    let i = 0;
    while (i < lines.length) {
      const line = lines[i].trim();
      if (!line) { i++; continue; }

      // Skip header/footer lines
      if (line.match(/^(Reporte|Fecha|Extreme|Bodega|Conteo|Producto|Ubicación|Existencias|Unidades|Página|\d{1,2}\/\d{1,2}\/\d{4})/i)) { i++; continue; }

      // Match UPC pattern: alphanumeric code followed by space and parenthesis
      const codeMatch = line.match(/^([A-Z0-9]{6,})\s*\((.*)/);
      
      if (codeMatch) {
        const upc = codeMatch[1];
        let description = codeMatch[2];
        
        // Check if quantity is on same line
        const qtyMatchSameLine = line.match(/\)(\d+\.\d{2})\s*Unidad/);
        if (qtyMatchSameLine) {
          const quantity = parseFloat(qtyMatchSameLine[1]);
          // Remove the quantity part from description
          description = description.replace(/\)(\d+\.\d{2})\s*Unidad$/, ')').trim();
          items.push({ upc, description: cleanDescription(description), quantity });
          i++;
          continue;
        }
        
        // Description may span multiple lines until we find the quantity line
        const descLines: string[] = [description];
        i++;
        
        while (i < lines.length) {
          const nextLine = lines[i].trim();
          if (!nextLine) { i++; continue; }
          
          // Check for quantity line
          const qtyMatch = nextLine.match(/^(\d+\.\d{2})\s*Unidad$/);
          if (qtyMatch) {
            const quantity = parseFloat(qtyMatch[1]);
            const fullDesc = descLines.join(' ').trim();
            items.push({ upc, description: cleanDescription(fullDesc), quantity });
            i++;
            break;
          }
          
          // Check for header/footer lines to stop
          if (nextLine.match(/^(Reporte|Fecha|Extreme|Bodega|Conteo|Producto|Ubicación|Existencias|Unidades|Página|\d{1,2}\/\d{1,2}\/\d{4})/i)) {
            break;
          }
          
          // Check for next UPC pattern (start of next item)
          if (nextLine.match(/^[A-Z0-9]{6,}\s*\(/)) {
            break;
          }
          
          descLines.push(nextLine);
          i++;
        }
      } else {
        i++;
      }
    }

    return items;
  } catch (error) {
    console.error('Error parsing PDF:', error);
    return [];
  }
}

function cleanDescription(desc: string): string {
  return desc
    .replace(/\s+/g, ' ')
    .replace(/^\(/, '')
    .replace(/\)$/, '')
    .trim();
}
