/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/:path*`,
      },
    ];
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },

  // Disable ESLint during build if it causes issues
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Disable TypeScript checking during build if it causes issues
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
