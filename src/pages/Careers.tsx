// /karir — daftar lowongan kerja Kediaman (CMS: Admin → Karier).
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, MapPin, Clock, Search, Sparkles, Users, HeartHandshake, TrendingUp, ArrowRight, CalendarClock } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Breadcrumbs, EmptyState } from '@/components/ota/OtaKit';
import { Skeleton } from '@/components/ui/skeleton';
import { useSEO } from '@/hooks/useSEO';
import { useSiteSettings } from '@/hooks/useCMS';
import { useJobs, jobOpen, salaryText, type Job } from '@/hooks/useCareers';
import { cn } from '@/lib/utils';

const PERKS = [
  { icon: Sparkles, title: 'Momen yang berarti', text: 'Setiap hari ikut mewujudkan hari bahagia ratusan pasangan dan acara penting klien.' },
  { icon: Users, title: 'Tim yang solid', text: 'Kerja bareng tim venue, sales, kreatif, dan operasional yang saling dukung.' },
  { icon: TrendingUp, title: 'Tumbuh bersama', text: 'Ruang belajar dan berkembang seiring bertambahnya venue Kediaman.' },
  { icon: HeartHandshake, title: 'Budaya melayani', text: 'Kami percaya pelayanan tulus adalah kunci acara yang berkesan.' },
];

export const deadlineText = (d: string | null) =>
  d ? `Lamar s.d. ${new Date(`${d}T00:00:00`).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}` : null;

export function JobCard({ job }: { job: Job }) {
  const salary = salaryText(job);
  return (
    <Link to={`/karir/${job.slug}`} className="group ota-card p-5 flex flex-col gap-3 hover:shadow-lg hover:-translate-y-0.5 transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {job.department && <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{job.department}</p>}
          <h3 className="mt-0.5 text-lg font-extrabold leading-snug group-hover:text-primary">{job.title}</h3>
        </div>
        {job.is_featured && <span className="ota-badge shrink-0">Prioritas</span>}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
        {job.location_text && <span className="inline-flex items-center gap-1.5"><MapPin className="size-4" aria-hidden="true" />{job.location_text}</span>}
        <span className="inline-flex items-center gap-1.5"><Briefcase className="size-4" aria-hidden="true" />{job.employment_type} · {job.work_mode}</span>
        {job.experience_level && <span className="inline-flex items-center gap-1.5"><Clock className="size-4" aria-hidden="true" />{job.experience_level}</span>}
      </div>
      {job.summary && <p className="text-sm text-muted-foreground line-clamp-2">{job.summary}</p>}
      <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border">
        <span className="text-sm font-bold text-primary">{salary ?? <span className="font-semibold text-muted-foreground">Gaji kompetitif</span>}</span>
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
          {deadlineText(job.deadline) && <><CalendarClock className="size-3.5" aria-hidden="true" />{deadlineText(job.deadline)}</>}
          <ArrowRight className="ml-1 size-4 text-primary transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
        </span>
      </div>
    </Link>
  );
}

