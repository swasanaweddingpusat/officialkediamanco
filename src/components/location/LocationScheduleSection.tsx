import { motion } from 'framer-motion';
import { CalendarDays, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

interface Schedule {
  id: string;
  schedule_date: string;
  start_time?: string | null;
  end_time?: string | null;
  event_name?: string | null;
  notes?: string | null;
  status: string;
}

interface LocationScheduleSectionProps {
  schedules: Schedule[];
}

export const LocationScheduleSection = ({ schedules }: LocationScheduleSectionProps) => {
  if (!schedules || schedules.length === 0) return null;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available':
        return <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">Tersedia</Badge>;
      case 'booked':
        return <Badge variant="destructive">Dipesan</Badge>;
      default:
        return <Badge variant="secondary">Tidak Tersedia</Badge>;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="bg-card border border-border rounded-2xl p-6 md:p-8"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 bg-primary/10 rounded-xl">
          <CalendarDays className="w-5 h-5 text-primary" />
        </div>
        <h2 className="font-display text-2xl">Jadwal Ballroom</h2>
      </div>
      
      <div className="space-y-3">
        {schedules.slice(0, 10).map((schedule, i) => (
          <motion.div
            key={schedule.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.05 * i }}
            className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-secondary/50 hover:bg-secondary rounded-xl transition-colors gap-3"
          >
            <div className="flex-1 space-y-1">
              <div className="font-semibold">
                {format(new Date(schedule.schedule_date), 'EEEE, dd MMMM yyyy', { locale: idLocale })}
              </div>
              {(schedule.start_time || schedule.end_time) && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-3.5 h-3.5" />
                  <span>
                    {schedule.start_time?.slice(0, 5)}
                    {schedule.start_time && schedule.end_time && ' - '}
                    {schedule.end_time?.slice(0, 5)}
                  </span>
                </div>
              )}
              {schedule.event_name && schedule.status === 'booked' && (
                <div className="text-sm text-muted-foreground">
                  {schedule.event_name}
                </div>
              )}
              {schedule.notes && (
                <div className="text-xs text-muted-foreground/70">
                  {schedule.notes}
                </div>
              )}
            </div>
            <div className="self-start sm:self-center">
              {getStatusBadge(schedule.status)}
            </div>
          </motion.div>
        ))}
      </div>
      
      {schedules.length > 10 && (
        <p className="text-sm text-muted-foreground mt-4 text-center">
          + {schedules.length - 10} jadwal lainnya
        </p>
      )}
    </motion.div>
  );
};
