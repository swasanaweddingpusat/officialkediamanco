import { Link } from "react-router-dom";
import { Dumbbell, Instagram, Facebook, Phone, Mail, MapPin, Youtube } from "lucide-react";
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
    <footer className="bg-card border-t border-border">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2">
              {settings?.logo_url ? (
                <img src={settings.logo_url} alt={settings?.site_name || "Logo"} className="h-10 w-auto" />
              ) : (
                <div className="p-2 bg-primary rounded-lg">
                  <Dumbbell className="w-6 h-6 text-primary-foreground" />
                </div>
              )}
              <span className="font-display text-2xl tracking-wider">{settings?.site_name || "KEDIAMAN CORP"}</span>
            </Link>
            <p className="text-muted-foreground">{settings?.tagline || "Get Strong Get Rewards"}</p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-display text-xl mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/classes" className="text-muted-foreground hover:text-primary transition-colors">
                  Special Offers
                </Link>
              </li>
              <li>
                <Link to="/trainers" className="text-muted-foreground hover:text-primary transition-colors">
                  Our Portfolio
                </Link>
              </li>
              <li>
                <Link to="/locations" className="text-muted-foreground hover:text-primary transition-colors">
                  Locations
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-display text-xl mb-4">Contact Us</h4>
            <ul className="space-y-3">
              {settings?.phone && (
                <li className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="w-4 h-4 text-primary" />
                  {settings.phone}
                </li>
              )}
              {settings?.email && (
                <li className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="w-4 h-4 text-primary" />
                  {settings.email}
                </li>
              )}
              {settings?.address && (
                <li className="flex items-start gap-2 text-muted-foreground">
                  <MapPin className="w-4 h-4 text-primary flex-shrink-0 mt-1" />
                  <span>{settings.address}</span>
                </li>
              )}
            </ul>
          </div>

          {/* Social */}
          <div>
            <h4 className="font-display text-xl mb-4">Follow Us</h4>
            <div className="flex flex-wrap gap-3">
              {settings?.instagram_link && (
                <a
                  href={settings.instagram_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 bg-secondary rounded-lg hover:bg-primary transition-colors group"
                  aria-label="Instagram"
                >
                  <Instagram className="w-5 h-5 group-hover:text-primary-foreground" />
                </a>
              )}
              {settings?.facebook_link && (
                <a
                  href={settings.facebook_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 bg-secondary rounded-lg hover:bg-primary transition-colors group"
                  aria-label="Facebook"
                >
                  <Facebook className="w-5 h-5 group-hover:text-primary-foreground" />
                </a>
              )}
              {settings?.youtube_link && (
                <a
                  href={settings.youtube_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 bg-secondary rounded-lg hover:bg-primary transition-colors group"
                  aria-label="YouTube"
                >
                  <Youtube className="w-5 h-5 group-hover:text-primary-foreground" />
                </a>
              )}
              {settings?.tiktok_link && (
                <a
                  href={settings.tiktok_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 bg-secondary rounded-lg hover:bg-primary transition-colors group"
                  aria-label="TikTok"
                >
                  <TikTokIcon className="w-5 h-5 group-hover:text-primary-foreground" />
                </a>
              )}
              {settings?.whatsapp_link && (
                <a
                  href={settings.whatsapp_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 bg-secondary rounded-lg hover:bg-primary transition-colors group"
                  aria-label="WhatsApp"
                >
                  <svg className="w-5 h-5 group-hover:text-primary-foreground" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border text-center text-muted-foreground">
          <p>
            © {new Date().getFullYear()} {settings?.site_name || "Power Gym"}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
