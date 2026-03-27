import type { NextConfig } from "next";

const noIndexHeaders = [
  {
    key: "X-Robots-Tag",
    value: "noindex, nofollow, noarchive",
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/login",
        headers: noIndexHeaders,
      },
      {
        source: "/results",
        headers: noIndexHeaders,
      },
      {
        source: "/results/:path*",
        headers: noIndexHeaders,
      },
      {
        source: "/profile",
        headers: noIndexHeaders,
      },
      {
        source: "/profile/:path*",
        headers: noIndexHeaders,
      },
      {
        source: "/sourcer",
        headers: noIndexHeaders,
      },
      {
        source: "/sourcer/:path*",
        headers: noIndexHeaders,
      },
      {
        source: "/auth/:path*",
        headers: noIndexHeaders,
      },
      {
        source: "/api/:path*",
        headers: noIndexHeaders,
      },
    ];
  },
};

export default nextConfig;
