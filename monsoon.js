// Indian summer monsoon page: rainfall bar chart with ENSO/IOD highlighting,
// summary tiles, running correlations, a table view and CSV export.
// Data: data/monsoon-rainfall.js (window.MONSOON).
(() => {
  const DATA = window.MONSOON;
  if (!DATA) return;

  const SVG_NS = 'http://www.w3.org/2000/svg';
  const NINO_T = 0.5, IOD_T = 0.3;                    // detrended JJAS thresholds (°C)
  const T_CRIT = { 11: 2.262, 21: 2.093, 31: 2.045 }; // two-sided 95% t, df = window - 2
  const YEARS = DATA.years;
  const first = YEARS[0].y, last = YEARS[YEARS.length - 1].y;

  const phase = r => ({
    elnino: r.nino != null && r.nino >= NINO_T,
    lanina: r.nino != null && r.nino <= -NINO_T,
    piod: r.iod != null && r.iod >= IOD_T,
    niod: r.iod != null && r.iod <= -IOD_T,
  });
  const HIGHLIGHTS = [
    ['all', 'None', null],
    ['elnino', 'El Niño', r => phase(r).elnino],
    ['lanina', 'La Niña', r => phase(r).lanina],
    ['piod', 'Positive IOD', r => phase(r).piod],
    ['niod', 'Negative IOD', r => phase(r).niod],
    ['elnino-piod', 'El Niño + positive IOD', r => phase(r).elnino && phase(r).piod],
    ['elnino-only', 'El Niño without positive IOD', r => phase(r).elnino && !phase(r).piod],
  ];
  const HIGHLIGHT_NOUN = { elnino: 'El Niño years', lanina: 'La Niña years', piod: 'Positive IOD years', niod: 'Negative IOD years',
    'elnino-piod': 'El Niño + positive IOD years', 'elnino-only': 'El Niño years without a positive IOD' };
  const PERIODS = [['1871–now', first], ['1950–now', 1950], ['1980–now', 1980]];

  const state = { highlight: 'all', from: first, window: 21 };

  const $ = id => document.getElementById(id);
  const svgEl = (tag, attrs, parent) => {
    const n = document.createElementNS(SVG_NS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  };
  const htmlEl = (tag, cls, text, parent) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    if (parent) parent.appendChild(n);
    return n;
  };
  const signed = (v, d = 1) => (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v).toFixed(d);
  const pctOfNormal = r => Math.round(100 + r.dep);
  const category = r => {
    const p = pctOfNormal(r);
    return p < 90 ? 'Deficient' : p <= 95 ? 'Below normal' : p <= 104 ? 'Normal' : p <= 110 ? 'Above normal' : 'Excess';
  };
  const barClass = r => ({ Excess: 'bar--flood', Deficient: 'bar--drought' })[category(r)] || 'bar--normal';
  const phaseText = r => {
    const p = phase(r);
    const enso = r.nino == null ? 'not yet available' : p.elnino ? 'El Niño' : p.lanina ? 'La Niña' : 'neutral';
    const iod = r.iod == null ? 'not yet available' : p.piod ? 'positive' : p.niod ? 'negative' : 'neutral';
    return [enso, iod];
  };
  const inPeriod = () => YEARS.filter(r => r.y >= state.from);
  const matches = r => { const f = HIGHLIGHTS.find(h => h[0] === state.highlight)[2]; return !f || f(r); };

  // ---------- Controls ----------
  function buildControls() {
    const hl = $('highlightChips');
    for (const [id, label] of HIGHLIGHTS) {
      const b = htmlEl('button', 'chip', label, hl);
      b.type = 'button';
      b.dataset.id = id;
      b.addEventListener('click', () => { state.highlight = id; syncChips(); renderAll(); });
    }
    const per = $('periodChips');
    for (const [label, from] of PERIODS) {
      const b = htmlEl('button', 'chip', label, per);
      b.type = 'button';
      b.dataset.from = from;
      b.addEventListener('click', () => { state.from = from; syncChips(); renderAll(); });
    }
    $('corrWindow').addEventListener('change', e => { state.window = +e.target.value; renderCorr(); });
    $('csvButton').addEventListener('click', downloadCsv);
    $('tableView').addEventListener('toggle', renderTable);
    $('dataUpdated').textContent = new Date(DATA.updated).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    const links = $('imdLinks');
    Object.entries(DATA.imdSources).forEach(([yr, url], i) => {
      if (i) links.appendChild(document.createTextNode(', '));
      const a = htmlEl('a', null, yr, links);
      a.href = url; a.target = '_blank'; a.rel = 'noopener';
    });
    syncChips();
  }
  function syncChips() {
    $('highlightChips').querySelectorAll('.chip').forEach(b => b.setAttribute('aria-pressed', b.dataset.id === state.highlight));
    $('periodChips').querySelectorAll('.chip').forEach(b => b.setAttribute('aria-pressed', +b.dataset.from === state.from));
    $('dimKey').hidden = state.highlight === 'all';
  }

  // ---------- Summary tiles ----------
  function renderStats() {
    const all = inPeriod(), set = all.filter(matches);
    const row = $('statRow');
    row.textContent = '';
    const mean = rs => rs.reduce((a, r) => a + r.dep, 0) / rs.length;
    const deficient = rs => rs.filter(r => category(r) === 'Deficient').length;
    const excess = rs => rs.filter(r => category(r) === 'Excess').length;
    const pct = (n, rs) => Math.round(100 * n / rs.length) + '%';
    const filtered = state.highlight !== 'all';
    const tile = (label, value, sub) => {
      const t = htmlEl('div', 'stat stat--small', null, row);
      htmlEl('span', 'stat__label', label, t);
      htmlEl('span', 'stat__value', value, t);
      if (sub) htmlEl('span', 'stat__meta', sub, t);
    };
    const span = `${all[0].y}–${all[all.length - 1].y}`;
    tile(filtered ? HIGHLIGHT_NOUN[state.highlight] : 'Seasons', String(set.length), filtered ? `of ${all.length} seasons, ${span}` : span);
    if (!set.length) return;
    tile('Average vs normal', signed(mean(set)) + '%', filtered ? `All years: ${signed(mean(all))}%` : 'All seasons in the period');
    tile('Drought years', pct(deficient(set), set), `${deficient(set)} of ${set.length}` + (filtered ? ` · all years: ${pct(deficient(all), all)}` : ''));
    tile('Flood years', pct(excess(set), set), `${excess(set)} of ${set.length}` + (filtered ? ` · all years: ${pct(excess(all), all)}` : ''));
  }

  // ---------- Rainfall bar chart ----------
  const tip = htmlEl('div', 'viz-tip');
  tip.hidden = true;
  let hoverIdx = null, chart = null;

  function yearTicks(y1, y2) {
    const step = y2 - y1 > 100 ? 20 : y2 - y1 > 40 ? 10 : 5;
    const t = [];
    for (let y = Math.ceil(y1 / step) * step; y <= y2; y += step) t.push(y);
    return t;
  }

  function barPath(x, w, y0, y1, r) {             // rounded at the data end, square at the baseline
    const h = Math.abs(y1 - y0);
    r = Math.min(r, w / 2, h);
    if (y1 < y0) return `M${x},${y0}V${y1 + r}Q${x},${y1} ${x + r},${y1}H${x + w - r}Q${x + w},${y1} ${x + w},${y1 + r}V${y0}Z`;
    return `M${x},${y0}V${y1 - r}Q${x},${y1} ${x + r},${y1}H${x + w - r}Q${x + w},${y1} ${x + w},${y1 - r}V${y0}Z`;
  }

  function renderRain() {
    const wrap = $('rainChart');
    wrap.textContent = '';
    wrap.appendChild(tip);
    const rows = inPeriod();
    const W = Math.max(wrap.clientWidth, 280), H = 350, track = 13;
    const m = { l: 44, r: W < 560 ? 12 : 76, t: 8 + 2 * track + 16, b: 24 };
    const n = rows.length, band = (W - m.l - m.r) / n;
    const bw = band >= 4 ? Math.min(24, band - 2) : band * 0.7;
    const yMax = Math.ceil(Math.max(...rows.map(r => Math.abs(r.dep))) / 10) * 10;
    const y = v => m.t + (yMax - v) / (2 * yMax) * (H - m.t - m.b);
    const xOf = i => m.l + i * band + (band - bw) / 2;

    const svg = svgEl('svg', { viewBox: `0 0 ${W} ${H}`, width: W, height: H, tabindex: 0, role: 'img',
      'aria-label': `Bar chart of all-India monsoon rainfall departures, ${rows[0].y}–${rows[n - 1].y}. Use the arrow keys to read each season; the data table below lists every value.` }, wrap);
    for (let v = -yMax; v <= yMax; v += 10) {
      if (v) svgEl('line', { x1: m.l, x2: W - m.r, y1: y(v), y2: y(v), class: 'viz-grid' }, svg);
      svgEl('text', { x: m.l - 6, y: y(v) + 4, class: 'viz-tick', 'text-anchor': 'end' }, svg).textContent = v ? signed(v, 0) + '%' : '0';
    }
    for (const t of yearTicks(rows[0].y, rows[n - 1].y)) {
      const i = rows.findIndex(r => r.y === t);
      if (i >= 0) svgEl('text', { x: m.l + (i + 0.5) * band, y: H - 6, class: 'viz-tick', 'text-anchor': 'middle' }, svg).textContent = t;
    }
    for (const v of [10, -10]) {
      svgEl('line', { x1: m.l, x2: W - m.r, y1: y(v), y2: y(v), class: 'viz-ref' }, svg);
      if (m.r > 40) svgEl('text', { x: W - m.r + 6, y: y(v) + 4, class: 'viz-tick' }, svg).textContent = v > 0 ? 'Excess' : 'Deficient';
    }

    // ENSO and IOD symbols in two tracks above the bars
    const s = Math.max(2.5, Math.min(4.5, band * 0.45));
    const ensoY = 8 + track / 2, iodY = 8 + track * 1.5;
    svgEl('text', { x: m.l - 6, y: ensoY + 3.5, class: 'viz-track-label', 'text-anchor': 'end' }, svg).textContent = 'ENSO';
    svgEl('text', { x: m.l - 6, y: iodY + 3.5, class: 'viz-track-label', 'text-anchor': 'end' }, svg).textContent = 'IOD';
    rows.forEach((r, i) => {
      const p = phase(r), cx = m.l + (i + 0.5) * band;
      if (p.elnino) svgEl('path', { d: `M${cx},${ensoY - s}L${cx + s},${ensoY + s * 0.8}H${cx - s}Z`, class: 'sym-enso' }, svg);
      if (p.lanina) svgEl('path', { d: `M${cx},${ensoY + s}L${cx + s},${ensoY - s * 0.8}H${cx - s}Z`, class: 'sym-enso sym--open' }, svg);
      if (p.piod) svgEl('circle', { cx, cy: iodY, r: s * 0.9, class: 'sym-iod' }, svg);
      if (p.niod) svgEl('circle', { cx, cy: iodY, r: s * 0.8, class: 'sym-iod sym--open' }, svg);
    });

    const bars = rows.map((r, i) => svgEl('path', {
      d: barPath(xOf(i), bw, y(0), y(r.dep), 2),
      class: 'bar ' + (matches(r) ? barClass(r) : 'bar--dim'),
    }, svg));
    svgEl('line', { x1: m.l, x2: W - m.r, y1: y(0), y2: y(0), class: 'viz-zero' }, svg);

    const hits = svgEl('g', {}, svg);
    rows.forEach((r, i) => {
      const h = svgEl('rect', { x: m.l + i * band, y: m.t, width: band, height: H - m.t - m.b, fill: 'transparent' }, hits);
      h.addEventListener('pointerenter', e => setHover(i, e.clientX, e.clientY));
      h.addEventListener('pointermove', e => positionTip(e.clientX, e.clientY));
    });
    hits.addEventListener('pointerleave', () => setHover(null));
    svg.addEventListener('keydown', e => {
      const d = { ArrowLeft: -1, ArrowRight: 1 }[e.key];
      if (e.key === 'Escape') return setHover(null);
      if (!d) return;
      e.preventDefault();
      const i = Math.max(0, Math.min(n - 1, (hoverIdx == null ? n - 1 : hoverIdx) + d));
      const box = svg.getBoundingClientRect();
      setHover(i, box.left + (m.l + (i + 0.5) * band) * box.width / W, box.top + 40);
    });
    svg.addEventListener('blur', () => setHover(null));
    chart = { rows, bars, svg };
    hoverIdx = null;
  }

  function setHover(i, cx, cy) {
    if (hoverIdx != null && chart.bars[hoverIdx]) chart.bars[hoverIdx].classList.remove('bar--hover');
    hoverIdx = i;
    chart.svg.classList.toggle('is-hovering', i != null);
    if (i == null) { tip.hidden = true; return; }
    const r = chart.rows[i];
    chart.bars[i].classList.add('bar--hover');
    tip.textContent = '';
    htmlEl('div', 'viz-tip__date', String(r.y) + (r.src === 'IMD' ? ' · IMD' : ''), tip);
    const row = (value, label) => { const d = htmlEl('div', 'viz-tip__row', null, tip); htmlEl('b', null, value, d); htmlEl('span', null, label, d); };
    row(signed(r.dep) + '%', 'vs normal · ' + category(r));
    const [enso, iod] = phaseText(r);
    row(r.nino == null ? '–' : signed(r.nino, 2) + ' °C', 'Niño 3.4 · ' + enso);
    row(r.iod == null ? '–' : signed(r.iod, 2) + ' °C', 'IOD · ' + iod);
    tip.hidden = false;
    positionTip(cx, cy);
  }
  function positionTip(cx, cy) {
    if (tip.hidden) return;
    const box = $('rainChart').getBoundingClientRect();
    let left = cx - box.left + 16;
    if (left + tip.offsetWidth > box.width) left = cx - box.left - tip.offsetWidth - 16;
    tip.style.left = Math.max(0, left) + 'px';
    tip.style.top = Math.max(0, Math.min(cy - box.top - 20, box.height - tip.offsetHeight)) + 'px';
  }

  // ---------- Running correlation ----------
  const corrTip = htmlEl('div', 'viz-tip');
  corrTip.hidden = true;

  function pearson(pairs) {
    const n = pairs.length, ma = pairs.reduce((s, p) => s + p[0], 0) / n, mb = pairs.reduce((s, p) => s + p[1], 0) / n;
    let ab = 0, aa = 0, bb = 0;
    for (const [a, b] of pairs) { ab += (a - ma) * (b - mb); aa += (a - ma) ** 2; bb += (b - mb) ** 2; }
    return ab / Math.sqrt(aa * bb);
  }

  function renderCorr() {
    const wrap = $('corrChart');
    wrap.textContent = '';
    wrap.appendChild(corrTip);
    const rows = inPeriod(), w = state.window, half = (w - 1) / 2;
    const series = ['nino', 'iod'].map(key => {
      const pts = [];
      for (let i = half; i < rows.length - half; i++) {
        const win = rows.slice(i - half, i + half + 1).filter(r => r[key] != null);
        pts.push([rows[i].y, win.length === w ? pearson(win.map(r => [r.dep, r[key]])) : null]);
      }
      return pts;
    });
    if (!series[0].length) {
      htmlEl('p', 'panel__empty', 'The period is too short for this window.', wrap);
      return;
    }
    const t = T_CRIT[w], rCrit = t / Math.sqrt(w - 2 + t * t);
    const W = Math.max(wrap.clientWidth, 280), H = 260, m = { l: 40, r: W < 560 ? 12 : 76, t: 10, b: 24 };
    const y1 = rows[0].y, y2 = rows[rows.length - 1].y;
    const x = yr => m.l + (yr - y1) / (y2 - y1) * (W - m.l - m.r);
    const y = v => m.t + (1 - v) / 2 * (H - m.t - m.b);
    const svg = svgEl('svg', { viewBox: `0 0 ${W} ${H}`, width: W, height: H, role: 'img',
      'aria-label': `Running ${w}-year correlation of monsoon rainfall with Niño 3.4 and the IOD.` }, wrap);
    svgEl('rect', { x: m.l, y: y(rCrit), width: W - m.l - m.r, height: y(-rCrit) - y(rCrit), class: 'viz-band' }, svg);
    for (const v of [-1, -0.5, 0, 0.5, 1]) {
      if (v) svgEl('line', { x1: m.l, x2: W - m.r, y1: y(v), y2: y(v), class: 'viz-grid' }, svg);
      svgEl('text', { x: m.l - 6, y: y(v) + 4, class: 'viz-tick', 'text-anchor': 'end' }, svg).textContent = v ? signed(v, 1) : '0';
    }
    for (const yr of yearTicks(y1, y2)) svgEl('text', { x: x(yr), y: H - 6, class: 'viz-tick', 'text-anchor': 'middle' }, svg).textContent = yr;
    svgEl('line', { x1: m.l, x2: W - m.r, y1: y(0), y2: y(0), class: 'viz-zero' }, svg);

    const names = ['Niño 3.4', 'IOD'], cls = ['viz-s1', 'viz-s2'];
    const ends = [];
    series.forEach((pts, k) => {
      let d = '', pen = false;
      for (const [yr, r] of pts) {
        if (r == null) { pen = false; continue; }
        d += (pen ? 'L' : 'M') + x(yr).toFixed(1) + ',' + y(r).toFixed(1);
        pen = true;
      }
      svgEl('path', { d, class: cls[k] }, svg);
      const lastPt = [...pts].reverse().find(p => p[1] != null);
      if (lastPt) ends.push([k, x(lastPt[0]), y(lastPt[1])]);
    });
    if (m.r > 40 && ends.length === 2 && Math.abs(ends[0][2] - ends[1][2]) >= 14) {
      for (const [k, ex, ey] of ends) svgEl('text', { x: ex + 6, y: ey + 4, class: 'viz-tick viz-tick--label' }, svg).textContent = names[k];
    }

    const cross = svgEl('line', { y1: m.t, y2: H - m.b, class: 'viz-cross', visibility: 'hidden' }, svg);
    const dots = cls.map(c => svgEl('circle', { r: 4, class: 'viz-dot ' + c + '-dot', visibility: 'hidden' }, svg));
    const hit = svgEl('rect', { x: m.l, y: 0, width: W - m.l - m.r, height: H, fill: 'transparent' }, svg);
    const years = series[0].map(p => p[0]);
    hit.addEventListener('pointermove', e => {
      const box = svg.getBoundingClientRect(), px = (e.clientX - box.left) * W / box.width;
      const yr = Math.max(years[0], Math.min(years[years.length - 1], Math.round(y1 + (px - m.l) / (W - m.l - m.r) * (y2 - y1))));
      const i = years.indexOf(yr);
      cross.setAttribute('visibility', 'visible');
      cross.setAttribute('x1', x(yr)); cross.setAttribute('x2', x(yr));
      corrTip.textContent = '';
      htmlEl('div', 'viz-tip__date', `${yr - half}–${yr + half} (centre ${yr})`, corrTip);
      series.forEach((pts, k) => {
        const r = pts[i][1];
        dots[k].setAttribute('visibility', r == null ? 'hidden' : 'visible');
        if (r != null) { dots[k].setAttribute('cx', x(yr)); dots[k].setAttribute('cy', y(r)); }
        const row = htmlEl('div', 'viz-tip__row', null, corrTip);
        const lab = htmlEl('span', null, null, row);
        htmlEl('i', 'viz-tip__key ' + cls[k] + '-key', null, lab);
        lab.appendChild(document.createTextNode(names[k]));
        htmlEl('b', null, r == null ? '–' : 'r = ' + signed(r, 2), row);
      });
      corrTip.hidden = false;
      const wb = wrap.getBoundingClientRect();
      let left = e.clientX - wb.left + 16;
      if (left + corrTip.offsetWidth > wb.width) left = e.clientX - wb.left - corrTip.offsetWidth - 16;
      corrTip.style.left = Math.max(0, left) + 'px';
      corrTip.style.top = Math.max(0, e.clientY - wb.top - 20) + 'px';
    });
    hit.addEventListener('pointerleave', () => {
      cross.setAttribute('visibility', 'hidden');
      dots.forEach(d => d.setAttribute('visibility', 'hidden'));
      corrTip.hidden = true;
    });
  }

  // ---------- Table view & CSV ----------
  const COLUMNS = [
    ['Year', r => String(r.y)],
    ['Rainfall vs normal (%)', r => signed(r.dep)],
    ['% of normal', r => String(pctOfNormal(r))],
    ['Category', category],
    ['Niño 3.4 JJAS (°C)', r => r.nino == null ? '' : signed(r.nino, 2)],
    ['ENSO', r => phaseText(r)[0]],
    ['IOD JJAS (°C)', r => r.iod == null ? '' : signed(r.iod, 2)],
    ['IOD phase', r => phaseText(r)[1]],
    ['Source', r => r.src],
  ];
  function renderTable() {
    if (!$('tableView').open) return;
    const wrap = $('tableWrap');
    wrap.textContent = '';
    const table = htmlEl('table', 'exp-table data-table', null, wrap);
    const head = htmlEl('tr', null, null, htmlEl('thead', null, null, table));
    COLUMNS.forEach(([label]) => htmlEl('th', null, label, head));
    const body = htmlEl('tbody', null, null, table);
    for (const r of inPeriod().filter(matches).reverse()) {
      const tr = htmlEl('tr', null, null, body);
      COLUMNS.forEach(([, f]) => htmlEl('td', null, f(r) || '–', tr));
    }
  }
  function downloadCsv() {
    const esc = s => /[",]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    const lines = [COLUMNS.map(c => esc(c[0])).join(',')];
    for (const r of inPeriod().filter(matches)) lines.push(COLUMNS.map(([, f]) => esc(f(r).replace('−', '-'))).join(','));
    const blob = new Blob([lines.join('\n') + '\n'], { type: 'text/csv' });
    const a = htmlEl('a', null, null, document.body);
    a.href = URL.createObjectURL(blob);
    a.download = `indian-monsoon-rainfall_${state.from}-${last}${state.highlight === 'all' ? '' : '_' + state.highlight}.csv`;
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 0);
  }

  function renderAll() {
    renderStats();
    renderRain();
    renderCorr();
    renderTable();
  }

  buildControls();
  renderAll();
  let resizeTimer;
  window.addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(renderAll, 150); });
})();
