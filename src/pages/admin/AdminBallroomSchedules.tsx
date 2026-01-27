import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminTable } from '@/components/admin/AdminTable';
import { AdminFormDialog } from '@/components/admin/AdminFormDialog';
import { DeleteConfirmDialog } from '@/components/admin/DeleteConfirmDialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  useLocations,
  useBallroomSchedules, 
  useCreateBallroomSchedule, 
  useUpdateBallroomSchedule, 
  useDeleteBallroomSchedule 
} from '@/hooks/useCMS';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

type BallroomSchedule = {
  id: string;
  location_id: string;
  schedule_date: string;
  start_time: string | null;
  end_time: string | null;
  status: string;
  event_name: string | null;
  notes: string | null;
};

const STATUS_OPTIONS = [
  { value: 'available', label: 'Available', color: 'bg-green-500' },
  { value: 'booked', label: 'Booked', color: 'bg-red-500' },
  { value: 'blocked', label: 'Blocked', color: 'bg-gray-500' },
];

const AdminBallroomSchedules = () => {
  const { data: locations = [] } = useLocations();
  const [selectedLocationId, setSelectedLocationId] = useState<string>('');
  const { data: schedules = [], isLoading } = useBallroomSchedules(selectedLocationId || undefined);
  
  const createMutation = useCreateBallroomSchedule();
  const updateMutation = useUpdateBallroomSchedule();
  const deleteMutation = useDeleteBallroomSchedule();

  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<BallroomSchedule | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    location_id: '',
    schedule_date: '',
    start_time: '',
    end_time: '',
    status: 'available',
    event_name: '',
    notes: '',
  });

  const resetForm = () => {
    setFormData({
      location_id: selectedLocationId || '',
      schedule_date: '',
      start_time: '',
      end_time: '',
      status: 'available',
      event_name: '',
      notes: '',
    });
    setEditingItem(null);
  };

  const handleCreate = () => {
    resetForm();
    setFormData(prev => ({ ...prev, location_id: selectedLocationId }));
    setFormOpen(true);
  };

  const handleEdit = (item: BallroomSchedule) => {
    setEditingItem(item);
    setFormData({
      location_id: item.location_id,
      schedule_date: item.schedule_date,
      start_time: item.start_time || '',
      end_time: item.end_time || '',
      status: item.status,
      event_name: item.event_name || '',
      notes: item.notes || '',
    });
    setFormOpen(true);
  };

  const handleDelete = (item: BallroomSchedule) => {
    setDeletingId(item.id);
    setDeleteOpen(true);
  };

  const handleSubmit = async () => {
    const submitData = {
      location_id: formData.location_id,
      schedule_date: formData.schedule_date,
      start_time: formData.start_time || undefined,
      end_time: formData.end_time || undefined,
      status: formData.status,
      event_name: formData.event_name || undefined,
      notes: formData.notes || undefined,
    };

    if (editingItem) {
      await updateMutation.mutateAsync({ id: editingItem.id, ...submitData });
    } else {
      await createMutation.mutateAsync(submitData);
    }
    setFormOpen(false);
    resetForm();
  };

  const handleConfirmDelete = async () => {
    if (deletingId) {
      await deleteMutation.mutateAsync(deletingId);
      setDeleteOpen(false);
      setDeletingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusOption = STATUS_OPTIONS.find(s => s.value === status);
    return (
      <Badge 
        variant={status === 'available' ? 'default' : status === 'booked' ? 'destructive' : 'secondary'}
      >
        {statusOption?.label || status}
      </Badge>
    );
  };

  const columns = [
    {
      key: 'schedule_date',
      label: 'Tanggal',
      render: (item: BallroomSchedule) => (
        <span className="font-medium">
          {format(new Date(item.schedule_date), 'dd MMMM yyyy', { locale: idLocale })}
        </span>
      ),
    },
    {
      key: 'time',
      label: 'Waktu',
      render: (item: BallroomSchedule) => {
        if (item.start_time && item.end_time) {
          return `${item.start_time.slice(0, 5)} - ${item.end_time.slice(0, 5)}`;
        }
        if (item.start_time) return `Dari ${item.start_time.slice(0, 5)}`;
        if (item.end_time) return `Sampai ${item.end_time.slice(0, 5)}`;
        return 'Sepanjang hari';
      },
    },
    {
      key: 'status',
      label: 'Status',
      render: (item: BallroomSchedule) => getStatusBadge(item.status),
    },
    {
      key: 'event_name',
      label: 'Nama Acara',
      render: (item: BallroomSchedule) => item.event_name || '-',
    },
  ];

  return (
    <AdminLayout title="Jadwal Ballroom">
      <div className="space-y-6">
        {/* Location Selector */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="w-full sm:w-72">
            <Label className="mb-2 block">Pilih Lokasi</Label>
            <Select
              value={selectedLocationId}
              onValueChange={setSelectedLocationId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih lokasi..." />
              </SelectTrigger>
              <SelectContent>
                {locations.map((loc) => (
                  <SelectItem key={loc.id} value={loc.id}>
                    {loc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {selectedLocationId ? (
          <AdminTable
            data={schedules as BallroomSchedule[]}
            columns={columns}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onCreate={handleCreate}
            createLabel="Tambah Jadwal"
            isLoading={isLoading}
          />
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            Pilih lokasi untuk melihat dan mengelola jadwal ballroom
          </div>
        )}
      </div>

      <AdminFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        title={editingItem ? 'Edit Jadwal' : 'Tambah Jadwal'}
        onSubmit={handleSubmit}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      >
        <div className="space-y-4">
          <div>
            <Label>Lokasi *</Label>
            <Select
              value={formData.location_id}
              onValueChange={(value) => setFormData({ ...formData, location_id: value })}
              disabled={!!editingItem}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih lokasi..." />
              </SelectTrigger>
              <SelectContent>
                {locations.map((loc) => (
                  <SelectItem key={loc.id} value={loc.id}>
                    {loc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label>Tanggal *</Label>
            <Input
              type="date"
              value={formData.schedule_date}
              onChange={(e) => setFormData({ ...formData, schedule_date: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Jam Mulai</Label>
              <Input
                type="time"
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
              />
            </div>
            <div>
              <Label>Jam Selesai</Label>
              <Input
                type="time"
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label>Status *</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData({ ...formData, status: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Nama Acara</Label>
            <Input
              value={formData.event_name}
              onChange={(e) => setFormData({ ...formData, event_name: e.target.value })}
              placeholder="Nama acara yang booking..."
            />
          </div>

          <div>
            <Label>Catatan</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Catatan tambahan..."
              rows={3}
            />
          </div>
        </div>
      </AdminFormDialog>

      <DeleteConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={handleConfirmDelete}
        isDeleting={deleteMutation.isPending}
        title="Hapus Jadwal"
      />
    </AdminLayout>
  );
};

export default AdminBallroomSchedules;
