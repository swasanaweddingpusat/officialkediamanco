import { ReactNode, useState, lazy, Suspense } from 'react';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
const BallroomBookingForm = lazy(() => import('@/components/booking/BallroomBookingForm').then(module => ({ default: module.BallroomBookingForm })));

interface BookingDialogProps {
  children?: ReactNode;
  locationId?: string;
  locationName?: string;
  /** Tanggal yang sudah dipilih pengunjung (yyyy-MM-dd), supaya tidak perlu memilih ulang. */
  initialDate?: string;
  /** Paket yang sudah dipilih (venue_packages.id). */
  initialPackageId?: string;
  /** Mode terkontrol (dibuka dari luar, mis. kotak booking di halaman venue). */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function BookingDialog({ children, locationId, locationName, initialDate, initialPackageId, open: controlledOpen, onOpenChange }: BookingDialogProps) {
  const [uncontrolled, setUncontrolled] = useState(false);
  const open = controlledOpen ?? uncontrolled;
  const setOpen = (v: boolean) => { if (onOpenChange) onOpenChange(v); else setUncontrolled(v); };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        {open && <Suspense fallback={<div className="min-h-64 flex items-center justify-center" role="status">Memuat formulir…</div>}><BallroomBookingForm
          locationId={locationId}
          locationName={locationName}
          initialDate={initialDate}
          initialPackageId={initialPackageId}
          onClose={() => setOpen(false)}
        /></Suspense>}
      </DialogContent>
    </Dialog>
  );
}
