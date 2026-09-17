import { useState } from 'react';
import { MessageCircle, X, Phone, ArrowUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { useSiteSettings } from '@/hooks/useCMS';
import { useLocation } from 'react-router-dom';
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation';
import {
  Message,
  MessageContent,
  MessageResponse,
} from '@/components/ai-elements/message';
import {
  PromptInput,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
  type PromptInputMessage,
} from '@/components/ai-elements/prompt-input';
import { Shimmer } from '@/components/ai-elements/shimmer';

type Msg = { role: 'user' | 'assistant'; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

const QUICK_QUESTIONS = [
  'Saya ingin lihat pilihan venue',
  'Boleh info kisaran harganya?',
  'Bagaimana cara booking?',
];

export function FloatingChat() {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { data: settings } = useSiteSettings();

  const waNumber = settings?.phone?.replace(/[^0-9]/g, '') || '6281117797567';
  const waLink = settings?.whatsapp_link || `https://wa.me/${waNumber}`;

  if (location.pathname === '/venue-only') return null;

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;
    const userMsg: Msg = { role: 'user', content: text.trim() };
    const allMessages = [...messages, userMsg];
    setMessages(allMessages);
    setInput('');
    setIsLoading(true);

    let assistantSoFar = '';
    
    try {
      const resp = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: allMessages }),
      });

      if (!resp.ok || !resp.body) {
        throw new Error('Failed');
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantSoFar += content;
              setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === 'assistant') {
                  return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
                }
                return [...prev, { role: 'assistant', content: assistantSoFar }];
              });
            }
          } catch {
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Maaf, terjadi kesalahan. Silakan coba lagi atau hubungi kami via WhatsApp. 🙏' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = ({ text }: PromptInputMessage) => {
    sendMessage(text);
  };

  return (
    <>
      {/* Floating Button */}
      <AnimatePresence>
        {!open && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="fixed bottom-4 right-4 z-50 sm:bottom-6 sm:right-6"
          >
            <Button
              type="button"
              size="icon"
              onClick={() => setOpen(true)}
              className="size-14 rounded-2xl shadow-2xl transition-transform hover:scale-105"
              aria-label="Buka concierge Kediaman"
            >
              <MessageCircle className="size-6" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            role="dialog"
            aria-label="Concierge Kediaman"
            className="fixed bottom-3 right-3 z-50 flex h-[min(640px,calc(100dvh-1.5rem))] w-[min(368px,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-[2rem] border border-border bg-card shadow-2xl sm:bottom-6 sm:right-6"
          >
            {/* Header */}
            <div className="relative flex shrink-0 items-center justify-between bg-secondary px-5 pb-8 pt-5 text-secondary-foreground">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="flex size-12 items-center justify-center overflow-hidden rounded-2xl bg-background ring-4 ring-background/20">
                    {settings?.logo_url ? (
                      <img
                        src={settings.logo_url}
                        alt="Logo Kediaman Corp"
                        className="size-full object-contain p-1.5"
                      />
                    ) : (
                      <span className="font-serif text-lg font-bold text-foreground">K</span>
                    )}
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 size-3.5 rounded-full border-2 border-secondary bg-primary" aria-hidden="true" />
                </div>
                <div>
                  <p className="font-serif text-lg font-semibold leading-tight">Tim Kediaman</p>
                  <p className="mt-0.5 text-xs text-secondary-foreground/75">Online · Siap membantu</p>
                </div>
              </div>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={() => setOpen(false)}
                aria-label="Tutup concierge"
                className="min-h-11 min-w-11 rounded-full text-secondary-foreground hover:bg-background/10 hover:text-secondary-foreground"
              >
                <X className="size-5" />
              </Button>
            </div>

            {/* Messages */}
            <Conversation className="-mt-4 rounded-t-[2rem] bg-background">
              <ConversationContent className="gap-4 px-5 pb-5 pt-7">
                {messages.length === 0 && (
                  <div className="space-y-5">
                    <Message from="assistant" className="max-w-[92%]">
                      <MessageContent className="text-[15px] leading-relaxed">
                        <p>Halo, selamat datang.</p>
                        <p className="text-muted-foreground">Sedang mencari venue untuk acara apa? Ceritakan sedikit, kami bantu arahkan pilihan yang paling cocok.</p>
                      </MessageContent>
                    </Message>
                    <div className="space-y-2" aria-label="Pertanyaan yang sering ditanyakan">
                      <p className="text-xs text-muted-foreground">Anda bisa mulai dari sini:</p>
                      {QUICK_QUESTIONS.map((question) => (
                        <Button
                          key={question}
                          type="button"
                          variant="outline"
                          onClick={() => sendMessage(question)}
                          className="h-auto min-h-11 w-full justify-between whitespace-normal rounded-xl px-3 py-2.5 text-left text-sm font-normal"
                        >
                          <span>{question}</span>
                          <ArrowUp className="size-3.5 rotate-45 text-primary" />
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {messages.map((message, index) => (
                  <Message key={`${message.role}-${index}`} from={message.role}>
                    <MessageContent className={message.role === 'user'
                      ? 'rounded-2xl rounded-br-sm bg-primary px-3.5 py-2.5 text-primary-foreground'
                      : 'px-0 py-0 text-[15px] leading-relaxed'}
                    >
                      {message.role === 'assistant' ? (
                        <MessageResponse>{message.content}</MessageResponse>
                      ) : (
                        message.content
                      )}
                    </MessageContent>
                  </Message>
                ))}

                {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
                  <div className="flex items-center gap-2 text-xs" role="status" aria-live="polite">
                    <span className="flex gap-1" aria-hidden="true">
                      <span className="size-1.5 animate-bounce rounded-full bg-primary" />
                      <span className="size-1.5 animate-bounce rounded-full bg-primary [animation-delay:150ms]" />
                      <span className="size-1.5 animate-bounce rounded-full bg-primary [animation-delay:300ms]" />
                    </span>
                    <Shimmer className="font-medium">Tim Kediaman sedang menyiapkan jawaban...</Shimmer>
                  </div>
                )}
              </ConversationContent>
              <ConversationScrollButton aria-label="Lihat pesan terbaru" className="bottom-2" />
            </Conversation>

            {/* WhatsApp CTA */}
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="mx-4 mt-2 flex min-h-11 items-center justify-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-3 py-2 text-xs font-medium text-primary transition-colors hover:bg-primary/15"
            >
              <Phone className="w-3.5 h-3.5" />
              Ingin dibantu langsung? Lanjut ke WhatsApp
            </a>

            {/* Input */}
            <div className="shrink-0 bg-background p-3 pt-2">
              <PromptInput onSubmit={handleSubmit} className="rounded-2xl border-border bg-card shadow-sm">
                <PromptInputTextarea
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder="Ceritakan kebutuhan acara Anda..."
                  disabled={isLoading}
                  className="min-h-11 max-h-24 text-sm placeholder:text-muted-foreground"
                />
                <PromptInputFooter className="justify-end px-2 pb-2">
                  <PromptInputSubmit
                    status={isLoading ? 'streaming' : 'ready'}
                    disabled={!input.trim() || isLoading}
                    aria-label="Kirim pesan"
                    className="size-9 rounded-xl"
                  />
                </PromptInputFooter>
              </PromptInput>
              <p className="mt-2 text-center text-[10px] text-muted-foreground">Biasanya merespons dalam beberapa saat</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
