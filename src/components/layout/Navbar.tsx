import { CMSImage } from '@/components/CMSImage';
import { FormEvent, useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Menu, Search, X, MessageCircle } from 'lucide-react';
import { BookingDialog } from '@/components/booking/BookingDialog';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useSiteSettings } from '@/hooks/useCMS';
import { cn } from '@/lib/utils';

export const NAV_LINKS = [
  { name: 'Venue', href: '/lokasi' },
  { name: 'Paket & Harga', href: '/harga' },
  { name: 'Promo', href: '/promo' },
  { name: 'Portfolio', href: '/portfolio' },
  { name: 'Ulasan', href: '/ulasan' },
  { name: 'Artikel', href: '/artikel' },
  { name: 'Tentang', href: '/tentang-kami' },
];

export function waLinkFrom(settings?: { whatsapp_link?: string | null; phone?: string | null } | null) {
  if (settings?.whatsapp_link) return settings.whatsapp_link;
  const digits = (settings?.phone || '6281117797567').replace(/[^0-9]/g, '');
  return `https://wa.me/${digits}`;
}

function Logo({ compact = false }: { compact?: boolean }) {
  const { data: settings } = useSiteSettings();
  const name = settings?.site_name || 'Kediaman';
  return (
    <Link to="/" aria-label={`${name} — Beranda`} className="flex items-center gap-2.5 shrink-0">
      {settings?.logo_url ? (
        <CMSImage src={settings.logo_url} imageWidth={96} sizes="44px" width={320} height={295} loading="eager" alt="" className="h-10 w-auto object-contain" />
      ) : null}
      {!compact && <span className="text-xl font-extrabold tracking-tight text-foreground">Kediaman</span>}
    </Link>
  );
}

function SearchBox({ className, autoFocus }: { className?: string; autoFocus?: boolean }) {
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const submit = (e: FormEvent) => {
    e.preventDefault();
    navigate(q.trim() ? `/lokasi?q=${encodeURIComponent(q.trim())}` : '/lokasi');
  };
  return (
    <form role="search" onSubmit={submit} className={cn('flex items-center gap-2 h-10 px-3.5 rounded-full bg-muted text-muted-foreground', className)}>
      <Search className="size-4 shrink-0" aria-hidden="true" />
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        autoFocus={autoFocus}
        placeholder="Cari venue atau area"
        aria-label="Cari venue atau area"
        className="bg-transparent outline-none w-full text-sm text-foreground placeholder:text-muted-foreground"
      />
    </form>
  );
}

export function Navbar() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const { user, isAdmin, signOut } = useAuth();
  const { data: settings } = useSiteSettings();
  const wa = waLinkFrom(settings);

  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const close = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', close);
    return () => { document.body.style.overflow = prev; document.removeEventListener('keydown', close); };
  }, [open]);

  return (
    <header className="sticky top-0 z-50 bg-card border-b border-border">
      {/* Bar utilitas (desktop) */}
      <div className="hidden lg:block border-b border-border">
        <div className="ota-container flex justify-end gap-6 py-1.5 text-xs text-muted-foreground">
          <Link to="/promo" className="hover:text-foreground">Promo</Link>
          <Link to="/booking/track" className="hover:text-foreground">Cek status booking</Link>
          <Link to="/bantuan" className="hover:text-foreground">Bantuan</Link>
          <a href={wa} target="_blank" rel="noopener noreferrer" className="hover:text-foreground">WhatsApp</a>
          {user && isAdmin && <Link to="/admin" className="hover:text-foreground">Admin</Link>}
          {user && <button type="button" onClick={signOut} className="hover:text-foreground">Keluar</button>}
        </div>
      </div>

      <div className="ota-container flex items-center gap-3 lg:gap-6 h-16">
        <Logo />
        <SearchBox className="hidden md:flex flex-1 max-w-xs" />
        <nav aria-label="Navigasi utama" className="hidden lg:flex items-center gap-5 text-sm font-semibold">
          {NAV_LINKS.map((l) => (
            <NavLink key={l.href} to={l.href} className={({ isActive }) => cn('py-2 border-b-2 border-transparent hover:text-primary', isActive && 'border-primary text-primary')}>
              {l.name}
            </NavLink>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <Link to="/booking/track" className="hidden md:inline-flex items-center h-10 px-4 rounded-xl border border-input text-sm font-bold hover:border-primary">Cek status</Link>
          <BookingDialog>
            <Button className="h-10 px-4 sm:px-5 rounded-xl font-bold">Booking</Button>
          </BookingDialog>
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setOpen((v) => !v)} aria-label={open ? 'Tutup menu' : 'Buka menu'} aria-expanded={open} aria-controls="ota-mobile-menu">
            {open ? <X /> : <Menu />}
          </Button>
        </div>
      </div>

      {/* Pencarian mobile */}
      <div className="md:hidden ota-container pb-3">
        <SearchBox />
      </div>

      {open && (
        <div id="ota-mobile-menu" className="lg:hidden fixed inset-x-0 top-[7.25rem] bottom-0 z-40 bg-card overflow-y-auto border-t border-border">
          <nav aria-label="Menu" className="ota-container py-4 flex flex-col">
            {NAV_LINKS.map((l) => (
              <NavLink key={l.href} to={l.href} className={({ isActive }) => cn('py-3.5 border-b border-border text-base font-semibold', isActive && 'text-primary')}>
                {l.name}
              </NavLink>
            ))}
            <Link to="/bantuan" className="py-3.5 border-b border-border text-base font-semibold">Bantuan / FAQ</Link>
            <Link to="/booking/track" className="py-3.5 border-b border-border text-base font-semibold">Cek status booking</Link>
            {user && isAdmin && <Link to="/admin" className="py-3.5 border-b border-border text-base font-semibold">Admin</Link>}
            {user && <button type="button" onClick={signOut} className="py-3.5 text-left text-base font-semibold">Keluar</button>}
            <a href={wa} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex items-center justify-center gap-2 h-12 rounded-xl bg-primary text-primary-foreground font-bold">
              <MessageCircle className="size-4" /> Chat tim via WhatsApp
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}
