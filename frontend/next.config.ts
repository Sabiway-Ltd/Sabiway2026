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
      {
        protocol: "https",
        hostname: "api.dicebear.com",
      },
    ],
    dangerouslyAllowSVG: true, // ⚠️ Only if you trust the source
    contentSecurityPolicy:
      "default-src 'self'; script-src 'none'; sandbox;",
  },
};

module.exports = nextConfig;
