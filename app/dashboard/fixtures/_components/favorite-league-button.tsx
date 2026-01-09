"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";
import { toggleFavoriteLeague } from "@/lib/actions/favorites";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface FavoriteLeagueButtonProps {
  leagueId: string;
  leagueName: string;
  isFavorite: boolean;
}

export function FavoriteLeagueButton({
  leagueId,
  leagueName,
  isFavorite: initialIsFavorite,
}: FavoriteLeagueButtonProps) {
  const [isFavorite, setIsFavorite] = useState(initialIsFavorite);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleToggle = () => {
    startTransition(async () => {
      const result = await toggleFavoriteLeague(leagueId);
      
      if (result.error) {
        toast({
          variant: "destructive",
          title: "Erro",
          description: result.error,
        });
      } else {
        setIsFavorite(result.isFavorite ?? false);
        toast({
          title: result.isFavorite ? "Adicionado aos favoritos" : "Removido dos favoritos",
          description: result.isFavorite
            ? `${leagueName} foi adicionado aos favoritos`
            : `${leagueName} foi removido dos favoritos`,
        });
      }
    });
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleToggle}
      disabled={isPending}
      className="h-8 w-8"
    >
      <Star
        className={cn(
          "h-4 w-4 transition-colors",
          isFavorite
            ? "fill-yellow-400 text-yellow-400"
            : "text-muted-foreground hover:text-yellow-400"
        )}
      />
    </Button>
  );
}

