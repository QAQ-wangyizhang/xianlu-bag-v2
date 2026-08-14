/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
  // 开发时代理 API 到 FastAPI
  async rewrites() {
    return [
      { source: '/api/:path*', destination: 'http://localhost:5917/api/:path*' },
    ];
  },
};

module.exports = nextConfig;
