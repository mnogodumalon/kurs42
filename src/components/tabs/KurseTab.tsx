import { useState } from 'react';
import { Plus, Pencil, Trash2, Calendar, Euro, Users, MapPin, GraduationCap } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
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
import type { Kurse, Dozenten, Raeume } from '@/types/app';

interface KurseTabProps {
  kurse: Kurse[];
  dozenten: Dozenten[];
  raeume: Raeume[];
  onRefresh: () => void;
}

export function KurseTab({ kurse, dozenten, raeume, onRefresh }: KurseTabProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedKurs, setSelectedKurs] = useState<Kurse | null>(null);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    titel: '',
    beschreibung: '',
    startdatum: '',
    enddatum: '',
    max_teilnehmer: 20,
    preis: 0,
    dozent: '',
    raum: '',
  });

  const resetForm = () => {
    setFormData({
      titel: '',
      beschreibung: '',
      startdatum: '',
      enddatum: '',
      max_teilnehmer: 20,
      preis: 0,
      dozent: '',
      raum: '',
    });
    setSelectedKurs(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEditDialog = (kurs: Kurse) => {
    setSelectedKurs(kurs);
    setFormData({
      titel: kurs.fields.titel || '',
      beschreibung: kurs.fields.beschreibung || '',
      startdatum: kurs.fields.startdatum || '',
      enddatum: kurs.fields.enddatum || '',
      max_teilnehmer: kurs.fields.max_teilnehmer || 20,
      preis: kurs.fields.preis || 0,
      dozent: extractRecordId(kurs.fields.dozent) || '',
      raum: extractRecordId(kurs.fields.raum) || '',
    });
    setDialogOpen(true);
  };

  const openDeleteDialog = (kurs: Kurse) => {
    setSelectedKurs(kurs);
    setDeleteDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = {
        titel: formData.titel,
        beschreibung: formData.beschreibung || undefined,
        startdatum: formData.startdatum,
        enddatum: formData.enddatum,
        max_teilnehmer: formData.max_teilnehmer,
        preis: formData.preis,
        dozent: createRecordUrl(APP_IDS.DOZENTEN, formData.dozent),
        raum: createRecordUrl(APP_IDS.RAEUME, formData.raum),
      };
      if (selectedKurs) {
        await LivingAppsService.updateKurseEntry(selectedKurs.record_id, data);
      } else {
        await LivingAppsService.createKurseEntry(data);
      }
      setDialogOpen(false);
      resetForm();
      onRefresh();
    } catch (error) {
      console.error('Error saving kurs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedKurs) return;
    setLoading(true);
    try {
      await LivingAppsService.deleteKurseEntry(selectedKurs.record_id);
      setDeleteDialogOpen(false);
      setSelectedKurs(null);
      onRefresh();
    } catch (error) {
      console.error('Error deleting kurs:', error);
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

  const getDozentName = (dozentUrl?: string) => {
    const id = extractRecordId(dozentUrl);
    if (!id) return '-';
    const dozent = dozenten.find((d) => d.record_id === id);
    return dozent?.fields.name || '-';
  };

  const getRaumName = (raumUrl?: string) => {
    const id = extractRecordId(raumUrl);
    if (!id) return '-';
    const raum = raeume.find((r) => r.record_id === id);
    return raum ? `${raum.fields.raumname} (${raum.fields.gebaeude})` : '-';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="section-header">Kurse</h2>
        <Button onClick={openCreateDialog}>
          <Plus className="size-4" />
          Kurs hinzufügen
        </Button>
      </div>

      <div className="stat-card p-0 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Titel</TableHead>
              <TableHead>Zeitraum</TableHead>
              <TableHead>Dozent</TableHead>
              <TableHead>Raum</TableHead>
              <TableHead>Max. TN</TableHead>
              <TableHead>Preis</TableHead>
              <TableHead className="w-24">Aktionen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {kurse.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Noch keine Kurse vorhanden
                </TableCell>
              </TableRow>
            ) : (
              kurse.map((kurs) => (
                <TableRow key={kurs.record_id}>
                  <TableCell className="font-medium">{kurs.fields.titel}</TableCell>
                  <TableCell>
                    <span className="flex items-center gap-2">
                      <Calendar className="size-3.5 text-muted-foreground" />
                      {formatDate(kurs.fields.startdatum)} - {formatDate(kurs.fields.enddatum)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="flex items-center gap-2">
                      <GraduationCap className="size-3.5 text-muted-foreground" />
                      {getDozentName(kurs.fields.dozent)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="flex items-center gap-2">
                      <MapPin className="size-3.5 text-muted-foreground" />
                      {getRaumName(kurs.fields.raum)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="flex items-center gap-2">
                      <Users className="size-3.5 text-muted-foreground" />
                      {kurs.fields.max_teilnehmer}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="flex items-center gap-2">
                      <Euro className="size-3.5 text-muted-foreground" />
                      {kurs.fields.preis?.toLocaleString('de-DE')} €
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon-sm" onClick={() => openEditDialog(kurs)}>
                        <Pencil className="size-4" />
                      </Button>
                      <Button variant="ghost" size="icon-sm" onClick={() => openDeleteDialog(kurs)}>
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedKurs ? 'Kurs bearbeiten' : 'Neuer Kurs'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="kurs-titel">Titel *</Label>
              <Input
                id="kurs-titel"
                value={formData.titel}
                onChange={(e) => setFormData({ ...formData, titel: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="kurs-beschreibung">Beschreibung</Label>
              <Textarea
                id="kurs-beschreibung"
                value={formData.beschreibung}
                onChange={(e) => setFormData({ ...formData, beschreibung: e.target.value })}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="kurs-startdatum">Startdatum *</Label>
                <Input
                  id="kurs-startdatum"
                  type="date"
                  value={formData.startdatum}
                  onChange={(e) => setFormData({ ...formData, startdatum: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="kurs-enddatum">Enddatum *</Label>
                <Input
                  id="kurs-enddatum"
                  type="date"
                  value={formData.enddatum}
                  onChange={(e) => setFormData({ ...formData, enddatum: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="kurs-max">Max. Teilnehmer *</Label>
                <Input
                  id="kurs-max"
                  type="number"
                  min="1"
                  value={formData.max_teilnehmer}
                  onChange={(e) => setFormData({ ...formData, max_teilnehmer: parseInt(e.target.value) || 0 })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="kurs-preis">Preis (€) *</Label>
                <Input
                  id="kurs-preis"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.preis}
                  onChange={(e) => setFormData({ ...formData, preis: parseFloat(e.target.value) || 0 })}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Dozent *</Label>
              <Select
                value={formData.dozent}
                onValueChange={(value) => setFormData({ ...formData, dozent: value })}
                required
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Dozent auswählen" />
                </SelectTrigger>
                <SelectContent>
                  {dozenten.map((d) => (
                    <SelectItem key={d.record_id} value={d.record_id}>
                      {d.fields.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Raum *</Label>
              <Select
                value={formData.raum}
                onValueChange={(value) => setFormData({ ...formData, raum: value })}
                required
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Raum auswählen" />
                </SelectTrigger>
                <SelectContent>
                  {raeume.map((r) => (
                    <SelectItem key={r.record_id} value={r.record_id}>
                      {r.fields.raumname} ({r.fields.gebaeude})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Abbrechen
              </Button>
              <Button type="submit" disabled={loading || !formData.dozent || !formData.raum}>
                {loading ? 'Speichern...' : 'Speichern'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Kurs löschen"
        description={`Möchten Sie den Kurs "${selectedKurs?.fields.titel}" wirklich löschen?`}
        onConfirm={handleDelete}
        loading={loading}
      />
    </div>
  );
}
