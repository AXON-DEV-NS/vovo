import { notFound } from 'next/navigation';
import { type Metadata } from 'next';
import { Link } from '@/lib/i18n/navigation';
import { BLOG_POSTS, getBlogPostBySlug } from '@/lib/blog/articles';
import { ArrowLeft, Clock, Calendar, Share2, Sparkles, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  params: Promise<{ slug: string; locale: string }>;
}

export async function generateStaticParams() {
  return BLOG_POSTS.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);
  if (!post) return { title: 'Article Not Found | VOVO Agent AI' };

  return {
    title: `${post.title} | VOVO Agent AI Research`,
    description: post.excerpt,
    keywords: post.seoKeywords,
    authors: [{ name: post.author.name }],
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: 'article',
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
      authors: [post.author.name],
      images: [{ url: post.coverImage, width: 1200, height: 630, alt: post.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt,
      images: [post.coverImage],
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);

  if (!post) {
    notFound();
  }

  // Schema.org Article JSON-LD for AI Search Engines & Google
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: post.title,
    description: post.excerpt,
    image: post.coverImage,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    author: {
      '@type': 'Person',
      name: post.author.name,
      jobTitle: post.author.role,
    },
    publisher: {
      '@type': 'Organization',
      name: 'VOVO Agent AI',
      logo: {
        '@type': 'ImageObject',
        url: 'https://vovo-agent.ai/icon-512.png',
      },
    },
    keywords: post.seoKeywords.join(', '),
  };

  return (
    <article className="section-padding bg-paper min-h-screen font-sans">
      {/* Inject Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="container-page max-w-4xl">
        {/* Back Link */}
        <div className="mb-8">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-xs font-semibold text-ink-mute hover:text-ink transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to All Articles
          </Link>
        </div>

        {/* Article Header */}
        <header className="mb-10">
          <div className="flex items-center gap-2.5 mb-4">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
              {post.category}
            </span>
            <span className="text-xs text-ink-faint flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {post.readTime}
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-ink tracking-tight leading-tight mb-6">
            {post.title}
          </h1>

          <p className="text-lg sm:text-xl text-ink-soft leading-relaxed mb-8">
            {post.excerpt}
          </p>

          {/* Author & Date Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-paper-high border border-line">
            <div className="flex items-center gap-3">
              <img
                src={post.author.avatar}
                alt={post.author.name}
                className="w-12 h-12 rounded-full object-cover border border-line"
              />
              <div>
                <div className="text-sm font-bold text-ink">{post.author.name}</div>
                <div className="text-xs text-ink-faint">{post.author.role}</div>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs text-ink-faint">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                Published {post.publishedAt}
              </span>
            </div>
          </div>
        </header>

        {/* Cover Image */}
        <div className="mb-12 rounded-3xl overflow-hidden border border-line shadow-md">
          <img
            src={post.coverImage}
            alt={post.title}
            className="w-full h-[360px] sm:h-[480px] object-cover"
          />
        </div>

        {/* Content Body */}
        <div className="prose prose-lg prose-emerald max-w-none text-ink-soft leading-relaxed mb-16">
          {post.content.split('\n\n').map((paragraph, index) => {
            const trimmed = paragraph.trim();
            if (trimmed.startsWith('## ')) {
              return (
                <h2
                  key={index}
                  className="text-2xl sm:text-3xl font-bold text-ink mt-10 mb-4 border-b border-line pb-2"
                >
                  {trimmed.replace('## ', '')}
                </h2>
              );
            }
            if (trimmed.startsWith('### ')) {
              return (
                <h3
                  key={index}
                  className="text-xl sm:text-2xl font-bold text-ink mt-8 mb-3"
                >
                  {trimmed.replace('### ', '')}
                </h3>
              );
            }
            if (trimmed.startsWith('#### ')) {
              return (
                <h4
                  key={index}
                  className="text-lg font-bold text-ink mt-6 mb-2 text-emerald-700"
                >
                  {trimmed.replace('#### ', '')}
                </h4>
              );
            }
            if (trimmed.startsWith('```')) {
              const codeBlock = trimmed.replace(/```[a-z]*\n?/g, '').trim();
              return (
                <pre
                  key={index}
                  className="bg-[#111110] text-emerald-400 p-5 rounded-2xl overflow-x-auto text-xs sm:text-sm font-mono my-6 border border-white/10"
                  dir="ltr"
                >
                  <code>{codeBlock}</code>
                </pre>
              );
            }
            if (trimmed.startsWith('> ')) {
              return (
                <blockquote
                  key={index}
                  className="border-l-4 border-emerald-500 bg-emerald-50/50 p-4 rounded-r-2xl my-6 text-sm italic text-emerald-950"
                >
                  {trimmed.replace('> ', '')}
                </blockquote>
              );
            }
            if (trimmed.startsWith('- ')) {
              const items = trimmed.split('\n').filter((l) => l.startsWith('- '));
              return (
                <ul key={index} className="space-y-2 my-4 list-disc list-inside">
                  {items.map((item, i) => (
                    <li key={i} className="text-sm sm:text-base leading-relaxed">
                      {item.replace('- ', '')}
                    </li>
                  ))}
                </ul>
              );
            }
            return (
              <p key={index} className="text-base sm:text-lg mb-6 leading-relaxed">
                {trimmed}
              </p>
            );
          })}
        </div>

        {/* Tags */}
        <div className="pt-6 border-t border-line mb-12">
          <h4 className="text-xs font-semibold text-ink-faint uppercase tracking-wider mb-3">
            Article Tags
          </h4>
          <div className="flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 rounded-full text-xs font-medium bg-paper-high border border-line text-ink-soft"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>

        {/* Call to Action Box */}
        <div className="rounded-3xl bg-[#111110] border border-white/10 p-8 sm:p-12 text-white shadow-2xl relative overflow-hidden text-center sm:text-left">
          <div className="absolute -top-24 -right-24 w-72 h-72 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-semibold mb-3">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Ready to scale your channel?</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                Automate Your YouTube Growth Today
              </h3>
              <p className="text-xs sm:text-sm text-gray-400 max-w-lg leading-relaxed">
                Join thousands of creators using VOVO Agent AI to autonomously research trends, generate studio scripts, and publish high-retention videos.
              </p>
            </div>

            <Link href="/checkout?plan=growth">
              <Button
                variant="primary"
                size="lg"
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-8 py-3.5 rounded-xl shadow-lg shrink-0"
              >
                Start 14-Day Free Trial
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
