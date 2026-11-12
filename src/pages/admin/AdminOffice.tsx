// /admin/kantor — Kantor virtual: karyawan agent, meja persetujuan, laporan, dan log kerja.
// Data dari backend/office.ts (GET /functions/v1/office). Tidak ada yang terkirim ke klien tanpa persetujuan.
import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Play, MessageCircle, Copy, Check, X, ExternalLink, RotateCcw, Loader2, Inbox, FileText, Activity, Users } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { PixelOffice } from './office/PixelOffice';
import { cn } from '@/lib/utils';

type Agent = {
  id: string; name: string; role: string; avatar: string; schedule: string; description: string; external: boolean;
  is_active: boolean; last_run_at: string | null; last_status: string | null; last_summary: string | null;
  state?: { results?: { name: string; ok: boolean; ms: number; note: string }[]; checked_at?: string };
};
type Task = {
  id: string; agent_id: string; kind: 'whatsapp' | 'caption' | 'report' | 'alert' | string; title: string; body: string;
  target: string | null; link: string | null; image_url: string | null; status: string; created_at: string; decided_at: string | null;
};
type Run = { id: string; agent_id: string; trigger: string; status: string; summary: string | null; started_at: string; finished_at: string | null };
type Office = { agents: Agent[]; tasks: Task[]; runs: Run[]; stats: { pending: number; approved_7: number; chat_leads_24h: number; chat_leads_7: number } };

const KIND_LABEL: Record<string, string> = { whatsapp: 'Pesan WhatsApp', caption: 'Posting medsos', report: 'Laporan', alert: 'Peringatan' };

function ago(iso: string | null): string {
  if (!iso) return 'belum pernah';
  const s = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'baru saja';
  if (s < 3600) return `${Math.floor(s / 60)} menit lalu`;
  if (s < 86400) return `${Math.floor(s / 3600)} jam lalu`;
  return new Date(iso).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

async function api<T>(name: string, opts: { method?: string; body?: unknown } = {}): Promise<T> {
  const { data, error } = await supabase.functions.invoke(name, opts);
  if (error) throw new Error(error.message || 'Gagal menghubungi server');
  return data as T;
}

function StatusPill({ agent }: { agent: Agent }) {
  const s = !agent.is_active ? 'libur' : agent.last_status ?? 'menunggu';
  const tone = s === 'ok' ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' : s === 'gagal' ? 'bg-destructive/15 text-destructive'
    : s === 'berjalan' ? 'bg-gold/25 text-foreground' : 'bg-muted text-muted-foreground';
  const label = s === 'ok' ? 'Bekerja normal' : s === 'gagal' ? 'Ada kendala' : s === 'berjalan' ? 'Sedang bekerja' : s === 'libur' ? 'Libur' : 'Menunggu jadwal';
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold', tone)}>
      <span className={cn('size-1.5 rounded-full bg-current', s === 'berjalan' && 'animate-pulse')} />{label}
    </span>
  );
}

const Avatar = ({ agent, size = 'md' }: { agent?: Pick<Agent, 'avatar' | 'external'>; size?: 'sm' | 'md' }) => (
  <span className={cn('grid shrink-0 place-items-center rounded-2xl font-extrabold', size === 'md' ? 'size-12 text-sm' : 'size-8 rounded-xl text-[11px]',
    agent?.external ? 'bg-secondary text-primary' : 'bg-primary text-primary-foreground')}>{agent?.avatar ?? '?'}</span>
);

