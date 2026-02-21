import React from 'react';
import { Outlet } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { ThemeToggle } from '@/components/ThemeToggle';
import { AlertCircle, ShieldCheck } from 'lucide-react';
export default function App() {
  return (
    <div className="min-h-screen bg-background font-sans selection:bg-teal-100 selection:text-teal-900 transition-colors duration-300">
      <ThemeToggle className="fixed top-[18px] right-[18px] z-[100]" />
      <main className="relative min-h-screen">
        <Outlet />
      </main>
      <Toaster
        position="bottom-right"
        closeButton
        richColors
        expand={false}
        toastOptions={{
          className: "rounded-lg border-none shadow-clinical font-sans text-xs",
        }}
      />
      <div className="fixed bottom-4 left-4 z-[100] group pointer-events-none sm:pointer-events-auto">
        <div className="bg-background/80 backdrop-blur-md border border-border px-4 py-2.5 rounded-xl flex items-center gap-3 shadow-clinical transition-all duration-300 hover:bg-background/95">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/40">
            <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-[0.1em] text-foreground leading-tight">
              AI Governance Node
            </span>
            <span className="text-[9px] font-bold text-muted-foreground leading-tight">
              Aura Health v1.3.0 • HIPAA Compliant
            </span>
          </div>
          <div className="ml-2 pl-3 border-l border-border flex items-center gap-2 opacity-80">
            <ShieldCheck className="h-3.5 w-3.5 text-teal-600" />
            <span className="text-[8px] font-black uppercase tracking-widest text-teal-700 dark:text-teal-400">Secure</span>
          </div>
        </div>
      </div>
    </div>
  );
}