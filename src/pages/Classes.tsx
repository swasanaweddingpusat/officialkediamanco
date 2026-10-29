// Halaman Tentang Kami (/tentang-kami). Bagian-bagiannya diatur dari Admin → Tentang kami
// (about_sections); di bawahnya otomatis tampil venue, portfolio, dan ulasan dari CMS.
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Users, Award, Heart, Star, Building2, Check, Quote, MessageCircle, ArrowRight, Sparkles } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { useSiteSettings, useLocations, useTrainers, useAboutSections, usePortfolioPreviews } from '@/hooks/useCMS';
import { useStartingPrices, useVenueReviews, summarizeReviews } from '@/hooks/useOta';
import { useSEO } from '@/hooks/useSEO';
import { CMSImage } from '@/components/CMSImage';
import { Breadcrumbs, SectionHeader, VenueCard, ReviewCard, RatingStars, venueImage } from '@/components/ota/OtaKit';
import { waLinkFrom } from '@/components/layout/Navbar';
import { portfolioPath } from '@/lib/content-url';
import { cn } from '@/lib/utils';

type Content = Record<string, any>;
type Section = { id: string; section_type: string; is_visible: boolean; sort_order: number; content: Content | null; styling: Content | null };

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5, ease: [0.4, 0, 0.2, 1] as const } }),
};
const reveal = (i = 0) => ({ initial: 'hidden', whileInView: 'visible', viewport: { once: true, margin: '-60px' }, custom: i, variants: fadeUp });

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = { Heart, Star, Users, Award, MapPin, Building2 };

const Eyebrow = ({ children, light }: { children: React.ReactNode; light?: boolean }) => (
  <span className={cn('inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide', light ? 'bg-white/10 text-primary-foreground' : 'bg-secondary text-primary')}>
    <Sparkles className="size-3.5" aria-hidden="true" />{children}
  </span>
);

