import { CMSImage } from '@/components/CMSImage';
import { FormEvent, useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  Menu, Search, X, MessageCircle, Building2, Wallet, Tag, Images, Briefcase, Gift, Newspaper, Info,
  ClipboardCheck, HelpCircle, LayoutDashboard, LogOut, ChevronRight, type LucideIcon,
} from 'lucide-react';
import { BookingDialog } from '@/components/booking/BookingDialog';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useSiteSettings } from '@/hooks/useCMS';
import { cn } from '@/lib/utils';

export const NAV_LINKS: { name: string; href: string; icon: LucideIcon }[] = [
  { name: 'Venue', href: '/lokasi', icon: Building2 },
  { name: 'Paket & Harga', href: '/harga', icon: Wallet },
  { name: 'Promo', href: '/promo', icon: Tag },
  { name: 'Portfolio', href: '/portfolio', icon: Images },
  { name: 'Artikel', href: '/artikel', icon: Newspaper },
  { name: 'Karier', href: '/karir', icon: Briefcase },
  { name: 'Rewards', href: '/rewards', icon: Gift },
  { name: 'Tentang', href: '/tentang-kami', icon: Info },
];

export function waLinkFrom(settings?: { whatsapp_link?: string | null; phone?: string | null } | null) {
  if (settings?.whatsapp_link) return settings.whatsapp_link;
  const digits = (settings?.phone || '6281117797567').replace(/[^0-9]/g, '');
  return `https://wa.me/${digits}`;
}

function Logo() {
  const { data: settings } = useSiteSettings();
  const name = settings?.site_name || 'Kediaman';
  return (
    <Link to="/" aria-label={`${name} — Beranda`} className="flex items-center gap-2.5 shrink-0">
      {settings?.logo_url ? (
        <CMSImage src={settings.logo_url} imageWidth={96} sizes="44px" width={320} height={295} loading="eager" alt="" className="h-10 w-auto object-contain" />
      ) : null}
      <span className="flex flex-col leading-none">
        <span className="text-xl font-extrabold tracking-tight text-foreground">Kediaman</span>
        <span className="hidden xl:block mt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Venue &amp; Ballroom</span>
      </span>
    </Link>
  );
}

function SearchBox({ className, shortcut = false }: { className?: string; shortcut?: boolean }) {
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const ref = useRef<HTMLInputElement>(null);

  // Tekan "/" untuk langsung mengetik di kotak pencarian (desktop)
  useEffect(() => {
    if (!shortcut) return;
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (e.key === '/' && !e.metaKey && !e.ctrlKey && !(t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)))) {
        e.preventDefault();
        ref.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [shortcut]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    navigate(q.trim() ? `/lokasi?q=${encodeURIComponent(q.trim())}` : '/lokasi');
    ref.current?.blur();
  };
  return (
    <form role="search" onSubmit={submit} className={cn(
      'group flex items-center gap-2 h-11 pl-3.5 pr-1.5 rounded-xl border border-transparent bg-muted text-muted-foreground transition-colors focus-within:border-primary/40 focus-within:bg-card focus-within:shadow-sm',
      className,
    )}>
      <Search className="size-4 shrink-0" aria-hidden="true" />
      <input
        ref={ref}
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Cari venue, area, atau kota"
        aria-label="Cari venue, area, atau kota"
        className="min-w-0 flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground"
      />
      {shortcut && <kbd className="hidden xl:inline-flex h-6 items-center rounded-md border border-border bg-card px-1.5 font-mono text-[11px] text-muted-foreground group-focus-within:hidden">/</kbd>}
      <button type="submit" className="hidden md:inline-flex h-8 items-center rounded-lg bg-primary px-3.5 text-xs font-bold text-primary-foreground hover:opacity-90">Cari</button>
    </form>
  );
}

