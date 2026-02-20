import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, UserPlus, Filter, Activity, Database, ShieldCheck, Zap, Loader2, Info, RefreshCcw, DatabaseZap, Edit3 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AppLayout } from '@/components/layout/AppLayout';
import { PatientForm } from '@/components/provider/PatientForm';
import { toast } from 'sonner';
import type { Patient, DbStatus } from '../../../worker/types';
export function Dashboard() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [dbStatus, setDbStatus] = useState<DbStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSeeding, setIsSeeding] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [search, setSearch] = useState('');
  const loadData = async (silent = false) => {
    if (!silent) setLoading(true);
    else setIsRefreshing(true);
    try {
      const [patientsRes, statusRes] = await Promise.all([
        fetch('/api/patients', { credentials: 'omit' }).then(r => r.json()),
        fetch('/api/db-status', { credentials: 'omit' }).then(r => r.json())
      ]);
      if (patientsRes.success) setPatients(patientsRes.data);
      if (statusRes.success) setDbStatus(statusRes.data);
    } catch (err) {
      console.error("Dashboard sync error", err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };
  useEffect(() => {
    loadData();
    const interval = setInterval(() => loadData(true), 20000);
    return () => clearInterval(interval);
  }, []);
  const handleCreatePatient = async (data: any) => {
    setIsCreating(true);
    try {
      const res = await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const result = await res.json();
      if (result.success) {
        toast.success("New medical record established successfully.");
        setIsDialogOpen(false);
        await loadData();
      } else {
        toast.error("Failed to create record: " + result.error);
      }
    } catch (err) {
      toast.error("Network error during patient onboarding.");
    } finally {
      setIsCreating(false);
    }
  };
  const handleSeedRegistry = async () => {
    setIsSeeding(true);
    try {
      const res = await fetch('/api/seed-patients?force=true', { method: 'POST', credentials: 'omit' });
      const data = await res.json();
      if (data.success) {
        toast.success("Clinical registry re-initialized in volatile memory");
        await loadData();
      }
    } finally {
      setIsSeeding(false);
    }
  };
  const filteredPatients = patients.filter(p =>
    `${p.firstName} ${p.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
    p.mrn.toLowerCase().includes(search.toLowerCase())
  );
  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Patient Registry</h1>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge variant="outline" className={`border-teal-500/50 font-bold gap-1.5 ${dbStatus?.connected ? 'bg-teal-50/50 text-teal-700' : 'bg-destructive/10 text-destructive'}`}>
                        <div className={`h-2 w-2 rounded-full animate-pulse ${dbStatus?.connected ? 'bg-teal-500' : 'bg-destructive'}`} />
                        {dbStatus?.engine || 'VOLATILE'}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent className="p-4 w-64">
                      <div className="text-[10px] space-y-1 font-mono uppercase">
                        <div className="flex justify-between"><span>Engine:</span> <span className="text-teal-600">{dbStatus?.engine}</span></div>
                        <div className="flex justify-between"><span>Status:</span> <span className="text-teal-600">IN-MEMORY</span></div>
                        <div className="flex justify-between"><span>Health:</span> <span className="text-teal-600">{dbStatus?.status}</span></div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <p className="text-muted-foreground text-sm flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4" /> Secure Volatile In-Memory Layer Active
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleSeedRegistry} disabled={isSeeding} className="hidden sm:flex rounded-xl">
                {isSeeding ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <DatabaseZap className="h-4 w-4 mr-2" />}
                Re-seed Registry
              </Button>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-teal-700 hover:bg-teal-800 rounded-xl shadow-lg shadow-teal-700/20">
                    <UserPlus className="h-4 w-4 mr-2" /> New Patient
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl rounded-3xl">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-bold">Patient Onboarding</DialogTitle>
                  </DialogHeader>
                  <PatientForm onSubmit={handleCreatePatient} isLoading={isCreating} />
                </DialogContent>
              </Dialog>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="shadow-sm border-none bg-teal-50/50 dark:bg-teal-900/10">
              <CardHeader className="pb-2"><CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Registry Records</CardTitle></CardHeader>
              <CardContent><div className="text-3xl font-bold text-teal-700">{loading ? '...' : patients.length}</div></CardContent>
            </Card>
            <Card className="shadow-sm border-none bg-sky-50/50 dark:bg-sky-900/10">
              <CardHeader className="pb-2"><CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Active Sessions</CardTitle></CardHeader>
              <CardContent><div className="text-3xl font-bold text-sky-700">{loading ? '...' : dbStatus?.sessionCount || 0}</div></CardContent>
            </Card>
            <Card className="shadow-sm border-none bg-amber-50/50 dark:bg-amber-900/10 md:col-span-2">
              <CardHeader className="pb-2"><CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Isolate Performance</CardTitle></CardHeader>
              <CardContent className="flex items-center justify-between">
                <div className="text-sm font-mono text-amber-700 font-bold uppercase flex items-center gap-2">
                  <Activity className="h-5 w-5" /> {dbStatus?.engine}
                </div>
                <div className="text-[10px] font-black uppercase tracking-widest text-amber-600/60 flex items-center gap-1">
                  <Zap className="h-3 w-3" /> VOLATILE STORAGE MODE
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="bg-card border rounded-2xl overflow-hidden shadow-soft">
            <div className="p-4 border-b flex items-center gap-4 bg-muted/20">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search registry..." className="pl-9 rounded-xl" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
              {isRefreshing && <RefreshCcw className="h-4 w-4 animate-spin text-muted-foreground" />}
              <Button variant="ghost" size="icon" className="rounded-xl border shadow-sm"><Filter className="h-4 w-4" /></Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 border-none">
                  <TableHead className="font-bold">Patient Name</TableHead>
                  <TableHead className="font-bold">MRN</TableHead>
                  <TableHead className="hidden md:table-cell font-bold">Gender</TableHead>
                  <TableHead className="font-bold">Diagnosis</TableHead>
                  <TableHead className="text-right font-bold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-20 text-muted-foreground">Syncing volatile data...</TableCell></TableRow>
                ) : filteredPatients.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-24 text-muted-foreground">No records found.</TableCell></TableRow>
                ) : (
                  filteredPatients.map((p) => (
                    <TableRow key={p.id} className="group hover:bg-teal-50/30 dark:hover:bg-teal-900/10 transition-colors border-b last:border-0">
                      <TableCell className="font-bold">
                        <Link to={`/provider/patient/${p.id}`} className="hover:text-teal-700">{p.lastName}, {p.firstName}</Link>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{p.mrn}</TableCell>
                      <TableCell className="hidden md:table-cell">{p.gender}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="bg-teal-50 text-teal-700 px-2 py-0.5">
                          {p.diagnoses[0]?.description || 'New Record'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Link to={`/provider/patient/${p.id}`}>
                            <Button variant="ghost" size="sm" className="rounded-xl hover:bg-teal-600 hover:text-white">Chart</Button>
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}