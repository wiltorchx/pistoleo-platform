'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';
import {
  Warehouse,
  Plus,
  Edit3,
  Trash2,
  Save,
  X,
  Loader2,
  ChevronRight,
  ChevronDown,
  Package,
  Layers,
} from 'lucide-react';

interface Ubicacion {
  id: string;
  codigo: string;
  nombre: string;
  tipo: string;
  ubicacion_padre_id: string | null;
  activo: boolean;
  total_productos: number;
  hijos?: Ubicacion[];
}

const TIPOS = [
  { value: 'bodega', label: 'Bodega' },
  { value: 'zona', label: 'Zona' },
  { value: 'pasillo', label: 'Pasillo' },
  { value: 'estanteria', label: 'Estantería' },
  { value: 'nivel', label: 'Nivel' },
  { value: 'posicion', label: 'Posición' },
];

const ICONO_TIPO: Record<string, string> = {
  bodega: '🏭',
  zona: '📦',
  pasillo: '🛤️',
  estanteria: '🗄️',
  nivel: '📏',
  posicion: '📍',
};

export default function UbicacionesPage() {
  const router = useRouter();
  const [ubicaciones, setUbicaciones] = useState<Ubicacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const [form, setForm] = useState({
    codigo: '',
    nombre: '',
    tipo: 'posicion',
    ubicacion_padre_id: '',
  });

  const fetchUbicaciones = async () => {
    try {
      const res = await fetch('/inventario/api/ubicaciones?tree=true');
      const data = await res.json();
      if (!data.error) setUbicaciones(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUbicaciones(); }, []);

  const resetForm = () => {
    setForm({ codigo: '', nombre: '', tipo: 'posicion', ubicacion_padre_id: '' });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (ubic: Ubicacion) => {
    setForm({
      codigo: ubic.codigo,
      nombre: ubic.nombre,
      tipo: ubic.tipo,
      ubicacion_padre_id: ubic.ubicacion_padre_id || '',
    });
    setEditingId(ubic.id);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.codigo.trim() || !form.nombre.trim()) return;
    setSaving(true);
    try {
      const url = editingId
        ? `/inventario/api/ubicaciones/${editingId}`
        : '/inventario/api/ubicaciones';
      const method = editingId ? 'PATCH' : 'POST';

      const body: Record<string, unknown> = {
        codigo: form.codigo.trim(),
        nombre: form.nombre.trim(),
        tipo: form.tipo,
      };
      if (form.ubicacion_padre_id) body.ubicacion_padre_id = form.ubicacion_padre_id;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.error) { alert(data.error); return; }
      resetForm();
      fetchUbicaciones();
    } catch {
      alert('Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/inventario/api/ubicaciones/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.error) { alert(data.error); return; }
      setDeleteConfirm(null);
      fetchUbicaciones();
    } catch {
      alert('Error al eliminar');
    }
  };

  const toggleExpand = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const flattenForSelect = (items: Ubicacion[], depth = 0): Array<{ id: string; label: string; depth: number }> => {
    const result: Array<{ id: string; label: string; depth: number }> = [];
    for (const item of items) {
      result.push({ id: item.id, label: `${item.codigo} - ${item.nombre}`, depth });
      if (item.hijos && item.hijos.length > 0) {
        result.push(...flattenForSelect(item.hijos, depth + 1));
      }
    }
    return result;
  };

  const flatUbicaciones = flattenForSelect(ubicaciones);

  const renderTree = (items: Ubicacion[], depth = 0) => {
    return items.map(ubic => {
      const hasChildren = ubic.hijos && ubic.hijos.length > 0;
      const isExpanded = expanded.has(ubic.id);

      return (
        <React.Fragment key={ubic.id}>
          <div
            className={`flex items-center gap-2 px-4 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 cursor-pointer border-b border-neutral-100 dark:border-neutral-800/50 group`}
            style={{ paddingLeft: `${16 + depth * 24}px` }}
            onClick={() => router.push(`/inventario/ubicaciones/${ubic.id}`)}
          >
            {hasChildren ? (
              <button
                onClick={(e) => { e.stopPropagation(); toggleExpand(ubic.id); }}
                className="p-0.5 rounded text-neutral-400 hover:text-neutral-600"
              >
                {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
            ) : (
              <div className="w-5" />
            )}
            <span className="text-base">{ICONO_TIPO[ubic.tipo] || '📦'}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-semibold text-primary-600 dark:text-primary-400">{ubic.codigo}</span>
                <span className="font-medium text-neutral-900 dark:text-white truncate">{ubic.nombre}</span>
                <span className="text-xs text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded-full">{ubic.tipo}</span>
              </div>
              <p className="text-xs text-neutral-500 mt-0.5 flex items-center gap-1">
                <Package className="w-3 h-3" />
                {ubic.total_productos} producto(s)
              </p>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
              <button onClick={() => handleEdit(ubic)} className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-800">
                <Edit3 className="w-4 h-4" />
              </button>
              {deleteConfirm === ubic.id ? (
                <div className="flex">
                  <button onClick={() => handleDelete(ubic.id)} className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 text-xs font-medium">Eliminar</button>
                  <button onClick={() => setDeleteConfirm(null)} className="p-1.5 rounded-lg text-neutral-400 hover:bg-neutral-100"><X className="w-4 h-4" /></button>
                </div>
              ) : (
                <button onClick={() => setDeleteConfirm(ubic.id)} className="p-1.5 rounded-lg text-neutral-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
          {hasChildren && isExpanded && renderTree(ubic.hijos!, depth + 1)}
        </React.Fragment>
      );
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">Ubicaciones</h1>
          <p className="text-neutral-500 mt-1">Gestión jerárquica de ubicaciones de inventario</p>
        </div>
        <Button variant="primary" className="gap-2" onClick={() => { resetForm(); setShowForm(true); }}>
          <Plus className="w-4 h-4" />
          Nueva Ubicación
        </Button>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-lg text-neutral-900 dark:text-white">
              {editingId ? 'Editar Ubicación' : 'Nueva Ubicación'}
            </h2>
            <button onClick={resetForm} className="p-2 rounded-lg text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Input
              label="Código"
              value={form.codigo}
              onChange={e => setForm(p => ({ ...p, codigo: e.target.value }))}
              placeholder="Ej: BOD-01"
              required
            />
            <Input
              label="Nombre"
              value={form.nombre}
              onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))}
              placeholder="Ej: Bodega Principal"
              required
            />
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Tipo</label>
              <select
                value={form.tipo}
                onChange={e => setForm(p => ({ ...p, tipo: e.target.value }))}
                className="w-full px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white"
              >
                {TIPOS.map(t => (
                  <option key={t.value} value={t.value}>{ICONO_TIPO[t.value]} {t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Ubicación Padre</label>
              <select
                value={form.ubicacion_padre_id}
                onChange={e => setForm(p => ({ ...p, ubicacion_padre_id: e.target.value }))}
                className="w-full px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white"
              >
                <option value="">Ninguna (raíz)</option>
                {flatUbicaciones.filter(u => u.id !== editingId).map(u => (
                  <option key={u.id} value={u.id}>
                    {'  '.repeat(u.depth)}{u.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-800">
            <Button variant="ghost" onClick={resetForm}>Cancelar</Button>
            <Button variant="primary" className="gap-2" onClick={handleSave} disabled={saving || !form.codigo.trim() || !form.nombre.trim()}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {editingId ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        </div>
      )}

      {ubicaciones.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-neutral-400 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800">
          <Warehouse className="w-16 h-16 mb-4" />
          <p className="text-lg font-medium">No hay ubicaciones</p>
          <p className="text-sm mt-1">Cree ubicaciones para organizar el inventario físicamente</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
          <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center gap-2 text-sm text-neutral-500">
            <Layers className="w-4 h-4" />
            <span>Estructura jerárquica de ubicaciones</span>
          </div>
          {renderTree(ubicaciones)}
        </div>
      )}
    </div>
  );
}
