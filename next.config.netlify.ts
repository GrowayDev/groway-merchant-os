import type { NextConfig } from "next"

// Netlify Static Export Configuration
// Use this config for deploying to Netlify as a static site

const nextConfig: NextConfig = {
  // Static export for Netlify
  output: "export",
  
  // Disable image optimization for static export
  images: {
    unoptimized: true,
  },
  
  // TypeScript configuration
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // React strict mode
  reactStrictMode: false,
  
  // Trailing slashes for static hosting
  trailingSlash: true,
  
  // Environment variables exposed to client
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'https://groway.co.za',
  },
}

export default nextConfig
