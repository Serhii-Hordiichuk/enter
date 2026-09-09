/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: { unoptimized: true },
  transpilePackages: ['trystero', '@trystero-p2p/torrent', 'webtorrent'],
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = config.externals ?? [];
      config.externals.push('webtorrent', '@mlc-ai/web-llm');
    }
    config.resolve = config.resolve ?? {};
    config.resolve.fallback = {
      ...(config.resolve.fallback ?? {}),
      fs: false,
      net: false,
      tls: false,
      dgram: false,
      child_process: false,
    };
    return config;
  },
};

module.exports = nextConfig;

