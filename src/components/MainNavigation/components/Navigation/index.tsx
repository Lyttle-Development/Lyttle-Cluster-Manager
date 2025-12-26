'use client';

import Link from 'next/link';
import {usePathname} from 'next/navigation';
import styles from './index.module.scss';

/**
 * Top horizontal navigation bar (left-aligned).
 * - Sticky at the top
 * - Highlights active route
 * - Wraps on small screens
 */
export function Navigation() {
    const pathname = usePathname();
    const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href));

    return (
        <header className={styles.header}>
            <nav className={styles.nav} aria-label="Primary">
                <ul className={styles.list}>
                    <li className={styles.item}>
                        <Link
                            href="/"
                            className={`${styles.link} ${isActive('/') && !isActive('/nginx') && !isActive('/certificates') && !isActive('/cluster') ? styles.active : ''}`}
                            aria-current={isActive('/') && !isActive('/nginx') && !isActive('/certificates') && !isActive('/cluster') ? 'page' : undefined}
                        >
                            Dashboard
                        </Link>
                    </li>
                    <li className={styles.item}>
                        <Link
                            href="/cluster"
                            className={`${styles.link} ${isActive('/cluster') ? styles.active : ''}`}
                            aria-current={isActive('/cluster') ? 'page' : undefined}
                        >
                            Cluster
                        </Link>
                    </li>
                    <li className={styles.item}>
                        <Link
                            href="/nginx"
                            className={`${styles.link} ${isActive('/nginx') ? styles.active : ''}`}
                            aria-current={isActive('/nginx') ? 'page' : undefined}
                        >
                            Proxy
                        </Link>
                    </li>
                    <li className={styles.item}>
                        <Link
                            href="/certificates"
                            className={`${styles.link} ${isActive('/certificates') ? styles.active : ''}`}
                            aria-current={isActive('/certificates') ? 'page' : undefined}
                        >
                            Certificates
                        </Link>
                    </li>
                </ul>
            </nav>
        </header>
    );
}