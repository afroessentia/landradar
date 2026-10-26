import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { LandRadarLogo } from "@/components/LandRadarLogo";
import { MetricsCards, type MetricFilter } from "@/components/dashboard/MetricsCards";
import { SyncApifyButton } from "@/components/dashboard/SyncApifyButton";
import { ManualLotDialog } from "@/components/dashboard/ManualLotDialog";
import { ALL_STATUSES, type PropertyStatus } from "@/types/property";

interface DashboardSearch {
  status?: PropertyStatus | undefined;
  maxPrice?: number | undefined;
}

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({
    meta: [
      { title: "Dashboard — LandRadar | OTC Intelligence Terminal" },
      { name: "description", content: "Sistema de inteligência para aquisição remota de terrenos OTC nos EUA" },
      { property: "og:title", content: "Dashboard — LandRadar" },
      { property: "og:description", content: "Sistema de inteligência para aquisição remota de terrenos OTC nos EUA" },
    ],
  }),
  validateSearch: (raw: Record<string, unknown>): DashboardSearch => {
    const status = ALL_STATUSES.includes(raw["status"] as PropertyStatus) ? (raw["status"] as PropertyStatus) : undefined;
    const mp = Number(raw["maxPrice"]);
    return { status, maxPrice: raw["maxPrice"] != null && Number.isFinite(mp) && mp > 0 ? mp : undefined };
  },
  component: Dashboard,
});

function Dashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const search = Route.useSearch();

  function selectMetric(next: MetricFilter) {
    navigate({ to: "/", search: next, replace: true });
  }

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/login", replace: true });
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="fixed inset-x-0 top-0 z-50 h-12 border-b border-border bg-card">
        <div className="flex h-full items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <LandRadarLogo />
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-70" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
            </span>
          </div>
          <Button variant="ghost" size="sm" onClick={signOut} className="h-8 text-muted-foreground">
            <LogOut className="h-4 w-4" /> Sair
          </Button>
        </div>
      </header>
      <main className="px-4 pt-16">
        <div className="space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Painel OTC</h1>
            <div className="flex flex-col gap-2 sm:flex-row">
              <SyncApifyButton />
              <ManualLotDialog />
            </div>
          </div>
          <MetricsCards current={search} onSelect={selectMetric} />
        </div>
      </main>
    </div>
  );
}
