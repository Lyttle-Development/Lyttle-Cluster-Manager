// Helper to parse `free -h` memory output
export function parseMemory(mem: string) {
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