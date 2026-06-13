'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/atoms/Button';
import { ArrowUpDown, Plus, Search, Loader2 } from 'lucide-react';

interface Movimiento {
  id: string;
  tipo: string;
  cantidad: number;
  cantidad_anterior: number;
  cantidad_nueva: number;
  costo_total: number;
  documento_referencia: string | null;
  observaciones: string | null;
  producto: { codigo: string; nombre: string; unidad_medida: string } | null;
  ubicacion_origen: { codigo: string; nombre: string } | null;
  ubicacion_destino: { codigo: string; nombre: string } | null;
  usuario: { first_name: string; last_name: string; email: string } | null;
  created_at: string;
}

const TIPOS_MOVIMIENTO = [
  { value: '', label: 'Todos los tipos' },
  { value: 'entrada', label: 'Entrada' },
  { value: 'salida', label: 'Salida' },
  { value: 'ajuste_positivo', label: 'Ajuste +' },
  { value: 'ajuste_negativo', label: 'Ajuste -' },
  { value: 'transferencia_origen', label: 'Transferencia Origen' },
  { value: 'transferencia_destino', label: 'Transferencia Destino' },
  { value: 'devolucion_proveedor', label: 'Devolución Proveedor' },
  { value: 'inventario_inicial', label: 'Inventario Inicial' },
];

export default function MovimientosPage() {
  const router = useRouter();
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [tipoFilter, setTipoFilter] = useState('');

  const fetchMovimientos = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (tipoFilter) params.set('tipo', tipoFilter);
      params.set('page', page.toString());
      params.set('limit', '30');

      const res = await fetch(`/inventario/api/movimientos?${params}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setMovimientos(data.data || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [tipoFilter, page]);

  useEffect(() => { fetchMovimientos(); }, [fetchMovimientos]);

  const getTipoBadge = (tipo: string) => {
    const config: Record<string, { bg: string; text: string; label: string }> = {
      entrada: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-300', label: 'Entrada' },
      salida: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300', label: 'Salida' },
      ajuste_positivo: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300', label: 'Ajuste +' },
      ajuste_negativo: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-300', label: 'Ajuste -' },
      transferencia_origen: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-300', label: 'Transf. Origen' },
      transferencia_destino: { bg: 'bg-indigo-100 dark:bg-indigo-900/30', text: 'text-indigo-700 dark:text-indigo-300', label: 'Transf. Destino' },
      devolucion_proveedor: { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-700 dark:text-gray-300', label: 'Dev. Proveedor' },
      inventario_inicial: { bg: 'bg-teal-100 dark:bg-teal-900/30', text: 'text-teal-700 dark:text-teal-300', label: 'Inv. Inicial' },
    };
    return config[tipo] || { bg: 'bg-neutral-100', text: 'text-neutral-700', label: tipo };
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">Movimientos</h1>
          <p className="text-neutral-500 mt-1">Historial de movimientos de inventario (Kardex)</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" className="gap-2" onClick={() => router.push('/inventario/movimientos/entrada')}>
            <Plus className="w-4 h-4" /> Entrada
          </Button>
          <Button variant="outline" className="gap-2" onClick={() => router.push('/inventario/movimientos/salida')}>
            <Plus className="w-4 h-4" /> Salida
          </Button>
          <Button variant="primary" className="gap-2" onClick={() => router.push('/inventario/movimientos/ajuste')}>
            <Plus className="w-4 h-4" /> Ajuste
          </Button>
        </div>
      </div>

      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex flex-wrap gap-3">
            <select
              value={tipoFilter}
              onChange={(e) => { setTipoFilter(e.target.value); setPage(1); }}
              className="px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white text-sm"
            >
              {TIPOS_MOVIMIENTO.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 text-primary-600 animate-spin" /></div>
        ) : movimientos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-neutral-400">
            <ArrowUpDown className="w-16 h-16 mb-4" />
            <p className="text-lg font-medium">No hay movimientos registrados</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-50 dark:bg-neutral-800/50">
                <tr>
                  <th className="p-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Tipo</th>
                  <th className="p-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Producto</th>
                  <th className="p-3 text-right text-xs font-semibold text-neutral-500 uppercase tracking-wider">Cantidad</th>
                  <th className="p-3 text-right text-xs font-semibold text-neutral-500 uppercase tracking-wider">Stock Anterior</th>
                  <th className="p-3 text-right text-xs font-semibold text-neutral-500 uppercase tracking-wider">Stock Nuevo</th>
                  <th className="p-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Ubicación</th>
                  <th className="p-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Usuario</th>
                  <th className="p-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Observaciones</th>
                  <th className="p-3 text-right text-xs font-semibold text-neutral-500 uppercase tracking-wider">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {movimientos.map(mov => {
                  const badge = getTipoBadge(mov.tipo);
                  return (
                    <tr key={mov.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>{badge.label}</span>
                      </td>
                      <td className="p-3">
                        <p className="font-medium text-neutral-900 dark:text-white">{mov.producto?.nombre || '—'}</p>
                        <p className="text-xs text-primary-600 font-mono">{mov.producto?.codigo}</p>
                      </td>
                      <td className="p-3 text-right font-mono text-neutral-900 dark:text-white">{mov.cantidad}</td>
                      <td className="p-3 text-right font-mono text-neutral-500">{mov.cantidad_anterior}</td>
                      <td className="p-3 text-right font-mono font-semibold text-neutral-900 dark:text-white">{mov.cantidad_nueva}</td>
                      <td className="p-3 text-sm text-neutral-500">
                        {mov.ubicacion_origen && <span>Origen: {mov.ubicacion_origen.codigo}</span>}
                        {mov.ubicacion_destino && <span>Destino: {mov.ubicacion_destino.codigo}</span>}
                      </td>
                      <td className="p-3 text-sm text-neutral-500">{mov.usuario ? `${mov.usuario.first_name} ${mov.usuario.last_name}` : '—'}</td>
                      <td className="p-3 text-sm text-neutral-500 max-w-[200px] truncate">{mov.observaciones || '—'}</td>
                      <td className="p-3 text-right text-sm text-neutral-500 whitespace-nowrap">{new Date(mov.created_at).toLocaleString('es-CL')}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-neutral-200 dark:border-neutral-800">
            <span className="text-sm text-neutral-500">Página {page} de {totalPages} ({total} resultados)</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Anterior</Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Siguiente</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
