// Detail promo — gaya OTA. Rute: /promo/:id (dan /tentang-kami/:id lama → dialihkan).
import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { CalendarClock, Check, Copy, MapPin, MessageCircle } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { useLocations, usePrograms, useSiteSettings } from '@/hooks/useCMS';
import { useSEO } from '@/hooks/useSEO';
import { promotionPath } from '@/lib/content-url';
import { venuePath } from '@/lib/venue-url';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { CMSImage } from '@/components/CMSImage';
import { Breadcrumbs, EmptyState } from '@/components/ota/OtaKit';
import { BookingDialog } from '@/components/booking/BookingDialog';
import { waLinkFrom } from '@/components/layout/Navbar';
import { promoExpired, promoPeriod } from './Packages';

type PromoDetail = {
  id: string; slug: string | null; name: string; description: string | null; image_url: string | null; category: string | null;
  cta_label: string | null; cta_link: string | null; start_date?: string | null; end_date?: string | null; content?: string | null;
  terms?: unknown; promo_code?: string | null; location_ids?: unknown;
};

const asList = (v: unknown): string[] => (Array.isArray(v) ? v.map(String).filter(Boolean) : []);

const ProgramDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const current = useLocation();
  const { data: programs, isLoading } = usePrograms();
  const { data: locations = [] } = useLocations();
  const { data: settings } = useSiteSettings();
  const [copied, setCopied] = useState(false);
  const program = (programs as PromoDetail[] | undefined)?.find((p) => p.slug === id || p.id === id);

  useEffect(() => {
    if (program && current.pathname !== promotionPath(program)) navigate(`${promotionPath(program)}${current.search}${current.hash}`, { replace: true });
  }, [program, current.pathname, current.search, current.hash, navigate]);

  useSEO({
    title: program ? `${program.name} | Promo Kediaman Corp` : 'Promo | Kediaman Corp',
    description: program?.description || 'Penawaran dan promo venue Kediaman Corp untuk acara Anda.',
    image: program?.image_url || undefined,
    url: program ? `https://kediaman.co${promotionPath(program)}` : undefined,
  });

  if (isLoading) {
    return <Layout><div className="ota-container py-6 space-y-4"><Skeleton className="h-5 w-48" /><Skeleton className="aspect-[16/7] w-full rounded-2xl" /><Skeleton className="h-40" /></div></Layout>;
  }
  if (!program) {
    return (
      <Layout>
        <div className="ota-container py-16">
          <EmptyState title="Promo tidak ditemukan"><p>Promo mungkin sudah berakhir.</p><Link to="/promo" className="inline-flex mt-4 h-11 items-center px-5 rounded-xl bg-primary text-primary-foreground font-bold">Lihat promo lain</Link></EmptyState>
        </div>
      </Layout>
    );
  }

  const period = promoPeriod(program);
  const expired = promoExpired(program);
  const terms = asList(program.terms);
  const venueIds = asList(program.location_ids);
  const venues = locations.filter((l) => l.is_active && venueIds.includes(l.id));
  const wa = waLinkFrom(settings);
  const others = ((programs || []) as PromoDetail[]).filter((p) => p.id !== program.id).slice(0, 3);
  const copy = async () => {
    if (!program.promo_code) return;
    try { await navigator.clipboard.writeText(program.promo_code); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* abaikan */ }
  };

  return (
    <Layout>
      <div className="ota-container py-4 md:py-6">
        <Breadcrumbs items={[{ name: 'Promo', href: '/promo' }, { name: program.name }]} className="mb-4" />
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          <article className="flex-1 min-w-0 space-y-5 w-full">
            {program.image_url && (
              <div className="relative aspect-[16/9] rounded-2xl overflow-hidden bg-muted">
                <CMSImage src={program.image_url} imageWidth={1200} sizes="(max-width: 1024px) 100vw, 760px" loading="eager" alt={program.name} className="absolute inset-0 w-full h-full object-cover" />
              </div>
            )}
            <div className="ota-card p-5 space-y-3">
              {program.category && <span className="inline-block rounded-md bg-accent text-accent-foreground text-xs font-bold px-2 py-0.5">{program.category}</span>}
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">{program.name}</h1>
              {program.description && <p className="text-muted-foreground">{program.description}</p>}
              {program.content && <div className="text-[15px] leading-relaxed whitespace-pre-line pt-2 border-t border-border">{program.content}</div>}
            </div>
            {terms.length > 0 && (
              <section className="ota-card p-5">
                <h2 className="text-lg font-extrabold mb-3">Syarat &amp; ketentuan</h2>
                <ol className="list-decimal pl-5 space-y-1.5 text-sm text-muted-foreground">{terms.map((t) => <li key={t}>{t}</li>)}</ol>
              </section>
            )}
            {venues.length > 0 && (
              <section className="ota-card p-5">
                <h2 className="text-lg font-extrabold mb-3">Berlaku di venue</h2>
                <div className="grid sm:grid-cols-2 gap-3">
                  {venues.map((v) => (
                    <Link key={v.id} to={venuePath(v)} className="flex items-center gap-3 rounded-xl border border-border p-2.5 hover:border-primary">
                      <span className="relative size-16 rounded-lg overflow-hidden bg-muted shrink-0">{(v.image_url || v.images?.[0]) && <CMSImage src={v.image_url || v.images![0]} imageWidth={160} sizes="64px" alt="" className="absolute inset-0 w-full h-full object-cover" />}</span>
                      <span className="min-w-0"><span className="block font-bold text-sm line-clamp-1">{v.name}</span><span className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="size-3.5" aria-hidden="true" />{v.category}</span></span>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </article>

          <aside className="w-full lg:w-[340px] shrink-0 lg:sticky lg:top-40 space-y-4">
            <div className="ota-card p-5 space-y-4">
              {period && <p className="flex items-center gap-2 text-sm"><CalendarClock className="size-4 text-muted-foreground" aria-hidden="true" /><span><span className="block text-xs text-muted-foreground">Periode promo</span><b>{period}</b></span></p>}
              {expired && <p className="rounded-xl bg-[hsl(var(--danger-soft))] text-destructive text-sm font-bold p-3">Promo ini sudah berakhir.</p>}
              {program.promo_code && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Kode promo</p>
                  <button type="button" onClick={copy} className="w-full flex items-center justify-between h-12 px-4 rounded-xl border-2 border-dashed border-primary font-mono font-extrabold text-primary">
                    {program.promo_code}<span className="inline-flex items-center gap-1 text-xs font-sans">{copied ? <><Check className="size-4" />Tersalin</> : <><Copy className="size-4" />Salin</>}</span>
                  </button>
                </div>
              )}
              {program.cta_link ? (
                <a href={program.cta_link} target={program.cta_link.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer" className="w-full inline-flex items-center justify-center h-12 rounded-xl bg-primary text-primary-foreground font-extrabold">{program.cta_label || 'Ambil promo'}</a>
              ) : (
                <BookingDialog><Button className="w-full h-12 rounded-xl font-extrabold" disabled={expired}>{program.cta_label || 'Ajukan booking dengan promo ini'}</Button></BookingDialog>
              )}
              <a href={wa} target="_blank" rel="noopener noreferrer" className="w-full inline-flex items-center justify-center gap-2 h-11 rounded-xl border border-input font-bold"><MessageCircle className="size-4" />Tanya promo via WhatsApp</a>
            </div>
            {others.length > 0 && (
              <div className="ota-card p-4">
                <p className="font-extrabold mb-3">Promo lainnya</p>
                <div className="space-y-3">
                  {others.map((p) => (
                    <Link key={p.id} to={promotionPath(p)} className="flex gap-3 items-center">
                      <span className="relative w-20 aspect-[16/10] rounded-lg overflow-hidden bg-muted shrink-0">{p.image_url && <CMSImage src={p.image_url} imageWidth={200} sizes="80px" alt="" className="absolute inset-0 w-full h-full object-cover" />}</span>
                      <span className="text-sm font-bold line-clamp-2">{p.name}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
    </Layout>
  );
};

export default ProgramDetail;
