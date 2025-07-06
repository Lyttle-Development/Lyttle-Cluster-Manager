import {faLink} from '@fortawesome/free-solid-svg-icons';
import {Icon} from '@/components/Icon';
import styles from './index.module.scss';

// This is now a server component
export async function CurrentNode() {
    let currentNode: string | null = null;

    // Safely construct the base URL
    const url = `http://localhost:1111/api/command?command=cat%20/etc/hostname&token=${process.env.API_TOKEN}`;

    try {
        const response = await fetch(url, {
            cache: 'no-store'
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();

        if (data.error) {
            throw new Error(data.error);
        }
        if (data.output) {
            currentNode = data.output.trim();
        } else {
            currentNode = 'Unknown Node';
        }
    } catch {
        currentNode = 'Error fetching node';
    }

    return (
        <article className={styles.currentNode}
                 title="Currently connected to node.">
            <Icon icon={faLink}
                  className={styles.icon}
                  childrenClassName={styles.text}>
                {currentNode || 'Unknown Node'}
            </Icon>
        </article>
    );
}