import { Link } from "react-router-dom";
import { Instagram, Facebook, Youtube } from "lucide-react";
import { useSiteSettings } from "@/hooks/useCMS";

const TikTokIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
);

const footerLinks = [
  { name: 'Beranda', href: '/' },
  { name: 'Tentang Kami', href: '/tentang-kami' },
  { name: 'Portfolio', href: '/portfolio' },
  { name: 'Lokasi', href: '/lokasi' },
  { name: 'News & Promo', href: '/paket' },
  { name: 'Artikel', href: '/artikel' },
];

export function Footer() {
  const { data: settings } = useSiteSettings();

  const socialLinks = [
    { icon: Instagram, url: settings?.instagram_link, label: 'Instagram' },
    { icon: Facebook, url: settings?.facebook_link, label: 'Facebook' },
    { icon: Youtube, url: settings?.youtube_link, label: 'YouTube' },
    { icon: TikTokIcon, url: settings?.tiktok_link, label: 'TikTok' },
  ].filter(s => s.url);

  return (
    <footer className="border-t border-border/50">
      <div className="container mx-auto px-6 lg:px-12">
        {/* Main Footer */}
        <div className="py-16 lg:py-24 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8">
          {/* Brand Column */}
          <div className="lg:col-span-5 space-y-6">
            <Link to="/" className="inline-block">
              {settings?.logo_url ? (
                <img src={settings.logo_url} alt={`${settings?.site_name || "Kediaman Corp"} logo`} className="h-10 w-auto" />
              ) : (
                <span className="font-serif text-2xl tracking-[0.15em] font-bold uppercase">
                  {settings?.site_name || "Kediaman"}
                </span>
              )}
            </Link>
            {settings?.tagline && (
              <p className="text-muted-foreground text-sm leading-relaxed max-w-sm">
                {settings.tagline}
              </p>
            )}
            {settings?.address && (
              <p className="text-muted-foreground/70 text-xs leading-relaxed max-w-sm">
                {settings.address}
              </p>
            )}
          </div>

          {/* Links Column */}
          <div className="lg:col-span-3">
            <h4 className="text-[11px] tracking-[0.2em] uppercase text-muted-foreground mb-6">Navigasi</h4>
            <nav aria-label="Navigasi footer">
              <ul className="space-y-3">
                {footerLinks.map((link) => (
                  <li key={link.name}>
                    <Link
                      to={link.href}
                      className="text-sm text-foreground/80 hover:text-primary transition-colors duration-300"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          {/* Contact Column */}
          <div className="lg:col-span-4">
            <h4 className="text-[11px] tracking-[0.2em] uppercase text-muted-foreground mb-6">Kontak</h4>
            <div className="space-y-3">
              {settings?.email && (
                <a href={`mailto:${settings.email}`} className="block text-sm text-foreground/80 hover:text-primary transition-colors duration-300">
                  {settings.email}
                </a>
              )}
              {settings?.phone && (
                <a href={`tel:${settings.phone}`} className="block text-sm text-foreground/80 hover:text-primary transition-colors duration-300">
                  {settings.phone}
                </a>
              )}
            </div>

            {/* Social */}
            {socialLinks.length > 0 && (
              <div className="flex gap-4 mt-8">
                {socialLinks.map((social) => (
                  <a
                    key={social.label}
                    href={social.url!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-primary transition-colors duration-300"
                    aria-label={social.label}
                  >
                    <social.icon className="w-4 h-4" />
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="py-6 border-t border-border/30 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-muted-foreground/60 text-[11px] tracking-[0.1em] uppercase">
            © {new Date().getFullYear()} {settings?.site_name || "Kediaman"}
          </p>
          <p className="text-muted-foreground/40 text-[11px] tracking-[0.05em]">
            All rights reserved
          </p>
        </div>
      </div>
    </footer>
  );
}