const Careers = () => {
  const { data: jobs = [], isLoading } = useJobs();
  const { data: settings } = useSiteSettings();
  const siteName = settings?.site_name || 'Kediaman';
  const [dept, setDept] = useState('');
  const [type, setType] = useState('');
  const [q, setQ] = useState('');

  useSEO({
    title: `Karier & Lowongan Kerja | ${siteName}`,
    description: `Bergabung bersama tim ${siteName}: lowongan kerja di bidang venue, sales, operasional event, kreatif, dan lainnya.`,
    url: 'https://kediaman.co/karir',
    breadcrumbs: [{ name: 'Home', url: 'https://kediaman.co/' }, { name: 'Karier', url: 'https://kediaman.co/karir' }],
  });

  const open = useMemo(() => jobs.filter(jobOpen), [jobs]);
  const departments = useMemo(() => [...new Set(open.map((j) => j.department).filter(Boolean))] as string[], [open]);
  const types = useMemo(() => [...new Set(open.map((j) => j.employment_type))], [open]);
  const filtered = open.filter((j) => {
    const t = q.trim().toLowerCase();
    return (!dept || j.department === dept) && (!type || j.employment_type === type)
      && (!t || `${j.title} ${j.department ?? ''} ${j.location_text ?? ''} ${j.summary ?? ''}`.toLowerCase().includes(t));
  });

  return (
    <Layout>
      <section className="relative overflow-hidden bg-primary text-primary-foreground">
        <div className="pointer-events-none absolute -right-24 -top-24 size-96 rounded-full bg-gold/20 blur-3xl" aria-hidden="true" />
        <div className="ota-container relative py-8 md:py-14">
          <Breadcrumbs items={[{ name: 'Karier' }]} className="mb-6 [&_a]:text-primary-foreground/70 [&_[aria-current]]:text-primary-foreground text-primary-foreground/70" />
          <p className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wide"><Briefcase className="size-3.5" />Karier di {siteName}</p>
          <h1 className="mt-4 text-3xl md:text-5xl font-extrabold tracking-tight leading-[1.1] max-w-2xl">Bantu kami menghadirkan hari terbaik untuk banyak orang</h1>
          <p className="mt-4 max-w-xl text-primary-foreground/80">Kami mencari orang-orang yang suka melayani, teliti, dan senang bekerja dalam tim untuk mengelola venue dan acara.</p>
          <a href="#lowongan" className="mt-6 inline-flex h-12 items-center gap-2 rounded-xl bg-gold px-6 text-sm font-extrabold text-primary hover:brightness-105">
            Lihat {open.length ? `${open.length} lowongan` : 'lowongan'}<ArrowRight className="size-4" />
          </a>
        </div>
      </section>

      <div className="ota-container py-10 md:py-14 space-y-12">
        <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {PERKS.map((p) => (
            <div key={p.title} className="ota-card p-5">
              <span className="grid place-items-center size-11 rounded-xl bg-secondary text-primary"><p.icon className="size-5" aria-hidden="true" /></span>
              <h2 className="mt-3 font-extrabold">{p.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{p.text}</p>
            </div>
          ))}
        </section>

        <section id="lowongan" className="scroll-mt-32">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-5">
            <div>
              <h2 className="text-2xl font-extrabold">Lowongan terbuka</h2>
              <p className="text-sm text-muted-foreground">{filtered.length} posisi{dept || type || q ? ' sesuai filter' : ''}</p>
            </div>
            <label className="flex items-center gap-2 h-11 px-3.5 rounded-full bg-card border border-input md:w-80">
              <Search className="size-4 text-muted-foreground" aria-hidden="true" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari posisi atau lokasi" aria-label="Cari lowongan" className="bg-transparent outline-none text-sm w-full" />
            </label>
          </div>
          {(departments.length > 1 || types.length > 1) && (
            <div className="ota-scroll-x mb-5">
              <button type="button" className="ota-chip" aria-pressed={!dept && !type} onClick={() => { setDept(''); setType(''); }}>Semua</button>
              {departments.map((d) => <button key={d} type="button" className="ota-chip" aria-pressed={dept === d} onClick={() => setDept(dept === d ? '' : d)}>{d}</button>)}
              {types.length > 1 && types.map((t) => <button key={t} type="button" className={cn('ota-chip')} aria-pressed={type === t} onClick={() => setType(type === t ? '' : t)}>{t}</button>)}
            </div>
          )}
          {isLoading ? (
            <div className="grid md:grid-cols-2 gap-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-52 rounded-2xl" />)}</div>
          ) : filtered.length === 0 ? (
            <EmptyState title={open.length ? 'Tidak ada posisi yang cocok' : 'Belum ada lowongan terbuka'}>
              {open.length ? 'Coba ubah kata kunci atau filter.' : 'Pantau halaman ini secara berkala, atau ikuti media sosial kami untuk info lowongan terbaru.'}
            </EmptyState>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">{filtered.map((j) => <JobCard key={j.id} job={j} />)}</div>
          )}
        </section>
      </div>
    </Layout>
  );
};

export default Careers;
