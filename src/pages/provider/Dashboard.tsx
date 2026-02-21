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
  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      loadData(true, search);
    }, 400);
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [search, loadData]);
  useEffect(() => {
    loadData();
    const interval = setInterval(() => loadData(true), 20000);
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
        toast.success("SQL record committed.");
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
        toast.success("SQL Registry Re-initialized");
        await loadData();
      }
    } finally {
      setIsSeeding(false);
    }
  };
  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Patient Registry</h1>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge variant="outline" className={cn(
                        "font-mono text-[10px] gap-1.5 px-2 py-0.5 border transition-all cursor-help",
                        dbStatus?.connected ? 'bg-slate-50 text-teal-700 border-teal-200' : 'bg-destructive/5 text-destructive border-destructive/10'
                      )}>
                        <div className={cn("h-1.5 w-1.5 rounded-full", dbStatus?.connected ? 'bg-teal-500' : 'bg-destructive')} />
                        {dbStatus?.engine || 'D1-SQL'}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent className="p-3 text-[10px] font-mono">
                      PING: {dbStatus?.pingMs}ms | VER: {dbStatus?.schemaVersion}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <p className="text-muted-foreground text-xs mt-1 font-medium">
                Clinical Node: {dbStatus?.binding} • Total Records: {dbStatus?.patientCount ?? 0}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleSeedRegistry} disabled={isSeeding} className="text-xs font-bold border-slate-200">
                {isSeeding ? <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" /> : <DatabaseZap className="h-3.5 w-3.5 mr-2" />}
                Sync Registry
              </Button>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="bg-teal-700 hover:bg-teal-800 font-bold text-xs">
                    <UserPlus className="h-3.5 w-3.5 mr-2" /> New Enrollment
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl p-6">
                  <DialogHeader className="mb-4"><DialogTitle className="text-xl font-bold">Clinical Enrollment</DialogTitle></DialogHeader>
                  <PatientForm onSubmit={handleCreatePatient} isLoading={isCreating} />
                </DialogContent>
              </Dialog>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="rounded-md border-slate-200 shadow-none">
              <CardHeader className="p-4 pb-2"><CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">SQL Rows</CardTitle></CardHeader>
              <CardContent className="p-4 pt-0"><div className="text-2xl font-bold">{dbStatus?.patientCount ?? 0}</div></CardContent>
            </Card>
            <Card className="rounded-md border-slate-200 shadow-none">
              <CardHeader className="p-4 pb-2"><CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Isolate Sessions</CardTitle></CardHeader>
              <CardContent className="p-4 pt-0"><div className="text-2xl font-bold">{dbStatus?.sessionCount ?? 0}</div></CardContent>
            </Card>
            <Card className="rounded-md border-slate-200 shadow-none md:col-span-2">
              <CardHeader className="p-4 pb-2"><CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Infrastructure</CardTitle></CardHeader>
              <CardContent className="p-4 pt-0 flex items-center justify-between">
                <div className="text-sm font-mono font-bold flex items-center gap-2 text-teal-800">
                  <ShieldCheck className="h-4 w-4" /> CLOUDFLARE_D1_PROD
                </div>
                <div className="text-[9px] font-bold text-muted-foreground uppercase flex items-center gap-2">
                   <Zap className="h-3 w-3 text-amber-500" /> SYNCED {dbStatus?.pingMs}ms
                </div>
              </CardContent>
            </Card>
          </div>
          <Card className="rounded-md border-slate-200 shadow-none overflow-hidden">
            <div className="p-4 border-b flex items-center gap-4 bg-slate-50">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Query by Name or MRN..."
                  className="pl-9 h-9 text-xs border-slate-200 focus-visible:ring-teal-600 bg-white"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <AnimatePresence>
                 {isRefreshing && (
                   <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 text-[10px] font-bold text-teal-600">
                      <RefreshCcw className="h-3 w-3 animate-spin" />
                      <span>SQL QUERYING</span>
                   </motion.div>
                 )}
              </AnimatePresence>
            </div>
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/50">
                  <TableHead className="text-[10px] font-bold uppercase px-6 h-10">Name</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase h-10">MRN</TableHead>
                  <TableHead className="hidden md:table-cell text-[10px] font-bold uppercase h-10">Gender</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase h-10">Primary Diagnosis</TableHead>
                  <TableHead className="text-right text-[10px] font-bold uppercase px-6 h-10">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-20 text-xs text-muted-foreground">Synchronizing records...</TableCell></TableRow>
                ) : patients.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-20 text-xs text-muted-foreground">No matching records.</TableCell></TableRow>
                ) : (
                  patients.map((p) => (
                    <TableRow key={p.id} className="hover:bg-slate-50 border-slate-100">
                      <TableCell className="px-6 py-3 font-semibold text-xs">
                        <Link to={`/provider/patient/${p.id}`} className="hover:text-teal-700 flex items-center gap-2">
                          <div className="h-6 w-6 rounded bg-slate-100 flex items-center justify-center text-[9px] font-bold text-slate-500 uppercase">{p.firstName[0]}{p.lastName[0]}</div>
                          {p.lastName}, {p.firstName}
                        </Link>
                      </TableCell>
                      <TableCell className="font-mono text-[10px] font-bold text-muted-foreground">{p.mrn}</TableCell>
                      <TableCell className="hidden md:table-cell text-xs">{p.gender}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="bg-slate-100 text-slate-700 text-[9px] font-bold px-2 py-0 rounded-sm">
                          {p.diagnoses[0]?.description || 'N/A'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right px-6 py-3">
                        <Link to={`/provider/patient/${p.id}`}>
                          <Button variant="ghost" size="sm" className="h-7 px-3 text-[10px] font-bold uppercase tracking-wider hover:bg-teal-700 hover:text-white">Open Chart</Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}