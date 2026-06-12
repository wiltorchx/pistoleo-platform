import { getPendingScans, markScanAsSynced, markScanAsError, updateInventoryCache } from './db';

export async function syncPendingScans(batchId: string, onProgress: (status: string) => void) {
  const pending = await getPendingScans();
  
  if (pending.length === 0) {
    onProgress('Sincronizado');
    return;
  }

  onProgress(`Sincronizando ${pending.length} escaneos...`);

  for (const scan of pending) {
    try {
      const res = await fetch('/api/pistoleo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'scan',
          batchId: scan.batchId,
          upc: scan.upc,
          userId: 'admin-id', // Placeholder
        }),
      });

      if (res.ok) {
        await markScanAsSynced(scan.id!);
      } else {
        await markScanAsError(scan.id!);
      }
    } catch (e) {
      console.error('Sync error for scan', scan.id, e);
      await markScanAsError(scan.id!);
    }
  }

  // After syncing, refresh the local inventory cache from the server
  try {
    const res = await fetch(`/api/pistoleo/${batchId}`);
    if (res.ok) {
      const data = await res.json();
      // data.items should contain the latest state
      if (data.items) {
        await updateInventoryCache(data.items);
      }
    }
  } catch (e) {
    console.error('Error refreshing cache after sync', e);
  }

  onProgress('Sincronizado');
}
