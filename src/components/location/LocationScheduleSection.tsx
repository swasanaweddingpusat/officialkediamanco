import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarDays, Clock, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths, isToday, isBefore, startOfToday } from 'date-fns';
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
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Get schedules for the selected date
  const selectedDateSchedules = useMemo(() => {
    if (!selectedDate) return [];
    return schedules.filter(s => isSameDay(new Date(s.schedule_date), selectedDate));
  }, [schedules, selectedDate]);

  // Get schedules grouped by date for the current month
  const schedulesByDate = useMemo(() => {
    const map = new Map<string, Schedule[]>();
    schedules.forEach(s => {
      const dateKey = format(new Date(s.schedule_date), 'yyyy-MM-dd');
      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }
      map.get(dateKey)?.push(s);
    });
    return map;
  }, [schedules]);

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start, end });
    
    // Add padding for the first week
    const startDay = getDay(start);
    const paddingDays = Array(startDay).fill(null);
    
    return [...paddingDays, ...days];
  }, [currentMonth]);

  const getStatusForDate = (date: Date) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    const daySchedules = schedulesByDate.get(dateKey);
    if (!daySchedules || daySchedules.length === 0) return null;
    
    // Check if any is booked
    const hasBooked = daySchedules.some(s => s.status === 'booked');
    if (hasBooked) return 'booked';
    
    const hasAvailable = daySchedules.some(s => s.status === 'available');
    if (hasAvailable) return 'available';
    
    return 'unavailable';
  };

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

  const weekDays = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

  if (!schedules || schedules.length === 0) return null;

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

      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <h3 className="font-semibold text-lg">
          {format(currentMonth, 'MMMM yyyy', { locale: idLocale })}
        </h3>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
        >
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1 mb-4">
        {/* Week day headers */}
        {weekDays.map(day => (
          <div
            key={day}
            className="text-center text-xs font-medium text-muted-foreground py-2"
          >
            {day}
          </div>
        ))}

        {/* Calendar days */}
        {calendarDays.map((day, index) => {
          if (!day) {
            return <div key={`empty-${index}`} className="aspect-square" />;
          }

          const status = getStatusForDate(day);
          const isPast = isBefore(day, startOfToday());
          const isSelected = selectedDate && isSameDay(day, selectedDate);
          const hasSchedule = status !== null;

          return (
            <button
              key={day.toISOString()}
              onClick={() => hasSchedule && setSelectedDate(day)}
              disabled={!hasSchedule}
              className={`
                aspect-square rounded-lg flex flex-col items-center justify-center text-sm
                transition-all duration-200 relative
                ${isToday(day) ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''}
                ${isSelected ? 'bg-primary text-primary-foreground' : ''}
                ${!isSelected && hasSchedule ? 'hover:bg-secondary cursor-pointer' : ''}
                ${isPast && !hasSchedule ? 'text-muted-foreground/50' : ''}
                ${!hasSchedule ? 'cursor-default' : ''}
              `}
            >
              <span className={isSelected ? 'font-bold' : ''}>
                {format(day, 'd')}
              </span>
              {/* Status indicator */}
              {hasSchedule && !isSelected && (
                <span
                  className={`
                    absolute bottom-1 w-1.5 h-1.5 rounded-full
                    ${status === 'available' ? 'bg-primary' : ''}
                    ${status === 'booked' ? 'bg-destructive' : ''}
                    ${status === 'unavailable' ? 'bg-muted-foreground' : ''}
                  `}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground mb-4 pb-4 border-b border-border">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-primary" />
          <span>Tersedia</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-destructive" />
          <span>Dipesan</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-muted-foreground" />
          <span>Tidak Tersedia</span>
        </div>
      </div>

      {/* Selected Date Details */}
      <AnimatePresence mode="wait">
        {selectedDate && selectedDateSchedules.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="bg-secondary/50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold">
                  {format(selectedDate, 'EEEE, dd MMMM yyyy', { locale: idLocale })}
                </h4>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setSelectedDate(null)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-3">
                {selectedDateSchedules.map((schedule) => (
                  <motion.div
                    key={schedule.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex flex-col sm:flex-row sm:items-start justify-between p-3 bg-background rounded-lg gap-3"
                  >
                    <div className="flex-1 space-y-1">
                      {(schedule.start_time || schedule.end_time) && (
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <Clock className="w-4 h-4 text-primary" />
                          <span>
                            {schedule.start_time?.slice(0, 5)}
                            {schedule.start_time && schedule.end_time && ' - '}
                            {schedule.end_time?.slice(0, 5)}
                          </span>
                        </div>
                      )}
                      {schedule.event_name && schedule.status === 'booked' && (
                        <div className="text-sm font-medium">
                          {schedule.event_name}
                        </div>
                      )}
                      {schedule.notes && (
                        <div className="text-xs text-muted-foreground">
                          {schedule.notes}
                        </div>
                      )}
                    </div>
                    <div className="self-start">
                      {getStatusBadge(schedule.status)}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* No selection hint */}
      {!selectedDate && (
        <p className="text-sm text-muted-foreground text-center">
          Klik tanggal yang memiliki jadwal untuk melihat detail
        </p>
      )}
    </motion.div>
  );
};
