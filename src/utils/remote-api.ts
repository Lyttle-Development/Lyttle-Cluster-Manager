import {NextRequest, NextResponse} from 'next/server';
import {checkToken} from '@/app/api/auth/token';
import {checkGoogle} from '@/app/api/auth/google';

export async function RemoteApi(request: NextRequest, host: string, path: string): Promise<NextResponse> {
    if (!checkToken(request) && !await checkGoogle()) {
        return NextResponse.json({error: 'Unauthorized'}, {status: 401});
    }

    const allowedClusterHosts = process.env.ALLOWED_CLUSTER_HOSTS;
    const allowedHosts = allowedClusterHosts ? allowedClusterHosts.split(';').map(id => id.trim()) : [];
    if (!allowedHosts.includes(host)) {
        return NextResponse.json({error: 'Forbidden'}, {status: 403});
    }

    // Send rest request with the id as host
    const response = await fetch(`http://${host}:1111/${path}`, {
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