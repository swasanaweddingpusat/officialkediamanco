import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminFormDialog } from '@/components/admin/AdminFormDialog';
import { DeleteConfirmDialog } from '@/components/admin/DeleteConfirmDialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { 
  useLocations,
  useBallroomBookings, 
  useUpdateBallroomBooking, 
  useDeleteBallroomBooking,
  useCreateBallroomSchedule,
} from '@/hooks/useCMS';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Eye, Check, X, Trash2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

const bookingCode = (id: string) => `KDM-${id.replace(/-/g, '').slice(0, 8).toUpperCase()}`;

type BallroomBooking = {
  id: string;
  location_id: string;
  booking_date: string | null;
  start_time: string | null;
  end_time: string | null;
  contact_name: string;
  contact_email: string | null;
  contact_phone: string;
  event_name: string | null;
  event_type: string | null;
  guest_count: number | null;
  package_name?: string | null;
  notes: string | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
  locations?: { name: string } | null;
};

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending', variant: 'secondary' as const },
  { value: 'approved', label: 'Approved', variant: 'default' as const },
  { value: 'rejected', label: 'Rejected', variant: 'destructive' as const },
  { value: 'cancelled', label: 'Cancelled', variant: 'outline' as const },
];

const AdminBallroomBookings = () => {
  const { data: locations = [] } = useLocations();
  const [selectedLocationId, setSelectedLocationId] = useState<string>('all');
  const { data: bookings = [], isLoading } = useBallroomBookings(
    selectedLocationId === 'all' ? undefined : selectedLocationId
  );
  
  const updateMutation = useUpdateBallroomBooking();
  const deleteMutation = useDeleteBallroomBooking();
  const createScheduleMutation = useCreateBallroomSchedule();

  const [viewOpen, setViewOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<BallroomBooking | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [approveDate, setApproveDate] = useState('');

  const handleView = (booking: BallroomBooking) => {
    setSelectedBooking(booking);
    setAdminNotes(booking.admin_notes || '');
    setApproveDate(booking.booking_date || '');
    setViewOpen(true);
  };

  const handleApprove = async (booking: BallroomBooking) => {
    const scheduleDate = booking.booking_date || approveDate;
    if (!scheduleDate) {
      toast.error('Isi tanggal acara dulu sebelum approve (form ringkas tidak meminta tanggal).');
      return;
    }
    try {
      // Update booking status
      await updateMutation.mutateAsync({
        id: booking.id,
        status: 'approved',
        booking_date: scheduleDate,
        admin_notes: adminNotes || undefined,
      });

      // Create schedule entry to block the date
      await createScheduleMutation.mutateAsync({
        location_id: booking.location_id,
        schedule_date: scheduleDate,
        start_time: booking.start_time || undefined,
        end_time: booking.end_time || undefined,
        status: 'booked',
        event_name: booking.event_name || `Booking ${booking.contact_name}`,
        notes: `Booking oleh: ${booking.contact_name} (${bookingCode(booking.id)})`,
      });

      toast.success('Booking approved dan jadwal diupdate');
      setViewOpen(false);
    } catch (error) {
      toast.error('Gagal approve booking');
    }
  };

  const handleReject = async (booking: BallroomBooking) => {
    await updateMutation.mutateAsync({
      id: booking.id,
      status: 'rejected',
      admin_notes: adminNotes || undefined,
    });
    setViewOpen(false);
  };

  const handleDelete = (booking: BallroomBooking) => {
    setSelectedBooking(booking);
    setDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (selectedBooking) {
      await deleteMutation.mutateAsync(selectedBooking.id);
      setDeleteOpen(false);
      setSelectedBooking(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusOption = STATUS_OPTIONS.find(s => s.value === status);
    return (
      <Badge variant={statusOption?.variant || 'secondary'}>
        {statusOption?.label || status}
      </Badge>
    );
  };

  const pendingCount = bookings.filter(b => b.status === 'pending').length;

  return (
    <AdminLayout title="Booking Requests">
      <div className="space-y-6">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-64">
              <Select
                value={selectedLocationId}
                onValueChange={setSelectedLocationId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filter by location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Lokasi</SelectItem>
                  {locations.map((loc) => (
                    <SelectItem key={loc.id} value={loc.id}>
                      {loc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {pendingCount > 0 && (
              <Badge variant="destructive">
                {pendingCount} Pending
              </Badge>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tanggal</TableHead>
                <TableHead>Lokasi</TableHead>
                <TableHead>Acara</TableHead>
                <TableHead>Kontak</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={6}>
                      <Skeleton className="h-10 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : bookings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Belum ada booking request
                  </TableCell>
                </TableRow>
              ) : (
                (bookings as BallroomBooking[]).map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell>
                      <div className="font-medium">
                        {booking.booking_date ? format(new Date(booking.booking_date), 'dd MMM yyyy', { locale: idLocale }) : <span className="text-muted-foreground">Belum ditentukan</span>}
                      </div>
                      <div className="font-mono text-[11px] text-muted-foreground">{bookingCode(booking.id)}</div>
                      <div className="text-xs text-muted-foreground">
                        {booking.start_time?.slice(0, 5)} - {booking.end_time?.slice(0, 5)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {booking.locations?.name || '-'}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{booking.event_name || 'Permintaan booking'}</div>
                      {(booking.event_type || booking.guest_count) && (
                        <div className="text-xs text-muted-foreground">
                          {[booking.event_type, booking.guest_count ? `${booking.guest_count} tamu` : null].filter(Boolean).join(' • ')}
                        </div>
                      )}
                      {booking.notes && <div className="text-xs text-muted-foreground line-clamp-1 max-w-56">{booking.notes}</div>}
                      {booking.package_name && <div className="text-xs font-semibold text-primary">Paket: {booking.package_name}</div>}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{booking.contact_name}</div>
                      <div className="text-xs text-muted-foreground">{booking.contact_phone}</div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(booking.status)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleView(booking)}>
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          {booking.status === 'pending' && (
                            <>
                              <DropdownMenuItem onClick={() => {
                                setSelectedBooking(booking);
                                setAdminNotes('');
                                handleApprove(booking);
                              }}>
                                <Check className="w-4 h-4 mr-2" />
                                Quick Approve
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => {
                                setSelectedBooking(booking);
                                setAdminNotes('');
                                handleReject(booking);
                              }}>
                                <X className="w-4 h-4 mr-2" />
                                Quick Reject
                              </DropdownMenuItem>
                            </>
                          )}
                          <DropdownMenuItem 
                            onClick={() => handleDelete(booking)}
                            className="text-destructive"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* View/Edit Dialog */}
      <AdminFormDialog
        open={viewOpen}
        onOpenChange={setViewOpen}
        title="Detail Booking"
        onSubmit={() => {}}
        isSubmitting={false}
        hideSubmit
      >
        {selectedBooking && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground text-xs">Lokasi</Label>
                <p className="font-medium">{selectedBooking.locations?.name}</p>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">Status</Label>
                <div className="mt-1">{getStatusBadge(selectedBooking.status)}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground text-xs">Tanggal</Label>
                <p className="font-medium">
                  {selectedBooking.booking_date ? format(new Date(selectedBooking.booking_date), 'EEEE, dd MMMM yyyy', { locale: idLocale }) : 'Belum ditentukan'}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">Waktu</Label>
                <p className="font-medium">
                  {selectedBooking.start_time?.slice(0, 5)} - {selectedBooking.end_time?.slice(0, 5)}
                </p>
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold mb-3">Detail Acara</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground text-xs">Nama Acara</Label>
                  <p className="font-medium">{selectedBooking.event_name || '-'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Jenis Acara</Label>
                  <p className="font-medium">{selectedBooking.event_type || '-'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Paket dipilih</Label>
                  <p className="font-medium">{selectedBooking.package_name || 'Belum memilih (minta rekomendasi)'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Jumlah Tamu</Label>
                  <p className="font-medium">{selectedBooking.guest_count || '-'}</p>
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold mb-3">Informasi Kontak</h4>
              <div className="grid grid-cols-1 gap-2">
                <div>
                  <Label className="text-muted-foreground text-xs">Nama</Label>
                  <p className="font-medium">{selectedBooking.contact_name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Email</Label>
                  <p className="font-medium">{selectedBooking.contact_email || '-'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Telepon</Label>
                  <p className="font-medium">{selectedBooking.contact_phone}</p>
                </div>
              </div>
            </div>

            {selectedBooking.notes && (
              <div className="border-t pt-4">
                <Label className="text-muted-foreground text-xs">Pesan dari customer</Label>
                <p className="mt-1 text-sm bg-secondary p-3 rounded-lg">{selectedBooking.notes}</p>
              </div>
            )}

            {selectedBooking.status === 'pending' && (
              <div className="border-t pt-4 space-y-4">
                {!selectedBooking.booking_date && (
                  <div>
                    <Label>Tanggal acara (wajib untuk approve)</Label>
                    <Input type="date" value={approveDate} onChange={(e) => setApproveDate(e.target.value)} />
                  </div>
                )}
                <div>
                  <Label>Catatan Admin (Opsional)</Label>
                  <Textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Catatan internal..."
                    rows={2}
                  />
                </div>
                <div className="flex gap-3">
                  <Button 
                    onClick={() => handleApprove(selectedBooking)}
                    disabled={updateMutation.isPending}
                    className="flex-1"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Approve
                  </Button>
                  <Button 
                    variant="destructive"
                    onClick={() => handleReject(selectedBooking)}
                    disabled={updateMutation.isPending}
                    className="flex-1"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Reject
                  </Button>
                </div>
              </div>
            )}

            {selectedBooking.admin_notes && (
              <div className="border-t pt-4">
                <Label className="text-muted-foreground text-xs">Catatan Admin</Label>
                <p className="mt-1 text-sm">{selectedBooking.admin_notes}</p>
              </div>
            )}
          </div>
        )}
      </AdminFormDialog>

      <DeleteConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={handleConfirmDelete}
        isDeleting={deleteMutation.isPending}
        title="Hapus Booking"
      />
    </AdminLayout>
  );
};

export default AdminBallroomBookings;
