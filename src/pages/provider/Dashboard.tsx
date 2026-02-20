import React, { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Search, UserPlus, Filter, Activity, Database, ShieldCheck, Zap, Loader2, Info, RefreshCcw, DatabaseZap, CheckCircle2 } from 'lucide-react';
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
import { cn } from '@/lib/utils';
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
  const loadData = useCallback(async (silent = false) => {
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
      toast.error("Failed to sync with clinical registry isolate.");
    } finally {
      setLoading(false);
      setTimeout(() => setIsRefreshing(false), 800);
    }
  }, []);
  useEffect(() => {
    loadData();
    const interval = setInterval(() => loadData(true), 30000);
    return () => clearInterval(interval);
  }, [loadData]);
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
        toast.success("Clinical record established successfully.", {
          description: `MRN ${result.data.mrn} has been committed to memory.`
        });
        setIsDialogOpen(false);
        await loadData();
      } else {
        toast.error("Failed to commit record: " + result.error);
      }
    } catch (err) {
      toast.error("Network fault during clinical onboarding.");
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
        toast.success("Registry Re-initialized", {
          description: `All ${data.count} simulation records have been restored to volatile storage.`
        });
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
        <div className="space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h1 className="text-4xl font-black tracking-tight text-foreground">Patient Registry</h1>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge variant="outline" className={cn(
                        "font-black text-[10px] gap-1.5 px-3 py-1 border shadow-sm transition-all cursor-help",
                        dbStatus?.connected
                          ? 'bg-teal-50/80 text-teal-700 border-teal-200'
                          : 'bg-destructive/10 text-destructive border-destructive/20'
                      )}>
                        <div className={cn("h-1.5 w-1.5 rounded-full", dbStatus?.connected ? 'bg-teal-500 animate-pulse' : 'bg-destructive')} />
                        {dbStatus?.engine || 'MEMORY-LOCAL'}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent className="p-4 w-72 bg-white dark:bg-card border-2 shadow-xl">
                      <div className="text-[10px] space-y-2 font-mono uppercase font-black">
                        <div className="flex justify-between border-b pb-1"><span>Storage Node:</span> <span className="text-teal-600">{dbStatus?.binding || 'ISOLATE'}</span></div>
                        <div className="flex justify-between border-b pb-1"><span>Ping:</span> <span className="text-teal-600">{dbStatus?.pingMs}ms</span></div>
                        <div className="flex justify-between border-b pb-1"><span>Version:</span> <span className="text-teal-600">{dbStatus?.schemaVersion}</span></div>
                        <p className="text-[8px] text-muted-foreground leading-tight pt-1 normal-case font-medium">Data is isolated per worker lifecycle. Total records: {patients.length}.</p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <p className="text-muted-foreground text-sm font-medium flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-teal-600" /> Clinical Operations Isolate • {patients.length} Active Records
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSeedRegistry}
                disabled={isSeeding}
                className="hidden sm:flex rounded-xl font-bold border-teal-200 hover:bg-teal-50 text-teal-700 transition-all active:scale-95"
              >
                {isSeeding ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <DatabaseZap className="h-4 w-4 mr-2" />}
                Re-seed Registry
              </Button>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-teal-700 hover:bg-teal-800 rounded-xl shadow-lg shadow-teal-700/20 font-bold px-6 active:scale-95">
                    <UserPlus className="h-4 w-4 mr-2" /> New Enrollment
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl rounded-3xl p-8 border-none shadow-2xl">
                  <DialogHeader className="mb-6">
                    <DialogTitle className="text-3xl font-black">Clinical Enrollment</DialogTitle>
                  </DialogHeader>
                  <PatientForm onSubmit={handleCreatePatient} isLoading={isCreating} />
                </DialogContent>
              </Dialog>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="shadow-sm border-none bg-teal-50/50 dark:bg-teal-900/10 transition-all hover:shadow-md">
              <CardHeader className="pb-2"><CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Registry Density</CardTitle></CardHeader>
              <CardContent><div className="text-4xl font-black text-teal-700">{loading ? <Loader2 className="animate-spin h-8 w-8" /> : patients.length}</div></CardContent>
            </Card>
            <Card className="shadow-sm border-none bg-sky-50/50 dark:bg-sky-900/10 transition-all hover:shadow-md">
              <CardHeader className="pb-2"><CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Active Sessions</CardTitle></CardHeader>
              <CardContent><div className="text-4xl font-black text-sky-700">{loading ? '...' : (dbStatus?.sessionCount || 0)}</div></CardContent>
            </Card>
            <Card className="shadow-sm border-none bg-amber-50/50 dark:bg-amber-900/10 md:col-span-2 overflow-hidden relative group transition-all hover:shadow-md">
              <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                <RefreshCcw className="h-20 w-20" />
              </div>
              <CardHeader className="pb-2"><CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Clinical Throughput</CardTitle></CardHeader>
              <CardContent className="flex items-center justify-between">
                <div className="text-lg font-mono text-amber-700 font-black uppercase flex items-center gap-3">
                  <Activity className="h-6 w-6" /> {dbStatus?.engine || 'LOCAL_ISOLATE'}
                </div>
                <div className="text-[10px] font-black uppercase tracking-widest text-amber-600/60 flex flex-col items-end">
                  <div className="flex items-center gap-2">
                    <Zap className="h-3 w-3 fill-current" /> MEMORY-SYNC {dbStatus?.pingMs}ms
                  </div>
                  <span className="text-[8px] opacity-40 mt-1">{dbStatus?.schemaVersion}</span>
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="bg-card border rounded-[2rem] overflow-hidden shadow-soft">
            <div className="p-6 border-b flex items-center gap-6 bg-muted/20">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search registry by patient name or MRN identifier..."
                  className="pl-11 h-12 rounded-2xl border-none shadow-inner bg-background focus-visible:ring-teal-500"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                 <AnimatePresence mode="wait">
                   {isRefreshing && (
                     <motion.div 
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        className="flex items-center gap-2 text-xs font-bold text-muted-foreground pr-2"
                      >
                        <RefreshCcw className="h-3 w-3 animate-spin text-teal-600" />
                        <span className="uppercase tracking-tighter">Syncing Registry</span>
                     </motion.div>
                   )}
                 </AnimatePresence>
                 <Button variant="ghost" size="icon" className="rounded-2xl border bg-white dark:bg-card shadow-sm h-12 w-12 hover:bg-teal-50 active:scale-95"><Filter className="h-5 w-5" /></Button>
              </div>
            </div>
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 border-none hover:bg-muted/30">
                  <TableHead className="font-black uppercase tracking-tighter text-[11px] px-8 h-12">Clinical Name</TableHead>
                  <TableHead className="font-black uppercase tracking-tighter text-[11px] h-12">MRN Identifier</TableHead>
                  <TableHead className="hidden md:table-cell font-black uppercase tracking-tighter text-[11px] h-12">Gender</TableHead>
                  <TableHead className="font-black uppercase tracking-tighter text-[11px] h-12">Primary Diagnosis</TableHead>
                  <TableHead className="text-right font-black uppercase tracking-tighter text-[11px] px-8 h-12">Navigation</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-32 text-muted-foreground font-bold italic">Synchronizing clinical isolate data clusters...</TableCell></TableRow>
                ) : filteredPatients.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-40 text-muted-foreground font-bold">No records found matching current query parameters.</TableCell></TableRow>
                ) : (
                  filteredPatients.map((p) => (
                    <TableRow key={p.id} className="group hover:bg-teal-50/50 dark:hover:bg-teal-900/10 transition-colors border-b last:border-0">
                      <TableCell className="font-bold px-8 py-5">
                        <Link to={`/provider/patient/${p.id}`} className="hover:text-teal-700 transition-colors flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] text-slate-500 font-black ring-1 ring-slate-200 dark:ring-slate-700">{p.firstName[0]}{p.lastName[0]}</div>
                          <span>{p.lastName}, {p.firstName}</span>
                        </Link>
                      </TableCell>
                      <TableCell className="font-mono text-[11px] font-black text-muted-foreground tracking-tighter">{p.mrn}</TableCell>
                      <TableCell className="hidden md:table-cell text-sm font-medium">{p.gender}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="bg-teal-100/50 text-teal-800 dark:bg-teal-900/40 dark:text-teal-400 px-3 py-1 font-bold border-none">
                          {p.diagnoses[0]?.description || 'NEW ADMIT'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right px-8 py-5">
                        <Link to={`/provider/patient/${p.id}`}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-teal-700 hover:text-white transition-all px-4"
                          >
                            Open Chart
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            <div className="p-4 border-t bg-muted/10 text-center">
               <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Total Records in Registry Isolate: {patients.length}</p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}