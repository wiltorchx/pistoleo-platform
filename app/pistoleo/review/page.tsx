"use client";
import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/atoms/Button';
import { t } from '@/lib/pistoleo/i18n';
import { Trash2, Save, AlertCircle, CheckCircle2, PackageSearch } from 'lucide-react';

interface InventoryItem {
  upc: string;
  description: string;
  quantity: number;
}

export default function InventoryReviewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const batchId = searchParams.get('batchId');
  
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const storedItems = sessionStorage.getItem('pending_inventory');
    if (storedItems) {
      setItems(JSON.parse(storedItems));
    } else {
      setError("No hay datos pendientes de revisión. Por favor, suba un archivo en el Wizard.");
    }
    setIsLoading(false);
  }, []);

  const handleUpdateItem = (index: number, field: keyof InventoryItem, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleCommit = async () => {
    if (!batchId) {
      setError("No se encontró el ID del lote.");
      return;
    }

    setIsSaving(true);
    try {
      const body = new FormData();
      body.append('action', 'commit-inventory');
      body.append('batchId', batchId);
      body.append('items', JSON.stringify(items));

      const res = await fetch('/api/pistoleo', { method: 'POST', body });
      if (!res.ok) throw new Error("Error al guardar el inventario");
      
      sessionStorage.removeItem('pending_inventory');
      router.push(`/pistoleo/${batchId}`);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <div className="flex h-screen items-center justify-center">Cargando inventario...</div>;

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <PackageSearch className="w-8 h-8 text-primary-600" />
              Revisión de Mercadería
            </h1>
            <p className="text-neutral-500 mt-1">Verifica y ajusta los datos extraídos del PDF antes de confirmar.</p>
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => router.back()}>Volver</Button>
            <Button 
              variant="primary" 
              disabled={isSaving || items.length === 0} 
              onClick={handleCommit}
              className="gap-2"
            >
              {isSaving ? 'Guardando...' : <><Save className="w-4 h-4" /> Confirmar Inventario</>}
            </Button>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Stats Panel */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white dark:bg-neutral-900 p-6 rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-800 space-y-4">
              <h3 className="font-semibold text-neutral-600 dark:text-neutral-400 uppercase text-xs tracking-wider">Resumen del Lote</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Total Ítems:</span>
                  <span className="font-mono font-bold">{items.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Suma Cantidades:</span>
                  <span className="font-mono font-bold">{items.reduce((acc, item) => acc + item.quantity, 0)}</span>
                </div>
                <div className="flex justify-between items-center text-red-600">
                  <span className="text-sm">Cantidades Zero:</span>
                  <span className="font-mono font-bold">{items.filter(i => i.quantity === 0).length}</span>
                </div>
              </div>
            </div>
            
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-2xl border border-blue-100 dark:border-blue-800">
              <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                <strong>Tip Industrial:</strong> Los campos resaltados en rojo indican cantidades cero. Asegúrate de que sean correctos para evitar errores en el pistoleo.
              </p>
            </div>
          </div>

          {/* Main Table */}
          <div className="lg:col-span-3 bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-neutral-50 dark:bg-neutral-800/50 border-b border-neutral-200 dark:border-neutral-800">
                  <tr>
                    <th className="p-4 text-sm font-semibold text-neutral-600 dark:text-neutral-400">UPC / Código</th>
                    <th className="p-4 text-sm font-semibold text-neutral-600 dark:text-neutral-400">Descripción</th>
                    <th className="p-4 text-sm font-semibold text-neutral-600 dark:text-neutral-400 w-32">Cantidad</th>
                    <th className="p-4 text-sm font-semibold text-neutral-600 dark:text-neutral-400 w-16"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {items.map((item, index) => (
                    <tr key={index} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors group">
                      <td className="p-2">
                        <input 
                          type="text" 
                          value={item.upc}
                          onChange={e => handleUpdateItem(index, 'upc', e.target.value)}
                          className="w-full p-2 rounded-lg border border-transparent focus:border-primary-500 bg-transparent outline-none font-mono text-sm"
                        />
                      </td>
                      <td className="p-2">
                        <input 
                          type="text" 
                          value={item.description}
                          onChange={e => handleUpdateItem(index, 'description', e.target.value)}
                          className="w-full p-2 rounded-lg border border-transparent focus:border-primary-500 bg-transparent outline-none text-sm"
                        />
                      </td>
                      <td className="p-2">
                        <input 
                          type="number" 
                          value={item.quantity}
                          onChange={e => handleUpdateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                          className={`w-full p-2 rounded-lg border ${item.quantity === 0 ? 'border-red-200 bg-red-50 dark:bg-red-900/20 text-red-600' : 'border-transparent bg-transparent'} focus:border-primary-500 outline-none text-sm font-bold`}
                        />
                      </td>
                      <td className="p-2 text-right">
                        <button 
                          onClick={() => handleRemoveItem(index)}
                          className="p-2 text-neutral-400 hover:text-red-600 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {items.length === 0 && (
                <div className="p-12 text-center text-neutral-500">
                  No hay ítems para revisar.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
