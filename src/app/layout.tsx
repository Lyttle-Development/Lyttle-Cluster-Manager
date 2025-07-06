import type {Metadata} from 'next';
import {Poppins} from 'next/font/google';
import './reset.scss';

const poppins = Poppins({
    subsets: ['latin'],
    weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
    variable: '--font-poppins',
});

export const metadata: Metadata = {
    title: 'Lyttle Cluster Manager',
    description: 'Manage your Docker Swarm clusters with ease using our intuitive web interface.',
};

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
        <body className={`${poppins.variable}`}>
        {children}
        </body>
        </html>
    );
}
