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

interface Rule {
    to: string;
    action: string;
    from: string;
    comment?: string;
}

// Helper to parse "ufw status verbose"
function parseUfwStatus(ufw: string) {
    const lines = ufw.trim().split('\n');
    const details: Record<string, string> = {};
    const rules: Rule[] = [];
    let rulesStarted = false;
    let headerIndexes: number[] = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        // Parse headers for rules table
        if (!rulesStarted && line.startsWith('To')) {
            // Find start indexes for columns
            headerIndexes = [
                line.indexOf('To'),
                line.indexOf('Action'),
                line.indexOf('From')
            ];
            rulesStarted = true;
            continue;
        }
        // After header, parse rules
        if (rulesStarted) {
            if (line.trim() === '') continue;
            const rule: Rule = {
                to: line.substring(headerIndexes[0], headerIndexes[1]).trim(),
                action: line.substring(headerIndexes[1], headerIndexes[2]).trim(),
                from: line.substring(headerIndexes[2], line.indexOf('#') !== -1 ? line.indexOf('#') : undefined).trim(),
                comment: line.indexOf('#') !== -1 ? line.substring(line.indexOf('#') + 1).trim() : undefined,
            };
            rules.push(rule);
        } else {
            // Parse status fields before rules
            const match = line.match(/^([A-Za-z ]+):\s+(.*)$/);
            if (match) {
                details[match[1].trim().toLowerCase().replace(/ /g, '_')] = match[2].trim();
            }
        }
    }
    return {
        raw: ufw,
        status: details.status,
        logging: details.logging,
        default: details.default,
        newProfiles: details.new_profiles,
        rules
    };
}

// Helper to parse containers output
function parseContainers(containers: string) {
    // containers is a string with names separated by newlines
    return containers
        .split('\n')
        .map(name => name.trim())
        .filter(name => name.length > 0)
        .map(name => ({name}));
}

interface IpInterfaces {
    index: number;
    name: string;
    flags: string[];
    mtu: number;
    qdisc: string;
    state: string;
    group: string | null;
    addresses: IpInterfaceAddress[];
    ether: string | null;
    altname: string | null;
}

interface IpInterfaceAddress {
    family: string;
    address: string;
    brd?: string;
    scope?: string;
    label?: string;
}

// Helper to parse `ip addr` output
function parseIpAddr(ipAddr: string) {
    // This parser is basic, parses interfaces and their properties.
    const interfaces: IpInterfaces[] = [];
    const lines = ipAddr.trim().split('\n');
    let current: IpInterfaces | null = null;

    const ifaceRegex = /^(\d+): ([^:]+): <([^>]*)> mtu (\d+) qdisc ([^ ]+) state ([^ ]+)(?: group ([^ ]+))?/;
    for (const line of lines) {
        const ifaceMatch = line.match(ifaceRegex);
        if (ifaceMatch) {
            if (current) interfaces.push(current);
            current = {
                index: Number(ifaceMatch[1]),
                name: ifaceMatch[2],
                flags: ifaceMatch[3].split(','),
                mtu: Number(ifaceMatch[4]),
                qdisc: ifaceMatch[5],
                state: ifaceMatch[6],
                group: ifaceMatch[7] || null,
                addresses: [],
                ether: null,
                altname: null,
            };
            continue;
        }
        if (!current) continue;
        // link/...
        const linkMatch = line.trim().match(/^link\/(\S+)\s+([0-9a-f:]+)(?: brd ([0-9a-f:]+))?/);
        if (linkMatch) {
            current.ether = linkMatch[2];
            continue;
        }
        // altname
        const altnameMatch = line.trim().match(/^altname (\S+)/);
        if (altnameMatch) {
            current.altname = altnameMatch[1];
            continue;
        }
        // inet/inet6
        const inetMatch = line.trim().match(/^(inet6?) ([^ ]+)(?: brd ([^ ]+))?(?: scope ([^ ]+)(?: ([^ ]+))?)?/);
        if (inetMatch) {
            const address: IpInterfaceAddress = {
                family: inetMatch[1],
                address: inetMatch[2],
                brd: inetMatch[3] || undefined,
                scope: inetMatch[4] || undefined,
                label: inetMatch[5] || undefined,
            };
            current.addresses.push(address);
        }
    }
    if (current) interfaces.push(current);
    return interfaces;
}

export async function GET(): Promise<NextResponse> {
    const hostname: string = await execAsync(getCommand('cat /etc/hostname'));
    const containers: string = await execAsync(getCommand('docker ps --format "{{.Names}}"'));
    const uptime: string = await execAsync(getCommand('uptime'));
    const memory: string = await execAsync(getCommand('free -h'));
    const disk: string = await execAsync(getCommand('df -h'));
    const cpu: string = await execAsync(getCommand('cat /proc/cpuinfo'));
    const os: string = await execAsync(getCommand('cat /etc/os-release'));
    const ufw: string = await execAsync(getCommand('ufw status verbose'));
    const ipAddr: string = await execAsync(getCommand('ip addr'));

    const response = {
        hostname: hostname.trim(),
        os: parseOsRelease(os.trim()),
        uptime: parseUptime(uptime.trim()),
        containers: parseContainers(containers),
        memory: parseMemory(memory.trim()),
        disk: parseDisk(disk.trim()),
        cpu: parseCpu(cpu.trim()),
        ufw: parseUfwStatus(ufw.trim()),
        ip: parseIpAddr(ipAddr.trim()),
    };

    return NextResponse.json(response);
}