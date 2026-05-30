import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ['images.unsplash.com'],
  },
  serverExternalPackages: ['better-sqlite3'],
};

export default nextConfig;
