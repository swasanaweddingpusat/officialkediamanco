// CTA langganan newsletter. Email disimpan di tabel newsletter_subscribers lewat
// /functions/v1/newsletter-subscribe; agent newsletter mengirim email otomatis ke daftar ini.
import { useState, type FormEvent } from 'react';
import { Mail, Tag, CalendarHeart, Sparkles, CheckCircle2, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { track } from '@/lib/analytics';

const PERKS = [
  { icon: Tag, text: 'Promo & harga spesial lebih dulu' },
  { icon: CalendarHeart, text: 'Info tanggal venue yang baru kosong' },
  { icon: Sparkles, text: 'Inspirasi & tips persiapan pernikahan' },
];

export function NewsletterCta({ source = 'homepage' }: { source?: string }) {
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState(''); // honeypot, harus tetap kosong
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const value = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setState('error');
      setMessage('Masukkan alamat email yang valid.');
      return;
    }
    setState('loading');
    const { error } = await supabase.functions.invoke('newsletter-subscribe', { body: { email: value, source, company } });
    if (error) {
      setState('error');
      setMessage(error.message || 'Gagal berlangganan, coba lagi.');
      return;
    }
    track('newsletter_subscribe', { method: source });
    setState('done');
  };

  return (
    <section aria-labelledby="newsletter-title" className="relative overflow-hidden rounded-3xl bg-primary text-primary-foreground">
      <div className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full bg-gold/20 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute -left-10 -bottom-20 size-56 rounded-full bg-white/10 blur-3xl" aria-hidden="true" />

      <div className="relative grid lg:grid-cols-2 gap-6 lg:gap-10 p-6 md:p-10 items-center">
        <div>
          <p className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wide">
            <Mail className="size-3.5" aria-hidden="true" /> Newsletter Kediaman
          </p>
          <h2 id="newsletter-title" className="mt-3 text-2xl md:text-3xl font-extrabold leading-tight">
            Jangan sampai ketinggalan promo & tanggal favorit
          </h2>
          <ul className="mt-4 space-y-2">
            {PERKS.map((p) => (
              <li key={p.text} className="flex items-center gap-2.5 text-sm text-primary-foreground/85">
                <span className="grid place-items-center size-7 rounded-full bg-white/10"><p.icon className="size-3.5" aria-hidden="true" /></span>
                {p.text}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl bg-white/[0.06] ring-1 ring-white/10 p-5 md:p-6">
          {state === 'done' ? (
            <div className="text-center py-4" role="status">
              <CheckCircle2 className="size-10 mx-auto text-gold" aria-hidden="true" />
              <p className="mt-3 text-lg font-extrabold">Terima kasih, Anda sudah berlangganan!</p>
              <p className="mt-1 text-sm text-primary-foreground/75">Kabar promo dan inspirasi berikutnya akan kami kirim ke <span className="font-semibold text-primary-foreground">{email.trim()}</span>.</p>
            </div>
          ) : (
            <form onSubmit={submit} noValidate>
              <label htmlFor="newsletter-email" className="text-sm font-bold">Email Anda</label>
              <div className="mt-2 flex flex-col sm:flex-row gap-2">
                <input
                  id="newsletter-email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); if (state === 'error') setState('idle'); }}
                  placeholder="nama@email.com"
                  aria-invalid={state === 'error'}
                  aria-describedby="newsletter-help"
                  className="h-12 flex-1 rounded-xl bg-white px-4 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-gold"
                />
                <button
                  type="submit"
                  disabled={state === 'loading'}
                  className="h-12 px-6 rounded-xl bg-gold text-primary font-extrabold text-sm hover:brightness-105 disabled:opacity-70 inline-flex items-center justify-center gap-2"
                >
                  {state === 'loading' && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                  Langganan
                </button>
              </div>
              {/* Honeypot anti-spam: disembunyikan dari pengunjung & pembaca layar */}
              <input type="text" name="company" tabIndex={-1} autoComplete="off" value={company} onChange={(e) => setCompany(e.target.value)} className="hidden" aria-hidden="true" />
              {state === 'error' ? (
                <p id="newsletter-help" className="mt-2 text-sm font-semibold text-gold" role="alert">{message}</p>
              ) : (
                <p id="newsletter-help" className="mt-2 text-xs text-primary-foreground/65">
                  Gratis, maksimal beberapa email per bulan. Bisa berhenti berlangganan kapan saja lewat tautan di setiap email.
                </p>
              )}
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
