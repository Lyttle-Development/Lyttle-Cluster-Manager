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
export function parseIpAddr(ipAddr: string) {
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