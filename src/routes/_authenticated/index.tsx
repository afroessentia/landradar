import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({
    meta: [
      { title: "Dashboard — US Land OTC Hunter" },
      { name: "description", content: "Terminal de oportunidades de terrenos OTC nos EUA." },
      { property: "og:title", content: "Dashboard — US Land OTC Hunter" },
      { property: "og:description", content: "Terminal de oportunidades de terrenos OTC nos EUA." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

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
            <span className="text-sm font-semibold tracking-[0.18em] text-foreground">
              US LAND OTC HUNTER
            </span>
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
        <div className="rounded-md border border-border bg-card p-4 text-sm text-muted-foreground">
          Dashboard em construção
        </div>
      </main>
    </div>
  );
}
