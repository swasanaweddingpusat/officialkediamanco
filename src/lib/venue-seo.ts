// Judul & deskripsi Google untuk halaman venue. Dipakai di halaman (useSEO) DAN di pre-render
// (scripts/prerender-meta.ts) supaya yang dibaca Google sama persis. Tanpa import alias "@/".
export type VenueSeoInput = {
  name: string;
  category?: string | null;       // area, mis. "Jakarta Selatan"
  capacity?: string | null;       // ballroom_layout_capacity, mis. "1.000 pax"
  minPrice?: number | null;       // harga paket termurah (Rp)
  hasVideo?: boolean;
  has360?: boolean;
};

const clean = (v: unknown, max = 200) => String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, max);

/** 58500000 → "Rp58,5 juta", 1250000000 → "Rp1,25 miliar". */
export function rupiahShort(n: number): string {
  const fmt = (v: number) => v.toLocaleString('id-ID', { maximumFractionDigits: 2 });
  if (n >= 1e9) return `Rp${fmt(n / 1e9)} miliar`;
  if (n >= 1e6) return `Rp${fmt(n / 1e6)} juta`;
  return `Rp${n.toLocaleString('id-ID')}`;
}

/** Kapasitas "1000" / "1.000 pax" / "800 - 1.200 orang" → "1.000 tamu" (bila bisa dibaca). */
export function capacityText(raw?: string | null): string {
  const v = clean(raw, 60);
  if (!v) return '';
  if (/^\d[\d.]*$/.test(v)) return `${Number(v.replace(/\./g, '')).toLocaleString('id-ID')} tamu`;
  return v.replace(/\b(pax|orang|people|guests?)\b/i, 'tamu');
}

export function venueSeoTitle({ name, category }: VenueSeoInput): string {
  const n = clean(name, 70);
  const area = clean(category, 30);
  const candidates = [
    `${n}${area ? ` ${area}` : ''}: Harga Paket & Jadwal | Kediaman`,
    `${n}: Harga Paket & Jadwal | Kediaman`,
    `${n}: Harga & Jadwal | Kediaman`,
    `${n} | Kediaman`,
  ];
  return candidates.find((t) => t.length <= 65) ?? candidates[candidates.length - 1];
}

export function venueSeoDescription(v: VenueSeoInput): string {
  const n = clean(v.name, 70);
  const area = clean(v.category, 30);
  const facts = [
    v.minPrice ? `paket mulai ${rupiahShort(v.minPrice)}` : '',
    capacityText(v.capacity) ? `kapasitas ${capacityText(v.capacity)}` : '',
  ].filter(Boolean);
  const media = v.hasVideo && v.has360 ? 'foto, video & tur 360°' : v.has360 ? 'foto & tur 360°' : v.hasVideo ? 'foto & video' : 'foto';
  const where = area ? ` di ${area}` : '';
  const lead = facts.length ? `${n}${where}: ${facts.join(' · ')}.` : `${n}, venue pernikahan & acara${where}.`;
  const tails = [
    ` Cek tanggal kosong, lihat ${media}, lalu booking gratis tanpa komitmen.`,
    ` Cek jadwal, lihat ${media}, lalu booking gratis.`,
    ' Cek jadwal & booking gratis.',
  ];
  const full = lead + (tails.find((t) => (lead + t).length <= 160) ?? tails[tails.length - 1]);
  return full.length <= 160 ? full : `${full.slice(0, 157).trimEnd()}…`;
}
