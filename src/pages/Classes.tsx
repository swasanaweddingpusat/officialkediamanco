import { motion } from 'framer-motion';
import { Layout } from '@/components/layout/Layout';
import { useSiteSettings, useLocations, useTrainers } from '@/hooks/useCMS';
import { useSEO } from '@/hooks/useSEO';
import { MapPin, Users, Award, Heart, Star, Building2 } from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: [0.4, 0, 0.2, 1] as const },
  }),
};

const values = [
  {
    icon: Heart,
    title: 'Dedikasi Penuh',
    description: 'Kami berkomitmen memberikan pelayanan terbaik dengan sepenuh hati untuk setiap klien.',
  },
  {
    icon: Star,
    title: 'Kualitas Premium',
    description: 'Standar tertinggi dalam setiap detail, dari fasilitas hingga layanan yang kami tawarkan.',
  },
  {
    icon: Users,
    title: 'Tim Profesional',
    description: 'Didukung oleh tim berpengalaman yang ahli di bidangnya masing-masing.',
  },
  {
    icon: Award,
    title: 'Kepercayaan',
    description: 'Dipercaya oleh ratusan klien untuk momen-momen penting dalam hidup mereka.',
  },
];

const Classes = () => {
  const { data: siteSettings } = useSiteSettings();
  const { data: locations } = useLocations();
  const { data: trainers } = useTrainers();

  const siteName = siteSettings?.site_name || 'Kediaman Corp';
  const activeLocations = locations?.filter(l => l.is_active) || [];
  const activePortfolios = trainers?.filter(t => t.is_active) || [];

  useSEO({
    title: `${siteName} - Tentang Kami`,
    description: `Kenali lebih dekat ${siteName}, penyedia venue dan layanan event premium terpercaya.`,
    url: 'https://kediamancorp.com/classes',
    breadcrumbs: [
      { name: 'Home', url: 'https://kediamancorp.com/' },
      { name: 'Tentang Kami', url: 'https://kediamancorp.com/classes' },
    ],
  });

  return (
    <Layout>
      {/* Hero */}
      <section className="relative pt-32 pb-24 md:pt-40 md:pb-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-card via-background to-background" />
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-3xl mx-auto"
          >
            <span className="font-script text-primary text-2xl md:text-3xl block mb-4">
              Tentang Kami
            </span>
            <h1 className="font-serif text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              Mewujudkan Momen{' '}
              <span className="text-primary">Tak Terlupakan</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              {siteName} hadir sebagai mitra terpercaya dalam menciptakan pengalaman istimewa 
              melalui venue premium dan layanan event profesional.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Visi & Misi */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 md:gap-20 max-w-5xl mx-auto">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              custom={0}
              variants={fadeUp}
              className="space-y-6"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-[2px] bg-primary" />
                <span className="text-primary font-medium tracking-widest uppercase text-sm">Visi</span>
              </div>
              <h2 className="font-serif text-3xl md:text-4xl font-bold leading-snug">
                Menjadi Destinasi Venue & Event <span className="text-primary">Terdepan</span>
              </h2>
              <p className="text-muted-foreground text-lg leading-relaxed">
                Kami bercita-cita menjadi pilihan utama dalam penyediaan venue premium dan 
                penyelenggaraan event berkualitas tinggi yang menciptakan kenangan abadi bagi setiap klien.
              </p>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              custom={1}
              variants={fadeUp}
              className="space-y-6"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-[2px] bg-primary" />
                <span className="text-primary font-medium tracking-widest uppercase text-sm">Misi</span>
              </div>
              <ul className="space-y-4 text-muted-foreground text-lg">
                <li className="flex gap-3">
                  <span className="text-primary mt-1 shrink-0">✦</span>
                  <span>Menyediakan fasilitas venue dengan standar kualitas tertinggi</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary mt-1 shrink-0">✦</span>
                  <span>Memberikan pelayanan personal dan profesional kepada setiap klien</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary mt-1 shrink-0">✦</span>
                  <span>Terus berinovasi dalam menghadirkan konsep event yang unik dan berkesan</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary mt-1 shrink-0">✦</span>
                  <span>Membangun hubungan jangka panjang berbasis kepercayaan dan kepuasan</span>
                </li>
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Nilai-Nilai */}
      <section className="py-20 md:py-28 bg-card">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={0}
            variants={fadeUp}
            className="text-center mb-16"
          >
            <span className="font-script text-primary text-xl md:text-2xl block mb-3">
              Mengapa Memilih Kami
            </span>
            <h2 className="font-serif text-3xl md:text-5xl font-bold">
              Nilai Yang Kami <span className="text-primary">Junjung</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 max-w-5xl mx-auto">
            {values.map((value, index) => {
              const Icon = value.icon;
              return (
                <motion.div
                  key={value.title}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  custom={index}
                  variants={fadeUp}
                  className="card-luxury rounded-2xl p-6 md:p-8 text-center group"
                >
                  <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-5 group-hover:bg-primary/20 transition-colors">
                    <Icon className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="font-serif text-lg md:text-xl font-bold mb-2">{value.title}</h3>
                  <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
                    {value.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto text-center">
            {[
              { number: `${activeLocations.length}+`, label: 'Lokasi Venue', icon: Building2 },
              { number: `${activePortfolios.length}+`, label: 'Portfolio Event', icon: Award },
              { number: '500+', label: 'Event Sukses', icon: Star },
              { number: '100%', label: 'Kepuasan Klien', icon: Heart },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={index}
                variants={fadeUp}
                className="space-y-2"
              >
                <stat.icon className="w-8 h-8 text-primary mx-auto mb-3" />
                <p className="font-serif text-4xl md:text-5xl font-bold text-primary">
                  {stat.number}
                </p>
                <p className="text-muted-foreground text-sm md:text-base">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 md:py-28 bg-card">
        <div className="container mx-auto px-4 text-center max-w-3xl">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={0}
            variants={fadeUp}
          >
            <span className="font-script text-primary text-xl md:text-2xl block mb-3">
              Mari Berkolaborasi
            </span>
            <h2 className="font-serif text-3xl md:text-5xl font-bold mb-6">
              Siap Mewujudkan Event <span className="text-primary">Impian Anda?</span>
            </h2>
            <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
              Hubungi kami untuk konsultasi gratis dan temukan venue sempurna untuk momen spesial Anda.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/locations"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-full font-semibold btn-glow hover:opacity-90 transition-opacity"
              >
                <MapPin className="w-5 h-5" />
                Lihat Venue Kami
              </a>
              {siteSettings?.whatsapp_link && (
                <a
                  href={siteSettings.whatsapp_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 border border-border rounded-full font-semibold hover:bg-secondary transition-colors"
                >
                  Hubungi Kami
                </a>
              )}
            </div>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
};

export default Classes;
