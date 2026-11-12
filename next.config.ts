import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // TypeScript configuration
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // React strict mode
  reactStrictMode: false,
  
  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    unoptimized: process.env.NETLIFY === 'true',
  },
  
  // Experimental features for Netlify
  experimental: {
    // Enable server actions
    serverActions: {
      allowedOrigins: ['*.netlify.app', 'localhost:3000'],
    },
  },
  
  // Environment variables exposed to client
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'https://groway.netlify.app',
  },
};

export default nextConfig;
