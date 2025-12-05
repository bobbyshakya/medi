/** @type {import('next').NextConfig} */
const nextConfig = {
  // output: 'export',
  trailingSlash: true,
  experimental: {
    optimizeCss: false,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  
  images: {
    unoptimized: true,
    qualities: [70, 80, 90, 100],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,

    domains: ["static.wixstatic.com"],
  },
  // ✅ Add redirects for old /single-post URLs
  async redirects() {
    return [
      {
        source: "/single-post/:slug*", // match /single-post/ and
        destination: "/blog/:slug*", // redirect to new blog route
        permanent: true, // use 308 redirect (SEO friendly)
      },
      // ✅ Add redirect for old /pacific-patient URL
      {
        source: "/pacific-patient",
        destination: "/pacific-patient-meet",
        permanent: true,
      },
      // 🆕 Add redirect for /search-hospitals-doctors-treatments-in-india
    
    ];
  },
};

module.exports = nextConfig;