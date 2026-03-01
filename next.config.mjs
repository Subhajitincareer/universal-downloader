import withPWAInit from 'next-pwa';

const withPWA = withPWAInit({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['youtube-dl-exec'],
  turbopack: {},
  experimental: {
    outputFileTracingIncludes: {
      '/api/**/*': ['./node_modules/youtube-dl-exec/bin/**/*'],
    },
  },
};

export default withPWA(nextConfig);
