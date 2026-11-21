// ===== image helpers =====
window.IMG = {
  load(src) { return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; }); },
  async fromB64(b64) {
    const i = await IMG.load('data:image/png;base64,' + b64);
    const c = document.createElement('canvas'); c.width = i.width; c.height = i.height;
    const x = c.getContext('2d'); x.drawImage(i, 0, 0);
    return x.getImageData(0, 0, i.width, i.height);
  },
  toCanvas(img) { const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; c.getContext('2d').putImageData(img, 0, 0); return c; },
  toB64(img) { return IMG.toCanvas(img).toDataURL('image/png').split(',')[1]; },
  clone(img) { return new ImageData(new Uint8ClampedArray(img.data), img.width, img.height); },
  blank(w, h) { return new ImageData(w, h); },
  resize(srcCanvasOrImg, w, h) {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const x = c.getContext('2d'); x.imageSmoothingEnabled = false; x.drawImage(srcCanvasOrImg, 0, 0, w, h);
    return x.getImageData(0, 0, w, h);
  },
  hex2rgb(h) { h = h.replace('#', ''); if (h.length === 3) h = h.split('').map((c) => c + c).join(''); const n = parseInt(h, 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; },
  rgb2hex(r, g, b) { return '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join(''); },
  rgb2hsl(r, g, b) {
    r /= 255; g /= 255; b /= 255; const mx = Math.max(r, g, b), mn = Math.min(r, g, b); let h = 0, s = 0; const l = (mx + mn) / 2;
    if (mx !== mn) { const d = mx - mn; s = l > .5 ? d / (2 - mx - mn) : d / (mx + mn);
      h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h /= 6; }
    return [h, s, l];
  },
  hsl2rgb(h, s, l) {
    if (s === 0) { const v = Math.round(l * 255); return [v, v, v]; }
    const q = l < .5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
    const f = (t) => { if (t < 0) t += 1; if (t > 1) t -= 1; if (t < 1 / 6) return p + (q - p) * 6 * t; if (t < 1 / 2) return q; if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6; return p; };
    return [f(h + 1 / 3), f(h), f(h - 1 / 3)].map((v) => Math.round(v * 255));
  },
  // hue shift (deg), saturation (-100..100), brightness (-100..100), contrast
  adjust(src, hue, sat, bri, con = 0) {
    const out = IMG.clone(src), d = out.data;
    const cf = (259 * (con + 255)) / (255 * (259 - con));
    for (let i = 0; i < d.length; i += 4) {
      if (!d[i + 3]) continue;
      let [h, s, l] = IMG.rgb2hsl(d[i], d[i + 1], d[i + 2]);
      h = (h + hue / 360 + 1) % 1;
      s = Math.max(0, Math.min(1, sat >= 0 ? s + (1 - s) * sat / 100 * (s > 0.02 ? 1 : 0) : s * (1 + sat / 100)));
      l = Math.max(0, Math.min(1, bri >= 0 ? l + (1 - l) * bri / 100 : l * (1 + bri / 100)));
      let [r, g, b] = IMG.hsl2rgb(h, s, l);
      if (con) { r = cf * (r - 128) + 128; g = cf * (g - 128) + 128; b = cf * (b - 128) + 128; }
      d[i] = r; d[i + 1] = g; d[i + 2] = b;
    }
    return out;
  },
  // recolor to a target colour keeping shading. strength 0..1, keepGray: don't touch greys
  tint(src, hex, strength = 1, keepGray = true) {
    const out = IMG.clone(src), d = out.data; const [th, ts] = IMG.rgb2hsl(...IMG.hex2rgb(hex));
    for (let i = 0; i < d.length; i += 4) {
      if (!d[i + 3]) continue;
      const [h, s, l] = IMG.rgb2hsl(d[i], d[i + 1], d[i + 2]);
      if (keepGray && s < 0.12) continue;
      const [r, g, b] = IMG.hsl2rgb(th, Math.min(1, ts * 0.85 + s * 0.15), l);
      d[i] = d[i] + (r - d[i]) * strength; d[i + 1] = d[i + 1] + (g - d[i + 1]) * strength; d[i + 2] = d[i + 2] + (b - d[i + 2]) * strength;
    }
    return out;
  },
  palette(img, max = 24) {
    const m = new Map(), d = img.data;
    for (let i = 0; i < d.length; i += 4) { if (d[i + 3] < 20) continue; const k = IMG.rgb2hex(d[i], d[i + 1], d[i + 2]); m.set(k, (m.get(k) || 0) + 1); }
    return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, max).map((e) => e[0]);
  },
};

const DEFAULT_SWATCHES = ['#000000', '#3b3b3b', '#7a7a7a', '#bdbdbd', '#ffffff', '#5a3a1e', '#8b5a2b', '#c69c6d',
  '#7f1d1d', '#dc2626', '#f87171', '#ea580c', '#f59e0b', '#fde047', '#65a30d', '#22c55e',
  '#86efac', '#0f766e', '#14b8a6', '#5eead4', '#1e3a8a', '#2563eb', '#60a5fa', '#38bdf8',
  '#4c1d95', '#7c3aed', '#a78bfa', '#c026d3', '#ec4899', '#f9a8d4', '#1aa7a0', '#33ebcb'];

