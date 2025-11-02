"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { Home, Wallet, BarChart3, Plus } from "lucide-react";

const menuItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: Home,
  },
  {
    title: "Bancas",
    url: "/dashboard/bankrolls",
    icon: Wallet,
  },
  {
    title: "Apostas",
    url: "/dashboard/bets",
    icon: BarChart3,
  },
  {
    title: "Nova Aposta",
    url: "/dashboard/bets/new",
    icon: Plus,
  },
];

export function AppSidebarNav() {
  const pathname = usePathname();

  return (
    <SidebarMenu>
      {menuItems.map((item) => {
        // Para destacar item ativo, verifica se o pathname corresponde exatamente ou começa com a URL
        const isActive = pathname === item.url || 
          (item.url !== "/dashboard" && pathname.startsWith(item.url));
        return (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton asChild isActive={isActive}>
              <Link href={item.url}>
                <item.icon />
                <span>{item.title}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}

