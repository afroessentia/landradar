import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { triggerApifySync } from "@/lib/apify-sync.functions";
import { propertyKeys } from "@/hooks/use-properties";

export function SyncApifyButton() {
  const qc = useQueryClient();
  const sync = useServerFn(triggerApifySync);

  const mutation = useMutation({
    mutationFn: () => sync({ data: {} }),
    onSuccess: (res) => {
      if (!res.started || res.started.length === 0) {
        toast.info("Nenhum condado com Task do Apify configurada ainda.");
        return;
      }
      toast.success("Coleta iniciada. Os lotes chegam em alguns minutos.");
      const refresh = () => qc.invalidateQueries({ queryKey: propertyKeys.all });
      setTimeout(refresh, 60_000);
      setTimeout(refresh, 180_000);
    },
    onError: (err) => toast.error(`Erro ao sincronizar: ${err instanceof Error ? err.message : String(err)}`),
  });

  return (
    <Button size="sm" variant="outline" disabled={mutation.isPending} onClick={() => mutation.mutate()} className="h-8">
      {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
      Sincronizar Apify
    </Button>
  );
}
