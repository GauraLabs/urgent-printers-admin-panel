import type { NextConfig } from "next";

function cdnRemotePatterns(): { protocol: "https" | "http"; hostname: string; pathname: string }[] {
  const urls = [
    process.env.NEXT_PUBLIC_CDN_URL,
    process.env.NEXT_PUBLIC_R2_PUBLIC_URL
  ].filter(Boolean) as string[];

  const patterns: { protocol: "https" | "http"; hostname: string; pathname: string }[] = [];
  for (const url of urls) {
    try {
      const { protocol, hostname } = new URL(url);
      patterns.push({
        protocol: protocol.replace(":", "") as "https" | "http",
        hostname,
        pathname: "/**"
      });
    } catch {
      // Ignore invalid URLs
    }
  }
  return patterns;
}

const cdnPatterns = cdnRemotePatterns();

const nextConfig: NextConfig = {
  allowedDevOrigins: ['192.168.20.120'],
  // Pin explicitly: the orchestrator root (../) has its own package.json/package-lock.json
  // for the QA pipeline's playwright-test MCP server (see ../pipeline/README.md), and
  // Turbopack's root auto-detection picks that outer lockfile over this app's own,
  // resolving every import against the wrong directory.
  turbopack: {
    root: __dirname,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.r2.dev',
      },
      ...cdnPatterns,
    ],
  },
};


export default nextConfig;

