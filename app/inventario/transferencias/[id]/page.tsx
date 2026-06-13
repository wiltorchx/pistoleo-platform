'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/atoms/Button';
import {
  Truck, Loader2, ArrowLeft, Send, CheckCircle2, XCircle, Save,
} from 'lucide-react';

interface Item {
  id: string;
  producto: { codigo: string; nombre: string; unidad_medida: string; stock_actual: number } | null;
  cantidad_solicitada: number;
  cantidad_enviada: number;
  cantidad_recibida: number;
  estado: string;
  observaciones: string | null;
}

interface Transferencia {
  id: string;
  numero: string;
  estado: string;
  ubicacion_origen: { codigo: string; nombre: string } | null;
  ubicacion_destino: { codigo: string; nombre: string } | null;
  solicitado_por_usuario: { first_name: string; last_name: string } | null;
  recibido_por_usuario: { first_name: string; last_name: string } | null;
  observaciones: string | null;
  fecha_solicitud: string;
  fecha_envio: string | null;
  fecha_recepcion: string | null;
  items: Item[];
}

const estadoItemBadge: Record<string, { bg: string; text: string; label: string }> = {
  pendiente: { bg: 'bg-neutral-100 dark:bg-neutral-800', text: 'text-neutral-600', label: 'Pendiente' },
  enviado: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700', label: 'Enviado' },
  recibido: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700', label: 'Recibido' },
  parcial: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700', label: 'Parcial' },
  cancelado: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700', label: 'Cancelado' },
};

