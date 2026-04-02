import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  output: "standalone",
  experimental: {
    // @ts-expect-error — turbo root not yet in ExperimentalConfig types
    turbo: {
      root: path.resolve(__dirname, "../.."),
    },
  },
};

export default nextConfig;
