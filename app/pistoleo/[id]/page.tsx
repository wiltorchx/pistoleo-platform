'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/atoms/Button';
import { useBarcodeScanner } from '@/hooks/useBarcodeScanner';
import { playScanSound } from '@/lib/pistoleo/audio';
import { addScanToQueue, getCachedInventory, updateInventoryCache, removeLastScan } from '@/lib/pistoleo/db';
import { syncPendingScans } from '@/lib/pistoleo/sync';
import { requestWakeLock, triggerHapticFeedback } from '@/lib/pistoleo/hardware';

interface BarcodeDetectorQueryResult {
  rawValue: string;
  format: string;
  boundingBox: { x: number; y: number; width: number; height: number };
  cornerPoints: Array<{ x: number; y: number }>;
}

interface BarcodeDetector {
  detect(videoElement: HTMLVideoElement): Promise<BarcodeDetectorQueryResult[]>;
}

declare global {
  interface Window {
    BarcodeDetector: new (options?: { formats: string[] }) => BarcodeDetector;
  }
}

interface InventoryItem {
  _id: string;
  upc: string;
  description: string;
  expectedQuantity: number;
  actualQuantity: number;
  status: string;
}

interface ComparisonSummary {
  totalItems: number;
  complete: number;
  partial: number;
  missing: number;
  over: number;
  items: InventoryItem[];
}

