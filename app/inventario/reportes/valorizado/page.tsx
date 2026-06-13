'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/atoms/Button';
import { Loader2, TrendingUp, Download, Printer } from 'lucide-react';

interface Producto {
  id: string;
  codigo: string;
  nombre: string;
  categoria: { id: string; nombre: string } | null;
  ubicacion: { codigo: string; nombre: string } | null;
  stock_actual: number;
  costo_promedio: number;
  precio_venta: number | null;
  valor_stock: number;
}

export default function ReporteValorizadoPage() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/inventario/api/productos?limit=500&sort_by=nombre&sort_order=asc');
      const json = await res.json();
      if (!json.error) setProductos(json.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const totalValorCosto = productos.reduce((s, p) => s + p.valor_stock, 0);
  const totalValorVenta = productos.reduce((s, p) => s + (p.precio_venta || 0) * p.stock_actual, 0);
  const margenPotencial = totalValorVenta - totalValorCosto;
  const margenPorcentaje = totalValorCosto > 0 ? ((margenPotencial / totalValorCosto) * 100).toFixed(1) : '0';

  const categorias = productos.reduce<Record<string, { count: number; stock: number; valor: number; venta: number }>>((acc, p) => {
    const key = p.categoria?.nombre || 'Sin categoría';
    if (!acc[key]) acc[key] = { count: 0, stock: 0, valor: 0, venta: 0 };
    acc[key].count++;
    acc[key].stock += p.stock_actual;
    acc[key].valor += p.valor_stock;
    acc[key].venta += (p.precio_venta || 0) * p.stock_actual;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">Stock Valorizado</h1>
          <p className="text-neutral-500 mt-1">Valor económico del inventario</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2"><Printer className="w-4 h-4" /> Imprimir</Button>
          <Button variant="outline" className="gap-2"><Download className="w-4 h-4" /> Exportar</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-neutral-900 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800">
          <p className="text-xs text-neutral-500">Valor al Costo</p>
          <p className="text-2xl font-bold text-neutral-900 dark:text-white">${totalValorCosto.toLocaleString('es-CL')}</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800">
          <p className="text-xs text-neutral-500">Valor a Venta</p>
          <p className="text-2xl font-bold text-green-600">${totalValorVenta.toLocaleString('es-CL')}</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800">
          <p className="text-xs text-neutral-500">Margen Potencial</p>
          <p className="text-2xl font-bold text-blue-600">${margenPotencial.toLocaleString('es-CL')}</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800">
          <p className="text-xs text-neutral-500">Margen %</p>
          <p className="text-2xl font-bold text-purple-600">{margenPorcentaje}%</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 text-primary-600 animate-spin" /></div>
      ) : (
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
          <div className="p-4 border-b border-neutral-200 dark:border-neutral-800">
            <h2 className="font-semibold text-lg text-neutral-900 dark:text-white">Valor por Categoría</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-50 dark:bg-neutral-800/50">
                <tr>
                  <th className="p-4 text-left text-xs font-semibold text-neutral-500 uppercase">Categoría</th>
                  <th className="p-4 text-right text-xs font-semibold text-neutral-500 uppercase">Productos</th>
                  <th className="p-4 text-right text-xs font-semibold text-neutral-500 uppercase">Stock Total</th>
                  <th className="p-4 text-right text-xs font-semibold text-neutral-500 uppercase">Valor Costo</th>
                  <th className="p-4 text-right text-xs font-semibold text-neutral-500 uppercase">Valor Venta</th>
                  <th className="p-4 text-right text-xs font-semibold text-neutral-500 uppercase">Margen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {Object.entries(categorias).map(([nombre, data]) => {
                  const margen = data.venta - data.valor;
                  const pct = data.valor > 0 ? ((margen / data.valor) * 100).toFixed(1) : '0';
                  return (
                    <tr key={nombre} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                      <td className="p-4 font-medium text-neutral-900 dark:text-white">{nombre}</td>
                      <td className="p-4 text-right text-neutral-600">{data.count}</td>
                      <td className="p-4 text-right font-mono">{data.stock.toLocaleString()}</td>
                      <td className="p-4 text-right font-mono">${data.valor.toLocaleString('es-CL')}</td>
                      <td className="p-4 text-right font-mono">${data.venta.toLocaleString('es-CL')}</td>
                      <td className="p-4 text-right font-mono text-green-600">${margen.toLocaleString('es-CL')} ({pct}%)</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
