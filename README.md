# 2027 Fresher Job Tracker

Frontend, full stack and Flutter openings for the 2027 batch in Tier 1 Indian cities, with a status tracker, job details, tech stack and an interactive globe.

Live: https://job-tracker-2027.pages.dev

## Layout
- `deploy/site` – Cloudflare Pages site (`public/`) and Pages Functions (`functions/`: `/api/jobs`, `/api/detail/:id`, `/logo/:domain`).
- `deploy/worker` – cron Worker that scrapes listings every 6 hours and enriches job details every 15 minutes, writing to the `JOBS` KV namespace.
- `deploy/tools` – one-off generators for the globe's land map (`land.js`).

## Deploy
```bash
cd deploy/worker && npx wrangler deploy
cd deploy/site && npx wrangler pages deploy --project-name job-tracker-2027 --branch main
```

## Seed KV locally
```bash
cd deploy/worker && node local.mjs && node enrich-local.mjs
```
Then upload `out/jobs.json`, `out/state.json` and `out/details.json` with `wrangler kv key put`.
