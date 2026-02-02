import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { useArticles } from '@/hooks/useCMS';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, Clock, Search, User } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { useSiteSettings } from '@/hooks/useCMS';
const Blog = () => {
  const {
    data: articles,
    isLoading
  } = useArticles();
  const {
    data: siteSettings
  } = useSiteSettings();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const siteName = siteSettings?.site_name || 'Kediaman Corp';

  // Filter articles
  const filteredArticles = articles?.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase()) || article.excerpt?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || article.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Get unique categories
  const categories = [...new Set(articles?.map(a => a.category).filter(Boolean))];

  // JSON-LD structured data for blog listing
  const blogListSchema = {
    "@context": "https://schema.org",
    "@type": "Blog",
    "name": `Blog ${siteName}`,
    "description": `Artikel dan berita terbaru dari ${siteName}`,
    "url": window.location.href,
    "publisher": {
      "@type": "Organization",
      "name": siteName,
      "logo": siteSettings?.logo_url ? {
        "@type": "ImageObject",
        "url": siteSettings.logo_url
      } : undefined
    },
    "blogPost": filteredArticles?.map(article => ({
      "@type": "BlogPosting",
      "headline": article.title,
      "description": article.excerpt,
      "datePublished": article.published_at,
      "author": {
        "@type": "Person",
        "name": article.author_name || siteName
      }
    }))
  };
  return <Layout>
      {/* SEO Meta Tags */}
      <script type="application/ld+json">
        {JSON.stringify(blogListSchema)}
      </script>

      {/* Hero Section */}
      <section className="py-16 bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl mb-4 text-primary font-serif font-bold">
              Blog & Artikel
            </h1>
            <p className="text-muted-foreground text-lg mb-8">
              Temukan artikel terbaru, tips, dan informasi seputar venue dan event management
            </p>

            {/* Search Bar */}
            <div className="relative max-w-xl mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input type="search" placeholder="Cari artikel..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-12 py-6 text-lg" />
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 && <section className="py-6 border-b border-border">
          <div className="container mx-auto px-4">
            <div className="flex flex-wrap gap-2 justify-center">
              <Badge variant={selectedCategory === null ? "default" : "outline"} className="cursor-pointer px-4 py-2" onClick={() => setSelectedCategory(null)}>
                Semua
              </Badge>
              {categories.map(category => <Badge key={category} variant={selectedCategory === category ? "default" : "outline"} className="cursor-pointer px-4 py-2" onClick={() => setSelectedCategory(category as string)}>
                  {category}
                </Badge>)}
            </div>
          </div>
        </section>}

      {/* Articles Grid */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          {isLoading ? <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3, 4, 5, 6].map(i => <Card key={i} className="overflow-hidden">
                  <Skeleton className="h-48 w-full" />
                  <CardContent className="p-6">
                    <Skeleton className="h-4 w-20 mb-3" />
                    <Skeleton className="h-6 w-full mb-2" />
                    <Skeleton className="h-4 w-full mb-4" />
                    <Skeleton className="h-4 w-32" />
                  </CardContent>
                </Card>)}
            </div> : filteredArticles?.length === 0 ? <div className="text-center py-16">
              <p className="text-muted-foreground text-lg">
                {searchQuery ? 'Tidak ada artikel yang ditemukan.' : 'Belum ada artikel.'}
              </p>
            </div> : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredArticles?.map(article => <article key={article.id}>
                  <Link to={`/blog/${article.slug}`}>
                    <Card className="overflow-hidden h-full hover:border-primary/50 transition-all hover:-translate-y-1 group">
                      {article.featured_image && <div className="aspect-video overflow-hidden">
                          <img src={article.featured_image} alt={article.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                        </div>}
                      <CardContent className="p-6">
                        {article.category && <Badge variant="secondary" className="mb-3">
                            {article.category}
                          </Badge>}
                        <h2 className="font-display text-xl mb-2 group-hover:text-primary transition-colors line-clamp-2">
                          {article.title}
                        </h2>
                        {article.excerpt && <p className="text-muted-foreground text-sm mb-4 line-clamp-3">
                            {article.excerpt}
                          </p>}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          {article.author_name && <span className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {article.author_name}
                            </span>}
                          {article.published_at && <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {format(new Date(article.published_at), 'd MMM yyyy', {
                        locale: id
                      })}
                            </span>}
                          {article.reading_time && <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {article.reading_time} menit
                            </span>}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </article>)}
            </div>}
        </div>
      </section>
    </Layout>;
};
export default Blog;