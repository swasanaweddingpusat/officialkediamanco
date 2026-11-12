// Kantor virtual bergaya game pixel / The Sims. Digambar sebagai SVG beresolusi rendah (240×150 "pixel")
// lalu diperbesar dengan shape-rendering crispEdges supaya tetap tajam kotak-kotak.
// Status agent → animasi: bekerja = mengetik + layar bergulir, libur = tidur (Zzz), gagal = "!", ada draf = gelembung angka.
import { useEffect, useMemo, useState, type ReactElement } from 'react';
import { cn } from '@/lib/utils';

export type OfficeAgent = {
  id: string; name: string; role: string; external: boolean; is_active: boolean;
  last_status: string | null; last_summary: string | null; last_run_at: string | null;
};

type Look = { hair: string; skin: string; shirt: string; shirtDark: string; long?: boolean; headset?: boolean; glasses?: boolean };
const LOOKS: Record<string, Look> = {
  sales: { hair: '#3b2416', skin: '#f1c7a0', shirt: '#d4a547', shirtDark: '#a97f2c', long: true },
  seo: { hair: '#1d1d1f', skin: '#c99872', shirt: '#2f6f8f', shirtDark: '#1f4f66', glasses: true },
  social: { hair: '#7a3b1d', skin: '#f3cfae', shirt: '#d96c8a', shirtDark: '#a94e68', long: true },
  guard: { hair: '#232323', skin: '#b98563', shirt: '#4c5b43', shirtDark: '#343f2e' },
  writer: { hair: '#4a2c1a', skin: '#e9bb92', shirt: '#7b62b5', shirtDark: '#594488', long: true, glasses: true },
  chat: { hair: '#14110f', skin: '#d8a27a', shirt: '#17261f', shirtDark: '#0c1510', long: true, headset: true },
};

// Sprite 10×11: H rambut, S kulit, E mata, M mulut, B baju, D baju gelap, G kacamata
const BODY = [
  '..HHHHHH..',
  '.HHHHHHHH.',
  '.HSSSSSSH.',
  '.SSESSESS.',
  '.SSSSSSSS.',
  '..SSMMSS..',
  '...SSSS...',
  '.BBBBBBBB.',
  'BBBBBBBBBB',
  'BBBDBBDBBB',
  'BBBBBBBBBB',
];

const DESKS: { id: string; x: number; y: number }[] = [
  { id: 'sales', x: 22, y: 62 }, { id: 'seo', x: 96, y: 62 }, { id: 'social', x: 170, y: 62 },
  { id: 'guard', x: 22, y: 108 }, { id: 'writer', x: 96, y: 108 }, { id: 'chat', x: 170, y: 108 },
];

type Mood = 'kerja' | 'normal' | 'gagal' | 'libur' | 'tunggu';
export function moodOf(a: OfficeAgent, todayArticles?: number): Mood {
  if (!a.is_active) return 'libur';
  if (a.last_status === 'berjalan') return 'kerja';
  if (a.last_status === 'gagal') return 'gagal';
  if (a.id === 'chat') return 'kerja';                                     // Ayu selalu siaga
  if (a.id === 'writer' && (todayArticles ?? 5) < 5) return 'kerja';
  return a.last_status ? 'normal' : 'tunggu';
}
const PLUMBOB: Record<Mood, string> = { kerja: '#f5c542', normal: '#3ddc6a', gagal: '#ef4444', libur: '#9ca3af', tunggu: '#3ddc6a' };

function Sprite({ look, x, y, sleeping }: { look: Look; x: number; y: number; sleeping: boolean }) {
  const color = (ch: string): string | null => {
    switch (ch) {
      case 'H': return look.hair;
      case 'S': return look.skin;
      case 'E': return sleeping ? look.skin : '#1b1b1b';
      case 'M': return '#b0564b';
      case 'B': return look.shirt;
      case 'D': return look.shirtDark;
      default: return null;
    }
  };
  const rects: ReactElement[] = [];
  BODY.forEach((row, r) => [...row].forEach((ch, c) => {
    let fill = color(ch);
    if (look.long && (r === 3 || r === 4 || r === 5) && (c === 0 || c === 9)) fill = look.hair;   // rambut panjang
    if (fill) rects.push(<rect key={`${r}-${c}`} x={x + c} y={y + r} width={1} height={1} fill={fill} />);
  }));
  return (
    <g>
      {rects}
      {sleeping && <rect x={x + 2} y={y + 3} width={6} height={1} fill="#6b4a3a" opacity={0.6} />}
      {look.glasses && !sleeping && (
        <g fill="none" stroke="#2a2a2a" strokeWidth={0.5}>
          <rect x={x + 1.75} y={y + 2.75} width={2.5} height={1.5} /><rect x={x + 5.75} y={y + 2.75} width={2.5} height={1.5} />
        </g>
      )}
      {look.headset && (
        <g>
          <rect x={x} y={y + 2} width={1} height={3} fill="#2b2b2b" /><rect x={x + 9} y={y + 2} width={1} height={3} fill="#2b2b2b" />
          <rect x={x + 1} y={y - 1} width={8} height={1} fill="#2b2b2b" /><rect x={x + 6} y={y + 5} width={3} height={1} fill="#2b2b2b" />
        </g>
      )}
    </g>
  );
}

