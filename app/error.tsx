'use client';

import { useEffect } from 'react';
import { Button } from '@/components/atoms/Button';

export default function Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Error de aplicación:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-light-muted dark:bg-surface-dark px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="text-6xl">⚠️</div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Algo salió mal</h1>
        <p className="text-gray-600 dark:text-gray-400">Ocurrió un error inesperado.</p>
        <Button onClick={reset} variant="primary">Intentar de nuevo</Button>
      </div>
    </div>
  );
}
