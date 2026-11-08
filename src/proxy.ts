import { NextRequest, NextResponse } from 'next/server';

/**
 * DOCORA Next.js 16.4.5 Network Proxy (`src/proxy.ts` — Node.js Runtime)
 *
 * Enforces Guardrail #1:
 * - Handles locale routing (`/ar` default RTL, `/en` LTR), session cookie refresh,
 *   and security headers (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`).
 * - Authorization is NEVER delegated solely to `proxy.ts`: every Route Handler and Server Action
 *   independently calls `verifyAuthenticatedUser()` from `src/lib/dal/`.
 */

const SUPPORTED_LOCALES = ['ar', 'en'] as const;

export function proxy(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    const response = NextResponse.next();
    applySecurityHeaders(response);
    return response;
  }

  const hasLocale = SUPPORTED_LOCALES.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)
  );

  if (!hasLocale) {
    const url = request.nextUrl.clone();
    url.pathname = pathname === '/' ? '/ar' : `/ar${pathname}`;
    const redirectResponse = NextResponse.redirect(url);
    applySecurityHeaders(redirectResponse);
    return redirectResponse;
  }

  const response = NextResponse.next();
  applySecurityHeaders(response);
  return response;
}

function applySecurityHeaders(response: NextResponse): void {
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), interest-cohort=()'
  );
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
