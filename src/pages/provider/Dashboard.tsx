import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, UserPlus, Filter, Download } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { AppLayout } from '@/components/layout/AppLayout';
import type { Patient } from '@/lib/mockData';
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
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Patient Registry</h1>
            <p className="text-muted-foreground text-sm">Review and manage patient records across the clinic.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="hidden sm:flex"><Download className="h-4 w-4 mr-2" /> Export</Button>
            <Button className="bg-teal-700 hover:bg-teal-800"><UserPlus className="h-4 w-4 mr-2" /> New Patient</Button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Registry</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{patients.length} Patients</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Recent Encounters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12 Today</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Unread AI Evidence</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-teal-600">3 Pending</div>
            </CardContent>
          </Card>
        </div>
        <div className="bg-card border rounded-lg overflow-hidden shadow-sm">
          <div className="p-4 border-b flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search by name, MRN, or diagnosis..." 
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button variant="ghost" size="icon"><Filter className="h-4 w-4" /></Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patient Name</TableHead>
                <TableHead>MRN</TableHead>
                <TableHead className="hidden md:table-cell">Gender</TableHead>
                <TableHead className="hidden lg:table-cell">Date of Birth</TableHead>
                <TableHead>Primary Diagnosis</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground">Loading patient records...</TableCell></TableRow>
              ) : filteredPatients.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground">No patients found.</TableCell></TableRow>
              ) : (
                filteredPatients.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">
                      <Link to={`/provider/patient/${p.id}`} className="hover:text-teal-700 transition-colors">
                        {p.lastName}, {p.firstName}
                      </Link>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{p.mrn}</TableCell>
                    <TableCell className="hidden md:table-cell">{p.gender}</TableCell>
                    <TableCell className="hidden lg:table-cell">{p.dob}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400 border-none font-normal">
                        {p.diagnoses[0]?.description || 'N/A'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link to={`/provider/patient/${p.id}`}>
                        <Button variant="ghost" size="sm">View Chart</Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </AppLayout>
  );
}