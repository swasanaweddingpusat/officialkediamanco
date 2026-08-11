import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, MapPin, Calendar, Images, Expand, ArrowRight, Video as VideoIcon } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { useTrainerById } from '@/hooks/useCMS';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { LocationLightbox } from '@/components/location/LocationLightbox';
import { PortfolioVideo } from '@/components/portfolio/PortfolioVideo';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

const PortfolioDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { data: portfolio, isLoading } = useTrainerById(id);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const allImages = useMemo(() => {
    const imgs: string[] = [];
    if (portfolio?.photo_url) imgs.push(portfolio.photo_url);
    if (portfolio?.images) imgs.push(...portfolio.images);
    return imgs;
  }, [portfolio]);

  const handleLightboxNavigate = (direction: 'prev' | 'next') => {
    if (!lightboxImage) return;
    const currentIndex = allImages.indexOf(lightboxImage);
    if (currentIndex === -1) return;
    const newIndex = direction === 'prev'
      ? (currentIndex === 0 ? allImages.length - 1 : currentIndex - 1)
      : (currentIndex === allImages.length - 1 ? 0 : currentIndex + 1);
    setLightboxImage(allImages[newIndex]);
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="pt-16 lg:pt-24 pb-24">
          <div className="container mx-auto px-6 lg:px-12">
            <Skeleton className="h-6 w-32 mb-8" />
            <Skeleton className="h-[300px] lg:h-[500px] rounded-sm mb-8" />
            <Skeleton className="h-24 mb-6" />
          </div>
        </div>
      </Layout>
    );
  }

  if (!portfolio) {
    return (
      <Layout>
        <div className="pt-32 pb-32">
          <div className="container mx-auto px-6 lg:px-12 text-center">
            <Images className="w-12 h-12 text-muted-foreground/30 mx-auto mb-6" />
            <h1 className="font-serif text-3xl lg:text-4xl mb-4 font-bold">Portfolio Tidak Ditemukan</h1>
            <p className="text-muted-foreground mb-8">Portfolio yang Anda cari tidak tersedia.</p>
            <Link to="/portfolio">
              <Button className="rounded-full px-6 text-sm tracking-[0.05em] uppercase">
                <ChevronLeft className="w-4 h-4 mr-2" />
                Kembali
              </Button>
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  const location = portfolio.locations as { id: string; name: string } | null;

  return (
    <Layout>
      {/* Back */}
      <div className="pt-8 lg:pt-12 pb-4">
        <div className="container mx-auto px-6 lg:px-12">
          <Link to="/portfolio" className="inline-flex items-center gap-2 text-xs tracking-[0.1em] uppercase text-muted-foreground hover:text-primary transition-colors">
            <ChevronLeft className="w-3 h-3" />
            Kembali ke Portfolio
          </Link>
        </div>
      </div>

      {/* Hero Video */}
      {portfolio.hero_video_url && (
        <section className="pb-8">
          <div className="container mx-auto px-6 lg:px-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative aspect-video lg:aspect-[21/9] rounded-sm overflow-hidden bg-foreground"
            >
              <PortfolioVideo
                url={portfolio.hero_video_url}
                title={portfolio.name}
                className="w-full h-full object-cover"
              />
            </motion.div>
            <div className="mt-6">
              {portfolio.specialization && (
                <span className="text-primary text-[10px] tracking-[0.2em] uppercase block mb-3">{portfolio.specialization}</span>
              )}
              <h1 className="font-serif text-3xl lg:text-5xl tracking-tight font-bold">{portfolio.name}</h1>
            </div>
          </div>
        </section>
      )}

      {/* Hero Image */}
      {!portfolio.hero_video_url && portfolio.photo_url && (
        <section className="pb-8">
          <div className="container mx-auto px-6 lg:px-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative aspect-[21/9] rounded-sm overflow-hidden group cursor-pointer"
              onClick={() => setLightboxImage(portfolio.photo_url!)}
            >
              <img src={portfolio.photo_url} alt={portfolio.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-8 lg:p-12">
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  {portfolio.specialization && (
                    <span className="text-primary text-[10px] tracking-[0.2em] uppercase">{portfolio.specialization}</span>
                  )}
                  {location && (
                    <span className="text-muted-foreground text-[10px] flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {location.name}
                    </span>
                  )}
                </div>
                <h1 className="font-serif text-3xl lg:text-5xl tracking-tight text-white drop-shadow-lg font-bold">
                  {portfolio.name}
                </h1>
              </div>
              <div className="absolute top-6 right-6 p-3 bg-background/30 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                <Expand className="w-5 h-5 text-white" />
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* Content */}
      <section className="pb-24 lg:pb-32">
        <div className="container mx-auto px-6 lg:px-12">
          {!portfolio.photo_url && !portfolio.hero_video_url && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
              {portfolio.specialization && (
                <span className="text-primary text-[10px] tracking-[0.2em] uppercase block mb-3">{portfolio.specialization}</span>
              )}
              <h1 className="font-serif text-4xl lg:text-6xl tracking-tight font-bold">{portfolio.name}</h1>
            </motion.div>
          )}

          {portfolio.bio && (
            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-muted-foreground text-base lg:text-lg leading-relaxed max-w-3xl mb-12">
              {portfolio.bio}
            </motion.p>
          )}

          {/* Meta */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }} className="flex flex-wrap items-center gap-6 mb-12 pb-12 border-b border-border/50">
            {location && (
              <Link to={`/lokasi/${location.id}`} className="flex items-center gap-2 text-muted-foreground text-sm hover:text-primary transition-colors">
                <MapPin className="w-4 h-4" />
                {location.name}
              </Link>
            )}
            {portfolio.created_at && (
              <span className="flex items-center gap-2 text-muted-foreground text-sm">
                <Calendar className="w-4 h-4" />
                {format(new Date(portfolio.created_at), 'dd MMMM yyyy', { locale: idLocale })}
              </span>
            )}
            {portfolio.images && portfolio.images.length > 0 && (
              <span className="flex items-center gap-2 text-muted-foreground text-sm">
                <Images className="w-4 h-4" />
                {portfolio.images.length} foto
              </span>
            )}
            {portfolio.videos && portfolio.videos.length > 0 && (
              <span className="flex items-center gap-2 text-muted-foreground text-sm">
                <VideoIcon className="w-4 h-4" />
                {portfolio.videos.length} video
              </span>
            )}
          </motion.div>

          {/* Gallery */}
          {portfolio.images && portfolio.images.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <h2 className="font-serif text-2xl lg:text-3xl mb-8 font-bold">Galeri Foto</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 lg:gap-4">
                {portfolio.images.map((img, idx) => (
                  <motion.button
                    key={idx}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.03 * idx }}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => setLightboxImage(img)}
                    className="relative aspect-square rounded-sm overflow-hidden group"
                  >
                    <img src={img} alt={`${portfolio.name} - ${idx + 1}`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-background/0 group-hover:bg-background/30 transition-colors flex items-center justify-center">
                      <Expand className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Video Gallery */}
          {portfolio.videos && portfolio.videos.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="mt-16">
              <h2 className="font-serif text-2xl lg:text-3xl mb-8 font-bold">Galeri Video</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
                {portfolio.videos.map((vid, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.05 * idx }}
                    className="relative aspect-video rounded-sm overflow-hidden bg-foreground"
                  >
                    <PortfolioVideo
                      url={vid}
                      title={`${portfolio.name} - video ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Venue link */}
          {location && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mt-16 p-8 lg:p-10 bg-card border border-border/50 rounded-sm">
              <p className="text-muted-foreground text-xs tracking-[0.1em] uppercase mb-4">Diselenggarakan di</p>
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-primary" />
                  <h3 className="font-serif text-xl font-bold">{location.name}</h3>
                </div>
                <Link to={`/lokasi/${location.id}`}>
                  <Button className="rounded-full px-6 text-xs tracking-[0.05em] uppercase">
                    Lihat Venue
                    <ArrowRight className="w-3.5 h-3.5 ml-2" />
                  </Button>
                </Link>
              </div>
            </motion.div>
          )}
        </div>
      </section>

      <LocationLightbox image={lightboxImage} images={allImages} onClose={() => setLightboxImage(null)} onNavigate={handleLightboxNavigate} />
    </Layout>
  );
};

export default PortfolioDetail;
