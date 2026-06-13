'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';
import { ArrowLeft, Save, Loader2, Search, AlertTriangle } from 'lucide-react';

interface ProductoOption {
  id: string;
  codigo: string;
  nombre: string;
  stock_actual: number;
  unidad_medida: string;
}

export default function AjustePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedProductoId = searchParams.get('producto_id');

  const [productos, setProductos] = useState<ProductoOption[]>([]);
  const [productoSearch, setProductoSearch] = useState('');
  const [showProductos, setShowProductos] = useState(false);
  const [selectedProducto, setSelectedProducto] = useState<ProductoOption | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    producto_id: preselectedProductoId || '',
    producto_nombre: '',
    tipo_ajuste: 'ajuste_positivo',
    cantidad: '',
    motivo: '',
    observaciones: '',
  });

  const searchProductos = async (q: string) => {
    setProductoSearch(q);
    if (q.length < 2) return;
    try {
      const res = await fetch(`/inventario/api/productos?search=${encodeURIComponent(q)}&limit=10`);
      const data = await res.json();
      if (!data.error) setProductos(data.data);
    } catch {}
  };

  const selectProducto = (p: ProductoOption) => {
    setSelectedProducto(p);
    setForm(prev => ({ ...prev, producto_id: p.id, producto_nombre: `${p.codigo} - ${p.nombre}` }));
    setShowProductos(false);
    setProductoSearch('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.producto_id || !form.cantidad || !form.motivo) return;

    const cantidad = parseInt(form.cantidad);
    if (form.tipo_ajuste === 'ajuste_negativo' && selectedProducto && cantidad > selectedProducto.stock_actual) {
      alert(`Stock insuficiente. Actual: ${selectedProducto.stock_actual}`);
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/inventario/api/movimientos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: form.tipo_ajuste,
          producto_id: form.producto_id,
          cantidad,
          documento_referencia: `AJ-${Date.now()}`,
          observaciones: `${form.motivo}${form.observaciones ? ': ' + form.observaciones : ''}`,
          documento_tipo: 'ajuste',
        }),
      });

      const data = await res.json();
      if (data.error) { alert(data.error); return; }
      router.push(`/inventario/productos/${data.producto_id}`);
    } catch {
      alert('Error al registrar ajuste');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 rounded-lg text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Ajuste de Stock</h1>
          <p className="text-neutral-500 text-sm mt-0.5">Corregir el stock de un producto manualmente</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Producto *</label>
          <div className="relative">
            <div className="flex items-center border border-neutral-300 dark:border-neutral-700 rounded-lg">
              <input
                value={form.producto_nombre}
                onChange={e => { setForm(p => ({ ...p, producto_nombre: e.target.value, producto_id: '' })); setSelectedProducto(null); searchProductos(e.target.value); setShowProductos(true); }}
                onFocus={() => form.producto_nombre && setShowProductos(true)}
                placeholder="Buscar producto..."
                className="flex-1 px-4 py-2 bg-transparent text-neutral-900 dark:text-white outline-none rounded-lg"
              />
              <Search className="w-5 h-5 mr-3 text-neutral-400" />
            </div>
            {showProductos && productos.length > 0 && (
              <div className="absolute z-10 mt-1 w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                {productos.map(p => (
                  <button key={p.id} type="button" onClick={() => selectProducto(p)} className="w-full text-left px-4 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-800 border-b border-neutral-100 dark:border-neutral-800 last:border-0">
                    <span className="font-mono text-xs text-primary-600">{p.codigo}</span>
                    <p className="font-medium text-neutral-900 dark:text-white">{p.nombre}</p>
                    <span className="text-xs text-neutral-500">Stock actual: {p.stock_actual} {p.unidad_medida}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {selectedProducto && (
          <div className="p-4 bg-neutral-50 dark:bg-neutral-800 rounded-xl flex items-center justify-between">
            <span className="text-sm text-neutral-500">Stock actual</span>
            <span className="font-mono font-semibold text-lg text-neutral-900 dark:text-white">{selectedProducto.stock_actual} {selectedProducto.unidad_medida}</span>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Tipo de Ajuste</label>
          <div className="flex gap-3">
            <label className={`flex-1 p-3 rounded-xl border-2 cursor-pointer text-center transition-all ${form.tipo_ajuste === 'ajuste_positivo' ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20' : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300'}`}>
              <input type="radio" name="tipo" value="ajuste_positivo" checked={form.tipo_ajuste === 'ajuste_positivo'} onChange={() => setForm(p => ({ ...p, tipo_ajuste: 'ajuste_positivo' }))} className="sr-only" />
              <p className="font-medium text-green-600">+ Aumentar Stock</p>
              <p className="text-xs text-neutral-500 mt-1">Agregar unidades</p>
            </label>
            <label className={`flex-1 p-3 rounded-xl border-2 cursor-pointer text-center transition-all ${form.tipo_ajuste === 'ajuste_negativo' ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20' : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300'}`}>
              <input type="radio" name="tipo" value="ajuste_negativo" checked={form.tipo_ajuste === 'ajuste_negativo'} onChange={() => setForm(p => ({ ...p, tipo_ajuste: 'ajuste_negativo' }))} className="sr-only" />
              <p className="font-medium text-red-600">- Disminuir Stock</p>
              <p className="text-xs text-neutral-500 mt-1">Quitar unidades</p>
            </label>
          </div>
        </div>

        <Input
          label="Cantidad *"
          type="number"
          min="1"
          value={form.cantidad}
          onChange={e => setForm(p => ({ ...p, cantidad: e.target.value }))}
          placeholder="Ej: 10"
        />

        <Input
          label="Motivo del Ajuste *"
          value={form.motivo}
          onChange={e => setForm(p => ({ ...p, motivo: e.target.value }))}
          placeholder="Ej: Diferencia de inventario físico"
        />

        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Observaciones</label>
          <textarea
            value={form.observaciones}
            onChange={e => setForm(p => ({ ...p, observaciones: e.target.value }))}
            rows={2}
            className="w-full px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white"
            placeholder="Detalles adicionales..."
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200 dark:border-neutral-800">
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancelar</Button>
          <Button type="submit" variant="primary" className="gap-2" disabled={saving || !form.producto_id || !form.cantidad || !form.motivo}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Guardando...' : 'Registrar Ajuste'}
          </Button>
        </div>
      </form>
    </div>
  );
}
