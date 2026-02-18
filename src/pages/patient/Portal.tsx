import React, { useState, useEffect } from 'react';
import { Heart, Calendar, FileText, Pill, MessageSquare, ShieldCheck, ArrowRight, Activity } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Toaster } from '@/components/ui/sonner';
import { ThemeToggle } from '@/components/ThemeToggle';
import { DrAuraChat } from '@/components/patient/DrAuraChat';
import { chatService } from '@/lib/chat';
import type { Patient } from '../../../worker/types';
export function Portal() {
  const [patient, setPatient] = useState<Patient | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  useEffect(() => {
    // Demo patient (always first in registry for this view)
    fetch('/api/patients')
      .then(res => res.json())
      .then(res => {
        if (res.success && res.data.length > 0) {
          const p = res.data[0];
          setPatient(p);
          // Initialize AI context with this patient's data
          fetch(`/api/chat/${chatService.getSessionId()}/init-context`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ patientId: p.id })
          });
        }
      });
  }, []);
  return (
    <div className="min-h-screen bg-sky-50/50 dark:bg-background">
      <ThemeToggle />
      <header className="bg-white dark:bg-card border-b px-4 py-4 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-sky-600 flex items-center justify-center text-white shadow-lg shadow-sky-600/20">
              <Heart className="h-6 w-6 fill-current" />
            </div>
            <span className="font-bold text-lg tracking-tight text-sky-900 dark:text-sky-100">Aura Portal</span>
          </div>
          <div className="flex items-center gap-4">
             <div className="text-right hidden sm:block">
               <div className="text-sm font-bold text-foreground">Welcome, {patient?.firstName}</div>
               <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Patient Access</div>
             </div>
             <div className="h-10 w-10 rounded-full bg-sky-100 border-2 border-sky-500 flex items-center justify-center font-bold text-sky-700">
               {patient?.firstName[0]}{patient?.lastName[0]}
             </div>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-gradient-to-br from-sky-600 via-sky-700 to-teal-700 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                 <Activity className="h-32 w-32" />
              </div>
              <h1 className="text-4xl font-bold mb-3">Health Status: Optimal</h1>
              <p className="text-sky-100 text-lg max-w-md">Your clinical metrics are trending within recommended ranges. You have one follow-up scheduled for next week.</p>
              <Button className="mt-8 bg-white text-sky-700 hover:bg-sky-50 rounded-xl font-bold">
                View Appointment Details <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="rounded-2xl border-none shadow-md overflow-hidden">
                <CardHeader className="bg-muted/30 border-b pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Medical Summary</CardTitle>
                    <FileText className="h-5 w-5 text-sky-600" />
                  </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <div className="flex flex-col gap-1">
                     <span className="text-muted-foreground text-xs uppercase font-bold">Primary Diagnosis</span>
                     <span className="font-bold text-foreground">{patient?.diagnoses[0]?.description || 'General Health'}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                       <span className="text-muted-foreground text-xs uppercase font-bold">Blood Type</span>
                       <span className="font-bold text-foreground">{patient?.bloodType}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                       <span className="text-muted-foreground text-xs uppercase font-bold">MRN</span>
                       <span className="font-mono text-xs">{patient?.mrn}</span>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full mt-4 rounded-xl border-sky-600/30 text-sky-700">Access Full Records</Button>
                </CardContent>
              </Card>
              <Card className="rounded-2xl border-none shadow-md overflow-hidden">
                <CardHeader className="bg-muted/30 border-b pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Medications</CardTitle>
                    <Pill className="h-5 w-5 text-teal-600" />
                  </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-3">
                  {patient?.medications.map((m, i) => (
                    <div key={i} className="p-4 bg-muted/20 rounded-2xl flex justify-between items-center group hover:bg-muted/40 transition-colors">
                      <div>
                        <div className="font-bold text-sm text-foreground">{m.name} {m.dosage}</div>
                        <div className="text-xs text-muted-foreground">{m.frequency}</div>
                      </div>
                      <Badge className="bg-teal-600/10 text-teal-700 border-none">Active</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
          {/* Sidebar / Secondary Area */}
          <div className="space-y-6">
            <Card className="rounded-2xl shadow-md border-none bg-sky-900 text-white p-2">
              <CardContent className="pt-6 text-center">
                <div className="h-16 w-16 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-4">
                  <ShieldCheck className="h-8 w-8 text-sky-300" />
                </div>
                <h3 className="font-bold text-xl mb-2">HIPAA Protected</h3>
                <p className="text-sky-200 text-sm mb-6 px-4">Your medical data is encrypted with enterprise-grade security protocols.</p>
                <div className="py-3 bg-white/5 rounded-xl text-xs font-mono opacity-60">Session ID: {chatService.getSessionId().split('-')[0]}</div>
              </CardContent>
            </Card>
            <Card className="rounded-2xl border-none shadow-md">
              <CardHeader><CardTitle className="text-base">Upcoming Appointments</CardTitle></CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 p-4 border rounded-2xl">
                   <div className="h-10 w-10 rounded-xl bg-muted flex flex-col items-center justify-center text-[10px] font-bold">
                     <span className="text-sky-600">OCT</span>
                     <span>24</span>
                   </div>
                   <div>
                     <div className="text-sm font-bold">Clinical Follow-up</div>
                     <div className="text-xs text-muted-foreground">Dr. Martinez • 10:30 AM</div>
                   </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        {/* Floating Chat Button */}
        <div className="fixed bottom-8 right-8 z-[60]">
          <Button 
            size="lg" 
            onClick={() => setChatOpen(!chatOpen)}
            className={`rounded-full h-16 w-16 shadow-2xl transition-all duration-300 ${chatOpen ? 'bg-destructive hover:bg-destructive rotate-90' : 'bg-sky-600 hover:bg-sky-700'}`}
          >
            {chatOpen ? <X className="h-8 w-8 text-white" /> : <MessageSquare className="h-8 w-8 text-white" />}
          </Button>
          {!chatOpen && (
            <div className="absolute bottom-full right-0 mb-4 w-64 bg-white dark:bg-card border rounded-2xl p-4 shadow-2xl animate-in fade-in slide-in-from-bottom-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-6 w-6 rounded-full bg-teal-600 flex items-center justify-center text-[10px] text-white">A</div>
                <span className="font-bold text-sm">Dr. Aura</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Hi {patient?.firstName}! I'm Dr. Aura. I've analyzed your current records. Do you have questions about your medications?
              </p>
            </div>
          )}
        </div>
        {patient && (
          <DrAuraChat 
            patientId={patient.id} 
            isOpen={chatOpen} 
            onClose={() => setChatOpen(false)} 
          />
        )}
      </main>
      <footer className="mt-12 py-8 border-t bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 text-center space-y-2">
          <p className="text-xs text-muted-foreground">© 2024 Aura Health Clinic. Secure Patient Portal.</p>
          <p className="text-[10px] text-muted-foreground/60 italic">AI-driven insights are powered by Cloudflare Agents. Request limits across the platform may apply.</p>
        </div>
      </footer>
      <Toaster />
    </div>
  );
}