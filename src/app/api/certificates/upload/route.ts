import {NextRequest, NextResponse} from 'next/server';
import {checkToken} from '@/app/api/auth/token';
import {checkGoogle} from '@/app/api/auth/google';

const NGINX_API = process.env.NGINX_API_URL || 'http://localhost:3000';
const NGINX_API_KEY = process.env.NGINX_API_KEY || '';

export async function POST(request: NextRequest) {
    if (!checkToken(request) && !await checkGoogle()) {
        return NextResponse.json({error: 'Unauthorized'}, {status: 401});
    }

    try {
        const body = await request.json();
        const res = await fetch(`${NGINX_API}/certificates/upload`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': NGINX_API_KEY,
            },
            body: JSON.stringify(body),
        });

        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.message || 'Failed to upload certificate');
        }

        const data = await res.json();
        return NextResponse.json(data, {status: 201});
    } catch (error) {
        console.error('Error uploading certificate:', error);
        return NextResponse.json(
            {error: error instanceof Error ? error.message : 'Failed to upload certificate'},
            {status: 500}
        );
    }
}

