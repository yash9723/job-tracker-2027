// Serves the listings the scheduled Worker stores in KV.
export async function onRequestGet({ env }) {
  const body = (await env.JOBS.get("jobs")) ?? JSON.stringify({ updatedAt: null, jobs: [] });
  return new Response(body, { headers: { "content-type": "application/json", "cache-control": "public, max-age=300" } });
}
