import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Layout } from '@/components/layout/Layout';
import { usePrograms } from '@/hooks/useCMS';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, Clock, Users, ArrowRight } from 'lucide-react';
import pilatesImage from '@/assets/pilates-class.jpg';
import hiitImage from '@/assets/hiit-class.jpg';
import gymInterior from '@/assets/gym-interior.jpg';

const fallbackImages = [pilatesImage, hiitImage, gymInterior];

const ProgramDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: programs, isLoading } = usePrograms();

  const program = programs?.find(p => p.id === id);
  const programIndex = programs?.findIndex(p => p.id === id) || 0;

  if (isLoading) {
    return (
      <Layout>
        <div className="pt-20 pb-16">
          <div className="container mx-auto px-4 max-w-5xl">
            <Skeleton className="h-[420px] w-full rounded-2xl mb-10" />
            <Skeleton className="h-12 w-2/3 mb-4" />
            <Skeleton className="h-6 w-full mb-2" />
            <Skeleton className="h-6 w-3/4" />
          </div>
        </div>
      </Layout>
    );
  }

  if (!program) {
    return (
      <Layout>
        <div className="pt-20 pb-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="font-serif text-4xl mb-4 font-bold">Program Tidak Ditemukan</h1>
            <p className="text-muted-foreground mb-8">Promosi yang Anda cari tidak tersedia.</p>
            <Button onClick={() => navigate('/tentang-kami')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Kembali
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  const heroImage = program.image_url || fallbackImages[programIndex % fallbackImages.length];

  return (
    <Layout>
      {/* Hero */}
      <section className="relative h-[55vh] md:h-[70vh] overflow-hidden">
        <img
          src={heroImage}
          alt={program.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/20" />

        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="absolute top-24 left-4 md:left-8 z-10"
        >
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate('/tentang-kami')}
            className="backdrop-blur-md bg-background/60 border border-border/40"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali
          </Button>
        </motion.div>

        <div className="absolute inset-x-0 bottom-0 pb-10 md:pb-16">
          <div className="container mx-auto px-4 max-w-5xl">
            {program.category && (
              <motion.span
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-block px-4 py-1.5 bg-primary/15 backdrop-blur-sm border border-primary/30 text-primary text-xs tracking-widest uppercase rounded-full mb-4"
              >
                {program.category}
              </motion.span>
            )}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="font-serif text-4xl md:text-6xl lg:text-7xl font-semibold text-primary leading-tight max-w-4xl"
            >
              {program.name}
            </motion.h1>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-14 md:py-20">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 lg:gap-14">
            {/* Main */}
            <motion.article
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="lg:col-span-2"
            >
              <div className="text-sm uppercase tracking-[0.2em] text-muted-foreground mb-4">
                Tentang Promosi
              </div>
              <div className="prose prose-invert max-w-none">
                <p className="text-lg md:text-xl leading-relaxed text-foreground/90 whitespace-pre-line">
                  {program.description || 'Nikmati penawaran eksklusif yang dirancang khusus untuk momen spesial Anda.'}
                </p>
              </div>

              {/* CTA */}
              <div className="mt-10 pt-8 border-t border-border/50">
                {program.cta_link ? (
                  <a
                    href={program.cta_link}
                    target={program.cta_link.startsWith('http') ? '_blank' : undefined}
                    rel={program.cta_link.startsWith('http') ? 'noopener noreferrer' : undefined}
                  >
                    <Button size="lg" className="w-full md:w-auto group">
                      {program.cta_label || 'Reservasi Sekarang'}
                      <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </a>
                ) : (
                  <Button size="lg" className="w-full md:w-auto group">
                    {program.cta_label || 'Reservasi Sekarang'}
                    <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                )}
              </div>
            </motion.article>

            {/* Sidebar */}
            <motion.aside
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="lg:col-span-1"
            >
              <div className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-sm p-6 lg:sticky lg:top-28">
                <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-5">
                  Informasi
                </div>
                <ul className="space-y-5">
                  <li className="flex items-start gap-4">
                    <div className="p-2.5 bg-primary/10 rounded-lg shrink-0">
                      <Calendar className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Ketersediaan</p>
                      <p className="font-medium mt-0.5">Jadwal Fleksibel</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-4">
                    <div className="p-2.5 bg-primary/10 rounded-lg shrink-0">
                      <Clock className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Durasi</p>
                      <p className="font-medium mt-0.5">Sesuai Program</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-4">
                    <div className="p-2.5 bg-primary/10 rounded-lg shrink-0">
                      <Users className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Kapasitas</p>
                      <p className="font-medium mt-0.5">Kuota Terbatas</p>
                    </div>
                  </li>
                </ul>
              </div>
            </motion.aside>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default ProgramDetail;
