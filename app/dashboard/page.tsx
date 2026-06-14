'use client';

import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import { Button } from '@/components/atoms/Button';
import { Package, LogOut, User, ClipboardList, BarChart3 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardPage() {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-light-muted dark:bg-surface-dark">
        <div className="text-center space-y-4">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent" />
          <p className="text-gray-600 dark:text-gray-400">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-surface-light-muted dark:bg-surface-dark">
      <header className="bg-white dark:bg-surface-dark-elevated border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-primary-600">
            Pistoleo
          </Link>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <User className="w-4 h-4" />
              <span>{user.firstName}</span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-danger transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Salir
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            Hola, {user.firstName}!
          </h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">Bienvenido al Panel de Pistoleo Extreme</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Link
            href="/inventario"
            className="bg-white dark:bg-surface-dark-elevated rounded-2xl p-6 shadow-card border border-gray-100 dark:border-gray-800 hover:border-primary-600 transition-colors group"
          >
            <ClipboardList className="w-8 h-8 text-primary-600 mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-primary-600">
              Inventarios
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Consulta y gestión de existencias</p>
          </Link>

          <Link
            href="/inventario/reportes"
            className="bg-white dark:bg-surface-dark-elevated rounded-2xl p-6 shadow-card border border-gray-100 dark:border-gray-800 hover:border-primary-600 transition-colors group"
          >
            <BarChart3 className="w-8 h-8 text-primary-600 mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-primary-600">
              Reportes
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Kardex y conteos realizados</p>
          </Link>
        </div>

        {user.role === 'admin' && (
          <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
            <Link
              href="/inventario"
              className="inline-flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              Ir al Panel de Inventario →
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
