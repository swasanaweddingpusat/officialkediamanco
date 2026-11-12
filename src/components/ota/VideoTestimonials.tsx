// Video testimoni pasangan (CMS: Admin → Video testimoni). Kartu vertikal ala Shorts, diputar di dialog.
import { useState } from 'react';
import { Play, Star } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { useVideoTestimonials } from '@/hooks/useCMS';
import { CMSImage } from '@/components/CMSImage';
import { SectionHeader } from '@/components/ota/OtaKit';
import { VideoPlayer, getYouTubeId, youTubeThumb, videoKind } from '@/components/media/VideoEmbed';
import { cn } from '@/lib/utils';

type Testimonial = { id: string; name: string; role?: string | null; video_url: string; thumbnail_url?: string | null };

export function VideoTestimonials({ limit = 12, title = 'Video testimoni pasangan', subtitle, className }: {
  limit?: number; title?: string; subtitle?: string; className?: string;
}) {
  const { data } = useVideoTestimonials();
  const items = ((data ?? []) as Testimonial[]).filter((t) => t.video_url).slice(0, limit);
  const [active, setActive] = useState<Testimonial | null>(null);
  if (!items.length) return null;

  const open = (t: Testimonial) => {
    if (videoKind(t.video_url) === 'tiktok') { window.open(t.video_url, '_blank', 'noopener,noreferrer'); return; }
    setActive(t);
  };

  return (
    <section className={className}>
      <SectionHeader title={title} subtitle={subtitle ?? 'Cerita langsung dari pasangan yang merayakan hari bahagianya di venue Kediaman.'} />
      <div className="ota-scroll-x -mx-4 px-4 sm:mx-0 sm:px-0">
        {items.map((t) => {
          const id = getYouTubeId(t.video_url);
          return (
            <button key={t.id} type="button" onClick={() => open(t)} aria-label={`Putar video testimoni ${t.name}`}
              className="group relative shrink-0 w-[42%] sm:w-[30%] md:w-[23%] lg:w-[18.5%] aspect-[9/16] overflow-hidden rounded-2xl bg-muted text-left">
              {t.thumbnail_url ? (
                <CMSImage src={t.thumbnail_url} imageWidth={480} sizes="(max-width: 640px) 45vw, 220px" alt="" className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
              ) : id ? (
                // Thumbnail Shorts horizontal (4:3) → potong tengah agar pas kartu vertikal
                <img src={youTubeThumb(id)} alt="" loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover scale-[1.35] transition-transform duration-500 group-hover:scale-[1.45]" />
              ) : (
                <span className="absolute inset-0 bg-gradient-to-br from-primary to-black" />
              )}
              <span className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
              <span className="absolute left-1/2 top-1/2 grid size-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-primary shadow-lg transition-transform group-hover:scale-110">
                <Play className="ml-0.5 size-5" fill="currentColor" aria-hidden="true" />
              </span>
              <span className="absolute inset-x-0 bottom-0 p-3">
                <span className="flex gap-0.5 text-gold" aria-hidden="true">{[0, 1, 2, 3, 4].map((i) => <Star key={i} className="size-3 fill-current" />)}</span>
                <span className="mt-1 block text-sm font-extrabold leading-tight text-white line-clamp-2">{t.name}</span>
                {t.role && <span className="block text-[11px] text-white/70 line-clamp-1">{t.role}</span>}
              </span>
            </button>
          );
        })}
      </div>

      <Dialog open={!!active} onOpenChange={(o) => { if (!o) setActive(null); }}>
        <DialogContent className={cn('kdm-video-dialog border-0 bg-black p-0 overflow-hidden gap-0 [&>button]:text-white [&>button]:opacity-90',
          'w-[min(92vw,calc((100dvh-4rem)*9/16))] max-w-none sm:max-w-none aspect-[9/16]')}>
          <DialogTitle className="sr-only">Video testimoni {active?.name}</DialogTitle>
          {active && <VideoPlayer url={active.video_url} title={`Video testimoni ${active.name}`} />}
        </DialogContent>
      </Dialog>
    </section>
  );
}
