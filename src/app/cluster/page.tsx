'use client';

import {useEffect, useState} from 'react';
import {
    Badge,
    Button,
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
    Container,
    Empty,
    Grid,
    Heading,
    Inline,
    Stack,
    Surface,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
    Text,
} from '@lyttle-development/ui';
import {Crown, RefreshCcw, ShieldCheck, Trash2, Users} from 'lucide-react';
import {toast} from 'sonner';

interface ClusterNode {
    id: string;
    hostname: string;
    instanceId: string;
    ipAddress: string | null;
    isLeader: boolean;
    lastHeartbeat: string;
    status: string;
    version: string | null;
    metadata: unknown;
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

function formatDate(dateString: string) {
    return new Date(dateString).toLocaleString();
}

function timeSince(dateString: string) {
    const now = new Date();
    const then = new Date(dateString);
    const diffSec = Math.floor((now.getTime() - then.getTime()) / 1000);

    if (diffSec < 60) return `${diffSec}s ago`;
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    return `${Math.floor(diffSec / 86400)}d ago`;
}

function statusVariant(status: string) {
    switch (status) {
        case 'active':
        case 'healthy':
            return 'success' as const;
        case 'failed':
            return 'destructive' as const;
        case 'inactive':
            return 'muted' as const;
        default:
            return 'warning' as const;
    }
}

export default function ClusterPage() {
    const [nodes, setNodes] = useState<ClusterNode[]>([]);
    const [stats, setStats] = useState<ClusterStats | null>(null);
    const [leaderStatus, setLeaderStatus] = useState<LeaderStatus | null>(null);
    const [loading, setLoading] = useState(false);

    const refresh = async () => {
        try {
            const [nodesRes, statsRes, leaderRes] = await Promise.all([
                fetch('/api/cluster/nodes', {cache: 'no-store'}),
                fetch('/api/cluster/stats', {cache: 'no-store'}),
                fetch('/api/cluster/leader/status', {cache: 'no-store'}),
            ]);

            if (nodesRes.ok) {
                const nodesData = await nodesRes.json();
                setNodes(nodesData.nodes || []);
            }

            if (statsRes.ok) {
                setStats(await statsRes.json());
            }

            if (leaderRes.ok) {
                setLeaderStatus(await leaderRes.json());
            }
        } catch (error) {
            console.error('Failed to refresh cluster data:', error);
            toast.error('Failed to refresh cluster data');
        }
    };

    useEffect(() => {
        refresh();
        const interval = setInterval(refresh, 5000);
        return () => clearInterval(interval);
    }, []);

    const handleClusterAction = async (
        url: string,
        fallbackError: string,
        successPrefix?: string,
    ) => {
        setLoading(true);

        try {
            const response = await fetch(url);
            const data = await response.json().catch(() => null);

            if (!response.ok) {
                throw new Error(data?.message || fallbackError);
            }

            toast.success(successPrefix ? `${successPrefix}: ${data?.message ?? 'Done'}` : data?.message ?? 'Completed');
            await refresh();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : fallbackError);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container size="7xl" padding="lg">
            <Stack gap="lg" align="start">
                <Stack gap="xs" align="start">
                    <Heading size="3xl">Cluster management</Heading>
                    <Text tone="muted">
                        Monitor node health, review leader coordination, and run cluster maintenance actions.
                    </Text>
                </Stack>

                {stats && (
                    <Grid columns={1} mdColumns={2} lgColumns={4} gap="lg" style={{width: '100%'}}>
                        {[
                            {
                                label: 'Total nodes',
                                value: stats.totalNodes,
                                description: `${stats.leaders.length} leader record${stats.leaders.length === 1 ? '' : 's'}`,
                            },
                            {
                                label: 'Active nodes',
                                value: stats.activeNodes,
                                description: 'Online and responding',
                            },
                            {
                                label: 'Inactive nodes',
                                value: stats.inactiveNodes,
                                description: 'Offline or stale',
                            },
                            {
                                label: 'Failed nodes',
                                value: stats.failedNodes,
                                description: 'Marked as failed',
                            },
                        ].map((item) => (
                            <Card key={item.label}>
                                <CardHeader>
                                    <CardDescription>{item.label}</CardDescription>
                                    <CardTitle>{item.value}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <Text size="sm" tone="muted">{item.description}</Text>
                                </CardContent>
                            </Card>
                        ))}
                    </Grid>
                )}

                {leaderStatus && (
                    <Card style={{width: '100%'}}>
                        <CardHeader>
                            <Inline justify="between" gap="sm">
                                <Stack gap="xs" align="start">
                                    <CardTitle>Leader status</CardTitle>
                                    <CardDescription>Current leader lock and coordination health.</CardDescription>
                                </Stack>
                                <Badge variant={leaderStatus.status === 'healthy' ? 'success' : 'warning'}>
                                    {leaderStatus.status}
                                </Badge>
                            </Inline>
                        </CardHeader>
                        <CardContent>
                            <Stack gap="lg" align="start">
                                {leaderStatus.dbLeader ? (
                                    <Grid columns={1} mdColumns={2} gap="md" style={{width: '100%'}}>
                                        <Surface padding="md" tone="secondary" radius="lg" shadow="none">
                                            <Stack gap="xs" align="start">
                                                <Text size="xs" tone="muted" transform="uppercase">Hostname</Text>
                                                <Text weight="semibold">{leaderStatus.dbLeader.hostname}</Text>
                                            </Stack>
                                        </Surface>
                                        <Surface padding="md" tone="secondary" radius="lg" shadow="none">
                                            <Stack gap="xs" align="start">
                                                <Text size="xs" tone="muted" transform="uppercase">Instance ID</Text>
                                                <Text mono size="sm">{leaderStatus.dbLeader.instanceId}</Text>
                                            </Stack>
                                        </Surface>
                                        <Surface padding="md" tone="secondary" radius="lg" shadow="none">
                                            <Stack gap="xs" align="start">
                                                <Text size="xs" tone="muted" transform="uppercase">IP address</Text>
                                                <Text>{leaderStatus.dbLeader.ipAddress || 'N/A'}</Text>
                                            </Stack>
                                        </Surface>
                                        <Surface padding="md" tone="secondary" radius="lg" shadow="none">
                                            <Stack gap="xs" align="start">
                                                <Text size="xs" tone="muted" transform="uppercase">Last heartbeat</Text>
                                                <Text>{formatDate(leaderStatus.dbLeader.lastHeartbeat)}</Text>
                                                <Text size="sm" tone="muted">{timeSince(leaderStatus.dbLeader.lastHeartbeat)}</Text>
                                            </Stack>
                                        </Surface>
                                    </Grid>
                                ) : (
                                    <Empty
                                        title="No active leader found"
                                        description="The cluster currently has no active leader record in the database."
                                        icon={<Crown size={36} aria-hidden="true"/>}
                                    />
                                )}

                                {leaderStatus.lockHolder && (
                                    <Surface padding="md" tone="secondary" radius="lg" shadow="none" style={{width: '100%'}}>
                                        <Inline justify="between" gap="md">
                                            <Stack gap="xs" align="start">
                                                <Text size="xs" tone="muted" transform="uppercase">Lock holder</Text>
                                                <Text mono size="sm">{leaderStatus.lockHolder.instanceId}</Text>
                                            </Stack>
                                            <Stack gap="xs" align="end">
                                                <Text size="xs" tone="muted" transform="uppercase">Held for</Text>
                                                <Text>{Math.round(leaderStatus.lockHolder.heldForMs / 1000)}s</Text>
                                            </Stack>
                                        </Inline>
                                    </Surface>
                                )}

                                {leaderStatus.issues.length > 0 && (
                                    <Surface padding="md" tone="accent" radius="lg" shadow="none" style={{width: '100%'}}>
                                        <Stack gap="sm" align="start">
                                            <Inline gap="xs" wrap={false}>
                                                <ShieldCheck size={16} aria-hidden="true"/>
                                                <Text weight="semibold">Issues detected</Text>
                                            </Inline>
                                            <Stack as="ul" gap="xs" align="start" style={{margin: 0, paddingInlineStart: '1.25rem'}}>
                                                {leaderStatus.issues.map((issue) => (
                                                    <li key={issue}>
                                                        <Text tone="muted">{issue.replace(/_/g, ' ')}</Text>
                                                    </li>
                                                ))}
                                            </Stack>
                                        </Stack>
                                    </Surface>
                                )}
                            </Stack>
                        </CardContent>
                        <CardFooter>
                            <Inline gap="sm">
                                <Button
                                    variant="outline"
                                    onClick={() => handleClusterAction('/api/cluster/admin/cleanup', 'Failed to cleanup stale nodes', 'Cleanup complete')}
                                    disabled={loading}
                                >
                                    <Trash2 size={16} aria-hidden="true"/>
                                    Cleanup stale nodes
                                </Button>
                                <Button
                                    variant="brand"
                                    onClick={() => handleClusterAction('/api/cluster/admin/enforce-leader', 'Failed to enforce leader')}
                                    disabled={loading}
                                >
                                    <Crown size={16} aria-hidden="true"/>
                                    Enforce single leader
                                </Button>
                                <Button
                                    onClick={() => handleClusterAction('/api/cluster/admin/ensure-leader', 'Failed to ensure leader')}
                                    disabled={loading}
                                >
                                    <ShieldCheck size={16} aria-hidden="true"/>
                                    Ensure leader exists
                                </Button>
                            </Inline>
                        </CardFooter>
                    </Card>
                )}

                <Inline justify="between" gap="md" style={{width: '100%'}}>
                    <Stack gap="xs" align="start">
                        <Heading as="h2" size="xl">Cluster nodes</Heading>
                        <Text tone="muted">A live inventory of every registered node heartbeat.</Text>
                    </Stack>
                    <Button variant="secondary" onClick={refresh}>
                        <RefreshCcw size={16} aria-hidden="true"/>
                        Refresh
                    </Button>
                </Inline>

                {nodes.length === 0 ? (
                    <Empty
                        title="No cluster nodes found"
                        description="Nodes will appear here once they begin reporting heartbeats."
                        icon={<Users size={36} aria-hidden="true"/>}
                    />
                ) : (
                    <Card style={{width: '100%'}}>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Hostname</TableHead>
                                        <TableHead>Instance ID</TableHead>
                                        <TableHead>IP address</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Role</TableHead>
                                        <TableHead>Version</TableHead>
                                        <TableHead>Last heartbeat</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {nodes.map((node) => (
                                        <TableRow key={node.id}>
                                            <TableCell>{node.hostname}</TableCell>
                                            <TableCell>
                                                <Text as="span" size="sm" mono>{node.instanceId}</Text>
                                            </TableCell>
                                            <TableCell>{node.ipAddress || '-'}</TableCell>
                                            <TableCell>
                                                <Badge variant={statusVariant(node.status)}>{node.status}</Badge>
                                            </TableCell>
                                            <TableCell>
                                                {node.isLeader ? <Badge variant="brand">Leader</Badge> : <Badge variant="outline">Follower</Badge>}
                                            </TableCell>
                                            <TableCell>{node.version || '-'}</TableCell>
                                            <TableCell>
                                                <Stack gap="xs" align="start">
                                                    <Text size="sm">{formatDate(node.lastHeartbeat)}</Text>
                                                    <Text size="xs" tone="muted">{timeSince(node.lastHeartbeat)}</Text>
                                                </Stack>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                )}
            </Stack>
        </Container>
    );
}

