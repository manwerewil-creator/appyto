/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "jobszimbabwe.co.zw" },
      { protocol: "https", hostname: "applynow.co.zw" },
    ],
  },
};

export default nextConfig;
