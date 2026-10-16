// Serves a company logo at /logo/<domain>, cached at the edge. The visitor's browser never contacts the logo sources.
// Order: Simple Icons (crisp brand vector, for companies it carries) -> icon.horse (large site icon) -> Google favicon.
// Unknown domains return 404 so the page shows the company initial instead.
const HOST = /^(?=.{4,80}$)[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/;

// domain -> Simple Icons slug, only for slugs checked to exist
const SLUG = {
  "accenture.com": "accenture", "airbus.com": "airbus", "amd.com": "amd", "apple.com": "apple", "atlassian.com": "atlassian",
  "cisco.com": "cisco", "dell.com": "dell", "google.com": "google", "infosys.com": "infosys", "intel.com": "intel",
  "intuit.com": "intuit", "mastercard.com": "mastercard", "meta.com": "meta", "nvidia.com": "nvidia", "paypal.com": "paypal",
  "paytm.com": "paytm", "phonepe.com": "phonepe", "qualcomm.com": "qualcomm", "razorpay.com": "razorpay", "samsung.com": "samsung",
  "sap.com": "sap", "shell.com": "shell", "siemens.com": "siemens", "sony.com": "sony", "swiggy.com": "swiggy",
  "target.com": "target", "tcs.com": "tcs", "uber.com": "uber", "visa.com": "visa", "wipro.com": "wipro", "zomato.com": "zomato",
  "goldmansachs.com": "goldmansachs", "hp.com": "hp",
};
const ok = r => r && r.ok;

async function source(domain) {
  const slug = SLUG[domain];
  if (slug) {
    const r = await fetch(`https://cdn.simpleicons.org/${slug}`).catch(() => null);
    if (ok(r) && /svg/.test(r.headers.get("content-type") || "")) return { r, days: 30 };
  }
  const h = await fetch(`https://icon.horse/icon/${domain}`).catch(() => null);
  if (ok(h) && /image/.test(h.headers.get("content-type") || "")) return { r: h, days: 30 };
  const g = await fetch(`https://t1.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${domain}&size=256`).catch(() => null);
  // a rate-limited icon.horse answer is retried sooner than a genuine miss
  if (ok(g)) return { r: g, days: h && h.status === 429 ? 1 : 30 };
  return null;
}

export async function onRequestGet({ params, request, waitUntil }) {
  const domain = String(params.domain || "").toLowerCase();
  if (!HOST.test(domain)) return new Response("bad domain", { status: 400 });

  const cache = caches.default, key = new Request(new URL(request.url).origin + "/logo-v2/" + domain); // bump the version to refetch every logo
  const hit = await cache.match(key);
  if (hit) return hit;

  const got = await source(domain);
  const res = got
    ? new Response(got.r.body, { headers: {
        "content-type": got.r.headers.get("content-type") || "image/png",
        "cache-control": `public, max-age=${got.days * 86400}`,
        // logos are only ever used as <img>; these headers stop an SVG from running anything if opened directly
        "content-security-policy": "default-src 'none'; style-src 'unsafe-inline'; sandbox",
        "x-content-type-options": "nosniff",
      } })
    : new Response("no logo", { status: 404, headers: { "cache-control": "public, max-age=86400" } });
  waitUntil(cache.put(key, res.clone()));
  return res;
}
