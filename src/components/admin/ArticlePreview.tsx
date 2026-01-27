import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { Clock, Calendar, User, Tag, ArrowLeft, Share2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ArticlePreviewProps {
  title: string;
  excerpt: string;
  content: string;
  featured_image: string;
  author_name: string;
  category: string;
  tags: string;
  reading_time: number;
  onClose: () => void;
}

export const ArticlePreview = ({
  title,
  excerpt,
  content,
  featured_image,
  author_name,
  category,
  tags,
  reading_time,
  onClose,
}: ArticlePreviewProps) => {
  const tagsArray = tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [];
  const currentDate = new Date();

  return (
    <div className="flex flex-col h-full">
      {/* Preview Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/50">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onClose} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Kembali Edit
          </Button>
          <div className="h-4 w-px bg-border" />
          <span className="text-sm text-muted-foreground">Mode Preview</span>
        </div>
        <Badge variant="outline" className="text-xs">
          Desktop View
        </Badge>
      </div>

      {/* Article Preview Content */}
      <ScrollArea className="flex-1">
        <div className="max-w-4xl mx-auto px-6 py-8">
          {/* Breadcrumb simulation */}
          <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
            <span className="hover:text-primary cursor-pointer">Blog</span>
            <span>/</span>
            <span className="hover:text-primary cursor-pointer">{category || 'Kategori'}</span>
            <span>/</span>
            <span className="text-foreground truncate max-w-[200px]">{title || 'Judul Artikel'}</span>
          </nav>

          {/* Article Header */}
          <header className="mb-8">
            {category && (
              <Badge className="mb-4">{category}</Badge>
            )}
            
            <h1 className="font-display text-3xl md:text-4xl lg:text-5xl mb-4 leading-tight">
              {title || 'Judul Artikel Anda'}
            </h1>

            {excerpt && (
              <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                {excerpt}
              </p>
            )}

            {/* Meta info */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              {author_name && (
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-4 h-4 text-primary" />
                  </div>
                  <span>{author_name}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                <span>{format(currentDate, 'dd MMMM yyyy', { locale: idLocale })}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                <span>{reading_time} menit baca</span>
              </div>
            </div>
          </header>

          {/* Featured Image */}
          {featured_image ? (
            <figure className="mb-8 -mx-6 md:mx-0">
              <img
                src={featured_image}
                alt={title}
                className="w-full aspect-video object-cover rounded-none md:rounded-2xl"
              />
            </figure>
          ) : (
            <div className="mb-8 -mx-6 md:mx-0 aspect-video bg-muted rounded-none md:rounded-2xl flex items-center justify-center">
              <span className="text-muted-foreground">Featured Image</span>
            </div>
          )}

          {/* Article Content */}
          <article className="prose prose-invert max-w-none mb-8">
            {content ? (
              <div dangerouslySetInnerHTML={{ __html: content }} />
            ) : (
              <div className="text-muted-foreground italic">
                <p>Konten artikel akan ditampilkan di sini...</p>
                <p>Mulai menulis di tab "Konten" untuk melihat preview.</p>
              </div>
            )}
          </article>

          {/* Tags */}
          {tagsArray.length > 0 && (
            <div className="flex items-center gap-3 py-6 border-t border-border">
              <Tag className="w-4 h-4 text-muted-foreground" />
              <div className="flex flex-wrap gap-2">
                {tagsArray.map((tag, i) => (
                  <Badge key={i} variant="secondary" className="cursor-pointer hover:bg-secondary/80">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Share Section */}
          <div className="flex items-center justify-between py-6 border-t border-border">
            <span className="text-sm text-muted-foreground">Bagikan artikel ini</span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-2">
                <Share2 className="w-4 h-4" />
                Share
              </Button>
            </div>
          </div>

          {/* Author Card */}
          {author_name && (
            <div className="p-6 bg-card border border-border rounded-2xl">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Ditulis oleh</p>
                  <h4 className="font-semibold text-lg">{author_name}</h4>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
