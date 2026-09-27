import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://vovo-agent.ai';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/vovo-hq-secure-gateway/',
          '/api/admin/',
          '/dashboard/',
          '/onboarding/',
        ],
      },
      {
        userAgent: ['GPTBot', 'ChatGPT-User', 'ClaudeBot', 'PerplexityBot', 'Google-Extended', 'Applebot-Extended'],
        allow: [
          '/',
          '/blog',
          '/blog/*',
          '/pricing',
          '/legal/*',
        ],
        disallow: [
          '/vovo-hq-secure-gateway/',
          '/api/',
          '/dashboard/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
