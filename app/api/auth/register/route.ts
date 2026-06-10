import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { z } from 'zod';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
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

    await connectDB();

    const body = await request.json();
    const validated = registerSchema.parse(body);

    const existingUser = await User.findOne({ email: validated.email });
    if (existingUser) {
      return NextResponse.json({ message: 'El email ya está registrado' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(validated.password, 12);
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const user = await User.create({
      firstName: validated.firstName,
      lastName: validated.lastName,
      email: validated.email,
      password: hashedPassword,
      role: validated.role,
      termsAccepted: validated.termsAccepted,
      emailVerificationToken: verificationToken,
      emailVerificationExpires: verificationExpires,
      emailVerified: false,
    });

    console.log(`Usuario creado: ${user.email}`);

    return NextResponse.json(
      {
        message: 'Usuario registrado exitosamente',
        user: {
          _id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
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
