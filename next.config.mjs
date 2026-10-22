/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: process.env.BASEPATH,
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true, // This will ignore ESLint errors during build
  },
  webpack: (config, { isServer }) => {
    // Add fallbacks for Node.js modules that aren't available in the browser
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }

    // Transpile BlockNote packages to fix TipTap dependency issues
    config.module.rules.push({
      test: /\.(js|mjs)$/,
      include: /node_modules\/@blocknote/,
      type: 'javascript/auto',
      resolve: {
        fullySpecified: false,
      },
    });

    return config;
  },
  transpilePackages: ['@blocknote/core', '@blocknote/react', '@blocknote/mantine'],
}

export default nextConfig
