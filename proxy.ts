import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/jwt';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('auth_token')?.value;

  const protectedRoutes = ['/dashboard', '/courses', '/bookings'];
  const adminRoutes = ['/admin'];
  const tutorRoutes = ['/tutor'];

  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));
  const isAdminRoute = adminRoutes.some((route) => pathname.startsWith(route));
  const isTutorRoute = tutorRoutes.some((route) => pathname.startsWith(route));

  if ((isProtectedRoute || isAdminRoute || isTutorRoute) && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (token && (isAdminRoute || isTutorRoute)) {
    try {
      const payload = await verifyToken(token);
      if (!payload) {
        return NextResponse.redirect(new URL('/login', request.url));
      }

      if (isAdminRoute && payload.role !== 'admin') {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }

      if (isTutorRoute && payload.role !== 'tutor' && payload.role !== 'admin') {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    } catch {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
