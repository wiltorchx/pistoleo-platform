'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';
import {
  ArrowLeft,
  Save,
  Loader2,
  Package,
  AlertTriangle,
  Edit3,
  X,
} from 'lucide-react';

interface ProductoDetalle {
  id: string;
  codigo: string;
  codigo_barras: string | null;
  nombre: string;
  descripcion: string | null;
  unidad_medida: string;
  categoria_id: string | null;
  categoria: { id: string; nombre: string; color: string } | null;
  ubicacion_id: string | null;
  ubicacion: { id: string; codigo: string; nombre: string } | null;
  stock_actual: number;
  stock_minimo: number;
  stock_maximo: number | null;
  costo_promedio: number;
  precio_venta: number | null;
  activo: boolean;
  stock_bajo: boolean;
  valor_stock: number;
  movimientos: Movimiento[];
  created_at: string;
  updated_at: string;
}

interface Movimiento {
  id: string;
  tipo: string;
  cantidad: number;
  cantidad_anterior: number;
  cantidad_nueva: number;
  costo_unitario: number | null;
  costo_total: number;
  ubicacion_origen_id: string | null;
  ubicacion_destino_id: string | null;
  documento_referencia: string | null;
  observaciones: string | null;
  usuario: { first_name: string; last_name: string; email: string } | null;
  created_at: string;
}

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

const UNIDADES_MEDIDA: Record<string, string> = {
  UN: 'Unidad', KG: 'Kilogramo', LT: 'Litro', MT: 'Metro',
  CAJ: 'Caja', PAQ: 'Paquete', M: 'Metro lineal', M2: 'Metro cuadrado',
  M3: 'Metro cúbico', ROL: 'Rollo', BLQ: 'Bloque', TUB: 'Tubo', OTRO: 'Otro',
};

const TIPO_MOVIMIENTO: Record<string, string> = {
  entrada: 'Entrada',
  salida: 'Salida',
  ajuste_positivo: 'Ajuste +',
  ajuste_negativo: 'Ajuste -',
  transferencia_origen: 'Transf. Origen',
  transferencia_destino: 'Transf. Destino',
  devolucion_proveedor: 'Dev. Proveedor',
  inventario_inicial: 'Inventario Inicial',
};

