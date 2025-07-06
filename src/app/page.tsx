import styles from './page.module.scss';
import {Clusters} from '@/app/components/Clusters';

export default function Home() {
    return (
        <div className={styles.page}>
            <Clusters/>
        </div>
    );
}
