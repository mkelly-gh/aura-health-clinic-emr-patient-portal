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
  SidebarGroupLabel
} from "@/components/ui/sidebar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  LayoutDashboard,
  Calendar,
  Settings,
  Activity,
  Menu,
  FileBarChart,
  LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
        <SidebarGroupLabel className="px-4 text-[9px] font-black uppercase tracking-[0.3em] text-slate-500 mb-3">Clinical Registry</SidebarGroupLabel>
        <SidebarMenu className="gap-0.5">
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={location.pathname === '/provider'} onClick={() => setIsSheetOpen(false)} className="rounded-none">
              <Link to="/provider" className="flex items-center gap-3 px-4 h-9 data-[active=true]:bg-teal-700 data-[active=true]:text-white transition-none">
                <LayoutDashboard className="h-3.5 w-3.5" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Dashboard</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="opacity-40 pointer-events-none rounded-none">
              <a href="#" className="flex items-center gap-3 px-4 h-9">
                <Calendar className="h-3.5 w-3.5" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Schedule</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="opacity-40 pointer-events-none rounded-none">
              <a href="#" className="flex items-center gap-3 px-4 h-9">
                <FileBarChart className="h-3.5 w-3.5" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Analytics</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>
      <SidebarGroup className="mt-auto">
        <SidebarMenu className="gap-0.5">
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="opacity-40 pointer-events-none rounded-none">
              <a href="#" className="flex items-center gap-3 px-4 h-9">
                <Settings className="h-3.5 w-3.5" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Settings</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild onClick={() => setIsSheetOpen(false)} className="hover:text-destructive rounded-none">
              <Link to="/" className="flex items-center gap-3 px-4 h-9">
                <LogOut className="h-3.5 w-3.5" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-destructive">Logout</span>
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
          <SidebarHeader className="h-14 flex items-center px-4 border-b border-slate-800 bg-slate-900">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 bg-teal-600 flex items-center justify-center border border-teal-500 shadow-sm">
                <Activity className="h-4 w-4 text-white" />
              </div>
              <span className="font-black text-[12px] text-white tracking-[0.2em] uppercase sidebar-hide">Aura EMR</span>
            </div>
          </SidebarHeader>
          <SidebarContent className="py-2 bg-slate-900">
            <NavContent />
          </SidebarContent>
        </Sidebar>
      )}
      <SidebarInset className={`bg-slate-50 ${className}`}>
        <header className="flex h-14 items-center gap-4 border-b border-slate-200 bg-white px-4 sticky top-0 z-40">
          {isMobile ? (
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-none border border-slate-200"><Menu className="h-4 w-4" /></Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0 flex flex-col bg-slate-900 border-none">
                <div className="p-6 border-b border-slate-800 flex items-center gap-3">
                  <Activity className="h-5 w-5 text-teal-500" />
                  <span className="font-black text-base text-white uppercase tracking-widest">Aura EMR</span>
                </div>
                <NavContent />
              </SheetContent>
            </Sheet>
          ) : <SidebarTrigger className="h-8 w-8" />}
          <div className="flex-1" />
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <span className="text-[10px] font-black block leading-none uppercase text-slate-900">MD. CLINICAL_ADMIN</span>
              <span className="text-[8px] font-mono font-bold uppercase tracking-tighter text-teal-700">AURA_NODE_12</span>
            </div>
            <div className="h-7 w-7 border border-slate-200 flex items-center justify-center font-black text-[10px] text-slate-500 bg-slate-50">AA</div>
          </div>
        </header>
        <main className={container ? "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" : "w-full"}>
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}