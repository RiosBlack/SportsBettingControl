"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface DateSelectorProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

export function DateSelector({ selectedDate, onDateChange }: DateSelectorProps) {
  const generateVisibleDates = (centerDate: Date) => {
    const dates: Date[] = [];
    const center = new Date(centerDate);
    center.setHours(0, 0, 0, 0);
    
    for (let i = -2; i <= 2; i++) {
      const date = new Date(center);
      date.setDate(date.getDate() + i);
      dates.push(date);
    }
    
    return dates;
  };

  const [visibleDates, setVisibleDates] = useState(() => {
    return generateVisibleDates(selectedDate);
  });

  // Atualizar datas visíveis quando a data selecionada mudar
  useEffect(() => {
    const selected = new Date(selectedDate);
    selected.setHours(0, 0, 0, 0);
    
    // Verificar se a data selecionada está fora do range visível
    const isInRange = visibleDates.some((date) => {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      return d.getTime() === selected.getTime();
    });

    if (!isInRange) {
      setVisibleDates(generateVisibleDates(selectedDate));
    }
  }, [selectedDate]);

  const isToday = (date: Date): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);
    return compareDate.getTime() === today.getTime();
  };

  const isSelected = (date: Date): boolean => {
    const selected = new Date(selectedDate);
    selected.setHours(0, 0, 0, 0);
    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);
    return compareDate.getTime() === selected.getTime();
  };

  const formatDayName = (date: Date): string => {
    const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    return dayNames[date.getDay()];
  };

  const formatDayNumber = (date: Date): string => {
    return date.getDate().toString().padStart(2, "0");
  };

  const navigateDates = (direction: "prev" | "next") => {
    setVisibleDates((prev) => {
      const newDates = prev.map((date) => {
        const newDate = new Date(date);
        newDate.setDate(newDate.getDate() + (direction === "next" ? 1 : -1));
        return newDate;
      });
      return newDates;
    });
  };

  const handleDateClick = (date: Date) => {
    onDateChange(date);
  };

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2">
      {/* Botão Anterior */}
      <Button
        variant="outline"
        size="icon"
        onClick={() => navigateDates("prev")}
        className="shrink-0 h-10 w-10"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {/* Cards de Data */}
      <div className="flex items-center gap-2">
        {visibleDates.map((date, index) => {
          const today = isToday(date);
          const selected = isSelected(date);
          
          return (
            <button
              key={`${date.getTime()}-${index}`}
              onClick={() => handleDateClick(date)}
              className={cn(
                "flex flex-col items-center justify-center px-4 py-2 rounded-lg min-w-[80px] transition-colors",
                selected
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted hover:bg-muted/80 text-foreground"
              )}
            >
              <span className="text-xs font-medium uppercase">
                {formatDayName(date)}
              </span>
              <span
                className={cn(
                  "text-lg font-bold",
                  selected && today ? "text-primary-foreground" : ""
                )}
              >
                {formatDayNumber(date)}
              </span>
              {today && (
                <span className="text-xs font-medium">
                  Hoje
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Botão Próximo */}
      <Button
        variant="outline"
        size="icon"
        onClick={() => navigateDates("next")}
        className="shrink-0 h-10 w-10"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>

      {/* Botão Calendário */}
      <Button
        variant="outline"
        size="icon"
        onClick={() => {
          // Por enquanto, apenas volta para hoje
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          onDateChange(today);
        }}
        className="shrink-0 h-10 w-10"
      >
        <CalendarIcon className="h-4 w-4" />
      </Button>
    </div>
  );
}

