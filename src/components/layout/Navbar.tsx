import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { BookingDialog } from '@/components/booking/BookingDialog';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { useSiteSettings } from '@/hooks/useCMS';

const navLinks = [
  { name: 'Beranda', href: '/' },
  { name: 'Tentang Kami', href: '/tentang-kami' },
  { name: 'Portfolio', href: '/portfolio' },
  { name: 'Lokasi', href: '/lokasi' },
  { name: 'NEWS', href: '/paket' },
  { name: 'Artikel', href: '/artikel' },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { pathname } = useLocation();
  const { user, isAdmin, signOut } = useAuth();
  const { data: siteSettings } = useSiteSettings();
  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 60);
    update(); window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, []);
  useEffect(() => { setIsOpen(false); }, [pathname]);
  useEffect(() => {
    if (!isOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const close = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsOpen(false); };
    document.addEventListener('keydown', close);
    return () => { document.body.style.overflow = previous; document.removeEventListener('keydown', close); };
  }, [isOpen]);
  return <>
    <nav aria-label="Navigasi utama" className={`editorial-nav fixed top-0 left-0 right-0 z-50 ${scrolled || pathname !== '/' || isOpen ? 'is-solid' : ''}`}>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center h-16 lg:h-20 px-4 sm:px-8 lg:px-12 gap-3">
        <Button variant="ghost" onClick={() => setIsOpen(v => !v)} className="justify-self-start rounded-none px-0 hover:bg-transparent hover:text-foreground/70 text-xs" aria-label={isOpen ? 'Tutup menu' : 'Buka menu'} aria-expanded={isOpen} aria-controls="public-menu">{isOpen ? <X /> : <Menu />}<span className="hidden sm:inline">Menu</span></Button>
        <Link to="/" aria-label="Beranda Kediaman" className="justify-self-center">{siteSettings?.logo_url ? <img src={siteSettings.logo_url} alt={`${siteSettings.site_name || 'Kediaman Corp'} logo`} className="h-8 lg:h-10 max-w-36 object-contain" /> : <span className="text-base sm:text-xl font-light uppercase">{siteSettings?.site_name || 'Kediaman'}</span>}</Link>
        <div className="flex gap-4 items-center justify-self-end">
          {user && <>{isAdmin && <Link to="/admin" className="hidden lg:block text-xs">Admin</Link>}<Button variant="ghost" onClick={signOut} className="hidden lg:flex text-xs px-0">Keluar</Button></>}
          <BookingDialog><Button variant="ghost" className="border border-foreground/30 rounded-none text-[10px] sm:text-xs px-3 sm:px-6 h-9 hover:bg-foreground hover:text-background">Booking</Button></BookingDialog>
        </div>
      </div>
    </nav>
    <AnimatePresence>{isOpen && <motion.div id="public-menu" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="editorial-menu fixed inset-0 z-40 overflow-y-auto pt-28 pb-12 px-6 flex flex-col items-center justify-center">
      <nav aria-label="Menu halaman" className="flex flex-col items-center gap-3">{navLinks.map((link,i) => <motion.div key={link.href} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i*.04 }}><Link to={link.href} onClick={() => setIsOpen(false)} aria-current={pathname === link.href ? 'page' : undefined} className={`block text-3xl sm:text-4xl font-display italic py-2 ${pathname === link.href ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>{link.name}</Link></motion.div>)}</nav>
      <div className="mt-8 pt-6 border-t border-border flex gap-6 text-sm">{user && <>{isAdmin && <Link to="/admin" onClick={() => setIsOpen(false)}>Admin</Link>}<Button variant="ghost" onClick={() => { signOut(); setIsOpen(false); }}>Keluar</Button></>}<Link to="/booking/track" onClick={() => setIsOpen(false)}>Status Booking</Link></div>
    </motion.div>}</AnimatePresence>
  </>;
}
