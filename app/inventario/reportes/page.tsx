'use client';

import React from 'react';
import Link from 'next/link';
import { FileText, BarChart3, TrendingUp, ClipboardList, ArrowRight } from 'lucide-react';

const reportes = [
  {
    title: 'Reporte de Stock',
    description: 'Listado completo del inventario con stock actual, mínimo y valorizado',
    icon: ClipboardList,
    color: 'bg-blue-500',
    href: '/inventario/reportes/stock',
  },
  {
    title: 'Stock Valorizado',
    description: 'Valor económico del inventario por producto, categoría y ubicación',
    icon: TrendingUp,
    color: 'bg-green-500',
    href: '/inventario/reportes/valorizado',
  },
  {
    title: 'Kardex',
    description: 'Historial completo de movimientos con filtros por fecha, producto y ubicación',
    icon: BarChart3,
    color: 'bg-purple-500',
    href: '/inventario/reportes/kardex',
  },
];

export default function ReportesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">Reportes</h1>
        <p className="text-neutral-500 mt-1">Informes y análisis del inventario</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reportes.map((r) => (
          <Link
            key={r.title}
            href={r.href}
            className="group bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 hover:shadow-lg hover:border-primary-200 dark:hover:border-primary-800 transition-all"
          >
            <div className={`${r.color} w-12 h-12 rounded-xl flex items-center justify-center mb-4`}>
              <r.icon className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-white group-hover:text-primary-600 transition-colors">
              {r.title}
            </h2>
            <p className="text-sm text-neutral-500 mt-2">{r.description}</p>
            <div className="flex items-center gap-1 mt-4 text-sm text-primary-600 font-medium">
              Ver reporte <ArrowRight className="w-4 h-4" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
