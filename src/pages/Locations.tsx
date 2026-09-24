import { useState, useMemo, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, ArrowRight, X } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { useBallroomSchedules, useLocations, useVenueInterest } from '@/hooks/useCMS';
import { useSEO } from '@/hooks/useSEO';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { VenueInterestBadge } from '@/components/venue/VenueInterestBadge';

const LOCATION_CATEGORIES = ['Semua', 'Jakarta Selatan', 'Jakarta Timur', 'Bintaro', 'Bandung'] as const;

const Locations = () => {
  const { data: locations, isLoading } = useLocations();
  const { data: schedules = [] } = useBallroomSchedules();
  const { data: interest = {} } = useVenueInterest();
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get('q')?.trim() || '';
  const date = searchParams.get('date') || '';

  useSEO({
    title: "Kediaman Corp - Lokasi & Venue Kami",
    description: "Kunjungi lokasi-lokasi premium Kediaman Corp di Jakarta, Bintaro, dan Bandung.",
    url: "https://official.kediaman.co/lokasi",
    breadcrumbs: [
      { name: "Home", url: "https://official.kediaman.co/" },
      { name: "Lokasi", url: "https://official.kediaman.co/lokasi" }
    ]
  });

  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [unavailableIds, setUnavailableIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!date) { setUnavailableIds(new Set()); return; }
    let cancelled = false;
    supabase
      .from('ballroom_schedules')
      .select('location_id,status')
      .eq('schedule_date', date)
      .in('status', ['booked', 'blocked'])
      .then(({ data }) => {
        if (cancelled) return;
        setUnavailableIds(new Set((data || []).map((r) => r.location_id as string)));
      });
    return () => { cancelled = true; };
  }, [date]);

  const activeLocations = locations?.filter(l => l.is_active) || [];
  const filteredLocations = useMemo(() => {
    let list = activeLocations;
    if (selectedCategory !== 'Semua') list = list.filter(l => l.category === selectedCategory);
    if (q) {
      const needle = q.toLowerCase();
      list = list.filter(
        (l) =>
          l.name?.toLowerCase().includes(needle) ||
          l.address?.toLowerCase().includes(needle) ||
          l.category?.toLowerCase().includes(needle),
      );
    }
    return list;
  }, [activeLocations, selectedCategory, q]);

  const comingSoonLocations = filteredLocations.filter(l => l.is_coming_soon);
  const openLocations = filteredLocations
    .filter(l => !l.is_coming_soon)
    .filter(l => !date || !unavailableIds.has(l.id));
  const unavailableForDate = date
    ? filteredLocations.filter(l => !l.is_coming_soon && unavailableIds.has(l.id))
    : [];

  const clearSearch = () => setSearchParams({});

  return (
    <Layout>
      {/* Hero */}
      <section className="pt-16 lg:pt-24 pb-12 lg:pb-16">
        <div className="container mx-auto px-6 lg:px-12">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <p className="text-primary text-[11px] tracking-[0.3em] uppercase mb-4 flex items-center gap-3">
              <span className="w-8 h-px bg-primary" />
              Venue
            </p>
            <h1 className="font-serif text-4xl lg:text-6xl font-bold mb-8">
              Lokasi <span className="text-primary">Kami</span>
            </h1>
          </motion.div>

          {/* Category Filter */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-wrap gap-2"
          >
            {LOCATION_CATEGORIES.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 text-[11px] tracking-[0.15em] uppercase rounded-full border transition-all duration-300 ${
                  selectedCategory === category
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-border/50 text-muted-foreground hover:border-primary hover:text-primary'
                }`}
              >
                {category}
              </button>
            ))}
          </motion.div>

          {(q || date) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-6 flex flex-wrap items-center gap-2 text-xs"
            >
              <span className="text-muted-foreground uppercase tracking-widest text-[10px]">Filter aktif:</span>
              {q && (
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary">
                  Pencarian: <strong>{q}</strong>
                </span>
              )}
              {date && (
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary">
                  Tanggal: <strong>{new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>
                </span>
              )}
              <button
                onClick={clearSearch}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-border/50 text-muted-foreground hover:text-foreground hover:border-foreground/50 transition-colors"
              >
                <X className="w-3 h-3" /> Reset
              </button>
            </motion.div>
          )}
        </div>
      </section>


      {/* Locations Grid */}
      <section className="pb-24 lg:pb-32">
        <div className="container mx-auto px-6 lg:px-12">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="aspect-[3/4] rounded-sm" />
              ))}
            </div>
          ) : openLocations.length > 0 || comingSoonLocations.length > 0 ? (
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedCategory}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                {openLocations.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 mb-16">
                    {openLocations.map((location, index) => (
                      <LocationCard key={location.id} location={location} index={index} views={interest[location.id]?.views} promoLabel={getPromoLabel(schedules, location.id)} />
                    ))}
                  </div>
                )}

                {comingSoonLocations.length > 0 && (
                  <>
                    <div className="mb-10">
                      <p className="text-primary text-[11px] tracking-[0.3em] uppercase flex items-center gap-3">
                        <span className="w-8 h-px bg-primary" />
                        Segera Hadir
                      </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 mb-16">
                      {comingSoonLocations.map((location, index) => (
                        <LocationCard key={location.id} location={location} index={index} isComingSoon />
                      ))}
                    </div>
                  </>
                )}

                {unavailableForDate.length > 0 && (
                  <>
                    <div className="mb-10">
                      <p className="text-destructive text-[11px] tracking-[0.3em] uppercase flex items-center gap-3">
                        <span className="w-8 h-px bg-destructive" />
                        Tidak Tersedia Untuk Tanggal Ini
                      </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 opacity-60">
                      {unavailableForDate.map((location, index) => (
                        <LocationCard key={location.id} location={location} index={index} views={interest[location.id]?.views} promoLabel={getPromoLabel(schedules, location.id)} />
                      ))}
                    </div>
                  </>
                )}
              </motion.div>
            </AnimatePresence>
          ) : (
            <div className="text-center py-24 space-y-4">
              <p className="text-muted-foreground">
                {q || date
                  ? 'Tidak ada venue yang cocok dengan pencarian Anda.'
                  : selectedCategory === 'Semua'
                  ? 'Belum ada lokasi tersedia.'
                  : `Tidak ada lokasi di ${selectedCategory}.`}
              </p>
              {(q || date) && (
                <button
                  onClick={clearSearch}
                  className="text-primary text-xs tracking-widest uppercase underline underline-offset-4"
                >
                  Reset Pencarian
                </button>
              )}
            </div>
          )}

        </div>
      </section>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/95 flex items-center justify-center p-4"
            onClick={() => setLightboxImage(null)}
          >
            <button className="absolute top-4 right-4 p-2 bg-secondary rounded-full" onClick={() => setLightboxImage(null)}>
              <X className="w-5 h-5" />
            </button>
            <img src={lightboxImage} alt="Gallery" className="max-w-full max-h-[90vh] rounded-sm object-contain" />
          </motion.div>
        )}
      </AnimatePresence>
    </Layout>
  );
};

interface LocationCardProps {
  location: {
    id: string;
    name: string;
    address: string | null;
    image_url: string | null;
    is_coming_soon: boolean | null;
    category: string | null;
  };
  index: number;
  isComingSoon?: boolean;
  views?: number;
  promoLabel?: string | null;
}

const getPromoLabel = (schedules: { location_id: string; promo_type: string | null; promo_label: string | null; promo_expires_at: string | null }[], locationId: string) => {
  const promo = schedules.find((schedule) => schedule.location_id === locationId && schedule.promo_type && (!schedule.promo_expires_at || new Date(schedule.promo_expires_at) >= new Date()));
  return promo?.promo_label || (promo?.promo_type === 'limited_offer' ? 'Limited Offer' : promo?.promo_type ? 'Special Offer' : null);
};

const LocationCard = ({ location, index, isComingSoon, views, promoLabel }: LocationCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: Math.min(index * 0.08, 0.3) }}
    >
      <Link
        to={`/lokasi/${location.id}`}
        className="group block relative overflow-hidden aspect-[3/4] rounded-sm"
      >
        {location.image_url ? (
          <img
            src={location.image_url}
            alt={location.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <MapPin className="w-12 h-12 opacity-20" />
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />

        {isComingSoon && (
          <div className="absolute top-4 right-4 px-3 py-1.5 bg-accent/80 text-accent-foreground text-[10px] tracking-[0.1em] uppercase rounded-full">
            Segera Hadir
          </div>
        )}

        {!isComingSoon && <VenueInterestBadge views={views} promoLabel={promoLabel} compact className="absolute left-4 top-4 max-w-[75%]" />}

        <div className="absolute bottom-0 left-0 right-0 p-6">
          {location.category && (
            <span className="text-primary text-[10px] tracking-[0.2em] uppercase mb-2 block">
              {location.category}
            </span>
          )}
          <h3 className="font-serif text-xl lg:text-2xl font-bold mb-2 group-hover:text-primary transition-colors duration-300">
            {location.name}
          </h3>
          {location.address && (
            <p className="text-muted-foreground text-xs flex items-center gap-1.5 line-clamp-1">
              <MapPin className="w-3 h-3 shrink-0" />
              {location.address}
            </p>
          )}
        </div>

        <div className="absolute top-6 right-6 w-10 h-10 rounded-full border border-foreground/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:border-primary">
          <ArrowRight className="w-4 h-4 text-primary" />
        </div>
      </Link>
    </motion.div>
  );
};

export default Locations;
