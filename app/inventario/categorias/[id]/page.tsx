'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/atoms/Button';
import { ArrowLeft, Loader2, Tag, Edit3, Save, X } from 'lucide-react';

interface CategoriaDetalle {
  id: string;
  nombre: string;
  descripcion: string | null;
  color: string;
  activo: boolean;
  total_productos: number;
  productos: Array<{ id: string; codigo: string; nombre: string; stock_actual: number }>;
}

const COLORES = [
  '#6B7280', '#EF4444', '#F97316', '#EAB308', '#22C55E',
  '#14B8A6', '#3B82F6', '#8B5CF6', '#EC4899', '#6366F1',
];

export default function CategoriaDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [categoria, setCategoria] = useState<CategoriaDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ nombre: '', descripcion: '', color: '#6B7280' });
  const [saving, setSaving] = useState(false);

  const fetchCategoria = async () => {
    try {
      const res = await fetch(`/inventario/api/categorias/${params.id}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setCategoria(data);
      setForm({ nombre: data.nombre, descripcion: data.descripcion || '', color: data.color });
    } catch {
      setCategoria(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCategoria(); }, [params.id]);

  const handleSave = async () => {
    if (!form.nombre.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/inventario/api/categorias/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.error) { alert(data.error); return; }
      setEditing(false);
      fetchCategoria();
    } catch {
      alert('Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 text-primary-600 animate-spin" /></div>;
  }

  if (!categoria) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-neutral-400">
        <Tag className="w-16 h-16 mb-4" />
        <p className="text-lg font-medium">Categoría no encontrada</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push('/inventario/categorias')}>Volver</Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => router.push('/inventario/categorias')} className="p-2 rounded-lg text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg" style={{ backgroundColor: categoria.color }} />
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">{categoria.nombre}</h1>
          </div>
          <p className="text-neutral-500 text-sm mt-0.5">{categoria.total_productos} producto(s)</p>
        </div>
        {!editing ? (
          <Button variant="outline" className="gap-2" onClick={() => setEditing(true)}>
            <Edit3 className="w-4 h-4" /> Editar
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => { setEditing(false); fetchCategoria(); }}><X className="w-4 h-4" /></Button>
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
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Nombre</label>
              <input value={form.nombre} onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))} className="w-full px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Descripción</label>
              <input value={form.descripcion} onChange={e => setForm(p => ({ ...p, descripcion: e.target.value }))} className="w-full px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Color</label>
              <div className="flex items-center gap-2">
                <input type="color" value={form.color} onChange={e => setForm(p => ({ ...p, color: e.target.value }))} className="w-10 h-10 rounded-lg border border-neutral-300 dark:border-neutral-700 cursor-pointer" />
                {COLORES.map(c => (
                  <button key={c} onClick={() => setForm(p => ({ ...p, color: c }))} className={`w-7 h-7 rounded-full border-2 ${form.color === c ? 'border-neutral-900 scale-110' : 'border-transparent'}`} style={{ backgroundColor: c }} />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
        <div className="p-5 border-b border-neutral-200 dark:border-neutral-800">
          <h2 className="font-semibold text-lg text-neutral-900 dark:text-white">Productos en esta categoría</h2>
        </div>
        {categoria.productos.length === 0 ? (
          <div className="p-8 text-center text-neutral-400">
            <p>No hay productos en esta categoría</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-50 dark:bg-neutral-800/50">
                <tr>
                  <th className="p-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Código</th>
                  <th className="p-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Nombre</th>
                  <th className="p-3 text-right text-xs font-semibold text-neutral-500 uppercase tracking-wider">Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {categoria.productos.map(p => (
                  <tr key={p.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 cursor-pointer" onClick={() => router.push(`/inventario/productos/${p.id}`)}>
                    <td className="p-3 font-mono text-sm text-primary-600">{p.codigo}</td>
                    <td className="p-3 font-medium text-neutral-900 dark:text-white">{p.nombre}</td>
                    <td className="p-3 text-right font-mono text-neutral-900 dark:text-white">{p.stock_actual}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
