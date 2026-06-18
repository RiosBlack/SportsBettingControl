'use client'

import * as React from 'react'
import Image from 'next/image'
import { Check, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverAnchor,
} from '@/components/ui/popover'
import { searchSportEventsAction } from '@/lib/actions/sport-events'
import type { CreateBetInput, SelectedSportEventInput } from '@/lib/validations/bet'
import type { SportEventSearchResult } from '@/lib/types/sport-events'

interface EventSearchComboboxProps {
  value: string
  sport: CreateBetInput['sport']
  onValueChange: (value: string) => void
  onCompetitionChange: (competition: string) => void
  onEventDateChange: (date: Date) => void
  onSelectedEventChange: (event: SelectedSportEventInput | null) => void
  onSportEventIdChange: (sportEventId: string | null) => void
  disabled?: boolean
}

export function EventSearchCombobox({
  value,
  sport,
  onValueChange,
  onCompetitionChange,
  onEventDateChange,
  onSelectedEventChange,
  onSportEventIdChange,
  disabled,
}: EventSearchComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [results, setResults] = React.useState<SportEventSearchResult[]>([])
  const [loading, setLoading] = React.useState(false)
  const [hasSearched, setHasSearched] = React.useState(false)

  React.useEffect(() => {
    const query = value.trim()

    if (query.length < 3 || sport !== 'FUTEBOL') {
      setResults([])
      setHasSearched(false)
      setOpen(false)
      return
    }

    const timeoutId = window.setTimeout(async () => {
      setLoading(true)
      setHasSearched(false)

      const response = await searchSportEventsAction(query, sport)

      if ('success' in response) {
        setResults(response.data)
        setOpen(response.data.length > 0)
      } else {
        setResults([])
        setOpen(false)
      }

      setHasSearched(true)
      setLoading(false)
    }, 350)

    return () => window.clearTimeout(timeoutId)
  }, [value, sport])

  const handleInputChange = (nextValue: string) => {
    onValueChange(nextValue)
    onSelectedEventChange(null)
    onSportEventIdChange(null)
    onCompetitionChange('')
  }

  const handleSelect = (item: SportEventSearchResult) => {
    onValueChange(item.eventLabel)
    onCompetitionChange(item.competition)
    onEventDateChange(new Date(item.eventDate))

    if (item.source === 'LOCAL' && item.localSportEventId) {
      onSportEventIdChange(item.localSportEventId)
      onSelectedEventChange(null)
    } else if (item.externalId && (item.source === 'API_FOOTBALL' || item.source === 'FOOTBALL_DATA')) {
      onSportEventIdChange(null)
      onSelectedEventChange({
        source: item.source,
        externalId: item.externalId,
        sport: item.sport as CreateBetInput['sport'],
        homeTeamName: item.homeTeamName,
        awayTeamName: item.awayTeamName,
        homeTeamLogo: item.homeTeamLogo,
        awayTeamLogo: item.awayTeamLogo,
        competition: item.competition,
        eventDate: new Date(item.eventDate),
      })
    } else {
      onSportEventIdChange(null)
      onSelectedEventChange(null)
    }

    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <div className="relative">
          <Input
            value={value}
            onChange={(e) => handleInputChange(e.target.value)}
            onFocus={() => {
              if (results.length > 0) setOpen(true)
            }}
            placeholder="Ex: Flamengo, Brasil, Arsenal..."
            disabled={disabled}
            className="pr-10"
            autoComplete="off"
          />
          {loading && (
            <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
          )}
        </div>
      </PopoverAnchor>

      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0"
        align="start"
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        <Command shouldFilter={false}>
          <CommandList>
            {hasSearched && results.length === 0 && (
              <CommandEmpty>Nenhum jogo encontrado.</CommandEmpty>
            )}

            <CommandGroup>
              {results.map((item) => (
                <CommandItem
                  key={item.searchId}
                  value={item.searchId}
                  onSelect={() => handleSelect(item)}
                  className="items-start py-3"
                >
                  <Check
                    className={cn(
                      'mr-2 mt-1 h-4 w-4',
                      value === item.eventLabel ? 'opacity-100' : 'opacity-0'
                    )}
                  />

                  <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <TeamBadge name={item.homeTeamName} logo={item.homeTeamLogo} />
                      <span className="text-muted-foreground">x</span>
                      <TeamBadge name={item.awayTeamName} logo={item.awayTeamLogo} />
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span>{item.competition}</span>
                      <span>•</span>
                      <span>{item.time}</span>
                      {item.source === 'LOCAL' && (
                        <>
                          <span>•</span>
                          <span>Salvo</span>
                        </>
                      )}
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

function TeamBadge({
  name,
  logo,
}: {
  name: string
  logo?: string | null
}) {
  return (
    <div className="flex items-center gap-2">
      {logo ? (
        <Image
          src={logo}
          alt={name}
          width={20}
          height={20}
          className="h-5 w-5 object-contain"
          unoptimized
        />
      ) : (
        <div className="h-5 w-5 rounded-full bg-muted" />
      )}
      <span className="font-medium">{name}</span>
    </div>
  )
}
