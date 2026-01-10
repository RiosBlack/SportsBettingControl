"use client";

import { useEffect } from "react";

export function FixturesSync() {
  useEffect(() => {
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

