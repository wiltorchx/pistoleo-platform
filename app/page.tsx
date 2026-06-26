import Link from 'next/link';
import { Button } from '@/components/atoms/Button';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-surface-light dark:bg-surface-dark">
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-surface-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
          <div className="text-center">
            <h1 className="text-4xl sm:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              Pistoleo 
              <span className="text-primary-600"> Extreme San Francisco</span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
              Gestión eficiente de inventarios y escaneo de mercadería en tiempo real.
            </p>
            <div className="flex justify-center mb-12">
              <div className="relative w-full max-w-2xl aspect-video bg-neutral-200 dark:bg-neutral-800 rounded-3xl shadow-2xl overflow-hidden border-4 border-white dark:border-neutral-700">
                 <img 
                  src="https://images.unsplash.com/photo-1586528116311-ad8de9c20fb1?auto=format&fit=crop&q=80&w=1000" 
                  alt="Pistoleo de mercadería" 
                  className="w-full h-full object-cover opacity-90"
                 />
                 <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
              </div>
            </div>
            <div className="flex justify-center gap-4">
              <Button variant="primary" size="lg" asChild>
                <Link href="/login">Iniciar Sesión</Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="/dashboard">Ir al Panel</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
