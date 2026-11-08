// /karir/:slug — detail lowongan + form lamaran (CV disimpan privat, hanya admin yang bisa unduh).
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { MapPin, Briefcase, Clock, CalendarClock, Wallet, Check, Upload, FileText, Loader2, CheckCircle2, Share2, ArrowLeft, X } from 'lucide-react';
import { toast } from 'sonner';
import { Layout } from '@/components/layout/Layout';
import { Breadcrumbs } from '@/components/ota/OtaKit';
import { Skeleton } from '@/components/ui/skeleton';
import { useSEO } from '@/hooks/useSEO';
import { useSiteSettings } from '@/hooks/useCMS';
import { useJob, useJobs, useApplyJob, jobOpen, salaryText, type Job } from '@/hooks/useCareers';
import { JobCard, deadlineText } from '@/pages/Careers';
import { track } from '@/lib/analytics';
import NotFound from '@/pages/NotFound';

const field = 'mt-1.5 h-11 w-full rounded-xl border border-input bg-card px-3.5 text-sm outline-none focus:ring-2 focus:ring-ring';
const CV_MAX = 5 * 1024 * 1024;

/** Data terstruktur JobPosting agar lowongan bisa tampil di Google Jobs. */
function useJobPostingJsonLd(job: Job | null | undefined, orgName: string, logo?: string | null) {
  useEffect(() => {
    if (!job || !jobOpen(job)) return;
    const typeMap: Record<string, string> = { 'Full-time': 'FULL_TIME', 'Part-time': 'PART_TIME', Kontrak: 'CONTRACTOR', Magang: 'INTERN', Freelance: 'OTHER' };
    const data: Record<string, unknown> = {
      '@context': 'https://schema.org',
      '@type': 'JobPosting',
      title: job.title,
      description: [job.summary, job.description, job.responsibilities.length ? `Tanggung jawab: ${job.responsibilities.join('; ')}` : '', job.requirements.length ? `Kualifikasi: ${job.requirements.join('; ')}` : ''].filter(Boolean).join('\n\n'),
      datePosted: job.created_at.slice(0, 10),
      employmentType: typeMap[job.employment_type] ?? 'OTHER',
      hiringOrganization: { '@type': 'Organization', name: orgName, sameAs: 'https://kediaman.co', ...(logo ? { logo } : {}) },
      jobLocation: { '@type': 'Place', address: { '@type': 'PostalAddress', addressLocality: job.location_text || 'Jakarta', addressCountry: 'ID' } },
      directApply: true,
    };
    if (job.deadline) data.validThrough = `${job.deadline}T23:59:59+07:00`;
    if (job.work_mode === 'Remote') data.jobLocationType = 'TELECOMMUTE';
    if (job.show_salary && (job.salary_min || job.salary_max)) {
      data.baseSalary = { '@type': 'MonetaryAmount', currency: 'IDR', value: { '@type': 'QuantitativeValue', minValue: job.salary_min ?? job.salary_max, maxValue: job.salary_max ?? job.salary_min, unitText: 'MONTH' } };
    }
    const el = document.createElement('script');
    el.type = 'application/ld+json';
    el.dataset.kdm = 'job-posting';
    el.textContent = JSON.stringify(data);
    document.head.appendChild(el);
    return () => { el.remove(); };
  }, [job, orgName, logo]);
}

