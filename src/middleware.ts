import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const runtime = 'nodejs';

export async function middleware(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  const pathname = request.nextUrl.pathname;

  // Public paths that don't require authentication
  const publicPaths = [
    '/',
    '/explore',
    '/story',
    '/login',
    '/signup',
    '/verify-email',
    '/forgot-password',
    '/reset-password',
    '/api/auth',
  ];

  const isPublicPath = publicPaths.some((path) =>
    pathname === path || pathname.startsWith(path + '/')
  );

  // Redirect authenticated users away from auth pages
  const authPaths = ['/login', '/signup', '/verify-email', '/forgot-password', '/reset-password'];
  const isAuthPath = authPaths.some((path) => pathname === path || pathname.startsWith(path + '/'));

  if (isAuthPath && session?.user) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Protect dashboard and adventure creation routes
  const protectedPaths = ['/dashboard', '/adventures'];
  const isProtectedPath = protectedPaths.some((path) =>
    pathname === path || pathname.startsWith(path + '/')
  );

  if (isProtectedPath && !session?.user) {
    const callbackUrl = encodeURIComponent(pathname);
    return NextResponse.redirect(new URL(`/login?callbackUrl=${callbackUrl}`, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};