'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';
import {
  Tag,
  Plus,
  Edit3,
  Trash2,
  Save,
  X,
  Loader2,
  Package,
} from 'lucide-react';

interface Categoria {
  id: string;
  nombre: string;
  descripcion: string | null;
  color: string;
  activo: boolean;
  total_productos: number;
}

const COLORES = [
  '#6B7280', '#EF4444', '#F97316', '#EAB308', '#22C55E',
  '#14B8A6', '#3B82F6', '#8B5CF6', '#EC4899', '#6366F1',
];

export default function CategoriasPage() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const [form, setForm] = useState({ nombre: '', descripcion: '', color: '#6B7280' });

  const fetchCategorias = async () => {
    try {
      const res = await fetch('/inventario/api/categorias');
      const data = await res.json();
      if (!data.error) setCategorias(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCategorias(); }, []);

  const resetForm = () => {
    setForm({ nombre: '', descripcion: '', color: '#6B7280' });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (cat: Categoria) => {
    setForm({ nombre: cat.nombre, descripcion: cat.descripcion || '', color: cat.color });
    setEditingId(cat.id);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.nombre.trim()) return;
    setSaving(true);
    try {
      const url = editingId
        ? `/inventario/api/categorias/${editingId}`
        : '/inventario/api/categorias';
      const method = editingId ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.error) {
        alert(data.error);
        return;
      }
      resetForm();
      fetchCategorias();
    } catch {
      alert('Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/inventario/api/categorias/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.error) { alert(data.error); return; }
      setDeleteConfirm(null);
      fetchCategorias();
    } catch {
      alert('Error al eliminar');
    }
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
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">Categorías</h1>
          <p className="text-neutral-500 mt-1">{categorias.length} categoría(s)</p>
        </div>
        <Button variant="primary" className="gap-2" onClick={() => { resetForm(); setShowForm(true); }}>
          <Plus className="w-4 h-4" />
          Nueva Categoría
        </Button>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-lg text-neutral-900 dark:text-white">
              {editingId ? 'Editar Categoría' : 'Nueva Categoría'}
            </h2>
            <button onClick={resetForm} className="p-2 rounded-lg text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Nombre"
              value={form.nombre}
              onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))}
              placeholder="Ej: Tornillería"
              required
            />
            <Input
              label="Descripción"
              value={form.descripcion}
              onChange={e => setForm(p => ({ ...p, descripcion: e.target.value }))}
              placeholder="Descripción opcional"
            />
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={form.color}
                  onChange={e => setForm(p => ({ ...p, color: e.target.value }))}
                  className="w-10 h-10 rounded-lg border border-neutral-300 dark:border-neutral-700 cursor-pointer"
                />
                <div className="flex gap-1">
                  {COLORES.map(c => (
                    <button
                      key={c}
                      onClick={() => setForm(p => ({ ...p, color: c }))}
                      className={`w-7 h-7 rounded-full border-2 transition-all ${form.color === c ? 'border-neutral-900 dark:border-white scale-110' : 'border-transparent'}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-800">
            <Button variant="ghost" onClick={resetForm}>Cancelar</Button>
            <Button variant="primary" className="gap-2" onClick={handleSave} disabled={saving || !form.nombre.trim()}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {editingId ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        </div>
      )}

      {categorias.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-neutral-400 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800">
          <Tag className="w-16 h-16 mb-4" />
          <p className="text-lg font-medium">No hay categorías</p>
          <p className="text-sm mt-1">Cree su primera categoría para organizar los productos</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {categorias.map(cat => (
            <div key={cat.id} className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: cat.color + '20' }}>
                    <Tag className="w-5 h-5" style={{ color: cat.color }} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-neutral-900 dark:text-white">{cat.nombre}</h3>
                    {cat.descripcion && (
                      <p className="text-xs text-neutral-500 mt-0.5 line-clamp-1">{cat.descripcion}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => handleEdit(cat)} className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-800">
                    <Edit3 className="w-4 h-4" />
                  </button>
                  {deleteConfirm === cat.id ? (
                    <div className="flex">
                      <button onClick={() => handleDelete(cat.id)} className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 text-xs font-medium">Eliminar</button>
                      <button onClick={() => setDeleteConfirm(null)} className="p-1.5 rounded-lg text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"><X className="w-4 h-4" /></button>
                    </div>
                  ) : (
                    <button onClick={() => setDeleteConfirm(cat.id)} className="p-1.5 rounded-lg text-neutral-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                <span className="text-xs text-neutral-500">Productos</span>
                <span className="text-sm font-semibold text-neutral-900 dark:text-white flex items-center gap-1">
                  <Package className="w-3.5 h-3.5 text-neutral-400" />
                  {cat.total_productos}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
