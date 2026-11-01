// Kode referral dari link ?ref=KODE disimpan 60 hari di browser pengunjung, lalu ikut terkirim saat booking.
const REF_KEY = 'kdm_ref';
const REF_TTL = 60 * 24 * 60 * 60 * 1000; // 60 hari

export function captureReferralFromUrl(): void {
  try {
    const code = new URLSearchParams(window.location.search).get('ref')?.trim().toUpperCase();
    if (code && /^[A-Z0-9]{6,12}$/.test(code)) localStorage.setItem(REF_KEY, JSON.stringify({ code, at: Date.now() }));
  } catch {
    // storage diblokir: abaikan
  }
}
export function getStoredReferral(): string | null {
  try {
    const raw = localStorage.getItem(REF_KEY);
    if (!raw) return null;
    const { code, at } = JSON.parse(raw) as { code?: string; at?: number };
    if (!code || !at || Date.now() - at > REF_TTL) { localStorage.removeItem(REF_KEY); return null; }
    return code;
  } catch {
    return null;
  }
}
export function clearStoredReferral(): void {
  try { localStorage.removeItem(REF_KEY); } catch { /* abaikan */ }
}

