import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, UserPlus, Filter, Download, Activity } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { AppLayout } from '@/components/layout/AppLayout';
import type { Patient } from '../../../worker/types';
export function Dashboard() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  useEffect(() => {
    fetch('/api/patients')
      .then(res => res.json())
      .then(res => {
        if (res.success) setPatients(res.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
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
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <Activity className="h-8 w-8 text-teal-600" />
                Patient Registry
              </h1>
              <p className="text-muted-foreground text-sm mt-1">Review and manage patient records across the clinic.</p>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="shadow-sm border-none bg-teal-50/50 dark:bg-teal-900/10">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Registry</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-teal-700 dark:text-teal-400">{patients.length} Patients</div>
              </CardContent>
            </Card>
            <Card className="shadow-sm border-none bg-sky-50/50 dark:bg-sky-900/10">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Recent Encounters</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-sky-700 dark:text-sky-400">12 Today</div>
              </CardContent>
            </Card>
            <Card className="shadow-sm border-none bg-amber-50/50 dark:bg-amber-900/10">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Unread AI Evidence</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-amber-700 dark:text-amber-400">3 Pending</div>
              </CardContent>
            </Card>
          </div>
          <div className="bg-card border rounded-2xl overflow-hidden shadow-soft">
            <div className="p-4 border-b flex items-center gap-4 bg-muted/20">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, MRN, or diagnosis..."
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
                  <TableHead className="hidden lg:table-cell font-bold">Date of Birth</TableHead>
                  <TableHead className="font-bold">Primary Diagnosis</TableHead>
                  <TableHead className="text-right font-bold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-20 text-muted-foreground">Loading patient records...</TableCell></TableRow>
                ) : filteredPatients.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-20 text-muted-foreground">No patients found.</TableCell></TableRow>
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