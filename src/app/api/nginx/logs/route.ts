import {NextRequest, NextResponse} from 'next/server';
import {checkToken} from '@/app/api/auth/token';
import {checkGoogle} from '@/app/api/auth/google';

// Local proxy to upstream logs endpoint to avoid CORS and keep credentials server-side.
const UPSTREAM_BASE =
    process.env.SERVERS_API_BASE?.replace(/\/+$/, '') ?? 'http://__servers__.lyttle.dev:3003';

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

        const upstream = await fetch(`${UPSTREAM_BASE}/logs?count=${count}`, {cache: 'no-store'});
        const text = await upstream.text();

        return new NextResponse(text, {
            status: upstream.status,
            headers: {
                'content-type': 'text/plain; charset=utf-8',
                'cache-control': 'no-store',
            },
        });
    } catch (err: any) {
        return NextResponse.json(
            {
                error: 'Failed to fetch logs from upstream',
                details: String(err?.message ?? err)
            },
            {status: 502}
        );
    }
}