import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["three", "@react-three/fiber", "@react-three/drei", "maath"],
  serverExternalPackages: ["canvas"],
  // Next.js 16 defaults to Turbopack; empty config acknowledges that intentionally
  turbopack: {},
};

export default nextConfig;
