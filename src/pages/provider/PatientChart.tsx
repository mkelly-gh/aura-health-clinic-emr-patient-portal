import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, Pill, Clipboard, Upload, Loader2, Heart, Thermometer, Activity, StickyNote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { AppLayout } from '@/components/layout/AppLayout';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import type { Patient } from '../../../worker/types';
const vitalsConfig = {
  hr: { label: "HR", color: "#0d9488" },
  bp_sys: { label: "SYS", color: "#0f172a" },
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
  const fetchPatient = useCallback(async (isRetry = false) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/patients/${id}`);
      const result = await res.json();
      if (result.success && result.data) {
        setPatient(result.data);
      } else if (!isRetry) {
        // RECORD RECOVERY: Trigger a registry sync and retry once
        await fetch('/api/seed-patients', { method: 'POST' });
        return fetchPatient(true);
      }
    } catch (err) {
      console.error("Clinical Record Sync Error", err);
    } finally {
      setLoading(false);
    }
  }, [id]);
  useEffect(() => {
    fetchPatient();
  }, [fetchPatient]);
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAnalyzing(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const res = await fetch('/api/analyze-evidence', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: reader.result })
        });
        const result = await res.json();
        if (result.success) setAnalysisResult({ ...result.data, image: reader.result as string });
      } finally { setAnalyzing(false); }
    };
    reader.readAsDataURL(file);
  };
  if (loading) return <AppLayout><div className="flex items-center justify-center h-[50vh] text-[10px] font-black uppercase tracking-widest text-slate-400">Syncing Clinical Record...</div></AppLayout>;
  if (!patient) return <AppLayout><div className="p-12 text-center text-[10px] font-black uppercase text-slate-400">Record not found in current Registry node.</div></AppLayout>;
  return (
    <AppLayout className="py-6">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-center gap-6 mb-6 border bg-white p-4 rounded-none shadow-clinical">
          <Link to="/provider">
            <Button variant="ghost" size="icon" className="h-9 w-9 border border-slate-200 rounded-none"><ChevronLeft className="h-5 w-5" /></Button>
          </Link>
          <div className="flex-1 flex items-center gap-5">
            <Avatar className="h-12 w-12 rounded-none border border-slate-200 grayscale shadow-sm">
              <AvatarImage src={patient.avatarUrl} />
              <AvatarFallback className="rounded-none font-black text-xs uppercase">{patient.firstName[0]}{patient.lastName[0]}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight">{patient.lastName}, {patient.firstName}</h1>
              <div className="flex gap-6 text-[9px] font-mono font-bold text-slate-500 uppercase mt-1">
                <span>MRN: <span className="text-slate-900">{patient.mrn}</span></span>
                <span>DOB: <span className="text-slate-900">{patient.dob}</span></span>
                <span>Sex: <span className="text-slate-900">{patient.gender}</span></span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="rounded-none h-10 border-slate-200 text-[10px] font-black uppercase tracking-widest px-5">History</Button>
            <Button className="rounded-none h-10 bg-teal-700 hover:bg-teal-800 text-[10px] font-black uppercase tracking-widest px-6 shadow-clinical"><StickyNote className="h-4 w-4 mr-2" /> Clinical Note</Button>
          </div>
        </div>
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-white p-0 h-10 border rounded-none w-full md:w-auto overflow-hidden">
            <TabsTrigger value="overview" className="text-[10px] font-black uppercase px-6 h-full data-[state=active]:bg-slate-900 data-[state=active]:text-white rounded-none border-r">Summary</TabsTrigger>
            <TabsTrigger value="trends" className="text-[10px] font-black uppercase px-6 h-full data-[state=active]:bg-slate-900 data-[state=active]:text-white rounded-none border-r">Telemetry</TabsTrigger>
            <TabsTrigger value="meds" className="text-[10px] font-black uppercase px-6 h-full data-[state=active]:bg-slate-900 data-[state=active]:text-white rounded-none border-r">Meds</TabsTrigger>
            <TabsTrigger value="evidence" className="text-[10px] font-black uppercase px-6 h-full data-[state=active]:bg-slate-900 data-[state=active]:text-white rounded-none">AI Insight</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="space-y-6 outline-none">
            <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
              {[
                { label: 'HT', val: patient.vitals.height },
                { label: 'WT', val: patient.vitals.weight },
                { label: 'BMI', val: patient.vitals.bmi },
                { label: 'BP', val: patient.vitals.bp, icon: Heart },
                { label: 'HR', val: `${patient.vitals.hr} bpm` },
                { label: 'TEMP', val: patient.vitals.temp, icon: Thermometer },
              ].map((v, idx) => (
                <Card key={idx} className="rounded-none border-slate-200 shadow-clinical bg-white">
                  <div className="p-3 border-b bg-slate-50/50 flex items-center justify-between">
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{v.label}</span>
                  </div>
                  <div className="p-3 pt-2 font-mono text-xs font-black text-slate-900 clinical-mono">{v.val}</div>
                </Card>
              ))}
            </div>
            <Card className="rounded-none border-slate-200 shadow-clinical bg-white">
              <CardHeader className="p-4 border-b bg-slate-50/50"><CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 text-slate-900"><Clipboard className="h-4 w-4 text-teal-700" /> Active Diagnoses</CardTitle></CardHeader>
              <div className="divide-y">
                {patient.diagnoses.map((d, i) => (
                  <div key={i} className="flex justify-between items-center p-4 hover:bg-slate-50/50 transition-colors">
                    <div>
                      <div className="font-mono text-[9px] font-black text-teal-700 tracking-tighter clinical-mono uppercase">{d.code}</div>
                      <div className="font-bold text-xs text-slate-900 uppercase">{d.description}</div>
                    </div>
                    <Badge variant="outline" className="text-[8px] font-black h-5 rounded-none border-teal-200 text-teal-700 uppercase">Verified</Badge>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>
          <TabsContent value="trends" className="space-y-6 outline-none">
            <Card className="rounded-none border-slate-200 shadow-clinical bg-white">
              <CardHeader className="p-4 border-b bg-slate-50/50">
                <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                  <Activity className="h-4 w-4 text-teal-700" /> Vitals Telemetry (72h)
                </CardTitle>
              </CardHeader>
              <div className="p-8">
                <ChartContainer config={vitalsConfig} className="h-[400px] w-full">
                  <LineChart data={mockVitalsHistory} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="2 2" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="time" tick={{ fontSize: 9, fontFamily: 'JetBrains Mono', fontWeight: 700 }} tickLine={false} axisLine={false} dy={10} />
                    <YAxis tick={{ fontSize: 9, fontFamily: 'JetBrains Mono', fontWeight: 700 }} tickLine={false} axisLine={false} dx={-10} />
                    <ChartTooltip content={<ChartTooltipContent className="font-mono text-[9px] rounded-none border-slate-200 shadow-xl" />} />
                    <Line type="monotone" dataKey="hr" stroke="#0d9488" strokeWidth={2.5} dot={{ r: 3, fill: '#0d9488', strokeWidth: 0 }} activeDot={{ r: 5, strokeWidth: 0 }} />
                    <Line type="monotone" dataKey="bp_sys" stroke="#0f172a" strokeWidth={2.5} dot={{ r: 3, fill: '#0f172a', strokeWidth: 0 }} activeDot={{ r: 5, strokeWidth: 0 }} />
                  </LineChart>
                </ChartContainer>
              </div>
            </Card>
          </TabsContent>
          <TabsContent value="meds" className="space-y-6 outline-none">
            <Card className="rounded-none border-slate-200 shadow-clinical bg-white">
              <CardHeader className="p-4 border-b bg-slate-50/50">
                <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                  <Pill className="h-4 w-4 text-teal-700" /> Active Medications
                </CardTitle>
              </CardHeader>
              <div className="divide-y">
                {patient.medications.map((m, i) => (
                  <div key={i} className="flex justify-between items-center p-4 hover:bg-slate-50/50 transition-colors">
                    <div>
                      <div className="font-black text-xs text-slate-900 uppercase tracking-tight">{m.name}</div>
                      <div className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">{m.dosage} • {m.frequency}</div>
                    </div>
                    <Badge className="text-[8px] font-black h-5 rounded-none bg-teal-50 text-teal-700 border-none uppercase">Active</Badge>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>
          <TabsContent value="evidence" className="grid grid-cols-1 lg:grid-cols-2 gap-4 outline-none">
            <Card className="border-2 border-dashed border-slate-200 rounded-none p-12 bg-slate-50/50 flex flex-col items-center justify-center text-center">
              <input type="file" id="evidence-upload" className="hidden" accept="image/*" onChange={handleFileUpload} />
              <label htmlFor="evidence-upload" className="cursor-pointer group">
                <div className="h-12 w-12 rounded-none bg-white border flex items-center justify-center text-slate-300 mb-4 mx-auto shadow-clinical group-hover:text-teal-600 group-hover:border-teal-600 transition-all">
                  {analyzing ? <Loader2 className="h-6 w-6 animate-spin" /> : <Upload className="h-6 w-6" />}
                </div>
                <h3 className="text-[11px] font-black uppercase tracking-[0.2em] mb-1">Clinical Imaging</h3>
                <p className="text-[10px] text-slate-500 mb-4 uppercase font-bold tracking-tight">Vision Node Analysis Pipeline.</p>
                <Button variant="outline" size="sm" className="h-8 text-[9px] font-black uppercase tracking-widest rounded-none border-slate-200 group-hover:bg-teal-700 group-hover:text-white group-hover:border-teal-700">Select File</Button>
              </label>
            </Card>
            {analysisResult && (
              <Card className="rounded-none border-slate-200 shadow-clinical overflow-hidden bg-white">
                <div className="flex h-full flex-col sm:flex-row">
                  {analysisResult.image && (
                    <div className="w-full sm:w-1/3 aspect-square bg-slate-100 border-r border-slate-100">
                      <img src={analysisResult.image} className="w-full h-full object-cover grayscale" alt="Evidence" />
                    </div>
                  )}
                  <div className="p-4 flex-1 flex flex-col">
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                      <Badge className="bg-slate-900 text-white rounded-none text-[9px] font-black uppercase tracking-widest">AI_ANALYTICS</Badge>
                      <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-tighter clinical-mono">{Math.round(analysisResult.confidence * 100)}% CONFIDENCE</span>
                    </div>
                    <ScrollArea className="flex-1 pr-2 max-h-[200px]">
                      <div className="text-[11px] leading-relaxed italic text-slate-800 font-bold bg-slate-50 p-4 border border-slate-100">
                        "{analysisResult.analysis}"
                      </div>
                    </ScrollArea>
                    <Button size="sm" className="h-9 bg-teal-700 hover:bg-teal-800 text-[10px] font-black uppercase tracking-widest rounded-none mt-4">Append to Chart</Button>
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