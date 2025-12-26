import {NextRequest, NextResponse} from 'next/server';
import {checkToken} from '@/app/api/auth/token';
import {checkGoogle} from '@/app/api/auth/google';
import {PrismaPg} from '@prisma/adapter-pg';
import {PrismaClient} from '../../../../generated/prisma/client';

const adapter = new PrismaPg({connectionString: process.env.DATABASE_URL});
const prisma = new PrismaClient({adapter});

// LyttleNGINX API configuration
const NGINX_API = process.env.NGINX_API_URL || 'http://localhost:3000';
const NGINX_API_KEY = process.env.NGINX_API_KEY || '';

export async function GET(request: NextRequest) {
    if (!checkToken(request) && !await checkGoogle()) {
        return NextResponse.json({error: 'Unauthorized'}, {status: 401});
    }

    const entries = await prisma.proxyEntry.findMany();
    return NextResponse.json(entries);
}

export async function POST(request: NextRequest) {
    if (!checkToken(request) && !await checkGoogle()) {
        return NextResponse.json({error: 'Unauthorized'}, {status: 401});
    }

    const data = await request.json();

    let entry;
    if (data.id) {
        entry = await prisma.proxyEntry.update({
            where: {id: Number(data.id)},
            data: {
                proxy_pass_host: data.proxy_pass_host,
                domains: data.domains,
                nginx_custom_code: data.nginx_custom_code,
                type: data.type,
                ssl: data.ssl,
            },
        });
    } else {
        entry = await prisma.proxyEntry.create({
            data: {
                proxy_pass_host: data.proxy_pass_host,
                domains: data.domains,
                nginx_custom_code: data.nginx_custom_code,
                type: data.type,
                ssl: data.ssl,
            },
        });
    }

    // Trigger reload on all cluster nodes
    try {
        await fetch(`${NGINX_API}/cluster/reload?broadcast=true`, {
            method: 'POST',
            headers: {
                'X-API-Key': NGINX_API_KEY,
            },
        });
    } catch (error) {
        console.error('Failed to trigger cluster reload:', error);
    }

    return NextResponse.json(entry, {status: data.id ? 200 : 201});
}

export async function DELETE(request: NextRequest) {
    if (!checkToken(request) && !await checkGoogle()) {
        return NextResponse.json({error: 'Unauthorized'}, {status: 401});
    }

    const data = await request.json();
    if (!data.id) {
        return NextResponse.json({error: 'Missing id'}, {status: 400});
    }

    await prisma.proxyEntry.delete({where: {id: Number(data.id)}});

    // Trigger reload on all cluster nodes
    try {
        await fetch(`${NGINX_API}/cluster/reload?broadcast=true`, {
            method: 'POST',
            headers: {
                'X-API-Key': NGINX_API_KEY,
            },
        });
    } catch (error) {
        console.error('Failed to trigger cluster reload:', error);
    }

    return NextResponse.json({ok: true});
}

