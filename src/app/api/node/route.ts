import {NextRequest, NextResponse} from 'next/server';
import {execAsync} from '@/app/api/command/execAsync';
import {getCommand} from '@/app/api/command/getCommand';
import {IpAddrEntries, parseIpAddr} from '@/app/api/node/parseIpAddr';
import {
    ContainerEntries,
    parseContainers
} from '@/app/api/node/parseContainers';
import {CpuEntries, parseCpu} from '@/app/api/node/parseCpu';
import {DiskEntries, parseDisk} from '@/app/api/node/parseDisk';
import {MemoryEntries, parseMemory} from '@/app/api/node/parseMemory';
import {parseUptime, UptimeEntry} from '@/app/api/node/parseUptime';
import {OsReleaseEntry, parseOsRelease} from '@/app/api/node/parseOsRelease';
import {checkToken} from '@/app/api/auth/token';
import {checkGoogle} from '@/app/api/auth/google';

export interface NodeResponse {
    hostname: string;
    os: OsReleaseEntry;
    uptime: UptimeEntry;
    containers: ContainerEntries;
    memory: MemoryEntries;
    disk: DiskEntries;
    cpu: CpuEntries;
    ip: IpAddrEntries;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
    if (!checkToken(request) && !await checkGoogle()) {
        return NextResponse.json({error: 'Unauthorized'}, {status: 401});
    }

    const hostname: string = await execAsync(getCommand('cat /etc/hostname'));
    const containers: string = await execAsync(getCommand('docker ps --format "{{.Names}}"'));
    const uptime: string = await execAsync(getCommand('uptime'));
    const memory: string = await execAsync(getCommand('free -h'));
    const disk: string = await execAsync(getCommand('df -h'));
    const cpu: string = await execAsync(getCommand('cat /proc/cpuinfo'));
    const os: string = await execAsync(getCommand('cat /etc/os-release'));
    const ipAddr: string = await execAsync(getCommand('ip addr'));

    const response = {
        hostname: hostname.trim(),
        os: parseOsRelease(os.trim()),
        uptime: parseUptime(uptime.trim()),
        containers: parseContainers(containers),
        memory: parseMemory(memory.trim()),
        disk: parseDisk(disk.trim()),
        cpu: parseCpu(cpu.trim()),
        ip: parseIpAddr(ipAddr.trim()),
    };

    return NextResponse.json(response);
}