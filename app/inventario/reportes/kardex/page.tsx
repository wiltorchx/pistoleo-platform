'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/atoms/Button';
import { Loader2, BarChart3, Download, Printer } from 'lucide-react';

interface Movimiento {
  id: string;
  tipo: string;
  producto: { codigo: string; nombre: string; unidad_medida: string } | null;
  ubicacion_origen: { codigo: string; nombre: string } | null;
  ubicacion_destino: { codigo: string; nombre: string } | null;
  cantidad: number;
  cantidad_anterior: number;
  cantidad_nueva: number;
  costo_unitario: number | null;
  costo_total: number;
  documento_referencia: string | null;
  observaciones: string | null;
  usuario: { first_name: string; last_name: string } | null;
  created_at: string;
}

const tipoBadge: Record<string, { bg: string; text: string; label: string }> = {
  entrada: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700', label: 'Entrada' },
  salida: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700', label: 'Salida' },
  ajuste_positivo: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700', label: 'Ajuste +' },
  ajuste_negativo: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700', label: 'Ajuste -' },
  transferencia_origen: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700', label: 'Transf. Origen' },
  transferencia_destino: { bg: 'bg-indigo-100 dark:bg-indigo-900/30', text: 'text-indigo-700', label: 'Transf. Destino' },
  devolucion_proveedor: { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-700', label: 'Dev.' },
  inventario_inicial: { bg: 'bg-teal-100 dark:bg-teal-900/30', text: 'text-teal-700', label: 'Inv. Inicial' },
};

export default function ReporteKardexPage() {
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [tipoFilter, setTipoFilter] = useState('');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (tipoFilter) params.set('tipo', tipoFilter);
      if (fechaDesde) params.set('fecha_desde', fechaDesde);
      if (fechaHasta) params.set('fecha_hasta', fechaHasta);
      params.set('page', page.toString());
      params.set('limit', '50');

      const res = await fetch(`/inventario/api/movimientos?${params}`);
      const json = await res.json();
      if (!json.error) {
        setMovimientos(json.data || []);
        setTotal(json.total || 0);
        setTotalPages(json.totalPages || 0);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [tipoFilter, fechaDesde, fechaHasta, page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">Kardex</h1>
          <p className="text-neutral-500 mt-1">Historial completo de movimientos ({total} registros)</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2"><Printer className="w-4 h-4" /> Imprimir</Button>
          <Button variant="outline" className="gap-2"><Download className="w-4 h-4" /> Exportar</Button>
        </div>
      </div>

      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex flex-wrap gap-3">
            <select value={tipoFilter} onChange={(e) => { setTipoFilter(e.target.value); setPage(1); }}
              className="px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white">
              <option value="">Todos los tipos</option>
              <option value="entrada">Entrada</option>
              <option value="salida">Salida</option>
              <option value="ajuste_positivo">Ajuste +</option>
              <option value="ajuste_negativo">Ajuste -</option>
              <option value="transferencia_origen">Transf. Origen</option>
              <option value="transferencia_destino">Transf. Destino</option>
              <option value="devolucion_proveedor">Devolución</option>
              <option value="inventario_inicial">Inv. Inicial</option>
            </select>
            <input type="date" value={fechaDesde} onChange={(e) => { setFechaDesde(e.target.value); setPage(1); }}
              className="px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white" />
            <input type="date" value={fechaHasta} onChange={(e) => { setFechaHasta(e.target.value); setPage(1); }}
              className="px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white" />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 text-primary-600 animate-spin" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-50 dark:bg-neutral-800/50">
                <tr>
                  <th className="p-4 text-left text-xs font-semibold text-neutral-500 uppercase">Fecha</th>
                  <th className="p-4 text-left text-xs font-semibold text-neutral-500 uppercase">Tipo</th>
                  <th className="p-4 text-left text-xs font-semibold text-neutral-500 uppercase">Documento</th>
                  <th className="p-4 text-left text-xs font-semibold text-neutral-500 uppercase">Producto</th>
                  <th className="p-4 text-left text-xs font-semibold text-neutral-500 uppercase">Origen</th>
                  <th className="p-4 text-left text-xs font-semibold text-neutral-500 uppercase">Destino</th>
                  <th className="p-4 text-right text-xs font-semibold text-neutral-500 uppercase">Cantidad</th>
                  <th className="p-4 text-right text-xs font-semibold text-neutral-500 uppercase">Stock Antes</th>
                  <th className="p-4 text-right text-xs font-semibold text-neutral-500 uppercase">Stock Después</th>
                  <th className="p-4 text-right text-xs font-semibold text-neutral-500 uppercase">Costo Total</th>
                  <th className="p-4 text-left text-xs font-semibold text-neutral-500 uppercase">Usuario</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {movimientos.map((m) => {
                  const tb = tipoBadge[m.tipo] || tipoBadge.entrada;
                  return (
                    <tr key={m.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                      <td className="p-4 text-sm text-neutral-500">{new Date(m.created_at).toLocaleString()}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${tb.bg} ${tb.text}`}>{tb.label}</span>
                      </td>
                      <td className="p-4 text-sm text-neutral-600 font-mono">{m.documento_referencia || '—'}</td>
                      <td className="p-4 font-medium text-neutral-900 dark:text-white">
                        <span className="font-mono text-primary-600">{m.producto?.codigo}</span>
                        <span className="ml-1">{m.producto?.nombre}</span>
                      </td>
                      <td className="p-4 text-neutral-600">{m.ubicacion_origen?.codigo || '—'}</td>
                      <td className="p-4 text-neutral-600">{m.ubicacion_destino?.codigo || '—'}</td>
                      <td className="p-4 text-right font-mono font-semibold">{m.cantidad}</td>
                      <td className="p-4 text-right font-mono text-neutral-500">{m.cantidad_anterior}</td>
                      <td className="p-4 text-right font-mono font-semibold text-neutral-900 dark:text-white">{m.cantidad_nueva}</td>
                      <td className="p-4 text-right font-mono">${m.costo_total.toLocaleString('es-CL')}</td>
                      <td className="p-4 text-sm text-neutral-500">{m.usuario ? `${m.usuario.first_name} ${m.usuario.last_name}` : '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-neutral-200 dark:border-neutral-800">
            <span className="text-sm text-neutral-500">Página {page} de {totalPages}</span>
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
