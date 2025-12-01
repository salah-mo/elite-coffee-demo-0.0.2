/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable devtools to fix Next.js 15.5.6 bug
  // "Cannot read properties of undefined (reading 'includes')"
  devIndicators: {
    appIsrStatus: false,
    buildActivity: false,
  },
  
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "source.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "ext.same-assets.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "ugc.same-assets.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "cdn.prod.website-files.com",
        pathname: "/**",
      },
    ],
  },
};

module.exports = nextConfig;
