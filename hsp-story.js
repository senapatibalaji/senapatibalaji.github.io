// "The horseshoe in the sea": a cartoon story for young readers about how cold water near
// Australia, sinking and rising air, and rain build the horseshoe salinity pattern (HSP) in the
// Indian Ocean. Based on Sahu, Senapati, Dash & Behera (2026, Journal of Climate) and the stages
// in Limonlisa Sahu's lag animation. Fresher water is blue-green and saltier water is brown.
(() => {
  const svg = document.getElementById('hsStage');
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
  const hex = c => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16));
  const mix = (a, b, f) => { const A = hex(a), B = hex(b); return 'rgb(' + A.map((v, i) => Math.round(lerp(v, B[i], f))).join(',') + ')'; };
  const f1 = v => v.toFixed(1);

  // Smooth curve through points (Catmull-Rom as cubic Béziers), for rounded cartoon coastlines
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

  // ---------- Map of the Indian Ocean ----------
  const MAP = { lon0: 25, lon1: 155, lat0: 28, lat1: -48, x0: 30, x1: 970, y0: 18, y1: 528 };
  const M = (lon, lat) => [MAP.x0 + (lon - MAP.lon0) / (MAP.lon1 - MAP.lon0) * (MAP.x1 - MAP.x0),
    MAP.y0 + (MAP.lat0 - lat) / (MAP.lat0 - MAP.lat1) * (MAP.y1 - MAP.y0)];
  const KX = (MAP.x1 - MAP.x0) / (MAP.lon1 - MAP.lon0), KY = (MAP.y1 - MAP.y0) / (MAP.lat0 - MAP.lat1);
  // Regions of the study: salty southeastern tropical Indian Ocean (SETIO), fresh western tropical (WTIO)
  // and southern subtropical (SSIO) Indian Ocean, and the cold southeastern Indian Ocean (SEIO) off Australia
  const SETIO = M(92, -18), WTIO = M(55, -3), TAIL = M(44.5, -12), SSIO = M(90, -40), SEIO = M(107, -28);
  const SEIO_PATH = [SEIO, M(112, -37), M(127, -39)];            // west coast, round the corner, south coast
  const RAIN_START_DX = M(80, -2)[0] - (WTIO[0] + 14);            // first rain falls over the central ocean

  const LAND = {
    africa: [[10, 34], [32, 34], [32.6, 29.9], [33.6, 27.6], [35.2, 24.6], [37.2, 21], [38.6, 17.8], [39.7, 15.5], [41.6, 13.6], [43.2, 12], [44.6, 10.5], [47.3, 11.2], [51.2, 11.8], [51, 10.3], [49.8, 7.8], [48.5, 5.2], [46, 2], [43.5, -0.4], [41.5, -2], [40, -3.6], [39.2, -6], [39.6, -8.6], [40.4, -10.8], [40.6, -14.6], [39.6, -16.6], [37, -18.2], [35.4, -20.6], [35.4, -23.6], [33.2, -25.6], [32.8, -28.4], [31, -30.2], [29, -32.2], [27, -33.6], [25, -34], [22, -34.2], [20, -34.8], [18.4, -34], [18, -32], [14, -25], [12, -15], [10, 0], [5, 8], [0, 10]],
    madagascar: [[44, -25.1], [47.1, -25.1], [48.9, -20.5], [50.4, -15.5], [49.4, -12], [47.5, -13.5], [44.3, -16.5], [43.3, -21.5]],
    arabia: [[34.9, 29.5], [35.5, 28], [36.6, 25.8], [38.4, 22.6], [39.6, 20.2], [41.4, 17.4], [42.6, 15], [43.4, 12.8], [45, 12.9], [48.6, 14.1], [51.6, 15.3], [52.4, 16.4], [55, 17.6], [56.9, 18.8], [58.6, 20.6], [59.8, 22.4], [58.8, 23.6], [57.2, 24], [56.4, 25.6], [56.3, 26.3], [55, 24.6], [53, 24.1], [51.5, 24.5], [51.3, 26], [50.2, 26.6], [49, 28.3], [48.2, 29.9], [47.9, 31.5], [47, 34], [36, 34], [34.9, 31]],
    asia: [[47.9, 31.5], [48.6, 30], [50.2, 29.2], [51.4, 27.9], [52.6, 27.4], [54.8, 26.5], [56.2, 27.1], [57.3, 25.9], [59.4, 25.4], [61.6, 25.2], [64, 25.3], [66.6, 25.4], [67.4, 24], [68.6, 23.3], [70.1, 23], [69, 22.3], [70.4, 20.9], [72.3, 21.2], [72.8, 19.2], [73.2, 17.2], [73.7, 15.6], [74.4, 14], [74.9, 12.6], [75.8, 11], [76.3, 9.6], [77.5, 8.1], [78.2, 9], [79.3, 10.3], [79.8, 12.6], [80.2, 15.4], [81.4, 16.4], [82.4, 17.2], [84.2, 18.6], [85.6, 19.8], [86.9, 21.3], [88.6, 21.7], [90.4, 22], [91.6, 22.6], [92.2, 21], [92.9, 19.8], [94.2, 18.4], [94.4, 16.2], [95.4, 15.8], [97.6, 16.6], [98.2, 13.4], [98.6, 10.4], [98.3, 8.2], [100.2, 6.6], [100.4, 4], [101.4, 2.8], [103.4, 1.4], [104.2, 1.5], [103.5, 3.6], [103.4, 5.2], [102.2, 6.2], [100.8, 7.6], [100.2, 9.6], [99.6, 11.4], [100, 12.8], [100.8, 13.4], [101.6, 12.6], [102.6, 12], [104.2, 10.6], [104.8, 8.6], [106.6, 9.6], [107.6, 10.6], [109.2, 11.6], [109.4, 13.6], [108.8, 15.6], [107.2, 16.8], [106.2, 18.8], [106.6, 20.4], [108.2, 21.6], [110, 21], [110.6, 21.4], [112.4, 21.8], [114.2, 22.3], [116.6, 23], [118.6, 24.6], [120, 26.6], [121.5, 28.4], [122, 31], [160, 34], [45, 34]],
    sriLanka: [[79.9, 9.8], [80.5, 9.7], [81.4, 8.4], [81.9, 7], [81.6, 6.2], [80.6, 5.9], [79.9, 6.8], [79.7, 8.2]],
    hainan: [[108.6, 19.2], [109.6, 18.2], [110.6, 18.8], [111, 19.8], [110.2, 20.1], [109.2, 20]],
    taiwan: [[120.2, 22.6], [121, 22], [121.8, 24.6], [121.6, 25.3], [120.6, 24.6]],
    luzon: [[120, 18.5], [122.2, 18.4], [122.4, 16], [121.6, 14.2], [124, 13], [123.4, 12.6], [120.6, 13.8], [120.2, 15.8]],
    mindanao: [[122, 7], [124, 8.4], [125.4, 9.4], [126.4, 8], [126.2, 6.4], [125.4, 6], [124, 6.6], [122.4, 6.8]],
    sumatra: [[95.3, 5.6], [97.5, 5.2], [100.3, 2.3], [103.7, -0.9], [106, -3], [105.8, -5.8], [104.5, -5.9], [102.3, -4], [100.5, -1.2], [98.7, 1.7], [95.4, 3.7]],
    java: [[105.2, -6.8], [106.1, -6], [108.3, -6.3], [111, -6.4], [112.6, -6.9], [114.6, -7.7], [114.4, -8.7], [111, -8.2], [108.3, -7.8], [106.4, -7.4]],
    lombok: [[116, -8.4], [119, -8.3], [119, -8.9], [116.2, -8.9]],
    flores: [[119.8, -8.4], [122.8, -8.2], [122.7, -8.8], [119.9, -8.8]],
    timor: [[123.6, -10.2], [125, -9], [127.2, -8.4], [126.6, -9], [124.2, -10.3]],
    borneo: [[109, 1.5], [109.7, 2], [111.5, 2.5], [113, 3.2], [115.5, 5], [117.2, 6.9], [119, 5.3], [118, 4.3], [118.5, 1], [117.5, 0.5], [116.5, -1.5], [116, -3.3], [114.5, -4], [111, -3], [110, -1.5], [109, 0]],
    sulawesi: [[119.5, -5.5], [120.4, -5.5], [120.6, -2.7], [121.3, -4.6], [122.8, -4.8], [121.5, -1.8], [123.3, -1], [125, 1.5], [124.5, 1.8], [121, 1.2], [120, 0.8], [119.8, -1], [118.9, -3]],
    newGuinea: [[131, -1], [134, -0.6], [135.4, -3.2], [137.8, -1.6], [141, -2.6], [144.6, -3.8], [147.4, -6], [148.2, -8.2], [150.6, -10.4], [147.6, -10.1], [146, -8.4], [143.6, -9], [142.4, -9.2], [141, -9.2], [139, -8.2], [138, -7.4], [137.6, -5.6], [135.2, -4.4], [133, -4], [132, -2.8]],
    australia: [[113.5, -22], [114, -26], [115, -31], [115.2, -34], [118, -35], [123, -33.8], [126, -32.3], [129, -31.6], [132, -32], [135, -34.5], [137.5, -35.5], [138.5, -34.8], [140, -37.5], [142, -38.4], [146, -39], [148, -37.8], [150, -37.5], [151.5, -33.5], [153.5, -28.5], [153, -25], [150, -22.5], [146.5, -19], [145.5, -15], [143.5, -14], [142.5, -10.7], [141.6, -12.5], [141.5, -15.5], [139.5, -17.5], [136.5, -15.8], [136, -12.2], [132.5, -11.5], [130, -12.2], [129.5, -15], [127, -14], [125, -15], [122.5, -17], [121, -19.5], [117, -20.7]],
    tasmania: [[144.7, -40.7], [148.3, -40.9], [148.2, -42.2], [147, -43.5], [145.5, -42.7]],
  };

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
  radial('hsSalty', [[0, '#9c5418', 0.95], [0.55, '#c98a4b', 0.7], [1, '#e8c8a0', 0]]);
  radial('hsFresh', [[0, '#0b7d74', 0.95], [0.55, '#3fb5a8', 0.65], [1, '#a6e3dc', 0]]);
  radial('hsCold', [[0, '#1c6fd1', 0.9], [0.6, '#5aa0ee', 0.55], [1, '#9cc8f6', 0]]);
  radial('hsWarm', [[0, '#e03131', 0.85], [0.6, '#ff8787', 0.5], [1, '#ffc9c9', 0]]);
  linear('hsSea', [[0, '#d9effb'], [1, '#bfe2f5']], true);
  linear('hsDrop', [[0, '#d6efff'], [1, '#74c3f2']], true);
  linear('hsDeepSea', [[0, '#6fb6e3'], [1, '#173f6b']], true);
  linear('hsKey', [[0, '#0b7d74'], [0.5, '#f4f1ea'], [1, '#9c5418']]);
  linear('hsWalkerSea', [[0, '#3fb5a8'], [0.42, '#a9d8ef'], [0.58, '#a9d8ef'], [1, '#c98a4b']]);
  linear('hsHadleySea', [[0, '#a9d8ef'], [0.28, '#d2ae84'], [0.43, '#c98a4b'], [0.6, '#a9d8ef'], [0.78, '#3fb5a8'], [1, '#3fb5a8']]);
  linear('hsFreshCol', [[0, '#1d9e93', 0.9], [0.88, '#3fb5a8', 0.75], [1, '#3fb5a8', 0]], true);
  linear('hsSaltyCol', [[0, '#b06a2c', 0.9], [0.88, '#c98a4b', 0.75], [1, '#c98a4b', 0]], true);
  const clip = el('clipPath', { id: 'hsMapClip' }, defs);
  el('rect', { x: MAP.x0, y: MAP.y0, width: MAP.x1 - MAP.x0, height: MAP.y1 - MAP.y0, rx: 18 }, clip);
  const marker = (id, color) => {
    const m = el('marker', { id, viewBox: '0 0 10 10', refX: 6, refY: 5, markerWidth: 4, markerHeight: 4, orient: 'auto-start-reverse' }, defs);
    el('path', { d: 'M0,0L10,5L0,10Z', fill: color }, m);
  };
  [['hsArrUp', '#e03131'], ['hsArrDown', '#1c7ed6'], ['hsArrFlow', '#5c6b7a'], ['hsArrPacific', '#7b3fb5'], ['hsArrCold', '#4dabf7']].forEach(([id, c]) => marker(id, c));

  const groups = {};
  const group = (name, parent = svg) => (groups[name] = el('g', { class: 'hs-layer', 'data-layer': name }, parent));
  const COMPANIONS = { map: ['land'], cold: ['coldTop'] };       // layers that always show together

  // ---------- Characters and icons ----------
  function face(parent, x, y, r, mood = 'happy') {
    const g = el('g', { transform: `translate(${x},${y})` }, parent);
    el('circle', { cx: -r * 0.35, cy: -r * 0.12, r: r * 0.11, class: 'hs-eye' }, g);
    el('circle', { cx: r * 0.35, cy: -r * 0.12, r: r * 0.11, class: 'hs-eye' }, g);
    if (mood === 'cold') {
      el('path', { d: `M${-r * 0.36},${r * 0.3}l${r * 0.18},${-r * 0.12}l${r * 0.18},${r * 0.12}l${r * 0.18},${-r * 0.12}l${r * 0.18},${r * 0.12}`, class: 'hs-mouth', 'stroke-width': r * 0.1 }, g);
    } else {
      el('path', { d: `M${-r * 0.32},${r * 0.18}Q0,${r * 0.52} ${r * 0.32},${r * 0.18}`, class: 'hs-mouth', 'stroke-width': r * 0.1 }, g);
      el('circle', { cx: -r * 0.6, cy: r * 0.16, r: r * 0.13, class: 'hs-blush' }, g);
      el('circle', { cx: r * 0.6, cy: r * 0.16, r: r * 0.13, class: 'hs-blush' }, g);
    }
    return g;
  }
  function rainStreaks(parent, x, y1, y2, n = 5, spread = 90) {
    for (let i = 0; i < n; i++) {
      const xi = x - spread / 2 + i * spread / (n - 1);
      el('line', { x1: xi, y1, x2: xi - 8, y2, class: 'hs-rain', style: `animation-delay:${(i * 0.13).toFixed(2)}s` }, parent);
    }
  }
  function cloud(parent, x, y, s = 1, rainLen = 0) {
    const g = el('g', { transform: `translate(${x},${y}) scale(${s})` }, parent);
    el('path', { d: 'M-50,20 a22,22 0 0,1 6,-40 a30,30 0 0,1 50,-12 a24,24 0 0,1 40,14 a20,20 0 0,1 4,38 Z', class: 'hs-cloud' }, g);
    face(g, 0, 0, 20);
    if (rainLen) rainStreaks(g, 0, 30, 30 + rainLen, 5, 70);
    return g;
  }
  function sun(parent, x, y, s = 1) {
    const g = el('g', { transform: `translate(${x},${y}) scale(${s})` }, parent);
    const rays = el('g', { class: 'hs-sunrays' }, g);
    for (let i = 0; i < 10; i++) {
      const a = i * Math.PI / 5;
      el('line', { x1: Math.cos(a) * 29, y1: Math.sin(a) * 29, x2: Math.cos(a) * 39, y2: Math.sin(a) * 39, class: 'hs-ray' }, rays);
    }
    el('circle', { r: 24, class: 'hs-sun' }, g);
    face(g, 0, 2, 20);
    return g;
  }
  function sparkle(parent, x, y, s = 1, delay = 0) {
    const g = el('g', { transform: `translate(${x},${y}) scale(${s})` }, parent);
    el('path', { d: 'M0,-6L1.6,-1.6L6,0L1.6,1.6L0,6L-1.6,1.6L-6,0L-1.6,-1.6Z', class: 'hs-sparkle', style: `animation-delay:${delay.toFixed(2)}s` }, g);
  }
  const vapour = (parent, x, y, delay = 0) => el('path', { d: `M${x},${y} q-6,-9 0,-18 q6,-9 0,-18`, class: 'hs-vapour', style: `animation-delay:${delay.toFixed(2)}s` }, parent);
  function snowflake(parent, x, y, s = 1) {
    const g = el('g', { transform: `translate(${x},${y}) scale(${s})`, class: 'hs-snow' }, parent);
    for (let i = 0; i < 3; i++) {
      const a = i * Math.PI / 3, cx = Math.cos(a) * 10, cy = Math.sin(a) * 10;
      el('line', { x1: -cx, y1: -cy, x2: cx, y2: cy }, g);
    }
  }
  function thermometer(parent, x, y, s = 1) {
    const g = el('g', { transform: `translate(${x},${y}) scale(${s})` }, parent);
    el('rect', { x: -7, y: -50, width: 14, height: 58, rx: 7, class: 'hs-thermo' }, g);
    const fill = el('rect', { x: -3.5, y: -10, width: 7, height: 18, rx: 3.5, class: 'hs-thermo-fill' }, g);
    el('circle', { cy: 12, r: 11, class: 'hs-thermo-bulb' }, g);
    return fill;
  }
  function whale(parent, x, y, s, rot) {
    const g = el('g', { transform: `translate(${x},${y}) rotate(${rot}) scale(${s})` }, parent);
    el('path', { d: 'M-48,1L-66,-12Q-60,1 -66,14Z', class: 'hs-whale' }, g);
    el('path', { d: 'M-50,0C-44,-12 -10,-16 28,-12C42,-10 52,-5 54,0C52,6 40,11 24,12C-6,15 -40,10 -50,2Z', class: 'hs-whale' }, g);
    el('path', { d: 'M20,8C10,13 -14,13 -30,7', class: 'hs-whale-line' }, g);
    el('path', { d: 'M30,5Q40,7 50,3', class: 'hs-whale-line' }, g);
    el('circle', { cx: 38, cy: -3, r: 2.6, class: 'hs-eye' }, g);
  }
  function boat(parent, x, y, s = 1) {
    const g = el('g', { transform: `translate(${x},${y}) scale(${s})` }, parent);
    const b = el('g', { class: 'hs-bob' }, g);
    el('path', { d: 'M-34,-4L34,-4L24,10L-24,10Z', class: 'hs-boat' }, b);
    el('line', { x1: 0, y1: -4, x2: 0, y2: -46, class: 'hs-mast' }, b);
    el('path', { d: 'M3,-44L28,-10L3,-10Z', class: 'hs-sail' }, b);
  }
  function shoeIcon(parent, x, y, s = 1) {
    const g = el('g', { transform: `translate(${x},${y}) scale(${s})` }, parent);
    el('path', { d: 'M-13,-14L-13,0A13,13 0 0,0 13,0L13,-14', class: 'hs-shoe-icon' }, g);
    [[-13, -9], [-12, 3], [-6, 10.5], [6, 10.5], [12, 3], [13, -9]].forEach(([cx, cy]) => el('circle', { cx, cy, r: 1.7, class: 'hs-shoe-nail' }, g));
  }
  function board(parent) {
    el('rect', { x: 30, y: 18, width: 940, height: 564, rx: 18, class: 'hs-board' }, parent);
  }

  // Labels get a white rounded background sized to the text; re-measured when fonts load or the layout changes
  const labels = [], chips = [];
  function label(parent, x, y, text, cls = 'hs-label', minor = false) {
    const g = el('g', { transform: `translate(${x},${y})`, class: 'hs-tag' + (minor ? ' hs-tag--minor' : '') }, parent);
    const bg = el('rect', { rx: 9, class: 'hs-label-bg' }, g);
    const t = el('text', { class: cls, 'text-anchor': 'middle', y: 6 }, g, text);
    labels.push([t, bg]);
    return g;
  }
  const fit = (t, bg, padX, padY) => {
    try {
      const b = t.getBBox();
      bg.setAttribute('x', b.x - padX); bg.setAttribute('y', b.y - padY);
      bg.setAttribute('width', b.width + 2 * padX); bg.setAttribute('height', b.height + 2 * padY);
    } catch (e) { /* hidden on this screen size */ }
  };
  function chip(parent, x, y) {
    const g = el('g', { transform: `translate(${x},${y})` }, parent);
    const bg = el('rect', { rx: 15, class: 'hs-chip-bg' }, g);
    const t = el('text', { class: 'hs-chip', 'text-anchor': 'middle', y: 6 }, g);
    const c = { set(text) { if (t.textContent !== text) { t.textContent = text; fit(t, bg, 14, 6); } }, measure: () => fit(t, bg, 14, 6) };
    chips.push(c);
    return c;
  }
  function sizeLabels() {
    for (const [t, bg] of labels) fit(t, bg, 8, 3);
    chips.forEach(c => c.measure());
  }

  // ---------- Scene boards that are not maps ----------
  // 1. A glass of sea water and a raindrop
  const gGlass = group('glass');
  board(gGlass);
  el('path', { d: 'M201,232Q250,222 300,232T399,232L386,474Q384,494 364,494L236,494Q216,494 214,474Z', class: 'hs-seawater' }, gGlass);
  [[240, 300], [270, 350], [320, 290], [355, 330], [300, 400], [250, 430], [345, 440], [285, 462], [330, 375], [365, 282], [232, 380], [300, 320], [262, 262], [340, 258]]
    .forEach(([x, y], i) => sparkle(gGlass, x, y, 1.1, (i * 0.37) % 1.6));
  el('path', { d: 'M196,150L404,150L386,474Q384,494 364,494L236,494Q216,494 214,474Z', class: 'hs-glass' }, gGlass);
  { const shaker = el('g', { transform: 'translate(300,92)' }, gGlass);
    [-12, 0, 12].forEach((dx, i) => el('rect', { x: dx - 2.5, y: 40, width: 5, height: 5, class: 'hs-grain', style: `animation-delay:${(i * 0.45).toFixed(2)}s` }, shaker));
    el('rect', { x: -26, y: -52, width: 52, height: 72, rx: 12, class: 'hs-shaker' }, shaker);
    el('rect', { x: -28, y: 18, width: 56, height: 16, rx: 5, class: 'hs-shaker-cap' }, shaker);
    [-12, 0, 12].forEach(dx => el('circle', { cx: dx, cy: 30, r: 2.2, class: 'hs-eye' }, shaker));
    el('text', { x: 0, y: -8, 'text-anchor': 'middle', class: 'hs-shaker-text' }, shaker, 'SALT'); }
  el('path', { d: 'M700,170C752,250 786,300 786,352A86,86 0 1,1 614,352C614,300 648,250 700,170Z', class: 'hs-drop', fill: 'url(#hsDrop)' }, gGlass);
  face(gGlass, 700, 370, 44);
  cloud(gGlass, 700, 96, 0.95);
  label(gGlass, 300, 540, 'Sea water: salty!', 'hs-label hs-label--salty');
  label(gGlass, 700, 540, 'Rain water: fresh!', 'hs-label hs-label--fresh');

  // 2. Rain makes the sea fresher; sunshine without rain makes it saltier
  const gTub = group('tub');
  board(gTub);
  el('line', { x1: 500, y1: 80, x2: 500, y2: 530, class: 'hs-divider' }, gTub);
  const tubSeaL = el('path', { d: waveLine(80, 470, 334, 39) + 'L470,520L80,520Z', fill: '#78c1ea' }, gTub);
  const tubSeaR = el('path', { d: waveLine(530, 920, 334, 39) + 'L920,520L530,520Z', fill: '#78c1ea' }, gTub);
  cloud(gTub, 275, 160, 1.5);
  rainStreaks(gTub, 275, 205, 325, 6, 140);
  sun(gTub, 725, 165, 1.5);
  [600, 660, 720, 780, 840].forEach((x, i) => vapour(gTub, x, 322, i * 0.35));
  const tubSalt = el('g', {}, gTub);
  [[580, 380], [640, 430], [700, 372], [760, 450], [820, 395], [870, 470], [610, 490], [730, 500], [800, 500]].forEach(([x, y], i) => sparkle(tubSalt, x, y, 1.1, (i * 0.41) % 1.6));
  label(gTub, 275, 62, 'Lots of rain');
  label(gTub, 725, 62, 'Sunny and dry');
  label(gTub, 275, 552, 'fresher', 'hs-label hs-label--fresh');
  label(gTub, 725, 552, 'saltier', 'hs-label hs-label--salty');

  // 6 & 8. Side views of the two air "merry-go-rounds"
  function airLoop(name, title, seaFill, rise, sink, upText, downText) {
    const g = group(name);
    board(g);
    label(g, 500, 52, title, 'hs-label hs-label--small');
    el('rect', { x: 60, y: 430, width: 880, height: 112, rx: 10, fill: seaFill }, g);
    el('path', { d: waveLine(60, 940, 432, 44, 6), class: 'hs-wave' }, g);
    const dir = sink > rise ? 1 : -1;                 // +1: the air flows rightwards near the top
    el('path', { d: `M${rise},412L${rise},232`, class: 'hs-up', 'marker-end': 'url(#hsArrUp)' }, g);
    el('path', { d: `M${rise + 22 * dir},196L${sink - 22 * dir},196`, class: 'hs-flow', 'marker-end': 'url(#hsArrFlow)' }, g);
    el('path', { d: `M${sink},232L${sink},412`, class: 'hs-down', 'marker-end': 'url(#hsArrDown)' }, g);
    el('path', { d: `M${sink - 22 * dir},420L${rise + 22 * dir},420`, class: 'hs-flow', 'marker-end': 'url(#hsArrFlow)' }, g);
    const cx = rise - 110 * dir;
    cloud(g, cx, 240, 1.3);
    rainStreaks(g, cx, 280, 426, 5, 90);
    sun(g, sink + 150 * dir, 165, 1.1);
    label(g, rise, 100, upText);
    label(g, sink, 100, downText);
    label(g, (rise + cx) / 2 - 30 * dir, 488, 'fresher', 'hs-label hs-label--fresh');
    label(g, sink, 488, 'saltier', 'hs-label hs-label--salty');
    return g;
  }
  const gWalker = airLoop('walker', 'Seen from the side: from Africa to Australia', 'url(#hsWalkerSea)', 330, 690, 'Air goes up: clouds and rain', 'Air comes down: sunny and dry');
  el('path', { d: 'M30,440L30,362Q62,330 100,350Q130,368 150,440Z', class: 'hs-hill' }, gWalker);
  el('path', { d: 'M970,440L970,362Q940,336 905,352Q878,370 860,440Z', class: 'hs-hill' }, gWalker);
  el('text', { x: 86, y: 410, 'text-anchor': 'middle', class: 'hs-name' }, gWalker, 'AFRICA');
  el('text', { x: 916, y: 410, 'text-anchor': 'middle', class: 'hs-name' }, gWalker, 'AUSTRALIA');
  el('text', { x: 70, y: 572, class: 'hs-small' }, gWalker, '← West');
  el('text', { x: 930, y: 572, 'text-anchor': 'end', class: 'hs-small' }, gWalker, 'East →');
  const gHadley = airLoop('hadley', 'Seen from the side: from north to south', 'url(#hsHadleySea)', 753, 437, 'Air goes up: clouds and rain', 'Air comes down: sunny and dry');
  el('text', { x: 70, y: 572, class: 'hs-small' }, gHadley, '← North (towards India)');
  el('text', { x: 930, y: 572, 'text-anchor': 'end', class: 'hs-small' }, gHadley, 'South (towards Antarctica) →');

  // 10. How deep the pattern goes
  const gDeep = group('deep');
  board(gDeep);
  label(gDeep, 500, 52, 'How deep does it go?', 'hs-label hs-label--small');
  el('rect', { x: 44, y: 140, width: 912, height: 428, rx: 14, fill: 'url(#hsDeepSea)' }, gDeep);
  el('rect', { x: 140, y: 142, width: 300, height: 330, fill: 'url(#hsFreshCol)' }, gDeep);
  el('rect', { x: 440, y: 142, width: 300, height: 330, fill: 'url(#hsSaltyCol)' }, gDeep);
  el('path', { d: waveLine(44, 956, 141, 48, 6), class: 'hs-wave' }, gDeep);
  boat(gDeep, 250, 132);
  el('line', { x1: 100, y1: 140, x2: 100, y2: 460, class: 'hs-ruler' }, gDeep);
  [0, 50, 100, 150].forEach(d => {
    const y = 140 + d * 2;
    el('line', { x1: 94, y1: y, x2: 110, y2: y, class: 'hs-ruler' }, gDeep);
    label(gDeep, 64, y, d + ' m', 'hs-label hs-label--small');
  });
  el('line', { x1: 100, y1: 440, x2: 770, y2: 440, class: 'hs-depth-line' }, gDeep);
  label(gDeep, 600, 466, '150 metres deep', 'hs-label hs-label--small');
  label(gDeep, 290, 290, 'fresher', 'hs-label hs-label--fresh');
  label(gDeep, 590, 290, 'saltier', 'hs-label hs-label--salty');
  for (let i = 0; i < 5; i++) whale(gDeep, 852, 169.5 + 59 * i, 0.49, 90);
  label(gDeep, 852, 470, 'about 5 blue whales', 'hs-label hs-label--small');

  // 12. Fresh water floats like a blanket and keeps the top warm
  const gBlanket = group('blanket');
  board(gBlanket);
  for (const [x2, y2] of [[330, 200], [400, 200], [470, 200]]) el('line', { x1: 228, y1: 138, x2, y2, class: 'hs-beam' }, gBlanket);
  sun(gBlanket, 200, 110, 1.4);
  el('rect', { x: 280, y: 200, width: 400, height: 360, rx: 14, class: 'hs-deep' }, gBlanket);
  el('path', { d: 'M280,214Q280,200 294,200L666,200Q680,200 680,214L680,276L280,276Z', class: 'hs-blanket' }, gBlanket);
  el('line', { x1: 290, y1: 269, x2: 670, y2: 269, class: 'hs-stitch' }, gBlanket);
  [380, 480, 580].forEach(x => el('line', { x1: x, y1: 207, x2: x, y2: 269, class: 'hs-stitch' }, gBlanket));
  [360, 480, 600].forEach((x, i) => el('path', { d: `M${x},520L${x},296`, class: 'hs-coldup', 'marker-end': 'url(#hsArrCold)', style: `animation-delay:${(i * 0.3).toFixed(1)}s` }, gBlanket));
  const thermoFill = thermometer(gBlanket, 650, 250, 0.75);
  label(gBlanket, 480, 238, 'Fresh, light water: a cosy blanket', 'hs-label hs-label--small');
  label(gBlanket, 480, 540, 'Cold, salty, heavy water', 'hs-label hs-label--small');
  el('line', { x1: 668, y1: 232, x2: 712, y2: 232, class: 'hs-pointer' }, gBlanket);
  label(gBlanket, 832, 232, 'The top gets warmer!', 'hs-label hs-label--warm');
  el('line', { x1: 615, y1: 380, x2: 712, y2: 380, class: 'hs-pointer' }, gBlanket);
  label(gBlanket, 832, 380, 'Cold water stays down', 'hs-label hs-label--cold');
  label(gBlanket, 150, 540, 'In the sea near Africa', 'hs-label hs-label--small');

  // ---------- The map ----------
  const gMap = group('map');
  el('rect', { x: MAP.x0, y: MAP.y0, width: MAP.x1 - MAP.x0, height: MAP.y1 - MAP.y0, rx: 18, class: 'hs-sea', fill: 'url(#hsSea)' }, gMap);
  { const [, ye] = M(0, 0); el('line', { x1: MAP.x0, y1: ye, x2: MAP.x1, y2: ye, class: 'hs-equator' }, gMap);
    el('text', { x: MAP.x1 - 12, y: ye - 7, 'text-anchor': 'end', class: 'hs-equator-label' }, gMap, 'Equator'); }

  const inner = parent => el('g', {}, parent);
  const blobAt = (parent, [x, y], rx, ry, fill, rot = 0) => el('ellipse', { cx: x, cy: y, rx, ry, fill, transform: rot ? `rotate(${rot} ${x} ${y})` : null }, parent);

  // Decadal "flip": each region has both colours, cross-faded by the scene
  const gFlip = group('flip');
  const flip = {
    a: [blobAt(gFlip, SETIO, 20 * KX, 6.5 * KY, 'url(#hsSalty)'), blobAt(gFlip, WTIO, 15 * KX, 7 * KY, 'url(#hsFresh)'),
      blobAt(gFlip, TAIL, 26, 13, 'url(#hsFresh)', 65), blobAt(gFlip, SSIO, 30 * KX, 4.5 * KY, 'url(#hsFresh)'), blobAt(gFlip, SEIO, 46, 34, 'url(#hsCold)')],
    b: [blobAt(gFlip, SETIO, 20 * KX, 6.5 * KY, 'url(#hsFresh)'), blobAt(gFlip, WTIO, 15 * KX, 7 * KY, 'url(#hsSalty)'),
      blobAt(gFlip, TAIL, 26, 13, 'url(#hsSalty)', 65), blobAt(gFlip, SSIO, 30 * KX, 4.5 * KY, 'url(#hsSalty)'), blobAt(gFlip, SEIO, 46, 34, 'url(#hsWarm)')],
  };

  const dyn = {};
  dyn.cold = inner(group('cold'));
  blobAt(dyn.cold, [0, 0], 46, 34, 'url(#hsCold)');
  dyn.salty = inner(group('salty'));
  blobAt(dyn.salty, SETIO, 20 * KX, 6.5 * KY, 'url(#hsSalty)');
  [[-90, -14], [-40, 10], [10, -20], [60, 6], [105, -10], [-5, 26], [40, -30], [-70, 22]].forEach(([dx, dy], i) => sparkle(dyn.salty, SETIO[0] + dx, SETIO[1] + dy, 0.9, (i * 0.43) % 1.6));
  dyn.freshW = inner(group('freshW'));
  blobAt(dyn.freshW, WTIO, 15 * KX, 7 * KY, 'url(#hsFresh)');
  blobAt(dyn.freshW, TAIL, 26, 13, 'url(#hsFresh)', 65);
  dyn.freshS = inner(group('freshS'));
  blobAt(dyn.freshS, SSIO, 30 * KX, 4.5 * KY, 'url(#hsFresh)');
  dyn.warmW = inner(group('warmW'));
  el('ellipse', { cx: WTIO[0] + 10, cy: WTIO[1] - 4, rx: 66, ry: 30, class: 'hs-ring' }, dyn.warmW);
  el('ellipse', { cx: WTIO[0] + 10, cy: WTIO[1] - 4, rx: 32, ry: 14, class: 'hs-ring' }, dyn.warmW);
  label(dyn.warmW, M(73, 1.5)[0], M(73, 1.5)[1], 'warmer', 'hs-label hs-label--small hs-label--warm', true);

  const gLand = group('land');
  const landClip = el('g', { 'clip-path': 'url(#hsMapClip)' }, gLand);
  for (const k in LAND) el('path', { d: smooth(LAND[k].map(([lo, la]) => M(lo, la))), class: 'hs-land' }, landClip);
  el('rect', { x: MAP.x0, y: MAP.y0, width: MAP.x1 - MAP.x0, height: MAP.y1 - MAP.y0, rx: 18, class: 'hs-map-rim' }, gLand);

  // The horseshoe outline draws itself, then its labels appear
  const gShoe = group('shoe');
  const shoePts = [[68, -1], [56, 1], [48, -6], [52.5, -14], [55, -24], [62, -34], [76, -41], [95, -42], [116, -40]].map(([lo, la]) => M(lo, la));
  const shoeBand = el('path', { d: smooth(shoePts, false), class: 'hs-shoe-band' }, gShoe);
  const shoeLine = el('path', { d: smooth(shoePts, false), class: 'hs-shoe-line' }, gShoe);
  const shoeLabels = el('g', {}, gShoe);
  label(shoeLabels, 395, 400, 'Horseshoe!', 'hs-label');
  shoeIcon(shoeLabels, 322, 398, 1.1);
  label(shoeLabels, SETIO[0], SETIO[1], 'salty', 'hs-label hs-label--small hs-label--salty');
  label(shoeLabels, 290, 232, 'fresh', 'hs-label hs-label--small hs-label--fresh');
  label(shoeLabels, 610, 470, 'fresh', 'hs-label hs-label--small hs-label--fresh');
  const shoeLen = shoeBand.getTotalLength();
  function drawShoe(f) {
    shoeBand.style.strokeDasharray = `${shoeLen} ${shoeLen}`;
    shoeBand.style.strokeDashoffset = shoeLen * (1 - f);
    shoeLine.style.opacity = f >= 1 ? 1 : 0;
    shoeLabels.style.opacity = ramp(f, 0.85, 1);
  }

  // Sinking air over the middle: sunny, dry, and the water there gets saltier
  dyn.sinking = inner(group('sinking'));
  el('path', { d: `M${SETIO[0] - 20},214L${SETIO[0] + 20},214L${SETIO[0] + 20},262L${SETIO[0] + 38},262L${SETIO[0]},300L${SETIO[0] - 38},262L${SETIO[0] - 20},262Z`, class: 'hs-bigdown' }, dyn.sinking);
  sun(dyn.sinking, 420, 250, 0.85);
  [[450, 336], [492, 344], [560, 330], [602, 340]].forEach(([x, y], i) => vapour(dyn.sinking, x, y, i * 0.4));
  dyn.sinkingLabel = label(groups.sinking, SETIO[0], 196, 'Air sinks: sunny and dry', 'hs-label hs-label--small hs-label--cold');

  // Rain clouds near Africa and in the far south
  dyn.rainW = inner(group('rainW'));
  cloud(dyn.rainW, WTIO[0] + 14, 150, 0.8, 60);
  dyn.rainWLabel = label(groups.rainW, 275, 108, 'Splish, splash!', 'hs-label hs-label--small hs-label--fresh');
  dyn.rainS = inner(group('rainS'));
  cloud(dyn.rainS, SSIO[0], 418, 0.8, 50);

  // Cold water near Australia: a shivering face, snowflakes and a label
  const gColdTop = group('coldTop');
  dyn.coldTop = inner(gColdTop);
  face(dyn.coldTop, 0, 0, 22, 'cold');
  snowflake(dyn.coldTop, -40, -26, 0.8);
  snowflake(dyn.coldTop, 42, 20, 0.7);
  dyn.coldLabel = label(gColdTop, SEIO[0], M(107, -37)[1], 'Brrr! Cold water', 'hs-label hs-label--cold');

  // A nudge from the Pacific (Limonlisa's animation links the region to Niño-4)
  const gPacific = group('pacific');
  { const [x1, y1] = M(154, -1), [cx, cy] = M(140, -6), [x2, y2] = M(113, -20);
    el('path', { d: `M${x1},${y1}Q${cx},${cy} ${x2},${y2}`, class: 'hs-pacific', 'marker-end': 'url(#hsArrPacific)' }, gPacific);
    label(gPacific, M(146, 7)[0], M(146, 7)[1], 'Pacific Ocean', 'hs-label hs-label--small hs-label--pacific'); }

  const gNames = group('names');
  [['INDIA', 78, 21], ['AFRICA', 31, 6], ['AUSTRALIA', 131, -24]].forEach(([n, lo, la]) => {
    const [x, y] = M(lo, la);
    el('text', { x, y, 'text-anchor': 'middle', class: 'hs-name' }, gNames, n);
  });
  const gOcean = group('oceanName');
  { const [x, y] = M(76, -8); el('text', { x, y, 'text-anchor': 'middle', class: 'hs-ocean' }, gOcean, 'Indian Ocean'); }
  boat(gOcean, M(75, -20)[0], M(75, -20)[1], 0.8);

  // ---------- Strips under the map ----------
  const gKey = group('key');
  el('rect', { x: 400, y: 551, width: 200, height: 16, rx: 8, fill: 'url(#hsKey)', class: 'hs-key' }, gKey);
  el('text', { x: 388, y: 564, 'text-anchor': 'end', class: 'hs-key-text' }, gKey, 'fresher');
  el('text', { x: 612, y: 564, class: 'hs-key-text' }, gKey, 'saltier');

  const TL = { x1: 190, x2: 830, y: 560 };
  const gTimeline = group('timeline');
  el('text', { x: 108, y: 565, 'text-anchor': 'middle', class: 'hs-key-text' }, gTimeline, 'Months to go');
  el('line', { x1: TL.x1, y1: TL.y, x2: TL.x2, y2: TL.y, class: 'hs-tl' }, gTimeline);
  const tlDone = el('line', { x1: TL.x1, y1: TL.y, x2: TL.x1, y2: TL.y, class: 'hs-tl-done' }, gTimeline);
  [24, 18, 12, 6, 0].forEach(m => el('text', { x: lerp(TL.x1, TL.x2, (24 - m) / 24), y: 588, 'text-anchor': 'middle', class: 'hs-small' }, gTimeline, String(m)));
  const tlDot = el('circle', { cx: TL.x1, cy: TL.y, r: 9, class: 'hs-tl-dot' }, gTimeline);

  const CY = { x1: 190, x2: 830, y: 556, amp: 10 };
  const gCycle = group('cycle');
  el('text', { x: 108, y: 561, 'text-anchor': 'middle', class: 'hs-key-text' }, gCycle, 'Over the years');
  { const pts = [];
    for (let x = CY.x1; x <= CY.x2; x += 4) pts.push([x, CY.y - CY.amp * Math.cos(2 * Math.PI * (x - CY.x1) / ((CY.x2 - CY.x1) / 2))]);
    el('path', { d: 'M' + pts.map(p => f1(p[0]) + ',' + f1(p[1])).join('L'), class: 'hs-wavepath' }, gCycle);
    const mid = (CY.x1 + CY.x2) / 2;
    el('path', { d: `M${CY.x1},576v-5M${CY.x1},576H${mid}M${mid},576v-5`, class: 'hs-bracket' }, gCycle);
    el('text', { x: (CY.x1 + mid) / 2, y: 592, 'text-anchor': 'middle', class: 'hs-small' }, gCycle, 'about 12 years'); }
  const cyDot = el('circle', { cx: CY.x1, cy: CY.y - CY.amp, r: 9, class: 'hs-tl-dot' }, gCycle);

  const gChip = group('chip');
  const stageChip = chip(gChip, 200, 46);

  // ---------- Scenes ----------
  const STEPS = [[-18, 'Step 1: cold water near Australia'], [-12, 'Step 2: the air merry-go-round'],
    [-6, 'Step 3: rain near Africa'], [-1.5, 'Step 4: rain in the south'], [Infinity, 'Ta-da: the horseshoe!']];
  const SCENES = [
    { chapter: 'Salty or fresh?', title: 'The sea is salty!',
      text: 'Have you ever tasted sea water? It is salty, as if someone stirred lots of salt into it. Rain is different: rain water is fresh, with no salt at all.',
      science: 'Sea water holds about 35 grams of salt in every kilogram. Rain is fresh water.',
      layers: ['glass'] },
    { chapter: 'Salty or fresh?', title: 'Rain makes it fresher, sun makes it saltier',
      text: 'When lots of rain falls into the sea, the sea gets less salty. We say it gets fresher. When the sun shines and no rain falls, water floats up into the sky but the salt stays behind, so the sea gets saltier! In our pictures, fresher water is blue-green and saltier water is brown.',
      science: 'Sea surface salinity falls when rainfall beats evaporation and rises when evaporation wins (evaporation minus precipitation, E − P).',
      layers: ['tub'],
      tick: t => {
        const f = ramp(t, 0.6, 4.6);
        tubSeaL.setAttribute('fill', mix('#78c1ea', '#2fae9f', f));
        tubSeaR.setAttribute('fill', mix('#78c1ea', '#c98a4b', f));
        tubSalt.style.opacity = f;
      } },
    { chapter: 'The Indian Ocean', title: 'Meet the Indian Ocean',
      text: 'This is the Indian Ocean, a huge sea. India is at the top, Africa is on the left and Australia is on the right. Let’s watch something amazing grow here.',
      science: 'The tropical and southern Indian Ocean, from Africa to Australia and from about 28°N to 48°S.',
      layers: ['map', 'names', 'oceanName', 'key'] },
    { chapter: 'How it starts', title: 'Brrr! Cold water near Australia',
      text: 'One day, the sea near Australia becomes colder than usual. Brrr! The cold water cools the air just above it. Sometimes the Pacific Ocean next door gives it a little push.',
      science: 'A cold sea surface temperature (SST) anomaly in the southeastern Indian Ocean (SEIO; 12°–43°S, 95°–116°E), off the west coast of Australia. Changes in the central Pacific (the Niño-4 region) can nudge the SEIO about 9 months ahead, but local air–sea processes in the SEIO drive the slow, decadal changes.',
      layers: ['map', 'names', 'cold', 'pacific', 'key'] },
    { chapter: 'How it starts', title: 'Sinking air: sunny, dry and salty',
      text: 'Cold air is heavy, so it sinks down. Sinking air pushes the rain clouds away, so the middle of the ocean stays sunny and dry. The sun lifts water into the sky, but the salt stays behind. Here the sea gets saltier!',
      science: 'Cooler SEIO water raises sea-level pressure and suppresses convection over the southeastern tropical Indian Ocean (SETIO; 12°–25°S, 75°–110°E). Less rain falls, and the upper ocean there becomes saltier.',
      layers: ['map', 'names', 'cold', 'sinking', 'salty', 'key'],
      tick: t => { dyn.salty.style.opacity = lerp(0.12, 1, ramp(t, 0.5, 4.5)); } },
    { chapter: 'The air merry-go-round', title: 'A giant merry-go-round of air',
      text: 'The sinking air doesn’t stop there. It slides across the sea towards Africa, climbs high up into the sky, and floats back again. Round and round it goes, like a giant merry-go-round made of air!',
      science: 'An anomalous regional Walker circulation: sinking over 95°–110°E and rising over the western tropical Indian Ocean (WTIO; 3°N–12°S, 40°–70°E), joined by low-level easterlies and upper-level westerlies. It strengthens over time as its rising branch moves west.',
      layers: ['walker'] },
    { chapter: 'The air merry-go-round', title: 'Rain near Africa makes the sea fresher',
      text: 'Where the air climbs up near Africa, it cools down and makes big rain clouds. Splish, splash! All that fresh rain pours into the sea, so the water near Africa gets fresher.',
      science: 'More rainfall over the WTIO, and over the Mozambique Channel, freshens the upper ocean there. Rain matters more than evaporation in making the pattern.',
      layers: ['map', 'names', 'cold', 'salty', 'rainW', 'freshW', 'key'],
      tick: t => { dyn.freshW.style.opacity = lerp(0.1, 1, ramp(t, 0.8, 4.8)); } },
    { chapter: 'The air merry-go-round', title: 'Another merry-go-round, from north to south',
      text: 'There is a second air merry-go-round. It sinks over the salty middle and rises far away in the south, where more rain clouds grow. Now the southern sea gets fresher too!',
      science: 'An anomalous regional Hadley circulation: sinking over 10°–20°S and rising over 30°–45°S, linked by poleward flow near the surface and equatorward flow aloft. It brings more rain to the southern subtropical Indian Ocean (SSIO; 35°–45°S, 60°–120°E). Ocean currents also move salt there, but rain does most of the work.',
      layers: ['hadley'] },
    { chapter: 'The horseshoe', title: 'Ta-da! A horseshoe in the sea',
      text: 'Look! Fresh water near Africa and fresh water in the south curl around the salty water in the middle. Together they make a shape like a horseshoe! Scientists call it the horseshoe salinity pattern.',
      science: 'The horseshoe salinity pattern (HSP), the leading mode of upper-ocean salinity variability in the Indian Ocean. In its positive phase, a fresher WTIO and SSIO form a connected band around a saltier SETIO.',
      layers: ['map', 'names', 'salty', 'freshW', 'freshS', 'shoe', 'key'],
      tick: t => drawShoe(ramp(t, 0.3, 2.6)) },
    { chapter: 'The horseshoe', title: 'It goes deep, deep down',
      text: 'The horseshoe isn’t just on top of the sea. It reaches down about 150 metres. That’s as deep as five big blue whales lined up nose to tail!',
      science: 'The pattern extends from the sea surface to about 150 m depth, in both Argo float and EN4 data.',
      layers: ['deep'] },
    { chapter: 'The horseshoe', title: 'It takes about a year and a half',
      text: 'The horseshoe grows slowly. From the cold water near Australia to the full horseshoe takes about a year and a half. That’s 18 months, or one and a half birthdays! Watch it all happen again.',
      science: 'The HSP follows SEIO SST anomalies by about 17–18 months. This replay follows the lag maps in the paper and Limonlisa’s animation, from 24 months before the peak to the peak: freshening near Africa begins about 12 months before, and the southern band appears about 6 months before.',
      layers: ['map', 'names', 'cold', 'sinking', 'salty', 'rainW', 'freshW', 'warmW', 'rainS', 'freshS', 'shoe', 'timeline', 'chip'],
      tick: t => {
        const p = reduceMotion ? 1 : clamp((t % 16) / 13), m = -24 + 24 * p;
        const c = ramp(m, -10, 0), seg = c < 0.5 ? 0 : 1, f = seg ? (c - 0.5) * 2 : c * 2;
        const [a, b] = [SEIO_PATH[seg], SEIO_PATH[seg + 1]];
        const move = `translate(${f1(lerp(a[0], b[0], f))},${f1(lerp(a[1], b[1], f))})`;
        dyn.cold.setAttribute('transform', move);
        dyn.coldTop.setAttribute('transform', move);
        dyn.cold.style.opacity = dyn.coldTop.style.opacity = lerp(1, 0.35, ramp(m, -5, 0));
        const ending = 1 - 0.6 * ramp(m, -2, 0);                       // rain and circulation weaken at the peak
        dyn.sinking.style.opacity = lerp(0.5, 1, ramp(m, -24, -14)) * ending;
        dyn.salty.style.opacity = lerp(0.15, 1, ramp(m, -24, -6));
        dyn.rainW.style.opacity = ramp(m, -21, -13) * ending;
        dyn.rainW.setAttribute('transform', `translate(${f1(lerp(RAIN_START_DX, 0, ramp(m, -19, -11)))},0)`);
        dyn.freshW.style.opacity = ramp(m, -13, -4);
        dyn.warmW.style.opacity = ramp(m, -8, -3) * (1 - 0.35 * ramp(m, -2, 0));
        dyn.rainS.style.opacity = ramp(m, -11, -5) * ending;
        dyn.freshS.style.opacity = ramp(m, -7, -1);
        drawShoe(ramp(m, -1.5, 0));
        [dyn.coldLabel, dyn.sinkingLabel, dyn.rainWLabel].forEach(l => { l.style.opacity = 0; });
        stageChip.set(STEPS.find(([until]) => m < until)[1]);
        const x = lerp(TL.x1, TL.x2, p);
        tlDot.setAttribute('cx', f1(x));
        tlDone.setAttribute('x2', f1(x));
      } },
    { chapter: 'What it does', title: 'A cosy blanket of fresh water',
      text: 'Fresh water is lighter than salty water, so it floats on top, like a cosy blanket. The blanket keeps the top from mixing with the cold water deep down, so the sun’s warmth stays near the top. Slowly, the sea near Africa gets warmer!',
      science: 'Freshening lowers surface density, strengthens upper-ocean stratification and makes the mixed layer shallower, which favours heat retention near the surface. WTIO warming follows the freshening by about 6 months.',
      layers: ['blanket'],
      tick: t => { const h = lerp(18, 50, ramp(t, 0.5, 4.5)); thermoFill.setAttribute('height', f1(h)); thermoFill.setAttribute('y', f1(8 - h)); } },
    { chapter: 'Over the years', title: 'It comes and goes',
      text: 'The horseshoe doesn’t stay forever. Over about 12 years it slowly grows and fades, and it can even flip the other way: when the sea near Australia is warm, the middle gets fresher and the horseshoe gets saltier.',
      science: 'The HSP varies on decadal time scales (8–16 years, peaking near 12 years). A warm SEIO gives the opposite, negative phase. Positive phases include 2004–08 and 2019–21; negative phases include 2010–14.',
      layers: ['map', 'names', 'flip', 'cycle', 'chip'],
      tick: t => {
        const c = reduceMotion ? 1 : Math.cos(2 * Math.PI * t / 10);
        flip.a.forEach(e => { e.style.opacity = clamp(c); });
        flip.b.forEach(e => { e.style.opacity = clamp(-c); });
        stageChip.set(c >= 0 ? 'The horseshoe' : 'Flipped!');
        const x = lerp(CY.x1, CY.x2, reduceMotion ? 0 : (t / 20) % 1);
        cyDot.setAttribute('cx', f1(x));
        cyDot.setAttribute('cy', f1(CY.y - CY.amp * Math.cos(2 * Math.PI * (x - CY.x1) / ((CY.x2 - CY.x1) / 2))));
      } },
    { chapter: 'Why it matters', title: 'Why does it matter?',
      html: 'Salt helps decide how the sea warms and cools. Knowing about the horseshoe can help scientists predict our climate years ahead. This story comes from <strong>Limonlisa Sahu</strong>’s PhD research at IIT Kharagpur: <a href="https://doi.org/10.1175/JCLI-D-25-0730.1" target="_blank" rel="noopener">Sahu, Senapati, Dash &amp; Behera (2026), Journal of Climate</a>. You can also explore <a href="monsoon.html">monsoon rainfall</a>, the <a href="climate-indices.html">IOD and other climate indices</a>, or <a href="w4-story.html">the wavenumber-4 story</a>.',
      science: 'SST–salinity coupling in the Indian Ocean could help improve predictions of decadal climate variability.',
      layers: ['map', 'names', 'salty', 'freshW', 'freshS', 'shoe', 'key'] },
  ];

  function resetDynamic() {
    for (const k in dyn) dyn[k].style.opacity = '';
    dyn.rainW.removeAttribute('transform');
    const home = `translate(${f1(SEIO[0])},${f1(SEIO[1])})`;
    dyn.cold.setAttribute('transform', home);
    dyn.coldTop.setAttribute('transform', home);
    drawShoe(1);
  }

  // ---------- Player ----------
  let current = 0, start = performance.now(), auto = null;
  const panel = { chapter: document.getElementById('storyChapter'), title: document.getElementById('storyTitle'), text: document.getElementById('storyText'),
    science: document.getElementById('storyScience'), count: document.getElementById('storyCount'), prev: document.getElementById('storyPrev'),
    next: document.getElementById('storyNext'), dots: document.getElementById('storyDots'), play: document.getElementById('storyPlay') };

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
    panel.science.textContent = '';
    if (s.science) {
      const b = document.createElement('strong');
      b.textContent = 'For grown-ups: ';
      panel.science.append(b, s.science);
    }
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
