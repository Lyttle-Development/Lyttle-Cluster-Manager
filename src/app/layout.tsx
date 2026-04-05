import type {Metadata} from 'next';
import {Poppins} from 'next/font/google';
import './globals.scss';
import {Container, Heading, Stack, Surface, Text, Toaster, TooltipProvider} from '@lyttle-development/ui';
import styles from './layout.module.scss';
import {MainNavigation} from '@/components/MainNavigation';
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
            <html lang="en">
            <body className={`${poppins.className} ${styles.body}`}>
            <Container className={styles.centered} size="md" padding="lg">
                <Surface padding="lg" radius="xl" shadow="md">
                    <Stack gap="sm" align="start">
                        <Text as="p" size="sm" tone="muted" transform="uppercase">Access restricted</Text>
                        <Heading size="2xl">You are not allowed to access this application.</Heading>
                        <Text tone="muted">
                            Sign in with an approved Google account to continue.
                        </Text>
                    </Stack>
                </Surface>
            </Container>
            </body>
            </html>
        );
    }

    return (
        <html lang="en">
        <body className={`${poppins.className} ${styles.body}`}>
        <TooltipProvider>
            <MainNavigation/>
            <main id="main-content" className={styles.main}>
                {children}
            </main>
            <Toaster/>
        </TooltipProvider>
        </body>
        </html>
    );
}
