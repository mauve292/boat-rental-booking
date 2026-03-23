import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@boat/domain",
    "@boat/ui",
    "@boat/types"
  ]
};

export default nextConfig;
