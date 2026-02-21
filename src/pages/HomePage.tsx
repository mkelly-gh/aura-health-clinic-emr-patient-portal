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
    }, 600);
  };
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center relative z-10 w-full">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6 flex justify-center">
          <div className="p-3 bg-slate-900 border border-slate-800 shadow-clinical-bold">
            <Activity className="h-8 w-8 text-teal-500" />
          </div>
        </motion.div>
        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-3xl md:text-4xl font-black tracking-tighter mb-2 text-slate-900 uppercase">
          Aura Health <span className="text-teal-700">EMR</span>
        </motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="text-[10px] text-slate-500 max-w-lg mx-auto mb-10 font-black uppercase tracking-[0.4em]">
          Clinical Intelligence • Production Registry
        </motion.p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
          <Card className="rounded-none border-slate-200 shadow-clinical hover:border-teal-600/50 transition-colors text-left bg-white">
            <CardHeader className="p-6">
              <div className="h-10 w-10 bg-slate-100 flex items-center justify-center text-slate-700 mb-4 border border-slate-200">
                <ClipboardList className="h-5 w-5" />
              </div>
              <CardTitle className="text-base font-black uppercase tracking-tight">Clinical Provider</CardTitle>
              <CardDescription className="text-[11px] font-bold uppercase tracking-tight text-slate-500">Secure EHR Access • Patient Registry</CardDescription>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <Button
                disabled={loadingRole !== null}
                onClick={() => handleLogin('provider')}
                className="w-full bg-slate-900 hover:bg-slate-800 rounded-none h-11 font-black text-[10px] uppercase tracking-[0.2em]"
              >
                {loadingRole === 'provider' ? <Loader2 className="animate-spin mr-2" /> : 'Enter Clinical Portal'}
                {loadingRole !== 'provider' && <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>
            </CardContent>
          </Card>
          <Card className="rounded-none border-slate-200 shadow-clinical hover:border-teal-600/50 transition-colors text-left bg-white">
            <CardHeader className="p-6">
              <div className="h-10 w-10 bg-slate-100 flex items-center justify-center text-slate-700 mb-4 border border-slate-200">
                <UserRound className="h-5 w-5" />
              </div>
              <CardTitle className="text-base font-black uppercase tracking-tight">Patient Access</CardTitle>
              <CardDescription className="text-[11px] font-bold uppercase tracking-tight text-slate-500">Dr. Aura Assistant • Health Summary</CardDescription>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <Button
                disabled={loadingRole !== null}
                onClick={() => handleLogin('patient')}
                variant="outline"
                className="w-full border-slate-200 rounded-none h-11 font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-50"
              >
                {loadingRole === 'patient' ? <Loader2 className="animate-spin mr-2" /> : 'Enter Health Portal'}
                {loadingRole !== 'patient' && <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>
            </CardContent>
          </Card>
        </div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="mt-12 flex items-center justify-center gap-6 text-[9px] font-black uppercase tracking-[0.3em] text-slate-400">
          <div className="flex items-center gap-2"><ShieldCheck className="h-3.5 w-3.5" /> HIPAA COMPLIANT</div>
          <div className="flex items-center gap-2 border-l border-slate-200 pl-6"><Zap className="h-3.5 w-3.5" /> SQL D1 CLOUD</div>
        </motion.div>
      </div>
      <footer className="mt-auto py-6 border-t w-full text-center bg-white">
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] mb-1">Aura Health Systems • Production v2.0</p>
        <p className="text-[8px] text-slate-400 max-w-xs mx-auto px-4 uppercase font-bold tracking-tighter">AI-Generated Synthesis • Not For Critical Clinical Diagnosis</p>
      </footer>
    </div>
  );
}