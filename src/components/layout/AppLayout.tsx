import React from "react";
import { Link, useLocation } from "react-router-dom";
import { SidebarProvider, SidebarInset, SidebarTrigger, Sidebar, SidebarHeader, SidebarContent, SidebarGroup, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { LayoutDashboard, Users, Calendar, Settings, Activity, ShieldPlus, ChevronLeft, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
type AppLayoutProps = {
  children: React.ReactNode;
  container?: boolean;
  className?: string;
  contentClassName?: string;
};
export function AppLayout({ children, container = false, className, contentClassName }: AppLayoutProps): JSX.Element {
  const location = useLocation();
  const isMobile = useIsMobile();
  const NavContent = () => (
    <>
      <SidebarGroup>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={location.pathname === '/provider'}>
              <Link to="/provider" className="flex items-center gap-3 px-4 py-2">
                <LayoutDashboard className="h-5 w-5" /> 
                <span className="font-medium">Dashboard</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={location.pathname.startsWith('/provider/patient')}>
              <Link to="/provider" className="flex items-center gap-3 px-4 py-2">
                <Users className="h-5 w-5" /> 
                <span className="font-medium">Patient Registry</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <a href="#" className="flex items-center gap-3 px-4 py-2">
                <Calendar className="h-5 w-5" /> 
                <span className="font-medium">Schedule</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <a href="#" className="flex items-center gap-3 px-4 py-2">
                <ShieldPlus className="h-5 w-5" /> 
                <span className="font-medium">Referrals</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>
      <SidebarGroup className="mt-auto">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <a href="#" className="flex items-center gap-3 px-4 py-2">
                <Settings className="h-5 w-5" /> 
                <span className="font-medium">Settings</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link to="/" className="flex items-center gap-3 px-4 py-2 text-muted-foreground hover:text-destructive transition-colors">
                <ChevronLeft className="h-5 w-5" /> 
                <span className="font-medium">Exit Portal</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>
    </>
  );
  return (
    <SidebarProvider defaultOpen={!isMobile}>
      {/* Desktop Sidebar */}
      {!isMobile && (
        <Sidebar collapsible="icon" className="border-r shadow-sm">
          <SidebarHeader className="border-b h-16 flex items-center px-6">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-teal-700 flex items-center justify-center shadow-lg shadow-teal-700/20">
                <Activity className="h-6 w-6 text-white" />
              </div>
              <span className="font-bold text-xl text-teal-900 dark:text-teal-100 sidebar-hide">Aura EMR</span>
            </div>
          </SidebarHeader>
          <SidebarContent className="py-4">
            <NavContent />
          </SidebarContent>
        </Sidebar>
      )}
      <SidebarInset className={`bg-slate-50/50 dark:bg-background/50 ${className}`}>
        <header className="flex h-16 items-center gap-4 border-b bg-background/80 backdrop-blur-md px-6 sticky top-0 z-40 shadow-sm">
          {isMobile ? (
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-xl">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0 flex flex-col">
                <div className="p-6 border-b flex items-center gap-3 bg-teal-50/50">
                  <div className="h-10 w-10 rounded-xl bg-teal-700 flex items-center justify-center">
                    <Activity className="h-6 w-6 text-white" />
                  </div>
                  <span className="font-bold text-xl text-teal-900">Aura EMR</span>
                </div>
                <div className="flex-1 overflow-y-auto py-4">
                   <NavContent />
                </div>
              </SheetContent>
            </Sheet>
          ) : (
            <SidebarTrigger />
          )}
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <span className="text-sm font-bold text-foreground block leading-tight">Dr. Aura Assistant</span>
              <span className="text-[10px] font-black uppercase tracking-widest text-teal-600">Attending Physician</span>
            </div>
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-slate-200 to-slate-100 dark:from-slate-800 dark:to-slate-700 border shadow-sm flex items-center justify-center font-bold text-slate-600">
              DA
            </div>
          </div>
        </header>
        <main className={container ? "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10" : "w-full"}>
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}