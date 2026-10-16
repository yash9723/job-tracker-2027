// One-off: rasterise Natural Earth 50m land into a 720x360 equirectangular bitmask -> land.js
import fs from "node:fs";
import { feature } from "topojson-client";
const topo = JSON.parse(fs.readFileSync("node_modules/world-atlas/land-50m.json", "utf8"));
const land = feature(topo, topo.objects.land);
const rings = [];
const polys = land.type === "FeatureCollection" ? land.features.map(f => f.geometry) : [land.geometry ?? land];
for (const g of polys) for (const poly of g.type === "Polygon" ? [g.coordinates] : g.coordinates) for (const r of poly) rings.push(r);
const W = 720, H = 360, bits = new Uint8Array(Math.ceil(W * H / 8));
let landCells = 0;
for (let y = 0; y < H; y++) {
  const lat = 90 - (y + .5) * 180 / H, xs = [];
  for (const r of rings) for (let i = 0; i < r.length - 1; i++) {
    const [x1, y1] = r[i], [x2, y2] = r[i + 1];
    if ((y1 <= lat && y2 > lat) || (y2 <= lat && y1 > lat)) xs.push(x1 + (lat - y1) / (y2 - y1) * (x2 - x1));
  }
  xs.sort((a, b) => a - b);
  for (let k = 0; k + 1 < xs.length; k += 2) {
    const a = Math.max(0, Math.ceil((xs[k] + 180) / 360 * W - .5)), b = Math.min(W - 1, Math.floor((xs[k + 1] + 180) / 360 * W - .5));
    for (let x = a; x <= b; x++) { const i = y * W + x; bits[i >> 3] |= 1 << (i & 7); landCells++; }
  }
}
fs.writeFileSync("land.js", `// Natural Earth 50m land, ${W}x${H} bitmask, row 0 = 90N, col 0 = 180W, bit i = (i&7) of byte i>>3\nwindow.LAND={w:${W},h:${H},b:"${Buffer.from(bits).toString("base64")}"};\n`);
console.log("rings", rings.length, "land share", (landCells / (W * H)).toFixed(3));
