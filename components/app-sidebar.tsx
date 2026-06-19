import { auth } from "@/auth";
import { AppSidebarClient } from "@/components/app-sidebar-client";

export async function AppSidebar() {
  const session = await auth();

  if (!session?.user) {
    return null;
  }

  return <AppSidebarClient userName={session.user.name ?? ""} />;
}
