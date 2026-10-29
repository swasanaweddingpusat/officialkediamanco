// Komponen dasar desain OTA (pola tiket.com) untuk halaman publik Kediaman.
import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Star, MapPin, Users, ChevronRight, Eye } from 'lucide-react';
import { CMSImage } from '@/components/CMSImage';
import { venuePath } from '@/lib/venue-url';
import { cn } from '@/lib/utils';
import { formatRupiah, type VenueReview } from '@/hooks/useOta';

export function SectionHeader({ title, subtitle, href, linkLabel = 'Lihat semua', className }: { title: ReactNode; subtitle?: ReactNode; href?: string; linkLabel?: string; className?: string }) {
  return (
    <div className={cn('flex items-end justify-between gap-4 mb-4', className)}>
      <div className="min-w-0">
        <h2 className="ota-section-title">{title}</h2>
        {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
      </div>
      {href && (
        <Link to={href} className="shrink-0 inline-flex items-center gap-1 text-sm font-bold text-primary hover:underline">
          {linkLabel}<ChevronRight className="size-4" aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}

export function PageHeader({ title, subtitle, crumbs, children }: { title: ReactNode; subtitle?: ReactNode; crumbs?: { name: string; href?: string }[]; children?: ReactNode }) {
  return (
    <div className="bg-card border-b border-border">
      <div className="ota-container py-6 md:py-8">
        {crumbs && crumbs.length > 0 && <Breadcrumbs items={crumbs} className="mb-3" />}
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm md:text-base text-muted-foreground mt-1.5 max-w-2xl">{subtitle}</p>}
        {children}
      </div>
    </div>
  );
}

export function Breadcrumbs({ items, className }: { items: { name: string; href?: string }[]; className?: string }) {
  return (
    <nav aria-label="Breadcrumb" className={cn('text-xs md:text-sm text-muted-foreground', className)}>
      <ol className="flex flex-wrap items-center gap-1">
        <li><Link to="/" className="hover:text-foreground">Beranda</Link></li>
        {items.map((it, i) => (
          <li key={i} className="flex items-center gap-1">
            <ChevronRight className="size-3.5" aria-hidden="true" />
            {it.href && i < items.length - 1 ? <Link to={it.href} className="hover:text-foreground">{it.name}</Link> : <span className="text-foreground font-semibold" aria-current="page">{it.name}</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function RatingStars({ value, size = 'sm', className }: { value: number; size?: 'sm' | 'md'; className?: string }) {
  const s = size === 'md' ? 'size-5' : 'size-4';
  return (
    <span className={cn('inline-flex items-center gap-0.5', className)} role="img" aria-label={`Rating ${value.toFixed(1)} dari 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={cn(s, i <= Math.round(value) ? 'fill-[hsl(var(--gold))] text-[hsl(var(--gold))]' : 'text-border')} aria-hidden="true" />
      ))}
    </span>
  );
}

type VenueLike = {
  id: string;
  slug?: string | null;
  name: string;
  category?: string | null;
  address?: string | null;
  image_url?: string | null;
  images?: string[] | null;
  ballroom_layout_capacity?: string | null;
  is_coming_soon?: boolean | null;
  matterport_360_url?: string | null;
};

export const venueImage = (v: VenueLike) => v.image_url || v.images?.[0] || '/placeholder.svg';

/** Kartu venue vertikal (beranda, carousel). */
export function VenueCard({ venue, price, views, search = '', className }: { venue: VenueLike; price?: number; views?: number; search?: string; className?: string }) {
  return (
    <Link to={`${venuePath(venue)}${search}`} className={cn('group ota-card overflow-hidden flex flex-col hover:shadow-lg transition-shadow', className)}>
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <CMSImage src={venueImage(venue)} imageWidth={480} sizes="(max-width: 640px) 70vw, 260px" alt="" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        <div className="absolute left-2.5 top-2.5 flex flex-wrap gap-1.5">
          {venue.is_coming_soon && <span className="ota-badge">Segera hadir</span>}
          {venue.matterport_360_url && <span className="ota-badge">Tur 360°</span>}
        </div>
      </div>
      <div className="p-3.5 flex flex-col gap-1 flex-1">
        <h3 className="font-bold text-[15px] leading-snug line-clamp-2">{venue.name}</h3>
        {venue.category && <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="size-3.5" aria-hidden="true" />{venue.category}</p>}
        {venue.ballroom_layout_capacity && <p className="text-xs text-muted-foreground flex items-center gap-1"><Users className="size-3.5" aria-hidden="true" />{venue.ballroom_layout_capacity}</p>}
        {views && views >= 10 ? <p className="text-xs text-muted-foreground flex items-center gap-1"><Eye className="size-3.5" aria-hidden="true" />Dilihat {views}× minggu ini</p> : null}
        <div className="mt-auto pt-3">
          {price !== undefined ? (
            <>
              <p className="text-[11px] text-muted-foreground">Paket mulai</p>
              <p className="ota-price text-base">{formatRupiah(price)}</p>
            </>
          ) : (
            <p className="text-sm font-bold text-primary">Lihat paket & tanggal</p>
          )}
        </div>
      </div>
    </Link>
  );
}

export function ReviewCard({ review, showVenue = true }: { review: VenueReview; showVenue?: boolean }) {
  const date = review.event_date ? new Date(review.event_date).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }) : null;
  return (
    <article className="ota-card p-4 md:p-5 flex flex-col gap-3 h-full">
      <div className="flex items-start gap-3">
        {review.photo_url ? (
          <CMSImage src={review.photo_url} imageWidth={96} sizes="44px" alt="" className="size-11 rounded-full object-cover" />
        ) : (
          <span className="size-11 rounded-full bg-secondary text-primary font-extrabold flex items-center justify-center" aria-hidden="true">{review.reviewer_name.slice(0, 1).toUpperCase()}</span>
        )}
        <div className="min-w-0">
          <p className="font-bold leading-tight">{review.reviewer_name}</p>
          <p className="text-xs text-muted-foreground">{[review.event_type, date].filter(Boolean).join(' · ')}</p>
        </div>
        <span className="ml-auto inline-flex items-center gap-1 rounded-lg bg-secondary px-2 py-1 text-sm font-extrabold text-primary"><Star className="size-3.5 fill-current" aria-hidden="true" />{review.rating}</span>
      </div>
      {review.title && <p className="font-bold">{review.title}</p>}
      <p className="text-sm text-muted-foreground line-clamp-5 whitespace-pre-line">{review.body}</p>
      {showVenue && review.locations?.name && (
        <Link to={venuePath({ id: review.location_id || '', slug: review.locations.slug })} className="mt-auto text-xs font-bold text-primary hover:underline">{review.locations.name}</Link>
      )}
    </article>
  );
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="ota-card p-8 text-center">
      <p className="font-bold text-lg">{title}</p>
      {children && <div className="text-sm text-muted-foreground mt-2">{children}</div>}
    </div>
  );
}
