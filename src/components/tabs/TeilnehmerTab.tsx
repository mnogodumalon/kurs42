import { useState } from 'react';
import { Plus, Pencil, Trash2, Mail, Phone, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
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
import type { Teilnehmer } from '@/types/app';

interface TeilnehmerTabProps {
  teilnehmer: Teilnehmer[];
  onRefresh: () => void;
}

export function TeilnehmerTab({ teilnehmer, onRefresh }: TeilnehmerTabProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTeilnehmer, setSelectedTeilnehmer] = useState<Teilnehmer | null>(null);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    telefon: '',
    geburtsdatum: '',
  });

  const resetForm = () => {
    setFormData({ name: '', email: '', telefon: '', geburtsdatum: '' });
    setSelectedTeilnehmer(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEditDialog = (tn: Teilnehmer) => {
    setSelectedTeilnehmer(tn);
    setFormData({
      name: tn.fields.name || '',
      email: tn.fields.email || '',
      telefon: tn.fields.telefon || '',
      geburtsdatum: tn.fields.geburtsdatum || '',
    });
    setDialogOpen(true);
  };

  const openDeleteDialog = (tn: Teilnehmer) => {
    setSelectedTeilnehmer(tn);
    setDeleteDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = {
        ...formData,
        geburtsdatum: formData.geburtsdatum || undefined,
      };
      if (selectedTeilnehmer) {
        await LivingAppsService.updateTeilnehmerEntry(selectedTeilnehmer.record_id, data);
      } else {
        await LivingAppsService.createTeilnehmerEntry(data);
      }
      setDialogOpen(false);
      resetForm();
      onRefresh();
    } catch (error) {
      console.error('Error saving teilnehmer:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedTeilnehmer) return;
    setLoading(true);
    try {
      await LivingAppsService.deleteTeilnehmerEntry(selectedTeilnehmer.record_id);
      setDeleteDialogOpen(false);
      setSelectedTeilnehmer(null);
      onRefresh();
    } catch (error) {
      console.error('Error deleting teilnehmer:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    try {
      return format(new Date(dateStr), 'dd.MM.yyyy', { locale: de });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="section-header">Teilnehmer</h2>
        <Button onClick={openCreateDialog}>
          <Plus className="size-4" />
          Teilnehmer hinzufügen
        </Button>
      </div>

      <div className="stat-card p-0 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>E-Mail</TableHead>
              <TableHead>Telefon</TableHead>
              <TableHead>Geburtsdatum</TableHead>
              <TableHead className="w-24">Aktionen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {teilnehmer.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  Noch keine Teilnehmer vorhanden
                </TableCell>
              </TableRow>
            ) : (
              teilnehmer.map((tn) => (
                <TableRow key={tn.record_id}>
                  <TableCell className="font-medium">{tn.fields.name}</TableCell>
                  <TableCell>
                    <span className="flex items-center gap-2">
                      <Mail className="size-3.5 text-muted-foreground" />
                      {tn.fields.email}
                    </span>
                  </TableCell>
                  <TableCell>
                    {tn.fields.telefon ? (
                      <span className="flex items-center gap-2">
                        <Phone className="size-3.5 text-muted-foreground" />
                        {tn.fields.telefon}
                      </span>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>
                    {tn.fields.geburtsdatum ? (
                      <span className="flex items-center gap-2">
                        <Calendar className="size-3.5 text-muted-foreground" />
                        {formatDate(tn.fields.geburtsdatum)}
                      </span>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon-sm" onClick={() => openEditDialog(tn)}>
                        <Pencil className="size-4" />
                      </Button>
                      <Button variant="ghost" size="icon-sm" onClick={() => openDeleteDialog(tn)}>
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
            <DialogTitle>{selectedTeilnehmer ? 'Teilnehmer bearbeiten' : 'Neuer Teilnehmer'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tn-name">Name *</Label>
              <Input
                id="tn-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tn-email">E-Mail *</Label>
              <Input
                id="tn-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tn-telefon">Telefon</Label>
              <Input
                id="tn-telefon"
                value={formData.telefon}
                onChange={(e) => setFormData({ ...formData, telefon: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tn-geburtsdatum">Geburtsdatum</Label>
              <Input
                id="tn-geburtsdatum"
                type="date"
                value={formData.geburtsdatum}
                onChange={(e) => setFormData({ ...formData, geburtsdatum: e.target.value })}
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
        title="Teilnehmer löschen"
        description={`Möchten Sie den Teilnehmer "${selectedTeilnehmer?.fields.name}" wirklich löschen?`}
        onConfirm={handleDelete}
        loading={loading}
      />
    </div>
  );
}
