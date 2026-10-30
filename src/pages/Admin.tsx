import { Link } from 'react-router-dom';
import { CalendarCheck, MapPin, Wallet, Tag, Users, FileText, Star, HelpCircle, ArrowRight, CheckCircle2, CircleAlert, Plus } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useBallroomBookings, useLocations, usePrograms, useTrainers, useArticles } from '@/hooks/useCMS';
import { useVenuePackages, useFaqs, useVenueReviews } from '@/hooks/useOta';
import { promoExpired } from '@/pages/Packages';

type Booking = { id: string; status: string; booking_date: string | null; contact_name: string; event_name: string | null; created_at: string; locations?: { name: string } | null };

const Admin = () => {
  const { data: bookings = [] } = useBallroomBookings();
  const { data: locations = [] } = useLocations();
  const { data: programs = [] } = usePrograms();
  const { data: portfolios = [] } = useTrainers();
  const { data: articles = [] } = useArticles();
  const { data: packages = [] } = useVenuePackages();
  const { data: faqs = [] } = useFaqs();
  const { data: reviews = [] } = useVenueReviews();

  const allBookings = bookings as Booking[];
  const pending = allBookings.filter((b) => b.status === 'pending');
  const activePromos = (programs as { is_active: boolean | null; end_date?: string | null }[]).filter((p) => p.is_active && !promoExpired(p));
  const venuesWithoutPackage = locations.filter((l) => !packages.some((p) => p.location_id === l.id && p.is_active));
  const venuesWithoutCapacity = locations.filter((l) => !l.ballroom_layout_capacity);

  const stats = [
    { name: 'Booking menunggu', value: pending.length, href: '/admin/ballroom-bookings', icon: CalendarCheck, highlight: pending.length > 0 },
    { name: 'Venue', value: locations.length, href: '/admin/locations', icon: MapPin },
    { name: 'Paket aktif', value: packages.filter((p) => p.is_active).length, href: '/admin/packages', icon: Wallet },
    { name: 'Promo berjalan', value: activePromos.length, href: '/admin/programs', icon: Tag },
    { name: 'Portfolio', value: portfolios.length, href: '/admin/trainers', icon: Users },
    { name: 'Artikel', value: articles.length, href: '/admin/articles', icon: FileText },
    { name: 'Ulasan terbit', value: reviews.filter((r) => r.is_published).length, href: '/admin/reviews', icon: Star },
    { name: 'FAQ tampil', value: faqs.filter((f) => f.is_active).length, href: '/admin/faqs', icon: HelpCircle },
  ];

  const todos = [
    { done: venuesWithoutPackage.length === 0, text: venuesWithoutPackage.length ? `${venuesWithoutPackage.length} venue belum punya paket & harga` : 'Semua venue sudah punya paket', href: '/admin/packages' },
    { done: venuesWithoutCapacity.length === 0, text: venuesWithoutCapacity.length ? `${venuesWithoutCapacity.length} venue belum diisi kapasitas` : 'Kapasitas semua venue terisi', href: '/admin/locations' },
    { done: faqs.some((f) => f.is_active), text: faqs.some((f) => f.is_active) ? 'Halaman Bantuan sudah berisi FAQ' : 'Halaman Bantuan masih kosong — tambah FAQ', href: '/admin/faqs' },
    { done: reviews.some((r) => r.is_published), text: reviews.some((r) => r.is_published) ? 'Ulasan pasangan sudah tampil' : 'Belum ada ulasan pasangan yang terbit', href: '/admin/reviews' },
    { done: activePromos.length > 0, text: activePromos.length ? `${activePromos.length} promo sedang berjalan` : 'Tidak ada promo yang berjalan', href: '/admin/programs' },
  ];
  const openTodos = todos.filter((t) => !t.done).length;

  const fmtDate = (d: string) => new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <AdminLayout title="Dashboard" description="Ringkasan booking dan kelengkapan konten website kediaman.co.">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {stats.map((s) => (
          <Link key={s.name} to={s.href} className={`ota-card p-4 md:p-5 group hover:shadow-md transition-shadow ${s.highlight ? 'ring-2 ring-gold' : ''}`}>
            <div className="flex items-center justify-between">
              <span className="grid place-items-center size-9 rounded-lg bg-secondary text-primary"><s.icon className="size-4" aria-hidden="true" /></span>
              <ArrowRight className="size-4 text-muted-foreground group-hover:text-primary transition-colors" aria-hidden="true" />
            </div>
            <p className="mt-3 text-2xl md:text-3xl font-extrabold">{s.value}</p>
            <p className="text-sm text-muted-foreground">{s.name}</p>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-5 gap-4 mt-6">
        <section className="ota-card p-5 lg:col-span-3">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-extrabold">Booking terbaru</h2>
            <Link to="/admin/ballroom-bookings" className="text-sm font-semibold text-primary hover:underline">Lihat semua</Link>
          </div>
          {allBookings.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Belum ada permintaan booking.</p>
          ) : (
            <ul className="divide-y divide-border">
              {allBookings.slice(0, 6).map((b) => (
                <li key={b.id} className="py-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{b.event_name || b.contact_name}</p>
                    <p className="text-xs text-muted-foreground truncate">{b.locations?.name || '-'} · {b.booking_date ? `acara ${fmtDate(b.booking_date)}` : `masuk ${fmtDate(b.created_at)}`}</p>
                  </div>
                  <span className={b.status === 'pending' ? 'ota-badge' : b.status === 'approved' ? 'ota-pill-ok' : 'ota-pill-full'}>
                    {b.status === 'pending' ? 'Menunggu' : b.status === 'approved' ? 'Disetujui' : b.status === 'rejected' ? 'Ditolak' : b.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="ota-card p-5 lg:col-span-2">
          <h2 className="text-lg font-extrabold">Kelengkapan website</h2>
          <p className="text-sm text-muted-foreground mb-3">{openTodos ? `${openTodos} hal perlu dilengkapi agar halaman publik terlihat penuh.` : 'Semua sudah lengkap.'}</p>
          <ul className="space-y-1">
            {todos.map((t) => (
              <li key={t.text}>
                <Link to={t.href} className="flex items-start gap-2.5 rounded-lg px-2 py-2 text-sm hover:bg-muted">
                  {t.done
                    ? <CheckCircle2 className="size-4 mt-0.5 shrink-0 text-primary" aria-hidden="true" />
                    : <CircleAlert className="size-4 mt-0.5 shrink-0 text-gold" aria-hidden="true" />}
                  <span className={t.done ? 'text-muted-foreground' : 'font-semibold'}>{t.text}</span>
                </Link>
              </li>
            ))}
          </ul>
          <div className="grid grid-cols-2 gap-2 mt-4">
            {[['Paket baru', '/admin/packages'], ['Promo baru', '/admin/programs'], ['Artikel baru', '/admin/articles'], ['Portfolio baru', '/admin/trainers']].map(([label, href]) => (
              <Link key={href} to={href} className="flex items-center justify-center gap-1.5 h-10 rounded-lg bg-secondary text-sm font-semibold text-primary hover:bg-secondary/70">
                <Plus className="size-4" aria-hidden="true" />{label}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </AdminLayout>
  );
};

export default Admin;
