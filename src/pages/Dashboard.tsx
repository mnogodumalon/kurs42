import { useState, useEffect, useCallback } from 'react';
import { GraduationCap, Users, BookOpen, MapPin, ClipboardList, Euro } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { StatCard } from '@/components/StatCard';
import { DozentenTab } from '@/components/tabs/DozentenTab';
import { RaeumeTab } from '@/components/tabs/RaeumeTab';
import { TeilnehmerTab } from '@/components/tabs/TeilnehmerTab';
import { KurseTab } from '@/components/tabs/KurseTab';
import { AnmeldungenTab } from '@/components/tabs/AnmeldungenTab';
import { LivingAppsService, extractRecordId } from '@/services/livingAppsService';
import type { Dozenten, Raeume, Teilnehmer, Kurse, Anmeldungen } from '@/types/app';

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [dozenten, setDozenten] = useState<Dozenten[]>([]);
  const [raeume, setRaeume] = useState<Raeume[]>([]);
  const [teilnehmer, setTeilnehmer] = useState<Teilnehmer[]>([]);
  const [kurse, setKurse] = useState<Kurse[]>([]);
  const [anmeldungen, setAnmeldungen] = useState<Anmeldungen[]>([]);

  const loadData = useCallback(async () => {
    try {
      const [d, r, t, k, a] = await Promise.all([
        LivingAppsService.getDozenten(),
        LivingAppsService.getRaeume(),
        LivingAppsService.getTeilnehmer(),
        LivingAppsService.getKurse(),
        LivingAppsService.getAnmeldungen(),
      ]);
      setDozenten(d);
      setRaeume(r);
      setTeilnehmer(t);
      setKurse(k);
      setAnmeldungen(a);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Calculate stats
  const totalRevenue = kurse.reduce((sum, k) => {
    const kursAnmeldungen = anmeldungen.filter(
      (a) => extractRecordId(a.fields.kurs) === k.record_id
    );
    return sum + kursAnmeldungen.length * (k.fields.preis || 0);
  }, 0);

  const paidAnmeldungen = anmeldungen.filter((a) => a.fields.bezahlt).length;
  const openPayments = anmeldungen.length - paidAnmeldungen;

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-28" />
            ))}
          </div>
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-header">Kursverwaltung</h1>
            <p className="text-muted-foreground mt-1">
              Verwalten Sie Ihre Kurse, Dozenten, Teilnehmer und Räume
            </p>
          </div>
          <GraduationCap className="size-10 text-primary opacity-50" />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Gesamtumsatz"
            value={`${totalRevenue.toLocaleString('de-DE')} €`}
            icon={<Euro className="size-6" />}
            hero
          />
          <StatCard
            label="Aktive Kurse"
            value={kurse.length}
            icon={<BookOpen className="size-5" />}
          />
          <StatCard
            label="Anmeldungen"
            value={anmeldungen.length}
            icon={<ClipboardList className="size-5" />}
          />
          <StatCard
            label="Offene Zahlungen"
            value={openPayments}
            icon={<Users className="size-5" />}
          />
        </div>

        {/* Quick Stats Row */}
        <div className="grid grid-cols-3 gap-4">
          <div className="stat-card flex items-center gap-4">
            <div className="p-3 rounded-lg bg-primary/10">
              <GraduationCap className="size-5 text-primary" />
            </div>
            <div>
              <p className="stat-label">Dozenten</p>
              <p className="text-xl font-semibold">{dozenten.length}</p>
            </div>
          </div>
          <div className="stat-card flex items-center gap-4">
            <div className="p-3 rounded-lg bg-primary/10">
              <Users className="size-5 text-primary" />
            </div>
            <div>
              <p className="stat-label">Teilnehmer</p>
              <p className="text-xl font-semibold">{teilnehmer.length}</p>
            </div>
          </div>
          <div className="stat-card flex items-center gap-4">
            <div className="p-3 rounded-lg bg-primary/10">
              <MapPin className="size-5 text-primary" />
            </div>
            <div>
              <p className="stat-label">Räume</p>
              <p className="text-xl font-semibold">{raeume.length}</p>
            </div>
          </div>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="kurse" className="space-y-6">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="kurse">
              <BookOpen className="size-4 mr-2" />
              Kurse
            </TabsTrigger>
            <TabsTrigger value="anmeldungen">
              <ClipboardList className="size-4 mr-2" />
              Anmeldungen
            </TabsTrigger>
            <TabsTrigger value="dozenten">
              <GraduationCap className="size-4 mr-2" />
              Dozenten
            </TabsTrigger>
            <TabsTrigger value="teilnehmer">
              <Users className="size-4 mr-2" />
              Teilnehmer
            </TabsTrigger>
            <TabsTrigger value="raeume">
              <MapPin className="size-4 mr-2" />
              Räume
            </TabsTrigger>
          </TabsList>

          <TabsContent value="kurse">
            <KurseTab kurse={kurse} dozenten={dozenten} raeume={raeume} onRefresh={loadData} />
          </TabsContent>

          <TabsContent value="anmeldungen">
            <AnmeldungenTab
              anmeldungen={anmeldungen}
              teilnehmer={teilnehmer}
              kurse={kurse}
              onRefresh={loadData}
            />
          </TabsContent>

          <TabsContent value="dozenten">
            <DozentenTab dozenten={dozenten} onRefresh={loadData} />
          </TabsContent>

          <TabsContent value="teilnehmer">
            <TeilnehmerTab teilnehmer={teilnehmer} onRefresh={loadData} />
          </TabsContent>

          <TabsContent value="raeume">
            <RaeumeTab raeume={raeume} onRefresh={loadData} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
