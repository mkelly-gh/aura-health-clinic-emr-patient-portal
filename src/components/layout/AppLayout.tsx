import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroupLabel,
  SidebarFooter
} from "@/components/ui/sidebar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  Activity,
  Menu,
  FileBarChart,
  LogOut,
  Settings,
  Search,
  CheckCircle2,
  Stethoscope,
  Terminal
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useIsMobile } from "@/hooks/use-mobile";
type AppLayoutProps = {
  children: React.ReactNode;
  container?: boolean;
  className?: string;
};
export function AppLayout({ children, container = false, className }: AppLayoutProps): JSX.Element {
  const location = useLocation();
  const isMobile = useIsMobile();
  const [isSheetOpen, setIsSheetOpen] = React.useState(false);
  const NavContent = () => (
    <>
      <SidebarGroup>
        <SidebarGroupLabel className="px-4 text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 mb-2">Clinical System</SidebarGroupLabel>
        <SidebarMenu className="gap-0.5">
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={location.pathname === '/provider'} onClick={() => setIsSheetOpen(false)} className="rounded-none">
              <Link to="/provider" className="flex items-center gap-3 px-4 h-9 data-[active=true]:bg-teal-700 data-[active=true]:text-white transition-none">
                <LayoutDashboard className="h-4 w-4" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Dashboard</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="rounded-none opacity-60">
              <a href="#" className="flex items-center gap-3 px-4 h-9">
                <Users className="h-4 w-4" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Patients</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="rounded-none opacity-60">
              <a href="#" className="flex items-center gap-3 px-4 h-9">
                <Stethoscope className="h-4 w-4" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Protocols</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>
      <SidebarGroup>
        <SidebarGroupLabel className="px-4 text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 mb-2">Management</SidebarGroupLabel>
        <SidebarMenu className="gap-0.5">
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="rounded-none opacity-60">
              <a href="#" className="flex items-center gap-3 px-4 h-9">
                <Terminal className="h-4 w-4" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Audit Logs</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="rounded-none opacity-60">
              <a href="#" className="flex items-center gap-3 px-4 h-9">
                <Settings className="h-4 w-4" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Settings</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild onClick={() => setIsSheetOpen(false)} className="hover:text-destructive rounded-none">
              <Link to="/" className="flex items-center gap-3 px-4 h-9">
                <LogOut className="h-4 w-4" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-destructive">Sign Out</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>
    </>
  );
  return (
    <SidebarProvider defaultOpen={!isMobile}>
      {!isMobile && (
        <Sidebar collapsible="icon" className="border-r border-slate-800 bg-slate-900">
          <SidebarHeader className="h-16 flex items-center px-4 border-b border-slate-800 bg-slate-900">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 bg-teal-600 flex items-center justify-center border border-teal-500 shadow-sm rounded-none">
                <Activity className="h-4 w-4 text-white" />
              </div>
              <span className="font-black text-[11px] text-white tracking-[0.2em] uppercase sidebar-hide">Aura Record</span>
            </div>
          </SidebarHeader>
          <SidebarContent className="py-2 bg-slate-900">
            <NavContent />
          </SidebarContent>
          <SidebarFooter className="p-4 bg-slate-900 border-t border-slate-800 space-y-3">
             <div className="flex items-center gap-2 px-2 text-teal-500 sidebar-hide">
               <ShieldCheck className="h-3.5 w-3.5" />
               <span className="text-[9px] font-black uppercase tracking-widest">Aura-Secured</span>
             </div>
             <div className="px-2 pb-2 sidebar-hide">
               <Badge variant="outline" className="w-full justify-center text-[8px] font-black uppercase tracking-tighter h-5 border-slate-700 text-teal-400 bg-slate-800/50">
                 Vision: Operational
               </Badge>
             </div>
          </SidebarFooter>
        </Sidebar>
      )}
      <SidebarInset className={`bg-slate-50 ${className}`}>
        <header className="flex h-16 items-center gap-4 border-b border-slate-200 bg-white px-6 sticky top-0 z-40">
          {isMobile ? (
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-none border border-slate-200"><Menu className="h-4 w-4" /></Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0 flex flex-col bg-slate-900 border-none">
                <div className="p-6 border-b border-slate-800 flex items-center gap-3">
                  <Activity className="h-5 w-5 text-teal-500" />
                  <span className="font-black text-sm text-white uppercase tracking-widest">Aura Record</span>
                </div>
                <NavContent />
              </SheetContent>
            </Sheet>
          ) : <SidebarTrigger className="h-9 w-9 opacity-50 hover:opacity-100" />}
          <div className="flex-1 flex justify-center max-w-xl mx-auto">
            <div className="relative w-full group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-teal-600 transition-colors" />
              <Input
                placeholder="Universal Clinical Search..."
                className="pl-10 h-10 w-full bg-slate-50 border-slate-200 rounded-none text-[11px] font-bold uppercase tracking-wider focus-visible:ring-1 focus-visible:ring-teal-600 placeholder:text-slate-300"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 hidden md:flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded border border-slate-200 bg-white text-[8px] font-black text-slate-400">⌘</kbd>
                <kbd className="px-1.5 py-0.5 rounded border border-slate-200 bg-white text-[8px] font-black text-slate-400">K</kbd>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4 ml-auto">
            <div className="text-right hidden sm:block">
              <div className="flex items-center gap-1.5 justify-end">
                <span className="text-[10px] font-black uppercase text-slate-900 tracking-tight">Dr. Aris Thorne</span>
                <CheckCircle2 className="h-3 w-3 text-teal-600" />
              </div>
              <span className="text-[8px] font-mono font-bold uppercase tracking-tighter text-teal-700">Clinician • Node 12-B</span>
            </div>
            <div className="h-9 w-9 border border-slate-200 flex items-center justify-center font-black text-[11px] text-slate-500 bg-slate-50 rounded-none shadow-sm">AT</div>
          </div>
        </header>
        <main className={container ? "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" : "w-full"}>
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}