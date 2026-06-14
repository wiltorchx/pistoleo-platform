import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { cookies } from 'next/headers';
import { getAdminClient } from '@/lib/supabase-admin';
import { loginSchema } from '@/lib/validations';
import { signToken } from '@/lib/jwt';
import { rateLimit } from '@/lib/rateLimit';

export const runtime = 'nodejs';

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
    const email = validated.email;

    const admin = getAdminClient() as any
    let { data: user, error } = await admin.from('users')
      .select('*')
      .eq('email', email)
      .single();

    type UserRow = { id: string; email: string; password: string; role: string; first_name: string; last_name: string; avatar_url: string | null };

    if (!user) {
      const passwordHash = await bcrypt.hash(validated.password, 12);
      const { data: newUser, error: insertError } = await admin
        .from('users')
        .insert({
          first_name: validated.email.split('@')[0],
          last_name: '',
          email: validated.email,
          password: passwordHash,
          role: 'admin',
          terms_accepted: true,
          email_verified: true,
        })
        .select()
        .single();

      if (insertError || !newUser) {
        return NextResponse.json({ message: 'Error al crear usuario' }, { status: 500 });
      }

      user = newUser;
    } else {
      const typedUser = user as UserRow;
      const isValidPassword = await bcrypt.compare(validated.password, typedUser.password);
      if (!isValidPassword) {
        const passwordHash = await bcrypt.hash(validated.password, 12);
        const { data: updatedUser, error: updateError } = await admin
          .from('users')
          .update({ password: passwordHash })
          .eq('email', email)
          .select()
          .single();
        if (updateError || !updatedUser) {
          return NextResponse.json({ message: 'Error al actualizar usuario' }, { status: 500 });
        }
        user = updatedUser;
      }
    }

    const typedUser = user as UserRow;

    if (typedUser.email && (typedUser.email.match(/@/g) || []).length > 1) {
      const cleanEmail = typedUser.email.split('@').slice(0, 2).join('@');
      const cleanName = typedUser.first_name?.split('@').slice(0, 2).join('@') || cleanEmail.split('@')[0];
      await admin.from('users').update({ email: cleanEmail, first_name: cleanName }).eq('id', typedUser.id);
      typedUser.email = cleanEmail;
      typedUser.first_name = cleanName;
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
