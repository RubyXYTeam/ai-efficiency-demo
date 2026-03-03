import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    // Fix incorrect workspace root inference when multiple lockfiles exist.
    root: path.join(__dirname),
  },
};

export default nextConfig;
