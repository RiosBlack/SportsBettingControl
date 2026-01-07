"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function FixturesSync() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<"idle" | "syncing" | "success" | "error">("idle");
  const [message, setMessage] = useState<string>("");
  const [result, setResult] = useState<{
    footballCount: number;
    basketballCount: number;
  } | null>(null);
  const router = useRouter();

  const handleSync = async () => {
    setIsSyncing(true);
    setProgress(0);
    setStatus("syncing");
    setMessage("Iniciando sincronização...");
    setResult(null);

    try {
      // Simular progresso inicial
      setProgress(10);
      setMessage("Buscando jogos da API...");

      // Fazer requisição para sincronizar
      const response = await fetch("/api/fixtures/sync?force=true", {
        method: "GET",
      });

      setProgress(60);
      setMessage("Processando e salvando no banco de dados...");

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao sincronizar");
      }

      const data = await response.json();
      setProgress(90);
      setMessage("Finalizando...");

      // Aguardar um pouco para mostrar o progresso completo
      await new Promise((resolve) => setTimeout(resolve, 300));

      setProgress(100);
      setStatus("success");
      setResult({
        footballCount: data.footballCount || 0,
        basketballCount: data.basketballCount || 0,
      });
      setMessage(
        `Sincronização concluída! ${data.footballCount || 0} jogos de futebol e ${
          data.basketballCount || 0
        } jogos de basquete salvos.`
      );

      // Atualizar a página após 1.5 segundos
      setTimeout(() => {
        router.refresh();
      }, 1500);
    } catch (error: any) {
      setProgress(0);
      setStatus("error");
      setMessage(error.message || "Erro ao sincronizar jogos. Tente novamente.");
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <Button
            onClick={handleSync}
            disabled={isSyncing}
            className="w-full sm:w-auto"
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isSyncing ? "animate-spin" : ""}`}
            />
            {isSyncing ? "Sincronizando..." : "Sincronizar"}
          </Button>
        </div>
      </div>

      {isSyncing && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{message}</span>
            <span className="text-muted-foreground">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}

      {status === "success" && result && (
        <Alert className="border-green-500/50 bg-green-50 dark:bg-green-950/50">
          <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertDescription className="text-green-800 dark:text-green-200">
            {message}
          </AlertDescription>
        </Alert>
      )}

      {status === "error" && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}

