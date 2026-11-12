/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  // better-sqlite3 is a native Node module — must not be bundled by webpack
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Keep native modules external so Node can load them directly
      config.externals = [...(config.externals || []), 'better-sqlite3'];
    }
    return config;
  },
  // Suppress the punycode deprecation warning from dependencies
  experimental: {
    serverComponentsExternalPackages: ['better-sqlite3'],
  },
};

module.exports = nextConfig;
