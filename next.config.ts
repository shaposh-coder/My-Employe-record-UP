import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/favicon.ico",
        destination: "/icon.jpeg",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
