import { NextRequest } from 'next/server';
import { forwardHeaders, addCorsHeaders, errorResponse } from '@/lib/proxy-utils';

export const runtime = 'edge';

/**
 * Google proxy endpoint: /api/proxy/google/*
 * Proxies requests to Google services (search, APIs, etc.)
 * Example: /api/proxy/google/search?q=hello
 */

const GOOGLE_BASE_URL = 'https://www.google.com';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
) {
    return handleGoogleProxy(request, params, 'GET');
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
) {
    return handleGoogleProxy(request, params, 'POST');
}

export async function OPTIONS() {
    return new Response(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': '*',
        },
    });
}

async function handleGoogleProxy(
    request: NextRequest,
    params: Promise<{ path: string[] }>,
    method: string
): Promise<Response> {
    try {
        const { path } = await params;
        const pathString = path ? path.join('/') : '';

        // Build target URL
        const targetUrl = new URL(`${GOOGLE_BASE_URL}/${pathString}`);

        // Forward query parameters
        request.nextUrl.searchParams.forEach((value, key) => {
            targetUrl.searchParams.set(key, value);
        });

        // Forward headers
        const headers = forwardHeaders(request);

        // Prepare fetch options
        const fetchOptions: RequestInit = {
            method,
            headers,
        };

        // Forward body for POST requests
        if (method === 'POST') {
            const body = await request.arrayBuffer();
            if (body.byteLength > 0) {
                fetchOptions.body = body;
            }
        }

        // Make the proxied request
        const response = await fetch(targetUrl.toString(), fetchOptions);

        // Create a new response with CORS headers
        const proxiedResponse = new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers: response.headers,
        });

        return addCorsHeaders(proxiedResponse);
    } catch (error) {
        console.error('Google proxy error:', error);
        return errorResponse(
            error instanceof Error ? error.message : 'Internal proxy error',
            500
        );
    }
}
