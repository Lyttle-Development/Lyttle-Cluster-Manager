import {NextRequest, NextResponse} from 'next/server';
import {RemoteApi} from '@/utils/remote-api';

export async function GET(request: NextRequest): Promise<NextResponse> {
    const hostsEnv = process.env.ALLOWED_CLUSTER_HOSTS
        ? process.env.ALLOWED_CLUSTER_HOSTS.split(';')
        : [];

    const nodes = await Promise.all(hostsEnv.map(async host => {
        try {
            const response = await RemoteApi(request, host, 'api/node');
            if (!response.ok) {
                throw new Error(`Failed to fetch data from ${host}`);
            }
            const data = await response.json();
            if (!data || !data.hostname) {
                throw new Error(`Invalid data received from ${host}`);
            }
            return data;
        } catch (error: any) {
            console.error(`Error fetching data from ${host}:`, error);
            return {
                hostname: host,
                error: error.message || 'Unknown error',
            };
        }
    }));
    return NextResponse.json(nodes, {
        status: 200,
        headers: {
            'Content-Type': 'application/json',
        },
    });
}