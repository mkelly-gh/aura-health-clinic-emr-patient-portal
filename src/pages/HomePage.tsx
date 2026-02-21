import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, ShieldCheck, UserRound, ClipboardList, ArrowRight, Loader2, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';
export function HomePage() {
  const [loadingRole, setLoadingRole] = useState<'provider' | 'patient' | null>(null);
  const navigate = useNavigate();
  const handleLogin = (role: 'provider' | 'patient') => {
    setLoadingRole(role);
    setTimeout(() => {
      navigate(role === 'provider' ? '/provider' : '/portal');
    }, 800);
  };
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-slate-900" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center relative z-10">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-8 flex justify-center">
          <div className="p-4 rounded-lg bg-slate-900 shadow-md">
            <Activity className="h-10 w-10 text-teal-500" />
          </div>
        </motion.div>
        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-4xl md:text-5xl font-black tracking-tighter mb-4 text-slate-900 uppercase">
          Aura Health <span className="text-teal-700">EMR</span>
        </motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="text-sm text-slate-500 max-w-lg mx-auto mb-12 font-bold uppercase tracking-[0.2em]">
          Clinical Intelligence Node • High-Density Registry
        </motion.p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          <Card className="rounded-lg border-slate-200 shadow-none hover:border-slate-400 transition-colors text-left bg-white">
            <CardHeader className="p-6">
              <div className="h-10 w-10 rounded bg-slate-100 flex items-center justify-center text-slate-700 mb-4 border">
                <ClipboardList className="h-5 w-5" />
              </div>
              <CardTitle className="text-lg font-bold">Clinical Provider</CardTitle>
              <CardDescription className="text-xs font-medium">Access patient registry, clinical trends, and AI vision analysis.</CardDescription>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <Button
                disabled={loadingRole !== null}
                onClick={() => handleLogin('provider')}
                className="w-full bg-slate-900 hover:bg-slate-800 rounded-md h-11 font-bold text-xs uppercase tracking-wider"
              >
                {loadingRole === 'provider' ? <Loader2 className="animate-spin mr-2" /> : 'Enter Clinical Portal'}
                {loadingRole !== 'provider' && <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>
            </CardContent>
          </Card>
          <Card className="rounded-lg border-slate-200 shadow-none hover:border-slate-400 transition-colors text-left bg-white">
            <CardHeader className="p-6">
              <div className="h-10 w-10 rounded bg-slate-100 flex items-center justify-center text-slate-700 mb-4 border">
                <UserRound className="h-5 w-5" />
              </div>
              <CardTitle className="text-lg font-bold">Patient Access</CardTitle>
              <CardDescription className="text-xs font-medium">Securely consult with Dr. Aura and review wellness summaries.</CardDescription>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <Button
                disabled={loadingRole !== null}
                onClick={() => handleLogin('patient')}
                variant="outline"
                className="w-full border-slate-200 rounded-md h-11 font-bold text-xs uppercase tracking-wider"
              >
                {loadingRole === 'patient' ? <Loader2 className="animate-spin mr-2" /> : 'Enter Health Portal'}
                {loadingRole !== 'patient' && <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>
            </CardContent>
          </Card>
        </div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="mt-16 flex items-center justify-center gap-8 text-[9px] font-bold uppercase tracking-[0.25em] text-slate-400">
          <div className="flex items-center gap-2"><ShieldCheck className="h-3.5 w-3.5" /> HIPAA COMPLIANT</div>
          <div className="flex items-center gap-2"><Zap className="h-3.5 w-3.5" /> D1 SQL PERSISTENT</div>
        </motion.div>
      </div>
      <footer className="mt-auto py-8 border-t w-full text-center bg-white">
        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Aura Health Systems © 2024</p>
        <p className="text-[8px] text-slate-400 max-w-xs mx-auto px-4 uppercase font-bold tracking-tighter">Demonstration Only • AI Generated Clinical Insights</p>
      </footer>
    </div>
  );
}