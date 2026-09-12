import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./lib/i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
    ],
  },
  async redirects() {
    return [
      {
        source: '/vovo-hq-secure-gateway/2fa',
        destination: '/',
        permanent: false,
      },
      {
        source: '/:locale/vovo-hq-secure-gateway/2fa',
        destination: '/',
        permanent: false,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
