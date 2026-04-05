import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarRail,
    SidebarSeparator,
} from '@lyttle-development/ui';
import {Logo} from '@/components/Logo';
import {CurrentNode} from '@/components/CurrentNode';
import {LoginUser} from '@/components/LoginUser';
import {AppSidebarNav} from './AppSidebarNav';
import styles from './index.module.scss';

export function AppSidebar() {
    return (
        <Sidebar collapsible="icon">
            <SidebarHeader className={styles.header}>
                <div className={styles.logo}>
                    <Logo/>
                </div>
            </SidebarHeader>
            <SidebarContent>
                <AppSidebarNav/>
            </SidebarContent>
            <SidebarSeparator/>
            <SidebarFooter className={styles.footer}>
                <CurrentNode/>
                <LoginUser/>
            </SidebarFooter>
            <SidebarRail/>
        </Sidebar>
    );
}

