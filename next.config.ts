import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    // Fix incorrect workspace root inference when multiple lockfiles exist.
    root: path.join(__dirname),
  },
  // Allow LAN access in dev without warnings (adjust to your network if needed).
  allowedDevOrigins: ["http://192.168.1.104:3010"],
};

export default nextConfig;
