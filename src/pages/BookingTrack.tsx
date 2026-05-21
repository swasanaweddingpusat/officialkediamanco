import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { Search, Loader2, CalendarDays, MapPin, Users, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { supabase } from '@/integrations/supabase/client';

const searchSchema = z.object({
  email: z.string().email('Email tidak valid'),
});

type SearchFormValues = z.infer<typeof searchSchema>;

type Booking = {
  id: string;
  location_id: string;
  booking_date: string;
  start_time: string | null;
  end_time: string | null;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  event_name: string;
  event_type: string | null;
  guest_count: number | null;
  notes: string | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
  locations: { name: string } | null;
};

const STATUS_CONFIG = {
  pending: {
    label: 'Menunggu Konfirmasi',
    variant: 'secondary' as const,
    icon: AlertCircle,
    color: 'text-yellow-500',
    description: 'Booking Anda sedang dalam proses review oleh tim kami.',
  },
  approved: {
    label: 'Disetujui',
    variant: 'default' as const,
    icon: CheckCircle,
    color: 'text-primary',
    description: 'Selamat! Booking Anda telah disetujui. Tim kami akan menghubungi Anda untuk detail selanjutnya.',
  },
  rejected: {
    label: 'Ditolak',
    variant: 'destructive' as const,
    icon: XCircle,
    color: 'text-destructive',
    description: 'Maaf, booking Anda tidak dapat kami proses. Silakan hubungi tim kami untuk informasi lebih lanjut.',
  },
  cancelled: {
    label: 'Dibatalkan',
    variant: 'outline' as const,
    icon: XCircle,
    color: 'text-muted-foreground',
    description: 'Booking ini telah dibatalkan.',
  },
};

const BookingTrack = () => {
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [searchedEmail, setSearchedEmail] = useState('');

  const form = useForm<SearchFormValues>({
    resolver: zodResolver(searchSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: SearchFormValues) => {
    setIsSearching(true);
    setHasSearched(false);

    try {
      const { data: results, error } = await supabase.functions.invoke('track-booking', {
        body: { email: data.email.toLowerCase().trim() },
      });

      if (error) throw error;

      setBookings((results?.bookings ?? []) as Booking[]);
      setSearchedEmail(data.email);
      setHasSearched(true);
    } catch (error) {
      console.error('Error searching bookings:', error);
      setBookings([]);
      setHasSearched(true);
    } finally {
      setIsSearching(false);
    }
  };

  const getStatusConfig = (status: string) => {
    return STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending;
  };

  return (
    <Layout>
      <section className="pt-20 sm:pt-24 md:pt-28 pb-16 md:pb-24">
        <div className="container mx-auto px-4 sm:px-6 max-w-3xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8 sm:mb-12"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
              <CalendarDays className="w-8 h-8 text-primary" />
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl mb-4 font-bold">
              Cek Status Booking
            </h1>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Masukkan email yang Anda gunakan saat booking untuk melihat status reservasi Anda.
            </p>
          </motion.div>

          {/* Search Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <Card>
              <CardContent className="pt-6">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                type="email"
                                placeholder="Masukkan email Anda..."
                                className="pr-12"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" disabled={isSearching} className="w-full">
                      {isSearching ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Mencari...
                        </>
                      ) : (
                        <>
                          <Search className="w-4 h-4 mr-2" />
                          Cari Booking
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </motion.div>

          {/* Results */}
          <AnimatePresence mode="wait">
            {hasSearched && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4"
              >
                {bookings.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                        <Search className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <h3 className="font-serif text-xl mb-2 font-bold">Tidak Ditemukan</h3>
                      <p className="text-muted-foreground">
                        Tidak ada booking yang ditemukan untuk email <strong>{searchedEmail}</strong>.
                        <br />
                        Pastikan email yang Anda masukkan sudah benar.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    <div className="text-center mb-6">
                      <p className="text-muted-foreground">
                        Ditemukan <strong>{bookings.length}</strong> booking untuk <strong>{searchedEmail}</strong>
                      </p>
                    </div>

                    {bookings.map((booking, index) => {
                      const statusConfig = getStatusConfig(booking.status);
                      const StatusIcon = statusConfig.icon;

                      return (
                        <motion.div
                          key={booking.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <Card>
                            <CardHeader className="pb-3">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <CardTitle className="text-lg font-serif font-bold">
                                  {booking.event_name}
                                </CardTitle>
                                <Badge variant={statusConfig.variant} className="self-start sm:self-center">
                                  <StatusIcon className="w-3 h-3 mr-1" />
                                  {statusConfig.label}
                                </Badge>
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              {/* Status Description */}
                              <div className={`flex items-start gap-3 p-3 rounded-lg bg-secondary/50`}>
                                <StatusIcon className={`w-5 h-5 ${statusConfig.color} flex-shrink-0 mt-0.5`} />
                                <p className="text-sm">{statusConfig.description}</p>
                              </div>

                              {/* Booking Details */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                                <div className="flex items-start gap-3">
                                  <MapPin className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                                  <div>
                                    <p className="text-muted-foreground text-xs">Lokasi</p>
                                    <p className="font-medium">{booking.locations?.name || '-'}</p>
                                  </div>
                                </div>

                                <div className="flex items-start gap-3">
                                  <CalendarDays className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                                  <div>
                                    <p className="text-muted-foreground text-xs">Tanggal</p>
                                    <p className="font-medium">
                                      {format(new Date(booking.booking_date), 'EEEE, dd MMMM yyyy', { locale: idLocale })}
                                    </p>
                                  </div>
                                </div>

                                {(booking.start_time || booking.end_time) && (
                                  <div className="flex items-start gap-3">
                                    <Clock className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                                    <div>
                                      <p className="text-muted-foreground text-xs">Waktu</p>
                                      <p className="font-medium">
                                        {booking.start_time?.slice(0, 5)}
                                        {booking.start_time && booking.end_time && ' - '}
                                        {booking.end_time?.slice(0, 5)}
                                      </p>
                                    </div>
                                  </div>
                                )}

                                {booking.guest_count && (
                                  <div className="flex items-start gap-3">
                                    <Users className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                                    <div>
                                      <p className="text-muted-foreground text-xs">Jumlah Tamu</p>
                                      <p className="font-medium">{booking.guest_count} orang</p>
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Event Type */}
                              {booking.event_type && (
                                <div className="pt-2 border-t">
                                  <p className="text-xs text-muted-foreground">Jenis Acara</p>
                                  <p className="text-sm font-medium">{booking.event_type}</p>
                                </div>
                              )}

                              {/* Submitted Date */}
                              <div className="pt-2 border-t text-xs text-muted-foreground">
                                Booking dibuat pada {format(new Date(booking.created_at), 'dd MMMM yyyy, HH:mm', { locale: idLocale })}
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      );
                    })}
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>
    </Layout>
  );
};

export default BookingTrack;
