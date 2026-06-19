import { auth } from "@/auth";
import { logout } from "@/lib/actions/auth";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppSidebarNav } from "./app-sidebar-nav";
import { ModeToggle } from "@/components/mode-toggle";
import { SidebarEdgeTrigger } from "@/components/sidebar-edge-trigger";

export async function AppSidebar() {
  const session = await auth();

  if (!session?.user) {
    return null;
  }

  return (
    <Sidebar>
      <div className="relative flex h-full flex-col">
        <SidebarEdgeTrigger />
        <SidebarHeader>
          <div className="flex flex-col gap-1 px-2 py-4">
            <h2 className="text-lg font-semibold">Betting Control</h2>
            <p className="text-sm text-muted-foreground">{session.user.name}</p>
          </div>
        </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <AppSidebarNav />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="flex flex-col gap-2 px-2 pb-4">
          <div className="flex items-center justify-between px-1">
            <span className="text-sm text-muted-foreground">Tema</span>
            <ModeToggle />
          </div>
          <form action={logout}>
            <Button
              variant="outline"
              type="submit"
              className="w-full justify-start gap-2"
            >
              <LogOut className="h-4 w-4" />
              <span>Sair</span>
            </Button>
          </form>
        </div>
      </SidebarFooter>
      </div>
    </Sidebar>
  );
}

