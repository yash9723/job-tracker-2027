import SEED from "./seed.js";
import { applyStack, enrich } from "./detail.js";

const UA = "Mozilla/5.0 (compatible; JobTracker/1.0; personal job tracker)";
const DAY = 864e5;
const KEEP_DAYS = 14; // drop a listing this long after it last appeared on any source

const CITIES = [
  ["Bangalore", /bengaluru|bangal/i],
  ["Hyderabad", /hyderabad|secunderabad/i],
  ["Chennai", /chennai/i],
  ["Pune", /pune|pimpri/i],
  ["Mumbai", /mumbai|thane/i],
  ["Delhi NCR", /delhi|gurgaon|gurugram|noida|\bncr\b|faridabad|ghaziabad/i],
];
const OTHER = /coimbatore|trivandrum|thiruvananthapuram|surat|kolkata|kochi|ahmedabad|jaipur|lucknow|chandigarh|indore|bhubaneswar|nagpur|vadodara|mysuru|mysore|madurai|visakhapatnam/i;
const ROLE_OK = /software|developer|development|engineer|\bsde\b|\bswe\b|full[- ]?stack|front[- ]?end|react|angular|node|flutter|android|\bios\b|mobile|\bweb\b|\bapp\b|programmer|technical|trainee|\bdata\b|machine learning|\bml\b|\bai\b|devops|cloud|\btest|\bqa\b|sdet|security|cyber|solutions|technology|forward deployed|python|\bjava\b|backend|back[- ]end|golang|\.net|\bphp\b|wordpress|shopify|\bui\b/i;
const ROLE_BAD = /\bhr\b|human resources|marketing|sales|finance|account|content|social media|business development|graphic|video|legal|mechanical|civil|supply chain|operations|data entry|telecall|customer|recruit|talent|health economics|learning (?:deployment|and development|&|specialist)|\bl&d\b|\bmba\b|embedded|hardware|network engineer|\bbim\b|\bcad\b|instructor|mentor|trainer|teacher|product (?:manage|intern)|\bseo\b/i;
const BLOCK = /gateway software|gradtwin/i; // low-stipend mass posters / paid-training schemes

// Role category shown as a filter in the page. First match wins.
export function classify(role) {
  const r = role.toLowerCase();
  if (/full[- ]?stack|\bmern\b|\bmean\b/.test(r)) return "fullstack";
  if (/front[- ]?end|react(?! native)|angular|\bvue\b|javascript|\bui\b|web develop|html|wordpress|shopify/.test(r)) return "frontend";
  if (/flutter|android|\bios\b|mobile|react native|app dev/.test(r)) return "mobile";
  if (/devops|cloud|\bsre\b|infrastructure|security|cyber|platform engineer/.test(r)) return "devops";
  if (/\btest|\bqa\b|sdet|quality/.test(r)) return "qa";
  if (/\bdata\b|machine learning|\bml\b|\bai\b|analytics|\bllm\b|\bnlp\b|scientist|genai/.test(r)) return "data";
  if (/backend|back[- ]end|\bjava\b|python|node|django|spring|golang|\bphp\b|\.net|\bapi\b|server/.test(r)) return "backend";
  return "swe";
}

