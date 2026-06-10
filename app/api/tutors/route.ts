import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const skip = (page - 1) * limit;

    let query = db
      .from('users')
      .select('id, first_name, last_name, email, role, avatar_url, bio, hourly_rate', { count: 'exact' })
      .eq('role', 'tutor');

    if (search) {
      query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,bio.ilike.%${search}%`);
    }

    query = query
      .order('created_at', { ascending: false })
      .range(skip, page * limit - 1);

    const { data: tutors, count: total, error } = await query;

    if (error) throw error;

    const mapped = (tutors || []).map(t => ({
      _id: t.id,
      id: t.id,
      firstName: t.first_name,
      lastName: t.last_name,
      email: t.email,
      role: t.role,
      avatarUrl: t.avatar_url,
      bio: t.bio,
      hourlyRate: t.hourly_rate,
    }));

    return NextResponse.json({
      tutors: mapped,
      pagination: { page, limit, total: total || 0, totalPages: Math.ceil((total || 0) / limit) },
    });
  } catch (error) {
    console.error('Tutors API error:', error);
    return NextResponse.json({ message: 'Error al cargar tutores' }, { status: 500 });
  }
}
