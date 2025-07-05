// Helper to parse uptime
export function parseUptime(uptime: string) {
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