import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Search, UserPlus, Activity, ShieldCheck, Zap, Loader2, RefreshCcw, DatabaseZap } from 'lucide-react';
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
  // Use a ref for search to prevent unnecessary effect triggers but allow debounce
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const loadData = useCallback(async (silent = false, query = search) => {
    if (!silent) setLoading(true);
    else setIsRefreshing(true);
    try {
      const queryStr = query ? `?q=${encodeURIComponent(query)}` : '';
      const [patientsRes, statusRes] = await Promise.all([
        fetch(`/api/patients${queryStr}`, { credentials: 'omit' }).then(r => r.json()),
        fetch('/api/db-status', { credentials: 'omit' }).then(r => r.json())
      ]);
      if (patientsRes.success) setPatients(patientsRes.data);
      if (statusRes.success) setDbStatus(statusRes.data);
    } catch (err) {
      console.error("Dashboard sync error", err);
      toast.error("Telemetry Link Severed", { description: "Failed to sync with SQL production engine." });
    } finally {
      setLoading(false);
      setTimeout(() => setIsRefreshing(false), 600);
    }
  }, [search]);
  // Handle debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      loadData(true, search);
    }, 400);
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [search, loadData]);
  // Initial data load and polling
  useEffect(() => {
    loadData();
    const interval = setInterval(() => loadData(true), 20000);
    return () => clearInterval(interval);
  }, []); // Only on mount
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
        toast.success("SQL record committed successfully.");
        setIsDialogOpen(false);
        await loadData();
      }
    } catch (err) {
      toast.error("Database write fault.");
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
        toast.success("SQL Registry Re-initialized", {
          description: `All records migrated to D1 persistence layer.`
        });
        await loadData();
      }
    } finally {
      setIsSeeding(false);
    }
  };
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
                        dbStatus?.connected ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-destructive/10 text-destructive border-destructive/20'
                      )}>
                        <div className={cn("h-1.5 w-1.5 rounded-full", dbStatus?.connected ? 'bg-emerald-500 animate-pulse' : 'bg-destructive')} />
                        {dbStatus?.engine || 'SQL-PROD'}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent className="p-4 w-72 bg-white dark:bg-card border shadow-xl">
                      <div className="text-[10px] space-y-2 font-mono uppercase font-black">
                        <div className="flex justify-between border-b pb-1"><span>Database:</span> <span className="text-emerald-600">{dbStatus?.binding || 'D1'}</span></div>
                        <div className="flex justify-between border-b pb-1"><span>Ping:</span> <span className="text-emerald-600">{dbStatus?.pingMs}ms</span></div>
                        <div className="flex justify-between border-b pb-1"><span>Version:</span> <span className="text-emerald-600">{dbStatus?.schemaVersion}</span></div>
                        <p className="text-[8px] text-muted-foreground leading-tight pt-1 normal-case font-medium font-sans">Persistence Layer: Cloudflare D1 SQL.</p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <p className="text-muted-foreground text-sm font-medium flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-600" /> Persistent SQL Infrastructure • {dbStatus?.patientCount ?? 0} Global Records
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={handleSeedRegistry} disabled={isSeeding} className="rounded-xl font-bold border-emerald-200 hover:bg-emerald-50 text-emerald-700">
                {isSeeding ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <DatabaseZap className="h-4 w-4 mr-2" />}
                Sync Registry
              </Button>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-teal-700 hover:bg-teal-800 rounded-xl shadow-lg font-bold px-6">
                    <UserPlus className="h-4 w-4 mr-2" /> New Enrollment
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl rounded-3xl p-8">
                  <DialogHeader className="mb-6"><DialogTitle className="text-3xl font-black">Clinical Enrollment</DialogTitle></DialogHeader>
                  <PatientForm onSubmit={handleCreatePatient} isLoading={isCreating} />
                </DialogContent>
              </Dialog>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="shadow-sm border-none bg-emerald-50/50 dark:bg-emerald-900/10 transition-colors">
              <CardHeader className="pb-2"><CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">SQL Row Count</CardTitle></CardHeader>
              <CardContent><div className="text-4xl font-black text-emerald-700">{dbStatus?.patientCount ?? 0}</div></CardContent>
            </Card>
            <Card className="shadow-sm border-none bg-sky-50/50 dark:bg-sky-900/10 transition-colors">
              <CardHeader className="pb-2"><CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Active Sessions</CardTitle></CardHeader>
              <CardContent><div className="text-4xl font-black text-sky-700">{dbStatus?.sessionCount ?? 0}</div></CardContent>
            </Card>
            <Card className="shadow-sm border-none bg-amber-50/50 dark:bg-amber-900/10 md:col-span-2 transition-colors">
              <CardHeader className="pb-2"><CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Infrastructure Node</CardTitle></CardHeader>
              <CardContent className="flex items-center justify-between">
                <div className="text-lg font-mono text-amber-700 font-black uppercase flex items-center gap-3">
                  <Activity className="h-6 w-6" /> {dbStatus?.binding || 'CLOUDFLARE_D1'}
                </div>
                <div className="text-[10px] font-black uppercase tracking-widest text-amber-600/60 flex flex-col items-end">
                   <div className="flex items-center gap-2"><Zap className="h-3 w-3 fill-current" /> SQL-SYNC {dbStatus?.pingMs}ms</div>
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
                  placeholder="Query SQL Registry by name or MRN..."
                  className="pl-11 h-12 rounded-2xl border-none shadow-inner bg-background focus-visible:ring-emerald-500 text-sm font-medium"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <AnimatePresence mode="wait">
                 {isRefreshing && (
                   <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2 text-[10px] font-black text-muted-foreground pr-2">
                      <RefreshCcw className="h-3 w-3 animate-spin text-emerald-600" />
                      <span className="uppercase tracking-widest">Querying SQL</span>
                   </motion.div>
                 )}
              </AnimatePresence>
            </div>
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="font-black uppercase tracking-tighter text-[11px] px-8">Clinical Name</TableHead>
                  <TableHead className="font-black uppercase tracking-tighter text-[11px]">MRN Identifier</TableHead>
                  <TableHead className="hidden md:table-cell font-black uppercase tracking-tighter text-[11px]">Gender</TableHead>
                  <TableHead className="font-black uppercase tracking-tighter text-[11px]">Primary Diagnosis</TableHead>
                  <TableHead className="text-right font-black uppercase tracking-tighter text-[11px] px-8">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-32 text-muted-foreground font-bold italic">Synchronizing SQL production records...</TableCell></TableRow>
                ) : patients.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-40 text-muted-foreground font-bold italic">No matching clinical records found.</TableCell></TableRow>
                ) : (
                  patients.map((p) => (
                    <TableRow key={p.id} className="group hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10 transition-colors">
                      <TableCell className="font-bold px-8 py-5">
                        <Link to={`/provider/patient/${p.id}`} className="hover:text-emerald-700 transition-colors flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] text-slate-500 font-black">{p.firstName[0]}{p.lastName[0]}</div>
                          <span className="truncate max-w-[180px]">{p.lastName}, {p.firstName}</span>
                        </Link>
                      </TableCell>
                      <TableCell className="font-mono text-[11px] font-black text-muted-foreground tracking-tighter">{p.mrn}</TableCell>
                      <TableCell className="hidden md:table-cell text-sm font-medium">{p.gender}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="bg-emerald-100/50 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-400 px-3 py-1 font-bold border-none whitespace-nowrap">
                          {p.diagnoses[0]?.description || 'SQL-RECORD'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right px-8 py-5">
                        <Link to={`/provider/patient/${p.id}`}>
                          <Button variant="ghost" size="sm" className="rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-700 hover:text-white">Chart</Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            <div className="p-4 border-t bg-muted/10 text-center">
               <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Clinical Engine: Cloudflare D1 SQL Lite Node</p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}