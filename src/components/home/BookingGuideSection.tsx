import { motion } from 'framer-motion';
import { Search, CalendarCheck, MessageCircle, PartyPopper, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { BookingDialog } from '@/components/booking/BookingDialog';

const steps = [
  {
    icon: Search,
    title: 'Pilih Venue',
    desc: 'Telusuri koleksi venue kami dan lihat kapasitas, fasilitas, serta galeri setiap ballroom.',
  },
  {
    icon: CalendarCheck,
    title: 'Cek Tanggal & Sesi',
    desc: 'Kalender menampilkan tanggal yang masih tersedia. Sesi yang sudah penuh otomatis tertutup.',
  },
  {
    icon: MessageCircle,
    title: 'Isi Form & Kirim',
    desc: 'Lengkapi data acara Anda. Permintaan tersimpan dan langsung terhubung ke WhatsApp tim kami.',
  },
  {
    icon: PartyPopper,
    title: 'Konfirmasi & Kunci Tanggal',
    desc: 'Tim kami mengirim penawaran dalam 1x24 jam. Tanggal terkunci setelah tanda jadi.',
  },
];

export function BookingGuideSection() {
  return (
    <section className="py-20 lg:py-28 border-t border-border/50">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="max-w-2xl mb-14">
          <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground mb-4">
            Panduan Booking
          </p>
          <h2 className="font-serif text-3xl lg:text-5xl font-bold leading-tight">
            Booking venue lewat website, hanya 4 langkah
          </h2>
          <p className="text-muted-foreground mt-4 leading-relaxed">
            Tidak perlu bingung. Semua proses reservasi bisa Anda mulai dari sini — gratis, tanpa
            komitmen, dan dibantu tim kami sampai tanggal acara Anda terkunci.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {steps.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ delay: i * 0.08, duration: 0.5 }}
              className="relative rounded-2xl border border-border/70 bg-card p-6 h-full"
            >
              <span className="absolute top-6 right-6 font-serif text-4xl text-primary/15 leading-none">
                0{i + 1}
              </span>
              <span className="inline-flex p-2.5 rounded-xl bg-secondary mb-5">
                <step.icon className="w-5 h-5 text-primary" />
              </span>
              <h3 className="font-serif text-xl font-bold mb-2">{step.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
            </motion.div>
          ))}
        </div>

        <div className="mt-12 flex flex-col sm:flex-row items-center gap-4">
          <BookingDialog>
            <Button size="lg" className="gap-2 w-full sm:w-auto">
              Mulai Booking Sekarang
              <ArrowRight className="w-4 h-4" />
            </Button>
          </BookingDialog>
          <Link to="/booking/track" className="w-full sm:w-auto">
            <Button size="lg" variant="outline" className="w-full sm:w-auto">
              Cek Status Booking
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
