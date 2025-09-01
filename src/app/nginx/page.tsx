'use client';
import {RefObject, useEffect, useMemo, useRef, useState} from 'react';
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

    // Toast
    const [toast, setToast] = useState<{
        message: string;
        type: 'success' | 'error' | 'info'
    } | null>(null);
    const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
        setToast({message, type});
        // auto-clear matches animation length in CSS (3s visible + in/out)
        setTimeout(() => setToast(null), 3200);
    };

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

    const refresh = () =>
        fetch('/api/nginx')
            .then((res) => res.json())
            .then(setEntries);

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

    // Accessible light switch for SSL
    function SslSwitch({
                           checked,
                           onChange,
                           id
                       }: {
        checked: boolean,
        onChange: (val: boolean) => void,
        id: string
    }) {
        return (
            <label className={styles.switch} htmlFor={id}>
                <input
                    type="checkbox"
                    role="switch"
                    aria-checked={checked}
                    id={id}
                    checked={checked}
                    onChange={e => onChange(e.target.checked)}
                    tabIndex={0}
                />
                <span className={styles.track}>
          <span className={styles.thumb}/>
        </span>
                <span
                    className={styles.label}>{checked ? 'Enabled' : 'Disabled'}</span>
            </label>
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
            if (typeof val === 'number') return String(val).includes(search);
            return false;
        });
    }, [entries, search, searchCol]);

    const sortedEntries = useMemo(() => {
        return [...filteredEntries].sort((a, b) => compare(a[sortKey], b[sortKey], sortDir));
    }, [filteredEntries, sortKey, sortDir]);

    const arrow = (key: SortKey) => {
        if (sortKey !== key) return <span aria-hidden="true" style={{
            marginLeft: 4,
            opacity: 0.4
        }}>↕</span>;
        return sortDir === 'asc'
            ? <span aria-label="ascending" style={{marginLeft: 4}}>↑</span>
            : <span aria-label="descending" style={{marginLeft: 4}}>↓</span>;
    };

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
            const res = await fetch('/api/nginx/logs?count=100', {cache: 'no-store'});
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
            showToast('Reload finished', 'success');
        } catch {
            showToast('Reload request failed', 'error');
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
        if (/\berror\b|\[error\]/i.test(line)) return styles.logError;
        if (/\bwarn(ing)?\b|\[warn\]/i.test(line)) return styles.logWarn;
        if (/\bnotice\b|\[notice\]/i.test(line)) return styles.logNotice;
        if (/\binfo\b|\[info\]/i.test(line)) return styles.logInfo;
        if (/\bdebug\b|\[debug\]/i.test(line)) return styles.logDebug;
        if (l.includes('stderr')) return styles.logNotice;
        return styles.logText;
    };

    return (
        <div className={styles.wrapper}>
            <h2 className={styles.heading}>Nginx Management</h2>

            <div className={styles.toolbar}>
                <div className={styles.toolbarLeft}>
                    <button onClick={onCreate}
                            className={`${styles.button} ${styles.primary}`}>Add
                        Entry
                    </button>
                    <label style={{
                        fontWeight: 500,
                        color: '#fff',
                        fontSize: '1rem'
                    }}>
                        Search:
                        <input
                            style={{
                                marginLeft: 8,
                                marginRight: 8,
                                padding: '0.45rem 0.6rem',
                                borderRadius: 8,
                                border: '1px solid rgba(255,255,255,0.06)',
                                background: '#23233a',
                                color: '#fff',
                                fontSize: '1rem'
                            }}
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search..."
                        />
                    </label>
                    <label style={{
                        fontWeight: 500,
                        color: '#fff',
                        fontSize: '1rem'
                    }}>
                        in
                        <select
                            style={{
                                marginLeft: 8,
                                padding: '0.45rem 0.6rem',
                                borderRadius: 8,
                                border: '1px solid rgba(255,255,255,0.06)',
                                background: '#23233a',
                                color: '#fff',
                                fontSize: '1rem'
                            }}
                            value={searchCol}
                            onChange={e => setSearchCol(e.target.value as SortKey)}
                        >
                            {sortOptions.map(opt => (
                                <option key={opt.key}
                                        value={opt.key}>{opt.label}</option>
                            ))}
                        </select>
                    </label>
                </div>

                <div className={styles.toolbarRight}>
                    <button
                        onClick={onReload}
                        disabled={reloading}
                        className={`${styles.reload}`}
                        aria-label="Reload server and view live logs"
                        title="Reload and show live logs"
                    >
                        {reloading ? 'Reloading...' : 'Reload & Show Logs'}
                    </button>
                </div>
            </div>

            <div className={styles.tableOuterPad}>
                <div className={styles.tableWrap}>
                    <table className={styles.table}>
                        <thead>
                        <tr>
                            {sortOptions.map(col => (
                                <th
                                    key={col.key}
                                    onClick={() => handleSort(col.key)}
                                    tabIndex={0}
                                    aria-sort={sortKey === col.key ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
                                    style={{
                                        cursor: 'pointer',
                                        userSelect: 'none'
                                    }}
                                    scope="col"
                                >
                                    {col.label}{arrow(col.key)}
                                </th>
                            ))}
                            <th colSpan={2}>Actions</th>
                        </tr>
                        </thead>
                        <tbody>
                        {sortedEntries.map((entry) => (
                            <tr key={entry.id}>
                                <td>{entry.id}</td>
                                <td style={{whiteSpace: 'pre-line'}}>{entry.domains}</td>
                                <td style={{whiteSpace: 'pre-line'}}>{entry.proxy_pass_host}</td>
                                <td>{entry.type}</td>
                                <td>
                                    <SslSwitch checked={entry.ssl}
                                               id={`ssl-switch-${entry.id}`}
                                               onChange={() => {
                                               }}/>
                                </td>
                                <td>
                                    <button
                                        onClick={() => onEdit(entry)}
                                        className={`${styles.button} ${styles.neutral}`}
                                        aria-label={`Edit entry ${entry.id}`}>
                                        Edit
                                    </button>
                                </td>
                                <td>
                                    <button
                                        onClick={() => onDelete(entry.id)}
                                        className={`${styles.button} ${styles.danger}`}
                                        aria-label={`Delete entry ${entry.id}`}>
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {sortedEntries.length === 0 && (
                            <tr>
                                <td colSpan={sortOptions.length + 2} style={{
                                    textAlign: 'center',
                                    color: '#AAA'
                                }}>No entries found.
                                </td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                </div>
            </div>

            {editing && (
                <div className={styles.modalOverlay} role="dialog"
                     aria-modal="true">
                    <div className={styles.modal}>
                        <h3>{editing.id ? 'Edit Nginx Entry' : 'Create Nginx Entry'}</h3>
                        <label>
                            Domains
                            <textarea
                                ref={domainsRef}
                                value={editing.domains}
                                onChange={e => onChange('domains', e.target.value)}
                                rows={2}
                                spellCheck
                                autoFocus
                                aria-required="true"
                                onInput={e => {
                                    const ta = e.currentTarget;
                                    ta.style.height = 'auto';
                                    ta.style.height = ta.scrollHeight + 'px';
                                }}
                            />
                        </label>
                        <label>
                            Proxy Host
                            <textarea
                                ref={hostRef}
                                value={editing.proxy_pass_host}
                                onChange={e => onChange('proxy_pass_host', e.target.value)}
                                rows={2}
                                spellCheck
                                aria-required="true"
                                onInput={e => {
                                    const ta = e.currentTarget;
                                    ta.style.height = 'auto';
                                    ta.style.height = ta.scrollHeight + 'px';
                                }}
                            />
                        </label>
                        <label>
                            Type
                            <select
                                value={editing.type}
                                onChange={e => onChange('type', e.target.value as ProxyType)}
                                aria-required="true"
                            >
                                <option value="PROXY">PROXY</option>
                                <option value="REDIRECT">REDIRECT</option>
                            </select>
                        </label>
                        <label>
                            SSL
                            <SslSwitch
                                checked={editing.ssl}
                                onChange={val => onChange('ssl', val)}
                                id="modal-ssl-switch"
                            />
                        </label>
                        <label>
                            Custom Nginx Code
                            <textarea
                                ref={codeRef}
                                value={editing.nginx_custom_code ?? ''}
                                onChange={e => onChange('nginx_custom_code', e.target.value)}
                                rows={5}
                                spellCheck
                                aria-multiline="true"
                                placeholder="# Any custom Nginx config for this entry"
                                onInput={e => {
                                    const ta = e.currentTarget;
                                    ta.style.height = 'auto';
                                    ta.style.height = ta.scrollHeight + 'px';
                                }}
                            />
                        </label>
                        <div className={styles.modalActions}>
                            <button
                                onClick={onSave}
                                disabled={loading}
                                className={`${styles.button} ${styles.primary}`}
                                aria-label="Save entry"
                            >
                                Save
                            </button>
                            <button
                                onClick={onCancel}
                                disabled={loading}
                                className={`${styles.button} ${styles.neutral}`}
                                aria-label="Cancel"
                                type="button"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => editing.id && onDelete(editing.id)}
                                disabled={loading || !editing.id}
                                className={`${styles.button} ${styles.danger}`}
                                aria-label="Delete entry"
                                type="button"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showLogs && (
                <div className={styles.modalOverlay} role="dialog"
                     aria-modal="true">
                    <div className={styles.logsModal}>
                        <div className={styles.logsHeader}>
                            <h3 style={{margin: 0}}>Reloading Nginx — Live
                                Logs</h3>
                            <button
                                onClick={closeLogs}
                                className={`${styles.button} ${styles.neutral}`}
                                aria-label="Close logs"
                            >
                                Close
                            </button>
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
                <div className={styles.toastViewport} role="status"
                     aria-live="polite">
                    <div
                        className={`${styles.toast} ${toast.type === 'success' ? styles.toastSuccess : toast.type === 'error' ? styles.toastError : styles.toastInfo}`}>
                        {toast.message}
                    </div>
                </div>
            )}
        </div>
    );
}