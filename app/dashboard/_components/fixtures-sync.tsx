"use client";

import { useEffect } from "react";

export function FixturesSync() {
  useEffect(() => {
    // Evitar múltiplas sincronizações na mesma sessão do navegador
    const lastSync = sessionStorage.getItem("last_fixtures_sync");
    const now = Date.now();
    
    // Só sincroniza se não sincronizou nos últimos 30 minutos na sessão atual
    if (lastSync && now - parseInt(lastSync) < 30 * 60 * 1000) {
      return;
    }

    sessionStorage.setItem("last_fixtures_sync", now.toString());

    // Sincronizar jogos do dia em background (não bloqueia o layout)
    fetch("/api/fixtures/sync")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          console.log(
            `Fixtures synced: ${data.footballCount || 0} football`
          );
        }
      })
      .catch((error) => {
        console.error("Error syncing fixtures:", error);
      });
  }, []);

  return null; // Componente invisível
}

