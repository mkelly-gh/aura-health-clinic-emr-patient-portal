import React from "react";
import { Link, useLocation } from "react-router-dom";
import { SidebarProvider, SidebarInset, SidebarTrigger, Sidebar, SidebarHeader, SidebarContent, SidebarGroup, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { LayoutDashboard, Users, Calendar, Settings, Activity, ShieldPlus, ChevronLeft } from "lucide-react";
type AppLayoutProps = {
  children: React.ReactNode;
  container?: boolean;
  className?: string;
  contentClassName?: string;
};
export function AppLayout({ children, container = false, className, contentClassName }: AppLayoutProps): JSX.Element {
  const location = useLocation();
  return (
    <SidebarProvider defaultOpen={true}>
      <Sidebar collapsible="icon" className="border-r">
        <SidebarHeader className="border-b h-14 flex items-center px-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-teal-700 flex items-center justify-center">
              <Activity className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-teal-900 dark:text-teal-100 sidebar-hide">Aura Clinic</span>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={location.pathname === '/provider'}>
                  <Link to="/provider"><LayoutDashboard /> <span>Dashboard</span></Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={location.pathname.startsWith('/provider/patient')}>
                  <Link to="/provider"><Users /> <span>Patient Registry</span></Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <a href="#"><Calendar /> <span>Schedule</span></a>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <a href="#"><ShieldPlus /> <span>Referrals</span></a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
          <SidebarGroup className="mt-auto">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <a href="#"><Settings /> <span>Settings</span></a>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link to="/"><ChevronLeft /> <span>Exit Portal</span></Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
      <SidebarInset className={className}>
        <header className="flex h-14 items-center gap-4 border-b bg-background px-4 sticky top-0 z-30">
          <SidebarTrigger />
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium hidden sm:inline-block">Dr. Aura Assistant</span>
            <div className="h-8 w-8 rounded-full bg-muted border" />
          </div>
        </header>
        <main className={container ? "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10" : "p-4"}>
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}