/** @type {import('next').NextConfig} */
const nextConfig = {
  // Foto kandidat (photo_url) bisa dari domain publik manapun.
  images: {
    remotePatterns: [{ protocol: 'https', hostname: '**' }],
  },
};

module.exports = nextConfig;
