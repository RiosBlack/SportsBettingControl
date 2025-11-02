"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { Match } from "@/lib/types/matches";
import Image from "next/image";

interface MatchComboboxProps {
  matches: Match[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function MatchCombobox({
  matches,
  value,
  onChange,
  disabled,
}: MatchComboboxProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
        >
          {value || "Ex: Flamengo x Palmeiras"}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput placeholder="Buscar time..." />
          <CommandList>
            <CommandEmpty>Nenhum jogo encontrado.</CommandEmpty>
            <CommandGroup>
              {matches.map((match) => {
                const matchText = `${match.homeTeam} x ${match.awayTeam}`;
                return (
                  <CommandItem
                    key={match.id}
                    value={matchText}
                    onSelect={() => {
                      onChange(matchText);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === matchText ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex items-center gap-2 flex-1">
                      <div className="flex items-center gap-2">
                        <Image
                          src={match.homeLogo}
                          alt={match.homeTeam}
                          width={20}
                          height={20}
                          className="object-contain"
                        />
                        <span className="font-medium">{match.homeTeam}</span>
                      </div>
                      <span className="text-muted-foreground">x</span>
                      <div className="flex items-center gap-2">
                        <Image
                          src={match.awayLogo}
                          alt={match.awayTeam}
                          width={20}
                          height={20}
                          className="object-contain"
                        />
                        <span className="font-medium">{match.awayTeam}</span>
                      </div>
                    </div>
                    <div className="ml-auto flex flex-col items-end text-xs text-muted-foreground">
                      <span>{match.competition}</span>
                      <span>{match.time}</span>
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

