import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings, ShieldAlert } from "lucide-react";
import Link from "next/link";

export function NoLeaguesWarning() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 bg-[#0a0a0a]">
      <Card className="max-w-md w-full border border-white/5 bg-[#161616] shadow-2xl rounded-2xl overflow-hidden">
        <div className="h-2 bg-[#a3e635] w-full" />
        <CardHeader className="text-center pt-8">
          <div className="flex justify-center mb-6">
            <div className="p-4 rounded-full bg-[#a3e635]/10 group transition-transform duration-500 hover:rotate-12">
              <ShieldAlert className="h-10 w-10 text-[#a3e635]" />
            </div>
          </div>
          <CardTitle className="text-2xl font-black tracking-tight text-white uppercase">
            Nenhuma Liga Ativa
          </CardTitle>
          <CardDescription className="text-muted-foreground text-base mt-3 font-medium">
            Você ainda não configurou as ligas que deseja monitorar.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center text-sm text-muted-foreground px-8 leading-relaxed">
          Para que possamos sincronizar e exibir as partidas em tempo real, precisamos que você selecione seus campeonatos favoritos.
        </CardContent>
        <CardFooter className="flex justify-center pb-8 pt-6">
          <Button asChild className="bg-[#a3e635] text-black hover:bg-[#a3e635]/90 font-black px-8 h-12 rounded-xl transition-all active:scale-95">
            <Link href="/dashboard/settings/leagues">
              <Settings className="mr-2 h-5 w-5" />
              CONFIGURAR AGORA
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
