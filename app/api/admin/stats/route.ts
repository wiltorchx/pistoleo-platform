import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/jwt';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    if (!token) return NextResponse.json({ message: 'No autenticado' }, { status: 401 });

    const payload = await verifyToken(token);
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
    }

    const [
      { count: totalStudents },
      { count: totalTutors },
      { count: totalCourses },
      { count: pendingEnrollments },
      { data: recentUsers },
    ] = await Promise.all([
      db.from('users').select('*', { count: 'exact', head: true }).eq('role', 'student'),
      db.from('users').select('*', { count: 'exact', head: true }).eq('role', 'tutor'),
      db.from('courses').select('*', { count: 'exact', head: true }),
      db.from('enrollments').select('*', { count: 'exact', head: true }).eq('payment_status', 'uploaded'),
      db.from('users').select('id, first_name, last_name, email, role, avatar_url, bio, hourly_rate, created_at').order('created_at', { ascending: false }).limit(10),
    ]);

    const mappedUsers = (recentUsers || []).map(u => ({
      _id: u.id,
      firstName: u.first_name,
      lastName: u.last_name,
      email: u.email,
      role: u.role,
      avatarUrl: u.avatar_url,
      bio: u.bio,
      hourlyRate: u.hourly_rate,
      createdAt: u.created_at,
    }));

    return NextResponse.json({
      stats: { totalStudents, totalTutors, totalCourses, pendingEnrollments },
      recentUsers: mappedUsers,
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json({ message: 'Error interno' }, { status: 500 });
  }
}
