import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Dumbbell, Home, Gift, Briefcase, MapPin, FileText, LogIn, LogOut, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
  { name: 'Promo', href: '/classes', icon: Gift },
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
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-md border-b border-border/50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            {siteSettings?.logo_url ? (
              <img 
                src={siteSettings.logo_url} 
                alt={siteSettings.site_name || 'Logo'} 
                className="h-12 w-auto object-contain"
              />
            ) : (
              <span className="font-display text-2xl tracking-[0.15em] text-foreground">
                {siteSettings?.site_name || 'KEDIAMAN'}
              </span>
            )}
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-10">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.href}
                className={`text-sm tracking-[0.1em] uppercase transition-colors hover:text-primary ${
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
                    <Button variant="outline" size="sm" className="tracking-wider uppercase text-xs border-primary/30 hover:border-primary">
                      Admin
                    </Button>
                  </Link>
                )}
                <Button variant="ghost" size="sm" onClick={signOut} className="tracking-wider uppercase text-xs">
                  Logout
                </Button>
              </>
            ) : (
              <Link to="/auth">
                <Button className="btn-glow tracking-wider uppercase text-xs px-6">
                  Hubungi Kami
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile Menu */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button 
                variant="ghost" 
                size="lg"
                className="px-4 py-3 tracking-wider uppercase text-sm"
              >
                Menu
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl bg-card border-t border-border/50">
              <SheetHeader className="pb-6 border-b border-border/50">
                <SheetTitle className="text-center font-display text-2xl tracking-wider">
                  {siteSettings?.site_name || 'Menu'}
                </SheetTitle>
              </SheetHeader>
              
              <div className="flex flex-col gap-2 py-8 overflow-y-auto">
                {navLinks.map((link) => {
                  const IconComponent = link.icon;
                  const isActive = location.pathname === link.href;
                  
                  return (
                    <Link
                      key={link.name}
                      to={link.href}
                      onClick={() => setIsOpen(false)}
                      className={`flex items-center gap-4 p-5 rounded-xl transition-all ${
                        isActive 
                          ? 'bg-primary/10 text-primary border border-primary/30' 
                          : 'hover:bg-secondary/50'
                      }`}
                    >
                      <IconComponent className="w-6 h-6" />
                      <span className="text-xl tracking-wide">{link.name}</span>
                    </Link>
                  );
                })}

                <div className="border-t border-border/50 my-6" />

                {user ? (
                  <>
                    {isAdmin && (
                      <Link 
                        to="/admin" 
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-4 p-5 rounded-xl hover:bg-secondary/50 transition-all"
                      >
                        <Settings className="w-6 h-6" />
                        <span className="text-xl tracking-wide">Admin Panel</span>
                      </Link>
                    )}
                    <button
                      onClick={() => { signOut(); setIsOpen(false); }}
                      className="flex items-center gap-4 p-5 rounded-xl hover:bg-destructive/10 text-destructive transition-all w-full text-left"
                    >
                      <LogOut className="w-6 h-6" />
                      <span className="text-xl tracking-wide">Keluar</span>
                    </button>
                  </>
                ) : (
                  <Link 
                    to="/auth" 
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-4 p-5 rounded-xl bg-primary/10 text-primary border border-primary/30 transition-all"
                  >
                    <LogIn className="w-6 h-6" />
                    <span className="text-xl tracking-wide">Masuk / Daftar</span>
                  </Link>
                )}
              </div>

              <div className="absolute bottom-8 left-0 right-0 text-center">
                <p className="text-muted-foreground text-sm tracking-wider">
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
