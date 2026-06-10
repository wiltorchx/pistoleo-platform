import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = { role: 'tutor' };
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { bio: { $regex: search, $options: 'i' } },
      ];
    }

    const [tutors, total] = await Promise.all([
      User.find(filter).select('-password -emailVerificationToken').sort('-createdAt').skip(skip).limit(limit).lean(),
      User.countDocuments(filter),
    ]);

    return NextResponse.json({
      tutors,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Tutors API error:', error);
    return NextResponse.json({ message: 'Error al cargar tutores' }, { status: 500 });
  }
}