import {Logo} from '@/app/components/Logo';
import styles from './index.module.scss';
import {CurrentNode} from '@/app/components/CurrentNode';
import {LoginUser} from '@/app/components/LoginUser';

export function Header() {
    return (
        <header className={styles.header}>
            <Logo/>
            <CurrentNode/>
            <LoginUser/>
        </header>
    );
}
