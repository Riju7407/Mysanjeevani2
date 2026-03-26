import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  devIndicators: {
    position: 'bottom-right',
  },
  images: {
    localPatterns: [
      {
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
