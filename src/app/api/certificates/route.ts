import {NextRequest, NextResponse} from 'next/server';
import {checkToken} from '@/app/api/auth/token';
import {checkGoogle} from '@/app/api/auth/google';

// Proxy to LyttleNGINX certificate API
const NGINX_API = process.env.NGINX_API_URL || 'http://localhost:3000';
const NGINX_API_KEY = process.env.NGINX_API_KEY || '';

export async function GET(request: NextRequest) {
    if (!checkToken(request) && !await checkGoogle()) {
        return NextResponse.json({error: 'Unauthorized'}, {status: 401});
    }

    try {
        const res = await fetch(`${NGINX_API}/certificates`, {
            headers: {
                'X-API-Key': NGINX_API_KEY,
            },
        });

        if (!res.ok) {
            throw new Error(`Failed to fetch certificates: ${res.statusText}`);
        }

        const data = await res.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error fetching certificates:', error);
        return NextResponse.json(
            {error: 'Failed to fetch certificates'},
            {status: 500}
        );
    }
}

