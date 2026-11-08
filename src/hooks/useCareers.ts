// Karier: lowongan (publik, tabel jobs) dan pelamar (admin, tabel job_applications).
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export interface Job {
  id: string;
  title: string;
  slug: string;
  department: string | null;
  location_text: string | null;
  employment_type: string;
  work_mode: string;
  experience_level: string | null;
  salary_min: number | null;
  salary_max: number | null;
  show_salary: boolean;
  summary: string | null;
  description: string | null;
  responsibilities: string[];
  requirements: string[];
  benefits: string[];
  deadline: string | null;
  is_active: boolean;
  is_featured: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface JobApplication {
  id: string;
  job_id: string | null;
  job_title: string;
  full_name: string;
  email: string;
  phone: string;
  domicile: string | null;
  linkedin_url: string | null;
  portfolio_url: string | null;
  expected_salary: string | null;
  available_from: string | null;
  cover_letter: string | null;
  has_cv: boolean;
  status: ApplicationStatus;
  rating: number | null;
  admin_notes: string | null;
  created_at: string;
}

export type ApplicationStatus = 'new' | 'review' | 'interview' | 'offer' | 'hired' | 'rejected';
export const APPLICATION_STATUS: Record<ApplicationStatus, { label: string; tone: string }> = {
  new: { label: 'Baru', tone: 'ota-badge' },
  review: { label: 'Ditinjau', tone: 'ota-badge' },
  interview: { label: 'Interview', tone: 'ota-pill-ok' },
  offer: { label: 'Penawaran', tone: 'ota-pill-ok' },
  hired: { label: 'Diterima', tone: 'ota-pill-ok' },
  rejected: { label: 'Tidak lanjut', tone: 'ota-pill-full' },
};

export const EMPLOYMENT_TYPES = ['Full-time', 'Part-time', 'Kontrak', 'Magang', 'Freelance'];
export const WORK_MODES = ['On-site', 'Hybrid', 'Remote'];

const API = String(import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');
const arr = (v: unknown): string[] => (Array.isArray(v) ? v.map(String).filter(Boolean) : []);
const normalize = (j: Record<string, unknown>): Job => ({
  ...(j as unknown as Job),
  responsibilities: arr(j.responsibilities),
  requirements: arr(j.requirements),
  benefits: arr(j.benefits),
  salary_min: j.salary_min == null ? null : Number(j.salary_min),
  salary_max: j.salary_max == null ? null : Number(j.salary_max),
});

export const jobOpen = (j: Pick<Job, 'is_active' | 'deadline'>) =>
  j.is_active && (!j.deadline || new Date(`${j.deadline}T23:59:59`) >= new Date());

export function salaryText(j: Pick<Job, 'show_salary' | 'salary_min' | 'salary_max'>): string | null {
  if (!j.show_salary || (!j.salary_min && !j.salary_max)) return null;
  const f = (n: number) => (n >= 1_000_000 ? `${(n / 1_000_000).toLocaleString('id-ID', { maximumFractionDigits: 1 })} jt` : n.toLocaleString('id-ID'));
  if (j.salary_min && j.salary_max) return `Rp${f(j.salary_min)} – ${f(j.salary_max)}/bulan`;
  return `Rp${f((j.salary_min || j.salary_max) as number)}/bulan`;
}

/** Semua lowongan. Publik hanya melihat yang aktif (dibatasi server); admin melihat semua. */
export function useJobs() {
  return useQuery({
    queryKey: ['jobs'],
    queryFn: async () => {
      const { data, error } = await supabase.from('jobs').select('*').order('is_featured', { ascending: false }).order('sort_order', { ascending: true }).order('created_at', { ascending: false }).limit(200);
      if (error) throw error;
      return ((data ?? []) as Record<string, unknown>[]).map(normalize);
    },
  });
}

export function useJob(slug: string | undefined) {
  return useQuery({
    queryKey: ['job', slug],
    enabled: !!slug,
    queryFn: async () => {
      const { data, error } = await supabase.from('jobs').select('*').eq('slug', slug).maybeSingle();
      if (error) throw error;
      return data ? normalize(data as Record<string, unknown>) : null;
    },
  });
}

export function useApplyJob() {
  return useMutation({
    mutationFn: async (form: FormData) => {
      const res = await fetch(`${API}/functions/v1/careers/apply`, { method: 'POST', body: form });
      const body = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok || !body.ok) throw new Error(body.error || 'Gagal mengirim lamaran, coba lagi.');
    },
  });
}

// ---------------------------------------------------------------- admin
export function useJobApplications() {
  return useQuery({
    queryKey: ['job-applications'],
    queryFn: async () => {
      const { data, error } = await supabase.from('job_applications').select('*').order('created_at', { ascending: false }).limit(2000);
      if (error) throw error;
      return (data ?? []) as JobApplication[];
    },
  });
}

export function useUpdateApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...values }: Partial<JobApplication> & { id: string }) => {
      const { error } = await supabase.from('job_applications').update(values).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['job-applications'] }); toast.success('Data pelamar diperbarui'); },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('job_applications').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['job-applications'] }); toast.success('Pelamar dihapus'); },
    onError: (e: Error) => toast.error(e.message),
  });
}

/** Unduh CV (endpoint khusus admin, butuh token login). */
export async function downloadCv(app: Pick<JobApplication, 'id' | 'full_name'>): Promise<void> {
  const { data } = await supabase.auth.getSession();
  const token = (data?.session as { access_token?: string } | null)?.access_token;
  const res = await fetch(`${API}/functions/v1/careers/cv/${app.id}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
  if (!res.ok) throw new Error(res.status === 404 ? 'CV tidak ditemukan' : 'Gagal mengunduh CV');
  const disposition = res.headers.get('content-disposition') ?? '';
  const name = disposition.match(/filename="([^"]+)"/)?.[1] ?? `CV ${app.full_name}`;
  const url = URL.createObjectURL(await res.blob());
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
