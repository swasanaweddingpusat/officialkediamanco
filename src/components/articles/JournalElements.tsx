import { Link } from 'react-router-dom';
import { ArrowUpRight, Clock, Facebook, Link2, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

export interface JournalArticle {
  id: string;
  slug: string;
  title: string;
  category: string | null;
  featured_image: string | null;
  author_name: string | null;
  published_at: string | null;
  reading_time: number | null;
  excerpt: string | null;
}

export function JournalMasthead({ image, siteName }: { image?: string | null; siteName: string }) {
  return <header className="journal-masthead relative overflow-hidden flex flex-col items-center justify-center text-center px-6 py-12">
    {image && <img src={image} alt="" className="absolute inset-0 w-full h-full object-cover" />}
    <div className="journal-masthead-shade absolute inset-0" />
    <div className="relative">
      <p className="text-xs uppercase mb-3">Inspirasi · Cerita · Perayaan</p>
      <Link to="/artikel" className="font-serif text-4xl md:text-5xl">{siteName.split(' - ')[0]} <span className="font-script">Journal</span></Link>
      <p className="text-sm mt-4">Cerita di balik setiap momen istimewa.</p>
    </div>
  </header>;
}

export function ArticleMeta({ article }: { article: JournalArticle }) {
  return <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
    <span>Oleh {article.author_name || 'Kediaman Corp'}</span>
    {article.published_at && <time dateTime={article.published_at}>{format(new Date(article.published_at), 'd MMMM yyyy', { locale: id })}</time>}
    {article.reading_time && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{article.reading_time} menit baca</span>}
  </div>;
}

export function ArticleShare({ article }: { article: JournalArticle }) {
  const url = `https://official.kediaman.co/artikel/${article.slug}`;
  async function copy() {
    try { await navigator.clipboard.writeText(url); toast.success('Tautan artikel disalin'); }
    catch { toast.error('Tautan tidak dapat disalin'); }
  }
  return <div className="flex items-center gap-1">
    <span className="text-xs text-muted-foreground mr-2 flex items-center gap-1"><Share2 className="w-3 h-3" />Bagikan</span>
    <Button asChild variant="ghost" size="icon-sm"><a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`} target="_blank" rel="noopener noreferrer" aria-label="Bagikan ke Facebook"><Facebook /></a></Button>
    <Button variant="ghost" size="icon-sm" onClick={copy} aria-label="Salin tautan artikel"><Link2 /></Button>
  </div>;
}

export function JournalSidebar({ articles }: { articles: JournalArticle[] }) {
  return <aside className="journal-sidebar space-y-8" aria-label="Inspirasi lainnya">
    <section className="bg-secondary p-6 border-t-2 border-primary">
      <p className="font-script text-3xl text-primary mb-2">Your next chapter</p>
      <h2 className="font-serif text-2xl mb-3">Temukan tempat untuk cerita Anda.</h2>
      <p className="text-sm leading-relaxed text-muted-foreground mb-5">Jelajahi koleksi venue Kediaman untuk momen istimewa Anda.</p>
      <Button asChild className="w-full"><Link to="/lokasi">Jelajahi Venue<ArrowUpRight /></Link></Button>
    </section>
    {articles.length > 0 && <section>
      <h2 className="font-serif text-xl pb-3 border-b border-border mb-5">Pilihan Redaksi</h2>
      <div className="space-y-5">{articles.slice(0, 4).map(article => <Link key={article.id} to={`/artikel/${article.slug}`} className="flex gap-3 group">
        {article.featured_image && <img src={article.featured_image} alt={article.title} className="w-20 h-20 object-cover shrink-0" loading="lazy" />}
        <div className="min-w-0"><p className="text-primary text-xs mb-1">{article.category || 'Inspirasi'}</p><h3 className="text-sm leading-relaxed group-hover:text-primary line-clamp-3">{article.title}</h3></div>
      </Link>)}</div>
    </section>}
    {articles.some(a => a.featured_image) && <section>
      <h2 className="font-serif text-xl mb-4">Dalam Bingkai</h2>
      <div className="grid grid-cols-2 gap-2">{articles.filter(a => a.featured_image).slice(0, 4).map(article => <Link key={article.id} to={`/artikel/${article.slug}`}><img src={article.featured_image || ''} alt={article.title} className="aspect-square w-full object-cover" loading="lazy" /></Link>)}</div>
    </section>}
  </aside>;
}