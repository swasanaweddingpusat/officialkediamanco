import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, isBefore, startOfToday } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { CalendarIcon, CheckCircle, Loader2, User, PartyPopper, MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { cn } from '@/lib/utils';
import { useCreateBallroomBooking, useBallroomSchedules, useSiteSettings, useVenueSessions } from '@/hooks/useCMS';

const EVENT_TYPES = [
  'Wedding',
  'Corporate Event',
  'Birthday Party',
  'Seminar',
  'Exhibition',
  'Gala Dinner',
  'Product Launch',
  'Other',
];

const bookingSchema = z.object({
  booking_date: z.date({
    required_error: 'Tanggal harus dipilih',
  }),
  session_id: z.string().optional(),
  start_time: z.string().optional(),
  end_time: z.string().optional(),

  contact_name: z.string().trim().min(2, 'Nama minimal 2 karakter').max(100, 'Nama maksimal 100 karakter'),
  contact_email: z.string().trim().email('Email tidak valid').max(255, 'Email maksimal 255 karakter'),
  contact_phone: z.string().trim().min(8, 'Nomor telepon minimal 8 digit').max(20, 'Nomor telepon maksimal 20 karakter'),
  event_name: z.string().trim().min(2, 'Nama acara minimal 2 karakter').max(200, 'Nama acara maksimal 200 karakter'),
  event_type: z.string().optional(),
  guest_count: z.number().min(1, 'Jumlah tamu minimal 1').max(10000, 'Jumlah tamu maksimal 10000').optional(),
  notes: z.string().max(1000, 'Catatan maksimal 1000 karakter').optional(),
});

type BookingFormValues = z.infer<typeof bookingSchema>;

interface BallroomBookingFormProps {
  locationId: string;
  locationName: string;
  onClose?: () => void;
}

const SectionTitle = ({ icon: Icon, title }: { icon: typeof User; title: string }) => (
  <div className="flex items-center gap-2 pt-2">
    <span className="p-1.5 rounded-md bg-secondary">
      <Icon className="w-3.5 h-3.5 text-primary" />
    </span>
    <h4 className="text-xs uppercase tracking-[0.12em] text-muted-foreground font-medium">{title}</h4>
    <span className="flex-1 h-px bg-border" />
  </div>
);

const toMinutes = (t?: string | null) => {
  if (!t) return null;
  const [h, m] = t.split(':');
  return parseInt(h, 10) * 60 + parseInt(m || '0', 10);
};

const overlaps = (aS: string, aE: string, bS?: string | null, bE?: string | null) => {
  const bStart = toMinutes(bS);
  const bEnd = toMinutes(bE);
  // Jadwal tanpa jam = blok sehari penuh
  if (bStart === null || bEnd === null) return true;
  const aStart = toMinutes(aS)!;
  const aEnd = toMinutes(aE)!;
  return aStart < bEnd && bStart < aEnd;
};

export function BallroomBookingForm({ locationId, locationName, onClose }: BallroomBookingFormProps) {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [waLink, setWaLink] = useState<string>('');
  const createBooking = useCreateBallroomBooking();
  const { data: schedules = [] } = useBallroomSchedules(locationId);
  const { data: sessions = [] } = useVenueSessions(locationId);
  const { data: settings } = useSiteSettings();
  const { bookedDates } = useExternalBookedDates(locationName);

  const blockedSchedules = useMemo(
    () => schedules.filter(s => s.status === 'booked' || s.status === 'blocked'),
    [schedules]
  );

  const isExternallyBooked = (date: Date) => bookedDates.has(format(date, 'yyyy-MM-dd'));

  const schedulesForDate = (date: Date) =>
    blockedSchedules.filter(s => s.schedule_date === format(date, 'yyyy-MM-dd'));

  const isSessionTaken = (date: Date, session: { start_time: string; end_time: string }) =>
    isExternallyBooked(date) ||
    schedulesForDate(date).some(s => overlaps(session.start_time, session.end_time, s.start_time, s.end_time));


  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      contact_name: '',
      contact_email: '',
      contact_phone: '',
      event_name: '',
      event_type: '',
      notes: '',
      session_id: '',
    },
  });

  const selectedDate = form.watch('booking_date');
  const selectedSessionId = form.watch('session_id');

  const sessionAvailability = useMemo(() => {
    if (!selectedDate) return [];
    return sessions.map(s => ({ ...s, taken: isSessionTaken(selectedDate, s) }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, sessions, blockedSchedules]);

  const isDateDisabled = (date: Date) => {
    if (isBefore(date, startOfToday())) return true;
    const daySchedules = schedulesForDate(date);
    if (daySchedules.length === 0) return false;
    // Tanpa data sesi: satu jadwal apa pun menutup tanggal
    if (sessions.length === 0) return true;
    // Dengan sesi: tanggal ditutup hanya jika semua sesi penuh
    return sessions.every(s => isSessionTaken(date, s));
  };

  const handleSelectSession = (session: { id: string; start_time: string; end_time: string }) => {
    form.setValue('session_id', session.id, { shouldValidate: true });
    form.setValue('start_time', session.start_time.slice(0, 5));
    form.setValue('end_time', session.end_time.slice(0, 5));
  };

  const buildWaLink = (data: BookingFormValues) => {
    const rawNumber =
      settings?.phone?.replace(/[^0-9]/g, '') ||
      settings?.whatsapp_link?.replace(/[^0-9]/g, '') ||
      '6281117797567';
    const waNumber = rawNumber.startsWith('0') ? `62${rawNumber.slice(1)}` : rawNumber;
    const sessionName = sessions.find(s => s.id === data.session_id)?.name;

    const lines = [
      'Halo Kediaman, saya ingin mengajukan reservasi ballroom.',
      '',
      `*Venue* : ${locationName}`,
      `*Tanggal* : ${format(data.booking_date, 'EEEE, dd MMMM yyyy', { locale: idLocale })}`,
      sessionName ? `*Sesi* : ${sessionName}` : null,
      data.start_time || data.end_time
        ? `*Waktu* : ${data.start_time || '-'} - ${data.end_time || '-'}`
        : null,
      `*Nama Acara* : ${data.event_name}`,
      data.event_type ? `*Jenis Acara* : ${data.event_type}` : null,
      data.guest_count ? `*Perkiraan Tamu* : ${data.guest_count} orang` : null,
      '',
      '*Data Pemesan*',
      `Nama : ${data.contact_name}`,
      `Email : ${data.contact_email}`,
      `Telepon : ${data.contact_phone}`,
      data.notes ? `\n*Catatan* : ${data.notes}` : null,
      '',
      'Mohon informasi ketersediaan dan penawarannya. Terima kasih.',
    ].filter(Boolean) as string[];

    return `https://wa.me/${waNumber}?text=${encodeURIComponent(lines.join('\n'))}`;
  };

  const onSubmit = async (data: BookingFormValues) => {
    if (sessions.length > 0) {
      const chosen = sessionAvailability.find(s => s.id === data.session_id);
      if (!chosen) {
        form.setError('session_id', { message: 'Pilih sesi yang tersedia' });
        return;
      }
      if (chosen.taken) {
        form.setError('session_id', { message: 'Sesi ini sudah terisi, silakan pilih sesi lain' });
        return;
      }
    }
    try {
      await createBooking.mutateAsync({
        location_id: locationId,
        booking_date: format(data.booking_date, 'yyyy-MM-dd'),
        session_id: data.session_id || undefined,
        start_time: data.start_time || undefined,
        end_time: data.end_time || undefined,
        contact_name: data.contact_name,
        contact_email: data.contact_email,
        contact_phone: data.contact_phone,
        event_name: data.event_name,
        event_type: data.event_type || undefined,
        guest_count: data.guest_count || undefined,
        notes: data.notes || undefined,
      });

      const link = buildWaLink(data);
      setWaLink(link);
      setIsSubmitted(true);
      window.open(link, '_blank', 'noopener,noreferrer');
    } catch (error) {
      // Error handled by mutation
    }
  };

  if (isSubmitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-8"
      >
        <CheckCircle className="w-16 h-16 text-primary mx-auto mb-4" />
        <h3 className="font-serif text-2xl mb-2 font-bold">Permintaan Booking Terkirim!</h3>
        <p className="text-muted-foreground mb-4">
          Data Anda tersimpan. Kami juga membuka WhatsApp agar tim kami bisa langsung merespons.
        </p>
        <a href={waLink} target="_blank" rel="noopener noreferrer" className="block mb-3">
          <Button className="w-full gap-2" size="lg">
            <MessageCircle className="w-4 h-4" />
            Lanjutkan ke WhatsApp
          </Button>
        </a>
        <p className="text-sm text-muted-foreground mb-6">
          Cek status booking kapan saja di{' '}
          <a href="/booking/track" className="text-primary hover:underline font-medium">
            halaman tracking
          </a>
        </p>
        <Button onClick={onClose} variant="outline">
          Tutup
        </Button>
      </motion.div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <div className="text-center pb-2 border-b border-border">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-1">Reservasi</p>
          <h3 className="font-serif text-2xl font-bold">{locationName}</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Isi detail acara Anda — tim kami merespons dalam 1x24 jam.
          </p>
        </div>

        <SectionTitle icon={CalendarIcon} title="Jadwal Acara" />

        {/* Date Picker */}
        <FormField
          control={form.control}
          name="booking_date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Tanggal Acara *</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full h-11 pl-3 text-left font-normal',
                        !field.value && 'text-muted-foreground'
                      )}
                    >
                      {field.value ? (
                        format(field.value, 'EEEE, dd MMMM yyyy', { locale: idLocale })
                      ) : (
                        <span>Pilih tanggal</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={(d) => {
                      field.onChange(d);
                      form.setValue('session_id', '');
                      form.setValue('start_time', '');
                      form.setValue('end_time', '');
                    }}
                    disabled={isDateDisabled}
                    initialFocus
                    className={cn('p-3 pointer-events-auto')}
                  />
                </PopoverContent>
              </Popover>
              <FormDescription className="text-xs">
                Tanggal yang sudah terisi otomatis dinonaktifkan.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Slot / Sesi */}
        {sessions.length > 0 ? (
          <FormField
            control={form.control}
            name="session_id"
            render={() => (
              <FormItem>
                <FormLabel>Pilih Sesi *</FormLabel>
                {!selectedDate ? (
                  <p className="text-sm text-muted-foreground border border-dashed border-border rounded-lg p-4">
                    Pilih tanggal terlebih dahulu untuk melihat sesi yang tersedia.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {sessionAvailability.map((s) => {
                      const active = selectedSessionId === s.id;
                      return (
                        <button
                          key={s.id}
                          type="button"
                          disabled={s.taken}
                          onClick={() => handleSelectSession(s)}
                          className={cn(
                            'text-left rounded-xl border p-3 transition-colors',
                            active
                              ? 'border-primary bg-primary/10'
                              : 'border-border hover:border-primary/50',
                            s.taken && 'opacity-50 cursor-not-allowed line-through hover:border-border'
                          )}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-medium">{s.name}</span>
                            <span
                              className={cn(
                                'text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full no-underline',
                                s.taken ? 'bg-muted text-muted-foreground' : 'bg-primary/15 text-primary'
                              )}
                            >
                              {s.taken ? 'Penuh' : 'Tersedia'}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {s.start_time.slice(0, 5)} - {s.end_time.slice(0, 5)}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="start_time"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Jam Mulai</FormLabel>
                  <FormControl>
                    <Input type="time" className="h-11" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="end_time"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Jam Selesai</FormLabel>
                  <FormControl>
                    <Input type="time" className="h-11" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}


        <SectionTitle icon={PartyPopper} title="Detail Acara" />

        <FormField
          control={form.control}
          name="event_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nama Acara *</FormLabel>
              <FormControl>
                <Input className="h-11" placeholder="Contoh: Wedding Reception John & Jane" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="event_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Jenis Acara</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Pilih jenis acara" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {EVENT_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="guest_count"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Perkiraan Tamu</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    inputMode="numeric"
                    className="h-11"
                    placeholder="100"
                    {...field}
                    value={field.value ?? ''}
                    onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <SectionTitle icon={User} title="Data Pemesan" />

        <FormField
          control={form.control}
          name="contact_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nama Lengkap *</FormLabel>
              <FormControl>
                <Input className="h-11" placeholder="Nama Anda" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="contact_email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email *</FormLabel>
                <FormControl>
                  <Input type="email" className="h-11" placeholder="email@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="contact_phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>No. WhatsApp *</FormLabel>
                <FormControl>
                  <Input type="tel" className="h-11" placeholder="0812 3456 7890" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Catatan / Request Khusus</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Tuliskan kebutuhan khusus Anda..."
                  rows={3}
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="sticky bottom-0 -mx-6 px-6 pt-4 pb-1 bg-background/95 backdrop-blur border-t border-border">
          <div className="flex gap-3">
            {onClose && (
              <Button type="button" variant="outline" onClick={onClose} className="flex-1 h-11">
                Batal
              </Button>
            )}
            <Button type="submit" disabled={createBooking.isPending} className="flex-1 h-11 gap-2">
              {createBooking.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Mengirim...
                </>
              ) : (
                <>
                  <MessageCircle className="w-4 h-4" />
                  Kirim & Chat WhatsApp
                </>
              )}
            </Button>
          </div>
          <p className="text-[11px] text-center text-muted-foreground mt-2 mb-2">
            Data tersimpan otomatis, lalu Anda diarahkan ke WhatsApp Kediaman.
          </p>
        </div>
      </form>
    </Form>
  );
}
