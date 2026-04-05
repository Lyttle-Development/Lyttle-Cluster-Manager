"use client";

import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {
    cn,
    Container,
    NavigationMenu,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    Surface,
    navigationMenuTriggerStyle,
} from '@lyttle-development/ui';
import {
    Boxes,
    FolderKanban,
    LayoutDashboard,
    Network,
    ShieldCheck,
} from 'lucide-react';
import {CurrentNode} from '@/components/CurrentNode';
import {LoginUser} from '@/components/LoginUser';
import {Logo} from '@/components/Logo';
import styles from './index.module.scss';

const navigationItems = [
    {href: '/', label: 'Dashboard', icon: LayoutDashboard},
    {href: '/cluster', label: 'Cluster', icon: Boxes},
    {href: '/nginx', label: 'Proxy', icon: Network},
    {href: '/certificates', label: 'Certificates', icon: ShieldCheck},
    {href: '/application', label: 'Applications', icon: FolderKanban},
];

function isActivePath(pathname: string, href: string) {
    return href === '/' ? pathname === '/' : pathname.startsWith(href);
}

export function MainNavigation() {
    const pathname = usePathname();

    return (
        <div className={styles.shell}>
            <Surface as="header" className={styles.topBar} padding="md" radius="lg" shadow="none">
                <Container size="7xl" padding="lg">
                    <div className={styles.topBarInner}>
                        <Link href="/" className={styles.brand} aria-label="Open dashboard home">
                            <Logo className={styles.logo}/>
                        </Link>
                        <div className={styles.topBarMeta}>
                            <CurrentNode/>
                            <LoginUser/>
                        </div>
                    </div>
                </Container>
            </Surface>

            <Container size="7xl" padding="lg">
                <NavigationMenu className={styles.navigation}>
                    <NavigationMenuList>
                        {navigationItems.map(({href, label, icon: Icon}) => {
                            const active = isActivePath(pathname, href);

                            return (
                                <NavigationMenuItem key={href}>
                                    <NavigationMenuLink
                                        href={href}
                                        aria-current={active ? 'page' : undefined}
                                        className={cn(
                                            navigationMenuTriggerStyle(),
                                            styles.navLink,
                                            active && styles.navLinkActive,
                                        )}
                                    >
                                        <Icon className={styles.navIcon} aria-hidden="true"/>
                                        <span>{label}</span>
                                    </NavigationMenuLink>
                                </NavigationMenuItem>
                            );
                        })}
                    </NavigationMenuList>
                </NavigationMenu>
            </Container>
        </div>
    );
}
