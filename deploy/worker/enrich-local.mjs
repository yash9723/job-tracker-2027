// Run after `node local.mjs`:  node enrich-local.mjs
// Checks the detail parsers on one listing per source, then enriches every job and writes
// out/details.json + out/jobs.json for upload to KV (so the site has descriptions before the cron catches up).
import fs from "node:fs";
import assert from "node:assert";
import { enrich, extractStack, fetchDetail } from "./src/detail.js";

// stack extraction sanity
const names = s => extractStack(s).map(([n]) => n);
assert.deepEqual(names("React Native app with Firebase"), ["React Native", "Firebase"]);
assert.ok(names("Build REST APIs in Node.js and MongoDB").includes("Node.js"));
assert.ok(!names("the rest of the team in spring").includes("REST APIs"));
assert.ok(!names("the rest of the team in spring").includes("Spring Boot"));

// one listing per source
const samples = {
  internshala: "https://internshala.com/internship/detail/full-stack-development-internship-in-bangalore-at-euphotic-labs-private-limited1790420869",
  offcampus: "https://offcampusjobs4u.com/ea-internship-2026-ai-full-stack-intern-hyderabad/",
  fresheroffcampus: "https://www.fresheroffcampus.com/deloitte-off-campus-3/",
  thejobcompany: "https://thejobcompany.co.in/frontend/job_details.php?job_id=6497",
};
for (const [name, url] of Object.entries(samples)) {
  const d = await fetchDetail(url);
  assert.ok(d && d.about.length, `${name}: no responsibilities parsed`);
  const st = extractStack([...d.about, ...d.eligibility, ...d.skills].join(" "), d.skills).map(([n]) => n);
  console.log(`\n== ${name}: ${d.about.length} about, ${d.eligibility.length} eligibility, ${d.skills.length} skills, ${d.perks.length} perks, official=${d.official || "-"}`);
  console.log("   stack:", st.join(", "));
  console.log("   first:", d.about[0]);
  if (name === "internshala") assert.ok(st.includes("React") && st.includes("Node.js"), "internshala stack");
  if (name === "offcampus") assert.ok(/ea\.com/.test(d.official), "EA official link");
  if (name === "fresheroffcampus") assert.ok(/deloitte/.test(d.official), "Deloitte official link");
}

// full run over every job
const store = new Map([["jobs", fs.readFileSync("out/jobs.json", "utf8")]]);
const env = { JOBS: { get: async k => store.get(k) ?? null, put: async (k, v) => void store.set(k, v) } };
const res = await enrich(env, 9999);
const { jobs } = JSON.parse(store.get("jobs"));
const details = JSON.parse(store.get("details"));
const bySrc = {};
for (const d of Object.values(details)) bySrc[d.none ? "none" : d.src] = (bySrc[d.none ? "none" : d.src] || 0) + 1;
console.log("\nenrich:", res, "\nby source:", bySrc);
console.log("jobs with description:", jobs.filter(j => j.hasDesc).length, "/", jobs.length,
  "| with stack:", jobs.filter(j => j.stack.length).length, "| official links:", Object.values(details).filter(d => d.official).length);
console.log("no description:", jobs.filter(j => !j.hasDesc).map(j => j.co).join(", "));
assert.ok(jobs.filter(j => j.hasDesc).length / jobs.length > .8, "fewer than 80% of jobs got a description");
fs.writeFileSync("out/details.json", store.get("details"));
fs.writeFileSync("out/jobs.json", store.get("jobs"));
console.log("details size:", (store.get("details").length / 1024).toFixed(0), "KB");
