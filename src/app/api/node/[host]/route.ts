import {NextRequest, NextResponse} from 'next/server';
import {checkToken} from '@/app/api/auth/token';
import {checkGoogle} from '@/app/api/auth/google';

export async function GET(request: NextRequest,
                          {params}: { params: Promise<{ host: string }> }
): Promise<NextResponse> {
    if (!checkToken(request) && !await checkGoogle()) {
        return NextResponse.json({error: 'Unauthorized'}, {status: 401});
    }

    const {host} = await params;
    const allowedIdsEnv = process.env.ALLOWED_CLUSTER_HOSTS;
    const allowedIds = allowedIdsEnv ? allowedIdsEnv.split(';').map(id => id.trim()) : [];
    if (!allowedIds.includes(host)) {
        return NextResponse.json({error: 'Forbidden'}, {status: 403});
    }

    // Send rest request with the id as host
    const response = await fetch(`http://${host}:1111/api/node`, {
            headers: {
                'Authorization': process.env.API_TOKEN || '',
            }
        }
    );

    if (!response.ok) {
        return NextResponse.json({error: 'Failed to fetch node data'}, {status: response.status});
    }
    
    const data = await response.json();
    return NextResponse.json(data);
}