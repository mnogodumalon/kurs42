import { useState } from 'react';
import { Plus, Pencil, Trash2, Building, Users } from 'lucide-react';
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
import type { Raeume } from '@/types/app';

interface RaeumeTabProps {
  raeume: Raeume[];
  onRefresh: () => void;
}

export function RaeumeTab({ raeume, onRefresh }: RaeumeTabProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedRaum, setSelectedRaum] = useState<Raeume | null>(null);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    raumname: '',
    gebaeude: '',
    kapazitaet: 0,
  });

  const resetForm = () => {
    setFormData({ raumname: '', gebaeude: '', kapazitaet: 0 });
    setSelectedRaum(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEditDialog = (raum: Raeume) => {
    setSelectedRaum(raum);
    setFormData({
      raumname: raum.fields.raumname || '',
      gebaeude: raum.fields.gebaeude || '',
      kapazitaet: raum.fields.kapazitaet || 0,
    });
    setDialogOpen(true);
  };

  const openDeleteDialog = (raum: Raeume) => {
    setSelectedRaum(raum);
    setDeleteDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (selectedRaum) {
        await LivingAppsService.updateRaeumeEntry(selectedRaum.record_id, formData);
      } else {
        await LivingAppsService.createRaeumeEntry(formData);
      }
      setDialogOpen(false);
      resetForm();
      onRefresh();
    } catch (error) {
      console.error('Error saving raum:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedRaum) return;
    setLoading(true);
    try {
      await LivingAppsService.deleteRaeumeEntry(selectedRaum.record_id);
      setDeleteDialogOpen(false);
      setSelectedRaum(null);
      onRefresh();
    } catch (error) {
      console.error('Error deleting raum:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="section-header">Räume</h2>
        <Button onClick={openCreateDialog}>
          <Plus className="size-4" />
          Raum hinzufügen
        </Button>
      </div>

      <div className="stat-card p-0 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Raumname</TableHead>
              <TableHead>Gebäude</TableHead>
              <TableHead>Kapazität</TableHead>
              <TableHead className="w-24">Aktionen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {raeume.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  Noch keine Räume vorhanden
                </TableCell>
              </TableRow>
            ) : (
              raeume.map((raum) => (
                <TableRow key={raum.record_id}>
                  <TableCell className="font-medium">{raum.fields.raumname}</TableCell>
                  <TableCell>
                    <span className="flex items-center gap-2">
                      <Building className="size-3.5 text-muted-foreground" />
                      {raum.fields.gebaeude}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="flex items-center gap-2">
                      <Users className="size-3.5 text-muted-foreground" />
                      {raum.fields.kapazitaet} Plätze
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon-sm" onClick={() => openEditDialog(raum)}>
                        <Pencil className="size-4" />
                      </Button>
                      <Button variant="ghost" size="icon-sm" onClick={() => openDeleteDialog(raum)}>
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
            <DialogTitle>{selectedRaum ? 'Raum bearbeiten' : 'Neuer Raum'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="raumname">Raumname *</Label>
              <Input
                id="raumname"
                value={formData.raumname}
                onChange={(e) => setFormData({ ...formData, raumname: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gebaeude">Gebäude *</Label>
              <Input
                id="gebaeude"
                value={formData.gebaeude}
                onChange={(e) => setFormData({ ...formData, gebaeude: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="kapazitaet">Kapazität *</Label>
              <Input
                id="kapazitaet"
                type="number"
                min="1"
                value={formData.kapazitaet}
                onChange={(e) => setFormData({ ...formData, kapazitaet: parseInt(e.target.value) || 0 })}
                required
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
        title="Raum löschen"
        description={`Möchten Sie den Raum "${selectedRaum?.fields.raumname}" wirklich löschen?`}
        onConfirm={handleDelete}
        loading={loading}
      />
    </div>
  );
}
