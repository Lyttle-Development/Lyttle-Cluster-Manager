import styles from './index.module.scss';
import {Node} from '@/components/Clusters/components/Cluster';

interface ClustersProps {
    className?: string;
}

export function Clusters({}: ClustersProps) {
    const clusterHosts = process.env.ALLOWED_CLUSTER_HOSTS ?
        process.env.ALLOWED_CLUSTER_HOSTS.split(';') : [];

    return (
        <div className={styles.page}>
            <div className={styles.nodes}>
                {clusterHosts.length > 0 ? (
                    clusterHosts.map((host, index) => {
                        if (!host) {
                            return null; // Skip empty hosts
                        }
                        return (
                            <Node
                                key={index}
                                host={host}
                            />
                        );
                    })
                ) : (
                    <p>No nodes available</p>
                )}
            </div>
        </div>
    );
}
