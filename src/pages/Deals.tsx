import { useExternalDeals } from '@/hooks/useCMS';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { motion } from 'framer-motion';
import { Loader2, Calendar, Users, MapPin, Tag } from 'lucide-react';
import { useSEO } from '@/hooks/useSEO';

function formatDate(value: unknown) {
  if (!value || typeof value !== 'string') return null;
  const date = new Date(value);
  if (isNaN(date.getTime())) return null;
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function getString(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback;
}

export default function Deals() {
  const { data: deals, isLoading, error } = useExternalDeals();

  useSEO({
    title: 'Deals | Kediaman',
    description: 'Daftar deal dan booking terbaru dari Kediaman.',
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24 lg:pt-32 pb-20">
        <div className="container mx-auto px-6 lg:px-12">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl mb-12 lg:mb-16"
          >
            <span className="text-primary text-xs tracking-[0.2em] uppercase font-medium">
              Terbaru
            </span>
            <h1 className="font-serif text-4xl lg:text-6xl text-foreground mt-3 mb-4 leading-tight">
              Deals
            </h1>
            <p className="text-muted-foreground text-base lg:text-lg leading-relaxed">
              Daftar deal dan booking terbaru yang tersambung langsung ke data Kediaman.
            </p>
          </motion.div>

          {/* Loading */}
          {isLoading && (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          )}

          {/* Error */}
          {error && !isLoading && (
            <div className="text-center py-20 border border-destructive/20 rounded-lg bg-destructive/5">
              <p className="text-destructive">Gagal memuat data deals. Silakan coba lagi nanti.</p>
            </div>
          )}

          {/* Empty */}
          {!isLoading && !error && (!deals || deals.length === 0) && (
            <div className="text-center py-20 border border-border/50 rounded-lg bg-muted/20">
              <p className="text-muted-foreground">Belum ada data deals tersedia saat ini.</p>
            </div>
          )}

          {/* Grid */}
          {!isLoading && !error && deals && deals.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {deals.map((deal, index) => {
                const client = getString(deal.namaClient, 'Klien');
                const venue = getString(deal.namaVenue);
                const pax = typeof deal.totalPax === 'number' ? deal.totalPax : null;
                const eventDate = formatDate(deal.tanggalAcara);
                const bookingDate = formatDate(deal.tanggalBooking);
                const eventType = getString(deal.jenisAcara);
                const bookingType = getString(deal.jenisBooking);
                const marketing = getString(deal.namaMarketing);
                const paxName = getString(deal.namaPax);
                const eventTime = getString(deal.waktuAcara);

                return (
                  <motion.article
                    key={String(deal.id ?? index)}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.05 }}
                    className="group bg-card border border-border/50 rounded-xl p-5 lg:p-6 hover:border-primary/30 transition-colors duration-300"
                  >
                    {/* Badges */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {bookingType && (
                        <span className="px-3 py-1 text-[10px] tracking-[0.12em] uppercase bg-primary text-primary-foreground rounded-full">
                          {bookingType}
                        </span>
                      )}
                      {eventType && (
                        <span className="px-3 py-1 text-[10px] tracking-[0.12em] uppercase bg-muted text-muted-foreground rounded-full">
                          {eventType}
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h2 className="font-serif text-2xl lg:text-3xl text-foreground mb-1 leading-tight">
                      {client}
                    </h2>
                    {paxName && (
                      <p className="text-primary text-sm font-medium mb-4">{paxName}</p>
                    )}

                    {/* Venue */}
                    {venue && (
                      <div className="flex items-start gap-2 text-muted-foreground mb-4">
                        <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                        <span className="text-sm leading-relaxed">{venue}</span>
                      </div>
                    )}

                    {/* Meta */}
                    <div className="space-y-2 border-t border-border/50 pt-4">
                      {eventDate && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="w-4 h-4 shrink-0" />
                          <span>{eventDate}</span>
                          {eventTime && <span className="text-xs">({eventTime})</span>}
                        </div>
                      )}
                      {pax !== null && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Users className="w-4 h-4 shrink-0" />
                          <span>{pax.toLocaleString('id-ID')} pax</span>
                        </div>
                      )}
                      {marketing && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Tag className="w-4 h-4 shrink-0" />
                          <span>Marketing: {marketing}</span>
                        </div>
                      )}
                      {bookingDate && (
                        <div className="text-xs text-muted-foreground/60 pt-1">
                          Booking: {bookingDate}
                        </div>
                      )}
                    </div>
                  </motion.article>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
