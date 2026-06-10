import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const runtime = 'nodejs';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const { data: course, error } = await db
      .from('courses')
      .select('*, tutor:users!courses_tutor_id_fkey(id, first_name, last_name, avatar_url, bio, email)')
      .eq('slug', slug)
      .eq('is_published', true)
      .eq('is_active', true)
      .single();

    if (error || !course) {
      return NextResponse.json({ message: 'Curso no encontrado' }, { status: 404 });
    }

    return NextResponse.json({
      course: {
        _id: course.id,
        id: course.id,
        title: course.title,
        slug: course.slug,
        description: course.description,
        shortDescription: course.short_description,
        tutor: course.tutor ? {
          _id: course.tutor.id,
          firstName: course.tutor.first_name,
          lastName: course.tutor.last_name,
          avatarUrl: course.tutor.avatar_url,
          bio: course.tutor.bio,
          email: course.tutor.email,
        } : null,
        thumbnailUrl: course.thumbnail_url,
        price: course.price,
        language: course.language,
        level: course.level,
        modules: course.modules,
        totalDuration: course.total_duration,
        totalLessons: course.total_lessons,
        isPublished: course.is_published,
        isActive: course.is_active,
        category: course.category,
        tags: course.tags,
        enrolledCount: course.enrolled_count,
        rating: course.rating,
        reviewCount: course.review_count,
        createdAt: course.created_at,
        updatedAt: course.updated_at,
      },
    });
  } catch (error) {
    console.error('Course detail error:', error);
    return NextResponse.json({ message: 'Error al cargar el curso' }, { status: 500 });
  }
}
