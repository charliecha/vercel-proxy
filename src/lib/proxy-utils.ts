import { NextRequest } from 'next/server';

/**
 * Proxy utility functions for Edge Runtime
 */

/**
 * Forward headers from the original request to the target
 * Excludes host and connection-related headers
 */
export function forwardHeaders(request: NextRequest): HeadersInit {
    const headers: HeadersInit = {};
    const skipHeaders = new Set([
        'host',
        'connection',
        'x-api-key', // Remove our auth header
        'x-forwarded-for',
        'x-forwarded-proto',
        'x-forwarded-host',
    ]);

    request.headers.forEach((value, key) => {
        if (!skipHeaders.has(key.toLowerCase())) {
            headers[key] = value;
        }
    });

    return headers;
}

/**
 * Add CORS headers to the response
 */
export function addCorsHeaders(response: Response): Response {
    const newResponse = new Response(response.body, response);

    newResponse.headers.set('Access-Control-Allow-Origin', '*');
    newResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    newResponse.headers.set('Access-Control-Allow-Headers', '*');

    return newResponse;
}

/**
 * Create an error response
 */
export function errorResponse(message: string, status: number = 400): Response {
    return new Response(
        JSON.stringify({ error: message }),
        {
            status,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
        }
    );
}
