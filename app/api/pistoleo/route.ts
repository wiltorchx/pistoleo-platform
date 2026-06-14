import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/supabase-admin';
import { parseInventoryPdf } from '@/lib/pistoleo/pdfParser';
import { parseInventoryExcel } from '@/lib/pistoleo/excelParser';
import { parseUpcMaster } from '@/lib/pistoleo/upcMasterParser';
import { processScan } from '@/lib/pistoleo/comparisonEngine';
import { getAuthenticatedUser } from '@/lib/api-auth';
import { BatchRow, InventoryRow } from '@/lib/supabase-types';

export async function POST(req: Request) {
  const contentType = req.headers.get('content-type') || '';

  try {
    // Authenticate user for JSON requests (scan action)
    let authUser: { id: string; email: string; role: 'admin' | 'operator' } | null = null;
    if (!contentType.includes('multipart/form-data')) {
      authUser = await getAuthenticatedUser();
      if (!authUser) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const action = formData.get('action');

      if (action === 'create-batch') {
        const name = formData.get('name') as string;
        const userId = formData.get('userId') as string;

        const { data: batch, error } = await adminDb
          .from('pistoleo_batches')
          .insert({ name, created_by: userId, status: 'pending' })
          .select()
          .single();

        if (error) throw error;
        // Return consistent format with _id for frontend compatibility
        return NextResponse.json({ ...batch, _id: batch.id });
      }

      if (action === 'parse-pdf') {
        const file = formData.get('file') as File;
        if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        const upcMasterStr = formData.get('upcMaster') as string;
        const buffer = Buffer.from(await file.arrayBuffer());
        let items = await parseInventoryPdf(buffer);

        // Apply UPC master mapping (convert internal codes to barcodes for scanner matching)
        if (upcMasterStr) {
          try {
            const upcMaster = JSON.parse(upcMasterStr) as Array<{ codigo: string; upc: string }>;
            let mapped = 0;
            items = items.map(item => {
              const entry = upcMaster.find(m => m.codigo === item.upc || m.upc === item.upc);
              if (entry && entry.upc && entry.upc !== item.upc) {
                mapped++;
                return { ...item, upc: entry.upc };
              }
              return item;
            });
            return NextResponse.json({ items, mapped, warning: mapped > 0 ? undefined : 'No se encontraron coincidencias con el maestro de UPCs' });
          } catch {
            return NextResponse.json({ error: 'Formato inválido de upcMaster' }, { status: 400 });
          }
        }

        return NextResponse.json({ items });
      }
 
      if (action === 'upload-upc-master') {
        const file = formData.get('file') as File;
        if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        const buffer = Buffer.from(await file.arrayBuffer());
        const result = await parseUpcMaster(buffer, file.name);
        return NextResponse.json(result);
      }

      if (action === 'upload-transfer') {
        const batchId = formData.get('batchId') as string;
        const file = formData.get('file') as File;
        const upcMasterStr = formData.get('upcMaster') as string;

        if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

        const { data: batch, error: batchError } = await adminDb
          .from('pistoleo_batches')
          .select('id')
          .eq('id', batchId)
          .single();
        if (batchError || !batch) {
          return NextResponse.json({ error: 'Lote no encontrado' }, { status: 404 });
        }

        const upcMaster = upcMasterStr ? (JSON.parse(upcMasterStr) as Array<{ codigo: string; upc: string }>) : null;
        const items = await parseInventoryExcel(await file.arrayBuffer(), {
          upc: 'Producto',
          description: 'Descripción',
          quantity: 'Cantidad',
        });

        const enrichedItems = items.map(item => {
          let upc = item.upc;
          if (upcMaster) {
            const masterEntry = upcMaster.find(m => m.codigo === item.upc || m.upc === item.upc);
            if (masterEntry) upc = masterEntry.upc || item.upc;
          }
          return { ...item, upc };
        });

        const uniqueItems = enrichedItems.reduce<typeof enrichedItems>((acc, item) => {
          if (!acc.find(i => i.upc === item.upc)) acc.push(item);
          return acc;
        }, []);

        const inventoryDocs = uniqueItems.map(item => ({
          batch_id: batchId,
          upc: item.upc,
          description: item.description,
          expected_quantity: Math.round(Number(item.expectedQuantity) || 0),
          actual_quantity: 0,
          status: (Number(item.expectedQuantity) || 0) > 0 ? 'missing' : 'complete',
        }));

        const { error: upsertError } = await adminDb
          .from('pistoleo_inventory')
          .upsert(inventoryDocs, { onConflict: 'batch_id,upc' });

        if (upsertError) throw upsertError;

        return NextResponse.json({ message: `Transferencia importada: ${uniqueItems.length} items`, count: uniqueItems.length });
      }

      if (action === 'upload-pdf') {
        const batchId = formData.get('batchId') as string;
        const file = formData.get('file') as File;
        const upcMasterStr = formData.get('upcMaster') as string;

        if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

        // Validate batch exists
        const { data: batch, error: batchError } = await adminDb
          .from('pistoleo_batches')
          .select('id')
          .eq('id', batchId)
          .single();
        if (batchError || !batch) {
          return NextResponse.json({ error: 'Lote no encontrado' }, { status: 404 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        let items = await parseInventoryPdf(buffer);

        // Apply UPC master mapping
        if (upcMasterStr) {
          try {
            const upcMaster = JSON.parse(upcMasterStr) as Array<{ codigo: string; upc: string }>;
            items = items.map(item => {
              const entry = upcMaster.find(m => m.codigo === item.upc || m.upc === item.upc);
              if (entry && entry.upc && entry.upc !== item.upc) {
                return { ...item, upc: entry.upc };
              }
              return item;
            });
          } catch {
            return NextResponse.json({ error: 'Formato inválido de upcMaster' }, { status: 400 });
          }
        }

        // Deduplicate by UPC
        const uniqueItems = items.reduce<typeof items>((acc, item) => {
          if (!acc.find(i => i.upc === item.upc)) acc.push(item);
          return acc;
        }, []);

        const inventoryDocs = uniqueItems.map(item => ({
          batch_id: batchId,
          upc: item.upc,
          description: item.description,
          expected_quantity: Math.round(Number(item.quantity) || 0),
          actual_quantity: 0,
          status: (Number(item.quantity) || 0) > 0 ? 'missing' : 'complete',
        }));

        const { error: upsertError } = await adminDb
          .from('pistoleo_inventory')
          .upsert(inventoryDocs, { onConflict: 'batch_id,upc' });

        if (upsertError) throw upsertError;

        return NextResponse.json({ message: `Imported ${uniqueItems.length} items` });
      }
 
      if (action === 'commit-inventory') {
        const batchId = formData.get('batchId') as string;
        const itemsStr = formData.get('items') as string;
        const upcMasterStr = formData.get('upcMaster') as string;

        if (!batchId || !itemsStr) {
          return NextResponse.json({ error: 'Missing batchId or items' }, { status: 400 });
        }

        // Validate batch exists
        const { data: batch, error: batchError } = await adminDb
          .from('pistoleo_batches')
          .select('id')
          .eq('id', batchId)
          .single();
        if (batchError || !batch) {
          return NextResponse.json({ error: 'Lote no encontrado' }, { status: 404 });
        }

        try {
          let items = JSON.parse(itemsStr) as Array<{ upc: string; description: string; quantity: number }>;

          // Apply UPC master mapping
          if (upcMasterStr) {
            try {
              const upcMaster = JSON.parse(upcMasterStr) as Array<{ codigo: string; upc: string }>;
              items = items.map(item => {
                const entry = upcMaster.find(m => m.codigo === item.upc || m.upc === item.upc);
                if (entry && entry.upc && entry.upc !== item.upc) {
                  return { ...item, upc: entry.upc };
                }
                return item;
              });
            } catch {
              return NextResponse.json({ error: 'Formato inválido de upcMaster' }, { status: 400 });
            }
          }
          
          // Deduplicate by UPC
          const uniqueItems = items.reduce<typeof items>((acc, item) => {
            if (!acc.find(i => i.upc === item.upc)) acc.push(item);
            return acc;
          }, []);

          const inventoryDocs = uniqueItems.map((item: typeof items[0]) => ({
            batch_id: batchId,
            upc: item.upc,
            description: item.description,
            expected_quantity: Math.round(Number(item.quantity) || 0),
            actual_quantity: 0,
            status: (Number(item.quantity) || 0) > 0 ? 'missing' : 'complete',
          }));

          // Use upsert to handle both new and existing inventory items
          const { error: upsertError, data } = await adminDb
            .from('pistoleo_inventory')
            .upsert(inventoryDocs, { onConflict: 'batch_id,upc' });

          if (upsertError) {
            console.error('Upsert error:', upsertError);
            throw upsertError;
          }

          return NextResponse.json({ message: `Committed ${uniqueItems.length} items`, data });
        } catch (e: unknown) {
          console.error('Commit inventory error:', e);
          const error = e as { message?: string; details?: string; code?: string; hint?: string };
          return NextResponse.json({ 
            error: error.message || 'Commit failed',
            details: error.details,
            code: error.code,
            hint: error.hint
          }, { status: 500 });
        }
      }

      if (action === 'clear-inventory') {
        const batchId = formData.get('batchId') as string;

        if (!batchId) {
          return NextResponse.json({ error: 'Missing batchId' }, { status: 400 });
        }

        try {
          // Delete inventory items only (keep the batch)
          const { error: invError } = await adminDb
            .from('pistoleo_inventory')
            .delete()
            .eq('batch_id', batchId);

          if (invError) throw invError;

          return NextResponse.json({ message: 'Inventory cleared successfully' });
        } catch (e: unknown) {
          const error = e as { message?: string };
          return NextResponse.json({ error: error.message || 'Clear failed' }, { status: 500 });
        }
      }
 
      if (action === 'upload-excel') {
        const batchId = formData.get('batchId') as string;
        const file = formData.get('file') as File;
        const mappingStr = formData.get('mapping') as string;

        if (!file || !mappingStr) {
          return NextResponse.json({ error: 'Missing file or mapping' }, { status: 400 });
        }

        // Validate batch exists
        const { data: batch, error: batchError } = await adminDb
          .from('pistoleo_batches')
          .select('id')
          .eq('id', batchId)
          .single();
        if (batchError || !batch) {
          return NextResponse.json({ error: 'Lote no encontrado' }, { status: 404 });
        }

        try {
          const mapping = JSON.parse(mappingStr);
          const buffer = await file.arrayBuffer();
          const items = await parseInventoryExcel(buffer, mapping);

          // Deduplicate by UPC
          interface ExcelParsedItem { upc: string; description: string; expectedQuantity: number; }
          const uniqueItems = items.reduce<ExcelParsedItem[]>((acc, item) => {
            if (!acc.find(i => i.upc === item.upc)) acc.push(item);
            return acc;
          }, []);

          const inventoryDocs = uniqueItems.map(item => ({
            batch_id: batchId,
            upc: item.upc,
            description: item.description,
            expected_quantity: Math.round(Number(item.expectedQuantity) || 0),
            actual_quantity: 0,
            status: (Number(item.expectedQuantity) || 0) > 0 ? 'missing' : 'complete',
          }));

          const { error: upsertError } = await adminDb
            .from('pistoleo_inventory')
            .upsert(inventoryDocs, { onConflict: 'batch_id,upc' });

          if (upsertError) throw upsertError;

          return NextResponse.json({ message: `Imported ${uniqueItems.length} items from Excel` });
        } catch (e: unknown) {
          console.error('Excel import error:', e);
          const error = e as { message?: string; details?: string; code?: string; hint?: string };
          return NextResponse.json({ 
            error: error.message || 'Excel processing failed',
            details: error.details,
            code: error.code,
            hint: error.hint
          }, { status: 500 });
        }
      }

    } else {
      const body = await req.json();
      if (body.action === 'scan') {
        const { batchId, upc } = body;
        
        if (!authUser) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Validate batch access
        const { data: batch, error: batchError } = await adminDb
          .from('pistoleo_batches')
          .select('id, created_by')
          .eq('id', batchId)
          .single();

        const typedBatch = batch as BatchRow | null;

        if (batchError || !typedBatch) {
          return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
        }

        // Check if user has access to this batch
        const hasAccess = authUser.role === 'admin' || typedBatch.created_by === authUser.id;
        if (!hasAccess) {
          // Check if user has scanned this batch before
          const { data: existingScan } = await adminDb
            .from('pistoleo_scans')
            .select('id')
            .eq('batch_id', batchId)
            .eq('user_id', authUser.id)
            .limit(1)
            .single();
          
          if (!existingScan) {
            return NextResponse.json({ error: 'Forbidden: No access to this batch' }, { status: 403 });
          }
        }

        const updatedInventory = await processScan(batchId, upc);

        await adminDb.from('pistoleo_scans').insert({
          batch_id: batchId,
          upc,
          user_id: authUser.id,
        });

        return NextResponse.json(updatedInventory);
      }

      if (body.action === 'undo-scan') {
        const { batchId, upc } = body;
        
        if (!authUser) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Validate batch access
        const { data: batch, error: batchError } = await adminDb
          .from('pistoleo_batches')
          .select('id, created_by')
          .eq('id', batchId)
          .single();

        const typedBatch = batch as BatchRow | null;

        if (batchError || !typedBatch) {
          return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
        }

        const hasAccess = authUser.role === 'admin' || typedBatch.created_by === authUser.id;
        if (!hasAccess) {
          return NextResponse.json({ error: 'Forbidden: No access to this batch' }, { status: 403 });
        }

        // Find the inventory item
        const { data: inventory, error: invError } = await adminDb
          .from('pistoleo_inventory')
          .select('*')
          .eq('batch_id', batchId)
          .eq('upc', upc)
          .single();

        const typedInventory = inventory as InventoryRow | null;

        if (invError || !typedInventory) {
          return NextResponse.json({ error: 'Item not found in batch' }, { status: 404 });
        }

        if (typedInventory.actual_quantity <= 0) {
          return NextResponse.json({ error: 'Quantity already at zero' }, { status: 400 });
        }

        const newActual = typedInventory.actual_quantity - 1;

        let status: string;
        if (newActual === 0) {
          status = 'missing';
        } else if (newActual < typedInventory.expected_quantity) {
          status = 'partial';
        } else if (newActual === typedInventory.expected_quantity) {
          status = 'complete';
        } else {
          status = 'over';
        }

        const { data: updated, error: updateError } = await adminDb
          .from('pistoleo_inventory')
          .update({ actual_quantity: newActual, status })
          .eq('id', typedInventory.id)
          .select()
          .single();

        if (updateError) throw updateError;

        // Also delete the latest scan record for this user/batch/upc
        const { data: latestScan } = await adminDb
          .from('pistoleo_scans')
          .select('id')
          .eq('batch_id', batchId)
          .eq('upc', upc)
          .eq('user_id', authUser.id)
          .order('scanned_at', { ascending: false })
          .limit(1)
          .single();

        if (latestScan) {
          await adminDb.from('pistoleo_scans').delete().eq('id', latestScan.id);
        }

        return NextResponse.json({
          _id: updated.id,
          id: updated.id,
          batchId: updated.batch_id,
          upc: updated.upc,
          description: updated.description,
          expectedQuantity: updated.expected_quantity,
          actualQuantity: updated.actual_quantity,
          status: updated.status,
          updatedAt: updated.updated_at,
        });
      }
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
