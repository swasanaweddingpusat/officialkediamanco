// Kediaman Rewards (loyalty & referral). Data member/poin hanya lewat endpoint /functions/v1/loyalty/*;
// katalog hadiah & pengaturan dibaca publik dari tabel loyalty_rewards / loyalty_settings.
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface LoyaltySettings {
  program_name: string;
  is_enabled: boolean;
  referral_points: number;
  booking_points: number;
  referee_benefit: string | null;
  terms: string | null;
}
export interface LoyaltyReward {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  points_cost: number;
  stock: number | null;
  terms: string | null;
  is_active: boolean;
  sort_order: number;
}
export interface LoyaltyMe {
  member: { id: string; full_name: string; phone: string; referral_code: string; created_at: string } | null;
  settings: LoyaltySettings | null;
  balance?: number;
  ledger?: { id: string; points: number; type: string; description: string | null; created_at: string }[];
  redemptions?: { id: string; reward_name: string; points_cost: number; status: string; created_at: string }[];
  stats?: { referred: number; confirmed: number };
}

const API_URL = String(import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');

export { captureReferralFromUrl, getStoredReferral, clearStoredReferral } from '@/lib/referral';

/** Validasi kode referral (hanya valid/tidak). */
export function useReferralValid(code: string | null) {
  return useQuery({
    queryKey: ['loyalty-ref', code],
    enabled: !!code,
    staleTime: 10 * 60_000,
    queryFn: async () => {
      const res = await fetch(`${API_URL}/functions/v1/loyalty/ref/${encodeURIComponent(code ?? '')}`);
      if (!res.ok) return false;
      return Boolean(((await res.json()) as { valid?: boolean }).valid);
    },
  });
}

// ---------------------------------------------------------------- publik
export function useLoyaltySettings() {
  return useQuery({
    queryKey: ['loyalty-settings'],
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.from('loyalty_settings').select('*').eq('id', 1).maybeSingle();
      if (error) throw error;
      return data as (LoyaltySettings & { id: number }) | null;
    },
  });
}

export function useLoyaltyRewards() {
  return useQuery({
    queryKey: ['loyalty-rewards'],
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.from('loyalty_rewards').select('*').order('sort_order', { ascending: true }).limit(200);
      if (error) throw error;
      return (data ?? []) as LoyaltyReward[];
    },
  });
}

// ---------------------------------------------------------------- member (login)
export function useLoyaltyMe(enabled: boolean) {
  return useQuery({
    queryKey: ['loyalty-me'],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('loyalty/me', { method: 'GET' });
      if (error) throw error;
      return data as LoyaltyMe;
    },
  });
}

export function useJoinLoyalty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: { full_name: string; phone: string; ref?: string | null }) => {
      const { error } = await supabase.functions.invoke('loyalty/join', { body });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['loyalty-me'] }),
  });
}

export function useRedeemReward() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (rewardId: string) => {
      const { data, error } = await supabase.functions.invoke('loyalty/redeem', { body: { reward_id: rewardId } });
      if (error) throw error;
      return data as { ok: boolean; balance: number };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['loyalty-me'] });
      qc.invalidateQueries({ queryKey: ['loyalty-rewards'] });
    },
  });
}

export const LEDGER_LABEL: Record<string, string> = {
  referral: 'Referral', booking: 'Booking', redeem: 'Tukar hadiah', refund: 'Pengembalian', adjust: 'Penyesuaian',
};
export const REDEMPTION_STATUS: Record<string, { label: string; tone: string }> = {
  pending: { label: 'Diproses', tone: 'ota-badge' },
  approved: { label: 'Disetujui', tone: 'ota-pill-ok' },
  fulfilled: { label: 'Sudah diterima', tone: 'ota-pill-ok' },
  rejected: { label: 'Ditolak (poin kembali)', tone: 'ota-pill-full' },
};
export const formatPoints = (n: number) => `${n.toLocaleString('id-ID')} poin`;
