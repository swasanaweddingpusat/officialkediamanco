import { motion, useScroll, useTransform } from 'framer-motion';
import { useSearchParams, Link } from 'react-router-dom';
import { Phone, MapPin, ArrowRight, Check, Star, Users, Calendar, Shield, Sparkles, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocations, useSiteSettings } from '@/hooks/useCMS';
import { useRef } from 'react';

const benefits = [
  { icon: Building2, title: 'Gedung Eksklusif', desc: 'Venue premium dengan arsitektur megah dan kapasitas fleksibel untuk berbagai skala acara.' },
  { icon: Shield, title: 'Tanpa Komitmen Paket', desc: 'Sewa gedung saja — Anda bebas memilih vendor catering, dekorasi, dan entertainment sendiri.' },
  { icon: Calendar, title: 'Jadwal Fleksibel', desc: 'Pilih tanggal dan durasi sesuai kebutuhan. Tersedia opsi half-day dan full-day.' },
  { icon: Users, title: 'Kapasitas Besar', desc: 'Mampu menampung ratusan hingga ribuan tamu dengan tata ruang yang dapat disesuaikan.' },
  { icon: Sparkles, title: 'Fasilitas Lengkap', desc: 'Termasuk sound system, lighting, AC central, area parkir luas, dan ruang persiapan.' },
  { icon: Star, title: 'Lokasi Strategis', desc: 'Berada di lokasi premium yang mudah dijangkau dengan akses transportasi yang baik.' },
];

const whyChoose = [
  'Harga transparan tanpa biaya tersembunyi',
  'Tim operasional berpengalaman standby di lokasi',
  'Loading dock & akses vendor yang mudah',
  'Ruang transit / persiapan terpisah',
  'Parkir luas untuk tamu undangan',
  'Keamanan 24 jam',
];

