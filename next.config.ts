import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  typescript: {
    ignoreBuildErrors: false,
  },
  reactStrictMode: false,
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.enoch.wiki" }],
        destination: "https://enoch.wiki/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
