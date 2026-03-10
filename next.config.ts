import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Externalize native modules that can't be bundled
  serverExternalPackages: ['chokidar'],
  // Restrict file tracing to dashboard directory to prevent Turbopack
  // from scanning parent directories with invalid symlinks
  outputFileTracingRoot: path.resolve(__dirname),
};

export default nextConfig;
