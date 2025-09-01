'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
              className={`${styles.link} ${isActive('/') ? styles.active : ''}`}
              aria-current={isActive('/') ? 'page' : undefined}
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
              Nginx
            </Link>
          </li>
        </ul>
      </nav>
    </header>
  );
}