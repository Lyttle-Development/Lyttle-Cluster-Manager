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
export function parseCpu(cpu: string) {
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