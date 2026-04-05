import {Button, Container, Empty, Stack, Text} from '@lyttle-development/ui';
import Link from 'next/link';

export default function Application() {
    return (
        <Container size="7xl" padding="lg">
            <Empty
                title="Application management is coming soon"
                description="Use the existing cluster, proxy, and certificate sections while the shared application workflows are being designed."
            >
                <Stack gap="sm" align="center">
                    <Text size="sm" tone="muted">Need something right now?</Text>
                    <Button asChild variant="outline">
                        <Link href="/">Return to dashboard</Link>
                    </Button>
                </Stack>
            </Empty>
        </Container>
    );
}
