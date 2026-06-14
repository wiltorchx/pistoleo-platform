'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/atoms/Button';
import { Loader2, Package, Download, Printer } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface Producto {
  id: string;
  codigo: string;
  nombre: string;
  unidad_medida: string;
  categoria: { nombre: string } | null;
  ubicacion: { codigo: string; nombre: string } | null;
  stock_actual: number;
  stock_minimo: number;
  stock_maximo: number | null;
  costo_promedio: number;
  valor_stock: number;
  stock_bajo: boolean;
}

export default function ReporteStockPage() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '500', sort_by: 'nombre', sort_order: 'asc' });
      if (filter) params.set('search', filter);
      const res = await fetch(`/inventario/api/productos?${params}`);
      const json = await res.json();
      if (!json.error) setProductos(json.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [filter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const totalProductos = productos.length;
  const totalStock = productos.reduce((s, p) => s + p.stock_actual, 0);
  const totalValor = productos.reduce((s, p) => s + p.valor_stock, 0);
  const stockBajo = productos.filter(p => p.stock_bajo).length;

  const catData = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of productos) {
      const name = p.categoria?.nombre || 'Sin categoría';
      map.set(name, (map.get(name) || 0) + p.stock_actual);
    }
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [productos]);

  const statusData = useMemo(() => [
    { name: 'Stock Normal', value: productos.filter(p => !p.stock_bajo).length, color: '#22c55e' },
    { name: 'Stock Bajo', value: stockBajo, color: '#ef4444' },
  ], [productos, stockBajo]);

  const topBajo = useMemo(() =>
    productos.filter(p => p.stock_bajo).slice(0, 5),
  [productos]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">Reporte de Stock</h1>
          <p className="text-neutral-500 mt-1">Inventario completo ({totalProductos} productos)</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2"><Printer className="w-4 h-4" /> Imprimir</Button>
          <Button variant="outline" className="gap-2"><Download className="w-4 h-4" /> Exportar</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-neutral-900 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800">
          <p className="text-xs text-neutral-500">Total Productos</p>
          <p className="text-2xl font-bold text-neutral-900 dark:text-white">{totalProductos}</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800">
          <p className="text-xs text-neutral-500">Stock Total</p>
          <p className="text-2xl font-bold text-blue-600">{totalStock.toLocaleString()}</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800">
          <p className="text-xs text-neutral-500">Valor Stock</p>
          <p className="text-2xl font-bold text-green-600">${totalValor.toLocaleString('es-CL')}</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800">
          <p className="text-xs text-neutral-500">Stock Bajo</p>
          <p className={`text-2xl font-bold ${stockBajo > 0 ? 'text-red-600' : 'text-neutral-900 dark:text-white'}`}>{stockBajo}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800">
          <h3 className="text-sm font-semibold text-neutral-500 uppercase mb-4">Stock por Categoría</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={catData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800">
          <h3 className="text-sm font-semibold text-neutral-500 uppercase mb-4">Estado del Stock</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                {statusData.map((e) => <Cell key={e.name} fill={e.color} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800">
          <h3 className="text-sm font-semibold text-neutral-500 uppercase mb-3">Alertas de Stock Bajo</h3>
          {topBajo.length === 0 ? (
            <p className="text-sm text-green-600 font-medium">No hay productos con stock bajo</p>
          ) : (
            <div className="space-y-2">
              {topBajo.map((p) => (
                <div key={p.id} className="flex items-center justify-between text-sm">
                  <div className="truncate min-w-0">
                    <span className="font-mono text-xs text-primary-600">{p.codigo}</span>
                    <span className="ml-1 text-neutral-700 dark:text-neutral-300 truncate">{p.nombre}</span>
                  </div>
                  <span className="ml-2 font-mono text-red-600 font-semibold shrink-0">{p.stock_actual} / {p.stock_minimo}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-800">
          <input
            type="text"
            placeholder="Buscar producto..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full max-w-md px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white"
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 text-primary-600 animate-spin" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-50 dark:bg-neutral-800/50">
                <tr>
                  <th className="p-4 text-left text-xs font-semibold text-neutral-500 uppercase">Código</th>
                  <th className="p-4 text-left text-xs font-semibold text-neutral-500 uppercase">Producto</th>
                  <th className="p-4 text-left text-xs font-semibold text-neutral-500 uppercase">Categoría</th>
                  <th className="p-4 text-left text-xs font-semibold text-neutral-500 uppercase">Ubicación</th>
                  <th className="p-4 text-right text-xs font-semibold text-neutral-500 uppercase">Stock</th>
                  <th className="p-4 text-right text-xs font-semibold text-neutral-500 uppercase">Mínimo</th>
                  <th className="p-4 text-right text-xs font-semibold text-neutral-500 uppercase">Máximo</th>
                  <th className="p-4 text-right text-xs font-semibold text-neutral-500 uppercase">Costo Prom.</th>
                  <th className="p-4 text-right text-xs font-semibold text-neutral-500 uppercase">Valor Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {productos.map((p) => (
                  <tr key={p.id} className={`hover:bg-neutral-50 dark:hover:bg-neutral-800/50 ${p.stock_bajo ? 'bg-red-50/50 dark:bg-red-900/10' : ''}`}>
                    <td className="p-4 font-mono text-sm text-primary-600">{p.codigo}</td>
                    <td className="p-4 font-medium text-neutral-900 dark:text-white">{p.nombre}</td>
                    <td className="p-4 text-neutral-600 dark:text-neutral-400">{p.categoria?.nombre || '—'}</td>
                    <td className="p-4 text-neutral-600 dark:text-neutral-400">{p.ubicacion?.codigo || '—'}</td>
                    <td className="p-4 text-right font-mono font-semibold text-neutral-900 dark:text-white">{p.stock_actual}</td>
                    <td className="p-4 text-right font-mono text-neutral-500">{p.stock_minimo}</td>
                    <td className="p-4 text-right font-mono text-neutral-500">{p.stock_maximo ?? '—'}</td>
                    <td className="p-4 text-right font-mono">${p.costo_promedio.toLocaleString('es-CL')}</td>
                    <td className="p-4 text-right font-mono font-semibold text-neutral-900 dark:text-white">${p.valor_stock.toLocaleString('es-CL')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
