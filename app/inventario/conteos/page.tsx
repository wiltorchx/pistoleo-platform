'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/atoms/Button';
import {
  ClipboardList,
  Plus,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  Play,
  AlertTriangle,
  Eye,
} from 'lucide-react';

interface Conteo {
  id: string;
  nombre: string;
  estado: string;
  ubicacion: { codigo: string; nombre: string } | null;
  categoria: { nombre: string; color: string } | null;
  usuario: { first_name: string; last_name: string } | null;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  created_at: string;
  total_items: number;
  items_contados: number;
  items_con_diferencia: number;
  total_diferencias: number;
}

const estadoConfig: Record<string, { bg: string; text: string; label: string; icon: React.ReactNode }> = {
  borrador: { bg: 'bg-neutral-100 dark:bg-neutral-800', text: 'text-neutral-600 dark:text-neutral-300', label: 'Borrador', icon: <Clock className="w-3.5 h-3.5" /> },
  en_progreso: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300', label: 'En Progreso', icon: <Play className="w-3.5 h-3.5" /> },
  finalizado: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-300', label: 'Finalizado', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  aprobado: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-300', label: 'Aprobado', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  rechazado: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300', label: 'Rechazado', icon: <XCircle className="w-3.5 h-3.5" /> },
};

export default function ConteosPage() {
  const [conteos, setConteos] = useState<Conteo[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [estadoFilter, setEstadoFilter] = useState('');
  const [page, setPage] = useState(1);

  const fetchConteos = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (estadoFilter) params.set('estado', estadoFilter);
      params.set('page', page.toString());
      params.set('limit', '20');

      const res = await fetch(`/inventario/api/conteos?${params}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setConteos(data.data || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 0);
    } catch (err) {
      console.error('Error fetching conteos:', err);
    } finally {
      setLoading(false);
    }
  }, [estadoFilter, page]);

  useEffect(() => { fetchConteos(); }, [fetchConteos]);

  const handleCambiarEstado = async (id: string, estado: string) => {
    try {
      const res = await fetch(`/inventario/api/conteos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado }),
      });
      const data = await res.json();
      if (data.error) { alert(data.error); return; }
      fetchConteos();
    } catch { alert('Error al cambiar estado'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">Conteos Físicos</h1>
          <p className="text-neutral-500 mt-1">{total} conteo(s) registrados</p>
        </div>
        <Button variant="primary" className="gap-2" asChild>
          <Link href="/inventario/conteos/nuevo">
            <Plus className="w-4 h-4" />
            Nuevo Conteo
          </Link>
        </Button>
      </div>

      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex gap-3">
            <select
              value={estadoFilter}
              onChange={(e) => { setEstadoFilter(e.target.value); setPage(1); }}
              className="px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white"
            >
              <option value="">Todos los estados</option>
              <option value="borrador">Borrador</option>
              <option value="en_progreso">En Progreso</option>
              <option value="finalizado">Finalizado</option>
              <option value="aprobado">Aprobado</option>
              <option value="rechazado">Rechazado</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
          </div>
        ) : conteos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-neutral-400">
            <ClipboardList className="w-16 h-16 mb-4" />
            <p className="text-lg font-medium">No se encontraron conteos</p>
            <p className="text-sm mt-1">Cree un nuevo conteo para comenzar</p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {conteos.map((c) => {
              const ec = estadoConfig[c.estado] || estadoConfig.borrador;
              const progreso = c.total_items > 0 ? Math.round((c.items_contados / c.total_items) * 100) : 0;
              return (
                <div key={c.id} className="p-6 hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <Link href={`/inventario/conteos/${c.id}`} className="text-lg font-semibold text-neutral-900 dark:text-white hover:text-primary-600">
                          {c.nombre}
                        </Link>
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${ec.bg} ${ec.text}`}>
                          {ec.icon}
                          {ec.label}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-neutral-500">
                        {c.ubicacion && <span>Ubicación: {c.ubicacion.codigo} - {c.ubicacion.nombre}</span>}
                        {c.categoria && <span>Categoría: {c.categoria.nombre}</span>}
                        <span>Creado por: {c.usuario ? `${c.usuario.first_name} ${c.usuario.last_name}` : '—'}</span>
                        <span>{new Date(c.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Link href={`/inventario/conteos/${c.id}`} className="p-2 rounded-lg text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800">
                        <Eye className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-neutral-500">Total Items</p>
                      <p className="text-lg font-semibold text-neutral-900 dark:text-white">{c.total_items}</p>
                    </div>
                    <div>
                      <p className="text-xs text-neutral-500">Contados</p>
                      <p className="text-lg font-semibold text-green-600">{c.items_contados}</p>
                    </div>
                    <div>
                      <p className="text-xs text-neutral-500">Con Diferencia</p>
                      <p className={`text-lg font-semibold ${c.items_con_diferencia > 0 ? 'text-red-600' : 'text-neutral-900 dark:text-white'}`}>
                        {c.items_con_diferencia}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-neutral-500">Total Diferencias</p>
                      <p className="text-lg font-semibold text-orange-600">{c.total_diferencias}</p>
                    </div>
                  </div>

                  <div className="mt-3">
                    <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-2">
                      <div
                        className="bg-primary-600 h-2 rounded-full transition-all"
                        style={{ width: `${progreso}%` }}
                      />
                    </div>
                    <p className="text-xs text-neutral-500 mt-1">{progreso}% completado</p>
                  </div>

                  {c.estado === 'borrador' && (
                    <div className="mt-4 flex gap-2">
                      <Button size="sm" onClick={() => handleCambiarEstado(c.id, 'en_progreso')}>
                        <Play className="w-3.5 h-3.5 mr-1" />
                        Iniciar Conteo
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
