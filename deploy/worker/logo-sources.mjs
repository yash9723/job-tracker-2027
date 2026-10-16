// Run: node logo-sources.mjs — compares logo sources for the big companies.
const T = [["google","google.com"],["amazon","amazon.com"],["microsoft","microsoft.com"],["apple","apple.com"],["meta","meta.com"],["ibm","ibm.com"],["intuit","intuit.com"],["salesforce","salesforce.com"],["adobe","adobe.com"],["cisco","cisco.com"],["oracle","oracle.com"],["sap","sap.com"],["walmart","walmart.com"],["target","target.com"],["deloitte","deloitte.com"],["accenture","accenture.com"],["infosys","infosys.com"],["tcs","tcs.com"],["wipro","wipro.com"],["hcltech","hcltech.com"],["cognizant","cognizant.com"],["capgemini","capgemini.com"],["honeywell","honeywell.com"],["siemens","siemens.com"],["harman","harman.com"],["hp","hp.com"],["dell","dell.com"],["intel","intel.com"],["amd","amd.com"],["nvidia","nvidia.com"],["qualcomm","qualcomm.com"],["samsung","samsung.com"],["sony","sony.com"],["philips","philips.com"],["shell","shell.com"],["airbus","airbus.com"],["electronicarts","ea.com"],["atlassian","atlassian.com"],["uber","uber.com"],["mastercard","mastercard.com"],["visa","visa.com"],["paypal","paypal.com"],["jpmorgan","jpmorgan.com"],["goldmansachs","goldmansachs.com"],["flipkart","flipkart.com"],["swiggy","swiggy.com"],["zomato","zomato.com"],["phonepe","phonepe.com"],["paytm","paytm.com"],["razorpay","razorpay.com"]];
const px = b => b.length > 24 && b.readUInt32BE(12) === 0x49484452 ? b.readUInt32BE(16) : 0;
async function probe(url) {
  try { const r = await fetch(url, { redirect: "follow", signal: AbortSignal.timeout(12000), headers: { "user-agent": "Mozilla/5.0" } });
    if (!r.ok) return "x" + r.status; const ct = r.headers.get("content-type") || ""; const b = Buffer.from(await r.arrayBuffer());
    return ct.includes("svg") ? "svg" : ct.includes("png") ? px(b) : ct.slice(0, 12) + b.length; } catch (e) { return "err"; }
}
console.log("name | simpleicons | icon.horse");
let i = 0; const out = [];
await Promise.all(Array.from({ length: 6 }, async () => { while (i < T.length) { const [s, d] = T[i++];
  out.push([s, await probe(`https://cdn.simpleicons.org/${s}`), await probe(`https://icon.horse/icon/${d}`)]); } }));
out.sort((a, b) => a[0].localeCompare(b[0]));
for (const r of out) console.log(r.join(" | "));
