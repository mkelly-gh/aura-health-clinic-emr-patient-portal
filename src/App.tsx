import React from 'react';
import { Outlet } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { ThemeToggle } from '@/components/ThemeToggle';
export default function App() {
  return (
    <div className="min-h-screen bg-background font-sans selection:bg-teal-100 selection:text-teal-900 transition-colors duration-300">
      <ThemeToggle className="fixed top-[14px] right-[140px] z-[100]" />
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
    </div>
  );
}