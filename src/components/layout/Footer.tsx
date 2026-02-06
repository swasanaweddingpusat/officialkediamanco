import { Link } from "react-router-dom";
import { Instagram, Facebook, Phone, Mail, MapPin, Youtube } from "lucide-react";
import { useSiteSettings } from "@/hooks/useCMS";

// TikTok icon component (not available in lucide-react)
const TikTokIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
);

export function Footer() {
  const { data: settings } = useSiteSettings();

  return (
    <footer className="bg-card border-t border-border/50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 lg:gap-16">
          {/* Brand */}
          <div className="md:col-span-1 space-y-6">
            <Link to="/" className="inline-block">
              {settings?.logo_url ? (
                <img src={settings.logo_url} alt={settings?.site_name || "Logo"} className="h-14 w-auto" />
              ) : (
                <span className="font-display text-3xl tracking-[0.15em] text-foreground">
                  {settings?.site_name || "KEDIAMAN"}
                </span>
              )}
            </Link>
            <p className="text-muted-foreground text-lg leading-relaxed">
              {settings?.tagline || "Venue Premium untuk Momen Istimewa Anda"}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-display text-xl tracking-wider mb-6 text-foreground">Navigasi</h4>
            <ul className="space-y-4">
              <li>
                <Link to="/classes" className="text-muted-foreground hover:text-primary transition-colors tracking-wide">
                  Promo Spesial
                </Link>
              </li>
              <li>
                <Link to="/trainers" className="text-muted-foreground hover:text-primary transition-colors tracking-wide">
                  Portfolio
                </Link>
              </li>
              <li>
                <Link to="/locations" className="text-muted-foreground hover:text-primary transition-colors tracking-wide">
                  Lokasi Venue
                </Link>
              </li>
              <li>
                <Link to="/blog" className="text-muted-foreground hover:text-primary transition-colors tracking-wide">
                  Artikel
                </Link>
              </li>
              <li>
                <Link to="/booking/track" className="text-muted-foreground hover:text-primary transition-colors tracking-wide">
                  Cek Status Booking
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-display text-xl tracking-wider mb-6 text-foreground">Kontak</h4>
            <ul className="space-y-4">
              {settings?.phone && (
                <li className="flex items-center gap-3 text-muted-foreground">
                  <Phone className="w-4 h-4 text-primary flex-shrink-0" />
                  <span className="tracking-wide">{settings.phone}</span>
                </li>
              )}
              {settings?.email && (
                <li className="flex items-center gap-3 text-muted-foreground">
                  <Mail className="w-4 h-4 text-primary flex-shrink-0" />
                  <span className="tracking-wide">{settings.email}</span>
                </li>
              )}
              {settings?.address && (
                <li className="flex items-start gap-3 text-muted-foreground">
                  <MapPin className="w-4 h-4 text-primary flex-shrink-0 mt-1" />
                  <span className="tracking-wide leading-relaxed">{settings.address}</span>
                </li>
              )}
            </ul>
          </div>

          {/* Social */}
          <div>
            <h4 className="font-display text-xl tracking-wider mb-6 text-foreground">Ikuti Kami</h4>
            <div className="flex flex-wrap gap-3">
              {settings?.instagram_link && (
                <a
                  href={settings.instagram_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 border border-border/50 rounded-lg hover:border-primary hover:bg-primary/10 transition-all group"
                  aria-label="Instagram"
                >
                  <Instagram className="w-5 h-5 text-muted-foreground group-hover:text-primary" />
                </a>
              )}
              {settings?.facebook_link && (
                <a
                  href={settings.facebook_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 border border-border/50 rounded-lg hover:border-primary hover:bg-primary/10 transition-all group"
                  aria-label="Facebook"
                >
                  <Facebook className="w-5 h-5 text-muted-foreground group-hover:text-primary" />
                </a>
              )}
              {settings?.youtube_link && (
                <a
                  href={settings.youtube_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 border border-border/50 rounded-lg hover:border-primary hover:bg-primary/10 transition-all group"
                  aria-label="YouTube"
                >
                  <Youtube className="w-5 h-5 text-muted-foreground group-hover:text-primary" />
                </a>
              )}
              {settings?.tiktok_link && (
                <a
                  href={settings.tiktok_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 border border-border/50 rounded-lg hover:border-primary hover:bg-primary/10 transition-all group"
                  aria-label="TikTok"
                >
                  <TikTokIcon className="w-5 h-5 text-muted-foreground group-hover:text-primary" />
                </a>
              )}
              {settings?.whatsapp_link && (
                <a
                  href={settings.whatsapp_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 border border-border/50 rounded-lg hover:border-primary hover:bg-primary/10 transition-all group"
                  aria-label="WhatsApp"
                >
                  <svg className="w-5 h-5 text-muted-foreground group-hover:text-primary" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-border/30 text-center">
          <p className="text-muted-foreground tracking-wider text-sm">
            © {new Date().getFullYear()} {settings?.site_name || "Kediaman"}. Hak Cipta Dilindungi.
          </p>
        </div>
      </div>
    </footer>
  );
}
