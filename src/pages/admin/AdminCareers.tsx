// CMS Karier: kelola lowongan (tabel jobs) dan pelamar (job_applications + CV privat).
import { useMemo, useState } from 'react';
import { Download, Mail, MessageCircle, Search, Star, ExternalLink, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminTable } from '@/components/admin/AdminTable';
import { AdminFormDialog } from '@/components/admin/AdminFormDialog';
import { DeleteConfirmDialog } from '@/components/admin/DeleteConfirmDialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useSaveRow, useDeleteRow } from '@/hooks/useOta';
import {
  useJobs, useJobApplications, useUpdateApplication, useDeleteApplication, downloadCv, jobOpen,
  APPLICATION_STATUS, EMPLOYMENT_TYPES, WORK_MODES, type Job, type JobApplication, type ApplicationStatus,
} from '@/hooks/useCareers';
import { cn } from '@/lib/utils';

const emptyJob = {
  title: '', slug: '', department: '', location_text: '', employment_type: 'Full-time', work_mode: 'On-site', experience_level: '',
  salary_min: '', salary_max: '', show_salary: false, summary: '', description: '', responsibilities: '', requirements: '', benefits: '',
  deadline: '', is_active: true, is_featured: false, sort_order: 0,
};
const lines = (t: string) => t.split('\n').map((s) => s.trim().replace(/^[-•*]\s*/, '')).filter(Boolean);
const fmt = (d: string) => new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
const selectCls = 'mt-1 w-full h-10 rounded-md border border-input bg-background px-3 text-sm';

