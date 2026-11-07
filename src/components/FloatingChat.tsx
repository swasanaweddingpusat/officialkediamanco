// Chat website Kediaman: dibalas Claude dengan gaya admin WhatsApp (gelembung pendek, jeda mengetik).
// Riwayat disimpan di sessionStorage agar tetap ada saat pindah halaman.
import { useEffect, useRef, useState, type MouseEvent } from 'react';
import { MessageCircle, X, Phone, ArrowUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { useSiteSettings } from '@/hooks/useCMS';
import { useLocation, useNavigate } from 'react-router-dom';
import { Conversation, ConversationContent, ConversationScrollButton } from '@/components/ai-elements/conversation';
import { MessageResponse } from '@/components/ai-elements/message';
import { PromptInput, PromptInputFooter, PromptInputSubmit, PromptInputTextarea, type PromptInputMessage } from '@/components/ai-elements/prompt-input';
import { track } from '@/lib/analytics';
import { cn } from '@/lib/utils';

type Msg = { id: string; role: 'user' | 'assistant'; content: string; turn: number; at: number };

const CHAT_URL = `${String(import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')}/functions/v1/chat`;
const STORE_KEY = 'kdm_chat_v2';

const QUICK_QUESTIONS = [
  'Mau cek tanggal buat nikahan',
  'Kisaran harga paketnya berapa ya?',
  'Ada venue yang muat 1.000 tamu?',
];

const greeting = () => {
  const h = new Date().getHours();
  if (h < 11) return 'Selamat pagi';
  if (h < 15) return 'Selamat siang';
  if (h < 18) return 'Selamat sore';
  return 'Selamat malam';
};
const uid = () => Math.random().toString(36).slice(2, 10);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const clock = (t: number) => new Date(t).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

function loadStored(): Msg[] {
  try {
    const raw = sessionStorage.getItem(STORE_KEY);
    const parsed = raw ? (JSON.parse(raw) as Msg[]) : [];
    return Array.isArray(parsed) ? parsed.slice(-60) : [];
  } catch {
    return [];
  }
}

/** Riwayat untuk API: gelembung asisten dalam satu giliran digabung lagi dengan pemisah "---". */
function toHistory(msgs: Msg[]) {
  const out: { role: 'user' | 'assistant'; content: string }[] = [];
  let lastKey = '';
  for (const m of msgs) {
    const key = `${m.role}-${m.turn}`;
    const last = out[out.length - 1];
    if (last && key === lastKey && m.role === 'assistant') last.content += `\n---\n${m.content}`;
    else out.push({ role: m.role, content: m.content });
    lastKey = key;
  }
  return out.slice(-24);
}

export function FloatingChat({ initiallyOpen = false }: { initiallyOpen?: boolean }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(initiallyOpen);
  const [messages, setMessages] = useState<Msg[]>(loadStored);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const busy = useRef(false);
  const { data: settings } = useSiteSettings();

  const waNumber = settings?.phone?.replace(/[^0-9]/g, '').replace(/^0/, '62') || '6281117797567';
  const waLink = settings?.whatsapp_link || `https://wa.me/${waNumber}`;

  useEffect(() => {
    try { sessionStorage.setItem(STORE_KEY, JSON.stringify(messages.slice(-60))); } catch { /* storage diblokir */ }
  }, [messages]);

  if (location.pathname === '/venue-only') return null;

  const sendMessage = async (raw: string) => {
    const text = raw.trim();
    if (!text || busy.current) return;
    busy.current = true;
    const turn = (messages[messages.length - 1]?.turn ?? 0) + 1;
    const userMsg: Msg = { id: uid(), role: 'user', content: text.slice(0, 2000), turn, at: Date.now() };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput('');
    if (messages.length === 0) track('chat_start', { page: location.pathname });

    // Jeda kecil sebelum "mengetik..." supaya terasa seperti dibaca dulu
    const started = Date.now();
    await sleep(500 + Math.random() * 500);
    setTyping(true);
    let bubbles: string[] = [];
    try {
      const resp = await fetch(CHAT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: toHistory(next), page: location.pathname }),
      });
      const data = (await resp.json().catch(() => ({}))) as { messages?: string[]; error?: string; lead_saved?: boolean };
      bubbles = resp.ok && Array.isArray(data.messages) && data.messages.length
        ? data.messages
        : [data.error || 'Maaf kak, chatnya lagi gangguan. Boleh lanjut via WhatsApp dulu ya 🙏'];
      if (data.lead_saved) track('generate_lead', { lead_source: 'chat' });
    } catch {
      bubbles = ['Waduh, koneksinya lagi putus-putus nih kak. Coba kirim lagi ya, atau langsung WhatsApp kami.'];
    }

    // Tampilkan gelembung satu per satu dengan jeda mengetik yang wajar
    const minFirst = 1200 + Math.min(1800, bubbles[0].length * 18);
    const waited = Date.now() - started;
    if (waited < minFirst) await sleep(minFirst - waited);
    for (let i = 0; i < bubbles.length; i++) {
      if (i > 0) {
        setTyping(true);
        await sleep(Math.min(2600, 700 + bubbles[i].length * 22));
      }
      setTyping(false);
      const bubble: Msg = { id: uid(), role: 'assistant', content: bubbles[i], turn, at: Date.now() };
      setMessages((prev) => [...prev, bubble]);
      if (i < bubbles.length - 1) await sleep(250);
    }
    setTyping(false);
    busy.current = false;
  };

  const handleSubmit = ({ text }: PromptInputMessage) => { void sendMessage(text); };

  // Tautan internal (/lokasi/...) dibuka tanpa memuat ulang halaman
  const onLinkClick = (e: MouseEvent<HTMLDivElement>) => {
    const a = (e.target as HTMLElement).closest('a');
    const href = a?.getAttribute('href') ?? '';
    if (a && href.startsWith('/') && !e.metaKey && !e.ctrlKey) {
      e.preventDefault();
      navigate(href);
      if (window.matchMedia('(max-width: 640px)').matches) setOpen(false);
    }
  };

  const resetChat = () => {
    if (busy.current) return;
    setMessages([]);
  };

  return (
    <>
      <AnimatePresence>
        {!open && (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="kdm-chat-launcher fixed right-4 z-50 md:right-6">
            <Button type="button" size="icon" onClick={() => setOpen(true)} className="relative size-14 rounded-2xl shadow-2xl transition-transform hover:scale-105" aria-label="Chat dengan Tim Kediaman">
              <MessageCircle className="size-6" />
              {messages.length === 0 && <span className="absolute -right-1 -top-1 size-3.5 rounded-full border-2 border-background bg-gold" aria-hidden="true" />}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            role="dialog"
            aria-label="Chat Tim Kediaman"
            className="fixed bottom-3 right-3 z-50 flex h-[min(640px,calc(100dvh-1.5rem))] w-[min(380px,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-2xl sm:bottom-6 sm:right-6"
          >
            {/* Header */}
            <div className="flex shrink-0 items-center justify-between bg-primary px-4 py-3.5 text-primary-foreground">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="flex size-11 items-center justify-center overflow-hidden rounded-full bg-white">
                    {settings?.logo_url ? <img src={settings.logo_url} alt="" className="size-full object-contain p-1.5" /> : <span className="text-lg font-extrabold text-primary">K</span>}
                  </div>
                  <span className="absolute bottom-0 right-0 size-3 rounded-full border-2 border-primary bg-emerald-400" aria-hidden="true" />
                </div>
                <div>
                  <p className="font-extrabold leading-tight">Tim Kediaman</p>
                  <p className="text-xs text-primary-foreground/75">{typing ? 'sedang mengetik…' : 'Online · biasanya membalas dalam 1 menit'}</p>
                </div>
              </div>
              <div className="flex items-center">
                {messages.length > 0 && (
                  <button type="button" onClick={resetChat} className="mr-1 rounded-full px-2.5 py-1 text-[11px] font-semibold text-primary-foreground/75 hover:bg-white/10">Chat baru</button>
                )}
                <Button type="button" size="icon" variant="ghost" onClick={() => setOpen(false)} aria-label="Tutup chat" className="min-h-11 min-w-11 rounded-full text-primary-foreground hover:bg-white/10 hover:text-primary-foreground">
                  <X className="size-5" />
                </Button>
              </div>
            </div>

            {/* Percakapan */}
            <Conversation className="bg-background">
              <ConversationContent className="gap-1.5 px-3.5 py-4" onClick={onLinkClick}>
                <p className="mx-auto mb-2 rounded-full bg-muted px-3 py-1 text-[11px] text-muted-foreground">Hari ini</p>

                {messages.length === 0 && (
                  <>
                    <Bubble role="assistant" first>{`${greeting()} kak 👋`}</Bubble>
                    <Bubble role="assistant">Ada yang bisa dibantu? Lagi cari venue buat acara apa nih?</Bubble>
                    <div className="mt-3 flex flex-wrap gap-2" aria-label="Pesan cepat">
                      {QUICK_QUESTIONS.map((q) => (
                        <button key={q} type="button" onClick={() => void sendMessage(q)} className="rounded-full border border-primary/30 bg-card px-3 py-1.5 text-left text-xs font-semibold text-primary hover:bg-secondary">
                          {q}
                        </button>
                      ))}
                    </div>
                  </>
                )}

                {messages.map((m, i) => {
                  const prev = messages[i - 1];
                  const first = !prev || prev.role !== m.role;
                  const nextMsg = messages[i + 1];
                  const last = !nextMsg || nextMsg.role !== m.role;
                  return (
                    <Bubble key={m.id} role={m.role} first={first} time={last ? clock(m.at) : undefined}>
                      {m.role === 'assistant' ? <MessageResponse>{m.content}</MessageResponse> : m.content}
                    </Bubble>
                  );
                })}

                {typing && (
                  <div className="mt-2 flex" role="status" aria-label="Tim Kediaman sedang mengetik">
                    <div className="flex items-center gap-1 rounded-2xl rounded-bl-md bg-muted px-4 py-3">
                      <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground/70" />
                      <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground/70 [animation-delay:150ms]" />
                      <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground/70 [animation-delay:300ms]" />
                    </div>
                  </div>
                )}
              </ConversationContent>
              <ConversationScrollButton aria-label="Lihat pesan terbaru" className="bottom-2" />
            </Conversation>

            {/* Input */}
            <div className="shrink-0 border-t border-border bg-card p-3">
              <PromptInput onSubmit={handleSubmit} className="rounded-2xl border-border bg-background shadow-none">
                <PromptInputTextarea
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder="Ketik pesan…"
                  className="min-h-11 max-h-24 text-sm placeholder:text-muted-foreground"
                />
                <PromptInputFooter className="justify-between px-2 pb-2">
                  <a href={waLink} target="_blank" rel="noopener noreferrer" onClick={() => track('whatsapp_click', { source: 'chat' })} className="inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[11px] font-semibold text-primary hover:bg-secondary">
                    <Phone className="size-3.5" />Lanjut di WhatsApp
                  </a>
                  <PromptInputSubmit status={typing ? 'streaming' : 'ready'} disabled={!input.trim() || typing} aria-label="Kirim pesan" className="size-9 rounded-xl">
                    <ArrowUp className="size-4" />
                  </PromptInputSubmit>
                </PromptInputFooter>
              </PromptInput>
              <p className="mt-2 text-center text-[10px] text-muted-foreground">Dibalas asisten virtual Tim Kediaman 24 jam · tim kami siap lanjut via WhatsApp</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function Bubble({ role, first, time, children }: { role: 'user' | 'assistant'; first?: boolean; time?: string; children: React.ReactNode }) {
  const mine = role === 'user';
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      className={cn('flex flex-col', mine ? 'items-end' : 'items-start', first && 'mt-2')}
    >
      <div
        className={cn(
          'max-w-[85%] px-3.5 py-2 text-[14px] leading-relaxed break-words [&_a]:font-semibold [&_a]:underline [&_p]:m-0 [&_ul]:my-1 [&_ul]:pl-4',
          mine ? 'rounded-2xl rounded-br-md bg-primary text-primary-foreground [&_a]:text-primary-foreground' : 'rounded-2xl rounded-bl-md bg-muted text-foreground [&_a]:text-primary',
        )}
      >
        {children}
      </div>
      {time && <span className="mt-0.5 px-1 text-[10px] text-muted-foreground">{time}</span>}
    </motion.div>
  );
}
