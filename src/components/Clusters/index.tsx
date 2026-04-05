import {Empty, Grid, Heading, Stack, Text} from '@lyttle-development/ui';
import {Node} from '@/components/Clusters/components/Node';

interface ClustersProps {
    className?: string;
}

export function Clusters({}: ClustersProps) {
    const clusterHosts = process.env.ALLOWED_CLUSTER_HOSTS ?
        process.env.ALLOWED_CLUSTER_HOSTS.split(';') : [];
    const filteredHosts = clusterHosts.filter(Boolean);

    return (
        <Stack gap="lg" align="start">
            <Stack gap="xs" align="start">
                <Heading size="3xl">Cluster dashboard</Heading>
                <Text tone="muted">
                    Live status for each configured swarm host, powered by the shared design system.
                </Text>
            </Stack>

            {filteredHosts.length > 0 ? (
                <Grid columns={1} mdColumns={2} lgColumns={4} gap="lg" style={{width: '100%'}}>
                    {filteredHosts.map((host) => (
                        <Node key={host} host={host}/>
                    ))}
                </Grid>
            ) : (
                <Empty
                    title="No nodes configured"
                    description="Set ALLOWED_CLUSTER_HOSTS to show cluster nodes on the dashboard."
                />
            )}
        </Stack>
    );
}