export default function TransferenciaDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [trf, setTrf] = useState<Transferencia | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editValues, setEditValues] = useState<Record<string, string>>({});

  const fetchTrf = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/inventario/api/transferencias/${params.id}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setTrf(data);
      const vals: Record<string, string> = {};
      (data.items || []).forEach((item: Item) => {
        vals[item.id] = item.cantidad_recibida?.toString() || item.cantidad_enviada?.toString() || item.cantidad_solicitada.toString();
      });
      setEditValues(vals);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchTrf(); }, [params.id]);

  const handleCambiarEstado = async (estado: string) => {
    if (!trf) return;
    const msgs: Record<string, string> = {
      enviada: '¿Enviar transferencia? Se descontará stock de origen.',
      recibida: '¿Recibir transferencia? Se agregará stock a destino.',
      cancelada: '¿Cancelar transferencia?',
    };
    if (!window.confirm(msgs[estado] || '¿Confirmar?')) return;
    try {
      const res = await fetch(`/inventario/api/transferencias/${trf.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado }),
      });
      const data = await res.json();
      if (data.error) { alert(data.error); return; }
      fetchTrf();
    } catch { alert('Error'); }
  };

  const handleSaveRecibidos = async () => {
    if (!trf) return;
    setSaving(true);
    try {
      const items = trf.items.map(item => ({
        id: item.id,
        cantidad_recibida: parseInt(editValues[item.id] || '0') || 0,
      }));
      const res = await fetch(`/inventario/api/transferencias/${trf.id}/items`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      });
      const data = await res.json();
      if (data.error) { alert(data.error); return; }
      fetchTrf();
    } catch { alert('Error'); }
    finally { setSaving(false); }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 text-primary-600 animate-spin" /></div>;
  }
  if (!trf) {
    return <div className="text-center py-20 text-neutral-500">Transferencia no encontrada</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 rounded-lg text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">{trf.numero}</h1>
          <p className="text-neutral-500 mt-1">
            Solicitado por {trf.solicitado_por_usuario ? `${trf.solicitado_por_usuario.first_name} ${trf.solicitado_por_usuario.last_name}` : '—'} el {new Date(trf.fecha_solicitud).toLocaleDateString()}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-neutral-900 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800">
          <p className="text-xs text-neutral-500">Origen</p>
          <p className="text-lg font-semibold text-neutral-900 dark:text-white">{trf.ubicacion_origen?.codigo || '—'}</p>
          <p className="text-sm text-neutral-500">{trf.ubicacion_origen?.nombre}</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800">
          <p className="text-xs text-neutral-500">Destino</p>
          <p className="text-lg font-semibold text-neutral-900 dark:text-white">{trf.ubicacion_destino?.codigo || '—'}</p>
          <p className="text-sm text-neutral-500">{trf.ubicacion_destino?.nombre}</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800">
          <p className="text-xs text-neutral-500">Estado</p>
          <p className={`text-lg font-semibold ${
            trf.estado === 'recibida' ? 'text-green-600' : trf.estado === 'enviada' ? 'text-blue-600' : trf.estado === 'cancelada' ? 'text-red-600' : 'text-neutral-900 dark:text-white'
          }`}>
            {trf.estado === 'borrador' ? 'Borrador' : trf.estado === 'enviada' ? 'Enviada' : trf.estado === 'recibida' ? 'Recibida' : 'Cancelada'}
          </p>
        </div>
      </div>

      <div className="flex gap-3">
        {trf.estado === 'borrador' && (
          <>
            <Button onClick={() => handleCambiarEstado('enviada')} className="gap-2">
              <Send className="w-4 h-4" /> Enviar Transferencia
            </Button>
            <Button onClick={() => handleCambiarEstado('cancelada')} variant="outline" className="gap-2 text-red-600">
              <XCircle className="w-4 h-4" /> Cancelar
            </Button>
          </>
        )}
        {trf.estado === 'enviada' && (
          <>
            <Button onClick={handleSaveRecibidos} disabled={saving} className="gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              Confirmar Recepción
            </Button>
            {trf.estado === 'enviada' && (
              <Button onClick={() => handleCambiarEstado('cancelada')} variant="outline" className="gap-2 text-red-600">
                <XCircle className="w-4 h-4" /> Cancelar
              </Button>
            )}
          </>
        )}
      </div>

      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-800">
          <h2 className="font-semibold text-lg text-neutral-900 dark:text-white">Items</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-50 dark:bg-neutral-800/50">
              <tr>
                <th className="p-4 text-left text-xs font-semibold text-neutral-500 uppercase">Código</th>
                <th className="p-4 text-left text-xs font-semibold text-neutral-500 uppercase">Producto</th>
                <th className="p-4 text-center text-xs font-semibold text-neutral-500 uppercase">Solicitado</th>
                <th className="p-4 text-center text-xs font-semibold text-neutral-500 uppercase">Enviado</th>
                {trf.estado === 'enviada' && (
                  <th className="p-4 text-center text-xs font-semibold text-neutral-500 uppercase">Recibir</th>
                )}
                {trf.estado !== 'enviada' && (
                  <th className="p-4 text-center text-xs font-semibold text-neutral-500 uppercase">Recibido</th>
                )}
                <th className="p-4 text-center text-xs font-semibold text-neutral-500 uppercase">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {trf.items.map((item) => {
                const eb = estadoItemBadge[item.estado] || estadoItemBadge.pendiente;
                return (
                  <tr key={item.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                    <td className="p-4 font-mono text-sm text-primary-600">{item.producto?.codigo || '—'}</td>
                    <td className="p-4 font-medium text-neutral-900 dark:text-white">{item.producto?.nombre || '—'}</td>
                    <td className="p-4 text-center font-mono">{item.cantidad_solicitada}</td>
                    <td className="p-4 text-center font-mono text-blue-600">{item.cantidad_enviada || '—'}</td>
                    {trf.estado === 'enviada' ? (
                      <td className="p-4 text-center">
                        <input type="number" min="0"
                          value={editValues[item.id] ?? ''}
                          onChange={(e) => setEditValues(prev => ({ ...prev, [item.id]: e.target.value }))}
                          className="w-20 px-3 py-1.5 text-center rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white font-mono"
                        />
                      </td>
                    ) : (
                      <td className="p-4 text-center font-mono text-green-600">{item.cantidad_recibida || '—'}</td>
                    )}
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

      {trf.observaciones && (
        <div className="bg-white dark:bg-neutral-900 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800">
          <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Observaciones</p>
          <p className="text-sm text-neutral-500 mt-1">{trf.observaciones}</p>
        </div>
      )}
    </div>
  );
}
