import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ModeToggle } from "@/components/mode-toggle";
import { FixturesSync } from "./_components/fixtures-sync";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <FixturesSync />
      <main className="flex-1 flex flex-col min-h-screen w-full">
        <div className="border-b p-4 flex items-center justify-between">
          <SidebarTrigger />
          <ModeToggle />
        </div>
        <div className="flex-1 overflow-auto w-full">
          {children}
        </div>
      </main>
    </SidebarProvider>
  );
}

