/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    turbopack: {},
    webpack: (config) => {
        config.externals.push('better-sqlite3');
        return config;
    },
};

export default nextConfig;
