'use client';
import styles from './index.module.scss';
import classNames from 'classnames';
import {Icon} from '@/components/Icon';
import {
    faCog,
    faRepeat,
    faRoute,
    faServer,
    faStopwatch
} from '@fortawesome/free-solid-svg-icons';
import {faDocker} from '@fortawesome/free-brands-svg-icons';
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
        <section className={styles.node}>
            <article className={styles.heading}>
                <h3 className={styles.hostname}>{hostname}</h3>
                <span
                    className={classNames(styles.status, {
                        [styles.green]: status === 'running',
                        [styles.red]: status === 'offline',
                        [styles.yellow]: ['rebooting', 'loading', 'reloading'].includes(status),
                    })}
                    title={`Currently ${status}`}
                />
            </article>
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
                                      title="Currently routes NGINX requests"></Icon>
                            )}
                            {node?.containers.find((c) => c.name.includes('portainer_portainer')) && (
                                <Icon icon={faServer}
                                      title="Currently routes Portainer UI requests"></Icon>
                            )}
                        </article>
                        <article className={styles.actions}>
                            <button
                                onClick={() => sendCommand('reboot', 'rebooting')}
                                title="Reboot">
                                <Icon icon={faRepeat} className={styles.icon}/>
                            </button>
                            <button onClick={onSettings} title="Settings">
                                <Icon icon={faCog} className={styles.icon}/>
                            </button>
                        </article>
                    </section>
                </>
            )}
        </section>
    );
}