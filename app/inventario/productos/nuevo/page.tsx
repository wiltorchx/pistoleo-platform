'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';

interface Categoria {
  id: string;
  nombre: string;
  color: string;
}

interface Ubicacion {
  id: string;
  codigo: string;
  nombre: string;
}

const UNIDADES_MEDIDA = [
  { value: 'UN', label: 'Unidad' },
  { value: 'KG', label: 'Kilogramo' },
  { value: 'LT', label: 'Litro' },
  { value: 'MT', label: 'Metro' },
  { value: 'CAJ', label: 'Caja' },
  { value: 'PAQ', label: 'Paquete' },
  { value: 'M', label: 'Metro lineal' },
  { value: 'M2', label: 'Metro cuadrado' },
  { value: 'M3', label: 'Metro cúbico' },
  { value: 'ROL', label: 'Rollo' },
  { value: 'BLQ', label: 'Bloque' },
  { value: 'TUB', label: 'Tubo' },
  { value: 'OTRO', label: 'Otro' },
];

export default function NuevoProductoPage() {
  const router = useRouter();
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [ubicaciones, setUbicaciones] = useState<Ubicacion[]>([]);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState({
    codigo: '',
    codigo_barras: '',
    nombre: '',
    descripcion: '',
    unidad_medida: 'UN',
    categoria_id: '',
    ubicacion_id: '',
    stock_minimo: '0',
    stock_maximo: '',
    costo_promedio: '0',
    precio_venta: '',
  });

  useEffect(() => {
    fetch('/inventario/api/categorias')
      .then(r => r.json())
      .then(d => { if (!d.error) setCategorias(d); })
      .catch(() => {});
    fetch('/inventario/api/ubicaciones?solo_activos=true')
      .then(r => r.json())
      .then(d => { if (!d.error) setUbicaciones(d); })
      .catch(() => {});
  }, []);

  const handleChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => { const { [field]: _, ...rest } = prev; return rest; });
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!form.codigo.trim()) newErrors.codigo = 'El código es obligatorio';
    if (!form.nombre.trim()) newErrors.nombre = 'El nombre es obligatorio';
    const min = parseInt(form.stock_minimo);
    if (isNaN(min) || min < 0) newErrors.stock_minimo = 'Debe ser un número válido';
    const costo = parseFloat(form.costo_promedio);
    if (isNaN(costo) || costo < 0) newErrors.costo_promedio = 'Debe ser un número válido';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    try {
      const body = {
        codigo: form.codigo.trim(),
        codigo_barras: form.codigo_barras.trim() || undefined,
        nombre: form.nombre.trim(),
        descripcion: form.descripcion.trim() || undefined,
        unidad_medida: form.unidad_medida,
        categoria_id: form.categoria_id || undefined,
        ubicacion_id: form.ubicacion_id || undefined,
        stock_minimo: parseInt(form.stock_minimo) || 0,
        stock_maximo: form.stock_maximo ? parseInt(form.stock_maximo) : undefined,
        costo_promedio: parseFloat(form.costo_promedio) || 0,
        precio_venta: form.precio_venta ? parseFloat(form.precio_venta) : undefined,
      };

      const res = await fetch('/inventario/api/productos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (data.error) {
        setErrors({ form: data.error });
        return;
      }

      router.push(`/inventario/productos/${data.id}`);
    } catch {
      setErrors({ form: 'Error al guardar el producto' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 rounded-lg text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Nuevo Producto</h1>
          <p className="text-neutral-500 text-sm mt-0.5">Complete los campos para registrar un nuevo producto</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 space-y-6">
        {errors.form && (
          <div className="p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-300 text-sm">
            {errors.form}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Código"
            placeholder="Ej: TOR-M8-50"
            value={form.codigo}
            onChange={(e) => handleChange('codigo', e.target.value)}
            error={errors.codigo}
            required
          />
          <Input
            label="Código de Barras"
            placeholder="Ej: 7801234567890"
            value={form.codigo_barras}
            onChange={(e) => handleChange('codigo_barras', e.target.value)}
          />
        </div>

        <Input
          label="Nombre"
          placeholder="Ej: Tornillo M8x50mm"
          value={form.nombre}
          onChange={(e) => handleChange('nombre', e.target.value)}
          error={errors.nombre}
          required
        />

        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Descripción</label>
          <textarea
            value={form.descripcion}
            onChange={(e) => handleChange('descripcion', e.target.value)}
            rows={3}
            className="w-full px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white placeholder-neutral-400 focus:border-primary-600 focus:ring-2 focus:ring-primary-600/20"
            placeholder="Descripción opcional del producto..."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Unidad de Medida</label>
            <select
              value={form.unidad_medida}
              onChange={(e) => handleChange('unidad_medida', e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white"
            >
              {UNIDADES_MEDIDA.map(um => (
                <option key={um.value} value={um.value}>{um.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Categoría</label>
            <select
              value={form.categoria_id}
              onChange={(e) => handleChange('categoria_id', e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white"
            >
              <option value="">Sin categoría</option>
              {categorias.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.nombre}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Ubicación Predeterminada</label>
          <select
            value={form.ubicacion_id}
            onChange={(e) => handleChange('ubicacion_id', e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white"
          >
            <option value="">Sin ubicación</option>
            {ubicaciones.map(ub => (
              <option key={ub.id} value={ub.id}>{ub.codigo} - {ub.nombre}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Input
            label="Stock Mínimo"
            type="number"
            min="0"
            value={form.stock_minimo}
            onChange={(e) => handleChange('stock_minimo', e.target.value)}
            error={errors.stock_minimo}
          />
          <Input
            label="Stock Máximo"
            type="number"
            min="0"
            value={form.stock_maximo}
            onChange={(e) => handleChange('stock_maximo', e.target.value)}
            hint="Opcional"
          />
          <Input
            label="Costo Promedio"
            type="number"
            min="0"
            step="0.01"
            value={form.costo_promedio}
            onChange={(e) => handleChange('costo_promedio', e.target.value)}
            error={errors.costo_promedio}
          />
          <Input
            label="Precio Venta"
            type="number"
            min="0"
            step="0.01"
            value={form.precio_venta}
            onChange={(e) => handleChange('precio_venta', e.target.value)}
            hint="Opcional"
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200 dark:border-neutral-800">
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancelar</Button>
          <Button type="submit" variant="primary" className="gap-2" disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Guardando...' : 'Guardar Producto'}
          </Button>
        </div>
      </form>
    </div>
  );
}
