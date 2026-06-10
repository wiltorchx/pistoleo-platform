import pdf from 'pdf-parse';

export interface InventoryItem {
  upc: string;
  description: string;
  quantity: number;
}

export async function parseInventoryPdf(buffer: Buffer): Promise<InventoryItem[]> {
  const data = await pdf(buffer);
  const text = data.text;
  
  const items: InventoryItem[] = [];
  
  // Pattern: Code (7 alphanumeric) followed by description and then X.00 Unidad
  // Example: CAB0184 (Cable Unno Tekno USB C a Lightning... 1.00 Unidad ...)
  // We use a global regex to find all matches
  const lines = text.split('\\n');
  
  let currentItem: InventoryItem | null = null;

  for (let line of lines) {
    line = line.trim();
    if (!line) continue;

    // Check if line starts with a code like CAB0184 or USB0010
    const codeMatch = line.match(/^([A-Z0-9]{7})\s*(\(.*?\)?|.*)/);
    
    if (codeMatch) {
      const upc = codeMatch[1];
      const description = codeMatch[2] || '';
      
      // Check for quantity in the same line
      const qtyMatch = line.match(/(\\d+\\.\\d{2})\\s+Unidad/);
      
      if (qtyMatch) {
        const quantity = parseFloat(qtyMatch[1]);
        // Clean description by removing the quantity part
        const cleanDescription = description.replace(qtyMatch[0], '').trim();
        
        items.push({
          upc,
          description: cleanDescription,
          quantity,
        });
        currentItem = null;
      } else {
        // Quantity might be on the next line
        currentItem = {
          upc,
          description: description,
          quantity: 0,
        };
      }
    } else if (currentItem) {
      // Look for quantity in the continuation line
      const qtyMatch = line.match(/(\\d+\\.\\d{2})\\s+Unidad/);
      if (qtyMatch) {
        currentItem.quantity = parseFloat(qtyMatch[1]);
        
        // Append this line to description if it's before the quantity
        const parts = line.split(qtyMatch[0]);
        if (parts[0]) {
          currentItem.description += ' ' + parts[0].trim();
        }
        
        items.push(currentItem);
        currentItem = null;
      } else {
        // Just append to description
        currentItem.description += ' ' + line;
      }
    }
  }
  
  return items;
}
