// Halaman baru: Bantuan / FAQ (data dari CMS "FAQ").
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, MessageCircle, Mail, CalendarCheck } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { useFaqs } from '@/hooks/useOta';
import { useSiteSettings } from '@/hooks/useCMS';
import { useSEO } from '@/hooks/useSEO';
import { Skeleton } from '@/components/ui/skeleton';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { PageHeader, EmptyState } from '@/components/ota/OtaKit';
import { waLinkFrom } from '@/components/layout/Navbar';

const Help = () => {
  const { data: faqs = [], isLoading } = useFaqs();
  const { data: settings } = useSiteSettings();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const wa = waLinkFrom(settings);

  useSEO({
    title: 'Pusat Bantuan & FAQ | Kediaman Corp',
    description: 'Jawaban seputar booking venue, pembayaran, survei, dan hari acara di Kediaman Corp.',
    url: 'https://kediaman.co/bantuan',
    breadcrumbs: [{ name: 'Home', url: 'https://kediaman.co/' }, { name: 'Bantuan', url: 'https://kediaman.co/bantuan' }],
  });

  const active = faqs.filter((f) => f.is_active);
  const categories = useMemo(() => [...new Set(active.map((f) => f.category).filter(Boolean))], [active]);
  const shown = active.filter((f) => {
    const q = query.trim().toLowerCase();
    return (!category || f.category === category) && (!q || f.question.toLowerCase().includes(q) || f.answer.toLowerCase().includes(q));
  });
  const grouped = categories.map((c) => ({ c, items: shown.filter((f) => f.category === c) })).filter((g) => g.items.length);

  return (
    <Layout>
      <PageHeader title="Ada yang bisa kami bantu?" subtitle="Cari jawaban seputar booking, pembayaran, survei, dan hari acara." crumbs={[{ name: 'Bantuan' }]}>
        <label className="mt-4 flex items-center gap-2 h-12 px-4 rounded-xl border border-input bg-background max-w-xl">
          <Search className="size-5 text-muted-foreground" aria-hidden="true" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Ketik pertanyaan, mis. cara membayar DP" aria-label="Cari pertanyaan" className="bg-transparent outline-none w-full" />
        </label>
      </PageHeader>

      <div className="ota-container py-6 flex flex-col lg:flex-row gap-6 items-start">
        <div className="flex-1 min-w-0 w-full space-y-5">
          {categories.length > 1 && (
            <div className="ota-scroll-x">
              <button type="button" className="ota-chip" aria-pressed={!category} onClick={() => setCategory('')}>Semua topik</button>
              {categories.map((c) => <button key={c} type="button" className="ota-chip" aria-pressed={category === c} onClick={() => setCategory(c)}>{c}</button>)}
            </div>
          )}
          {isLoading ? (
            <Skeleton className="h-80 rounded-2xl" />
          ) : grouped.length === 0 ? (
            <EmptyState title={active.length ? 'Pertanyaan tidak ditemukan' : 'FAQ sedang disiapkan'}>Hubungi tim kami lewat WhatsApp, kami bantu langsung.</EmptyState>
          ) : (
            grouped.map(({ c, items }) => (
              <section key={c} className="ota-card px-4 md:px-6 pt-4">
                <h2 className="font-extrabold text-lg">{c}</h2>
                <Accordion type="multiple">
                  {items.map((f) => (
                    <AccordionItem key={f.id} value={f.id} className="last:border-b-0">
                      <AccordionTrigger className="text-left font-bold hover:no-underline">{f.question}</AccordionTrigger>
                      <AccordionContent className="text-muted-foreground whitespace-pre-line leading-relaxed">{f.answer}</AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </section>
            ))
          )}
        </div>

        <aside className="w-full lg:w-80 shrink-0 space-y-3 lg:sticky lg:top-40">
          <div className="ota-card p-5 space-y-3">
            <p className="font-extrabold">Masih butuh bantuan?</p>
            <a href={wa} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-xl bg-primary text-primary-foreground p-3 font-bold"><MessageCircle className="size-5" aria-hidden="true" />Chat via WhatsApp</a>
            {settings?.email && <a href={`mailto:${settings.email}`} className="flex items-center gap-3 rounded-xl border border-input p-3 font-bold"><Mail className="size-5" aria-hidden="true" />{settings.email}</a>}
            <Link to="/booking/track" className="flex items-center gap-3 rounded-xl border border-input p-3 font-bold"><CalendarCheck className="size-5" aria-hidden="true" />Cek status booking</Link>
          </div>
        </aside>
      </div>
    </Layout>
  );
};

export default Help;
