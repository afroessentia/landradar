import { createFileRoute } from "@tanstack/react-router";

// Webhook do Apify (substitui a Edge Function "ingest-lots"; mesma lógica).
// Protegido pelo header x-webhook-secret.

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const num = (v: unknown): number | null => {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(String(v).replace(/[^0-9.\-]/g, ""));
  return Number.isFinite(n) ? n : null;
};

const txt = (v: unknown): string | null => {
  const s = (v ?? "").toString().trim();
  return s ? s : null;
};

const inRange = (n: number | null, min: number, max: number): number | null =>
  n !== null && n >= min && n <= max ? n : null;

const safeEqual = (a: string, b: string): boolean => {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
};

export const Route = createFileRoute("/api/public/ingest-lots")({
  server: {
    handlers: {
      GET: async () => json({ error: "Method not allowed" }, 405),
      POST: async ({ request }) => {
        const secret = process.env["WEBHOOK_SECRET"];
        const apifyToken = process.env["APIFY_TOKEN"];
        if (!secret || !apifyToken) return json({ error: "Servidor nao configurado" }, 500);

        const provided = request.headers.get("x-webhook-secret") ?? "";
        if (!safeEqual(provided, secret)) return json({ error: "Unauthorized" }, 401);

        let body: any;
        try {
          body = await request.json();
        } catch {
          return json({ error: "JSON invalido" }, 400);
        }

        if (body?.eventType && body.eventType !== "ACTOR.RUN.SUCCEEDED") {
          return json({ ignored: true, eventType: body.eventType });
        }

        const resource = body?.resource ?? {};
        const datasetId: string | undefined = resource.defaultDatasetId ?? body?.datasetId;
        const taskId: string | undefined = resource.actorTaskId ?? body?.taskId;
        if (!datasetId || !taskId) return json({ error: "datasetId/taskId ausente" }, 400);

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const supabase = supabaseAdmin as any;

        const { data: county, error: cErr } = await supabase
          .from("counties_states")
          .select("id, portal_buy_url")
          .eq("apify_task_id", taskId)
          .eq("is_active", true)
          .maybeSingle();
        if (cErr || !county) {
          return json({ error: "Condado nao mapeado para este task", taskId }, 404);
        }

        const items: any[] = [];
        const PAGE = 1000;
        for (let offset = 0; offset < 10000; offset += PAGE) {
          const res = await fetch(
            `https://api.apify.com/v2/datasets/${datasetId}/items?clean=true&format=json&limit=${PAGE}&offset=${offset}`,
            { headers: { Authorization: `Bearer ${apifyToken}` } },
          );
          if (!res.ok) return json({ error: `Apify dataset error ${res.status}` }, 502);
          const page = await res.json();
          items.push(...page);
          if (page.length < PAGE) break;
        }

        const seen = new Set<string>();
        const rows: Record<string, unknown>[] = [];
        for (const it of items) {
          const parcel = txt(it.parcel_id ?? it.apn);
          if (!parcel || seen.has(parcel)) continue;
          seen.add(parcel);
          rows.push({
            county_state_id: county.id,
            parcel_id: parcel,
            legal_description: txt(it.legal_description),
            subdivision: txt(it.subdivision),
            acreage: num(it.acreage),
            otc_price: num(it.otc_price),
            latitude: inRange(num(it.latitude), -90, 90),
            longitude: inRange(num(it.longitude), -180, 180),
            direct_buy_url: txt(it.direct_buy_url) ?? county.portal_buy_url,
            raw_payload: it,
          });
        }

        if (rows.length === 0) {
          return json({ received: items.length, unique_in_batch: 0, inserted: 0 });
        }

        let inserted = 0;
        for (let i = 0; i < rows.length; i += 500) {
          const chunk = rows.slice(i, i + 500);
          const { data, error } = await supabase
            .from("otc_properties")
            .upsert(chunk, { onConflict: "county_state_id,parcel_id", ignoreDuplicates: true })
            .select("id");
          if (error) return json({ error: error.message, inserted_before_error: inserted }, 500);
          inserted += data?.length ?? 0;
        }

        return json({
          received: items.length,
          unique_in_batch: rows.length,
          inserted,
          skipped_existing: rows.length - inserted,
        });
      },
    },
  },
});