const Classes = () => {
  const { data: siteSettings } = useSiteSettings();
  const { data: locations = [] } = useLocations();
  const { data: trainers = [] } = useTrainers();
  const { data: portfolios = [] } = usePortfolioPreviews();
  const { data: sections } = useAboutSections();
  const { data: prices } = useStartingPrices();
  const { data: reviews = [] } = useVenueReviews();

  const siteName = siteSettings?.site_name || 'Kediaman Corp';
  const activeLocations = locations.filter((l) => l.is_active);
  const activePortfolios = trainers.filter((t) => t.is_active);
  const waLink = waLinkFrom(siteSettings);
  const reviewSummary = summarizeReviews(reviews);
  const heroImages = activeLocations.map(venueImage).filter((src) => src && !src.includes('placeholder')).slice(0, 3);

  useSEO({
    title: `Tentang Kami | ${siteName}`,
    description: `Kenali lebih dekat ${siteName}, penyedia venue dan layanan event premium terpercaya.`,
    url: 'https://kediaman.co/tentang-kami',
    breadcrumbs: [{ name: 'Home', url: 'https://kediaman.co/' }, { name: 'Tentang Kami', url: 'https://kediaman.co/tentang-kami' }],
  });

  const visibleSections = ((sections || []) as Section[]).filter((s) => s.is_visible).sort((a, b) => a.sort_order - b.sort_order);
  const hasCta = visibleSections.some((s) => s.section_type === 'cta');

  const renderHero = (content: Content, key: string) => (
    <section key={key} className="bg-card border-b border-border">
      <div className="ota-container py-6 md:py-12">
        <Breadcrumbs items={[{ name: 'Tentang kami' }]} className="mb-6" />
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <Eyebrow>{content.subtitle || 'Tentang kami'}</Eyebrow>
            <h1 className="mt-4 text-3xl md:text-5xl font-extrabold tracking-tight leading-[1.1]">{content.title || siteName}</h1>
            {content.description && <p className="mt-4 text-base md:text-lg text-muted-foreground leading-relaxed max-w-xl">{content.description}</p>}
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/lokasi" className="inline-flex items-center gap-2 h-12 px-6 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:opacity-90">
                <MapPin className="size-4" aria-hidden="true" />Lihat venue kami
              </Link>
              {waLink && (
                <a href={waLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 h-12 px-6 rounded-xl border border-input bg-card font-bold text-sm hover:bg-muted">
                  <MessageCircle className="size-4" aria-hidden="true" />Konsultasi gratis
                </a>
              )}
            </div>
            <dl className="mt-8 grid grid-cols-3 gap-3 max-w-md">
              {[
                [`${activeLocations.length || '–'}`, 'Venue'],
                [`${activePortfolios.length ? `${activePortfolios.length}+` : '–'}`, 'Acara digelar'],
                [reviewSummary.count ? reviewSummary.average.toFixed(1) : '★', reviewSummary.count ? 'Rating pasangan' : 'Pelayanan'],
              ].map(([v, l]) => (
                <div key={l} className="rounded-xl bg-secondary/60 px-3 py-3">
                  <dt className="sr-only">{l}</dt>
                  <dd className="text-xl md:text-2xl font-extrabold text-primary">{v}</dd>
                  <dd className="text-xs text-muted-foreground">{l}</dd>
                </div>
              ))}
            </dl>
          </motion.div>

          {heroImages.length > 0 && (
            <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, delay: 0.1 }} className="grid grid-cols-5 grid-rows-2 gap-3 h-[300px] md:h-[440px]">
              {heroImages.map((src, i) => (
                <div key={src} className={cn('relative overflow-hidden rounded-2xl bg-muted', i === 0 ? 'col-span-3 row-span-2' : 'col-span-2')}>
                  <CMSImage src={src} imageWidth={i === 0 ? 900 : 520} sizes={i === 0 ? '(max-width: 1024px) 60vw, 420px' : '(max-width: 1024px) 40vw, 280px'} loading="eager" alt="" className="absolute inset-0 w-full h-full object-cover" />
                </div>
              ))}
              {heroImages.length === 1 && <div className="col-span-2 row-span-2 rounded-2xl bg-secondary" aria-hidden="true" />}
              {heroImages.length === 2 && <div className="col-span-2 rounded-2xl bg-secondary" aria-hidden="true" />}
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );

  const renderSection = (section: Section) => {
    const content = section.content || {};
    const styling = section.styling || {};
    const align = styling.text_align === 'center' ? 'text-center mx-auto' : styling.text_align === 'right' ? 'text-right ml-auto' : '';

    switch (section.section_type) {
      case 'hero':
        return null; // dirender terpisah di atas

      case 'text':
        return (
          <motion.section key={section.id} {...reveal()} className={cn('max-w-3xl', align || 'mx-auto text-center')}>
            {content.subtitle && <Eyebrow>{content.subtitle}</Eyebrow>}
            {content.title && <h2 className="mt-3 text-2xl md:text-4xl font-extrabold tracking-tight">{content.title}</h2>}
            {content.description && <p className="mt-4 text-muted-foreground text-base md:text-lg leading-relaxed whitespace-pre-line">{content.description}</p>}
          </motion.section>
        );

      case 'text_columns':
        return (
          <section key={section.id} className="grid md:grid-cols-2 gap-4 md:gap-6">
            <motion.div {...reveal(0)} className="ota-card p-6 md:p-8">
              {content.left_label && <Eyebrow>{content.left_label}</Eyebrow>}
              {content.left_title && <h2 className="mt-4 text-2xl md:text-3xl font-extrabold leading-snug">{content.left_title}</h2>}
              {content.left_description && <p className="mt-3 text-muted-foreground leading-relaxed whitespace-pre-line">{content.left_description}</p>}
            </motion.div>
            <motion.div {...reveal(1)} className="rounded-2xl bg-primary text-primary-foreground p-6 md:p-8">
              {content.right_label && <Eyebrow light>{content.right_label}</Eyebrow>}
              <ul className="mt-5 space-y-3.5">
                {(content.right_items || []).map((item: string, i: number) => (
                  <li key={i} className="flex gap-3">
                    <span className="grid place-items-center size-6 shrink-0 rounded-full bg-gold text-primary mt-0.5"><Check className="size-3.5" strokeWidth={3} aria-hidden="true" /></span>
                    <span className="text-primary-foreground/90 leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </section>
        );

      case 'values': {
        const items = content.items || [];
        if (items.length === 0) return null;
        return (
          <section key={section.id}>
            <motion.div {...reveal()} className="text-center max-w-2xl mx-auto mb-8">
              {content.heading_script && <Eyebrow>{content.heading_script}</Eyebrow>}
              {content.heading && <h2 className="mt-3 text-2xl md:text-4xl font-extrabold tracking-tight">{content.heading}</h2>}
            </motion.div>
            <div className={cn('grid grid-cols-1 sm:grid-cols-2 gap-4', items.length >= 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3')}>
              {items.map((value: Content, index: number) => {
                const Icon = iconMap[value.icon] || Heart;
                return (
                  <motion.div key={index} {...reveal(index)} className="ota-card p-6 group hover:shadow-lg hover:-translate-y-0.5 transition-all">
                    <span className="grid place-items-center size-12 rounded-xl bg-secondary text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <Icon className="size-6" />
                    </span>
                    <h3 className="mt-4 text-lg font-extrabold">{value.title}</h3>
                    <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{value.description}</p>
                  </motion.div>
                );
              })}
            </div>
          </section>
        );
      }

      case 'stats': {
        const dynamicItems = content.show_dynamic ? [
          { number: `${activeLocations.length}+`, label: 'Lokasi venue', icon: Building2 },
          { number: `${activePortfolios.length}+`, label: 'Portfolio acara', icon: Award },
        ] : [];
        const allStats = [...dynamicItems, ...(content.items || []).map((s: Content) => ({ ...s, icon: Star }))];
        if (!allStats.length) return null;
        return (
          <motion.section key={section.id} {...reveal()} className="relative overflow-hidden rounded-3xl bg-primary text-primary-foreground px-6 py-10 md:px-12 md:py-14">
            <div className="pointer-events-none absolute -right-20 -top-20 size-72 rounded-full bg-gold/20 blur-3xl" aria-hidden="true" />
            <div className={cn('relative grid grid-cols-2 gap-8', allStats.length >= 4 ? 'md:grid-cols-4' : 'md:grid-cols-3')}>
              {allStats.map((stat: Content, index: number) => {
                const Icon = stat.icon as React.ComponentType<{ className?: string }>;
                return (
                  <div key={`${stat.label}-${index}`} className="text-center md:text-left md:border-l md:border-white/15 md:pl-6 first:md:border-0 first:md:pl-0">
                    <Icon className="size-6 text-gold mx-auto md:mx-0" />
                    <p className="mt-3 text-3xl md:text-5xl font-extrabold tracking-tight">{stat.number}</p>
                    <p className="mt-1 text-sm text-primary-foreground/70">{stat.label}</p>
                  </div>
                );
              })}
            </div>
          </motion.section>
        );
      }

      case 'cta':
        return renderCta(content, section.id);

      case 'quote':
        if (!content.quote) return null;
        return (
          <motion.figure key={section.id} {...reveal()} className="ota-card relative max-w-3xl mx-auto p-8 md:p-12 text-center">
            <span className="absolute -top-6 left-1/2 -translate-x-1/2 grid place-items-center size-12 rounded-full bg-gold text-primary shadow-md">
              <Quote className="size-5" fill="currentColor" aria-hidden="true" />
            </span>
            <blockquote className="text-xl md:text-3xl font-bold leading-snug tracking-tight">“{content.quote}”</blockquote>
            {content.author && (
              <figcaption className="mt-6 inline-flex items-center gap-3 text-sm">
                <span className="grid place-items-center size-10 rounded-full bg-secondary font-extrabold text-primary">{String(content.author).slice(0, 1).toUpperCase()}</span>
                <span className="font-bold">{content.author}</span>
              </figcaption>
            )}
          </motion.figure>
        );

      default:
        return null;
    }
  };

  function renderCta(content: Content, key: string) {
    const bg = heroImages[1] || heroImages[0];
    return (
      <motion.section key={key} {...reveal()} className="relative overflow-hidden rounded-3xl bg-primary text-primary-foreground">
        {bg && <CMSImage src={bg} imageWidth={1400} sizes="100vw" alt="" className="absolute inset-0 w-full h-full object-cover opacity-25" />}
        <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/90 to-primary/40" aria-hidden="true" />
        <div className="relative px-6 py-12 md:px-12 md:py-16 max-w-2xl">
          {content.subtitle && <Eyebrow light>{content.subtitle}</Eyebrow>}
          <h2 className="mt-3 text-2xl md:text-4xl font-extrabold tracking-tight">{content.title || 'Wujudkan acara impian Anda bersama kami'}</h2>
          {content.description && <p className="mt-3 text-primary-foreground/80 leading-relaxed">{content.description}</p>}
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <a href={content.button_link || '/lokasi'} className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-xl bg-gold text-primary font-extrabold text-sm hover:brightness-105">
              {content.button_text || 'Cari venue'}<ArrowRight className="size-4" aria-hidden="true" />
            </a>
            {(content.show_whatsapp ?? true) && waLink && (
              <a href={waLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-xl border border-white/30 font-bold text-sm hover:bg-white/10">
                <MessageCircle className="size-4" aria-hidden="true" />Hubungi kami
              </a>
            )}
          </div>
        </div>
      </motion.section>
    );
  }

  const heroSection = visibleSections.find((s) => s.section_type === 'hero');

  return (
    <Layout>
      {renderHero(heroSection?.content || {}, heroSection?.id || 'hero-default')}

      <div className="ota-container py-10 md:py-14 space-y-14 md:space-y-20">
        {visibleSections.filter((s) => s.section_type !== 'cta').map(renderSection)}

        {activeLocations.length > 0 && (
          <section>
            <SectionHeader title="Venue kami" subtitle="Ballroom yang kami kelola langsung, siap untuk pernikahan dan acara Anda." href="/lokasi" linkLabel="Lihat semua venue" />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              {activeLocations.slice(0, 8).map((v) => <VenueCard key={v.id} venue={v} price={prices[v.id]} />)}
            </div>
          </section>
        )}

        {portfolios.length > 0 && (
          <section>
            <SectionHeader title="Momen yang kami rayakan" href="/portfolio" linkLabel="Semua portfolio" />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              {portfolios.map((p, i) => (
                <Link key={p.id} to={portfolioPath(p)} className={cn('group relative overflow-hidden rounded-2xl bg-muted aspect-[3/4]', i % 2 === 1 && 'lg:translate-y-6')}>
                  {p.photo_url && <CMSImage src={p.photo_url} imageWidth={480} sizes="(max-width: 1024px) 50vw, 280px" alt={p.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />}
                  <span className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/75 to-transparent">
                    <span className="block text-[11px] font-bold uppercase tracking-wide text-white/75">{p.specialization || 'Wedding'}</span>
                    <span className="block font-bold text-sm text-white line-clamp-1">{p.name}</span>
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {reviews.length > 0 && (
          <section className="lg:pt-6">
            <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
              <div>
                <h2 className="text-xl md:text-2xl font-extrabold">Kata pasangan tentang kami</h2>
                <p className="mt-1 inline-flex items-center gap-2 text-sm text-muted-foreground"><RatingStars value={reviewSummary.average} />{reviewSummary.average.toFixed(1)} dari {reviewSummary.count} ulasan</p>
              </div>
              <Link to="/ulasan" className="text-sm font-bold text-primary hover:underline">Semua ulasan</Link>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              {reviews.slice(0, 3).map((r) => <ReviewCard key={r.id} review={r} />)}
            </div>
          </section>
        )}

        {hasCta
          ? visibleSections.filter((s) => s.section_type === 'cta').map((s) => renderCta(s.content || {}, s.id))
          : renderCta({}, 'cta-default')}
      </div>
    </Layout>
  );
};

export default Classes;
