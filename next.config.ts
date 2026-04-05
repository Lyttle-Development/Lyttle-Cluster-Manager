import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
    transpilePackages: ['@lyttle-development/ui'],
    images: {
        remotePatterns: [new URL('https://**.googleusercontent.com/**')],
    },
};

export default nextConfig;