// Company name -> website domain, used for the logo. Unknown companies fall back to a source-provided logo or an initial.
export const DOMAINS = [
  [/\bgoogle\b/i, "google.com"], [/\bamazon\b/i, "amazon.com"], [/\bmicrosoft\b/i, "microsoft.com"], [/\bapple\b/i, "apple.com"],
  [/\bmeta\b|facebook/i, "meta.com"], [/\bibm\b/i, "ibm.com"], [/\bintuit\b/i, "intuit.com"], [/\bsalesforce\b/i, "salesforce.com"],
  [/\badobe\b/i, "adobe.com"], [/\bcisco\b/i, "cisco.com"], [/\boracle\b/i, "oracle.com"], [/\bsap\b/i, "sap.com"],
  [/\bwalmart\b/i, "walmart.com"], [/^target\b/i, "target.com"], [/\bdeloitte\b/i, "deloitte.com"], [/\bpwc\b|pricewaterhouse/i, "pwc.com"],
  [/^ey\b|ernst/i, "ey.com"], [/\bkpmg\b/i, "kpmg.com"], [/\baccenture\b/i, "accenture.com"], [/\binfosys\b/i, "infosys.com"],
  [/\btcs\b|tata consultancy/i, "tcs.com"], [/\bwipro\b/i, "wipro.com"], [/\bhcl\b/i, "hcltech.com"], [/\bcognizant\b/i, "cognizant.com"],
  [/\bcapgemini\b/i, "capgemini.com"], [/tech mahindra/i, "techmahindra.com"], [/ltimindtree|\blti\b|mindtree/i, "ltimindtree.com"],
  [/larsen|l&t\b/i, "larsentoubro.com"], [/\bhoneywell\b/i, "honeywell.com"], [/siemens gamesa/i, "siemensgamesa.com"], [/\bsiemens\b/i, "siemens.com"],
  [/\bharman\b/i, "harman.com"], [/hp enterprise|\bhpe\b/i, "hpe.com"], [/^hp\b|hewlett/i, "hp.com"], [/\bdell\b/i, "dell.com"],
  [/\bintel\b/i, "intel.com"], [/\bamd\b/i, "amd.com"], [/\bnvidia\b/i, "nvidia.com"], [/\bqualcomm\b/i, "qualcomm.com"],
  [/\bsamsung\b/i, "samsung.com"], [/\bsony\b/i, "sony.com"], [/\bphilips\b/i, "philips.com"], [/ge healthcare/i, "gehealthcare.com"],
  [/\bshell\b/i, "shell.com"], [/\bairbus\b/i, "airbus.com"], [/rolls-?royce/i, "rolls-royce.com"], [/\bslb\b|schlumberger/i, "slb.com"],
  [/\bemerson\b/i, "emerson.com"], [/electronic arts|^ea\b/i, "ea.com"], [/\brubrik\b/i, "rubrik.com"], [/hackerrank/i, "hackerrank.com"],
  [/\bkaleris\b/i, "kaleris.com"], [/\bdelhivery\b/i, "delhivery.com"], [/\bswiggy\b/i, "swiggy.com"], [/\bzomato\b/i, "zomato.com"],
  [/\bflipkart\b/i, "flipkart.com"], [/phonepe/i, "phonepe.com"], [/\bpaytm\b/i, "paytm.com"], [/razorpay/i, "razorpay.com"],
  [/^cred\b/i, "cred.club"], [/\bgroww\b/i, "groww.in"], [/^zeta\b/i, "zeta.tech"], [/\bpostman\b/i, "postman.com"],
  [/browserstack/i, "browserstack.com"], [/\batlassian\b/i, "atlassian.com"], [/\buber\b/i, "uber.com"], [/\bsprinklr\b/i, "sprinklr.com"],
  [/\biqvia\b/i, "iqvia.com"], [/\bfiserv\b/i, "fiserv.com"], [/\bequifax\b/i, "equifax.com"], [/ncr voyix/i, "ncrvoyix.com"],
  [/ntt data/i, "nttdata.com"], [/\bsmarsh\b/i, "smarsh.com"], [/\benterpret\b/i, "enterpret.com"], [/route mobile/i, "routemobile.com"],
  [/cleartax/i, "cleartax.in"], [/^marsh\b/i, "marsh.com"], [/\boutlier\b/i, "outlier.ai"], [/tower research/i, "tower-research.com"],
  [/sharechat/i, "sharechat.com"], [/\brapido\b/i, "rapido.bike"], [/\bvedantu\b/i, "vedantu.com"], [/\bupgrad\b/i, "upgrad.com"],
  [/\blseg\b/i, "lseg.com"], [/american express|\bamex\b/i, "americanexpress.com"], [/jpmorgan|jp morgan/i, "jpmorgan.com"],
  [/goldman/i, "goldmansachs.com"], [/morgan stanley/i, "morganstanley.com"], [/\bbarclays\b/i, "barclays.com"], [/wells fargo/i, "wellsfargo.com"],
  [/\bmastercard\b/i, "mastercard.com"], [/^visa\b/i, "visa.com"], [/\bpaypal\b/i, "paypal.com"], [/servicenow/i, "servicenow.com"],
  [/broadcom|vmware/i, "broadcom.com"], [/\bnutanix\b/i, "nutanix.com"], [/\bnetapp\b/i, "netapp.com"], [/\bcadence\b/i, "cadence.com"],
  [/synopsys/i, "synopsys.com"], [/\bjuspay\b/i, "juspay.in"], [/fortanix/i, "fortanix.com"], [/\bnagarro\b/i, "nagarro.com"],
  [/\bzoho\b/i, "zoho.com"], [/freshworks/i, "freshworks.com"], [/\bmeesho\b/i, "meesho.com"], [/\bnykaa\b/i, "nykaa.com"],
  [/\bmyntra\b/i, "myntra.com"], [/\bola\b/i, "olacabs.com"], [/\bdream11\b/i, "dream11.com"], [/\bunacademy\b/i, "unacademy.com"],
];
export const domainFor = co => (DOMAINS.find(([r]) => r.test(co)) || [])[1] || "";

