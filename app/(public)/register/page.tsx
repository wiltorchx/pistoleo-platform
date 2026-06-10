'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';
import { registerSchema, RegisterInput } from '@/lib/validations';
import { useAuth } from '@/hooks/useAuth';

export default function RegisterPage() {
  const router = useRouter();
  const { register: registerUser } = useAuth();
  const [error, setError] = useState('');
  const [selectedRole, setSelectedRole] = useState<'student' | 'tutor'>('student');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: 'student' },
  });

  const onSubmit = async (data: RegisterInput) => {
    setError('');
    try {
      await registerUser({ ...data, role: selectedRole });
      router.push('/login?registered=true');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrar');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-light-muted dark:bg-surface-dark px-4 py-12">
      <div className="max-w-md w-full space-y-6 bg-white dark:bg-surface-dark-elevated p-8 rounded-2xl shadow-card">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Crear Cuenta</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Únete a nuestra comunidad</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <div className="bg-danger/10 border border-danger text-danger px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Input label="Nombre" error={errors.firstName?.message} {...register('firstName')} />
            <Input label="Apellido" error={errors.lastName?.message} {...register('lastName')} />
          </div>

          <Input label="Email" type="email" error={errors.email?.message} {...register('email')} />

          <Input
            label="Contraseña"
            type="password"
            error={errors.password?.message}
            hint="Mínimo 8 caracteres, mayúscula, minúscula y número"
            {...register('password')}
          />

          <Input
            label="Confirmar Contraseña"
            type="password"
            error={errors.confirmPassword?.message}
            {...register('confirmPassword')}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Quiero ser:
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setSelectedRole('student')}
                className={`p-4 border-2 rounded-lg text-center transition-colors ${
                  selectedRole === 'student'
                    ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-gray-300 dark:border-gray-600'
                }`}
              >
                <div className="font-medium">Estudiante</div>
              </button>
              <button
                type="button"
                onClick={() => setSelectedRole('tutor')}
                className={`p-4 border-2 rounded-lg text-center transition-colors ${
                  selectedRole === 'tutor'
                    ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-gray-300 dark:border-gray-600'
                }`}
              >
                <div className="font-medium">Tutor</div>
              </button>
            </div>
            <input type="hidden" {...register('role')} value={selectedRole} />
          </div>

          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" className="mt-1" {...register('termsAccepted')} />
            <span className="text-gray-700 dark:text-gray-300">
              Acepto los <Link href="/terms" className="text-primary-600 hover:underline">términos</Link>
            </span>
          </label>

          {errors.termsAccepted && (
            <p className="text-sm text-danger">{errors.termsAccepted.message}</p>
          )}

          <Button type="submit" variant="primary" fullWidth disabled={isSubmitting}>
            {isSubmitting ? 'Creando cuenta...' : 'Crear Cuenta'}
          </Button>
        </form>

        <p className="text-center text-sm text-gray-600 dark:text-gray-400">
          ¿Ya tienes cuenta?{' '}
          <Link href="/login" className="text-primary-600 hover:text-primary-700 font-medium">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
