import React from 'react';
import { Outlet } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { ThemeToggle } from '@/components/ThemeToggle';
export default function App() {
  return (
    <div className="min-h-screen bg-background font-sans selection:bg-teal-100 selection:text-teal-900">
      <ThemeToggle />
      <main className="relative">
        <Outlet />
      </main>
      <Toaster position="top-right" closeButton richColors expand={false} />
      {/* Global AI Usage Disclaimer - Mandatory for project requirements */}
      <div className="fixed bottom-2 left-2 z-[100] pointer-events-none opacity-40 hover:opacity-100 transition-opacity">
        <div className="bg-background/80 backdrop-blur-sm border px-2 py-1 rounded text-[8px] font-bold uppercase tracking-tighter text-muted-foreground shadow-sm">
          AI Request Limits Apply • Aura Health Clinic Demo
        </div>
      </div>
    </div>
  );
}