import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowRight, Search, MessageCircle } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { usePrograms, useSiteSettings } from '@/hooks/useCMS';
import { useSEO } from '@/hooks/useSEO';

const WHATSFORM_URL = 'https://whatsform.com/kediaman-flashsale';

const Packages = () => {
  const { data: programs, isLoading } = usePrograms();
  const { data: settings } = useSiteSettings();
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState('');

  const activeGroup = searchParams.get('kategori') || '';
  const siteName = settings?.site_name || 'Kediaman Corp';

  useSEO({
    title: `Paket & Promo Venue ${siteName}`,
    description: `Daftar lengkap paket dan promo venue ${siteName}. Pilih kategori, cek detail, dan ajukan penawaran langsung lewat formulir WhatsApp.`,
    url: 'https://kediamancorp.com/paket',
    breadcrumbs: [
      { name: 'Home', url: 'https://kediamancorp.com/' },
      { name: 'Paket', url: 'https://kediamancorp.com/paket' },
    ],
  });

  const activePrograms = useMemo(
    () => (programs || []).filter((p: any) => p.is_active),
    [programs]
  );

  const categories = useMemo(() => {
    const map = new Map<string, string>();
    activePrograms.forEach((p: any) => {
      const raw = (p.category || '').trim();
      if (raw) map.set(raw.toLowerCase(), raw);
    });
    return Array.from(map.values());
  }, [activePrograms]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return activePrograms.filter((p: any) => {
      const matchGroup =
        !activeGroup ||
        (p.category || '').trim().toLowerCase() === activeGroup.trim().toLowerCase();
      const matchQuery =
        !q ||
        p.name?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q);
      return matchGroup && matchQuery;
    });
  }, [activePrograms, activeGroup, query]);

  const selectCategory = (cat: string) => {
    const next = new URLSearchParams(searchParams);
    if (cat) next.set('kategori', cat);
    else next.delete('kategori');
    setSearchParams(next, { replace: true });
  };

  return (
    <Layout>
      {/* Header */}
      <section className="bg-card border-b border-border">
        <div className="container mx-auto px-6 lg:px-12 py-16 lg:py-24">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl"
          >
            <p className="text-primary text-[11px] tracking-[0.3em] uppercase mb-5">
              Jadwal &amp; Biaya
            </p>
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-5">
              Paket &amp; Promo Venue
            </h1>
            <p className="text-muted-foreground text-base lg:text-lg leading-relaxed">
              Pilih paket yang paling sesuai dengan kebutuhan acara Anda. Ketersediaan
              tanggal dan harga dapat berubah sewaktu-waktu.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Filter bar */}
      <section className="sticky top-16 lg:top-20 z-30 bg-background/95 backdrop-blur border-b border-border">
        <div className="container mx-auto px-6 lg:px-12 py-5 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            <span className="text-[11px] tracking-[0.25em] uppercase text-muted-foreground shrink-0">
              Kategori
            </span>
            <div className="flex gap-2 overflow-x-auto pb-1 -mb-1">
              <FilterChip
                label="Semua Paket"
                active={!activeGroup}
                onClick={() => selectCategory('')}
              />
              {categories.map((cat) => (
                <FilterChip
                  key={cat}
                  label={cat}
                  active={activeGroup === cat}
                  onClick={() => selectCategory(cat)}
                />
              ))}
            </div>
            <div className="relative lg:ml-auto lg:w-72 shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cari paket..."
                className="pl-9 rounded-full"
                aria-label="Cari paket"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Grid */}
      <section className="py-14 lg:py-20">
        <div className="container mx-auto px-6 lg:px-12">
          <p className="text-sm text-muted-foreground mb-8">
            Menampilkan <span className="text-foreground font-medium">{filtered.length}</span> paket
          </p>

          {isLoading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="aspect-[4/5] rounded-2xl" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-20 text-center">
              <p className="font-serif text-2xl mb-2">Paket tidak ditemukan</p>
              <p className="text-muted-foreground text-sm">
                Coba ubah kata kunci atau pilih kategori lain.
              </p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {filtered.map((program: any, index: number) => (
                <motion.article
                  key={program.id}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: Math.min(index, 5) * 0.06 }}
                  className="group flex flex-col rounded-2xl overflow-hidden border border-border bg-card"
                >
                  <Link to={`/tentang-kami/${program.id}`} className="block relative aspect-[4/3] overflow-hidden">
                    {program.image_url ? (
                      <img
                        src={program.image_url}
                        alt={program.name}
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full bg-muted" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-transparent to-transparent" />
                    {program.category && (
                      <span className="absolute top-4 left-4 px-3 py-1 rounded-full bg-primary text-primary-foreground text-[10px] tracking-[0.15em] uppercase">
                        {program.category}
                      </span>
                    )}
                  </Link>

                  <div className="flex flex-col flex-1 p-6">
                    <h2 className="font-serif text-xl lg:text-2xl font-semibold leading-snug mb-3 group-hover:text-primary transition-colors">
                      <Link to={`/tentang-kami/${program.id}`}>{program.name}</Link>
                    </h2>
                    {program.description && (
                      <p className="text-muted-foreground text-sm leading-relaxed line-clamp-3 mb-6">
                        {program.description}
                      </p>
                    )}
                    <div className="mt-auto flex items-center gap-3">
                      <Link to={`/tentang-kami/${program.id}`} className="flex-1">
                        <Button variant="outline" className="w-full rounded-full text-xs tracking-[0.05em] uppercase">
                          Detail
                          <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      </Link>
                      <a
                        href={program.cta_link || WHATSFORM_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1"
                      >
                        <Button className="w-full rounded-full text-xs tracking-[0.05em] uppercase">
                          {program.cta_label || 'Pesan'}
                        </Button>
                      </a>
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* WhatsForm embed */}
      <section id="form" className="py-16 lg:py-24 bg-card border-t border-border">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-[1fr_1.15fr] gap-10 lg:gap-16 items-start">
            <div className="lg:sticky lg:top-40">
              <p className="text-primary text-[11px] tracking-[0.3em] uppercase mb-5">
                Formulir Pemesanan
              </p>
              <h2 className="font-serif text-3xl lg:text-5xl font-bold leading-tight mb-5">
                Ajukan Penawaran Paket
              </h2>
              <p className="text-muted-foreground text-sm lg:text-base leading-relaxed mb-8">
                Isi formulir di samping — data Anda akan langsung terkirim ke tim kami
                melalui WhatsApp untuk dibalas dengan penawaran terbaik.
              </p>
              <a href={WHATSFORM_URL} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" className="rounded-full px-8 text-xs tracking-[0.05em] uppercase">
                  <MessageCircle className="mr-2 w-4 h-4" />
                  Buka Formulir di Tab Baru
                </Button>
              </a>
            </div>

            <div className="rounded-2xl overflow-hidden border border-border bg-background">
              <iframe
                src={WHATSFORM_URL}
                title="Formulir Pemesanan Paket via WhatsApp"
                className="w-full h-[720px] border-0"
                loading="lazy"
                allow="clipboard-write"
              />
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 px-4 py-2 rounded-full text-xs tracking-[0.05em] uppercase border transition-colors ${
        active
          ? 'bg-primary text-primary-foreground border-primary'
          : 'bg-transparent text-muted-foreground border-border hover:border-primary hover:text-primary'
      }`}
    >
      {label}
    </button>
  );
}

export default Packages;
