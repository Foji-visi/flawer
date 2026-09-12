(() => {
  'use strict';

  /* ---------- setup ---------- */

  const skyCanvas = document.getElementById('sky');
  const gardenCanvas = document.getElementById('garden');
  const skyCtx = skyCanvas.getContext('2d');
  const gardenCtx = gardenCanvas.getContext('2d');
  const hint = document.getElementById('hint');
  const clearBtn = document.getElementById('clearBtn');

  const DPR = Math.min(window.devicePixelRatio || 1, 2);
  let W = 0, H = 0;

  function resize() {
    W = window.innerWidth;
    H = window.innerHeight;
    for (const c of [skyCanvas, gardenCanvas]) {
      c.width = W * DPR;
      c.height = H * DPR;
      c.getContext('2d').setTransform(DPR, 0, 0, DPR, 0, 0);
    }
    buildStars();
  }

  /* ---------- starfield ---------- */

  let stars = [];

  function buildStars() {
    const count = Math.round((W * H) / 9000);
    stars = Array.from({ length: count }, () => ({
      x: Math.random() * W,
      y: Math.random() * H * 0.85,
      r: Math.random() * 1.3 + 0.3,
      base: Math.random() * 0.4 + 0.25,
      phase: Math.random() * Math.PI * 2,
      speed: Math.random() * 0.6 + 0.3
    }));
  }

  function drawSky(t) {
    const g = skyCtx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#150a1e');
    g.addColorStop(1, '#2c1330');
    skyCtx.fillStyle = g;
    skyCtx.fillRect(0, 0, W, H);

    for (const s of stars) {
      const a = s.base + Math.sin(t * 0.001 * s.speed + s.phase) * 0.25;
      skyCtx.globalAlpha = Math.max(0, a);
      skyCtx.fillStyle = '#fff8f0';
      skyCtx.beginPath();
      skyCtx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      skyCtx.fill();
    }
    skyCtx.globalAlpha = 1;
  }

  /* ---------- palettes ---------- */
  // bright, popular-with-girls colour stories per flower type

  const PALETTES = {
    daisy: [
      { petal: '#ffffff', petalShade: '#f2e9f6', center: '#ffce54', centerDeep: '#e08e1f' },
      { petal: '#ffe1ef', petalShade: '#ffc9de', center: '#ffce54', centerDeep: '#e08e1f' }
    ],
    sunflower: [
      { petal: '#ffd93d', petalShade: '#f4b400', center: '#6b3f1d', centerDeep: '#40230f' }
    ],
    poppy: [
      { petal: '#ff4d5e', petalShade: '#d81f3a', center: '#2b0f1a', centerDeep: '#150609' },
      { petal: '#ff7a3d', petalShade: '#e6551b', center: '#2b0f1a', centerDeep: '#150609' }
    ],
    tulip: [
      { a: '#ff6fa8', b: '#e6357e', c: '#c21f63' },
      { a: '#b983ff', b: '#8f5ae8', c: '#6f3fc7' },
      { a: '#ff8fab', b: '#ff5c8a', c: '#e63f6d' }
    ],
    peony: [
      { outer: '#ff9fc7', mid: '#ff6fa8', inner: '#e6357e' },
      { outer: '#ffd0e6', mid: '#ffa6cf', inner: '#ff6fa8' }
    ],
    sakura: [
      { petal: '#ffd3e6', petalShade: '#ffb6d5', center: '#ffce54' },
      { petal: '#ffffff', petalShade: '#ffe6f0', center: '#ffce54' }
    ]
  };

  const TYPES = Object.keys(PALETTES);

  /* ---------- flower factory ---------- */

  let flowers = [];
  const MAX_FLOWERS = 260;

  function spawnFlower(x, y) {
    if (flowers.length >= MAX_FLOWERS) flowers.shift();
    const type = TYPES[Math.floor(Math.random() * TYPES.length)];
    const palette = PALETTES[type][Math.floor(Math.random() * PALETTES[type].length)];
    flowers.push({
      x, y,
      type, palette,
      size: 15 + Math.random() * 9,
      stemLen: 34 + Math.random() * 26,
      lean: (Math.random() - 0.5) * 0.5,
      rot: (Math.random() - 0.5) * 0.4,
      born: performance.now(),
      swaySeed: Math.random() * Math.PI * 2,
      swaySpeed: 0.5 + Math.random() * 0.4
    });
  }

  /* ---------- drawing helpers ---------- */

  function ease(t) { return 1 - Math.pow(1 - t, 3); }

  function drawStem(ctx, baseX, baseY, tipX, tipY, growth, color) {
    const cx = (baseX + tipX) / 2 + (baseX - tipX) * 0.15;
    const cy = (baseY + tipY) / 2;
    const curX = baseX + (cx - baseX) * growth;
    const curY = baseY + (cy - baseY) * growth;
    const endX = baseX + (tipX - baseX) * growth;
    const endY = baseY + (tipY - baseY) * growth;

    ctx.strokeStyle = color;
    ctx.lineWidth = 2.4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(baseX, baseY);
    ctx.quadraticCurveTo(curX, curY, endX, endY);
    ctx.stroke();

    if (growth > 0.4) {
      const leafT = Math.min(1, (growth - 0.4) / 0.4);
      [0.35, 0.62].forEach((along, i) => {
        const lx = baseX + (endX - baseX) * along;
        const ly = baseY + (endY - baseY) * along;
        const dir = i % 2 === 0 ? -1 : 1;
        ctx.save();
        ctx.translate(lx, ly);
        ctx.rotate(dir * 0.9);
        ctx.scale(leafT, leafT);
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.ellipse(dir * 7, 0, 8, 3.2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });
    }
  }

  function drawPetalRing(ctx, count, len, width, colorOuter, colorInner, offset) {
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2 + offset;
      ctx.save();
      ctx.rotate(a);
      const grad = ctx.createLinearGradient(0, 0, 0, -len);
      grad.addColorStop(0, colorInner);
      grad.addColorStop(1, colorOuter);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(0, -len / 2, width / 2, len / 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  function drawDaisy(ctx, size, bloom, p) {
    ctx.save();
    ctx.scale(bloom, bloom);
    drawPetalRing(ctx, 13, size * 1.5, size * 0.42, p.petalShade, p.petal, 0);
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, size * 0.42);
    g.addColorStop(0, p.center);
    g.addColorStop(1, p.centerDeep);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawSunflower(ctx, size, bloom, p) {
    ctx.save();
    ctx.scale(bloom, bloom);
    drawPetalRing(ctx, 16, size * 1.7, size * 0.55, p.petalShade, p.petal, 0.1);
    drawPetalRing(ctx, 16, size * 1.25, size * 0.42, p.petalShade, p.petal, 0.1 + Math.PI / 16);
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, size * 0.5);
    g.addColorStop(0, p.center);
    g.addColorStop(1, p.centerDeep);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.48, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawPoppy(ctx, size, bloom, p) {
    ctx.save();
    ctx.scale(bloom, bloom);
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      ctx.save();
      ctx.rotate(a);
      ctx.fillStyle = i % 2 === 0 ? p.petal : p.petalShade;
      ctx.beginPath();
      ctx.ellipse(0, -size * 0.55, size * 0.62, size * 0.75, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.fillStyle = p.center;
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.28, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = p.centerDeep;
    ctx.lineWidth = 1.4;
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(a) * size * 0.28, Math.sin(a) * size * 0.28);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawTulip(ctx, size, bloom, p) {
    ctx.save();
    ctx.scale(bloom, bloom);
    const w = size * 0.9, h = size * 1.6;
    const grad = ctx.createLinearGradient(0, -h, 0, 0.1 * h);
    grad.addColorStop(0, p.a);
    grad.addColorStop(1, p.c);
    ctx.fillStyle = grad;

    ctx.beginPath();
    ctx.moveTo(0, 0.1 * h);
    ctx.bezierCurveTo(-w, -0.1 * h, -w * 0.9, -h * 0.75, -w * 0.32, -h);
    ctx.bezierCurveTo(-w * 0.15, -h * 0.8, 0, -h * 0.72, 0, -h * 0.55);
    ctx.bezierCurveTo(0, -h * 0.72, w * 0.15, -h * 0.8, w * 0.32, -h);
    ctx.bezierCurveTo(w * 0.9, -h * 0.75, w, -0.1 * h, 0, 0.1 * h);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = p.b;
    ctx.globalAlpha = 0.55;
    ctx.beginPath();
    ctx.moveTo(0, 0.05 * h);
    ctx.bezierCurveTo(-w * 0.4, -0.1 * h, -w * 0.35, -h * 0.7, 0, -h * 0.9);
    ctx.bezierCurveTo(w * 0.35, -h * 0.7, w * 0.4, -0.1 * h, 0, 0.05 * h);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  function drawPeony(ctx, size, bloom, p) {
    ctx.save();
    ctx.scale(bloom, bloom);
    const layers = [
      { n: 10, len: size * 1.5, w: size * 0.75, col: p.outer, rot: 0 },
      { n: 9, len: size * 1.15, w: size * 0.62, col: p.mid, rot: 0.34 },
      { n: 7, len: size * 0.78, w: size * 0.5, col: p.inner, rot: 0.6 }
    ];
    for (const L of layers) {
      for (let i = 0; i < L.n; i++) {
        const a = (i / L.n) * Math.PI * 2 + L.rot;
        ctx.save();
        ctx.rotate(a);
        ctx.fillStyle = L.col;
        ctx.beginPath();
        ctx.ellipse(0, -L.len / 2, L.w / 2, L.len / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }
    ctx.restore();
  }

  function drawSakura(ctx, size, bloom, p) {
    ctx.save();
    ctx.scale(bloom, bloom);
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      ctx.save();
      ctx.rotate(a);
      ctx.fillStyle = i % 2 === 0 ? p.petal : p.petalShade;
      ctx.beginPath();
      ctx.moveTo(0, -size * 0.15);
      ctx.quadraticCurveTo(size * 0.55, -size * 0.5, 0, -size * 1.05);
      ctx.quadraticCurveTo(-size * 0.55, -size * 0.5, 0, -size * 0.15);
      ctx.fill();
      ctx.restore();
    }
    ctx.fillStyle = p.center;
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.16, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  const RENDERERS = {
    daisy: drawDaisy,
    sunflower: drawSunflower,
    poppy: drawPoppy,
    tulip: drawTulip,
    peony: drawPeony,
    sakura: drawSakura
  };

  /* ---------- main flower draw ---------- */

  function drawFlower(f, t) {
    const age = t - f.born;
    const growth = Math.min(1, age / 900);
    const stemGrowth = ease(Math.min(1, growth / 0.5));
    const bloomRaw = Math.max(0, Math.min(1, (growth - 0.4) / 0.6));
    const bloom = ease(bloomRaw);

    const sway = Math.sin(t * 0.001 * f.swaySpeed + f.swaySeed) * 0.06 * bloom;
    const tipX = f.x + Math.sin(f.lean) * f.stemLen * 0.3;
    const tipY = f.y - f.stemLen;

    drawStem(gardenCtx, f.x, f.y, tipX, tipY, stemGrowth, '#4a7c59');

    if (bloom <= 0.001) return;

    gardenCtx.save();
    gardenCtx.translate(tipX, tipY);
    gardenCtx.rotate(f.rot + sway);
    RENDERERS[f.type](gardenCtx, f.size, bloom, f.palette);
    gardenCtx.restore();
  }

  function drawGarden(t) {
    gardenCtx.clearRect(0, 0, W, H);
    for (const f of flowers) drawFlower(f, t);
  }

  /* ---------- pointer trail ---------- */

  let lastPoint = null;
  const MIN_DIST = 42;

  function handlePoint(x, y) {
    if (!hint.classList.contains('faded')) hint.classList.add('faded');

    if (!lastPoint) {
      spawnFlower(x, y);
      lastPoint = { x, y };
      return;
    }
    const dx = x - lastPoint.x, dy = y - lastPoint.y;
    const dist = Math.hypot(dx, dy);
    if (dist >= MIN_DIST) {
      const steps = Math.min(4, Math.floor(dist / MIN_DIST));
      for (let i = 1; i <= steps; i++) {
        const px = lastPoint.x + (dx * i) / steps;
        const py = lastPoint.y + (dy * i) / steps;
        spawnFlower(px, py);
      }
      lastPoint = { x, y };
    }
  }

  function pointerPos(e) {
    if (e.touches && e.touches.length) {
      return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    return { x: e.clientX, y: e.clientY };
  }

  let drawing = false;

  function onDown(e) {
    drawing = true;
    lastPoint = null;
    const p = pointerPos(e);
    handlePoint(p.x, p.y);
  }
  function onMove(e) {
    if (!drawing) return;
    const p = pointerPos(e);
    handlePoint(p.x, p.y);
  }
  function onUp() {
    drawing = false;
    lastPoint = null;
  }

  gardenCanvas.addEventListener('mousedown', onDown);
  gardenCanvas.addEventListener('mousemove', onMove);
  window.addEventListener('mouseup', onUp);

  gardenCanvas.addEventListener('touchstart', (e) => { e.preventDefault(); onDown(e); }, { passive: false });
  gardenCanvas.addEventListener('touchmove', (e) => { e.preventDefault(); onMove(e); }, { passive: false });
  gardenCanvas.addEventListener('touchend', (e) => { e.preventDefault(); onUp(); }, { passive: false });

  clearBtn.addEventListener('click', () => {
    flowers = [];
    hint.classList.remove('faded');
  });

  /* ---------- loop ---------- */

  function frame(t) {
    drawSky(t);
    drawGarden(t);
    requestAnimationFrame(frame);
  }

  window.addEventListener('resize', resize);
  resize();
  requestAnimationFrame(frame);
})();
