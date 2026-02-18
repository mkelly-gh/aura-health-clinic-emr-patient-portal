import React from 'react';
import { Link } from 'react-router-dom';
import { Activity, ShieldCheck, UserRound, ClipboardList } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { ThemeToggle } from '@/components/ThemeToggle';
export function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground relative flex flex-col items-center justify-center">
      <ThemeToggle />
      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-teal-600 to-sky-500" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <div className="mb-8 flex justify-center">
          <div className="p-4 rounded-full bg-teal-50 dark:bg-teal-900/20">
            <Activity className="h-12 w-12 text-teal-600" />
          </div>
        </div>
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4">
          Aura Health <span className="text-teal-600">EMR</span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-12">
          Precision medical records meeting intelligent patient engagement. The future of clinical workflows, powered by Aura.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <Card className="hover:border-teal-500/50 transition-colors group">
            <CardHeader>
              <ClipboardList className="h-10 w-10 text-teal-600 mb-2 group-hover:scale-110 transition-transform" />
              <CardTitle>Provider Access</CardTitle>
              <CardDescription>Clinical dashboard, patient charting, and medical evidence analysis.</CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/provider">
                <Button className="w-full bg-teal-700 hover:bg-teal-800">Login as Provider</Button>
              </Link>
            </CardContent>
          </Card>
          <Card className="hover:border-sky-500/50 transition-colors group">
            <CardHeader>
              <UserRound className="h-10 w-10 text-sky-600 mb-2 group-hover:scale-110 transition-transform" />
              <CardTitle>Patient Portal</CardTitle>
              <CardDescription>Secure health summaries, test results, and AI-powered consultations.</CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/portal">
                <Button variant="outline" className="w-full border-sky-600 text-sky-600 hover:bg-sky-50">Access My Health</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
        <div className="mt-16 flex items-center justify-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <ShieldCheck className="h-4 w-4" /> Secure HIPAA Compliant
          </div>
          <div className="w-1 h-1 rounded-full bg-muted-foreground" />
          <span>v1.0.0 Enterprise</span>
        </div>
      </div>
      <footer className="mt-auto py-6 border-t w-full text-center text-xs text-muted-foreground bg-muted/30">
        <p>Aura Health Clinic Management System. For demonstration purposes only.</p>
        <p className="mt-1">AI Request limits may apply across the platform.</p>
      </footer>
    </div>
  );
}