// Run: node logo-audit.mjs  — fetches each mapped domain's icon and reports its pixel width.
import { DOMAINS } from "./src/index.js";
const w = b => b.length > 24 && b.readUInt32BE(12) === 0x49484452 ? b.readUInt32BE(16) : 0;
const doms = [...new Set(DOMAINS.map(d => d[1]))];
const out = [];
let i = 0;
await Promise.all(Array.from({ length: 8 }, async () => { while (i < doms.length) {
  const d = doms[i++];
  const g = await fetch(`https://t1.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${d}&size=256`).catch(() => null);
  const gw = g && g.ok ? w(Buffer.from(await g.arrayBuffer())) : -1;
  let aw = 0;
  if (gw < 96) { // try the site's own high-res touch icon
    const a = await fetch(`https://${d}/apple-touch-icon.png`, { redirect: "follow", signal: AbortSignal.timeout(8000) }).catch(() => null);
    if (a && a.ok && /png/.test(a.headers.get("content-type") || "")) aw = w(Buffer.from(await a.arrayBuffer()));
  }
  out.push([d, gw, aw]);
} }));
out.sort((a, b) => a[0].localeCompare(b[0]));
console.log("domain, gstatic px (-1 none), apple-touch px");
for (const r of out) console.log(r.join(", "));
