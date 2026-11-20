import type { NextConfig } from "next";

const config: NextConfig = {
  agentRules: false,
  devIndicators: false,
  outputFileTracingIncludes: { "/*": ["./.data/scoutvision.sqlite"] },
  turbopack: { root: process.cwd() },
};

export default config;
