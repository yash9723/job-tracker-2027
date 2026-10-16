// Run: node check-links.mjs   (reads out/jobs.json, prints dead/suspect apply links)
import fs from "node:fs";
const jobs = JSON.parse(fs.readFileSync("out/jobs.json", "utf8")).jobs;
const UA = "Mozilla/5.0 (compatible; JobTracker/1.0)";
const CLOSED = /no longer accepting|applications? (?:are |is )?closed|has (?:been )?closed|has expired|expired|position (?:has been )?filled|no longer available|job not found|page not found|this internship is closed|this job is closed/i;
async function check(j) {
  try {
    const r = await fetch(j.url, { headers: { "user-agent": UA, accept: "text/html" }, redirect: "follow", signal: AbortSignal.timeout(25000) });
    const t = r.ok ? (await r.text()).slice(0, 400000) : "";
    if (!r.ok) return { j, bad: `HTTP ${r.status}` };
    const m = /internshala\.com\/(?:internship|job)\/detail/.test(j.url) && !/\/(?:internship|job)\/detail\//.test(r.url) ? "redirected away: " + r.url : "";
    if (m) return { j, bad: m };
    const hit = t.match(CLOSED);
    return { j, ok: true, warn: hit ? "text: " + hit[0] : "", final: r.url };
  } catch (e) { return { j, bad: "error " + e.message }; }
}
const res = []; let i = 0;
await Promise.all(Array.from({ length: 8 }, async () => { while (i < jobs.length) res.push(await check(jobs[i++])); }));
const bad = res.filter(r => r.bad), warn = res.filter(r => r.warn);
console.log(`checked ${res.length}: ok ${res.length - bad.length}, dead ${bad.length}, suspicious text ${warn.length}`);
for (const r of bad) console.log("DEAD", r.bad, "|", r.j.co, "|", r.j.role, "|", r.j.url);
for (const r of warn) console.log("WARN", r.warn, "|", r.j.co, "|", r.j.role, "|", r.j.url);
fs.writeFileSync("out/link-report.json", JSON.stringify({ dead: bad.map(r => r.j.url), warn: warn.map(r => r.j.url) }));
