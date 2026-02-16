import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Dumbbell, Home, Gift, Briefcase, MapPin, FileText, LogIn, LogOut, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { useSiteSettings } from '@/hooks/useCMS';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

const navLinks = [
  { name: 'Beranda', href: '/', icon: Home },
  { name: 'Tentang Kami', href: '/classes', icon: Gift },
  { name: 'Portfolio', href: '/trainers', icon: Briefcase },
  { name: 'Lokasi', href: '/locations', icon: MapPin },
  { name: 'Artikel', href: '/blog', icon: FileText },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { user, isAdmin, signOut } = useAuth();
  const { data: siteSettings } = useSiteSettings();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            {siteSettings?.logo_url ? (
              <img 
                src={siteSettings.logo_url} 
                alt={siteSettings.site_name || 'Logo'} 
                className="h-10 w-auto object-contain"
              />
            ) : (
              <>
                <span className="font-serif text-2xl tracking-wider font-bold">
                  {siteSettings?.site_name || 'Logo'}
                </span>
              </>
            )}
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.href}
                className={`font-medium transition-colors hover:text-primary ${
                  location.pathname === link.href ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <>
                {isAdmin && (
                  <Link to="/admin">
                    <Button variant="outline" size="sm">
                      Admin
                    </Button>
                  </Link>
                )}
                <Button variant="ghost" size="sm" onClick={signOut}>
                  Logout
                </Button>
              </>
            ) : (
              <Link to="/auth">
                <Button variant="default" className="btn-glow">
                  Join Now
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile Menu - User Friendly Sheet */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button 
                variant="outline" 
                size="lg"
                className="px-4 py-3 text-base font-semibold gap-2"
              >
                <span className="text-lg">☰</span>
                <span>Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl">
              <SheetHeader className="pb-4 border-b border-border">
                <SheetTitle className="text-center text-xl">
                  {siteSettings?.site_name || 'Menu Navigasi'}
                </SheetTitle>
              </SheetHeader>
              
              <div className="flex flex-col gap-3 py-6 overflow-y-auto">
                {navLinks.map((link) => {
                  const IconComponent = link.icon;
                  const isActive = location.pathname === link.href;
                  
                  return (
                    <Link
                      key={link.name}
                      to={link.href}
                      onClick={() => setIsOpen(false)}
                      className={`flex items-center gap-4 p-5 rounded-2xl transition-all active:scale-[0.98] ${
                        isActive 
                          ? 'bg-primary text-primary-foreground shadow-lg' 
                          : 'bg-secondary hover:bg-secondary/80'
                      }`}
                    >
                      <div className={`p-3 rounded-xl ${isActive ? 'bg-primary-foreground/20' : 'bg-background'}`}>
                        <IconComponent className="w-7 h-7" />
                      </div>
                      <span className="text-xl font-semibold">{link.name}</span>
                    </Link>
                  );
                })}

                <div className="border-t border-border my-4" />

                {user ? (
                  <>
                    {isAdmin && (
                      <Link 
                        to="/admin" 
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-4 p-5 rounded-2xl bg-secondary hover:bg-secondary/80 transition-all active:scale-[0.98]"
                      >
                        <div className="p-3 rounded-xl bg-background">
                          <Settings className="w-7 h-7" />
                        </div>
                        <span className="text-xl font-semibold">Admin Panel</span>
                      </Link>
                    )}
                    <button
                      onClick={() => { signOut(); setIsOpen(false); }}
                      className="flex items-center gap-4 p-5 rounded-2xl bg-destructive/10 hover:bg-destructive/20 text-destructive transition-all active:scale-[0.98] w-full text-left"
                    >
                      <div className="p-3 rounded-xl bg-destructive/20">
                        <LogOut className="w-7 h-7" />
                      </div>
                      <span className="text-xl font-semibold">Keluar</span>
                    </button>
                  </>
                ) : (
                  <Link 
                    to="/auth" 
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-4 p-5 rounded-2xl bg-primary text-primary-foreground shadow-lg transition-all active:scale-[0.98]"
                  >
                    <div className="p-3 rounded-xl bg-primary-foreground/20">
                      <LogIn className="w-7 h-7" />
                    </div>
                    <span className="text-xl font-semibold">Masuk / Daftar</span>
                  </Link>
                )}
              </div>

              {/* Footer hint */}
              <div className="absolute bottom-6 left-0 right-0 text-center">
                <p className="text-muted-foreground text-sm">
                  Geser ke bawah untuk menutup
                </p>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}
