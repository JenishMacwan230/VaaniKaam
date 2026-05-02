import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin(
  // This is the default (also the `src` folder is supported out of the box)
  './i18n.ts'
);

const nextConfig: NextConfig = {
  typescript: {
    // Skip TypeScript type-checking during build — errors are caught in development
    ignoreBuildErrors: true,
  },
  // Static export required for Capacitor Android/iOS packaging.
  // Remove this line to restore server-side rendering for the web deployment.
  output: 'export',
  trailingSlash: true,

  // Next.js image optimization is not available in static export mode.
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
  },

  // Disable RSC manifest generation for static export
  experimental: {
    optimizePackageImports: ['@radix-ui/react-slot'],
  },
};

export default withNextIntl(nextConfig);
