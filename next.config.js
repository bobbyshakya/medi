/** @type {import('next').NextConfig} */
const nextConfig = {
  // output: 'export',
  trailingSlash: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
    domains: ['static.wixstatic.com'],
  },
  // ✅ Add redirects for old /single-post URLs
  async redirects() {
    return [
      {
        source: "/single-post/:slug*", // match /single-post/ and 
        destination: "/blog/:slug*",  // redirect to new blog route
        permanent: true, // use 308 redirect (SEO friendly)
      },
      // ✅ Add redirect for old /pacific-patient URL
      {
        source: "/pacific-patient",
        destination: "/pacific-patient-meet",
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;