function QuickAction({ to, href, icon: Icon, label }: { to?: string; href?: string; icon: LucideIcon; label: string }) {
  const cls = 'flex flex-col items-center justify-center gap-0.5 min-w-14 h-12 px-2 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-colors';
  const inner = (<><Icon className="size-5" aria-hidden="true" /><span className="text-[11px] font-semibold leading-none">{label}</span></>);
  return href
    ? <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>{inner}</a>
    : <Link to={to ?? '/'} className={cls}>{inner}</Link>;
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
    <header className="sticky top-0 z-50 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/85 border-b border-border">
      {/* Baris utama: logo · pencarian · aksi */}
      <div className="ota-container flex items-center gap-3 lg:gap-6 h-16">
        <Logo />
        <SearchBox shortcut className="hidden md:flex flex-1 max-w-xl" />

        <div className="ml-auto flex items-center gap-1 lg:gap-1.5">
          <div className="hidden lg:flex items-center">
            <QuickAction to="/booking/track" icon={ClipboardCheck} label="Cek status" />
            <QuickAction to="/bantuan" icon={HelpCircle} label="Bantuan" />
            <QuickAction to="/rewards" icon={Gift} label={user ? 'Poin saya' : 'Rewards'} />
            {user && isAdmin && <QuickAction to="/admin" icon={LayoutDashboard} label="Admin" />}
          </div>
          <span className="hidden lg:block mx-1.5 h-8 w-px bg-border" aria-hidden="true" />
          <BookingDialog>
            <Button className="h-11 px-4 sm:px-6 rounded-xl font-extrabold shadow-sm">Booking</Button>
          </BookingDialog>
          <Button variant="ghost" size="icon" className="lg:hidden size-11 rounded-xl" onClick={() => setOpen((v) => !v)} aria-label={open ? 'Tutup menu' : 'Buka menu'} aria-expanded={open} aria-controls="ota-mobile-menu">
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </Button>
        </div>
      </div>

      {/* Baris navigasi (desktop) */}
      <div className="hidden lg:block border-t border-border/70">
        <div className="ota-container flex items-center justify-between h-11">
          <nav aria-label="Navigasi utama" className="flex items-center gap-1 -ml-2.5 text-sm font-semibold">
            {NAV_LINKS.map((l) => (
              <NavLink key={l.href} to={l.href} className={({ isActive }) => cn(
                'relative inline-flex items-center gap-1.5 h-11 px-2.5 text-muted-foreground hover:text-foreground transition-colors',
                'after:absolute after:inset-x-2.5 after:bottom-0 after:h-0.5 after:rounded-full after:bg-primary after:opacity-0 after:transition-opacity',
                isActive && 'text-primary after:opacity-100',
              )}>
                <l.icon className="size-4" aria-hidden="true" />{l.name}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-4 text-xs font-semibold text-muted-foreground">
            <a href={wa} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 hover:text-foreground">
              <span className="relative flex size-2"><span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-60 motion-reduce:animate-none" /><span className="relative inline-flex size-2 rounded-full bg-emerald-500" /></span>
              Chat tim via WhatsApp
            </a>
            {user && <button type="button" onClick={signOut} className="inline-flex items-center gap-1 hover:text-foreground"><LogOut className="size-3.5" />Keluar</button>}
          </div>
        </div>
      </div>

      {/* Pencarian mobile */}
      <div className="md:hidden ota-container pb-3">
        <SearchBox className="h-10" />
      </div>

      {/* Menu mobile/tablet */}
      {open && (
        <div id="ota-mobile-menu" className="lg:hidden fixed inset-x-0 top-[7.25rem] md:top-16 bottom-0 z-40 bg-background overflow-y-auto border-t border-border">
          <div className="ota-container py-5 space-y-6">
            <nav aria-label="Menu" className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {NAV_LINKS.map((l) => (
                <NavLink key={l.href} to={l.href} className={({ isActive }) => cn(
                  'flex flex-col gap-2 rounded-2xl border border-border bg-card p-3.5 font-bold transition-colors',
                  isActive ? 'border-primary bg-secondary text-primary' : 'hover:border-primary/40',
                )}>
                  <span className="grid size-9 place-items-center rounded-xl bg-secondary text-primary"><l.icon className="size-[18px]" aria-hidden="true" /></span>
                  <span className="text-sm">{l.name}</span>
                </NavLink>
              ))}
            </nav>

            <div className="ota-card divide-y divide-border overflow-hidden">
              {[
                { to: '/booking/track', icon: ClipboardCheck, label: 'Cek status booking' },
                { to: '/bantuan', icon: HelpCircle, label: 'Bantuan / FAQ' },
                ...(user && isAdmin ? [{ to: '/admin', icon: LayoutDashboard, label: 'Panel admin' }] : []),
              ].map((i) => (
                <Link key={i.to} to={i.to} className="flex items-center gap-3 px-4 py-3.5 text-sm font-semibold hover:bg-muted">
                  <i.icon className="size-5 text-muted-foreground" aria-hidden="true" />
                  <span className="flex-1">{i.label}</span>
                  <ChevronRight className="size-4 text-muted-foreground" aria-hidden="true" />
                </Link>
              ))}
              {user && (
                <button type="button" onClick={signOut} className="flex w-full items-center gap-3 px-4 py-3.5 text-left text-sm font-semibold hover:bg-muted">
                  <LogOut className="size-5 text-muted-foreground" aria-hidden="true" /><span className="flex-1">Keluar</span>
                </button>
              )}
            </div>

            <a href={wa} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 h-12 rounded-xl bg-primary text-primary-foreground font-bold">
              <MessageCircle className="size-4" /> Chat tim via WhatsApp
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
