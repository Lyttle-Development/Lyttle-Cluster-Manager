'use client';
import {useEffect, useState} from 'react';
import styles from './page.module.scss';

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

            if (nodesRes.ok) {
                const nodesData = await nodesRes.json();
                setNodes(nodesData.nodes || []);
            }

            if (statsRes.ok) {
                const statsData = await statsRes.json();
                setStats(statsData);
            }

            if (leaderRes.ok) {
                const leaderData = await leaderRes.json();
                setLeaderStatus(leaderData);
            }
        } catch (error) {
            console.error('Failed to refresh cluster data:', error);
        }
    };

    useEffect(() => {
        refresh();
        const interval = setInterval(refresh, 5000); // Refresh every 5 seconds
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
        } catch (error) {
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
        } catch (error) {
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
        } catch (error) {
            showToast('Failed to ensure leader', 'error');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString();
    };

    const getStatusBadge = (status: string) => {
        const className = styles[status] || styles.inactive;
        return <span
            className={`${styles.statusBadge} ${className}`}>{status}</span>;
    };

    const getHealthStatus = (status: string) => {
        const className = status === 'healthy' ? styles.healthy : styles.inconsistent;
        return <span
            className={`${styles.healthStatus} ${className}`}>{status}</span>;
    };

    const timeSince = (dateString: string) => {
        const now = new Date();
        const then = new Date(dateString);
        const diffMs = now.getTime() - then.getTime();
        const diffSec = Math.floor(diffMs / 1000);

        if (diffSec < 60) return `${diffSec}s ago`;
        if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
        if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
        return `${Math.floor(diffSec / 86400)}d ago`;
    };

    return (
        <div className={styles.wrapper}>
            <h2 className={styles.heading}>Cluster Management</h2>

            {stats && (
                <div className={styles.statsGrid}>
                    <div className={styles.statCard}>
                        <h3>Total Nodes</h3>
                        <div className={styles.value}>{stats.totalNodes}</div>
                    </div>
                    <div className={styles.statCard}>
                        <h3>Active Nodes</h3>
                        <div className={styles.value}>{stats.activeNodes}</div>
                        <div className={styles.label}>Online and responding
                        </div>
                    </div>
                    <div className={styles.statCard}>
                        <h3>Inactive Nodes</h3>
                        <div
                            className={styles.value}>{stats.inactiveNodes}</div>
                        <div className={styles.label}>Offline or stale</div>
                    </div>
                    <div className={styles.statCard}>
                        <h3>Failed Nodes</h3>
                        <div className={styles.value}>{stats.failedNodes}</div>
                        <div className={styles.label}>Marked as failed</div>
                    </div>
                </div>
            )}

            {leaderStatus && (
                <div className={styles.leaderCard}>
                    <h3>
                        Leader Status
                        {getHealthStatus(leaderStatus.status)}
                    </h3>

                    {leaderStatus.dbLeader ? (
                        <dl>
                            <dt>Hostname</dt>
                            <dd>{leaderStatus.dbLeader.hostname}</dd>

                            <dt>Instance ID</dt>
                            <dd>{leaderStatus.dbLeader.instanceId}</dd>

                            <dt>IP Address</dt>
                            <dd>{leaderStatus.dbLeader.ipAddress || 'N/A'}</dd>

                            <dt>Last Heartbeat</dt>
                            <dd>{formatDate(leaderStatus.dbLeader.lastHeartbeat)} ({timeSince(leaderStatus.dbLeader.lastHeartbeat)})</dd>

                            <dt>Status</dt>
                            <dd>{getStatusBadge(leaderStatus.dbLeader.status)}</dd>
                        </dl>
                    ) : (
                        <p style={{color: 'var(--text-secondary)'}}>No active
                            leader found</p>
                    )}

                    {leaderStatus.issues.length > 0 && (
                        <div style={{
                            marginTop: '16px',
                            padding: '12px',
                            background: 'rgba(231, 76, 60, 0.1)',
                            borderRadius: '8px'
                        }}>
                            <strong style={{color: '#e74c3c'}}>Issues
                                Detected:</strong>
                            <ul style={{
                                margin: '8px 0 0 20px',
                                color: 'var(--text-secondary)'
                            }}>
                                {leaderStatus.issues.map((issue, i) => (
                                    <li key={i}>{issue.replace(/_/g, ' ')}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <div className={styles.adminActions}>
                        <button
                            onClick={handleCleanup}
                            disabled={loading}
                            className={`${styles.button} ${styles.neutral}`}
                        >
                            Cleanup Stale Nodes
                        </button>
                        <button
                            onClick={handleEnforceLeader}
                            disabled={loading}
                            className={`${styles.button} ${styles.primary}`}
                        >
                            Enforce Single Leader
                        </button>
                        <button
                            onClick={handleEnsureLeader}
                            disabled={loading}
                            className={`${styles.button} ${styles.success}`}
                        >
                            Ensure Leader Exists
                        </button>
                    </div>
                </div>
            )}

            <div className={styles.toolbar}>
                <h3 style={{color: 'var(--text-primary)', margin: 0}}>Cluster
                    Nodes</h3>
                <button
                    onClick={refresh}
                    className={`${styles.button} ${styles.neutral}`}
                >
                    Refresh
                </button>
            </div>

            {nodes.length === 0 ? (
                <div className={styles.emptyState}>
                    <p>No cluster nodes found</p>
                </div>
            ) : (
                <div className={styles.tableOuterPad}>
                    <div className={styles.tableWrap}>
                        <table className={styles.table}>
                            <thead>
                            <tr>
                                <th>Hostname</th>
                                <th>Instance ID</th>
                                <th>IP Address</th>
                                <th>Status</th>
                                <th>Leader</th>
                                <th>Version</th>
                                <th>Last Heartbeat</th>
                            </tr>
                            </thead>
                            <tbody>
                            {nodes.map((node) => (
                                <tr key={node.id}>
                                    <td>{node.hostname}</td>
                                    <td style={{
                                        fontFamily: 'Courier New, monospace',
                                        fontSize: '0.875rem'
                                    }}>
                                        {node.instanceId}
                                    </td>
                                    <td>{node.ipAddress || '-'}</td>
                                    <td>{getStatusBadge(node.status)}</td>
                                    <td>
                                        {node.isLeader && (
                                            <span
                                                className={styles.leaderIndicator}>Leader</span>
                                        )}
                                    </td>
                                    <td>{node.version || '-'}</td>
                                    <td>
                                        {formatDate(node.lastHeartbeat)}
                                        <br/>
                                        <span style={{
                                            color: 'var(--text-secondary)',
                                            fontSize: '0.875rem'
                                        }}>
                                                ({timeSince(node.lastHeartbeat)})
                                            </span>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {toast && (
                <div className={styles.toastViewport}>
                    <div
                        className={`${styles.toast} ${styles[`toast${toast.type.charAt(0).toUpperCase() + toast.type.slice(1)}`]}`}>
                        {toast.message}
                    </div>
                </div>
            )}
        </div>
    );
}

