import { ReactNode } from 'react';
import { Pencil, Trash2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card } from '@/components/ui/card';

interface Column<T> {
  key: keyof T | string;
  label: string;
  render?: (item: T) => ReactNode;
}

interface AdminTableProps<T> {
  data: T[];
  columns: Column<T>[];
  onEdit: (item: T) => void;
  onDelete: (item: T) => void;
  onCreate: () => void;
  createLabel?: string;
  isLoading?: boolean;
}

export function AdminTable<T extends { id: string }>({
  data,
  columns,
  onEdit,
  onDelete,
  onCreate,
  createLabel = 'Tambah baru',
  isLoading,
}: AdminTableProps<T>) {
  return (
    <Card className="ota-card p-4 md:p-6 border-0">
      <div className="flex justify-between items-center mb-6">
        <p className="text-sm text-muted-foreground">{data.length} data</p>
        <Button onClick={onCreate}>
          <Plus className="w-4 h-4 mr-2" />
          {createLabel}
        </Button>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-muted-foreground">Memuat…</div>
      ) : data.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">Belum ada data. Klik "{createLabel}" untuk mulai.</div>
      ) : (
        <div className="-mx-4 md:mx-0 overflow-x-auto"><Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead key={String(col.key)}>{col.label}</TableHead>
              ))}
              <TableHead className="w-24 text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item) => (
              <TableRow key={item.id}>
                {columns.map((col) => (
                  <TableCell key={String(col.key)}>
                    {col.render
                      ? col.render(item)
                      : String((item as Record<string, unknown>)[col.key as string] ?? '-')}
                  </TableCell>
                ))}
                <TableCell>
                  <div className="flex gap-1 justify-end">
                    <Button variant="ghost" size="icon" aria-label="Ubah" onClick={() => onEdit(item)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" aria-label="Hapus" onClick={() => onDelete(item)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table></div>
      )}
    </Card>
  );
}
