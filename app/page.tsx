import Link from 'next/link';
import { Button } from '@/components/atoms/Button';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-surface-light dark:bg-surface-dark">
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-surface-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
          <div className="text-center">
            <h1 className="text-4xl sm:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              Aprende idiomas con
              <span className="text-primary-600"> tutores reales</span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
              Clases personalizadas de inglés y español con tutores certificados.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="primary" size="lg" asChild>
                <Link href="/courses">Ver Cursos</Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="/register">Crear Cuenta</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