function Desk({ agentId, x, y, mood, pending, selected, onSelect, name }: {
  agentId: string; x: number; y: number; mood: Mood; pending: number; selected: boolean; onSelect: () => void; name: string;
}) {
  const look = LOOKS[agentId] ?? LOOKS.guard;
  const sleeping = mood === 'libur';
  const working = mood === 'kerja';
  const screen = sleeping ? '#1a2030' : mood === 'gagal' ? '#5a1d1d' : working ? '#1f3b52' : '#24405a';
  const cx = x + 23;                       // tengah meja
  return (
    <g className="cursor-pointer" onClick={onSelect} role="button" tabIndex={0} aria-label={`${name}: lihat detail`}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(); } }}>
      {/* sorotan terpilih */}
      {selected && <rect x={x - 3} y={y - 24} width={52} height={42} fill="#fff7d6" opacity={0.35} rx={2} />}
      {/* kursi */}
      <rect x={cx - 7} y={y - 6} width={14} height={9} fill="#3d4b5c" />
      <rect x={cx - 6} y={y - 5} width={12} height={2} fill="#4e6074" />
      {/* karakter (bergoyang pelan; menunduk saat tidur) */}
      <g className={cn(working ? 'px-type-bob' : sleeping ? 'px-sleep' : 'px-idle')}>
        <Sprite look={look} x={cx - 5} y={y - 15} sleeping={sleeping} />
      </g>
      {/* meja */}
      <rect x={x} y={y - 1} width={46} height={4} fill="#a0703f" />
      <rect x={x} y={y + 3} width={46} height={2} fill="#7c5430" />
      <rect x={x + 2} y={y + 5} width={2} height={9} fill="#6a4728" /><rect x={x + 42} y={y + 5} width={2} height={9} fill="#6a4728" />
      {/* monitor menghadap karakter (tampak belakang) + layar kecil terlihat */}
      <rect x={x + 30} y={y - 12} width={13} height={10} fill="#2b2f36" />
      <rect x={x + 31} y={y - 11} width={11} height={8} fill={screen} />
      {working && (
        <g className="px-screen">
          <rect x={x + 32} y={y - 10} width={7} height={1} fill="#8fd3ff" />
          <rect x={x + 32} y={y - 8} width={9} height={1} fill="#8fd3ff" opacity={0.8} />
          <rect x={x + 32} y={y - 6} width={5} height={1} fill="#8fd3ff" opacity={0.7} />
        </g>
      )}
      {mood === 'normal' && <rect x={x + 32} y={y - 9} width={6} height={1} fill="#6ee7b7" opacity={0.8} />}
      <rect x={x + 35} y={y - 2} width={3} height={1} fill="#2b2f36" />
      {/* tangan mengetik */}
      {!sleeping && (
        <g>
          <rect className={working ? 'px-hand-l' : undefined} x={cx - 6} y={y - 2} width={2} height={1} fill={look.skin} />
          <rect className={working ? 'px-hand-r' : undefined} x={cx + 4} y={y - 2} width={2} height={1} fill={look.skin} />
          <rect x={cx - 4} y={y - 1} width={8} height={1} fill="#d9d9d9" />
        </g>
      )}
      {/* cangkir kopi */}
      <rect x={x + 4} y={y - 4} width={3} height={3} fill="#f5f5f5" /><rect x={x + 7} y={y - 3} width={1} height={1} fill="#f5f5f5" />
      {/* plumbob ala The Sims */}
      <g className="px-plumbob">
        <polygon points={`${cx},${y - 26} ${cx + 3},${y - 22} ${cx},${y - 18} ${cx - 3},${y - 22}`} fill={PLUMBOB[mood]} stroke="#0f3d22" strokeWidth={0.4} />
        <polygon points={`${cx},${y - 26} ${cx + 3},${y - 22} ${cx},${y - 22}`} fill="#ffffff" opacity={0.35} />
      </g>
      {/* ikon status */}
      {sleeping && <text x={cx + 6} y={y - 15} className="px-zzz" fontSize={5} fill="#475569" fontFamily="monospace" fontWeight="bold">z</text>}
      {mood === 'gagal' && <text x={cx + 6} y={y - 14} fontSize={7} fill="#ef4444" fontFamily="monospace" fontWeight="bold" className="px-blink">!</text>}
      {pending > 0 && (
        <g className="px-bounce">
          <rect x={x + 39} y={y - 18} width={9} height={6} rx={1} fill="#ef4444" />
          <rect x={x + 41} y={y - 12} width={2} height={1} fill="#ef4444" />
          <text x={x + 43.5} y={y - 13.6} fontSize={4.2} fill="#fff" fontFamily="monospace" fontWeight="bold" textAnchor="middle">{pending > 9 ? '9+' : pending}</text>
        </g>
      )}
      {/* papan nama */}
      <rect x={x + 9} y={y + 7} width={28} height={6} fill="#f4ead7" stroke="#7c5430" strokeWidth={0.4} />
      <text x={x + 23} y={y + 11.4} fontSize={4} fill="#3b2416" fontFamily="monospace" fontWeight="bold" textAnchor="middle">{name.toUpperCase()}</text>
    </g>
  );
}

