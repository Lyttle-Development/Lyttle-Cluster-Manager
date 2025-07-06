export interface ContainerEntry {
    name: string;
}

export type ContainerEntries = ContainerEntry[];

// Helper to parse containers output
export function parseContainers(containers: string): ContainerEntries {
    // containers is a string with names separated by newlines
    return containers
        .split('\n')
        .map(name => name.trim())
        .filter(name => name.length > 0)
        .map(name => ({name}));
}