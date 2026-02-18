import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, Printer, MoreVertical, FileText, Pill, Clipboard, Microscope, Upload, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AppLayout } from '@/components/layout/AppLayout';
import type { Patient } from '../../../worker/types';
export function PatientChart() {
  const { id } = useParams();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<{ analysis: string; confidence: number } | null>(null);
  useEffect(() => {
    fetch(`/api/patients/${id}`)
      .then(res => res.json())
      .then(res => {
        if (res.success) setPatient(res.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAnalyzing(true);
    setAnalysisResult(null);
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const response = await fetch('/api/analyze-evidence', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: reader.result })
        });
        const result = await response.json();
        if (result.success) setAnalysisResult(result.data);
      } catch (err) {
        console.error("Analysis failed", err);
      } finally {
        setAnalyzing(false);
      }
    };
    reader.readAsDataURL(file);
  };
  if (loading) return <AppLayout><div className="flex items-center justify-center h-[50vh]"><Loader2 className="animate-spin mr-2" /> Loading clinical data...</div></AppLayout>;
  if (!patient) return <AppLayout><div className="p-8 text-center">Patient not found.</div></AppLayout>;
  return (
    <AppLayout>
      <div className="space-y-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-4">
          <Link to="/provider">
            <Button variant="ghost" size="icon"><ChevronLeft className="h-4 w-4" /></Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground">{patient.lastName}, {patient.firstName}</h1>
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
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
              {Object.entries(patient.vitals).map(([key, val]) => (
                <Card key={key} className="bg-card">
                  <CardHeader className="py-2"><CardTitle className="text-[10px] font-bold uppercase text-muted-foreground">{key}</CardTitle></CardHeader>
                  <CardContent><div className="text-base font-bold text-foreground">{val}</div></CardContent>
                </Card>
              ))}
            </div>
            <Card>
              <CardHeader><CardTitle className="text-lg">Active Diagnoses</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {patient.diagnoses.map((d, i) => (
                  <div key={i} className="flex justify-between items-center p-4 border rounded-xl bg-accent/20">
                    <div>
                      <div className="font-bold text-teal-700 dark:text-teal-400">{d.code}</div>
                      <div className="text-sm font-medium">{d.description}</div>
                      <div className="text-xs text-muted-foreground mt-1">Identified: {d.date}</div>
                    </div>
                    <Badge className="bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-100">Confirmed</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="evidence" className="mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-dashed border-2 flex flex-col items-center justify-center p-12 text-center bg-muted/10">
                <input type="file" id="evidence-upload" className="hidden" accept="image/*" onChange={handleFileUpload} />
                <label htmlFor="evidence-upload" className="cursor-pointer group">
                  <div className="h-16 w-16 rounded-full bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center text-teal-600 mb-4 group-hover:scale-110 transition-transform">
                    {analyzing ? <Loader2 className="h-8 w-8 animate-spin" /> : <Upload className="h-8 w-8" />}
                  </div>
                  <h3 className="font-bold text-lg">Upload Medical Imagery</h3>
                  <p className="text-sm text-muted-foreground max-w-xs mx-auto mt-2">X-rays, dermoscopic photos, or lab scans for AI analysis.</p>
                  <Button variant="secondary" className="mt-6 pointer-events-none">Select File</Button>
                </label>
              </Card>
              {analyzing ? (
                <div className="space-y-4">
                  <Skeleton className="h-8 w-1/3" />
                  <Skeleton className="h-32 w-full" />
                  <Skeleton className="h-32 w-full" />
                </div>
              ) : analysisResult ? (
                <Card className="bg-teal-50/30 dark:bg-teal-950/20 border-teal-100 dark:border-teal-900">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-teal-600" />
                      Aura Vision Findings
                    </CardTitle>
                    <Badge variant="outline" className="border-teal-600 text-teal-600">
                      {Math.round(analysisResult.confidence * 100)}% Confidence
                    </Badge>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 bg-background rounded-lg border text-sm leading-relaxed whitespace-pre-wrap">
                      {analysisResult.analysis}
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" className="bg-teal-700">Add to Findings</Button>
                      <Button size="sm" variant="ghost">Reject</Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="flex items-center justify-center border rounded-lg bg-muted/5 p-12 text-muted-foreground text-sm">
                  Upload an image to start clinical vision analysis.
                </div>
              )}
            </div>
          </TabsContent>
          <TabsContent value="history" className="mt-4">
            <Card><CardContent className="p-6 text-sm whitespace-pre-wrap leading-relaxed">{patient.history}</CardContent></Card>
          </TabsContent>
          <TabsContent value="meds" className="mt-4">
            <Card>
              <CardContent className="p-0">
                {patient.medications.map((m, i) => (
                  <div key={i} className="flex justify-between p-4 border-b last:border-0 hover:bg-muted/5 transition-colors">
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
        </Tabs>
      </div>
    </AppLayout>
  );
}