function sky(hour: number): { top: string; bottom: string; night: boolean; sun: string | null } {
  if (hour >= 5 && hour < 7) return { top: '#f59e7a', bottom: '#fde3a7', night: false, sun: '#ffd166' };
  if (hour >= 7 && hour < 16) return { top: '#6cc4f5', bottom: '#c7ecff', night: false, sun: '#ffe066' };
  if (hour >= 16 && hour < 19) return { top: '#f08a5d', bottom: '#f9c784', night: false, sun: '#ff9f43' };
  return { top: '#0f1b3d', bottom: '#253a6b', night: true, sun: null };
}

export function PixelOffice({ agents, pendingByAgent, selectedId, onSelect, todayArticles }: {
  agents: OfficeAgent[]; pendingByAgent: Record<string, number>; selectedId: string | null; onSelect: (id: string) => void; todayArticles?: number;
}) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => { const t = window.setInterval(() => setNow(new Date()), 30_000); return () => window.clearInterval(t); }, []);
  const wib = useMemo(() => {
    const p = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(now);
    const h = Number(p.find((x) => x.type === 'hour')?.value ?? 12), m = Number(p.find((x) => x.type === 'minute')?.value ?? 0);
    return { h, m };
  }, [now]);
  const s = sky(wib.h);
  const byId = new Map(agents.map((a) => [a.id, a]));
  const totalPending = Object.values(pendingByAgent).reduce((a, b) => a + b, 0);
  const hourAngle = ((wib.h % 12) + wib.m / 60) * 30, minAngle = wib.m * 6;

  return (
    <div className="overflow-hidden rounded-2xl border-4 border-[#2b2f36] bg-[#2b2f36] shadow-lg">
      <svg viewBox="0 0 240 150" shapeRendering="crispEdges" className="block h-auto w-full select-none" role="img"
        aria-label={`Kantor virtual: ${agents.length} karyawan agent, ${totalPending} draf menunggu persetujuan`}>
        <defs>
          <pattern id="px-floor" width="12" height="12" patternUnits="userSpaceOnUse">
            <rect width="12" height="12" fill="#d8c3a0" /><rect width="6" height="6" fill="#cdb48d" /><rect x="6" y="6" width="6" height="6" fill="#cdb48d" />
          </pattern>
          <linearGradient id="px-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={s.top} /><stop offset="1" stopColor={s.bottom} /></linearGradient>
        </defs>
        {/* dinding */}
        <rect width="240" height="40" fill="#e9e2d0" />
        <rect y="0" width="240" height="3" fill="#cfc4ab" />
        <rect y="36" width="240" height="4" fill="#9b7a52" />
        {/* jendela */}
        {[14, 186].map((wx) => (
          <g key={wx}>
            <rect x={wx} y={7} width={40} height={24} fill="#7c5430" />
            <rect x={wx + 2} y={9} width={36} height={20} fill="url(#px-sky)" />
            {s.sun && <rect x={wx + 26} y={12} width={5} height={5} fill={s.sun} />}
            {s.night && <>{[[6, 4], [14, 8], [24, 5], [31, 12], [10, 14]].map(([sx, sy]) => <rect key={`${sx}-${sy}`} x={wx + 2 + sx} y={9 + sy} width={1} height={1} fill="#fff" className="px-blink-slow" />)}<rect x={wx + 28} y={11} width={4} height={4} fill="#f1f5f9" /></>}
            {!s.night && <><rect x={wx + 6} y={15} width={8} height={2} fill="#ffffff" opacity={0.85} className="px-cloud" /><rect x={wx + 8} y={14} width={4} height={1} fill="#ffffff" opacity={0.85} className="px-cloud" /></>}
            <rect x={wx + 19} y={9} width={2} height={20} fill="#7c5430" /><rect x={wx + 2} y={18} width={36} height={2} fill="#7c5430" />
            <rect x={wx - 1} y={31} width={42} height={2} fill="#6a4728" />
          </g>
        ))}
        {/* papan tulis */}
        <rect x={68} y={6} width={58} height={27} fill="#7c5430" />
        <rect x={70} y={8} width={54} height={23} fill="#f8fafc" />
        <text x={73} y={14} fontSize={4} fill="#17261f" fontFamily="monospace" fontWeight="bold">KEDIAMAN HQ</text>
        <text x={73} y={20} fontSize={3.4} fill="#334155" fontFamily="monospace">Draf menunggu: {totalPending}</text>
        <text x={73} y={25} fontSize={3.4} fill="#334155" fontFamily="monospace">Artikel: {Number.isFinite(todayArticles) ? todayArticles : '-'}/5</text>
        <rect x={110} y={21} width={2} height={8} fill="#3ddc6a" /><rect x={113} y={18} width={2} height={11} fill="#f5c542" /><rect x={116} y={14} width={2} height={15} fill="#2f6f8f" />
        {/* jam dinding (WIB) */}
        <circle cx={144} cy={18} r={8} fill="#7c5430" /><circle cx={144} cy={18} r={6.5} fill="#fffdf5" />
        <line x1={144} y1={18} x2={144 + 3.5 * Math.sin((hourAngle * Math.PI) / 180)} y2={18 - 3.5 * Math.cos((hourAngle * Math.PI) / 180)} stroke="#1f2937" strokeWidth={1} shapeRendering="auto" />
        <line x1={144} y1={18} x2={144 + 5 * Math.sin((minAngle * Math.PI) / 180)} y2={18 - 5 * Math.cos((minAngle * Math.PI) / 180)} stroke="#1f2937" strokeWidth={0.6} shapeRendering="auto" />
        <text x={144} y={32} fontSize={3.2} fill="#475569" fontFamily="monospace" textAnchor="middle">{String(wib.h).padStart(2, '0')}:{String(wib.m).padStart(2, '0')} WIB</text>
        {/* lantai */}
        <rect y="40" width="240" height="110" fill="url(#px-floor)" />
        {/* karpet tengah */}
        <rect x={84} y={78} width={72} height={16} fill="#17261f" opacity={0.18} />
        {/* tanaman */}
        {[[4, 44], [226, 44], [226, 128]].map(([px, py]) => (
          <g key={`${px}-${py}`}>
            <rect x={px + 1} y={py + 8} width={8} height={7} fill="#9a5b34" /><rect x={px} y={py + 7} width={10} height={2} fill="#b06c3e" />
            <rect x={px + 3} y={py} width={4} height={8} fill="#2f8f4e" /><rect x={px} y={py + 2} width={4} height={4} fill="#3fae5f" /><rect x={px + 6} y={py + 1} width={4} height={5} fill="#3fae5f" />
          </g>
        ))}
        {/* mesin kopi & dispenser */}
        <g>
          <rect x={4} y={120} width={12} height={16} fill="#475569" /><rect x={5} y={121} width={10} height={5} fill="#1e293b" />
          <rect x={7} y={129} width={6} height={4} fill="#e2e8f0" /><rect x={8} y={127} width={1} height={2} fill="#94a3b8" className="px-steam" />
          <text x={10} y={142} fontSize={3} fill="#3b2416" fontFamily="monospace" textAnchor="middle">KOPI</text>
        </g>
        {/* meja-meja karyawan */}
        {DESKS.map((d) => {
          const a = byId.get(d.id);
          if (!a) return null;
          return (
            <Desk key={d.id} agentId={d.id} x={d.x} y={d.y} name={a.name} mood={moodOf(a, todayArticles)}
              pending={pendingByAgent[d.id] ?? 0} selected={selectedId === d.id} onSelect={() => onSelect(d.id)} />
          );
        })}
      </svg>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 bg-[#2b2f36] px-3 py-2 font-mono text-[11px] text-slate-200">
        {([['#3ddc6a', 'Normal'], ['#f5c542', 'Sedang bekerja'], ['#ef4444', 'Ada kendala'], ['#9ca3af', 'Libur']] as const).map(([c, l]) => (
          <span key={l} className="inline-flex items-center gap-1.5"><span className="inline-block size-2.5 rotate-45" style={{ background: c }} />{l}</span>
        ))}
        <span className="ml-auto text-slate-400">Klik karakter untuk lihat detail</span>
      </div>
    </div>
  );
}
