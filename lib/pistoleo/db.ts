import { openDB, IDBPDatabase } from 'idb';

const DB_NAME = 'pistoleo_industrial_db';
const DB_VERSION = 1;

export interface ScanQueueItem {
  id?: number;
  batchId: string;
  upc: string;
  timestamp: number;
  status: 'pending' | 'synced' | 'error';
}

export interface InventoryCacheItem {
  id: string;
  upc: string;
  description: string;
  expectedQuantity: number;
  actualQuantity: number;
  status: string;
}

export async function initDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('scans')) {
        db.createObjectStore('scans', { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains('inventory_cache')) {
        db.createObjectStore('inventory_cache', { keyPath: 'id' });
      }
    },
  });
}

export async function addScanToQueue(scan: Omit<ScanQueueItem, 'id'>) {
  const db = await initDB();
  return db.add('scans', { ...scan, status: 'pending' });
}

export async function getPendingScans(): Promise<ScanQueueItem[]> {
  const db = await initDB();
  const scans = await db.getAll('scans');
  return scans.filter(s => s.status === 'pending');
}

export async function markScanAsSynced(id: number) {
  const db = await initDB();
  const scan = await db.get('scans', id);
  if (scan) {
    await db.put('scans', { ...scan, status: 'synced' } as ScanQueueItem);
  }
}

export async function markScanAsError(id: number) {
  const db = await initDB();
  const scan = await db.get('scans', id);
  if (scan) {
    await db.put('scans', { ...scan, status: 'error' } as ScanQueueItem);
  }
}

export async function updateInventoryCache(items: InventoryCacheItem[]) {
  const db = await initDB();
  const tx = db.transaction('inventory_cache', 'readwrite');
  await Promise.all(
    items.map(item => tx.store.put(item))
  );
  await tx.done;
}

export async function getCachedInventory(batchId: string): Promise<InventoryCacheItem[]> {
  const db = await initDB();
  // Note: Currently we store all items in one store. 
  // In a real multi-batch scenario, we'd filter by batchId.
  return db.getAll('inventory_cache');
}

export async function clearInventoryCache() {
  const db = await initDB();
  await db.clear('inventory_cache');
}

export async function removeLastScan(batchId: string) {
  const db = await initDB();
  const scans = await db.getAll('scans');
  const batchScans = scans
    .filter(s => s.batchId === batchId)
    .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  
  if (batchScans.length > 0) {
    await db.delete('scans', batchScans[0].id!);
    return true;
  }
  return false;
}

