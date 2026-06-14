'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';
import { loginSchema, LoginInput } from '@/lib/validations';
import { useAuth } from '@/hooks/useAuth';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginInput) => {
    setError('');
    try {
      await login(data.username, data.password);
      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión');
    }
  };

  return (
    <div className="max-w-md w-full space-y-8 bg-white dark:bg-surface-dark-elevated p-8 rounded-2xl shadow-card">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Iniciar Sesión</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">Accede al sistema de inventario</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {error && (
          <div className="bg-danger/10 border border-danger text-danger px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <Input label="Usuario o Email" type="text" error={errors.username?.message} {...register('username')} />
        <Input label="Contraseña" type="password" error={errors.password?.message} {...register('password')} />

        <Button type="submit" variant="primary" fullWidth disabled={isSubmitting}>
          {isSubmitting ? 'Iniciando sesión...' : 'Iniciar Sesión'}
        </Button>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-light-muted dark:bg-surface-dark px-4">
      <Suspense fallback={<div>Cargando...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
