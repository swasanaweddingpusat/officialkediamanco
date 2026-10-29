// Kartu paket (venue_packages) — dipakai di beranda, halaman Paket & Harga, dan detail venue.
import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Check, Crown, MapPin, Users, ChevronDown } from 'lucide-react';
import { CMSImage } from '@/components/CMSImage';
import { formatRupiah, type VenuePackage } from '@/hooks/useOta';
import { cn } from '@/lib/utils';

interface PackageCardProps {
  pkg: VenuePackage;
  venueName?: string | null;
  venueHref?: string;
  /** Foto cadangan bila paket tidak punya gambar (biasanya foto venue). */
  fallbackImage?: string | null;
  /** Tombol/aksi utama di bawah kartu, mis. BookingDialog "Pilih paket". */
  action?: ReactNode;
  /** Jumlah poin isi paket yang tampil sebelum "lihat semua". */
  maxInclusions?: number;
  className?: string;
}

const paxLabel = (p: VenuePackage) =>
  p.min_pax && p.max_pax ? `${p.min_pax}–${p.max_pax} tamu` : p.min_pax || p.max_pax ? `${p.min_pax || p.max_pax} tamu` : null;

export function PackageCard({ pkg: p, venueName, venueHref, fallbackImage, action, maxInclusions = 5, className }: PackageCardProps) {
  const [expanded, setExpanded] = useState(false);
  const image = p.image_url || fallbackImage;
  const pax = paxLabel(p);
  const shown = expanded ? p.inclusions : p.inclusions.slice(0, maxInclusions);
  const hidden = p.inclusions.length - shown.length;
  const venueLabel = venueName ?? p.locations?.name ?? null;

  return (
    <article
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-2xl bg-card shadow-sm ring-1 transition-all hover:-translate-y-0.5 hover:shadow-lg',
        p.is_featured ? 'ring-2 ring-gold' : 'ring-border',
        className,
      )}
    >
      {/* Sampul */}
      <div className="relative aspect-[16/9] overflow-hidden bg-primary">
        {image ? (
          <CMSImage src={image} imageWidth={720} sizes="(max-width: 768px) 100vw, 400px" alt="" className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,hsl(var(--gold)/0.35),transparent_45%),radial-gradient(circle_at_85%_80%,hsl(0_0%_100%/0.12),transparent_40%)]" aria-hidden="true" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" aria-hidden="true" />

        <div className="absolute inset-x-3 top-3 flex items-start justify-between gap-2">
          {venueLabel ? (
            venueHref ? (
              <Link to={venueHref} className="inline-flex max-w-[70%] items-center gap-1 truncate rounded-full bg-card/95 px-2.5 py-1 text-[11px] font-bold text-foreground hover:bg-card">
                <MapPin className="size-3 shrink-0" aria-hidden="true" /><span className="truncate">{venueLabel}</span>
              </Link>
            ) : (
              <span className="inline-flex max-w-[70%] items-center gap-1 truncate rounded-full bg-card/95 px-2.5 py-1 text-[11px] font-bold text-foreground">
                <MapPin className="size-3 shrink-0" aria-hidden="true" /><span className="truncate">{venueLabel}</span>
              </span>
            )
          ) : (
            <span className="rounded-full bg-card/95 px-2.5 py-1 text-[11px] font-bold text-foreground">Semua venue</span>
          )}
          {p.is_featured && (
            <span className="inline-flex items-center gap-1 rounded-full bg-gold px-2.5 py-1 text-[11px] font-extrabold text-primary shadow-sm">
              <Crown className="size-3" aria-hidden="true" />Terpopuler
            </span>
          )}
        </div>

        <div className="absolute inset-x-4 bottom-3">
          <h3 className="text-xl md:text-2xl font-extrabold leading-tight text-white drop-shadow-sm">{p.name}</h3>
          {pax && (
            <p className="mt-1 inline-flex items-center gap-1.5 text-xs font-semibold text-white/85">
              <Users className="size-3.5" aria-hidden="true" />{pax}
            </p>
          )}
        </div>
      </div>

      {/* Isi */}
      <div className="flex flex-1 flex-col gap-4 p-4 md:p-5">
        {p.description && <p className="text-sm leading-relaxed text-muted-foreground line-clamp-3">{p.description}</p>}

        {p.inclusions.length > 0 && (
          <div>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Sudah termasuk</p>
            <ul className="space-y-2 text-sm">
              {shown.map((inc, i) => (
                <li key={`${inc}-${i}`} className="flex gap-2.5">
                  <span className="mt-0.5 grid size-[18px] shrink-0 place-items-center rounded-full bg-secondary text-primary">
                    <Check className="size-3" strokeWidth={3} aria-hidden="true" />
                  </span>
                  <span className="leading-snug">{inc}</span>
                </li>
              ))}
            </ul>
            {(hidden > 0 || expanded) && p.inclusions.length > maxInclusions && (
              <button type="button" onClick={() => setExpanded((v) => !v)} className="mt-2 inline-flex items-center gap-1 text-sm font-bold text-primary hover:underline" aria-expanded={expanded}>
                {expanded ? 'Tampilkan lebih sedikit' : `+${hidden} lainnya`}
                <ChevronDown className={cn('size-4 transition-transform', expanded && 'rotate-180')} aria-hidden="true" />
              </button>
            )}
          </div>
        )}

        <div className="mt-auto rounded-xl bg-muted/70 p-3.5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-muted-foreground">{p.price_note || 'Harga mulai'}</p>
              <p className={cn('ota-price leading-tight', p.price !== null ? 'text-xl md:text-2xl' : 'text-base')}>{formatRupiah(p.price) ?? 'Hubungi kami'}</p>
            </div>
            {action && <div className="shrink-0">{action}</div>}
          </div>
        </div>
      </div>
    </article>
  );
}
