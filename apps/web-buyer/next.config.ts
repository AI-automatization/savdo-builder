import type { NextConfig } from "next";
import path from "path";

const monorepoRoot = path.resolve(__dirname, "../..");

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: monorepoRoot,
  experimental: {
    // @ts-expect-error — turbo root not yet in ExperimentalConfig types
    turbo: {
      root: monorepoRoot,
    },
  },
};

export default nextConfig;
