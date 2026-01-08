"use client";

import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import { CreateMarketDialog } from "./create-market-dialog";
import { Label } from "@/components/ui/label";

interface Market {
  id: string;
  name: string;
}

interface MarketSelectProps {
  value?: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
}

export function MarketSelect({
  value,
  onValueChange,
  disabled,
  required,
}: MarketSelectProps) {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    fetchMarkets();
  }, []);

  const fetchMarkets = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/markets");
      const data = await response.json();

      if (data.success && data.data) {
        setMarkets(data.data);
      }
    } catch (error) {
      console.error("Error fetching markets:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarketCreated = (newMarket: Market) => {
    setMarkets((prev) => [...prev, newMarket].sort((a, b) => a.name.localeCompare(b.name)));
    onValueChange(newMarket.id);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Select
          value={value}
          onValueChange={onValueChange}
          disabled={disabled || isLoading}
          required={required}
        >
          <SelectTrigger className="flex-1">
            <SelectValue placeholder={isLoading ? "Carregando..." : "Selecione um mercado"} />
          </SelectTrigger>
          <SelectContent>
            {markets.length === 0 && !isLoading ? (
              <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                Nenhum mercado cadastrado. Clique no botão + para criar.
              </div>
            ) : (
              markets.map((market) => (
                <SelectItem key={market.id} value={market.id}>
                  {market.name}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => setIsDialogOpen(true)}
          disabled={disabled || isLoading}
          className="shrink-0"
          title="Criar novo mercado"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
        </Button>
      </div>

      <CreateMarketDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onMarketCreated={handleMarketCreated}
      />
    </div>
  );
}

