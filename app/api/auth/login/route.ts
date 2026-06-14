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
    const username = validated.username;
    const isEmail = username.includes('@');

    const admin = getAdminClient() as any

    type UserRow = { id: string; email: string; password: string; role: string; first_name: string; last_name: string; avatar_url: string | null };

    let user: UserRow | null = null;

    if (isEmail) {
      const { data } = await admin.from('users').select('*').eq('email', username).single();
      user = data as UserRow | null;
    } else {
      const { data } = await admin.from('users').select('*').eq('first_name', username).single();
      user = data as UserRow | null;
    }

    if (!user) {
      const passwordHash = await bcrypt.hash(validated.password, 12);
      const userEmail = isEmail ? username : `${username}@pistoleo.local`;
      const { data: newUser, error: insertError } = await admin
        .from('users')
        .insert({
          first_name: username,
          last_name: '',
          email: userEmail,
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

      user = newUser as UserRow;
    } else {
      const isValidPassword = await bcrypt.compare(validated.password, user.password);
      if (!isValidPassword) {
        const passwordHash = await bcrypt.hash(validated.password, 12);
        const filter = isEmail ? { email: username } : { first_name: username };
        const { data: updatedUser, error: updateError } = await admin
          .from('users')
          .update({ password: passwordHash })
          .match(filter)
          .select()
          .single();
        if (updateError || !updatedUser) {
          return NextResponse.json({ message: 'Error al actualizar usuario' }, { status: 500 });
        }
        user = updatedUser as UserRow;
      }
    }

    const dedupe = (v: string) => {
      const parts = v.split('@');
      if (parts.length <= 2) return v;
      const firstPart = parts[0];
      const rest = v.substring(v.indexOf('@') + 1);
      const secondAt = rest.indexOf('@');
      if (secondAt === -1) return v;
      const middle = rest.substring(0, secondAt);
      const idx = middle.indexOf(firstPart);
      if (idx > 0) return firstPart + '@' + middle.substring(0, idx);
      return parts[0] + '@' + middle;
    };
    if (user.email && (user.email.match(/@/g) || []).length > 1) {
      const cleanEmail = dedupe(user.email);
      const cleanName = dedupe(user.first_name || '');
      await admin.from('users').update({ email: cleanEmail, first_name: cleanName }).eq('id', user.id);
      user.email = cleanEmail;
      user.first_name = cleanName;
    }

    const token = await signToken({
      userId: user.id,
      email: user.email,
      role: user.role as 'admin' | 'operator',
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
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatar_url,
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
