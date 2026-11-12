import type { NextConfig } from "next"

// ============================================
// NETLIFY STATIC EXPORT CONFIGURATION
// ============================================
// Use this for deploying a static demo to Netlify
// No database or API routes required
// Perfect for sharing with stakeholders

const nextConfig: NextConfig = {
  // Static export - generates HTML/CSS/JS files only
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
  
  // Disable experimental features not compatible with static export
  experimental: {
    serverActions: false,
  },
}

export default nextConfig
