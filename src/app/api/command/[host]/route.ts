import {NextRequest, NextResponse} from 'next/server';
import {RemoteApi} from '@/utils/remote-api';

export async function GET(request: NextRequest,
                          {params}: { params: Promise<{ host: string }> }
): Promise<NextResponse> {
    const url = new URL(request.url);
    const searchParams = new URLSearchParams(url.search);
    return RemoteApi(request, await params.then(p => p.host), 'api/command' + (searchParams.toString() ? `?${searchParams.toString()}` : ''));
}