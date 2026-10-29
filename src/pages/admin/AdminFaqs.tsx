// CMS: Bantuan / FAQ (tabel faqs).
import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminTable } from '@/components/admin/AdminTable';
import { AdminFormDialog } from '@/components/admin/AdminFormDialog';
import { DeleteConfirmDialog } from '@/components/admin/DeleteConfirmDialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useFaqs, useSaveRow, useDeleteRow, type Faq } from '@/hooks/useOta';

const SUGGESTED = ['Booking', 'Pembayaran', 'Survei venue', 'Hari acara', 'Umum'];
const empty = { category: 'Booking', question: '', answer: '', sort_order: 0, is_active: true };

const AdminFaqs = () => {
  const { data: faqs = [], isLoading } = useFaqs();
  const save = useSaveRow('faqs', 'FAQ');
  const remove = useDeleteRow('faqs', 'FAQ');
  const [formOpen, setFormOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Faq | null>(null);
  const [form, setForm] = useState(empty);

  const open = (item?: Faq) => {
    setEditing(item ?? null);
    setForm(item ? { category: item.category, question: item.question, answer: item.answer, sort_order: item.sort_order, is_active: item.is_active } : empty);
    setFormOpen(true);
  };
  const submit = async () => {
    if (!form.question.trim() || !form.answer.trim()) return;
    await save.mutateAsync({ id: editing?.id, ...form, category: form.category.trim() || 'Umum', question: form.question.trim(), answer: form.answer.trim() });
    setFormOpen(false);
  };
  const categories = [...new Set([...SUGGESTED, ...faqs.map((f) => f.category)])];

  const columns = [
    { key: 'question', label: 'Pertanyaan' },
    { key: 'category', label: 'Topik' },
    { key: 'sort_order', label: 'Urutan' },
    { key: 'is_active', label: 'Status', render: (i: Faq) => <Badge variant={i.is_active ? 'default' : 'secondary'}>{i.is_active ? 'Tampil' : 'Disembunyikan'}</Badge> },
  ];

  return (
    <AdminLayout title="Bantuan / FAQ">
      <p className="text-sm text-muted-foreground mb-4">Tampil di halaman /bantuan (dikelompokkan per topik) dan 5 teratas di beranda.</p>
      <AdminTable data={faqs} columns={columns} onEdit={open} onDelete={(i) => setDeleteId(i.id)} onCreate={() => open()} createLabel="Tambah FAQ" isLoading={isLoading} />
      <AdminFormDialog open={formOpen} onOpenChange={setFormOpen} title={editing ? 'Ubah FAQ' : 'Tambah FAQ'} onSubmit={submit} isSubmitting={save.isPending}>
        <div>
          <Label>Topik</Label>
          <Input list="faq-topics" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
          <datalist id="faq-topics">{categories.map((c) => <option key={c} value={c} />)}</datalist>
        </div>
        <div><Label>Pertanyaan *</Label><Input value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} placeholder="Apakah mengisi form booking dikenakan biaya?" /></div>
        <div><Label>Jawaban *</Label><Textarea rows={6} value={form.answer} onChange={(e) => setForm({ ...form, answer: e.target.value })} /></div>
        <div><Label>Urutan</Label><Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })} /></div>
        <div className="flex items-center gap-2"><Switch checked={form.is_active} onCheckedChange={(c) => setForm({ ...form, is_active: c })} /><Label>Tampilkan</Label></div>
      </AdminFormDialog>
      <DeleteConfirmDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)} onConfirm={async () => { if (deleteId) { await remove.mutateAsync(deleteId); setDeleteId(null); } }} isDeleting={remove.isPending} title="Hapus FAQ" />
    </AdminLayout>
  );
};

export default AdminFaqs;
