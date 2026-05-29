import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
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
