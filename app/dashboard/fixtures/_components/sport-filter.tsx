"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PiSoccerBallFill } from "react-icons/pi";
import { GiBasketballBall } from "react-icons/gi";


type Sport = "FUTEBOL" | "BASQUETE" | "ALL";

interface SportFilterProps {
  selectedSport: Sport;
  onSportChange: (sport: Sport) => void;
}

export function SportFilter({ selectedSport, onSportChange }: SportFilterProps) {
  return (
    <div className="flex gap-2 mb-6">
      <Button
        variant={selectedSport === "ALL" ? "default" : "outline"}
        onClick={() => onSportChange("ALL")}
        className={cn(
          "flex items-center gap-2",
          selectedSport === "ALL" && "bg-primary text-primary-foreground"
        )}
      >
        Todos
      </Button>
      <Button
        variant={selectedSport === "FUTEBOL" ? "default" : "outline"}
        onClick={() => onSportChange("FUTEBOL")}
        className={cn(
          "flex items-center gap-2",
          selectedSport === "FUTEBOL" && "bg-primary text-primary-foreground"
        )}
      >
        <PiSoccerBallFill className="h-4 w-4" />
        Futebol
      </Button>
      <Button
        variant={selectedSport === "BASQUETE" ? "default" : "outline"}
        onClick={() => onSportChange("BASQUETE")}
        className={cn(
          "flex items-center gap-2",
          selectedSport === "BASQUETE" && "bg-primary text-primary-foreground"
        )}
      >
        <GiBasketballBall className="h-4 w-4" />
        Basquete
      </Button>
    </div>
  );
}

