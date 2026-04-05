import {Badge, Inline, Surface, Text} from '@lyttle-development/ui';
import {Link2} from 'lucide-react';

// This is now a server component
export async function CurrentNode() {
    let currentNode: string;

    // Safely construct the base URL
    const url = `http://localhost:1111/api/command?command=cat%20/etc/hostname&token=${process.env.API_TOKEN}`;

    try {
        const response = await fetch(url, {
            cache: 'no-store'
        });

        if (!response.ok) {
            currentNode = 'Error fetching node';
        } else {
            const data = await response.json();

            if (data.error) {
                currentNode = 'Error fetching node';
            } else if (data.output) {
                currentNode = data.output.trim();
            } else {
                currentNode = 'Unknown Node';
            }
        }
    } catch {
        currentNode = 'Error fetching node';
    }

    if (!currentNode) {
        currentNode = 'Unknown Node';
    }

    return (
        <Surface as="article" padding="sm" radius="lg" shadow="none" tone="secondary" title="Currently connected to node.">
            <Inline gap="xs" wrap={false}>
                <Badge variant="outline">
                    <Inline as="span" gap="xs" wrap={false}>
                        <Link2 size={14} aria-hidden="true"/>
                        <span>Active node</span>
                    </Inline>
                </Badge>
                <Text as="span" size="sm" weight="medium" transform="uppercase">
                    {currentNode}
                </Text>
            </Inline>
        </Surface>
    );
}