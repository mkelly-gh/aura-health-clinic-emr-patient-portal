import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, Printer, MoreVertical, FileText, Pill, Clipboard, Microscope } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AppLayout } from '@/components/layout/AppLayout';
import type { Patient } from '@/lib/mockData';
export function PatientChart() {
  const { id } = useParams();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch(`/api/patients/${id}`)
      .then(res => res.json())
      .then(res => {
        if (res.success) setPatient(res.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);
  if (loading) return <AppLayout><div className="flex items-center justify-center h-[50vh]">Loading clinical data...</div></AppLayout>;
  if (!patient) return <AppLayout><div>Patient not found.</div></AppLayout>;
  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link to="/provider">
            <Button variant="ghost" size="icon"><ChevronLeft className="h-4 w-4" /></Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{patient.lastName}, {patient.firstName}</h1>
            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
              <span>MRN: <span className="font-mono">{patient.mrn}</span></span>
              <span>DOB: {patient.dob}</span>
              <span>SSN: ***-**-{patient.ssn.split('-').pop()}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm"><Printer className="h-4 w-4 mr-2" /> Print</Button>
            <Button variant="outline" size="icon"><MoreVertical className="h-4 w-4" /></Button>
          </div>
        </div>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="bg-muted/50 p-1">
            <TabsTrigger value="overview"><FileText className="h-4 w-4 mr-2" /> Clinical Overview</TabsTrigger>
            <TabsTrigger value="history"><Clipboard className="h-4 w-4 mr-2" /> Medical History</TabsTrigger>
            <TabsTrigger value="meds"><Pill className="h-4 w-4 mr-2" /> Medications</TabsTrigger>
            <TabsTrigger value="evidence"><Microscope className="h-4 w-4 mr-2" /> AI Evidence</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="mt-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {Object.entries(patient.vitals).map(([key, val]) => (
                <Card key={key}>
                  <CardHeader className="py-2"><CardTitle className="text-xs font-medium uppercase text-muted-foreground">{key}</CardTitle></CardHeader>
                  <CardContent><div className="text-lg font-bold">{val}</div></CardContent>
                </Card>
              ))}
            </div>
            <Card>
              <CardHeader><CardTitle className="text-lg">Active Diagnoses</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {patient.diagnoses.map((d, i) => (
                  <div key={i} className="flex justify-between items-center p-3 border rounded-lg bg-muted/20">
                    <div>
                      <div className="font-bold text-teal-700">{d.code}</div>
                      <div className="text-sm font-medium">{d.description}</div>
                    </div>
                    <Badge>Confirmed</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="history" className="mt-4">
            <Card>
              <CardHeader><CardTitle>Past Medical History</CardTitle></CardHeader>
              <CardContent className="whitespace-pre-wrap text-sm leading-relaxed">
                {patient.history}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="meds" className="mt-4">
             <Card>
              <CardHeader><CardTitle>Medication List</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {patient.medications.map((m, i) => (
                  <div key={i} className="flex justify-between border-b pb-4 last:border-0 last:pb-0">
                    <div>
                      <div className="font-bold">{m.name} {m.dosage}</div>
                      <div className="text-sm text-muted-foreground">{m.frequency}</div>
                    </div>
                    <Badge variant={m.status === 'Active' ? 'default' : 'secondary'}>{m.status}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="evidence" className="mt-4">
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center space-y-4">
                <div className="h-12 w-12 rounded-full bg-teal-50 flex items-center justify-center text-teal-600">
                  <Microscope className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold">Aura Vision Analysis</h3>
                  <p className="text-sm text-muted-foreground max-w-xs mx-auto">Upload medical imagery (X-ray, Derm) for intelligent clinical assistance.</p>
                </div>
                <Button variant="secondary">Upload Diagnostic Image</Button>
                <div className="text-[10px] text-muted-foreground mt-4">Powered by LLAVA-1.5 AI Vision</div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}