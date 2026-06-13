import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { count } = await db.from('users').select('*', { count: 'exact', head: true });
    if (count && count > 0) {
      return NextResponse.json({ message: 'Ya existen usuarios en el sistema. No se requiere seed.' });
    }
    const passwordHash = await bcrypt.hash('Test1234', 12);
    const { error } = await db.from('users').insert({
      first_name: 'Admin',
      last_name: 'Sistema',
      email: 'admin@lms.com',
      password: passwordHash,
      role: 'admin',
      terms_accepted: true,
      email_verified: true,
    });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({
      message: 'Usuario admin creado exitosamente',
      credentials: { email: 'admin@lms.com', password: 'Test1234' },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 }
    );
  }
}
