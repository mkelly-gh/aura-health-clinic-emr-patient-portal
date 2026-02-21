import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Heart, FileText, Pill, MessageSquare, ShieldCheck, ArrowRight, Activity, X, Database } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { DrAuraChat } from '@/components/patient/DrAuraChat';
import { chatService } from '@/lib/chat';
import { toast } from 'sonner';
import type { Patient } from '../../../worker/types';
export function Portal() {
  const [searchParams] = useSearchParams();
  const patientIdParam = searchParams.get('patientId');
  const [patient, setPatient] = useState<Patient | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const initPortal = useCallback(async () => {
    setIsInitializing(true);
    try {
      const res = await fetch('/api/patients');
      const data = await res.json();
      if (data.success && data.data.length > 0) {
        const selected = patientIdParam ? data.data.find((p: Patient) => p.id === patientIdParam) || data.data[0] : data.data[0];
        setPatient(selected);
        let sid = localStorage.getItem('aura-session-id') || crypto.randomUUID();
        localStorage.setItem('aura-session-id', sid);
        chatService.init(sid);
        await chatService.initContext(selected.id);
      }
    } finally { setIsInitializing(false); }
  }, [patientIdParam]);
  useEffect(() => { initPortal(); }, [initPortal]);
  if (isInitializing) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
      <Activity className="h-8 w-8 text-teal-700 animate-pulse mb-4" />
      <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">Synchronizing Registry Node...</p>
    </div>
  );
  if (!patient) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50">
      <X className="h-10 w-10 text-destructive mb-6" />
      <h2 className="text-sm font-black uppercase tracking-widest">Portal Connection Lost</h2>
      <Button onClick={() => window.location.href = '/'} className="mt-8 bg-slate-900 rounded-none font-black text-xs uppercase h-11 px-8">Return Home</Button>
    </div>
  );
  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-teal-100 selection:text-teal-900">
      <header className="bg-white border-b px-8 py-4 sticky top-0 z-50 rounded-none shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-none bg-teal-700 flex items-center justify-center text-white shadow-clinical">
              <Heart className="h-4 w-4" />
            </div>
            <span className="font-black text-base tracking-tight uppercase">Aura Portal</span>
          </div>
          <div className="flex items-center gap-4">
             <div className="text-right hidden sm:block">
               <div className="text-[12px] font-black text-slate-900 uppercase tracking-tight">{patient.firstName} {patient.lastName}</div>
               <div className="text-[9px] text-slate-400 font-black uppercase tracking-tighter">MRN: {patient.mrn}</div>
             </div>
             <Avatar className="h-10 w-10 rounded-none border border-slate-200 grayscale shadow-sm">
               <AvatarImage src={patient.avatarUrl} />
               <AvatarFallback className="rounded-none font-black text-[10px]">{patient.firstName[0]}{patient.lastName[0]}</AvatarFallback>
             </Avatar>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-900 rounded-none p-12 text-white relative overflow-hidden border border-slate-800 shadow-clinical-bold">
              <div className="relative z-10">
                <Badge className="bg-teal-600/20 text-teal-400 border-teal-500/30 mb-8 px-3 py-1 rounded-none font-black text-[9px] uppercase tracking-widest">
                  SESSION_SECURE: {chatService.getSessionId().split('-')[0]}
                </Badge>
                <h1 className="text-4xl font-black uppercase tracking-tighter mb-6 leading-none">Status: <span className="text-teal-400">Baseline Optimal</span></h1>
                <p className="text-slate-400 text-[11px] max-w-sm leading-relaxed mb-10 font-bold uppercase tracking-tight">Clinical telemetry is being monitored by Guidance Node 12-B. All registry records are synchronized.</p>
                <Button onClick={() => document.getElementById('clinical-profile')?.scrollIntoView({ behavior: 'smooth' })} className="bg-teal-700 hover:bg-teal-600 rounded-none px-10 h-12 font-black text-[11px] uppercase tracking-widest transition-all shadow-clinical-bold">
                  Review Records <ArrowRight className="ml-3 h-4 w-4" />
                </Button>
              </div>
              <div className="absolute right-[-10%] bottom-[-10%] opacity-10 pointer-events-none">
                <Activity className="h-64 w-64 text-teal-500" />
              </div>
            </div>
            <div id="clinical-profile" className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="rounded-none border-slate-200 shadow-clinical bg-white">
                <CardHeader className="bg-slate-50/50 p-4 border-b flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Registry Profile</CardTitle>
                  <FileText className="h-4 w-4 text-slate-300" />
                </CardHeader>
                <CardContent className="p-6 space-y-5">
                  <div>
                    <span className="text-[9px] uppercase font-black text-slate-400 tracking-widest">Primary Diagnosis</span>
                    <div className="font-black text-sm text-slate-900 mt-2 uppercase tracking-tight">{patient.diagnoses[0]?.description || 'Wellness Baseline'}</div>
                  </div>
                  <div className="flex gap-10">
                    <div>
                      <span className="text-[9px] uppercase font-black text-slate-400 tracking-widest">Blood Group</span>
                      <div className="font-mono text-xs font-black text-teal-700 mt-1">{patient.bloodType}</div>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase font-black text-slate-400 tracking-widest">Registry ID</span>
                      <div className="font-mono text-[10px] bg-slate-100 text-slate-600 px-2 py-1 rounded-none mt-1 inline-block border border-slate-200 font-bold">
                        {patient.mrn}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="rounded-none border-slate-200 shadow-clinical bg-white">
                <CardHeader className="bg-slate-50/50 p-4 border-b flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Active Prescriptions</CardTitle>
                  <Pill className="h-4 w-4 text-slate-300" />
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  {patient.medications.length > 0 ? patient.medications.slice(0, 3).map((m, i) => (
                    <div key={i} className="flex justify-between items-center pb-3 border-b border-slate-100 last:border-0 last:pb-0">
                      <div>
                        <div className="font-black text-[12px] text-slate-900 uppercase">{m.name} <span className="font-bold text-slate-400 text-[10px]">{m.dosage}</span></div>
                        <div className="text-[9px] font-black text-slate-400 uppercase tracking-tight">{m.frequency}</div>
                      </div>
                      <Badge className="bg-teal-50 text-teal-700 text-[8px] font-black h-5 px-1.5 rounded-none border-none uppercase">Verified</Badge>
                    </div>
                  )) : (
                    <div className="text-[10px] text-slate-300 font-black uppercase py-6 text-center italic">Zero active protocols.</div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
          <div className="space-y-6">
            <Card className="rounded-none border-slate-200 bg-white p-8 shadow-clinical">
              <div className="flex items-center gap-4 mb-8">
                <div className="h-11 w-11 rounded-none bg-slate-900 flex items-center justify-center text-teal-500 border border-slate-800 shadow-clinical">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-900">Dr. Aura Assist</h3>
                  <p className="text-[9px] text-slate-400 font-black uppercase tracking-tighter">Clinical AI Pipeline</p>
                </div>
              </div>
              <p className="text-[12px] text-slate-800 leading-relaxed italic mb-10 font-bold bg-slate-50 p-5 border border-slate-100 rounded-none">
                "Hello {patient.firstName}. Registry Node 12-B has synchronized your telemetry. I am ready to analyze your latest protocols."
              </p>
              <Button onClick={() => setChatOpen(true)} className="w-full bg-slate-900 hover:bg-slate-800 rounded-none h-12 font-black text-[11px] uppercase tracking-[0.2em] shadow-clinical-bold">Launch Guidance Interface</Button>
            </Card>
            <Card className="rounded-none border-slate-200 bg-slate-900 text-white p-6 shadow-clinical">
              <div className="flex items-center gap-2 mb-4">
                <ShieldCheck className="h-4 w-4 text-teal-500" />
                <h3 className="text-[10px] font-black uppercase tracking-widest">Security Protocol</h3>
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed mb-8 font-bold uppercase tracking-tight">Your session is isolated on a volatile worker node. Telemetry is purged upon disconnect to maintain registry integrity.</p>
              <div className="text-[9px] font-mono text-teal-600 uppercase font-black border-t border-slate-800 pt-5 flex justify-between items-center">
                <div className="flex items-center gap-2"><Database className="h-3 w-3" /> NODE_SYNC</div>
                <span>{chatService.getSessionId().split('-')[0]}</span>
              </div>
            </Card>
          </div>
        </div>
        <DrAuraChat patientId={patient.id} isOpen={chatOpen} onClose={() => setChatOpen(false)} />
      </main>
    </div>
  );
}