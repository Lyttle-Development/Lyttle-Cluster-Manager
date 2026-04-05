'use client';
import {useEffect, useState} from 'react';
import {
    Badge,
    Button,
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@lyttle-development/ui';

interface ClusterNode {
    id: string;
    hostname: string;
    instanceId: string;
    ipAddress: string | null;
    isLeader: boolean;
    lastHeartbeat: string;
    status: string;
    version: string | null;
    metadata: any;
}

interface ClusterStats {
    totalNodes: number;
    activeNodes: number;
    inactiveNodes: number;
    failedNodes: number;
    leaders: ClusterNode[];
}

interface LeaderStatus {
    status: string;
    lockHolder: {
        instanceId: string;
        heldForMs: number;
    } | null;
    dbLeader: ClusterNode | null;
    allLeadersInDb: ClusterNode[];
    issues: string[];
}

const statusVariant = (status: string): 'success' | 'destructive' | 'warning' | 'secondary' => {
    if (status === 'active') return 'success';
    if (status === 'failed') return 'destructive';
    if (status === 'inactive') return 'secondary';
    return 'warning';
};

const healthVariant = (status: string): 'success' | 'warning' => {
    return status === 'healthy' ? 'success' : 'warning';
};

export default function ClusterPage() {
    const [nodes, setNodes] = useState<ClusterNode[]>([]);
    const [stats, setStats] = useState<ClusterStats | null>(null);
    const [leaderStatus, setLeaderStatus] = useState<LeaderStatus | null>(null);
    const [loading, setLoading] = useState(false);

    const [toast, setToast] = useState<{
        message: string;
        type: 'success' | 'error' | 'info';
    } | null>(null);

    const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
        setToast({message, type});
        setTimeout(() => setToast(null), 3200);
    };

    const refresh = async () => {
        try {
            const [nodesRes, statsRes, leaderRes] = await Promise.all([
                fetch('/api/cluster/nodes'),
                fetch('/api/cluster/stats'),
                fetch('/api/cluster/leader/status'),
            ]);
            if (nodesRes.ok) setNodes((await nodesRes.json()).nodes || []);
            if (statsRes.ok) setStats(await statsRes.json());
            if (leaderRes.ok) setLeaderStatus(await leaderRes.json());
        } catch (error) {
            console.error('Failed to refresh cluster data:', error);
        }
    };

    useEffect(() => {
        refresh();
        const interval = setInterval(refresh, 5000);
        return () => clearInterval(interval);
    }, []);

    const handleCleanup = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/cluster/admin/cleanup');
            if (!res.ok) throw new Error('Cleanup failed');
            const data = await res.json();
            showToast(`Cleanup complete: ${data.message}`, 'success');
            refresh();
        } catch {
            showToast('Failed to cleanup stale nodes', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleEnforceLeader = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/cluster/admin/enforce-leader');
            if (!res.ok) throw new Error('Enforce leader failed');
            const data = await res.json();
            showToast(data.message, 'success');
            refresh();
        } catch {
            showToast('Failed to enforce leader', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleEnsureLeader = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/cluster/admin/ensure-leader');
            if (!res.ok) throw new Error('Ensure leader failed');
            const data = await res.json();
            showToast(data.message, data.success ? 'success' : 'error');
            refresh();
        } catch {
            showToast('Failed to ensure leader', 'error');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string) => new Date(dateString).toLocaleString();

    const timeSince = (dateString: string) => {
        const diffSec = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
        if (diffSec < 60) return `${diffSec}s ago`;
        if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
        if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
        return `${Math.floor(diffSec / 86400)}d ago`;
    };

    return (
        <div style={{padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem'}}>
            <h2 style={{fontSize: '1.5rem', fontWeight: 700}}>Cluster Management</h2>

            {stats && (
                <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(10rem, 1fr))', gap: '1rem'}}>
                    {[
                        {label: 'Total Nodes', value: stats.totalNodes},
                        {label: 'Active Nodes', value: stats.activeNodes, sub: 'Online and responding'},
                        {label: 'Inactive Nodes', value: stats.inactiveNodes, sub: 'Offline or stale'},
                        {label: 'Failed Nodes', value: stats.failedNodes, sub: 'Marked as failed'},
                    ].map(({label, value, sub}) => (
                        <Card key={label}>
                            <CardHeader>
                                <CardTitle style={{fontSize: '0.875rem', fontWeight: 500, color: 'var(--muted-foreground)'}}>{label}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p style={{fontSize: '2rem', fontWeight: 700, lineHeight: 1}}>{value}</p>
                                {sub && <p style={{fontSize: '0.75rem', color: 'var(--muted-foreground)', marginTop: '0.25rem'}}>{sub}</p>}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {leaderStatus && (
                <Card>
                    <CardHeader>
                        <CardTitle style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                            Leader Status
                            <Badge variant={healthVariant(leaderStatus.status)}>{leaderStatus.status}</Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
                        {leaderStatus.dbLeader ? (
                            <dl style={{display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '0.25rem 1rem', alignItems: 'start'}}>
                                <dt style={{color: 'var(--muted-foreground)', fontSize: '0.875rem'}}>Hostname</dt>
                                <dd>{leaderStatus.dbLeader.hostname}</dd>
                                <dt style={{color: 'var(--muted-foreground)', fontSize: '0.875rem'}}>Instance ID</dt>
                                <dd style={{fontFamily: 'monospace', fontSize: '0.875rem'}}>{leaderStatus.dbLeader.instanceId}</dd>
                                <dt style={{color: 'var(--muted-foreground)', fontSize: '0.875rem'}}>IP Address</dt>
                                <dd>{leaderStatus.dbLeader.ipAddress || 'N/A'}</dd>
                                <dt style={{color: 'var(--muted-foreground)', fontSize: '0.875rem'}}>Last Heartbeat</dt>
                                <dd>{formatDate(leaderStatus.dbLeader.lastHeartbeat)} ({timeSince(leaderStatus.dbLeader.lastHeartbeat)})</dd>
                                <dt style={{color: 'var(--muted-foreground)', fontSize: '0.875rem'}}>Status</dt>
                                <dd><Badge variant={statusVariant(leaderStatus.dbLeader.status)}>{leaderStatus.dbLeader.status}</Badge></dd>
                            </dl>
                        ) : (
                            <p style={{color: 'var(--muted-foreground)'}}>No active leader found</p>
                        )}

                        {leaderStatus.issues.length > 0 && (
                            <div style={{padding: '0.75rem', background: 'color-mix(in oklab, var(--destructive) 10%, transparent)', borderRadius: 'var(--radius)'}}>
                                <strong style={{color: 'var(--destructive)'}}>Issues Detected:</strong>
                                <ul style={{margin: '0.5rem 0 0 1.25rem', color: 'var(--muted-foreground)'}}>
                                    {leaderStatus.issues.map((issue, i) => (
                                        <li key={i}>{issue.replace(/_/g, ' ')}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <div style={{display: 'flex', gap: '0.5rem', flexWrap: 'wrap'}}>
                            <Button variant="secondary" onClick={handleCleanup} disabled={loading}>
                                Cleanup Stale Nodes
                            </Button>
                            <Button variant="default" onClick={handleEnforceLeader} disabled={loading}>
                                Enforce Single Leader
                            </Button>
                            <Button variant="outline" onClick={handleEnsureLeader} disabled={loading}>
                                Ensure Leader Exists
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
                <h3 style={{margin: 0, fontSize: '1rem', fontWeight: 600}}>Cluster Nodes</h3>
                <Button variant="secondary" onClick={refresh}>Refresh</Button>
            </div>

            {nodes.length === 0 ? (
                <p style={{color: 'var(--muted-foreground)'}}>No cluster nodes found</p>
            ) : (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Hostname</TableHead>
                            <TableHead>Instance ID</TableHead>
                            <TableHead>IP Address</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Leader</TableHead>
                            <TableHead>Version</TableHead>
                            <TableHead>Last Heartbeat</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {nodes.map((node) => (
                            <TableRow key={node.id}>
                                <TableCell>{node.hostname}</TableCell>
                                <TableCell style={{fontFamily: 'monospace', fontSize: '0.875rem'}}>{node.instanceId}</TableCell>
                                <TableCell>{node.ipAddress || '-'}</TableCell>
                                <TableCell><Badge variant={statusVariant(node.status)}>{node.status}</Badge></TableCell>
                                <TableCell>
                                    {node.isLeader && <Badge variant="info">Leader</Badge>}
                                </TableCell>
                                <TableCell>{node.version || '-'}</TableCell>
                                <TableCell>
                                    {formatDate(node.lastHeartbeat)}
                                    <br/>
                                    <span style={{color: 'var(--muted-foreground)', fontSize: '0.875rem'}}>
                                        ({timeSince(node.lastHeartbeat)})
                                    </span>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            )}

            {toast && (
                <div style={{position: 'fixed', bottom: '1.5rem', right: '1.5rem', zIndex: 9999}}>
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
