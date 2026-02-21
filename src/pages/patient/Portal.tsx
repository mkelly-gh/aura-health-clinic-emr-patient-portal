import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from "framer-motion";
import { Heart, FileText, Pill, MessageSquare, ShieldCheck, ArrowRight, Activity, X } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DrAuraChat } from '@/components/patient/DrAuraChat';
import { chatService } from '@/lib/chat';
import { cn } from '@/lib/utils';
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
        const sessionId = localStorage.getItem('aura-session-id') || crypto.randomUUID();
        localStorage.setItem('aura-session-id', sessionId);
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
  if (isInitializing) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
      <Activity className="h-8 w-8 text-teal-700 animate-pulse mb-4" />
      <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Accessing Portal Registry...</p>
    </div>
  );
  if (!patient) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
      <X className="h-12 w-12 text-destructive mb-4" />
      <h2 className="text-lg font-bold">Portal Node Unreachable</h2>
      <Button onClick={() => window.location.href = '/'} className="mt-6 bg-slate-900 rounded-md">Return Home</Button>
    </div>
  );
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b px-6 py-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded bg-teal-700 flex items-center justify-center text-white shadow-sm">
              <Heart className="h-4 w-4" />
            </div>
            <span className="font-bold text-lg tracking-tight uppercase">Aura Portal</span>
          </div>
          <div className="flex items-center gap-4">
             <div className="text-right hidden sm:block">
               <div className="text-xs font-bold">{patient.firstName} {patient.lastName}</div>
               <div className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">MRN: {patient.mrn}</div>
             </div>
             <div className="h-8 w-8 rounded-full bg-slate-100 border flex items-center justify-center text-[10px] font-bold text-slate-600">
               {patient.firstName[0]}{patient.lastName[0]}
             </div>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-900 rounded-lg p-8 sm:p-10 text-white relative overflow-hidden border">
              <div className="relative z-10">
                <Badge className="bg-teal-600/20 text-teal-400 border-teal-500/30 mb-4 px-3 py-0 rounded-sm font-bold text-[9px] uppercase">Isolate Health Session</Badge>
                <h1 className="text-3xl sm:text-4xl font-bold mb-4">Patient Baseline: Optimal</h1>
                <p className="text-slate-400 text-sm max-w-sm leading-relaxed mb-8">Clinical registry synchronized. Aura AI Node is standing by for medical context consultation.</p>
                <Button className="bg-teal-600 hover:bg-teal-700 rounded-md px-6 h-11 font-bold text-sm">Access Medical Records <ArrowRight className="ml-2 h-4 w-4" /></Button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="rounded-lg border-slate-200 shadow-none">
                <CardHeader className="bg-slate-50 p-4 border-b flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-xs font-bold uppercase tracking-wider">Clinical Profile</CardTitle>
                  <FileText className="h-4 w-4 text-slate-400" />
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  <div>
                    <span className="text-[9px] uppercase font-bold text-muted-foreground">Primary Condition</span>
                    <div className="font-bold text-base mt-0.5">{patient.diagnoses[0]?.description || 'Baseline'}</div>
                  </div>
                  <div className="flex gap-8">
                    <div>
                      <span className="text-[9px] uppercase font-bold text-muted-foreground">Blood Type</span>
                      <div className="font-bold text-sm mt-0.5">{patient.bloodType}</div>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase font-bold text-muted-foreground">System MRN</span>
                      <div className="font-mono text-[10px] bg-slate-100 px-2 py-0.5 rounded mt-0.5 inline-block">{patient.mrn}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="rounded-lg border-slate-200 shadow-none">
                <CardHeader className="bg-slate-50 p-4 border-b flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-xs font-bold uppercase tracking-wider">Active Medications</CardTitle>
                  <Pill className="h-4 w-4 text-slate-400" />
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                  {patient.medications.slice(0, 3).map((m, i) => (
                    <div key={i} className="flex justify-between items-center text-xs pb-2 border-b last:border-0 last:pb-0">
                      <div>
                        <div className="font-bold">{m.name} <span className="font-medium text-slate-500">{m.dosage}</span></div>
                        <div className="text-[9px] font-bold text-muted-foreground uppercase">{m.frequency}</div>
                      </div>
                      <Badge className="bg-teal-100 text-teal-700 text-[8px] font-bold h-4 px-1 rounded-sm border-none">ACTIVE</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
          <div className="space-y-6">
            <Card className="rounded-lg border-slate-200 bg-white p-6 shadow-none">
              <div className="flex items-center gap-4 mb-6">
                <div className="h-10 w-10 rounded bg-slate-900 flex items-center justify-center text-teal-500 border border-slate-800">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">Consult Aura</h3>
                  <p className="text-[11px] text-muted-foreground font-medium">Context-Aware AI Assistant</p>
                </div>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed italic mb-6">"Hello {patient.firstName}. I have synthesized your clinical telemetry. Select a query path below to begin."</p>
              <Button onClick={() => setChatOpen(true)} className="w-full bg-slate-900 hover:bg-slate-800 rounded-md h-10 font-bold text-xs uppercase tracking-wider">Launch Assistant</Button>
            </Card>
            <Card className="rounded-lg border-slate-200 bg-slate-900 text-white p-6 shadow-none">
              <ShieldCheck className="h-6 w-6 text-teal-500 mb-4" />
              <h3 className="text-sm font-bold mb-2">Edge Isolation</h3>
              <p className="text-[11px] text-slate-400 leading-relaxed mb-4">Your session data resides in a volatile worker isolate. All state is cleared upon logout.</p>
              <div className="text-[9px] font-mono text-teal-500 uppercase font-bold border-t border-slate-800 pt-4">NODE: {chatService.getSessionId().split('-')[0]}</div>
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