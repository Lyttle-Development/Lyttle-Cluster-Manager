import type {Metadata} from 'next';
import {Poppins} from 'next/font/google';
import './globals.scss';
import {SidebarProvider, SidebarInset} from '@lyttle-development/ui';
import {AppSidebar} from '@/components/AppSidebar';
import {checkGoogle} from '@/app/api/auth/google';

const poppins = Poppins({
    subsets: ['latin'],
    weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
    variable: '--font-poppins',
});

export const metadata: Metadata = {
    title: 'Lyttle Cluster Manager',
    description: 'Manage your Docker Swarm clusters with ease using our intuitive web interface.',
};

export default async function RootLayout({
                                             children,
                                         }: Readonly<{
    children: React.ReactNode;
}>) {
    if (!await checkGoogle()) {
        return (
            <html lang="en" className={`dark ${poppins.variable}`}>
            <body>
            <p>You are not allowed to access this application.</p>
            </body>
            </html>
        );
    }

    return (
        <html lang="en" className={`dark ${poppins.variable}`}>
        <body>
        <SidebarProvider>
            <AppSidebar/>
            <SidebarInset>
                {children}
            </SidebarInset>
        </SidebarProvider>
        </body>
        </html>
    );
}
