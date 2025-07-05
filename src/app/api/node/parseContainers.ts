// Helper to parse containers output
export function parseContainers(containers: string) {
    // containers is a string with names separated by newlines
    return containers
        .split('\n')
        .map(name => name.trim())
        .filter(name => name.length > 0)
        .map(name => ({name}));
}