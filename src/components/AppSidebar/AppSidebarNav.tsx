'use client';

import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@lyttle-development/ui';
import {LayoutDashboardIcon, ServerIcon, RouteIcon, ShieldCheckIcon, AppWindowIcon} from 'lucide-react';

const navItems = [
    {href: '/', label: 'Dashboard', icon: LayoutDashboardIcon},
    {href: '/cluster', label: 'Cluster', icon: ServerIcon},
    {href: '/nginx', label: 'Proxy', icon: RouteIcon},
    {href: '/certificates', label: 'Certificates', icon: ShieldCheckIcon},
    {href: '/application', label: 'Application', icon: AppWindowIcon},
];

export function AppSidebarNav() {
    const pathname = usePathname();

    const isActive = (href: string) =>
        href === '/'
            ? pathname === '/'
            : pathname.startsWith(href);

    return (
        <SidebarGroup>
            <SidebarGroupLabel>Navigation</SidebarGroupLabel>
            <SidebarGroupContent>
                <SidebarMenu>
                    {navItems.map(({href, label, icon: Icon}) => (
                        <SidebarMenuItem key={href}>
                            <SidebarMenuButton
                                render={<Link href={href}/>}
                                isActive={isActive(href)}
                                tooltip={label}
                            >
                                <Icon/>
                                <span>{label}</span>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    ))}
                </SidebarMenu>
            </SidebarGroupContent>
        </SidebarGroup>
    );
}

