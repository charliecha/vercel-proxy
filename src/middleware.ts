import { NextRequest, NextResponse } from 'next/server';

/**
 * Authentication middleware for API routes
 * Validates X-API-Key header against the PROXY_API_KEY environment variable
 */
export function middleware(request: NextRequest) {
  // Only apply to /api/proxy routes
  if (!request.nextUrl.pathname.startsWith('/api/proxy')) {
    return NextResponse.next();
  }

  const apiKey = request.headers.get('X-API-Key');
  const expectedApiKey = process.env.PROXY_API_KEY;

  // If no API key is configured, allow the request (development mode)
  if (!expectedApiKey) {
    console.warn('⚠️  PROXY_API_KEY not set. Authentication disabled.');
    return NextResponse.next();
  }

  // Validate API key
  if (!apiKey || apiKey !== expectedApiKey) {
    return NextResponse.json(
      {
        error: 'Unauthorized',
        message: 'Invalid or missing X-API-Key header',
      },
      { status: 401 }
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/api/proxy/:path*',
};