// ===== pixel editor =====
window.openPixelEditor = function (opts) {
  const [dw, dh] = opts.size || [16, 16];
  let img = opts.image ? IMG.clone(opts.image) : IMG.blank(dw, dh);
  const st = { tool: 'pencil', color: [255, 255, 255, 255], hex: '#ffffff', alpha: 255, mirror: false, grid: true, zoom: 1, frame: 0, adjBase: null, dirty: false };
  const undo = [], redo = [];
  const guessFh = (im) => (im.height > im.width && im.height % im.width === 0 ? im.width : im.height);
  st.fhv = guessFh(img);
  let meta0 = {}; try { meta0 = (JSON.parse(opts.meta || '{}').animation) || {}; } catch {}
  st.ft = meta0.frametime || 2; st.interp = !!meta0.interpolate; st.play = false; st.pf = 0;
  const frames = () => Math.max(1, Math.round(img.height / st.fhv));
  const fh = () => st.fhv;

  const tb = (t, ic, tip) => `<button class="tool" data-tool="${t}" title="${tip}">${icon(ic, 20)}</button>`;
  const m = modal({
    cls: 'xl', title: opts.title || 'محرر البكسلات', sub: opts.subtitle,
    body: `<div class="pe">
      <div class="pe-tools">
        ${tb('pencil', 'pencil', 'قلم (B)')}${tb('eraser', 'eraser', 'ممحاة (E)')}${tb('fill', 'bucket', 'تعبئة (G)')}
        ${tb('picker', 'picker', 'قطارة (I)')}${tb('line', 'line', 'خط (L)')}${tb('rect', 'rect', 'مستطيل (U)')}
        <div class="pe-sep"></div>
        <button class="tool tog" data-tog="mirror" title="رسم متماثل (X)">${icon('mirror', 20)}</button>
        <button class="tool tog on" data-tog="grid" title="الشبكة">${icon('grid', 20)}</button>
        <div class="pe-sep"></div>
        <button class="tool" data-act="undo" title="تراجع (Ctrl+Z)">${icon('undo', 20)}</button>
        <button class="tool" data-act="redo" title="إعادة (Ctrl+Y)">${icon('redo', 20)}</button>
        <div class="pe-sep"></div>
        <button class="tool" data-act="flipH" title="قلب أفقي">${icon('flipH', 20)}</button>
        <button class="tool" data-act="flipV" title="قلب عمودي">${icon('flipV', 20)}</button>
        <button class="tool" data-act="rot" title="تدوير 90°">${icon('rotate', 20)}</button>
        <button class="tool" data-act="clear" title="مسح الكل">${icon('trash', 20)}</button>
        ${opts.original ? `<div class="pe-sep"></div><button class="tool" id="cmp" title="اضغط مطوّل عشان تشوف الأصلي">${icon('reset', 20)}</button>` : ''}
      </div>
      <div class="pe-canvas"><canvas></canvas>
        <div class="pe-hud"><span class="pos ltr">–</span><span>·</span><span class="dims ltr"></span>
          <button class="btn sm ghost icon" data-act="zout">−</button><span class="zl ltr"></span><button class="btn sm ghost icon" data-act="zin">+</button></div>
      </div>
      <div class="pe-side">
        <div class="extra-box" style="display:none"><h4>${opts.extraTitle || ''}</h4><div class="extra"></div></div>
        <div><h4>اللون</h4>
          <div class="cur-color"><div class="big"><i></i></div>
            <div class="row" style="gap:8px;flex:1"><input type="color" class="cpick" value="#ffffff"><input class="inp mono hexin" value="#ffffff" style="height:40px"></div></div>
          <div class="slider-row" style="margin-top:12px"><span>الشفافية</span><input type="range" min="0" max="255" value="255" class="alpha"><output class="ltr">100%</output></div>
          <div class="swatches def"></div>
          <h4 style="margin-top:14px">ألوان التكستر</h4><div class="swatches imgpal"></div>
        </div>
        <div><h4>تعديل الألوان (للتكستر كامل)</h4>
          <div class="slider-row"><span>درجة اللون</span><input type="range" min="-180" max="180" value="0" data-adj="h"><output class="ltr">0</output></div>
          <div class="slider-row"><span>التشبع</span><input type="range" min="-100" max="100" value="0" data-adj="s"><output class="ltr">0</output></div>
          <div class="slider-row"><span>السطوع</span><input type="range" min="-100" max="100" value="0" data-adj="b"><output class="ltr">0</output></div>
          <div class="slider-row"><span>التباين</span><input type="range" min="-100" max="100" value="0" data-adj="c"><output class="ltr">0</output></div>
          <div class="row"><input type="color" class="tintc" value="#ef4444" title="لون الصبغ"><button class="btn sm" data-act="tint">${icon('wand', 16)} صبغ باللون</button><button class="btn sm ghost" data-act="adjreset">تصفير</button></div>
        </div>
        <div class="frames-box"><h4>الأنيميشن (الإطارات)</h4><div class="frames"></div>
          <div class="row" style="margin-top:8px;gap:6px"><button class="btn sm" data-act="addfr" title="إطار جديد (نسخة من الحالي)">${icon('plus', 14)} إطار</button><button class="btn sm ghost" data-act="delfr" title="احذف الإطار الحالي">${icon('trash', 14)}</button><button class="btn sm" data-act="playfr">${icon('play', 14)} شغّل</button></div>
          <div class="fr-opts" style="margin-top:8px"><div class="slider-row" style="grid-template-columns:70px 1fr 40px;margin:0"><span>السرعة</span><input type="range" class="ftr" min="1" max="20" value="${st.ft}"><output class="ltr"></output></div>
          <label class="check small" style="margin-top:6px"><span class="switch"><input type="checkbox" class="ipl" ${st.interp ? 'checked' : ''}><span></span></span>انتقال ناعم بين الإطارات</label></div></div>
        <div><h4>معاينة</h4><div class="mini-prev"><canvas class="p1"></canvas><canvas class="p2"></canvas></div></div>
        <div><h4>استيراد تصميمك</h4>
          <div class="stack" style="gap:8px">
            <button class="btn sm" data-act="import">${icon('image', 16)} استيراد صورة (نفس المقاس)</button>
            <button class="btn sm" data-act="importhd">${icon('image', 16)} استيراد HD (بدقة الصورة)</button>
            <button class="btn sm ghost" data-act="exportpng">${icon('download', 16)} حفظ كـ PNG</button>
            <button class="btn sm" data-act="view3d">${icon('cube', 16)} معاينة 3D</button>
          </div></div>
      </div></div>`,
    foot: `<button class="btn primary" data-act="save">${icon('check', 16)} حفظ التكستر</button>
      ${opts.onReset ? `<button class="btn danger" data-act="reset">${icon('reset', 16)} إرجاع للأصلي</button>` : ''}
      <span class="spacer"></span><button class="btn ghost" data-act="close">إلغاء</button>`,
    onClose: () => { document.removeEventListener('keydown', onKey); },
    beforeClose: () => !st.dirty || confirmBox('تعديلات ما انحفظت', 'رسمت أشياء ما انحفظت، تطلع بدون حفظ؟', 'اطلع بدون حفظ', true),
  });
  const $ = (s) => m.el.querySelector(s), $$ = (s) => [...m.el.querySelectorAll(s)];
  const cv = $('.pe-canvas canvas'), cx = cv.getContext('2d'), wrap = $('.pe-canvas');

  function fit() {
    const r = wrap.getBoundingClientRect();
    st.zoom = Math.max(1, Math.floor(Math.min((r.width - 60) / img.width, (r.height - 70) / fh())));
    render();
  }
  let showOrig = false;
  function render() {
    const w = img.width, h = fh(), z = st.zoom;
    if (showOrig && opts.original) { const o = opts.original; cv.width = w * z; cv.height = h * z; cx.imageSmoothingEnabled = false; cx.clearRect(0, 0, cv.width, cv.height); cx.drawImage(IMG.toCanvas(o), 0, 0, o.width, Math.min(o.height, o.width * (h / w)), 0, 0, w * z, h * z); return; }
    cv.width = w * z; cv.height = h * z;
    cx.imageSmoothingEnabled = false;
    const full = IMG.toCanvas(img);
    cx.clearRect(0, 0, cv.width, cv.height);
    cx.drawImage(full, 0, st.frame * h, w, h, 0, 0, w * z, h * z);
    if (st.grid && z >= 6) {
      cx.strokeStyle = 'rgba(255,255,255,.07)'; cx.lineWidth = 1; cx.beginPath();
      for (let x = 1; x < w; x++) { cx.moveTo(x * z + .5, 0); cx.lineTo(x * z + .5, h * z); }
      for (let y = 1; y < h; y++) { cx.moveTo(0, y * z + .5); cx.lineTo(w * z, y * z + .5); }
      cx.stroke();
      if (w >= 16 && w % 8 === 0) { cx.strokeStyle = 'rgba(255,255,255,.14)'; cx.beginPath();
        for (let x = 8; x < w; x += 8) { cx.moveTo(x * z + .5, 0); cx.lineTo(x * z + .5, h * z); }
        for (let y = 8; y < h; y += 8) { cx.moveTo(0, y * z + .5); cx.lineTo(w * z, y * z + .5); } cx.stroke(); }
    }
    if (st.mirror) { cx.strokeStyle = 'rgba(192,132,252,.6)'; cx.setLineDash([4, 4]); cx.beginPath(); cx.moveTo(w * z / 2, 0); cx.lineTo(w * z / 2, h * z); cx.stroke(); cx.setLineDash([]); }
    if (preview) drawPreviewShape();
    $('.zl').textContent = z * 100 + '%'; $('.dims').textContent = `${img.width}×${img.height}`;
    // minis
    const p1 = $('.p1'), p2 = $('.p2');
    const s1 = Math.max(1, Math.round(48 / Math.max(w, h))), s2 = Math.max(1, Math.round(96 / Math.max(w, h)));
    const mf = st.play ? st.pf % frames() : st.frame;
    [[p1, s1], [p2, s2]].forEach(([c, s]) => { c.width = w * s; c.height = h * s; const x = c.getContext('2d'); x.imageSmoothingEnabled = false; x.drawImage(full, 0, mf * h, w, h, 0, 0, w * s, h * s); });
    // frames
    const n = frames();
    $('.fr-opts').style.display = n > 1 ? '' : 'none'; $('[data-act=delfr]').disabled = n < 2; $('[data-act=playfr]').disabled = n < 2;
    $('.ftr').nextElementSibling.textContent = (st.ft / 20).toFixed(2) + 's';
    if (n > 1 && $('.frames').children.length !== n) $('.frames').innerHTML = Array.from({ length: n }, (_, i) => `<button data-fr="${i}">${i + 1}</button>`).join('');
    $$('.frames button').forEach((b) => b.classList.toggle('on', +b.dataset.fr === st.frame));
    renderPal();
    if (opts.renderExtra) { $('.extra-box').style.display = ''; opts.renderExtra($('.extra'), full); }
  }
  let palKey = '';
  function renderPal() {
    const p = IMG.palette(img, 24); const k = p.join();
    if (k === palKey) return; palKey = k;
    $('.imgpal').innerHTML = p.map((c) => `<div class="sw" style="background:${c}" data-c="${c}"></div>`).join('') || '<span class="dim small">فاضي</span>';
  }
  $('.def').innerHTML = DEFAULT_SWATCHES.map((c) => `<div class="sw" style="background:${c}" data-c="${c}"></div>`).join('');

  function setColor(hex, a) {
    st.hex = hex; if (a !== undefined) st.alpha = a;
    const [r, g, b] = IMG.hex2rgb(hex); st.color = [r, g, b, st.alpha];
    $('.cpick').value = hex; $('.hexin').value = hex; $('.alpha').value = st.alpha;
    $('.alpha').nextElementSibling.textContent = Math.round(st.alpha / 2.55) + '%';
    $('.cur-color .big i').style.background = `rgba(${r},${g},${b},${st.alpha / 255})`;
  }
  setColor('#ffffff', 255);

  function push() { undo.push(IMG.clone(img)); if (undo.length > 80) undo.shift(); redo.length = 0; st.dirty = true; }
  const oy = () => st.frame * fh();
  function setPx(x, y, c) {
    if (x < 0 || y < 0 || x >= img.width || y >= fh()) return;
    const i = ((y + oy()) * img.width + x) * 4; const d = img.data;
    if (c[3] === 255 || c[3] === 0) { d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; d[i + 3] = c[3]; }
    else { const a = c[3] / 255, ba = d[i + 3] / 255, oa = a + ba * (1 - a);
      for (let k = 0; k < 3; k++) d[i + k] = (c[k] * a + d[i + k] * ba * (1 - a)) / (oa || 1); d[i + 3] = oa * 255; }
  }
  function plot(x, y) {
    const c = st.tool === 'eraser' ? [0, 0, 0, 0] : st.color;
    setPx(x, y, c); if (st.mirror) setPx(img.width - 1 - x, y, c);
  }
  function getPx(x, y) { const i = ((y + oy()) * img.width + x) * 4; return [...img.data.slice(i, i + 4)]; }
  function lineCells(x0, y0, x1, y1) {
    const pts = []; const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1; let e = dx + dy;
    for (;;) { pts.push([x0, y0]); if (x0 === x1 && y0 === y1) break; const e2 = 2 * e; if (e2 >= dy) { e += dy; x0 += sx; } if (e2 <= dx) { e += dx; y0 += sy; } }
    return pts;
  }
  function rectCells(x0, y0, x1, y1) {
    const pts = []; const [a, b] = [Math.min(x0, x1), Math.max(x0, x1)], [c, d] = [Math.min(y0, y1), Math.max(y0, y1)];
    for (let x = a; x <= b; x++) { pts.push([x, c], [x, d]); } for (let y = c; y <= d; y++) { pts.push([a, y], [b, y]); }
    return pts;
  }
  function fill(x, y) {
    const t = getPx(x, y), c = st.color; if (t.every((v, i) => v === c[i])) return;
    const W = img.width, H = fh(), seen = new Uint8Array(W * H), q = [[x, y]];
    const same = (p) => p.every((v, i) => Math.abs(v - t[i]) < 2);
    while (q.length) { const [a, b] = q.pop(); if (a < 0 || b < 0 || a >= W || b >= H || seen[b * W + a]) continue; seen[b * W + a] = 1;
      if (!same(getPx(a, b))) continue; setPx(a, b, c); q.push([a + 1, b], [a - 1, b], [a, b + 1], [a, b - 1]); }
  }
  let down = false, last = null, start = null, preview = null;
  function cell(e) { const r = cv.getBoundingClientRect(); return [Math.floor((e.clientX - r.left) / st.zoom), Math.floor((e.clientY - r.top) / st.zoom)]; }
  function drawPreviewShape() {
    const pts = preview.type === 'line' ? lineCells(...preview.a, ...preview.b) : rectCells(...preview.a, ...preview.b);
    const [r, g, b] = st.color; cx.fillStyle = `rgba(${r},${g},${b},.75)`;
    pts.forEach(([x, y]) => { cx.fillRect(x * st.zoom, y * st.zoom, st.zoom, st.zoom); if (st.mirror) cx.fillRect((img.width - 1 - x) * st.zoom, y * st.zoom, st.zoom, st.zoom); });
  }
  cv.addEventListener('contextmenu', (e) => e.preventDefault());
  cv.addEventListener('pointerdown', (e) => {
    cv.setPointerCapture(e.pointerId);
    const [x, y] = cell(e); const tool = e.button === 2 ? 'eraser' : st.tool; const saved = st.tool; st.tool = tool;
    if (tool === 'picker') { const p = getPx(x, y); if (p[3]) setColor(IMG.rgb2hex(p[0], p[1], p[2]), p[3]); st.tool = 'pencil'; selTool('pencil'); return; }
    push();
    if (tool === 'fill') { fill(x, y); st.tool = saved; render(); return; }
    if (tool === 'line' || tool === 'rect') { start = [x, y]; preview = { type: tool, a: [x, y], b: [x, y] }; down = true; render(); return; }
    down = true; last = [x, y]; plot(x, y); render();
    st._restore = saved;
  });
  cv.addEventListener('pointermove', (e) => {
    const [x, y] = cell(e);
    $('.pos').textContent = x >= 0 && y >= 0 && x < img.width && y < fh() ? `${x}, ${y}` : '–';
    if (!down) return;
    if (preview) { preview.b = [x, y]; render(); return; }
    lineCells(...last, x, y).forEach(([a, b]) => plot(a, b)); last = [x, y]; render();
  });
  cv.addEventListener('pointerup', () => {
    if (preview) { const pts = preview.type === 'line' ? lineCells(...preview.a, ...preview.b) : rectCells(...preview.a, ...preview.b); pts.forEach(([a, b]) => plot(a, b)); preview = null; }
    if (st._restore) { st.tool = st._restore; st._restore = null; }
    down = false; render();
  });
  wrap.addEventListener('wheel', (e) => { e.preventDefault(); st.zoom = Math.max(1, Math.min(64, st.zoom + (e.deltaY < 0 ? 1 : -1) * Math.max(1, Math.round(st.zoom / 6)))); render(); }, { passive: false });

  function selTool(t) { st.tool = t; $$('[data-tool]').forEach((b) => b.classList.toggle('on', b.dataset.tool === t)); }
  selTool('pencil');
  $$('[data-tool]').forEach((b) => b.onclick = () => selTool(b.dataset.tool));
  $$('[data-tog]').forEach((b) => b.onclick = () => { st[b.dataset.tog] = !st[b.dataset.tog]; b.classList.toggle('on', st[b.dataset.tog]); render(); });
  m.el.addEventListener('click', (e) => { const s = e.target.closest('.sw'); if (s) setColor(s.dataset.c, 255); const f = e.target.closest('[data-fr]'); if (f) { st.frame = +f.dataset.fr; render(); } });
  $('.cpick').oninput = (e) => setColor(e.target.value);
  $('.hexin').onchange = (e) => { const v = e.target.value.trim(); if (/^#?[0-9a-f]{6}$/i.test(v)) setColor(v[0] === '#' ? v : '#' + v); };
  $('.alpha').oninput = (e) => setColor(st.hex, +e.target.value);
  $('.ftr').oninput = (e) => { st.ft = +e.target.value; st.dirty = true; if (st.play) { st.play = false; acts.playfr(); } render(); };
  $('.ipl').onchange = (e) => { st.interp = e.target.checked; st.dirty = true; };

  const adj = { h: 0, s: 0, b: 0, c: 0 };
  $$('[data-adj]').forEach((r) => r.oninput = () => {
    if (!st.adjBase) { push(); st.adjBase = IMG.clone(img); }
    adj[r.dataset.adj] = +r.value; r.nextElementSibling.textContent = r.value;
    img = IMG.adjust(st.adjBase, adj.h, adj.s, adj.b, adj.c); render();
  });
  function adjCommit() { st.adjBase = null; Object.keys(adj).forEach((k) => adj[k] = 0); $$('[data-adj]').forEach((r) => { r.value = 0; r.nextElementSibling.textContent = '0'; }); }

  async function importImg(hd) {
    const f = await api.fs.pickFiles('اختر صورة', ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp']);
    if (!f) return;
    const b64 = await api.fs.readB64(f[0]); const ext = f[0].split('.').pop().toLowerCase();
    const im = await IMG.load(`data:image/${ext === 'jpg' ? 'jpeg' : ext};base64,` + b64);
    push(); adjCommit();
    if (hd) {
      // keep the image's own resolution (HD packs), matching the texture aspect ratio
      const n = frames(); const ratio = img.width / fh();
      let w = im.width, h = Math.round(w / ratio);
      if (n > 1 && im.height >= im.width * n) { img = IMG.resize(im, im.width, im.width * n); }
      else img = IMG.resize(im, w, n > 1 ? w * n : h);
      if (n > 1 && im.height < im.width * n) { const one = IMG.resize(im, w, w); const all = new ImageData(w, w * n); for (let i = 0; i < n; i++) all.data.set(one.data, i * one.data.length); img = all; }
      st.frame = 0; st.fhv = n > 1 ? img.width : img.height; $('.frames').innerHTML = '';
    } else {
      const w = img.width, h = fh();
      if (im.width === img.width && im.height === img.height) img = IMG.resize(im, img.width, img.height);
      else { const fr = IMG.resize(im, w, h); img.data.set(fr.data, oy() * w * 4); }
    }
    fit(); toast('تم استيراد الصورة');
  }

  const acts = {
    undo() { if (!undo.length) return; redo.push(IMG.clone(img)); img = undo.pop(); if (img.width !== st.fhv && img.height % st.fhv) st.fhv = guessFh(img); adjCommit(); st.frame = Math.min(st.frame, frames() - 1); $('.frames').innerHTML = ''; fit(); },
    redo() { if (!redo.length) return; undo.push(IMG.clone(img)); img = redo.pop(); if (img.height % st.fhv) st.fhv = guessFh(img); st.frame = Math.min(st.frame, frames() - 1); $('.frames').innerHTML = ''; fit(); },
    flipH() { push(); const w = img.width, h = fh(), o = IMG.clone(img); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const s = ((y + oy()) * w + x) * 4, d = ((y + oy()) * w + (w - 1 - x)) * 4; for (let k = 0; k < 4; k++) img.data[d + k] = o.data[s + k]; } render(); },
    flipV() { push(); const w = img.width, h = fh(), o = IMG.clone(img); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const s = ((y + oy()) * w + x) * 4, d = ((h - 1 - y + oy()) * w + x) * 4; for (let k = 0; k < 4; k++) img.data[d + k] = o.data[s + k]; } render(); },
    rot() { const w = img.width, h = fh(); if (w !== h) return toast('التدوير متاح للتكسترات المربعة فقط', 'err'); push(); const o = IMG.clone(img); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const s = ((y + oy()) * w + x) * 4, d = ((x + oy()) * w + (w - 1 - y)) * 4; for (let k = 0; k < 4; k++) img.data[d + k] = o.data[s + k]; } render(); },
    addfr() {
      push(); const w = img.width, h = fh(), n = frames(), at = st.frame + 1;
      const out = new ImageData(w, h * (n + 1)); const src = img.data, dst = out.data, fb = w * h * 4;
      dst.set(src.subarray(0, at * fb), 0); dst.set(src.subarray(st.frame * fb, (st.frame + 1) * fb), at * fb); dst.set(src.subarray(at * fb), (at + 1) * fb);
      img = out; st.frame = at; $('.frames').innerHTML = ''; fit();
    },
    delfr() {
      const n = frames(); if (n < 2) return; push(); const w = img.width, h = fh(), fb = w * h * 4;
      const out = new ImageData(w, h * (n - 1)); out.data.set(img.data.subarray(0, st.frame * fb), 0); out.data.set(img.data.subarray((st.frame + 1) * fb), st.frame * fb);
      img = out; st.frame = Math.min(st.frame, n - 2); $('.frames').innerHTML = ''; fit();
    },
    playfr() {
      st.play = !st.play; const b = m.el.querySelector('[data-act=playfr]'); b.innerHTML = st.play ? `${icon('pause', 14)} وقّف` : `${icon('play', 14)} شغّل`;
      clearInterval(st.timer); if (st.play) st.timer = setInterval(() => { if (!document.body.contains(m.el)) return clearInterval(st.timer); st.pf++; render(); }, st.ft * 50);
    },
    view3d() { if (window.open3D) open3D(img, { slim: opts.slim, skin: img.width === 64 && (img.height === 64 || img.height === 32) && opts.skin !== false, title: opts.title }); },
    clear() { push(); const w = img.width; img.data.fill(0, oy() * w * 4, (oy() + fh()) * w * 4); render(); },
    zin() { st.zoom = Math.min(64, st.zoom + 1); render(); }, zout() { st.zoom = Math.max(1, st.zoom - 1); render(); },
    tint() { push(); adjCommit(); img = IMG.tint(img, $('.tintc').value, 1, true); render(); },
    adjreset() { if (st.adjBase) { img = st.adjBase; } adjCommit(); render(); },
    import() { importImg(false); }, importhd() { importImg(true); },
    async exportpng() { const p = await api.fs.saveB64((opts.fileName || 'texture') + '.png', IMG.toB64(img)); if (p) toast('انحفظت الصورة'); },
    async save() {
      adjCommit(); clearInterval(st.timer);
      const meta = frames() > 1 ? JSON.stringify({ animation: Object.assign({ frametime: st.ft }, st.interp ? { interpolate: true } : {}, st.fhv !== img.width ? { width: img.width, height: st.fhv } : {}) }, null, 2) : '';
      await opts.onSave(img, meta); st.dirty = false; m.close(true);
    },
    async reset() { if (!(await confirmBox('رجوع للأصلي', 'ترجع التكستر للأصلي وتحذف تعديلاتك؟', 'رجّع', true))) return; await opts.onReset(); st.dirty = false; m.close(true); },
    close() { m.close(); },
  };
  m.el.addEventListener('click', (e) => { const a = e.target.closest('[data-act]'); if (a && acts[a.dataset.act]) acts[a.dataset.act](); });
  function onKey(e) {
    if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) || e.target.isContentEditable) return;
    if (!document.body.contains(m.el) || document.querySelectorAll('.modal-bg').length > 1 && document.querySelectorAll('.modal-bg')[document.querySelectorAll('.modal-bg').length - 1] !== m.el) return;
    const k = e.key.toLowerCase();
    if (e.ctrlKey && k === 'z') { e.preventDefault(); acts.undo(); return; }
    if (e.ctrlKey && (k === 'y' || (e.shiftKey && k === 'z'))) { e.preventDefault(); acts.redo(); return; }
    if (e.ctrlKey && k === 's') { e.preventDefault(); acts.save(); return; }
    const map = { b: 'pencil', e: 'eraser', g: 'fill', i: 'picker', l: 'line', u: 'rect' };
    if (map[k]) selTool(map[k]);
    if (k === 'x') m.el.querySelector('[data-tog=mirror]').click();
  }
  document.addEventListener('keydown', onKey);
  const cmpBtn = m.el.querySelector('#cmp');
  if (cmpBtn) { const on = () => { showOrig = true; render(); }, off = () => { showOrig = false; render(); }; cmpBtn.onpointerdown = on; cmpBtn.onpointerup = off; cmpBtn.onpointerleave = off; }
  requestAnimationFrame(fit);
  window.addEventListener('resize', fit, { once: true });
};

