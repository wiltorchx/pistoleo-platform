import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Course } from '@/models/Course';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const language = searchParams.get('language');
    const level = searchParams.get('level');
    const search = searchParams.get('search');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const sort = searchParams.get('sort') || 'newest';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');

    const filter: Record<string, unknown> = { isPublished: true, isActive: true };

    if (language && language !== 'all') filter.language = language;
    if (level && level !== 'all') filter.level = level;
    if (search) filter.title = { $regex: search, $options: 'i' };

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price = { $gte: parseFloat(minPrice), ...filter.price as object };
      if (maxPrice) filter.price = { $lte: parseFloat(maxPrice), ...filter.price as object };
    }

    const sortOptions: Record<string, string> = {
      newest: '-createdAt',
      oldest: 'createdAt',
      priceAsc: 'price',
      priceDesc: '-price',
      popular: '-enrolledCount',
      rating: '-rating',
    };

    const sortOption = sortOptions[sort] || sortOptions.newest;
    const skip = (page - 1) * limit;

    const [courses, total] = await Promise.all([
      Course.find(filter)
        .populate('tutor', 'firstName lastName avatarUrl bio')
        .sort(sortOption)
        .skip(skip)
        .limit(limit)
        .lean(),
      Course.countDocuments(filter),
    ]);

    return NextResponse.json({
      courses,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Courses API error:', error);
    return NextResponse.json({ message: 'Error al cargar cursos' }, { status: 500 });
  }
}