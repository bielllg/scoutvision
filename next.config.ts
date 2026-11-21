import type { NextConfig } from "next";

const config: NextConfig = {
  agentRules: false,
  devIndicators: false,
  poweredByHeader: false,
  async headers() {
    const policy = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'";
    return [{
      source: "/:path*",
      headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ...(process.env.NODE_ENV === "production" ? [{ key: "Content-Security-Policy", value: policy }] : []),
      ],
    }];
  },
  outputFileTracingIncludes: { "/*": ["./.data/scoutvision.sqlite"] },
  turbopack: { root: process.cwd() },
};

export default config;
