"use client";

import { useEffect, useRef } from "react";
import { format, addDays, subDays, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface HorizontalDateSelectorProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

export function HorizontalDateSelector({ selectedDate, onDateChange }: HorizontalDateSelectorProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Gerar 15 dias (7 antes, hoje, 7 depois)
  const dates = Array.from({ length: 31 }, (_, i) => addDays(subDays(new Date(), 7), i));

  useEffect(() => {
    // Scroll para a data selecionada no início
    if (scrollRef.current) {
      const selectedElement = scrollRef.current.querySelector('[data-selected="true"]');
      if (selectedElement) {
        selectedElement.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
      }
    }
  }, []);

  return (
    <div className="relative w-full">
      <div 
        ref={scrollRef}
        className="flex items-center gap-2 overflow-x-auto pb-4 px-4 scrollbar-hide no-scrollbar"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {dates.map((date) => {
          const isActive = isSameDay(date, selectedDate);
          const dayName = format(date, "EEE", { locale: ptBR }).replace('.', '');
          const dayNumber = format(date, "dd");

          return (
            <button
              key={date.toISOString()}
              data-selected={isActive}
              onClick={() => onDateChange(date)}
              className={cn(
                "flex flex-col items-center justify-center min-w-[70px] h-[70px] rounded-2xl transition-all duration-300 border",
                isActive 
                  ? "bg-[#a3e635] border-[#a3e635] text-black shadow-lg shadow-[#a3e635]/20 scale-105 z-10" 
                  : "bg-[#161616] border-white/5 text-muted-foreground hover:border-white/20 hover:bg-white/[0.02]"
              )}
            >
              <span className={cn(
                "text-[10px] font-black uppercase tracking-widest",
                isActive ? "text-black/60" : "text-muted-foreground/60"
              )}>
                {dayName}
              </span>
              <span className="text-xl font-black tabular-nums">
                {dayNumber}
              </span>
              {isSameDay(date, new Date()) && !isActive && (
                <div className="absolute -bottom-1 w-1 h-1 bg-[#a3e635] rounded-full" />
              )}
            </button>
          );
        })}
      </div>
      
      {/* Sombras de fade nas laterais */}
      <div className="absolute left-0 top-0 bottom-4 w-12 bg-gradient-to-r from-[#0a0a0a] to-transparent pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-4 w-12 bg-gradient-to-l from-[#0a0a0a] to-transparent pointer-events-none" />

      <style jsx>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
