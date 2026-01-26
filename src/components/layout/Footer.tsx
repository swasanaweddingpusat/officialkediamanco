import { Link } from "react-router-dom";
import { Dumbbell, Instagram, Facebook, Phone, Mail, MapPin } from "lucide-react";
import { useSiteSettings } from "@/hooks/useCMS";

export function Footer() {
  const { data: settings } = useSiteSettings();

  return (
    <footer className="bg-card border-t border-border">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="p-2 bg-primary rounded-lg">
                <Dumbbell className="w-6 h-6 text-primary-foreground" />
              </div>
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
                  Packages
                </Link>
              </li>
              <li>
                <Link to="/trainers" className="text-muted-foreground hover:text-primary transition-colors">
                  Our Team
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
                <li className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="w-4 h-4 text-primary" />
                  {settings.address}
                </li>
              )}
            </ul>
          </div>

          {/* Social */}
          <div>
            <h4 className="font-display text-xl mb-4">Follow Us</h4>
            <div className="flex gap-4">
              {settings?.instagram_link && (
                <a
                  href={settings.instagram_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 bg-secondary rounded-lg hover:bg-primary transition-colors group"
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
                >
                  <Facebook className="w-5 h-5 group-hover:text-primary-foreground" />
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
