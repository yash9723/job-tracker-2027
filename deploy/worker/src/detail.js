// Job detail pages -> a structured summary + the tech stack.
// Summary only (responsibilities, eligibility, skills, perks, a few facts), never the full copied text:
// the page links to the original posting for the rest.

const UA = "Mozilla/5.0 (compatible; JobTracker/1.0; personal job tracker)";
const DAY = 864e5;

// ---------- tech stack dictionary: [display name, group, pattern] ----------
// groups: fe frontend, be backend, mob mobile, data data/AI, ops cloud/devops, qa testing, cs fundamentals
const STACK = [
  ["React", "fe", /\breact(?:\.?js)?\b(?!\s*native)/i], ["Next.js", "fe", /\bnext\.?js\b/i], ["Angular", "fe", /\bangular(?:js)?\b/i],
  ["Vue", "fe", /\bvue(?:\.?js)?\b/i], ["TypeScript", "fe", /\btypescript\b/i], ["JavaScript", "fe", /\bjavascript\b|\bes6\b/i],
  ["HTML", "fe", /\bhtml5?\b/i], ["CSS", "fe", /\bcss3?\b/i], ["Tailwind", "fe", /\btailwind/i], ["Bootstrap", "fe", /\bbootstrap\b/i],
  ["Redux", "fe", /\bredux\b/i], ["jQuery", "fe", /\bjquery\b/i], ["Figma", "fe", /\bfigma\b/i],
  ["Node.js", "be", /\bnode(?:\.?js)?\b/i], ["Express", "be", /\bexpress(?:\.?js)\b|\bExpress\b/], ["Java", "be", /\bjava\b(?!\s*script)/i],
  ["Spring Boot", "be", /\bspring\s?boot\b|\bspring (?:framework|mvc)\b/i], ["Python", "be", /\bpython\b/i], ["Django", "be", /\bdjango\b/i],
  ["Flask", "be", /\bflask\b/i], ["FastAPI", "be", /\bfast\s?api\b/i], ["Go", "be", /\bgolang\b/i], ["PHP", "be", /\bphp\b/i],
  ["Laravel", "be", /\blaravel\b/i], [".NET", "be", /\basp\.net\b|\.net (?:core|framework|developer|mvc)\b|\bdot ?net\b/i], ["C#", "be", /\bc#/i], ["Ruby on Rails", "be", /\bruby\b|\brails\b/i],
  ["REST APIs", "be", /\brest(?:ful)?\s*apis?\b|\brestful\b/i], ["GraphQL", "be", /\bgraphql\b/i], ["Microservices", "be", /\bmicroservices?\b/i],
  ["WordPress", "be", /\bwordpress\b/i], ["Shopify", "be", /\bshopify\b/i],
  ["Flutter", "mob", /\bflutter\b/i], ["Dart", "mob", /\bdart\b/i], ["Kotlin", "mob", /\bkotlin\b/i], ["Swift", "mob", /\bswift(?:ui)?\b/i],
  ["Android", "mob", /\bandroid\b/i], ["iOS", "mob", /\bios\b/i], ["React Native", "mob", /\breact\s?native\b/i],
  ["SQL", "data", /\bsql\b/i], ["MySQL", "data", /\bmysql\b/i], ["PostgreSQL", "data", /\bpostgres(?:ql)?\b/i], ["MongoDB", "data", /\bmongo(?:db)?\b/i],
  ["Redis", "data", /\bredis\b/i], ["Firebase", "data", /\bfirebase\b/i], ["Oracle DB", "data", /\boracle\b/i], ["Pandas", "data", /\bpandas\b/i],
  ["NumPy", "data", /\bnumpy\b/i], ["TensorFlow", "data", /\btensorflow\b/i], ["PyTorch", "data", /\bpytorch\b/i],
  ["scikit-learn", "data", /\bscikit|\bsklearn\b/i], ["Machine Learning", "data", /\bmachine learning\b|\bml\b/i],
  ["LLMs / GenAI", "data", /\bllms?\b|large language|generative ai|\bgenai\b|\bgen ai\b/i], ["LangChain", "data", /\blangchain\b/i],
  ["Power BI", "data", /\bpower\s?bi\b/i], ["Tableau", "data", /\btableau\b/i],
  ["AWS", "ops", /\baws\b|amazon web services/i], ["Azure", "ops", /\bazure\b/i], ["GCP", "ops", /\bgcp\b|google cloud/i],
  ["Docker", "ops", /\bdocker\b/i], ["Kubernetes", "ops", /\bkubernetes\b|\bk8s\b/i], ["CI/CD", "ops", /\bci\s?\/\s?cd\b|\bjenkins\b|github actions/i],
  ["Linux", "ops", /\blinux\b/i], ["Git", "ops", /\bgit\b|\bgithub\b|\bgitlab\b/i], ["Terraform", "ops", /\bterraform\b/i],
  ["Selenium", "qa", /\bselenium\b/i], ["Cypress", "qa", /\bcypress\b/i], ["Jest", "qa", /\bjest\b/i], ["Postman", "qa", /\bpostman\b/i],
  ["RestAssured", "qa", /\brest\s?assured\b/i], ["Manual testing", "qa", /\bmanual testing\b/i],
  ["DSA", "cs", /data structures?|\bdsa\b|algorithms/i], ["OOP", "cs", /\boops?\b|object[- ]oriented/i], ["C++", "cs", /c\+\+/i],
  ["C", "cs", /\bc programming\b|\bc language\b/i], ["DBMS", "cs", /\bdbms\b/i],
];
// Postman is also a company name; only count it as a tool when the text is not about the company itself
const NOT_TOOL = { Postman: /postman (?:is|inc|platform|team)/i };

// Stack in dictionary order (frontend first), capped. `skills` are explicit skill tags from the posting.
export function extractStack(text, skills = [], cap = 10) {
  const hay = [text || "", ...skills].join(" \n ");
  const out = [];
  for (const [name, group, re] of STACK) {
    if (out.length >= cap) break;
    if (re.test(hay) && !(NOT_TOOL[name] && NOT_TOOL[name].test(hay))) out.push([name, group]);
  }
  // "React" and "React Native" both match "React Native" text: keep only React Native then
  if (out.some(([n]) => n === "React Native") && !/\breact(?:\.?js)?\b(?!\s*native)/i.test(hay)) return out.filter(([n]) => n !== "React");
  return out;
}

// ---------- text helpers ----------
const decode = s => s
  .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n))
  .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)))
  .replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&nbsp;/g, " ")
  .replace(/&rsquo;|&lsquo;/g, "'").replace(/&rdquo;|&ldquo;/g, '"').replace(/&middot;/g, "·").replace(/&ndash;|&mdash;/g, "–")
  .replace(/\s+/g, " ").trim();
