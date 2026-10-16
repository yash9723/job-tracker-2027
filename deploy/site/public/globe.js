// Interactive globe: real land (from land.js), lighting, atmosphere, graticule, orbit ring,
// city markers with route arcs and pulses. Drag to spin, hover for job counts, click a city to filter.
// Camera mode lets the page (GSAP) fly it: Globe.manual(true) returns {lon, lat, zoom} to tween.
(function () {
  const rad = d => d * Math.PI / 180, deg = r => r * 180 / Math.PI, TAU = Math.PI * 2;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const CITY = [["Bangalore", 12.97, 77.59], ["Hyderabad", 17.38, 78.48], ["Chennai", 13.08, 80.27], ["Pune", 18.52, 73.86], ["Mumbai", 19.08, 72.88], ["Delhi NCR", 28.61, 77.21]];
  // which side each label sits on when all are shown (they are close together)
  const LABEL_DIR = [[-1, 1], [1, -1], [1, 1], [1, 1], [-1, -1], [1, -1]];
  const ROUTES = [[5, 4], [4, 3], [3, 1], [1, 0], [0, 2], [5, 1], [4, 0]];
  const HOME = [77, 20]; // lon, lat the globe rests on
  const ll = (la, lo) => [Math.cos(rad(la)) * Math.sin(rad(lo)), Math.sin(rad(la)), Math.cos(rad(la)) * Math.cos(rad(lo))];
  const V = CITY.map(c => ll(c[1], c[2]));
  const MID = ll(HOME[1], HOME[0]);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

  // ---- static geometry ----
  let LAND = null, REG = null, CLS = null; // coarse land dots [x, y, z, highlight]; REG: inside the India close-up region; CLS: dot class
  let DENSE = null, DCLS = null; // fine dots around India, shown when zoomed in
  const LIGHTS = []; // [x, y, z, size] per city light, drawn on the night side in dark theme
  // Land lookup: 0 sea, 1 land, 2 India. Around India it uses the 0.1 degree regional map (window.REGION),
  // elsewhere the 0.5 degree world map, so coastal cities like Mumbai and Chennai sit on land.
  function landTest() {
    const L = window.LAND, RG = window.REGION;
    if (!L) return null;
    const dec = s => { const bin = atob(s), u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return u; };
    const bit = (u, k) => (u[k >> 3] >> (k & 7)) & 1;
    const world = dec(L.b), rl = RG && dec(RG.land), ri = RG && dec(RG.india);
    return (x, y, z) => {
      const la = Math.asin(y) * 180 / Math.PI, lo = Math.atan2(x, z) * 180 / Math.PI;
      if (RG) {
        const cx = Math.floor((lo - RG.lon0) / RG.res), cy = Math.floor((RG.lat1 - la) / RG.res);
        if (cx >= 0 && cy >= 0 && cx < RG.w && cy < RG.h) { const k = cy * RG.w + cx; return bit(rl, k) ? 1 + bit(ri, k) : 0; }
      }
      const cx = Math.min(L.w - 1, ((lo + 180) / 360 * L.w) | 0), cy = Math.min(L.h - 1, ((90 - la) / 180 * L.h) | 0);
      return bit(world, cy * L.w + cx);
    };
  }
  // Dot class from its neighbours `step` degrees away: -1 sea, 0 land, 1 India, 2 India's outline (coast or border), 3 other coastline.
  function classOf(fn, x, y, z, step) {
    const v = fn(x, y, z);
    if (!v) return -1;
    const la = Math.asin(y) * 180 / Math.PI, lo = Math.atan2(x, z) * 180 / Math.PI;
    let sea = false, other = false;
    for (const [dl, dn] of [[step, 0], [-step, 0], [0, step], [0, -step]]) {
      const p = ll(la + dl, lo + dn), w = fn(p[0], p[1], p[2]);
      if (!w) sea = true; else if (v === 2 && w === 1) other = true;
    }
    return v === 2 ? (sea || other ? 2 : 1) : sea ? 3 : 0;
  }
  const hlOf = (x, y, z) => { let hl = 0; for (const v of V) hl = Math.max(hl, 1 - Math.acos(Math.min(1, x * v[0] + y * v[1] + z * v[2])) / .15); return Math.max(0, hl); };
  const inRegion = (x, y, z) => x * MID[0] + y * MID[1] + z * MID[2] > .88; // within ~28 degrees of central India
  function buildLand() {
    const isLand = landTest();
    if (!isLand) { LAND = new Float32Array(0); REG = CLS = DCLS = new Uint8Array(0); DENSE = new Float32Array(0); return; }
    const out = [], reg = [], cls = [], N = 17000;
    for (let i = 0; i < N; i++) {
      const y = 1 - 2 * (i + .5) / N, r = Math.sqrt(1 - y * y), a = i * 2.399963, x = r * Math.cos(a), z = r * Math.sin(a);
      const c = classOf(isLand, x, y, z, 1.2);
      if (c < 0) continue;
      const hl = hlOf(x, y, z);
      out.push(x, y, z, hl); reg.push(inRegion(x, y, z) ? 1 : 0); cls.push(c);
      // night-side city lights: a sprinkle everywhere, dense around the six cities
      if (hl > .15 || ((i * 2654435761) >>> 0) % 100 < 7) LIGHTS.push(x, y, z, hl > .15 ? 1.6 : 1);
    }
    LAND = Float32Array.from(out); REG = Uint8Array.from(reg); CLS = Uint8Array.from(cls);
    landFn = isLand;
  }
  // The close-up layer is only needed when zooming in: build it when the browser is idle, not at start-up.
  let landFn = null;
  function buildDense() {
    if (DENSE || !landFn) return;
    const dense = [], dc = [], ND = 260000; // ~0.4 degree spacing, drawn from the 0.1 degree regional map
    for (let i = 0; i < ND; i++) {
      const y = 1 - 2 * (i + .5) / ND, r = Math.sqrt(1 - y * y), a = i * 2.399963, x = r * Math.cos(a), z = r * Math.sin(a);
      if (!inRegion(x, y, z)) continue;
      const c = classOf(landFn, x, y, z, .3);
      if (c >= 0) { dense.push(x, y, z, hlOf(x, y, z)); dc.push(c); }
    }
    DENSE = Float32Array.from(dense); DCLS = Uint8Array.from(dc);
  }
  const GRAT = [];
  for (let la = -60; la <= 60; la += 30) { const l = []; for (let lo = -180; lo <= 180; lo += 6) l.push(ll(la, lo)); GRAT.push(l); }
  for (let lo = -180; lo < 180; lo += 30) { const l = []; for (let la = -84; la <= 84; la += 6) l.push(ll(la, lo)); GRAT.push(l); }
  const STARS = Array.from({ length: 70 }, (_, i) => [(Math.sin(i * 12.9898) * 43758.5453) % 1, (Math.sin(i * 78.233) * 12345.6789) % 1, .4 + (i % 5) * .25, i * .7]);

  // ---- state ----
  const G = { cv: null, ctx: null, tip: null, onPick: null, W: 0, H: 0, dpr: 1, col: {}, counts: {}, running: false, onscreen: true,
    yaw: rad(HOME[0]), pit: rad(HOME[1]), zoom: .38, dragYaw: 0, dragPit: 0, dragging: false, lastDrag: 0, moved: 0,
    fc: HOME, focusUntil: 0, hover: -1, hits: [], tipFor: -2, hl: new Set(), hlKey: "",
    manual: false, cam: { lon: HOME[0], lat: HOME[1], zoom: .38 }, target: -1 };

  function readCol() {
    const s = getComputedStyle(document.documentElement), g = n => s.getPropertyValue(n).trim();
    G.col = { dot: g("--muted"), line: g("--line"), acc: g("--accent"), fg: g("--fg"), bg: g("--bg"), soft: g("--accent-soft"), surf: g("--surface") };
    const h = G.col.bg.replace("#", ""), n = parseInt(h.length === 3 ? h.replace(/./g, "$&$&") : h, 16);
    G.col.dark = ((n >> 16 & 255) * .299 + (n >> 8 & 255) * .587 + (n & 255) * .114) / 255 < .35;
    G.font = getComputedStyle(document.body).fontFamily; // read once: reading styles every frame forces a style recalc
  }

  function draw(now) {
    const { ctx, col } = G, W = G.W, H = G.H || G.W, S = Math.min(W, H);
    if (S < 4 || !LAND) return;
    const t = reduce ? 0 : now / 1000, cx = W / 2, cy0 = H / 2, wide = W / H > 1.15;
    const focused = now < G.focusUntil, cen = focused ? G.fc : HOME;
    if (G.manual) {
      // the page drives the camera (GSAP tweens G.cam)
      G.yaw = rad(G.cam.lon); G.pit = rad(clamp(G.cam.lat, -80, 80)); G.zoom = G.cam.zoom;
    } else {
      if (!G.dragging && now - G.lastDrag > 2500) { G.dragYaw *= .975; G.dragPit *= .975; }
      const yawT = rad(cen[0]) + (focused ? 0 : Math.sin(t * .27) * .5) + G.dragYaw;
      const pitT = clamp(rad(cen[1]) + G.dragPit, -1.3, 1.3);
      const k = reduce ? 1 : .09;
      G.yaw += (yawT - G.yaw) * k; G.pit += (pitT - G.pit) * k;
      G.zoom += ((focused ? .85 : .38) - G.zoom) * (reduce ? 1 : .07);
    }
    const zoom = G.zoom, R = S * zoom, far = 1 - smooth(.38, .6, zoom); // far = 1 when the whole globe is in view
    const close = smooth(1.05, 1.6, zoom); // 1 when zoomed in on India
    const depth = .06 + .1 * smooth(1, 2.6, zoom); // stronger perspective when close

    const ca = Math.cos(G.yaw), sa = Math.sin(G.yaw), cp = Math.cos(G.pit), sp = Math.sin(G.pit);
    const rot = (x, y, z, k2 = 1) => { const x1 = x * ca - z * sa, z1 = x * sa + z * ca; return [x1 * k2, (y * cp - z1 * sp) * k2, (y * sp + z1 * cp) * k2]; };
    const scr = p => { const f = 1 + p[2] * depth; return [cx + R * p[0] * f, cy0 - R * p[1] * f]; };

    ctx.setTransform(G.dpr, 0, 0, G.dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.globalAlpha = 1;

    // stars
    ctx.fillStyle = col.fg;
    for (const [sx, sy2, sz, ph] of STARS) { ctx.globalAlpha = (.12 + .18 * Math.sin(t * 1.3 + ph)) * far; ctx.fillRect(Math.abs(sx) * W, Math.abs(sy2) * H, sz, sz); }

    // orbit ring, back half
    const ring = (back) => {
      const Rr = R * 1.32, tilt = rad(72), steps = 90;
      // one path per half instead of one stroke per segment
      ctx.lineWidth = 1; ctx.strokeStyle = col.acc; ctx.globalAlpha = (back ? .12 : .35) * far;
      ctx.beginPath();
      let pen = false;
      for (let i = 0; i <= steps; i++) {
        const a = i / steps * TAU + t * .05, x = cx + Math.cos(a) * Rr, yy = cy0 - Math.sin(a) * Rr * Math.cos(tilt), zz = Math.sin(a) * Rr * Math.sin(tilt);
        if ((zz < 0) === back) { pen ? ctx.lineTo(x, yy) : ctx.moveTo(x, yy); pen = true; } else pen = false;
      }
      ctx.stroke();
      const a = t * .45 + 1, zz = Math.sin(a) * Rr * Math.sin(tilt);
      if ((zz < 0) === back) { ctx.globalAlpha = .9 * far; ctx.fillStyle = col.acc; ctx.beginPath(); ctx.arc(cx + Math.cos(a) * Rr, cy0 - Math.sin(a) * Rr * Math.cos(tilt), 2.4, 0, TAU); ctx.fill(); }
    };
    if (far > .02) ring(true);

    // atmosphere + ocean
    if (far > .02) {
      const g = ctx.createRadialGradient(cx, cy0, R * .96, cx, cy0, R * 1.22);
      g.addColorStop(0, col.acc); g.addColorStop(1, col.acc + "00");
      ctx.globalAlpha = .38 * far; ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy0, R * 1.22, 0, TAU); ctx.fill();
    }
    const og = ctx.createRadialGradient(cx - R * .38, cy0 - R * .42, R * .05, cx, cy0, R * 1.02);
    og.addColorStop(0, col.soft); og.addColorStop(1, col.surf);
    ctx.save();
    // square hero: a round window; wide drawer stage: the whole rectangle
    ctx.beginPath();
    if (wide) ctx.rect(0, 0, W, H); else ctx.arc(cx, cy0, S / 2 - 1, 0, TAU);
    ctx.clip();
    ctx.globalAlpha = 1; ctx.fillStyle = og; ctx.beginPath(); ctx.arc(cx, cy0, R * 1.001, 0, TAU); ctx.fill();
    ctx.globalAlpha = .55; ctx.strokeStyle = col.line; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(cx, cy0, R, 0, TAU); ctx.stroke();

    // graticule
    // all graticule lines in a single stroke
    ctx.lineWidth = .6; ctx.strokeStyle = col.line; ctx.globalAlpha = .38;
    ctx.beginPath();
    for (const line of GRAT) {
      let pen = false;
      for (const v of line) {
        const p = rot(v[0], v[1], v[2]);
        if (p[2] > .06) { const q = scr(p); pen ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]); pen = true; } else pen = false;
      }
    }
    ctx.stroke();

    // land dots, lit from the upper left; dark theme moves the sun to the side so a night side (with city lights) is visible
    const [Lx, Ly, Lz] = col.dark ? [-.93, .28, .24] : [-.45, .5, .74];
    // dots are grouped into a few brightness levels per colour and filled once per group,
    // instead of one fill (and a colour/alpha change) per dot
    const LEVELS = 7;
    // classes: 0 land, 1 India (tinted), 2 India's outline (crisp), 3 other coastline (slightly brighter)
    const CLS_COL = [col.dot, col.acc, col.acc, col.dot];
    const dots = (arr, size0, fade, regMask, clsArr) => {
      const paths = Array.from({ length: LEVELS * 4 }, () => new Path2D());
      for (let i = 0, d = 0; i < arr.length; i += 4, d++) {
        const f = regMask ? (regMask[d] ? 1 - close : 1) : fade;
        if (f < .02) continue;
        const p = rot(arr[i], arr[i + 1], arr[i + 2]);
        if (p[2] < .02) continue;
        const [x, y] = scr(p);
        if (x < -4 || y < -4 || x > W + 4 || y > H + 4) continue;
        const lit = Math.max(0, p[0] * Lx + p[1] * Ly + p[2] * Lz), hl = arr[i + 3], c = clsArr[d];
        const k = c === 0 && hl > .05 ? 1 : c;
        let s = size0 * (.8 + .5 * p[2] + hl * .5), a = (.18 + .8 * lit) * smooth(.02, .4, p[2]) * f;
        if (k === 1) a = Math.min(1, a * (.8 + hl));
        else if (k === 2) { a = Math.min(1, a * 1.35 + .12 * f); s *= 1.15; }
        else if (k === 3) { a = Math.min(1, a * 1.2 + .05 * f); s *= 1.08; }
        if (a < .03) continue;
        paths[Math.min(LEVELS - 1, (a * LEVELS) | 0) + k * LEVELS].rect(x - s / 2, y - s / 2, s, s);
      }
      for (let b = 0; b < LEVELS * 4; b++) {
        ctx.globalAlpha = ((b % LEVELS) + .6) / LEVELS; ctx.fillStyle = CLS_COL[(b / LEVELS) | 0]; ctx.fill(paths[b]);
      }
    };
    dots(LAND, clamp(R / 150, .8, 2.2), 1, REG, CLS);
    if (close > .02) { if (!DENSE) buildDense(); dots(DENSE, clamp(R / 330, .8, 2.2), close, null, DCLS); }

    if (col.dark) {
      ctx.fillStyle = "#ffcf70";
      const size0 = clamp(R / 150, .8, 2.2);
      for (let i = 0; i < LIGHTS.length; i += 4) {
        const p = rot(LIGHTS[i], LIGHTS[i + 1], LIGHTS[i + 2]);
        if (p[2] < .02) continue;
        const lit = Math.max(0, p[0] * Lx + p[1] * Ly + p[2] * Lz);
        if (lit > .28) continue;
        const [x, y] = scr(p), s = size0 * LIGHTS[i + 3], a = (1 - lit / .28) * smooth(.02, .4, p[2]);
        ctx.globalAlpha = a * (.75 + .25 * Math.sin(t * 2 + i));
        ctx.fillRect(x - s / 2, y - s / 2, s, s);
        if (LIGHTS[i + 3] > 1) { ctx.globalAlpha = a * .18; ctx.beginPath(); ctx.arc(x, y, s * 2.4, 0, TAU); ctx.fill(); }
      }
    }

    // route arcs with travelling pulses
    const arcPt = (a, b, s, om) => {
      const so = Math.sin(om), w1 = Math.sin((1 - s) * om) / so, w2 = Math.sin(s * om) / so;
      return rot(a[0] * w1 + b[0] * w2, a[1] * w1 + b[1] * w2, a[2] * w1 + b[2] * w2, 1 + .16 * Math.sin(Math.PI * s) / Math.max(1, zoom));
    };
    ctx.strokeStyle = col.acc; ctx.fillStyle = col.acc;
    ROUTES.forEach(([ia, ib], r) => {
      const a = V[ia], b = V[ib], om = Math.acos(Math.min(1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2]));
      const hot = G.hl.has(CITY[ia][0]) || G.hl.has(CITY[ib][0]); // a route touching the selected / hovered job's city lights up
      // one stroke per route
      ctx.lineWidth = hot ? 2.6 : 1.3;
      ctx.beginPath();
      let pen = false, zs = 0, nz = 0;
      for (let i = 0; i <= 22; i++) {
        const p = arcPt(a, b, i / 22, om);
        if (p[2] > -.02) { const q = scr(p); pen ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]); pen = true; zs += p[2]; nz++; } else pen = false;
      }
      if (nz > 1) { ctx.globalAlpha = (hot ? .55 : .18) + .5 * Math.max(0, zs / nz); ctx.stroke(); }
      const p = arcPt(a, b, (t * .2 + r * .17) % 1, om);
      if (p[2] > 0) { const [x, y] = scr(p); ctx.globalAlpha = .95; ctx.beginPath(); ctx.arc(x, y, 2.1, 0, TAU); ctx.fill(); }
    });
    ctx.restore();

    // city markers
    G.hits = [];
    const cyc = Math.floor(t / 2.6) % CITY.length, allLabels = zoom > 1.3;
    const font = G.font;
    // Labels try the preferred corner first, then the other three, and take the first that does not overlap one already drawn.
    const placed = [], labels = [];
    // markers count as taken space, so a label never covers another city's dot
    V.forEach(v => { const p = rot(v[0], v[1], v[2]); if (p[2] > .05) { const [x, y] = scr(p); placed.push([x - 7, y - 7, x + 7, y + 7]); } });
    const label = (text, x, y, sx, sy, size, weight) => {
      ctx.font = `${weight} ${size}px ${font}`;
      const tw = ctx.measureText(text).width;
      let best = null;
      for (const [dx, dy] of [[sx, sy], [-sx, sy], [sx, -sy], [-sx, -sy]]) {
        const off = size > 12 ? 26 : 16, lx2 = x + dx * off, ly2 = y + dy * (off + 2), x0 = dx > 0 ? lx2 + 2 : lx2 - 6 - tw;
        const box = [x0, ly2 - size * .75, x0 + tw + 4, ly2 + size * .75];
        const hit = placed.some(b => box[0] < b[2] && box[2] > b[0] && box[1] < b[3] && box[3] > b[1]);
        if (!best || !hit) best = { dx, lx2, ly2, box };
        if (!hit) break;
      }
      placed.push(best.box);
      const { dx, lx2, ly2 } = best;
      ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(lx2, ly2); ctx.stroke();
      ctx.textAlign = dx > 0 ? "left" : "right"; ctx.textBaseline = "middle";
      ctx.lineWidth = 4; ctx.strokeStyle = col.bg; ctx.strokeText(text, lx2 + dx * 4, ly2);
      ctx.fillStyle = col.fg; ctx.fillText(text, lx2 + dx * 4, ly2);
      ctx.strokeStyle = col.acc; ctx.fillStyle = col.acc;
    };
    CITY.forEach(([name, la, lo], i) => {
      const p = rot(V[i][0], V[i][1], V[i][2]);
      if (p[2] <= .05) { G.hits[i] = null; return; }
      const [x, y] = scr(p), ph = (t * .7 + i * .31) % 1, hotC = G.hl.has(name), hov = G.hover === i || hotC, tgt = G.target === i;
      G.hits[i] = [x, y];
      ctx.strokeStyle = col.acc; ctx.fillStyle = col.acc;
      ctx.globalAlpha = (1 - ph) * .7 * p[2]; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.arc(x, y, 3 + (tgt ? 22 : 10) * ph, 0, TAU); ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.beginPath(); ctx.arc(x, y, hov || tgt ? 5 : 3.4, 0, TAU); ctx.fill();
      if (hov) { ctx.globalAlpha = .35; ctx.beginPath(); ctx.arc(x, y, 9, 0, TAU); ctx.fill(); ctx.globalAlpha = 1; }
      if (tgt) {
        // rotating target reticle + coordinates
        const rr = 18, spin = t * .8;
        ctx.lineWidth = 1.6; ctx.setLineDash([5, 5]); ctx.lineDashOffset = -spin * 10;
        ctx.beginPath(); ctx.arc(x, y, rr, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
        for (let q = 0; q < 4; q++) {
          const a = spin + q * Math.PI / 2;
          ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * (rr + 3), y + Math.sin(a) * (rr + 3)); ctx.lineTo(x + Math.cos(a) * (rr + 9), y + Math.sin(a) * (rr + 9)); ctx.stroke();
        }
        if (zoom > .9) {
          ctx.font = `500 11px ${font}`; ctx.textAlign = "center"; ctx.textBaseline = "top";
          const coord = `${la.toFixed(2)}° N, ${lo.toFixed(2)}° E`;
          ctx.lineWidth = 4; ctx.strokeStyle = col.bg; ctx.strokeText(coord, x, y + rr + 12);
          ctx.fillStyle = col.fg; ctx.fillText(coord, x, y + rr + 12);
          ctx.strokeStyle = col.acc; ctx.fillStyle = col.acc;
          const cw = ctx.measureText(coord).width / 2 + 3;
          placed.push([x - cw, y + rr + 10, x + cw, y + rr + 26], [x - rr - 9, y - rr - 9, x + rr + 9, y + rr + 9]);
        }
      }
      if (allLabels) {
        const [sx, sy] = LABEL_DIR[i];
        labels.push([tgt ? 0 : 1, name, x, y, sx, sy, tgt ? 14 : 12, tgt ? 700 : 600]);
      } else {
        const show = G.hover >= 0 || focused || S < 150 ? false : i === cyc; // no rotating label on the small phone globe
        if (show || hotC || tgt || (focused && cen === G.fc && la === G.fc[1])) labels.push([1, name, x, y, x > cx ? -1 : 1, y > cy0 ? 1 : -1, 12, 600]);
      }
    });
    // labels after all markers, the selected city first so it gets its preferred corner
    labels.sort((a, b) => a[0] - b[0]).forEach(l => label(l[1], l[2], l[3], l[4], l[5], l[6], l[7]));

    // ring, front half (drawn over the globe)
    if (far > .02) ring(false);
    ctx.globalAlpha = 1;

    // tooltip follows the hovered marker
    if (G.tip) {
      const h = G.hover >= 0 && G.hits[G.hover] ? G.hover : -1;
      if (h !== G.tipFor) {
        G.tipFor = h;
        if (h >= 0) {
          const n = G.counts[CITY[h][0]] ?? 0, b = document.createElement("b"), sp2 = document.createElement("span");
          b.textContent = CITY[h][0]; sp2.textContent = G.manual ? `${n} opening${n === 1 ? "" : "s"}` : `${n} opening${n === 1 ? "" : "s"} · click to filter`;
          G.tip.replaceChildren(b, sp2); G.tip.hidden = false;
        }
        else G.tip.hidden = true;
      }
      if (h >= 0) G.tip.style.transform = `translate(${G.hits[h][0]}px, ${G.hits[h][1]}px) translate(-50%, calc(-100% - 14px))`;
    }
  }

  // The idle sway looks the same at 30 fps, which halves the work; flights, drags and hovers run at full rate.
  function loop(now) {
    if (!G.running) return;
    requestAnimationFrame(loop);
    if (!G.manual && !G.dragging && G.hover < 0 && now - (G.lastDraw || 0) < 30) return;
    G.lastDraw = now;
    draw(now);
  }
  const start = () => { if (!reduce && !G.running && G.onscreen && !document.hidden) { G.running = true; requestAnimationFrame(loop); } };
  const stop = () => { G.running = false; };
  const redraw = () => { if (!G.running) requestAnimationFrame(draw); };

  function size() {
    const r = G.cv.getBoundingClientRect();
    // touch screens: a lower pixel ratio keeps the animation light on phone GPUs
    G.dpr = Math.min(devicePixelRatio || 1, matchMedia("(pointer: coarse)").matches ? 1.5 : 2); G.W = r.width; G.H = r.height;
    G.cv.width = Math.round(r.width * G.dpr); G.cv.height = Math.round(r.height * G.dpr);
    draw(performance.now());
  }

  function pickAt(x, y) {
    let best = -1, bd = 16;
    G.hits.forEach((h, i) => { if (h) { const d = Math.hypot(h[0] - x, h[1] - y); if (d < bd) { bd = d; best = i; } } });
    return best;
  }

  function init(opts) {
    G.cv = opts.canvas; G.ctx = G.cv.getContext("2d"); G.tip = opts.tip; G.onPick = opts.onPick;
    buildLand(); readCol();
    new ResizeObserver(size).observe(G.cv);
    new IntersectionObserver(([e]) => { G.onscreen = e.isIntersecting; G.onscreen ? start() : stop(); }).observe(G.cv);
    document.addEventListener("visibilitychange", () => document.hidden ? stop() : start());
    matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => { readCol(); redraw(); });

    let lx = 0, ly = 0, sx = 0, sy = 0;
    G.cv.style.touchAction = "pan-y";
    G.cv.addEventListener("pointerdown", e => { G.dragging = true; G.moved = 0; lx = sx = e.clientX; ly = sy = e.clientY; G.cv.setPointerCapture(e.pointerId); G.cv.style.cursor = "grabbing"; });
    G.cv.addEventListener("pointermove", e => {
      const r = G.cv.getBoundingClientRect();
      if (G.dragging) {
        G.moved = Math.max(G.moved, Math.hypot(e.clientX - sx, e.clientY - sy));
        if (G.moved > 4) {
          const z = Math.max(.4, G.zoom * 2);
          if (G.manual) { // in camera mode, dragging pans the camera itself
            G.cam.lon -= deg((e.clientX - lx) * .006 / z); G.cam.lat = clamp(G.cam.lat + deg((e.clientY - ly) * .005 / z), -70, 70);
          } else {
            G.dragYaw -= (e.clientX - lx) * .006 / z; G.dragPit += (e.clientY - ly) * .005 / z;
            G.dragPit = clamp(G.dragPit, -.9, .9); G.lastDrag = performance.now(); G.focusUntil = 0;
          }
        }
        lx = e.clientX; ly = e.clientY; redraw();
      } else {
        const h = pickAt(e.clientX - r.left, e.clientY - r.top);
        if (h !== G.hover) { G.hover = h; G.cv.style.cursor = h >= 0 && !G.manual ? "pointer" : "grab"; redraw(); }
      }
    });
    const up = e => {
      if (!G.dragging) return;
      G.dragging = false; G.cv.style.cursor = G.hover >= 0 && !G.manual ? "pointer" : "grab"; G.lastDrag = performance.now();
      if (G.moved <= 4 && !G.manual) {
        const r = G.cv.getBoundingClientRect(), h = pickAt(e.clientX - r.left, e.clientY - r.top);
        if (h >= 0 && G.onPick) G.onPick(CITY[h][0]);
      }
    };
    G.cv.addEventListener("pointerup", up);
    G.cv.addEventListener("pointercancel", up);
    G.cv.addEventListener("pointerleave", () => { if (!G.dragging && G.hover !== -1) { G.hover = -1; redraw(); } });
    G.cv.style.cursor = "grab";
    start();
    (window.requestIdleCallback || (f => setTimeout(f, 1500)))(buildDense);
  }

  window.Globe = {
    init,
    cities: CITY.map(([name, lat, lon]) => ({ name, lat, lon })),
    setCounts(c) { G.counts = c || {}; G.tipFor = -2; redraw(); },
    // Light up these cities (and routes touching them), e.g. while a job card is hovered.
    highlight(names) { const s = (names || []).join("|"); if (s !== G.hlKey) { G.hlKey = s; G.hl = new Set(names || []); redraw(); } },
    // Mark one city with the target reticle (null to clear).
    target(name) { G.target = CITY.findIndex(c => c[0] === name); redraw(); },
    refreshColors() { readCol(); redraw(); },
    redraw,
    // Camera mode on: returns the live {lon, lat, zoom} object (seeded from the current view) for tweening.
    // Camera mode off: the globe eases back to its idle sway around India.
    manual(on) {
      if (on && !G.manual) {
        G.cam.lon = deg(G.yaw); G.cam.lat = deg(G.pit); G.cam.zoom = G.zoom;
        G.dragYaw = G.dragPit = 0; G.focusUntil = 0;
      }
      if (!on && G.manual) { G.dragYaw = G.yaw - rad(HOME[0]); G.dragPit = 0; G.lastDrag = performance.now() - 2000; }
      G.manual = !!on;
      redraw();
      return G.cam;
    },
    // Spring the globe to a city (or back home when name is falsy).
    focus(name) {
      const i = CITY.findIndex(c => c[0] === name);
      if (i < 0) { G.focusUntil = 0; } else { G.fc = [CITY[i][2], CITY[i][1]]; G.focusUntil = performance.now() + 6000; G.dragYaw = G.dragPit = 0; }
      redraw();
    },
  };
})();
