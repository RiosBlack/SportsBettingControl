import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarMobileHeader } from "@/components/sidebar-mobile-header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="h-svh overflow-hidden">
        <SidebarMobileHeader />
        <div className="flex-1 min-h-0 overflow-auto w-full flex flex-col">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

