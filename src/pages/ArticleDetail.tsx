import { useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { useArticleBySlug, useArticles, useSiteSettings } from '@/hooks/useCMS';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
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
  const currentUrl = window.location.href;

  const relatedArticles = allArticles?.filter(a => a.category === article?.category && a.id !== article?.id).slice(0, 3);

  const articleSchema = article ? {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": article.meta_title || article.title,
    "description": article.meta_description || article.excerpt,
    "image": article.featured_image,
    "datePublished": article.published_at,
    "dateModified": article.updated_at,
    "author": { "@type": "Person", "name": article.author_name || siteName },
    "publisher": { "@type": "Organization", "name": siteName },
    "mainEntityOfPage": { "@type": "WebPage", "@id": currentUrl },
  } : null;

  const shareUrl = encodeURIComponent(currentUrl);
  const shareTitle = encodeURIComponent(article?.title || '');
  const shareLinks = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`,
    twitter: `https://twitter.com/intent/tweet?url=${shareUrl}&text=${shareTitle}`,
    linkedin: `https://www.linkedin.com/shareArticle?mini=true&url=${shareUrl}&title=${shareTitle}`
  };

  useEffect(() => { window.scrollTo(0, 0); }, [slug]);

  if (error) { navigate('/artikel'); return null; }

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-6 lg:px-12 pt-16 lg:pt-24 pb-24">
          <Skeleton className="h-6 w-48 mb-8" />
          <Skeleton className="h-10 w-full max-w-2xl mb-4" />
          <Skeleton className="h-5 w-36 mb-8" />
          <Skeleton className="aspect-[21/9] w-full mb-8 rounded-sm" />
          <div className="space-y-3"><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-3/4" /></div>
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
        <meta property="og:type" content="article" />
        <meta property="og:title" content={article.meta_title || article.title} />
        <meta property="og:description" content={article.meta_description || article.excerpt || ''} />
        <meta property="og:image" content={article.featured_image || ''} />
        <meta name="twitter:card" content="summary_large_image" />
        <link rel="canonical" href={currentUrl} />
      </Helmet>
      <script type="application/ld+json">{JSON.stringify(articleSchema)}</script>

      <article className="pt-8 lg:pt-12 pb-24 lg:pb-32">
        <div className="container mx-auto px-6 lg:px-12">
          {/* Breadcrumb */}
          <div className="mb-10 flex items-center gap-2 text-xs text-muted-foreground">
            <Link to="/" className="hover:text-primary transition-colors">Home</Link>
            <span>/</span>
            <Link to="/artikel" className="hover:text-primary transition-colors">Artikel</Link>
            <span>/</span>
            <span className="text-foreground/60 line-clamp-1 max-w-[200px]">{article.title}</span>
          </div>

          <div className="max-w-3xl mx-auto">
            <motion.header initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
              <div className="flex items-center gap-3 mb-4">
                {article.category && (
                  <span className="text-primary text-[10px] tracking-[0.2em] uppercase">{article.category}</span>
                )}
              </div>
              
              <h1 className="font-serif text-3xl lg:text-5xl mb-6 leading-tight font-bold">
                {article.title}
              </h1>

              <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground mb-6">
                {article.author_name && (
                  <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" />{article.author_name}</span>
                )}
                {article.published_at && (
                  <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />{format(new Date(article.published_at), 'd MMMM yyyy', { locale: id })}</span>
                )}
                {article.reading_time && (
                  <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />{article.reading_time} menit</span>
                )}
              </div>

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
              <div className="flex items-center gap-3 pb-8 border-b border-border/50">
                <span className="text-xs text-muted-foreground flex items-center gap-1.5"><Share2 className="w-3.5 h-3.5" />Bagikan:</span>
                <a href={shareLinks.facebook} target="_blank" rel="noopener noreferrer" className="p-1.5 text-muted-foreground hover:text-primary transition-colors"><Facebook className="w-4 h-4" /></a>
                <a href={shareLinks.twitter} target="_blank" rel="noopener noreferrer" className="p-1.5 text-muted-foreground hover:text-primary transition-colors"><Twitter className="w-4 h-4" /></a>
                <a href={shareLinks.linkedin} target="_blank" rel="noopener noreferrer" className="p-1.5 text-muted-foreground hover:text-primary transition-colors"><Linkedin className="w-4 h-4" /></a>
              </div>
            </motion.header>

            {article.featured_image && (
              <figure className="mb-10">
                <img src={article.featured_image} alt={article.title} className="w-full h-auto rounded-sm" loading="eager" />
              </figure>
            )}

            <div className="prose prose-lg dark:prose-invert max-w-none mb-12" dangerouslySetInnerHTML={{ __html: article.content || '' }} />

            <div className="pt-8 border-t border-border/50">
              <Link to="/artikel">
                <Button variant="outline" className="rounded-full px-6 text-xs tracking-[0.05em] uppercase">
                  <ArrowLeft className="w-3.5 h-3.5 mr-2" />
                  Kembali ke Artikel
                </Button>
              </Link>
            </div>
          </div>

          {/* Related */}
          {relatedArticles && relatedArticles.length > 0 && (
            <section className="mt-20 pt-20 border-t border-border/50">
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
                        <div className="aspect-[16/10] overflow-hidden rounded-sm mb-4">
                          <img src={related.featured_image} alt={related.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" loading="lazy" />
                        </div>
                      )}
                      <h3 className="font-serif text-base lg:text-lg font-bold line-clamp-2 group-hover:text-primary transition-colors">
                        {related.title}
                      </h3>
                      {related.published_at && (
                        <p className="text-[10px] text-muted-foreground mt-2">
                          {format(new Date(related.published_at), 'd MMM yyyy', { locale: id })}
                        </p>
                      )}
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
