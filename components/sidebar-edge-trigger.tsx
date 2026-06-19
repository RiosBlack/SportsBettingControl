"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

export function SidebarEdgeTrigger({ className }: { className?: string }) {
  return (
    <SidebarTrigger
      className={cn(
        "absolute -right-4 top-4 z-20 hidden h-7 w-7 rounded-md border bg-background shadow-sm md:flex text-green-600",
        className
      )}
    />
  );
}
