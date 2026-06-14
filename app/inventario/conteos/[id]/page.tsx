'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/atoms/Button';
import {
  ClipboardList, Loader2, CheckCircle2, XCircle, Play,
  ArrowLeft, Save, AlertTriangle, Trash2, Search,
} from 'lucide-react';

interface Item {
  id: string;
  producto: { codigo: string; nombre: string; unidad_medida: string; stock_actual: number } | null;
  codigo: string | null;
  nombre: string | null;
  ubicacion: { codigo: string; nombre: string } | null;
  stock_sistema: number;
  stock_fisico: number | null;
  diferencia: number;
  estado: string;
  observaciones: string | null;
}

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
  items: Item[];
}

const estadoBadge: Record<string, { bg: string; text: string; label: string }> = {
  pendiente: { bg: 'bg-neutral-100 dark:bg-neutral-800', text: 'text-neutral-600', label: 'Pendiente' },
  contado: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700', label: 'Contado' },
  revisado: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700', label: 'Revisado' },
  aprobado: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700', label: 'Aprobado' },
};

export default function ConteoDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [conteo, setConteo] = useState<Conteo | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [search, setSearch] = useState('');

  const fetchConteo = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/inventario/api/conteos/${params.id}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setConteo(data);
      const vals: Record<string, string> = {};
      (data.items || []).forEach((item: Item) => {
        vals[item.id] = item.stock_fisico?.toString() || '';
      });
      setEditValues(vals);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchConteo(); }, [params.id]);

  const handleSaveItems = async () => {
    if (!conteo) return;
    setSaving(true);
    try {
      const items = conteo.items.map((item) => ({
        id: item.id,
        stock_fisico: parseInt(editValues[item.id] || '0') || 0,
      }));
      const res = await fetch(`/inventario/api/conteos/${conteo.id}/items`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      });
      const data = await res.json();
      if (data.error) { alert(data.error); return; }
      fetchConteo();
    } catch { alert('Error al guardar items'); }
    finally { setSaving(false); }
  };

  const handleCambiarEstado = async (estado: string) => {
    if (!conteo) return;
    const mensajes: Record<string, string> = {
      en_progreso: '¿Iniciar el conteo?',
      finalizado: '¿Finalizar el conteo?',
      aprobado: '¿Aprobar el conteo? Se generarán ajustes automáticos.',
      rechazado: '¿Rechazar el conteo?',
    };
    if (!window.confirm(mensajes[estado] || '¿Confirmar cambio de estado?')) return;

    try {
      const res = await fetch(`/inventario/api/conteos/${conteo.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado }),
      });
      const data = await res.json();
      if (data.error) { alert(data.error); return; }
      fetchConteo();
    } catch { alert('Error al cambiar estado'); }
  };

  const handleDelete = async () => {
    if (!conteo || !window.confirm('¿Eliminar este conteo?')) return;
    try {
      const res = await fetch(`/inventario/api/conteos/${conteo.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.error) { alert(data.error); return; }
      router.push('/inventario/conteos');
    } catch { alert('Error al eliminar'); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
      </div>
    );
  }

  if (!conteo) {
    return <div className="text-center py-20 text-neutral-500">Conteo no encontrado</div>;
  }

  const filteredItems = conteo.items.filter((i) => {
    if (!search) return true;
    const q = search.toLowerCase();
    const cod = (i.producto?.codigo || i.codigo || '').toLowerCase();
    const nom = (i.producto?.nombre || i.nombre || '').toLowerCase();
    return cod.includes(q) || nom.includes(q);
  });
  const totalItems = conteo.items.length;
  const itemsContados = conteo.items.filter((i) => i.stock_fisico !== null).length;
  const itemsConDiferencia = conteo.items.filter((i) => i.diferencia !== 0 && i.stock_fisico !== null).length;
  const progreso = totalItems > 0 ? Math.round((itemsContados / totalItems) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 rounded-lg text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">{conteo.nombre}</h1>
          <p className="text-neutral-500 mt-1">
            Creado {new Date(conteo.created_at).toLocaleDateString()} por {conteo.usuario ? `${conteo.usuario.first_name} ${conteo.usuario.last_name}` : '—'}
            {conteo.ubicacion && ` • ${conteo.ubicacion.codigo} - ${conteo.ubicacion.nombre}`}
          </p>
        </div>
        {conteo.estado === 'borrador' && (
          <Button variant="outline" onClick={handleDelete} className="gap-2 text-red-600">
            <Trash2 className="w-4 h-4" /> Eliminar
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-neutral-900 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800">
          <p className="text-xs text-neutral-500">Total Items</p>
          <p className="text-2xl font-bold text-neutral-900 dark:text-white">{totalItems}</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800">
          <p className="text-xs text-neutral-500">Contados</p>
          <p className="text-2xl font-bold text-green-600">{itemsContados}</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800">
          <p className="text-xs text-neutral-500">Con Diferencia</p>
          <p className={`text-2xl font-bold ${itemsConDiferencia > 0 ? 'text-red-600' : 'text-neutral-900 dark:text-white'}`}>{itemsConDiferencia}</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800">
          <p className="text-xs text-neutral-500">Progreso</p>
          <p className="text-2xl font-bold text-primary-600">{progreso}%</p>
        </div>
      </div>

      <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-2.5">
        <div className="bg-primary-600 h-2.5 rounded-full transition-all" style={{ width: `${progreso}%` }} />
      </div>

      {['borrador', 'en_progreso'].includes(conteo.estado) && (
        <div className="flex gap-3">
          {conteo.estado === 'borrador' && (
            <Button onClick={() => handleCambiarEstado('en_progreso')} className="gap-2">
              <Play className="w-4 h-4" /> Iniciar Conteo
            </Button>
          )}
          <Button onClick={handleSaveItems} disabled={saving || itemsContados === 0} className="gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Guardar Conteos
          </Button>
          {itemsContados === totalItems && conteo.estado === 'en_progreso' && (
            <Button onClick={() => handleCambiarEstado('finalizado')} variant="outline" className="gap-2">
              <CheckCircle2 className="w-4 h-4" /> Finalizar Conteo
            </Button>
          )}
        </div>
      )}

      {conteo.estado === 'finalizado' && (
        <div className="flex gap-3">
          <Button onClick={() => handleCambiarEstado('aprobado')} className="gap-2 bg-green-600 hover:bg-green-700">
            <CheckCircle2 className="w-4 h-4" /> Aprobar (generar ajustes)
          </Button>
          <Button onClick={() => handleCambiarEstado('rechazado')} variant="outline" className="gap-2 text-red-600">
            <XCircle className="w-4 h-4" /> Rechazar
          </Button>
        </div>
      )}

      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="font-semibold text-lg text-neutral-900 dark:text-white">Items del Conteo</h2>
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por código o nombre..."
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white placeholder-neutral-400"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-50 dark:bg-neutral-800/50">
              <tr>
                <th className="p-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Código</th>
                <th className="p-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Producto</th>
                <th className="p-4 text-center text-xs font-semibold text-neutral-500 uppercase tracking-wider">Stock Sistema</th>
                <th className="p-4 text-center text-xs font-semibold text-neutral-500 uppercase tracking-wider">Stock Físico</th>
                <th className="p-4 text-center text-xs font-semibold text-neutral-500 uppercase tracking-wider">Diferencia</th>
                <th className="p-4 text-center text-xs font-semibold text-neutral-500 uppercase tracking-wider">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-neutral-500 text-sm">No se encontraron items</td>
                </tr>
              ) : filteredItems.map((item) => {
                const eb = estadoBadge[item.estado] || estadoBadge.pendiente;
                const diff = item.stock_fisico !== null ? item.stock_fisico - item.stock_sistema : 0;
                const puedeEditar = ['borrador', 'en_progreso'].includes(conteo.estado);
                return (
                  <tr key={item.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                    <td className="p-4 font-mono text-sm text-neutral-600">{item.producto?.codigo || item.codigo || '—'}</td>
                    <td className="p-4 font-medium text-neutral-900 dark:text-white">{item.producto?.nombre || item.nombre || '—'}</td>
                    <td className="p-4 text-center font-mono text-neutral-900 dark:text-white">{item.stock_sistema}</td>
                    <td className="p-4 text-center">
                      {puedeEditar ? (
                        <input
                          type="number"
                          min="0"
                          value={editValues[item.id] ?? ''}
                          onChange={(e) => setEditValues(prev => ({ ...prev, [item.id]: e.target.value }))}
                          className="w-24 px-3 py-1.5 text-center rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white font-mono"
                        />
                      ) : (
                        <span className="font-mono">{item.stock_fisico ?? '—'}</span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      {item.stock_fisico !== null ? (
                        <span className={`font-mono font-semibold ${diff === 0 ? 'text-green-600' : diff > 0 ? 'text-blue-600' : 'text-red-600'}`}>
                          {diff > 0 ? '+' : ''}{diff}
                        </span>
                      ) : (
                        <span className="text-neutral-400">—</span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${eb.bg} ${eb.text}`}>{eb.label}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
