import Link from 'next/link';
import { Button } from '@/components/atoms/Button';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-light-muted dark:bg-surface-dark px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="text-6xl">🔍</div>
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white">404</h1>
        <p className="text-xl text-gray-600 dark:text-gray-400">Página no encontrada</p>
        <Button asChild variant="primary">
          <Link href="/">Volver al inicio</Link>
        </Button>
      </div>
    </div>
  );
}
