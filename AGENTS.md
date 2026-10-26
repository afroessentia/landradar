<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Brand mark

- The product brand mark lives in `src/components/LandRadarLogo.tsx` and is the single source for the logo in the navbar and the login screen; keep the app icon as `public/favicon.svg`, referenced from the root route's `head()` in `src/routes/__root.tsx` (this stack has no `index.html`, so tab title, description and favicon all belong in that `head()`).

## OTC data

- Keep OTC records in `otc_properties`, county configuration in `counties_states`, and enriched reads in the security-invoker `v_properties` view; this preserves the supplied shared authenticated-access model and derived links without duplicating data.

## Apify integration

- Apify webhook ingest lives at the server route `src/routes/api/public/ingest-lots.ts` (verified by `x-webhook-secret`) and manual sync is the authenticated server fn in `src/lib/apify-sync.functions.ts`; this stack does not use new Supabase Edge Functions.
