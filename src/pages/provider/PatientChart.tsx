import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, Printer, MoreVertical, FileText, Pill, Clipboard, Microscope, Upload, Loader2, CheckCircle2, TrendingUp, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AppLayout } from '@/components/layout/AppLayout';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { Patient } from '../../../worker/types';
const MOCK_TRENDS = [
  { time: '08:00', hr: 72, bp_sys: 120, temp: 98.6 },
  { time: '10:00', hr: 75, bp_sys: 122, temp: 98.7 },
  { time: '12:00', hr: 70, bp_sys: 118, temp: 98.4 },
  { time: '14:00', hr: 82, bp_sys: 130, temp: 99.1 },
  { time: '16:00', hr: 74, bp_sys: 121, temp: 98.6 },
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
        if (result.success) {
          setAnalysisResult({ ...result.data, image: reader.result as string });
        }
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row md:items-center gap-6 mb-8 bg-card p-6 rounded-2xl border shadow-sm">
          <Link to="/provider">
            <Button variant="outline" size="icon" className="rounded-xl"><ChevronLeft className="h-5 w-5" /></Button>
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-foreground">{patient.lastName}, {patient.firstName}</h1>
              <Badge className="bg-teal-100 text-teal-800 border-none">Active Patient</Badge>
            </div>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm text-muted-foreground mt-2">
              <span className="flex items-center gap-1 font-mono">MRN: <span className="text-foreground font-bold">{patient.mrn}</span></span>
              <span className="flex items-center gap-1">DOB: <span className="text-foreground font-bold">{patient.dob}</span></span>
              <span className="flex items-center gap-1">Gender: <span className="text-foreground font-bold">{patient.gender}</span></span>
              <span className="flex items-center gap-1">Blood: <span className="text-foreground font-bold">{patient.bloodType}</span></span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="rounded-xl"><Printer className="h-4 w-4 mr-2" /> Summary</Button>
            <Button variant="default" className="bg-teal-700 hover:bg-teal-800 rounded-xl px-6">Edit Chart</Button>
          </div>
        </div>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="bg-muted/50 p-1 rounded-xl mb-6 flex-wrap h-auto">
            <TabsTrigger value="overview" className="rounded-lg py-2"><FileText className="h-4 w-4 mr-2" /> Clinical Summary</TabsTrigger>
            <TabsTrigger value="trends" className="rounded-lg py-2"><TrendingUp className="h-4 w-4 mr-2" /> Vitals Trends</TabsTrigger>
            <TabsTrigger value="evidence" className="rounded-lg py-2"><Microscope className="h-4 w-4 mr-2" /> AI Evidence</TabsTrigger>
            <TabsTrigger value="meds" className="rounded-lg py-2"><Pill className="h-4 w-4 mr-2" /> Medications</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {Object.entries(patient.vitals).map(([key, val]) => (
                <Card key={key} className="border-none shadow-sm bg-teal-50/50 dark:bg-teal-900/10">
                  <CardHeader className="py-3 px-4"><CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{key}</CardTitle></CardHeader>
                  <CardContent className="px-4 pb-4"><div className="text-xl font-bold text-foreground">{val}</div></CardContent>
                </Card>
              ))}
            </div>
            <Card className="rounded-2xl border shadow-sm">
              <CardHeader className="border-b bg-muted/20"><CardTitle className="text-lg flex items-center gap-2"><Clipboard className="h-5 w-5 text-teal-600" /> Active Diagnoses</CardTitle></CardHeader>
              <CardContent className="p-0">
                {patient.diagnoses.map((d, i) => (
                  <div key={i} className="flex justify-between items-center p-6 border-b last:border-0 hover:bg-muted/5 transition-colors">
                    <div>
                      <div className="font-mono text-xs font-bold text-teal-700 dark:text-teal-400 mb-1">{d.code}</div>
                      <div className="font-bold text-lg">{d.description}</div>
                      <div className="text-xs text-muted-foreground mt-1">First Identified: {d.date}</div>
                    </div>
                    <Badge className="bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-100 px-3 py-1">Verified</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="trends" className="space-y-6">
            <Card className="p-6 rounded-2xl border shadow-sm h-[500px]">
              <CardHeader className="px-0 pt-0 mb-6">
                <CardTitle className="text-lg flex items-center justify-between">
                  <span>Heart Rate & BP Trends (24h)</span>
                  <Badge variant="outline" className="text-teal-600">Real-time Feed</Badge>
                </CardTitle>
              </CardHeader>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={MOCK_TRENDS}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                  <XAxis dataKey="time" stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} 
                  />
                  <Line type="monotone" dataKey="hr" stroke="#0F766E" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} name="Heart Rate" />
                  <Line type="monotone" dataKey="bp_sys" stroke="#0EA5E9" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} name="BP Systolic" />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </TabsContent>
          <TabsContent value="evidence">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="border-dashed border-2 flex flex-col items-center justify-center p-16 text-center bg-muted/10 rounded-3xl hover:bg-muted/20 transition-all group">
                <input type="file" id="evidence-upload" className="hidden" accept="image/*" onChange={handleFileUpload} />
                <label htmlFor="evidence-upload" className="cursor-pointer">
                  <div className="h-20 w-20 rounded-3xl bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center text-teal-600 mb-6 group-hover:scale-110 group-hover:bg-teal-600 group-hover:text-white transition-all shadow-md">
                    {analyzing ? <Loader2 className="h-10 w-10 animate-spin" /> : <Upload className="h-10 w-10" />}
                  </div>
                  <h3 className="font-bold text-2xl mb-2 text-foreground">Aura Clinical Vision</h3>
                  <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-8">Upload dermoscopy, radiograph, or gross imagery for intelligent AI feature extraction.</p>
                  <Button variant="secondary" className="rounded-xl px-8 py-6 font-bold shadow-sm pointer-events-none">Select Medical Imagery</Button>
                </label>
              </Card>
              {analyzing ? (
                <div className="space-y-6 bg-card p-8 rounded-3xl border shadow-inner">
                  <div className="flex items-center gap-3">
                    <Loader2 className="h-5 w-5 animate-spin text-teal-600" />
                    <span className="font-bold text-lg">Running Llava Analysis...</span>
                  </div>
                  <Skeleton className="h-8 w-1/3 rounded-lg" />
                  <Skeleton className="h-40 w-full rounded-2xl" />
                  <Skeleton className="h-32 w-full rounded-2xl" />
                </div>
              ) : analysisResult ? (
                <Card className="bg-white dark:bg-card border-none shadow-xl rounded-3xl overflow-hidden flex flex-col">
                  <div className="flex flex-col sm:flex-row h-full">
                    {analysisResult.image && (
                      <div className="w-full sm:w-1/2 aspect-square">
                        <img src={analysisResult.image} alt="Clinical evidence" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="p-8 flex-1 flex flex-col">
                      <div className="flex items-center justify-between mb-6">
                        <Badge className="bg-teal-600 text-white border-none px-4 py-1">AI Findings</Badge>
                        <span className="text-xs font-mono font-bold text-teal-600">{Math.round(analysisResult.confidence * 100)}% Match</span>
                      </div>
                      <div className="flex-1 bg-muted/30 rounded-2xl p-6 mb-6 overflow-y-auto">
                        <h4 className="font-bold mb-3 flex items-center gap-2"><AlertCircle className="h-4 w-4 text-amber-500" /> Analysis Report</h4>
                        <p className="text-sm leading-relaxed text-foreground/80">{analysisResult.analysis}</p>
                      </div>
                      <div className="flex gap-3">
                        <Button className="flex-1 bg-teal-700 hover:bg-teal-800 rounded-xl">Append to Record</Button>
                        <Button variant="ghost" className="rounded-xl">Ignore</Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ) : (
                <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-3xl bg-muted/5 p-20 text-muted-foreground">
                  <div className="h-16 w-16 rounded-full bg-muted/20 flex items-center justify-center mb-4">
                    <Microscope className="h-8 w-8 opacity-20" />
                  </div>
                  <p className="font-medium">No imagery analyzed for current session.</p>
                </div>
              )}
            </div>
          </TabsContent>
          <TabsContent value="meds">
            <Card className="rounded-2xl border shadow-sm overflow-hidden">
              <CardContent className="p-0">
                {patient.medications.map((m, i) => (
                  <div key={i} className="flex justify-between items-center p-6 border-b last:border-0 hover:bg-muted/5 transition-colors">
                    <div>
                      <div className="font-bold text-lg">{m.name} <span className="text-muted-foreground font-normal ml-2">{m.dosage}</span></div>
                      <div className="text-sm font-medium text-teal-600 mt-1 uppercase tracking-wider text-[10px]">{m.frequency}</div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge variant={m.status === 'Active' ? 'default' : 'secondary'} className={m.status === 'Active' ? 'bg-teal-600' : ''}>{m.status}</Badge>
                      <Button variant="ghost" size="icon" className="rounded-full"><MoreVertical className="h-4 w-4" /></Button>
                    </div>
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