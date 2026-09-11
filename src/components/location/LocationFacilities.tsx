import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';

export interface FacilityItem {
  name: string;
  image_url?: string;
  description?: string;
}

interface LocationFacilitiesProps {
  facilities: string[];
  facilityItems?: FacilityItem[];
  onOpenLightbox?: (image: string) => void;
}

export const LocationFacilities = ({ facilities, facilityItems = [], onOpenLightbox }: LocationFacilitiesProps) => {
  const photoItems = facilityItems.filter((f) => f && (f.name || f.image_url));
  if ((!facilities || facilities.length === 0) && photoItems.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="bg-card border border-border rounded-2xl p-6 md:p-8"
    >
      <h2 className="font-serif text-2xl mb-6 font-bold">Fasilitas</h2>

      {facilities && facilities.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {facilities.map((facility, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 * i }}
              className="flex items-center gap-3 px-4 py-3 bg-secondary/50 rounded-xl hover:bg-secondary transition-colors"
            >
              <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
              <span className="text-sm font-medium line-clamp-1">{facility}</span>
            </motion.div>
          ))}
        </div>
      )}

      {photoItems.length > 0 && (
        <div className={`grid sm:grid-cols-2 lg:grid-cols-3 gap-4 ${facilities?.length ? 'mt-6' : ''}`}>
          {photoItems.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i }}
              className="group overflow-hidden rounded-xl border border-border bg-secondary/30"
            >
              {item.image_url && (
                <button
                  type="button"
                  onClick={() => onOpenLightbox?.(item.image_url!)}
                  className="block w-full aspect-[4/3] overflow-hidden"
                >
                  <img
                    src={item.image_url}
                    alt={item.name || 'Fasilitas venue'}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </button>
              )}
              <div className="p-4">
                {item.name && <h3 className="font-medium text-sm">{item.name}</h3>}
                {item.description && (
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{item.description}</p>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
};
