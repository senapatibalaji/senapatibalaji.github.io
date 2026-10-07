// Climate index explorer: small-multiple index panels, a two-index comparison,
// a table view and CSV export. Data: data/climate-indices.js (window.CLIMATE_INDICES).
(() => {
  const DATA = window.CLIMATE_INDICES;
  if (!DATA) return;

  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const SMOOTHING = { 1: 'Monthly values', 12: '12-month running mean', 121: '10-year running mean' };
  const SVG_NS = 'http://www.w3.org/2000/svg';

  // Absolute month index t = year * 12 + (month - 1)
  const SERIES = DATA.series.map(s => ({ ...s, t0: s.start[0] * 12 + s.start[1] - 1 }));
  const byId = Object.fromEntries(SERIES.map(s => [s.id, s]));
  const firstT = Math.min(...SERIES.map(s => s.t0));
  const lastT = Math.max(...SERIES.map(s => s.t0 + s.values.length - 1));
  const firstYear = Math.floor(firstT / 12);
  const lastYear = Math.floor(lastT / 12);

  const state = { ids: SERIES.map(s => s.id), from: 1950, to: lastYear, smooth: 12, a: 'amv', b: 'nao', lag: 0 };

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
  const fmtDate = t => MONTHS[t % 12] + ' ' + Math.floor(t / 12);
  const fmtNum = v => (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v).toFixed(2);
  const fmtVal = (v, s) => v == null ? '–' : fmtNum(v) + (s.unit === '°C' ? ' °C' : '');
  const windowT = () => [state.from * 12, Math.min(state.to * 12 + 11, lastT)];

  // ---------- Data helpers ----------
  const cache = {};
  function smoothed(s, w) {
    const key = s.id + ':' + w;
    if (cache[key]) return cache[key];
    const v = s.values;
    if (w === 1) return (cache[key] = v);
    const out = new Array(v.length).fill(null), half = Math.floor(w / 2);
    for (let i = half; i + w - 1 - half < v.length; i++) {
      let sum = 0, n = 0;
      for (let j = i - half; j <= i - half + w - 1; j++) if (v[j] != null) { sum += v[j]; n++; }
      if (n >= 0.8 * w) out[i] = sum / n;
    }
    return (cache[key] = out);
  }
  const valueAt = (s, t, w = state.smooth) => {
    const i = t - s.t0, arr = smoothed(s, w);
    return i >= 0 && i < arr.length ? arr[i] : null;
  };
  const latest = s => {
    for (let i = s.values.length - 1; i >= 0; i--) if (s.values[i] != null) return [s.t0 + i, s.values[i]];
    return [null, null];
  };
  function niceStep(span, count) {
    const raw = span / count, mag = Math.pow(10, Math.floor(Math.log10(raw)));
    const f = raw / mag;
    return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * mag;
  }
  function yearTicks(t1, t2) {
    const span = (t2 - t1) / 12;
    const step = span > 120 ? 20 : span > 50 ? 10 : span > 20 ? 5 : span > 8 ? 2 : 1;
    const ticks = [];
    for (let y = Math.ceil(t1 / 12 / step) * step; y * 12 <= t2; y += step) ticks.push(y * 12);
    return ticks;
  }
  function segments(points) {            // split [[x, y|null], ...] at gaps
    const segs = [];
    let cur = [];
    for (const p of points) {
      if (p[1] == null) { if (cur.length) segs.push(cur); cur = []; } else cur.push(p);
    }
    if (cur.length) segs.push(cur);
    return segs;
  }
  const linePath = segs => segs.map(seg => 'M' + seg.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join('L')).join('');

  // ---------- Controls ----------
  function buildControls() {
    const chips = $('indexChips');
    for (const s of SERIES) {
      const b = htmlEl('button', 'chip', s.name, chips);
      b.type = 'button';
      b.title = s.long;
      b.setAttribute('aria-pressed', state.ids.includes(s.id));
      b.addEventListener('click', () => {
        const on = state.ids.includes(s.id);
        if (on && state.ids.length === 1) return;                       // keep at least one panel
        state.ids = on ? state.ids.filter(id => id !== s.id) : SERIES.map(x => x.id).filter(id => id === s.id || state.ids.includes(id));
        b.setAttribute('aria-pressed', !on);
        renderAll();
      });
    }

    const presets = [['All', firstYear, lastYear], ['1950–now', 1950, lastYear], ['1980–now', 1980, lastYear], ['Last 30 years', lastYear - 29, lastYear]];
    const presetWrap = $('periodPresets');
    const from = $('yearFrom'), to = $('yearTo');
    for (const el of [from, to]) { el.min = firstYear; el.max = lastYear; }
    const syncPresets = () => {
      presetWrap.querySelectorAll('.chip').forEach((b, i) =>
        b.setAttribute('aria-pressed', presets[i][1] === state.from && presets[i][2] === state.to));
      from.value = state.from; to.value = state.to;
    };
    presets.forEach(([label, f, t]) => {
      const b = htmlEl('button', 'chip', label, presetWrap);
      b.type = 'button';
      b.addEventListener('click', () => { state.from = f; state.to = t; syncPresets(); renderAll(); });
    });
    const onYears = () => {
      let f = Math.round(+from.value), t = Math.round(+to.value);
      if (!f || !t) return;
      f = Math.max(firstYear, Math.min(f, lastYear - 1));
      t = Math.max(f + 1, Math.min(t, lastYear));
      state.from = f; state.to = t;
      syncPresets(); renderAll();
    };
    from.addEventListener('change', onYears);
    to.addEventListener('change', onYears);
    syncPresets();

    const smooth = $('smoothing');
    for (const [w, label] of Object.entries(SMOOTHING)) {
      const o = htmlEl('option', null, label, smooth);
      o.value = w;
      o.selected = +w === state.smooth;
    }
    smooth.addEventListener('change', () => { state.smooth = +smooth.value; renderAll(); });

    for (const [sel, key] of [[$('cmpA'), 'a'], [$('cmpB'), 'b']]) {
      for (const s of SERIES) {
        const o = htmlEl('option', null, s.name + ' — ' + s.long, sel);
        o.value = s.id;
        o.selected = s.id === state[key];
      }
      sel.addEventListener('change', () => { state[key] = sel.value; renderCompare(); });
    }
    const lag = $('cmpLag');
    lag.addEventListener('input', () => { state.lag = +lag.value; renderCompare(); });

    $('csvButton').addEventListener('click', downloadCsv);
    $('tableView').addEventListener('toggle', renderTable);
    $('dataUpdated').textContent = new Date(DATA.updated).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  // ---------- Index panels (small multiples, shared crosshair) ----------
  let panels = [];
  const tip = htmlEl('div', 'viz-tip');
  tip.hidden = true;

  function renderPanels() {
    const wrap = $('panels');
    wrap.textContent = '';
    wrap.appendChild(tip);
    panels = [];
    const [t1, t2] = windowT();
    const W = Math.max(wrap.clientWidth, 280), H = 150;
    const m = { l: 40, r: 10, t: 8, b: 22 };
    const x = t => m.l + (t - t1) / Math.max(t2 - t1, 1) * (W - m.l - m.r);
    const ticksX = yearTicks(t1, t2);

    for (const id of state.ids) {
      const s = byId[id];
      const panel = htmlEl('div', 'panel', null, wrap);
      const head = htmlEl('div', 'panel__head', null, panel);
      const title = htmlEl('div', null, null, head);
      htmlEl('span', 'panel__name', s.name, title);
      htmlEl('span', 'panel__long', ' ' + s.long + ' · ' + s.unit, title);
      const [lt, lv] = latest(s);
      htmlEl('span', 'panel__latest', 'Latest: ' + fmtVal(lv, s) + ' (' + fmtDate(lt) + ')', head);

      const pts = [];
      let maxAbs = 0;
      for (let t = t1; t <= t2; t++) {
        const v = valueAt(s, t);
        pts.push([t, v]);
        if (v != null) maxAbs = Math.max(maxAbs, Math.abs(v));
      }
      if (!maxAbs) {
        htmlEl('p', 'panel__empty', 'No ' + s.name + ' data in this period (records start in ' + Math.floor(s.t0 / 12) + ').', panel);
        continue;
      }
      const step = niceStep(maxAbs, 2), yMax = Math.ceil(maxAbs / step) * step;
      const y = v => m.t + (yMax - v) / (2 * yMax) * (H - m.t - m.b);

      const svg = svgEl('svg', { viewBox: `0 0 ${W} ${H}`, width: W, height: H, tabindex: 0, role: 'img',
        'aria-label': `${s.name} ${s.long}, ${state.from}–${state.to}, ${SMOOTHING[state.smooth].toLowerCase()}. Use the arrow keys to read values.` }, panel);

      for (const t of ticksX) {
        svgEl('line', { x1: x(t), x2: x(t), y1: m.t, y2: H - m.b, class: 'viz-grid' }, svg);
        svgEl('text', { x: x(t), y: H - 6, class: 'viz-tick', 'text-anchor': 'middle' }, svg).textContent = t / 12;
      }
      for (let v = -yMax; v <= yMax + 1e-9; v += step) {
        if (Math.abs(v) > 1e-9) svgEl('line', { x1: m.l, x2: W - m.r, y1: y(v), y2: y(v), class: 'viz-grid' }, svg);
        svgEl('text', { x: m.l - 6, y: y(v) + 4, class: 'viz-tick', 'text-anchor': 'end' }, svg).textContent = Math.abs(v) < 1e-9 ? '0' : fmtNum(v).replace(/\.?0+$/, '');
      }

      const segs = segments(pts.map(([t, v]) => [x(t), v == null ? null : y(v)]));
      const area = segs.map(seg => `M${seg[0][0].toFixed(1)},${y(0).toFixed(1)}L` +
        seg.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join('L') + `L${seg[seg.length - 1][0].toFixed(1)},${y(0).toFixed(1)}Z`).join('');
      const defs = svgEl('defs', {}, svg);
      const clipPos = svgEl('clipPath', { id: 'pos-' + id }, defs);
      svgEl('rect', { x: 0, y: 0, width: W, height: y(0) }, clipPos);
      const clipNeg = svgEl('clipPath', { id: 'neg-' + id }, defs);
      svgEl('rect', { x: 0, y: y(0), width: W, height: H }, clipNeg);
      svgEl('path', { d: area, class: 'viz-pos', 'clip-path': `url(#pos-${id})` }, svg);
      svgEl('path', { d: area, class: 'viz-neg', 'clip-path': `url(#neg-${id})` }, svg);
      svgEl('line', { x1: m.l, x2: W - m.r, y1: y(0), y2: y(0), class: 'viz-zero' }, svg);
      svgEl('path', { d: linePath(segs), class: 'viz-line' + (state.smooth === 1 ? ' viz-line--thin' : '') }, svg);

      const cross = svgEl('line', { y1: m.t, y2: H - m.b, class: 'viz-cross', visibility: 'hidden' }, svg);
      const dot = svgEl('circle', { r: 4, class: 'viz-dot', visibility: 'hidden' }, svg);
      const hit = svgEl('rect', { x: m.l, y: 0, width: W - m.l - m.r, height: H, fill: 'transparent' }, svg);

      const p = { s, svg, panel, x, update(t) {
        const v = t == null ? null : valueAt(s, t);
        cross.setAttribute('visibility', t == null ? 'hidden' : 'visible');
        if (t != null) { cross.setAttribute('x1', x(t)); cross.setAttribute('x2', x(t)); }
        dot.setAttribute('visibility', v == null ? 'hidden' : 'visible');
        if (v != null) { dot.setAttribute('cx', x(t)); dot.setAttribute('cy', y(v)); }
      } };
      panels.push(p);

      const tFromEvent = e => {
        const r = svg.getBoundingClientRect();
        const px = (e.clientX - r.left) * W / r.width;
        return Math.max(t1, Math.min(t2, Math.round(t1 + (px - m.l) / (W - m.l - m.r) * (t2 - t1))));
      };
      hit.addEventListener('pointermove', e => setHover(tFromEvent(e), e.clientX, e.clientY));
      hit.addEventListener('pointerleave', () => setHover(null));
      svg.addEventListener('keydown', e => {
        const d = { ArrowLeft: -1, ArrowRight: 1 }[e.key];
        if (e.key === 'Escape') return setHover(null);
        if (!d) return;
        e.preventDefault();
        const cur = hoverT == null ? t2 : hoverT;
        const t = Math.max(t1, Math.min(t2, cur + d * (e.shiftKey ? 12 : 1)));
        const r = svg.getBoundingClientRect();
        setHover(t, r.left + x(t) * r.width / W, r.top + 20);
      });
      svg.addEventListener('blur', () => setHover(null));
    }
    if (hoverT != null) setHover(null);
  }

  let hoverT = null;
  function setHover(t, cx, cy) {
    hoverT = t;
    panels.forEach(p => p.update(t));
    if (t == null) { tip.hidden = true; return; }
    tip.textContent = '';
    htmlEl('div', 'viz-tip__date', fmtDate(t) + (state.smooth > 1 ? ' · ' + SMOOTHING[state.smooth].toLowerCase() : ''), tip);
    for (const p of panels) {
      const row = htmlEl('div', 'viz-tip__row', null, tip);
      htmlEl('b', null, fmtVal(valueAt(p.s, t), p.s), row);
      htmlEl('span', null, p.s.name, row);
    }
    tip.hidden = false;
    const box = $('panels').getBoundingClientRect();
    let left = cx - box.left + 16;
    if (left + tip.offsetWidth > box.width) left = cx - box.left - tip.offsetWidth - 16;
    tip.style.left = Math.max(0, left) + 'px';
    tip.style.top = Math.max(0, Math.min(cy - box.top - 20, box.height - tip.offsetHeight)) + 'px';
  }

  // ---------- Comparison of two indices ----------
  function renderCompare() {
    const A = byId[state.a], B = byId[state.b], L = state.lag;
    const [t1, t2] = windowT();
    const pairs = [];
    for (let t = t1; t <= t2; t++) {
      const a = valueAt(A, t), b = valueAt(B, t + L);
      if (a != null && b != null) pairs.push([t, a, b]);
    }
    $('cmpLagLabel').textContent = L === 0 ? 'No lag'
      : L > 0 ? `${A.name} leads ${B.name} by ${L} month${L === 1 ? '' : 's'}`
      : `${B.name} leads ${A.name} by ${-L} month${L === -1 ? '' : 's'}`;

    const n = pairs.length;
    const wrap = $('cmpChart');
    wrap.textContent = '';
    if (n < 24) {
      $('cmpR').textContent = '–';
      $('cmpMeta').textContent = 'Not enough overlapping data in this period.';
      return;
    }
    const mean = k => pairs.reduce((acc, p) => acc + p[k], 0) / n;
    const ma = mean(1), mb = mean(2);
    let sab = 0, saa = 0, sbb = 0;
    for (const p of pairs) { sab += (p[1] - ma) * (p[2] - mb); saa += (p[1] - ma) ** 2; sbb += (p[2] - mb) ** 2; }
    const r = sab / Math.sqrt(saa * sbb);
    const sa = Math.sqrt(saa / n), sb = Math.sqrt(sbb / n);
    $('cmpR').textContent = (r < 0 ? '−' : '') + Math.abs(r).toFixed(2);
    $('cmpMeta').textContent = `${n.toLocaleString('en-GB')} months, ${fmtDate(pairs[0][0])} to ${fmtDate(pairs[n - 1][0])}, ${SMOOTHING[state.smooth].toLowerCase()}`;

    // Both series standardised over the overlap, so they share one axis
    const za = pairs.map(p => [p[0], (p[1] - ma) / sa]), zb = pairs.map(p => [p[0], (p[2] - mb) / sb]);
    const W = Math.max(wrap.clientWidth, 280), H = 240, m = { l: 34, r: 10, t: 10, b: 22 };
    const pt1 = pairs[0][0], pt2 = pairs[n - 1][0];
    const x = t => m.l + (t - pt1) / Math.max(pt2 - pt1, 1) * (W - m.l - m.r);
    const maxAbs = Math.max(...za.map(p => Math.abs(p[1])), ...zb.map(p => Math.abs(p[1])));
    const yMax = Math.ceil(maxAbs), y = v => m.t + (yMax - v) / (2 * yMax) * (H - m.t - m.b);
    const svg = svgEl('svg', { viewBox: `0 0 ${W} ${H}`, width: W, height: H, role: 'img',
      'aria-label': `Standardised ${A.name} and ${B.name}; correlation ${r.toFixed(2)}.` }, wrap);
    for (const t of yearTicks(pt1, pt2)) {
      svgEl('line', { x1: x(t), x2: x(t), y1: m.t, y2: H - m.b, class: 'viz-grid' }, svg);
      svgEl('text', { x: x(t), y: H - 6, class: 'viz-tick', 'text-anchor': 'middle' }, svg).textContent = t / 12;
    }
    const yStep = yMax > 3 ? 2 : 1;
    for (let v = -yMax; v <= yMax; v += yStep) {
      if (v) svgEl('line', { x1: m.l, x2: W - m.r, y1: y(v), y2: y(v), class: 'viz-grid' }, svg);
      svgEl('text', { x: m.l - 6, y: y(v) + 4, class: 'viz-tick', 'text-anchor': 'end' }, svg).textContent = v ? fmtNum(v).replace('.00', '') : '0';
    }
    svgEl('line', { x1: m.l, x2: W - m.r, y1: y(0), y2: y(0), class: 'viz-zero' }, svg);
    const thin = state.smooth === 1 ? ' viz-line--thin' : '';
    svgEl('path', { d: linePath([za.map(p => [x(p[0]), y(p[1])])]), class: 'viz-s1' + thin }, svg);
    svgEl('path', { d: linePath([zb.map(p => [x(p[0]), y(p[1])])]), class: 'viz-s2' + thin }, svg);

    $('cmpKeyA').textContent = A.name;
    $('cmpKeyB').textContent = B.name + (L ? ` (shifted ${L > 0 ? '−' : '+'}${Math.abs(L)} months)` : '');
  }

  // ---------- Table view & CSV ----------
  function renderTable() {
    const details = $('tableView');
    if (!details.open) return;
    const wrap = $('tableWrap');
    wrap.textContent = '';
    const table = htmlEl('table', 'exp-table data-table', null, wrap);
    const head = htmlEl('tr', null, null, htmlEl('thead', null, null, table));
    htmlEl('th', null, 'Year', head);
    for (const id of state.ids) htmlEl('th', null, byId[id].name + (byId[id].unit === '°C' ? ' (°C)' : ''), head);
    const body = htmlEl('tbody', null, null, table);
    for (let yr = state.to; yr >= state.from; yr--) {
      const tr = htmlEl('tr', null, null, body);
      htmlEl('td', null, String(yr), tr);
      for (const id of state.ids) {
        let sum = 0, cnt = 0;
        for (let mo = 0; mo < 12; mo++) { const v = valueAt(byId[id], yr * 12 + mo, 1); if (v != null) { sum += v; cnt++; } }
        htmlEl('td', null, cnt >= 10 ? fmtNum(sum / cnt) : '–', tr);
      }
    }
  }

  function downloadCsv() {
    const [t1, t2] = windowT();
    const rows = [['year', 'month', ...state.ids.map(id => byId[id].id)].join(',')];
    for (let t = t1; t <= t2; t++) {
      rows.push([Math.floor(t / 12), t % 12 + 1, ...state.ids.map(id => { const v = valueAt(byId[id], t, 1); return v == null ? '' : v; })].join(','));
    }
    const blob = new Blob([rows.join('\n') + '\n'], { type: 'text/csv' });
    const a = htmlEl('a', null, null, document.body);
    a.href = URL.createObjectURL(blob);
    a.download = `climate-indices_${state.from}-${state.to}_monthly.csv`;
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 0);
  }

  // ---------- Sources ----------
  function renderSources() {
    const list = $('sourceList');
    for (const s of SERIES) {
      const li = htmlEl('li', null, null, list);
      htmlEl('strong', null, s.name + ' — ' + s.long + '. ', li);
      li.appendChild(document.createTextNode(s.about + ' Source: ' + s.credit + ' ('));
      const a = htmlEl('a', null, 'data file', li);
      a.href = s.url;
      a.target = '_blank';
      a.rel = 'noopener';
      li.appendChild(document.createTextNode('). Starts ' + fmtDate(s.t0) + '.'));
    }
  }

  function renderAll() {
    renderPanels();
    renderCompare();
    renderTable();
  }

  buildControls();
  renderSources();
  renderAll();
  let resizeTimer;
  window.addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(renderAll, 150); });
})();
