import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  agentRules: false,
  output: "standalone",
  turbopack: {},
  webpack(config, { nextRuntime }) {
    if (nextRuntime === "edge") {
      config.externals ??= [];
      config.externals.push({
        "./instrumentation-node": "commonjs ./instrumentation-node",
      });
    }
    return config;
  },
};

export default nextConfig;
