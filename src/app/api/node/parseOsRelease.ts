export interface OsReleaseEntry {
    prettyName: string;
    name: string;
    versionId: string;
    version: string;
    versionCodename: string;
    id: string;
    homeUrl: string;
    supportUrl: string;
    bugReportUrl: string;
}

// Helper to parse /etc/os-release into an object
export function parseOsRelease(os: string): OsReleaseEntry {
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