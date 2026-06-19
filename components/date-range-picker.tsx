"use client"

import * as React from "react"
import { format, isSameDay } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Calendar as CalendarIcon } from "lucide-react"
import type { DateRange } from "react-day-picker"
import { ptBR as dayPickerPtBR } from "react-day-picker/locale"

import { cn } from "@/lib/utils"
import { formatDateRangeLabel } from "@/lib/utils/date-range"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DateRangePickerProps {
  value: { from: Date; to: Date }
  onChange: (range: { from: Date; to: Date }) => void
  disabled?: boolean
  className?: string
}

export function DateRangePicker({
  value,
  onChange,
  disabled,
  className,
}: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [pendingRange, setPendingRange] = React.useState<DateRange | undefined>({
    from: value.from,
    to: value.to,
  })

  React.useEffect(() => {
    setPendingRange({ from: value.from, to: value.to })
  }, [value.from, value.to])

  const handleSelect = (range: DateRange | undefined) => {
    setPendingRange(range)

    if (range?.from && range?.to) {
      onChange({ from: range.from, to: range.to })
      setOpen(false)
    }
  }

  const label = formatDateRangeLabel(value.from, value.to)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full sm:w-[240px] justify-start text-left font-normal",
            className
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          <span className="truncate">{label}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="range"
          locale={dayPickerPtBR}
          selected={pendingRange}
          onSelect={handleSelect}
          defaultMonth={value.from}
          numberOfMonths={1}
          initialFocus
        />
        {pendingRange?.from && !pendingRange?.to && (
          <div className="border-t px-3 py-2 text-xs text-muted-foreground">
            Início: {format(pendingRange.from, "dd/MM/yyyy", { locale: ptBR })} — selecione a data final
          </div>
        )}
        {pendingRange?.from && pendingRange?.to && !isSameDay(pendingRange.from, pendingRange.to) && (
          <div className="border-t px-3 py-2 text-xs text-muted-foreground">
            {format(pendingRange.from, "dd/MM/yyyy", { locale: ptBR })} —{" "}
            {format(pendingRange.to, "dd/MM/yyyy", { locale: ptBR })}
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
