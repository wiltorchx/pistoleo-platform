'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/atoms/Button';
import { useBarcodeScanner } from '@/hooks/useBarcodeScanner';

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
  const [summary, setSummary] = useState<ComparisonSummary | null>(null);
  const [lastScanned, setLastScanned] = useState<InventoryItem | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [scanFeedback, setScanFeedback] = useState<'success' | 'error' | 'warning' | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const videoRef = useRef<HTMLVideoElement>(null);

  const fetchSummary = useCallback(async () => {
    try {
      const res = await fetch(`/api/pistoleo/${id}`);
      const data = await res.json();
      setSummary(data);
    } catch (_e) {
      console.error('Error fetching summary:', _e);
    }
  }, [id]);

  const handleScan = useCallback(async (upc: string) => {
    try {
      const res = await fetch('/api/pistoleo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'scan',
          batchId: id,
          upc: upc,
          userId: 'admin-id', // Placeholder
        }),
      });

      if (res.ok) {
        const updatedItem = await res.json();
        setLastScanned(updatedItem);
        setScanFeedback('success');
        await fetchSummary();
      } else {
        setScanFeedback('error');
      }
    } catch {
      setScanFeedback('error');
    } finally {
      setTimeout(() => setScanFeedback(null), 1000);
    }
  }, [id, fetchSummary]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSummary();
    }, 0);
    return () => clearTimeout(timer);
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
          
          // BarcodeDetector API check
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

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      scanFeedback === 'success' ? 'bg-green-50' : 
      scanFeedback === 'error' ? 'bg-red-50' : 
      scanFeedback === 'warning' ? 'bg-yellow-50' : 'bg-neutral-50'
    } dark:bg-neutral-950`}>
      
      <div className="page-container py-8 px-4 lg:px-0">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold">Scanning Session</h1>
            <p className="text-neutral-500">Batch ID: {id}</p>
          </div>
          <div className="flex gap-3">
            <Button 
              variant={isCameraActive ? 'primary' : 'outline'} 
              onClick={() => setIsCameraActive(!isCameraActive)}
            >
              {isCameraActive ? 'Close Camera' : 'Open Camera'}
            </Button>
            <Button 
              variant="outline" 
              className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
              onClick={() => window.open(`/api/pistoleo/${id}/report`, '_blank')}
            >
              Download Report
            </Button>
            <Button 
              variant="ghost" 
              className="text-red-500 hover:text-red-700"
              onClick={async () => {
                if (confirm('Close this session? It will be marked as completed.')) {
                  await fetch(`/api/pistoleo/${id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: 'completed' }),
                  });
                  window.history.back();
                }
              }}
            >
              Close Session
            </Button>
            <Button variant="ghost" onClick={() => window.history.back()}>Back</Button>
          </div>
        </div>

        {/* Progress Section */}
        <div className="bg-white dark:bg-neutral-900 p-6 rounded-2xl shadow-sm mb-8 space-y-4">
          <div className="flex justify-between items-center">
            <span className="font-semibold">Overall Progress</span>
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
              <div className="text-xs text-neutral-500 uppercase">Complete</div>
              <div className="text-xl font-bold">{summary?.complete || 0}</div>
            </div>
            <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800">
              <div className="text-xs text-neutral-500 uppercase">Partial</div>
              <div className="text-xl font-bold">{summary?.partial || 0}</div>
            </div>
            <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800">
              <div className="text-xs text-neutral-500 uppercase">Missing</div>
              <div className="text-xl font-bold">{summary?.missing || 0}</div>
            </div>
            <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800">
              <div className="text-xs text-neutral-500 uppercase">Over</div>
              <div className="text-xl font-bold">{summary?.over || 0}</div>
            </div>
          </div>
        </div>

        {/* Camera View */}
        {isCameraActive && (
          <div className="mb-8 bg-black rounded-3xl overflow-hidden relative aspect-video max-w-2xl mx-auto shadow-2xl">
            <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline></video>
            <div className="absolute inset-0 border-2 border-primary-600/50 m-20 rounded-lg pointer-events-none" />
            <div className="absolute top-4 left-4 bg-black/50 text-white px-3 py-1 rounded-full text-xs">
              Camera Active
            </div>
          </div>
        )}

        {/* Last Scanned Item */}
        {lastScanned && (
          <div className="mb-8 p-6 bg-primary-600 text-white rounded-3xl shadow-lg animate-in slide-in-from-bottom-4 duration-300">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-primary-100 text-sm uppercase font-bold">Last Scanned</p>
                <h2 className="text-2xl font-bold">{lastScanned.description}</h2>
                <p className="opacity-80">UPC: {lastScanned.upc}</p>
              </div>
              <div className="text-4xl font-black">
                {lastScanned.actualQuantity} / {lastScanned.expectedQuantity}
              </div>
            </div>
          </div>
        )}

        {/* Inventory List */}
        <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-neutral-50 dark:bg-neutral-800 text-neutral-500 text-sm uppercase">
              <tr>
                <th className="p-4 font-medium">Product</th>
                <th className="p-4 font-medium text-center">Count</th>
                <th className="p-4 font-medium text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {summary?.items.map(item => (
                <tr key={item._id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
                  <td className="p-4">
                    <div className="font-medium">{item.description}</div>
                    <div className="text-xs text-neutral-400">{item.upc}</div>
                  </td>
                  <td className="p-4 text-center">
                    {editingId === item._id ? (
                      <input 
                        type="number" 
                        className="w-20 p-1 border rounded text-center font-bold bg-white dark:bg-neutral-800"
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
                        className={`font-bold cursor-pointer hover:underline ${item.actualQuantity < item.expectedQuantity ? 'text-red-500' : 'text-green-600'}`}
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
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      item.status === 'complete' ? 'bg-green-100 text-green-700' : 
                      item.status === 'partial' ? 'bg-yellow-100 text-yellow-700' : 
                      'bg-red-100 text-red-700'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
