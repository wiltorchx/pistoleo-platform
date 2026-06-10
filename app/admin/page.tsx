'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Users, BookOpen, GraduationCap, Clock, LogOut, Shield } from 'lucide-react';
import Link from 'next/link';

interface AdminStats {
  totalStudents: number;
  totalTutors: number;
  totalCourses: number;
  pendingEnrollments: number;
}

interface RecentUser {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  createdAt: string;
}

export default function AdminDashboard() {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'admin')) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetch('/api/admin/stats')
        .then((r) => r.json())
        .then((data) => {
          setStats(data.stats);
          setRecentUsers(data.recentUsers || []);
        })
        .catch(console.error);
    }
  }, [user]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-light-muted dark:bg-surface-dark">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  if (!user || user.role !== 'admin') return null;

  const statCards = [
    { label: 'Estudiantes', value: stats?.totalStudents ?? '-', icon: Users, color: 'text-primary-600' },
    { label: 'Tutores', value: stats?.totalTutors ?? '-', icon: GraduationCap, color: 'text-success' },
    { label: 'Cursos', value: stats?.totalCourses ?? '-', icon: BookOpen, color: 'text-warning' },
    { label: 'Pagos Pendientes', value: stats?.pendingEnrollments ?? '-', icon: Clock, color: 'text-danger' },
  ];

  return (
    <div className="min-h-screen bg-surface-light-muted dark:bg-surface-dark">
      <header className="bg-white dark:bg-surface-dark-elevated border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary-600" />
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Admin Panel</h1>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm text-gray-500 hover:text-primary-600">Inicio</Link>
            <button
              onClick={async () => { await logout(); router.push('/'); }}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-danger"
            >
              <LogOut className="w-4 h-4" /> Salir
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Resumen</h2>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map((card) => (
            <div
              key={card.label}
              className="bg-white dark:bg-surface-dark-elevated rounded-2xl p-5 shadow-card border border-gray-100 dark:border-gray-800"
            >
              <card.icon className={`w-8 h-8 ${card.color} mb-3`} />
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{card.value}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{card.label}</p>
            </div>
          ))}
        </div>

        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Usuarios Recientes</h2>
        <div className="bg-white dark:bg-surface-dark-elevated rounded-2xl shadow-card border border-gray-100 dark:border-gray-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
              <tr>
                <th className="px-6 py-3 text-left font-medium">Nombre</th>
                <th className="px-6 py-3 text-left font-medium">Email</th>
                <th className="px-6 py-3 text-left font-medium">Rol</th>
                <th className="px-6 py-3 text-left font-medium">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {recentUsers.map((u) => (
                <tr key={u._id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-6 py-3 text-gray-900 dark:text-white">{u.firstName} {u.lastName}</td>
                  <td className="px-6 py-3 text-gray-600 dark:text-gray-400">{u.email}</td>
                  <td className="px-6 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      u.role === 'admin' ? 'bg-danger/10 text-danger' :
                      u.role === 'tutor' ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300' :
                      'bg-success/10 text-success'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-gray-500 dark:text-gray-400">
                    {new Date(u.createdAt).toLocaleDateString('es')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {recentUsers.length === 0 && (
            <p className="text-center py-8 text-gray-500">No hay usuarios</p>
          )}
        </div>
      </main>
    </div>
  );
}