'use client';
import styles from './index.module.scss';
import {NodeResponse} from '@/app/api/node/route';
import {useEffect, useState} from 'react';
import classNames from 'classnames';

export interface NodeProps {
    host: string; // Replace 'any' with the actual type of your node
}

export function Node({host}: NodeProps) {
    const [node, setNode] = useState<NodeResponse | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const fetchNodeData = async () => {
            try {
                const response = await fetch(`/api/node/${host}`);
                if (!response.ok) {
                    throw new Error(`Failed to fetch data for host: ${host}`);
                }
                const data: NodeResponse = await response.json();
                setNode(data);
            } catch (error) {
                console.error('Error fetching node data:', error);
            } finally {
                setLoading(false);
            }
        };

        void fetchNodeData();
    }, [host]);

    if (loading) {
        return <div
            className={classNames(styles.node, styles.loading)}>Loading...</div>;
    }

    if (!node) {
        return <div className={classNames(styles.node, styles.error)}>Node data
            not available</div>;
    }

    const onReboot = async () => {
        // Ask for confirmation before rebooting
        const confirmed = window.confirm(`Are you sure you want to reboot ${node.hostname}?`);
        if (confirmed) {
            try {
                const response = await fetch(`/api/command/${host}?command=reboot`, {
                    method: 'GET',
                });
                if (!response.ok) {
                    throw new Error(`Failed to reboot node: ${node.hostname}`);
                }
                alert(`Node ${node.hostname} is rebooting...`);
            } catch (error) {
                console.error('Error rebooting node:', error);
                alert('Failed to reboot node. Please try again later.');
            }
        }
    };

    return (
        <div className={styles.node}>
            <p><strong>Name</strong>: {node?.hostname}</p>
            <p><strong>OS</strong>: {node?.os?.name} {node?.os?.version}</p>
            <p><strong>Uptime</strong>: {node?.uptime?.currentTime}</p>
            <p><strong>Containers</strong>: {node?.containers?.length}</p>
            <button onClick={onReboot}>Reboot</button>
        </div>
    );
}
