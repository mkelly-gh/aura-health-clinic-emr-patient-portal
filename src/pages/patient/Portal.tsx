import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Calendar, FileText, Pill, MessageSquare, ShieldCheck, ArrowRight, Activity, X, RefreshCw } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Toaster } from '@/components/ui/sonner';
import { ThemeToggle } from '@/components/ThemeToggle';
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
  const [isContextSyncing, setIsContextSyncing] = useState(false);
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
        // Synchronize AI context with the identified patient
        setIsContextSyncing(true);
        try {
          const sessionId = chatService.getSessionId();
          await fetch(`/api/chat/${sessionId}/init-context`, {
            method: 'POST',
            credentials: 'omit',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ patientId: selectedPatient.id })
          });
        } catch (ctxErr) {
          console.error("AI Context Sync Failure", ctxErr);
        } finally {
          setIsContextSyncing(false);
        }
      }
    } catch (err) {
      console.error("Portal Initialization Error", err);
    } finally {
      setIsInitializing(false);
    }
  }, [patientIdParam]);
  useEffect(() => {
    initPortal();
  }, [initPortal]);
  if (isInitializing) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-sky-50/30 dark:bg-background">
        <Activity className="h-12 w-12 text-sky-600 animate-pulse mb-6" />
        <div className="space-y-2 text-center">
          <p className="text-xl font-bold text-sky-900 dark:text-sky-100 tracking-tight">Syncing Clinical Registry</p>
          <p className="text-sm text-muted-foreground font-medium animate-pulse">Establishing secure patient portal session...</p>
        </div>
      </div>
    );
  }
  if (!patient) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-sky-50/30 dark:bg-background">
        <div className="p-10 bg-white dark:bg-card rounded-3xl shadow-xl text-center max-w-md border border-destructive/20">
          <X className="h-16 w-16 text-destructive mx-auto mb-6" />
          <h2 className="text-2xl font-bold mb-4">Registry Record Absent</h2>
          <p className="text-muted-foreground mb-8">The requested patient record could not be located in the current volatile isolate.</p>
          <Button onClick={() => window.location.href = '/'} className="bg-sky-600 hover:bg-sky-700 w-full rounded-2xl h-12 font-bold">Return to Main Entry</Button>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-sky-50/50 dark:bg-background font-sans">
      <ThemeToggle />
      <header className="bg-white/80 dark:bg-card/80 backdrop-blur-md border-b px-4 py-4 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-sky-600 flex items-center justify-center text-white shadow-lg shadow-sky-600/20">
              <Heart className="h-5 w-5 fill-current" />
            </div>
            <span className="font-bold text-xl tracking-tight text-sky-900 dark:text-sky-100">Aura Portal</span>
          </div>
          <div className="flex items-center gap-4">
             <div className="text-right hidden sm:block">
               <div className="text-sm font-bold text-foreground">Welcome, {patient.firstName}</div>
               <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">MRN: {patient.mrn}</div>
             </div>
             <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-sky-500 to-teal-400 border-2 border-white shadow-md flex items-center justify-center font-bold text-white ring-2 ring-sky-100 dark:ring-sky-900">
               {patient.firstName[0]}{patient.lastName[0]}
             </div>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-sky-600 via-sky-700 to-teal-700 rounded-3xl p-6 sm:p-10 text-white shadow-xl relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform hidden sm:block">
                 <Activity className="h-48 w-48" />
              </div>
              <div className="relative z-10">
                <Badge className="bg-white/20 hover:bg-white/30 text-white border-none mb-4">Secure Health Summary</Badge>
                <h1 className="text-3xl sm:text-5xl font-bold mb-4">Patient Status: Optimal</h1>
                <p className="text-sky-100 text-lg max-w-md leading-relaxed">Your latest clinical results have been synchronized. Dr. Aura is available for immediate consultation.</p>
                <Button className="mt-8 bg-white text-sky-700 hover:bg-sky-50 rounded-2xl px-6 py-6 font-bold shadow-lg shadow-black/10 active:scale-95 transition-all">
                  Access Health Records <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </motion.div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="rounded-3xl border-none shadow-soft hover:shadow-lg transition-all overflow-hidden bg-white dark:bg-card">
                <CardHeader className="bg-sky-50/50 dark:bg-sky-900/10 border-b pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-bold">Medical Overview</CardTitle>
                    <div className="h-8 w-8 rounded-full bg-sky-100 dark:bg-sky-900 flex items-center justify-center">
                      <FileText className="h-4 w-4 text-sky-600" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  <div className="space-y-1">
                     <span className="text-muted-foreground text-xs uppercase font-black tracking-widest">Active Diagnosis</span>
                     <div className="font-bold text-xl text-foreground">{patient.diagnoses[0]?.description || 'Normal Health Baseline'}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-6 pt-2">
                    <div className="space-y-1">
                       <span className="text-muted-foreground text-xs uppercase font-black tracking-widest">Blood Type</span>
                       <div className="font-bold text-foreground text-lg">{patient.bloodType}</div>
                    </div>
                    <div className="space-y-1">
                       <span className="text-muted-foreground text-xs uppercase font-black tracking-widest">Records ID</span>
                       <div className="font-mono text-sm bg-muted/50 px-2 py-1 rounded inline-block">{patient.mrn}</div>
                    </div>
                  </div>
                  <Button variant="ghost" className="w-full mt-4 rounded-2xl border border-sky-600/20 text-sky-700 hover:bg-sky-50 transition-all">Download Full Summary</Button>
                </CardContent>
              </Card>
              <Card className="rounded-3xl border-none shadow-soft hover:shadow-lg transition-all overflow-hidden bg-white dark:bg-card">
                <CardHeader className="bg-teal-50/50 dark:bg-teal-900/10 border-b pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-bold">Active Prescriptions</CardTitle>
                    <div className="h-8 w-8 rounded-full bg-teal-100 dark:bg-teal-900 flex items-center justify-center">
                      <Pill className="h-4 w-4 text-teal-600" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  {patient.medications.slice(0, 3).map((m, i) => (
                    <div key={i} className="p-4 border rounded-2xl flex justify-between items-center group hover:bg-teal-50/30 dark:hover:bg-teal-900/10 transition-colors">
                      <div>
                        <div className="font-bold text-foreground">{m.name} <span className="text-xs font-normal opacity-60">{m.dosage}</span></div>
                        <div className="text-xs text-muted-foreground font-medium">{m.frequency}</div>
                      </div>
                      <Badge className="bg-teal-600/10 text-teal-700 dark:text-teal-400 border-none px-2 py-0 h-5 text-[10px]">ACTIVE</Badge>
                    </div>
                  ))}
                  {patient.medications.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground italic text-sm">No active medications prescribed.</div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
          <div className="space-y-6">
            <Card className="rounded-3xl shadow-xl border-none bg-sky-900 text-white p-2 overflow-hidden relative group">
              <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform">
                <ShieldCheck className="h-32 w-32" />
              </div>
              <CardContent className="pt-8 text-center relative z-10">
                <div className="h-20 w-20 rounded-3xl bg-white/10 flex items-center justify-center mx-auto mb-6 backdrop-blur-sm border border-white/20 shadow-inner">
                  <ShieldCheck className="h-10 w-10 text-sky-300" />
                </div>
                <h3 className="font-bold text-2xl mb-2">Edge Encrypted</h3>
                <p className="text-sky-100/70 text-sm mb-8 px-4 leading-relaxed">Your data remains in volatile isolate memory, ensuring zero permanent trace of sensitive telemetry.</p>
                <div className="py-3 bg-black/20 rounded-2xl text-[10px] font-mono tracking-widest text-sky-200 uppercase">PORTAL-ISOLATE-{chatService.getSessionId().split('-')[0].toUpperCase()}</div>
              </CardContent>
            </Card>
            <Card className="rounded-3xl border-none shadow-soft bg-white dark:bg-card">
              <CardHeader><CardTitle className="text-lg font-bold">Upcoming Consultations</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4 p-4 border rounded-2xl hover:bg-muted/30 transition-all cursor-pointer group active:scale-[0.98]">
                   <div className="h-12 w-12 rounded-2xl bg-sky-50 dark:bg-sky-900/20 flex flex-col items-center justify-center text-[10px] font-black group-hover:bg-sky-600 group-hover:text-white transition-colors">
                     <span className="text-sky-600 group-hover:text-white uppercase">OCT</span>
                     <span className="text-lg">24</span>
                   </div>
                   <div>
                     <div className="text-sm font-bold text-foreground">Clinical Follow-up</div>
                     <div className="text-xs text-muted-foreground font-medium">Virtual Care • 10:30 AM</div>
                   </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        <div className="fixed bottom-8 right-8 z-[60] flex flex-col items-end gap-4">
          <AnimatePresence>
            {!chatOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="w-72 bg-white dark:bg-card border-none shadow-2xl rounded-3xl p-5 mb-2 relative ring-1 ring-black/5"
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-teal-500 to-sky-500 flex items-center justify-center text-[10px] text-white shadow-md">A</div>
                  <span className="font-bold text-sm">Dr. Aura</span>
                  {isContextSyncing && <RefreshCw className="h-3 w-3 animate-spin text-sky-500 ml-auto" />}
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Hello {patient.firstName}. I've synchronized with your {patient.mrn} clinical profile. Do you have any questions?
                </p>
              </motion.div>
            )}
          </AnimatePresence>
          <Button
            size="lg"
            onClick={() => setChatOpen(!chatOpen)}
            className={cn(
              "rounded-full h-16 w-16 shadow-2xl transition-all duration-300 active:scale-90",
              chatOpen
                ? 'bg-destructive hover:bg-destructive/90 shadow-destructive/20 rotate-90'
                : 'bg-sky-600 hover:bg-sky-700 shadow-sky-600/40'
            )}
          >
            {chatOpen ? <X className="h-8 w-8 text-white" /> : <MessageSquare className="h-8 w-8 text-white" />}
          </Button>
        </div>
        <DrAuraChat
          patientId={patient.id}
          isOpen={chatOpen}
          onClose={() => setChatOpen(false)}
        />
      </main>
      <footer className="mt-12 py-12 border-t bg-muted/10">
        <div className="max-w-7xl mx-auto px-4 text-center space-y-4">
          <div className="flex items-center justify-center gap-2 opacity-60">
            <ShieldCheck className="h-4 w-4 text-sky-600" />
            <span className="text-xs font-bold uppercase tracking-widest">HIPAA Compliant Isolate Gateway</span>
          </div>
          <p className="text-xs text-muted-foreground">© 2024 Aura Health Clinic. All rights reserved. Platform v1.2.0-PRODUCTION</p>
          <p className="text-[10px] text-muted-foreground/60 italic max-w-md mx-auto">
            IMPORTANT: Dr. Aura is an AI model. Request limits apply. Always verify medical advice with a human physician.
          </p>
        </div>
      </footer>
      <Toaster position="top-right" richColors />
    </div>
  );
}