'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';
import { ClipboardList, Loader2 } from 'lucide-react';

export default function NuevoConteoPage() {
  const router = useRouter();
  const [nombre, setNombre] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) { setError('El nombre es obligatorio'); return; }
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/inventario/api/conteos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: nombre.trim() }),
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

        <div className="bg-neutral-50 dark:bg-neutral-800 rounded-xl p-4">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Se cargarán todos los productos activos para el conteo. Puede ajustar cantidades durante el proceso.
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
