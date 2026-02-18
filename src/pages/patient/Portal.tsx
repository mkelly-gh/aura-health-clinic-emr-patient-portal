import React, { useState, useEffect } from 'react';
import { Heart, Calendar, FileText, Pill, MessageSquare } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Toaster } from '@/components/ui/sonner';
import { ThemeToggle } from '@/components/ThemeToggle';
import type { Patient } from '@/lib/mockData';
export function Portal() {
  const [patient, setPatient] = useState<Patient | null>(null);
  useEffect(() => {
    // Default to the first generated patient for portal view demo
    fetch('/api/patients')
      .then(res => res.json())
      .then(res => {
        if (res.success && res.data.length > 0) setPatient(res.data[0]);
      });
  }, []);
  return (
    <div className="min-h-screen bg-sky-50/30 dark:bg-background">
      <ThemeToggle />
      <header className="bg-white dark:bg-card border-b px-4 py-4 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded bg-sky-600 flex items-center justify-center text-white">
              <Heart className="h-5 w-5 fill-current" />
            </div>
            <span className="font-bold text-sky-900 dark:text-sky-100">Aura Health Portal</span>
          </div>
          <div className="flex items-center gap-3">
             <span className="text-sm font-medium hidden sm:inline-block">Welcome, {patient?.firstName}</span>
             <div className="h-8 w-8 rounded-full bg-sky-200 border" />
          </div>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        <div className="bg-gradient-to-r from-sky-600 to-teal-600 rounded-3xl p-8 text-white shadow-lg">
          <h1 className="text-3xl font-bold mb-2">Hello, {patient?.firstName}!</h1>
          <p className="opacity-90">Your health journey is looking stable. You have 1 upcoming appointment this month.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg">Health Summary</CardTitle>
              <FileText className="h-5 w-5 text-sky-600" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between py-2 border-b">
                   <span className="text-muted-foreground text-sm">Main Diagnosis</span>
                   <span className="font-medium">{patient?.diagnoses[0]?.description || 'None'}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                   <span className="text-muted-foreground text-sm">Blood Type</span>
                   <span className="font-medium">{patient?.bloodType}</span>
                </div>
                <Button variant="link" className="p-0 h-auto text-sky-600">View Full Record</Button>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg">Medications</CardTitle>
              <Pill className="h-5 w-5 text-teal-600" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {patient?.medications.map((m, i) => (
                  <div key={i} className="p-3 bg-muted/40 rounded-xl flex justify-between items-center">
                    <div>
                      <div className="font-bold text-sm">{m.name}</div>
                      <div className="text-xs text-muted-foreground">{m.frequency}</div>
                    </div>
                    <Badge variant="outline" className="border-teal-500 text-teal-600">Active</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="fixed bottom-6 right-6 z-50">
          <Button size="lg" className="rounded-full h-14 w-14 shadow-2xl bg-sky-600 hover:bg-sky-700">
            <MessageSquare className="h-6 w-6" />
          </Button>
          <div className="absolute bottom-full right-0 mb-4 w-72 bg-white dark:bg-card border rounded-2xl p-4 shadow-2xl animate-in slide-in-from-bottom-2">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-6 w-6 rounded-full bg-teal-600 flex items-center justify-center text-[10px] text-white">A</div>
              <span className="font-bold text-sm">Dr. Aura</span>
            </div>
            <p className="text-xs text-muted-foreground">Hi {patient?.firstName}! How can I help you today? In Phase 3, we can discuss your specific record here.</p>
          </div>
        </div>
      </main>
      <Toaster />
    </div>
  );
}