const clip = (s, n) => (s.length > n ? s.slice(0, n - 1).replace(/\s+\S*$/, "") + "…" : s);

// HTML -> lines; headings are prefixed with § so sections can be split.
function toLines(h) {
  return h.replace(/<(script|style|noscript|svg|form|button)[\s\S]*?<\/\1>/gi, "")
    .replace(/<a [^>]*href="#[^"]*"[^>]*>[\s\S]*?<\/a>/gi, "") // table-of-contents anchors
    .replace(/<h[1-6][^>]*>/gi, "\n§").replace(/<\/h[1-6]>/gi, "\n")
    .replace(/<li[^>]*>/gi, "\n• ").replace(/<(?:br|\/p|\/div|\/li|\/tr|\/ul|\/ol|\/section)[^>]*>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .split("\n").map(decode).filter(s => s && s !== "•");
}
const PROMO = /whatsapp|telegram|instagram|click here|join our (?:official|whatsapp|telegram|channel|group|community)|udemy|subscribe|share (?:with|your)|offcampusjobs4u|fresheroffcampus|thejobcompany|follow us|job alert|apply link|disclaimer|^table of contents|^toggle$/i;

// Split numbered paragraphs ("1. Do X 2. Do Y") into bullets.
function bullets(lines, max = 6, min = 14) {
  return lines
    .flatMap(l => l.split(/\s(?=\d{1,2}[.)]\s)/))
    .map(s => s.replace(/^[•\-–*]\s*/, "").replace(/^\d{1,2}[.)]\s*/, "").trim())
    .filter(s => s.length >= min && !PROMO.test(s) && !/:$/.test(s)) // "...responsibilities include:" intro lines
    .slice(0, max).map(s => clip(s, 220));
}

const FACT = /^(job title|job type|location|experience|salary|stipend|ctc|batch|eligible batch|qualification|education|duration|start date|openings|number of openings|notice period|level|job location|degree)\s*[:\-–]\s*(.{1,100})$/i;
const blank = () => ({ about: [], eligibility: [], skills: [], perks: [], facts: {}, company: "", official: "" });

