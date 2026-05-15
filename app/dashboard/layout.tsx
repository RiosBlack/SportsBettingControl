import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ModeToggle } from "@/components/mode-toggle";
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="flex-1 flex flex-col h-screen overflow-hidden w-full">
        <div className="border-b p-4 flex items-center justify-between shrink-0">
          <SidebarTrigger />
          <ModeToggle />
        </div>
        <div className="flex-1 min-h-0 overflow-auto w-full flex flex-col">
          {children}
        </div>
      </main>
    </SidebarProvider>
  );
}

