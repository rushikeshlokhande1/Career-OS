import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ["pdf-parse"],
  async redirects() {
    return [
      {
        source: "/career-twin",
        destination: "/dashboard",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
