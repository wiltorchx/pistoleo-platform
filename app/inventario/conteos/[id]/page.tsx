'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/atoms/Button';
import {
  ClipboardList, Loader2, CheckCircle2, XCircle, Play,
  ArrowLeft, Save, AlertTriangle, Trash2, Search,
  MessageSquareText, X, Plus, Minus, ChevronDown,
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

interface CommentOption {
  value: string;
  label: string;
  icon: string;
  isVendido?: boolean;
  isCustom?: boolean;
}

const PREDEFINED_COMMENTS: CommentOption[] = [
  { value: 'exhibicion', label: 'Exhibición', icon: '🪟' },
  { value: 'bodega_arriba', label: 'Bodega Arriba', icon: '⬆️' },
  { value: 'bodega_abajo', label: 'Bodega Abajo', icon: '⬇️' },
  { value: 'bano_1', label: 'Baño 1', icon: '🚿' },
  { value: 'bano_2', label: 'Baño 2', icon: '🚿' },
  { value: 'reserva', label: 'Reserva', icon: '🔒' },
  { value: 'vendido', label: 'Vendido', icon: '💰', isVendido: true },
  { value: 'custom', label: 'Otro...', icon: '✏️', isCustom: true },
];



const estadoBadge: Record<string, { bg: string; text: string; label: string }> = {
  pendiente: { bg: 'bg-neutral-100 dark:bg-neutral-800', text: 'text-neutral-600', label: 'Pendiente' },
  contado: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700', label: 'Contado' },
  revisado: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700', label: 'Revisado' },
  aprobado: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700', label: 'Aprobado' },
};

const commentLabels: Record<string, string> = {
  exhibicion: 'Exhibición',
  bodega_arriba: 'Bodega Arriba',
  bodega_abajo: 'Bodega Abajo',
  bano_1: 'Baño 1',
  bano_2: 'Baño 2',
  reserva: 'Reserva',
  vendido: 'Vendido',
};

export default function ConteoDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [conteo, setConteo] = useState<Conteo | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [itemComments, setItemComments] = useState<Record<string, string>>({});
  const [customCommentInput, setCustomCommentInput] = useState('');
  const [commentModalItem, setCommentModalItem] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const fetchConteo = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/inventario/api/conteos/${params.id}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setConteo(data);
      const vals: Record<string, string> = {};
      const comments: Record<string, string> = {};
      (data.items || []).forEach((item: Item) => {
        vals[item.id] = item.stock_fisico?.toString() || '';
        if (item.observaciones) comments[item.id] = item.observaciones;
      });
      setEditValues(vals);
      setItemComments(comments);
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
        observaciones: itemComments[item.id] || null,
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

  const handleCommentSelect = (itemId: string, value: string) => {
    setCommentModalItem(null);
    if (value === 'vendido') {
      setEditValues(prev => ({ ...prev, [itemId]: '0' }));
      setItemComments(prev => ({ ...prev, [itemId]: 'vendido' }));
      return;
    }
    if (value === 'custom') {
      setCustomCommentInput('');
      setCommentModalItem(itemId);
      return;
    }
    setItemComments(prev => ({ ...prev, [itemId]: value }));
  };

  const handleCustomCommentSave = () => {
    if (!commentModalItem || !customCommentInput.trim()) return;
    setItemComments(prev => ({ ...prev, [commentModalItem]: customCommentInput.trim() }));
    setCommentModalItem(null);
    setCustomCommentInput('');
  };

  const handleCambiarEstado = async (estado: string) => {
    if (!conteo) return;
    const mensajes: Record<string, string> = {
      en_progreso: conteo.estado === 'borrador' ? '¿Iniciar el conteo?' : '¿Reabrir el conteo para editar?',
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
  const pendingEdits = conteo.items.filter((i) => editValues[i.id] !== (i.stock_fisico?.toString() || '')).length;
  const itemsConDiferencia = conteo.items.filter((i) => i.diferencia !== 0 && i.stock_fisico !== null).length;
  const itemsVendidos = conteo.items.filter(i => itemComments[i.id] === 'vendido').length;
  const progreso = totalItems > 0 ? Math.round(((itemsContados + pendingEdits) / totalItems) * 100) : 0;

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
        <Button variant="outline" onClick={handleDelete} className="gap-2 text-red-600">
          <Trash2 className="w-4 h-4" /> Eliminar
        </Button>
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
        <div className="bg-white dark:bg-neutral-900 p-4 rounded-xl border border-amber-200 dark:border-amber-800">
          <p className="text-xs text-amber-600 dark:text-amber-400">Vendidos</p>
          <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">{itemsVendidos}</p>
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
          <Button onClick={handleSaveItems} disabled={saving || pendingEdits === 0} className="gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Guardar Conteos
          </Button>
          {conteo.estado === 'en_progreso' && (
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
          <Button onClick={() => handleCambiarEstado('en_progreso')} variant="outline" className="gap-2">
            <Play className="w-4 h-4" /> Reabrir Conteo
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
                <th className="p-5 text-center text-xs font-semibold text-neutral-500 uppercase tracking-wider w-10">#</th>
                <th className="p-5 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Código</th>
                <th className="p-5 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Producto</th>
                <th className="p-5 text-center text-xs font-semibold text-neutral-500 uppercase tracking-wider">Stock Sistema</th>
                <th className="p-5 text-center text-xs font-semibold text-neutral-500 uppercase tracking-wider">Stock Físico</th>
                <th className="p-5 text-center text-xs font-semibold text-neutral-500 uppercase tracking-wider">Diferencia</th>
                <th className="p-5 text-center text-xs font-semibold text-neutral-500 uppercase tracking-wider">Comentario</th>
                <th className="p-5 text-center text-xs font-semibold text-neutral-500 uppercase tracking-wider">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-neutral-500 text-sm">No se encontraron items</td>
                </tr>
              ) : filteredItems.map((item, idx) => {
                const eb = estadoBadge[item.estado] || estadoBadge.pendiente;
                const diff = item.stock_fisico !== null ? item.stock_fisico - item.stock_sistema : 0;
                const puedeEditar = conteo.estado === 'en_progreso';
                const comment = itemComments[item.id];
                const esVendido = comment === 'vendido';
                return (
                  <tr key={item.id} className={`${esVendido ? 'bg-red-50 dark:bg-red-900/20 line-through text-red-600 dark:text-red-400' : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/50'}`}>
                    <td className={`p-5 text-center text-sm font-mono ${esVendido ? 'text-red-500' : 'text-neutral-400'}`}>{idx + 1}</td>
                    <td className="p-5 font-mono text-sm">{item.producto?.codigo || item.codigo || '—'}</td>
                    <td className={`p-5 font-medium ${esVendido ? 'text-red-600 dark:text-red-400' : 'text-neutral-900 dark:text-white'}`}>{item.producto?.nombre || item.nombre || '—'}</td>
                    <td className={`p-5 text-center font-mono ${esVendido ? 'text-red-500' : 'text-neutral-900 dark:text-white'}`}>{item.stock_sistema}</td>
                    <td className="p-5 text-center min-w-[140px]">
                      {puedeEditar && !esVendido ? (
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => {
                              const val = parseInt(editValues[item.id] || '0') || 0;
                              setEditValues(prev => ({ ...prev, [item.id]: Math.max(0, val - 1).toString() }));
                            }}
                            className="w-11 h-11 flex items-center justify-center rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 active:scale-95 transition-transform"
                          >
                            <Minus className="w-5 h-5" />
                          </button>
                          <input
                            type="number"
                            min="0"
                            value={editValues[item.id] ?? ''}
                            onChange={(e) => setEditValues(prev => ({ ...prev, [item.id]: e.target.value }))}
                            className="w-20 h-11 px-2 text-center rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white font-mono text-base"
                          />
                          <button
                            onClick={() => {
                              const val = parseInt(editValues[item.id] || '0') || 0;
                              setEditValues(prev => ({ ...prev, [item.id]: (val + 1).toString() }));
                            }}
                            className="w-11 h-11 flex items-center justify-center rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 active:scale-95 transition-transform"
                          >
                            <Plus className="w-5 h-5" />
                          </button>
                        </div>
                      ) : esVendido ? (
                        <span className="font-mono text-red-600 dark:text-red-400 font-semibold bg-red-100 dark:bg-red-900/30 px-3 py-1.5 rounded-lg">VENDIDO</span>
                      ) : (
                        <span className="font-mono">{item.stock_fisico ?? '—'}</span>
                      )}
                    </td>
                    <td className="p-5 text-center">
                      {item.stock_fisico !== null ? (
                        <span className={`font-mono font-semibold ${diff === 0 ? 'text-green-600' : diff > 0 ? 'text-blue-600' : 'text-red-600'}`}>
                          {diff > 0 ? '+' : ''}{diff}
                        </span>
                      ) : (
                        <span className="text-neutral-400">—</span>
                      )}
                    </td>
                    <td className="p-5 text-center">
                      {puedeEditar ? (
                        <button
                          onClick={() => setCommentModalItem(item.id)}
                          className={`inline-flex items-center gap-1.5 h-11 px-3 rounded-lg border text-sm font-medium transition-colors ${
                            comment
                              ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-300 dark:border-primary-700 text-primary-700 dark:text-primary-300'
                              : 'border-neutral-300 dark:border-neutral-700 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                          }`}
                        >
                          <MessageSquareText className="w-4 h-4" />
                          {comment ? commentLabels[comment] || comment : 'Comentar'}
                        </button>
                      ) : (
                        <span className="text-xs text-neutral-500">{comment ? (commentLabels[comment] || comment) : '—'}</span>
                      )}
                    </td>
                    <td className="p-5 text-center">
                      {esVendido ? (
                        <span className="px-3 py-1.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300">VENDIDO</span>
                      ) : (
                        <span className={`px-3 py-1.5 rounded-full text-xs font-medium ${eb.bg} ${eb.text}`}>{eb.label}</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {conteo.estado === 'finalizado' && (
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 space-y-4">
          <h2 className="font-semibold text-lg text-neutral-900 dark:text-white">Reporte de Conteo</h2>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-xl">
              <p className="text-xs text-green-600 dark:text-green-400">Sin Diferencia</p>
              <p className="text-xl font-bold text-green-700 dark:text-green-300">
                {conteo.items.filter(i => i.stock_fisico !== null && (i.stock_fisico - i.stock_sistema) === 0).length}
              </p>
            </div>
            <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-xl">
              <p className="text-xs text-red-600 dark:text-red-400">Con Diferencia</p>
              <p className="text-xl font-bold text-red-700 dark:text-red-300">{itemsConDiferencia}</p>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
              <p className="text-xs text-blue-600 dark:text-blue-400">Sin Contar</p>
              <p className="text-xl font-bold text-blue-700 dark:text-blue-300">
                {totalItems - itemsContados}
              </p>
            </div>
            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
              <p className="text-xs text-amber-600 dark:text-amber-400">Vendidos</p>
              <p className="text-xl font-bold text-amber-700 dark:text-amber-300">{itemsVendidos}</p>
            </div>
            <div className="p-3 bg-neutral-50 dark:bg-neutral-800 rounded-xl">
              <p className="text-xs text-neutral-500">Total Items</p>
              <p className="text-xl font-bold text-neutral-900 dark:text-white">{totalItems}</p>
            </div>
          </div>
          {itemsVendidos > 0 && (
            <div className="bg-amber-50 dark:bg-amber-900/10 rounded-xl overflow-hidden">
              <div className="p-3 border-b border-amber-200 dark:border-amber-800">
                <span className="text-sm font-medium text-amber-700 dark:text-amber-300">Items Vendidos</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-amber-200 dark:border-amber-800">
                      <th className="p-2 text-left text-xs font-semibold text-amber-600 uppercase">Código</th>
                      <th className="p-2 text-left text-xs font-semibold text-amber-600 uppercase">Producto</th>
                      <th className="p-2 text-center text-xs font-semibold text-amber-600 uppercase">Stock Sistema</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-amber-200 dark:divide-amber-800">
                    {conteo.items.filter(i => itemComments[i.id] === 'vendido').map(item => (
                      <tr key={item.id}>
                        <td className="p-2 font-mono text-xs text-neutral-900 dark:text-white line-through">{item.producto?.codigo || item.codigo}</td>
                        <td className="p-2 text-xs text-neutral-600 dark:text-neutral-400 line-through">{item.producto?.nombre || item.nombre}</td>
                        <td className="p-2 text-center font-mono text-xs line-through">{item.stock_sistema}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {itemsConDiferencia > 0 && (
            <div className="bg-red-50 dark:bg-red-900/10 rounded-xl overflow-hidden">
              <div className="p-3 border-b border-red-200 dark:border-red-800">
                <span className="text-sm font-medium text-red-700 dark:text-red-300">Items con Diferencia</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-red-200 dark:border-red-800">
                      <th className="p-2 text-left text-xs font-semibold text-red-600 uppercase">Código</th>
                      <th className="p-2 text-left text-xs font-semibold text-red-600 uppercase">Producto</th>
                      <th className="p-2 text-center text-xs font-semibold text-red-600 uppercase">Stock Sistema</th>
                      <th className="p-2 text-center text-xs font-semibold text-red-600 uppercase">Stock Físico</th>
                      <th className="p-2 text-center text-xs font-semibold text-red-600 uppercase">Diferencia</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-red-200 dark:divide-red-800">
                    {conteo.items.filter(i => i.stock_fisico !== null && (i.stock_fisico - i.stock_sistema) !== 0).map(item => {
                      const diff = item.stock_fisico! - item.stock_sistema;
                      return (
                        <tr key={item.id}>
                          <td className="p-2 font-mono text-xs text-neutral-900 dark:text-white">{item.producto?.codigo || item.codigo}</td>
                          <td className="p-2 text-xs text-neutral-600 dark:text-neutral-400">{item.producto?.nombre || item.nombre}</td>
                          <td className="p-2 text-center font-mono text-xs">{item.stock_sistema}</td>
                          <td className="p-2 text-center font-mono text-xs">{item.stock_fisico}</td>
                          <td className={`p-2 text-center font-mono text-xs font-semibold ${diff > 0 ? 'text-blue-600' : 'text-red-600'}`}>
                            {diff > 0 ? '+' : ''}{diff}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {commentModalItem && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setCommentModalItem(null)} />
          <div className="relative bg-white dark:bg-neutral-900 w-full max-w-lg rounded-t-2xl sm:rounded-2xl p-6 shadow-xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">Agregar Comentario</h3>
              <button onClick={() => setCommentModalItem(null)} className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800">
                <X className="w-5 h-5 text-neutral-500" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {PREDEFINED_COMMENTS.filter(c => !c.isCustom).map((c) => (
                <button
                  key={c.value}
                  onClick={() => handleCommentSelect(commentModalItem, c.value)}
                  className={`flex items-center gap-3 h-14 px-4 rounded-xl border-2 text-base font-medium transition-all active:scale-95 ${
                    itemComments[commentModalItem] === c.value
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                      : c.isVendido
                      ? 'border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20'
                      : 'border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800'
                  }`}
                >
                  <span className="text-xl">{c.icon}</span>
                  <span>{c.label}</span>
                </button>
              ))}
            </div>
            {commentModalItem && !PREDEFINED_COMMENTS.find(c => c.value === itemComments[commentModalItem]) && itemComments[commentModalItem] && !commentLabels[itemComments[commentModalItem]] && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Comentario personalizado actual:</label>
                <div className="flex items-center gap-2">
                  <span className="flex-1 text-base text-neutral-900 dark:text-white bg-neutral-50 dark:bg-neutral-800 px-4 py-3 rounded-lg">{itemComments[commentModalItem]}</span>
                  <button onClick={() => setItemComments(prev => { const n = { ...prev }; delete n[commentModalItem]; return n; })} className="p-3 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
            <div className="mt-5 pt-4 border-t border-neutral-200 dark:border-neutral-700">
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Comentario personalizado</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={customCommentInput}
                  onChange={(e) => setCustomCommentInput(e.target.value)}
                  placeholder="Escribe un comentario..."
                  className="flex-1 h-12 px-4 text-base rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white placeholder-neutral-400"
                />
                <button
                  onClick={handleCustomCommentSave}
                  disabled={!customCommentInput.trim()}
                  className="h-12 px-5 rounded-xl bg-primary-600 text-white font-medium text-sm hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Agregar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
