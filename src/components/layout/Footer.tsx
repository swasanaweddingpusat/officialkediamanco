import { CMSImage } from '@/components/CMSImage';
import { Link } from 'react-router-dom';
import { Instagram, Facebook, Youtube } from 'lucide-react';
import { useSiteSettings } from '@/hooks/useCMS';

const TikTokIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
  </svg>
);

const columns = [
  {
    title: 'Venue & Paket',
    links: [
      { name: 'Semua venue', href: '/lokasi' },
      { name: 'Paket & harga', href: '/harga' },
      { name: 'Promo', href: '/promo' },
      { name: 'Cek status booking', href: '/booking/track' },
    ],
  },
  {
    title: 'Inspirasi',
    links: [
      { name: 'Portfolio', href: '/portfolio' },
      { name: 'Ulasan pasangan', href: '/ulasan' },
      { name: 'Artikel', href: '/artikel' },
    ],
  },
  {
    title: 'Kediaman',
    links: [
      { name: 'Tentang kami', href: '/tentang-kami' },
      { name: 'Bantuan / FAQ', href: '/bantuan' },
    ],
  },
];

export function Footer() {
  const { data: settings } = useSiteSettings();
  const socialLinks = [
    { icon: Instagram, url: settings?.instagram_link, label: 'Instagram' },
    { icon: Facebook, url: settings?.facebook_link, label: 'Facebook' },
    { icon: Youtube, url: settings?.youtube_link, label: 'YouTube' },
    { icon: TikTokIcon, url: settings?.tiktok_link, label: 'TikTok' },
  ].filter((s) => s.url);

  return (
    <footer className="mt-16 bg-primary text-primary-foreground">
      <div className="ota-container py-12 grid gap-10 md:grid-cols-[1.3fr_repeat(3,1fr)]">
        <div className="space-y-4">
          <Link to="/" className="flex items-center gap-2.5">
            {settings?.logo_url && <CMSImage src={settings.logo_url} imageWidth={96} sizes="44px" width={320} height={295} alt="" className="h-10 w-auto" />}
            <span className="text-xl font-extrabold">Kediaman</span>
          </Link>
          {settings?.tagline && <p className="text-sm text-primary-foreground/80 max-w-xs">{settings.tagline}</p>}
          {settings?.address && <p className="text-xs text-primary-foreground/70 max-w-xs">{settings.address}</p>}
          <div className="space-y-1 text-sm">
            {settings?.email && <a href={`mailto:${settings.email}`} className="block text-primary-foreground/90 hover:text-primary-foreground">{settings.email}</a>}
            {settings?.phone && <a href={`tel:${settings.phone}`} className="block text-primary-foreground/90 hover:text-primary-foreground">{settings.phone}</a>}
          </div>
          {socialLinks.length > 0 && (
            <div className="flex gap-3 pt-1">
              {socialLinks.map((s) => (
                <a key={s.label} href={s.url || undefined} target="_blank" rel="noopener noreferrer" aria-label={s.label} className="size-10 rounded-full bg-primary-foreground/10 flex items-center justify-center hover:bg-primary-foreground/20">
                  <s.icon className="size-4" />
                </a>
              ))}
            </div>
          )}
        </div>
        {columns.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <h2 className="text-sm font-bold mb-3">{col.title}</h2>
            <ul className="space-y-2 text-sm">
              {col.links.map((l) => (
                <li key={l.href}><Link to={l.href} className="text-primary-foreground/80 hover:text-primary-foreground">{l.name}</Link></li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-primary-foreground/15">
        <p className="ota-container py-5 text-xs text-primary-foreground/70">© {new Date().getFullYear()} {settings?.site_name || 'Kediaman Corp'} · The Best Choice Venue Operator</p>
      </div>
    </footer>
  );
}
