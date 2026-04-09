"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { format, addDays, subDays, isSameDay, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

interface HorizontalDateSelectorProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

export function HorizontalDateSelector({ selectedDate, onDateChange }: HorizontalDateSelectorProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [pivotDate, setPivotDate] = useState<Date>(new Date());

  // Gerar uma lista de 31 dias ao redor da pivotDate
  const dates = useMemo(() => {
    return Array.from({ length: 31 }, (_, i) => addDays(subDays(pivotDate, 15), i));
  }, [pivotDate]);

  // Se a data selecionada sair muito da faixa do pivot, atualiza o pivot
  useEffect(() => {
    const diff = Math.abs(differenceInDays(selectedDate, pivotDate));
    if (diff > 10) {
      setPivotDate(selectedDate);
    }
  }, [selectedDate, pivotDate]);

  // Efeito de scroll suave para centralizar a data selecionada
  useEffect(() => {
    const timer = setTimeout(() => {
      if (scrollRef.current) {
        const selectedElement = scrollRef.current.querySelector('[data-selected="true"]');
        if (selectedElement) {
          selectedElement.scrollIntoView({ 
            behavior: "smooth", 
            block: "nearest", 
            inline: "center" 
          });
        }
      }
    }, 100); // Pequeno delay para garantir o render
    return () => clearTimeout(timer);
  }, [selectedDate, pivotDate]);

  return (
    <div className="relative w-full">
      <div 
        ref={scrollRef}
        className="flex items-center gap-2 overflow-x-auto pb-4 px-4 scrollbar-hide no-scrollbar scroll-smooth"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {/* Espaçadores flexíveis para manter os itens centralizáveis */}
        <div className="flex-shrink-0 w-[30%]" />
        
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
                "flex flex-col items-center justify-center min-w-[70px] h-[70px] rounded-2xl transition-all duration-300 border shrink-0 relative",
                isActive 
                  ? "bg-[#a3e635] border-[#a3e635] text-black shadow-lg shadow-[#a3e635]/20 scale-110 z-10" 
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

        {/* Separator */}
        <div className="w-px h-10 bg-white/10 mx-4 shrink-0" />

        {/* Calendar Picker */}
        <Popover>
          <PopoverTrigger asChild>
            <button
              className={cn(
                "flex flex-col items-center justify-center min-w-[70px] h-[70px] rounded-2xl transition-all duration-300 border bg-[#161616] border-white/5 text-muted-foreground hover:border-[#a3e635]/50 hover:bg-[#a3e635]/5 hover:text-[#a3e635] shrink-0",
                !dates.some(d => isSameDay(d, selectedDate)) && "bg-[#a3e635]/10 border-[#a3e635] text-[#a3e635]"
              )}
            >
              <CalendarIcon className="h-6 w-6" strokeWidth={2.5} />
              <span className="text-[10px] font-black uppercase tracking-widest mt-1">
                OUTRO
              </span>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 bg-[#161616] border-white/10 shadow-2xl" align="end">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && onDateChange(date)}
              locale={ptBR}
              className="bg-[#161616] text-white rounded-xl"
            />
          </PopoverContent>
        </Popover>

        {/* Espaçadores flexíveis */}
        <div className="flex-shrink-0 w-[30%]" />
      </div>
      
      <style jsx>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