function TaskCard({ task, agent, onAct, busy }: { task: Task; agent?: Agent; onAct: (action: string, body?: string) => void; busy: boolean }) {
  const [text, setText] = useState(task.body);
  const edited = text !== task.body;
  const pending = task.status === 'pending';
  const sendWa = () => {
    if (!task.target) { toast.error('Nomor WhatsApp klien tidak valid. Hubungi lewat Booking masuk.'); return; }
    window.open(`https://wa.me/${task.target}?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
    onAct('done', edited ? text : undefined);
  };
  const copy = async () => {
    try { await navigator.clipboard.writeText(text); toast.success('Caption disalin'); } catch { toast.error('Tidak bisa menyalin otomatis, salin manual ya'); }
  };
  return (
    <article className="rounded-2xl border border-border bg-card p-4 md:p-5 shadow-sm">
      <header className="flex items-start gap-3">
        <Avatar agent={agent} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted-foreground"><b className="text-foreground">{agent?.name ?? task.agent_id}</b> · {KIND_LABEL[task.kind] ?? task.kind} · {ago(task.created_at)}</p>
          <h3 className="mt-0.5 font-extrabold leading-snug">{task.title}</h3>
        </div>
        {!pending && <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-bold text-muted-foreground">{task.status === 'done' ? 'Terkirim' : task.status === 'approved' ? 'Disetujui' : 'Ditolak'}</span>}
      </header>
      <div className={cn('mt-3 grid gap-3', task.image_url && 'sm:grid-cols-[140px_1fr]')}>
        {task.image_url && <img src={task.image_url} alt="" loading="lazy" className="aspect-square w-full rounded-xl object-cover bg-muted" />}
        {pending ? (
          <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={task.kind === 'caption' ? 10 : 5} className="text-sm leading-relaxed" aria-label="Isi draf (bisa diedit)" />
        ) : (
          <p className="whitespace-pre-wrap rounded-xl bg-muted/50 p-3 text-sm leading-relaxed">{task.body}</p>
        )}
      </div>
      {task.kind === 'whatsapp' && <p className="mt-2 text-xs text-muted-foreground">Ke: {task.target ? `+${task.target}` : 'nomor tidak valid'}</p>}
      {pending && (
        <div className="mt-4 flex flex-wrap gap-2">
          {task.kind === 'whatsapp' && (
            <Button size="sm" onClick={sendWa} disabled={busy} className="rounded-xl"><MessageCircle className="size-4" />Setujui & kirim via WhatsApp</Button>
          )}
          {task.kind === 'caption' && (
            <>
              <Button size="sm" onClick={() => onAct('approve', edited ? text : undefined)} disabled={busy} className="rounded-xl"><Check className="size-4" />Setujui</Button>
              <Button size="sm" variant="outline" onClick={copy} className="rounded-xl"><Copy className="size-4" />Salin caption</Button>
            </>
          )}
          {task.link && (
            <Button size="sm" variant="outline" asChild className="rounded-xl">
              <a href={task.link} target={task.link.startsWith('/') ? undefined : '_blank'} rel="noreferrer"><ExternalLink className="size-4" />{task.kind === 'whatsapp' ? 'Lihat booking' : 'Lihat konten'}</a>
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={() => onAct('reject')} disabled={busy} className="rounded-xl text-destructive hover:text-destructive"><X className="size-4" />Tolak</Button>
        </div>
      )}
      {!pending && task.status !== 'info' && (
        <div className="mt-3 flex flex-wrap gap-2">
          {task.kind === 'caption' && task.status === 'approved' && <Button size="sm" variant="outline" onClick={copy} className="rounded-xl"><Copy className="size-4" />Salin caption</Button>}
          <Button size="sm" variant="ghost" onClick={() => onAct('reopen')} disabled={busy} className="rounded-xl"><RotateCcw className="size-4" />Kembalikan ke antrean</Button>
        </div>
      )}
    </article>
  );
}

const AdminOffice = () => {
  const qc = useQueryClient();
  const [fastPoll, setFastPoll] = useState(0);
  const { data, isLoading, error } = useQuery({
    queryKey: ['office'],
    queryFn: () => api<Office>('office', { method: 'GET' }),
    refetchInterval: fastPoll > Date.now() ? 3000 : 20000,
  });
  const agents = data?.agents ?? [];
  const byId = useMemo(() => new Map(agents.map((a) => [a.id, a])), [agents]);
  const tasks = data?.tasks ?? [];
  const pending = tasks.filter((t) => t.status === 'pending');
  const history = tasks.filter((t) => t.status !== 'pending' && t.status !== 'info');
  const reports = tasks.filter((t) => t.status === 'info');
  const pendingByAgent = useMemo(() => pending.reduce<Record<string, number>>((m, t) => { m[t.agent_id] = (m[t.agent_id] ?? 0) + 1; return m; }, {}), [pending]);
  const todayArticles = Number(byId.get('writer')?.last_summary?.match(/^(\d+)\/5/)?.[1] ?? NaN);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = (selectedId ? byId.get(selectedId) : null) ?? agents.find((a) => (pendingByAgent[a.id] ?? 0) > 0) ?? agents[0] ?? null;

  const act = useMutation({
    mutationFn: ({ id, action, body }: { id: string; action: string; body?: string }) => api(`office/tasks/${id}`, { body: { action, body } }),
    onSuccess: (_d, v) => {
      toast.success(v.action === 'reject' ? 'Draf ditolak' : v.action === 'reopen' ? 'Dikembalikan ke antrean' : v.action === 'done' ? 'Ditandai terkirim' : 'Disetujui');
      qc.invalidateQueries({ queryKey: ['office'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const toggle = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) => api(`office/agents/${id}`, { body: { is_active } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['office'] }),
    onError: (e: Error) => toast.error(e.message),
  });
  const runNow = useMutation({
    mutationFn: (id: string) => api(`office/agents/${id}/run`, { body: {} }),
    onSuccess: (_d, id) => {
      toast.success(`${byId.get(id)?.name ?? 'Agent'} mulai bekerja`);
      setFastPoll(Date.now() + 120_000);
      qc.invalidateQueries({ queryKey: ['office'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const activeCount = agents.filter((a) => a.is_active).length;
  const AgentCard = ({ a }: { a: Agent }) => (
    <article className="flex flex-col rounded-2xl border border-border bg-card p-5 shadow-sm">
      <header className="flex items-start gap-3">
        <Avatar agent={a} />
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-extrabold leading-tight">{a.name}</h3>
          <p className="text-sm text-muted-foreground">{a.role}</p>
        </div>
        {!a.external && (
          <Switch checked={a.is_active} onCheckedChange={(v) => toggle.mutate({ id: a.id, is_active: v })} aria-label={`${a.is_active ? 'Liburkan' : 'Aktifkan'} ${a.name}`} />
        )}
      </header>
      <p className="mt-3 text-sm text-muted-foreground">{a.description}</p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <StatusPill agent={a} />
        <span className="text-xs text-muted-foreground">{a.schedule}</span>
      </div>
      <div className="mt-3 rounded-xl bg-muted/50 p-3 text-sm">
        <p className="text-xs text-muted-foreground">{a.external ? 'Aktivitas terakhir' : `Terakhir bekerja ${ago(a.last_run_at)}`}</p>
        <p className="mt-0.5 font-semibold">{a.last_summary || '—'}</p>
        {a.id === 'guard' && a.state?.results && (
          <ul className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
            {a.state.results.map((r) => (
              <li key={r.name} className="flex items-center gap-1.5">
                <span className={cn('size-1.5 rounded-full', r.ok ? (r.note ? 'bg-gold' : 'bg-emerald-500') : 'bg-destructive')} />
                {r.name}{r.ms ? ` · ${r.ms} ms` : ''}
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="mt-auto pt-4">
        {a.external ? (
          <p className="text-xs text-muted-foreground">Dikelola terpisah ({a.id === 'writer' ? 'agen artikel di Railway' : 'chat di website'}).</p>
        ) : (
          <Button size="sm" variant="outline" className="rounded-xl" disabled={runNow.isPending || a.last_status === 'berjalan'} onClick={() => runNow.mutate(a.id)}>
            {a.last_status === 'berjalan' ? <Loader2 className="size-4 animate-spin" /> : <Play className="size-4" />}
            {a.last_status === 'berjalan' ? 'Sedang bekerja…' : 'Suruh kerja sekarang'}
          </Button>
        )}
      </div>
    </article>
  );


  return (
    <AdminLayout title="Kantor virtual" description="Karyawan agent yang bekerja otomatis. Semua yang akan dikirim ke klien atau dipublikasikan menunggu persetujuan tim di meja persetujuan.">
      {error && <p className="mb-4 rounded-xl bg-destructive/10 p-3 text-sm font-semibold text-destructive">{(error as Error).message}</p>}

      <section className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: 'Karyawan aktif', value: `${activeCount}/${agents.length || 6}`, icon: Users },
          { label: 'Menunggu persetujuan', value: data?.stats.pending ?? '–', icon: Inbox, hot: (data?.stats.pending ?? 0) > 0 },
          { label: 'Disetujui 7 hari', value: data?.stats.approved_7 ?? '–', icon: Check },
          { label: 'Kontak dari chat 7 hari', value: data?.stats.chat_leads_7 ?? '–', icon: MessageCircle },
        ].map((s) => (
          <div key={s.label} className={cn('rounded-2xl border border-border bg-card p-4 shadow-sm', s.hot && 'ring-2 ring-gold')}>
            <s.icon className="size-5 text-primary" aria-hidden="true" />
            <p className="mt-2 text-2xl font-extrabold tracking-tight">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </section>

      <Tabs defaultValue="kantor">
        <TabsList className="mb-5 h-auto flex-wrap rounded-xl">
          <TabsTrigger value="kantor" className="rounded-lg">🎮 Kantor</TabsTrigger>
          <TabsTrigger value="meja" className="rounded-lg">Meja persetujuan{pending.length ? ` (${pending.length})` : ''}</TabsTrigger>
          <TabsTrigger value="tim" className="rounded-lg">Tim</TabsTrigger>
          <TabsTrigger value="laporan" className="rounded-lg">Laporan & peringatan</TabsTrigger>
          <TabsTrigger value="log" className="rounded-lg">Log kerja</TabsTrigger>
        </TabsList>

        <TabsContent value="kantor">
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
            <PixelOffice agents={agents} pendingByAgent={pendingByAgent} selectedId={selected?.id ?? null} onSelect={setSelectedId} todayArticles={todayArticles} />
            <div className="space-y-3">
              {selected ? <AgentCard a={selected} /> : <p className="text-sm text-muted-foreground">Memuat karyawan…</p>}
              {(pendingByAgent[selected?.id ?? ''] ?? 0) > 0 && (
                <p className="rounded-xl bg-gold/20 p-3 text-sm font-semibold">{selected?.name} punya {pendingByAgent[selected!.id]} draf menunggu persetujuan — buka tab <b>Meja persetujuan</b>.</p>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="meja" className="space-y-4">
          {isLoading && <p className="text-sm text-muted-foreground">Memuat…</p>}
          {!isLoading && !pending.length && (
            <div className="rounded-2xl border border-dashed border-border p-8 text-center">
              <Inbox className="mx-auto size-8 text-muted-foreground" aria-hidden="true" />
              <p className="mt-2 font-bold">Meja persetujuan kosong</p>
              <p className="text-sm text-muted-foreground">Draf follow-up WhatsApp dan posting medsos akan muncul di sini.</p>
            </div>
          )}
          {pending.map((t) => (
            <TaskCard key={t.id} task={t} agent={byId.get(t.agent_id)} busy={act.isPending} onAct={(action, body) => act.mutate({ id: t.id, action, body })} />
          ))}
          {history.length > 0 && (
            <details className="group pt-2">
              <summary className="cursor-pointer text-sm font-bold text-muted-foreground">Riwayat 14 hari ({history.length})</summary>
              <div className="mt-3 space-y-3">
                {history.map((t) => <TaskCard key={t.id} task={t} agent={byId.get(t.agent_id)} busy={act.isPending} onAct={(action, body) => act.mutate({ id: t.id, action, body })} />)}
              </div>
            </details>
          )}
        </TabsContent>

        <TabsContent value="tim">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {agents.map((a) => <AgentCard key={a.id} a={a} />)}
          </div>
        </TabsContent>

        <TabsContent value="laporan" className="space-y-4">
          {!reports.length && <p className="text-sm text-muted-foreground">Belum ada laporan. Bima membuat laporan setiap Senin pagi; peringatan dari Raka muncul bila website bermasalah.</p>}
          {reports.map((t) => (
            <article key={t.id} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <header className="flex items-center gap-3">
                <Avatar agent={byId.get(t.agent_id)} size="sm" />
                <div>
                  <h3 className="font-extrabold">{t.kind === 'alert' ? '🚨 ' : <FileText className="mr-1 inline size-4" aria-hidden="true" />}{t.title}</h3>
                  <p className="text-xs text-muted-foreground">{byId.get(t.agent_id)?.name} · {ago(t.created_at)}</p>
                </div>
              </header>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed">{t.body}</p>
            </article>
          ))}
        </TabsContent>

        <TabsContent value="log">
          <div className="overflow-x-auto rounded-2xl border border-border bg-card">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr><th className="p-3">Waktu</th><th className="p-3">Karyawan</th><th className="p-3">Pemicu</th><th className="p-3">Status</th><th className="p-3">Hasil</th></tr>
              </thead>
              <tbody>
                {(data?.runs ?? []).map((r) => (
                  <tr key={r.id} className="border-t border-border align-top">
                    <td className="p-3 whitespace-nowrap text-muted-foreground">{ago(r.started_at)}</td>
                    <td className="p-3 font-semibold">{byId.get(r.agent_id)?.name ?? r.agent_id}</td>
                    <td className="p-3">{r.trigger}</td>
                    <td className="p-3"><span className={cn('font-bold', r.status === 'gagal' ? 'text-destructive' : r.status === 'running' ? 'text-foreground' : 'text-emerald-700 dark:text-emerald-300')}>{r.status === 'running' ? 'berjalan' : r.status}</span></td>
                    <td className="p-3">{r.summary}</td>
                  </tr>
                ))}
                {!data?.runs?.length && <tr><td colSpan={5} className="p-6 text-center text-muted-foreground"><Activity className="mx-auto mb-1 size-5" />Belum ada aktivitas</td></tr>}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
};

export default AdminOffice;
