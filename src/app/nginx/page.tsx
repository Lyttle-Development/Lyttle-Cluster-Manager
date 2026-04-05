'use client';
import {RefObject, useEffect, useMemo, useRef, useState} from 'react';
import {
    Badge,
    Button,
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    Container,
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    Empty,
    Field,
    Heading,
    Inline,
    Input,
    NativeSelect,
    Stack,
    Surface,
    Switch,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
    Text,
    Textarea,
} from '@lyttle-development/ui';
import {ArrowDown, ArrowUp, ArrowUpDown, Plus, RefreshCcw, Search} from 'lucide-react';
import {toast} from 'sonner';
import styles from './nginx.module.scss';

type ProxyType = 'PROXY' | 'REDIRECT';

interface ProxyEntry {
    id: number;
    proxy_pass_host: string;
    domains: string;
    nginx_custom_code?: string;
    type: ProxyType;
    ssl: boolean;
}

const emptyEntry: ProxyEntry = {
    id: 0,
    proxy_pass_host: '',
    domains: '',
    nginx_custom_code: '',
    type: 'PROXY',
    ssl: false,
};

const sortOptions = [
    {key: 'id', label: 'ID'},
    {key: 'domains', label: 'Domains'},
    {key: 'proxy_pass_host', label: 'Proxy Host'},
    {key: 'type', label: 'Type'},
    {key: 'ssl', label: 'SSL'}
] as const;
type SortKey = typeof sortOptions[number]['key'];
type SortDir = 'asc' | 'desc';

function compare(a: any, b: any, dir: SortDir) {
    if (a == null && b == null) return 0;
    if (a == null) return 1;
    if (b == null) return -1;
    if (typeof a === 'string' && typeof b === 'string') {
        return dir === 'asc' ? a.localeCompare(b) : b.localeCompare(a);
    }
    if (typeof a === 'boolean' && typeof b === 'boolean') {
        return dir === 'asc' ? Number(a) - Number(b) : Number(b) - Number(a);
    }
    return dir === 'asc' ? (a as number) - (b as number) : (b as number) - (a as number);
}

function useAutoGrowTextarea(ref: RefObject<HTMLTextAreaElement | null>, value: string) {
    useEffect(() => {
        if (ref.current) {
            ref.current.style.height = 'auto';
            ref.current.style.height = `${ref.current.scrollHeight}px`;
        }
    }, [value, ref]);
}

