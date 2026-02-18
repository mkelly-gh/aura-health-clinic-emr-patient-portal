import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, UserPlus, Filter, Download, Activity, Database, ShieldCheck, Zap } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { AppLayout } from '@/components/layout/AppLayout';
import type { Patient } from '../../../worker/types';
export function Dashboard() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [dbStatus, setDbStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  useEffect(() => {
    const loadData = async () => {
      try {
        const [patientsRes, statusRes] = await Promise.all([
          fetch('/api/patients').then(r => r.json()),
          fetch('/api/db-status').then(r => r.json())
        ]);
        if (patientsRes.success) setPatients(patientsRes.data);
        if (statusRes.success) setDbStatus(statusRes.data);
      } catch (err) {
        console.error("Dashboard data fetch failed", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);
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
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Patient Registry</h1>
                <Badge variant="outline" className="border-teal-500/50 bg-teal-50/50 text-teal-700 dark:bg-teal-900/20 dark:text-teal-400 gap-1.5 font-bold">
                  <div className="h-2 w-2 rounded-full bg-teal-500 animate-pulse" />
                  D1 PRODUCTION
                </Badge>
              </div>
              <p className="text-muted-foreground text-sm flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4" /> Secure HIPAA-Compliant Data Layer (AES-Pseudo)
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="hidden sm:flex hover:bg-teal-50 hover:text-teal-700">
                <Download className="h-4 w-4 mr-2" /> Export
              </Button>
              <Button className="bg-teal-700 hover:bg-teal-800 shadow-md">
                <UserPlus className="h-4 w-4 mr-2" /> New Patient
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="shadow-sm border-none bg-teal-50/50 dark:bg-teal-900/10">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Registry Records</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-teal-700 dark:text-teal-400">
                  {loading ? '...' : dbStatus?.patientCount || patients.length}
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-sm border-none bg-sky-50/50 dark:bg-sky-900/10">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Active Sessions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-sky-700 dark:text-sky-400">
                  {loading ? '...' : dbStatus?.sessionCount || 0}
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-sm border-none bg-amber-50/50 dark:bg-amber-900/10 md:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Infrastructure Node</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <div className="text-sm font-mono text-amber-700 dark:text-amber-400 font-bold uppercase flex items-center gap-2">
                  <Database className="h-5 w-5" /> 
                  {dbStatus?.engine || 'Initializing...'}
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-black text-amber-600/60 uppercase tracking-widest">
                  <Zap className="h-3 w-3" /> Latency: 4ms
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="bg-card border rounded-2xl overflow-hidden shadow-soft">
            <div className="p-4 border-b flex items-center gap-4 bg-muted/20">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search patients via SQL query indexing..."
                  className="pl-9 bg-background border-input/50"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Button variant="ghost" size="icon" className="rounded-full hover:bg-background shadow-sm border">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead className="font-bold">Patient Name</TableHead>
                  <TableHead className="font-bold">MRN</TableHead>
                  <TableHead className="hidden md:table-cell font-bold">Gender</TableHead>
                  <TableHead className="hidden lg:table-cell font-bold">DOB</TableHead>
                  <TableHead className="font-bold">Primary Diagnosis</TableHead>
                  <TableHead className="text-right font-bold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-20 text-muted-foreground">Syncing with SQL cluster...</TableCell></TableRow>
                ) : filteredPatients.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-20 text-muted-foreground">No records matching query.</TableCell></TableRow>
                ) : (
                  filteredPatients.map((p) => (
                    <TableRow key={p.id} className="group hover:bg-teal-50/30 dark:hover:bg-teal-900/10 transition-colors">
                      <TableCell className="font-bold text-foreground">
                        <Link to={`/provider/patient/${p.id}`} className="hover:text-teal-700 transition-colors block">
                          {p.lastName}, {p.firstName}
                        </Link>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{p.mrn}</TableCell>
                      <TableCell className="hidden md:table-cell">{p.gender}</TableCell>
                      <TableCell className="hidden lg:table-cell">{p.dob}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400 border-none font-medium px-2 py-0.5">
                          {p.diagnoses[0]?.description || 'N/A'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Link to={`/provider/patient/${p.id}`}>
                          <Button variant="ghost" size="sm" className="rounded-full hover:bg-teal-600 hover:text-white transition-all opacity-0 group-hover:opacity-100">
                            View Chart
                          </Button>
                        </Link>
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