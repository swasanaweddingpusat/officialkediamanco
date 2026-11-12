// Pemutar video ringan: tampilkan thumbnail dulu, iframe YouTube baru dimuat saat diklik
// (hemat kuota & tidak memperlambat halaman). Mendukung YouTube (watch/shorts/youtu.be/embed),
// file video unggahan (mp4/webm), dan TikTok (dibuka di tab baru).
import { useState } from 'react';
import { Play } from 'lucide-react';
import { cn } from '@/lib/utils';

export function getYouTubeId(url: string | null | undefined): string | null {
  if (!url) return null;
  const m = String(url).match(/(?:youtube(?:-nocookie)?\.com\/(?:shorts\/|watch\?(?:.*&)?v=|embed\/|live\/)|youtu\.be\/)([\w-]{11})/);
  return m?.[1] ?? null;
}

export type VideoKind = 'youtube' | 'tiktok' | 'file';
export const videoKind = (url: string): VideoKind =>
  getYouTubeId(url) ? 'youtube' : /tiktok\.com/i.test(url) ? 'tiktok' : 'file';

export const youTubeThumb = (id: string, quality: 'hq' | 'max' = 'hq') =>
  `https://i.ytimg.com/vi/${id}/${quality === 'max' ? 'maxresdefault' : 'hqdefault'}.jpg`;

/** Iframe/elemen video yang langsung diputar (dipakai setelah pengguna menekan play). */
export function VideoPlayer({ url, title, className }: { url: string; title: string; className?: string }) {
  const id = getYouTubeId(url);
  if (id) {
    return (
      <iframe
        src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&playsinline=1&modestbranding=1`}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
        allowFullScreen
        className={cn('h-full w-full border-0', className)}
      />
    );
  }
  return <video src={url} controls autoPlay playsInline preload="metadata" className={cn('h-full w-full bg-black object-contain', className)} />;
}

/** Thumbnail + tombol play; diklik → pemutar di tempat yang sama. */
export function VideoEmbed({
  url, title, poster, aspect = 'video', className, playing: controlledPlaying, onPlay,
}: {
  url: string; title: string; poster?: string | null; aspect?: 'video' | 'short'; className?: string;
  playing?: boolean; onPlay?: () => void;
}) {
  const [localPlaying, setLocalPlaying] = useState(false);
  const playing = controlledPlaying ?? localPlaying;
  const kind = videoKind(url);
  const id = getYouTubeId(url);
  const thumb = poster || (id ? youTubeThumb(id, aspect === 'video' ? 'max' : 'hq') : null);
  const ratio = aspect === 'short' ? 'aspect-[9/16]' : 'aspect-video';

  const start = () => {
    if (kind === 'tiktok') { window.open(url, '_blank', 'noopener,noreferrer'); return; }
    setLocalPlaying(true);
    onPlay?.();
  };

  return (
    <div className={cn('relative overflow-hidden rounded-2xl bg-black', ratio, className)}>
      {playing && kind !== 'tiktok' ? (
        <VideoPlayer url={url} title={title} />
      ) : (
        <button type="button" onClick={start} className="group absolute inset-0 h-full w-full text-left" aria-label={`Putar video: ${title}`}>
          {thumb ? (
            <img
              src={thumb}
              alt=""
              loading="lazy"
              decoding="async"
              onError={(e) => { if (id && !e.currentTarget.src.includes('hqdefault')) e.currentTarget.src = youTubeThumb(id, 'hq'); }}
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <span className="absolute inset-0 bg-gradient-to-br from-primary to-black" />
          )}
          <span className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-black/10" />
          <span className="absolute left-1/2 top-1/2 grid size-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white/95 text-primary shadow-xl transition-transform group-hover:scale-110">
            <Play className="ml-1 size-7" fill="currentColor" aria-hidden="true" />
          </span>
        </button>
      )}
    </div>
  );
}
