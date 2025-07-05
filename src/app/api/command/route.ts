import {NextResponse} from 'next/server';
import {execAsync} from '@/app/api/command/execAsync';

const allowedCommands = [
    'reboot',
    'docker ps',
];

function getCommand(command: string): string {
    return [
        'docker', 'run', '--rm',
        '--privileged',
        '--pid=host',
        '-v', '/var/run/docker.sock:/var/run/docker.sock',
        'debian:12',
        'bash', '-c', `"${command}"`
    ].join(' ');
}

export async function GET(
    request: Request,
): Promise<NextResponse> {
    const url = request.url;
    const urlObj = new URL(url);
    const command = urlObj.searchParams.get('command');

    if (!command) {
        return NextResponse.json({error: 'No command provided.'}, {status: 400});
    }

    if (!allowedCommands.includes(command)) {
        return NextResponse.json({error: 'Command not allowed.'}, {status: 403});
    }

    try {
        const output = await execAsync(getCommand(command));
        return NextResponse.json({output: output || 'Host is rebooting.'});
    } catch (err) {
        return NextResponse.json({error: String(err)});
    }
}
