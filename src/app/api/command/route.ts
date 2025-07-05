import {NextResponse} from 'next/server';
import {execAsync} from '@/app/api/command/execAsync';

const allowedCommands = [
    'reboot',
    'docker ps',
    'ls',
    'df -h',
];

function getCommand(command: string): string {
    // This will run arbitrary commands on the HOST via chroot.
    // Your container must be run with: --privileged --pid=host -v /:/host
    return [
        'chroot', '/host', 'bash', '-c', `"${command}"`
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