const AdminCareers = () => {
  const { data: jobs = [], isLoading: jobsLoading } = useJobs();
  const { data: apps = [], isLoading: appsLoading } = useJobApplications();
  const saveJob = useSaveRow('jobs', 'Lowongan');
  const deleteJob = useDeleteRow('jobs', 'Lowongan');
  const updateApp = useUpdateApplication();
  const deleteApp = useDeleteApplication();

  // ---- lowongan
  const [jobOpenForm, setJobOpenForm] = useState(false);
  const [editing, setEditing] = useState<Job | null>(null);
  const [jf, setJf] = useState(emptyJob);
  const [deleteJobId, setDeleteJobId] = useState<string | null>(null);
  const appsByJob = useMemo(() => {
    const m: Record<string, number> = {};
    for (const a of apps) if (a.job_id) m[a.job_id] = (m[a.job_id] ?? 0) + 1;
    return m;
  }, [apps]);

  const openJob = (j?: Job) => {
    setEditing(j ?? null);
    setJf(j ? {
      title: j.title, slug: j.slug ?? '', department: j.department ?? '', location_text: j.location_text ?? '', employment_type: j.employment_type, work_mode: j.work_mode,
      experience_level: j.experience_level ?? '', salary_min: j.salary_min ? String(j.salary_min) : '', salary_max: j.salary_max ? String(j.salary_max) : '',
      show_salary: j.show_salary, summary: j.summary ?? '', description: j.description ?? '', responsibilities: j.responsibilities.join('\n'),
      requirements: j.requirements.join('\n'), benefits: j.benefits.join('\n'), deadline: j.deadline ?? '', is_active: j.is_active, is_featured: j.is_featured, sort_order: j.sort_order,
    } : emptyJob);
    setJobOpenForm(true);
  };
  const num = (v: string) => (v.trim() ? Number(v.replace(/[^0-9]/g, '')) || null : null);
  const submitJob = async () => {
    if (!jf.title.trim()) { toast.error('Judul posisi wajib diisi'); return; }
    await saveJob.mutateAsync({
      id: editing?.id, title: jf.title.trim(), slug: jf.slug.trim() || null, department: jf.department.trim() || null, location_text: jf.location_text.trim() || null,
      employment_type: jf.employment_type, work_mode: jf.work_mode, experience_level: jf.experience_level.trim() || null,
      salary_min: num(jf.salary_min), salary_max: num(jf.salary_max), show_salary: jf.show_salary, summary: jf.summary.trim() || null, description: jf.description.trim() || null,
      responsibilities: lines(jf.responsibilities), requirements: lines(jf.requirements), benefits: lines(jf.benefits),
      deadline: jf.deadline || null, is_active: jf.is_active, is_featured: jf.is_featured, sort_order: Number(jf.sort_order) || 0,
    });
    setJobOpenForm(false);
  };

  // ---- pelamar
  const [filterJob, setFilterJob] = useState('');
  const [filterStatus, setFilterStatus] = useState<'' | ApplicationStatus>('');
  const [q, setQ] = useState('');
  const [detail, setDetail] = useState<JobApplication | null>(null);
  const [notes, setNotes] = useState('');
  const [deleteAppId, setDeleteAppId] = useState<string | null>(null);
  const filteredApps = apps.filter((a) => {
    const t = q.trim().toLowerCase();
    return (!filterJob || a.job_id === filterJob) && (!filterStatus || a.status === filterStatus)
      && (!t || `${a.full_name} ${a.email} ${a.phone} ${a.domicile ?? ''}`.toLowerCase().includes(t));
  });
  const newCount = apps.filter((a) => a.status === 'new').length;
  const openDetail = (a: JobApplication) => {
    setDetail(a);
    setNotes(a.admin_notes ?? '');
    if (a.status === 'new') updateApp.mutate({ id: a.id, status: 'review' });
  };
  const waLink = (phone: string, name: string, job: string) => {
    const n = phone.replace(/\D/g, '').replace(/^0/, '62');
    return `https://wa.me/${n}?text=${encodeURIComponent(`Halo ${name.split(' ')[0]}, kami dari tim HR Kediaman terkait lamaran Anda untuk posisi ${job}.`)}`;
  };
  const getCv = async (a: JobApplication) => {
    try { await downloadCv(a); } catch (e) { toast.error((e as Error).message); }
  };

  return (
    <AdminLayout title="Karier" description="Kelola lowongan yang tampil di halaman /karir dan proses pelamar yang masuk. CV tersimpan privat dan hanya bisa diunduh admin.">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {[['Lowongan dibuka', jobs.filter(jobOpen).length], ['Total pelamar', apps.length], ['Pelamar baru', newCount], ['Tahap interview', apps.filter((a) => a.status === 'interview').length]].map(([l, v]) => (
          <div key={String(l)} className="ota-card p-4"><p className="text-2xl font-extrabold">{v}</p><p className="text-sm text-muted-foreground">{l}</p></div>
        ))}
      </div>

      <Tabs defaultValue="pelamar">
        <TabsList className="mb-4">
          <TabsTrigger value="pelamar">Pelamar{newCount > 0 && <span className="ml-1.5 rounded-full bg-gold px-1.5 text-[11px] font-bold text-primary">{newCount}</span>}</TabsTrigger>
          <TabsTrigger value="lowongan">Lowongan</TabsTrigger>
        </TabsList>

        <TabsContent value="pelamar">
          <div className="flex flex-col md:flex-row gap-2 mb-4">
            <label className="flex items-center gap-2 h-10 px-3 rounded-lg border border-input bg-card flex-1">
              <Search className="size-4 text-muted-foreground" aria-hidden="true" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari nama, email, HP" className="bg-transparent outline-none text-sm w-full" />
            </label>
            <select value={filterJob} onChange={(e) => setFilterJob(e.target.value)} className="h-10 rounded-lg border border-input bg-card px-3 text-sm md:w-64" aria-label="Filter posisi">
              <option value="">Semua posisi</option>
              {jobs.map((j) => <option key={j.id} value={j.id}>{j.title}</option>)}
            </select>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as ApplicationStatus | '')} className="h-10 rounded-lg border border-input bg-card px-3 text-sm md:w-44" aria-label="Filter status">
              <option value="">Semua status</option>
              {(Object.keys(APPLICATION_STATUS) as ApplicationStatus[]).map((s) => <option key={s} value={s}>{APPLICATION_STATUS[s].label}</option>)}
            </select>
          </div>
          <div className="ota-card p-2 md:p-4">
            {appsLoading ? <p className="py-8 text-center text-muted-foreground">Memuat…</p> : filteredApps.length === 0 ? <p className="py-8 text-center text-muted-foreground">Belum ada pelamar.</p> : (
              <ul className="divide-y divide-border">
                {filteredApps.map((a) => (
                  <li key={a.id}>
                    <button type="button" onClick={() => openDetail(a)} className="w-full text-left flex flex-col md:flex-row md:items-center gap-2 md:gap-4 px-2 py-3 rounded-lg hover:bg-muted/60">
                      <div className="flex-1 min-w-0">
                        <p className={cn('truncate', a.status === 'new' ? 'font-extrabold' : 'font-semibold')}>{a.full_name}</p>
                        <p className="truncate text-xs text-muted-foreground">{a.job_title} · {a.domicile || '-'} · {fmt(a.created_at)}</p>
                      </div>
                      {a.rating ? <span className="inline-flex items-center gap-0.5 text-xs font-bold text-gold">{'★'.repeat(a.rating)}</span> : null}
                      <span className={APPLICATION_STATUS[a.status]?.tone ?? 'ota-badge'}>{APPLICATION_STATUS[a.status]?.label ?? a.status}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </TabsContent>

        <TabsContent value="lowongan">
          <AdminTable
            data={jobs}
            isLoading={jobsLoading}
            onCreate={() => openJob()}
            onEdit={openJob}
            onDelete={(j) => setDeleteJobId(j.id)}
            createLabel="Tambah lowongan"
            columns={[
              { key: 'title', label: 'Posisi', render: (j: Job) => <div><p className="font-semibold">{j.title}</p><p className="text-xs text-muted-foreground">{j.department || '-'} · {j.location_text || '-'}</p></div> },
              { key: 'employment_type', label: 'Tipe', render: (j: Job) => `${j.employment_type} · ${j.work_mode}` },
              { key: 'deadline', label: 'Batas', render: (j: Job) => (j.deadline ? fmt(j.deadline) : '-') },
              { key: 'apps', label: 'Pelamar', render: (j: Job) => appsByJob[j.id] ?? 0 },
              { key: 'is_active', label: 'Status', render: (j: Job) => <div className="flex gap-1">{j.is_featured && <Badge variant="outline">Prioritas</Badge>}<Badge variant={jobOpen(j) ? 'default' : 'secondary'}>{jobOpen(j) ? 'Dibuka' : j.is_active ? 'Lewat batas' : 'Ditutup'}</Badge></div> },
            ]}
          />
        </TabsContent>
      </Tabs>

      {/* Form lowongan */}
      <AdminFormDialog open={jobOpenForm} onOpenChange={setJobOpenForm} title={editing ? 'Ubah lowongan' : 'Tambah lowongan'} onSubmit={submitJob} isSubmitting={saveJob.isPending}>
        <div><Label>Judul posisi *</Label><Input value={jf.title} onChange={(e) => setJf({ ...jf, title: e.target.value })} placeholder="Sales Executive Venue" /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Departemen</Label><Input value={jf.department} onChange={(e) => setJf({ ...jf, department: e.target.value })} placeholder="Sales & Marketing" /></div>
          <div><Label>Lokasi</Label><Input value={jf.location_text} onChange={(e) => setJf({ ...jf, location_text: e.target.value })} placeholder="Jakarta Selatan" /></div>
          <div><Label>Tipe kerja</Label><select value={jf.employment_type} onChange={(e) => setJf({ ...jf, employment_type: e.target.value })} className={selectCls}>{EMPLOYMENT_TYPES.map((t) => <option key={t}>{t}</option>)}</select></div>
          <div><Label>Sistem kerja</Label><select value={jf.work_mode} onChange={(e) => setJf({ ...jf, work_mode: e.target.value })} className={selectCls}>{WORK_MODES.map((t) => <option key={t}>{t}</option>)}</select></div>
          <div><Label>Pengalaman</Label><Input value={jf.experience_level} onChange={(e) => setJf({ ...jf, experience_level: e.target.value })} placeholder="Min. 1 tahun" /></div>
          <div><Label>Batas lamaran</Label><Input type="date" value={jf.deadline} onChange={(e) => setJf({ ...jf, deadline: e.target.value })} /></div>
          <div><Label>Gaji min (Rp/bulan)</Label><Input inputMode="numeric" value={jf.salary_min} onChange={(e) => setJf({ ...jf, salary_min: e.target.value })} /></div>
          <div><Label>Gaji maks (Rp/bulan)</Label><Input inputMode="numeric" value={jf.salary_max} onChange={(e) => setJf({ ...jf, salary_max: e.target.value })} /></div>
        </div>
        <div className="flex items-center gap-2"><Switch checked={jf.show_salary} onCheckedChange={(c) => setJf({ ...jf, show_salary: c })} /><Label>Tampilkan gaji di website</Label></div>
        <div><Label>Ringkasan (1-2 kalimat)</Label><Textarea rows={2} value={jf.summary} onChange={(e) => setJf({ ...jf, summary: e.target.value })} /></div>
        <div><Label>Tentang peran ini</Label><Textarea rows={4} value={jf.description} onChange={(e) => setJf({ ...jf, description: e.target.value })} /></div>
        <div><Label>Tanggung jawab (satu baris = satu poin)</Label><Textarea rows={5} value={jf.responsibilities} onChange={(e) => setJf({ ...jf, responsibilities: e.target.value })} /></div>
        <div><Label>Kualifikasi (satu baris = satu poin)</Label><Textarea rows={5} value={jf.requirements} onChange={(e) => setJf({ ...jf, requirements: e.target.value })} /></div>
        <div><Label>Benefit (satu baris = satu poin)</Label><Textarea rows={4} value={jf.benefits} onChange={(e) => setJf({ ...jf, benefits: e.target.value })} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Slug URL (opsional)</Label><Input value={jf.slug} onChange={(e) => setJf({ ...jf, slug: e.target.value })} placeholder="otomatis dari judul" /></div>
          <div><Label>Urutan</Label><Input type="number" value={jf.sort_order} onChange={(e) => setJf({ ...jf, sort_order: parseInt(e.target.value) || 0 })} /></div>
        </div>
        <div className="flex items-center gap-2"><Switch checked={jf.is_featured} onCheckedChange={(c) => setJf({ ...jf, is_featured: c })} /><Label>Tandai prioritas (tampil paling atas)</Label></div>
        <div className="flex items-center gap-2"><Switch checked={jf.is_active} onCheckedChange={(c) => setJf({ ...jf, is_active: c })} /><Label>Lowongan dibuka</Label></div>
      </AdminFormDialog>

      {/* Detail pelamar */}
      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          {detail && (
            <>
              <DialogHeader><DialogTitle>{detail.full_name}</DialogTitle></DialogHeader>
              <p className="text-sm text-muted-foreground -mt-2">{detail.job_title} · melamar {fmt(detail.created_at)}</p>
              <div className="flex flex-wrap gap-2">
                {detail.has_cv && <Button size="sm" onClick={() => getCv(detail)}><Download className="size-4 mr-1" />Unduh CV</Button>}
                <Button size="sm" variant="outline" asChild><a href={waLink(detail.phone, detail.full_name, detail.job_title)} target="_blank" rel="noopener noreferrer"><MessageCircle className="size-4 mr-1" />WhatsApp</a></Button>
                <Button size="sm" variant="outline" asChild><a href={`mailto:${detail.email}?subject=${encodeURIComponent(`Lamaran ${detail.job_title} - Kediaman`)}`}><Mail className="size-4 mr-1" />Email</a></Button>
              </div>
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div><dt className="text-xs text-muted-foreground">Email</dt><dd className="break-all">{detail.email}</dd></div>
                <div><dt className="text-xs text-muted-foreground">HP</dt><dd>{detail.phone}</dd></div>
                <div><dt className="text-xs text-muted-foreground">Domisili</dt><dd>{detail.domicile || '-'}</dd></div>
                <div><dt className="text-xs text-muted-foreground">Bisa mulai</dt><dd>{detail.available_from || '-'}</dd></div>
                <div><dt className="text-xs text-muted-foreground">Ekspektasi gaji</dt><dd>{detail.expected_salary || '-'}</dd></div>
                <div><dt className="text-xs text-muted-foreground">Tautan</dt><dd className="flex flex-col">
                  {detail.linkedin_url && <a href={detail.linkedin_url} target="_blank" rel="noopener noreferrer nofollow" className="text-primary inline-flex items-center gap-1">LinkedIn<ExternalLink className="size-3" /></a>}
                  {detail.portfolio_url && <a href={detail.portfolio_url} target="_blank" rel="noopener noreferrer nofollow" className="text-primary inline-flex items-center gap-1">Portofolio<ExternalLink className="size-3" /></a>}
                  {!detail.linkedin_url && !detail.portfolio_url && '-'}
                </dd></div>
              </dl>
              {detail.cover_letter && <div><p className="text-xs text-muted-foreground mb-1">Tentang pelamar</p><p className="text-sm whitespace-pre-line rounded-lg bg-muted p-3">{detail.cover_letter}</p></div>}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Status</Label>
                  <select value={detail.status} onChange={(e) => { const s = e.target.value as ApplicationStatus; setDetail({ ...detail, status: s }); updateApp.mutate({ id: detail.id, status: s }); }} className={selectCls}>
                    {(Object.keys(APPLICATION_STATUS) as ApplicationStatus[]).map((s) => <option key={s} value={s}>{APPLICATION_STATUS[s].label}</option>)}
                  </select>
                </div>
                <div>
                  <Label>Penilaian</Label>
                  <div className="mt-1 flex h-10 items-center gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button key={n} type="button" aria-label={`${n} bintang`} onClick={() => { setDetail({ ...detail, rating: n }); updateApp.mutate({ id: detail.id, rating: n }); }}>
                        <Star className={cn('size-5', (detail.rating ?? 0) >= n ? 'fill-gold text-gold' : 'text-muted-foreground')} />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <Label>Catatan internal</Label>
                <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Hasil screening, jadwal interview, dll." />
                <div className="mt-2 flex justify-between">
                  <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setDeleteAppId(detail.id)}><Trash2 className="size-4 mr-1" />Hapus pelamar</Button>
                  <Button size="sm" onClick={() => updateApp.mutate({ id: detail.id, admin_notes: notes.trim() || null })}>Simpan catatan</Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog open={!!deleteJobId} onOpenChange={(o) => !o && setDeleteJobId(null)} onConfirm={async () => { if (deleteJobId) { await deleteJob.mutateAsync(deleteJobId); setDeleteJobId(null); } }} isDeleting={deleteJob.isPending} title="Hapus lowongan" />
      <DeleteConfirmDialog open={!!deleteAppId} onOpenChange={(o) => !o && setDeleteAppId(null)} onConfirm={async () => { if (deleteAppId) { await deleteApp.mutateAsync(deleteAppId); setDeleteAppId(null); setDetail(null); } }} isDeleting={deleteApp.isPending} title="Hapus pelamar beserta CV-nya" />
    </AdminLayout>
  );
};

export default AdminCareers;
