import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // No static export — API routes run server-side on Vercel.
  // Capacitor (iOS) loads the live Vercel URL via capacitor.config.ts server.url.
};

export default nextConfig;
