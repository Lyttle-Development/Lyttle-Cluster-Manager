import styles from './page.module.scss';
import {Clusters} from '@/components/Clusters';

export default function Home() {
    return (
        <div className={styles.page}>
            <Clusters/>
        </div>
    );
}
