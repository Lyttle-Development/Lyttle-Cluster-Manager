import {Logo} from '@/components/Logo';
import styles from './index.module.scss';
import {CurrentNode} from '@/components/CurrentNode';
import {LoginUser} from '@/components/LoginUser';

export function Header() {
    return (
        <header className={styles.header}>
            <Logo/>
            <CurrentNode/>
            <LoginUser/>
        </header>
    );
}
