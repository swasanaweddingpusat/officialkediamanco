// Cek status booking: nomor HP + kode booking (dari layar sukses / pesan WhatsApp).
// Booking lama (sebelum form ringkas) bisa dicari dengan nomor HP + email.
import { useState, type FormEvent } from 'react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { Search, Loader2, CalendarDays, MapPin, Package, CheckCircle, XCircle, AlertCircle, Clock } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { PageHeader } from '@/components/ota/OtaKit';
import { supabase } from '@/integrations/supabase/client';
import { useSEO } from '@/hooks/useSEO';

type Booking = {
  code: string;
  booking_date: string | null;
  start_time: string | null;
  end_time: string | null;
  event_name: string | null;
  event_type: string | null;
  guest_count: number | null;
  package_name: string | null;
  status: string;
  created_at: string;
  locations: { name: string } | null;
};

const STATUS: Record<string, { label: string; icon: typeof CheckCircle; tone: string; text: string }> = {
  pending: { label: 'Menunggu konfirmasi', icon: AlertCircle, tone: 'ota-badge', text: 'Permintaan Anda sedang ditinjau. Tim kami akan menghubungi lewat WhatsApp dalam 1×24 jam.' },
  awaiting_payment: { label: 'Menunggu pembayaran', icon: Clock, tone: 'ota-badge', text: 'Silakan selesaikan pembayaran tanda jadi sesuai arahan tim kami.' },
  paid: { label: 'Sudah dibayar', icon: CheckCircle, tone: 'ota-pill-ok', text: 'Pembayaran diterima. Tim kami akan mengonfirmasi jadwal Anda.' },
  approved: { label: 'Disetujui', icon: CheckCircle, tone: 'ota-pill-ok', text: 'Selamat! Booking Anda disetujui. Tim kami akan menghubungi untuk langkah berikutnya.' },
  completed: { label: 'Selesai', icon: CheckCircle, tone: 'ota-pill-ok', text: 'Acara telah selesai. Terima kasih telah mempercayakan momen Anda kepada kami.' },
  rejected: { label: 'Tidak dapat diproses', icon: XCircle, tone: 'ota-pill-full', text: 'Maaf, booking ini tidak dapat kami proses. Hubungi tim kami untuk alternatif tanggal/venue.' },
  cancelled: { label: 'Dibatalkan', icon: XCircle, tone: 'ota-pill-full', text: 'Booking ini telah dibatalkan.' },
};

