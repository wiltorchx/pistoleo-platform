import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { connectDB } from '@/lib/db';
import { verifyToken } from '@/lib/jwt';
import { Enrollment } from '@/models/Enrollment';
import { Course } from '@/models/Course';
import { rateLimit } from '@/lib/rateLimit';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    if (!token) {
      return NextResponse.json({ message: 'No autenticado' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ message: 'Token inválido' }, { status: 401 });
    }

    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    if (!rateLimit(`enroll:${ip}`, 10, 60 * 1000)) {
      return NextResponse.json({ message: 'Demasiadas solicitudes' }, { status: 429 });
    }

    await connectDB();

    const { courseId } = await request.json();
    if (!courseId) {
      return NextResponse.json({ message: 'ID del curso requerido' }, { status: 400 });
    }

    const course = await Course.findById(courseId);
    if (!course || !course.isPublished) {
      return NextResponse.json({ message: 'Curso no encontrado' }, { status: 404 });
    }

    const existing = await Enrollment.findOne({
      student: payload.userId,
      course: courseId,
    });

    if (existing) {
      return NextResponse.json({ message: 'Ya estás inscrito en este curso' }, { status: 409 });
    }

    const enrollment = await Enrollment.create({
      student: payload.userId,
      course: courseId,
      status: 'pending',
      paymentStatus: 'pending',
      paymentAmount: course.price,
      paymentMethod: 'transferencia',
    });

    return NextResponse.json(
      { message: 'Inscripción creada. Debes subir el comprobante de pago.', enrollment },
      { status: 201 }
    );
  } catch (error) {
    console.error('Enrollment error:', error);
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    if (!token) {
      return NextResponse.json({ message: 'No autenticado' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload || payload.role !== 'student') {
      return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
    }

    await connectDB();

    const enrollments = await Enrollment.find({ student: payload.userId })
      .populate({
        path: 'course',
        select: 'title slug thumbnailUrl language level shortDescription price totalDuration tutor',
        populate: { path: 'tutor', select: 'firstName lastName avatarUrl' },
      })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ enrollments });
  } catch (error) {
    console.error('My enrollments error:', error);
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}