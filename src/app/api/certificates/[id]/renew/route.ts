import {NextRequest, NextResponse} from 'next/server';
import {checkToken} from '@/app/api/auth/token';
import {checkGoogle} from '@/app/api/auth/google';

const NGINX_API = process.env.NGINX_API_URL || 'http://localhost:3000';
const NGINX_API_KEY = process.env.NGINX_API_KEY || '';

export async function POST(
    request: NextRequest,
    {params}: { params: { id: string } }
) {
    if (!checkToken(request) && !await checkGoogle()) {
        return NextResponse.json({error: 'Unauthorized'}, {status: 401});
    }

    try {
        const res = await fetch(`${NGINX_API}/certificates/renew/${params.id}`, {
            method: 'POST',
            headers: {
                'X-API-Key': NGINX_API_KEY,
            },
        });

        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.message || 'Failed to renew certificate');
        }

        const data = await res.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error renewing certificate:', error);
        return NextResponse.json(
            {error: error instanceof Error ? error.message : 'Failed to renew certificate'},
            {status: 500}
        );
    }
}

