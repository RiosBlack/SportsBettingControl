"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
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
  onCompetitionChange?: (competition: string) => void;
  disabled?: boolean;
}

export function MatchCombobox({
  matches,
  value,
  onChange,
  onCompetitionChange,
  disabled,
}: MatchComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState(value);

  React.useEffect(() => {
    setInputValue(value);
  }, [value]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div className="flex justify-center itens-center">
        <PopoverTrigger asChild>
          <button
            type="button"
            className="-translate-y-1/2 h-full pt-10 pr-2"
            disabled={disabled}
            onClick={() => setOpen(!open)}
          >
            <ChevronsUpDown className="h-4 w-4 opacity-50" />
          </button>
        </PopoverTrigger>
        <Input
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            onChange(e.target.value);
            // Limpar competição quando digitar manualmente
            if (onCompetitionChange) {
              onCompetitionChange("");
            }
          }}
          onFocus={() => setOpen(true)}
          placeholder="Ex: Flamengo x Palmeiras"
          disabled={disabled}
          className="pr-10"
        />

      </div>
      <PopoverContent className="w-full p-0" align="start" side="bottom" sideOffset={4}>
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
                      setInputValue(matchText);
                      if (onCompetitionChange) {
                        onCompetitionChange(match.competition);
                      }
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
    </Popover >
  );
}

