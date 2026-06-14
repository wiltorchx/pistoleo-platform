import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/jwt';
import { adminDb } from '@/lib/supabase-admin';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    const { data: user, error } = await adminDb
      .from('users')
      .select('id, first_name, last_name, email, role, avatar_url')
      .eq('id', payload.userId)
      .single();

    type UserRow = { id: string; first_name: string; last_name: string; email: string; role: 'admin' | 'operator'; avatar_url: string | null };
    const typedUser = user as UserRow | null;

    if (error || !typedUser) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

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
    console.error('Error en /api/auth/me:', error);
    return NextResponse.json({ user: null }, { status: 500 });
  }
}
