import React from 'react';
import { Outlet } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { ThemeToggle } from '@/components/ThemeToggle';
import { AlertCircle, ShieldCheck } from 'lucide-react';
export default function App() {
  return (
    <div className="min-h-screen bg-background font-sans selection:bg-teal-100 selection:text-teal-900 transition-colors duration-300">
      {/* Global Theme Toggle - Fixed position to persist across all views */}
      <ThemeToggle className="fixed top-6 right-6 z-[100]" />
      <main className="relative min-h-screen">
        <Outlet />
      </main>
      <Toaster 
        position="top-right" 
        closeButton 
        richColors 
        expand={false}
        toastOptions={{
          className: "rounded-2xl border-none shadow-2xl",
        }}
      />
      {/* Persistent AI Transparency Footer - Global Requirement */}
      <div className="fixed bottom-4 left-4 z-[100] group pointer-events-none sm:pointer-events-auto">
        <div className="bg-background/90 backdrop-blur-md border border-border/50 px-3 py-2 rounded-2xl flex items-center gap-3 shadow-glass transition-all duration-300 hover:scale-[1.02] hover:bg-background">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30">
            <AlertCircle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-[0.1em] text-foreground leading-tight">
              AI Transparency Node
            </span>
            <span className="text-[9px] font-medium text-muted-foreground leading-tight">
              Aura v1.2.0 • Capacity Limits Apply
            </span>
          </div>
          <div className="ml-2 pl-3 border-l flex items-center gap-1.5 opacity-60">
            <ShieldCheck className="h-3 w-3 text-teal-600" />
            <span className="text-[8px] font-bold uppercase tracking-tighter">Secure Isolate</span>
          </div>
        </div>
      </div>
    </div>
  );
}