// 2 = top global MNC, 1 = well-known product company / unicorn, 0 = everyone else. The page ranks higher tiers first.
const TIER1 = /swiggy|zomato|flipkart|phonepe|paytm|razorpay|^cred\b|groww|^zeta\b|postman|browserstack|juspay|meesho|nykaa|myntra|\bola\b|dream11|unacademy|freshworks|zoho|delhivery|cleartax|route mobile|sharechat|rapido|vedantu|upgrad|enterpret|hackerrank|kaleris|smarsh|fortanix|outlier|tower research|nagarro|ncr voyix/i;
export const tierFor = co => (DOMAINS.some(([r]) => r.test(co)) ? (TIER1.test(co) ? 1 : 2) : 0);

const decode = s => s
  .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n))
  .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)))
  .replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&nbsp;/g, " ")
  .replace(/\s+/g, " ").trim();

// null = no location given; [] = a city we do not cover
function cityList(t) {
  const c = CITIES.filter(([, r]) => r.test(t)).map(([n]) => n);
  if (c.length) return c;
  return OTHER.test(t) ? [] : null;
}

// Rough monthly pay in ₹ thousand, for sorting only.
export function payK(s) {
  if (!s) return 0;
  const t = s.replace(/,/g, "");
  const nums = [...t.matchAll(/(\d+(?:\.\d+)?)/g)].map(m => +m[1]);
  if (!nums.length) return 0;
  const max = Math.max(...nums);
  if (/lpa/i.test(t)) return Math.round(max * 100 / 12);
  if (/\/\s*year/i.test(t)) return Math.round(max / 12 / 1000);
  if (/lakh/i.test(t)) return Math.round(max * 100);
  if (/month|stipend/i.test(t)) return Math.round(max / 1000);
  return 0;
}

const hash = s => { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return (h >>> 0).toString(36); };
const norm = u => u.replace(/#.*$/, "").replace(/\/+$/, "").toLowerCase();

// ---- source parsers: each returns [{url, co, role, cities, pay?, type}] ----

export function parseOC(html) {
  const out = [];
  for (const m of html.matchAll(/<h3 class="entry-title[^"]*"><a href="([^"]+)"[^>]*title="([^"]+)"/g)) {
    const title = decode(m[2]);
    const co = title.split(/\s+(?:Internship|Recruitment|Off[- ]Campus|Hiring|Summer|Winter|Walk[- ]?in)\b/i)[0].trim();
    const role = title.slice(co.length)
      .replace(/^\s*(?:Internship|Recruitment|Off[- ]Campus|Hiring|Summer|Winter)?\s*(?:20\d\d)?\s*[–—:|-]?\s*/i, "")
      .replace(/\s*[|–-]\s*(?:Paid Internship|Any Degree)\s*$/i, "")
      .replace(/(?:\s*\|\s*[^|]*(?:bangal|bengaluru|hyderabad|chennai|pune|mumbai|delhi|gurgaon|noida|india|remote|drive)[^|]*)+$/i, "");
    const cities = cityList(title);
    if (cities && !cities.length) continue;
    out.push({ url: m[1], co, role: role || title, cities: cities || ["Multiple"], type: "big" });
  }
  return out;
}

export function parseTJC(html) {
  const out = [];
  for (const b of html.split('<div class="job-listing">').slice(1)) {
    const id = b.match(/job_id=(\d+)/)?.[1];
    const t = b.match(/company-title">([^<]*)</)?.[1];
    if (!id || !t) continue;
    const [co, ...r] = decode(t).split(/\s+is hiring\s+/i);
    const loc = decode(b.match(/Location :<\/strong>([^<]*)</)?.[1] || "");
    const sal = decode(b.match(/Salary :<\/strong>([^<]*)</)?.[1] || "")
      .replace(/\(Stipend\)|\[Expected\]|\(Expected\)/gi, "").replace(/\s+/g, " ").trim();
    const cities = cityList(loc);
    if (cities && !cities.length) continue;
    const lg = b.match(/<img src="([^"]+)"[^>]*class="company-logo"/)?.[1];
    out.push({
      url: `https://thejobcompany.co.in/frontend/job_details.php?job_id=${id}`,
      co, role: r.join(" is hiring ") || decode(t), cities: cities || ["Multiple"],
      pay: sal ? sal + " (exp.)" : "Not shown", type: "big",
      logo: lg ? "https://thejobcompany.co.in/" + lg.replace(/^(?:\.\.\/)+/, "") : "",
    });
  }
  return out;
}

export function parseFO(html) {
  const out = [];
  for (const m of html.matchAll(/<h2 class="entry-title"><a href="([^"]+)"[^>]*>([^<]+)/g)) {
    const t = decode(m[2]);
    const co = t.split(/\s+Off[- ]Campus\b/i)[0].trim();
    const rest = t.slice(co.length).replace(/^\s*Off[- ]Campus\b\s*(?:20\d\d\s*)?(?:Hiring\s*)?(?:Fresher\s*)?(?:For\s*)?(?:Recruitment\s*)?/i, "");
    const parts = rest.split(/\s+\|\s+/);
    const cities = cityList(parts.slice(1).join(" ") || t);
    if (cities && !cities.length) continue;
    out.push({ url: m[1], co, role: parts[0] || rest, cities: cities || ["Multiple"], type: "big" });
  }
  return out;
}

