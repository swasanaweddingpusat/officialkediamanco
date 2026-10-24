import { CMSImage } from '@/components/CMSImage';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { useArticlePreviews } from '@/hooks/useCMS';
import { useSEO } from '@/hooks/useSEO';
import { Button } from '@/components/ui/button';
import { JournalMasthead, JournalSidebar, ArticleMeta, ArticleShare } from '@/components/articles/JournalElements';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, Clock, Search, User, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { useSiteSettings } from '@/hooks/useCMS';
import { motion } from 'framer-motion';

const Blog = () => {
  const { data: articles, isLoading } = useArticlePreviews();
  const { data: siteSettings } = useSiteSettings();
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const siteName = siteSettings?.site_name || 'Kediaman Corp';

  useSEO({
    title: "Artikel & Tips Acara | Kediaman Corp",
    description: "Baca artikel terbaru, tips, dan informasi seputar venue dan event management.",
    url: "https://kediaman.co/artikel",
    breadcrumbs: [
      { name: "Home", url: "https://kediaman.co/" },
      { name: "Artikel", url: "https://kediaman.co/artikel" }
    ]
  });

  const filteredArticles = articles?.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase()) || article.excerpt?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || article.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = [...new Set(articles?.map(a => a.category).filter(Boolean))];

  return (
    <Layout>
      <div className="journal-page pb-20">
      <JournalMasthead image={articles?.find(a => a.featured_image)?.featured_image} siteName={siteName} />
      <nav aria-label="Kategori artikel" className="border-b border-border bg-card px-5 py-3 flex flex-wrap justify-center gap-2">
        <Button variant={!selectedCategory ? 'secondary' : 'ghost'} size="sm" onClick={() => { setSelectedCategory(null); setPage(1); }}>Semua Artikel</Button>
        {categories.map(category => <Button key={category} variant={selectedCategory === category ? 'secondary' : 'ghost'} size="sm" onClick={() => { setSelectedCategory(category as string); setPage(1); }}>{category}</Button>)}
      </nav>
      <div className="journal-columns px-5 pt-8">
      <div className="min-w-0">
        <section className="bg-secondary border-l-2 border-primary px-6 py-5 mb-6">
          <h1 className="font-serif text-2xl mb-2">Inspirasi untuk Momen Istimewa</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">Cerita, ide, dan panduan seputar pernikahan, venue, dan perayaan bersama Kediaman.</p>
        </section>
        <div className="flex items-center justify-between gap-4 mb-6">
          <p className="text-xs text-muted-foreground shrink-0">{filteredArticles?.length || 0} artikel</p>
          <div className="relative w-full max-w-xs"><Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" /><Input aria-label="Cari artikel" type="search" placeholder="Cari artikel..." value={searchQuery} onChange={e => { setSearchQuery(e.target.value); setPage(1); }} className="pl-10 bg-card" /></div>
        </div>
      {isLoading ? <div className="space-y-6">{[1,2,3].map(i => <Skeleton key={i} className="h-80 w-full" />)}</div> : !filteredArticles?.length ? <p className="py-16 text-center text-muted-foreground">Tidak ada artikel yang ditemukan.</p> : <div className="space-y-6">
        {filteredArticles.slice((page - 1) * 6, page * 6).map(article => <article key={article.id} className="bg-card border border-border rounded-sm overflow-hidden">
          <div className="p-5 md:p-7 pb-4">
            <p className="text-xs text-primary mb-2">{article.category || 'Inspirasi'}</p>
            <Link to={`/artikel/${article.slug}`}><h2 className="font-serif text-xl md:text-2xl leading-snug mb-3 hover:text-primary">{article.title}</h2></Link>
            <ArticleMeta article={article} />
          </div>
          {article.featured_image && <Link to={`/artikel/${article.slug}`} className="block mx-5 md:mx-7"><CMSImage src={article.featured_image} alt={article.title} width={720} height={450} sizes="(max-width: 900px) 100vw, 720px" className="w-full aspect-[16/10] object-cover" loading="lazy" /></Link>}
          <div className="p-5 md:p-7">
            {article.excerpt && <p className="text-sm leading-relaxed text-muted-foreground line-clamp-3 mb-5">{article.excerpt}</p>}
            <div className="flex flex-wrap justify-between gap-3 border-t border-border pt-4"><ArticleShare article={article} /><Button asChild size="sm"><Link to={`/artikel/${article.slug}`}>Selengkapnya<ArrowRight /></Link></Button></div>
          </div>
        </article>)}
      </div>}
      {(filteredArticles?.length || 0) > 6 && <nav aria-label="Halaman artikel" className="flex justify-center gap-2 pt-8">{Array.from({length: Math.ceil((filteredArticles?.length || 0) / 6)}, (_, i) => <Button key={i} size="icon-sm" variant={page === i + 1 ? 'default' : 'ghost'} aria-current={page === i+1 ? 'page' : undefined} onClick={() => { setPage(i+1); window.scrollTo({top: 280, behavior:'smooth'}); }}>{i+1}</Button>)}</nav>}
      </div>
      <JournalSidebar articles={articles || []} />
      </div>
      </div>
    </Layout>
  );
};
export default Blog;
