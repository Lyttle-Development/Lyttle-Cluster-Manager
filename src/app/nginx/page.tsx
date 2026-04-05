'use client';
import {RefObject, useEffect, useMemo, useRef, useState} from 'react';
import {
    Badge,
    Button,
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    Input,
    Switch,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
    Textarea,
} from '@lyttle-development/ui';
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
    if (typeof a === 'string' && typeof b === 'string')
        return dir === 'asc' ? a.localeCompare(b) : b.localeCompare(a);
    if (typeof a === 'boolean' && typeof b === 'boolean')
        return dir === 'asc' ? Number(a) - Number(b) : Number(b) - Number(a);
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
    const [sortKey, setSortKey] = useState<SortKey>('id');
    const [sortDir, setSortDir] = useState<SortDir>('asc');
    const [searchCol, setSearchCol] = useState<SortKey>('domains');
    const [search, setSearch] = useState('');
    const [showLogs, setShowLogs] = useState(false);
    const [logs, setLogs] = useState<string[]>([]);
    const [reloading, setReloading] = useState(false);
    const [toast, setToast] = useState<{message: string; type: 'success' | 'error' | 'info'} | null>(null);

    const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
        setToast({message, type});
        setTimeout(() => setToast(null), 3200);
    };

    const domainsRef = useRef<HTMLTextAreaElement>(null);
    const hostRef = useRef<HTMLTextAreaElement>(null);
    const codeRef = useRef<HTMLTextAreaElement>(null);
    const logsPreRef = useRef<HTMLPreElement>(null);
    const [autoScroll, setAutoScroll] = useState(true);

    useAutoGrowTextarea(domainsRef, editing?.domains ?? '');
    useAutoGrowTextarea(hostRef, editing?.proxy_pass_host ?? '');
    useAutoGrowTextarea(codeRef, editing?.nginx_custom_code ?? '');

    const refresh = () =>
        fetch('/api/nginx').then((res) => res.json()).then(setEntries);

    useEffect(() => { refresh(); }, []);

    const onEdit = (entry: ProxyEntry) => setEditing({...entry});
    const onCreate = () => setEditing({...emptyEntry, id: 0});
    const onCancel = () => setEditing(null);

    const onChange = (field: keyof ProxyEntry, value: any) => {
        if (!editing) return;
        setEditing({...editing, [field]: value});
    };

    const onSave = async () => {
        setLoading(true);
        await fetch('/api/nginx', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(editing),
        });
        setEditing(null);
        setLoading(false);
        refresh();
    };

    const onDelete = async (id: number) => {
        if (!confirm('Delete this entry?')) return;
        setLoading(true);
        await fetch('/api/nginx', {
            method: 'DELETE',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({id}),
        });
        setLoading(false);
        refresh();
    };

    const handleSort = (key: SortKey) => {
        if (sortKey === key) setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
        else { setSortKey(key); setSortDir('asc'); }
    };

    const filteredEntries = useMemo(() => {
        if (search.trim() === '') return entries;
        return entries.filter(entry => {
            const val = entry[searchCol];
            if (typeof val === 'string') return val.toLowerCase().includes(search.toLowerCase());
            if (typeof val === 'boolean')
                return (search.toLowerCase() === 'enabled' && val) || (search.toLowerCase() === 'disabled' && !val);
            if (typeof val === 'number') return String(val).includes(search);
            return false;
        });
    }, [entries, search, searchCol]);

    const sortedEntries = useMemo(() =>
        [...filteredEntries].sort((a, b) => compare(a[sortKey], b[sortKey], sortDir)),
        [filteredEntries, sortKey, sortDir]
    );

    const arrow = (key: SortKey) => {
        if (sortKey !== key) return <span aria-hidden="true" style={{marginLeft: 4, opacity: 0.4}}>↕</span>;
        return sortDir === 'asc'
            ? <span aria-label="ascending" style={{marginLeft: 4}}>↑</span>
            : <span aria-label="descending" style={{marginLeft: 4}}>↓</span>;
    };

    const parseLogPayload = (txt: string): string[] => {
        try {
            const data = JSON.parse(txt);
            if (data && Array.isArray(data.logs))
                return data.logs.flatMap((item: unknown) => String(item ?? '').replace(/\r\n/g, '\n').split('\n'));
        } catch { /* not JSON */ }
        return txt.replace(/\r\n/g, '\n').split('\n');
    };

    const fetchLogs = async () => {
        try {
            const res = await fetch('/api/nginx/logs?count=9999', {cache: 'no-store'});
            const txt = await res.text();
            setLogs(parseLogPayload(txt).filter(Boolean));
        } catch { /* ignore */ }
    };

    const onReload = async () => {
        setShowLogs(true);
        setAutoScroll(true);
        setReloading(true);
        try {
            const res = await fetch('/api/nginx/reload', {method: 'POST'});
            if (!res.ok) await fetch('/api/nginx/reload');
            showToast('Reload finished', 'success');
        } catch {
            showToast('Reload request failed', 'error');
        } finally {
            setReloading(false);
        }
    };

    useEffect(() => {
        if (!showLogs) return;
        let alive = true;
        const tick = async () => { if (alive) await fetchLogs(); };
        tick();
        const id = setInterval(tick, 1000);
        return () => { alive = false; clearInterval(id); };
    }, [showLogs]);

    useEffect(() => {
        if (!showLogs || !autoScroll) return;
        const el = logsPreRef.current;
        if (el) el.scrollTop = el.scrollHeight;
    }, [logs, showLogs, autoScroll]);

    const handleLogsScroll = () => {
        const el = logsPreRef.current;
        if (el) setAutoScroll(el.scrollHeight - el.scrollTop - el.clientHeight < 40);
    };

    const classify = (line: string): string => {
        if (/\berror\b|\[error\]/i.test(line)) return styles.logError;
        if (/\bwarn(ing)?\b|\[warn\]/i.test(line)) return styles.logWarn;
        if (/\bnotice\b|\[notice\]/i.test(line)) return styles.logNotice;
        if (/\binfo\b|\[info\]/i.test(line)) return styles.logInfo;
        if (/\bdebug\b|\[debug\]/i.test(line)) return styles.logDebug;
        if (line.toLowerCase().includes('stderr')) return styles.logNotice;
        return styles.logText;
    };

    return (
        <div style={{padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem'}}>
            <h2 style={{fontSize: '1.5rem', fontWeight: 700}}>Nginx Management</h2>

            {/* Toolbar */}
            <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap'}}>
                <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap'}}>
                    <Button onClick={onCreate}>Add Entry</Button>
                    <label style={{display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 500, fontSize: '0.875rem'}}>
                        Search:
                        <Input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search..."
                            style={{width: '12rem'}}
                        />
                    </label>
                    <label style={{display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 500, fontSize: '0.875rem'}}>
                        in
                        <select
                            value={searchCol}
                            onChange={e => setSearchCol(e.target.value as SortKey)}
                            style={{
                                padding: '0.45rem 0.6rem',
                                borderRadius: 'var(--radius)',
                                border: '1px solid var(--border)',
                                background: 'var(--input)',
                                color: 'var(--foreground)',
                                fontSize: '0.875rem',
                            }}
                        >
                            {sortOptions.map(opt => <option key={opt.key} value={opt.key}>{opt.label}</option>)}
                        </select>
                    </label>
                </div>
                <Button
                    variant="secondary"
                    onClick={onReload}
                    disabled={reloading}
                    aria-label="Reload server and view live logs"
                >
                    {reloading ? 'Reloading...' : 'Reload & Show Logs'}
                </Button>
            </div>

            {/* Table */}
            <Table>
                <TableHeader>
                    <TableRow>
                        {sortOptions.map(col => (
                            <TableHead
                                key={col.key}
                                onClick={() => handleSort(col.key)}
                                tabIndex={0}
                                aria-sort={sortKey === col.key ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
                                style={{cursor: 'pointer', userSelect: 'none'}}
                                scope="col"
                            >
                                {col.label}{arrow(col.key)}
                            </TableHead>
                        ))}
                        <TableHead colSpan={2}>Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {sortedEntries.map((entry) => (
                        <TableRow key={entry.id}>
                            <TableCell>{entry.id}</TableCell>
                            <TableCell style={{whiteSpace: 'pre-line'}}>{entry.domains}</TableCell>
                            <TableCell style={{whiteSpace: 'pre-line'}}>{entry.proxy_pass_host}</TableCell>
                            <TableCell>{entry.type}</TableCell>
                            <TableCell>
                                <Badge variant={entry.ssl ? 'success' : 'secondary'}>
                                    {entry.ssl ? 'Enabled' : 'Disabled'}
                                </Badge>
                            </TableCell>
                            <TableCell>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => onEdit(entry)}
                                    aria-label={`Edit entry ${entry.id}`}
                                >
                                    Edit
                                </Button>
                            </TableCell>
                            <TableCell>
                                <Button
                                    variant="danger"
                                    size="sm"
                                    onClick={() => onDelete(entry.id)}
                                    aria-label={`Delete entry ${entry.id}`}
                                >
                                    Delete
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                    {sortedEntries.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={sortOptions.length + 2} style={{textAlign: 'center', color: 'var(--muted-foreground)'}}>
                                No entries found.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>

            {/* Edit/Create Dialog */}
            <Dialog open={!!editing} onOpenChange={(open) => { if (!open) onCancel(); }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {editing?.id ? 'Edit Nginx Entry' : 'Create Nginx Entry'}
                        </DialogTitle>
                    </DialogHeader>
                    <div style={{display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem 0'}}>
                        <label style={{display: 'flex', flexDirection: 'column', gap: '0.25rem', fontWeight: 500, fontSize: '0.875rem'}}>
                            Domains
                            <Textarea
                                ref={domainsRef}
                                value={editing?.domains ?? ''}
                                onChange={e => onChange('domains', e.target.value)}
                                rows={2}
                                spellCheck
                                autoFocus
                                aria-required="true"
                            />
                        </label>
                        <label style={{display: 'flex', flexDirection: 'column', gap: '0.25rem', fontWeight: 500, fontSize: '0.875rem'}}>
                            Proxy Host
                            <Textarea
                                ref={hostRef}
                                value={editing?.proxy_pass_host ?? ''}
                                onChange={e => onChange('proxy_pass_host', e.target.value)}
                                rows={2}
                                spellCheck
                                aria-required="true"
                            />
                        </label>
                        <label style={{display: 'flex', flexDirection: 'column', gap: '0.25rem', fontWeight: 500, fontSize: '0.875rem'}}>
                            Type
                            <select
                                value={editing?.type ?? 'PROXY'}
                                onChange={e => onChange('type', e.target.value as ProxyType)}
                                aria-required="true"
                                style={{
                                    padding: '0.5rem 0.6rem',
                                    borderRadius: 'var(--radius)',
                                    border: '1px solid var(--border)',
                                    background: 'var(--input)',
                                    color: 'var(--foreground)',
                                    fontSize: '0.875rem',
                                }}
                            >
                                <option value="PROXY">PROXY</option>
                                <option value="REDIRECT">REDIRECT</option>
                            </select>
                        </label>
                        <div style={{display: 'flex', alignItems: 'center', gap: '0.75rem'}}>
                            <span style={{fontWeight: 500, fontSize: '0.875rem'}}>SSL</span>
                            <Switch
                                checked={editing?.ssl ?? false}
                                onCheckedChange={(val) => onChange('ssl', val)}
                            />
                            <span style={{fontSize: '0.875rem', color: 'var(--muted-foreground)'}}>
                                {editing?.ssl ? 'Enabled' : 'Disabled'}
                            </span>
                        </div>
                        <label style={{display: 'flex', flexDirection: 'column', gap: '0.25rem', fontWeight: 500, fontSize: '0.875rem'}}>
                            Custom Nginx Code
                            <Textarea
                                ref={codeRef}
                                value={editing?.nginx_custom_code ?? ''}
                                onChange={e => onChange('nginx_custom_code', e.target.value)}
                                rows={5}
                                spellCheck
                                placeholder="# Any custom Nginx config for this entry"
                            />
                        </label>
                    </div>
                    <DialogFooter>
                        <Button onClick={onSave} disabled={loading} aria-label="Save entry">
                            Save
                        </Button>
                        <Button variant="secondary" onClick={onCancel} disabled={loading} aria-label="Cancel">
                            Cancel
                        </Button>
                        {editing?.id ? (
                            <Button
                                variant="danger"
                                onClick={() => editing.id && onDelete(editing.id)}
                                disabled={loading || !editing?.id}
                                aria-label="Delete entry"
                            >
                                Delete
                            </Button>
                        ) : null}
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Logs Modal (custom — complex scroll behavior) */}
            {showLogs && (
                <div className={styles.modalOverlay} role="dialog" aria-modal="true">
                    <div className={styles.logsModal}>
                        <div className={styles.logsHeader}>
                            <h3 style={{margin: 0}}>Reloading Nginx — Live Logs</h3>
                            <Button variant="secondary" onClick={() => setShowLogs(false)} aria-label="Close logs">
                                Close
                            </Button>
                        </div>
                        <pre
                            ref={logsPreRef}
                            className={styles.logsContainer}
                            aria-live="polite"
                            role="log"
                            onScroll={handleLogsScroll}
                        >
                            {logs.map((line, i) => (
                                <span key={i} className={classify(line)}>{line + '\n'}</span>
                            ))}
                        </pre>
                    </div>
                </div>
            )}

            {toast && (
                <div style={{position: 'fixed', bottom: '1.5rem', right: '1.5rem', zIndex: 9999}} role="status" aria-live="polite">
                    <div style={{
                        padding: '0.75rem 1.25rem',
                        borderRadius: 'var(--radius)',
                        background: toast.type === 'success' ? 'var(--primary)' : toast.type === 'error' ? 'var(--destructive)' : 'var(--muted)',
                        color: toast.type === 'success' ? 'var(--primary-foreground)' : 'var(--foreground)',
                        boxShadow: 'var(--shadow-md)',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                    }}>
                        {toast.message}
                    </div>
                </div>
            )}
        </div>
    );
}