export default function VenueOnly() {
  const [searchParams] = useSearchParams();
  const customPhone = searchParams.get('phone') || searchParams.get('wa');
  const { data: locations } = useLocations();
  const { data: siteSettings } = useSiteSettings();
  const activeLocations = locations?.filter(l => l.is_active && !l.is_coming_soon) || [];

  const defaultPhone = siteSettings?.phone || '';
  const displayPhone = customPhone || defaultPhone;
  const whatsappLink = customPhone
    ? `https://wa.me/${customPhone.replace(/[^0-9]/g, '')}`
    : siteSettings?.whatsapp_link || `https://wa.me/${defaultPhone.replace(/[^0-9]/g, '')}`;

  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  const heroImage = activeLocations[0]?.image_url || activeLocations[0]?.images?.[0] || '/placeholder.svg';

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Floating CTA Bar */}
      <motion.div
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ delay: 1, type: 'spring', stiffness: 100 }}
        className="fixed top-0 left-0 right-0 z-50 bg-background/70 backdrop-blur-xl border-b border-border/30"
      >
        <div className="container mx-auto px-4 sm:px-6 flex items-center justify-between h-14 lg:h-16">
          <Link to="/" className="relative z-50">
            {siteSettings?.logo_url ? (
              <img
                src={siteSettings.logo_url}
                alt={siteSettings.site_name || 'Logo'}
                className="h-8 lg:h-10 w-auto object-contain"
              />
            ) : (
              <span className="font-serif text-lg lg:text-xl tracking-[0.15em] font-bold uppercase text-primary">
                {siteSettings?.site_name || 'Kediaman'}
              </span>
            )}
          </Link>
          <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
            <Button size="sm" className="text-xs tracking-[0.1em] uppercase gap-2">
              <Phone className="w-3.5 h-3.5" />
              Hubungi Kami
            </Button>
          </a>
        </div>
      </motion.div>

      {/* HERO - Fullscreen Cinematic */}
      <section ref={heroRef} className="relative h-screen overflow-hidden">
        <motion.div style={{ y: heroY }} className="absolute inset-0">
          <img
            src={heroImage}
            alt="Venue"
            className="w-full h-full object-cover scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-background/20" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/60 to-transparent" />
        </motion.div>

        <motion.div
          style={{ opacity: heroOpacity }}
          className="relative z-10 h-full flex flex-col justify-end pb-16 sm:pb-24 lg:pb-32"
        >
          <div className="container mx-auto px-6 lg:px-12">
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-primary text-[11px] sm:text-xs tracking-[0.4em] uppercase mb-4 flex items-center gap-3"
            >
              <span className="w-10 h-px bg-primary" />
              Venue Only — Sewa Gedung Saja
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold leading-[0.95] max-w-4xl mb-6"
            >
              Gedung <span className="text-primary italic">Premium</span>
              <br />
              Tanpa Paket
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="text-muted-foreground text-sm sm:text-base lg:text-lg max-w-lg mb-8 leading-relaxed"
            >
              Sewa gedung eksklusif untuk acara Anda. Bebas pilih vendor sendiri, 
              tanpa komitmen paket — fleksibilitas penuh di tangan Anda.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
              className="flex flex-col sm:flex-row gap-3"
            >
              <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                <Button size="lg" className="text-sm tracking-[0.1em] uppercase gap-2 px-8">
                  <Phone className="w-4 h-4" />
                  {displayPhone || 'Hubungi Sekarang'}
                </Button>
              </a>
              <a href="#venues">
                <Button variant="outline" size="lg" className="text-sm tracking-[0.1em] uppercase gap-2 px-8 border-foreground/20 hover:border-primary">
                  Lihat Venue
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </a>
            </motion.div>
          </div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="w-px h-12 bg-gradient-to-b from-primary/80 to-transparent"
          />
        </motion.div>
      </section>

      {/* BENEFITS SECTION */}
      <section className="py-20 lg:py-32 bg-card">
        <div className="container mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16 lg:mb-20"
          >
            <p className="text-primary text-[11px] tracking-[0.3em] uppercase mb-4">
              Keunggulan Kami
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
              Mengapa <span className="text-primary italic">Venue Only</span>?
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-sm lg:text-base">
              Kebebasan penuh untuk mendesain acara impian Anda dengan vendor pilihan sendiri, 
              di gedung premium dengan fasilitas terlengkap.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {benefits.map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="group p-6 lg:p-8 border border-border/50 rounded-sm hover:border-primary/30 transition-all duration-500 hover:bg-background/50"
              >
                <div className="w-12 h-12 rounded-full border border-primary/30 flex items-center justify-center mb-5 group-hover:bg-primary/10 transition-colors duration-300">
                  <item.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-serif text-xl font-bold mb-2">{item.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* VENUES SHOWCASE */}
      <section id="venues" className="py-20 lg:py-32">
        <div className="container mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16 lg:mb-20"
          >
            <p className="text-primary text-[11px] tracking-[0.3em] uppercase mb-4 flex items-center gap-3">
              <span className="w-8 h-px bg-primary" />
              Pilihan Venue
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold">
              Venue <span className="text-primary italic">Tersedia</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
            {activeLocations.map((location, index) => (
              <motion.div
                key={location.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group relative overflow-hidden rounded-sm bg-card border border-border/30"
              >
                <div className="aspect-[16/10] overflow-hidden">
                  <img
                    src={location.image_url || location.images?.[0] || '/placeholder.svg'}
                    alt={location.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-card via-card/30 to-transparent" />
                </div>

                <div className="relative p-6 lg:p-8 -mt-16 z-10">
                  {location.category && (
                    <span className="text-primary text-[10px] tracking-[0.2em] uppercase mb-2 block">
                      {location.category}
                    </span>
                  )}
                  <h3 className="font-serif text-2xl lg:text-3xl font-bold mb-3 group-hover:text-primary transition-colors">
                    {location.name}
                  </h3>
                  {location.address && (
                    <p className="text-muted-foreground text-sm flex items-start gap-2 mb-4">
                      <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-primary/60" />
                      {location.address}
                    </p>
                  )}

                  {/* Facilities pills */}
                  {location.facilities && location.facilities.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-5">
                      {location.facilities.slice(0, 5).map((facility, i) => (
                        <span key={i} className="px-2.5 py-1 bg-secondary/50 text-muted-foreground text-[10px] tracking-[0.05em] uppercase rounded-full">
                          {facility}
                        </span>
                      ))}
                      {location.facilities.length > 5 && (
                        <span className="px-2.5 py-1 text-primary text-[10px] tracking-[0.05em] uppercase">
                          +{location.facilities.length - 5} lainnya
                        </span>
                      )}
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-2">
                    <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="flex-1">
                      <Button className="w-full text-xs tracking-[0.1em] uppercase gap-2">
                        <Phone className="w-3.5 h-3.5" />
                        Tanya Harga
                      </Button>
                    </a>
                    <Link to={`/lokasi/${location.id}`} className="flex-1">
                      <Button variant="outline" className="w-full text-xs tracking-[0.1em] uppercase gap-2 border-foreground/20 hover:border-primary">
                        Detail Venue
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* WHY CHOOSE US - Checklist */}
      <section className="py-20 lg:py-32 bg-card">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <p className="text-primary text-[11px] tracking-[0.3em] uppercase mb-4 flex items-center gap-3">
                <span className="w-8 h-px bg-primary" />
                Kenapa Kami
              </p>
              <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 leading-tight">
                Semua Yang Anda <span className="text-primary italic">Butuhkan</span>
              </h2>
              <p className="text-muted-foreground text-sm lg:text-base mb-8 leading-relaxed">
                Kami memastikan setiap detail gedung dan fasilitasnya siap mendukung kesuksesan acara Anda, 
                tanpa perlu khawatir soal teknis dan operasional.
              </p>

              <div className="space-y-4">
                {whyChoose.map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.08 }}
                    className="flex items-center gap-3"
                  >
                    <div className="w-6 h-6 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <span className="text-sm lg:text-base">{item}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              {activeLocations[1] && (
                <div className="aspect-[3/4] rounded-sm overflow-hidden">
                  <img
                    src={activeLocations[1].image_url || activeLocations[1].images?.[0] || '/placeholder.svg'}
                    alt="Venue"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/40 to-transparent" />
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-24 lg:py-40 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10" />
        <div className="container mx-auto px-6 lg:px-12 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-3xl mx-auto"
          >
            <p className="text-primary text-[11px] tracking-[0.3em] uppercase mb-4">
              Hubungi Kami Sekarang
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Siap Sewa <span className="text-primary italic">Gedung</span> untuk Acara Anda?
            </h2>
            <p className="text-muted-foreground text-sm lg:text-base mb-10 max-w-xl mx-auto leading-relaxed">
              Konsultasikan kebutuhan venue Anda dengan tim kami. 
              Dapatkan penawaran terbaik untuk sewa gedung tanpa paket.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                <Button size="lg" className="text-sm tracking-[0.1em] uppercase gap-2 px-10 py-6">
                  <Phone className="w-4 h-4" />
                  {displayPhone || 'WhatsApp Kami'}
                </Button>
              </a>
              {displayPhone && (
                <a href={`tel:${displayPhone}`}>
                  <Button variant="outline" size="lg" className="text-sm tracking-[0.1em] uppercase gap-2 px-10 py-6 border-foreground/20 hover:border-primary">
                    <Phone className="w-4 h-4" />
                    Telepon Langsung
                  </Button>
                </a>
              )}
            </div>

            {displayPhone && (
              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="mt-6 text-primary font-serif text-2xl lg:text-3xl tracking-wider"
              >
                {displayPhone}
              </motion.p>
            )}
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border/30">
        <div className="container mx-auto px-6 text-center">
          <p className="text-muted-foreground text-xs">
            © {new Date().getFullYear()} {siteSettings?.site_name || 'Kediaman'}. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