export default function NginxManagement() {
    const [entries, setEntries] = useState<ProxyEntry[]>([]);
    const [editing, setEditing] = useState<ProxyEntry | null>(null);
    const [loading, setLoading] = useState(false);

    // Sorting
    const [sortKey, setSortKey] = useState<SortKey>('id');
    const [sortDir, setSortDir] = useState<SortDir>('asc');

    // Searching
    const [searchCol, setSearchCol] = useState<SortKey>('domains');
    const [search, setSearch] = useState('');

    // Logs
    const [showLogs, setShowLogs] = useState(false);
    const [logs, setLogs] = useState<string[]>([]);
    const [reloading, setReloading] = useState(false);

    // Modal textarea refs for autogrow
    const domainsRef = useRef<HTMLTextAreaElement>(null);
    const hostRef = useRef<HTMLTextAreaElement>(null);
    const codeRef = useRef<HTMLTextAreaElement>(null);

    // Logs container ref + autoscroll control
    const logsPreRef = useRef<HTMLPreElement>(null);
    const [autoScroll, setAutoScroll] = useState(true);

    useAutoGrowTextarea(domainsRef, editing?.domains ?? '');
    useAutoGrowTextarea(hostRef, editing?.proxy_pass_host ?? '');
    useAutoGrowTextarea(codeRef, editing?.nginx_custom_code ?? '');

    const refresh = async () => {
        try {
            const response = await fetch('/api/nginx', {cache: 'no-store'});

            if (!response.ok) {
                toast.error('Failed to load proxy entries');
                return;
            }

            setEntries(await response.json());
        } catch (error) {
            console.error('Failed to load proxy entries:', error);
            toast.error('Failed to load proxy entries');
        }
    };

    useEffect(() => {
        refresh();
    }, []);

    const onEdit = (entry: ProxyEntry) => setEditing({...entry});
    const onCreate = () => setEditing({...emptyEntry, id: 0});
    const onCancel = () => setEditing(null);

    const onChange = (field: keyof ProxyEntry, value: any) => {
        if (!editing) return;
        setEditing({...editing, [field]: value});
    };

    const onSave = async () => {
        if (!editing) return;

        setLoading(true);

        try {
            const response = await fetch('/api/nginx', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(editing),
            });

            if (!response.ok) {
                toast.error('Failed to save proxy entry');
                return;
            }

            toast.success(editing.id ? 'Proxy entry updated' : 'Proxy entry created');
            setEditing(null);
            await refresh();
        } catch (error) {
            console.error('Failed to save proxy entry:', error);
            toast.error('Failed to save proxy entry');
        } finally {
            setLoading(false);
        }
    };

    const onDelete = async (id: number) => {
        if (!window.confirm('Delete this entry?')) return;

        setLoading(true);
        try {
            const response = await fetch('/api/nginx', {
                method: 'DELETE',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({id}),
            });

            if (!response.ok) {
                toast.error('Failed to delete proxy entry');
                return;
            }

            toast.success('Proxy entry deleted');
            if (editing?.id === id) {
                setEditing(null);
            }
            await refresh();
        } catch (error) {
            console.error('Failed to delete proxy entry:', error);
            toast.error('Failed to delete proxy entry');
        } finally {
            setLoading(false);
        }
    };

    function SortIndicator({column}: {column: SortKey}) {
        if (sortKey !== column) {
            return <ArrowUpDown size={14} aria-hidden="true"/>;
        }

        return sortDir === 'asc'
            ? <ArrowUp size={14} aria-label="ascending"/>
            : <ArrowDown size={14} aria-label="descending"/>;
    }

    function SslDisplay({checked}: {checked: boolean}) {
        return (
            <Inline gap="xs" wrap={false}>
                <Switch checked={checked} disabled aria-label={checked ? 'SSL enabled' : 'SSL disabled'}/>
                <Text as="span" size="sm">{checked ? 'Enabled' : 'Disabled'}</Text>
            </Inline>
        );
    }

    const handleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
        } else {
            setSortKey(key);
            setSortDir('asc');
        }
    };

    const filteredEntries = useMemo(() => {
        if (search.trim() === '') return entries;
        return entries.filter(entry => {
            const val = entry[searchCol];
            if (typeof val === 'string') return val.toLowerCase().includes(search.toLowerCase());
            if (typeof val === 'boolean') {
                return (search.toLowerCase() === 'enabled' && val) || (search.toLowerCase() === 'disabled' && !val);
            }
            return String(val).includes(search);
        });
    }, [entries, search, searchCol]);

    const sortedEntries = useMemo(() => {
        return [...filteredEntries].sort((a, b) => compare(a[sortKey], b[sortKey], sortDir));
    }, [filteredEntries, sortKey, sortDir]);

    // Parse upstream logs payloads supporting JSON {logs: string[]} and plain text
    const parseLogPayload = (txt: string): string[] => {
        try {
            const data = JSON.parse(txt);
            if (data && Array.isArray(data.logs)) {
                return data.logs.flatMap((item: unknown) => String(item ?? '').replace(/\r\n/g, '\n').split('\n'));
            }
        } catch {
            // not JSON
        }
        return txt.replace(/\r\n/g, '\n').split('\n');
    };

    // Reload + Logs via local proxy API
    const fetchLogs = async () => {
        try {
            const res = await fetch('/api/nginx/logs?count=9999', {cache: 'no-store'});
            const txt = await res.text();
            const lines = parseLogPayload(txt).filter(Boolean);
            setLogs(lines);
        } catch {
            // ignore transient errors
        }
    };

    const onReload = async () => {
        // Open logs immediately and start autoscrolling to bottom
        setShowLogs(true);
        setAutoScroll(true);
        setReloading(true);
        try {
            const res = await fetch('/api/nginx/reload', {method: 'POST'});
            if (!res.ok) await fetch('/api/nginx/reload'); // fallback GET
            toast.success('Reload finished');
        } catch {
            toast.error('Reload request failed');
        } finally {
            setReloading(false);
        }
    };

    // Poll logs every 1s while the logs modal is open
    useEffect(() => {
        if (!showLogs) return;
        let alive = true;
        const tick = async () => {
            if (!alive) return;
            await fetchLogs();
        };
        tick();
        const id = setInterval(tick, 1000);
        return () => {
            alive = false;
            clearInterval(id);
        };
    }, [showLogs]);

    // Auto-scroll to bottom on new logs if user hasn't scrolled up
    useEffect(() => {
        if (!showLogs || !autoScroll) return;
        const el = logsPreRef.current;
        if (!el) return;
        el.scrollTop = el.scrollHeight;
    }, [logs, showLogs, autoScroll]);

    // Track whether user scrolled away from bottom; if near bottom, keep auto-scroll enabled
    const handleLogsScroll = () => {
        const el = logsPreRef.current;
        if (!el) return;
        const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
        setAutoScroll(distanceFromBottom < 40); // keep following if within 40px from bottom
    };

    const closeLogs = () => setShowLogs(false);

    const classify = (line: string): string => {
        const l = line.toLowerCase();
        if (/\berror\b|\[error]/i.test(line)) return styles.logError;
        if (/\bwarn(ing)?\b|\[warn]/i.test(line)) return styles.logWarn;
        if (/\bnotice\b|\[notice]/i.test(line)) return styles.logNotice;
        if (/\binfo\b|\[info]/i.test(line)) return styles.logInfo;
        if (/\bdebug\b|\[debug]/i.test(line)) return styles.logDebug;
        if (l.includes('stderr')) return styles.logNotice;
        return styles.logText;
    };

    return (
        <Container size="7xl" padding="lg">
            <Stack gap="lg" align="start">
                <Stack gap="xs" align="start">
                    <Heading size="3xl">Proxy management</Heading>
                    <Text tone="muted">
                        Manage Nginx proxy and redirect entries, search the current routing table, and watch live reload output.
                    </Text>
                </Stack>

                <Card className={styles.toolbar}>
                    <CardHeader>
                        <div className={styles.toolbarRow}>
                            <Stack gap="xs" align="start">
                                <CardTitle>Proxy entries</CardTitle>
                                <CardDescription>Search, sort, and edit every proxy record from one shared management view.</CardDescription>
                            </Stack>
                            <Inline gap="sm">
                                <Button variant="brand" onClick={onCreate}>
                                    <Plus size={16} aria-hidden="true"/>
                                    Add entry
                                </Button>
                                <Button onClick={onReload} disabled={reloading}>
                                    <RefreshCcw size={16} aria-hidden="true"/>
                                    {reloading ? 'Reloading...' : 'Reload & show logs'}
                                </Button>
                            </Inline>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className={styles.toolbarFields}>
                            <Field label="Search" htmlFor="nginx-search" description="Filter by domains, host, id, type, or SSL state.">
                                <Input
                                    id="nginx-search"
                                    value={search}
                                    onChange={(event) => setSearch(event.target.value)}
                                    placeholder="Search proxy entries…"
                                />
                            </Field>
                            <Field label="Search column" htmlFor="nginx-search-column">
                                <NativeSelect
                                    id="nginx-search-column"
                                    value={searchCol}
                                    onChange={(event) => setSearchCol(event.target.value as SortKey)}
                                >
                                    {sortOptions.map((option) => (
                                        <option key={option.key} value={option.key}>{option.label}</option>
                                    ))}
                                </NativeSelect>
                            </Field>
                        </div>
                    </CardContent>
                </Card>

                {sortedEntries.length === 0 ? (
                    <Empty
                        title="No entries found"
                        description="Create a proxy entry or adjust the current search filters."
                        icon={<Search size={36} aria-hidden="true"/>}
                    />
                ) : (
                    <Card style={{width: '100%'}}>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        {sortOptions.map((column) => (
                                            <TableHead key={column.key}>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    className={styles.sortButton}
                                                    onClick={() => handleSort(column.key)}
                                                    aria-sort={sortKey === column.key ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
                                                >
                                                    {column.label}
                                                    <SortIndicator column={column.key}/>
                                                </Button>
                                            </TableHead>
                                        ))}
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {sortedEntries.map((entry) => (
                                        <TableRow key={entry.id}>
                                            <TableCell>{entry.id}</TableCell>
                                            <TableCell>
                                                <Text size="sm" style={{whiteSpace: 'pre-line'}}>{entry.domains}</Text>
                                            </TableCell>
                                            <TableCell>
                                                <Text size="sm" style={{whiteSpace: 'pre-line'}}>{entry.proxy_pass_host}</Text>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={entry.type === 'PROXY' ? 'brand' : 'outline'}>{entry.type}</Badge>
                                            </TableCell>
                                            <TableCell>
                                                <SslDisplay checked={entry.ssl}/>
                                            </TableCell>
                                            <TableCell>
                                                <div className={styles.tableActions}>
                                                    <Button variant="outline" size="sm" onClick={() => onEdit(entry)}>
                                                        Edit
                                                    </Button>
                                                    <Button variant="danger" size="sm" onClick={() => onDelete(entry.id)}>
                                                        Delete
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                )}

                <Dialog open={Boolean(editing)} onOpenChange={(open) => !open && onCancel()}>
                    {editing && (
                        <DialogContent className={styles.dialogContent}>
                            <DialogHeader>
                                <DialogTitle>{editing.id ? 'Edit Nginx entry' : 'Create Nginx entry'}</DialogTitle>
                                <DialogDescription>
                                    Configure domains, upstream host behaviour, and any custom Nginx directives for this record.
                                </DialogDescription>
                            </DialogHeader>

                            <Stack gap="md" align="start">
                                <Field label="Domains" htmlFor="nginx-domains" description="One domain per line or semicolon-separated." required>
                                    <Textarea
                                        id="nginx-domains"
                                        ref={domainsRef}
                                        value={editing.domains}
                                        onChange={(event) => onChange('domains', event.target.value)}
                                        rows={3}
                                        autoFocus
                                        required
                                    />
                                </Field>

                                <Field label="Proxy host" htmlFor="nginx-host" description="Destination upstream host or redirect target." required>
                                    <Textarea
                                        id="nginx-host"
                                        ref={hostRef}
                                        value={editing.proxy_pass_host}
                                        onChange={(event) => onChange('proxy_pass_host', event.target.value)}
                                        rows={3}
                                        required
                                    />
                                </Field>

                                <Field label="Entry type" htmlFor="nginx-type">
                                    <NativeSelect
                                        id="nginx-type"
                                        value={editing.type}
                                        onChange={(event) => onChange('type', event.target.value as ProxyType)}
                                    >
                                        <option value="PROXY">PROXY</option>
                                        <option value="REDIRECT">REDIRECT</option>
                                    </NativeSelect>
                                </Field>

                                <Field label="SSL" description="Enable HTTPS certificate handling for this route.">
                                    <Inline gap="sm" wrap={false}>
                                        <Switch checked={editing.ssl} onCheckedChange={(checked) => onChange('ssl', checked)}/>
                                        <Text as="span" size="sm">{editing.ssl ? 'Enabled' : 'Disabled'}</Text>
                                    </Inline>
                                </Field>

                                <Field label="Custom Nginx code" htmlFor="nginx-code" description="Optional raw Nginx configuration appended to this record.">
                                    <Textarea
                                        id="nginx-code"
                                        ref={codeRef}
                                        value={editing.nginx_custom_code ?? ''}
                                        onChange={(event) => onChange('nginx_custom_code', event.target.value)}
                                        rows={8}
                                        placeholder="# Any custom Nginx config for this entry"
                                    />
                                </Field>
                            </Stack>

                            <DialogFooter>
                                <Inline gap="sm">
                                    <Button onClick={onSave} disabled={loading}>
                                        {loading ? 'Saving...' : 'Save'}
                                    </Button>
                                    <Button variant="outline" onClick={onCancel} disabled={loading}>
                                        Cancel
                                    </Button>
                                    <Button
                                        variant="danger"
                                        onClick={() => editing.id && onDelete(editing.id)}
                                        disabled={loading || !editing.id}
                                    >
                                        Delete
                                    </Button>
                                </Inline>
                            </DialogFooter>
                        </DialogContent>
                    )}
                </Dialog>

                <Dialog open={showLogs} onOpenChange={setShowLogs}>
                    {showLogs && (
                        <DialogContent className={styles.logsDialog}>
                            <DialogHeader>
                                <DialogTitle>Reloading Nginx — live logs</DialogTitle>
                                <DialogDescription>
                                    Follow reload output in real time. Auto-scroll pauses if you scroll away from the bottom.
                                </DialogDescription>
                            </DialogHeader>

                            <Surface className={styles.logsSurface} padding="md" tone="secondary" radius="lg" shadow="none">
                                <pre
                                    ref={logsPreRef}
                                    className={styles.logsContainer}
                                    aria-live="polite"
                                    role="log"
                                    onScroll={handleLogsScroll}
                                >
                                    {logs.length === 0
                                        ? 'Waiting for log output…'
                                        : logs.map((line, index) => (
                                            <span key={`${line}-${index}`} className={classify(line)}>{line + '\n'}</span>
                                        ))}
                                </pre>
                            </Surface>

                            <DialogFooter>
                                <Button variant="outline" onClick={closeLogs}>Close</Button>
                            </DialogFooter>
                        </DialogContent>
                    )}
                </Dialog>
            </Stack>
        </Container>
    );
}