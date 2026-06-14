import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import * as bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { count } = await db.from('users').select('*', { count: 'exact', head: true });
    if (count && count > 0) {
      return NextResponse.json({ message: 'Ya existen usuarios en el sistema. No se requiere seed.' });
    }
    const passwordHash = await bcrypt.hash('1234', 12);
    const { error } = await db.from('users').insert({
      first_name: 'Will',
      last_name: '',
      email: 'will',
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
      credentials: { email: 'will', password: '1234' },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 }
    );
  }
}
