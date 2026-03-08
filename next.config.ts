import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Prevent Next from walking up to parent lockfiles (e.g. C:\Users\tanta\package-lock.json).
  outputFileTracingRoot: path.resolve(__dirname),
};

export default nextConfig;
