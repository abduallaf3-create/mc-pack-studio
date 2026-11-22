// Tiny canvas 3D renderer for Minecraft-style voxel previews (items + skins)
(function () {
  const px = (d, w, x, y) => { const i = (y * w + x) * 4; return [d[i], d[i + 1], d[i + 2], d[i + 3]]; };
  // ---- item: extrude every opaque pixel (like held items in game)
  function itemQuads(img) {
    const w = img.width, h = Math.min(img.height, img.width), d = img.data, t = 1, q = [];
    const op = (x, y) => x >= 0 && y >= 0 && x < w && y < h && d[(y * w + x) * 4 + 3] > 10;
    const s = 16 / w; // scale so any resolution fits a 16 unit box
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (!op(x, y)) continue;
      const c = px(d, w, x, y); const X = (x - w / 2) * s, Y = (h / 2 - y) * s, z = t * 0.5 * s * (w / 16);
      const x1 = X + s, y0 = Y - s;
      q.push({ p: [[X, Y, z], [x1, Y, z], [x1, y0, z], [X, y0, z]], c, n: [0, 0, 1] });
      q.push({ p: [[x1, Y, -z], [X, Y, -z], [X, y0, -z], [x1, y0, -z]], c, n: [0, 0, -1] });
      if (!op(x - 1, y)) q.push({ p: [[X, Y, -z], [X, Y, z], [X, y0, z], [X, y0, -z]], c, n: [-1, 0, 0] });
      if (!op(x + 1, y)) q.push({ p: [[x1, Y, z], [x1, Y, -z], [x1, y0, -z], [x1, y0, z]], c, n: [1, 0, 0] });
      if (!op(x, y - 1)) q.push({ p: [[X, Y, -z], [x1, Y, -z], [x1, Y, z], [X, Y, z]], c, n: [0, 1, 0] });
      if (!op(x, y + 1)) q.push({ p: [[X, y0, z], [x1, y0, z], [x1, y0, -z], [X, y0, -z]], c, n: [0, -1, 0] });
    }
    return q;
  }
  // ---- skin: Minecraft box UV layout, one quad per texel
  function boxQuads(img, k, u, v, w, h, dd, cx, cy, cz, inflate, out) {
    const W = img.width, d = img.data;
    const hw = w / 2 + inflate, hh = h / 2 + inflate, hd = dd / 2 + inflate;
    const sx = (2 * hw) / w, sy = (2 * hh) / h, sz = (2 * hd) / dd;
    const tex = (tu, tv) => px(d, W, Math.floor(tu * k), Math.floor(tv * k));
    const face = (tu0, tv0, cols, rows, fn, n) => {
      for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
        const c = tex(tu0 + i, tv0 + j); if (c[3] < 10) continue;
        out.push({ p: fn(i, j), c, n });
      }
    };
    // front (+z)
    face(u + dd, v + dd, w, h, (i, j) => { const x0 = cx - hw + i * sx, y0 = cy + hh - j * sy; return [[x0, y0, cz + hd], [x0 + sx, y0, cz + hd], [x0 + sx, y0 - sy, cz + hd], [x0, y0 - sy, cz + hd]]; }, [0, 0, 1]);
    // back (-z)
    face(u + 2 * dd + w, v + dd, w, h, (i, j) => { const x0 = cx + hw - i * sx, y0 = cy + hh - j * sy; return [[x0, y0, cz - hd], [x0 - sx, y0, cz - hd], [x0 - sx, y0 - sy, cz - hd], [x0, y0 - sy, cz - hd]]; }, [0, 0, -1]);
    // right side of the character (-x)
    face(u, v + dd, dd, h, (i, j) => { const z0 = cz - hd + i * sz, y0 = cy + hh - j * sy; return [[cx - hw, y0, z0], [cx - hw, y0, z0 + sz], [cx - hw, y0 - sy, z0 + sz], [cx - hw, y0 - sy, z0]]; }, [-1, 0, 0]);
    // left side (+x)
    face(u + dd + w, v + dd, dd, h, (i, j) => { const z0 = cz + hd - i * sz, y0 = cy + hh - j * sy; return [[cx + hw, y0, z0], [cx + hw, y0, z0 - sz], [cx + hw, y0 - sy, z0 - sz], [cx + hw, y0 - sy, z0]]; }, [1, 0, 0]);
    // top
    face(u + dd, v, w, dd, (i, j) => { const x0 = cx - hw + i * sx, z0 = cz - hd + j * sz; return [[x0, cy + hh, z0], [x0 + sx, cy + hh, z0], [x0 + sx, cy + hh, z0 + sz], [x0, cy + hh, z0 + sz]]; }, [0, 1, 0]);
    // bottom
    face(u + dd + w, v, w, dd, (i, j) => { const x0 = cx - hw + i * sx, z0 = cz + hd - j * sz; return [[x0, cy - hh, z0], [x0 + sx, cy - hh, z0], [x0 + sx, cy - hh, z0 - sz], [x0, cy - hh, z0 - sz]]; }, [0, -1, 0]);
  }
  function skinQuads(img, slim, overlay = true) {
    const k = img.width / 64, aw = slim ? 3 : 4, q = [];
    const legacy = img.height === img.width / 2;
    const parts = [
      [0, 0, 8, 8, 8, 0, 28, 0, 32, 0, 0.5], [16, 16, 8, 12, 4, 0, 18, 0, 16, 32, 0.25],
      [40, 16, aw, 12, 4, -(4 + aw / 2), 18, 0, 40, 32, 0.25], [legacy ? 40 : 32, legacy ? 16 : 48, aw, 12, 4, 4 + aw / 2, 18, 0, 48, 48, 0.25],
      [0, 16, 4, 12, 4, -2, 6, 0, 0, 32, 0.25], [legacy ? 0 : 16, legacy ? 16 : 48, 4, 12, 4, 2, 6, 0, 0, 48, 0.25],
    ];
    for (const [u, v, w, h, d, cx, cy, cz] of parts) boxQuads(img, k, u, v, w, h, d, cx, cy - 16, cz, 0, q);
    if (overlay && !legacy) for (const [, , w, h, d, cx, cy, cz, ou, ov, inf] of parts) boxQuads(img, k, ou, ov, w, h, d, cx, cy - 16, cz, inf, q);
    return q;
  }
  // ---- viewer
  function viewer(canvas, quads, { yaw = -0.6, pitch = 0.25, dist = 42, auto = true, bg = null } = {}) {
    const ctx = canvas.getContext('2d'); let raf, last = performance.now(), dragging = null;
    const st = { yaw, pitch, dist, auto };
    const L = (() => { const v = [0.4, 0.8, 0.6]; const m = Math.hypot(...v); return v.map((x) => x / m); })();
    function draw() {
      const W = canvas.width = canvas.clientWidth * devicePixelRatio, H = canvas.height = canvas.clientHeight * devicePixelRatio;
      ctx.clearRect(0, 0, W, H); if (bg) { ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H); }
      const cy = Math.cos(st.yaw), sy = Math.sin(st.yaw), cp = Math.cos(st.pitch), sp = Math.sin(st.pitch);
      const f = Math.min(W, H) * 1.6;
      const tr = ([x, y, z]) => { const x1 = x * cy + z * sy, z1 = -x * sy + z * cy; const y2 = y * cp - z1 * sp, z2 = y * sp + z1 * cp; const zz = st.dist - z2; return [W / 2 + x1 * f / zz, H / 2 - y2 * f / zz, zz]; };
      const out = [];
      for (const q of quads) {
        const n = q.n; const nx = n[0] * cy + n[2] * sy, nz1 = -n[0] * sy + n[2] * cy; const nz = n[1] * sp + nz1 * cp;
        if (nz <= 0.001 && q.c[3] > 250) continue; // back-face cull (keep translucent both sides)
        const p = q.p.map(tr); const depth = (p[0][2] + p[1][2] + p[2][2] + p[3][2]) / 4;
        const ny = n[1] * cp - nz1 * sp;
        const lit = 0.55 + 0.45 * Math.max(0, nx * L[0] + ny * L[1] + nz * L[2]);
        out.push([depth, p, q.c, lit]);
      }
      out.sort((a, b) => b[0] - a[0]);
      for (const [, p, c, lit] of out) {
        ctx.fillStyle = `rgba(${c[0] * lit | 0},${c[1] * lit | 0},${c[2] * lit | 0},${c[3] / 255})`;
        ctx.beginPath(); ctx.moveTo(p[0][0], p[0][1]); for (let i = 1; i < 4; i++) ctx.lineTo(p[i][0], p[i][1]); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = ctx.fillStyle; ctx.lineWidth = 0.6; ctx.stroke();
      }
    }
    function loop(t) { if (!canvas.isConnected) return; const dt = (t - last) / 1000; last = t; if (st.auto && !dragging) st.yaw += dt * 0.7; draw(); raf = requestAnimationFrame(loop); }
    canvas.onpointerdown = (e) => { dragging = [e.clientX, e.clientY, st.yaw, st.pitch]; canvas.setPointerCapture(e.pointerId); };
    canvas.onpointermove = (e) => { if (!dragging) return; st.yaw = dragging[2] + (e.clientX - dragging[0]) * 0.01; st.pitch = Math.max(-1.4, Math.min(1.4, dragging[3] + (e.clientY - dragging[1]) * 0.01)); };
    canvas.onpointerup = () => { dragging = null; };
    canvas.onwheel = (e) => { e.preventDefault(); st.dist = Math.max(18, Math.min(120, st.dist * (e.deltaY > 0 ? 1.1 : 0.9))); };
    raf = requestAnimationFrame(loop);
    return { st, set(q) { quads = q; }, stop() { cancelAnimationFrame(raf); } };
  }
  // armor layers drawn over a character (64x32 armor texture, same box layout as skins)
  function armorQuads(l1, l2, slim, parts) {
    const q = [], aw = slim ? 3 : 4;
    if (l1) { const k = l1.width / 64;
      if (parts.helmet) boxQuads(l1, k, 0, 0, 8, 8, 8, 0, 12, 0, 1.0, q);
      if (parts.chest) { boxQuads(l1, k, 16, 16, 8, 12, 4, 0, 2, 0, 1.01, q); boxQuads(l1, k, 40, 16, 4, 12, 4, -(4 + aw / 2), 2, 0, 1.0, q); boxQuads(l1, k, 40, 16, 4, 12, 4, 4 + aw / 2, 2, 0, 1.0, q); }
      if (parts.boots) { boxQuads(l1, k, 0, 16, 4, 12, 4, -2, -10, 0, 1.0, q); boxQuads(l1, k, 0, 16, 4, 12, 4, 2, -10, 0, 1.0, q); } }
    if (l2 && parts.legs) { const k = l2.width / 64; boxQuads(l2, k, 16, 16, 8, 12, 4, 0, 2, 0, 0.5, q); boxQuads(l2, k, 0, 16, 4, 12, 4, -2, -10, 0, 0.5, q); boxQuads(l2, k, 0, 16, 4, 12, 4, 2, -10, 0, 0.5, q); }
    return q;
  }
  window.Lite3D = { itemQuads, skinQuads, armorQuads, boxQuads, viewer };
})();
