import { NavLink } from 'react-router-dom';
import { Home, Building2, Tag, CalendarCheck, LifeBuoy } from 'lucide-react';
import { cn } from '@/lib/utils';

const items = [
  { name: 'Beranda', href: '/', icon: Home, end: true },
  { name: 'Venue', href: '/lokasi', icon: Building2 },
  { name: 'Promo', href: '/promo', icon: Tag },
  { name: 'Status', href: '/booking/track', icon: CalendarCheck },
  { name: 'Bantuan', href: '/bantuan', icon: LifeBuoy },
];

/** Navigasi bawah ala aplikasi untuk layar HP. */
export function MobileBottomNav() {
  return (
    <nav aria-label="Navigasi bawah" className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-card border-t border-border pb-[env(safe-area-inset-bottom)]">
      <ul className="grid grid-cols-5">
        {items.map(({ name, href, icon: Icon, end }) => (
          <li key={href}>
            <NavLink to={href} end={end} className={({ isActive }) => cn('flex flex-col items-center justify-center gap-1 h-16 text-[11px] font-bold', isActive ? 'text-primary' : 'text-muted-foreground')}>
              <Icon className="size-5" aria-hidden="true" />
              {name}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
