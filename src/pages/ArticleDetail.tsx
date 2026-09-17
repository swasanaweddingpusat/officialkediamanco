import { useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { useArticleBySlug, useArticles, useSiteSettings } from '@/hooks/useCMS';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, Clock, User, Share2, Facebook, Twitter, Linkedin } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';

const ArticleDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { data: article, isLoading, error } = useArticleBySlug(slug || '');
  const { data: allArticles } = useArticles();
  const { data: siteSettings } = useSiteSettings();

  const siteName = siteSettings?.site_name || 'Kediaman Corp';
  const siteUrl = 'https://official.kediaman.co';
  const currentUrl = `${siteUrl}/artikel/${slug}`;

  // Related: prioritize same category, then fallback to latest articles
  const otherArticles = allArticles?.filter(a => a.is_published && a.id !== article?.id) || [];
  const sameCategoryArticles = otherArticles.filter(a => a.category === article?.category);
  const relatedArticles = sameCategoryArticles.length >= 3
    ? sameCategoryArticles.slice(0, 3)
    : [...sameCategoryArticles, ...otherArticles.filter(a => a.category !== article?.category)]
        .slice(0, 3);

  // Enhanced Article JSON-LD
  const articleSchema = article ? {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": article.meta_title || article.title,
    "description": article.meta_description || article.excerpt || '',
    "image": article.featured_image ? [article.featured_image] : [],
    "datePublished": article.published_at,
    "dateModified": article.updated_at,
    "author": {
      "@type": "Person",
      "name": article.author_name || siteName,
    },
    "publisher": {
      "@type": "Organization",
      "name": siteName,
      "logo": siteSettings?.logo_url ? {
        "@type": "ImageObject",
        "url": siteSettings.logo_url,
      } : undefined,
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": currentUrl,
    },
    "wordCount": article.content ? article.content.replace(/<[^>]*>/g, '').split(/\s+/).length : undefined,
    "articleSection": article.category || undefined,
    "keywords": article.meta_keywords || article.tags?.join(', ') || undefined,
  } : null;

  // BreadcrumbList JSON-LD
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": siteUrl },
      { "@type": "ListItem", "position": 2, "name": "Artikel", "item": `${siteUrl}/artikel` },
      ...(article ? [{ "@type": "ListItem", "position": 3, "name": article.title, "item": currentUrl }] : []),
    ],
  };

  const shareUrl = encodeURIComponent(currentUrl);
  const shareTitle = encodeURIComponent(article?.title || '');
  const shareLinks = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`,
    twitter: `https://twitter.com/intent/tweet?url=${shareUrl}&text=${shareTitle}`,
    linkedin: `https://www.linkedin.com/shareArticle?mini=true&url=${shareUrl}&title=${shareTitle}`,
  };

  useEffect(() => { window.scrollTo(0, 0); }, [slug]);

  if (error) { navigate('/artikel'); return null; }

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-6 lg:px-12 pt-16 lg:pt-24 pb-24">
          <Skeleton className="h-5 w-48 mb-10" />
          <div className="max-w-[720px] mx-auto">
            <Skeleton className="h-4 w-24 mb-4" />
            <Skeleton className="h-12 w-full mb-3" />
            <Skeleton className="h-12 w-3/4 mb-8" />
            <Skeleton className="h-4 w-48 mb-10" />
            <Skeleton className="aspect-[16/9] w-full mb-12 rounded-lg" />
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!article) {
    return (
      <Layout>
        <div className="container mx-auto px-6 lg:px-12 py-32 text-center">
          <h1 className="font-serif text-3xl lg:text-4xl mb-4 font-bold">Artikel Tidak Ditemukan</h1>
          <p className="text-muted-foreground mb-8">Artikel yang Anda cari tidak tersedia.</p>
          <Link to="/artikel">
            <Button className="rounded-full px-6 text-sm tracking-[0.05em] uppercase">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Kembali
            </Button>
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Helmet>
        <title>{article.meta_title || article.title} | {siteName}</title>
        <meta name="description" content={article.meta_description || article.excerpt || ''} />
        {article.meta_keywords && <meta name="keywords" content={article.meta_keywords} />}
        <meta name="author" content={article.author_name || siteName} />
        <link rel="canonical" href={currentUrl} />

        {/* Open Graph */}
        <meta property="og:type" content="article" />
        <meta property="og:title" content={article.meta_title || article.title} />
        <meta property="og:description" content={article.meta_description || article.excerpt || ''} />
        {article.featured_image && <meta property="og:image" content={article.featured_image} />}
        <meta property="og:url" content={currentUrl} />
        <meta property="og:site_name" content={siteName} />
        <meta property="og:locale" content="id_ID" />
        {article.published_at && <meta property="article:published_time" content={article.published_at} />}
        {article.updated_at && <meta property="article:modified_time" content={article.updated_at} />}
        {article.category && <meta property="article:section" content={article.category} />}
        {article.tags?.map((tag, i) => (
          <meta key={i} property="article:tag" content={tag} />
        ))}

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={article.meta_title || article.title} />
        <meta name="twitter:description" content={article.meta_description || article.excerpt || ''} />
        {article.featured_image && <meta name="twitter:image" content={article.featured_image} />}
      </Helmet>

      <article className="pt-8 lg:pt-16 pb-24 lg:pb-32">
        <div className="container mx-auto px-6 lg:px-12">

          {/* Breadcrumb — semantic nav */}
          <nav aria-label="Breadcrumb" className="mb-10 lg:mb-14">
            <ol className="flex items-center gap-2 text-xs text-muted-foreground" itemScope itemType="https://schema.org/BreadcrumbList">
              <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
                <Link to="/" itemProp="item" className="hover:text-primary transition-colors">
                  <span itemProp="name">Home</span>
                </Link>
                <meta itemProp="position" content="1" />
              </li>
              <li aria-hidden="true">/</li>
              <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
                <Link to="/artikel" itemProp="item" className="hover:text-primary transition-colors">
                  <span itemProp="name">Artikel</span>
                </Link>
                <meta itemProp="position" content="2" />
              </li>
              <li aria-hidden="true">/</li>
              <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
                <span itemProp="name" className="text-foreground/60 line-clamp-1 max-w-[240px]">{article.title}</span>
                <meta itemProp="position" content="3" />
              </li>
            </ol>
          </nav>

          {/* Article content — optimal reading width */}
          <div className="max-w-[720px] mx-auto">
            <motion.header initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10 lg:mb-14">
              {/* Category */}
              {article.category && (
                <p className="text-primary text-[11px] tracking-[0.3em] uppercase mb-5 flex items-center gap-3">
                  <span className="w-8 h-px bg-primary" />
                  {article.category}
                </p>
              )}

              {/* Title — H1 */}
              <h1 className="font-serif text-[1.75rem] sm:text-[2rem] md:text-[2.5rem] lg:text-[2.75rem] leading-[1.15] font-bold tracking-tight mb-6 lg:mb-8 text-foreground">
                {article.title}
              </h1>

              {/* Excerpt as lead paragraph */}
              {article.excerpt && (
                <p className="font-serif text-lg lg:text-xl text-muted-foreground leading-relaxed mb-6 lg:mb-8 italic">
                  {article.excerpt}
                </p>
              )}

              {/* Meta info */}
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-muted-foreground mb-6">
                {article.author_name && (
                  <span className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" />
                    <span>{article.author_name}</span>
                  </span>
                )}
                {article.published_at && (
                  <time dateTime={article.published_at} className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    {format(new Date(article.published_at), 'd MMMM yyyy', { locale: id })}
                  </time>
                )}
                {article.reading_time && (
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    {article.reading_time} menit baca
                  </span>
                )}
              </div>

              {/* Tags */}
              {article.tags && article.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {article.tags.map((tag, i) => (
                    <span key={i} className="text-[10px] tracking-[0.1em] uppercase text-muted-foreground border border-border/50 px-3 py-1 rounded-full">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Share */}
              <div className="flex items-center gap-3 pt-6 border-t border-border/30">
                <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Share2 className="w-3.5 h-3.5" />Bagikan:
                </span>
                <a href={shareLinks.facebook} target="_blank" rel="noopener noreferrer" aria-label="Bagikan ke Facebook" className="p-2 text-muted-foreground hover:text-primary transition-colors"><Facebook className="w-4 h-4" /></a>
                <a href={shareLinks.twitter} target="_blank" rel="noopener noreferrer" aria-label="Bagikan ke Twitter" className="p-2 text-muted-foreground hover:text-primary transition-colors"><Twitter className="w-4 h-4" /></a>
                <a href={shareLinks.linkedin} target="_blank" rel="noopener noreferrer" aria-label="Bagikan ke LinkedIn" className="p-2 text-muted-foreground hover:text-primary transition-colors"><Linkedin className="w-4 h-4" /></a>
              </div>
            </motion.header>

            {/* Featured Image */}
            {article.featured_image && (
              <figure className="mb-12 lg:mb-16 -mx-4 sm:mx-0">
                <img
                  src={article.featured_image}
                  alt={article.title}
                  className="w-full h-auto rounded-lg sm:rounded-xl"
                  loading="eager"
                  width="720"
                  height="405"
                />
              </figure>
            )}

            {/* Article Body — optimized typography */}
            <div
              className="
                article-body
                prose prose-lg dark:prose-invert max-w-none
                prose-headings:font-serif prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-foreground
                prose-h2:text-[1.5rem] prose-h2:lg:text-[1.75rem] prose-h2:mt-12 prose-h2:mb-5
                prose-h3:text-[1.25rem] prose-h3:lg:text-[1.375rem] prose-h3:mt-10 prose-h3:mb-4
                prose-p:text-base prose-p:lg:text-[1.0625rem] prose-p:leading-[1.8] prose-p:mb-6 prose-p:text-foreground/85
                prose-li:text-base prose-li:lg:text-[1.0625rem] prose-li:leading-[1.8] prose-li:text-foreground/85
                prose-a:text-primary prose-a:underline-offset-4 prose-a:decoration-primary/30 hover:prose-a:decoration-primary
                prose-img:rounded-lg prose-img:my-8
                prose-blockquote:border-l-primary prose-blockquote:bg-muted/30 prose-blockquote:py-1 prose-blockquote:px-6 prose-blockquote:rounded-r-lg prose-blockquote:not-italic prose-blockquote:text-foreground/80
                prose-strong:text-foreground prose-strong:font-semibold
                prose-ul:my-6 prose-ol:my-6
              "
              dangerouslySetInnerHTML={{ __html: article.content || '' }}
            />

            {/* Back link */}
            <div className="pt-10 mt-12 border-t border-border/30">
              <Link to="/artikel">
                <Button variant="outline" className="rounded-full px-6 text-xs tracking-[0.05em] uppercase">
                  <ArrowLeft className="w-3.5 h-3.5 mr-2" />
                  Kembali ke Artikel
                </Button>
              </Link>
            </div>
          </div>

          {/* Related Articles */}
          {relatedArticles && relatedArticles.length > 0 && (
            <aside className="mt-20 lg:mt-28 pt-16 lg:pt-20 border-t border-border/30">
              <div className="max-w-5xl mx-auto">
                <p className="text-primary text-[11px] tracking-[0.3em] uppercase mb-4 flex items-center gap-3">
                  <span className="w-8 h-px bg-primary" />
                  Baca Juga
                </p>
                <h2 className="font-serif text-2xl lg:text-3xl mb-10 font-bold">Artikel Terkait</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
                  {relatedArticles.map((related) => (
                    <Link key={related.id} to={`/artikel/${related.slug}`} className="group block">
                      {related.featured_image && (
                        <div className="aspect-[3/4] overflow-hidden rounded-sm mb-4">
                          <img
                            src={related.featured_image}
                            alt={related.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                            loading="lazy"
                          />
                        </div>
                      )}
                      <h3 className="font-serif text-base lg:text-lg font-bold line-clamp-2 group-hover:text-primary transition-colors">
                        {related.title}
                      </h3>
                      {related.published_at && (
                        <p className="text-[11px] text-muted-foreground mt-2">
                          {format(new Date(related.published_at), 'd MMM yyyy', { locale: id })}
                        </p>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            </aside>
          )}
        </div>
      </article>

      {/* JSON-LD Structured Data */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
    </Layout>
  );
};

export default ArticleDetail;
