import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Course } from '@/models/Course';

export const runtime = 'nodejs';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    await connectDB();

    const { slug } = await params;
    const course = await Course.findOne({ slug, isPublished: true, isActive: true })
      .populate('tutor', 'firstName lastName avatarUrl bio email')
      .lean();

    if (!course) {
      return NextResponse.json({ message: 'Curso no encontrado' }, { status: 404 });
    }

    return NextResponse.json({ course });
  } catch (error) {
    console.error('Course detail error:', error);
    return NextResponse.json({ message: 'Error al cargar el curso' }, { status: 500 });
  }
}