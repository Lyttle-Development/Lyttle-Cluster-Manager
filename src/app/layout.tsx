import type {Metadata} from 'next';
import {Poppins} from 'next/font/google';
import '../styles/reset.scss';
import '../styles/defaults.scss';
import classNames from 'classnames';
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
            <body className={classNames(poppins.className, styles.body)}>
            <p>You are not allowed to access this application.</p>
            </body>
            </html>
        );
    }

    return (
        <html lang="en">
        <body className={classNames(poppins.className, styles.body)}>
        <MainNavigation/>
        <main className={styles.main}>
            {children}
        </main>
        </body>
        </html>
    );
}
