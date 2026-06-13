'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';
import { Truck, Plus, X, Loader2, Search } from 'lucide-react';

interface Ubicacion { id: string; codigo: string; nombre: string; }
interface Producto { id: string; codigo: string; nombre: string; unidad_medida: string; stock_actual: number; }

interface ItemRow {
  key: string;
  producto_id: string;
  producto_codigo: string;
  producto_nombre: string;
  producto_unidad: string;
  stock_actual: number;
  cantidad_solicitada: number;
}

export default function NuevaTransferenciaPage() {
  const router = useRouter();
  const [ubicaciones, setUbicaciones] = useState<Ubicacion[]>([]);
  const [ubicacion_origen_id, setOrigen] = useState('');
  const [ubicacion_destino_id, setDestino] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [items, setItems] = useState<ItemRow[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Producto[]>([]);
  const [searching, setSearching] = useState(false);
  const [showProductSearch, setShowProductSearch] = useState(false);

  useEffect(() => {
    fetch('/inventario/api/ubicaciones').then(r => r.json()).then(data => {
      if (!data.error) setUbicaciones(Array.isArray(data) ? data : data.data || []);
    }).catch(console.error);
  }, []);

  const searchProducts = async (term: string) => {
    if (!term.trim()) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const res = await fetch(`/inventario/api/productos?search=${encodeURIComponent(term)}&limit=10`);
      const json = await res.json();
      if (!json.error) setSearchResults(json.data || []);
    } catch { setSearchResults([]); }
    finally { setSearching(false); }
  };

  useEffect(() => {
    const timer = setTimeout(() => searchProducts(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const addItem = (p: Producto) => {
    if (items.some(i => i.producto_id === p.id)) return;
    setItems(prev => [...prev, {
      key: crypto.randomUUID(),
      producto_id: p.id,
      producto_codigo: p.codigo,
      producto_nombre: p.nombre,
      producto_unidad: p.unidad_medida,
      stock_actual: p.stock_actual,
      cantidad_solicitada: 1,
    }]);
    setShowProductSearch(false);
    setSearchTerm('');
  };

  const removeItem = (key: string) => setItems(prev => prev.filter(i => i.key !== key));

  const updateCantidad = (key: string, val: number) => {
    setItems(prev => prev.map(i => i.key === key ? { ...i, cantidad_solicitada: Math.max(1, val) } : i));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ubicacion_origen_id || !ubicacion_destino_id) { setError('Seleccione origen y destino'); return; }
    if (ubicacion_origen_id === ubicacion_destino_id) { setError('Origen y destino deben ser diferentes'); return; }
    if (items.length === 0) { setError('Agregue al menos un producto'); return; }
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/inventario/api/transferencias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ubicacion_origen_id,
          ubicacion_destino_id,
          observaciones: observaciones || null,
          items: items.map(i => ({ producto_id: i.producto_id, cantidad_solicitada: i.cantidad_solicitada })),
        }),
      });
      const data = await res.json();
      if (data.error) { setError(data.error); return; }
      router.push(`/inventario/transferencias/${data.id}`);
    } catch { setError('Error al crear transferencia'); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">Nueva Transferencia</h1>
        <p className="text-neutral-500 mt-1">Transferir productos entre ubicaciones</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 space-y-6">
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 text-sm">{error}</div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Ubicación Origen *</label>
            <select value={ubicacion_origen_id} onChange={(e) => setOrigen(e.target.value)} required
              className="w-full px-4 py-2.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white">
              <option value="">Seleccionar...</option>
              {ubicaciones.map(u => <option key={u.id} value={u.id}>{u.codigo} - {u.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Ubicación Destino *</label>
            <select value={ubicacion_destino_id} onChange={(e) => setDestino(e.target.value)} required
              className="w-full px-4 py-2.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white">
              <option value="">Seleccionar...</option>
              {ubicaciones.map(u => <option key={u.id} value={u.id}>{u.codigo} - {u.nombre}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Observaciones</label>
          <textarea value={observaciones} onChange={(e) => setObservaciones(e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white resize-none"
            rows={2} placeholder="Opcional" />
        </div>

        <div className="border-t border-neutral-200 dark:border-neutral-800 pt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-lg text-neutral-900 dark:text-white">Productos</h2>
            <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => setShowProductSearch(true)}>
              <Plus className="w-4 h-4" /> Agregar Producto
            </Button>
          </div>

          {showProductSearch && (
            <div className="mb-4 p-4 bg-neutral-50 dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex-1 relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar por código o nombre..."
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white"
                    autoFocus
                  />
                </div>
                <Button type="button" variant="outline" size="sm" onClick={() => { setShowProductSearch(false); setSearchTerm(''); }}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
              {searching ? (
                <div className="flex items-center justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-primary-600" /></div>
              ) : searchResults.length > 0 ? (
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {searchResults.map(p => (
                    <button key={p.id} type="button" onClick={() => addItem(p)}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-white dark:hover:bg-neutral-700 flex items-center justify-between">
                      <div>
                        <span className="font-mono text-sm text-primary-600">{p.codigo}</span>
                        <span className="ml-2 text-neutral-900 dark:text-white">{p.nombre}</span>
                      </div>
                      <span className="text-sm text-neutral-500">Stock: {p.stock_actual} {p.unidad_medida}</span>
                    </button>
                  ))}
                </div>
              ) : searchTerm ? (
                <p className="text-sm text-neutral-500 py-2 text-center">Sin resultados</p>
              ) : null}
            </div>
          )}

          {items.length === 0 ? (
            <div className="text-center py-8 text-neutral-400">
              <Truck className="w-12 h-12 mx-auto mb-3" />
              <p>Agregue productos a la transferencia</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-neutral-50 dark:bg-neutral-800/50">
                  <tr>
                    <th className="p-3 text-left text-xs font-semibold text-neutral-500 uppercase">Código</th>
                    <th className="p-3 text-left text-xs font-semibold text-neutral-500 uppercase">Producto</th>
                    <th className="p-3 text-center text-xs font-semibold text-neutral-500 uppercase">Stock Actual</th>
                    <th className="p-3 text-center text-xs font-semibold text-neutral-500 uppercase">Cantidad</th>
                    <th className="p-3 text-center text-xs font-semibold text-neutral-500 uppercase"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {items.map(item => (
                    <tr key={item.key}>
                      <td className="p-3 font-mono text-sm text-primary-600">{item.producto_codigo}</td>
                      <td className="p-3 font-medium text-neutral-900 dark:text-white">{item.producto_nombre}</td>
                      <td className="p-3 text-center font-mono text-neutral-900 dark:text-white">{item.stock_actual} {item.producto_unidad}</td>
                      <td className="p-3 text-center">
                        <input type="number" min="1" value={item.cantidad_solicitada}
                          onChange={(e) => updateCantidad(item.key, parseInt(e.target.value) || 1)}
                          className="w-20 px-3 py-1.5 text-center rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white font-mono" />
                      </td>
                      <td className="p-3 text-center">
                        <button type="button" onClick={() => removeItem(item.key)}
                          className="p-1.5 rounded-lg text-neutral-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30">
                          <X className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200 dark:border-neutral-800">
          <Button variant="outline" type="button" onClick={() => router.back()}>Cancelar</Button>
          <Button variant="primary" type="submit" disabled={submitting || items.length === 0} className="gap-2">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Truck className="w-4 h-4" />}
            {submitting ? 'Creando...' : 'Crear Transferencia'}
          </Button>
        </div>
      </form>
    </div>
  );
}
