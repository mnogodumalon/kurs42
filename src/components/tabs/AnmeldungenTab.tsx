import { useState } from 'react';
import { Plus, Pencil, Trash2, Calendar, CheckCircle2, XCircle } from 'lucide-react';
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
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { LivingAppsService, extractRecordId, createRecordUrl } from '@/services/livingAppsService';
import { APP_IDS } from '@/types/app';
import type { Anmeldungen, Teilnehmer, Kurse } from '@/types/app';

interface AnmeldungenTabProps {
  anmeldungen: Anmeldungen[];
  teilnehmer: Teilnehmer[];
  kurse: Kurse[];
  onRefresh: () => void;
}

export function AnmeldungenTab({ anmeldungen, teilnehmer, kurse, onRefresh }: AnmeldungenTabProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedAnmeldung, setSelectedAnmeldung] = useState<Anmeldungen | null>(null);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    teilnehmer: '',
    kurs: '',
    anmeldedatum: format(new Date(), 'yyyy-MM-dd'),
    bezahlt: false,
  });

  const resetForm = () => {
    setFormData({
      teilnehmer: '',
      kurs: '',
      anmeldedatum: format(new Date(), 'yyyy-MM-dd'),
      bezahlt: false,
    });
    setSelectedAnmeldung(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEditDialog = (anm: Anmeldungen) => {
    setSelectedAnmeldung(anm);
    setFormData({
      teilnehmer: extractRecordId(anm.fields.teilnehmer) || '',
      kurs: extractRecordId(anm.fields.kurs) || '',
      anmeldedatum: anm.fields.anmeldedatum || format(new Date(), 'yyyy-MM-dd'),
      bezahlt: anm.fields.bezahlt || false,
    });
    setDialogOpen(true);
  };

  const openDeleteDialog = (anm: Anmeldungen) => {
    setSelectedAnmeldung(anm);
    setDeleteDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = {
        teilnehmer: createRecordUrl(APP_IDS.TEILNEHMER, formData.teilnehmer),
        kurs: createRecordUrl(APP_IDS.KURSE, formData.kurs),
        anmeldedatum: formData.anmeldedatum,
        bezahlt: formData.bezahlt,
      };
      if (selectedAnmeldung) {
        await LivingAppsService.updateAnmeldungenEntry(selectedAnmeldung.record_id, data);
      } else {
        await LivingAppsService.createAnmeldungenEntry(data);
      }
      setDialogOpen(false);
      resetForm();
      onRefresh();
    } catch (error) {
      console.error('Error saving anmeldung:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedAnmeldung) return;
    setLoading(true);
    try {
      await LivingAppsService.deleteAnmeldungenEntry(selectedAnmeldung.record_id);
      setDeleteDialogOpen(false);
      setSelectedAnmeldung(null);
      onRefresh();
    } catch (error) {
      console.error('Error deleting anmeldung:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleBezahlt = async (anm: Anmeldungen) => {
    try {
      await LivingAppsService.updateAnmeldungenEntry(anm.record_id, {
        bezahlt: !anm.fields.bezahlt,
      });
      onRefresh();
    } catch (error) {
      console.error('Error updating bezahlt:', error);
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

  const getTeilnehmerName = (tnUrl?: string) => {
    const id = extractRecordId(tnUrl);
    if (!id) return '-';
    const tn = teilnehmer.find((t) => t.record_id === id);
    return tn?.fields.name || '-';
  };

  const getKursTitle = (kursUrl?: string) => {
    const id = extractRecordId(kursUrl);
    if (!id) return '-';
    const kurs = kurse.find((k) => k.record_id === id);
    return kurs?.fields.titel || '-';
  };

  const getAnmeldungDescription = () => {
    const tnName = getTeilnehmerName(selectedAnmeldung?.fields.teilnehmer);
    const kursTitle = getKursTitle(selectedAnmeldung?.fields.kurs);
    return `Möchten Sie die Anmeldung von "${tnName}" für den Kurs "${kursTitle}" wirklich löschen?`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="section-header">Anmeldungen</h2>
        <Button onClick={openCreateDialog}>
          <Plus className="size-4" />
          Anmeldung hinzufügen
        </Button>
      </div>

      <div className="stat-card p-0 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Teilnehmer</TableHead>
              <TableHead>Kurs</TableHead>
              <TableHead>Anmeldedatum</TableHead>
              <TableHead>Bezahlt</TableHead>
              <TableHead className="w-24">Aktionen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {anmeldungen.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  Noch keine Anmeldungen vorhanden
                </TableCell>
              </TableRow>
            ) : (
              anmeldungen.map((anm) => (
                <TableRow key={anm.record_id}>
                  <TableCell className="font-medium">{getTeilnehmerName(anm.fields.teilnehmer)}</TableCell>
                  <TableCell>{getKursTitle(anm.fields.kurs)}</TableCell>
                  <TableCell>
                    <span className="flex items-center gap-2">
                      <Calendar className="size-3.5 text-muted-foreground" />
                      {formatDate(anm.fields.anmeldedatum)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <button
                      type="button"
                      onClick={() => toggleBezahlt(anm)}
                      className="cursor-pointer"
                    >
                      {anm.fields.bezahlt ? (
                        <span className="badge-success">
                          <CheckCircle2 className="size-3 mr-1" />
                          Bezahlt
                        </span>
                      ) : (
                        <span className="badge-warning">
                          <XCircle className="size-3 mr-1" />
                          Offen
                        </span>
                      )}
                    </button>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon-sm" onClick={() => openEditDialog(anm)}>
                        <Pencil className="size-4" />
                      </Button>
                      <Button variant="ghost" size="icon-sm" onClick={() => openDeleteDialog(anm)}>
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
            <DialogTitle>{selectedAnmeldung ? 'Anmeldung bearbeiten' : 'Neue Anmeldung'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Teilnehmer *</Label>
              <Select
                value={formData.teilnehmer}
                onValueChange={(value) => setFormData({ ...formData, teilnehmer: value })}
                required
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Teilnehmer auswählen" />
                </SelectTrigger>
                <SelectContent>
                  {teilnehmer.map((tn) => (
                    <SelectItem key={tn.record_id} value={tn.record_id}>
                      {tn.fields.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Kurs *</Label>
              <Select
                value={formData.kurs}
                onValueChange={(value) => setFormData({ ...formData, kurs: value })}
                required
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Kurs auswählen" />
                </SelectTrigger>
                <SelectContent>
                  {kurse.map((k) => (
                    <SelectItem key={k.record_id} value={k.record_id}>
                      {k.fields.titel}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="anm-datum">Anmeldedatum *</Label>
              <Input
                id="anm-datum"
                type="date"
                value={formData.anmeldedatum}
                onChange={(e) => setFormData({ ...formData, anmeldedatum: e.target.value })}
                required
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="anm-bezahlt"
                checked={formData.bezahlt}
                onCheckedChange={(checked) => setFormData({ ...formData, bezahlt: checked === true })}
              />
              <Label htmlFor="anm-bezahlt" className="cursor-pointer">
                Bereits bezahlt
              </Label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Abbrechen
              </Button>
              <Button type="submit" disabled={loading || !formData.teilnehmer || !formData.kurs}>
                {loading ? 'Speichern...' : 'Speichern'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Anmeldung löschen"
        description={getAnmeldungDescription()}
        onConfirm={handleDelete}
        loading={loading}
      />
    </div>
  );
}
