import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Settings, LogOut, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { useSiteSettings } from '@/hooks/useCMS';

const navLinks = [
  { name: 'Beranda', href: '/' },
  { name: 'Tentang Kami', href: '/tentang-kami' },
  { name: 'Portfolio', href: '/portfolio' },
  { name: 'Lokasi', href: '/lokasi' },
  { name: 'Paket', href: '/paket' },
  { name: 'Artikel', href: '/artikel' },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { user, isAdmin, signOut } = useAuth();
  const { data: siteSettings } = useSiteSettings();

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/60 backdrop-blur-xl border-b border-border/50">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo */}
            <Link to="/" className="relative z-50">
              {siteSettings?.logo_url ? (
                <img
                  src={siteSettings.logo_url}
                  alt={siteSettings.site_name || 'Logo'}
                  className="h-8 lg:h-10 w-auto object-contain"
                />
              ) : (
                <span className="font-serif text-xl lg:text-2xl tracking-[0.15em] font-bold uppercase">
                  {siteSettings?.site_name || 'Kediaman'}
                </span>
              )}
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.href}
                  className={`relative px-4 py-2 text-[13px] tracking-[0.12em] uppercase transition-colors duration-300 ${
                    location.pathname === link.href
                      ? 'text-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {link.name}
                  {location.pathname === link.href && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="absolute bottom-0 left-4 right-4 h-px bg-primary"
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                  )}
                </Link>
              ))}
            </div>

            {/* Desktop Auth */}
            <div className="hidden lg:flex items-center gap-3">
              {user ? (
                <>
                  {isAdmin && (
                    <Link to="/admin">
                      <Button variant="ghost" size="sm" className="text-xs tracking-[0.1em] uppercase">
                        Admin
                      </Button>
                    </Link>
                  )}
                  <Button variant="ghost" size="sm" onClick={signOut} className="text-xs tracking-[0.1em] uppercase">
                    Logout
                  </Button>
                </>
              ) : (
                <Link to="/auth">
                  <Button variant="ghost" size="sm" className="text-xs tracking-[0.1em] uppercase border border-border/50 hover:border-primary hover:text-primary">
                    Masuk
                  </Button>
                </Link>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <button
              className="lg:hidden relative z-50 p-2"
              onClick={() => setIsOpen(!isOpen)}
              aria-label="Toggle menu"
            >
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Fullscreen Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-40 bg-background flex flex-col justify-center items-center"
          >
            <nav className="flex flex-col items-center gap-1">
              {navLinks.map((link, i) => (
                <motion.div
                  key={link.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ delay: i * 0.05, duration: 0.3 }}
                >
                  <Link
                    to={link.href}
                    onClick={() => setIsOpen(false)}
                    className={`block py-3 text-3xl font-serif tracking-[0.05em] transition-colors ${
                      location.pathname === link.href ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {link.name}
                  </Link>
                </motion.div>
              ))}

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="mt-8 pt-8 border-t border-border/30 flex flex-col items-center gap-3"
              >
                {user ? (
                  <>
                    {isAdmin && (
                      <Link to="/admin" onClick={() => setIsOpen(false)} className="text-sm tracking-[0.1em] uppercase text-muted-foreground hover:text-foreground transition-colors">
                        Admin Panel
                      </Link>
                    )}
                    <button onClick={() => { signOut(); setIsOpen(false); }} className="text-sm tracking-[0.1em] uppercase text-destructive hover:text-destructive/80 transition-colors">
                      Keluar
                    </button>
                  </>
                ) : (
                  <Link to="/auth" onClick={() => setIsOpen(false)} className="text-sm tracking-[0.1em] uppercase text-primary hover:text-primary/80 transition-colors">
                    Masuk / Daftar
                  </Link>
                )}
              </motion.div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
