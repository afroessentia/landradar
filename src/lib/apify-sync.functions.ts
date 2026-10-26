import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Substitui a Edge Function "trigger-apify-sync"; mesma lógica, exige usuário logado (RLS aplica).
export const triggerApifySync = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { county_state_id?: string } | undefined) => input ?? {})
  .handler(async ({ data, context }) => {
    const apifyToken = process.env["APIFY_TOKEN"];
    if (!apifyToken) throw new Error("APIFY_TOKEN nao configurado");

    const supabase = context.supabase as any;
    let q = supabase
      .from("counties_states")
      .select("id, county_name, apify_task_id")
      .eq("is_active", true)
      .not("apify_task_id", "is", null);
    if (typeof data.county_state_id === "string") q = q.eq("id", data.county_state_id);

    const { data: counties, error } = await q;
    if (error) throw new Error(error.message);
    if (!counties || counties.length === 0) {
      return { started: [], message: "Nenhum condado com apify_task_id configurado" };
    }

    const started = await Promise.all(
      counties.map(async (c: { county_name: string; apify_task_id: string }) => {
        const r = await fetch(`https://api.apify.com/v2/actor-tasks/${c.apify_task_id}/runs`, {
          method: "POST",
          headers: { Authorization: `Bearer ${apifyToken}` },
        });
        return { county: c.county_name, task: c.apify_task_id, ok: r.ok };
      }),
    );

    return { started, message: undefined as string | undefined };
  });
