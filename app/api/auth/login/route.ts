import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { loginSchema } from '@/lib/validations';
import { signToken } from '@/lib/jwt';
import { rateLimit } from '@/lib/rateLimit';

export const runtime = 'nodejs';

async function seedAdminIfNeeded() {
  const admin = supabaseAdmin;
  const { count } = await admin.from('users').select('*', { count: 'exact', head: true });
  if (count === 0) {
    const passwordHash = await bcrypt.hash('Test1234', 12);
    await admin.from('users').insert({
      first_name: 'Admin',
      last_name: 'Sistema',
      email: 'admin@lms.com',
      password: passwordHash,
      role: 'admin',
      terms_accepted: true,
      email_verified: true,
    });
  }
}

export async function POST(request: Request) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    if (!rateLimit(`login:${ip}`, 5, 15 * 60 * 1000)) {
      return NextResponse.json(
        { message: 'Demasiados intentos. Espera 15 minutos.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const validated = loginSchema.parse(body);

    await seedAdminIfNeeded();

    const { data: user, error } = await db
      .from('users')
      .select('*')
      .eq('email', validated.email)
      .single();

    type UserRow = { id: string; email: string; password: string; role: string; first_name: string; last_name: string; avatar_url: string | null };
    const typedUser = user as UserRow | null;

    if (error || !typedUser) {
      return NextResponse.json({ message: 'Credenciales inválidas' }, { status: 401 });
    }

    const isValidPassword = await bcrypt.compare(validated.password, typedUser.password);
    if (!isValidPassword) {
      return NextResponse.json({ message: 'Credenciales inválidas' }, { status: 401 });
    }

    const token = await signToken({
      userId: typedUser.id,
      email: typedUser.email,
      role: typedUser.role as 'admin' | 'operator',
    });

    const cookieStore = await cookies();
    cookieStore.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return NextResponse.json({
      user: {
        id: typedUser.id,
        firstName: typedUser.first_name,
        lastName: typedUser.last_name,
        email: typedUser.email,
        role: typedUser.role,
        avatarUrl: typedUser.avatar_url,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Datos inválidos', errors: error.issues },
        { status: 400 }
      );
    }

    console.error('Login error:', error);
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}