// ===== skin paper-doll =====
// draws a front or back view of a Minecraft skin (64x64 or legacy 64x32)
window.drawDoll = function (canvas, skin, { scale = 8, back = false, slim = false, overlay = true } = {}) {
  const legacy = skin.height === 32 * (skin.width / 64);
  const k = skin.width / 64; // HD skins
  canvas.width = 16 * scale; canvas.height = 32 * scale;
  const x = canvas.getContext('2d'); x.imageSmoothingEnabled = false; x.clearRect(0, 0, canvas.width, canvas.height);
  const aw = slim ? 3 : 4;
  const part = (sx, sy, w, h, dx, dy, mirror) => {
    x.save();
    if (mirror) { x.translate((dx + w) * scale, dy * scale); x.scale(-1, 1); x.drawImage(skin, sx * k, sy * k, w * k, h * k, 0, 0, w * scale, h * scale); }
    else x.drawImage(skin, sx * k, sy * k, w * k, h * k, dx * scale, dy * scale, w * scale, h * scale);
    x.restore();
  };
  const ovl = (sx, sy, w, h, dx, dy) => { if (overlay && !legacy) { const p = scale * 0.06; x.drawImage(skin, sx * k, sy * k, w * k, h * k, dx * scale - p * w, dy * scale - p * h, w * scale + 2 * p * w, h * scale + 2 * p * h); } };
  const L = 4 - aw; // arm x offset for slim
  if (!back) {
    part(8, 8, 8, 8, 4, 0); if (overlay) { const p = scale * 0.5; x.drawImage(skin, 40 * k, 8 * k, 8 * k, 8 * k, 4 * scale - p, -p + p, 8 * scale + 2 * p, 8 * scale); }
    part(20, 20, 8, 12, 4, 8); ovl(20, 36, 8, 12, 4, 8);
    part(44, 20, aw, 12, L, 8); ovl(44, 36, aw, 12, L, 8);
    if (legacy) part(44, 20, aw, 12, 12, 8, true); else { part(36, 52, aw, 12, 12, 8); ovl(52, 52, aw, 12, 12, 8); }
    part(4, 20, 4, 12, 4, 20); ovl(4, 36, 4, 12, 4, 20);
    if (legacy) part(4, 20, 4, 12, 8, 20, true); else { part(20, 52, 4, 12, 8, 20); ovl(4, 52, 4, 12, 8, 20); }
  } else {
    part(24, 8, 8, 8, 4, 0); if (overlay) x.drawImage(skin, 56 * k, 8 * k, 8 * k, 8 * k, 4 * scale - scale * 0.5, 0, 8 * scale + scale, 8 * scale);
    part(32, 20, 8, 12, 4, 8); ovl(32, 36, 8, 12, 4, 8);
    // from behind, the right arm is on the viewer's right
    part(44 + 8 + (slim ? -1 : 0), 20, aw, 12, 12, 8); ovl(52 + (slim ? -1 : 0), 36, aw, 12, 12, 8);
    if (legacy) part(52, 20, aw, 12, L, 8, true); else { part(44 + (slim ? -1 : 0), 52, aw, 12, L, 8); ovl(60 + (slim ? -1 : 0), 52, aw, 12, L, 8); }
    part(12, 20, 4, 12, 8, 20); ovl(12, 36, 4, 12, 8, 20);
    if (legacy) part(12, 20, 4, 12, 4, 20, true); else { part(28, 52, 4, 12, 4, 20); ovl(12, 52, 4, 12, 4, 20); }
  }
  return canvas;
};

