'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/atoms/Button';
import { BookOpen, LogOut, Menu, Moon, Sun, User, X } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function Header() {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  return (
    <header className="bg-white dark:bg-surface-dark-elevated border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2 text-xl font-bold text-primary-600">
            <BookOpen className="w-6 h-6" />
            <span>LMS</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link href="/courses" className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 transition-colors">
              Cursos
            </Link>
            <Link href="/tutors" className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 transition-colors">
              Tutores
            </Link>

            {mounted && (
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Cambiar tema"
              >
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
            )}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                <Link href="/dashboard" className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600">
                  <User className="w-4 h-4" />
                  {user.firstName}
                </Link>
                <button onClick={handleLogout} className="flex items-center gap-1 text-sm text-gray-500 hover:text-danger transition-colors">
                  <LogOut className="w-4 h-4" />
                  Salir
                </button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/login">Iniciar Sesión</Link>
                </Button>
                <Button variant="primary" size="sm" asChild>
                  <Link href="/register">Crear Cuenta</Link>
                </Button>
              </>
            )}
          </div>

          <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2 text-gray-600 dark:text-gray-400">
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden border-t border-gray-200 dark:border-gray-700 py-4 space-y-3">
            <Link href="/courses" className="block text-sm font-medium text-gray-700 dark:text-gray-300 py-2" onClick={() => setMenuOpen(false)}>
              Cursos
            </Link>
            <Link href="/tutors" className="block text-sm font-medium text-gray-700 dark:text-gray-300 py-2" onClick={() => setMenuOpen(false)}>
              Tutores
            </Link>
            <div className="flex items-center gap-3 pt-2 border-t border-gray-200 dark:border-gray-700">
              {user ? (
                <>
                  <Link href="/dashboard" className="flex-1 text-sm font-medium text-gray-700 dark:text-gray-300 py-2" onClick={() => setMenuOpen(false)}>
                    Mi Panel
                  </Link>
                  <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-danger">Salir</button>
                </>
              ) : (
                <>
                  <Button variant="ghost" size="sm" fullWidth asChild>
                    <Link href="/login" onClick={() => setMenuOpen(false)}>Iniciar Sesión</Link>
                  </Button>
                  <Button variant="primary" size="sm" fullWidth asChild>
                    <Link href="/register" onClick={() => setMenuOpen(false)}>Crear Cuenta</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}