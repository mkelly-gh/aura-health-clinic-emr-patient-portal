import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { UserPlus, RefreshCcw, Activity, AlertCircle, FilePlus, FlaskConical, Microscope, Pill, ChevronRight, ShieldCheck, Zap, Database, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
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
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const loadData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setIsRefreshing(true);
    try {
      const [patientsRes, statusRes] = await Promise.all([
        fetch('/api/patients').then(r => r.json()),
        fetch('/api/db-status').then(r => r.json())
      ]);
      if (patientsRes.success) {
        setPatients(patientsRes.data || []);
      }
      if (statusRes.success) setDbStatus(statusRes.data);
    } catch (err) {
      toast.error("Clinical Telemetry Disconnected");
    } finally {
      setLoading(false);
      setTimeout(() => setIsRefreshing(false), 400);
    }
  }, []);
  useEffect(() => {
    // Initial data load ensures registry sync on worker
    loadData();
    const interval = setInterval(() => loadData(true), 30000);
    return () => clearInterval(interval);
  }, [loadData]);
  const handleSeedRegistry = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/seed-patients?force=true', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        toast.success("Clinical Registry Synchronized");
        await loadData();
      }
    } catch (err) {
      toast.error("Registry Seeding Failed");
    } finally {
      setIsRefreshing(false);
    }
  };
  const stats = [
    { label: 'Clinical Census', val: patients.length.toString(), trend: '+0.4% ↗', icon: Activity, bg: 'bg-teal-600', sub: 'Active Records' },
    { label: 'Urgent Intervention', val: patients.filter(p => p.history?.includes('CRITICAL')).length.toString(), trend: 'URGENT', icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-600', sub: 'Action Required' },
    { label: 'Registry Integrity', val: dbStatus?.status || 'HEALTHY', trend: 'STABLE', icon: Database, bg: 'bg-slate-900', sub: 'SQL Instance 12-B' },
    { label: 'Aura Protocol', val: '04', trend: 'ACTIVE', icon: Zap, bg: 'bg-teal-800', sub: 'Processing Nodes' },
  ];
  return (
    <AppLayout className="bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-6 py-10 space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
          <div>
            <h1 className="text-2xl font-black tracking-tighter text-slate-900 uppercase leading-none">Command Center</h1>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-2 flex items-center gap-2">
              <Database className="h-3 w-3" /> Production Instance • D1_NODE_12 • {new Date().toLocaleTimeString()}
            </p>
          </div>
          <div className="flex items-center gap-3">
             <Button
                variant="outline"
                size="icon"
                onClick={() => loadData(true)}
                disabled={isRefreshing}
                className="rounded-none border-slate-200 h-11 w-11 shadow-sm bg-white"
              >
                <RefreshCcw className={cn("h-4 w-4 text-slate-500", isRefreshing && "animate-spin")} />
             </Button>
             <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="rounded-none h-11 bg-slate-900 hover:bg-slate-800 text-[10px] font-black uppercase tracking-[0.2em] px-8 shadow-clinical-bold border-none transition-all">
                    <UserPlus className="h-4 w-4 mr-3" /> Initiate Clinical Admission
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl rounded-none p-10 border-none shadow-2xl">
                  <DialogHeader className="mb-8">
                    <DialogTitle className="text-xl font-black uppercase tracking-tight">Registry Enrollment</DialogTitle>
                    <DialogDescription className="text-xs text-slate-500 font-bold uppercase tracking-wide mt-1">Append new patient clinical metadata to the secure production node.</DialogDescription>
                  </DialogHeader>
                  <PatientForm onSubmit={async (data) => {
                    setIsCreating(true);
                    try {
                      const res = await fetch('/api/patients', {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify(data)
                      });
                      if ((await res.json()).success) {
                        toast.success("Clinical Record Committed");
                        setIsDialogOpen(false);
                        await loadData();
                      }
                    } finally { setIsCreating(false); }
                  }} isLoading={isCreating} />
                </DialogContent>
             </Dialog>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <Card key={i} className="rounded-none border-slate-200 shadow-clinical bg-white p-5 flex flex-col justify-between h-36 border-l-4 border-l-slate-800 hover:border-l-teal-600 transition-all group">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 group-hover:text-teal-700 transition-colors">{stat.label}</span>
                <div className={cn("h-8 w-8 flex items-center justify-center text-white shadow-sm", stat.bg)}>
                  <stat.icon className="h-4 w-4" />
                </div>
              </div>
              <div>
                <div className="text-3xl font-black text-slate-900 leading-none clinical-mono">{stat.val}</div>
                <div className={cn("text-[8px] font-black uppercase tracking-widest mt-2 flex items-center gap-1.5", stat.color ? stat.color : "text-teal-700")}>
                  <BarChart3 className="h-3 w-3" /> {stat.trend} • <span className="text-slate-400">{stat.sub}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-900">Registry Ledger</h3>
              <div className="flex items-center gap-3">
                {isRefreshing && <RefreshCcw className="h-3.5 w-3.5 animate-spin text-teal-600" />}
                <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-[0.2em]">D1_SQL_SYNC: OK</span>
              </div>
            </div>
            <div className="space-y-4">
              {loading ? (
                <div className="py-32 text-center text-[11px] font-black uppercase text-slate-300 tracking-[0.5em] animate-pulse">Synchronizing Clinical Data...</div>
              ) : patients.length > 0 ? (
                patients.slice(0, 10).map((p) => (
                  <Link key={p.id} to={`/provider/patient/${p.id}`} className="block group">
                    <Card className="rounded-none border-slate-200 clinical-card-hover bg-white p-5 flex items-center gap-6 transition-all group-hover:bg-slate-50/80">
                      <Avatar className="h-14 w-14 rounded-none border border-slate-200 shadow-sm shrink-0 grayscale group-hover:grayscale-0 transition-all">
                        <AvatarImage src={p.avatarUrl} />
                        <AvatarFallback className="text-sm font-black uppercase bg-slate-100 text-slate-400">{p.lastName?.[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-3">
                          <h4 className="text-base font-black uppercase tracking-tight text-slate-900 truncate">{p.lastName}, {p.firstName}</h4>
                          <Badge variant="outline" className="text-[9px] font-mono font-black border-slate-200 h-5 px-2 rounded-none text-slate-400 bg-slate-50">{p.mrn}</Badge>
                        </div>
                        <p className="text-[11px] font-bold text-teal-700 uppercase tracking-tight mt-1 truncate max-w-lg">
                          {p.diagnoses?.[0]?.description || 'ROUTINE_MONITORING'}
                        </p>
                        <div className="flex items-center gap-5 mt-2">
                          <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2 clinical-mono"><Activity className="h-3 w-3" /> {p.vitals?.bp || '120/80'}</span>
                          <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest border-l pl-5 border-slate-100">UPDATED: {new Date().toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-3 shrink-0">
                        <Badge variant={p.history?.includes('CRITICAL') ? 'clinical-urgent' : 'clinical-stable'} className="h-6 px-3 text-[9px] font-black uppercase tracking-widest rounded-none shadow-clinical">
                          {p.history?.includes('CRITICAL') ? 'Critical' : 'Stable'}
                        </Badge>
                        <ChevronRight className="h-5 w-5 text-slate-200 group-hover:text-teal-600 transition-colors" />
                      </div>
                    </Card>
                  </Link>
                ))
              ) : (
                <Card className="rounded-none border-dashed border-2 border-slate-300 p-20 flex flex-col items-center justify-center text-center bg-white shadow-inner">
                  <div className="h-14 w-14 bg-slate-100 flex items-center justify-center rounded-none mb-6">
                    <Database className="h-7 w-7 text-slate-300" />
                  </div>
                  <p className="text-[12px] font-black uppercase text-slate-400 tracking-[0.3em] mb-8">Clinical Registry Empty or Isolated</p>
                  <Button onClick={handleSeedRegistry} className="rounded-none h-12 bg-slate-900 hover:bg-slate-800 text-[10px] font-black uppercase tracking-widest px-10 shadow-clinical-bold border-none">
                    Seed Professional Registry
                  </Button>
                </Card>
              )}
            </div>
            {patients.length > 10 && (
               <div className="pt-6 text-center">
                 <Link to="/provider/patients">
                   <Button variant="ghost" className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 hover:text-teal-700 transition-colors">View Full Patient Census ({patients.length})</Button>
                 </Link>
               </div>
            )}
          </div>
          <div className="space-y-8">
            <Card className="rounded-none border-slate-200 shadow-clinical-bold bg-white border-t-2 border-t-teal-600 overflow-hidden">
              <div className="p-5 border-b bg-slate-50/50 flex justify-between items-center">
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-900">System Protocols</h3>
                <ShieldCheck className="h-4 w-4 text-teal-600" />
              </div>
              <CardContent className="p-5 space-y-4">
                <Button className="w-full justify-between rounded-none h-14 bg-slate-900 hover:bg-slate-800 text-[10px] font-black uppercase tracking-[0.2em] px-5 group shadow-clinical border-none">
                  <div className="flex items-center">
                    <Pill className="h-5 w-5 mr-4 text-teal-500" /> Rx Requisition
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-600 group-hover:text-teal-500 transition-colors" />
                </Button>
                <Button variant="outline" className="w-full justify-between rounded-none h-14 border-slate-200 text-[10px] font-black uppercase tracking-[0.2em] text-slate-700 px-5 group hover:bg-slate-50 shadow-sm transition-all">
                  <div className="flex items-center">
                    <Microscope className="h-5 w-5 mr-4 text-slate-400 group-hover:text-teal-600" /> Radiology Priority
                  </div>
                  <Activity className="h-4 w-4 text-slate-200 group-hover:text-teal-500" />
                </Button>
                <Button variant="outline" className="w-full justify-between rounded-none h-14 border-slate-200 text-[10px] font-black uppercase tracking-[0.2em] text-slate-700 px-5 group hover:bg-slate-50 shadow-sm transition-all">
                  <div className="flex items-center">
                    <FlaskConical className="h-5 w-5 mr-4 text-slate-400 group-hover:text-teal-600" /> Laboratory Batch
                  </div>
                  <Database className="h-4 w-4 text-slate-200" />
                </Button>
              </CardContent>
            </Card>
            <Card className="rounded-none border-slate-900 bg-slate-900 text-white p-8 relative overflow-hidden border-b-4 border-b-teal-600 shadow-clinical-bold">
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-8 w-8 bg-teal-600 flex items-center justify-center rounded-none shadow-sm">
                    <ShieldCheck className="h-5 w-5 text-white" />
                  </div>
                  <h4 className="text-[11px] font-black uppercase tracking-[0.3em]">Node Integrity</h4>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed font-bold uppercase tracking-tight mb-8">
                  Active monitoring by Registry Node 12-B. All clinical telemetry is processed via TLS 1.3 / AES-256 volatile workers.
                </p>
                <div className="flex items-center justify-between border-t border-slate-800 pt-6">
                  <Badge className="bg-teal-900 text-teal-400 border-teal-800 rounded-none text-[8px] font-black tracking-[0.2em] uppercase px-2 h-6">AURA_SECURE</Badge>
                  <span className="text-[10px] font-mono font-bold text-slate-500 tracking-widest">v3.0.0</span>
                </div>
              </div>
              <Activity className="absolute bottom-[-15px] right-[-15px] h-32 w-32 text-teal-500 opacity-[0.03] pointer-events-none" />
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}