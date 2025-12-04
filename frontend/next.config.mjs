/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    turbopack: {},

    serverExternalPackages: ['express', 'cors', 'better-sqlite3'],
    webpack: (config) => {
        config.externals.push('better-sqlite3');
        return config;
    },
};

export default nextConfig;
