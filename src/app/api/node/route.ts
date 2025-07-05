import {NextResponse} from 'next/server';
import {execAsync} from '@/app/api/command/execAsync';
import {getCommand} from '@/app/api/command/getCommand';


export async function GET(): Promise<NextResponse> {
    const hostname: string = await execAsync(getCommand('cat /etc/hostname'));
    const containers: string[] = (await execAsync(getCommand('docker ps --format "{{.Names}}"'))).split('\n').filter(Boolean);
    const uptime: string = await execAsync(getCommand('uptime'));
    const memory: string = await execAsync(getCommand('free -h'));
    const disk: string = await execAsync(getCommand('df -h'));
    const cpu: string = await execAsync(getCommand('cat /proc/cpuinfo'));
    const os: string = await execAsync(getCommand('cat /etc/os-release'));

    const response = {
        hostname: hostname.trim(),
        containers: containers.map(name => name.trim()),
        uptime: uptime.trim(),
        memory: memory.trim(),
        disk: disk.trim(),
        cpu: cpu.trim(),
        os: os.trim(),
    };

    return NextResponse.json(response);
}
