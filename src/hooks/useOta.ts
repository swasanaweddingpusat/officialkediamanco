// Data untuk fitur baru desain OTA: paket & harga per venue, FAQ, ulasan pasangan.
// Tabel dibuat oleh backend (venue_packages, faqs, venue_reviews). Publik hanya membaca
// baris aktif/terbit; admin mengelola semuanya lewat CMS.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export interface VenuePackage {
  id: string;
  location_id: string | null;
  name: string;
  description: string | null;
  inclusions: string[];
  price: number | null;
  price_note: string | null;
  min_pax: number | null;
  max_pax: number | null;
  image_url: string | null;
  is_featured: boolean;
  sort_order: number;
  is_active: boolean;
  locations?: { name: string; slug: string | null; category: string | null } | null;
}

export interface Faq {
  id: string;
  category: string;
  question: string;
  answer: string;
  sort_order: number;
  is_active: boolean;
}

export interface VenueReview {
  id: string;
  location_id: string | null;
  reviewer_name: string;
  event_date: string | null;
  event_type: string | null;
  rating: number;
  title: string | null;
  body: string;
  photo_url: string | null;
  is_published: boolean;
  sort_order: number;
  created_at: string;
  locations?: { name: string; slug: string | null } | null;
}

type Row = Record<string, unknown>;

const asNumber = (v: unknown): number | null => (v === null || v === undefined || v === '' ? null : Number(v));

function normalizePackage(r: Row): VenuePackage {
  const inc = r.inclusions;
  return {
    ...(r as unknown as VenuePackage),
    price: asNumber(r.price),
    min_pax: asNumber(r.min_pax),
    max_pax: asNumber(r.max_pax),
    inclusions: Array.isArray(inc) ? (inc as unknown[]).map(String).filter(Boolean) : [],
  };
}

export const formatRupiah = (value: number | null | undefined, opts: { compact?: boolean } = {}) => {
  if (value === null || value === undefined || Number.isNaN(value)) return null;
  if (opts.compact && value >= 1_000_000) {
    const jt = value / 1_000_000;
    return `Rp${jt.toLocaleString('id-ID', { maximumFractionDigits: jt >= 100 ? 0 : 1 })} jt`;
  }
  return `Rp${Math.round(value).toLocaleString('id-ID')}`;
};

// ---------------------------------------------------------------- Paket
export function useVenuePackages(locationId?: string) {
  return useQuery({
    queryKey: ['venue-packages', locationId ?? 'all'],
    staleTime: 60_000,
    queryFn: async () => {
      let q = supabase.from('venue_packages').select('*, locations(name,slug,category)');
      if (locationId) q = q.eq('location_id', locationId);
      const { data, error } = await q.order('sort_order', { ascending: true }).limit(500);
      if (error) throw error;
      return ((data ?? []) as Row[]).map(normalizePackage);
    },
  });
}

/** Harga paket termurah per venue, untuk kartu "Paket mulai". */
export function useStartingPrices() {
  const { data = [], ...rest } = useVenuePackages();
  const map: Record<string, number> = {};
  for (const p of data) {
    if (!p.location_id || p.price === null || !p.is_active) continue;
    if (map[p.location_id] === undefined || p.price < map[p.location_id]) map[p.location_id] = p.price;
  }
  return { data: map, packages: data, ...rest };
}

// ---------------------------------------------------------------- FAQ
export function useFaqs() {
  return useQuery({
    queryKey: ['faqs'],
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.from('faqs').select('*').order('sort_order', { ascending: true }).limit(500);
      if (error) throw error;
      return (data ?? []) as Faq[];
    },
  });
}

// ---------------------------------------------------------------- Ulasan
export function useVenueReviews(locationId?: string) {
  return useQuery({
    queryKey: ['venue-reviews', locationId ?? 'all'],
    staleTime: 60_000,
    queryFn: async () => {
      let q = supabase.from('venue_reviews').select('*, locations(name,slug)');
      if (locationId) q = q.eq('location_id', locationId);
      const { data, error } = await q.order('sort_order', { ascending: true }).order('created_at', { ascending: false }).limit(500);
      if (error) throw error;
      return ((data ?? []) as Row[]).map((r) => ({ ...(r as unknown as VenueReview), rating: Number(r.rating) || 0 }));
    },
  });
}

export function summarizeReviews(reviews: VenueReview[]) {
  const published = reviews.filter((r) => r.is_published !== false);
  const count = published.length;
  const average = count ? published.reduce((s, r) => s + r.rating, 0) / count : 0;
  const byStar = [5, 4, 3, 2, 1].map((star) => ({ star, count: published.filter((r) => r.rating === star).length }));
  return { count, average, byStar };
}

// ---------------------------------------------------------------- CRUD admin (generik)
type TableName = 'venue_packages' | 'faqs' | 'venue_reviews';
const KEYS: Record<TableName, string> = { venue_packages: 'venue-packages', faqs: 'faqs', venue_reviews: 'venue-reviews' };

export function useSaveRow(table: TableName, label: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...values }: { id?: string } & Row) => {
      const res = id
        ? await supabase.from(table).update(values).eq('id', id)
        : await supabase.from(table).insert(values);
      if (res.error) throw res.error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEYS[table]] });
      toast.success(`${label} tersimpan`);
    },
    onError: (e: unknown) => toast.error(`Gagal menyimpan ${label.toLowerCase()}: ${(e as Error)?.message ?? ''}`),
  });
}

export function useDeleteRow(table: TableName, label: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEYS[table]] });
      toast.success(`${label} dihapus`);
    },
    onError: () => toast.error(`Gagal menghapus ${label.toLowerCase()}`),
  });
}
