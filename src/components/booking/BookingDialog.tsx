import { ReactNode, useState, lazy, Suspense } from 'react';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
const BallroomBookingForm = lazy(() => import('@/components/booking/BallroomBookingForm').then(module => ({ default: module.BallroomBookingForm })));

interface BookingDialogProps {
  children: ReactNode;
  locationId?: string;
  locationName?: string;
}

export function BookingDialog({ children, locationId, locationName }: BookingDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        {open && <Suspense fallback={<div className="min-h-64 flex items-center justify-center" role="status">Memuat formulir…</div>}><BallroomBookingForm
          locationId={locationId}
          locationName={locationName}
          onClose={() => setOpen(false)}
        /></Suspense>}
      </DialogContent>
    </Dialog>
  );
}
