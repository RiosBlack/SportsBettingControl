"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";
import { toggleFavoriteTeam } from "@/lib/actions/favorites";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface FavoriteTeamButtonProps {
  teamId: string;
  teamName: string;
  isFavorite: boolean;
  size?: "sm" | "md" | "lg";
}

export function FavoriteTeamButton({
  teamId,
  teamName,
  isFavorite: initialIsFavorite,
  size = "sm",
}: FavoriteTeamButtonProps) {
  const [isFavorite, setIsFavorite] = useState(initialIsFavorite);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleToggle = () => {
    startTransition(async () => {
      const result = await toggleFavoriteTeam(teamId);
      
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
            ? `${teamName} foi adicionado aos favoritos`
            : `${teamName} foi removido dos favoritos`,
        });
      }
    });
  };

  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-8 w-8",
    lg: "h-10 w-10",
  };

  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleToggle}
      disabled={isPending}
      className={cn("p-0", sizeClasses[size])}
    >
      <Star
        className={cn(
          iconSizes[size],
          "transition-colors",
          isFavorite
            ? "fill-yellow-400 text-yellow-400"
            : "text-muted-foreground hover:text-yellow-400"
        )}
      />
    </Button>
  );
}

