/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow images from any domain (for evidence uploads)
  images: {
    remotePatterns: [
      { protocol: "http", hostname: "localhost" },
    ],
  },
  // Environment variables available on the client side
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000",
    NEXT_PUBLIC_SOCKET_URL: process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5000",
  },
};

module.exports = nextConfig;
