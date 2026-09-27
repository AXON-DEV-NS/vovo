import { type Metadata } from 'next';
import { Link } from '@/lib/i18n/navigation';
import { BLOG_POSTS, getAllBlogCategories } from '@/lib/blog/articles';
import { Sparkles, Clock, ArrowRight, BookOpen } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Blog & AI Creator Research | VOVO Agent AI',
  description:
    'Read the latest guides, algorithm teardowns, and engineering insights on autonomous YouTube channel automation, generative video, and Generative Engine Optimization (GEO).',
  openGraph: {
    title: 'Blog & AI Creator Research | VOVO Agent AI',
    description:
      'Autonomous YouTube automation, algorithm teardowns, and Generative Engine Optimization.',
    type: 'website',
  },
};

export default function BlogIndexPage() {
  const categories = getAllBlogCategories();
  const featuredPost = BLOG_POSTS[0];
  const regularPosts = BLOG_POSTS.slice(1);

  return (
    <div className="section-padding bg-paper min-h-screen font-sans">
      <div className="container-page max-w-6xl">
        {/* Header Hero */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 text-xs font-semibold mb-4">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Research & Creator Intelligence</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-ink tracking-tight mb-4">
            Autonomous YouTube Intelligence
          </h1>
          <p className="text-base sm:text-lg text-ink-soft leading-relaxed">
            Data-backed breakdowns on YouTube algorithm mechanics, generative video pipelines, and high-retention storytelling for modern digital creators.
          </p>
        </div>

        {/* Featured Article */}
        {featuredPost && (
          <div className="mb-16">
            <div className="group relative rounded-3xl overflow-hidden border border-line bg-paper-high hover:border-emerald-500/40 transition-all duration-300 shadow-lg">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
                <div className="lg:col-span-7 relative h-72 sm:h-96 lg:h-auto overflow-hidden">
                  <img
                    src={featuredPost.coverImage}
                    alt={featuredPost.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-600 text-white shadow-md">
                      Featured Analysis
                    </span>
                  </div>
                </div>

                <div className="lg:col-span-5 p-8 sm:p-10 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-3 text-xs text-ink-faint mb-3">
                      <span className="font-semibold text-emerald-700 uppercase tracking-wider">
                        {featuredPost.category}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {featuredPost.readTime}
                      </span>
                    </div>

                    <h2 className="text-2xl sm:text-3xl font-bold text-ink mb-4 group-hover:text-emerald-700 transition-colors leading-snug">
                      <Link href={`/blog/${featuredPost.slug}`}>
                        {featuredPost.title}
                      </Link>
                    </h2>

                    <p className="text-sm text-ink-soft leading-relaxed line-clamp-3 mb-6">
                      {featuredPost.excerpt}
                    </p>
                  </div>

                  <div className="pt-6 border-t border-line flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={featuredPost.author.avatar}
                        alt={featuredPost.author.name}
                        className="w-10 h-10 rounded-full object-cover border border-line"
                      />
                      <div>
                        <div className="text-xs font-bold text-ink">
                          {featuredPost.author.name}
                        </div>
                        <div className="text-[11px] text-ink-faint">
                          {featuredPost.author.role}
                        </div>
                      </div>
                    </div>

                    <Link
                      href={`/blog/${featuredPost.slug}`}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 transition-colors"
                    >
                      Read Full Analysis
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Categories Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-6 mb-8 scrollbar-none border-b border-line">
          <span className="text-xs font-semibold text-ink-faint mr-2 flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5" /> Topics:
          </span>
          <span className="px-3 py-1.5 rounded-full text-xs font-medium bg-ink text-white">
            All Articles
          </span>
          {categories.map((cat) => (
            <span
              key={cat}
              className="px-3 py-1.5 rounded-full text-xs font-medium bg-paper-high border border-line text-ink-soft"
            >
              {cat}
            </span>
          ))}
        </div>

        {/* Regular Articles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {regularPosts.map((post) => (
            <article
              key={post.slug}
              className="group flex flex-col justify-between rounded-3xl border border-line bg-paper-high p-6 shadow-sm hover:shadow-md hover:border-emerald-500/40 transition-all duration-300"
            >
              <div>
                <div className="relative h-56 rounded-2xl overflow-hidden mb-5">
                  <img
                    src={post.coverImage}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-black/70 text-white backdrop-blur-md">
                      {post.category}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs text-ink-faint mb-2">
                  <span>{post.publishedAt}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {post.readTime}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-ink mb-3 group-hover:text-emerald-700 transition-colors leading-snug">
                  <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                </h3>

                <p className="text-xs sm:text-sm text-ink-soft leading-relaxed line-clamp-3 mb-6">
                  {post.excerpt}
                </p>
              </div>

              <div className="pt-4 border-t border-line flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <img
                    src={post.author.avatar}
                    alt={post.author.name}
                    className="w-8 h-8 rounded-full object-cover border border-line"
                  />
                  <div>
                    <div className="text-xs font-semibold text-ink">
                      {post.author.name}
                    </div>
                    <div className="text-[10px] text-ink-faint">
                      {post.author.role}
                    </div>
                  </div>
                </div>

                <Link
                  href={`/blog/${post.slug}`}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 transition-colors"
                >
                  Read
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
