'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';
import { ArrowLeft, Save, Loader2, Search } from 'lucide-react';

interface ProductoOption {
  id: string;
  codigo: string;
  nombre: string;
  stock_actual: number;
}

export default function EntradaPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedProductoId = searchParams.get('producto_id');

  const [productos, setProductos] = useState<ProductoOption[]>([]);
  const [productoSearch, setProductoSearch] = useState('');
  const [showProductos, setShowProductos] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    producto_id: preselectedProductoId || '',
    producto_nombre: '',
    cantidad: '',
    costo_unitario: '',
    documento_referencia: '',
    observaciones: '',
  });

  useEffect(() => {
    if (preselectedProductoId) {
      fetch(`/inventario/api/productos?id=${preselectedProductoId}`)
        .then(r => r.json())
        .then(d => {
          if (d.data?.[0]) setForm(p => ({ ...p, producto_nombre: d.data[0].nombre }));
        })
        .catch(() => {});
    }
  }, [preselectedProductoId]);

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
    setForm(prev => ({ ...prev, producto_id: p.id, producto_nombre: `${p.codigo} - ${p.nombre}` }));
    setShowProductos(false);
    setProductoSearch('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.producto_id || !form.cantidad) return;

    setSaving(true);
    try {
      const res = await fetch('/inventario/api/movimientos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: 'entrada',
          producto_id: form.producto_id,
          cantidad: parseInt(form.cantidad),
          costo_unitario: form.costo_unitario ? parseFloat(form.costo_unitario) : undefined,
          documento_referencia: form.documento_referencia || undefined,
          observaciones: form.observaciones || undefined,
          documento_tipo: 'compra',
        }),
      });

      const data = await res.json();
      if (data.error) { alert(data.error); return; }
      router.push(`/inventario/productos/${data.producto_id}`);
    } catch {
      alert('Error al registrar entrada');
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
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Registrar Entrada</h1>
          <p className="text-neutral-500 text-sm mt-0.5">Ingreso de mercancía al inventario</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Producto *</label>
          <div className="relative">
            <div className="flex items-center border border-neutral-300 dark:border-neutral-700 rounded-lg">
              <input
                value={form.producto_nombre}
                onChange={e => { setForm(p => ({ ...p, producto_nombre: e.target.value, producto_id: '' })); searchProductos(e.target.value); setShowProductos(true); }}
                onFocus={() => form.producto_nombre && setShowProductos(true)}
                placeholder="Buscar producto por nombre o código..."
                className="flex-1 px-4 py-2 bg-transparent text-neutral-900 dark:text-white outline-none rounded-lg"
              />
              <Search className="w-5 h-5 mr-3 text-neutral-400" />
            </div>
            {showProductos && productos.length > 0 && (
              <div className="absolute z-10 mt-1 w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                {productos.map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => selectProducto(p)}
                    className="w-full text-left px-4 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-800 border-b border-neutral-100 dark:border-neutral-800 last:border-0"
                  >
                    <span className="font-mono text-xs text-primary-600">{p.codigo}</span>
                    <p className="font-medium text-neutral-900 dark:text-white">{p.nombre}</p>
                    <span className="text-xs text-neutral-500">Stock actual: {p.stock_actual}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Input
            label="Cantidad *"
            type="number"
            min="1"
            value={form.cantidad}
            onChange={e => setForm(p => ({ ...p, cantidad: e.target.value }))}
            placeholder="Ej: 100"
          />
          <Input
            label="Costo Unitario"
            type="number"
            min="0"
            step="0.01"
            value={form.costo_unitario}
            onChange={e => setForm(p => ({ ...p, costo_unitario: e.target.value }))}
            placeholder="Ej: 1500"
            hint="Si se omite, usa el costo promedio actual"
          />
        </div>

        <Input
          label="Documento Referencia"
          value={form.documento_referencia}
          onChange={e => setForm(p => ({ ...p, documento_referencia: e.target.value }))}
          placeholder="Ej: OC-1234, Factura 5678"
        />

        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Observaciones</label>
          <textarea
            value={form.observaciones}
            onChange={e => setForm(p => ({ ...p, observaciones: e.target.value }))}
            rows={2}
            className="w-full px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white"
            placeholder="Notas opcionales..."
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200 dark:border-neutral-800">
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancelar</Button>
          <Button type="submit" variant="primary" className="gap-2" disabled={saving || !form.producto_id || !form.cantidad}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Guardando...' : 'Registrar Entrada'}
          </Button>
        </div>
      </form>
    </div>
  );
}
