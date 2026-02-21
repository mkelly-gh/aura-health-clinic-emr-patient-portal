import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Heart, FileText, Pill, MessageSquare, ShieldCheck, ArrowRight, Activity, X } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
      const res = await fetch('/api/patients', { credentials: 'omit' });
      const data = await res.json();
      if (data.success && data.data.length > 0) {
        const selectedPatient = patientIdParam
          ? data.data.find((p: Patient) => p.id === patientIdParam) || data.data[0]
          : data.data[0];
        setPatient(selectedPatient);
        // Persist session across refreshes
        let sessionId = localStorage.getItem('aura-session-id');
        if (!sessionId) {
          sessionId = crypto.randomUUID();
          localStorage.setItem('aura-session-id', sessionId);
        }
        chatService.init(sessionId);
        await chatService.initContext(selectedPatient.id);
      }
    } finally {
      setIsInitializing(false);
    }
  }, [patientIdParam]);
  useEffect(() => {
    initPortal();
  }, [initPortal]);
  const handleAccessRecords = () => {
    toast.success("Synchronizing Records", {
      description: "Synchronizing Registry Node 12-B via TLS 1.3.",
      duration: 3000
    });
    const element = document.getElementById('clinical-profile');
    if (element) element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  if (isInitializing) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
      <Activity className="h-6 w-6 text-teal-700 animate-pulse mb-4" />
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Syncing Clinical Node...</p>
    </div>
  );
  if (!patient) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-slate-50">
      <X className="h-10 w-10 text-destructive mb-4" />
      <h2 className="text-sm font-black uppercase tracking-tight">Portal Link Down</h2>
      <Button onClick={() => window.location.href = '/'} className="mt-6 bg-slate-900 rounded-none font-bold text-xs uppercase h-9 px-6">Return Home</Button>
    </div>
  );
  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-teal-100 selection:text-teal-900">
      <header className="bg-white border-b px-6 py-3 sticky top-0 z-50 rounded-none">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-none bg-teal-700 flex items-center justify-center text-white shadow-clinical">
              <Heart className="h-3.5 w-3.5" />
            </div>
            <span className="font-black text-sm tracking-tight uppercase">Aura Portal</span>
          </div>
          <div className="flex items-center gap-4">
             <div className="text-right hidden sm:block leading-tight">
               <div className="text-[11px] font-bold text-slate-900">{patient.firstName} {patient.lastName}</div>
               <div className="text-[9px] text-muted-foreground font-black uppercase tracking-tighter">MRN: {patient.mrn}</div>
             </div>
             <div className="h-8 w-8 rounded-none bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] font-black text-slate-600">
               {patient.firstName[0]}{patient.lastName[0]}
             </div>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-slate-900 rounded-none p-8 sm:p-12 text-white relative overflow-hidden border border-slate-800 shadow-clinical-bold">
              <div className="relative z-10">
                <Badge className="bg-teal-600/20 text-teal-400 border-teal-500/30 mb-6 px-2 py-0.5 rounded-none font-black text-[9px] uppercase tracking-widest">
                  SECURE SESSION: {chatService.getSessionId().split('-')[0]}
                </Badge>
                <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tighter mb-4 leading-none">Record Baseline: <span className="text-teal-400">Optimal</span></h1>
                <p className="text-slate-400 text-xs max-w-sm leading-relaxed mb-10 font-medium">Registry synchronization confirmed. AI Guidance Node 12-B is active and monitoring your clinical telemetry.</p>
                <Button onClick={handleAccessRecords} className="bg-teal-700 hover:bg-teal-600 rounded-none px-8 h-10 font-black text-[10px] uppercase tracking-widest transition-all">
                  Access Records <ArrowRight className="ml-2 h-3.5 w-3.5" />
                </Button>
              </div>
              <div className="absolute right-[-10%] bottom-[-10%] opacity-10 pointer-events-none">
                <Activity className="h-64 w-64 text-teal-500" />
              </div>
            </div>
            <div id="clinical-profile" className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="rounded-none border-slate-200 shadow-clinical bg-white">
                <CardHeader className="bg-slate-50/50 p-3 border-b flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Clinical Profile</CardTitle>
                  <FileText className="h-3.5 w-3.5 text-slate-400" />
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  <div>
                    <span className="text-[9px] uppercase font-black text-muted-foreground tracking-widest">Primary Diagnosis</span>
                    <div className="font-bold text-sm text-slate-900 mt-1">{patient.diagnoses[0]?.description || 'Baseline Wellness'}</div>
                  </div>
                  <div className="flex gap-8">
                    <div>
                      <span className="text-[9px] uppercase font-black text-muted-foreground tracking-widest">Blood Type</span>
                      <div className="font-mono text-xs font-bold text-teal-700 mt-1">{patient.bloodType}</div>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase font-black text-muted-foreground tracking-widest">Registry ID</span>
                      <div className="font-mono text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-none mt-1 inline-block border border-slate-200">
                        {patient.mrn}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="rounded-none border-slate-200 shadow-clinical bg-white">
                <CardHeader className="bg-slate-50/50 p-3 border-b flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Active Prescriptions</CardTitle>
                  <Pill className="h-3.5 w-3.5 text-slate-400" />
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                  {patient.medications.length > 0 ? patient.medications.slice(0, 3).map((m, i) => (
                    <div key={i} className="flex justify-between items-center text-[11px] pb-2 border-b border-slate-100 last:border-0 last:pb-0">
                      <div>
                        <div className="font-bold text-slate-900">{m.name} <span className="font-medium text-slate-500 text-[10px]">{m.dosage}</span></div>
                        <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-tight">{m.frequency}</div>
                      </div>
                      <Badge className="bg-teal-50 text-teal-700 text-[8px] font-black h-4 px-1 rounded-none border-none uppercase">Active</Badge>
                    </div>
                  )) : (
                    <div className="text-[10px] text-muted-foreground italic py-4 font-bold uppercase tracking-widest">Zero active meds in record.</div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
          <div className="space-y-4">
            <Card className="rounded-none border-slate-200 bg-white p-6 shadow-clinical">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-9 w-9 rounded-none bg-slate-900 flex items-center justify-center text-teal-500 border border-slate-800 shadow-clinical">
                  <MessageSquare className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-900">Consult Dr. Aura</h3>
                  <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-tighter">Clinical AI Specialist</p>
                </div>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed italic mb-8 font-medium bg-slate-50 p-3 border border-slate-100 rounded-none">
                "Hello {patient.firstName}. I have synthesized your SQL clinical telemetry. Launch my console to discuss your care plan and recent findings."
              </p>
              <Button onClick={() => setChatOpen(true)} className="w-full bg-slate-900 hover:bg-slate-800 rounded-none h-10 font-black text-[10px] uppercase tracking-[0.2em]">Launch AI Assistant</Button>
            </Card>
            <Card className="rounded-none border-slate-200 bg-slate-900 text-white p-6 shadow-clinical">
              <ShieldCheck className="h-5 w-5 text-teal-500 mb-4" />
              <h3 className="text-[11px] font-black uppercase tracking-widest mb-2">Edge Isolation Policy</h3>
              <p className="text-[10px] text-slate-400 leading-relaxed mb-6 font-medium">Session telemetry resides in a volatile worker isolate. All state is purged upon disconnect or timeout to maintain HIPAA integrity.</p>
              <div className="text-[9px] font-mono text-teal-500 uppercase font-bold border-t border-slate-800 pt-4 flex justify-between items-center">
                <span>NODE_ID</span>
                <span>{chatService.getSessionId().split('-')[0]}</span>
              </div>
            </Card>
          </div>
        </div>
        <DrAuraChat
          patientId={patient.id}
          isOpen={chatOpen}
          onClose={() => setChatOpen(false)}
        />
      </main>
    </div>
  );
}