// GET /api/detail/<jobId>: the parsed summary (responsibilities, eligibility, skills, perks, facts, official link)
// the refresh Worker stored in KV `details`. 404 when that job has not been enriched yet.
let cache = null, cachedAt = 0; // parsed map, reused by this isolate for 5 minutes

export async function onRequestGet({ params, env }) {
  const id = String(params.id || "");
  const json = (body, status = 200, maxAge = 600) =>
    new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", "cache-control": `public, max-age=${maxAge}` } });
  if (!/^[a-z0-9-]{1,40}$/i.test(id)) return json({ error: "bad id" }, 400, 60);
  if (!cache || Date.now() - cachedAt > 300000) {
    cache = JSON.parse((await env.JOBS.get("details")) || "{}");
    cachedAt = Date.now();
  }
  const d = cache[id];
  return !d || d.none ? json({ none: true }, 404, 120) : json(d);
}
