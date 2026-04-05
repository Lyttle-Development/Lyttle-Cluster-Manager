'use client';
import styles from './index.module.scss';
import {
    Button,
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    cn,
} from '@lyttle-development/ui';
import {
    faCog,
    faRepeat,
    faRoute,
    faServer,
    faStopwatch
} from '@fortawesome/free-solid-svg-icons';
import {faDocker} from '@fortawesome/free-brands-svg-icons';
import {Icon} from '@/components/Icon';
import {OsIcon} from '@/components/Icon/components/OsIcon';
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

    return (
        <Card className={styles.node}>
            <CardHeader className={styles.heading}>
                <CardTitle className={styles.hostname}>{hostname}</CardTitle>
                <span
                    className={cn(styles.status, {
                        [styles.green]: status === 'running',
                        [styles.red]: status === 'offline',
                        [styles.yellow]: ['rebooting', 'loading', 'reloading'].includes(status),
                    })}
                    title={`Currently ${status}`}
                />
            </CardHeader>
            <CardContent className={styles.cardContent}>
                <p className={styles.iconCombi}>
                    <Icon icon={faStopwatch} className={styles.icon}/>
                    <span>{node?.uptime?.up || formattedStatus}</span>
                </p>
                {(status === 'running' || status === 'reloading') && !!node && (
                    <>
                        <p className={styles.iconCombi}>
                            <Icon icon={faDocker} className={styles.icon}/>
                            <span>{node?.containers?.length || '0'} active containers</span>
                        </p>
                        <section className={styles.quickActions}>
                            <article className={styles.info}>
                                <OsIcon os={node?.os?.id}
                                        title={`Node is running ${cachedNode?.os?.name} ${cachedNode?.os?.version}`}/>
                                {node?.containers.find((c) => c.name.includes('lyttle-nginx')) && (
                                    <Icon icon={faRoute}
                                          title="Currently routes NGINX requests"/>
                                )}
                                {node?.containers.find((c) => c.name.includes('portainer_portainer')) && (
                                    <Icon icon={faServer}
                                          title="Currently routes Portainer UI requests"/>
                                )}
                            </article>
                            <article className={styles.actions}>
                                <Button
                                    variant="ghost"
                                    size="icon-sm"
                                    onClick={() => sendCommand('reboot', 'rebooting')}
                                    title="Reboot"
                                >
                                    <Icon icon={faRepeat} className={styles.icon}/>
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon-sm"
                                    onClick={onSettings}
                                    title="Settings"
                                >
                                    <Icon icon={faCog} className={styles.icon}/>
                                </Button>
                            </article>
                        </section>
                    </>
                )}
            </CardContent>
        </Card>
    );
}