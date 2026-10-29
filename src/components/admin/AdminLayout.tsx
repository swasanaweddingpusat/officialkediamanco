import { useEffect, useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Image, Zap, Tag, Users, MapPin, Settings, LogOut, CalendarDays, CalendarCheck, FileText,
  Video, Info, Wallet, HelpCircle, Star, Menu, ExternalLink, type LucideIcon,
} from 'lucide-react';
import { useOtaTheme } from '@/hooks/useOtaTheme';
import { useAuth } from '@/hooks/useAuth';
import { useBallroomBookings, useSiteSettings } from '@/hooks/useCMS';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { CMSImage } from '@/components/CMSImage';
import { cn } from '@/lib/utils';

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
  description?: string;
}

type NavItem = { name: string; href: string; icon: LucideIcon; badge?: 'pending' };

const NAV_GROUPS: { label: string; items: NavItem[] }[] = [
  { label: 'Ringkasan', items: [{ name: 'Dashboard', href: '/admin', icon: LayoutDashboard }] },
  {
    label: 'Booking',
    items: [
      { name: 'Booking masuk', href: '/admin/ballroom-bookings', icon: CalendarCheck, badge: 'pending' },
      { name: 'Jadwal ballroom', href: '/admin/ballroom-schedules', icon: CalendarDays },
    ],
  },
  {
    label: 'Venue & penawaran',
    items: [
      { name: 'Venue', href: '/admin/locations', icon: MapPin },
      { name: 'Paket & harga', href: '/admin/packages', icon: Wallet },
      { name: 'Promo', href: '/admin/programs', icon: Tag },
    ],
  },
  {
    label: 'Konten website',
    items: [
      { name: 'Hero beranda', href: '/admin/hero', icon: Image },
      { name: 'Keunggulan', href: '/admin/features', icon: Zap },
      { name: 'Portfolio', href: '/admin/trainers', icon: Users },
      { name: 'Artikel', href: '/admin/articles', icon: FileText },
      { name: 'Video testimoni', href: '/admin/video-testimonials', icon: Video },
      { name: 'Ulasan pasangan', href: '/admin/reviews', icon: Star },
      { name: 'Bantuan / FAQ', href: '/admin/faqs', icon: HelpCircle },
      { name: 'Tentang kami', href: '/admin/about', icon: Info },
    ],
  },
  { label: 'Pengaturan', items: [{ name: 'Pengaturan situs', href: '/admin/settings', icon: Settings }] },
];

const isActivePath = (pathname: string, href: string) =>
  href === '/admin' ? pathname === '/admin' : pathname === href || pathname.startsWith(`${href}/`);

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { pathname } = useLocation();
  const { signOut, user } = useAuth();
  const { data: settings } = useSiteSettings();
  const { data: bookings = [] } = useBallroomBookings();
  const pending = (bookings as { status?: string }[]).filter((b) => b.status === 'pending').length;

  return (
    <div className="flex h-full flex-col bg-primary text-primary-foreground">
      <Link to="/admin" onClick={onNavigate} className="flex items-center gap-3 px-5 h-16 shrink-0 border-b border-white/10">
        {settings?.logo_url ? (
          <span className="grid place-items-center size-9 rounded-lg bg-white/95 p-1">
            <CMSImage src={settings.logo_url} imageWidth={96} sizes="36px" alt="" className="h-full w-auto object-contain" />
          </span>
        ) : (
          <span className="grid place-items-center size-9 rounded-lg bg-white/10 font-extrabold">K</span>
        )}
        <span className="leading-tight">
          <span className="block font-extrabold">Kediaman</span>
          <span className="block text-xs text-primary-foreground/60">Panel admin</span>
        </span>
      </Link>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5" aria-label="Menu admin">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="px-3 mb-1.5 text-[11px] font-bold uppercase tracking-wider text-primary-foreground/45">{group.label}</p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active = isActivePath(pathname, item.href);
                return (
                  <li key={item.href}>
                    <Link
                      to={item.href}
                      onClick={onNavigate}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold transition-colors',
                        active ? 'bg-white text-primary shadow-sm' : 'text-primary-foreground/75 hover:bg-white/10 hover:text-primary-foreground',
                      )}
                    >
                      <item.icon className="size-4 shrink-0" aria-hidden="true" />
                      <span className="flex-1">{item.name}</span>
                      {item.badge === 'pending' && pending > 0 && (
                        <span className="min-w-5 h-5 px-1.5 rounded-full bg-gold text-[11px] font-bold leading-5 text-center text-primary">{pending}</span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="shrink-0 border-t border-white/10 p-3 space-y-1">
        {user?.email && <p className="px-3 pb-1 text-xs text-primary-foreground/55 truncate">{user.email}</p>}
        <a href="/" target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold text-primary-foreground/75 hover:bg-white/10 hover:text-primary-foreground">
          <ExternalLink className="size-4" aria-hidden="true" /> Lihat website
        </a>
        <button type="button" onClick={signOut} className="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold text-primary-foreground/75 hover:bg-white/10 hover:text-primary-foreground">
          <LogOut className="size-4" aria-hidden="true" /> Keluar
        </button>
      </div>
    </div>
  );
}

export function AdminLayout({ children, title, description }: AdminLayoutProps) {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  useOtaTheme(true);

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) navigate('/auth');
  }, [user, isAdmin, loading, navigate]);

  useEffect(() => { setMenuOpen(false); }, [pathname]);

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-background">
        <div className="text-center">
          <div className="size-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Memuat panel admin…</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background">
      <aside className="hidden lg:block fixed inset-y-0 left-0 w-64 z-30">
        <SidebarContent />
      </aside>

      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="left" className="w-72 p-0 border-0 [&>button]:text-primary-foreground">
          <SheetTitle className="sr-only">Menu admin</SheetTitle>
          <SidebarContent onNavigate={() => setMenuOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 h-16 flex items-center gap-3 px-4 md:px-8 bg-card/90 backdrop-blur border-b border-border">
          <button type="button" onClick={() => setMenuOpen(true)} className="lg:hidden grid place-items-center size-10 rounded-lg hover:bg-muted" aria-label="Buka menu">
            <Menu className="size-5" />
          </button>
          <p className="text-sm text-muted-foreground truncate">
            <Link to="/admin" className="hover:text-foreground">Admin</Link>
            {pathname !== '/admin' && <> <span aria-hidden="true">/</span> <span className="text-foreground font-semibold">{title}</span></>}
          </p>
        </header>

        <main className="px-4 md:px-8 py-6 md:py-8 max-w-[1400px]">
          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">{title}</h1>
            {description && <p className="mt-1 text-sm text-muted-foreground max-w-2xl">{description}</p>}
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
