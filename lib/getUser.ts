import { cookies } from 'next/headers';
import { verifyToken, JWTPayload } from './jwt';
import { db } from './db';

export async function getCurrentUser(): Promise<{ id: string; first_name: string; last_name: string; email: string; role: string } | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    if (!token) return null;

    const payload = await verifyToken(token);
    if (!payload) return null;

    const { data: user } = await db
      .from('users')
      .select('id, first_name, last_name, email, role')
      .eq('id', payload.userId)
      .single();

    return user || null;
  } catch {
    return null;
  }
}

export async function requireUser(): Promise<{ id: string; first_name: string; last_name: string; email: string; role: string }> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Unauthorized');
  }
  return user;
}
