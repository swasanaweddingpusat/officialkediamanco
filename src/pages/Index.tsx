import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarSearch, BadgePercent, Video, Headset } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { useSEO } from '@/hooks/useSEO';
import { useArticlePreviews, useHeroSlides, useLocations, usePortfolioPreviews, usePrograms, useVenueInterest } from '@/hooks/useCMS';
import { useFaqs, useStartingPrices, useVenueReviews, summarizeReviews } from '@/hooks/useOta';
import { SearchWidget } from '@/components/ota/SearchWidget';
import { SectionHeader, VenueCard, ReviewCard, RatingStars, venueImage } from '@/components/ota/OtaKit';
import { PackageCard } from '@/components/ota/PackageCard';
import { NewsletterCta } from '@/components/ota/NewsletterCta';
import { CMSImage } from '@/components/CMSImage';
import { cmsImageUrl, cmsImageSrcSet } from '@/lib/cms-image';
import { portfolioPath, promotionPath } from '@/lib/content-url';
import heroFallback from '@/assets/editorial-ballroom.jpg';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const USPS = [
  { icon: CalendarSearch, title: 'Cek tanggal online', text: 'Lihat tanggal yang masih kosong di setiap ballroom.' },
  { icon: BadgePercent, title: 'Penawaran 1×24 jam', text: 'Gratis dan tanpa komitmen, langsung dari tim venue.' },
  { icon: Video, title: 'Survei & tur 360°', text: 'Lihat ballroom secara virtual sebelum datang.' },
  { icon: Headset, title: 'Didampingi tim', text: 'Dibantu sampai tanggal acara Anda terkunci.' },
];

const STEPS = [
  { title: 'Pilih venue', desc: 'Bandingkan kapasitas, fasilitas, galeri, dan paket setiap ballroom.' },
  { title: 'Cek tanggal & sesi', desc: 'Tanggal yang sudah terisi otomatis tertutup di kalender.' },
  { title: 'Isi form & kirim', desc: 'Permintaan tersimpan dan langsung terhubung ke WhatsApp tim kami.' },
  { title: 'Konfirmasi & kunci tanggal', desc: 'Penawaran dikirim dalam 1×24 jam. Tanggal terkunci setelah tanda jadi.' },
];