// ===== easy skin painter: paint directly on the character =====
function skinViews(slim) {
  const aw = slim ? 3 : 4, L = 4 - aw;
  // [x, y, w, h, sx, sy] in doll units → skin pixels ; base then overlay
  return {
    front: { w: 16, base: [[4, 0, 8, 8, 8, 8, 'head'], [4, 8, 8, 12, 20, 20, 'body'], [L, 8, aw, 12, 44, 20, 'rarm'], [12, 8, aw, 12, 36, 52, 'larm'], [4, 20, 4, 12, 4, 20, 'rleg'], [8, 20, 4, 12, 20, 52, 'lleg']],
      over: [[4, 0, 8, 8, 40, 8], [4, 8, 8, 12, 20, 36], [L, 8, aw, 12, 44, 36], [12, 8, aw, 12, 52, 52], [4, 20, 4, 12, 4, 36], [8, 20, 4, 12, 4, 52]] },
    back: { w: 16, base: [[4, 0, 8, 8, 24, 8, 'head'], [4, 8, 8, 12, 32, 20, 'body'], [12, 8, aw, 12, 48 + aw, 20, 'rarm'], [L, 8, aw, 12, 40 + aw, 52, 'larm'], [8, 20, 4, 12, 12, 20, 'rleg'], [4, 20, 4, 12, 28, 52, 'lleg']],
      over: [[4, 0, 8, 8, 56, 8], [4, 8, 8, 12, 32, 36], [12, 8, aw, 12, 48 + aw, 36], [L, 8, aw, 12, 56 + aw, 52], [8, 20, 4, 12, 12, 36], [4, 20, 4, 12, 12, 52]] },
    right: { w: 8, base: [[0, 0, 8, 8, 0, 8, 'head'], [2, 20, 4, 12, 0, 20, 'rleg'], [2, 8, 4, 12, 40, 20, 'rarm']],
      over: [[0, 0, 8, 8, 32, 8], [2, 20, 4, 12, 0, 36], [2, 8, 4, 12, 40, 36]] },
    left: { w: 8, base: [[0, 0, 8, 8, 16, 8, 'head'], [2, 20, 4, 12, 24, 52, 'lleg'], [2, 8, 4, 12, 36 + aw, 52, 'larm']],
      over: [[0, 0, 8, 8, 48, 8], [2, 20, 4, 12, 8, 52], [2, 8, 4, 12, 52 + aw, 52]] },
  };
}
const SKIN_PARTS = { head: ['الراس', [0, 0, 32, 16], [32, 0, 32, 16]], body: ['الجسم', [16, 16, 24, 16], [16, 32, 24, 16]], rarm: ['اليد اليمين', [40, 16, 16, 16], [40, 32, 16, 16]], larm: ['اليد اليسار', [32, 48, 16, 16], [48, 48, 16, 16]], rleg: ['الرجل اليمين', [0, 16, 16, 16], [0, 32, 16, 16]], lleg: ['الرجل اليسار', [16, 48, 16, 16], [0, 48, 16, 16]] };
const SKIN_TONES = ['#f9d4b4', '#eebd94', '#d9a066', '#c68642', '#a0663a', '#8d5524', '#5c3a1e', '#3b2416'];
window.openSkinPainter = function (opts) {
  let img = opts.image ? IMG.clone(opts.image) : IMG.blank(64, 64);
  const st = { tool: 'pencil', hex: '#3b82f6', layer: 'base', showOver: true, mirror: false, slim: !!opts.slim, dirty: false, z: 14 };
  const undo = [], redo = [];
  const m = modal({
    cls: 'xl', title: opts.title || 'محرر السكن السهل', sub: 'ارسم على الشخصية مباشرة — من قدام، ورا، ومن الجنبين',
    body: `<div class="sp">
      <div class="sp-views"><div class="sp-v"><canvas data-v="front"></canvas><span>قدام</span></div><div class="sp-v"><canvas data-v="right"></canvas><span>يمين</span></div><div class="sp-v"><canvas data-v="back"></canvas><span>ورا</span></div><div class="sp-v"><canvas data-v="left"></canvas><span>يسار</span></div></div>
      <div class="sp-side">
        <div><h4>الأداة</h4><div class="seg" id="spt"><button data-t="pencil" class="on">${icon('pencil', 16)} قلم</button><button data-t="eraser">${icon('eraser', 16)} ممحاة</button><button data-t="fill">${icon('bucket', 16)} تعبئة</button><button data-t="picker">${icon('picker', 16)}</button></div></div>
        <div><h4>الطبقة</h4><div class="seg" id="spl"><button data-l="base" class="on">الجسم</button><button data-l="over">الطبقة الثانية (جاكيت/قبعة)</button></div>
          <div class="row" style="margin-top:10px"><label class="check small"><span class="switch"><input type="checkbox" id="spo" checked><span></span></span>اعرض الطبقة الثانية</label><label class="check small"><span class="switch"><input type="checkbox" id="spm"><span></span></span>رسم متماثل</label><label class="check small"><span class="switch"><input type="checkbox" id="sps" ${st.slim ? 'checked' : ''}><span></span></span>نحيف</label></div></div>
        <div><h4>اللون</h4><div class="row" style="flex-wrap:nowrap"><input type="color" id="spc" value="${st.hex}"><input class="inp mono" id="sph" value="${st.hex}" style="height:40px"></div>
          <div class="swatches" style="margin-top:10px" id="spsw"></div><div class="muted small" style="margin:10px 0 6px">ألوان البشرة</div><div class="swatches" id="spsk"></div></div>
        <div><h4>لوّن جزء كامل (يحافظ على الظل)</h4><div class="grid" style="grid-template-columns:1fr 1fr;gap:6px">${Object.entries(SKIN_PARTS).map(([k, [n]]) => `<button class="btn sm" data-part="${k}">${n}</button>`).join('')}</div></div>
        <div class="row"><button class="btn sm" data-a="undo">${icon('undo', 15)} تراجع</button><button class="btn sm" data-a="redo">${icon('redo', 15)} إعادة</button><button class="btn sm" data-a="v3d">${icon('cube', 15)} 3D</button><button class="btn sm ghost" data-a="adv">${icon('grid', 15)} المحرر المتقدم</button></div>
      </div></div>`,
    foot: `<button class="btn primary" data-a="save">${icon('check', 16)} حفظ السكن</button><span class="spacer"></span><button class="btn ghost" data-a="close">إلغاء</button>`,
    beforeClose: () => !st.dirty || confirmBox('تعديلات ما انحفظت', 'رسمت أشياء ما انحفظت، تطلع بدون حفظ؟', 'اطلع بدون حفظ', true),
  });
  const $ = (s) => m.el.querySelector(s), $$ = (s) => [...m.el.querySelectorAll(s)];
  const pal = DEFAULT_SWATCHES;
  $('#spsw').innerHTML = pal.map((c) => `<div class="sw" style="background:${c}" data-c="${c}"></div>`).join('');
  $('#spsk').innerHTML = SKIN_TONES.map((c) => `<div class="sw" style="background:${c}" data-c="${c}"></div>`).join('');
  const setColor = (h) => { st.hex = h; $('#spc').value = h; $('#sph').value = h; };
  m.el.addEventListener('click', (e) => { const s = e.target.closest('.sw'); if (s) setColor(s.dataset.c); });
  $('#spc').oninput = (e) => setColor(e.target.value);
  $('#sph').onchange = (e) => { const v = e.target.value.trim(); if (/^#?[0-9a-f]{6}$/i.test(v)) setColor(v[0] === '#' ? v : '#' + v); };
  $$('#spt button').forEach((b) => b.onclick = () => { st.tool = b.dataset.t; $$('#spt button').forEach((x) => x.classList.toggle('on', x === b)); });
  $$('#spl button').forEach((b) => b.onclick = () => { st.layer = b.dataset.l; $$('#spl button').forEach((x) => x.classList.toggle('on', x === b)); if (st.layer === 'over') { st.showOver = true; $('#spo').checked = true; } draw(); });
  $('#spo').onchange = (e) => { st.showOver = e.target.checked; draw(); };
  $('#spm').onchange = (e) => { st.mirror = e.target.checked; };
  $('#sps').onchange = (e) => { st.slim = e.target.checked; draw(); };
  const push = () => { undo.push(IMG.clone(img)); if (undo.length > 80) undo.shift(); redo.length = 0; st.dirty = true; };
  const px = (x, y) => { const i = (y * 64 + x) * 4; return [...img.data.slice(i, i + 4)]; };
  const setPx = (x, y, c) => { if (x < 0 || y < 0 || x >= 64 || y >= 64) return; img.data.set(c, (y * 64 + x) * 4); };
  function draw() {
    const V = skinViews(st.slim), full = IMG.toCanvas(img);
    $$('.sp-views canvas').forEach((cv) => {
      const v = V[cv.dataset.v], z = st.z; cv.width = v.w * z; cv.height = 32 * z;
      const x = cv.getContext('2d'); x.imageSmoothingEnabled = false; x.clearRect(0, 0, cv.width, cv.height);
      const layers = [[v.base, 1]]; if (st.showOver) layers.push([v.over, st.layer === 'base' ? 0.55 : 1]);
      for (const [rects, alpha] of layers) { x.globalAlpha = alpha; for (const [rx, ry, w, h, sx, sy] of rects) x.drawImage(full, sx, sy, w, h, rx * z, ry * z, w * z, h * z); }
      x.globalAlpha = 1;
      // outline of the editable parts
      x.strokeStyle = 'rgba(255,255,255,.12)'; x.lineWidth = 1;
      for (const [rx, ry, w, h] of (st.layer === 'over' ? v.over : v.base)) x.strokeRect(rx * z + .5, ry * z + .5, w * z - 1, h * z - 1);
    });
  }
  function hit(view, ux, uy) {
    const V = skinViews(st.slim)[view]; const rects = st.layer === 'over' ? V.over : V.base;
    for (let i = rects.length - 1; i >= 0; i--) { const [rx, ry, w, h, sx, sy] = rects[i]; if (ux >= rx && ux < rx + w && uy >= ry && uy < ry + h) return { sx: sx + (ux - rx), sy: sy + (uy - ry), rect: rects[i] }; }
    return null;
  }
  function paintAt(view, ux, uy) {
    const targets = [[ux, uy]];
    if (st.mirror) targets.push([skinViews(st.slim)[view].w - 1 - ux, uy]);
    for (const [a, b] of targets) {
      const h = hit(view, a, b); if (!h) continue;
      if (st.tool === 'picker') { const c = px(h.sx, h.sy); if (c[3]) setColor(IMG.rgb2hex(c[0], c[1], c[2])); return 'picked'; }
      if (st.tool === 'fill') { fillRect(h); continue; }
      setPx(h.sx, h.sy, st.tool === 'eraser' ? [0, 0, 0, 0] : [...IMG.hex2rgb(st.hex), 255]);
    }
  }
  function fillRect(h) {
    const [, , w, hh, sx, sy] = h.rect; const t = px(h.sx, h.sy); const c = [...IMG.hex2rgb(st.hex), 255];
    if (t.every((v, i) => v === c[i])) return;
    const q = [[h.sx, h.sy]], seen = new Set();
    while (q.length) { const [x, y] = q.pop(); const k = y * 64 + x; if (seen.has(k) || x < sx || y < sy || x >= sx + w || y >= sy + hh) continue; seen.add(k); const p = px(x, y); if (!p.every((v, i) => Math.abs(v - t[i]) < 3)) continue; setPx(x, y, c); q.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]); }
  }
  let down = false;
  $$('.sp-views canvas').forEach((cv) => {
    const at = (e) => { const r = cv.getBoundingClientRect(); return [Math.floor((e.clientX - r.left) / r.width * (cv.width / st.z)), Math.floor((e.clientY - r.top) / r.height * 32)]; };
    cv.onpointerdown = (e) => { cv.setPointerCapture(e.pointerId); if (st.tool !== 'picker') push(); const save = st.tool; if (e.button === 2) st.tool = 'eraser'; const r = paintAt(cv.dataset.v, ...at(e)); st.tool = save; if (r === 'picked') { st.tool = 'pencil'; $$('#spt button').forEach((x) => x.classList.toggle('on', x.dataset.t === 'pencil')); } down = st.tool === 'pencil' || st.tool === 'eraser'; draw(); };
    cv.onpointermove = (e) => { if (!down) return; paintAt(cv.dataset.v, ...at(e)); draw(); };
    cv.onpointerup = () => { down = false; };
    cv.oncontextmenu = (e) => e.preventDefault();
  });
  $$('[data-part]').forEach((b) => b.onclick = () => {
    push(); const [, base, over] = SKIN_PARTS[b.dataset.part]; const [x0, y0, w, h] = st.layer === 'over' ? over : base;
    const c = document.createElement('canvas'); c.width = w; c.height = h; c.getContext('2d').putImageData(img, -x0, -y0);
    let part = c.getContext('2d').getImageData(0, 0, w, h); part = IMG.tint(part, st.hex, 1, false);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = (y * w + x) * 4; if (part.data[i + 3]) img.data.set(part.data.slice(i, i + 4), ((y0 + y) * 64 + x0 + x) * 4); }
    draw();
  });
  const acts = {
    undo() { if (!undo.length) return; redo.push(IMG.clone(img)); img = undo.pop(); draw(); },
    redo() { if (!redo.length) return; undo.push(IMG.clone(img)); img = redo.pop(); draw(); },
    v3d() { open3D(img, { skin: true, slim: st.slim }); },
    adv() { openPixelEditor({ title: 'المحرر المتقدم (ملف السكن)', size: [64, 64], image: img, extraTitle: 'شكل الشخصية', renderExtra: (box, full) => { box.innerHTML = ''; box.append(drawDoll(document.createElement('canvas'), full, { scale: 4, slim: st.slim }), drawDoll(document.createElement('canvas'), full, { scale: 4, back: true, slim: st.slim })); }, onSave: (im) => { push(); img = im; draw(); } }); },
    async save() { st.dirty = false; await opts.onSave(img, st.slim); m.close(true); },
    close() { m.close(); },
  };
  m.el.addEventListener('click', (e) => { const a = e.target.closest('[data-a]'); if (a && acts[a.dataset.a]) acts[a.dataset.a](); });
  const fit = () => { const box = $('.sp-views'); if (!box) return; const hgt = box.clientHeight - 40; st.z = Math.max(6, Math.min(18, Math.floor(hgt / 32))); draw(); };
  requestAnimationFrame(fit); window.addEventListener('resize', fit);
};
