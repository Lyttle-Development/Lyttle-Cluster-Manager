import {NextRequest, NextResponse} from 'next/server';
import {checkToken} from '@/app/api/auth/token';
import {checkGoogle} from '@/app/api/auth/google';

// LyttleNGINX cluster API configuration
const NGINX_API = process.env.NGINX_API_URL || 'http://localhost:3000';
const NGINX_API_KEY = process.env.NGINX_API_KEY || '';

export async function GET(request: NextRequest) {
    if (!checkToken(request) && !await checkGoogle()) {
        return NextResponse.json({error: 'Unauthorized'}, {status: 401});
    }

    try {
        const url = new URL(request.url);
        const raw = url.searchParams.get('count') ?? '100';
        let count = Number(raw);
        if (!Number.isFinite(count)) count = 100;
        // Guardrails
        count = Math.max(1, Math.min(2000, Math.floor(count)));

        const upstream = await fetch(`${NGINX_API}/logs?count=${count}`, {
            headers: {
                'X-API-Key': NGINX_API_KEY,
            },
            cache: 'no-store'
        });
        const data = await upstream.json();

        return NextResponse.json(data, {
            status: upstream.status,
            headers: {
                'cache-control': 'no-store',
            },
        });
    } catch (err: any) {
        return NextResponse.json(
            {
                error: 'Failed to fetch logs from cluster',
                details: String(err?.message ?? err)
            },
            {status: 502}
        );
    }
}

