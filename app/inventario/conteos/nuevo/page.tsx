'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';
import { ClipboardList, Loader2 } from 'lucide-react';

interface Ubicacion { id: string; codigo: string; nombre: string; }
interface Categoria { id: string; nombre: string; }

export default function NuevoConteoPage() {
  const router = useRouter();
  const [nombre, setNombre] = useState('');
  const [ubicacion_id, setUbicacionId] = useState('');
  const [categoria_id, setCategoriaId] = useState('');
  const [ubicaciones, setUbicaciones] = useState<Ubicacion[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      fetch('/inventario/api/ubicaciones').then(r => r.json()),
      fetch('/inventario/api/categorias').then(r => r.json()),
    ]).then(([ubis, cats]) => {
      if (!ubis.error) setUbicaciones(Array.isArray(ubis) ? ubis : ubis.data || []);
      if (!cats.error) setCategorias(Array.isArray(cats) ? cats : cats.data || []);
    }).catch(console.error);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) { setError('El nombre es obligatorio'); return; }
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/inventario/api/conteos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: nombre.trim(), ubicacion_id: ubicacion_id || null, categoria_id: categoria_id || null }),
      });
      const data = await res.json();
      if (data.error) { setError(data.error); return; }
      router.push(`/inventario/conteos/${data.id}`);
    } catch { setError('Error al crear conteo'); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">Nuevo Conteo Físico</h1>
        <p className="text-neutral-500 mt-1">Cree un conteo para verificar el stock físico</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 space-y-6">
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-300 text-sm">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Nombre del Conteo *</label>
          <Input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej: Conteo Mensual Junio 2026" required />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Ubicación (opcional)</label>
            <select
              value={ubicacion_id}
              onChange={(e) => setUbicacionId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white"
            >
              <option value="">Todas las ubicaciones</option>
              {ubicaciones.map((u) => (
                <option key={u.id} value={u.id}>{u.codigo} - {u.nombre}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Categoría (opcional)</label>
            <select
              value={categoria_id}
              onChange={(e) => setCategoriaId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white"
            >
              <option value="">Todas las categorías</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="bg-neutral-50 dark:bg-neutral-800 rounded-xl p-4">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Los productos se cargarán automáticamente según los filtros seleccionados.
            Si no selecciona ubicación ni categoría, se incluirán todos los productos activos.
          </p>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200 dark:border-neutral-800">
          <Button variant="outline" type="button" onClick={() => router.back()}>Cancelar</Button>
          <Button variant="primary" type="submit" disabled={submitting} className="gap-2">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ClipboardList className="w-4 h-4" />}
            {submitting ? 'Creando...' : 'Crear Conteo'}
          </Button>
        </div>
      </form>
    </div>
  );
}