const ATS = /myworkdayjobs|workday|greenhouse|lever\.co|smartrecruiters|icims|taleo|successfactors|oraclecloud|ashbyhq|naukri\.com|linkedin\.com\/jobs|forms\.gle|docs\.google\.com\/forms|smartsheet|careers?[.\/]|\/careers?\b|jobs\.|\/jobs?\//i;
const NOT_OFFICIAL = /udemy|bit\.ly|trk\.|t\.me|whatsapp|facebook|instagram|twitter|x\.com|youtube|linkedin\.com\/(?:share|company|in\/)|fontawesome|googleapis|gstatic|offcampusjobs4u|fresheroffcampus|thejobcompany|internshala|amazon\.(?:in|com)\/(?:dp|gp)/i;
function officialLink(html) {
  for (const m of html.matchAll(/href="(https?:\/\/[^"]+)"/g)) {
    const u = m[1].replace(/&amp;/g, "&");
    if (!NOT_OFFICIAL.test(u) && ATS.test(u)) return u;
  }
  return "";
}

// Heading -> which part of the summary it feeds.
const BUCKETS = [
  ["skip", /table of contents|how to (?:apply|prepare)|faq|frequently|important points|check out|more (?:off|jobs)|join our|share|related|disclaimer|instant job|alerts|toggle|interview (?:process|questions)|selection process|salary details/i],
  ["skills", /skill|technolog|tech stack|tools/i],
  ["eligibility", /eligib|qualification|who can apply|requirement|education|criteria|what we look|must have|preferred|you (?:should|will) have|candidate profile/i],
  ["perks", /perk|benefit|why join|what we offer|compensation|stipend/i],
  ["company", /^about (?!the (?:role|job|internship|position))/i],
  ["about", /responsib|description|\brole\b|about the|what you|job details|overview|day-to-day|internship|position|duties|work on/i],
];
const bucketOf = h => (BUCKETS.find(([, re]) => re.test(h)) || ["skip"])[0];

// ---------- per-source parsers ----------
export function parseISDetail(html) {
  const d = blank();
  for (const part of html.split(/class="section_heading[^"]*"[^>]*>/).slice(1)) {
    const lt = part.indexOf("<");
    const h = decode(part.slice(0, lt)), body = part.slice(lt, lt + 8000);
    const tabs = [...body.matchAll(/class="round_tabs"[^>]*>([^<]+)</g)].map(m => decode(m[1])).filter(Boolean);
    const lines = toLines(body).filter(l => !/^(?:apply now|show more|read more|see more)$/i.test(l));
    if (/about the (?:internship|job|work)/i.test(h)) d.about = bullets(lines);
    else if (/skill/i.test(h)) d.skills = tabs.slice(0, 14);
    else if (/who can apply|other requirements/i.test(h)) d.eligibility.push(...bullets(lines, 4, 10));
    else if (/perks/i.test(h)) d.perks = (tabs.length ? tabs : bullets(lines, 4, 3)).slice(0, 6);
    else if (/number of openings/i.test(h)) { if (lines[0]) d.facts.openings = clip(lines[0], 20); }
    else if (/^about /i.test(h) && !d.company) d.company = clip(lines.slice(0, 3).join(" "), 300);
  }
  d.eligibility = d.eligibility.slice(0, 5);
  return d;
}

export function parseWPDetail(html) {
  const d = blank();
  const start = Math.max(html.indexOf("td-post-content"), html.indexOf("entry-content"));
  if (start < 0) return d;
  let end = html.length;
  for (const mk of ["td-post-sharing", "jp-relatedposts", "sharedaddy", "</article>"]) { // not heading text: it also appears in the table of contents
    const i = html.indexOf(mk, start + 200);
    if (i > 0 && i < end) end = i;
  }
  const content = html.slice(start, Math.min(end, start + 80000));
  d.official = officialLink(content);
  let bucket = "about", intro = true;
  const pools = { about: [], eligibility: [], skills: [], perks: [], company: [] };
  for (let line of toLines(content.slice(content.indexOf(">") + 1))) {
    if (PROMO.test(line)) continue;
    // "Job Description :" style headings inside paragraphs
    const asHeading = line.startsWith("§") ? line.slice(1).trim() : (/^[A-Z][^.]{2,58}\s?:$/.test(line) ? line.replace(/\s?:$/, "") : null);
    if (asHeading !== null) { bucket = bucketOf(asHeading); intro = false; continue; }
    const f = line.match(FACT);
    if (f) { const key = f[1].toLowerCase().replace(/^(job |eligible |number of )/, ""); d.facts[key] = clip(f[2], 80); continue; }
    if (bucket === "skip") continue;
    if (intro && line.length < 60) continue; // post title / breadcrumbs before the first heading
    pools[bucket].push(line);
  }
  d.about = bullets(pools.about);
  d.eligibility = bullets(pools.eligibility, 5, 10);
  d.skills = bullets(pools.skills, 10, 2).map(s => clip(s, 80));
  d.perks = bullets(pools.perks, 4, 6);
  d.company = clip(pools.company.slice(0, 3).join(" "), 300);
  return d;
}

