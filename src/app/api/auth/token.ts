import {NextRequest} from 'next/server';

export function checkToken(request: NextRequest): boolean {
    // Extract the token from the request headers or query parameters
    const url = new URL(request.url);
    const token = request.headers.get('Authorization') || url.searchParams.get('token');

    // If no token is provided, return false
    if (!token) {
        return false;
    }
    // Get the token from environment variables
    const apiToken = process.env.API_TOKEN;

    // Check if the token matches the API token
    return token === apiToken || token === `Bearer ${apiToken}`;
}