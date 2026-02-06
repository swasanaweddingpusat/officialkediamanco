import { motion } from 'framer-motion';
import { Phone, Mail, Clock, ExternalLink, CalendarDays, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { BallroomBookingForm } from '@/components/booking/BallroomBookingForm';
import { Json } from '@/integrations/supabase/types';

interface LocationContactCardProps {
  location: {
    id: string;
    name: string;
    phone?: string | null;
    email?: string | null;
    address?: string | null;
    operating_hours?: Json | null;
    google_maps_url?: string | null;
    is_coming_soon?: boolean | null;
  };
  bookingOpen: boolean;
  onBookingChange: (open: boolean) => void;
}

export const LocationContactCard = ({ 
  location, 
  bookingOpen, 
  onBookingChange 
}: LocationContactCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-card border border-border rounded-2xl p-6 lg:sticky lg:top-24 shadow-sm"
    >
      <h3 className="font-serif text-xl mb-5 font-bold">Informasi Kontak</h3>

      <div className="space-y-4">
        {location.address && (
          <div className="flex items-start gap-3 text-muted-foreground group">
            <div className="p-2 bg-secondary rounded-lg group-hover:bg-primary/10 transition-colors">
              <MapPin className="w-4 h-4 text-primary" />
            </div>
            <span className="text-sm leading-relaxed pt-1.5">{location.address}</span>
          </div>
        )}

        {location.phone && (
          <a
            href={`tel:${location.phone}`}
            className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors group"
          >
            <div className="p-2 bg-secondary rounded-lg group-hover:bg-primary/10 transition-colors">
              <Phone className="w-4 h-4 text-primary" />
            </div>
            <span className="text-sm">{location.phone}</span>
          </a>
        )}

        {location.email && (
          <a
            href={`mailto:${location.email}`}
            className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors group"
          >
            <div className="p-2 bg-secondary rounded-lg group-hover:bg-primary/10 transition-colors">
              <Mail className="w-4 h-4 text-primary" />
            </div>
            <span className="text-sm break-all">{location.email}</span>
          </a>
        )}

        {location.operating_hours && (
          <div className="flex items-start gap-3 text-muted-foreground group">
            <div className="p-2 bg-secondary rounded-lg">
              <Clock className="w-4 h-4 text-primary" />
            </div>
            <div className="min-w-0 pt-1">
              {typeof location.operating_hours === 'object' ? (
                <pre className="text-xs whitespace-pre-wrap break-words font-sans">
                  {JSON.stringify(location.operating_hours, null, 2)}
                </pre>
              ) : (
                <span className="text-sm">{String(location.operating_hours)}</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="mt-6 space-y-3">
        {/* Map Link */}
        {location.google_maps_url && !location.is_coming_soon && (
          <a
            href={location.google_maps_url}
            target="_blank"
            rel="noopener noreferrer"
            className="block"
          >
            <Button variant="outline" className="w-full gap-2">
              <ExternalLink className="w-4 h-4" />
              Lihat di Google Maps
            </Button>
          </a>
        )}

        {/* Booking Button */}
        {!location.is_coming_soon && (
          <Dialog open={bookingOpen} onOpenChange={onBookingChange}>
            <DialogTrigger asChild>
              <Button className="w-full gap-2" size="lg">
                <CalendarDays className="w-4 h-4" />
                Booking Ballroom
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <BallroomBookingForm 
                locationId={location.id}
                locationName={location.name}
                onClose={() => onBookingChange(false)}
              />
            </DialogContent>
          </Dialog>
        )}

        {location.is_coming_soon && (
          <div className="text-center pt-2">
            <Badge variant="secondary" className="text-sm px-4 py-1.5">
              Lokasi ini segera hadir
            </Badge>
          </div>
        )}
      </div>
    </motion.div>
  );
};
