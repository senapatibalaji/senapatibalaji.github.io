(() => {
  const nav = document.querySelector('.nav');
  const toggle = document.querySelector('.nav__toggle');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.getElementById('year').textContent = new Date().getFullYear();

  // Hide the CV button until assets/Balaji_Senapati_CV.pdf has been uploaded
  const cvLink = document.querySelector('a[href$="_CV.pdf"]');
  if (cvLink && location.protocol.startsWith('http')) {
    fetch(cvLink.href, { method: 'HEAD' })
      .then(r => { if (!r.ok) cvLink.remove(); })
      .catch(() => {});
  }

  // Total visitors from GoatCounter, shown in the footer once there are any.
  // GoatCounter's cached total can go stale for hours; asking for the total up
  // to tomorrow's date gives a new cache entry each day, so it updates daily.
  const tomorrow = new Date(Date.now() + 864e5).toISOString().slice(0, 10);
  fetch('https://senapatibalaji.goatcounter.com/counter/TOTAL.json?end=' + tomorrow)
    .then(r => r.ok ? r.json() : Promise.reject())
    .then(d => {
      if (!d.count || d.count === '0') return;
      document.getElementById('visits').textContent = d.count;
      document.querySelector('.footer__visits').hidden = false;
    })
    .catch(() => {});

  // ---------- Navigation ----------
  // Pages without the dark hero keep the solid navigation bar
  const hasHero = !!document.querySelector('.hero');
  const onScroll = () => nav.classList.toggle('is-scrolled', !hasHero || window.scrollY > 40);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  toggle.addEventListener('click', () => {
    const open = nav.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', open);
  });
  document.querySelectorAll('.nav__links a').forEach(a =>
    a.addEventListener('click', () => {
      nav.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
    })
  );

  // Highlight the section currently in view
  const links = new Map([...document.querySelectorAll('.nav__links a[href^="#"]')]
    .map(a => [a.getAttribute('href').slice(1), a]));
  const spy = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      links.forEach(a => a.classList.remove('is-active'));
      links.get(e.target.id)?.classList.add('is-active');
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  links.forEach((_, id) => { const s = document.getElementById(id); if (s) spy.observe(s); });

  // ---------- Publication filter ----------
  const filters = document.querySelectorAll('.filter');
  const pubs = document.querySelectorAll('.pub');
  filters.forEach(btn => btn.addEventListener('click', () => {
    filters.forEach(b => b.classList.toggle('is-active', b === btn));
    const f = btn.dataset.filter;
    pubs.forEach(p => { p.hidden = f !== 'all' && p.dataset.type !== f; });
  }));

  // ---------- Reveal on scroll ----------
  const revealables = document.querySelectorAll('.section h2, .card, .pub, .timeline li, .events li, .people li, .awards li, .media__card, .stats div');
  if (!reduceMotion && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('is-visible'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    revealables.forEach(el => { el.classList.add('reveal'); io.observe(el); });
  }

  // ---------- Hero: animated circumpolar wavenumber-4 pattern ----------
  // A south-polar view with latitude rings, anomaly lobes and contours
  // shaped by a zonal wavenumber-4 wave that slowly travels eastward.
  const canvas = document.getElementById('wave');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, cx, cy, R, dpr;

  const resize = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.clientWidth; H = canvas.clientHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const wide = W > 980;
    cx = wide ? W * 0.74 : W * 0.5;
    cy = wide ? H * 0.52 : H * 0.62;
    R = wide ? Math.min(H * 0.46, W * 0.3) : Math.min(W, H) * 0.62;
  };

  const TAU = Math.PI * 2;
  const draw = t => {
    ctx.clearRect(0, 0, W, H);
    const phase = t * 0.00012;

    // Anomaly lobes: warm/cool alternating around the subtropical band
    for (let k = 0; k < 8; k++) {
      const theta = k * TAU / 8 + phase;
      const warm = k % 2 === 0;
      const rr = R * 0.62;
      const x = cx + Math.cos(theta) * rr, y = cy + Math.sin(theta) * rr;
      const g = ctx.createRadialGradient(x, y, 0, x, y, R * 0.3);
      g.addColorStop(0, warm ? 'rgba(232,160,90,0.20)' : 'rgba(80,170,220,0.20)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(x, y, R * 0.3, 0, TAU); ctx.fill();
    }

    // Latitude rings and meridians (graticule)
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    for (let i = 1; i <= 5; i++) { ctx.beginPath(); ctx.arc(cx, cy, R * i / 5, 0, TAU); ctx.stroke(); }
    for (let m = 0; m < 12; m++) {
      const a = m * TAU / 12;
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R); ctx.stroke();
    }

    // Contours deformed by the wavenumber-4 wave (amplitude peaks mid-band)
    const N = 14;
    for (let i = 1; i <= N; i++) {
      const base = R * (0.18 + 0.8 * i / N);
      const env = Math.sin(Math.PI * i / (N + 1));
      const amp = R * 0.055 * env;
      const alpha = 0.08 + 0.22 * env;
      ctx.strokeStyle = i % 2 ? `rgba(232,196,122,${alpha})` : `rgba(150,200,235,${alpha * 0.8})`;
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      for (let s = 0; s <= 240; s++) {
        const a = s / 240 * TAU;
        const r = base + amp * Math.cos(4 * (a - phase)) + amp * 0.25 * Math.sin(8 * a - phase * 3 + i);
        const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
        s ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      ctx.closePath(); ctx.stroke();
    }

    // Antarctica
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 0.16);
    g.addColorStop(0, 'rgba(255,255,255,0.14)');
    g.addColorStop(1, 'rgba(255,255,255,0.03)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(cx, cy, R * 0.15, 0, TAU); ctx.fill();

    // Fade the left side so the text stays legible
    if (W > 980) {
      const fade = ctx.createLinearGradient(0, 0, W * 0.6, 0);
      fade.addColorStop(0, 'rgba(6,24,43,0.85)');
      fade.addColorStop(1, 'rgba(6,24,43,0)');
      ctx.fillStyle = fade; ctx.fillRect(0, 0, W * 0.6, H);
    } else {
      ctx.fillStyle = 'rgba(6,24,43,0.55)'; ctx.fillRect(0, 0, W, H);
    }
  };

  let visible = true;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(canvas);
  const loop = t => { if (visible) draw(t); requestAnimationFrame(loop); };

  resize();
  window.addEventListener('resize', () => { resize(); if (reduceMotion) draw(0); });
  reduceMotion ? draw(0) : requestAnimationFrame(loop);
})();
