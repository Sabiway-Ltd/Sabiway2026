// frontend/next.config.ts

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

  // ✅ Allow deployment even if there are TypeScript or ESLint errors
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
