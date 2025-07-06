import {NextRequest, NextResponse} from 'next/server';
import {RemoteApi} from '@/utils/remote-api';

export async function GET(request: NextRequest,
                          {params}: { params: Promise<{ host: string }> }
): Promise<NextResponse> {
    return RemoteApi(request, await params.then(p => p.host), 'api/node');
}