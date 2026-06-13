'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/atoms/Button';
import {
  Package,
  Warehouse,
  AlertTriangle,
  TrendingUp,
  ArrowUpDown,
  ClipboardList,
  Truck,
  Plus,
  RefreshCw,
  Loader2,
  Download,
} from 'lucide-react';

interface Stats {
  totalProductos: number;
  totalStock: number;
  totalValor: number;
  stockBajo: number;
  stockCritico: number;
  movimientosHoy: number;
}

interface AlertaStock {
  id: string;
  producto: string;
  codigo: string;
  stock_actual: number;
  stock_minimo: number;
  ubicacion: string;
  severidad: 'critica' | 'baja';
}

interface MovimientoReciente {
  id: string;
  tipo: string;
  producto: string;
  cantidad: number;
  ubicacion: string;
  fecha: string;
  usuario: string;
}

export default function InventarioDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [alertas, setAlertas] = useState<AlertaStock[]>([]);
  const [movimientos, setMovimientos] = useState<MovimientoReciente[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, bajosRes, movsRes] = await Promise.all([
        fetch('/inventario/api/stats'),
        fetch('/inventario/api/productos?stock_bajo=true&limit=5&sort_by=stock_actual&sort_order=asc'),
        fetch('/inventario/api/movimientos?limit=5'),
      ]);

      const statsData = await statsRes.json();
      if (!statsData.error) setStats(statsData);

      const bajosData = await bajosRes.json();
      if (!bajosData.error) {
        setAlertas((bajosData.data || []).slice(0, 5).map((p: Record<string, unknown>, i: number) => ({
          id: String(i + 1),
          producto: p.nombre as string,
          codigo: p.codigo as string,
          stock_actual: p.stock_actual as number,
          stock_minimo: p.stock_minimo as number,
          ubicacion: ((p.ubicacion as Record<string, string> | null)?.codigo) || '—',
          severidad: (p.stock_actual as number) <= ((p.stock_minimo as number) * 0.5) ? 'critica' as const : 'baja' as const,
        })));
      }

      const movsData = await movsRes.json();
      if (!movsData.error) {
        setMovimientos((movsData.data || []).slice(0, 5).map((m: Record<string, unknown>) => ({
          id: m.id as string,
          tipo: m.tipo as string,
          producto: ((m.producto as Record<string, unknown> | null)?.nombre) as string || '—',
          cantidad: m.cantidad as number,
          ubicacion: ((m.ubicacion_origen as Record<string, unknown> | null)?.codigo || (m.ubicacion_destino as Record<string, unknown> | null)?.codigo) as string || '—',
          fecha: new Date(m.created_at as string).toLocaleString(),
          usuario: ((m.usuario as Record<string, unknown> | null)?.first_name || '') + ' ' + ((m.usuario as Record<string, unknown> | null)?.last_name || ''),
        })));
      }
    } catch (err) {
      console.error('Error fetching dashboard:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  const kpis = stats ? [
    { label: 'Total Productos', value: stats.totalProductos.toLocaleString(), change: `${stats.movimientosHoy} movs. hoy`, changeType: 'neutral' as const, icon: <Package className="w-6 h-6" />, color: 'bg-blue-500', href: '/inventario/productos' },
    { label: 'Stock Total (unid.)', value: stats.totalStock.toLocaleString(), change: null as string | null, changeType: 'positive' as const, icon: <Warehouse className="w-6 h-6" />, color: 'bg-green-500', href: '/inventario/reportes/stock' },
    { label: 'Alertas Stock Bajo', value: stats.stockBajo.toString(), change: `${stats.stockCritico} críticas`, changeType: 'negative' as const, icon: <AlertTriangle className="w-6 h-6" />, color: 'bg-red-500', href: '/inventario/productos?stock_bajo=true' },
    { label: 'Valorizado Stock', value: `$${stats.totalValor.toLocaleString('es-CL')}`, change: null as string | null, changeType: 'neutral' as const, icon: <TrendingUp className="w-6 h-6" />, color: 'bg-purple-500', href: '/inventario/reportes/valorizado' },
  ] : [];

  const getTipoBadge = (tipo: string) => {
    const config: Record<string, { bg: string; text: string; label: string }> = {
      entrada: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-300', label: 'Entrada' },
      salida: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300', label: 'Salida' },
      ajuste_positivo: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300', label: 'Ajuste +' },
      ajuste_negativo: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-300', label: 'Ajuste -' },
      transferencia_origen: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-300', label: 'Transf. Origen' },
      transferencia_destino: { bg: 'bg-indigo-100 dark:bg-indigo-900/30', text: 'text-indigo-700 dark:text-indigo-300', label: 'Transf. Destino' },
      devolucion_proveedor: { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-700 dark:text-gray-300', label: 'Dev. Proveedor' },
      inventario_inicial: { bg: 'bg-teal-100 dark:bg-teal-900/30', text: 'text-teal-700 dark:text-teal-300', label: 'Inventario Inicial' },
    };
    return config[tipo] || { bg: 'bg-neutral-100', text: 'text-neutral-700', label: tipo };
  };

  const getSeveridadBadge = (severidad: string) => {
    return severidad === 'critica'
      ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
      : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300';
  };

  const getSeveridadLabel = (severidad: string) => (severidad === 'critica' ? 'Crítica' : 'Baja');

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">Dashboard Inventario</h1>
          <p className="text-neutral-500 mt-1">Visión general del stock, alertas y movimientos recientes</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" className="gap-2" onClick={fetchDashboard} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Cargando...' : 'Actualizar'}
          </Button>
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Exportar
          </Button>
          <Button variant="primary" className="gap-2" asChild>
            <Link href="/inventario/productos/nuevo">
              <Plus className="w-4 h-4" />
              Nuevo Producto
            </Link>
          </Button>
        </div>
      </div>

      {loading && !stats ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
        </div>
      ) : (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi) => (
          <Link
            key={kpi.label}
            href={kpi.href}
            className="group bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 hover:shadow-lg hover:border-primary-200 dark:hover:border-primary-800 transition-all"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">{kpi.label}</p>
                <p className="text-3xl font-bold text-neutral-900 dark:text-white mt-2">{kpi.value}</p>
                {kpi.change && (
                  <p className={`text-sm mt-1 flex items-center gap-1 ${
                    kpi.changeType === 'positive' ? 'text-green-600' :
                    kpi.changeType === 'negative' ? 'text-red-600' : 'text-neutral-500'
                  }`}>
                    {kpi.changeType === 'positive' && <TrendingUp className="w-3.5 h-3.5" />}
                    {kpi.changeType === 'negative' && <AlertTriangle className="w-3.5 h-3.5" />}
                    {kpi.change}
                  </p>
                )}
              </div>
              <div className={`${kpi.color} rounded-xl p-3`}>
                {kpi.icon}
              </div>
            </div>
          </Link>
        ))}
      </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
          <div className="p-5 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <h2 className="font-semibold text-lg text-neutral-900 dark:text-white">Alertas Stock Bajo</h2>
            </div>
            <Link href="/inventario/productos?stock_bajo=true" className="text-sm text-primary-600 hover:underline">
              Ver todas
            </Link>
          </div>
          <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {alertas.map((alerta) => (
              <div key={alerta.id} className="p-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-neutral-900 dark:text-white truncate">{alerta.producto}</p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">{alerta.codigo} • {alerta.ubicacion}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeveridadBadge(alerta.severidad)}`}>
                    {getSeveridadLabel(alerta.severidad)}
                  </span>
                </div>
                <div className="mt-3 flex items-center gap-4 text-sm">
                  <span className="text-neutral-500 dark:text-neutral-400">Stock: <span className="font-semibold text-neutral-900 dark:text-white">{alerta.stock_actual}</span></span>
                  <span className="text-red-600 dark:text-red-400">Mín: {alerta.stock_minimo}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
          <div className="p-5 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ArrowUpDown className="w-5 h-5 text-primary-600" />
              <h2 className="font-semibold text-lg text-neutral-900 dark:text-white">Movimientos Recientes</h2>
            </div>
            <Link href="/inventario/movimientos" className="text-sm text-primary-600 hover:underline">
              Ver historial
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-50 dark:bg-neutral-800/50">
                <tr>
                  <th className="p-4 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Tipo</th>
                  <th className="p-4 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Producto</th>
                  <th className="p-4 text-right text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Cantidad</th>
                  <th className="p-4 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Ubicación</th>
                  <th className="p-4 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Usuario</th>
                  <th className="p-4 text-right text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {movimientos.map((mov) => {
                  const badge = getTipoBadge(mov.tipo);
                  return (
                    <tr key={mov.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="p-4 font-medium text-neutral-900 dark:text-white">{mov.producto}</td>
                      <td className="p-4 text-right font-mono text-neutral-900 dark:text-white">{mov.cantidad}</td>
                      <td className="p-4 text-neutral-600 dark:text-neutral-400">{mov.ubicacion}</td>
                      <td className="p-4 text-neutral-600 dark:text-neutral-400">{mov.usuario}</td>
                      <td className="p-4 text-right text-neutral-500 dark:text-neutral-400">{mov.fecha}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6">
        <h2 className="font-semibold text-lg text-neutral-900 dark:text-white mb-4">Acciones Rápidas</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="/inventario/productos/nuevo" className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:border-primary-300 dark:hover:border-primary-700 transition-colors group">
            <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Plus className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            </div>
            <p className="font-medium text-neutral-900 dark:text-white">Nuevo Producto</p>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Registrar SKU nuevo</p>
          </Link>
          <Link href="/inventario/movimientos/entrada" className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:border-primary-300 dark:hover:border-primary-700 transition-colors group">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <ArrowUpDown className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <p className="font-medium text-neutral-900 dark:text-white">Registrar Entrada</p>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Ingreso de mercancía</p>
          </Link>
          <Link href="/inventario/conteos/nuevo" className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:border-primary-300 dark:hover:border-primary-700 transition-colors group">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <ClipboardList className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <p className="font-medium text-neutral-900 dark:text-white">Nuevo Conteo</p>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Inventario físico</p>
          </Link>
          <Link href="/inventario/transferencias/nueva" className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:border-primary-300 dark:hover:border-primary-700 transition-colors group">
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Truck className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <p className="font-medium text-neutral-900 dark:text-white">Nueva Transferencia</p>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Mover entre ubicaciones</p>
          </Link>
        </div>
      </div>
    </div>
  );
}