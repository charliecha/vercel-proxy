import { NextRequest } from 'next/server';
import { forwardHeaders, addCorsHeaders, errorResponse } from '@/lib/proxy-utils';

export const runtime = 'edge';

/**
 * OpenAI/ChatGPT proxy endpoint: /api/proxy/openai/*
 * Proxies requests to OpenAI API with streaming support
 * Example: /api/proxy/openai/v1/chat/completions
 */

const OPENAI_BASE_URL = 'https://api.openai.com';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
) {
    return handleOpenAIProxy(request, params, 'GET');
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
) {
    return handleOpenAIProxy(request, params, 'POST');
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
) {
    return handleOpenAIProxy(request, params, 'DELETE');
}

export async function OPTIONS() {
    return new Response(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': '*',
        },
    });
}

async function handleOpenAIProxy(
    request: NextRequest,
    params: Promise<{ path: string[] }>,
    method: string
): Promise<Response> {
    try {
        const { path } = await params;
        let pathString = path ? path.join('/') : '';

        // Extract configuration from headers or query params
        const baseUrl = request.headers.get('x-base-url') || request.nextUrl.searchParams.get('baseurl') || OPENAI_BASE_URL;
        const apiVersion = request.headers.get('x-api-version') || request.nextUrl.searchParams.get('api-version');
        const deployment = request.headers.get('x-deployment');

        // Automatic Azure Path Transformation
        // If it's an Azure URL and a deployment is specified, and path is OpenAI style (v1/...)
        if (baseUrl.includes('.openai.azure.com') && deployment && pathString.startsWith('v1/')) {
            pathString = `openai/deployments/${deployment}/${pathString.replace('v1/', '')}`;
        }

        // Build target URL
        const targetUrl = new URL(`${baseUrl}/${pathString}`);

        // Forward query parameters (excluding 'baseurl' and 'api-version' if they were used as config)
        request.nextUrl.searchParams.forEach((value, key) => {
            if (key !== 'baseurl' && key !== 'api-version') {
                targetUrl.searchParams.set(key, value);
            }
        });

        // Add api-version back if it was found in headers/params
        if (apiVersion) {
            targetUrl.searchParams.set('api-version', apiVersion);
        }

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

        // For streaming responses (e.g., ChatGPT streaming), pass through as-is
        const proxiedResponse = new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers: response.headers,
        });

        return addCorsHeaders(proxiedResponse);
    } catch (error) {
        console.error('OpenAI proxy error:', error);
        return errorResponse(
            error instanceof Error ? error.message : 'Internal proxy error',
            500
        );
    }
}
