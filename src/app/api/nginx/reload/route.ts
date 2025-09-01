import {NextRequest, NextResponse} from 'next/server';
import {checkToken} from '@/app/api/auth/token';
import {checkGoogle} from '@/app/api/auth/google';

// Local proxy to upstream reload endpoint to avoid CORS and keep credentials server-side.
const UPSTREAM_BASE =
    process.env.SERVERS_API_BASE?.replace(/\/+$/, '') ?? 'http://__servers__.lyttle.dev:3003';

async function forwardReload(method: 'GET' | 'POST') {
    try {
        const res = await fetch(`${UPSTREAM_BASE}/reload`, {
            method,
            cache: 'no-store'
        });
        const text = await res.text();
        return new NextResponse(text, {
            status: res.status,
            headers: {
                'content-type': 'text/plain; charset=utf-8',
                'cache-control': 'no-store',
            },
        });
    } catch (err: any) {
        return NextResponse.json(
            {
                error: 'Upstream reload request failed',
                details: String(err?.message ?? err)
            },
            {status: 502}
        );
    }
}

// Support POST (preferred) and GET (fallback)
export async function POST(request: NextRequest) {
    if (!checkToken(request) && !await checkGoogle()) {
        return NextResponse.json({error: 'Unauthorized'}, {status: 401});
    }

    return forwardReload('POST');
}

export async function GET(request: NextRequest) {
    if (!checkToken(request) && !await checkGoogle()) {
        return NextResponse.json({error: 'Unauthorized'}, {status: 401});
    }

    return forwardReload('GET');
}