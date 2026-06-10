import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const language = searchParams.get('language');
    const level = searchParams.get('level');
    const search = searchParams.get('search');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const sort = searchParams.get('sort') || 'newest';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');

    let query = db
      .from('courses')
      .select('*, tutor:users!courses_tutor_id_fkey(id, first_name, last_name, avatar_url, bio)', { count: 'exact' })
      .eq('is_published', true)
      .eq('is_active', true);

    if (language && language !== 'all') {
      query = query.eq('language', language);
    }
    if (level && level !== 'all') {
      query = query.eq('level', level);
    }
    if (search) {
      query = query.ilike('title', `%${search}%`);
    }
    if (minPrice) {
      query = query.gte('price', parseFloat(minPrice));
    }
    if (maxPrice) {
      query = query.lte('price', parseFloat(maxPrice));
    }

    const sortOptions: Record<string, { column: string; ascending: boolean }> = {
      newest: { column: 'created_at', ascending: false },
      oldest: { column: 'created_at', ascending: true },
      priceAsc: { column: 'price', ascending: true },
      priceDesc: { column: 'price', ascending: false },
      popular: { column: 'enrolled_count', ascending: false },
      rating: { column: 'rating', ascending: false },
    };

    const sortOption = sortOptions[sort] || sortOptions.newest;
    query = query
      .order(sortOption.column, { ascending: sortOption.ascending })
      .range((page - 1) * limit, page * limit - 1);

    const { data: courses, count: total, error } = await query;

    if (error) throw error;

    const mapped = (courses || []).map(c => ({
      _id: c.id,
      id: c.id,
      title: c.title,
      slug: c.slug,
      description: c.description,
      shortDescription: c.short_description,
      tutor: c.tutor ? {
        _id: c.tutor.id,
        firstName: c.tutor.first_name,
        lastName: c.tutor.last_name,
        avatarUrl: c.tutor.avatar_url,
        bio: c.tutor.bio,
      } : null,
      thumbnailUrl: c.thumbnail_url,
      price: c.price,
      language: c.language,
      level: c.level,
      modules: c.modules,
      totalDuration: c.total_duration,
      totalLessons: c.total_lessons,
      isPublished: c.is_published,
      isActive: c.is_active,
      category: c.category,
      tags: c.tags,
      enrolledCount: c.enrolled_count,
      rating: c.rating,
      reviewCount: c.review_count,
      createdAt: c.created_at,
      updatedAt: c.updated_at,
    }));

    return NextResponse.json({
      courses: mapped,
      pagination: {
        page,
        limit,
        total: total || 0,
        totalPages: Math.ceil((total || 0) / limit),
      },
    });
  } catch (error) {
    console.error('Courses API error:', error);
    return NextResponse.json({ message: 'Error al cargar cursos' }, { status: 500 });
  }
}
