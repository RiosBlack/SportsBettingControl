"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Database, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function DatabaseSyncButton() {
  const [isLoading, setIsLoading] = useState(false);

  const handleSync = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/database/sync", { method: "POST" });
      const data = await response.json();

      if (!response.ok || !data.success) {
        toast.error("Falha na atualização", {
          description: data.error || data.message || "Tente novamente mais tarde.",
        });
        return;
      }

      toast.success("Banco atualizado", {
        description: data.message,
      });
    } catch {
      toast.error("Erro de conexão", {
        description: "Não foi possível conectar ao servidor.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      type="button"
      variant="default"
      size="sm"
      onClick={handleSync}
      disabled={isLoading}
      className="bg-[#a3e635] hover:bg-[#a3e635]/90 text-black font-semibold"
    >
      {isLoading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Database className="mr-2 h-4 w-4" />
      )}
      Atualizar banco de dados
    </Button>
  );
}
