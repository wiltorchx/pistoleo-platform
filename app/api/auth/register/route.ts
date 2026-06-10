import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { z } from 'zod';
import { db } from '@/lib/db';
import { registerSchema } from '@/lib/validations';
import { rateLimit } from '@/lib/rateLimit';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    if (!rateLimit(`register:${ip}`, 3, 60 * 60 * 1000)) {
      return NextResponse.json(
        { message: 'Demasiados intentos. Espera 1 hora.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const validated = registerSchema.parse(body);

    const { data: existingUser } = await db
      .from('users')
      .select('id')
      .eq('email', validated.email)
      .single();

    if (existingUser) {
      return NextResponse.json({ message: 'El email ya está registrado' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(validated.password, 12);
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const { data: user, error } = await db
      .from('users')
      .insert({
        first_name: validated.firstName,
        last_name: validated.lastName,
        email: validated.email,
        password: hashedPassword,
        role: validated.role,
        terms_accepted: validated.termsAccepted,
        email_verification_token: verificationToken,
        email_verification_expires: verificationExpires.toISOString(),
        email_verified: false,
      })
      .select()
      .single();

    if (error) throw error;

    console.log(`Usuario creado: ${user.email}`);

    return NextResponse.json(
      {
        message: 'Usuario registrado exitosamente',
        user: {
          id: user.id,
          firstName: user.first_name,
          lastName: user.last_name,
          email: user.email,
          role: user.role,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Datos inválidos', errors: error.issues },
        { status: 400 }
      );
    }

    console.error('Register error:', error);
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}
