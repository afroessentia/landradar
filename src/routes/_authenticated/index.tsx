import { useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { LogOut, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { supabase } from "@/integrations/supabase/client";
import { LandRadarLogo } from "@/components/LandRadarLogo";
import { MetricsCards } from "@/components/dashboard/MetricsCards";
import { SyncApifyButton } from "@/components/dashboard/SyncApifyButton";
import { ManualLotDialog } from "@/components/dashboard/ManualLotDialog";
import { FiltersPanel } from "@/components/dashboard/FiltersPanel";
import { ResultsCounter } from "@/components/dashboard/ResultsCounter";
import { changeFilters, searchToFilters, validateFilterSearch } from "@/lib/filters-url";
import type { PropertyFilters } from "@/types/property";

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({
    meta: [
      { title: "Dashboard — LandRadar | OTC Intelligence Terminal" },
      { name: "description", content: "Sistema de inteligência para aquisição remota de terrenos OTC nos EUA" },
      { property: "og:title", content: "Dashboard — LandRadar" },
      { property: "og:description", content: "Sistema de inteligência para aquisição remota de terrenos OTC nos EUA" },
    ],
  }),
  validateSearch: (raw: Record<string, unknown>) => validateFilterSearch(raw),
  component: Dashboard,
});

function Dashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const search = Route.useSearch();
  const filters = useMemo(() => searchToFilters(search), [search]);
  const [mobileOpen, setMobileOpen] = useState(false);

  function updateFilters(patch: Partial<PropertyFilters>) {
    navigate({ to: "/", search: changeFilters(filters, patch), replace: true });
  }
  function resetFilters() {
    navigate({ to: "/", search: {}, replace: true });
  }

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/login", replace: true });
  }

  const panel = <FiltersPanel filters={filters} onChange={updateFilters} onReset={resetFilters} />;

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
      <main className="px-4 pb-6 pt-16">
        <div className="space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Painel OTC</h1>
            <div className="flex flex-col gap-2 sm:flex-row">
              <SyncApifyButton />
              <ManualLotDialog />
            </div>
          </div>
          <MetricsCards filters={filters} onChange={updateFilters} />

          <div className="flex flex-col gap-3 lg:flex-row lg:items-start">
            <aside className="hidden w-64 shrink-0 rounded-md border border-border bg-card p-3 lg:sticky lg:top-16 lg:block">
              {panel}
            </aside>
            <Collapsible open={mobileOpen} onOpenChange={setMobileOpen} className="lg:hidden">
              <CollapsibleTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 w-full">
                  <SlidersHorizontal className="h-4 w-4" /> Filtros
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2 rounded-md border border-border bg-card p-3">{panel}</CollapsibleContent>
            </Collapsible>

            <section className="min-w-0 flex-1 space-y-2">
              <div className="rounded-md border border-border bg-card px-3 py-2">
                <ResultsCounter filters={filters} />
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
