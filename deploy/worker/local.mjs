// Run: node local.mjs
// Checks payK, runs one real refresh against the live sources with an in-memory KV,
// and writes out/jobs.json + out/state.json so they can be uploaded to KV for the first load.
import fs from "node:fs";
import assert from "node:assert";
import { refresh, payK } from "./src/index.js";

assert.equal(payK("₹18,000 - 24,000 / month"), 24);
assert.equal(payK("6-7 LPA (exp.)"), 58);
assert.equal(payK("₹4,00,000 - 6,00,000 / year"), 50);
assert.equal(payK("1.5 - 1.8 Lakhs /Month (exp.)"), 180);
assert.equal(payK("Not shown"), 0);

const store = new Map();
const env = { JOBS: { get: async k => store.get(k) ?? null, put: async (k, v) => void store.set(k, v) } };
const res = await refresh(env);
console.log(JSON.stringify(res, null, 1));
assert.ok(res.ok, "refresh failed: every source returned too little");

const { jobs } = JSON.parse(store.get("jobs"));
const fresh = jobs.filter(j => j.added);
console.log(`total ${jobs.length}, new this run ${fresh.length}`);
for (const j of fresh.slice(0, 25)) console.log(`${j.type.padEnd(8)} ${j.cities.join("/").padEnd(18)} ${j.co} | ${j.role} | ${j.pay}`);

fs.mkdirSync("out", { recursive: true });
fs.writeFileSync("out/jobs.json", store.get("jobs"));
fs.writeFileSync("out/state.json", store.get("state"));