export default function ProductoDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [producto, setProducto] = useState<ProductoDetalle | null>(null);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [ubicaciones, setUbicaciones] = useState<Ubicacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

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
    activo: true,
  });

  const fetchProducto = async () => {
    try {
      const res = await fetch(`/inventario/api/productos/${params.id}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setProducto(data);
      setForm({
        codigo: data.codigo,
        codigo_barras: data.codigo_barras || '',
        nombre: data.nombre,
        descripcion: data.descripcion || '',
        unidad_medida: data.unidad_medida,
        categoria_id: data.categoria_id || '',
        ubicacion_id: data.ubicacion_id || '',
        stock_minimo: data.stock_minimo.toString(),
        stock_maximo: data.stock_maximo?.toString() || '',
        costo_promedio: data.costo_promedio.toString(),
        precio_venta: data.precio_venta?.toString() || '',
        activo: data.activo,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducto();
    fetch('/inventario/api/categorias').then(r => r.json()).then(d => { if (!d.error) setCategorias(d); }).catch(() => {});
    fetch('/inventario/api/ubicaciones?solo_activos=true').then(r => r.json()).then(d => { if (!d.error) setUbicaciones(d); }).catch(() => {});
  }, [params.id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const body: Record<string, unknown> = {};
      if (form.codigo !== producto?.codigo) body.codigo = form.codigo;
      if (form.codigo_barras !== (producto?.codigo_barras || '')) body.codigo_barras = form.codigo_barras || null;
      if (form.nombre !== producto?.nombre) body.nombre = form.nombre;
      if (form.descripcion !== (producto?.descripcion || '')) body.descripcion = form.descripcion || null;
      if (form.unidad_medida !== producto?.unidad_medida) body.unidad_medida = form.unidad_medida;
      if (form.categoria_id !== (producto?.categoria_id || '')) body.categoria_id = form.categoria_id || null;
      if (form.ubicacion_id !== (producto?.ubicacion_id || '')) body.ubicacion_id = form.ubicacion_id || null;
      const min = parseInt(form.stock_minimo);
      if (min !== producto?.stock_minimo) body.stock_minimo = min;
      const max = form.stock_maximo ? parseInt(form.stock_maximo) : null;
      if (max !== producto?.stock_maximo) body.stock_maximo = max;
      const costo = parseFloat(form.costo_promedio);
      if (costo !== producto?.costo_promedio) body.costo_promedio = costo;
      const precio = form.precio_venta ? parseFloat(form.precio_venta) : null;
      if (precio !== producto?.precio_venta) body.precio_venta = precio;

      if (Object.keys(body).length === 0) {
        setEditing(false);
        return;
      }

      const res = await fetch(`/inventario/api/productos/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setEditing(false);
      fetchProducto();
    } catch (err) {
      alert('Error al guardar: ' + (err instanceof Error ? err.message : 'Error desconocido'));
    } finally {
      setSaving(false);
    }
  };

  const getTipoBadge = (tipo: string) => {
    const config: Record<string, { bg: string; text: string }> = {
      entrada: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-300' },
      salida: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300' },
      ajuste_positivo: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300' },
      ajuste_negativo: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-300' },
      transferencia_origen: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-300' },
      transferencia_destino: { bg: 'bg-indigo-100 dark:bg-indigo-900/30', text: 'text-indigo-700 dark:text-indigo-300' },
      devolucion_proveedor: { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-700 dark:text-gray-300' },
      inventario_inicial: { bg: 'bg-teal-100 dark:bg-teal-900/30', text: 'text-teal-700 dark:text-teal-300' },
    };
    return config[tipo] || { bg: 'bg-neutral-100', text: 'text-neutral-700' };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
      </div>
    );
  }

  if (!producto) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-neutral-400">
        <Package className="w-16 h-16 mb-4" />
        <p className="text-lg font-medium">Producto no encontrado</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push('/inventario/productos')}>Volver a Productos</Button>
      </div>
    );
  }

  const formatCurrency = (val: number) => `$${val.toLocaleString('es-CL')}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => router.push('/inventario/productos')} className="p-2 rounded-lg text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">{producto.nombre}</h1>
            {producto.stock_bajo && (
              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                Stock Bajo
              </span>
            )}
            {!producto.activo && (
              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                Inactivo
              </span>
            )}
          </div>
          <p className="text-neutral-500 text-sm mt-0.5 font-mono">{producto.codigo}</p>
        </div>
        {!editing ? (
          <Button variant="outline" className="gap-2" onClick={() => setEditing(true)}>
            <Edit3 className="w-4 h-4" />
            Editar
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => { setEditing(false); fetchProducto(); }}>
              <X className="w-4 h-4" />
            </Button>
            <Button variant="primary" className="gap-2" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Guardar
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6">
            <h2 className="font-semibold text-lg text-neutral-900 dark:text-white mb-4">Información General</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoField label="Código" value={producto.codigo} />
              <InfoField label="Código de Barras" value={producto.codigo_barras || '—'} />
              <InfoField label="Unidad de Medida" value={UNIDADES_MEDIDA[producto.unidad_medida] || producto.unidad_medida} />
              <InfoField label="Categoría" value={producto.categoria?.nombre || '—'} />
              <InfoField label="Ubicación" value={producto.ubicacion ? `${producto.ubicacion.codigo} - ${producto.ubicacion.nombre}` : '—'} />
              <InfoField label="Costo Promedio" value={formatCurrency(producto.costo_promedio)} />
              <InfoField label="Precio Venta" value={producto.precio_venta ? formatCurrency(producto.precio_venta) : '—'} />
              <InfoField label="Creado" value={new Date(producto.created_at).toLocaleDateString('es-CL')} />
            </div>
            {producto.descripcion && (
              <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-800">
                <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-1">Descripción</p>
                <p className="text-neutral-900 dark:text-white">{producto.descripcion}</p>
              </div>
            )}
          </div>

          {editing && (
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6">
              <h2 className="font-semibold text-lg text-neutral-900 dark:text-white mb-4">Editar Producto</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Código" value={form.codigo} onChange={e => setForm(p => ({ ...p, codigo: e.target.value }))} />
                <Input label="Código de Barras" value={form.codigo_barras} onChange={e => setForm(p => ({ ...p, codigo_barras: e.target.value }))} />
                <div className="md:col-span-2"><Input label="Nombre" value={form.nombre} onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))} /></div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Unidad de Medida</label>
                  <select value={form.unidad_medida} onChange={e => setForm(p => ({ ...p, unidad_medida: e.target.value }))} className="w-full px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white">
                    {Object.entries(UNIDADES_MEDIDA).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Categoría</label>
                  <select value={form.categoria_id} onChange={e => setForm(p => ({ ...p, categoria_id: e.target.value }))} className="w-full px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white">
                    <option value="">Sin categoría</option>
                    {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Ubicación</label>
                  <select value={form.ubicacion_id} onChange={e => setForm(p => ({ ...p, ubicacion_id: e.target.value }))} className="w-full px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white">
                    <option value="">Sin ubicación</option>
                    {ubicaciones.map(u => <option key={u.id} value={u.id}>{u.codigo} - {u.nombre}</option>)}
                  </select>
                </div>
                <Input label="Stock Mínimo" type="number" min="0" value={form.stock_minimo} onChange={e => setForm(p => ({ ...p, stock_minimo: e.target.value }))} />
                <Input label="Stock Máximo" type="number" min="0" value={form.stock_maximo} onChange={e => setForm(p => ({ ...p, stock_maximo: e.target.value }))} />
                <Input label="Costo Promedio" type="number" min="0" step="0.01" value={form.costo_promedio} onChange={e => setForm(p => ({ ...p, costo_promedio: e.target.value }))} />
                <Input label="Precio Venta" type="number" min="0" step="0.01" value={form.precio_venta} onChange={e => setForm(p => ({ ...p, precio_venta: e.target.value }))} />
                <div className="md:col-span-2 flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.activo} onChange={e => setForm(p => ({ ...p, activo: e.target.checked }))} className="rounded text-primary-600" />
                    <span className="text-sm text-neutral-700 dark:text-neutral-300">Producto activo</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
            <div className="p-5 border-b border-neutral-200 dark:border-neutral-800">
              <h2 className="font-semibold text-lg text-neutral-900 dark:text-white">Movimientos (Kardex)</h2>
            </div>
            {producto.movimientos.length === 0 ? (
              <div className="p-8 text-center text-neutral-400">
                <p>No hay movimientos registrados para este producto</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-neutral-50 dark:bg-neutral-800/50">
                    <tr>
                      <th className="p-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Tipo</th>
                      <th className="p-3 text-right text-xs font-semibold text-neutral-500 uppercase tracking-wider">Cantidad</th>
                      <th className="p-3 text-right text-xs font-semibold text-neutral-500 uppercase tracking-wider">Stock Anterior</th>
                      <th className="p-3 text-right text-xs font-semibold text-neutral-500 uppercase tracking-wider">Stock Nuevo</th>
                      <th className="p-3 text-right text-xs font-semibold text-neutral-500 uppercase tracking-wider">Costo Total</th>
                      <th className="p-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Usuario</th>
                      <th className="p-3 text-right text-xs font-semibold text-neutral-500 uppercase tracking-wider">Fecha</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                    {producto.movimientos.map(mov => {
                      const badge = getTipoBadge(mov.tipo);
                      return (
                        <tr key={mov.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                          <td className="p-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
                              {TIPO_MOVIMIENTO[mov.tipo] || mov.tipo}
                            </span>
                          </td>
                          <td className="p-3 text-right font-mono text-neutral-900 dark:text-white">{mov.cantidad}</td>
                          <td className="p-3 text-right font-mono text-neutral-600">{mov.cantidad_anterior}</td>
                          <td className="p-3 text-right font-mono text-neutral-900 dark:text-white">{mov.cantidad_nueva}</td>
                          <td className="p-3 text-right font-mono text-neutral-900 dark:text-white">{formatCurrency(mov.costo_total)}</td>
                          <td className="p-3 text-neutral-600 dark:text-neutral-400 text-sm">
                            {mov.usuario ? `${mov.usuario.first_name} ${mov.usuario.last_name}` : '—'}
                          </td>
                          <td className="p-3 text-right text-neutral-500 text-sm">{new Date(mov.created_at).toLocaleString('es-CL')}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6">
            <h2 className="font-semibold text-lg text-neutral-900 dark:text-white mb-4">Stock</h2>
            <div className="text-center">
              <p className="text-5xl font-bold text-neutral-900 dark:text-white">{producto.stock_actual}</p>
              <p className="text-neutral-500 text-sm mt-1">{UNIDADES_MEDIDA[producto.unidad_medida] || producto.unidad_medida}(s)</p>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4 text-center">
              <div className="p-3 bg-neutral-50 dark:bg-neutral-800 rounded-xl">
                <p className="text-xs text-neutral-500">Mínimo</p>
                <p className="text-lg font-semibold text-neutral-900 dark:text-white">{producto.stock_minimo}</p>
              </div>
              <div className="p-3 bg-neutral-50 dark:bg-neutral-800 rounded-xl">
                <p className="text-xs text-neutral-500">Máximo</p>
                <p className="text-lg font-semibold text-neutral-900 dark:text-white">{producto.stock_maximo || '∞'}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6">
            <h2 className="font-semibold text-lg text-neutral-900 dark:text-white mb-4">Valorización</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-neutral-500">Costo Promedio</span>
                <span className="font-mono font-semibold text-neutral-900 dark:text-white">{formatCurrency(producto.costo_promedio)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-neutral-500">Valor Total Stock</span>
                <span className="font-mono font-semibold text-primary-600">{formatCurrency(producto.valor_stock)}</span>
              </div>
              {producto.precio_venta && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-neutral-500">Precio Venta</span>
                  <span className="font-mono font-semibold text-neutral-900 dark:text-white">{formatCurrency(producto.precio_venta)}</span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6">
            <h2 className="font-semibold text-lg text-neutral-900 dark:text-white mb-4">Acciones Rápidas</h2>
            <div className="space-y-2">
              <Button variant="primary" fullWidth asChild>
                <Link href={`/inventario/movimientos/entrada?producto_id=${producto.id}`}>Registrar Entrada</Link>
              </Button>
              <Button variant="outline" fullWidth asChild>
                <Link href={`/inventario/movimientos/salida?producto_id=${producto.id}`}>Registrar Salida</Link>
              </Button>
              <Button variant="outline" fullWidth asChild>
                <Link href={`/inventario/movimientos/ajuste?producto_id=${producto.id}`}>Ajustar Stock</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">{label}</p>
      <p className="mt-0.5 text-neutral-900 dark:text-white font-medium">{value}</p>
    </div>
  );
}

function Link({ href, children, ...props }: { href: string; children: React.ReactNode; [key: string]: unknown }) {
  const router = useRouter();
  return (
    <a href={href} onClick={(e) => { e.preventDefault(); router.push(href); }} {...props}>
      {children}
    </a>
  );
}