export function parseTJCDetail(html) {
  const d = blank();
  const lines = toLines(html);
  const i = lines.findIndex(l => /^job description$/i.test(l.replace(/^§/, "")));
  if (i < 0) return d;
  const body = [];
  for (const l of lines.slice(i + 1)) {
    if (/^§?(similar jobs|related jobs|latest jobs|disclaimer|apply now|share this|copyright)/i.test(l)) break;
    if (!l.startsWith("§") && !PROMO.test(l)) body.push(l);
  }
  d.about = bullets(body, 6, 30);
  d.official = officialLink(html);
  return d;
}

export function parseGenericDetail(html) {
  const d = blank();
  const m = html.match(/<(main|article)[\s\S]*?<\/\1>/i);
  d.about = bullets(toLines(m ? m[0] : html).filter(l => l.length >= 50 && !l.startsWith("§")), 5, 50);
  return d;
}

export async function fetchDetail(url) {
  try {
    const r = await fetch(url, { headers: { "user-agent": UA, accept: "text/html" }, signal: AbortSignal.timeout(15000) });
    if (!r.ok) return null;
    const html = await r.text(), host = new URL(url).hostname;
    const src = /internshala/.test(host) ? "internshala" : /offcampusjobs4u|fresheroffcampus/.test(host) ? "post" : /thejobcompany/.test(host) ? "tjc" : "page";
    const d = src === "internshala" ? parseISDetail(html) : src === "post" ? parseWPDetail(html) : src === "tjc" ? parseTJCDetail(html) : parseGenericDetail(html);
    if (!d.about.length && !d.skills.length && !d.eligibility.length) return null;
    return { ...d, src, host: host.replace(/^www\./, "") };
  } catch (e) { return null; }
}

// Text the stack is read from: the summary plus the job title.
const textOf = (j, d) => [j.role, ...(d ? [...d.about, ...d.eligibility, ...d.skills] : [])].join(" \n ");

// Give every job its `stack`; jobs without a parsed detail get a title-only guess (`stackGuess`).
export function applyStack(jobs, details) {
  for (const j of jobs) {
    const d = details[j.id];
    const real = d && !d.none;
    j.stack = extractStack(textOf(j, real ? d : null), real ? d.skills : []);
    j.hasDesc = !!real;
    j.stackGuess = !real;
  }
}

async function pool(items, n, fn) {
  let i = 0;
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, async () => { while (i < items.length) await fn(items[i++]); }));
}

// Fetch details for up to `limit` jobs that have none (or a stale one). One KV write per key, only when something changed.
export async function enrich(env, limit = 40) {
  const doc = JSON.parse((await env.JOBS.get("jobs")) || "null");
  if (!doc) return { ok: false, reason: "no jobs yet" };
  const details = JSON.parse((await env.JOBS.get("details")) || "{}");
  const now = Date.now();
  const due = d => !d || now - d.at > (d.none ? DAY : 7 * DAY); // failed fetches retry after a day
  const todo = doc.jobs.filter(j => due(details[j.id])).slice(0, limit);
  let changed = 0, found = 0;
  await pool(todo, 6, async j => {
    const d = await fetchDetail(j.url);
    details[j.id] = d ? { ...d, at: now } : { none: true, at: now };
    changed++; if (d) found++;
  });
  const ids = new Set(doc.jobs.map(j => j.id));
  for (const k of Object.keys(details)) if (!ids.has(k)) { delete details[k]; changed++; }
  if (!changed) return { ok: true, changed: 0 };
  applyStack(doc.jobs, details);
  await env.JOBS.put("details", JSON.stringify(details));
  await env.JOBS.put("jobs", JSON.stringify(doc));
  return { ok: true, changed, found, missing: doc.jobs.filter(j => due(details[j.id])).length };
}
