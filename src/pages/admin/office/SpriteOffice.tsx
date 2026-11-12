// Kantor virtual bergaya game pixel isometrik, memakai seni pixel default dari
// Claude-Office oleh W17ANT (https://github.com/W17ant/Claude-Office, lisensi MIT — lihat /office/LICENSE-Claude-Office.txt).
// Skin "Dunder Mifflin" proyek itu tidak dipakai. Tata letak (persen dari panggung 756×565) mengikuti main-office mereka.
import { useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

export type OfficeAgent = {
  id: string; name: string; role: string; external: boolean; is_active: boolean;
  last_status: string | null; last_summary: string | null; last_run_at: string | null;
};

type Mood = 'kerja' | 'normal' | 'gagal' | 'libur' | 'tunggu';
export function moodOf(a: OfficeAgent, todayArticles?: number): Mood {
  if (!a.is_active) return 'libur';
  if (a.last_status === 'berjalan') return 'kerja';
  if (a.last_status === 'gagal') return 'gagal';
  if (a.id === 'chat') return 'kerja';
  if (a.id === 'writer' && Number.isFinite(todayArticles) && (todayArticles as number) < 5) return 'kerja';
  return a.last_status ? 'normal' : 'tunggu';
}

const STAGE_W = 756;
const STAGE_H = Math.round((STAGE_W * 3584) / 4800);
const A = '/office';

type Facing = 'front-left' | 'front-right' | 'rear-left' | 'rear-right';
const FURNITURE: { src: string; x: number; y: number; h: number; z?: number }[] = [
  { src: 'standing-desk-left-rear', x: 42.4, y: 50.4, h: 102 }, { src: 'standing-desk-left-front', x: 46.7, y: 53, h: 106 }, { src: 'standing-desk-right-front', x: 39.9, y: 55.2, h: 106 },
  { src: 'standing-desk-left-rear', x: 31.4, y: 64.8, h: 102 }, { src: 'standing-desk-left-front', x: 35.4, y: 67.5, h: 106 }, { src: 'standing-desk-right-front', x: 27.9, y: 70, h: 106 },
  { src: 'standing-desk-left-rear', x: 59, y: 73.7, h: 102 }, { src: 'standing-desk-left-front', x: 62.6, y: 76, h: 106 }, { src: 'standing-desk-right-front', x: 55.4, y: 78.7, h: 106 },
  { src: 'standing-desk-right-rear', x: 66.6, y: 71.1, h: 102 },
  { src: 'coffee-on', x: 78.5, y: 50.2, h: 51 }, { src: 'filling-closed', x: 45, y: 56.5, h: 56 },
  { src: 'monstera-plant', x: 91.9, y: 64.7, h: 71 }, { src: 'snake-plant', x: 43.2, y: 37.9, h: 63 }, { src: 'money-tree', x: 32, y: 71.2, h: 63 },
  { src: 'money-tree', x: 89.2, y: 65.7, h: 63 }, { src: 'monstera-plant', x: 60.2, y: 80.4, h: 71 }, { src: 'printer-working', x: 85.4, y: 56.8, h: 69 },
];

// Tempat duduk tiap karyawan + karakter yang dipakai
const SEATS: Record<string, { x: number; y: number; z: number; facing: Facing; sprite: string }> = {
  sales: { x: 26.9, y: 59.2, z: 40, facing: 'front-left', sprite: 'Frontend-dev-1' },
  seo: { x: 38.8, y: 43.6, z: 30, facing: 'front-left', sprite: 'employee-3' },
  social: { x: 55.2, y: 66.8, z: 55, facing: 'front-left', sprite: 'dev-2' },
  guard: { x: 68.7, y: 66.2, z: 55, facing: 'front-right', sprite: 'dev-1' },
  writer: { x: 37.9, y: 68.2, z: 85, facing: 'rear-right', sprite: 'employee-2' },
  chat: { x: 48.9, y: 52.9, z: 70, facing: 'rear-right', sprite: 'employee-1' },
};

const PLUMBOB: Record<Mood, string> = { kerja: '#f5c542', normal: '#3ddc6a', gagal: '#ef4444', libur: '#9ca3af', tunggu: '#3ddc6a' };
const FX: Partial<Record<Mood, string>> = { kerja: 'typing', libur: 'sleeping', gagal: 'build-failed' };

function wibHour(now: Date) {
  const p = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(now);
  return { h: Number(p.find((x) => x.type === 'hour')?.value ?? 12), m: Number(p.find((x) => x.type === 'minute')?.value ?? 0) };
}

export function SpriteOffice({ agents, pendingByAgent, selectedId, onSelect, todayArticles }: {
  agents: OfficeAgent[]; pendingByAgent: Record<string, number>; selectedId: string | null; onSelect: (id: string) => void; todayArticles?: number;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const update = () => setScale(Math.max(0.2, el.clientWidth / STAGE_W));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  useEffect(() => { const t = window.setInterval(() => setNow(new Date()), 60_000); return () => window.clearInterval(t); }, []);
  const { h, m } = wibHour(now);
  const night = h >= 18 || h < 6;
  const byId = useMemo(() => new Map(agents.map((a) => [a.id, a])), [agents]);
  const totalPending = Object.values(pendingByAgent).reduce((a, b) => a + b, 0);

  return (
    <div className="overflow-hidden rounded-2xl bg-[#11162a] shadow-lg ring-1 ring-black/10">
      <div ref={wrapRef} className="relative w-full" style={{ height: STAGE_H * scale }}>
        <div className="absolute left-0 top-0 origin-top-left" style={{ width: STAGE_W, height: STAGE_H, transform: `scale(${scale})` }}
          role="img" aria-label={`Kantor virtual Kediaman: ${agents.length} karyawan agent, ${totalPending} draf menunggu persetujuan`}>
          <img src={`${A}/room/office-${night ? 'night' : 'day'}.webp`} alt="" draggable={false} className="absolute inset-0 h-full w-full select-none" />
          {/* papan nama pintu: KEDIAMAN */}
          <div className="absolute rounded-[2px] bg-[#1f2a37] text-center font-mono text-[6.5px] font-bold leading-[14px] tracking-wider text-[#f5d27a]"
            style={{ left: '66.6%', top: '27.6%', width: 36, transform: 'skewY(17deg)', zIndex: 5 }}>KEDIAMAN</div>
          {/* jam & papan info di dinding */}
          <div className="absolute rounded bg-black/70 px-1.5 py-0.5 font-mono text-[9px] font-bold text-[#7CFC9A]" style={{ left: '4.6%', top: '25.5%', zIndex: 5 }}>
            {String(h).padStart(2, '0')}:{String(m).padStart(2, '0')} WIB
          </div>
          {FURNITURE.map((f, i) => (
            <img key={i} src={`${A}/furniture/${f.src}.webp`} alt="" draggable={false} className="pointer-events-none absolute select-none"
              style={{ left: `${f.x}%`, top: `${f.y}%`, height: f.h, transform: 'translate(-50%, -100%)', zIndex: f.z ?? Math.round(f.y) }} />
          ))}
          {Object.entries(SEATS).map(([id, seat]) => {
            const a = byId.get(id);
            if (!a) return null;
            const mood = moodOf(a, todayArticles);
            const pending = pendingByAgent[id] ?? 0;
            const fx = FX[mood] ?? (pending > 0 ? 'need-coffee' : mood === 'normal' && a.last_run_at && Date.now() - new Date(a.last_run_at).getTime() < 15 * 60_000 ? 'thumb-up' : null);
            const selected = selectedId === id;
            return (
              <button key={id} type="button" onClick={() => onSelect(id)} aria-label={`${a.name}, ${a.role}: lihat detail`} aria-pressed={selected}
                className="group absolute flex flex-col items-center focus:outline-none"
                style={{ left: `${seat.x}%`, top: `${seat.y}%`, transform: 'translate(-50%, -100%)', zIndex: selected ? 200 : seat.z }}>
                {/* label nama + plumbob */}
                <span className={cn('mb-0.5 whitespace-nowrap rounded-full px-1.5 py-px font-mono text-[8px] font-bold shadow transition',
                  selected ? 'bg-[#f5d27a] text-[#1f2a37]' : 'bg-white/90 text-[#1f2a37] group-hover:bg-[#f5d27a]')}>{a.name}</span>
                <span className="kdm-plumbob mb-0.5 block size-[9px] rotate-45 border border-black/40" style={{ background: PLUMBOB[mood] }} />
                <span className="relative">
                  <img src={`${A}/chars/${seat.sprite}-${seat.facing}.webp`} alt="" draggable={false}
                    className={cn('block h-[78px] w-auto select-none drop-shadow-[0_2px_0_rgba(0,0,0,0.25)]', mood === 'kerja' ? 'kdm-char-work' : 'kdm-char-idle', mood === 'libur' && 'opacity-80 saturate-50')} />
                  {fx && <img src={`${A}/fx/${fx}.webp`} alt="" className="kdm-fx absolute -right-3 top-1 h-[18px] w-auto" />}
                  {pending > 0 && (
                    <span className="absolute -left-2 top-3 grid min-w-[14px] place-items-center rounded-full bg-[#ef4444] px-1 font-mono text-[8px] font-bold leading-[14px] text-white ring-1 ring-white">{pending > 9 ? '9+' : pending}</span>
                  )}
                  {selected && <span className="absolute -bottom-1 left-1/2 -z-10 h-2 w-9 -translate-x-1/2 rounded-[50%] bg-[#f5d27a]/80 blur-[1px]" />}
                </span>
              </button>
            );
          })}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 bg-[#1f2a37] px-3 py-2 font-mono text-[11px] text-slate-200">
        {([['#3ddc6a', 'Normal'], ['#f5c542', 'Sedang bekerja'], ['#ef4444', 'Ada kendala'], ['#9ca3af', 'Libur']] as const).map(([c, l]) => (
          <span key={l} className="inline-flex items-center gap-1.5"><span className="inline-block size-2.5 rotate-45" style={{ background: c }} />{l}</span>
        ))}
        <span className="ml-auto text-slate-400">Klik karakter untuk detail · Seni pixel: <a href="https://github.com/W17ant/Claude-Office" target="_blank" rel="noreferrer" className="underline">Claude-Office</a> (MIT)</span>
      </div>
    </div>
  );
}
