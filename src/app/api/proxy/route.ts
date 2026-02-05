import { NextRequest } from 'next/server';
import { forwardHeaders, addCorsHeaders, errorResponse } from '@/lib/proxy-utils';

export const runtime = 'edge';

/**
 * General proxy endpoint: /api/proxy?url=https://example.com
 * Supports GET, POST, PUT, DELETE, PATCH methods
 * Streams responses for efficient data transfer
 */
export async function GET(request: NextRequest) {
    return handleProxyRequest(request);
}

export async function POST(request: NextRequest) {
    return handleProxyRequest(request);
}

export async function PUT(request: NextRequest) {
    return handleProxyRequest(request);
}

export async function DELETE(request: NextRequest) {
    return handleProxyRequest(request);
}

export async function PATCH(request: NextRequest) {
    return handleProxyRequest(request);
}

export async function OPTIONS(request: NextRequest) {
    return new Response(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
            'Access-Control-Allow-Headers': '*',
        },
    });
}

async function handleProxyRequest(request: NextRequest): Promise<Response> {
    try {
        // Get target URL from query parameter
        const targetUrl = request.nextUrl.searchParams.get('url');

        if (!targetUrl) {
            return errorResponse('Missing "url" query parameter', 400);
        }

        // Validate URL
        let parsedUrl: URL;
        try {
            parsedUrl = new URL(targetUrl);
        } catch (e) {
            return errorResponse('Invalid URL provided', 400);
        }

        // Forward headers
        const headers = forwardHeaders(request);

        // Prepare fetch options
        const fetchOptions: RequestInit = {
            method: request.method,
            headers,
        };

        // Forward body for POST/PUT/PATCH requests
        if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
            // Clone the request to read the body
            const body = await request.arrayBuffer();
            if (body.byteLength > 0) {
                fetchOptions.body = body;
            }
        }

        // Make the proxied request
        const response = await fetch(parsedUrl.toString(), fetchOptions);

        // Create a new response with CORS headers
        const proxiedResponse = new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers: response.headers,
        });

        return addCorsHeaders(proxiedResponse);
    } catch (error) {
        console.error('Proxy error:', error);
        return errorResponse(
            error instanceof Error ? error.message : 'Internal proxy error',
            500
        );
    }
}
