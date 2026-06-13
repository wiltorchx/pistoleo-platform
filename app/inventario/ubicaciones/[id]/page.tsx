'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/atoms/Button';
import {
  ArrowLeft,
  Loader2,
  Warehouse,
  Package,
  Edit3,
  Save,
  X,
  ChevronRight,
} from 'lucide-react';

interface UbicacionDetalle {
  id: string;
  codigo: string;
  nombre: string;
  tipo: string;
  ubicacion_padre_id: string | null;
  ubicacion_padre: { id: string; codigo: string; nombre: string; tipo: string } | null;
  activo: boolean;
  total_productos: number;
  hijos: Array<{ id: string; codigo: string; nombre: string; tipo: string; total_productos: number }>;
  productos: Array<{ id: string; codigo: string; nombre: string; stock_actual: number; stock_minimo: number; stock_bajo: boolean }>;
  created_at: string;
  updated_at: string;
}

const TIPOS: Record<string, string> = {
  bodega: '🏭 Bodega',
  zona: '📦 Zona',
  pasillo: '🛤️ Pasillo',
  estanteria: '🗄️ Estantería',
  nivel: '📏 Nivel',
  posicion: '📍 Posición',
};

export default function UbicacionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [ubicacion, setUbicacion] = useState<UbicacionDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ codigo: '', nombre: '', tipo: 'posicion' });

  const fetchUbicacion = async () => {
    try {
      const res = await fetch(`/inventario/api/ubicaciones/${params.id}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setUbicacion(data);
      setForm({ codigo: data.codigo, nombre: data.nombre, tipo: data.tipo });
    } catch {
      setUbicacion(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUbicacion(); }, [params.id]);

  const handleSave = async () => {
    if (!form.codigo.trim() || !form.nombre.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/inventario/api/ubicaciones/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.error) { alert(data.error); return; }
      setEditing(false);
      fetchUbicacion();
    } catch {
      alert('Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 text-primary-600 animate-spin" /></div>;
  }

  if (!ubicacion) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-neutral-400">
        <Warehouse className="w-16 h-16 mb-4" />
        <p className="text-lg font-medium">Ubicación no encontrada</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push('/inventario/ubicaciones')}>Volver</Button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => router.push('/inventario/ubicaciones')} className="p-2 rounded-lg text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{TIPOS[ubicacion.tipo]?.split(' ')[0] || '📦'}</span>
            <div>
              <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">{ubicacion.nombre}</h1>
              <div className="flex items-center gap-2 mt-0.5 text-sm">
                <span className="font-mono text-primary-600">{ubicacion.codigo}</span>
                <span className="text-neutral-400">•</span>
                <span className="text-neutral-500">{TIPOS[ubicacion.tipo] || ubicacion.tipo}</span>
                {ubicacion.ubicacion_padre && (
                  <>
                    <span className="text-neutral-400">•</span>
                    <button
                      onClick={() => router.push(`/inventario/ubicaciones/${ubicacion.ubicacion_padre!.id}`)}
                      className="text-primary-600 hover:underline flex items-center gap-1"
                    >
                      <ChevronRight className="w-3 h-3" />
                      {ubicacion.ubicacion_padre.codigo} - {ubicacion.ubicacion_padre.nombre}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
        {!editing ? (
          <Button variant="outline" className="gap-2" onClick={() => setEditing(true)}>
            <Edit3 className="w-4 h-4" /> Editar
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => { setEditing(false); fetchUbicacion(); }}><X className="w-4 h-4" /></Button>
            <Button variant="primary" className="gap-2" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Guardar
            </Button>
          </div>
        )}
      </div>

      {editing && (
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Código</label>
              <input value={form.codigo} onChange={e => setForm(p => ({ ...p, codigo: e.target.value }))} className="w-full px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Nombre</label>
              <input value={form.nombre} onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))} className="w-full px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Tipo</label>
              <select value={form.tipo} onChange={e => setForm(p => ({ ...p, tipo: e.target.value }))} className="w-full px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white">
                {Object.entries(TIPOS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6">
          <h2 className="font-semibold text-lg text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
            <Warehouse className="w-5 h-5 text-primary-600" />
            Sub-ubicaciones
          </h2>
          {ubicacion.hijos.length === 0 ? (
            <p className="text-neutral-400 text-sm">No hay sub-ubicaciones</p>
          ) : (
            <div className="space-y-2">
              {ubicacion.hijos.map(hijo => (
                <div
                  key={hijo.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 cursor-pointer transition-colors"
                  onClick={() => router.push(`/inventario/ubicaciones/${hijo.id}`)}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{TIPOS[hijo.tipo]?.split(' ')[0] || '📦'}</span>
                    <div>
                      <p className="font-medium text-neutral-900 dark:text-white">{hijo.nombre}</p>
                      <p className="font-mono text-xs text-primary-600">{hijo.codigo}</p>
                    </div>
                  </div>
                  <span className="text-sm text-neutral-500 flex items-center gap-1">
                    <Package className="w-3.5 h-3.5" /> {hijo.total_productos}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
          <div className="p-5 border-b border-neutral-200 dark:border-neutral-800">
            <h2 className="font-semibold text-lg text-neutral-900 dark:text-white flex items-center gap-2">
              <Package className="w-5 h-5 text-primary-600" />
              Productos en esta ubicación
            </h2>
          </div>
          {ubicacion.productos.length === 0 ? (
            <div className="p-8 text-center text-neutral-400">
              <p>No hay productos en esta ubicación</p>
            </div>
          ) : (
            <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {ubicacion.productos.map(p => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 cursor-pointer"
                  onClick={() => router.push(`/inventario/productos/${p.id}`)}
                >
                  <div>
                    <p className="font-medium text-neutral-900 dark:text-white">{p.nombre}</p>
                    <p className="font-mono text-xs text-primary-600">{p.codigo}</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-mono font-semibold ${p.stock_bajo ? 'text-red-600' : 'text-neutral-900 dark:text-white'}`}>
                      {p.stock_actual}
                    </p>
                    {p.stock_bajo && <p className="text-xs text-red-500">Stock bajo</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6">
        <h2 className="font-semibold text-lg text-neutral-900 dark:text-white mb-4">Información</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Creado</p>
            <p className="text-neutral-900 dark:text-white">{new Date(ubicacion.created_at).toLocaleDateString('es-CL')}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Actualizado</p>
            <p className="text-neutral-900 dark:text-white">{new Date(ubicacion.updated_at).toLocaleDateString('es-CL')}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Estado</p>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ubicacion.activo ? 'bg-green-100 text-green-700' : 'bg-neutral-100 text-neutral-500'}`}>
              {ubicacion.activo ? 'Activo' : 'Inactivo'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
