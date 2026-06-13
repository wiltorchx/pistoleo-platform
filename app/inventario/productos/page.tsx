'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';
import {
  Package,
  Plus,
  Search,
  ChevronDown,
  ChevronUp,
  Edit3,
  Trash2,
  AlertTriangle,
  FileDown,
  Loader2,
} from 'lucide-react';

interface Producto {
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
}

interface Categoria {
  id: string;
  nombre: string;
  color: string;
}

export default function ProductosPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [categoriaFilter, setCategoriaFilter] = useState(searchParams.get('categoria_id') || '');
  const [stockBajo, setStockBajo] = useState(searchParams.get('stock_bajo') === 'true');
  const [sortBy, setSortBy] = useState('nombre');
  const [sortOrder, setSortOrder] = useState('asc');
  const [page, setPage] = useState(1);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const fetchProductos = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (categoriaFilter) params.set('categoria_id', categoriaFilter);
      if (stockBajo) params.set('stock_bajo', 'true');
      if (sortBy) params.set('sort_by', sortBy);
      if (sortOrder) params.set('sort_order', sortOrder);
      params.set('page', page.toString());
      params.set('limit', '20');

      const res = await fetch(`/inventario/api/productos?${params}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setProductos(data.data || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 0);
    } catch (err) {
      console.error('Error fetching productos:', err);
    } finally {
      setLoading(false);
    }
  }, [search, categoriaFilter, stockBajo, sortBy, sortOrder, page]);

  const fetchCategorias = async () => {
    try {
      const res = await fetch('/inventario/api/categorias');
      const data = await res.json();
      if (!data.error) setCategorias(data);
    } catch (err) {
      console.error('Error fetching categorias:', err);
    }
  };

  useEffect(() => {
    fetchCategorias();
  }, []);

  useEffect(() => {
    fetchProductos();
  }, [fetchProductos]);

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/inventario/api/productos/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.error) {
        alert(data.error);
        return;
      }
      setDeleteConfirm(null);
      fetchProductos();
    } catch (err) {
      alert('Error al eliminar producto');
    }
  };

  const SortIcon = ({ field }: { field: string }) => {
    if (sortBy !== field) return null;
    return sortOrder === 'asc' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />;
  };

  const formatCurrency = (val: number) => `$${val.toLocaleString('es-CL')}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">Productos</h1>
          <p className="text-neutral-500 mt-1">{total} producto(s) registrados</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" className="gap-2" onClick={() => router.push('/inventario/productos/importar')}>
            <FileDown className="w-4 h-4" />
            Importar
          </Button>
          <Button variant="primary" className="gap-2" asChild>
            <Link href="/inventario/productos/nuevo">
              <Plus className="w-4 h-4" />
              Nuevo Producto
            </Link>
          </Button>
        </div>
      </div>

      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Input
                placeholder="Buscar por nombre, código o código de barras..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
            <select
              value={categoriaFilter}
              onChange={(e) => { setCategoriaFilter(e.target.value); setPage(1); }}
              className="px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white"
            >
              <option value="">Todas las categorías</option>
              {categorias.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.nombre}</option>
              ))}
            </select>
            <label className="flex items-center gap-2 px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 cursor-pointer">
              <input
                type="checkbox"
                checked={stockBajo}
                onChange={(e) => { setStockBajo(e.target.checked); setPage(1); }}
                className="rounded text-primary-600"
              />
              <span className="text-sm text-neutral-700 dark:text-neutral-300">Stock bajo</span>
            </label>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
          </div>
        ) : productos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-neutral-400">
            <Package className="w-16 h-16 mb-4" />
            <p className="text-lg font-medium">No se encontraron productos</p>
            <p className="text-sm mt-1">Intente con otros filtros o cree un nuevo producto</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-50 dark:bg-neutral-800/50">
                <tr>
                  <Th sortable field="codigo" label="Código" onClick={handleSort} icon={<SortIcon field="codigo" />} />
                  <Th sortable field="nombre" label="Nombre" onClick={handleSort} icon={<SortIcon field="nombre" />} />
                  <Th label="Categoría" />
                  <Th label="Ubicación" />
                  <Th sortable field="stock_actual" label="Stock" onClick={handleSort} icon={<SortIcon field="stock_actual" />} />
                  <Th label="Valor Stock" />
                  <Th label="Unidad" />
                  <Th label="Acciones" />
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {productos.map((p) => (
                  <tr key={p.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                    <td className="p-4">
                      <Link href={`/inventario/productos/${p.id}`} className="font-mono text-sm text-primary-600 hover:underline">
                        {p.codigo}
                      </Link>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-neutral-900 dark:text-white">{p.nombre}</span>
                        {p.stock_bajo && (
                          <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" title="Stock bajo" />
                        )}
                      </div>
                      {p.codigo_barras && (
                        <span className="text-xs text-neutral-400 block">EAN: {p.codigo_barras}</span>
                      )}
                    </td>
                    <td className="p-4">
                      {p.categoria ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: p.categoria.color + '20', color: p.categoria.color }}>
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: p.categoria.color }} />
                          {p.categoria.nombre}
                        </span>
                      ) : (
                        <span className="text-neutral-400 text-sm">—</span>
                      )}
                    </td>
                    <td className="p-4 text-neutral-600 dark:text-neutral-400">
                      {p.ubicacion ? `${p.ubicacion.codigo} - ${p.ubicacion.nombre}` : '—'}
                    </td>
                    <td className="p-4">
                      <span className={`font-mono font-semibold ${p.stock_bajo ? 'text-red-600' : 'text-neutral-900 dark:text-white'}`}>
                        {p.stock_actual}
                      </span>
                      {p.stock_minimo > 0 && (
                        <span className="text-xs text-neutral-400 block">Min: {p.stock_minimo}</span>
                      )}
                    </td>
                    <td className="p-4 font-mono text-neutral-900 dark:text-white">
                      {formatCurrency(p.valor_stock)}
                    </td>
                    <td className="p-4 text-neutral-500 text-sm">{p.unidad_medida}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/inventario/productos/${p.id}`}
                          className="p-2 rounded-lg text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                          title="Editar"
                        >
                          <Edit3 className="w-4 h-4" />
                        </Link>
                        {deleteConfirm === p.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleDelete(p.id)}
                              className="p-2 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors text-xs font-medium"
                            >
                              Eliminar
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(null)}
                              className="p-2 rounded-lg text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-xs"
                            >
                              Cancelar
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirm(p.id)}
                            className="p-2 rounded-lg text-neutral-500 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-neutral-200 dark:border-neutral-800">
            <span className="text-sm text-neutral-500">
              Página {page} de {totalPages} ({total} resultados)
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
              >
                Siguiente
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Th({ label, sortable, field, onClick, icon }: {
  label: string;
  sortable?: boolean;
  field?: string;
  onClick?: (f: string) => void;
  icon?: React.ReactNode;
}) {
  return (
    <th
      className={`p-4 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider ${sortable ? 'cursor-pointer hover:text-neutral-700 dark:hover:text-neutral-200' : ''}`}
      onClick={() => sortable && field && onClick?.(field)}
    >
      <div className="flex items-center gap-1">
        {label}
        {icon}
      </div>
    </th>
  );
}
