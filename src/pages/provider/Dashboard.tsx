import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Search, UserPlus, ShieldCheck, Zap, Loader2, RefreshCcw, DatabaseZap, ChevronRight, Activity, AlertCircle, FilePlus, FlaskConical, Microscope, Pill } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
        fetch(`/api/patients${queryStr}`).then(r => r.json()),
        fetch('/api/db-status').then(r => r.json())
      ]);
      if (patientsRes.success) setPatients(patientsRes.data);
      if (statusRes.success) setDbStatus(statusRes.data);
    } catch (err) {
      toast.error("Telemetry Link Severed");
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
    return () => { if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current); };
  }, [search, loadData]);
  useEffect(() => {
    loadData();
    const interval = setInterval(() => loadData(true), 30000);
    return () => clearInterval(interval);
  }, [loadData]);
  const stats = [
    { label: 'Clinical Census', val: dbStatus?.patientCount ?? 0, trend: '+4%', icon: Activity },
    { label: 'Urgent Interventions', val: '08', trend: 'CRITICAL', icon: AlertCircle, color: 'text-red-600' },
    { label: '24H Volume', val: '14', trend: 'NEW ADMITS', icon: FilePlus },
    { label: 'Assigned Queue', val: '03', trend: 'PROVIDER_THORNE', icon: FlaskConical },
  ];
  return (
    <AppLayout className="py-6">
      <div className="max-w-7xl mx-auto px-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 uppercase">Clinical Command</h1>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-1">Registry Synchronization Node • D1_PROD</p>
          </div>
          <div className="flex items-center gap-3">
             <Button variant="outline" className="rounded-none h-10 border-slate-200 text-[10px] font-bold uppercase tracking-widest px-5 hover:bg-slate-50">
               Audit Logs
             </Button>
             <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="rounded-none h-10 bg-teal-700 hover:bg-teal-800 text-[10px] font-black uppercase tracking-widest px-6 shadow-clinical-bold">
                    <UserPlus className="h-4 w-4 mr-2" /> Initiate Admission
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl rounded-none p-8">
                  <DialogHeader className="mb-6">
                    <DialogTitle className="text-lg font-black uppercase">Clinical Enrollment</DialogTitle>
                    <DialogDescription className="text-xs text-slate-500">Commit new patient record to SQL production registry.</DialogDescription>
                  </DialogHeader>
                  <PatientForm onSubmit={async (data) => {
                    setIsCreating(true);
                    try {
                      const res = await fetch('/api/patients', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data) });
                      if ((await res.json()).success) { toast.success("Record Committed"); setIsDialogOpen(false); await loadData(); }
                    } finally { setIsCreating(false); }
                  }} isLoading={isCreating} />
                </DialogContent>
             </Dialog>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <Card key={i} className="rounded-none border-slate-200 shadow-clinical bg-white">
              <CardHeader className="p-4 pb-0 flex flex-row items-center justify-between space-y-0">
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">{stat.label}</span>
                <stat.icon className={cn("h-4 w-4 text-slate-300", stat.color)} />
              </CardHeader>
              <CardContent className="p-4 pt-2">
                <div className="text-3xl font-black text-slate-900 leading-none">{stat.val}</div>
                <div className={cn("text-[9px] font-bold uppercase tracking-tighter mt-2", stat.color ? stat.color : "text-teal-700")}>
                  {stat.trend}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="rounded-none border-slate-200 shadow-clinical bg-white overflow-hidden">
              <div className="p-4 border-b flex items-center justify-between bg-slate-50/50">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900">Patient Registry</h3>
                <div className="flex items-center gap-2">
                  <AnimatePresence>
                    {isRefreshing && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-1.5 text-[8px] font-black text-teal-700 uppercase">
                        <RefreshCcw className="h-2.5 w-2.5 animate-spin" /> Querying...
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <Badge variant="outline" className="text-[8px] font-mono h-5 rounded-none border-slate-200 text-slate-400">Total: {patients.length}</Badge>
                </div>
              </div>
              <Table className="clinical-density-table">
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-[300px]">Profile</TableHead>
                    <TableHead>MRN</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={4} className="text-center py-16 text-[10px] font-black uppercase text-slate-300">Synchronizing...</TableCell></TableRow>
                  ) : patients.map((p) => (
                    <TableRow key={p.id} className="group border-slate-100 h-14">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8 rounded-none border border-slate-100 shadow-sm">
                            <AvatarImage src={p.avatarUrl} className="grayscale group-hover:grayscale-0 transition-all" />
                            <AvatarFallback className="rounded-none text-[10px] font-black">{p.firstName[0]}{p.lastName[0]}</AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <Link to={`/provider/patient/${p.id}`} className="text-[11px] font-black uppercase text-slate-900 hover:text-teal-700 tracking-tight">
                              {p.lastName}, {p.firstName}
                            </Link>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Dob: {p.dob}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-[10px] text-slate-500 font-bold tracking-tighter">{p.mrn}</TableCell>
                      <TableCell>
                        <Badge className={cn(
                          "rounded-none text-[8px] font-black h-4 px-1.5 uppercase",
                          p.history.includes('CRITICAL') ? "bg-red-50 text-red-700 border-red-100" : "bg-teal-50 text-teal-700 border-teal-100"
                        )}>
                          {p.history.includes('CRITICAL') ? 'Critical' : 'Observation'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Link to={`/provider/patient/${p.id}`}>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-none group-hover:bg-teal-700 group-hover:text-white border border-transparent group-hover:border-teal-700 transition-all">
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </div>
          <div className="space-y-6">
            <Card className="rounded-none border-slate-200 shadow-clinical bg-white">
              <div className="p-4 border-b bg-slate-50/50">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900">Direct Protocols</h3>
              </div>
              <CardContent className="p-4 space-y-3">
                <Button className="w-full justify-start rounded-none h-11 bg-slate-900 hover:bg-slate-800 text-[10px] font-black uppercase tracking-widest">
                  <Pill className="h-4 w-4 mr-3 text-teal-500" /> Pharmacy Requisition
                </Button>
                <Button variant="outline" className="w-full justify-start rounded-none h-11 border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-700">
                  <Microscope className="h-4 w-4 mr-3 text-slate-400" /> Radiology Priority
                </Button>
                <Button variant="outline" className="w-full justify-start rounded-none h-11 border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-700">
                  <FlaskConical className="h-4 w-4 mr-3 text-slate-400" /> Laboratory Order
                </Button>
              </CardContent>
            </Card>
            <Card className="rounded-none border-slate-200 shadow-clinical bg-slate-900 text-white p-5">
              <div className="flex items-center gap-3 mb-4">
                <ShieldCheck className="h-5 w-5 text-teal-500" />
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em]">Compliance Node</h4>
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed font-bold uppercase tracking-tight">Registry Node 12-B is currently operating under restricted high-density access protocols. All clinical telemetry is encrypted via TLS 1.3.</p>
              <div className="mt-6 pt-4 border-t border-slate-800 flex justify-between items-center text-[9px] font-mono font-bold text-teal-700">
                <span>SECURE_LINK</span>
                <span>ACTIVE</span>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}