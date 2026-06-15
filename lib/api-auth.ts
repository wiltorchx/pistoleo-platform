import { cookies } from 'next/headers';
import { verifyToken } from './jwt';
import { getAdminClient } from './supabase-admin';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: 'admin' | 'operator';
}

export async function getAuthenticatedUser(): Promise<AuthenticatedUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return null;
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return null;
    }

    const { data: user, error } = await (getAdminClient() as any)
      .from('users')
      .select('id, email, role')
      .eq('id', payload.userId)
      .single();

    if (error || !user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
    };
  } catch {
    return null;
  }
}

export async function requireAuth(): Promise<AuthenticatedUser> {
  const user = await getAuthenticatedUser();
  if (!user) {
    throw new Error('Unauthorized');
  }
  return user;
}

export async function requireAdmin(): Promise<AuthenticatedUser> {
  const user = await requireAuth();
  if (user.role !== 'admin') {
    throw new Error('Forbidden: Admin required');
  }
  return user;
}