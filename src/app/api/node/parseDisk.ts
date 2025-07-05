// Helper to parse `df -h` disk output
export function parseDisk(disk: string) {
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