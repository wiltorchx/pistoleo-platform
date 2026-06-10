import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/jwt';
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

    const { courseId } = await request.json();
    if (!courseId) {
      return NextResponse.json({ message: 'ID del curso requerido' }, { status: 400 });
    }

    const { data: course, error: courseError } = await db
      .from('courses')
      .select('id, price, is_published')
      .eq('id', courseId)
      .single();

    if (courseError || !course || !course.is_published) {
      return NextResponse.json({ message: 'Curso no encontrado' }, { status: 404 });
    }

    const { data: existing } = await db
      .from('enrollments')
      .select('id')
      .eq('student_id', payload.userId)
      .eq('course_id', courseId)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ message: 'Ya estás inscrito en este curso' }, { status: 409 });
    }

    const { data: enrollment, error: enrollError } = await db
      .from('enrollments')
      .insert({
        student_id: payload.userId,
        course_id: courseId,
        status: 'pending',
        payment_status: 'pending',
        payment_amount: course.price,
        payment_method: 'transferencia',
      })
      .select()
      .single();

    if (enrollError) throw enrollError;

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

    const { data: enrollments, error } = await db
      .from('enrollments')
      .select('*, course:courses!enrollments_course_id_fkey(*)')
      .eq('student_id', payload.userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const mapped = (enrollments || []).map(e => ({
      _id: e.id,
      id: e.id,
      studentId: e.student_id,
      courseId: e.course_id,
      status: e.status,
      paymentStatus: e.payment_status,
      paymentAmount: e.payment_amount,
      paymentMethod: e.payment_method,
      paymentReceiptUrl: e.payment_receipt_url,
      progress: e.progress,
      completedLessons: e.completed_lessons,
      startedAt: e.started_at,
      completedAt: e.completed_at,
      course: e.course ? {
        _id: e.course.id,
        title: e.course.title,
        slug: e.course.slug,
        thumbnailUrl: e.course.thumbnail_url,
        language: e.course.language,
        level: e.course.level,
        shortDescription: e.course.short_description,
        price: e.course.price,
        totalDuration: e.course.total_duration,
        tutor: e.course.tutor_id,
      } : null,
      createdAt: e.created_at,
      updatedAt: e.updated_at,
    }));

    return NextResponse.json({ enrollments: mapped });
  } catch (error) {
    console.error('My enrollments error:', error);
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}
