// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "i.pravatar.cc", // avatars
      },
      {
        protocol: "https",
        hostname: "via.placeholder.com", // fallback
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com", // ✅ Cloudinary
      },
    ],
  },
};

module.exports = nextConfig;
