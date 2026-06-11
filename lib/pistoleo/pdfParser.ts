export interface InventoryItem {
  upc: string;
  description: string;
  quantity: number;
}

export async function parseInventoryPdf(buffer: Buffer): Promise<InventoryItem[]> {
  try {
    const pdf = require('pdf-parse');
    const data = await pdf(buffer);
    const text = data.text;
    const items: InventoryItem[] = [];
    const lines = text.split('\n');
    let currentItem: InventoryItem | null = null;

    for (let line of lines) {
      line = line.trim();
      if (!line) continue;

      const codeMatch = line.match(/^([A-Z0-9]{7})\s*(\(.*?\)?|.*)/);

      if (codeMatch) {
        const upc = codeMatch[1];
        const description = codeMatch[2] || '';
        const qtyMatch = line.match(/(\d+\.\d{2})\s+Unidad/);

        if (qtyMatch) {
          const quantity = parseFloat(qtyMatch[1]);
          const cleanDescription = description.replace(qtyMatch[0], '').trim();
          items.push({ upc, description: cleanDescription, quantity });
          currentItem = null;
        } else {
          currentItem = { upc, description, quantity: 0 };
        }
      } else if (currentItem) {
        const qtyMatch = line.match(/(\d+\.\d{2})\s+Unidad/);
        if (qtyMatch) {
          currentItem.quantity = parseFloat(qtyMatch[1]);
          const parts = line.split(qtyMatch[0]);
          if (parts[0]) {
            currentItem.description += ' ' + parts[0].trim();
          }
          items.push(currentItem);
          currentItem = null;
        } else {
          currentItem.description += ' ' + line;
        }
      }
    }
    return items;
  } catch (error) {
    console.error('Error parsing PDF:', error);
    return [];
  }
}
