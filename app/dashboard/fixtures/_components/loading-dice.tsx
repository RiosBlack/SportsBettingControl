"use client";

import { cn } from "@/lib/utils";
import { Dice5 } from "lucide-react";

interface LoadingDiceProps {
  className?: string;
}

export function LoadingDice({ className }: LoadingDiceProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center space-y-4 py-20", className)}>
      <div className="relative">
        {/* Animação do dado balançando */}
        <div className="animate-dice-shake text-primary">
          <Dice5 size={64} strokeWidth={1.5} />
        </div>
        
        {/* Sombra pulsante */}
        <div className="w-12 h-2 bg-black/20 rounded-full blur-[2px] mx-auto mt-2 animate-dice-shadow" />
      </div>
      
      <div className="text-center space-y-1">
        <h3 className="text-lg font-semibold text-foreground">Sincronizando Partidas</h3>
        <p className="text-sm text-muted-foreground animate-pulse">
          Buscando os melhores dados para você...
        </p>
      </div>

      <style jsx global>{`
        @keyframes dice-shake {
          0% { transform: translateY(0) rotate(0deg); }
          25% { transform: translateY(-15px) rotate(15deg); }
          50% { transform: translateY(0) rotate(-15deg); }
          75% { transform: translateY(-8px) rotate(5deg); }
          100% { transform: translateY(0) rotate(0deg); }
        }

        @keyframes dice-shadow {
          0%, 100% { transform: scale(1); opacity: 0.2; }
          25%, 75% { transform: scale(0.6); opacity: 0.1; }
          50% { transform: scale(0.8); opacity: 0.15; }
        }

        .animate-dice-shake {
          animation: dice-shake 0.8s infinite cubic-bezier(0.45, 0.05, 0.55, 0.95);
        }

        .animate-dice-shadow {
          animation: dice-shadow 0.8s infinite cubic-bezier(0.45, 0.05, 0.55, 0.95);
        }
      `}</style>
    </div>
  );
}
