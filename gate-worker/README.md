# gate-worker

The email gate + viewer log behind the workshop guide. One Cloudflare Worker, one KV namespace. The guide pages (workshop-preview/guide.js) show a name/email gate, then send page-view and checkpoint beacons here. Mari reads the results on a private stats page.

## Local dev

```
cd gate-worker
npx wrangler dev
```

Runs on http://localhost:8787 with a local KV store and the dev stats slug from `.dev.vars` (stats at `/stats-devtest`).

## First production deploy (once)

1. Log in: `npx wrangler login` (or set `CLOUDFLARE_API_TOKEN`).
2. Create the namespace: `npx wrangler kv namespace create LOG` and put the returned id into `wrangler.toml`.
3. Set the private stats slug: `npx wrangler secret put STATS_SLUG` (use a long random string; this becomes Mari's bookmark `https://workshop-gate.<account>.workers.dev/stats-<slug>` — never commit it).
4. Deploy: `npx wrangler deploy`.
5. Put the deployed URL into `GATE.endpoint` in `workshop-preview/guide.js`.

## Notes

- POST bodies are text/plain JSON on purpose — keeps sendBeacon and fetch preflight-free.
- Events live in KV metadata, so the stats page aggregates from `list()` calls without per-key reads (free-tier friendly).
- The gate fails open by design: if this Worker is down, the guide still loads and viewers just aren't logged.
