import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, MapPin, Calendar, Images, Expand } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { useTrainerById } from '@/hooks/useCMS';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LocationLightbox } from '@/components/location/LocationLightbox';
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
    
    let newIndex: number;
    if (direction === 'prev') {
      newIndex = currentIndex === 0 ? allImages.length - 1 : currentIndex - 1;
    } else {
      newIndex = currentIndex === allImages.length - 1 ? 0 : currentIndex + 1;
    }
    setLightboxImage(allImages[newIndex]);
  };

  // Loading state
  if (isLoading) {
    return (
      <Layout>
        <section className="pt-20 md:pt-24 pb-16 md:pb-20">
          <div className="container mx-auto px-4 sm:px-6">
            <Skeleton className="h-8 w-40 mb-6" />
            <Skeleton className="h-[300px] md:h-[500px] rounded-2xl mb-6" />
            <Skeleton className="h-24 mb-6" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <Skeleton key={i} className="aspect-square rounded-lg" />
              ))}
            </div>
          </div>
        </section>
      </Layout>
    );
  }

  // Not found state
  if (!portfolio) {
    return (
      <Layout>
        <section className="pt-20 md:pt-24 pb-16 md:pb-20">
          <div className="container mx-auto px-4 sm:px-6 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
                <Images className="w-10 h-10 text-muted-foreground" />
              </div>
              <h1 className="font-serif text-3xl md:text-4xl mb-4 font-bold">Portfolio Tidak Ditemukan</h1>
              <p className="text-muted-foreground mb-8">
                Portfolio yang Anda cari tidak tersedia atau telah dihapus.
              </p>
              <Link to="/portfolio">
                <Button size="lg">
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Kembali ke Portfolio
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </Layout>
    );
  }

  const location = portfolio.locations as { id: string; name: string } | null;

  return (
    <Layout>
      {/* Back Button */}
      <section className="pt-20 md:pt-24 pb-4">
        <div className="container mx-auto px-4 sm:px-6">
          <Link to="/portfolio">
            <Button variant="ghost" className="gap-2 -ml-3 text-muted-foreground hover:text-foreground">
              <ChevronLeft className="w-4 h-4" />
              Kembali ke Portfolio
            </Button>
          </Link>
        </div>
      </section>

      {/* Hero Image */}
      {portfolio.photo_url && (
        <section className="pb-6 md:pb-8">
          <div className="container mx-auto px-4 sm:px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative aspect-[21/9] rounded-2xl overflow-hidden group cursor-pointer"
              onClick={() => setLightboxImage(portfolio.photo_url!)}
            >
              <img
                src={portfolio.photo_url}
                alt={portfolio.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  {portfolio.specialization && (
                    <Badge variant="secondary" className="bg-primary/20 text-primary border-primary/30">
                      {portfolio.specialization}
                    </Badge>
                  )}
                  {location && (
                    <Badge variant="outline" className="gap-1.5">
                      <MapPin className="w-3 h-3" />
                      {location.name}
                    </Badge>
                  )}
                </div>
                <h1 className="font-serif text-3xl md:text-5xl lg:text-6xl tracking-tight text-white drop-shadow-lg font-bold">
                  {portfolio.name}
                </h1>
              </div>
              <div className="absolute top-4 right-4 p-3 bg-background/50 backdrop-blur rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                <Expand className="w-5 h-5" />
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* Content */}
      <section className="pb-16 md:pb-24">
        <div className="container mx-auto px-4 sm:px-6">
          {/* Header for non-image hero */}
          {!portfolio.photo_url && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <div className="flex flex-wrap items-center gap-3 mb-4">
                {portfolio.specialization && (
                  <Badge variant="secondary" className="bg-primary/20 text-primary border-primary/30">
                    {portfolio.specialization}
                  </Badge>
                )}
                {location && (
                  <Badge variant="outline" className="gap-1.5">
                    <MapPin className="w-3 h-3" />
                    {location.name}
                  </Badge>
                )}
              </div>
              <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl tracking-tight font-bold">
                {portfolio.name}
              </h1>
            </motion.div>
          )}

          {/* Description */}
          {portfolio.bio && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="max-w-4xl mb-12"
            >
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
                {portfolio.bio}
              </p>
            </motion.div>
          )}

          {/* Meta Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="flex flex-wrap items-center gap-6 mb-10 pb-10 border-b border-border"
          >
            {location && (
              <Link 
                to={`/lokasi/${location.id}`}
                className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
              >
                <MapPin className="w-5 h-5" />
                <span>{location.name}</span>
              </Link>
            )}
            {portfolio.created_at && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="w-5 h-5" />
                <span>
                  {format(new Date(portfolio.created_at), 'dd MMMM yyyy', { locale: idLocale })}
                </span>
              </div>
            )}
            {portfolio.images && portfolio.images.length > 0 && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Images className="w-5 h-5" />
                <span>{portfolio.images.length} foto</span>
              </div>
            )}
          </motion.div>

          {/* Gallery */}
          {portfolio.images && portfolio.images.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h2 className="font-serif text-2xl md:text-3xl mb-6 font-bold">Galeri Foto</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                {portfolio.images.map((img, idx) => (
                  <motion.button
                    key={idx}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.05 * idx }}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => setLightboxImage(img)}
                    className="relative aspect-square rounded-xl overflow-hidden group"
                  >
                    <img
                      src={img}
                      alt={`${portfolio.name} - Foto ${idx + 1}`}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-background/0 group-hover:bg-background/30 transition-colors flex items-center justify-center">
                      <Expand className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Link to venue */}
          {location && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-12 p-6 md:p-8 bg-card border border-border rounded-2xl"
            >
              <p className="text-muted-foreground mb-4">Event ini diselenggarakan di:</p>
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-primary/10 rounded-xl">
                    <MapPin className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-serif text-xl font-semibold">{location.name}</h3>
                  </div>
                </div>
                <Link to={`/lokasi/${location.id}`}>
                  <Button>
                    Lihat Venue
                    <ChevronLeft className="w-4 h-4 ml-2 rotate-180" />
                  </Button>
                </Link>
              </div>
            </motion.div>
          )}
        </div>
      </section>

      {/* Lightbox */}
      <LocationLightbox
        image={lightboxImage}
        images={allImages}
        onClose={() => setLightboxImage(null)}
        onNavigate={handleLightboxNavigate}
      />
    </Layout>
  );
};

export default PortfolioDetail;
