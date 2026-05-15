"use client";

import { cn } from "@/lib/utils";
import {
  STAT_CATEGORIES,
  DERIVED_LABELS,
} from "@/lib/types/team-statistics";
import type { DerivedStatKey, TeamStatKey } from "@/lib/types/team-statistics";

interface TeamStatsSidebarProps {
  activeStatKey: string;
  activeCategory: string;
  onSelectStat: (key: TeamStatKey | DerivedStatKey, categoryId: string) => void;
}

const DERIVED_KEYS = Object.keys(DERIVED_LABELS) as DerivedStatKey[];

export function TeamStatsSidebar({
  activeStatKey,
  activeCategory,
  onSelectStat,
}: TeamStatsSidebarProps) {
  return (
    <aside className="w-full lg:w-56 shrink-0 border-r border-white/5 bg-[#0a0a0a] p-4 space-y-6 overflow-y-auto max-h-full">
      {STAT_CATEGORIES.filter((c) => c.id !== "derived").map((category) => (
        <div key={category.id}>
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2 px-2">
            {category.label}
          </p>
          <ul className="space-y-0.5">
            {category.stats.map((stat) => (
              <li key={stat.key}>
                <button
                  type="button"
                  onClick={() => onSelectStat(stat.key, category.id)}
                  className={cn(
                    "w-full text-left text-sm px-3 py-2 rounded-lg transition-colors",
                    activeStatKey === stat.key && activeCategory === category.id
                      ? "bg-[#a3e635] text-black font-semibold"
                      : "text-muted-foreground hover:text-white hover:bg-white/5"
                  )}
                >
                  {stat.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}

      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2 px-2">
          Indicadores
        </p>
        <ul className="space-y-0.5">
          {DERIVED_KEYS.map((key) => (
            <li key={key}>
              <button
                type="button"
                onClick={() => onSelectStat(key, "derived")}
                className={cn(
                  "w-full text-left text-sm px-3 py-2 rounded-lg transition-colors",
                  activeStatKey === key && activeCategory === "derived"
                    ? "bg-[#a3e635] text-black font-semibold"
                    : "text-muted-foreground hover:text-white hover:bg-white/5"
                )}
              >
                {DERIVED_LABELS[key]}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
