import {NextRequest, NextResponse} from 'next/server';
import {checkToken} from '@/app/api/auth/token';
import {checkGoogle} from '@/app/api/auth/google';

const NGINX_API = process.env.NGINX_API_URL || 'http://localhost:3000';
const NGINX_API_KEY = process.env.NGINX_API_KEY || '';

export async function GET(
    request: NextRequest,
    {params}: { params: { id: string } }
) {
    if (!checkToken(request) && !await checkGoogle()) {
        return NextResponse.json({error: 'Unauthorized'}, {status: 401});
    }

    try {
        const res = await fetch(`${NGINX_API}/certificates/${params.id}`, {
            headers: {
                'X-API-Key': NGINX_API_KEY,
            },
        });

        if (!res.ok) {
            throw new Error(`Failed to fetch certificate: ${res.statusText}`);
        }

        const data = await res.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error fetching certificate:', error);
        return NextResponse.json(
            {error: 'Failed to fetch certificate'},
            {status: 500}
        );
    }
}

export async function DELETE(
    request: NextRequest,
    {params}: { params: { id: string } }
) {
    if (!checkToken(request) && !await checkGoogle()) {
        return NextResponse.json({error: 'Unauthorized'}, {status: 401});
    }

    try {
        const res = await fetch(`${NGINX_API}/certificates/${params.id}`, {
            method: 'DELETE',
            headers: {
                'X-API-Key': NGINX_API_KEY,
            },
        });

        if (!res.ok) {
            throw new Error(`Failed to delete certificate: ${res.statusText}`);
        }

        return new NextResponse(null, {status: 204});
    } catch (error) {
        console.error('Error deleting certificate:', error);
        return NextResponse.json(
            {error: 'Failed to delete certificate'},
            {status: 500}
        );
    }
}