function ApplyForm({ job }: { job: Job }) {
  const apply = useApplyJob();
  const fileRef = useRef<HTMLInputElement>(null);
  const [cv, setCv] = useState<File | null>(null);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [f, setF] = useState({ full_name: '', email: '', phone: '', domicile: '', linkedin_url: '', portfolio_url: '', expected_salary: '', available_from: '', cover_letter: '', website: '' });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });

  const pickFile = (file: File | null) => {
    setError('');
    if (!file) return;
    if (file.size > CV_MAX) { setError('Ukuran CV maksimal 5 MB.'); return; }
    if (!/\.(pdf|docx?)$/i.test(file.name)) { setError('CV harus berformat PDF atau Word (.doc/.docx).'); return; }
    setCv(file);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    const digits = f.phone.replace(/\D/g, '');
    if (f.full_name.trim().length < 2) return setError('Isi nama lengkap Anda.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) return setError('Email tidak valid.');
    if (digits.length < 8 || digits.length > 15) return setError('Nomor HP/WhatsApp 8–15 digit.');
    for (const u of [f.linkedin_url, f.portfolio_url]) if (u.trim() && !/^https?:\/\//i.test(u.trim())) return setError('Tautan LinkedIn/portofolio harus diawali https://');
    if (!cv) return setError('Lampirkan CV Anda (PDF/Word, maks 5 MB).');
    const fd = new FormData();
    fd.set('job_id', job.id);
    Object.entries(f).forEach(([k, v]) => fd.set(k, String(v).trim()));
    fd.set('cv', cv);
    try {
      await apply.mutateAsync(fd);
      track('job_apply', { job_title: job.title });
      setDone(true);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  if (done) {
    return (
      <div className="ota-card p-6 text-center" role="status">
        <CheckCircle2 className="size-12 mx-auto text-primary" aria-hidden="true" />
        <h3 className="mt-3 text-xl font-extrabold">Lamaran terkirim!</h3>
        <p className="mt-1 text-sm text-muted-foreground">Terima kasih, {f.full_name.split(' ')[0]}. Tim HR kami akan meninjau berkas Anda dan menghubungi lewat email atau WhatsApp bila Anda lolos ke tahap berikutnya.</p>
        <Link to="/karir" className="mt-5 inline-flex h-11 items-center rounded-xl border border-input px-5 text-sm font-bold hover:bg-muted">Lihat lowongan lain</Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="ota-card p-5 md:p-6 space-y-4" noValidate>
      <div>
        <h2 className="text-xl font-extrabold">Lamar posisi ini</h2>
        <p className="text-sm text-muted-foreground">Isi data berikut dan lampirkan CV terbaru Anda.</p>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2"><label htmlFor="ap-name" className="text-sm font-bold">Nama lengkap *</label><input id="ap-name" autoComplete="name" value={f.full_name} onChange={set('full_name')} className={field} /></div>
        <div><label htmlFor="ap-email" className="text-sm font-bold">Email *</label><input id="ap-email" type="email" autoComplete="email" value={f.email} onChange={set('email')} className={field} /></div>
        <div><label htmlFor="ap-phone" className="text-sm font-bold">No. HP / WhatsApp *</label><input id="ap-phone" type="tel" inputMode="tel" autoComplete="tel" value={f.phone} onChange={set('phone')} placeholder="08xxxxxxxxxx" className={field} /></div>
        <div><label htmlFor="ap-dom" className="text-sm font-bold">Domisili</label><input id="ap-dom" value={f.domicile} onChange={set('domicile')} placeholder="mis. Jakarta Selatan" className={field} /></div>
        <div><label htmlFor="ap-avail" className="text-sm font-bold">Bisa mulai kerja</label><input id="ap-avail" value={f.available_from} onChange={set('available_from')} placeholder="mis. Segera / 1 bulan lagi" className={field} /></div>
        <div><label htmlFor="ap-li" className="text-sm font-bold">LinkedIn</label><input id="ap-li" type="url" value={f.linkedin_url} onChange={set('linkedin_url')} placeholder="https://linkedin.com/in/…" className={field} /></div>
        <div><label htmlFor="ap-pf" className="text-sm font-bold">Portofolio</label><input id="ap-pf" type="url" value={f.portfolio_url} onChange={set('portfolio_url')} placeholder="https://…" className={field} /></div>
        <div className="sm:col-span-2"><label htmlFor="ap-sal" className="text-sm font-bold">Ekspektasi gaji</label><input id="ap-sal" value={f.expected_salary} onChange={set('expected_salary')} placeholder="mis. Rp6.000.000 / bulan" className={field} /></div>
      </div>

      <div>
        <p className="text-sm font-bold">CV *</p>
        <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" className="hidden" onChange={(e) => pickFile(e.target.files?.[0] ?? null)} />
        {cv ? (
          <div className="mt-1.5 flex items-center gap-3 rounded-xl border border-input bg-secondary/40 p-3">
            <FileText className="size-5 text-primary shrink-0" aria-hidden="true" />
            <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{cv.name}</p><p className="text-xs text-muted-foreground">{(cv.size / 1024 / 1024).toFixed(2)} MB</p></div>
            <button type="button" onClick={() => { setCv(null); if (fileRef.current) fileRef.current.value = ''; }} className="grid place-items-center size-8 rounded-lg hover:bg-muted" aria-label="Hapus CV"><X className="size-4" /></button>
          </div>
        ) : (
          <button type="button" onClick={() => fileRef.current?.click()}
            onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); pickFile(e.dataTransfer.files?.[0] ?? null); }}
            className="mt-1.5 flex w-full flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-input bg-card p-6 text-center hover:border-primary/50 hover:bg-secondary/30">
            <Upload className="size-6 text-primary" aria-hidden="true" />
            <span className="text-sm font-bold">Pilih atau seret CV ke sini</span>
            <span className="text-xs text-muted-foreground">PDF atau Word, maksimal 5 MB</span>
          </button>
        )}
      </div>

      <div>
        <label htmlFor="ap-cover" className="text-sm font-bold">Ceritakan singkat tentang diri Anda</label>
        <textarea id="ap-cover" rows={5} value={f.cover_letter} onChange={set('cover_letter')} maxLength={4000} placeholder="Pengalaman yang relevan dan alasan Anda tertarik dengan posisi ini…" className="mt-1.5 w-full rounded-xl border border-input bg-card px-3.5 py-3 text-sm outline-none focus:ring-2 focus:ring-ring resize-y" />
      </div>
      <input type="text" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" value={f.website} onChange={set('website')} />

      {error && <p className="text-sm font-semibold text-destructive" role="alert">{error}</p>}
      <button type="submit" disabled={apply.isPending} className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-extrabold text-sm inline-flex items-center justify-center gap-2 disabled:opacity-70">
        {apply.isPending && <Loader2 className="size-4 animate-spin" />}Kirim lamaran
      </button>
      <p className="text-center text-xs text-muted-foreground">Data dan CV Anda hanya dipakai untuk proses rekrutmen Kediaman dan tidak dibagikan ke pihak lain.</p>
    </form>
  );
}

const List = ({ title, items }: { title: string; items: string[] }) =>
  items.length ? (
    <section>
      <h2 className="text-lg font-extrabold mb-3">{title}</h2>
      <ul className="space-y-2.5">
        {items.map((it, i) => (
          <li key={i} className="flex gap-3">
            <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-secondary text-primary"><Check className="size-3" strokeWidth={3} aria-hidden="true" /></span>
            <span className="leading-relaxed">{it}</span>
          </li>
        ))}
      </ul>
    </section>
  ) : null;

const CareerDetail = () => {
  const { slug } = useParams();
  const { data: job, isLoading } = useJob(slug);
  const { data: jobs = [] } = useJobs();
  const { data: settings } = useSiteSettings();
  const siteName = settings?.site_name || 'Kediaman';

  useSEO({
    title: job ? `Lowongan ${job.title}${job.location_text ? ` di ${job.location_text}` : ''} | ${siteName}` : `Karier | ${siteName}`,
    description: job?.summary || (job ? `Lowongan kerja ${job.title} di ${siteName}. ${job.employment_type}, ${job.work_mode}.` : undefined),
    url: `https://kediaman.co/karir/${slug ?? ''}`,
    breadcrumbs: [{ name: 'Home', url: 'https://kediaman.co/' }, { name: 'Karier', url: 'https://kediaman.co/karir' }, ...(job ? [{ name: job.title, url: `https://kediaman.co/karir/${job.slug}` }] : [])],
  });
  useJobPostingJsonLd(job, siteName, settings?.logo_url);

  if (isLoading) return <Layout><div className="ota-container py-10 space-y-4"><Skeleton className="h-10 w-2/3" /><Skeleton className="h-64 rounded-2xl" /></div></Layout>;
  if (!job) return <NotFound />;

  const open = jobOpen(job);
  const salary = salaryText(job);
  const others = jobs.filter((j) => j.id !== job.id && jobOpen(j)).slice(0, 4);
  const share = async () => {
    const url = `${window.location.origin}/karir/${job.slug}`;
    try {
      if (navigator.share) await navigator.share({ title: job.title, url });
      else { await navigator.clipboard.writeText(url); toast.success('Link lowongan disalin'); }
    } catch { /* dibatalkan */ }
  };
  const facts = [
    job.location_text && { icon: MapPin, label: 'Lokasi', value: job.location_text },
    { icon: Briefcase, label: 'Tipe', value: `${job.employment_type} · ${job.work_mode}` },
    job.experience_level && { icon: Clock, label: 'Pengalaman', value: job.experience_level },
    salary && { icon: Wallet, label: 'Gaji', value: salary },
    job.deadline && { icon: CalendarClock, label: 'Batas lamaran', value: deadlineText(job.deadline)!.replace('Lamar s.d. ', '') },
  ].filter(Boolean) as { icon: typeof MapPin; label: string; value: string }[];

  return (
    <Layout>
      <section className="bg-card border-b border-border">
        <div className="ota-container py-6 md:py-10">
          <Breadcrumbs items={[{ name: 'Karier', href: '/karir' }, { name: job.title }]} className="mb-5" />
          {job.department && <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{job.department}</p>}
          <h1 className="mt-1 text-3xl md:text-4xl font-extrabold tracking-tight">{job.title}</h1>
          <div className="mt-4 flex flex-wrap gap-2">
            {facts.map((f) => (
              <span key={f.label} className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-xs font-bold text-primary"><f.icon className="size-3.5" aria-hidden="true" />{f.value}</span>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {open && <a href="#lamar" className="inline-flex h-11 items-center rounded-xl bg-primary px-6 text-sm font-extrabold text-primary-foreground">Lamar sekarang</a>}
            <button type="button" onClick={share} className="inline-flex h-11 items-center gap-2 rounded-xl border border-input px-4 text-sm font-bold hover:bg-muted"><Share2 className="size-4" />Bagikan</button>
          </div>
        </div>
      </section>

      <div className="ota-container py-8 md:py-12 grid lg:grid-cols-5 gap-8 items-start">
        <article className="lg:col-span-3 space-y-8">
          {job.summary && <p className="text-lg leading-relaxed">{job.summary}</p>}
          {job.description && <section><h2 className="text-lg font-extrabold mb-3">Tentang peran ini</h2><p className="leading-relaxed whitespace-pre-line text-muted-foreground">{job.description}</p></section>}
          <List title="Tanggung jawab" items={job.responsibilities} />
          <List title="Kualifikasi" items={job.requirements} />
          <List title="Yang Anda dapatkan" items={job.benefits} />
          <Link to="/karir" className="inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:underline"><ArrowLeft className="size-4" />Semua lowongan</Link>
        </article>

        <aside id="lamar" className="lg:col-span-2 lg:sticky lg:top-32 scroll-mt-32">
          {open ? <ApplyForm job={job} /> : (
            <div className="ota-card p-6 text-center">
              <p className="text-lg font-extrabold">Lowongan ini sudah ditutup</p>
              <p className="mt-1 text-sm text-muted-foreground">Terima kasih atas minat Anda. Lihat posisi lain yang masih dibuka.</p>
              <Link to="/karir" className="mt-4 inline-flex h-11 items-center rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground">Lowongan lain</Link>
            </div>
          )}
        </aside>
      </div>

      {others.length > 0 && (
        <section className="ota-container pb-12">
          <h2 className="text-xl font-extrabold mb-4">Lowongan lainnya</h2>
          <div className="grid md:grid-cols-2 gap-4">{others.map((j) => <JobCard key={j.id} job={j} />)}</div>
        </section>
      )}
    </Layout>
  );
};

export default CareerDetail;
