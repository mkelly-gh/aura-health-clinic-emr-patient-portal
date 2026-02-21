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
        <SidebarGroupLabel className="px-4 text-[9px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-2">Clinical Node</SidebarGroupLabel>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={location.pathname === '/provider'} onClick={() => setIsSheetOpen(false)}>
              <Link to="/provider" className="flex items-center gap-3 px-4 h-10 data-[active=true]:bg-teal-700 data-[active=true]:text-white">
                <LayoutDashboard className="h-4 w-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Patient Registry</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="opacity-40 pointer-events-none">
              <a href="#" className="flex items-center gap-3 px-4 h-10">
                <Calendar className="h-4 w-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Schedule</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="opacity-40 pointer-events-none">
              <a href="#" className="flex items-center gap-3 px-4 h-10">
                <FileBarChart className="h-4 w-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Analytics</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>
      <SidebarGroup className="mt-auto">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="opacity-40 pointer-events-none">
              <a href="#" className="flex items-center gap-3 px-4 h-10">
                <Settings className="h-4 w-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Settings</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild onClick={() => setIsSheetOpen(false)} className="hover:text-destructive">
              <Link to="/" className="flex items-center gap-3 px-4 h-10">
                <LogOut className="h-4 w-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Exit Portal</span>
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
          <SidebarHeader className="h-16 flex items-center px-6 border-b border-slate-800 bg-slate-900">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded bg-teal-600 flex items-center justify-center border border-teal-500 shadow-sm">
                <Activity className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-base text-white tracking-tighter uppercase sidebar-hide">Aura EMR</span>
            </div>
          </SidebarHeader>
          <SidebarContent className="py-4 bg-slate-900">
            <NavContent />
          </SidebarContent>
        </Sidebar>
      )}
      <SidebarInset className={`bg-slate-50 ${className}`}>
        <header className="flex h-16 items-center gap-4 border-b bg-white px-6 sticky top-0 z-40">
          {isMobile ? (
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-md border"><Menu className="h-5 w-5" /></Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0 flex flex-col bg-slate-900 border-none">
                <div className="p-6 border-b border-slate-800 flex items-center gap-3">
                  <Activity className="h-5 w-5 text-teal-500" />
                  <span className="font-bold text-lg text-white uppercase tracking-tighter">Aura EMR</span>
                </div>
                <NavContent />
              </SheetContent>
            </Sheet>
          ) : <SidebarTrigger />}
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <span className="text-xs font-bold block leading-none">Admin. Aura</span>
              <span className="text-[9px] font-bold uppercase tracking-widest text-teal-700">Clinical Supervisor</span>
            </div>
            <div className="h-8 w-8 rounded bg-slate-100 border flex items-center justify-center font-bold text-xs text-slate-500">AA</div>
          </div>
        </header>
        <main className={container ? "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" : "w-full"}>
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}