const BookingTrack = () => {
  useSEO({ title: 'Cek Status Booking | Kediaman', description: 'Cek status permintaan booking venue Kediaman dengan nomor HP dan kode booking.', url: 'https://kediaman.co/booking/track' });

  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [useEmail, setUseEmail] = useState(false);
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'loading' | 'done'>('idle');
  const [error, setError] = useState('');
  const [bookings, setBookings] = useState<Booking[]>([]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 8 || digits.length > 15) { setError('Masukkan nomor HP yang dipakai saat booking.'); return; }
    if (!useEmail && !/^(KDM-?)?[0-9a-f]{8}$/i.test(code.trim())) { setError('Kode booking berformat KDM-XXXXXXXX.'); return; }
    if (useEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setError('Masukkan email yang valid.'); return; }
    setState('loading');
    const { data, error: err } = await supabase.functions.invoke('track-booking', {
      body: useEmail ? { phone, email: email.trim() } : { phone, code: code.trim() },
    });
    if (err) { setError(err.message || 'Gagal mencari booking. Coba lagi.'); setState('idle'); return; }
    setBookings(((data as { bookings?: Booking[] } | null)?.bookings ?? []));
    setState('done');
  };

  const fmtDate = (d: string) => format(new Date(`${d}T00:00:00`), 'EEEE, dd MMMM yyyy', { locale: idLocale });

  return (
    <Layout>
      <PageHeader title="Cek status booking" subtitle="Masukkan nomor HP dan kode booking yang Anda terima setelah mengirim permintaan." crumbs={[{ name: 'Cek status booking' }]} />
      <div className="ota-container py-8 max-w-2xl">
        <form onSubmit={submit} className="ota-card p-5 md:p-6 space-y-4" noValidate>
          <div>
            <label htmlFor="track-phone" className="text-sm font-bold">Nomor HP (WhatsApp)</label>
            <input id="track-phone" type="tel" inputMode="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="08xxxxxxxxxx" className="mt-1.5 h-11 w-full rounded-xl border border-input bg-card px-3.5 text-sm outline-none focus:ring-2 focus:ring-ring" />
          </div>
          {useEmail ? (
            <div>
              <label htmlFor="track-email" className="text-sm font-bold">Email saat booking</label>
              <input id="track-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nama@email.com" className="mt-1.5 h-11 w-full rounded-xl border border-input bg-card px-3.5 text-sm outline-none focus:ring-2 focus:ring-ring" />
            </div>
          ) : (
            <div>
              <label htmlFor="track-code" className="text-sm font-bold">Kode booking</label>
              <input id="track-code" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="KDM-1A2B3C4D" autoComplete="off" className="mt-1.5 h-11 w-full rounded-xl border border-input bg-card px-3.5 font-mono text-sm uppercase tracking-wider outline-none focus:ring-2 focus:ring-ring" />
            </div>
          )}
          <button type="button" onClick={() => { setUseEmail((v) => !v); setError(''); }} className="text-xs font-bold text-primary hover:underline">
            {useEmail ? 'Pakai kode booking' : 'Booking sebelum November 2026? Cari dengan email'}
          </button>
          {error && <p className="text-sm font-semibold text-destructive" role="alert">{error}</p>}
          <button type="submit" disabled={state === 'loading'} className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-extrabold text-sm inline-flex items-center justify-center gap-2 disabled:opacity-70">
            {state === 'loading' ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}Cek status
          </button>
        </form>

        {state === 'done' && (
          <div className="mt-6 space-y-4" aria-live="polite">
            {bookings.length === 0 ? (
              <div className="ota-card p-8 text-center">
                <Search className="size-10 mx-auto text-muted-foreground" aria-hidden="true" />
                <p className="mt-3 font-extrabold">Booking tidak ditemukan</p>
                <p className="mt-1 text-sm text-muted-foreground">Pastikan nomor HP dan kode booking sama persis seperti saat mengirim permintaan.</p>
              </div>
            ) : bookings.map((b) => {
              const st = STATUS[b.status] ?? STATUS.pending;
              return (
                <article key={b.code} className="ota-card p-5 space-y-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-mono text-xs font-bold text-muted-foreground">KDM-{b.code}</p>
                      <h2 className="text-lg font-extrabold">{b.event_name || b.locations?.name || 'Permintaan booking'}</h2>
                    </div>
                    <span className={`${st.tone} inline-flex items-center gap-1`}><st.icon className="size-3.5" aria-hidden="true" />{st.label}</span>
                  </div>
                  <p className="rounded-xl bg-secondary/60 p-3 text-sm">{st.text}</p>
                  <dl className="grid sm:grid-cols-2 gap-3 text-sm">
                    <div className="flex gap-2.5"><MapPin className="size-4 mt-0.5 text-primary" aria-hidden="true" /><div><dt className="text-xs text-muted-foreground">Venue</dt><dd className="font-semibold">{b.locations?.name || '-'}</dd></div></div>
                    <div className="flex gap-2.5"><CalendarDays className="size-4 mt-0.5 text-primary" aria-hidden="true" /><div><dt className="text-xs text-muted-foreground">Tanggal</dt><dd className="font-semibold">{b.booking_date ? fmtDate(b.booking_date) : 'Menunggu konfirmasi tim'}</dd></div></div>
                    {b.package_name && <div className="flex gap-2.5"><Package className="size-4 mt-0.5 text-primary" aria-hidden="true" /><div><dt className="text-xs text-muted-foreground">Paket</dt><dd className="font-semibold">{b.package_name}</dd></div></div>}
                  </dl>
                  <p className="pt-3 border-t border-border text-xs text-muted-foreground">Dikirim {format(new Date(b.created_at), 'dd MMMM yyyy, HH:mm', { locale: idLocale })}</p>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default BookingTrack;
