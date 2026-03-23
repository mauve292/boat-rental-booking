import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@boat/db",
    "@boat/domain",
    "@boat/ui",
    "@boat/types",
    "@boat/validation"
  ]
};

export default nextConfig;
