import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, Pill, Clipboard, Microscope, Upload, Loader2, TrendingUp, Heart, Thermometer, Activity, FileText } from 'lucide-react';
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
  hr: { label: "HR", color: "hsl(174, 100%, 29%)" },
  bp_sys: { label: "SYS", color: "hsl(222, 47%, 11%)" },
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
  if (loading) return <AppLayout><div className="flex items-center justify-center h-[50vh] text-[10px] font-black uppercase tracking-widest text-muted-foreground">Syncing Clinical Record...</div></AppLayout>;
  if (!patient) return <AppLayout><div className="p-12 text-center text-[10px] font-black uppercase text-muted-foreground">Record not found.</div></AppLayout>;
  return (
    <AppLayout className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4 border bg-white p-3 rounded-sm shadow-clinical">
          <Link to="/provider">
            <Button variant="ghost" size="icon" className="h-7 w-7"><ChevronLeft className="h-4 w-4" /></Button>
          </Link>
          <div className="flex-1 flex items-center gap-3">
            <h1 className="text-base font-black text-slate-900 uppercase tracking-tight">{patient.lastName}, {patient.firstName}</h1>
            <div className="h-4 w-[1px] bg-slate-200" />
            <div className="flex gap-4 text-[10px] font-mono font-bold text-muted-foreground uppercase">
              <span>MRN: <span className="text-slate-900">{patient.mrn}</span></span>
              <span>DOB: <span className="text-slate-900">{patient.dob}</span></span>
              <span>Sex: <span className="text-slate-900">{patient.gender[0]}</span></span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="h-7 text-[9px] font-bold uppercase border-slate-200">History</Button>
            <Button variant="default" size="sm" className="h-7 bg-teal-700 hover:bg-teal-800 text-[9px] font-bold uppercase px-3">Encounter</Button>
          </div>
        </div>
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="bg-white p-0 h-8 border rounded-sm">
            <TabsTrigger value="overview" className="text-[10px] font-bold uppercase px-4 h-full data-[state=active]:bg-slate-900 data-[state=active]:text-white rounded-none border-r"><FileText className="h-3 w-3 mr-1.5" /> Summary</TabsTrigger>
            <TabsTrigger value="trends" className="text-[10px] font-bold uppercase px-4 h-full data-[state=active]:bg-slate-900 data-[state=active]:text-white rounded-none border-r"><TrendingUp className="h-3 w-3 mr-1.5" /> Telemetry</TabsTrigger>
            <TabsTrigger value="meds" className="text-[10px] font-bold uppercase px-4 h-full data-[state=active]:bg-slate-900 data-[state=active]:text-white rounded-none border-r"><Pill className="h-3 w-3 mr-1.5" /> Meds</TabsTrigger>
            <TabsTrigger value="evidence" className="text-[10px] font-bold uppercase px-4 h-full data-[state=active]:bg-slate-900 data-[state=active]:text-white rounded-none"><Microscope className="h-3 w-3 mr-1.5" /> AI Insight</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
              {[
                { label: 'HT', val: patient.vitals.height },
                { label: 'WT', val: patient.vitals.weight },
                { label: 'BMI', val: patient.vitals.bmi },
                { label: 'BP', val: patient.vitals.bp, icon: Heart },
                { label: 'HR', val: `${patient.vitals.hr} bpm` },
                { label: 'TEMP', val: patient.vitals.temp, icon: Thermometer },
              ].map((v, idx) => (
                <Card key={idx} className="rounded-sm border-slate-200 shadow-clinical bg-white">
                  <div className="p-2 border-b bg-slate-50/50 flex items-center justify-between">
                    <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">{v.label}</span>
                  </div>
                  <div className="p-2 pt-1 font-mono text-xs font-bold text-slate-900">{v.val}</div>
                </Card>
              ))}
            </div>
            <Card className="rounded-sm border-slate-200 shadow-clinical bg-white">
              <CardHeader className="p-3 border-b bg-slate-50/50"><CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2"><Clipboard className="h-3.5 w-3.5 text-teal-700" /> Active Diagnoses</CardTitle></CardHeader>
              <div className="divide-y">
                {patient.diagnoses.map((d, i) => (
                  <div key={i} className="flex justify-between items-center p-3 hover:bg-slate-50/50">
                    <div>
                      <div className="font-mono text-[9px] font-black text-teal-700 tracking-tighter">{d.code}</div>
                      <div className="font-bold text-xs text-slate-900">{d.description}</div>
                    </div>
                    <Badge variant="outline" className="text-[8px] font-black h-4 rounded-none border-teal-200 text-teal-700 uppercase">Verified</Badge>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>
          <TabsContent value="trends" className="space-y-4">
            <Card className="rounded-sm border-slate-200 shadow-clinical bg-white">
              <CardHeader className="p-3 border-b bg-slate-50/50">
                <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                  <Activity className="h-3.5 w-3.5 text-teal-700" /> Vitals Telemetry (72h)
                </CardTitle>
              </CardHeader>
              <div className="p-6">
                <ChartContainer config={vitalsConfig} className="h-[240px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={mockVitalsHistory}>
                      <CartesianGrid strokeDasharray="2 2" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="time" tick={{ fontSize: 9, fontFamily: 'JetBrains Mono' }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 9, fontFamily: 'JetBrains Mono' }} tickLine={false} axisLine={false} />
                      <ChartTooltip content={<ChartTooltipContent className="font-mono text-[9px]" />} />
                      <Line type="stepAfter" dataKey="hr" stroke="var(--color-hr)" strokeWidth={1.5} dot={false} />
                      <Line type="stepAfter" dataKey="bp_sys" stroke="var(--color-bp_sys)" strokeWidth={1.5} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </div>
            </Card>
          </TabsContent>
          <TabsContent value="meds" className="space-y-4">
            <Card className="rounded-sm border-slate-200 shadow-clinical bg-white">
              <CardHeader className="p-3 border-b bg-slate-50/50">
                <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                  <Pill className="h-3.5 w-3.5 text-teal-700" /> Active Medications
                </CardTitle>
              </CardHeader>
              <div className="divide-y">
                {patient.medications.map((m, i) => (
                  <div key={i} className="flex justify-between items-center p-3 hover:bg-slate-50/50">
                    <div>
                      <div className="font-bold text-xs text-slate-900">{m.name}</div>
                      <div className="text-[10px] text-muted-foreground font-medium">{m.dosage} • {m.frequency}</div>
                    </div>
                    <Badge className="text-[8px] font-black h-4 rounded-none bg-teal-50 text-teal-700 border-none uppercase">Active</Badge>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>
          <TabsContent value="evidence" className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <Card className="border-2 border-dashed border-slate-200 rounded-sm p-8 bg-slate-50/50 flex flex-col items-center justify-center text-center">
              <input type="file" id="evidence-upload" className="hidden" accept="image/*" onChange={handleFileUpload} />
              <label htmlFor="evidence-upload" className="cursor-pointer">
                <div className="h-10 w-10 rounded-none bg-white border flex items-center justify-center text-slate-400 mb-3 mx-auto shadow-clinical">
                  {analyzing ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
                </div>
                <h3 className="text-[10px] font-black uppercase tracking-widest mb-1">Upload Clinical Imaging</h3>
                <p className="text-[10px] text-muted-foreground mb-3">Assist diagnosis with AI Vision Node.</p>
                <Button variant="outline" size="sm" className="h-7 text-[9px] font-bold uppercase tracking-widest pointer-events-none">Select File</Button>
              </label>
            </Card>
            {analysisResult && (
              <Card className="rounded-sm border-slate-200 shadow-clinical overflow-hidden bg-white">
                <div className="flex h-full flex-col sm:flex-row">
                  {analysisResult.image && <div className="w-full sm:w-1/3 aspect-square bg-slate-100"><img src={analysisResult.image} className="w-full h-full object-cover grayscale" alt="Evidence" /></div>}
                  <div className="p-3 flex-1 flex flex-col">
                    <div className="flex items-center justify-between mb-3 pb-2 border-b">
                      <Badge className="bg-slate-900 text-white rounded-none text-[8px] font-black">AI_ANALYTICS</Badge>
                      <span className="text-[9px] font-mono font-bold text-muted-foreground uppercase">{Math.round(analysisResult.confidence * 100)}% CONF</span>
                    </div>
                    <div className="flex-1 text-[11px] leading-relaxed italic text-slate-700 mb-3 font-medium bg-slate-50 p-2 border border-slate-100">"{analysisResult.analysis}"</div>
                    <Button size="sm" className="h-7 bg-teal-700 hover:bg-teal-800 text-[9px] font-bold uppercase tracking-widest">Append to Record</Button>
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