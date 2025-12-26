import {NextRequest, NextResponse} from 'next/server';
import {checkToken} from '@/app/api/auth/token';
import {checkGoogle} from '@/app/api/auth/google';

// LyttleNGINX cluster API configuration
const NGINX_API = process.env.NGINX_API_URL || 'http://localhost:3000';
const NGINX_API_KEY = process.env.NGINX_API_KEY || '';

async function forwardReload(method: 'GET' | 'POST') {
    try {
        // Trigger reload with broadcast to all cluster nodes
        const res = await fetch(`${NGINX_API}/cluster/reload?broadcast=true`, {
            method: 'POST',
            headers: {
                'X-API-Key': NGINX_API_KEY,
            },
            cache: 'no-store'
        });
        const data = await res.json();
        return NextResponse.json(data, {
            status: res.status,
            headers: {
                'cache-control': 'no-store',
            },
        });
    } catch (err: any) {
        return NextResponse.json(
            {
                error: 'Cluster reload request failed',
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