export default function PistoleoScanner() {
  const { id } = useParams();
  const router = useRouter();
  const [summary, setSummary] = useState<ComparisonSummary | null>(null);
  const [lastScanned, setLastScanned] = useState<InventoryItem | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [scanFeedback, setScanFeedback] = useState<'success' | 'error' | 'warning' | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [syncStatus, setSyncStatus] = useState('Sincronizado');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMissing, setFilterMissing] = useState(false);
  const [industrialMode, setIndustrialMode] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const lastScanTime = useRef<number>(0);
  const lastScanUpc = useRef<string>('');

  const fetchSummary = useCallback(async () => {
    try {
      const res = await fetch(`/api/pistoleo/${id}`);
      if (res.ok) {
        const data = await res.json();
        setSummary(data);
        if (data.items) {
          await updateInventoryCache(data.items);
        }
      } else {
        const cached = await getCachedInventory(id as string);
        if (cached.length > 0) {
          setSummary({
            totalItems: cached.length,
            complete: cached.filter(i => i.status === 'complete').length,
            partial: cached.filter(i => i.status === 'partial').length,
            missing: cached.filter(i => i.status === 'missing').length,
            over: cached.filter(i => i.status === 'over').length,
            items: cached,
          });
        }
      }
    } catch (_e) {
      console.error('Error fetching summary:', _e);
    }
  }, [id]);

  const handleScan = useCallback(async (upc: string) => {
    const now = Date.now();
    
    // Double-scan detection: ignore if same UPC within 1.5 seconds
    if (upc === lastScanUpc.current && (now - lastScanTime.current) < 1500) {
      console.log('Double scan detected, ignoring...');
      return;
    }
    
    lastScanTime.current = now;
    lastScanUpc.current = upc;

    try {
      await addScanToQueue({
        batchId: id as string,
        upc: upc,
        timestamp: now,
        status: 'pending',
      });

      syncPendingScans(id as string, (status) => setSyncStatus(status));

      const res = await fetch('/api/pistoleo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'scan',
          batchId: id,
          upc: upc,
          userId: 'admin-id',
        }),
      });

      if (res.ok) {
        const updatedItem = await res.json();
        setLastScanned(updatedItem);
        setScanFeedback('success');
        
        if (updatedItem.status === 'complete') {
          playScanSound('success');
          triggerHapticFeedback('success');
        } else if (updatedItem.status === 'over') {
          playScanSound('over');
          triggerHapticFeedback('warning');
        } else {
          playScanSound('unknown');
          triggerHapticFeedback('warning');
        }
        await fetchSummary();
      } else {
        setScanFeedback('error');
        playScanSound('unknown');
        triggerHapticFeedback('error');
      }
    } catch {
      setScanFeedback('error');
      playScanSound('unknown');
      triggerHapticFeedback('error');
    } finally {
      setTimeout(() => setScanFeedback(null), 1000);
    }
  }, [id, fetchSummary]);

  const handleUndo = useCallback(async () => {
    if (!confirm('¿Deseas deshacer el último escaneo?')) return;
    
    try {
      const removed = await removeLastScan(id as string);
      if (removed) {
        // In a real app, we would call a server API to decrement quantity
        // For now, we refresh the summary to reflect whatever state the server has
        // or if we implement a server-side undo.
        await fetchSummary();
        setLastScanned(null);
        setScanFeedback('warning');
        triggerHapticFeedback('warning');
      } else {
        alert('No hay escaneos para deshacer');
      }
    } catch (e) {
      console.error('Undo error:', e);
      alert('Error al deshacer el escaneo');
    }
  }, [id, fetchSummary]);

  useEffect(() => {
    async function setupHardware() {
      wakeLockRef.current = await requestWakeLock();
    }
    setupHardware();

    const timer = setTimeout(() => {
      fetchSummary();
    }, 0);
    return () => {
      clearTimeout(timer);
      if (wakeLockRef.current) wakeLockRef.current.release();
    };
  }, [id, fetchSummary]);

  useBarcodeScanner(handleScan);

  async function handleUpdateQuantity(itemId: string) {
    try {
      const res = await fetch(`/api/pistoleo/inventory/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actualQuantity: parseInt(editValue) || 0 }),
      });
      if (res.ok) {
        setEditingId(null);
        await fetchSummary();
      }
    } catch (_e) {
      console.error('Update error:', _e);
    }
  }

  useEffect(() => {
    if (isCameraActive && videoRef.current) {
      const videoEl = videoRef.current;
      async function startCamera() {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'environment' } 
          });
          if (videoEl) {
            videoEl.srcObject = stream;
          }
          
            if ('BarcodeDetector' in window) {
              const detector = new window.BarcodeDetector({ formats: ['code_128', 'ean_13', 'qr_code'] });
            
            const scanLoop = async () => {
              if (!videoEl || !isCameraActive) return;
              try {
                const barcodes = await detector.detect(videoEl);
                if (barcodes.length > 0) {
                  handleScan(barcodes[0].rawValue);
                }
              } catch (_e) {
                console.error('Scan error:', _e);
              }
              requestAnimationFrame(scanLoop);
            };
            scanLoop();
          } else {
            console.warn('BarcodeDetector API not supported in this browser.');
          }
        } catch (_e) {
          console.error('Camera access denied:', _e);
        }
      }
      startCamera();
    
      return () => {
        if (videoEl && videoEl.srcObject) {
          (videoEl.srcObject as MediaStream).getTracks().forEach(track => track.stop());
        }
      };
    }
  }, [isCameraActive, handleScan]);

  const progress = summary 
    ? (summary.complete / summary.totalItems) * 100 
    : 0;

  const filteredItems = summary?.items.filter(item => {
    const matchesSearch = item.description.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         item.upc.includes(searchQuery);
    const matchesMissing = filterMissing ? item.status === 'missing' : true;
    return matchesSearch && matchesMissing;
  }) || [];

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      industrialMode 
        ? 'bg-black text-yellow-400' 
        : scanFeedback === 'success' ? 'bg-green-50 flash-success' : 
          scanFeedback === 'error' ? 'bg-red-50 flash-error' : 
          scanFeedback === 'warning' ? 'bg-yellow-50 flash-warning' : 'bg-neutral-50'
    } dark:bg-neutral-950`}>
      
      <div className="page-container py-8 px-4 lg:px-0">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl font-bold">Sesión de Pistoleo</h1>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                syncStatus === 'Sincronizado' ? 'bg-green-100 text-green-700' : 
                syncStatus.includes('Sincronizando') ? 'bg-blue-100 text-blue-700' : 
                'bg-red-100 text-red-700'
              }`}>
                {syncStatus}
              </span>
            </div>
            <p className="text-neutral-500">Lote: {id}</p>
          </div>
          <div className="flex gap-3">
            <Button 
              variant={isCameraActive ? 'primary' : 'outline'} 
              onClick={() => setIsCameraActive(!isCameraActive)}
            >
              {isCameraActive ? 'Cerrar Cámara' : 'Abrir Cámara'}
            </Button>
            <Button 
              variant="outline" 
              className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
              onClick={() => window.open(`/api/pistoleo/${id}/report`, '_blank')}
            >
              Descargar Reporte
            </Button>
            <Button 
              variant="ghost" 
              className="text-red-500 hover:text-red-700"
              onClick={() => router.push(`/pistoleo/${id}/close`)}
            >
              Cerrar Sesión
            </Button>
            <Button 
              variant={industrialMode ? 'primary' : 'outline'} 
              className={industrialMode ? 'bg-yellow-400 text-black border-yellow-400' : ''}
              onClick={() => setIndustrialMode(!industrialMode)}
            >
              {industrialMode ? 'Modo Normal' : 'Modo Industrial'}
            </Button>
            <Button variant="ghost" onClick={() => window.history.back()}>Volver</Button>
          </div>
        </div>
        
        <div className="bg-white dark:bg-neutral-900 p-6 rounded-2xl shadow-sm mb-8 space-y-4">
          <div className="flex justify-between items-center">
            <span className="font-semibold">Progreso General</span>
            <span className="text-primary-600 font-bold">{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-neutral-200 dark:bg-neutral-800 h-4 rounded-full overflow-hidden">
            <div 
              className="bg-primary-600 h-full transition-all duration-500" 
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800">
              <div className="text-xs text-neutral-500 uppercase">Completos</div>
              <div className="text-xl font-bold">{summary?.complete || 0}</div>
            </div>
            <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800">
              <div className="text-xs text-neutral-500 uppercase">Parciales</div>
              <div className="text-xl font-bold">{summary?.partial || 0}</div>
            </div>
            <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800">
              <div className="text-xs text-neutral-500 uppercase">Faltantes</div>
              <div className="text-xl font-bold">{summary?.missing || 0}</div>
            </div>
            <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800">
              <div className="text-xs text-neutral-500 uppercase">Sobrantes</div>
              <div className="text-xl font-bold">{summary?.over || 0}</div>
            </div>
          </div>
        </div>
        
        {isCameraActive && (
          <div className="mb-8 bg-black rounded-3xl overflow-hidden relative aspect-video max-w-2xl mx-auto shadow-2xl">
            <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline></video>
            <div className="absolute inset-0 border-2 border-primary-600/50 m-20 rounded-lg pointer-events-none" />
            <div className="absolute top-4 left-4 bg-black/50 text-white px-3 py-1 rounded-full text-xs">
              Cámara Activa
            </div>
          </div>
        )}
        
        {lastScanned && (
          <div className="mb-8 p-6 bg-primary-600 text-white rounded-3xl shadow-lg animate-in slide-in-from-bottom-4 duration-300">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-primary-100 text-sm uppercase font-bold">Último Escaneado</p>
                <h2 className="text-2xl font-bold">{lastScanned.description}</h2>
                <p className="opacity-80">UPC: {lastScanned.upc}</p>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-4xl font-black">
                  {lastScanned.actualQuantity} / {lastScanned.expectedQuantity}
                </div>
                <Button 
                  variant="outline" 
                  className="bg-white/20 text-white border-white/30 hover:bg-white/30"
                  onClick={handleUndo}
                >
                  Deshacer
                </Button>
              </div>
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="flex flex-col space-y-4">
            <div className="flex flex-col gap-3 px-2">
              <div className="flex justify-between items-center">
                <h2 className="font-bold text-lg flex items-center gap-2">
                  <span>📋</span> Resultados
                </h2>
                <span className="text-xs font-medium bg-neutral-200 dark:bg-neutral-800 px-2 py-1 rounded-full">
                  {filteredItems.length} / {summary?.items.length || 0}
                </span>
              </div>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Buscar producto..." 
                  className="flex-1 p-2 text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 outline-none focus:ring-2 focus:ring-primary-600"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
                <Button 
                  variant={filterMissing ? 'primary' : 'outline'} 
                  className="text-xs h-9 px-3"
                  onClick={() => setFilterMissing(!filterMissing)}
                >
                  {filterMissing ? 'Ver Todos' : 'Solo Faltantes'}
                </Button>
              </div>
            </div>
            <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-sm overflow-hidden border border-neutral-200 dark:border-neutral-800">
              <div className="max-h-[600px] overflow-y-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 bg-neutral-50 dark:bg-neutral-800 text-neutral-500 text-xs uppercase">
                    <tr>
                      <th className="p-4 font-medium">Producto</th>
                      <th className="p-4 font-medium text-center">Cant.</th>
                      <th className="p-4 font-medium text-right">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                    {filteredItems.map(item => (
                      <tr key={item._id} className={`hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors ${item.status === 'missing' ? 'bg-red-50/30 dark:bg-red-900/10' : ''}`}>
                        <td className="p-4">
                          <div className="font-medium text-sm truncate max-w-[150px]">{item.description}</div>
                          <div className="text-[10px] text-neutral-400">{item.upc}</div>
                        </td>
                        <td className="p-4 text-center">
                          {editingId === item._id ? (
                            <input 
                              type="number" 
                              className="w-16 p-1 border rounded text-center font-bold bg-white dark:bg-neutral-800 text-sm"
                              value={editValue}
                              onChange={e => setEditValue(e.target.value)}
                              onBlur={() => handleUpdateQuantity(item._id)}
                              onKeyDown={e => {
                                if (e.key === 'Enter') handleUpdateQuantity(item._id);
                                if (e.key === 'Escape') setEditingId(null);
                              }}
                              autoFocus
                            />
                          ) : (
                            <span 
                              className={`font-bold cursor-pointer hover:underline text-sm ${item.actualQuantity < item.expectedQuantity ? 'text-red-500' : 'text-green-600'}`}
                              onClick={() => {
                                setEditingId(item._id);
                                setEditValue(item.actualQuantity.toString());
                              }}
                            >
                              {item.actualQuantity} / {item.expectedQuantity}
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          <span className={`text-[10px] px-2 py-1 rounded-full font-medium ${
                            item.status === 'complete' ? 'bg-green-100 text-green-700' : 
                            item.status === 'partial' ? 'bg-yellow-100 text-yellow-700' : 
                            'bg-red-100 text-red-700'
                          }`}>
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {filteredItems.length === 0 && (
                      <tr>
                        <td colSpan={3} className="p-8 text-center text-neutral-400 text-sm">
                          No se encontraron productos
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col space-y-4">
            <div className="flex justify-between items-center px-2">
              <h2 className="font-bold text-lg flex items-center gap-2">
                <span>⚠️</span> Sobrantes / Fuera
              </h2>
              <span className="text-xs font-medium bg-yellow-200 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-500 px-2 py-1 rounded-full">
                {summary?.over || 0} items
              </span>
            </div>
            <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-sm overflow-hidden border border-neutral-200 dark:border-neutral-800">
              <div className="max-h-[600px] overflow-y-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 bg-neutral-50 dark:bg-neutral-800 text-neutral-500 text-xs uppercase">
                    <tr>
                      <th className="p-4 font-medium">Producto</th>
                      <th className="p-4 font-medium text-right">Exceso</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                    {summary?.items.filter(i => i.status === 'over').map(item => (
                      <tr key={item._id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
                        <td className="p-4">
                          <div className="font-medium text-sm truncate max-w-[150px]">{item.description}</div>
                          <div className="text-[10px] text-neutral-400">{item.upc}</div>
                        </td>
                        <td className="p-4 text-right font-bold text-yellow-600">
                          +{item.actualQuantity - item.expectedQuantity}
                        </td>
                      </tr>
                    ))}
                    {summary?.items.filter(i => i.status === 'over').length === 0 && (
                      <tr>
                        <td colSpan={2} className="p-8 text-center text-neutral-400 text-sm">
                          No hay sobrantes actualmente
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col space-y-4">
            <div className="flex justify-between items-center px-2">
              <h2 className="font-bold text-lg flex items-center gap-2">
                <span>🕒</span> Historial
              </h2>
              <Button 
                variant="ghost" 
                className="text-xs h-6 px-2" 
                onClick={() => setLastScanned(null)}
              >
                Limpiar
              </Button>
            </div>
            <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-sm overflow-hidden border border-neutral-200 dark:border-neutral-800">
              <div className="max-h-[600px] overflow-y-auto">
                <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  <div className="p-4 flex justify-between items-center text-sm">
                    <div>
                      <div className="font-medium">Escaneo realizado</div>
                      <div className="text-[10px] text-neutral-400">{new Date().toLocaleTimeString()}</div>
                    </div>
                    <div className="font-bold text-green-600">✓</div>
                  </div>
                  <div className="p-4 text-center text-neutral-400 text-xs py-10">
                    El historial detallado se activará con la conexión a DB
                  </div>
                </div>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
