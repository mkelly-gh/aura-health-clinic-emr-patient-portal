import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from "framer-motion";
import { Heart, FileText, Pill, MessageSquare, ShieldCheck, ArrowRight, Activity, X, RefreshCw } from 'lucide-react';
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
        // Immediate sync of clinical context for AI
        setIsContextSyncing(true);
        const sessionId = localStorage.getItem('aura-session-id') || crypto.randomUUID();
        localStorage.setItem('aura-session-id', sessionId);
        chatService.init(sessionId);
        try {
          await chatService.initContext(selectedPatient.id);
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
        <div className="p-10 bg-white dark:bg-card rounded-[2.5rem] shadow-xl text-center max-w-md border border-destructive/20">
          <X className="h-16 w-16 text-destructive mx-auto mb-6" />
          <h2 className="text-2xl font-bold mb-4">Registry Node Missing</h2>
          <p className="text-muted-foreground mb-8">The requested medical record could not be retrieved from the active isolate storage.</p>
          <Button onClick={() => window.location.href = '/'} className="bg-sky-600 hover:bg-sky-700 w-full rounded-2xl h-12 font-bold shadow-lg shadow-sky-600/20">Return to Entry</Button>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-sky-50/50 dark:bg-background font-sans transition-colors duration-300">
      <header className="bg-white/80 dark:bg-card/80 backdrop-blur-md border-b px-6 py-4 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-sky-600 flex items-center justify-center text-white shadow-lg shadow-sky-600/20">
              <Heart className="h-5 w-5 fill-current" />
            </div>
            <span className="font-black text-xl tracking-tight text-sky-900 dark:text-sky-100">AURA PORTAL</span>
          </div>
          <div className="flex items-center gap-4">
             <div className="text-right hidden sm:block">
               <div className="text-sm font-bold text-foreground">Welcome, {patient.firstName}</div>
               <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">MRN: {patient.mrn}</div>
             </div>
             <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-teal-400 border-2 border-white dark:border-white/10 shadow-md flex items-center justify-center font-bold text-white ring-4 ring-sky-100 dark:ring-sky-900/50">
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
              className="bg-gradient-to-br from-sky-600 via-sky-700 to-teal-700 rounded-[2.5rem] p-8 sm:p-12 text-white shadow-xl relative overflow-hidden group border border-white/10"
            >
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform hidden sm:block pointer-events-none">
                 <Activity className="h-56 w-56" />
              </div>
              <div className="relative z-10">
                <Badge className="bg-white/20 hover:bg-white/30 text-white border-none mb-6 px-4 py-1 font-black text-[10px] uppercase tracking-widest">
                  Secure Health Environment
                </Badge>
                <h1 className="text-4xl sm:text-6xl font-black mb-6 tracking-tight">Status: Optimal</h1>
                <p className="text-sky-100 text-lg max-w-md leading-relaxed font-medium">
                  Your clinical records are synchronized across the Aura Health Network. Dr. Aura is standing by for consultation.
                </p>
                <Button className="mt-10 bg-white text-sky-700 hover:bg-sky-50 rounded-2xl px-8 py-7 font-bold text-lg shadow-xl shadow-black/10 active:scale-95 transition-all">
                  Access Health Records <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </motion.div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="rounded-[2rem] border-none shadow-soft hover:shadow-lg transition-all overflow-hidden bg-white dark:bg-card">
                <CardHeader className="bg-sky-50/50 dark:bg-sky-900/10 border-b pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-bold">Medical Profile</CardTitle>
                    <div className="h-8 w-8 rounded-xl bg-sky-100 dark:bg-sky-900 flex items-center justify-center">
                      <FileText className="h-4 w-4 text-sky-600" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  <div className="space-y-1">
                     <span className="text-muted-foreground text-[10px] uppercase font-black tracking-widest opacity-60">Primary Condition</span>
                     <div className="font-bold text-xl text-foreground">{patient.diagnoses[0]?.description || 'Clear Health Baseline'}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1">
                       <span className="text-muted-foreground text-[10px] uppercase font-black tracking-widest opacity-60">Blood Type</span>
                       <div className="font-bold text-foreground text-lg">{patient.bloodType}</div>
                    </div>
                    <div className="space-y-1">
                       <span className="text-muted-foreground text-[10px] uppercase font-black tracking-widest opacity-60">System MRN</span>
                       <div className="font-mono text-xs bg-muted/50 px-2 py-1 rounded-lg inline-block font-bold">{patient.mrn}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="rounded-[2rem] border-none shadow-soft hover:shadow-lg transition-all overflow-hidden bg-white dark:bg-card">
                <CardHeader className="bg-teal-50/50 dark:bg-teal-900/10 border-b pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-bold">Prescriptions</CardTitle>
                    <div className="h-8 w-8 rounded-xl bg-teal-100 dark:bg-teal-900 flex items-center justify-center">
                      <Pill className="h-4 w-4 text-teal-600" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  {patient.medications.slice(0, 3).map((m, i) => (
                    <div key={i} className="p-4 border border-border/40 rounded-[1.25rem] flex justify-between items-center group hover:bg-teal-50/30 dark:hover:bg-teal-900/10 transition-colors">
                      <div>
                        <div className="font-bold text-foreground text-sm">{m.name} <span className="text-xs font-normal opacity-60">{m.dosage}</span></div>
                        <div className="text-[10px] text-muted-foreground font-black uppercase tracking-tighter mt-0.5">{m.frequency}</div>
                      </div>
                      <Badge className="bg-teal-600/10 text-teal-700 dark:text-teal-400 border-none px-2 py-0.5 h-5 text-[9px] font-black">ACTIVE</Badge>
                    </div>
                  ))}
                  {patient.medications.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground italic text-sm">No active prescriptions detected.</div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
          <div className="space-y-6">
            <Card className="rounded-[2.5rem] shadow-xl border-none bg-sky-900 text-white p-2 overflow-hidden relative group">
              <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform pointer-events-none">
                <ShieldCheck className="h-32 w-32" />
              </div>
              <CardContent className="pt-10 text-center relative z-10">
                <div className="h-20 w-20 rounded-[2rem] bg-white/10 flex items-center justify-center mx-auto mb-6 backdrop-blur-sm border border-white/20 shadow-inner">
                  <ShieldCheck className="h-10 w-10 text-sky-300" />
                </div>
                <h3 className="font-black text-2xl mb-2">Edge Isolation</h3>
                <p className="text-sky-100/70 text-sm mb-8 px-6 leading-relaxed font-medium">
                  Your data resides in a volatile worker isolate. Session state is cleared upon termination.
                </p>
                <div className="py-3 px-4 bg-black/20 rounded-2xl text-[9px] font-mono tracking-[0.2em] text-sky-200 uppercase font-black">
                  ISOLATE-GATEWAY-{chatService.getSessionId().split('-')[0].toUpperCase()}
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-[2.5rem] border-none shadow-soft bg-white dark:bg-card overflow-hidden">
              <CardHeader className="px-8 pt-8"><CardTitle className="text-lg font-bold">Future Consults</CardTitle></CardHeader>
              <CardContent className="px-8 pb-8 space-y-4">
                <div className="flex items-center gap-4 p-5 border border-border/50 rounded-[1.5rem] hover:bg-muted/30 transition-all cursor-pointer group active:scale-[0.98]">
                   <div className="h-14 w-14 rounded-2xl bg-sky-50 dark:bg-sky-900/20 flex flex-col items-center justify-center text-[10px] font-black group-hover:bg-sky-600 group-hover:text-white transition-all duration-300">
                     <span className="text-sky-600 group-hover:text-white/80 uppercase mb-0.5 tracking-tighter">OCT</span>
                     <span className="text-xl leading-none">24</span>
                   </div>
                   <div className="flex-1">
                     <div className="text-sm font-bold text-foreground">Clinical Follow-up</div>
                     <div className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mt-1">Virtual Care ��� 10:30 AM</div>
                   </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        <div className="fixed bottom-10 right-10 z-[60] flex flex-col items-end gap-4">
          <AnimatePresence>
            {!chatOpen && (
              <motion.div
                initial={{ opacity: 0, y: 15, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 15, scale: 0.9 }}
                className="w-80 bg-white/90 dark:bg-card/90 backdrop-blur-xl border border-white/40 dark:border-white/10 shadow-glass rounded-[2rem] p-6 mb-2 ring-1 ring-black/5"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-teal-500 to-sky-500 flex items-center justify-center text-[10px] text-white shadow-lg font-black">A</div>
                  <div className="flex-1">
                    <span className="font-bold text-sm block">Dr. Aura</span>
                    {isContextSyncing ? (
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <RefreshCw className="h-2.5 w-2.5 animate-spin text-sky-500" />
                        <span className="text-[9px] font-black uppercase text-sky-500">Syncing Chart</span>
                      </div>
                    ) : (
                      <span className="text-[9px] font-black uppercase text-teal-600">Online & Aware</span>
                    )}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed font-medium italic">
                  "Hello {patient.firstName}. I've synthesized your clinical profile. Do you have questions about your medications or latest labs?"
                </p>
              </motion.div>
            )}
          </AnimatePresence>
          <Button
            size="lg"
            onClick={() => setChatOpen(!chatOpen)}
            className={cn(
              "rounded-full h-20 w-20 shadow-2xl transition-all duration-500 active:scale-90 border-4 border-white dark:border-white/10",
              chatOpen
                ? 'bg-destructive hover:bg-destructive/90 shadow-destructive/20 rotate-90'
                : 'bg-sky-600 hover:bg-sky-700 shadow-sky-600/40'
            )}
          >
            {chatOpen ? <X className="h-8 w-8 text-white" /> : <MessageSquare className="h-10 w-10 text-white" />}
          </Button>
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