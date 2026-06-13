'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/atoms/Button';
import {
  Truck,
  Plus,
  Loader2,
  Eye,
  Send,
  XCircle,
  CheckCircle2,
  Clock,
} from 'lucide-react';

interface Transferencia {
  id: string;
  numero: string;
  estado: string;
  ubicacion_origen: { codigo: string; nombre: string } | null;
  ubicacion_destino: { codigo: string; nombre: string } | null;
  solicitado_por_usuario: { first_name: string; last_name: string } | null;
  created_at: string;
  total_items: number;
  items_enviados: number;
  items_recibidos: number;
}

const estadoConfig: Record<string, { bg: string; text: string; label: string; icon: React.ReactNode }> = {
  borrador: { bg: 'bg-neutral-100 dark:bg-neutral-800', text: 'text-neutral-600', label: 'Borrador', icon: <Clock className="w-3.5 h-3.5" /> },
  enviada: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700', label: 'Enviada', icon: <Send className="w-3.5 h-3.5" /> },
  recibida: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700', label: 'Recibida', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  cancelada: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700', label: 'Cancelada', icon: <XCircle className="w-3.5 h-3.5" /> },
};

export default function TransferenciasPage() {
  const [data, setData] = useState<Transferencia[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [estadoFilter, setEstadoFilter] = useState('');
  const [page, setPage] = useState(1);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (estadoFilter) params.set('estado', estadoFilter);
      params.set('page', page.toString());
      params.set('limit', '20');
      const res = await fetch(`/inventario/api/transferencias?${params}`);
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setData(json.data || []);
      setTotal(json.total || 0);
      setTotalPages(json.totalPages || 0);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [estadoFilter, page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCambiarEstado = async (id: string, estado: string) => {
    const confirmMsg: Record<string, string> = {
      enviada: '¿Enviar esta transferencia? Se descontará stock.',
      cancelada: '¿Cancelar esta transferencia?',
    };
    if (!window.confirm(confirmMsg[estado] || '¿Confirmar?')) return;
    try {
      const res = await fetch(`/inventario/api/transferencias/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado }),
      });
      const json = await res.json();
      if (json.error) { alert(json.error); return; }
      fetchData();
    } catch { alert('Error'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">Transferencias</h1>
          <p className="text-neutral-500 mt-1">{total} transferencia(s)</p>
        </div>
        <Button variant="primary" className="gap-2" asChild>
          <Link href="/inventario/transferencias/nueva"><Plus className="w-4 h-4" />Nueva Transferencia</Link>
        </Button>
      </div>

      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-800">
          <select value={estadoFilter} onChange={(e) => { setEstadoFilter(e.target.value); setPage(1); }}
            className="px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white">
            <option value="">Todos los estados</option>
            <option value="borrador">Borrador</option><option value="enviada">Enviada</option>
            <option value="recibida">Recibida</option><option value="cancelada">Cancelada</option>
          </select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 text-primary-600 animate-spin" /></div>
        ) : data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-neutral-400">
            <Truck className="w-16 h-16 mb-4" />
            <p className="text-lg font-medium">No hay transferencias</p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {data.map((t) => {
              const ec = estadoConfig[t.estado] || estadoConfig.borrador;
              return (
                <div key={t.id} className="p-6 hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <Link href={`/inventario/transferencias/${t.id}`} className="text-lg font-semibold text-neutral-900 dark:text-white hover:text-primary-600">
                          {t.numero}
                        </Link>
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${ec.bg} ${ec.text}`}>
                          {ec.icon}{ec.label}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-neutral-500">
                        <span>Origen: {t.ubicacion_origen?.codigo || '—'}</span>
                        <span>Destino: {t.ubicacion_destino?.codigo || '—'}</span>
                        <span>Solicitante: {t.solicitado_por_usuario ? `${t.solicitado_por_usuario.first_name} ${t.solicitado_por_usuario.last_name}` : '—'}</span>
                        <span>{new Date(t.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link href={`/inventario/transferencias/${t.id}`} className="p-2 rounded-lg text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"><Eye className="w-4 h-4" /></Link>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-6 text-sm">
                    <span>Items: <strong>{t.total_items}</strong></span>
                    <span>Enviados: <strong className="text-blue-600">{t.items_enviados}</strong></span>
                    <span>Recibidos: <strong className="text-green-600">{t.items_recibidos}</strong></span>
                  </div>
                  {t.estado === 'borrador' && (
                    <div className="mt-4 flex gap-2">
                      <Button size="sm" onClick={() => handleCambiarEstado(t.id, 'enviada')} className="gap-2">
                        <Send className="w-3.5 h-3.5" /> Enviar
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleCambiarEstado(t.id, 'cancelada')} className="gap-2 text-red-600">
                        <XCircle className="w-3.5 h-3.5" /> Cancelar
                      </Button>
                    </div>
                  )}
                  {t.estado === 'enviada' && (
                    <div className="mt-4">
                      <Button size="sm" asChild>
                        <Link href={`/inventario/transferencias/${t.id}`}>Recibir Transferencia</Link>
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
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
