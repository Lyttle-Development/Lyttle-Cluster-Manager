import {NextResponse} from 'next/server';
import {execAsync} from '@/app/api/command/execAsync';

const allowedCommands = [
    'reboot', // Reboot the host system
    'docker ps', // List running Docker containers
    'hostname', // Get the hostname of the host system
    'uptime', // Get system uptime
    'df -h', // Get disk space usage
    'free -h', // Get memory usage
    'cat /etc/os-release', // Get OS release information
    'cat /proc/cpuinfo', // Get CPU information
];

function getCommand(command: string): string {
    // This will run arbitrary commands on the HOST via chroot.
    // Your container must be run with: --privileged --pid=host -v /:/host
    return [
        'chroot', '/host', '/bin/bash', '-c', `"${command}"`
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
