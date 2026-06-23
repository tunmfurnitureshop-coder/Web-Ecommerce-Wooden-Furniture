import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./lib/i18n-request.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  // standalone is for Docker deployments only; Vercel handles its own bundling
  ...(process.env.STANDALONE === "1" && { output: "standalone" }),
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
      },
      {
        protocol: "https",
        hostname: "*.r2.dev",
      },
    ],
  },
};

export default withNextIntl(nextConfig);
