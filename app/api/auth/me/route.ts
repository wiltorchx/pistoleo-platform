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
    const cleanEmail = dedupe(typedUser.email);
    const cleanName = dedupe(typedUser.first_name);

    if (cleanEmail !== typedUser.email || cleanName !== typedUser.first_name) {
      await adminDb.from('users').update({ email: cleanEmail, first_name: cleanName }).eq('id', typedUser.id);
    }

    return NextResponse.json({
      user: {
        id: typedUser.id,
        firstName: cleanName,
        lastName: typedUser.last_name,
        email: cleanEmail,
        role: typedUser.role,
        avatarUrl: typedUser.avatar_url,
      },
    });
  } catch (error) {
    console.error('Error en /api/auth/me:', error);
    return NextResponse.json({ user: null }, { status: 500 });
  }
}
