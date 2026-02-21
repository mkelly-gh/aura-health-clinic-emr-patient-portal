import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Search, UserPlus, ShieldCheck, Zap, Loader2, RefreshCcw, DatabaseZap, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
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
      setTimeout(() => setIsRefreshing(false), 300);
    }
  }, [search]);
  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      loadData(true, search);
    }, 300);
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [search, loadData]);
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
    <AppLayout className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black tracking-tight text-slate-900 uppercase">Patient Registry</h1>
                <Badge variant="outline" className="font-mono text-[9px] h-4 px-1.5 border-slate-200 text-teal-700 bg-white">
                  D1_PROD
                </Badge>
              </div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">
                Active Records: {dbStatus?.patientCount ?? 0} • {dbStatus?.binding}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleSeedRegistry} disabled={isSeeding} className="h-8 text-[10px] font-bold uppercase tracking-wider border-slate-200">
                {isSeeding ? <Loader2 className="h-3 w-3 mr-2 animate-spin" /> : <DatabaseZap className="h-3 w-3 mr-2" />}
                Sync
              </Button>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="h-8 bg-teal-700 hover:bg-teal-800 font-bold text-[10px] uppercase tracking-wider">
                    <UserPlus className="h-3 w-3 mr-2" /> Enrollment
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl p-6">
                  <DialogHeader className="mb-4">
                    <DialogTitle className="text-base font-bold uppercase">Clinical Enrollment</DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground">Submit patient demographics and initial clinical history to create a new SQL production registry entry.</DialogDescription>
                  </DialogHeader>
                  <PatientForm onSubmit={handleCreatePatient} isLoading={isCreating} />
                </DialogContent>
              </Dialog>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {[
              { label: 'Registry Rows', val: dbStatus?.patientCount ?? 0 },
              { label: 'Session Nodes', val: dbStatus?.sessionCount ?? 0 },
              { label: 'Latency', val: `${dbStatus?.pingMs}ms` },
              { label: 'Engine', val: dbStatus?.engine || 'SQL' },
            ].map((stat, i) => (
              <Card key={i} className="rounded-sm border-slate-200 shadow-clinical bg-white">
                <CardHeader className="p-3 pb-0"><CardTitle className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground">{stat.label}</CardTitle></CardHeader>
                <CardContent className="p-3 pt-1"><div className="text-lg font-bold font-mono text-slate-900">{stat.val}</div></CardContent>
              </Card>
            ))}
          </div>
          <Card className="rounded-sm border-slate-200 shadow-clinical overflow-hidden bg-white">
            <div className="p-3 border-b flex items-center gap-4 bg-slate-50/50">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="QUERY REGISTRY (NAME, MRN)..."
                  className="pl-9 h-8 text-[11px] font-bold uppercase tracking-wider border-slate-200 focus-visible:ring-teal-600 bg-white placeholder:text-slate-300"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <AnimatePresence>
                 {isRefreshing && (
                   <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 text-[9px] font-black text-teal-700">
                      <RefreshCcw className="h-3 w-3 animate-spin" />
                      <span>QUERYING...</span>
                   </motion.div>
                 )}
              </AnimatePresence>
            </div>
            <Table className="clinical-density-table">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Clinical Name</TableHead>
                  <TableHead>MRN</TableHead>
                  <TableHead>Acuity</TableHead>
                  <TableHead>Primary Diagnosis</TableHead>
                  <TableHead>Last Encounter</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-20 text-[10px] font-bold uppercase text-muted-foreground">Synchronizing Registry...</TableCell></TableRow>
                ) : patients.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-20 text-[10px] font-bold uppercase text-muted-foreground">No clinical records found.</TableCell></TableRow>
                ) : (
                  patients.map((p) => (
                    <TableRow key={p.id} className="hover:bg-slate-50/80 border-slate-100 group">
                      <TableCell className="font-bold text-slate-900">
                        <Link to={`/provider/patient/${p.id}`} className="hover:text-teal-700">
                          {p.lastName}, {p.firstName}
                        </Link>
                      </TableCell>
                      <TableCell className="font-mono text-[10px] text-muted-foreground">{p.mrn}</TableCell>
                      <TableCell>
                        <Badge className="bg-slate-100 text-slate-700 border-none h-4 px-1 text-[8px] font-black uppercase tracking-tighter">
                          STABLE
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-slate-600 font-medium">
                          {p.diagnoses[0]?.description || 'Baseline'}
                        </span>
                      </TableCell>
                      <TableCell className="text-[10px] text-muted-foreground font-mono">2024-03-12</TableCell>
                      <TableCell className="text-right">
                        <Link to={`/provider/patient/${p.id}`}>
                          <Button variant="ghost" size="sm" className="h-6 px-2 text-[9px] font-black uppercase tracking-widest text-teal-700 hover:bg-teal-700 hover:text-white transition-colors border border-transparent hover:border-teal-700">
                            View <ChevronRight className="h-2.5 w-2.5 ml-1" />
                          </Button>
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