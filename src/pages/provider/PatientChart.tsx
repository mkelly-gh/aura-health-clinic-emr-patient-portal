import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, Pill, Clipboard, Microscope, Upload, Loader2, TrendingUp, Heart, Thermometer, ExternalLink, Activity, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AppLayout } from '@/components/layout/AppLayout';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { cn } from '@/lib/utils';
import type { Patient } from '../../../worker/types';
const vitalsConfig = {
  hr: { label: "Heart Rate", color: "hsl(174, 100%, 29%)" },
  bp_sys: { label: "Systolic BP", color: "hsl(222, 47%, 11%)" },
} satisfies ChartConfig;
const mockVitalsHistory = [
  { time: '08:00', hr: 72, bp_sys: 118 },
  { time: '12:00', hr: 75, bp_sys: 122 },
  { time: '16:00', hr: 82, bp_sys: 125 },
  { time: '20:00', hr: 70, bp_sys: 120 },
  { time: '00:00', hr: 68, bp_sys: 115 },
  { time: '04:00', hr: 65, bp_sys: 112 },
  { time: '08:00', hr: 74, bp_sys: 119 },
];
export function PatientChart() {
  const { id } = useParams();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<{ analysis: string; confidence: number; image?: string } | null>(null);
  useEffect(() => {
    fetch(`/api/patients/${id}`, { credentials: 'omit' })
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
          credentials: 'omit',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: reader.result })
        });
        const result = await response.json();
        if (result.success) setAnalysisResult({ ...result.data, image: reader.result as string });
      } finally {
        setAnalyzing(false);
      }
    };
    reader.readAsDataURL(file);
  };
  if (loading) return <AppLayout><div className="flex items-center justify-center h-[50vh] text-xs font-bold uppercase tracking-widest text-muted-foreground">Synchronizing Clinical Record...</div></AppLayout>;
  if (!patient) return <AppLayout><div className="p-12 text-center text-xs font-bold uppercase text-muted-foreground">Medical record not found in active registry.</div></AppLayout>;
  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
        <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6 border rounded-lg bg-white p-4">
          <Link to="/provider">
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md"><ChevronLeft className="h-4 w-4" /></Button>
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold">{patient.lastName}, {patient.firstName}</h1>
              <Badge className="bg-slate-900 text-white text-[9px] font-bold px-1.5 py-0 rounded-sm">SQL-SYNC</Badge>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-muted-foreground font-mono mt-1 uppercase">
              <span>MRN: <span className="text-foreground font-bold">{patient.mrn}</span></span>
              <span>DOB: <span className="text-foreground font-bold">{patient.dob}</span></span>
              <span>Blood: <span className="text-foreground font-bold">{patient.bloodType}</span></span>
            </div>
          </div>
          <div className="flex gap-2">
            <Link to={`/portal?patientId=${patient.id}`}>
              <Button variant="outline" size="sm" className="h-8 text-xs font-bold border-slate-200">
                <ExternalLink className="h-3.5 w-3.5 mr-2" /> View Portal
              </Button>
            </Link>
            <Button variant="default" size="sm" className="h-8 bg-teal-700 hover:bg-teal-800 font-bold text-xs px-4">Clinical Encounter</Button>
          </div>
        </div>
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="bg-slate-100 p-0.5 rounded-md h-9 border">
            <TabsTrigger value="overview" className="text-xs font-bold px-4 h-8 data-[state=active]:shadow-none"><FileText className="h-3.5 w-3.5 mr-2" /> Summary</TabsTrigger>
            <TabsTrigger value="trends" className="text-xs font-bold px-4 h-8 data-[state=active]:shadow-none"><TrendingUp className="h-3.5 w-3.5 mr-2" /> Telemetry</TabsTrigger>
            <TabsTrigger value="evidence" className="text-xs font-bold px-4 h-8 data-[state=active]:shadow-none"><Microscope className="h-3.5 w-3.5 mr-2" /> AI Evidence</TabsTrigger>
            <TabsTrigger value="meds" className="text-xs font-bold px-4 h-8 data-[state=active]:shadow-none"><Pill className="h-3.5 w-3.5 mr-2" /> Medications</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
              {[
                { label: 'Height', val: patient.vitals.height },
                { label: 'Weight', val: patient.vitals.weight },
                { label: 'BMI', val: patient.vitals.bmi },
                { label: 'BP', val: patient.vitals.bp, icon: Heart },
                { label: 'HR', val: `${patient.vitals.hr} bpm` },
                { label: 'Temp', val: patient.vitals.temp, icon: Thermometer },
              ].map((v, idx) => (
                <Card key={idx} className="rounded-md border-slate-200 shadow-none bg-slate-50/50">
                  <CardHeader className="p-3 pb-1 flex-row items-center justify-between space-y-0">
                    <span className="text-[9px] font-bold uppercase text-muted-foreground">{v.label}</span>
                  </CardHeader>
                  <CardContent className="p-3 pt-0"><div className="text-sm font-bold">{v.val}</div></CardContent>
                </Card>
              ))}
            </div>
            <Card className="rounded-md border-slate-200 shadow-none">
              <CardHeader className="p-4 border-b bg-slate-50"><CardTitle className="text-sm font-bold flex items-center gap-2"><Clipboard className="h-4 w-4 text-teal-700" /> Active Diagnoses</CardTitle></CardHeader>
              <CardContent className="p-0">
                {patient.diagnoses.map((d, i) => (
                  <div key={i} className="flex justify-between items-center p-4 border-b last:border-0 hover:bg-slate-50 transition-colors">
                    <div>
                      <div className="font-mono text-[9px] font-bold text-teal-700 mb-0.5">{d.code}</div>
                      <div className="font-bold text-sm">{d.description}</div>
                      <div className="text-[9px] text-muted-foreground mt-0.5 uppercase font-bold tracking-wider">Manifested: {d.date}</div>
                    </div>
                    <Badge variant="outline" className="text-[9px] font-bold rounded-sm border-teal-200 text-teal-700 bg-teal-50">VERIFIED</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="trends" className="space-y-4">
            <Card className="rounded-md border-slate-200 shadow-none">
              <CardHeader className="p-4 border-b bg-slate-50">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Activity className="h-4 w-4 text-teal-700" /> 72-Hour Vitals Trending
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <ChartContainer config={vitalsConfig} className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={mockVitalsHistory} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="time" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line type="monotone" dataKey="hr" stroke="var(--color-hr)" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                      <Line type="monotone" dataKey="bp_sys" stroke="var(--color-bp_sys)" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
                <div className="flex justify-center gap-6 mt-4">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-teal-700" />
                    <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Heart Rate (bpm)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-slate-900" />
                    <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Systolic BP (mmHg)</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="meds" className="space-y-4">
            <Card className="rounded-md border-slate-200 shadow-none">
              <CardHeader className="p-4 border-b bg-slate-50">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Pill className="h-4 w-4 text-teal-700" /> Medication List
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {patient.medications.map((m, i) => (
                  <div key={i} className="flex justify-between items-center p-4 border-b last:border-0 hover:bg-slate-50 transition-colors">
                    <div>
                      <div className="font-bold text-sm">{m.name}</div>
                      <div className="text-[10px] text-muted-foreground font-medium mt-0.5">{m.dosage} • {m.frequency}</div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right hidden sm:block">
                        <div className="text-[9px] font-bold uppercase text-muted-foreground">Provider</div>
                        <div className="text-[10px] font-bold">Dr. Aura Node-1</div>
                      </div>
                      <Badge className={cn(
                        "text-[9px] font-bold rounded-sm border-none px-2",
                        m.status === 'Active' ? 'bg-teal-100 text-teal-700' : 'bg-slate-100 text-slate-500'
                      )}>
                        {m.status.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="evidence" className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="border-2 border-dashed border-slate-200 rounded-lg p-10 bg-slate-50/50 flex flex-col items-center justify-center text-center">
              <input type="file" id="evidence-upload" className="hidden" accept="image/*" onChange={handleFileUpload} />
              <label htmlFor="evidence-upload" className="cursor-pointer">
                <div className="h-12 w-12 rounded bg-white border flex items-center justify-center text-slate-400 mb-4 mx-auto shadow-sm">
                  {analyzing ? <Loader2 className="h-6 w-6 animate-spin" /> : <Upload className="h-6 w-6" />}
                </div>
                <h3 className="text-sm font-bold mb-1">Upload Clinical Evidence</h3>
                <p className="text-[11px] text-muted-foreground max-w-[240px] mb-4">Launch AI Vision analysis on radiographic or dermatological imagery.</p>
                <Button variant="outline" size="sm" className="h-8 font-bold text-[10px] uppercase pointer-events-none">Select File</Button>
              </label>
            </Card>
            {analysisResult && (
              <Card className="rounded-lg border-slate-200 shadow-none overflow-hidden bg-white">
                <div className="flex h-full flex-col sm:flex-row">
                  {analysisResult.image && <div className="w-full sm:w-2/5 aspect-square bg-slate-100"><img src={analysisResult.image} className="w-full h-full object-cover" alt="Clinical Evidence" /></div>}
                  <div className="p-4 flex-1 flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                      <Badge className="bg-teal-700 text-white rounded-sm text-[9px] font-bold">AI INSIGHT</Badge>
                      <span className="text-[9px] font-mono font-bold text-muted-foreground uppercase">{Math.round(analysisResult.confidence * 100)}% CONFIDENCE</span>
                    </div>
                    <div className="flex-1 text-xs leading-relaxed italic text-slate-700 mb-4 bg-slate-50 p-3 rounded border">"{analysisResult.analysis}"</div>
                    <div className="flex gap-2"><Button size="sm" className="flex-1 h-8 bg-teal-700 hover:bg-teal-800 text-[10px] font-bold uppercase">Append to Chart</Button></div>
                  </div>
                </div>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}