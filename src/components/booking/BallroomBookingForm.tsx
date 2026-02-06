import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, isBefore, startOfToday } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { CalendarIcon, CheckCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { cn } from '@/lib/utils';
import { useCreateBallroomBooking, useBallroomSchedules } from '@/hooks/useCMS';

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
  start_time: z.string().optional(),
  end_time: z.string().optional(),
  contact_name: z.string().min(2, 'Nama minimal 2 karakter').max(100, 'Nama maksimal 100 karakter'),
  contact_email: z.string().email('Email tidak valid').max(255, 'Email maksimal 255 karakter'),
  contact_phone: z.string().min(8, 'Nomor telepon minimal 8 digit').max(20, 'Nomor telepon maksimal 20 karakter'),
  event_name: z.string().min(2, 'Nama acara minimal 2 karakter').max(200, 'Nama acara maksimal 200 karakter'),
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

export function BallroomBookingForm({ locationId, locationName, onClose }: BallroomBookingFormProps) {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const createBooking = useCreateBallroomBooking();
  const { data: schedules = [] } = useBallroomSchedules(locationId);

  // Get booked dates
  const bookedDates = schedules
    .filter(s => s.status === 'booked' || s.status === 'blocked')
    .map(s => new Date(s.schedule_date));

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      contact_name: '',
      contact_email: '',
      contact_phone: '',
      event_name: '',
      event_type: '',
      notes: '',
    },
  });

  const isDateDisabled = (date: Date) => {
    // Disable past dates
    if (isBefore(date, startOfToday())) return true;
    // Disable already booked dates
    return bookedDates.some(
      booked => format(booked, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
    );
  };

  const onSubmit = async (data: BookingFormValues) => {
    try {
      await createBooking.mutateAsync({
        location_id: locationId,
        booking_date: format(data.booking_date, 'yyyy-MM-dd'),
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
      setIsSubmitted(true);
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
          Terima kasih! Tim kami akan menghubungi Anda dalam 1x24 jam untuk konfirmasi.
        </p>
        <p className="text-sm text-muted-foreground mb-6">
          Anda dapat mengecek status booking kapan saja di{' '}
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="text-center mb-4">
          <h3 className="font-serif text-xl font-bold">Booking {locationName}</h3>
          <p className="text-sm text-muted-foreground">Isi form berikut untuk mengajukan reservasi</p>
        </div>

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
                        'w-full pl-3 text-left font-normal',
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
                    onSelect={field.onChange}
                    disabled={isDateDisabled}
                    initialFocus
                    className={cn('p-3 pointer-events-auto')}
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Time */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="start_time"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Jam Mulai</FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
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
                  <Input type="time" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Contact Info */}
        <FormField
          control={form.control}
          name="contact_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nama Lengkap *</FormLabel>
              <FormControl>
                <Input placeholder="Nama Anda" {...field} />
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
                  <Input type="email" placeholder="email@example.com" {...field} />
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
                <FormLabel>No. Telepon *</FormLabel>
                <FormControl>
                  <Input type="tel" placeholder="+62 812 3456 7890" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Event Details */}
        <FormField
          control={form.control}
          name="event_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nama Acara *</FormLabel>
              <FormControl>
                <Input placeholder="Contoh: Wedding Reception John & Jane" {...field} />
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
                    <SelectTrigger>
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
                    placeholder="100"
                    {...field}
                    onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                  />
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
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-3 pt-4">
          {onClose && (
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Batal
            </Button>
          )}
          <Button type="submit" disabled={createBooking.isPending} className="flex-1">
            {createBooking.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Mengirim...
              </>
            ) : (
              'Kirim Booking'
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
