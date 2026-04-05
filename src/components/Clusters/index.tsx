import styles from './index.module.scss';
import {Node} from '@/components/Clusters/components/Node';

interface ClustersProps {
    className?: string;
}

export function Clusters({}: ClustersProps) {
    const clusterHosts = process.env.ALLOWED_CLUSTER_HOSTS ?
        process.env.ALLOWED_CLUSTER_HOSTS.split(';') : [];

    return (
        <div>
            <h2 style={{marginBottom: '1rem', fontSize: '1.5rem', fontWeight: 700}}>
                Dashboard
            </h2>
            <div className={styles.nodes}>
                {clusterHosts.length > 0 ? (
                    clusterHosts.map((host, index) => {
                        if (!host) return null;
                        return <Node key={index} host={host}/>;
                    })
                ) : (
                    <p style={{color: 'var(--muted-foreground)'}}>No nodes available</p>
                )}
            </div>
        </div>
    );
}
