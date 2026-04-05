'use client';
import {
    Badge,
    Button,
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
    Inline,
    Stack,
    Text,
} from '@lyttle-development/ui';
import {
    Boxes,
    Gauge,
    Network,
    RefreshCcw,
    Server,
    Settings2,
} from 'lucide-react';
import {useNode} from '@/hooks/useNode';

export interface NodeProps {
    host: string;
}

export function Node({host}: NodeProps) {
    const {node, cachedNode, status, sendCommand} = useNode(host);

    const onSettings = () => {
        alert(`Settings for node ${node?.hostname} are not implemented yet.`);
    };

    let hostname = status === 'loading' ? 'Loading...' : 'Unknown host';

    if (cachedNode && cachedNode?.hostname) {
        hostname = cachedNode.hostname;
    }

    const formattedStatus = status.charAt(0).toUpperCase() + status.slice(1);
    const statusVariant = status === 'running'
        ? 'success'
        : status === 'offline'
            ? 'destructive'
            : 'warning';
    const canShowDetails = (status === 'running' || status === 'reloading') && !!node;
    const osLabel = [cachedNode?.os?.name, cachedNode?.os?.version].filter(Boolean).join(' ');
    const routesNginx = node?.containers.find((container) => container.name.includes('lyttle-nginx'));
    const routesPortainer = node?.containers.find((container) => container.name.includes('portainer_portainer'));

    return (
        <Card>
            <CardHeader>
                <Inline justify="between" align="start" gap="sm" wrap={false}>
                    <Stack gap="xs" align="start" style={{minWidth: 0, flex: 1}}>
                        <CardTitle>{hostname}</CardTitle>
                        <CardDescription>{host}</CardDescription>
                    </Stack>
                    <Badge variant={statusVariant} title={`Currently ${status}`}>
                        {formattedStatus}
                    </Badge>
                </Inline>
            </CardHeader>

            <CardContent>
                <Stack gap="sm" align="start">
                    <Inline gap="xs" wrap={false}>
                        <Gauge size={16} aria-hidden="true"/>
                        <Text as="span" size="sm">{node?.uptime?.up || formattedStatus}</Text>
                    </Inline>

                    {canShowDetails && (
                        <>
                            <Inline gap="xs" wrap={false}>
                                <Boxes size={16} aria-hidden="true"/>
                                <Text as="span" size="sm">{node?.containers?.length || 0} active containers</Text>
                            </Inline>

                            <Inline gap="xs">
                                {osLabel && <Badge variant="secondary">{osLabel}</Badge>}
                                {routesNginx && (
                                    <Badge variant="info">
                                        <Inline as="span" gap="xs" wrap={false}>
                                            <Network size={14} aria-hidden="true"/>
                                            <span>Nginx router</span>
                                        </Inline>
                                    </Badge>
                                )}
                                {routesPortainer && (
                                    <Badge variant="brand">
                                        <Inline as="span" gap="xs" wrap={false}>
                                            <Server size={14} aria-hidden="true"/>
                                            <span>Portainer</span>
                                        </Inline>
                                    </Badge>
                                )}
                            </Inline>
                        </>
                    )}
                </Stack>
            </CardContent>

            <CardFooter>
                <Inline justify="between" gap="sm" style={{width: '100%'}}>
                    <Text as="span" size="xs" tone="muted">Status updates poll automatically.</Text>
                    <Inline gap="xs" wrap={false}>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => sendCommand('reboot', 'rebooting')}
                            disabled={!canShowDetails}
                        >
                            <RefreshCcw size={16} aria-hidden="true"/>
                            Reboot
                        </Button>
                        <Button variant="ghost" size="icon-sm" onClick={onSettings} title="Settings">
                            <Settings2 size={16} aria-hidden="true"/>
                        </Button>
                    </Inline>
                </Inline>
            </CardFooter>
        </Card>
    );
}