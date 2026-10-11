import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';


export async function proxy(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    const pathname = request.nextUrl.pathname;

    // Redirect authenticated users away from auth pages (/login, /signup) to /dashboard
    const authPaths = ['/login', '/signup'];
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
  } catch (error) {
    console.error('Proxy auth error:', error);
    // On error, allow the request to continue (fail open for proxy)
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};
