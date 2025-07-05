import {NextResponse} from 'next/server';
import {execAsync} from '@/app/api/command/execAsync';
import {getCommand} from '@/app/api/command/getCommand';

// Helper to parse /etc/os-release into an object
function parseOsRelease(os: string) {
    const result: Record<string, string> = {};
    os.split('\n').forEach(line => {
        const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
        if (match) {
            const key = match[1];
            let value = match[2];
            value = value.replace(/^"|"$/g, ''); // remove quotes
            result[key] = value;
        }
    });
    return {
        prettyName: result.PRETTY_NAME,
        name: result.NAME,
        versionId: result.VERSION_ID,
        version: result.VERSION,
        versionCodename: result.VERSION_CODENAME,
        id: result.ID,
        homeUrl: result.HOME_URL,
        supportUrl: result.SUPPORT_URL,
        bugReportUrl: result.BUG_REPORT_URL,
    };
}

// Helper to parse uptime
function parseUptime(uptime: string) {
    // Example: "15:06:27 up 57 min,  0 user,  load average: 0.23, 0.33, 0.21"
    const match = uptime.match(/^(\d{2}:\d{2}:\d{2}) up (.+),\s+(\d+) user[s]?,\s+load average: ([\d.]+), ([\d.]+), ([\d.]+)/);
    if (match) {
        return {
            raw: uptime,
            currentTime: match[1],
            up: match[2],
            users: Number(match[3]),
            loadAverage: [Number(match[4]), Number(match[5]), Number(match[6])],
        };
    }
    return {raw: uptime};
}

// Helper to parse `free -h` memory output
function parseMemory(mem: string) {
    // expect header on first line, Mem: on second, Swap: on third, tab/space separated
    const lines = mem.trim().split('\n');
    if (lines.length < 3) return {raw: mem};
    const memValues = lines[1].trim().split(/\s+/);
    const swapValues = lines[2].trim().split(/\s+/);
    return {
        raw: mem,
        mem: {
            total: memValues[1],
            used: memValues[2],
            free: memValues[3],
            shared: memValues[4],
            buffCache: memValues[5],
            available: memValues[6],
        },
        swap: {
            total: swapValues[1],
            used: swapValues[2],
            free: swapValues[3],
        },
    };
}

// Helper to parse `df -h` disk output
function parseDisk(disk: string) {
    const lines = disk.trim().split('\n');
    if (lines.length < 2) return [];
    return lines.slice(1).map(line => {
        const cols = line.trim().split(/\s+/);
        // Try to match header, but fallback for overlay/tabs:
        return {
            filesystem: cols[0],
            size: cols[1],
            used: cols[2],
            avail: cols[3],
            usePct: cols[4],
            mountedOn: cols[5],
        };
    });
}

interface CpuEntry {
    processor: number;
    vendorId: string;
    cpuFamily: number;
    model: number;
    modelName: string;
    stepping: number;
    microcode: string;
    mhz: number;
    cacheSize: string;
    cores?: number; // optional, not always present
}

// Helper to parse /proc/cpuinfo into array of CPUs (only main fields)
function parseCpu(cpu: string) {
    const cpus = cpu.split('\n\n').filter(Boolean);
    return cpus.map(block => {
        const lines = block.split('\n');
        const cpuEntry: CpuEntry = {
            processor: -1, // default to -1 if not found
            vendorId: '',
            cpuFamily: -1,
            model: -1,
            modelName: '',
            stepping: -1,
            microcode: '',
            mhz: 0,
            cacheSize: '',
            cores: undefined, // optional
        };
        lines.forEach(line => {
            const [key, ...rest] = line.split(':');
            if (!key || rest.length === 0) return;
            const value = rest.join(':').trim();
            switch (key.trim()) {
                case 'processor':
                    cpuEntry.processor = Number(value);
                    break;
                case 'vendor_id':
                    cpuEntry.vendorId = value;
                    break;
                case 'cpu family':
                    cpuEntry.cpuFamily = Number(value);
                    break;
                case 'model':
                    cpuEntry.model = Number(value);
                    break;
                case 'model name':
                    cpuEntry.modelName = value;
                    break;
                case 'stepping':
                    cpuEntry.stepping = Number(value);
                    break;
                case 'microcode':
                    cpuEntry.microcode = value;
                    break;
                case 'cpu MHz':
                    cpuEntry.mhz = Number(value);
                    break;
                case 'cache size':
                    cpuEntry.cacheSize = value;
                    break;
                case 'cpu cores':
                    cpuEntry.cores = Number(value);
                    break;
            }
        });
        return cpuEntry;
    }).filter(c => Object.keys(c).length > 0);
}

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
        os: parseOsRelease(os.trim()),
        uptime: parseUptime(uptime.trim()),
        containers: containers.map(name => name.trim()),
        memory: parseMemory(memory.trim()),
        disk: parseDisk(disk.trim()),
        cpu: parseCpu(cpu.trim()),
    };

    return NextResponse.json(response);
}