const Index = () => {
  useSEO({
    title: 'Kediaman Corp - The Best Choice Venue Operator',
    description: 'Cari dan booking ballroom pernikahan & acara di Jakarta dan Bandung. Cek tanggal kosong, bandingkan paket & harga, dan dapatkan penawaran dalam 1×24 jam.',
    url: 'https://kediaman.co/',
    type: 'website',
    includeOrganization: true,
    includeWebsite: true,
    includeLocalBusiness: true,
    breadcrumbs: [{ name: 'Home', url: 'https://kediaman.co/' }],
  });

  const { data: slides = [] } = useHeroSlides();
  const { data: locations = [] } = useLocations();
  const { data: programs = [] } = usePrograms();
  const { data: portfolios = [] } = usePortfolioPreviews();
  const { data: articles = [] } = useArticlePreviews();
  const { data: interest = {} } = useVenueInterest();
  const { data: prices, packages } = useStartingPrices();
  const { data: reviews = [] } = useVenueReviews();
  const { data: faqs = [] } = useFaqs();
  const [city, setCity] = useState('Semua');

  const slide = slides.find((s) => s.is_active);
  const heroImage = slide?.image_url || heroFallback;
  const venues = useMemo(() => locations.filter((l) => l.is_active), [locations]);
  const cities = useMemo(() => ['Semua', ...new Set(venues.map((v) => v.category).filter(Boolean) as string[])], [venues]);
  const shownVenues = city === 'Semua' ? venues : venues.filter((v) => v.category === city);
  const promos = programs.filter((p) => p.is_active !== false);
  const featuredPackages = packages.filter((p) => p.is_featured && p.is_active).slice(0, 4);
  const summary = summarizeReviews(reviews);
  const publishedArticles = articles.filter((a) => a.is_published !== false).slice(0, 3);

  return (
    <Layout>
      {/* Hero + pencarian */}
      <section className="relative">
        <div className="absolute inset-x-0 top-0 h-[340px] md:h-[400px] overflow-hidden bg-primary">
          <img src={cmsImageUrl(heroImage, 1920)} srcSet={cmsImageSrcSet(heroImage)} sizes="100vw" alt="" fetchPriority="high" decoding="async" width={1920} height={1088} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/35 to-black/45" aria-hidden="true" />
        </div>
        <div className="relative ota-container pt-10 md:pt-16">
          <div className="text-center text-white mb-6 md:mb-8">
            <h1 className="text-[26px] md:text-4xl font-semibold tracking-tight">Hai, mau menikah <span className="font-extrabold">di mana?</span></h1>
            <p className="mt-2 text-sm md:text-base text-white/90">{slide?.description || 'Cek tanggal kosong di semua ballroom Kediaman dalam satu pencarian.'}</p>
          </div>
          <SearchWidget className="max-w-5xl mx-auto shadow-xl" />
        </div>
      </section>

      <div className="ota-container space-y-12 md:space-y-14 mt-8 md:mt-10">
        {/* Keunggulan */}
        <section aria-label="Keunggulan" className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {USPS.map(({ icon: Icon, title, text }) => (
            <div key={title} className="ota-card p-3.5 md:p-4 flex gap-3 items-start">
              <span className="size-10 rounded-xl bg-secondary text-primary flex items-center justify-center shrink-0"><Icon className="size-5" aria-hidden="true" /></span>
              <span className="min-w-0"><span className="block font-bold text-sm md:text-[15px]">{title}</span><span className="block text-xs md:text-[13px] text-muted-foreground">{text}</span></span>
            </div>
          ))}
        </section>

        {/* Promo */}
        {promos.length > 0 && (
          <section>
            <SectionHeader title="Promo spesial" href="/promo" />
            <div className="ota-scroll-x -mx-4 px-4 sm:mx-0 sm:px-0">
              {promos.map((p) => (
                <Link key={p.id} to={promotionPath(p)} className="shrink-0 w-[86%] sm:w-[48%] lg:w-[32%] group">
                  <div className="relative aspect-[16/9] rounded-2xl overflow-hidden bg-muted">
                    {p.image_url && <CMSImage src={p.image_url} imageWidth={720} sizes="(max-width: 640px) 86vw, 400px" alt={p.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.02] transition-transform" />}
                  </div>
                  <p className="mt-2 font-bold text-sm line-clamp-1">{p.name}</p>
                  {p.category && <p className="text-xs text-muted-foreground">{p.category}</p>}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Venue populer */}
        <section id="koleksi-venue" className="scroll-mt-24">
          <SectionHeader title="Venue populer" subtitle="Ballroom pilihan untuk pernikahan dan acara Anda." href="/lokasi" linkLabel="Lihat semua venue" />
          <div className="ota-scroll-x mb-4">
            {cities.map((c) => (
              <button key={c} type="button" className="ota-chip" aria-pressed={city === c} onClick={() => setCity(c)}>{c}</button>
            ))}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {shownVenues.slice(0, 8).map((v) => (
              <VenueCard key={v.id} venue={v} price={prices[v.id]} views={interest[v.id]?.views} />
            ))}
          </div>
        </section>

        {/* Paket unggulan */}
        {featuredPackages.length > 0 && (
          <section>
            <SectionHeader title="Paket unggulan" href="/harga" linkLabel="Semua paket" />
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
              {featuredPackages.map((p) => (
                <PackageCard
                  key={p.id}
                  pkg={p}
                  venueHref={p.locations?.slug ? `/lokasi/${p.locations.slug}` : undefined}
                  fallbackImage={(() => { const loc = locations.find((l) => l.id === p.location_id); return loc ? venueImage(loc) : null; })()}
                  maxInclusions={3}
                  action={<Link to={`/harga${p.location_id ? `?venue=${p.location_id}` : ''}`} className="inline-flex h-10 items-center rounded-xl bg-primary px-4 text-sm font-extrabold text-primary-foreground hover:opacity-90">Detail</Link>}
                />
              ))}
            </div>
          </section>
        )}

        {/* Ulasan */}
        {summary.count > 0 && (
          <section>
            <SectionHeader
              title="Kata pasangan Kediaman"
              subtitle={<span className="inline-flex items-center gap-2"><RatingStars value={summary.average} /> <b className="text-foreground">{summary.average.toFixed(1)}</b> dari {summary.count} ulasan</span>}
              href="/ulasan"
              linkLabel="Semua ulasan"
            />
            <div className="ota-scroll-x -mx-4 px-4 sm:mx-0 sm:px-0">
              {reviews.slice(0, 6).map((r) => <div key={r.id} className="shrink-0 w-[85%] sm:w-[48%] lg:w-[32%]"><ReviewCard review={r} /></div>)}
            </div>
          </section>
        )}

        {/* Cara booking */}
        <section id="panduan-booking" className="scroll-mt-24">
          <SectionHeader title="Booking venue cukup 4 langkah" subtitle="Gratis, tanpa komitmen, dibantu tim kami sampai tanggal terkunci." />
          <ol className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {STEPS.map((s, i) => (
              <li key={s.title} className="ota-card p-4 flex gap-3">
                <span className="size-8 rounded-full bg-primary text-primary-foreground font-extrabold flex items-center justify-center shrink-0">{i + 1}</span>
                <span><span className="block font-bold">{s.title}</span><span className="block text-sm text-muted-foreground">{s.desc}</span></span>
              </li>
            ))}
          </ol>
        </section>

        {/* Portfolio */}
        {portfolios.length > 0 && (
          <section>
            <SectionHeader title="Inspirasi dari pasangan" href="/portfolio" linkLabel="Semua portfolio" />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              {portfolios.map((p) => (
                <Link key={p.id} to={portfolioPath(p)} className="group">
                  <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-muted">
                    {p.photo_url && <CMSImage src={p.photo_url} imageWidth={480} sizes="(max-width: 1024px) 50vw, 280px" alt={p.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />}
                  </div>
                  <p className="mt-2 text-[11px] font-bold uppercase tracking-wide text-accent-foreground">{p.specialization || 'Wedding'}</p>
                  <p className="font-bold text-sm line-clamp-1">{p.name}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Artikel */}
        {publishedArticles.length > 0 && (
          <section>
            <SectionHeader title="Panduan sebelum booking" href="/artikel" linkLabel="Semua artikel" />
            <div className="grid md:grid-cols-3 gap-3 md:gap-4">
              {publishedArticles.map((a) => (
                <Link key={a.id} to={`/artikel/${a.slug}`} className="ota-card overflow-hidden flex flex-col hover:shadow-lg transition-shadow">
                  {a.featured_image && <div className="relative aspect-[16/9] bg-muted"><CMSImage src={a.featured_image} imageWidth={640} sizes="(max-width: 768px) 100vw, 380px" alt="" className="absolute inset-0 w-full h-full object-cover" /></div>}
                  <div className="p-4 flex flex-col gap-1.5">
                    {a.category && <span className="text-[11px] font-bold uppercase tracking-wide text-accent-foreground">{a.category}</span>}
                    <span className="font-bold leading-snug line-clamp-2">{a.title}</span>
                    {a.excerpt && <span className="text-sm text-muted-foreground line-clamp-2">{a.excerpt}</span>}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* FAQ singkat */}
        {faqs.length > 0 && (
          <section>
            <SectionHeader title="Pertanyaan yang sering ditanyakan" href="/bantuan" linkLabel="Pusat bantuan" />
            <Accordion type="single" collapsible className="ota-card px-4 md:px-6">
              {faqs.slice(0, 5).map((f) => (
                <AccordionItem key={f.id} value={f.id}>
                  <AccordionTrigger className="text-left font-bold hover:no-underline">{f.question}</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground whitespace-pre-line">{f.answer}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>
        )}

        <NewsletterCta source="homepage" />
      </div>
    </Layout>
  );
};

export default Index;
