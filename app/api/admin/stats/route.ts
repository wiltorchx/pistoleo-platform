import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { connectDB } from '@/lib/db';
import { verifyToken } from '@/lib/jwt';
import { User } from '@/models/User';
import { Enrollment } from '@/models/Enrollment';

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

    await connectDB();

    const [totalStudents, totalTutors, totalCourses, pendingEnrollments, recentUsers] =
      await Promise.all([
        User.countDocuments({ role: 'student' }),
        User.countDocuments({ role: 'tutor' }),
        (await import('@/models/Course')).Course.countDocuments({}),
        Enrollment.countDocuments({ paymentStatus: 'uploaded' }),
        User.find().select('-password -emailVerificationToken').sort('-createdAt').limit(10).lean(),
      ]);

    return NextResponse.json({
      stats: { totalStudents, totalTutors, totalCourses, pendingEnrollments },
      recentUsers,
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json({ message: 'Error interno' }, { status: 500 });
  }
}