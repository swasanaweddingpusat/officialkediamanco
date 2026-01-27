import { useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { useArticleBySlug, useArticles, useSiteSettings } from '@/hooks/useCMS';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Breadcrumb, 
  BreadcrumbItem, 
  BreadcrumbLink, 
  BreadcrumbList, 
  BreadcrumbPage, 
  BreadcrumbSeparator 
} from '@/components/ui/breadcrumb';
import { ArrowLeft, Calendar, Clock, User, Share2, Facebook, Twitter, Linkedin } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Helmet } from 'react-helmet-async';

const ArticleDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { data: article, isLoading, error } = useArticleBySlug(slug || '');
  const { data: allArticles } = useArticles();
  const { data: siteSettings } = useSiteSettings();

  const siteName = siteSettings?.site_name || 'Kediaman Corp';
  const currentUrl = window.location.href;

  // Related articles (same category, exclude current)
  const relatedArticles = allArticles?.filter(
    a => a.category === article?.category && a.id !== article?.id
  ).slice(0, 3);

  // JSON-LD structured data for article (SEO)
  const articleSchema = article ? {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": article.meta_title || article.title,
    "description": article.meta_description || article.excerpt,
    "image": article.featured_image,
    "datePublished": article.published_at,
    "dateModified": article.updated_at,
    "author": {
      "@type": "Person",
      "name": article.author_name || siteName
    },
    "publisher": {
      "@type": "Organization",
      "name": siteName,
      "logo": siteSettings?.logo_url ? {
        "@type": "ImageObject",
        "url": siteSettings.logo_url
      } : undefined
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": currentUrl
    },
    "keywords": article.meta_keywords || article.tags?.join(', ')
  } : null;

  // Breadcrumb schema
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": window.location.origin
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Blog",
        "item": `${window.location.origin}/blog`
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": article?.title || '',
        "item": currentUrl
      }
    ]
  };

  // Share functions
  const shareUrl = encodeURIComponent(currentUrl);
  const shareTitle = encodeURIComponent(article?.title || '');

  const shareLinks = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`,
    twitter: `https://twitter.com/intent/tweet?url=${shareUrl}&text=${shareTitle}`,
    linkedin: `https://www.linkedin.com/shareArticle?mini=true&url=${shareUrl}&title=${shareTitle}`
  };

  useEffect(() => {
    // Scroll to top on mount
    window.scrollTo(0, 0);
  }, [slug]);

  if (error) {
    navigate('/blog');
    return null;
  }

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16">
          <Skeleton className="h-8 w-64 mb-8" />
          <Skeleton className="h-12 w-full max-w-2xl mb-4" />
          <Skeleton className="h-6 w-48 mb-8" />
          <Skeleton className="h-96 w-full mb-8" />
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
      </Layout>
    );
  }

  if (!article) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-32 text-center">
          <h1 className="font-display text-4xl mb-4">Artikel Tidak Ditemukan</h1>
          <p className="text-muted-foreground mb-8">Artikel yang Anda cari tidak tersedia.</p>
          <Link to="/blog">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Kembali ke Blog
            </Button>
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* SEO Head */}
      <Helmet>
        <title>{article.meta_title || article.title} | {siteName}</title>
        <meta name="description" content={article.meta_description || article.excerpt || ''} />
        <meta name="keywords" content={article.meta_keywords || article.tags?.join(', ') || ''} />
        <meta name="author" content={article.author_name || siteName} />
        
        {/* Open Graph */}
        <meta property="og:type" content="article" />
        <meta property="og:title" content={article.meta_title || article.title} />
        <meta property="og:description" content={article.meta_description || article.excerpt || ''} />
        <meta property="og:image" content={article.featured_image || ''} />
        <meta property="og:url" content={currentUrl} />
        <meta property="article:published_time" content={article.published_at || ''} />
        <meta property="article:modified_time" content={article.updated_at} />
        <meta property="article:author" content={article.author_name || siteName} />
        {article.tags?.map((tag, i) => (
          <meta key={i} property="article:tag" content={tag} />
        ))}
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={article.meta_title || article.title} />
        <meta name="twitter:description" content={article.meta_description || article.excerpt || ''} />
        <meta name="twitter:image" content={article.featured_image || ''} />
        
        {/* Canonical */}
        <link rel="canonical" href={currentUrl} />
      </Helmet>

      {/* Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify(articleSchema)}
      </script>
      <script type="application/ld+json">
        {JSON.stringify(breadcrumbSchema)}
      </script>

      <article className="py-8">
        <div className="container mx-auto px-4">
          {/* Breadcrumb */}
          <Breadcrumb className="mb-8">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/">Home</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/blog">Blog</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="line-clamp-1 max-w-[200px]">
                  {article.title}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <header className="mb-8">
              {article.category && (
                <Badge variant="secondary" className="mb-4">
                  {article.category}
                </Badge>
              )}
              
              <h1 className="font-display text-3xl md:text-4xl lg:text-5xl mb-6 leading-tight">
                {article.title}
              </h1>

              {/* Meta Info */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6">
                {article.author_name && (
                  <span className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    {article.author_name}
                  </span>
                )}
                {article.published_at && (
                  <span className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {format(new Date(article.published_at), 'd MMMM yyyy', { locale: id })}
                  </span>
                )}
                {article.reading_time && (
                  <span className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    {article.reading_time} menit baca
                  </span>
                )}
              </div>

              {/* Tags */}
              {article.tags && article.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {article.tags.map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Share Buttons */}
              <div className="flex items-center gap-4 pb-6 border-b border-border">
                <span className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Share2 className="w-4 h-4" />
                  Bagikan:
                </span>
                <a
                  href={shareLinks.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-full bg-[#1877f2] text-white hover:opacity-80 transition-opacity"
                  aria-label="Share on Facebook"
                >
                  <Facebook className="w-4 h-4" />
                </a>
                <a
                  href={shareLinks.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-full bg-[#1da1f2] text-white hover:opacity-80 transition-opacity"
                  aria-label="Share on Twitter"
                >
                  <Twitter className="w-4 h-4" />
                </a>
                <a
                  href={shareLinks.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-full bg-[#0077b5] text-white hover:opacity-80 transition-opacity"
                  aria-label="Share on LinkedIn"
                >
                  <Linkedin className="w-4 h-4" />
                </a>
              </div>
            </header>

            {/* Featured Image */}
            {article.featured_image && (
              <figure className="mb-8">
                <img
                  src={article.featured_image}
                  alt={article.title}
                  className="w-full h-auto rounded-lg shadow-lg"
                  loading="eager"
                />
              </figure>
            )}

            {/* Content */}
            <div 
              className="prose prose-lg dark:prose-invert max-w-none mb-12"
              dangerouslySetInnerHTML={{ __html: article.content || '' }}
            />

            {/* Back Button */}
            <div className="pt-8 border-t border-border">
              <Link to="/blog">
                <Button variant="outline">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Kembali ke Blog
                </Button>
              </Link>
            </div>
          </div>

          {/* Related Articles */}
          {relatedArticles && relatedArticles.length > 0 && (
            <section className="mt-16 pt-16 border-t border-border">
              <div className="max-w-6xl mx-auto">
                <h2 className="font-display text-2xl md:text-3xl mb-8 text-center">
                  Artikel Terkait
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {relatedArticles.map((related) => (
                    <Link key={related.id} to={`/blog/${related.slug}`}>
                      <Card className="overflow-hidden h-full hover:border-primary/50 transition-all hover:-translate-y-1 group">
                        {related.featured_image && (
                          <div className="aspect-video overflow-hidden">
                            <img
                              src={related.featured_image}
                              alt={related.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              loading="lazy"
                            />
                          </div>
                        )}
                        <CardContent className="p-4">
                          <h3 className="font-semibold line-clamp-2 group-hover:text-primary transition-colors">
                            {related.title}
                          </h3>
                          {related.published_at && (
                            <p className="text-xs text-muted-foreground mt-2">
                              {format(new Date(related.published_at), 'd MMM yyyy', { locale: id })}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            </section>
          )}
        </div>
      </article>
    </Layout>
  );
};

export default ArticleDetail;