export function parseIS(html, kind) {
  const out = [];
  for (const b of html.split('id="individual_internship_').slice(1)) {
    const href = b.match(/data-href='([^']+)'/)?.[1];
    const title = b.match(/class="job-title-href"[^>]*>([^<]+)</)?.[1];
    const co = b.match(/class="company-name">\s*([^<]*?)\s*</)?.[1];
    if (!href || !title || !co) continue;
    const loc = decode((b.match(/class="row-1-item locations">([\s\S]*?)<!-- \/location/)?.[1] || "").replace(/<[^>]+>/g, " "));
    let cities = cityList(loc);
    if (cities === null) cities = /work from home/i.test(loc) ? ["Multiple"] : [];
    if (!cities.length) continue;
    const name = decode(title);
    const lg = b.match(/class="internship_logo">\s*<img src="([^"]+)"/)?.[1] || "";
    const stip =decode(b.match(/class=['"]stipend['"]>([^<]*)</)?.[1] || "").replace(/₹\s*/g, "₹").replace(/\s*\/\s*/g, " / ");
    out.push({
      url: "https://internshala.com" + href, co: decode(co),
      role: kind === "job" ? `${name} (full-time)` : /intern/i.test(name) ? name : `${name} Intern`,
      cities, pay: stip || "Not shown", type: "startup", logo: /^https:/.test(lg) ? lg : "", src: "internshala",
    });
  }
  return out;
}

const IS_ROLES = "front-end-development,full-stack-development,flutter-development,web-development,mobile-app-development";
const IS_CITIES = ["bangalore", "hyderabad", "chennai", "pune", "mumbai", "delhi"]; // the delhi page already lists Gurgaon and Noida roles
const IS_ALL = IS_CITIES.join(",");
const IS_DATA = "data-science,machine-learning,artificial-intelligence,data-analytics";
const IS_CLOUD = "cloud-computing,devops-engineering,software-testing,cyber-security";
const IS_ROLES_2 ="react-js,node-js,angular-js,javascript,software-development";
const SOURCES = [
  ["https://offcampusjobs4u.com/2027-batch-internships/", parseOC],
  ["https://offcampusjobs4u.com/2027-batch-internships/page/2/", parseOC],
  ["https://thejobcompany.co.in/job-category/batch/2027", parseTJC],
  ["https://www.fresheroffcampus.com/category/2027-batch-jobs/", parseFO],
  ["https://www.fresheroffcampus.com/category/2027-batch-jobs/page/2/", parseFO],
  ...IS_CITIES.map(c => [`https://internshala.com/internships/${IS_ROLES}-internship-in-${c}/`, h => parseIS(h, "internship")]),
  ...IS_CITIES.map(c => [`https://internshala.com/internships/${IS_ROLES_2}-internship-in-${c}/`, h => parseIS(h, "internship")]),
  ...IS_CITIES.map(c => [`https://internshala.com/fresher-jobs/${IS_ROLES.replace(",mobile-app-development", "")}-jobs-in-${c}/`, h => parseIS(h, "job")]),
  ...IS_CITIES.map(c => [`https://internshala.com/fresher-jobs/software-development-jobs-in-${c}/`, h => parseIS(h, "job")]),
  ...IS_CITIES.map(c => [`https://internshala.com/internships/mern-stack-development,java-development,android-app-development,ios-app-development,python-django-internship-in-${c}/`, h => parseIS(h, "internship")]),
  ...IS_CITIES.map(c => [`https://internshala.com/fresher-jobs/mern-stack-development,python-development,java-development,android-app-development,backend-development-jobs-in-${c}/`, h => parseIS(h, "job")]),
  // Wider job titles: one request per group, all six cities at once.
  ...[IS_DATA, IS_CLOUD].flatMap(g => [
    [`https://internshala.com/internships/${g}-internship-in-${IS_ALL}/`, h => parseIS(h, "internship")],
    [`https://internshala.com/fresher-jobs/${g}-jobs-in-${IS_ALL}/`, h => parseIS(h, "job")],
  ]),
];

export async function scrape() {
  const items = [], report = {};
  for (let i = 0; i < SOURCES.length; i += 5) {
    await Promise.all(SOURCES.slice(i, i + 5).map(async ([url, parse]) => {
      try {
        const r = await fetch(url, { headers: { "user-agent": UA, accept: "text/html" } });
        if (!r.ok) throw new Error("HTTP " + r.status);
        const got = parse(await r.text());
        report[url] = got.length;
        items.push(...got);
      } catch (e) { report[url] = "error: " + e.message; }
    }));
  }
  return { items, report };
}

function toJob(x) {
  const p = payK(x.pay);
  return {
    id: "u" + hash(x.url), co: x.co, role: x.role, cities: x.cities, pay: x.pay || "Not shown", p,
    type: /flutter|mobile|android|\bios\b|react native|app dev/i.test(x.role) ? "mobile" : x.type, url: x.url, logo: x.logo || "", src: x.src || "",
  };
}
const keep = j => j.co && ROLE_OK.test(j.role) && !ROLE_BAD.test(j.role) && !BLOCK.test(j.co) && !(j.p > 0 && j.p < 8) && !/unpaid/i.test(j.pay);

const SEED_KEYS = new Set(SEED.map(s => norm(s.url)));

// env.JOBS is a KV namespace (get/put). Returns a summary; never throws on a bad source.
export async function refresh(env) {
  const now = Date.now();
  const prev = JSON.parse((await env.JOBS.get("state")) || "{}");
  const { items, report } = await scrape();
  // Internshala lets anyone register, so a big-company name there is not trusted (could be an impostor).
  const fresh = items.map(toJob).filter(keep).filter(j => !(j.src === "internshala" && tierFor(j.co) === 2));
  const live = new Set(fresh.map(j => norm(j.url)));

  // Every source failing means a block or outage, not zero openings: keep what we had.
  if (live.size < 5) {
    await env.JOBS.put("state", JSON.stringify({ ...prev, report, failedAt: now }));
    return { ok: false, report };
  }

  // Same job listed on two sites (or twice on one) keeps the first copy: key = company + role + first city.
  const dupKey = j => (j.co + "|" + j.role).toLowerCase().replace(/internship|intern|2027|batch|\(full-time\)/g, "").replace(/[^a-z0-9|]/g, "") + "|" + j.cities[0];
  const map = new Map(), dups = new Set();
  for (const s of SEED) { map.set(norm(s.url), { ...s }); dups.add(dupKey(s)); }
  for (const j of fresh) {
    const k = norm(j.url);
    if (map.has(k) || dups.has(dupKey(j))) continue;
    map.set(k, j); dups.add(dupKey(j));
  }

  const seen = {}, first = {}, jobs = [];
  for (const [k, j] of map) {
    seen[k] = live.has(k) ? now : (prev.seen?.[k] ?? now);
    first[k] = prev.first?.[k] ?? (SEED_KEYS.has(k) ? 0 : now);
    if (now - seen[k] > KEEP_DAYS * DAY) continue;
    jobs.push({ ...j, domain: j.domain || domainFor(j.co), cat: classify(j.role), tier: tierFor(j.co), added: first[k] });
  }
  jobs.splice(800);
  // keep the tech stack that enrichment found (new jobs get a title-only guess until their detail is fetched)
  applyStack(jobs, JSON.parse((await env.JOBS.get("details")) || "{}"));

  await env.JOBS.put("jobs", JSON.stringify({ updatedAt: now, jobs }));
  await env.JOBS.put("state", JSON.stringify({ seen, first, report }));
  return { ok: true, total: jobs.length, fresh: fresh.length, report };
}

export default {
  async fetch(req, env) {
    if (new URL(req.url).pathname === "/jobs.json") {
      const body = (await env.JOBS.get("jobs")) ?? JSON.stringify({ updatedAt: null, jobs: SEED });
      return new Response(body, { headers: {
        "content-type": "application/json", "access-control-allow-origin": "*", "cache-control": "public, max-age=300",
      } });
    }
    return new Response("Job tracker refresh worker. Listings are at /jobs.json", { status: 404 });
  },
  // two schedules: the 6-hourly listing refresh, and frequent detail enrichment (offset from :00 so the two never overlap)
  async scheduled(event, env, ctx) { ctx.waitUntil(event.cron === "0 */6 * * *" ? refresh(env) : enrich(env)); },
};
