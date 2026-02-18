import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Images, ArrowRight, Expand } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface Portfolio {
  id: string;
  name: string;
  specialization: string | null;
  bio: string | null;
  photo_url: string | null;
  images: string[] | null;
}

interface LocationPortfolioSectionProps {
  portfolios: Portfolio[];
  onOpenLightbox: (image: string) => void;
}

export const LocationPortfolioSection = ({ 
  portfolios, 
  onOpenLightbox 
}: LocationPortfolioSectionProps) => {
  if (!portfolios || portfolios.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="bg-card border border-border rounded-2xl p-6 md:p-8"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-primary/10 rounded-xl">
            <Images className="w-5 h-5 text-primary" />
          </div>
          <h2 className="font-serif text-2xl font-bold">Our Portfolio</h2>
        </div>
        <Link to="/portfolio">
          <Button variant="ghost" size="sm" className="gap-2">
            Lihat Semua
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>

      <div className="grid gap-6">
        {portfolios.map((portfolio, i) => (
          <motion.div
            key={portfolio.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * i }}
            className="border border-border rounded-xl overflow-hidden bg-background"
          >
            {/* Header */}
            <div className="p-4 border-b border-border">
              <div className="flex items-start gap-4">
                {portfolio.photo_url && (
                  <img
                    src={portfolio.photo_url}
                    alt={portfolio.name}
                    className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-serif font-bold text-lg mb-2 text-foreground">{portfolio.name}</h3>
                  {portfolio.specialization && (
                    <Badge variant="outline" className="mb-2 bg-primary/10 text-primary border-primary/30">
                      {portfolio.specialization}
                    </Badge>
                  )}
                  {portfolio.bio && (
                    <p className="text-sm text-foreground font-medium line-clamp-2">
                      {portfolio.bio}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Gallery Preview */}
            {portfolio.images && portfolio.images.length > 0 && (
              <div className="p-4">
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                  {portfolio.images.slice(0, 5).map((img, idx) => (
                    <motion.button
                      key={idx}
                      whileHover={{ scale: 1.05 }}
                      onClick={() => onOpenLightbox(img)}
                      className="relative aspect-square rounded-lg overflow-hidden group"
                    >
                      <img
                        src={img}
                        alt={`${portfolio.name} ${idx + 1}`}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-background/0 group-hover:bg-background/40 transition-colors flex items-center justify-center">
                        <Expand className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                      </div>
                      {/* Show count on last visible image */}
                      {idx === 4 && portfolio.images && portfolio.images.length > 5 && (
                        <div className="absolute inset-0 bg-background/70 flex items-center justify-center">
                          <span className="text-lg font-bold">
                            +{portfolio.images.length - 5}
                          </span>
                        </div>
                      )}
                    </motion.button>
                  ))}
                </div>
                <p className="text-sm font-medium text-foreground mt-3 text-center">
                  {portfolio.images.length} foto dokumentasi
                </p>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};
