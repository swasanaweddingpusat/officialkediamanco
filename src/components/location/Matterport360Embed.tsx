import { useEffect, useMemo, useRef, useState } from 'react';
import { ExternalLink, Maximize2, Move3d, Footprints, Box, Ruler, Play, X } from 'lucide-react';
import { CMSImage } from '@/components/CMSImage';
import { cn } from '@/lib/utils';

interface Matterport360EmbedProps {
  url: string;
  /** Foto sampul sebelum tur dimuat (biasanya foto utama venue). */
  poster?: string | null;
  venueName?: string;
  /** Kontrol dari luar, mis. tombol "Tur 360°" di galeri. */
  started?: boolean;
  onStartedChange?: (started: boolean) => void;
  className?: string;
}

/** Ambil ID model Matterport dari berbagai bentuk tautan (show/?m=, /show/, /embed/, atau ID saja). */
export function matterportId(url?: string | null): string | null {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  const fromParam = trimmed.match(/[?&]m=([a-zA-Z0-9]+)/);
  if (fromParam) return fromParam[1];
  const fromPath = trimmed.match(/\/(?:show|embed)\/([a-zA-Z0-9]+)/);
  if (fromPath) return fromPath[1];
  return /^[a-zA-Z0-9]{8,}$/.test(trimmed) ? trimmed : null;
}

const HINTS = [
  { icon: Footprints, label: 'Jalan di dalam ballroom' },
  { icon: Box, label: 'Lihat denah 3D (dollhouse)' },
  { icon: Ruler, label: 'Perkirakan luas ruangan' },
];

export function Matterport360Embed({ url, poster, venueName, started, onStartedChange, className }: Matterport360EmbedProps) {
  const id = useMemo(() => matterportId(url), [url]);
  const [localStarted, setLocalStarted] = useState(false);
  const active = started ?? localStarted;
  const setActive = (v: boolean) => { setLocalStarted(v); onStartedChange?.(v); };
  const frameRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => { if (!active) setLoaded(false); }, [active]);

  if (!id) return null;

  const viewUrl = `https://my.matterport.com/show/?m=${id}`;
  // play=1: langsung mulai (pengunjung sudah klik), qs=1: lewati animasi pembuka, brand=0: sembunyikan kartu merek.
  const embedUrl = `${viewUrl}&play=1&qs=1&brand=0&help=0`;

  const goFullscreen = () => {
    const el = frameRef.current;
    if (el?.requestFullscreen) {
      el.requestFullscreen().catch(() => window.open(viewUrl, '_blank', 'noopener'));
    } else {
      window.open(viewUrl, '_blank', 'noopener');
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-primary">
            <Move3d className="size-3.5" aria-hidden="true" /> Tur virtual 360°
          </p>
          <h2 className="mt-2 text-lg font-extrabold">Jelajahi {venueName || 'ballroom'} dari rumah</h2>
          <p className="text-sm text-muted-foreground">Rasakan luas ruangan, tinggi plafon, dan alur tamu sebelum survei langsung.</p>
        </div>
        <a href={viewUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:underline">
          Buka layar penuh di tab baru <ExternalLink className="size-4" aria-hidden="true" />
        </a>
      </div>

      <div ref={frameRef} className="relative w-full overflow-hidden rounded-2xl bg-primary aspect-[4/5] sm:aspect-video shadow-sm">
        {active ? (
          <>
            {!loaded && (
              <div className="absolute inset-0 grid place-items-center text-primary-foreground/80">
                <div className="text-center">
                  <div className="size-9 mx-auto border-4 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  <p className="mt-3 text-sm font-semibold">Memuat tur 360°…</p>
                </div>
              </div>
            )}
            <iframe
              src={embedUrl}
              title={`Tur virtual 360° ${venueName ?? ''}`.trim()}
              className="absolute inset-0 w-full h-full border-0"
              allow="xr-spatial-tracking; fullscreen; gyroscope; accelerometer"
              allowFullScreen
              onLoad={() => setLoaded(true)}
            />
            <div className="absolute right-3 top-3 flex gap-2">
              <button type="button" onClick={goFullscreen} className="inline-flex items-center gap-1.5 h-9 px-3 rounded-full bg-card/95 text-xs font-bold text-foreground shadow-sm hover:bg-card" aria-label="Layar penuh">
                <Maximize2 className="size-4" aria-hidden="true" /><span className="hidden sm:inline">Layar penuh</span>
              </button>
              <button type="button" onClick={() => setActive(false)} className="grid place-items-center size-9 rounded-full bg-card/95 text-foreground shadow-sm hover:bg-card" aria-label="Tutup tur">
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>
          </>
        ) : (
          <button type="button" onClick={() => setActive(true)} className="group absolute inset-0 text-left" aria-label={`Mulai tur virtual 360° ${venueName ?? ''}`.trim()}>
            {poster && (
              <CMSImage src={poster} imageWidth={1200} sizes="(max-width: 1024px) 100vw, 760px" alt="" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
            )}
            <span className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" aria-hidden="true" />

            <span className="absolute inset-0 grid place-items-center">
              <span className="relative grid place-items-center">
                <span className="absolute size-24 rounded-full bg-white/25 animate-ping motion-reduce:animate-none" aria-hidden="true" />
                <span className="relative grid place-items-center size-20 rounded-full bg-white text-primary shadow-lg transition-transform group-hover:scale-110">
                  <Play className="size-8 translate-x-0.5" fill="currentColor" aria-hidden="true" />
                </span>
              </span>
            </span>

            <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-black/45 backdrop-blur px-3 py-1.5 text-xs font-bold text-white">
              <Move3d className="size-4" aria-hidden="true" /> 360°
            </span>

            <span className="absolute inset-x-0 bottom-0 p-4 sm:p-6">
              <span className="block text-xl sm:text-2xl font-extrabold text-white">Mulai tur 360°</span>
              <span className="mt-2 flex flex-wrap gap-2">
                {HINTS.map((h) => (
                  <span key={h.label} className="inline-flex items-center gap-1.5 rounded-full bg-white/15 backdrop-blur px-3 py-1.5 text-xs font-semibold text-white">
                    <h.icon className="size-3.5" aria-hidden="true" />{h.label}
                  </span>
                ))}
              </span>
            </span>
          </button>
        )}
      </div>

      <p className="text-xs text-muted-foreground">Tip: seret untuk melihat sekeliling, klik lingkaran di lantai untuk berpindah. Di HP, putar layar ke mode lanskap.</p>
    </div>
  );
}
