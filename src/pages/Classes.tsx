import { motion } from 'framer-motion';
import { Layout } from '@/components/layout/Layout';
import { useSiteSettings, useLocations, useTrainers, useAboutSections } from '@/hooks/useCMS';
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

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Heart, Star, Users, Award, MapPin, Building2,
};

const bgClasses: Record<string, string> = {
  default: '',
  card: 'bg-card',
  primary: 'bg-primary/5',
  muted: 'bg-muted',
};

const paddingClasses: Record<string, string> = {
  small: 'py-10 md:py-14',
  normal: 'py-20 md:py-28',
  large: 'py-24 md:py-32',
};

const Classes = () => {
  const { data: siteSettings } = useSiteSettings();
  const { data: locations } = useLocations();
  const { data: trainers } = useTrainers();
  const { data: sections } = useAboutSections();

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

  const visibleSections = (sections || [])
    .filter((s: any) => s.is_visible)
    .sort((a: any, b: any) => a.sort_order - b.sort_order);

  return (
    <Layout>
      {visibleSections.map((section: any) => {
        const content = (section.content as Record<string, any>) || {};
        const styling = (section.styling as Record<string, any>) || {};
        const bg = bgClasses[styling.bg_color] || '';
        const pad = paddingClasses[styling.padding] || 'py-20 md:py-28';

        switch (section.section_type) {
          case 'hero':
            return (
              <section key={section.id} className={`relative pt-32 pb-24 md:pt-40 md:pb-32 overflow-hidden ${bg || 'bg-gradient-to-b from-card via-background to-background'}`}>
                <div className="container mx-auto px-4 relative z-10">
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="text-center max-w-3xl mx-auto">
                    {content.subtitle && <span className="font-script text-primary text-2xl md:text-3xl block mb-4">{content.subtitle}</span>}
                    <h1 className="font-serif text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">{content.title || siteName}</h1>
                    {content.description && <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">{content.description}</p>}
                  </motion.div>
                </div>
              </section>
            );

          case 'text':
            return (
              <section key={section.id} className={`${pad} ${bg}`}>
                <div className="container mx-auto px-4 max-w-3xl" style={{ textAlign: (styling.text_align || 'left') as any }}>
                  <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0} variants={fadeUp} className="space-y-4">
                    {content.subtitle && <span className="font-script text-primary text-xl md:text-2xl block">{content.subtitle}</span>}
                    {content.title && <h2 className="font-serif text-3xl md:text-5xl font-bold">{content.title}</h2>}
                    {content.description && <p className="text-muted-foreground text-lg leading-relaxed">{content.description}</p>}
                  </motion.div>
                </div>
              </section>
            );

          case 'text_columns':
            return (
              <section key={section.id} className={`${pad} ${bg}`}>
                <div className="container mx-auto px-4">
                  <div className="grid md:grid-cols-2 gap-12 md:gap-20 max-w-5xl mx-auto">
                    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0} variants={fadeUp} className="space-y-6">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-[2px] bg-primary" />
                        <span className="text-primary font-medium tracking-widest uppercase text-sm">{content.left_label}</span>
                      </div>
                      {content.left_title && <h2 className="font-serif text-3xl md:text-4xl font-bold leading-snug">{content.left_title}</h2>}
                      {content.left_description && <p className="text-muted-foreground text-lg leading-relaxed">{content.left_description}</p>}
                    </motion.div>
                    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} custom={1} variants={fadeUp} className="space-y-6">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-[2px] bg-primary" />
                        <span className="text-primary font-medium tracking-widest uppercase text-sm">{content.right_label}</span>
                      </div>
                      <ul className="space-y-4 text-muted-foreground text-lg">
                        {(content.right_items || []).map((item: string, i: number) => (
                          <li key={i} className="flex gap-3"><span className="text-primary mt-1 shrink-0">✦</span><span>{item}</span></li>
                        ))}
                      </ul>
                    </motion.div>
                  </div>
                </div>
              </section>
            );

          case 'values': {
            const items = content.items || [];
            if (items.length === 0) return null;
            return (
              <section key={section.id} className={`${pad} ${bg}`}>
                <div className="container mx-auto px-4">
                  <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0} variants={fadeUp} className="text-center mb-16">
                    {content.heading_script && <span className="font-script text-primary text-xl md:text-2xl block mb-3">{content.heading_script}</span>}
                    {content.heading && <h2 className="font-serif text-3xl md:text-5xl font-bold">{content.heading}</h2>}
                  </motion.div>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 max-w-5xl mx-auto">
                    {items.map((value: any, index: number) => {
                      const Icon = iconMap[value.icon] || Heart;
                      return (
                        <motion.div key={index} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={index} variants={fadeUp} className="card-luxury rounded-2xl p-6 md:p-8 text-center group">
                          <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-5 group-hover:bg-primary/20 transition-colors">
                            <Icon className="w-7 h-7 text-primary" />
                          </div>
                          <h3 className="font-serif text-lg md:text-xl font-bold mb-2">{value.title}</h3>
                          <p className="text-muted-foreground text-sm md:text-base leading-relaxed">{value.description}</p>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </section>
            );
          }

          case 'stats': {
            const staticItems = content.items || [];
            const dynamicItems = content.show_dynamic ? [
              { number: `${activeLocations.length}+`, label: 'Lokasi Venue', icon: Building2 },
              { number: `${activePortfolios.length}+`, label: 'Portfolio Event', icon: Award },
            ] : [];
            const allStats = [...dynamicItems, ...staticItems.map((s: any) => ({ ...s, icon: Star }))];
            return (
              <section key={section.id} className={`${pad} ${bg}`}>
                <div className="container mx-auto px-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto text-center">
                    {allStats.map((stat: any, index: number) => (
                      <motion.div key={stat.label} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={index} variants={fadeUp} className="space-y-2">
                        {stat.icon && <stat.icon className="w-8 h-8 text-primary mx-auto mb-3" />}
                        <p className="font-serif text-4xl md:text-5xl font-bold text-primary">{stat.number}</p>
                        <p className="text-muted-foreground text-sm md:text-base">{stat.label}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </section>
            );
          }

          case 'cta':
            return (
              <section key={section.id} className={`${pad} ${bg}`}>
                <div className="container mx-auto px-4 text-center max-w-3xl">
                  <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0} variants={fadeUp}>
                    {content.subtitle && <span className="font-script text-primary text-xl md:text-2xl block mb-3">{content.subtitle}</span>}
                    {content.title && <h2 className="font-serif text-3xl md:text-5xl font-bold mb-6">{content.title}</h2>}
                    {content.description && <p className="text-muted-foreground text-lg mb-8 leading-relaxed">{content.description}</p>}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                      {content.button_text && (
                        <a href={content.button_link || '/locations'} className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-full font-semibold btn-glow hover:opacity-90 transition-opacity">
                          <MapPin className="w-5 h-5" />
                          {content.button_text}
                        </a>
                      )}
                      {content.show_whatsapp && siteSettings?.whatsapp_link && (
                        <a href={siteSettings.whatsapp_link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 px-8 py-4 border border-border rounded-full font-semibold hover:bg-secondary transition-colors">
                          Hubungi Kami
                        </a>
                      )}
                    </div>
                  </motion.div>
                </div>
              </section>
            );

          case 'quote':
            return (
              <section key={section.id} className={`${pad} ${bg}`}>
                <div className="container mx-auto px-4 text-center max-w-3xl">
                  <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0} variants={fadeUp}>
                    {content.quote && <blockquote className="font-serif text-2xl md:text-4xl italic text-foreground leading-relaxed">"{content.quote}"</blockquote>}
                    {content.author && <p className="mt-6 text-muted-foreground text-lg">— {content.author}</p>}
                  </motion.div>
                </div>
              </section>
            );

          default:
            return null;
        }
      })}
    </Layout>
  );
};

export default Classes;
