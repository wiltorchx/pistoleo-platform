'use client';

import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import { Button } from '@/components/atoms/Button';
import { BookOpen, LogOut, User, GraduationCap } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface EnrollmentItem {
  _id: string;
  status: string;
  paymentStatus: string;
  progress: number;
  createdAt: string;
  course: {
    _id: string;
    title: string;
    slug: string;
    thumbnailUrl?: string;
    language: string;
    level: string;
    shortDescription: string;
    totalDuration: number;
    price: number;
    tutor?: {
      firstName: string;
      lastName: string;
    };
  };
}

export default function DashboardPage() {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const [enrollments, setEnrollments] = useState<EnrollmentItem[]>([]);
  const [loadingEnrollments, setLoadingEnrollments] = useState(true);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user) {
      fetch('/api/enrollments')
        .then((res) => res.json())
        .then((data) => setEnrollments(data.enrollments || []))
        .catch(console.error)
        .finally(() => setLoadingEnrollments(false));
    }
  }, [user]);

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  if (isLoading || loadingEnrollments) {
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

  const paymentStatusLabel: Record<string, string> = {
    pending: 'Pendiente',
    uploaded: 'Comprobante subido',
    verified: 'Verificado',
    rejected: 'Rechazado',
  };

  const paymentStatusColor: Record<string, string> = {
    pending: 'bg-warning/10 text-warning',
    uploaded: 'bg-primary-100 text-primary-700',
    verified: 'bg-success/10 text-success',
    rejected: 'bg-danger/10 text-danger',
  };

  return (
    <div className="min-h-screen bg-surface-light-muted dark:bg-surface-dark">
      <header className="bg-white dark:bg-surface-dark-elevated border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-primary-600">
            LMS
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
          <p className="mt-1 text-gray-600 dark:text-gray-400">Bienvenido a tu panel de estudiante</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Link
            href="/courses"
            className="bg-white dark:bg-surface-dark-elevated rounded-2xl p-6 shadow-card border border-gray-100 dark:border-gray-800 hover:border-primary-600 transition-colors group"
          >
            <BookOpen className="w-8 h-8 text-primary-600 mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-primary-600">
              Explorar Cursos
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Encuentra nuevos cursos</p>
          </Link>

          <Link
            href="/tutors"
            className="bg-white dark:bg-surface-dark-elevated rounded-2xl p-6 shadow-card border border-gray-100 dark:border-gray-800 hover:border-primary-600 transition-colors group"
          >
            <GraduationCap className="w-8 h-8 text-primary-600 mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-primary-600">
              Ver Tutores
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Conoce a nuestros instructores</p>
          </Link>
        </div>

        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Mis Cursos</h2>

        {enrollments.length === 0 ? (
          <div className="bg-white dark:bg-surface-dark-elevated rounded-2xl p-8 text-center border border-gray-200 dark:border-gray-700">
            <BookOpen className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No estás inscrito en ningún curso todavía</p>
            <Button variant="primary" className="mt-4" asChild>
              <Link href="/courses">Ver Cursos</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {enrollments.map((enrollment) => (
              <div
                key={enrollment._id}
                className="bg-white dark:bg-surface-dark-elevated rounded-2xl p-5 shadow-card border border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row gap-4"
              >
                <div className="w-full sm:w-32 h-20 rounded-lg bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/30 dark:to-surface-dark flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-8 h-8 text-primary-600/40" />
                </div>
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/courses/${enrollment.course?.slug}`}
                    className="text-lg font-semibold text-gray-900 dark:text-white hover:text-primary-600"
                  >
                    {enrollment.course?.title}
                  </Link>
                  {enrollment.course?.tutor && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {enrollment.course.tutor.firstName} {enrollment.course.tutor.lastName}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-2 text-xs">
                    <span className={`px-2 py-1 rounded-full ${paymentStatusColor[enrollment.paymentStatus] || 'bg-gray-100 text-gray-600'}`}>
                      {paymentStatusLabel[enrollment.paymentStatus] || enrollment.paymentStatus}
                    </span>
                    {enrollment.progress > 0 && (
                      <span className="text-gray-500">{enrollment.progress}% completado</span>
                    )}
                  </div>
                  {enrollment.progress > 0 && (
                    <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-primary-600 h-2 rounded-full transition-all"
                        style={{ width: `${enrollment.progress}%` }}
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}