import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    // Workspace packages export raw TypeScript; let Next compile them.
    transpilePackages: ["@chess/shared", "@chess/chess-core"],
};

export default nextConfig;
