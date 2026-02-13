import { useState } from 'react';
import { Plus, Pencil, Trash2, Mail, Phone, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { LivingAppsService } from '@/services/livingAppsService';
import type { Dozenten } from '@/types/app';

interface DozentenTabProps {
  dozenten: Dozenten[];
  onRefresh: () => void;
}

export function DozentenTab({ dozenten, onRefresh }: DozentenTabProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedDozent, setSelectedDozent] = useState<Dozenten | null>(null);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    telefon: '',
    fachgebiet: '',
  });

  const resetForm = () => {
    setFormData({ name: '', email: '', telefon: '', fachgebiet: '' });
    setSelectedDozent(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEditDialog = (dozent: Dozenten) => {
    setSelectedDozent(dozent);
    setFormData({
      name: dozent.fields.name || '',
      email: dozent.fields.email || '',
      telefon: dozent.fields.telefon || '',
      fachgebiet: dozent.fields.fachgebiet || '',
    });
    setDialogOpen(true);
  };

  const openDeleteDialog = (dozent: Dozenten) => {
    setSelectedDozent(dozent);
    setDeleteDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (selectedDozent) {
        await LivingAppsService.updateDozentenEntry(selectedDozent.record_id, formData);
      } else {
        await LivingAppsService.createDozentenEntry(formData);
      }
      setDialogOpen(false);
      resetForm();
      onRefresh();
    } catch (error) {
      console.error('Error saving dozent:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedDozent) return;
    setLoading(true);
    try {
      await LivingAppsService.deleteDozentenEntry(selectedDozent.record_id);
      setDeleteDialogOpen(false);
      setSelectedDozent(null);
      onRefresh();
    } catch (error) {
      console.error('Error deleting dozent:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="section-header">Dozenten</h2>
        <Button onClick={openCreateDialog}>
          <Plus className="size-4" />
          Dozent hinzufügen
        </Button>
      </div>

      <div className="stat-card p-0 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>E-Mail</TableHead>
              <TableHead>Telefon</TableHead>
              <TableHead>Fachgebiet</TableHead>
              <TableHead className="w-24">Aktionen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {dozenten.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  Noch keine Dozenten vorhanden
                </TableCell>
              </TableRow>
            ) : (
              dozenten.map((dozent) => (
                <TableRow key={dozent.record_id}>
                  <TableCell className="font-medium">{dozent.fields.name}</TableCell>
                  <TableCell>
                    <span className="flex items-center gap-2">
                      <Mail className="size-3.5 text-muted-foreground" />
                      {dozent.fields.email}
                    </span>
                  </TableCell>
                  <TableCell>
                    {dozent.fields.telefon && (
                      <span className="flex items-center gap-2">
                        <Phone className="size-3.5 text-muted-foreground" />
                        {dozent.fields.telefon}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {dozent.fields.fachgebiet && (
                      <span className="badge-primary">
                        <BookOpen className="size-3 mr-1" />
                        {dozent.fields.fachgebiet}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon-sm" onClick={() => openEditDialog(dozent)}>
                        <Pencil className="size-4" />
                      </Button>
                      <Button variant="ghost" size="icon-sm" onClick={() => openDeleteDialog(dozent)}>
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedDozent ? 'Dozent bearbeiten' : 'Neuer Dozent'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-Mail *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefon">Telefon</Label>
              <Input
                id="telefon"
                value={formData.telefon}
                onChange={(e) => setFormData({ ...formData, telefon: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fachgebiet">Fachgebiet</Label>
              <Input
                id="fachgebiet"
                value={formData.fachgebiet}
                onChange={(e) => setFormData({ ...formData, fachgebiet: e.target.value })}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Abbrechen
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Speichern...' : 'Speichern'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Dozent löschen"
        description={`Möchten Sie den Dozenten "${selectedDozent?.fields.name}" wirklich löschen?`}
        onConfirm={handleDelete}
        loading={loading}
      />
    </div>
  );
}
