import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';

interface LocationFacilitiesProps {
  facilities: string[];
}

export const LocationFacilities = ({ facilities }: LocationFacilitiesProps) => {
  if (!facilities || facilities.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="bg-card border border-border rounded-2xl p-6 md:p-8"
    >
      <h2 className="font-display text-2xl mb-6">Fasilitas</h2>
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
    </motion.div>
  );
};
