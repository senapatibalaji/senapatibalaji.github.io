// "Why the monsoon comes late": a cartoon story, told simply enough for a child to follow, of why the Indian
// summer monsoon rain sometimes reaches Kerala late: a weak wet southwesterly wind, high pressure over the
// Arabian Sea, a weaker Mascarene High and a weaker regional Hadley circulation, until the warming Arabian Sea
// brings the rain. Based on Wadhai, Senapati, Dash & Behera (2026, Geophysical Research Letters).
(() => {
  const svg = document.getElementById('monStage');
  if (!svg) return;

  const NS = 'http://www.w3.org/2000/svg';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fixedT = parseFloat(new URLSearchParams(location.search).get('t'));   // ?t=8 freezes scenes at 8 s (for checking)
  if (!isNaN(fixedT)) svg.classList.add('is-static');
  const el = (tag, attrs = {}, parent = svg, text = null) => {
    const n = document.createElementNS(NS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    if (text != null) n.textContent = text;
    parent.appendChild(n);
    return n;
  };
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, f) => a + (b - a) * f;
  const ramp = (v, a, b) => clamp((v - a) / (b - a));          // 0 before a, 1 after b
  const f1 = v => v.toFixed(1);
  const f2 = v => v.toFixed(2);

  // Smooth curve through points (Catmull-Rom as cubic Béziers), for rounded cartoon coastlines and winds
  function smooth(pts, closed = true) {
    const n = pts.length, at = i => closed ? pts[(i + n) % n] : pts[clamp(i, 0, n - 1)];
    let d = `M${f1(pts[0][0])},${f1(pts[0][1])}`;
    for (let i = 0; i < (closed ? n : n - 1); i++) {
      const p0 = at(i - 1), p1 = at(i), p2 = at(i + 1), p3 = at(i + 2);
      d += `C${f1(p1[0] + (p2[0] - p0[0]) / 6)},${f1(p1[1] + (p2[1] - p0[1]) / 6)} ` +
        `${f1(p2[0] - (p3[0] - p1[0]) / 6)},${f1(p2[1] - (p3[1] - p1[1]) / 6)} ${f1(p2[0])},${f1(p2[1])}`;
    }
    return closed ? d + 'Z' : d;
  }
  const waveLine = (x1, x2, y, step, amp = 7) => {
    let d = `M${x1},${y}`;
    for (let x = x1; x < x2 - 1; x += step) d += `q${step / 4},${-amp} ${step / 2},0t${step / 2},0`;
    return d;
  };

  // ---------- Map of the Arabian Sea and the Indian Ocean, with an explainer card beside it ----------
  const MAP = { lon0: 30, lon1: 100, lat0: 33, lat1: -35, x0: 30, x1: 600, y0: 18, y1: 582 };
  const M = (lon, lat) => [MAP.x0 + (lon - MAP.lon0) / (MAP.lon1 - MAP.lon0) * (MAP.x1 - MAP.x0),
    MAP.y0 + (MAP.lat0 - lat) / (MAP.lat0 - MAP.lat1) * (MAP.y1 - MAP.y0)];
  const LAND = {                                                 // the same hand-drawn outlines as the horseshoe story
    africa: [[10, 34], [32, 34], [32.6, 29.9], [33.6, 27.6], [35.2, 24.6], [37.2, 21], [38.6, 17.8], [39.7, 15.5], [41.6, 13.6], [43.2, 12], [44.6, 10.5], [47.3, 11.2], [51.2, 11.8], [51, 10.3], [49.8, 7.8], [48.5, 5.2], [46, 2], [43.5, -0.4], [41.5, -2], [40, -3.6], [39.2, -6], [39.6, -8.6], [40.4, -10.8], [40.6, -14.6], [39.6, -16.6], [37, -18.2], [35.4, -20.6], [35.4, -23.6], [33.2, -25.6], [32.8, -28.4], [31, -30.2], [29, -32.2], [27, -33.6], [25, -34], [22, -34.2], [20, -34.8], [18.4, -34], [18, -32], [14, -25], [12, -15], [10, 0], [5, 8], [0, 10]],
    madagascar: [[44, -25.1], [47.1, -25.1], [48.9, -20.5], [50.4, -15.5], [49.4, -12], [47.5, -13.5], [44.3, -16.5], [43.3, -21.5]],
    arabia: [[34.9, 29.5], [35.5, 28], [36.6, 25.8], [38.4, 22.6], [39.6, 20.2], [41.4, 17.4], [42.6, 15], [43.4, 12.8], [45, 12.9], [48.6, 14.1], [51.6, 15.3], [52.4, 16.4], [55, 17.6], [56.9, 18.8], [58.6, 20.6], [59.8, 22.4], [58.8, 23.6], [57.2, 24], [56.4, 25.6], [56.3, 26.3], [55, 24.6], [53, 24.1], [51.5, 24.5], [51.3, 26], [50.2, 26.6], [49, 28.3], [48.2, 29.9], [47.9, 31.5], [47, 34], [36, 34], [34.9, 31]],
    asia: [[47.9, 31.5], [48.6, 30], [50.2, 29.2], [51.4, 27.9], [52.6, 27.4], [54.8, 26.5], [56.2, 27.1], [57.3, 25.9], [59.4, 25.4], [61.6, 25.2], [64, 25.3], [66.6, 25.4], [67.4, 24], [68.6, 23.3], [70.1, 23], [69, 22.3], [70.4, 20.9], [72.3, 21.2], [72.8, 19.2], [73.2, 17.2], [73.7, 15.6], [74.4, 14], [74.9, 12.6], [75.8, 11], [76.3, 9.6], [77.5, 8.1], [78.2, 9], [79.3, 10.3], [79.8, 12.6], [80.2, 15.4], [81.4, 16.4], [82.4, 17.2], [84.2, 18.6], [85.6, 19.8], [86.9, 21.3], [88.6, 21.7], [90.4, 22], [91.6, 22.6], [92.2, 21], [92.9, 19.8], [94.2, 18.4], [94.4, 16.2], [95.4, 15.8], [97.6, 16.6], [98.2, 13.4], [98.6, 10.4], [98.3, 8.2], [100.2, 6.6], [100.4, 4], [101.4, 2.8], [103.4, 1.4], [104.2, 1.5], [103.5, 3.6], [103.4, 5.2], [102.2, 6.2], [100.8, 7.6], [100.2, 9.6], [99.6, 11.4], [100, 12.8], [100.8, 13.4], [101.6, 12.6], [102.6, 12], [104.2, 10.6], [104.8, 8.6], [106.6, 9.6], [107.6, 10.6], [109.2, 11.6], [109.4, 13.6], [108.8, 15.6], [107.2, 16.8], [106.2, 18.8], [106.6, 20.4], [108.2, 21.6], [110, 21], [110.6, 21.4], [112.4, 21.8], [114.2, 22.3], [116.6, 23], [118.6, 24.6], [120, 26.6], [121.5, 28.4], [122, 31], [160, 34], [45, 34]],
    sriLanka: [[79.9, 9.8], [80.5, 9.7], [81.4, 8.4], [81.9, 7], [81.6, 6.2], [80.6, 5.9], [79.9, 6.8], [79.7, 8.2]],
    sumatra: [[95.3, 5.6], [97.5, 5.2], [100.3, 2.3], [103.7, -0.9], [106, -3], [105.8, -5.8], [104.5, -5.9], [102.3, -4], [100.5, -1.2], [98.7, 1.7], [95.4, 3.7]],
  };
  const KERALA = M(76.2, 10.2), INDIA_LOW = M(77, 23.5), AS_HIGH = M(64, 16.5), MASCARENE = M(63, -29), SWIRL = M(70.5, 9);
  const CX = 794;                                                // centre of the explainer card

  // ---------- Definitions ----------
  const defs = el('defs');
  const radial = (id, stops) => {
    const g = el('radialGradient', { id }, defs);
    stops.forEach(([o, c, a]) => el('stop', { offset: o, 'stop-color': c, 'stop-opacity': a }, g));
  };
  const linear = (id, stops, vertical = false) => {
    const g = el('linearGradient', { id, x1: 0, y1: 0, x2: vertical ? 0 : 1, y2: vertical ? 1 : 0 }, defs);
    stops.forEach(([o, c, a = 1]) => el('stop', { offset: o, 'stop-color': c, 'stop-opacity': a }, g));
  };
  radial('monHigh', [[0, '#4a90d9', 0.5], [0.6, '#8fbfee', 0.28], [1, '#cfe4f8', 0]]);
  radial('monLow', [[0, '#e03131', 0.42], [0.6, '#ff8787', 0.24], [1, '#ffc9c9', 0]]);
  radial('monWarm', [[0, '#f76707', 0.8], [0.6, '#ffa94d', 0.48], [1, '#ffd8a8', 0]]);
  radial('monBalloon', [[0, '#d0ebff', 1], [1, '#74c0fc', 1]]);
  linear('monSea', [[0, '#d9effb'], [1, '#bfe2f5']], true);
  linear('monSky', [[0, '#dcefff'], [1, '#fbfdfe']], true);
  linear('monSkyHot', [[0, '#ffe8b0'], [1, '#fff9ec']], true);
  linear('monSkyRain', [[0, '#c3d0dd'], [1, '#eef3f7']], true);
  linear('monWater', [[0, '#74c0fc'], [1, '#3b82c4']], true);
  linear('monWarmWater', [[0, '#ffa94d'], [1, '#e8590c']], true);
  el('rect', { x: MAP.x0, y: MAP.y0, width: MAP.x1 - MAP.x0, height: MAP.y1 - MAP.y0, rx: 18 }, el('clipPath', { id: 'monMapClip' }, defs));
  const marker = (id, color) => {
    const m = el('marker', { id, viewBox: '0 0 10 10', refX: 6, refY: 5, markerWidth: 4, markerHeight: 4, orient: 'auto-start-reverse' }, defs);
    el('path', { d: 'M0,0L10,5L0,10Z', fill: color }, m);
  };
  [['monArrWet', '#0c8599'], ['monArrDry', '#b5651d'], ['monArrUp', '#e03131'], ['monArrDown', '#1c7ed6'],
    ['monArrFlow', '#5c6b7a'], ['monArrSwirl', '#c92a2a'], ['monArrPuff', '#4dabf7'], ['monArrHeat', '#e8590c']].forEach(([id, c]) => marker(id, c));

  const groups = {}, dyn = {};                                   // dyn: elements whose opacity the scenes animate
  const group = (name, parent = svg) => (groups[name] = el('g', { class: 'mon-layer', 'data-layer': name }, parent));
  const COMPANIONS = { map: ['land', 'card'] };                   // layers that always show together

  // ---------- Characters and icons ----------
  function face(parent, x, y, r, mood = 'happy') {
    const g = el('g', { transform: `translate(${f1(x)},${f1(y)})` }, parent);
    if (mood === 'sleepy') [-1, 1].forEach(s => el('path', { d: `M${f1(s * r * 0.5)},${f1(-r * 0.1)}h${f1(-s * r * 0.3)}`, class: 'mon-mouth', 'stroke-width': f1(r * 0.09) }, g));
    else [-1, 1].forEach(s => el('circle', { cx: f1(s * r * 0.35), cy: f1(-r * 0.12), r: f1(r * 0.11), class: 'mon-eye' }, g));
    const smile = `M${f1(-r * 0.32)},${f1(r * 0.18)}Q0,${f1(r * 0.52)} ${f1(r * 0.32)},${f1(r * 0.18)}`;
    const frown = `M${f1(-r * 0.3)},${f1(r * 0.42)}Q0,${f1(r * 0.16)} ${f1(r * 0.3)},${f1(r * 0.42)}`;
    el('path', { d: mood === 'sad' ? frown : smile, class: 'mon-mouth', 'stroke-width': f1(r * 0.1) }, g);
    if (mood === 'happy') [-1, 1].forEach(s => el('circle', { cx: f1(s * r * 0.6), cy: f1(r * 0.16), r: f1(r * 0.13), class: 'mon-blush' }, g));
    return g;
  }
  function rainStreaks(parent, x, y1, y2, n = 5, spread = 70) {
    for (let i = 0; i < n; i++) {
      const xi = n > 1 ? x - spread / 2 + i * spread / (n - 1) : x;
      el('line', { x1: f1(xi), y1: f1(y1), x2: f1(xi - 7), y2: f1(y2), class: 'mon-rain', style: `animation-delay:${(i * 0.13).toFixed(2)}s` }, parent);
    }
  }
  function cloud(parent, x, y, s = 1, mood = 'happy') {
    const g = el('g', { transform: `translate(${f1(x)},${f1(y)}) scale(${s})` }, parent);
    el('path', { d: 'M-50,20 a22,22 0 0,1 6,-40 a30,30 0 0,1 50,-12 a24,24 0 0,1 40,14 a20,20 0 0,1 4,38 Z', class: 'mon-cloud' }, g);
    face(g, 0, 0, 20, mood);
    return g;
  }
  function sun(parent, x, y, s = 1) {
    const g = el('g', { transform: `translate(${f1(x)},${f1(y)}) scale(${s})` }, parent);
    const rays = el('g', { class: 'mon-sunrays' }, g);
    for (let i = 0; i < 10; i++) {
      const a = i * Math.PI / 5;
      el('line', { x1: f1(Math.cos(a) * 29), y1: f1(Math.sin(a) * 29), x2: f1(Math.cos(a) * 39), y2: f1(Math.sin(a) * 39), class: 'mon-ray' }, rays);
    }
    el('circle', { r: 24, class: 'mon-sun' }, g);
    face(g, 0, 2, 20);
    return g;
  }
  const vapour = (parent, x, y, delay = 0) => el('path', { d: `M${f1(x)},${f1(y)} q-6,-9 0,-18 q6,-9 0,-18`, class: 'mon-vapour', style: `animation-delay:${delay.toFixed(2)}s` }, parent);
  const drop = (parent, x, y, s = 1) => el('path', { d: 'M0,-10C4,-4 7,0 7,4A7,7 0 0,1 -7,4C-7,0 -4,-4 0,-10Z', transform: `translate(${f1(x)},${f1(y)}) scale(${s})`, class: 'mon-drop' }, parent);
  function thermometer(parent, x, y, s = 1) {                    // returns a setter for the height of the red column
    const g = el('g', { transform: `translate(${f1(x)},${f1(y)}) scale(${s})` }, parent);
    el('rect', { x: -7, y: -50, width: 14, height: 58, rx: 7, class: 'mon-thermo' }, g);
    const fill = el('rect', { x: -3.5, y: -10, width: 7, height: 18, rx: 3.5, class: 'mon-thermo-fill' }, g);
    el('circle', { cy: 12, r: 11, class: 'mon-thermo-bulb' }, g);
    return h => { fill.setAttribute('height', f1(h)); fill.setAttribute('y', f1(8 - h)); };
  }
  function pressure(parent, x, y, letter, s = 1) {                // high (H, blue) or low (L, red) pressure
    const g = el('g', { transform: `translate(${f1(x)},${f1(y)}) scale(${s})` }, parent);
    el('circle', { r: 70, fill: letter === 'H' ? 'url(#monHigh)' : 'url(#monLow)' }, g);
    el('circle', { r: 24, class: letter === 'H' ? 'mon-badge--h' : 'mon-badge--l' }, g);
    el('text', { y: 9, 'text-anchor': 'middle', class: 'mon-badge-text' }, g, letter);
    return g;
  }
  function swirl(parent, x, y, R) {                              // anticlockwise, as around a northern low
    const at = a => `${f1(x + R * Math.cos(a))},${f1(y - R * Math.sin(a))}`;
    [[0.35, 1.75], [2.45, 3.85], [4.55, 5.95]].forEach(([a0, a1]) =>
      el('path', { d: `M${at(a0)}A${R},${R} 0 0,0 ${at(a1)}`, class: 'mon-swirl', 'marker-end': 'url(#monArrSwirl)' }, parent));
  }
  function farmer(parent, x, y, happy) {
    const g = el('g', { transform: `translate(${f1(x)},${f1(y)})` }, parent);
    el('path', { d: 'M-13,60L-17,110M13,60L17,110', class: 'mon-leg' }, g);
    el('path', { d: happy ? 'M-26,10L-56,-30M26,10L56,-30' : 'M-26,10L-40,54M26,10L40,54', class: 'mon-arm' }, g);
    el('path', { d: 'M-30,2Q0,-10 30,2L26,66Q0,74 -26,66Z', class: 'mon-shirt' }, g);
    el('circle', { cy: -28, r: 25, class: 'mon-skin' }, g);
    face(g, 0, -24, 21, happy ? 'happy' : 'sad');
    el('path', { d: 'M-44,-44Q0,-58 44,-44Q24,-46 20,-60Q0,-74 -20,-60Q-24,-46 -44,-44Z', class: 'mon-hat' }, g);
    return g;
  }
  function sprout(parent, x, y, s, dry) {
    const g = el('g', { transform: `translate(${f1(x)},${f1(y)}) scale(${s})` }, parent);
    if (dry) {
      el('path', { d: 'M0,0Q2,-12 -6,-20', class: 'mon-stem mon-stem--dry' }, g);
      el('path', { d: 'M-6,-20Q-16,-18 -18,-8Q-10,-10 -6,-20Z', class: 'mon-leaf mon-leaf--dry' }, g);
    } else {
      el('path', { d: 'M0,0Q1,-18 0,-32', class: 'mon-stem' }, g);
      el('path', { d: 'M0,-16Q-14,-24 -18,-36Q-4,-32 0,-16Z', class: 'mon-leaf' }, g);
      el('path', { d: 'M0,-24Q14,-32 18,-44Q4,-40 0,-24Z', class: 'mon-leaf' }, g);
    }
  }
  function calendarPage(parent, x, y, w, h) {                     // returns a setter for the month and the day
    const g = el('g', { transform: `translate(${f1(x)},${f1(y)})` }, parent);
    el('rect', { x: -w / 2, width: w, height: h, rx: 14, class: 'mon-cal-page' }, g);
    el('path', { d: `M${-w / 2},14a14,14 0 0,1 14,-14h${w - 28}a14,14 0 0,1 14,14v34h${-w}Z`, class: 'mon-cal-head' }, g);
    [-w / 4, w / 4].forEach(dx => el('rect', { x: dx - 4, y: -10, width: 8, height: 22, rx: 4, class: 'mon-cal-ring' }, g));
    const month = el('text', { y: 33, 'text-anchor': 'middle', class: 'mon-cal-month' }, g);
    const day = el('text', { y: f1(48 + (h - 48) / 2 + 22), 'text-anchor': 'middle', class: 'mon-cal-day' }, g);
    return (m, d) => { month.textContent = m; day.textContent = d; };
  }
  function check(parent, x, y) {
    const g = el('g', { transform: `translate(${f1(x)},${f1(y)})` }, parent);
    el('circle', { r: 18, class: 'mon-check-bg' }, g);
    el('path', { d: 'M-8,0l5,6l11,-12', class: 'mon-check' }, g);
  }

  // Labels get a white rounded background sized to the text; re-measured when fonts load or the layout changes
  const labels = [], chips = [];
  function label(parent, x, y, text, cls = 'mon-label', minor = false) {
    const g = el('g', { transform: `translate(${f1(x)},${f1(y)})`, class: 'mon-tag' + (minor ? ' mon-tag--minor' : '') }, parent);
    const bg = el('rect', { rx: 9, class: 'mon-label-bg' }, g);
    const t = el('text', { class: cls, 'text-anchor': 'middle', y: 6 }, g, text);
    labels.push([t, bg]);
    return g;
  }
  const fit = (t, bg, padX, padY) => {
    try {
      const b = t.getBBox();
      bg.setAttribute('x', f1(b.x - padX)); bg.setAttribute('y', f1(b.y - padY));
      bg.setAttribute('width', f1(b.width + 2 * padX)); bg.setAttribute('height', f1(b.height + 2 * padY));
    } catch (e) { /* hidden on this screen size */ }
  };
  function chip(parent, x, y, text = '', cls = 'mon-chip') {
    const g = el('g', { transform: `translate(${f1(x)},${f1(y)})` }, parent);
    const bg = el('rect', { rx: 15, class: 'mon-chip-bg' }, g);
    const t = el('text', { class: cls, 'text-anchor': 'middle', y: 6 }, g, text);
    const c = { set(s) { if (t.textContent !== s) { t.textContent = s; fit(t, bg, 14, 6); } }, measure: () => fit(t, bg, 14, 6) };
    chips.push(c);
    return c;
  }
  function sizeLabels() {
    for (const [t, bg] of labels) fit(t, bg, 8, 3);
    chips.forEach(c => c.measure());
  }
  const small = 'mon-label mon-label--small';

  el('rect', { x: 30, y: 18, width: 940, height: 564, rx: 18, class: 'mon-board' });

  // ---------- The map (scenes 3–8 and 11–13) ----------
  const gMap = group('map');
  el('rect', { x: MAP.x0, y: MAP.y0, width: MAP.x1 - MAP.x0, height: MAP.y1 - MAP.y0, rx: 18, fill: 'url(#monSea)' }, gMap);
  { const y = M(30, 0)[1];
    el('line', { x1: MAP.x0, y1: f1(y), x2: MAP.x1, y2: f1(y), class: 'mon-equator' }, gMap);
    el('text', { x: MAP.x1 - 12, y: f1(y - 7), 'text-anchor': 'end', class: 'mon-small' }, gMap, 'Equator'); }
  dyn.seaWarm = el('g', { 'clip-path': 'url(#monMapClip)' }, group('seaWarm'));
  { const [x, y] = M(64, 13); el('ellipse', { cx: f1(x), cy: f1(y), rx: 125, ry: 88, fill: 'url(#monWarm)' }, dyn.seaWarm); }
  const gLand = group('land');
  const landClip = el('g', { 'clip-path': 'url(#monMapClip)' }, gLand);
  Object.values(LAND).forEach(pts => el('path', { d: smooth(pts.map(([lon, lat]) => M(lon, lat))), class: 'mon-land' }, landClip));
  el('rect', { x: MAP.x0, y: MAP.y0, width: MAP.x1 - MAP.x0, height: MAP.y1 - MAP.y0, rx: 18, class: 'mon-map-rim' }, gLand);
  [['AFRICA', 37, 8], ['ARABIA', 45, 22], ['INDIA', 81, 19], ['MADAGASCAR', 53, -19]].forEach(([s, lon, lat]) => {
    const [x, y] = M(lon, lat);
    el('text', { x: f1(x), y: f1(y), 'text-anchor': 'middle', class: 'mon-name' }, gLand, s);
  });
  [['ARABIAN SEA', 62, 1.5], ['BAY OF BENGAL', 89, 16], ['INDIAN OCEAN', 78, -12]].forEach(([s, lon, lat]) => {
    const [x, y] = M(lon, lat);
    el('text', { x: f1(x), y: f1(y), 'text-anchor': 'middle', class: 'mon-ocean' }, gLand, s);
  });
  el('circle', { cx: f1(KERALA[0]), cy: f1(KERALA[1]), r: 6, class: 'mon-kerala' }, gLand);
  el('text', { x: f1(KERALA[0] + 12), y: f1(KERALA[1] + 5), class: 'mon-small mon-small--strong' }, gLand, 'Kerala');

  // The wet southwesterly wind near the sea surface: strong in a normal year, weak in a late year
  function wetWind(name, pts, weak) {
    const g = dyn[name] = el('g', {}, group(name));
    const d = smooth(pts.map(p => M(...p)), false);
    if (!weak) el('path', { d, class: 'mon-wet-glow' }, g);
    el('path', { d, class: weak ? 'mon-wet mon-wet--weak' : 'mon-wet', 'marker-end': 'url(#monArrWet)' }, g);
    (weak ? [[51, 7]] : [[52, 7.5], [58.5, 12], [63.5, 13.3], [69, 13.6]]).forEach(p => drop(g, ...M(...p), weak ? 0.8 : 1));
    dyn[name + 'Label'] = label(g, ...M(56, -3), weak ? 'Weak wet wind' : 'Wet wind', 'mon-label mon-label--wet');
  }
  wetWind('wetStrong', [[43, -7], [50, 3], [57, 9.5], [65.5, 11.5], [74, 11.2]], false);
  wetWind('wetWeak', [[44, -6], [50.5, 3.5], [56.5, 9], [62, 10.5]], true);

  // The dry northwesterly wind higher up
  const gDry = group('dry');
  el('path', { d: smooth([[59, 31], [66, 25], [73, 19.5], [79, 15], [82.5, 12.5]].map(p => M(...p)), false), class: 'mon-dry', 'marker-end': 'url(#monArrDry)' }, gDry);
  [[62, 30.5], [69.5, 24], [76, 18.8]].forEach(p => {
    const [x, y] = M(...p);
    [-8, 0, 8].forEach((dx, i) => el('circle', { cx: f1(x + dx), cy: f1(y - 10 - (i % 2) * 5), r: 2.6, class: 'mon-dust' }, gDry));
  });
  label(gDry, ...M(49, 27), 'Dry wind, high up', 'mon-label mon-label--dry');

  // Pressure: the Mascarene High in the south, low pressure over India, and the unusual high over the Arabian Sea
  dyn.highMH = el('g', {}, group('highMH'));
  pressure(dyn.highMH, ...MASCARENE, 'H', 1);
  dyn.highMHLabel = label(dyn.highMH, 420, MASCARENE[1], 'Mascarene High', 'mon-label mon-label--high');
  dyn.highMHweak = el('g', {}, group('highMHweak'));
  pressure(dyn.highMHweak, ...MASCARENE, 'H', 0.62);
  dyn.highMHweakLabel = label(dyn.highMHweak, 460, MASCARENE[1], 'Weaker Mascarene High', 'mon-label mon-label--high');
  const gLow = group('lowIndia');
  pressure(gLow, ...INDIA_LOW, 'L', 0.9);
  label(gLow, ...M(86, 28.5), 'Low over hot India', 'mon-label mon-label--low');
  dyn.highAS = el('g', {}, group('highAS'));
  pressure(dyn.highAS, ...AS_HIGH, 'H', 0.9);
  el('line', { x1: 232, y1: 76, x2: f1(AS_HIGH[0] - 16), y2: f1(AS_HIGH[1] - 18), class: 'mon-pointer' }, dyn.highAS);
  dyn.highASLabel = label(dyn.highAS, 205, 62, 'Unusual high pressure', 'mon-label mon-label--high');

  // The swirl of wind over the southeastern Arabian Sea, and evaporation from the sea
  dyn.swirl = el('g', {}, group('swirl'));
  swirl(dyn.swirl, ...SWIRL, 36);
  el('text', { x: f1(SWIRL[0]), y: f1(SWIRL[1] + 9), 'text-anchor': 'middle', class: 'mon-swirl-l' }, dyn.swirl, 'L');
  dyn.swirlLabel = label(dyn.swirl, 480, SWIRL[1] + 30, 'A swirl of wind', 'mon-label mon-label--low');
  dyn.wispsFew = el('g', {}, group('wispsFew'));
  [[58.5, 11], [69, 12]].forEach((p, i) => vapour(dyn.wispsFew, ...M(...p), i * 0.8));
  dyn.wispsMany = el('g', {}, group('wispsMany'));
  [[56, 12], [60.5, 14.5], [64.5, 12], [68.5, 15], [72, 12.5]].forEach((p, i) => vapour(dyn.wispsMany, ...M(...p), i * 0.4));
  dyn.keralaRain = el('g', {}, group('keralaRain'));
  cloud(dyn.keralaRain, KERALA[0] - 6, KERALA[1] - 42, 0.75);
  rainStreaks(dyn.keralaRain, KERALA[0] - 6, KERALA[1] - 20, KERALA[1] + 14, 4, 40);

  // ---------- The explainer card beside the map ----------
  el('rect', { x: 618, y: 18, width: 352, height: 564, rx: 18, class: 'mon-card' }, group('card'));

  // 3 and 6. On India's west coast, the wet wind climbs the mountains and makes rain
  function ghats(name, strong) {
    const g = group(name);
    label(g, CX, 58, 'On India’s west coast', small);
    el('rect', { x: 638, y: 470, width: 170, height: 92, fill: 'url(#monWater)' }, g);
    el('path', { d: waveLine(638, 808, 470, 34, 5), class: 'mon-wave' }, g);
    el('path', { d: 'M790,562L790,472Q822,440 850,362Q872,302 890,292Q910,300 930,350L952,400L952,562Z', class: 'mon-hill' }, g);
    el('path', { d: strong ? 'M650,440Q740,438 800,420Q850,396 878,334' : 'M650,440Q714,438 762,430', class: strong ? 'mon-wet' : 'mon-wet mon-wet--weak', 'marker-end': 'url(#monArrWet)' }, g);
    (strong ? [[690, 420], [742, 414], [792, 400], [838, 372]] : [[700, 422]]).forEach(([x, y]) => drop(g, x, y, strong ? 1 : 0.8));
    label(g, 700, 390, strong ? 'Wet wind' : 'Weak wet wind', 'mon-label mon-label--small mon-label--wet');
    if (strong) {
      cloud(g, 885, 230, 1.15);
      rainStreaks(g, 885, 262, 318, 5, 70);
      label(g, 850, 165, 'Clouds and rain!', small);
    } else {
      sun(g, 700, 150, 0.9);
      cloud(g, 885, 250, 0.6, 'sad');
      label(g, CX, 205, 'Too little water: no rain', small);
    }
  }
  ghats('ghatsStrong', true);
  ghats('ghatsWeak', false);

  // 4 and 5. Two winds over India: dry high up, wet near the sea
  const gTwo = group('twoWinds');
  label(gTwo, CX, 58, 'Two winds over India', small);
  el('rect', { x: 638, y: 92, width: 312, height: 380, rx: 14, fill: 'url(#monSky)' }, gTwo);
  el('rect', { x: 638, y: 470, width: 312, height: 26, rx: 6, class: 'mon-ground' }, gTwo);
  el('path', { d: 'M656,456L656,118', class: 'mon-height', 'marker-end': 'url(#monArrFlow)' }, gTwo);
  el('text', { x: 668, y: 128, class: 'mon-small' }, gTwo, 'higher');
  el('path', { d: 'M690,214L928,214', class: 'mon-dry', 'marker-end': 'url(#monArrDry)' }, gTwo);
  [722, 784, 846].forEach((x, i) => el('circle', { cx: x, cy: 200 - (i % 2) * 6, r: 2.6, class: 'mon-dust' }, gTwo));
  label(gTwo, 810, 176, 'Dry wind, high up', 'mon-label mon-label--small mon-label--dry');
  el('path', { d: 'M690,424L928,424', class: 'mon-wet', 'marker-end': 'url(#monArrWet)' }, gTwo);
  [730, 790, 850].forEach(x => drop(gTwo, x, 404, 0.9));
  label(gTwo, 810, 370, 'Wet wind, near the sea', 'mon-label mon-label--small mon-label--wet');
  const gDetective = group('detective');                         // the dry wind was the same as usual
  el('line', { x1: 812, y1: 254, x2: 858, y2: 300, class: 'mon-lens-handle' }, gDetective);
  el('circle', { cx: 780, cy: 214, r: 56, class: 'mon-lens' }, gDetective);
  check(gDetective, 902, 262);
  label(gDetective, 760, 300, 'Same as usual', 'mon-label mon-label--small mon-label--ok');

  // 7 and 8. Air rushes from high pressure to low pressure, like air out of a balloon
  function balloonCard(name, big) {
    const g = group(name);
    label(g, CX, 58, 'Air rushes from high to low', small);
    const r = big ? 80 : 50, cx = 744, cy = 236, mouth = cy + r * 1.12 + 12;
    el('path', { d: `M${cx},${f1(cy + r * 1.12 - 2)}l-8,14h16Z`, class: 'mon-balloon-knot' }, g);
    el('ellipse', { cx, cy, rx: r, ry: f1(r * 1.12), fill: 'url(#monBalloon)', class: 'mon-balloon' }, g);
    el('ellipse', { cx: f1(cx - r * 0.42), cy: f1(cy - r * 0.48), rx: f1(r * 0.16), ry: f1(r * 0.28), class: 'mon-shine' }, g);
    el('text', { x: cx, y: f1(cy + r * 0.32), 'text-anchor': 'middle', class: 'mon-balloon-h', style: `font-size:${f1(r * 0.9)}px` }, g, 'H');
    const LX = 900, LY = 470;
    el('circle', { cx: LX, cy: LY, r: 24, class: 'mon-badge--l' }, g);
    el('text', { x: LX, y: LY + 9, 'text-anchor': 'middle', class: 'mon-badge-text' }, g, 'L');
    (big ? [-14, 0, 14] : [0]).forEach(o => el('path', {
      d: big ? `M${cx + o},${f1(mouth + 4)}Q${cx + 20 + o},${f1(LY + 4 - o)} ${LX - 34},${LY + o / 2}` : `M${cx},${f1(mouth + 4)}Q${cx + 10},${f1(mouth + 50)} ${cx + 52},${f1(mouth + 70)}`,
      class: 'mon-puff', 'marker-end': 'url(#monArrPuff)' }, g));
    label(g, CX, 540, big ? 'Big push: strong wind' : 'Less push: weak wind', small);
  }
  balloonCard('balloonBig', true);
  balloonCard('balloonSmall', false);

  // 11. Evaporation cools the sea, like sweat cools your skin
  const gSweat = group('sweat');
  label(gSweat, CX, 58, 'Evaporation cools', small);
  el('circle', { cx: 724, cy: 170, r: 46, class: 'mon-skin' }, gSweat);
  face(gSweat, 724, 176, 38, 'happy');
  drop(gSweat, 764, 140, 1.2);
  sun(gSweat, 892, 128, 0.8);
  label(gSweat, CX, 252, 'Sweat cools your skin', small);
  el('rect', { x: 638, y: 380, width: 312, height: 92, rx: 10, fill: 'url(#monWater)' }, gSweat);
  el('path', { d: waveLine(638, 950, 381, 39, 5), class: 'mon-wave' }, gSweat);
  vapour(gSweat, 700, 376);
  const thermoSweat = thermometer(gSweat, 900, 424, 0.9);
  label(gSweat, CX, 514, 'Less evaporation, warmer sea', small);

  // 12. The warm sea heats the air above it
  const gHeat = group('heatAir');
  label(gHeat, CX, 58, 'The warm sea heats the air', small);
  el('rect', { x: 638, y: 432, width: 312, height: 92, rx: 10, fill: 'url(#monWarmWater)' }, gHeat);
  el('path', { d: waveLine(638, 950, 433, 39, 5), class: 'mon-wave' }, gHeat);
  [690, 760, 830, 900].forEach((x, i) => el('path', { d: `M${x},426q-8,-15 0,-30q8,-15 0,-30q-8,-15 0,-30`, class: 'mon-heat', 'marker-end': 'url(#monArrHeat)', style: `animation-delay:${(i * 0.4).toFixed(1)}s` }, gHeat));
  label(gHeat, CX, 300, 'Warm air rises', small);
  const heatCloud = cloud(gHeat, CX, 215, 0.55);
  label(gHeat, CX, 128, 'Clouds start to grow', small);

  // 13. The calendar of a late year
  const gCal = group('calendar');
  label(gCal, CX, 58, 'A late year, like 1979', small);
  const setCal = calendarPage(gCal, CX, 104, 190, 200);
  const calChip = chip(gCal, CX, 372, '', 'mon-chip mon-chip--card');
  el('text', { x: CX, y: 440, 'text-anchor': 'middle', class: 'mon-small' }, gCal, 'The usual day is 1 June');
  const STEPS = [[-11, 'A high blocks the wet wind'], [-8, '1 June: no rain yet!'], [-3, 'The sea warms up'], [0, 'The warm sea takes charge'], [Infinity, 'Rain at last!']];

  // ---------- Full-size scenes ----------
  // 1 and 14. A farm waiting for the rain, and the farm when the rain comes
  function farm(name, rain) {
    const g = group(name);
    el('rect', { x: 30, y: 18, width: 940, height: 564, rx: 18, fill: rain ? 'url(#monSkyRain)' : 'url(#monSkyHot)' }, g);
    el('path', { d: 'M30,400Q300,380 500,392T970,388L970,564Q970,582 952,582L48,582Q30,582 30,564Z', class: rain ? 'mon-field-wet' : 'mon-field-dry' }, g);
    if (!rain) ['M90,430l18,10l-6,14l16,8', 'M260,470l14,-8l10,12l18,-4', 'M420,520l-10,14l12,8', 'M150,540l20,-6l8,10', 'M520,452l16,6l-4,14'].forEach(d => el('path', { d, class: 'mon-crack' }, g));
    [462, 532].forEach(y => { for (let x = 90; x <= 540; x += 75) sprout(g, x + (y > 500 ? 36 : 0), y, rain ? 1.3 : 0.8, !rain); });
    farmer(g, 690, 330, rain);
    if (rain) {
      [[240, 120, 1.2], [520, 96, 1], [820, 124, 1.15]].forEach(([x, y, s]) => { cloud(g, x, y, s); rainStreaks(g, x, y + 30 * s, y + 110, 5, 70 * s); });
      chip(g, 500, 52, 'Rain at last! Time to plant');
    } else {
      sun(g, 170, 130, 1.3);
      el('path', { d: 'M770,442Q766,404 784,392L770,380Q796,372 822,380L808,392Q826,404 822,442Z', class: 'mon-sack' }, g);
      el('text', { x: 796, y: 428, 'text-anchor': 'middle', class: 'mon-sack-text' }, g, 'SEEDS');
      calendarPage(g, 872, 140, 150, 160)('JUNE', '1');
      chip(g, 500, 52, 'Waiting for the first rain');
    }
  }
  farm('farmDry', false);
  farm('farmRain', true);

  // 2. When the first rain reaches Kerala: 1 May to 30 June
  const gDates = group('dates');
  chip(gDates, 500, 52, 'When does the first rain reach Kerala?');
  const DX = day => 90 + day * 13.6;                             // day 0 is 1 May, day 61 is 1 July
  el('rect', { x: DX(0), y: 250, width: f1(DX(31) - DX(0)), height: 70, rx: 12, class: 'mon-month mon-month--may' }, gDates);
  el('rect', { x: f1(DX(31)), y: 250, width: f1(DX(61) - DX(31)), height: 70, rx: 12, class: 'mon-month mon-month--june' }, gDates);
  el('rect', { x: f1(DX(38)), y: 240, width: f1(DX(61) - DX(38)), height: 90, rx: 14, class: 'mon-zone-late' }, gDates);
  for (let d = 0; d <= 61; d++) el('line', { x1: f1(DX(d)), y1: 312, x2: f1(DX(d)), y2: d % 7 === 0 ? 300 : 306, class: 'mon-tick' }, gDates);
  el('text', { x: f1(DX(15.5)), y: 292, 'text-anchor': 'middle', class: 'mon-month-name' }, gDates, 'MAY');
  el('text', { x: f1(DX(46)), y: 292, 'text-anchor': 'middle', class: 'mon-month-name' }, gDates, 'JUNE');
  [[6.5, '7 May: earliest', 'happy'], [31.5, '1 June: usual', 'happy'], [52.5, '22 June: latest', 'sleepy']].forEach(([d, s, mood]) => {
    cloud(gDates, DX(d), 152, 0.65, mood);
    el('line', { x1: f1(DX(d)), y1: 232, x2: f1(DX(d)), y2: 252, class: 'mon-pointer' }, gDates);
    label(gDates, DX(d), 206, s, small);
  });
  label(gDates, DX(49.5), 368, 'Too late!', 'mon-label mon-label--late');
  label(gDates, DX(49.5), 412, '12 late years, 1979–2023', 'mon-label mon-label--small mon-label--late');

  // 9 and 10. Side views of the regional Hadley circulation, from south (left) to north (right)
  const LAT = lat => 130 + (lat + 30) * 12.9;
  function loopBoard(name, weak) {
    const g = group(name);
    el('rect', { x: 30, y: 18, width: 940, height: 564, rx: 18, fill: 'url(#monSky)' }, g);
    chip(g, 500, 48, weak ? 'In the late years' : 'Before a normal monsoon');
    el('rect', { x: 50, y: 440, width: f1(LAT(22) - 50), height: 122, fill: 'url(#monWater)' }, g);
    el('path', { d: waveLine(50, LAT(22), 440, 40, 5), class: 'mon-wave' }, g);
    el('path', { d: `M${f1(LAT(22))},562L${f1(LAT(22))},452Q${f1(LAT(24))},424 ${f1(LAT(27))},430L950,438L950,562Z`, class: 'mon-ground' }, g);
    el('text', { x: 900, y: 500, 'text-anchor': 'middle', class: 'mon-small mon-small--strong' }, g, 'India');
    el('text', { x: 66, y: 470, class: 'mon-small mon-small--light' }, g, '← South');
    el('text', { x: f1(LAT(22) - 14), y: 470, 'text-anchor': 'end', class: 'mon-small mon-small--light' }, g, 'North →');
    [[-30, '30°S'], [0, 'Equator'], [10, '10°N']].forEach(([lat, s]) => el('text', { x: f1(LAT(lat)), y: 528, 'text-anchor': 'middle', class: 'mon-small mon-small--light' }, g, s));
    const up = LAT(10), down = LAT(-25);
    if (!weak) {
      el('path', { d: `M${f1(up)},410L${f1(up)},232`, class: 'mon-up', 'marker-end': 'url(#monArrUp)' }, g);
      cloud(g, up, 185, 1.25);
      el('path', { d: `M${f1(up - 26)},104L${f1(down + 30)},104`, class: 'mon-flow', 'marker-end': 'url(#monArrFlow)' }, g);
      el('path', { d: `M${f1(down)},134L${f1(down)},404`, class: 'mon-down', 'marker-end': 'url(#monArrDown)' }, g);
      el('path', { d: `M${f1(down + 30)},422L${f1(up - 30)},422`, class: 'mon-wet', 'marker-end': 'url(#monArrWet)' }, g);
      pressure(g, down, 478, 'H', 1);
      label(g, LAT(-7.5), 132, 'High up, air flows south', small);
      label(g, up + 135, 300, 'Air rises, clouds grow', small);
      label(g, down + 100, 270, 'Air sinks', small);
      label(g, LAT(-7.5), 396, 'Wet wind', 'mon-label mon-label--small mon-label--wet');
      label(g, down, 562, 'Mascarene High', 'mon-label mon-label--small mon-label--high');
    } else {
      [up - 22, up + 22].forEach(x => el('path', { d: `M${f1(x)},170L${f1(x)},404`, class: 'mon-down', 'marker-end': 'url(#monArrDown)' }, g));
      sun(g, up + 110, 150, 1);
      pressure(g, up, 478, 'H', 1);
      el('path', { d: `M${f1(LAT(-20))},410L${f1(LAT(-20))},282`, class: 'mon-up mon-up--weak', 'marker-end': 'url(#monArrUp)' }, g);
      pressure(g, down, 478, 'H', 0.62);
      el('path', { d: `M${f1(down + 30)},422L${f1(LAT(-6))},422`, class: 'mon-wet mon-wet--weak', 'marker-end': 'url(#monArrWet)' }, g);
      label(g, up + 150, 290, 'Air sinks: no clouds', small);
      label(g, LAT(-20) + 100, 300, 'Some air rises', small);
      label(g, LAT(-12), 396, 'Weak wet wind', 'mon-label mon-label--small mon-label--wet');
      label(g, up, 562, 'High pressure', 'mon-label mon-label--small mon-label--high');
      label(g, down, 562, 'Weaker Mascarene High', 'mon-label mon-label--small mon-label--high');
    }
  }
  loopBoard('loopNormal', false);
  loopBoard('loopWeak', true);

  // ---------- Scenes ----------
  const SCENES = [
    { chapter: 'Waiting for rain', title: 'India waits for the monsoon',
      text: 'After the scorching heat and heatwaves of April and May, everyone in India waits for the monsoon, the season of big rains. Its cool rain brings relief from the heat, and farmers need it to plant their seeds. The first monsoon rain usually reaches Kerala, at the southern tip of India, around 1 June.',
      layers: ['farmDry'] },
    { chapter: 'Waiting for rain', title: 'Sometimes the rain is late',
      text: 'The monsoon doesn’t always keep its date. It can come as early as 7 May or as late as 22 June. Between 1979 and 2023, it came really late in 12 years. When the rain is late, planting is late too, and millions of people have to wait and worry.',
      layers: ['dates'] },
    { chapter: 'How the rain comes', title: 'A wet wind from the sea',
      text: 'The monsoon rain rides on a wind. Near the sea, a strong wind blows from the southwest, across the Arabian Sea to India. It picks up lots of water vapour from the warm sea. When it climbs the mountains on India’s west coast, it cools, makes big clouds, and down comes the rain!',
      layers: ['map', 'wetStrong', 'ghatsStrong'] },
    { chapter: 'How the rain comes', title: 'A dry wind up high',
      text: 'Higher up in the sky, another wind blows from the northwest, from the deserts of Pakistan and Afghanistan. It is dry and dusty. When the monsoon starts, the wet wind slowly fills the sky over India with moisture, and the rain clouds win.',
      layers: ['map', 'wetStrong', 'dry', 'twoWinds'] },
    { chapter: 'Who made it late?', title: 'Was it the dry wind?',
      text: 'So which wind made the monsoon late? Scientists studied all 12 late years, like detectives. Up high, the dry wind was just the same as usual. So the dry wind wasn’t to blame!',
      layers: ['map', 'dry', 'twoWinds', 'detective'] },
    { chapter: 'Who made it late?', title: 'No, it was the weak wet wind',
      text: 'The real problem was the wet wind near the sea. In the late years, it was weak. It could not carry enough water vapour to India, so the clouds stayed small and the rain could not start.',
      layers: ['map', 'wetWeak', 'ghatsWeak'] },
    { chapter: 'Why the wind was weak', title: 'Air slides from high to low',
      text: 'Wind always blows from where the air pressure is high to where it is low, like air rushing out of a balloon. Far to the south, east of Madagascar, sits a big area of high pressure called the Mascarene High. Over hot India, the pressure is low. This difference pushes the wet wind all the way to India.',
      layers: ['map', 'wetStrong', 'highMH', 'lowIndia', 'balloonBig'] },
    { chapter: 'Why the wind was weak', title: 'Trouble over the Arabian Sea',
      text: 'In the late years, two things went wrong at once. A high pressure appeared over the Arabian Sea, right in the wind’s path. And the Mascarene High in the south got weaker. With less push from the south, the wet wind slowed down.',
      layers: ['map', 'wetWeak', 'highMHweak', 'lowIndia', 'highAS', 'balloonSmall'] },
    { chapter: 'The giant air loop', title: 'A giant loop of air',
      text: 'Air also moves up and down, in a giant loop called the Hadley circulation. Normally, before the monsoon starts, warm, wet air rises over the Arabian Sea and builds tall clouds. High in the sky it flows south, sinks far away over the Mascarene High, and comes back near the sea as the wet wind.',
      layers: ['loopNormal'] },
    { chapter: 'The giant air loop', title: 'The loop goes weak',
      text: 'In the late years, the loop went weak. Over the Arabian Sea, air sank instead of rising. Sinking air presses down, builds up that high pressure and stops clouds from growing. Far to the south, some air rose instead of sinking, so the Mascarene High lost strength. That’s why the wet wind got weaker.',
      layers: ['loopWeak'] },
    { chapter: 'The sea fights back', title: 'The sea warms up',
      text: 'Under the high pressure, the winds over the Arabian Sea were calm, so less water evaporated. Evaporation cools the sea, just like sweat cools your skin. So, day after day, the Arabian Sea got warmer and warmer.',
      layers: ['map', 'wetWeak', 'highAS', 'seaWarm', 'wispsFew', 'sweat'],
      tick: t => {
        const f = ramp(t, 0.5, 6);
        dyn.seaWarm.style.opacity = f2(lerp(0.15, 1, f));
        thermoSweat(lerp(14, 44, f));
      } },
    { chapter: 'The sea fights back', title: 'The warm sea takes charge',
      text: 'About three days before the rain arrives, the sea is warm enough to heat the air above it. The warm air rises, the high pressure melts away, and a swirl of wind forms over the sea near India. Now lots of water evaporates, and wet air climbs high into the sky.',
      layers: ['map', 'seaWarm', 'highAS', 'swirl', 'wispsMany', 'heatAir'],
      tick: t => {
        dyn.highAS.style.opacity = f2(1 - ramp(t, 1, 3));
        dyn.swirl.style.opacity = f2(ramp(t, 1.5, 3.5));
        dyn.wispsMany.style.opacity = f2(ramp(t, 2, 4));
        heatCloud.setAttribute('transform', `translate(${CX},215) scale(${f2(lerp(0.55, 1.1, ramp(t, 0.5, 5)))})`);
      } },
    { chapter: 'Here comes the rain', title: 'Splash! The monsoon arrives',
      text: 'Then the Mascarene High gets its strength back, the push returns and the wet wind blows strongly again. The giant air loop recovers too. Splash! The monsoon rain finally reaches Kerala, a week or more late. Watch it all happen again, day by day.',
      layers: ['map', 'seaWarm', 'highAS', 'highMHweak', 'highMH', 'wetWeak', 'wetStrong', 'swirl', 'wispsFew', 'wispsMany', 'keralaRain', 'lowIndia', 'calendar'],
      tick: t => {
        const p = reduceMotion ? 1 : clamp((t % 16) / 13), d = -20 + 20 * p;   // days before the rain, in a year like 1979
        dyn.seaWarm.style.opacity = f2(lerp(0.15, 1, ramp(d, -20, -4)));
        const charge = ramp(d, -3, -1), back = ramp(d, -2, 0), wind = ramp(d, -1.5, 0);
        dyn.highAS.style.opacity = f2(1 - charge);
        dyn.swirl.style.opacity = dyn.wispsMany.style.opacity = f2(charge);
        dyn.wispsFew.style.opacity = f2(1 - charge);
        dyn.highMH.style.opacity = f2(back);
        dyn.highMHweak.style.opacity = f2(1 - back);
        dyn.wetStrong.style.opacity = f2(wind);
        dyn.wetWeak.style.opacity = f2(1 - wind);
        dyn.keralaRain.style.opacity = f2(ramp(d, -0.5, 0.5));
        [dyn.highMHLabel, dyn.highMHweakLabel, dyn.wetStrongLabel, dyn.wetWeakLabel, dyn.highASLabel, dyn.swirlLabel].forEach(l => { l.style.opacity = 0; });
        const date = 12 + Math.floor(d);
        setCal(date >= 1 ? 'JUNE' : 'MAY', String(date >= 1 ? date : 31 + date));
        calChip.set(STEPS.find(([until]) => d < until)[1]);
      } },
    { chapter: 'Why it matters', title: 'Why does it matter?',
      html: 'Knowing why the monsoon comes late can help scientists warn farmers early, so they can plan when to plant. It also helps governments get ready: planning crops and water for a late start, and preparing people for heatwaves, which can last longer when the rain comes late. This story comes from <strong>Vaishnavi Wadhai</strong>’s PhD research at IIT Kharagpur: <a href="https://doi.org/10.1029/2025GL120701" target="_blank" rel="noopener">Wadhai, Senapati, Dash &amp; Behera (2026), Geophysical Research Letters</a>. You can also explore <a href="monsoon.html">monsoon rainfall</a>, or the stories of <a href="hsp-story.html">the horseshoe in the Indian Ocean</a> and <a href="w4-story.html">the wavenumber-4 pattern</a>.',
      layers: ['farmRain'] },
  ];

  const resetDynamic = () => Object.values(dyn).forEach(e => { e.style.opacity = ''; });

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
    const on = new Set(s.layers);
    for (const layer in COMPANIONS) if (on.has(layer)) COMPANIONS[layer].forEach(x => on.add(x));
    for (const name in groups) groups[name].classList.toggle('is-on', on.has(name));
    resetDynamic();
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
    auto = setInterval(() => go(current + 1), 12000);
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
