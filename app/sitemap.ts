import { MetadataRoute } from 'next';
import { BLOG_POSTS } from '@/lib/blog/articles';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://vovo-agent.ai';
  const now = new Date();

  const staticRoutes = [
    '',
    '/pricing',
    '/contact',
    '/support',
    '/blog',
    '/legal/privacy',
    '/legal/terms',
    '/legal/refund',
    '/legal/cancellation',
  ];

  const routes: MetadataRoute.Sitemap = [];

  // Add static marketing routes
  for (const route of staticRoutes) {
    routes.push({
      url: `${baseUrl}${route}`,
      lastModified: now,
      changeFrequency: route === '' || route === '/blog' ? 'daily' : 'weekly',
      priority: route === '' ? 1.0 : route === '/pricing' || route === '/blog' ? 0.9 : 0.7,
    });
  }

  // Add dynamic blog article routes
  for (const post of BLOG_POSTS) {
    routes.push({
      url: `${baseUrl}/blog/${post.slug}`,
      lastModified: new Date(post.updatedAt || post.publishedAt),
      changeFrequency: 'monthly',
      priority: 0.8,
    });
  }

  return routes;
}
