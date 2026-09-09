import { ReactNode, useState } from 'react';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { BallroomBookingForm } from '@/components/booking/BallroomBookingForm';

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
        <BallroomBookingForm
          locationId={locationId}
          locationName={locationName}
          onClose={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
