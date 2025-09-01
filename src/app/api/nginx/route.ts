import {NextRequest, NextResponse} from 'next/server';
import {PrismaClient} from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
    const entries = await prisma.proxyEntry.findMany();
    return NextResponse.json(entries);
}

export async function POST(request: NextRequest) {
    const data = await request.json();
    if (data.id) {
        const entry = await prisma.proxyEntry.update({
            where: {id: Number(data.id)},
            data: {
                proxy_pass_host: data.proxy_pass_host,
                domains: data.domains,
                nginx_custom_code: data.nginx_custom_code,
                type: data.type,
                ssl: data.ssl,
            },
        });
        return NextResponse.json(entry);
    }
    const entry = await prisma.proxyEntry.create({
        data: {
            proxy_pass_host: data.proxy_pass_host,
            domains: data.domains,
            nginx_custom_code: data.nginx_custom_code,
            type: data.type,
            ssl: data.ssl,
        },
    });
    return NextResponse.json(entry, {status: 201});
}

export async function DELETE(request: NextRequest) {
    const data = await request.json();
    if (!data.id) {
        return NextResponse.json({error: 'Missing id'}, {status: 400});
    }
    await prisma.proxyEntry.delete({where: {id: Number(data.id)}});
    return NextResponse.json({ok: true});
}