// One-off: 0.1 degree land + India masks for lon 60..100E, lat 0..40N (Natural Earth 10m), appended to land.js as window.REGION.
import fs from "node:fs";
import { feature } from "topojson-client";
const LON0 = 60, LAT1 = 40, RES = 0.1, W = 400, H = 400;
const rings = geo => { const out = []; for (const g of geo) for (const poly of g.type === "Polygon" ? [g.coordinates] : g.coordinates) for (const r of poly) out.push(r); return out; };
const inBox = r => r.some(([x, y]) => x > LON0 - 2 && x < LON0 + W * RES + 2 && y > LAT1 - H * RES - 2 && y < LAT1 + 2);
function raster(rs) {
  const bits = new Uint8Array(W * H / 8);
  for (let y = 0; y < H; y++) {
    const lat = LAT1 - (y + .5) * RES, xs = [];
    for (const r of rs) for (let i = 0; i < r.length - 1; i++) {
      const [x1, y1] = r[i], [x2, y2] = r[i + 1];
      if ((y1 <= lat && y2 > lat) || (y2 <= lat && y1 > lat)) xs.push(x1 + (lat - y1) / (y2 - y1) * (x2 - x1));
    }
    xs.sort((a, b) => a - b);
    for (let k = 0; k + 1 < xs.length; k += 2) {
      const a = Math.max(0, Math.ceil((xs[k] - LON0) / RES - .5)), b = Math.min(W - 1, Math.floor((xs[k + 1] - LON0) / RES - .5));
      for (let x = a; x <= b; x++) { const i = y * W + x; bits[i >> 3] |= 1 << (i & 7); }
    }
  }
  return bits;
}
const landT = JSON.parse(fs.readFileSync("node_modules/world-atlas/land-10m.json", "utf8"));
const land = feature(landT, landT.objects.land);
const landRings = rings(land.features ? land.features.map(f => f.geometry) : [land.geometry]).filter(inBox);
const cT = JSON.parse(fs.readFileSync("node_modules/world-atlas/countries-10m.json", "utf8"));
const india = feature(cT, cT.objects.countries).features.find(f => f.id === "356");
const L = raster(landRings), I = raster(rings([india.geometry]));
const get = (bits, la, lo) => { const x = Math.floor((lo - LON0) / RES), y = Math.floor((LAT1 - la) / RES), i = y * W + x; return (bits[i >> 3] >> (i & 7)) & 1; };
for (const [n, la, lo] of [["Mumbai", 19.08, 72.88], ["Chennai", 13.08, 80.27], ["Bangalore", 12.97, 77.59], ["Delhi", 28.61, 77.21], ["Arabian Sea", 15, 70], ["Lahore (not India)", 31.5, 74.3], ["Colombo (not India)", 6.9, 79.86]])
  console.log(n.padEnd(20), "land", get(L, la, lo), "india", get(I, la, lo));
const base = fs.readFileSync("land.js", "utf8").split("\nwindow.REGION")[0].trimEnd();
fs.writeFileSync("land.js", base + `\nwindow.REGION={lon0:${LON0},lat1:${LAT1},res:${RES},w:${W},h:${H},land:"${Buffer.from(L).toString("base64")}",india:"${Buffer.from(I).toString("base64")}"};\n`);
console.log("land.js", (fs.statSync("land.js").size / 1024).toFixed(0), "KB");
