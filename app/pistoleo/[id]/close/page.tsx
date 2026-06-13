'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/atoms/Button';

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

export default function CloseSessionPage() {
  const { id } = useParams();
  const router = useRouter();
  const [summary, setSummary] = useState<ComparisonSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    async function loadSummary() {
      try {
        const res = await fetch(`/api/pistoleo/${id}`);
        if (res.ok) {
          const data = await res.json();
          setSummary(data);
        }
      } catch (e) {
        console.error('Error loading summary:', e);
      } finally {
        setLoading(false);
      }
    }
    loadSummary();
    setupCanvas();
  }, [id]);

  const setupCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    draw(e);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.beginPath();
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let x, y;
    if ('touches' in e) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = (e as React.MouseEvent).clientX - rect.left;
      y = (e as React.MouseEvent).clientY - rect.top;
    }

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx?.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleFinalize = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const signatureData = canvas.toDataURL('image/png');

    try {
      const res = await fetch(`/api/pistoleo/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: 'completed',
          signature: signatureData,
          closedAt: new Date().toISOString()
        }),
      });

      if (res.ok) {
        alert('Sesión cerrada y firmada exitosamente');
        router.push('/dashboard');
      } else {
        alert('Error al cerrar la sesión');
      }
    } catch (e) {
      console.error('Finalize error:', e);
      alert('Error de conexión');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 py-8 px-4 lg:px-0">
      <div className="page-container max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold">Cierre de Sesión</h1>
            <p className="text-neutral-500">Lote: {id}</p>
          </div>
          <Button variant="ghost" onClick={() => router.back()}>Volver al Escáner</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="p-6 bg-white dark:bg-neutral-900 rounded-3xl shadow-sm border border-neutral-200 dark:border-neutral-800 text-center">
            <div className="text-xs text-neutral-500 uppercase mb-1">Total Productos</div>
            <div className="text-3xl font-bold">{summary?.totalItems || 0}</div>
          </div>
          <div className="p-6 bg-green-50 dark:bg-green-900/20 rounded-3xl shadow-sm border border-green-200 dark:border-green-800 text-center">
            <div className="text-xs text-green-600 dark:text-green-400 uppercase mb-1">Completos</div>
            <div className="text-3xl font-bold text-green-700 dark:text-green-300">{summary?.complete || 0}</div>
          </div>
          <div className="p-6 bg-red-50 dark:bg-red-900/20 rounded-3xl shadow-sm border border-red-200 dark:border-red-800 text-center">
            <div className="text-xs text-red-600 dark:text-red-400 uppercase mb-1">Faltantes</div>
            <div className="text-3xl font-bold text-red-700 dark:text-red-300">{summary?.missing || 0}</div>
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 p-8 rounded-3xl shadow-sm border border-neutral-200 dark:border-neutral-800 space-y-6">
          <div className="text-center max-w-md mx-auto mb-8">
            <h2 className="text-xl font-bold mb-2">Validación Final</h2>
            <p className="text-neutral-500 text-sm">
              Por favor, revise los totales anteriores. Al firmar, confirma que el conteo es correcto y la sesión ha finalizado.
            </p>
          </div>

          <div className="flex flex-col items-center gap-4">
            <div className="w-full max-w-lg">
              <canvas 
                ref={canvasRef} 
                width={600} 
                height={200} 
                className="w-full bg-neutral-50 dark:bg-neutral-800 border-2 border-dashed border-neutral-300 dark:border-neutral-700 rounded-2xl cursor-crosshair touch-none"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
              />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={clearCanvas} className="text-xs">Limpiar Firma</Button>
            </div>
          </div>

          <div className="flex justify-center pt-8">
            <Button 
              variant="primary" 
              className="w-full max-w-xs py-6 text-lg font-bold shadow-xl shadow-primary-600/20"
              onClick={handleFinalize}
            >
              Finalizar y Cerrar Sesión
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
