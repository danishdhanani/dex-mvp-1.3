import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    // Increase body size limit for API routes
    serverComponentsExternalPackages: [],
  },
};

export default nextConfig;
