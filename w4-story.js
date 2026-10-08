// Wavenumber-4 animated story: a cartoon of how the pattern forms, grows, decays and matters.
// Two tilted planes (upper atmosphere and ocean surface) show the Southern Hemisphere from
// 10°S to 60°S, starting at 100°E so the wave can travel left to right (eastward).
(() => {
  const svg = document.getElementById('w4Stage');
  if (!svg) return;

  const NS = 'http://www.w3.org/2000/svg';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fixedT = parseFloat(new URLSearchParams(location.search).get('t'));   // ?t=8 freezes scenes at 8 s (for checking)
  const el = (tag, attrs = {}, parent = svg, text = null) => {
    const n = document.createElementNS(NS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    if (text != null) n.textContent = text;
    parent.appendChild(n);
    return n;
  };
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, f) => a + (b - a) * f;
  const ptsToPath = pts => 'M' + pts.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join('L');

  // ---------- Geography ----------
  const PLANE = { x0: 60, w: 820, shear: 80, h: 150 };
  const TOP = { air: 118, ocean: 395 };
  const SRC = [165, -32];                                       // trigger: southwestern subtropical Pacific
  const JET_LAT = -32, JET_AMP = 6;
  // Mature SST pattern (blog Figure 1): warm south of Australia, S-central Pacific, SW Atlantic, SW Indian;
  // cool in the SW Pacific, SE Pacific, SE Atlantic and SE Indian Ocean
  const WARM = [[130, -40], [220, -35], [315, -40], [405, -40]];
  const COOL = [[175, -39], [270, -44], [365, -35], [450, -32]];
  // Highs and lows sit between the SST centres, so meridional winds blow across the warm and cool patches
  const HIGHS = [152, 245, 340, 427], LOWS = [110, 197, 292, 385];

  const LAND = {
    australia: [[113.5, -22], [114, -26], [115, -31], [115.2, -34], [118, -35], [123, -33.8], [126, -32.3], [129, -31.6], [132, -32], [135, -34.5], [137.5, -35.5], [138.5, -34.8], [140, -37.5], [142, -38.4], [146, -39], [148, -37.8], [150, -37.5], [151.5, -33.5], [153.5, -28.5], [153, -25], [150, -22.5], [146.5, -19], [145.5, -15], [143.5, -14], [142.5, -10.7], [141.6, -12.5], [141.5, -15.5], [139.5, -17.5], [136.5, -15.8], [136, -12.2], [132.5, -11.5], [130, -12.2], [129.5, -15], [127, -14], [125, -15], [122.5, -17], [121, -19.5], [117, -20.7]],
    tasmania: [[144.7, -40.7], [148.3, -40.9], [148.2, -42.2], [147, -43.5], [145.5, -42.7]],
    nzNorth: [[172.7, -34.4], [174.5, -36], [176, -37.5], [178.5, -37.6], [177.9, -39], [176.9, -39.5], [175.9, -41.2], [174.6, -41.3], [175, -39.8], [173.8, -39.2], [174.6, -37.5], [173, -35.2]],
    nzSouth: [[172.6, -40.5], [174.3, -41.3], [173.9, -42.3], [172.7, -43.6], [171.3, -44.3], [170.5, -45.9], [169.1, -46.6], [166.6, -46], [166.9, -45.2], [168.3, -44], [170.8, -42.7], [172, -41.4]],
    southAmerica: [[281.6, -10], [283.8, -14], [285, -15.5], [288.6, -17.8], [289.7, -18.5], [289.8, -23.5], [289.5, -26], [288.5, -30], [288.4, -33], [287.5, -36], [286.5, -38], [286.3, -41.5], [285.5, -44], [284.5, -47.5], [285.5, -51], [286.5, -53], [289, -54], [291.3, -55.5], [293.5, -55], [291.6, -52.4], [291, -50.5], [292.3, -49], [294.2, -47.7], [292.5, -46], [294.8, -45], [296, -42.5], [297.8, -40.5], [298, -38.8], [302.5, -38], [303.3, -36.4], [302.8, -35.3], [301.6, -34.5], [305.1, -34.9], [306.6, -33.7], [309, -31], [311.4, -28.2], [311.5, -25.8], [313.5, -24], [316, -23], [319, -22], [320, -20], [320.8, -17.5], [321.1, -13], [323, -11], [324.2, -10]],
    africa: [[373.3, -10], [372.2, -13.5], [371.8, -17], [372.6, -19], [374.5, -22.8], [375.2, -27], [376.5, -28.6], [377.4, -30.5], [378.3, -32.5], [378.4, -34.2], [380, -34.8], [382.5, -34], [385.6, -34], [387.5, -33.2], [390, -31.3], [391.5, -29], [392.6, -26.5], [395.5, -24], [395.5, -22], [395, -20], [396.9, -18], [399.5, -16], [400.6, -14.5], [400.4, -11], [400, -10]],
    madagascar: [[404, -25.1], [407.1, -25.1], [408.9, -20.5], [410.4, -15.5], [409.4, -12], [407.5, -13.5], [404.3, -16.5], [403.3, -21.5]],
  };

  // Plane projection: longitude unwrapped from 100°E (u = 0) to 460°E (u = 1); latitude -10° (back) to -60° (front)
  const P = (lon, lat, plane) => {
    const u = (lon - 100) / 360, v = (-10 - lat) / 50;
    return [PLANE.x0 + u * PLANE.w + (1 - v) * PLANE.shear, TOP[plane] + v * PLANE.h];
  };
  // South-polar view for the opening and closing scenes (east is clockwise seen from above the pole)
  const POLAR = { cx: 500, cy: 300, R: 250 };
  const Q = (lon, lat) => {
    const r = POLAR.R * (90 + lat) / 80, a = lon * Math.PI / 180;
    return [POLAR.cx + r * Math.sin(a), POLAR.cy - r * Math.cos(a)];
  };

  // ---------- Definitions ----------
  const defs = el('defs');
  const radial = (id, stops) => {
    const g = el('radialGradient', { id }, defs);
    stops.forEach(([o, c, a]) => el('stop', { offset: o, 'stop-color': c, 'stop-opacity': a }, g));
  };
  radial('w4Warm', [[0, '#ff5a4e', 0.95], [0.6, '#ff8a6b', 0.6], [1, '#ffb199', 0]]);
  radial('w4Cool', [[0, '#2f7fe0', 0.95], [0.6, '#5aa0ee', 0.6], [1, '#9cc8f6', 0]]);
  radial('w4Glow', [[0, '#ff8a3d', 0.9], [1, '#ffcf8a', 0]]);
  radial('w4Polar', [[0, '#cfe8f7', 1], [1, '#9fcde9', 1]]);
  const lin = el('linearGradient', { id: 'w4Deep', x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
  el('stop', { offset: 0, 'stop-color': '#3b82c4' }, lin);
  el('stop', { offset: 1, 'stop-color': '#173f6b' }, lin);
  const marker = (id, color) => {
    const m = el('marker', { id, viewBox: '0 0 10 10', refX: 6, refY: 5, markerWidth: 5, markerHeight: 5, orient: 'auto-start-reverse' }, defs);
    el('path', { d: 'M0,0L10,5L0,10Z', fill: color }, m);
  };
  [['w4ArrNavy', '#0b2540'], ['w4ArrJet', '#7b3fb5'], ['w4ArrGreen', '#2f9e44'], ['w4ArrWarm', '#e8590c'],
    ['w4ArrCool', '#1c7ed6'], ['w4ArrBrown', '#8d6e4f'], ['w4ArrTeal', '#0c8599']].forEach(([id, c]) => marker(id, c));

  const groups = {};
  const group = (name, parent = svg) => (groups[name] = el('g', { class: 'w4-layer', 'data-layer': name }, parent));

  // ---------- Icons ----------
  function cloud(parent, x, y, s = 1, rain = true) {
    const g = el('g', { transform: `translate(${x},${y}) scale(${s})` }, parent);
    el('path', { d: 'M-34,10 a14,14 0 0,1 4,-26 a20,20 0 0,1 36,-6 a15,15 0 0,1 26,12 a12,12 0 0,1 -4,20 Z', class: 'w4-cloud' }, g);
    if (rain) for (let i = 0; i < 5; i++) el('line', { x1: -22 + i * 11, y1: 18, x2: -26 + i * 11, y2: 28, class: 'w4-rain', style: `animation-delay:${i * 0.17}s` }, g);
    return g;
  }
  function sun(parent, x, y, s = 1, dry = false) {
    const g = el('g', { transform: `translate(${x},${y}) scale(${s})` }, parent);
    const rays = el('g', { class: 'w4-sunrays' }, g);
    for (let i = 0; i < 8; i++) {
      const a = i * Math.PI / 4;
      el('line', { x1: Math.cos(a) * 15, y1: Math.sin(a) * 15, x2: Math.cos(a) * 21, y2: Math.sin(a) * 21, class: 'w4-ray' }, rays);
    }
    el('circle', { r: 11, class: 'w4-sun' }, g);
    if (dry) {
      el('rect', { x: -20, y: 27, width: 40, height: 12, rx: 3, class: 'w4-dry' }, g);
      el('path', { d: 'M-12,27l3,6l-3,6M2,27l-2,5l3,7M13,27l2,6', class: 'w4-crack' }, g);
    }
    return g;
  }
  // Labels get a white rounded background sized to the text; re-measured when fonts load or the layout changes
  const labels = [];
  function label(parent, x, y, text, cls = 'w4-label') {
    const minor = /--(small|tiny)/.test(cls) ? ' w4-tag--minor' : '';
    const g = el('g', { transform: `translate(${x},${y})`, class: 'w4-tag' + minor }, parent);
    const bg = el('rect', { rx: 8, class: 'w4-label-bg' }, g);
    const t = el('text', { class: cls, 'text-anchor': 'middle', y: 4 }, g, text);
    labels.push([t, bg]);
    return g;
  }
  function sizeLabels() {
    for (const [t, bg] of labels) {
      try {
        const b = t.getBBox();
        bg.setAttribute('x', b.x - 7); bg.setAttribute('y', b.y - 3);
        bg.setAttribute('width', b.width + 14); bg.setAttribute('height', b.height + 6);
      } catch (e) { /* hidden on this screen size */ }
    }
  }
  function arrow(parent, a, b, cls, mk, curve = 0) {
    const mx = (a[0] + b[0]) / 2 - (b[1] - a[1]) * curve, my = (a[1] + b[1]) / 2 + (b[0] - a[0]) * curve;
    return el('path', { d: `M${a[0]},${a[1]}Q${mx},${my} ${b[0]},${b[1]}`, class: cls, 'marker-end': `url(#${mk})` }, parent);
  }
  const blob = (parent, lon, lat, plane, warm, rx = 46, ry = 24) => {
    const [x, y] = P(lon, lat, plane);
    return el('ellipse', { cx: x, cy: y, rx, ry, fill: `url(#${warm ? 'w4Warm' : 'w4Cool'})` }, parent);
  };

  // ---------- South-polar view ----------
  const gPolar = group('polar');
  el('circle', { cx: POLAR.cx, cy: POLAR.cy, r: POLAR.R + 6, class: 'w4-polar-rim' }, gPolar);
  el('circle', { cx: POLAR.cx, cy: POLAR.cy, r: POLAR.R, fill: 'url(#w4Polar)' }, gPolar);
  const polarSpin = el('g', { class: 'w4-polar-spin' }, gPolar);
  const polarBlobs = el('g', {}, polarSpin);
  WARM.concat(COOL).forEach(([lon, lat], i) => {
    const [x, y] = Q(lon, lat);
    el('circle', { cx: x, cy: y, r: 46, fill: `url(#${i < 4 ? 'w4Warm' : 'w4Cool'})` }, polarBlobs);
  });
  for (const k in LAND) {
    el('path', { d: ptsToPath(LAND[k].map(([lo, la]) => Q(lo, la))) + 'Z', class: 'w4-land' }, polarSpin);
  }
  const ant = [];
  for (let a = 0; a < 360; a += 10) ant.push(Q(a, -66 + 3 * Math.sin(a * 0.07) + 2 * Math.cos(a * 0.19)));
  el('path', { d: ptsToPath(ant) + 'Z', class: 'w4-ice' }, polarSpin);
  const ring = [];
  for (let lon = 0; lon <= 360; lon += 3) ring.push(Q(lon, -37 - 5 * Math.cos(4 * (lon - 152) * Math.PI / 180)));
  el('path', { d: ptsToPath(ring) + 'Z', class: 'w4-ring' }, polarSpin);
  label(gPolar, POLAR.cx, POLAR.cy + 4, 'South Pole', 'w4-label w4-label--small');
  label(gPolar, POLAR.cx, 34, '4 warm + 4 cool patches circle the globe', 'w4-label');

  // ---------- Planes ----------
  const gPlanes = group('planes');
  const corners = plane => [P(100, -10, plane), P(460, -10, plane), P(460, -60, plane), P(100, -60, plane)];
  const drawPlane = (plane, cls, title) => {
    const g = el('g', {}, gPlanes);
    el('path', { d: ptsToPath(corners(plane)) + 'Z', class: cls }, g);
    for (const k in LAND) el('path', { d: ptsToPath(LAND[k].map(([lo, la]) => P(lo, la, plane))) + 'Z', class: plane === 'ocean' ? 'w4-land' : 'w4-land-ghost' }, g);
    const [bx, by] = P(100, -10, plane);
    el('text', { x: bx, y: by - 10, class: 'w4-plane-title' }, g, title);
    return g;
  };
  drawPlane('air', 'w4-plane w4-plane--air', 'Upper atmosphere (about 10 km up)');
  drawPlane('ocean', 'w4-plane w4-plane--ocean', 'Ocean surface');
  const [ex, ey] = P(460, -60, 'ocean');
  el('text', { x: ex, y: ey + 22, class: 'w4-plane-note', 'text-anchor': 'end' }, gPlanes, 'East →');
  const [px, py] = P(100, -60, 'ocean');
  el('text', { x: px, y: py + 22, class: 'w4-plane-note' }, gPlanes, '10°S (back) to 60°S (front), from 100°E');

  // ---------- Trigger: warm water near New Zealand ----------
  const gTrigger = group('trigger');
  const trig = blob(gTrigger, SRC[0], SRC[1], 'ocean', true, 52, 26);
  trig.classList.add('w4-pulse');
  const [sx, sy] = P(SRC[0], SRC[1], 'ocean');
  for (let i = 0; i < 3; i++) el('path', { d: `M${sx - 14 + i * 14},${sy - 8} q-6,-10 0,-20 q6,-10 0,-20`, class: 'w4-heat', style: `animation-delay:${i * 0.4}s` }, gTrigger);
  label(gTrigger, sx - 70, sy + 34, 'Warm water near New Zealand', 'w4-label w4-label--warm');

  // ---------- Rising air, cloud and divergence ----------
  const gPlume = group('plume');
  const [ax, ay] = P(SRC[0], SRC[1], 'air');
  [-14, 0, 14].forEach((dx, i) => el('path', { d: `M${sx + dx},${sy - 12} L${ax + dx},${ay + 26}`, class: 'w4-updraft', 'marker-end': 'url(#w4ArrGreen)', style: `animation-delay:${i * 0.25}s` }, gPlume));
  cloud(gPlume, ax - 4, ay + 70, 1.15, true);
  [[-1, -0.4], [1, -0.4], [-1, 0.5], [1, 0.5]].forEach(([dx, dy]) => arrow(gPlume, [ax + dx * 10, ay + dy * 8], [ax + dx * 52, ay + dy * 26], 'w4-diverge', 'w4ArrNavy'));
  label(gPlume, ax + 118, ay + 60, 'Heat released in clouds', 'w4-label');
  label(gPlume, ax + 112, ay - 30, 'Air spreads out high up', 'w4-label');

  // ---------- Jet stream, highs and lows ----------
  const gJet = group('jet');
  const jet = el('path', { class: 'w4-jet', 'marker-end': 'url(#w4ArrJet)' }, gJet);
  const jetLabel = label(gJet, ...(() => { const [x, y] = P(108, -24, 'air'); return [x + 44, y]; })(), 'Jet stream', 'w4-label w4-label--jet');
  const hl = [];
  HIGHS.forEach(lon => hl.push({ lon, high: true }));
  LOWS.forEach(lon => hl.push({ lon, high: false }));
  hl.forEach(h => {
    const [x, y] = P(h.lon, JET_LAT + (h.high ? 3 : -3), 'air');
    h.node = el('g', { class: 'w4-hl', transform: `translate(${x},${y})` }, gJet);
    el('circle', { r: 13, class: h.high ? 'w4-hl-h' : 'w4-hl-l' }, h.node);
    el('text', { y: 5, 'text-anchor': 'middle', class: 'w4-hl-text' }, h.node, h.high ? 'H' : 'L');
  });
  const dayText = el('text', { class: 'w4-day', 'text-anchor': 'end' }, svg);
  { const [x, y] = P(460, -10, 'air'); dayText.setAttribute('x', x); dayText.setAttribute('y', y - 12); }

  // Distance travelled eastward from the trigger, in degrees
  const fromSource = lon => ((lon - SRC[0]) % 360 + 360) % 360;
  // front: degrees travelled east of the source; 400 = gone all the way round and settled
  function drawJet(front, ampScale) {
    const full = clamp((front - 360) / 40), pts = [];
    for (let lon = 100; lon <= 460; lon += 2) {
      const d = fromSource(lon);
      const env = clamp((front - d) / 35) * lerp(clamp(d / 25), 1, full);
      const off = -JET_AMP * ampScale * env * Math.cos(4 * (lon - HIGHS[0]) * Math.PI / 180);
      pts.push(P(lon, JET_LAT + off, 'air'));
    }
    jet.setAttribute('d', ptsToPath(pts));
    hl.forEach(h => { h.node.style.opacity = ampScale * clamp((front - fromSource(h.lon) - 10) / 25); });
  }

  // ---------- Same highs and lows near the surface ----------
  const gBaro = group('baro');
  hl.forEach(h => {
    const [x, y] = P(h.lon, JET_LAT + (h.high ? 3 : -3), 'ocean');
    const g = el('g', { class: 'w4-hl w4-hl--small', transform: `translate(${x},${y})` }, gBaro);
    el('circle', { r: 10, class: h.high ? 'w4-hl-h' : 'w4-hl-l' }, g);
    el('text', { y: 4, 'text-anchor': 'middle', class: 'w4-hl-text w4-hl-text--small' }, g, h.high ? 'H' : 'L');
  });
  [HIGHS[1], LOWS[2]].forEach(lon => {
    const [x1, y1] = P(lon, JET_LAT, 'air'), [, y2] = P(lon, JET_LAT, 'ocean');
    el('line', { x1, y1: y1 + 16, x2: x1, y2: y2 - 14, class: 'w4-connector' }, gBaro);
  });
  { const [x, y] = P(HIGHS[1], JET_LAT, 'air'); label(gBaro, x + 92, (y + P(HIGHS[1], JET_LAT, 'ocean')[1]) / 2, 'Same highs and lows top to bottom', 'w4-label'); }

  // ---------- Winds and evaporation ----------
  const gWinds = group('winds');
  WARM.forEach(([lon]) => {
    arrow(gWinds, P(lon, -27, 'ocean'), P(lon, -47, 'ocean'), 'w4-wind w4-wind--warm', 'w4ArrWarm');
    const [x, y] = P(lon, -27, 'ocean');
    label(gWinds, x + 4, y - 14, 'warm & moist', 'w4-label w4-label--tiny w4-label--warm');
    el('path', { d: `M${x + 22},${y + 30} q-4,-6 0,-12`, class: 'w4-vapour w4-vapour--weak' }, gWinds);
  });
  COOL.forEach(([lon]) => {
    arrow(gWinds, P(lon, -50, 'ocean'), P(lon, -27, 'ocean'), 'w4-wind w4-wind--cool', 'w4ArrCool');
    const [x, y] = P(lon, -50, 'ocean');
    label(gWinds, x, y + 18, 'cool & dry', 'w4-label w4-label--tiny w4-label--cool');
    [0, 1, 2].forEach(i => el('path', { d: `M${x + 18 + i * 9},${y - 28} q-5,-8 0,-16 q5,-8 0,-16`, class: 'w4-vapour', style: `animation-delay:${i * 0.3}s` }, gWinds));
  });
  { const [x, y] = P(100, -10, 'ocean'); label(gWinds, x + 290, y - 36, 'Wavy lines: evaporation (more where air is cool and dry)', 'w4-label w4-label--small'); }

  // ---------- Mixed-layer cross-section ----------
  const gColumn = group('column');
  el('rect', { x: 120, y: 60, width: 760, height: 500, rx: 22, class: 'w4-panel' }, gColumn);
  const column = (x, shallow) => {
    const g = el('g', {}, gColumn);
    const top = 300, depth = 220, ml = shallow ? 44 : 150;
    el('rect', { x, y: top, width: 270, height: depth, rx: 10, fill: 'url(#w4Deep)' }, g);
    const mlRect = el('rect', { x, y: top, width: 270, height: ml, rx: 10, class: 'w4-ml' }, g);
    el('line', { x1: x, x2: x + 270, y1: top + ml, y2: top + ml, class: 'w4-ml-base' }, g);
    el('text', { x: x + 278, y: top + ml + 4, class: 'w4-small' }, g, shallow ? 'shallow' : 'deep');
    sun(g, x + 60, 120, 1);
    for (let i = 0; i < 4; i++) el('line', { x1: x + 60 + i * 16, y1: 146, x2: x + 52 + i * 16, y2: top + (shallow ? 30 : 100), class: 'w4-sunbeam', style: `animation-delay:${i * 0.2}s` }, g);
    const nv = shallow ? 1 : 4;
    for (let i = 0; i < nv; i++) el('path', { d: `M${x + 180 + i * 18},${top - 8} q-6,-10 0,-20 q6,-10 0,-20`, class: 'w4-vapour', style: `animation-delay:${i * 0.25}s` }, g);
    if (!shallow) [0, 1].forEach(i => el('path', { d: `M${x + 70 + i * 120},${top + 20} c30,10 30,60 0,90 c-20,-10 -20,-40 0,-50`, class: 'w4-mix', 'marker-end': 'url(#w4ArrNavy)' }, g));
    const th = el('g', { transform: `translate(${x + 240},${top - 92})` }, g);
    el('rect', { x: -7, y: 0, width: 14, height: 60, rx: 7, class: 'w4-thermo' }, th);
    el('circle', { cx: 0, cy: 66, r: 11, class: shallow ? 'w4-thermo-bulb w4-thermo-bulb--warm' : 'w4-thermo-bulb' }, th);
    const fill = el('rect', { x: -4, y: 40, width: 8, height: 26, rx: 4, class: shallow ? 'w4-thermo-fill w4-thermo-fill--warm' : 'w4-thermo-fill' }, th);
    el('text', { x: x + 135, y: 92, 'text-anchor': 'middle', class: 'w4-col-title' }, g, shallow ? 'Less evaporation' : 'More evaporation');
    el('text', { x: x + 135, y: top + depth + 26, 'text-anchor': 'middle', class: 'w4-small w4-col-note' }, g,
      shallow ? 'Light water stays on top: thin layer warms' : 'Heavy water mixes down: thick layer stays cool');
    return { mlRect, fill, shallow };
  };
  const cols = [column(170, true), column(560, false)];

  // ---------- Mature SST pattern and its timeline ----------
  const gSST = group('sst');
  const sstBlobs = WARM.map(([lo, la]) => blob(gSST, lo, la, 'ocean', true)).concat(COOL.map(([lo, la]) => blob(gSST, lo, la, 'ocean', false)));
  const gTimeline = group('timeline');
  const MONTHS = ['Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May'];
  const tlX = i => 300 + i * 66, tlY = 345;
  el('line', { x1: tlX(0), x2: tlX(6), y1: tlY, y2: tlY, class: 'w4-tl' }, gTimeline);
  MONTHS.forEach((m, i) => el('text', { x: tlX(i), y: tlY - 10, 'text-anchor': 'middle', class: 'w4-small' }, gTimeline, m));
  const tlDot = el('circle', { cy: tlY, r: 7, class: 'w4-tl-dot' }, gTimeline);
  const tlNote = el('text', { x: tlX(6) + 24, y: tlY + 4, class: 'w4-small' }, gTimeline);
  const SST_CURVE = [0, 0.45, 0.85, 1, 0.8, 0.5, 0.12], AIR_CURVE = [0.35, 1, 1, 0.65, 0.3, 0.1, 0];
  const curve = (c, m) => { const i = Math.min(5, Math.floor(m)); return lerp(c[i], c[i + 1], m - i); };

  // ---------- Impacts through the atmosphere ----------
  const gImpactAir = group('impactAir');
  [[385, -27, false], [128, -25, false], [149, -29, true], [298, -31, true], [318, -15, false]].forEach(([lon, lat, up], i) => {
    const [x, y1] = P(lon, lat, 'air'), [, y2] = P(lon, lat, 'ocean');
    const a = up ? [x, y2 - 30] : [x, y1 + 20], b = up ? [x, y1 + 20] : [x, y2 - 30];
    el('path', { d: `M${a[0]},${a[1]}L${b[0]},${b[1]}`, class: up ? 'w4-vert w4-vert--up' : 'w4-vert w4-vert--down', 'marker-end': `url(#${up ? 'w4ArrGreen' : 'w4ArrBrown'})`, style: `animation-delay:${i * 0.2}s` }, gImpactAir);
    if (up) cloud(gImpactAir, x, y2 - 18, 0.6, true); else sun(gImpactAir, x, y2 - 24, 0.6, true);
  });
  { const [x, y] = P(100, -10, 'ocean'); label(gImpactAir, x + 640, y - 40, 'Rising air: rain   ·   Sinking air: dry', 'w4-label w4-label--small'); }

  // ---------- Impacts through the ocean (Australia) ----------
  const gImpactOcean = group('impactOcean');
  blob(gImpactOcean, 130, -42, 'ocean', true, 58, 28).classList.add('w4-pulse');
  blob(gImpactOcean, 95, -33, 'ocean', false, 40, 22);
  blob(gImpactOcean, 175, -39, 'ocean', false, 44, 22);
  [[124, -46, 128, -30], [134, -47, 138, -31], [143, -45, 147, -32]].forEach(([lo1, la1, lo2, la2], i) =>
    arrow(gImpactOcean, P(lo1, la1, 'ocean'), P(lo2, la2, 'ocean'), 'w4-moist', 'w4ArrTeal', 0.15).setAttribute('style', `animation-delay:${i * 0.3}s`));
  { const [x, y] = P(137, -26, 'ocean'); cloud(gImpactOcean, x, y - 26, 0.75, true); label(gImpactOcean, x + 270, y - 64, 'Moist air pushed onto Australia', 'w4-label'); }

  // ---------- Decadal heartbeat ----------
  const gDecadal = group('decadal');
  { const [x, y] = P(SRC[0], SRC[1], 'ocean'); el('ellipse', { cx: x, cy: y, rx: 64, ry: 32, fill: 'url(#w4Glow)', class: 'w4-pulse-slow' }, gDecadal); }
  { const [x, y] = P(SRC[0], SRC[1], 'ocean'); label(gDecadal, x + 30, y + 44, 'Leftover warmth from the South Pacific Meridional Mode', 'w4-label w4-label--warm'); }
  { const [x1, y1] = P(SRC[0], SRC[1], 'ocean'), [, y2] = P(SRC[0], SRC[1], 'air');
    el('path', { d: `M${x1 - 30},${y1 - 20} C${x1 - 120},${y1 - 120} ${x1 - 120},${y2 + 60} ${x1 - 20},${y2 + 30}`, class: 'w4-loop', 'marker-end': 'url(#w4ArrWarm)' }, gDecadal);
    el('path', { d: `M${x1 + 30},${y2 + 30} C${x1 + 120},${y2 + 70} ${x1 + 120},${y1 - 110} ${x1 + 34},${y1 - 22}`, class: 'w4-loop', 'marker-end': 'url(#w4ArrWarm)' }, gDecadal);
    label(gDecadal, x1 + 160, (y1 + y2) / 2 + 10, 'The chain re-starts, year after year', 'w4-label'); }
  [[300, -26, 'rain'], [387, -26, 'rain'], [133, -24, 'dry']].forEach(([lon, lat, kind]) => {
    const [x, y] = P(lon, lat, 'ocean');
    if (kind === 'rain') cloud(gDecadal, x, y - 18, 0.62, true); else sun(gDecadal, x, y - 22, 0.62, true);
  });

  // ---------- Scenes ----------
  const SCENES = [
    { chapter: 'Meet the pattern', title: 'A ring of eight ocean patches',
      text: 'Across the Southern Hemisphere, between about 20°S and 55°S, the sea surface sometimes forms a ring of four warm and four cool patches that alternate all the way around the globe. Because the ring holds four waves, it is called the wavenumber-4 pattern. It appears in the atmosphere too, and it shapes rainfall and extremes over the southern continents.',
      layers: ['polar'] },
    { chapter: 'Origin', title: 'It starts with warm water near New Zealand',
      text: 'Around November, unusually warm water in the southwestern subtropical Pacific, near New Zealand, heats the air above it. Keep an eye on the jet stream in the upper atmosphere: it is about to be disturbed.',
      layers: ['planes', 'trigger', 'jet'], jet: () => [0, 0] },
    { chapter: 'Origin', title: 'Rising air, clouds and rain',
      text: 'The warm, light air rises. As it climbs and cools, its moisture condenses into cloud and rain, releasing heat. This heating makes air spread outward high in the atmosphere, and the stretching of the air column below gives the jet stream a kick.',
      layers: ['planes', 'trigger', 'plume', 'jet'], jet: () => [0, 0] },
    { chapter: 'Origin', title: 'The jet stream starts to wobble',
      text: 'The kick pushes the jet stream towards the pole. Earth’s rotation pulls it back towards the equator, it overshoots, and an undulation is born: a Rossby wave. Earth’s rotation acts as the restoring force.',
      layers: ['planes', 'trigger', 'plume', 'jet'], jet: t => [Math.min(75, 12 + t * 16), 1] },
    { chapter: 'Origin', title: 'Trapped in the jet, the wave circles the globe',
      text: 'The southern subtropical jet acts as a waveguide. Trapped inside it, the disturbance travels eastward all the way around the hemisphere. Within about 15–25 days, by early December, four highs and four lows sit around the globe: the atmospheric wavenumber-4 pattern.',
      layers: ['planes', 'jet', 'day'], jet: t => [Math.min(400, t * 36), 1],
      tick: t => { const f = t * 36; dayText.textContent = f < 360 ? `Day ${Math.round(f / 360 * 20)}` : 'Early December: pattern in place'; } },
    { chapter: 'Origin', title: 'The same pattern from top to bottom',
      text: 'The pattern is quasi-barotropic: its highs and lows reach from the upper atmosphere all the way down to the sea surface. So the winds blowing over the ocean change too, and that is where the ocean joins the story.',
      layers: ['planes', 'jet', 'baro'], jet: () => [400, 1] },
    { chapter: 'Ocean response', title: 'Winds change how much the sea evaporates',
      text: 'Between the highs and lows, winds blow north or south. Winds from the equator bring warm, moist air, so less water evaporates and the sea loses less heat. Winds from the pole bring cool, dry air, which makes more water evaporate.',
      layers: ['planes', 'jet', 'baro', 'winds'], jet: () => [400, 1] },
    { chapter: 'Ocean response', title: 'Thin layers warm, thick layers stay cool',
      text: 'Less evaporation leaves lighter surface water, so the well-mixed layer at the top of the ocean stays shallow, and summer sunshine heats this thin layer quickly. More evaporation makes the surface water heavier; it mixes downward and the layer deepens, spreading the same sunshine through more water, so it stays cooler.',
      layers: ['column'],
      tick: t => cols.forEach(c => {
        const f = clamp(t / 4);
        c.mlRect.style.fill = c.shallow ? `rgb(${Math.round(lerp(150, 255, f))},${Math.round(lerp(205, 160, f))},${Math.round(lerp(240, 120, f))})` : '#8cc3ea';
        const h = c.shallow ? lerp(26, 56, f) : lerp(26, 32, f);
        c.fill.setAttribute('height', h); c.fill.setAttribute('y', 66 - h);
      }) },
    { chapter: 'Ocean response', title: 'The ocean pattern peaks, then fades',
      text: 'By December–February the four warm and four cool patches form the SST wavenumber-4 pattern. The atmosphere cannot hold its pattern for long, but the ocean remembers: mixed-layer feedbacks keep the SST pattern going until about April–May, when the forcing has gone, evaporation changes reverse and cooler water mixed up from below finally erases it.',
      layers: ['planes', 'jet', 'sst', 'timeline'],
      tick: t => {
        const m = reduceMotion ? 3 : (t % 13) / 13 * 6.4;
        const mm = Math.min(6, m);
        const s = curve(SST_CURVE, mm), a = curve(AIR_CURVE, mm);
        sstBlobs.forEach(b => { b.style.opacity = s; });
        drawJet(400, a);
        tlDot.setAttribute('cx', lerp(tlX(0), tlX(6), mm / 6));
        tlNote.textContent = mm < 1 ? 'atmosphere first' : mm < 3.5 ? 'SST pattern grows' : mm < 5.5 ? 'ocean memory' : 'pattern fades';
      } },
    { chapter: 'Impacts', title: 'Rain and drought through the air',
      text: 'The highs and lows push air upward in some places and downward in others. Rising air brings cloud and rain; sinking air brings dry spells. This shifts summer rainfall over parts of South America, Australia and southern Africa, with wetter and drier regions side by side.',
      layers: ['planes', 'jet', 'impactAir'], jet: () => [400, 1] },
    { chapter: 'Impacts', title: 'Rain fed by the ocean',
      text: 'The warm and cool patches also steer moisture. Warm water south of Australia drives winds that carry moist air onto the continent, where it converges and falls as rain. This links the SST pattern to Australian rainfall from year to year.',
      layers: ['planes', 'impactOcean'] },
    { chapter: 'Decadal', title: 'A decadal heartbeat',
      text: 'The pattern also varies from decade to decade. When the South Pacific Meridional Mode fades, it leaves warm or cool water behind in the southwestern subtropical Pacific. These leftovers keep re-triggering the same chain, so some decades have more positive events and others more negative ones, shifting rainfall over the southern continents for years at a time: in one phase, South America and southern Africa get wetter while Australia gets drier.',
      layers: ['planes', 'decadal', 'sst'], tick: () => sstBlobs.forEach(b => { b.style.opacity = 0.35; }) },
    { chapter: 'Read more', title: 'Explore the research',
      html: 'This story summarises four papers: <a href="https://doi.org/10.1038/s41598-020-80492-x" target="_blank" rel="noopener">the SST pattern (Scientific Reports, 2021)</a>, <a href="https://doi.org/10.1007/s00382-021-06040-z" target="_blank" rel="noopener">its atmospheric origin (Climate Dynamics, 2022)</a>, <a href="https://doi.org/10.1029/2022GL099046" target="_blank" rel="noopener">its decadal variability (GRL, 2022)</a> and <a href="https://doi.org/10.1029/2023JC020801" target="_blank" rel="noopener">its life cycle in a coupled model (JGR-Oceans, 2024)</a>. There is also a <a href="https://blogs.reading.ac.uk/weather-and-climate-at-reading/2023/wavenumber-4-in-the-southern-hemisphere-how-does-it-generate-why-does-it-matter/" target="_blank" rel="noopener">blog post</a>, and the <a href="sintex-f2.html">simulations and models</a> behind the work.',
      layers: ['polar'] },
  ];

  // ---------- Player ----------
  let current = 0, start = performance.now(), auto = null;
  const panel = { chapter: document.getElementById('storyChapter'), title: document.getElementById('storyTitle'), text: document.getElementById('storyText'),
    count: document.getElementById('storyCount'), prev: document.getElementById('storyPrev'), next: document.getElementById('storyNext'),
    dots: document.getElementById('storyDots'), play: document.getElementById('storyPlay') };

  SCENES.forEach((s, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'story__dot';
    b.setAttribute('aria-label', `Scene ${i + 1}: ${s.title}`);
    b.title = s.title;
    b.addEventListener('click', () => go(i));
    panel.dots.appendChild(b);
  });

  function go(i) {
    current = (i + SCENES.length) % SCENES.length;
    start = performance.now();
    const s = SCENES[current];
    for (const name in groups) groups[name].classList.toggle('is-on', s.layers.includes(name));
    dayText.classList.toggle('is-on', s.layers.includes('day'));
    if (!s.layers.includes('day')) dayText.textContent = '';
    if (s.layers.includes('sst') && !s.tick) sstBlobs.forEach(b => { b.style.opacity = 1; });
    panel.chapter.textContent = s.chapter;
    panel.title.textContent = s.title;
    if (s.html) panel.text.innerHTML = s.html; else panel.text.textContent = s.text;
    panel.count.textContent = `${current + 1} / ${SCENES.length}`;
    panel.prev.disabled = current === 0;
    panel.next.textContent = current === SCENES.length - 1 ? 'Start again ↺' : 'Next →';
    [...panel.dots.children].forEach((d, k) => d.setAttribute('aria-current', k === current ? 'step' : 'false'));
    history.replaceState(null, '', '#scene-' + (current + 1));
    frame(performance.now());
  }

  function frame(now) {
    const s = SCENES[current];
    const t = !isNaN(fixedT) ? fixedT : reduceMotion ? 60 : (now - start) / 1000;
    if (s.jet) { const [front, amp] = s.jet(t); drawJet(front, amp); }
    if (s.tick) s.tick(t);
  }
  function loop(now) {
    frame(now);
    requestAnimationFrame(loop);
  }

  panel.prev.addEventListener('click', () => go(current - 1));
  panel.next.addEventListener('click', () => go(current + 1));
  panel.play.addEventListener('click', () => {
    if (auto) { clearInterval(auto); auto = null; panel.play.textContent = '▶ Auto-play'; return; }
    auto = setInterval(() => go(current + 1), 11000);
    panel.play.textContent = '❚❚ Pause';
  });
  document.addEventListener('keydown', e => {
    if (e.target.closest('input, select, textarea')) return;
    if (e.key === 'ArrowRight') go(current + 1);
    if (e.key === 'ArrowLeft' && current > 0) go(current - 1);
  });
  let downX = null;
  svg.addEventListener('pointerdown', e => { downX = e.clientX; });
  svg.addEventListener('pointerup', e => {
    if (downX == null) return;
    const dx = e.clientX - downX;
    downX = null;
    if (Math.abs(dx) > 50) go(current + (dx < 0 ? 1 : -1));
  });

  const fromHash = /^#scene-(\d+)$/.exec(location.hash);
  go(fromHash ? Math.min(SCENES.length, +fromHash[1]) - 1 : 0);
  sizeLabels();
  if (document.fonts) document.fonts.ready.then(sizeLabels);
  let resizeTimer;
  window.addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(sizeLabels, 150); });
  if (!reduceMotion) requestAnimationFrame(loop);
})();
