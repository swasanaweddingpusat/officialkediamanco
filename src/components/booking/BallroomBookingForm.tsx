// Form booking ringkas: Nama, Nomor HP, Venue, Pesan.
// Tanggal/paket yang sudah dipilih pengunjung di halaman sebelumnya ikut terkirim sebagai info tambahan
// (bisa dihapus), tanpa menambah kolom isian.
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, startOfToday } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { CheckCircle, Loader2, MessageCircle, CalendarDays, Package, X, Copy, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { track } from '@/lib/analytics';
import { useCreateBallroomBooking, useSiteSettings, useLocations, useTrackVenueInterest } from '@/hooks/useCMS';
import { useVenuePackages, formatRupiah } from '@/hooks/useOta';

const PHONE_RE = /^[+\d\s().-]+$/;

const bookingSchema = z.object({
  contact_name: z.string().trim().min(2, 'Nama minimal 2 karakter').max(100, 'Nama maksimal 100 karakter'),
  contact_phone: z
    .string()
    .trim()
    .regex(PHONE_RE, 'Nomor HP hanya boleh berisi angka')
    .refine((v) => { const d = v.replace(/\D/g, ''); return d.length >= 8 && d.length <= 15; }, 'Nomor HP 8–15 digit'),
  location_id: z.string().min(1, 'Pilih venue'),
  notes: z.string().trim().max(1000, 'Pesan maksimal 1000 karakter').optional(),
  website: z.string().optional(), // honeypot anti-bot, harus kosong
});

type BookingFormValues = z.infer<typeof bookingSchema>;

interface BallroomBookingFormProps {
  locationId?: string;
  locationName?: string;
  /** yyyy-MM-dd yang sudah dipilih di pencarian/halaman venue. */
  initialDate?: string;
  /** Paket yang sudah dipilih dari halaman venue / Paket & Harga. */
  initialPackageId?: string;
  onClose?: () => void;
}

const bookingCode = (id: string) => `KDM-${id.replace(/-/g, '').slice(0, 8).toUpperCase()}`;

export function BallroomBookingForm({ locationId: propLocationId, locationName: propLocationName, initialDate, initialPackageId, onClose }: BallroomBookingFormProps) {
  const { data: locations = [] } = useLocations();
  const { data: allPackages = [] } = useVenuePackages();
  const { data: settings } = useSiteSettings();
  const createBooking = useCreateBallroomBooking();
  const trackInterest = useTrackVenueInterest();

  const validInitialDate = initialDate && /^\d{4}-\d{2}-\d{2}$/.test(initialDate) && new Date(`${initialDate}T00:00:00`) >= startOfToday() ? initialDate : '';
  const [date, setDate] = useState(validInitialDate);
  const [packageId, setPackageId] = useState(initialPackageId ?? '');
  const [result, setResult] = useState<{ code: string; waLink: string } | null>(null);

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: { contact_name: '', contact_phone: '', location_id: propLocationId ?? '', notes: '', website: '' },
  });

  const venueOptions = useMemo(() => locations.filter((l) => l.is_active && !l.is_coming_soon), [locations]);
  const locationId = form.watch('location_id');
  const locationName = locations.find((l) => l.id === locationId)?.name || (locationId === propLocationId ? propLocationName : '') || '';
  // Paket hanya berlaku bila milik venue terpilih atau paket umum
  const pkg = allPackages.find((p) => p.id === packageId && (!p.location_id || p.location_id === locationId));

  const buildWaLink = (data: BookingFormValues, code: string) => {
    const rawNumber = settings?.phone?.replace(/[^0-9]/g, '') || settings?.whatsapp_link?.replace(/[^0-9]/g, '') || '6281117797567';
    const waNumber = rawNumber.startsWith('0') ? `62${rawNumber.slice(1)}` : rawNumber;
    const lines = [
      'Halo Kediaman, saya ingin reservasi venue.',
      '',
      `*Kode booking* : ${code}`,
      `*Nama* : ${data.contact_name}`,
      `*No. HP* : ${data.contact_phone}`,
      `*Venue* : ${locationName}`,
      date ? `*Tanggal* : ${format(new Date(`${date}T00:00:00`), 'EEEE, dd MMMM yyyy', { locale: idLocale })}` : null,
      pkg ? `*Paket* : ${pkg.name}` : null,
      data.notes ? `*Pesan* : ${data.notes}` : null,
    ].filter(Boolean) as string[];
    return `https://wa.me/${waNumber}?text=${encodeURIComponent(lines.join('\n'))}`;
  };

  const onSubmit = async (data: BookingFormValues) => {
    if (data.website) return; // bot
    try {
      const row = await createBooking.mutateAsync({
        location_id: data.location_id,
        contact_name: data.contact_name.trim(),
        contact_phone: data.contact_phone.trim(),
        notes: data.notes?.trim() || undefined,
        booking_date: date || undefined,
        package_id: pkg?.id,
        package_name: pkg?.name,
      });
      const code = bookingCode(String((row as { id?: string } | null)?.id ?? ''));
      if (date) trackInterest.mutate({ locationId: data.location_id, eventType: 'booking_request', scheduleDate: date });
      track('generate_lead', { lead_source: 'booking_form', venue_name: locationName, has_date: Boolean(date), has_package: Boolean(pkg) });
      const waLink = buildWaLink(data, code);
      setResult({ code, waLink });
      window.open(waLink, '_blank', 'noopener,noreferrer');
    } catch {
      // pesan error ditampilkan oleh mutation
    }
  };

  if (result) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-4">
        <CheckCircle className="size-14 text-primary mx-auto mb-3" />
        <h3 className="text-xl font-extrabold mb-1">Permintaan terkirim!</h3>
        <p className="text-sm text-muted-foreground mb-4">Tim kami akan menghubungi Anda lewat WhatsApp dalam 1×24 jam.</p>
        <div className="rounded-xl bg-secondary p-4 mb-4">
          <p className="text-xs text-muted-foreground">Kode booking Anda</p>
          <div className="mt-1 flex items-center justify-center gap-2">
            <span className="font-mono text-2xl font-extrabold tracking-wider text-primary">{result.code}</span>
            <button type="button" onClick={() => { navigator.clipboard?.writeText(result.code); toast.success('Kode disalin'); }} className="grid place-items-center size-8 rounded-lg hover:bg-card" aria-label="Salin kode booking">
              <Copy className="size-4" />
            </button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Simpan kode ini untuk cek status booking bersama nomor HP Anda.</p>
        </div>
        <a href={result.waLink} target="_blank" rel="noopener noreferrer" className="block mb-2">
          <Button className="w-full gap-2 h-11 rounded-xl font-bold"><MessageCircle className="size-4" />Lanjutkan ke WhatsApp</Button>
        </a>
        <a href="/booking/track" className="inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:underline mb-4"><Search className="size-4" />Cek status booking</a>
        <div><Button onClick={onClose} variant="outline" className="rounded-xl">Tutup</Button></div>
      </motion.div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="pb-3 border-b border-border">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Reservasi venue</p>
          <h3 className="text-xl font-extrabold mt-0.5">{locationName || 'Ajukan booking'}</h3>
          <p className="text-sm text-muted-foreground mt-1">Cukup isi 4 data di bawah, tim kami bantu cek tanggal & penawaran. Gratis, tanpa komitmen.</p>
        </div>

        <FormField control={form.control} name="contact_name" render={({ field }) => (
          <FormItem>
            <FormLabel>Nama *</FormLabel>
            <FormControl><Input className="h-11" autoComplete="name" placeholder="Nama lengkap" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="contact_phone" render={({ field }) => (
          <FormItem>
            <FormLabel>Nomor HP (WhatsApp) *</FormLabel>
            <FormControl><Input className="h-11" type="tel" inputMode="tel" autoComplete="tel" placeholder="08xxxxxxxxxx" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="location_id" render={({ field }) => (
          <FormItem>
            <FormLabel>Venue *</FormLabel>
            <Select value={field.value} onValueChange={field.onChange}>
              <FormControl>
                <SelectTrigger className="h-11"><SelectValue placeholder="Pilih venue" /></SelectTrigger>
              </FormControl>
              <SelectContent>
                {venueOptions.map((l) => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
                {propLocationId && !venueOptions.some((l) => l.id === propLocationId) && propLocationName && (
                  <SelectItem value={propLocationId}>{propLocationName}</SelectItem>
                )}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />

        {(date || pkg) && (
          <div className="flex flex-wrap gap-2" aria-label="Pilihan Anda sebelumnya">
            {date && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary pl-3 pr-1 py-1 text-xs font-bold text-primary">
                <CalendarDays className="size-3.5" aria-hidden="true" />{format(new Date(`${date}T00:00:00`), 'EEE, d MMM yyyy', { locale: idLocale })}
                <button type="button" onClick={() => setDate('')} className="grid place-items-center size-5 rounded-full hover:bg-card" aria-label="Hapus tanggal"><X className="size-3" /></button>
              </span>
            )}
            {pkg && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary pl-3 pr-1 py-1 text-xs font-bold text-primary">
                <Package className="size-3.5" aria-hidden="true" />{pkg.name}{pkg.price !== null ? ` · ${formatRupiah(pkg.price, { compact: true })}` : ''}
                <button type="button" onClick={() => setPackageId('')} className="grid place-items-center size-5 rounded-full hover:bg-card" aria-label="Hapus paket"><X className="size-3" /></button>
              </span>
            )}
          </div>
        )}

        <FormField control={form.control} name="notes" render={({ field }) => (
          <FormItem>
            <FormLabel>Pesan</FormLabel>
            <FormControl>
              <Textarea rows={4} placeholder="Contoh: rencana resepsi Desember 2026, ±800 tamu, mohon info paket & tanggal kosong." className="resize-none" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />

        {/* Honeypot: tersembunyi dari pengunjung & pembaca layar */}
        <input type="text" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" {...form.register('website')} />

        <Button type="submit" className="w-full h-12 rounded-xl text-base font-extrabold" disabled={createBooking.isPending}>
          {createBooking.isPending ? <><Loader2 className="size-4 mr-2 animate-spin" />Mengirim…</> : 'Kirim permintaan booking'}
        </Button>
        <p className="text-center text-xs text-muted-foreground">Data Anda hanya dipakai tim Kediaman untuk menghubungi Anda terkait booking ini.</p>
      </form>
    </Form>
  );
}
