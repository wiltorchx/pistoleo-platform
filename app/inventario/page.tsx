'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/atoms/Button';
import {
  Package,
  AlertTriangle,
  ClipboardList,
  Plus,
  RefreshCw,
  Loader2,
  Eye,
} from 'lucide-react';

interface Stats {
  totalProductos: number;
  totalStock: number;
  totalValor: number;
  stockBajo: number;
  stockCritico: number;
  movimientosHoy: number;
}

export default function InventarioDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const statsRes = await fetch('/inventario/api/stats');
      const statsData = await statsRes.json();
      if (!statsData.error) setStats(statsData);
    } catch (err) {
      console.error('Error fetching dashboard:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  const kpis = stats ? [
    { label: 'Total Productos', value: stats.totalProductos.toLocaleString(), change: null as string | null, changeType: 'neutral' as const, icon: <Package className="w-6 h-6" />, color: 'bg-blue-500', href: '#' },
    { label: 'Stock Total (unid.)', value: stats.totalStock.toLocaleString(), change: null as string | null, changeType: 'positive' as const, icon: <Package className="w-6 h-6" />, color: 'bg-green-500', href: '#' },
    { label: 'Alertas Stock Bajo', value: stats.stockBajo.toString(), change: `${stats.stockCritico} críticas`, changeType: 'negative' as const, icon: <AlertTriangle className="w-6 h-6" />, color: 'bg-red-500', href: '#' },
  ] : [];

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">Dashboard Inventario</h1>
          <p className="text-neutral-500 mt-1">Visión general del stock y reportes</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" className="gap-2" onClick={fetchDashboard} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Cargando...' : 'Actualizar'}
          </Button>
          <Button variant="primary" className="gap-2" asChild>
            <Link href="/inventario/conteos/nuevo">
              <Plus className="w-4 h-4" />
              Nuevo Conteo
            </Link>
          </Button>
        </div>
      </div>

      {loading && !stats ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
        </div>
      ) : (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {kpis.map((kpi) => (
          kpi.href === '#' ? (
            <div key={kpi.label} className="bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">{kpi.label}</p>
                  <p className="text-3xl font-bold text-neutral-900 dark:text-white mt-2">{kpi.value}</p>
                  {kpi.change && (
                    <p className={`text-sm mt-1 flex items-center gap-1 ${
                      kpi.changeType === 'positive' ? 'text-green-600' :
                      kpi.changeType === 'negative' ? 'text-red-600' : 'text-neutral-500'
                    }`}>
                      {kpi.changeType === 'negative' && <AlertTriangle className="w-3.5 h-3.5" />}
                      {kpi.change}
                    </p>
                  )}
                </div>
                <div className={`${kpi.color} rounded-xl p-3`}>
                  {kpi.icon}
                </div>
              </div>
            </div>
          ) : (
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
                      {kpi.change}
                    </p>
                  )}
                </div>
                <div className={`${kpi.color} rounded-xl p-3`}>
                  {kpi.icon}
                </div>
              </div>
            </Link>
          )
        ))}
      </div>
      )}

      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6">
        <h2 className="font-semibold text-lg text-neutral-900 dark:text-white mb-4">Acciones Rápidas</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link href="/inventario/conteos/nuevo" className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:border-primary-300 dark:hover:border-primary-700 transition-colors group">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <ClipboardList className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <p className="font-medium text-neutral-900 dark:text-white">Nuevo Conteo</p>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Inventario físico</p>
          </Link>
          <Link href="/inventario/conteos" className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:border-primary-300 dark:hover:border-primary-700 transition-colors group">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Eye className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <p className="font-medium text-neutral-900 dark:text-white">Ver Conteos</p>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Revisión de inventario físico</p>
          </Link>
          <Link href="/inventario/reportes/kardex" className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:border-primary-300 dark:hover:border-primary-700 transition-colors group">
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <ClipboardList className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <p className="font-medium text-neutral-900 dark:text-white">Kardex</p>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Historial de movimientos</p>
          </Link>
        </div>
      </div>
    </div>
  );
}