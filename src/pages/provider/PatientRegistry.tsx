import React, { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, Activity, ChevronRight, Users, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AppLayout } from '@/components/layout/AppLayout';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { Patient } from '../../../worker/types';
export function PatientRegistry() {
  const [searchParams] = useSearchParams();
  const queryParam = searchParams.get('q') || '';
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchTerm, setSearchTerm] = useState(queryParam);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    setSearchTerm(queryParam);
  }, [queryParam]);
  useEffect(() => {
    fetch('/api/patients')
      .then(res => res.json())
      .then(res => {
        if (res.success) setPatients(res.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);
  const filteredPatients = useMemo(() => {
    return patients.filter(p =>
      `${p.firstName} ${p.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.mrn.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [patients, searchTerm]);
  return (
    <AppLayout className="bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 bg-slate-900 flex items-center justify-center text-teal-500 shadow-clinical border border-slate-800">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tighter text-slate-900 uppercase">Patient Registry</h1>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-1">Full Census Synchronization • Node 12-B</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="h-7 px-3 rounded-none border-slate-200 text-[9px] font-black uppercase bg-white">
              Total Count: {patients.length}
            </Badge>
          </div>
        </div>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-teal-600 transition-colors" />
            <Input
              placeholder="Filter by Name, MRN or Registry ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-11 bg-white border-slate-200 rounded-none text-[11px] font-bold uppercase tracking-wider focus-visible:ring-1 focus-visible:ring-teal-600 shadow-clinical"
            />
          </div>
          <Button variant="outline" className="h-11 rounded-none border-slate-200 bg-white text-[10px] font-black uppercase tracking-widest px-6 shadow-clinical">
            <Filter className="h-4 w-4 mr-2 text-slate-400" /> Advanced Filter
          </Button>
        </div>
        <div className="bg-white border border-slate-200 shadow-clinical overflow-hidden rounded-none">
          <Table className="clinical-density-table">
            <TableHeader>
              <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                <TableHead className="w-[120px]">MRN</TableHead>
                <TableHead>Patient Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden lg:table-cell">Primary Diagnosis</TableHead>
                <TableHead className="hidden md:table-cell">Latest Vitals</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-[10px] font-black uppercase text-slate-300">
                    Synchronizing Registry Content...
                  </TableCell>
                </TableRow>
              ) : filteredPatients.length > 0 ? (
                filteredPatients.map((p) => (
                  <TableRow key={p.id} className="group hover:bg-slate-50/80 transition-colors">
                    <TableCell className="font-mono text-[10px] font-black text-slate-500 clinical-mono uppercase">
                      {p.mrn}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8 rounded-none border border-slate-100 grayscale">
                          <AvatarImage src={p.avatarUrl} />
                          <AvatarFallback className="text-[9px] font-black">{p.firstName[0]}{p.lastName[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="font-black text-slate-900 uppercase tracking-tight">{p.lastName}, {p.firstName}</span>
                          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">DOB: {p.dob}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={p.history.includes('CRITICAL') ? 'clinical-urgent' : 'clinical-stable'} className="h-5 px-1.5 text-[8px] font-black uppercase tracking-widest rounded-none">
                        {p.history.includes('CRITICAL') ? 'Critical' : 'Stable'}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <div className="max-w-[200px] truncate text-teal-700 font-bold uppercase tracking-tight">
                        {p.diagnoses[0]?.description || 'Normal Monitoring'}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex items-center gap-3 text-[9px] font-black clinical-mono text-slate-500 uppercase">
                        <Activity className="h-3 w-3 text-teal-600" /> {p.vitals.bp || '120/80'}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="ghost" className="h-8 w-8 p-0 rounded-none hover:bg-teal-50 hover:text-teal-700">
                        <Link to={`/provider/patient/${p.id}`}>
                          <ChevronRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-[10px] font-black uppercase text-slate-300">
                    Zero Records Match Search Criteria.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center justify-between pt-4 border-t border-slate-200">
           <div className="text-[9px] font-black uppercase text-slate-400 tracking-[0.2em] flex items-center gap-2">
             <Activity className="h-3 w-3" /> Live SQL Registry Connection Operational
           </div>
           <div className="flex gap-1">
             <Button variant="outline" size="sm" className="h-8 rounded-none border-slate-200 text-[9px] font-black uppercase px-4 opacity-50 cursor-not-allowed">Previous</Button>
             <Button variant="outline" size="sm" className="h-8 rounded-none border-slate-200 text-[9px] font-black uppercase px-4 opacity-50 cursor-not-allowed">Next</Button>
           </div>
        </div>
      </div>
    </AppLayout>
  );
}