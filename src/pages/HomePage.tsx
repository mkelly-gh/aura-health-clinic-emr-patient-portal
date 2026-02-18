import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Activity, ShieldCheck, UserRound, ClipboardList, ArrowRight, Loader2, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { ThemeToggle } from '@/components/ThemeToggle';
import { motion } from 'framer-motion';
export function HomePage() {
  const [loadingRole, setLoadingRole] = useState<'provider' | 'patient' | null>(null);
  const navigate = useNavigate();
  const handleLogin = (role: 'provider' | 'patient') => {
    setLoadingRole(role);
    setTimeout(() => {
      navigate(role === 'provider' ? '/provider' : '/portal');
    }, 1200);
  };
  return (
    <div className="min-h-screen bg-background text-foreground relative flex flex-col items-center justify-center overflow-hidden">
      <ThemeToggle />
      {/* Decorative Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-teal-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-sky-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-teal-600 via-sky-500 to-teal-400" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-10 flex justify-center"
        >
          <div className="p-5 rounded-3xl bg-teal-50 dark:bg-teal-900/20 shadow-xl shadow-teal-500/10 border border-teal-100/50 dark:border-teal-500/20">
            <Activity className="h-16 w-16 text-teal-600" />
          </div>
        </motion.div>
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-5xl md:text-7xl font-black tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/70"
        >
          Aura Health <span className="text-teal-600">EMR</span>
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-xl text-muted-foreground max-w-2xl mx-auto mb-16 leading-relaxed"
        >
          The next generation of clinical precision. Seamlessly bridge the gap between complex medical data and intelligent patient engagement.
        </motion.p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Card className="hover:border-teal-500/50 transition-all group cursor-pointer shadow-soft hover:shadow-2xl hover:-translate-y-2 rounded-3xl overflow-hidden border-2 border-transparent bg-white/50 dark:bg-card/50 backdrop-blur-sm">
              <CardHeader className="p-8">
                <div className="h-14 w-14 rounded-2xl bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center text-teal-700 mb-6 group-hover:scale-110 transition-transform">
                  <ClipboardList className="h-8 w-8" />
                </div>
                <CardTitle className="text-2xl font-bold">Provider Access</CardTitle>
                <CardDescription className="text-base mt-2">Professional EMR dashboard with AI clinical assistance and detailed charting.</CardDescription>
              </CardHeader>
              <CardContent className="px-8 pb-8 pt-0">
                <Button 
                  disabled={loadingRole !== null}
                  onClick={() => handleLogin('provider')}
                  className="w-full bg-teal-700 hover:bg-teal-800 rounded-2xl h-14 font-bold text-lg shadow-lg shadow-teal-700/20"
                >
                  {loadingRole === 'provider' ? <Loader2 className="animate-spin mr-2" /> : 'Enter Clinical Portal'}
                  {loadingRole !== 'provider' && <ArrowRight className="ml-2 h-5 w-5" />}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Card className="hover:border-sky-500/50 transition-all group cursor-pointer shadow-soft hover:shadow-2xl hover:-translate-y-2 rounded-3xl overflow-hidden border-2 border-transparent bg-white/50 dark:bg-card/50 backdrop-blur-sm">
              <CardHeader className="p-8">
                <div className="h-14 w-14 rounded-2xl bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center text-sky-700 mb-6 group-hover:scale-110 transition-transform">
                  <UserRound className="h-8 w-8" />
                </div>
                <CardTitle className="text-2xl font-bold">Patient Portal</CardTitle>
                <CardDescription className="text-base mt-2">Secure access to test results, health summaries, and direct AI consultation.</CardDescription>
              </CardHeader>
              <CardContent className="px-8 pb-8 pt-0">
                <Button 
                  disabled={loadingRole !== null}
                  onClick={() => handleLogin('patient')}
                  variant="outline" 
                  className="w-full border-sky-600/30 text-sky-700 hover:bg-sky-50 dark:hover:bg-sky-900/20 rounded-2xl h-14 font-bold text-lg"
                >
                  {loadingRole === 'patient' ? <Loader2 className="animate-spin mr-2" /> : 'My Health Access'}
                  {loadingRole !== 'patient' && <ArrowRight className="ml-2 h-5 w-5" />}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.8 }}
          className="mt-20 flex flex-wrap items-center justify-center gap-10 text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/60"
        >
          <div className="flex items-center gap-2 group cursor-help hover:text-teal-600 transition-colors">
            <ShieldCheck className="h-4 w-4" /> HIPAA Certified
          </div>
          <div className="flex items-center gap-2 group cursor-help hover:text-sky-600 transition-colors">
            <Zap className="h-4 w-4" /> Edge Powered
          </div>
          <div className="flex items-center gap-2 group cursor-help hover:text-purple-600 transition-colors">
            <Activity className="h-4 w-4" /> Real-time Analytics
          </div>
        </motion.div>
      </div>
      <footer className="mt-auto py-10 border-t w-full text-center bg-muted/20 backdrop-blur-md relative z-10">
        <div className="max-w-7xl mx-auto px-4">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Enterprise Grade Medical Record System</p>
          <p className="text-xs text-muted-foreground/60 max-w-lg mx-auto leading-relaxed">
            © 2024 Aura Health Technologies. All rights reserved. For demonstration and educational purposes only. This system uses AI-driven diagnostics; always consult a licensed human professional.
          </p>
          <p className="mt-4 text-[10px] text-teal-600 font-bold opacity-60">
            PLATFORM STATUS: ALL SYSTEMS OPERATIONAL • AI CAPACITY: NORMAL
          </p>
        </div>
      </footer>
    </div>
  );
}