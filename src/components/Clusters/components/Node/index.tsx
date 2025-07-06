'use client';
import styles from './index.module.scss';
import {NodeResponse} from '@/app/api/node/route';
import {useEffect, useState} from 'react';
import classNames from 'classnames';
import {Icon} from '@/components/Icon';
import {faCog, faRepeat, faStopwatch} from '@fortawesome/free-solid-svg-icons';
import {faDocker} from '@fortawesome/free-brands-svg-icons';
import {OsIcon} from '@/components/Icon/components/OsIcon';

export interface NodeProps {
    host: string; // Replace 'any' with the actual type of your node
}

export function Node({host}: NodeProps) {
    const [node, setNode] = useState<NodeResponse | null>(null);
    const [cachedNode, setCachedNode] = useState<NodeResponse | null>(null);
    const [status, setStatus] = useState<string>('loading');

    useEffect(() => {
        const fetchNodeData = async () => {
            try {
                const response = await fetch(`/api/node/${host}`);
                if (!response.ok) {
                    throw new Error(`Failed to fetch data for host: ${host}`);
                }
                const data: NodeResponse = await response.json();
                setNode(data);
                setStatus(!!data ? 'running' : 'offline');
            } catch (error) {
                console.error('Error fetching node data:', error);
            }
        };

        void fetchNodeData();
    }, [host]);

    useEffect(() => {
        if (node) {
            setCachedNode(node);
        } else {
            // try to refetch them while status is rebooting
            const interval = setInterval(() => {
                void fetch(`/api/node/${host}`)
                    .then(response => response.json())
                    .then(data => {
                        if (data) {
                            setNode(data);
                            setStatus('running');
                            clearInterval(interval);
                        }
                    })
                    .catch(() => null);
            }, 5000); // Retry every 5 seconds
            return () => clearInterval(interval);
        }
    }, [node]);

    const onReboot = async () => {
        // Ask for confirmation before rebooting
        const confirmed = window.confirm(`Are you sure you want to reboot ${node?.hostname}?`);
        if (confirmed) {
            try {
                const response = await fetch(`/api/command/${host}?command=reboot`, {
                    method: 'GET',
                });
                if (!response.ok) {
                    throw new Error(`Failed to reboot node: ${node?.hostname}`);
                }
                setStatus('rebooting');
                setNode(null);
            } catch (error) {
                console.error('Error rebooting node:', error);
                alert('Failed to reboot node. Please try again later.');
            }
        }
    };

    const onSettings = () => {
        // Placeholder for settings action
        alert(`Settings for node ${node?.hostname} are not implemented yet.`);
    };

    return (
        <section className={styles.node}>
            <article className={styles.heading}>
                <h3 className={styles.hostname}>{cachedNode?.hostname || 'Unknown host'}</h3>
                <span
                    className={classNames(styles.status, {
                        [styles.green]: status === 'running',
                        [styles.red]: status === 'offline',
                        [styles.yellow]: ['rebooting', 'loading'].includes(status),
                    })}
                    title={`Currently ${status}`}
                />
            </article>
            <p className={styles.iconCombi}>
                <Icon icon={faStopwatch} className={styles.icon}/>
                <span>{node?.uptime?.up || (status !== 'rebooting' ? 'Unavailable' : 'Rebooting')}</span>
            </p>
            <p className={styles.iconCombi}>
                <Icon icon={faDocker} className={styles.icon}/>
                <span>{node?.containers?.length || '0'} active containers</span>
            </p>
            <section className={styles.quickActions}>
                <article className={styles.info}>
                    <OsIcon os={node?.os?.id}
                            title={`Node is running ${cachedNode?.os?.name} ${cachedNode?.os?.version}`}/>
                </article>
                <article className={styles.actions}>
                    <button onClick={onReboot} title="Reboot">
                        <Icon icon={faRepeat} className={styles.icon}/>
                    </button>
                    <button onClick={onSettings} title="Settings">
                        <Icon icon={faCog} className={styles.icon}/>
                    </button>
                </article>
            </section>
        </section>
    );
}
