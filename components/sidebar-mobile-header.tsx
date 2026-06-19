"use client";

import { useEffect, useState } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";

export function SidebarMobileHeader() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <header className="flex h-14 shrink-0 items-center border-b px-4 md:hidden" aria-hidden="true" />;
  }

  return (
    <header className="flex h-14 shrink-0 items-center border-b px-4 md:hidden">
      <SidebarTrigger className="h-7 w-7" />
    </header>
  );
}
