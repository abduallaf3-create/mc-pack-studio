// MC Pack Studio - renderer
const S = { view: 'home', clients: [], projects: [], project: null, tab: 'textures', cat: 'swords', settings: {}, search: '' };
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const fmtSize = (b) => (b > 1048576 ? (b / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(b / 1024)) + ' KB');

// ------------------------------------------------------------- ui primitives
window.toast = (msg, type = 'ok', action) => {
  const t = document.createElement('div');
  t.className = 'toast ' + type;
  t.innerHTML = `${icon(type === 'err' ? 'x' : 'check', 18)}<span style="flex:1">${msg}</span>`;
  if (action) { const b = document.createElement('button'); b.className = 'btn sm'; b.textContent = action.label; b.onclick = action.fn; t.append(b); }
  $('#toasts').append(t);
  setTimeout(() => { t.style.transition = '.3s'; t.style.opacity = 0; setTimeout(() => t.remove(), 300); }, action ? 7000 : 3200);
};
window.modal = ({ cls = '', title, sub, body, foot, onClose, beforeClose }) => {
  const bg = document.createElement('div');
  bg.className = 'modal-bg';
  bg.innerHTML = `<div class="modal ${cls}"><div class="modal-h"><div style="flex:1"><h2>${title}</h2>${sub ? `<div class="muted small" style="margin-top:3px">${sub}</div>` : ''}</div>
    <button class="btn ghost icon x-close">${icon('x')}</button></div>
    <div class="modal-b" ${cls === 'xl' ? 'style="padding:0"' : ''}>${body}</div>${foot ? `<div class="modal-f">${foot}</div>` : ''}</div>`;
  document.body.append(bg);
  const m = {
    el: bg,
    close(force) {
      const done = () => { if (!bg.isConnected) return; bg.remove(); onClose && onClose(); };
      if (force || !beforeClose) return done();
      const r = beforeClose();
      if (r && typeof r.then === 'function') r.then((ok) => ok && done()); else if (r) done();
    },
  };
  bg.querySelector('.x-close').onclick = () => m.close();
  bg.addEventListener('mousedown', (e) => { if (e.target === bg) m.close(); });
  return m;
};
function bytesToB64(u8) { let s = ''; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000)); return btoa(s); }
function confirmBox(title, text, okLabel = 'أكيد', danger = false) {
  return new Promise((res) => {
    const m = modal({ title, body: `<p class="muted" style="margin:0;line-height:1.8">${text}</p>`,
      foot: `<button class="btn ${danger ? 'danger' : 'primary'}" data-ok>${okLabel}</button><button class="btn ghost" data-no>إلغاء</button>`, onClose: () => res(false) });
    m.el.querySelector('[data-ok]').onclick = () => { res(true); m.close(true); };
    setTimeout(() => m.el.querySelector('[data-ok]').focus(), 30);
    m.el.querySelector('[data-no]').onclick = () => m.close();
  });
}
const THEMES = [
  ['midnight', 'ليلي (الأساسي)', ['#06070b', '#10131c', '#171b27']], ['amoled', 'أسود AMOLED', ['#000', '#0b0b0d', '#141418']],
  ['ocean', 'محيط', ['#040a14', '#0b1728', '#112038']], ['neon', 'نيون', ['#06030d', '#110a20', '#1a1030']],
  ['minecraft', 'ستايل ماينكرافت', ['#151515', '#2a2a2a', '#6f6f6f']], ['light', 'فاتح مودرن', ['#eef1f7', '#ffffff', '#f2f4fa']],
];
function applyAccent() {
  document.documentElement.dataset.theme = S.settings.theme || 'midnight';
  const [a, b] = ACCENTS[S.settings.accent] || ACCENTS.violet;
  document.documentElement.style.setProperty('--a1', a);
  document.documentElement.style.setProperty('--a2', b);
}
const clientOf = (id) => S.clients.find((c) => c.id === id) || { name: id, color: '#888' };
const clientLogo = (c, size = 34) => `<div class="cl-logo" style="width:${size}px;height:${size}px;background:linear-gradient(135deg, ${c.color}, ${c.color}99)">${esc((c.name || '?').replace('مسار مخصص', '★')[0])}</div>`;

// ------------------------------------------------------------- procedural banner art (original pixel landscape)
const artCache = {};
function bannerArt(seed = 1, w = 320, h = 110) {
  const key = seed + ':' + (S.settings.accent || 'violet');
  if (artCache[key]) return artCache[key];
  let s = seed * 9301 + 49297; const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d');
  const [a1, a2] = ACCENTS[S.settings.accent] || ACCENTS.violet;
  const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#0b0820'); g.addColorStop(.55, a1); g.addColorStop(1, a2);
  x.fillStyle = g; x.fillRect(0, 0, w, h);
  for (let i = 0; i < 70; i++) { x.fillStyle = `rgba(255,255,255,${.3 + rnd() * .6})`; x.fillRect(Math.floor(rnd() * w), Math.floor(rnd() * h * .45), 1, 1); }
  x.fillStyle = 'rgba(255,240,220,.95)'; x.fillRect(Math.floor(w * .14), 14, 12, 12); x.fillStyle = 'rgba(255,240,220,.25)'; x.fillRect(Math.floor(w * .14) - 3, 11, 18, 18);
  for (let i = 0; i < 5; i++) { const cx = Math.floor(rnd() * w), cy = 18 + Math.floor(rnd() * 22); x.fillStyle = 'rgba(255,255,255,.18)'; x.fillRect(cx, cy, 18 + rnd() * 20, 4); x.fillRect(cx + 4, cy - 3, 10, 3); }
  const layer = (base, amp, col, top) => {
    let y = base;
    for (let i = 0; i < w; i += 4) {
      y += Math.floor((rnd() - .5) * amp); y = Math.max(base - 16, Math.min(base + 10, y));
      x.fillStyle = col; x.fillRect(i, y, 4, h - y);
      if (top) { x.fillStyle = top; x.fillRect(i, y, 4, 3); }
    }
  };
  layer(Math.floor(h * .58), 6, 'rgba(20,10,40,.55)');
  layer(Math.floor(h * .7), 5, '#2b1d3f', null);
  // foreground blocks
  let gy = Math.floor(h * .8);
  for (let i = 0; i < w; i += 4) {
    if (rnd() < .25) gy += rnd() < .5 ? -4 : 4; gy = Math.max(h * .72, Math.min(h - 10, gy));
    x.fillStyle = '#3d7a2c'; x.fillRect(i, gy, 4, 4);
    x.fillStyle = '#6b4a2b'; x.fillRect(i, gy + 4, 4, h - gy);
    for (let j = gy + 8; j < h; j += 4) if (rnd() < .3) { x.fillStyle = rnd() < .1 ? '#5ad3ff' : '#555b66'; x.fillRect(i, j, 4, 4); }
    if (rnd() < .035 && i > 8) { // tree
      x.fillStyle = '#5a3d22'; x.fillRect(i, gy - 16, 4, 16);
      x.fillStyle = '#2f6b26'; x.fillRect(i - 8, gy - 28, 20, 12); x.fillRect(i - 4, gy - 32, 12, 4);
    }
  }
  return (artCache[key] = c.toDataURL());
}

// ------------------------------------------------------------- sidebar
function renderRail() {
  const nav = (v, ic, label, cnt) => `<button class="nav ${S.view === v ? 'on' : ''}" data-v="${v}">${icon(ic, 20)}<span>${label}</span>${cnt !== undefined ? `<span class="cnt">${cnt}</span>` : ''}</button>`;
  const p = S.project;
  $('#side').innerHTML = `<div class="brand"><div class="mark"><img src="icon.png"></div><div><b>MC Pack Studio</b><span>Pack Launcher</span></div></div>
    ${nav('home', 'home', 'الرئيسية')}
    ${nav('packs', 'layers', 'باكاتي', S.projects.length)}
    ${p ? nav('project', 'edit', 'المحرر') : ''}
    <div class="nav-h">الأدوات</div>
    ${nav('skins', 'user', 'السكنات')}
    ${nav('mods', 'puzzle', 'المودات')}
    ${nav('clients', 'monitor', 'الكلاينتات')}
    <div class="side-fill"></div>
    ${nav('settings', 'gear', 'الإعدادات')}
    ${p ? `<div class="now" style="margin-top:10px"><div class="row" style="gap:10px"><img id="now-ic"><div style="min-width:0"><div class="nm">${esc(p.name)}</div><div class="dim small">${esc(clientOf(p.clientId).name)} · <span class="ltr">${esc(p.version)}</span></div></div></div>
      <button class="play" id="now-play">${icon('play', 18)} تثبيت الباك</button></div>` : ''}`;
  $$('#side [data-v]').forEach((b) => b.onclick = () => go(b.dataset.v));
  if (p) { api.file.icon(p.id).then((b) => { const i = $('#now-ic'); if (b && i) i.src = 'data:image/png;base64,' + b; }); $('#now-play').onclick = () => installPack(); }
}
function go(v) { S.view = v; renderRail(); render(); }
function render() {
  const main = $('#main');
  const views = { home: renderHome, packs: renderPacks, project: renderProject, skins: renderSkins, mods: renderModsView, clients: renderClients, settings: renderSettings };
  if (S.view === 'project' && !S.project) S.view = 'home';
  (views[S.view] || renderHome)(main);
}

// ------------------------------------------------------------- home / packs
function packCard(p) {
  const c = clientOf(p.clientId);
  return `<div class="pcard" data-id="${p.id}"><div class="cover"><div class="blur" data-blur="${p.id}"></div><img data-icon="${p.id}" alt="">
      <span class="badge dark ver ltr">${esc(p.version)}</span></div>
    <button class="quick" data-quick="${p.id}" title="تثبيت">${icon('download', 18)}</button>
    <div class="body"><div class="nm">${esc(p.name)}</div>
      <div class="row" style="gap:6px"><span class="badge"><span class="dot" style="background:${c.color};box-shadow:0 0 8px ${c.color}"></span>${esc(c.name)}</span></div></div></div>`;
}
async function bindPackCards(root) {
  $$('.pcard[data-id]', root).forEach((el) => el.onclick = (e) => { if (e.target.closest('.quick')) return; openProject(el.dataset.id); });
  $$('[data-quick]', root).forEach((b) => b.onclick = async () => { const p = S.projects.find((x) => x.id === b.dataset.quick); S.project = p; renderRail(); await installPack(); });
  for (const img of $$('img[data-icon]', root)) {
    const b = await api.file.icon(img.dataset.icon); if (!b) continue;
    const url = 'data:image/png;base64,' + b; img.src = url;
    const bl = $(`[data-blur="${img.dataset.icon}"]`, root); if (bl) bl.style.backgroundImage = `url(${url})`;
  }
}
async function renderHome(main) {
  S.projects = await api.projects.list();
  const detected = S.clients.filter((c) => c.detected);
  const skins = await api.skins.list();
  main.innerHTML = `<div class="view">
    <div class="banner" style="background-image:url(${bannerArt(7, 360, 120)})">
      <div><span class="chip-tag"><i></i>${detected.length ? `${detected.length} كلاينت جاهز على جهازك` : 'جاهز'}</span>
        <h1>صمّم <span class="grad-text">الباك</span> حقك<br>وخلّه على كيفك</h1>
        <p>سيوف، نار قصيرة، شيلد قصير، توتم، كروس هير، سكنات، وكل تكستر باللعبة — وبضغطة زر ينزل في الكلاينت.</p>
        <div class="row"><button class="btn primary lg" id="newp">${icon('plus', 20)} باك جديد</button><button class="btn lg" id="impp">${icon('upload', 18)} افتح باك من خويك</button>
          ${S.projects[0] ? `<button class="btn lg" id="cont">${icon('play', 18)} كمّل على "${esc(S.projects[0].name)}"</button>` : ''}</div></div>
    </div>
    <div class="stats">
      <div class="stat"><div class="si">${icon('layers', 20)}</div><div><b>${S.projects.length}</b><span>باك</span></div></div>
      <div class="stat"><div class="si">${icon('monitor', 20)}</div><div><b>${detected.length}</b><span>كلاينت مكتشف</span></div></div>
      <div class="stat"><div class="si">${icon('user', 20)}</div><div><b>${skins.length}</b><span>سكن محفوظ</span></div></div>
      <div class="stat"><div class="si">${icon('image', 20)}</div><div><b>+${TEXTURES.length}</b><span>تكستر جاهز للتعديل</span></div></div>
    </div>
    <div class="sec-h"><h2>آخر الباكات</h2><div class="line"></div>${S.projects.length > 7 ? '<button class="btn sm ghost" id="all">شوف الكل</button>' : ''}</div>
    <div class="grid card-grid">
      <div class="pcard new" id="newp2"><div><div class="plus">${icon('plus', 26)}</div><b>باك جديد</b><div class="small" style="margin-top:4px">لأي كلاينت</div></div></div>
      ${S.projects.slice(0, 7).map(packCard).join('')}
    </div>
    <div class="sec-h"><h2>أدوات سريعة</h2><div class="line"></div></div>
    <div class="grid" style="grid-template-columns:repeat(3,1fr)">
      ${[['skins', 'user', 'محرر السكنات', 'ارسم سكنك وشوفه من قدام وورا'], ['mods', 'puzzle', 'مدير المودات', 'فعّل، عطّل، وعدّل داخل المودات'], ['clients', 'monitor', 'الكلاينتات', 'Lunar, Badlion, Feather والباقي']].map(([v, ic, t, d]) => `
        <div class="pcard" data-go="${v}" style="padding:20px;display:flex;gap:16px;align-items:center"><div class="stat" style="padding:0;border:0;background:none"><div class="si" style="width:52px;height:52px">${icon(ic, 24)}</div></div><div><b style="font-size:15px">${t}</b><div class="muted small" style="margin-top:4px">${d}</div></div></div>`).join('')}
    </div></div>`;
  $('#newp').onclick = $('#newp2').onclick = () => openProjectForm();
  $('#impp').onclick = importShared;
  if ($('#cont')) $('#cont').onclick = () => openProject(S.projects[0].id);
  if ($('#all')) $('#all').onclick = () => go('packs');
  $$('[data-go]', main).forEach((x) => x.onclick = () => go(x.dataset.go));
  renderRail();
  bindPackCards(main);
}
async function renderPacks(main) {
  S.projects = await api.projects.list();
  main.innerHTML = `<div class="view"><div class="row" style="margin-bottom:22px"><div style="flex:1"><h1>باكاتي</h1><p class="sub" style="margin:0">كل الباكات اللي سويتها</p></div>
    <div class="search" style="width:280px"><input class="inp" id="ps" placeholder="ابحث...">${icon('search', 18)}</div>
    <button class="btn" id="impp">${icon('upload', 18)} افتح باك من خويك</button><button class="btn primary" id="newp">${icon('plus', 18)} باك جديد</button></div>
    <div class="grid card-grid" id="pg"></div></div>`;
  $('#impp').onclick = importShared;
  const draw = () => {
    const q = $('#ps').value.toLowerCase();
    $('#pg').innerHTML = `<div class="pcard new" id="newp2"><div><div class="plus">${icon('plus', 26)}</div><b>باك جديد</b></div></div>` + S.projects.filter((p) => p.name.toLowerCase().includes(q)).map(packCard).join('');
    $('#newp2').onclick = () => openProjectForm();
    bindPackCards(main);
  };
  $('#ps').oninput = draw; $('#newp').onclick = () => openProjectForm(); draw();
}

// ------------------------------------------------------------- project form (create / edit)
async function makeIcon(name, color) {
  const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d');
  const [a, b] = ACCENTS[S.settings.accent] || ACCENTS.violet;
  const g = x.createLinearGradient(0, 0, 128, 128); g.addColorStop(0, color || a); g.addColorStop(1, b);
  x.fillStyle = g; x.fillRect(0, 0, 128, 128);
  x.fillStyle = 'rgba(0,0,0,.18)'; for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) if ((i * 3 + j * 5) % 7 === 0) x.fillRect(i * 16, j * 16, 16, 16);
  x.fillStyle = '#fff'; x.font = 'bold 54px Segoe UI, Tahoma, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.shadowColor = 'rgba(0,0,0,.35)'; x.shadowOffsetY = 4; x.shadowBlur = 0;
  x.fillText((name || 'P').trim().slice(0, 2).toUpperCase(), 64, 68);
  return c.toDataURL('image/png').split(',')[1];
}

function openProjectForm(edit) {
  const p = edit ? { ...edit } : { name: '', description: '', clientId: (S.clients.find((c) => c.detected) || S.clients[0]).id, version: VERSIONS[0].id, activate: false };
  const verList = VERSIONS.some((v) => v.id === p.version) ? VERSIONS : [...VERSIONS, { id: p.version, pf: p.packFormat, label: p.version + ' (قديمة)' }];
  const m = modal({
    cls: 'lg', title: edit ? 'إعدادات الملف' : 'ملف جديد', sub: edit ? '' : 'اختر الكلاينت والنسخة، وكل شي ثاني تقدر تغيّره بعدين',
    body: `<div class="stack" style="gap:20px">
      <div class="grid" style="grid-template-columns:1fr 1fr">
        <label class="f">اسم الباك<input class="inp" id="f-name" placeholder="مثلاً: Purple PvP 16x" value="${esc(p.name)}"></label>
        <label class="f">نسخة ماينكرافت<select class="inp" id="f-ver">${verList.map((v) => `<option value="${v.id}" ${v.id === p.version ? 'selected' : ''}>${v.label}</option>`).join('')}</select></label>
      </div>
      <label class="f">الوصف (يطلع تحت اسم الباك باللعبة)<input class="inp" id="f-desc" value="${esc(p.description)}" placeholder="§dMade with MC Pack Studio"></label>
      <div><div class="row" style="margin-bottom:10px"><b>الكلاينت</b><span class="muted small">الأخضر = موجود على جهازك</span></div>
        <div class="client-grid">${S.clients.map((c) => `<div class="client ${c.id === p.clientId ? 'on' : ''}" data-c="${c.id}">
          ${clientLogo(c)}<div class="nm">${esc(c.name)}</div>${c.detected ? '<span class="det"></span>' : ''}</div>`).join('')}</div></div>
      <div id="f-inst"></div>
      <div class="grid" style="grid-template-columns:1fr 1fr">
        <label class="f">مجلد الريسورس باك<div class="path-row"><input class="inp" id="f-rp"><button class="btn icon" data-pick="f-rp">${icon('folder')}</button></div></label>
        <label class="f">مجلد المودات<div class="path-row"><input class="inp" id="f-mods" placeholder="—"><button class="btn icon" data-pick="f-mods">${icon('folder')}</button></div></label>
      </div>
      <div id="f-note"></div>
      ${edit ? '' : `<div><div class="row" style="margin-bottom:10px"><b>ابدأ من قالب</b><span class="muted small">تقدر تغيّر كل شي بعدين</span></div>
        <div class="tpl-grid">${TEMPLATES.map(([id, n, ic, d]) => `<div class="tpl ${id === 'blank' ? 'on' : ''}" data-tpl="${id}"><div class="ti">${icon(ic, 20)}</div><b>${n}</b><span>${d}</span></div>`).join('')}</div></div>`}
      <label class="check"><span class="switch"><input type="checkbox" id="f-act" ${p.activate ? 'checked' : ''}><span></span></span>
        <span>فعّل الباك تلقائياً في اللعبة بعد التثبيت <span class="dim small">(يعدّل options.txt — سكّر اللعبة قبل)</span></span></label>
    </div>`,
    foot: `<button class="btn primary" id="f-save">${icon('check', 16)} ${edit ? 'حفظ' : 'سوّ الباك'}</button><button class="btn ghost" id="f-cancel">إلغاء</button>`,
  });
  const el = m.el;
  let first = !!edit;
  function fillClient() {
    const c = clientOf(p.clientId);
    let rp = '', mods = '';
    const inst = $('#f-inst', el);
    if (c.type === 'instances') {
      inst.innerHTML = c.instances.length
        ? `<label class="f">اختر الإنستانس (البروفايل)<select class="inp" id="f-i">${c.instances.map((i) => `<option ${i.name === p.instance ? 'selected' : ''}>${esc(i.name)}</option>`).join('')}</select></label>`
        : `<div class="notice">${icon('folder', 20)}<div><b>ما لقيت إنستانسات لـ ${esc(c.name)}</b><span class="muted small">حدد مجلد الريسورس باك والمودات يدوي.</span></div></div>`;
      const sel = $('#f-i', el);
      const upd = () => { const i = c.instances.find((x) => x.name === sel.value); if (i) { $('#f-rp', el).value = i.rp; $('#f-mods', el).value = i.mods; p.instance = i.name; } };
      if (sel) { sel.onchange = upd; if (!first) upd(); }
    } else {
      inst.innerHTML = ''; p.instance = null;
      rp = c.rpPath || ''; mods = c.modsPath || '';
      if (!first) { $('#f-rp', el).value = rp; $('#f-mods', el).value = mods; }
    }
    const missing = c.type === 'single' && c.id !== 'custom' && !c.detected;
    $('#f-note', el).innerHTML = (missing ? `<div class="notice" style="margin:0 0 10px">${icon('folder', 20)}<div style="flex:1"><b>ما لقيت ${esc(c.name)} على جهازك</b><span class="muted small">إذا مثبّت بمكان ثاني، اختر مجلد اللعبة حقه (اللي فيه resourcepacks).</span></div><button class="btn sm primary" id="f-cdir">${icon('folder', 15)} اختر مجلد ${esc(c.name)}</button></div>` : '')
      + (c.custom ? `<div class="notice info" style="margin:0 0 10px">${icon('check', 20)}<div style="flex:1" class="small">تستخدم مجلد اخترته: <span class="ltr">${esc(c.gameDir)}</span></div><button class="btn sm" id="f-cdir">غيّر</button></div>` : '')
      + (c.note ? `<div class="notice info" style="margin:0">${icon('monitor', 20)}<div class="small" style="line-height:1.7">${esc(c.note)}</div></div>` : '');
    if ($('#f-cdir', el)) $('#f-cdir', el).onclick = async () => { if (await pickClientDir(c)) { first = false; fillClient(); } };
    first = false;
  }
  if (edit) { $('#f-rp', el).value = p.rpPath || ''; $('#f-mods', el).value = p.modsPath || ''; }
  fillClient();
  $$('.client', el).forEach((c) => c.onclick = () => { $$('.client', el).forEach((x) => x.classList.remove('on')); c.classList.add('on'); p.clientId = c.dataset.c; fillClient(); });
  $$('[data-pick]', el).forEach((b) => b.onclick = async () => { const f = await api.fs.pickFolder('اختر المجلد'); if (f) $('#' + b.dataset.pick, el).value = f; });
  let tpl = 'blank';
  $$('.tpl', el).forEach((x) => x.onclick = () => { tpl = x.dataset.tpl; $$('.tpl', el).forEach((y) => y.classList.toggle('on', y === x)); });
  $('#f-cancel', el).onclick = () => m.close();
  $('#f-save', el).onclick = async () => {
    p.name = $('#f-name', el).value.trim() || 'My Pack';
    p.description = $('#f-desc', el).value.trim();
    const verChanged = p.version !== $('#f-ver', el).value;
    p.version = $('#f-ver', el).value;
    p.packFormat = (verList.find((v) => v.id === p.version) || VERSIONS[0]).pf;
    p.rpPath = $('#f-rp', el).value.trim(); p.modsPath = $('#f-mods', el).value.trim();
    p.activate = $('#f-act', el).checked;
    p.clientName = clientOf(p.clientId).name;
    if (!edit || verChanged || !p.baseJar) { const j = await api.jar.find(p.version); if (j.exact) { p.baseJar = j.exact.path; p.baseApprox = null; } else if (verChanged || !edit) { p.baseJar = null; p.baseApprox = null; } }
    const needDl = !p.baseJar;
    if (!edit) { p.created = Date.now(); p.shield = { enabled: false, lower: 4, scale: 1, blockLower: 4 }; }
    const saved = await api.projects.save(p);
    if (!edit) await api.file.setIcon(saved.id, await makeIcon(saved.name, clientOf(saved.clientId).color));
    m.close(true);
    if (edit) { S.project = saved; renderRail(); render(); toast('انحفظت الإعدادات'); } else await openProject(saved.id, saved);
    if (needDl || S.project.baseApprox) { if (await autoBase(S.project, true)) render(); }
    if (!edit && tpl !== 'blank') { if (S.project.baseJar) { await applyTemplate(S.project, tpl); render(); } else toast('القالب يحتاج ملفات اللعبة — حمّلها وبعدين جرب', 'err'); }
  };
  setTimeout(() => $('#f-name', el).focus(), 50);
}

async function openProject(id, p) {
  S.projects = await api.projects.list();
  if (!p) p = S.projects.find((x) => x.id === id);
  if (!p) return;
  S.project = p; S.tab = 'textures'; S.cat = 'swords'; go('project');
  { const had = p.baseJar; const ok = await autoBase(p, false); if (p.baseJar !== had || !ok) render(); }
}
const saveProject = async () => { const saved = await api.projects.save(S.project); S.project.id = saved.id; S.project.updated = saved.updated; };

// ------------------------------------------------------------- project workspace
const ITEM_CATS = [['weapons', 'أسلحة'], ['tools', 'أدوات'], ['throw', 'رمي'], ['food', 'أكل'], ['armor', 'دروع وتوتم'], ['misc', 'باقي الأشياء'], ['blocks', 'بلوكات'], ['all', 'الكل']];
function itemCat(m) {
  const n = m.name;
  if (!m.tex || m.block) return 'blocks';
  if (/sword|_axe$|^bow$|crossbow|trident|^mace$|^shield$/.test(n)) return 'weapons';
  if (/pickaxe|shovel|_hoe$|fishing_rod|shears|flint_and_steel|brush|spyglass|compass|clock|lead$|bucket/.test(n)) return 'tools';
  if (/ender_pearl|snowball|^egg$|potion|experience_bottle|fire_charge|wind_charge|ender_eye|firework_rocket|arrow$/.test(n)) return 'throw';
  if (/apple|bread|beef|porkchop|chicken|mutton|rabbit|cod|salmon|potato|carrot|melon_slice|cookie|pie$|stew|soup|berries|beetroot|honey_bottle|dried_kelp|chorus_fruit|tropical_fish|pufferfish/.test(n)) return 'food';
  if (/helmet|chestplate|leggings|boots|elytra|totem|horse_armor/.test(n)) return 'armor';
  return 'misc';
}
const ITEM_AR = { shield: 'الشيلد', diamond_sword: 'سيف دايموند', netherite_sword: 'سيف نذرايت', iron_sword: 'سيف حديد', golden_sword: 'سيف ذهب', stone_sword: 'سيف حجر', wooden_sword: 'سيف خشب', diamond_axe: 'فاس دايموند', netherite_axe: 'فاس نذرايت', iron_axe: 'فاس حديد', bow: 'القوس', crossbow: 'الكروس بو', trident: 'الترايدنت', mace: 'الميس', shield: 'الشيلد', ender_pearl: 'إندر بيرل', snowball: 'كرة ثلج', egg: 'البيضة', totem_of_undying: 'التوتم', golden_apple: 'تفاحة ذهبية', enchanted_golden_apple: 'تفاحة ذهبية مإنشانت', fishing_rod: 'السنارة', flint_and_steel: 'ولّاعة', water_bucket: 'سطل ماء', lava_bucket: 'سطل لافا', cooked_beef: 'ستيك', elytra: 'الإليترا', diamond_pickaxe: 'معول دايموند', netherite_pickaxe: 'معول نذرايت', experience_bottle: 'قارورة XP', fire_charge: 'كرة نار', wind_charge: 'شحنة الريح', ender_eye: 'عين الإندر', arrow: 'السهم', compass: 'البوصلة', clock: 'الساعة', spyglass: 'المنظار', shears: 'المقص' };
const FAM_AR_MORE = { meat: 'كل اللحوم', fish: 'كل السمك', potato: 'كل البطاطس', bread: 'الخبز', sweet: 'كل الحلويات', stew: 'كل الشوربات', spawn_egg: 'كل بيض الموبات', music_disc: 'كل الأسطوانات', pottery_sherd: 'كل قطع الفخار', smithing_template: 'كل قوالب الحدادة', banner_pattern: 'كل نقوش البانر', boat: 'كل القوارب', chest_boat: 'كل القوارب بصندوق', minecart: 'كل عربات المنجم', bucket: 'كل السطول',
  wool: 'كل الصوف', stained_glass: 'كل الزجاج الملوّن', stained_glass_pane: 'كل ألواح الزجاج الملوّن', terracotta: 'كل الطين المحروق', glazed_terracotta: 'كل الطين المزخرف', concrete: 'كل الكونكريت', concrete_powder: 'كل بودرة الكونكريت', bed: 'كل الأسرّة', banner: 'كل البانرات', carpet: 'كل السجاد', candle: 'كل الشموع', shulker_box: 'كل الشلكر بوكس', dye: 'كل الأصباغ', harness: 'كل السروج الملوّنة',
  planks: 'كل الألواح الخشبية', log: 'كل الجذوع', wood: 'كل الخشب', stripped_log: 'كل الجذوع المقشّرة', leaves: 'كل أوراق الشجر', sapling: 'كل الشتلات', door: 'كل الأبواب', trapdoor: 'كل الأبواب الأرضية', fence: 'كل السياج', fence_gate: 'كل بوابات السياج', stairs: 'كل الدرج', slab: 'كل السلابات', button: 'كل الأزرار', pressure_plate: 'كل لوحات الضغط', sign: 'كل اللافتات', hanging_sign: 'كل اللافتات المعلّقة', ingot: 'كل السبايك', nugget: 'كل القطع', block: 'كل البلوكات المعدنية', ore: 'كل الخامات' };
const FAM_AR = { sword: 'كل السيوف', axe: 'كل الفؤوس', pickaxe: 'كل المعاول', shovel: 'كل المجارف', hoe: 'كل المحاريث', helmet: 'كل الخوذ', chestplate: 'كل الصدريات', leggings: 'كل البناطيل', boots: 'كل البوتات', potion: 'كل الجرعات', arrow: 'كل الأسهم', horse_armor: 'كل دروع الخيل', ingot: 'كل السبايك', nugget: 'كل القطع', apple: 'كل التفاح', carrot: 'كل الجزر' };
// which "kind" an item/block belongs to — every boots, every apple, every wool colour… become one choice
const FAM_FOOD = { apple: 'apple', golden_apple: 'apple', enchanted_golden_apple: 'apple', beef: 'meat', cooked_beef: 'meat', porkchop: 'meat', cooked_porkchop: 'meat', chicken: 'meat', cooked_chicken: 'meat', mutton: 'meat', cooked_mutton: 'meat', rabbit: 'meat', cooked_rabbit: 'meat', cod: 'fish', cooked_cod: 'fish', salmon: 'fish', cooked_salmon: 'fish', tropical_fish: 'fish', pufferfish: 'fish', carrot: 'carrot', golden_carrot: 'carrot', potato: 'potato', baked_potato: 'potato', poisonous_potato: 'potato', potion: 'potion', splash_potion: 'potion', lingering_potion: 'potion', arrow: 'arrow', spectral_arrow: 'arrow', tipped_arrow: 'arrow', bread: 'bread', cookie: 'sweet', pumpkin_pie: 'sweet', cake: 'sweet' };
const COLORS_RE = /^(white|orange|magenta|light_blue|yellow|lime|pink|gray|light_gray|cyan|purple|blue|brown|green|red|black)_(.+)$/;
const WOODS_RE = /^(oak|spruce|birch|jungle|acacia|dark_oak|mangrove|cherry|bamboo|crimson|warped|pale_oak)_(.+)$/;
const MATS_RE = /^(wooden|stone|iron|golden|gold|diamond|netherite|copper|leather|chainmail|turtle)_(.+)$/;
function itemFamily(n) {
  if (FAM_FOOD[n]) return FAM_FOOD[n];
  let m;
  if (/_spawn_egg$/.test(n)) return 'spawn_egg';
  if (/^music_disc_/.test(n)) return 'music_disc';
  if (/_pottery_sherd$/.test(n)) return 'pottery_sherd';
  if (/_smithing_template$/.test(n)) return 'smithing_template';
  if (/_banner_pattern$/.test(n)) return 'banner_pattern';
  if (/_(stew|soup)$/.test(n)) return 'stew';
  if (/_chest_boat$|_chest_raft$/.test(n)) return 'chest_boat';
  if (/_boat$|_raft$/.test(n)) return 'boat';
  if (/(^|_)minecart$/.test(n)) return 'minecart';
  if (/_bucket$/.test(n) || n === 'bucket') return 'bucket';
  if ((m = n.match(MATS_RE))) return m[2];
  if ((m = n.match(COLORS_RE))) return m[2];
  if ((m = n.match(WOODS_RE))) return m[2];
  return null;
}
const FAM_SING = { meat: 'لحم لحوم ستيك', fish: 'سمك', apple: 'تفاح تفاحة', carrot: 'جزر', potato: 'بطاطس', wool: 'صوف', stained_glass: 'زجاج', bed: 'سرير', planks: 'خشب ألواح', log: 'جذع خشب', concrete: 'كونكريت', terracotta: 'طين', boat: 'قارب', bucket: 'سطل', spawn_egg: 'بيض', dye: 'صبغ', banner: 'بانر', candle: 'شمعة', carpet: 'سجاد', leaves: 'ورق شجر', door: 'باب', sword: 'سيف', axe: 'فاس فأس', pickaxe: 'معول', shovel: 'مجرفة', hoe: 'محراث', helmet: 'خوذة', chestplate: 'صدرية درع', leggings: 'بنطلون درع', boots: 'بوت جزمة درع', potion: 'جرعة', arrow: 'سهم', horse_armor: 'درع خيل', ingot: 'سبيكة', nugget: 'قطعة' };
Object.assign(FAM_AR, FAM_AR_MORE);
const famLabel = (f) => FAM_AR[f] || 'كل الـ ' + String(f).replace(/_/g, ' ');
const itemName = (n) => ITEM_AR[n] || n.replace(/_/g, ' ');
const TAB_GROUPS = [
  ['الشكل', [['textures', 'التكسترات', 'star'], ['all', 'كل تكسترات اللعبة', 'layers'], ['armor', 'الدروع والإليترا', 'shield'], ['particles', 'الجزيئات', 'wand'], ['fire', 'النار', 'fire'], ['sky', 'السما', 'sun'], ['font', 'الخط', 'edit']]],
  ['PvP', [['measure', 'القياسات', 'sword'], ['tweaks', 'تحسينات PvP', 'wand'], ['cit', 'أسماء مخصصة', 'star']]],
  ['الصوت', [['sounds', 'الأصوات', 'sound']]],
  ['متقدم', [['theme', 'سمة الألوان', 'palette'], ['mods', 'المودات', 'puzzle'], ['configs', 'إعدادات المودات', 'file'], ['psettings', 'إعدادات الباك', 'gear']]],
];
const TABS = TAB_GROUPS.flatMap((g) => g[1]);
async function renderProject(main) {
  const p = S.project, c = clientOf(p.clientId);
  main.innerHTML = `<div class="ws-banner"><div class="bg" id="pbg"></div>
      <img class="pack-icon" id="picon" title="غيّر أيقونة الباك">
      <div class="ws-info"><h1 class="pname" id="pname" title="اضغط عشان تغيّر الاسم"><span class="pn">${esc(p.name)}</span><span class="pname-ed">${icon('edit', 16)}</span></h1>
        <div class="row" style="gap:6px"><span class="badge dark"><span class="dot" style="background:${c.color};box-shadow:0 0 8px ${c.color}"></span>${esc(c.name)}${p.instance ? ' · ' + esc(p.instance) : ''}</span>
        <span class="badge dark ltr">${esc(p.version)} · pack_format ${p.packFormat}</span>
        ${p.baseJar ? `<span class="badge ok">${icon('check', 12)} ملفات اللعبة محمّلة</span>` : `<span class="badge warn">بدون ملفات اللعبة</span>`}</div></div>
      <div class="ws-acts"><label class="btn live ${p.live ? 'on' : ''}" id="live" title="كل ما تحفظ شي، الباك يتثبّت لحاله — باللعبة اضغط F3+T"><span class="dotlive"></span>تثبيت تلقائي</label>
      <button class="btn" id="chk">${icon('check', 17)} فحص</button>
      <button class="btn" id="exp">${icon('zip', 17)} تصدير ZIP</button>
      <button class="btn" id="where" title="${esc(p.rpPath || '')}">${icon('folder', 17)} مكان الحفظ</button>
      <button class="btn primary lg" id="inst">${icon('play', 18)} تثبيت في ${esc(c.name)}</button></div>
    </div>
    <div class="ws-split"><nav class="tabs side">${TAB_GROUPS.map(([g, list]) => `<div class="tgrp">${g}</div>` + list.map(([id, n, ic]) => `<button class="tab ${S.tab === id ? 'on' : ''}" data-t="${id}">${icon(ic, 16)}<span>${n}</span></button>`).join('')).join('')}</nav>
    <div class="ws-col"><div id="wsh"></div><div class="ws-body" id="wsb"></div></div></div>`;
  api.file.icon(p.id).then((b) => { if (b) { const u = 'data:image/png;base64,' + b; $('#picon').src = u; $('#pbg').style.backgroundImage = `url(${u})`; } });
  $('#picon').onclick = editPackIcon;
  $$('.tab').forEach((t) => t.onclick = () => { S.tab = t.dataset.t; $$('.tab').forEach((x) => x.classList.toggle('on', x === t)); renderTab(); });
  $('#inst').onclick = () => installPack();
  $('#where').onclick = () => openSaveWhere();
  $('#pname').onclick = () => renamePack();
  if (!(S.settings.tours || {}).project && !$('.tour-box')) setTimeout(() => { if (S.view === 'project' && !$('.tour-box') && !$('.modal-bg')) startTour('project'); }, 900);
  $('#chk').onclick = () => openChecker();
  $('#live').onclick = async () => { p.live = !p.live; $('#live').classList.toggle('on', p.live); await saveProject(); toast(p.live ? 'التثبيت التلقائي شغال — عدّل واحفظ، وباللعبة اضغط F3+T' : 'وقّفت التثبيت التلقائي'); if (p.live) installPack(true); };
  $('#exp').onclick = async () => { const r = await api.pack.export(S.project, await buildExtras()); if (r) toast('انحفظ الباك', 'ok', { label: 'افتح', fn: () => api.fs.reveal(r.path) }); };
  renderTab();
}
const TAB_HINTS = {
  textures: 'اضغط على أي شي تبي تغيّره (سيف، توتم، سكن...) — تقدر تعدّل على الأصلي أو ترسم من الصفر.',
  armor: 'لوّن كل درع بضغطة على اللون جنبه — ينحفظ لحاله. وتحت تقدر تحط نقشة (تدرّج، كامو، جالكسي) وجلو. والإليترا من الزر فوق.',
  particles: 'غيّر شكل ولون الجزيئات — مثلاً خل السويب نار أو ثلج، أو حط شكل من عندك (صورة أو GIF).',
  fire: 'نزّل النار عشان ما تغطي الشاشة، وغيّر لونها.',
  shield: 'قصّر الشيلد عشان تشوف أكثر وقت البلوك، أو غيّر شكله.',
  sky: 'حط صورك بالسما — صورة لكل جهة أو صورة بانوراما وحدة.',
  font: 'غيّر خط الشات والقوائم لأي خط على جهازك.',
  tweaks: 'تحسينات PvP بضغطة زر: زجاج شفاف، بدون قرعة، كروس هير، وغيرها.',
  held: 'كبّر أو صغّر الأدوات اللي بيدك. وتحت تختار أي أداة من القائمة وتعطيها حجمها الخاص.',
  measure: 'كل القياسات بمكان واحد: السيوف، الشيلد، النار، وكل أداة. ابحث أو اختر من القائمة، والمعاينة بنفس حسابات اللعبة.',
  cit: 'خل السيف يتغيّر شكله لما تسميه بالسندان — مثلاً سمّه "Fire" ويطلع بشكل ثاني.',
  sounds: 'غيّر أي صوت باللعبة — صوت الضربة، الـ XP، وغيرها. تقدر تحط أي صوت من جهازك.',
  all: 'كل تكستر باللعبة هنا — اختر المجلد على الجنب، اضغط على أي تكستر وعدّله. المعدّل يطلع بـ "المعدّل".',
  theme: 'غيّر ألوان واجهة اللعبة (القوائم والأزرار) بلون واحد.',
  mods: 'المودات حقت الكلاينت — فعّل أو عطّل أو عدّل فيها.',
  configs: 'إعدادات المودات — للمحترفين.',
  psettings: 'اسم الباك ووصفه ونسخته.',
};
function renderTab() {
  const b = $('#wsb'); if (!b) return;
  if (S.tab === 'held' || S.tab === 'shield') S.tab = 'measure';
  const h = $('#wsh'); if (h) h.innerHTML = TAB_HINTS[S.tab] ? tabHint(TAB_HINTS[S.tab]) : '';
  ({ textures: tabTextures, all: tabAll, tweaks: tabTweaks, held: tabHeld, armor: tabArmor, measure: tabMeasure, particles: tabParticles, font: tabFont, cit: tabCIT, sky: tabSky, sounds: tabSounds, fire: tabFire, shield: tabShield, theme: tabTheme, mods: tabMods, configs: tabConfigs, psettings: tabPSettings })[S.tab](b);
}

let liveT = null, liveBusy = false;
api.onProjectChanged((id) => {
  if (!S.project || S.project.id !== id || !S.project.live) return;
  clearTimeout(liveT); liveT = setTimeout(() => installPack(true), 1200);
});
async function installPack(silent) {
  if (silent) {
    if (liveBusy) { clearTimeout(liveT); liveT = setTimeout(() => installPack(true), 1200); return; }
    liveBusy = true;
    try { await api.pack.install(S.project, await buildExtras(), false); toast('انحدّث الباك ✓ — باللعبة اضغط F3+T'); } catch (e) { toast('ما قدرت أثبّت: ' + String(e.message || e).replace(/^Error invoking remote method '[^']+': (Error: )?/, ''), 'err'); }
    liveBusy = false; return;
  }
  try {
    const r = await api.pack.install(S.project, await buildExtras(), S.project.activate);
    toast(`انثبّت ✓ ${r.activated ? '— وتفعّل في اللعبة' : ''}<div class="dim small ltr" style="margin-top:3px">${esc(r.path)}</div>`, 'ok', { label: 'افتح المجلد', fn: () => api.fs.reveal(r.path) });
  } catch (e) { toast(String(e.message || e).replace(/^Error invoking remote method '[^']+': (Error: )?/, ''), 'err'); }
}

async function editPackIcon() {
  const b = await api.file.icon(S.project.id);
  openPixelEditor({
    title: 'أيقونة الباك (pack.png)', size: [128, 128], fileName: 'pack', image: b ? await IMG.fromB64(b) : null,
    onSave: async (img) => { await api.file.setIcon(S.project.id, IMG.toB64(img)); $('#picon').src = 'data:image/png;base64,' + IMG.toB64(img); toast('تغيّرت الأيقونة'); },
  });
}

// ---------- textures tab
function noBaseNotice() {
  const p = S.project;
  if (p.baseJar && p.baseApprox) return `<div class="notice info">${icon('cube', 22)}<div style="flex:1"><b>التكسترات الحين من نسخة ${esc(p.baseApprox)}</b><span class="muted small">ما لقيت ${esc(p.version)} بالضبط في ملفاتك. تبيها أصلية 100%؟ حمّلها من Mojang أو اختر مجلد الكلاينت.</span></div>
    <div class="row"><button class="btn sm primary" data-a="dljar">${icon('download', 15)} حمّل ${esc(p.version)}</button><button class="btn sm" data-a="pickclient">${icon('folder', 15)} مجلد الكلاينت</button></div></div>`;
  if (p.baseJar) return '';
  return `<div class="notice">${icon('cube', 22)}<div style="flex:1"><b>تكسترات ماينكرافت الأصلية مو محمّلة</b>
    <span class="muted small" style="line-height:1.7">اختر مجلد الكلاينت حقك (Lunar / Badlion / .minecraft) وأنا أطلّع منه التكسترات الأصلية، أو حمّلها من Mojang مباشرة.</span></div>
    <div class="row"><button class="btn sm primary" data-a="pickclient">${icon('folder', 15)} اختر مجلد الكلاينت</button><button class="btn sm" data-a="dljar">${icon('download', 15)} حمّل من Mojang</button><button class="btn sm ghost" data-a="pickjar">jar</button></div></div>`;
}
async function tabTextures(b) {
  const p = S.project, pf = p.packFormat;
  const files = new Set(await api.files.list(p.id));
  const avail = TEXTURES.filter((t) => texPath(t, pf));
  const known = new Set(avail.map((t) => 'assets/minecraft/' + texPath(t, pf)));
  const customFiles = [...files].filter((f) => f.endsWith('.png') && !known.has(f));
  const counts = {}; avail.forEach((t) => counts[t.cat] = (counts[t.cat] || 0) + 1); counts.custom = customFiles.length;
  b.innerHTML = `${noBaseNotice()}<div class="hotbar-wrap"><div class="hotbar" id="hb" title="معاينة الهوت بار بالتكسترات الحالية"></div></div>
    <div class="row" style="margin-bottom:16px"><div class="cats" style="margin:0;flex:1">${CATEGORIES.map((c) => `<button class="chip ${S.cat === c.id ? 'on' : ''}" data-cat="${c.id}">${icon(c.icon, 15)}${c.name}<span class="n">${counts[c.id] || 0}</span></button>`).join('')}</div>
      <button class="btn sm" data-a="merge">${icon('layers', 15)} دمج باكات</button><button class="btn sm" data-a="importpack">${icon('upload', 15)} استيراد باك جاهز</button></div>
    <div class="tex-grid" id="tg"></div>`;
  $$('[data-cat]', b).forEach((c) => c.onclick = () => { S.cat = c.dataset.cat; tabTextures(b); });
  drawHotbar($('#hb', b));
  bindBaseActions(b);
  $('[data-a=merge]', b).onclick = () => openMerge();
  $('[data-a=importpack]', b).onclick = async () => {
    const r = await api.pack.import(p.id); if (!r) return;
    if (r.description && !p.description) { p.description = r.description; await saveProject(); }
    toast(`انضاف ${r.count} ملف من "${esc(r.name)}"`); tabTextures(b);
  };
  const tg = $('#tg', b);
  let list;
  if (S.cat === 'custom') {
    list = customFiles.map((f) => ({ id: f, name: f.split('/').pop().replace('.png', ''), path: f.replace(/^assets\/minecraft\//, ''), size: [16, 16], full: f }));
    tg.innerHTML = `<div class="tex" id="addc" style="justify-content:center;align-items:center;border-style:dashed;color:var(--muted)"><div class="empty" style="padding:20px 0">${icon('plus', 26)}<div style="margin-top:8px">أضف أي تكستر بالمسار</div></div></div>`;
    $('#addc', b).onclick = addCustomTexture;
  } else {
    list = avail.filter((t) => t.cat === S.cat).map((t) => ({ ...t, path: texPath(t, pf) }));
    tg.innerHTML = '';
  }
  for (const t of list) {
    const el = document.createElement('div');
    el.className = 'tex';
    const isCustom = files.has('assets/minecraft/' + t.path);
    el.innerHTML = `<div class="pv"><span class="none">…</span></div><div class="nm">${esc(t.name)}</div>
      <div class="ft"><span class="badge ${isCustom ? 'acc' : ''}">${isCustom ? 'معدّل' : 'أصلي'}</span><span class="dim small ltr" title="${esc(t.path)}">${esc(t.path.split('/').pop())}</span></div>`;
    el.onclick = () => editTexture(t, () => tabTextures(b));
    tg.append(el);
    api.tex.get(p, t.path).then(async (r) => {
      const pv = $('.pv', el);
      if (!r) { pv.innerHTML = `<span class="none">${icon(p.baseJar ? 'pencil' : 'cube', 20)}${p.baseJar ? 'مو موجود بهالنسخة' : 'ملفات اللعبة مو محمّلة'}</span>`; return; }
      const img = await IMG.fromB64(r.data);
      pv.innerHTML = '';
      if (t.cat === 'skin') { const d = drawDoll(document.createElement('canvas'), IMG.toCanvas(img), { scale: 4, slim: /alex|slim/.test(t.id) }); d.style.width = 'auto'; pv.append(d); return; }
      const fh = img.height > img.width && img.height % img.width === 0 ? img.width : img.height;
      const c = document.createElement('canvas'); c.width = img.width; c.height = fh;
      c.getContext('2d').putImageData(img, 0, 0);
      pv.append(c);
    });
  }
  if (!list.length && S.cat !== 'custom') tg.innerHTML = `<div class="empty" style="grid-column:1/-1"><div class="big">${icon(CATEGORIES.find((c) => c.id === S.cat).icon, 30)}</div>${S.cat === 'totem' ? `التوتم انضاف في ماينكرافت 1.11 — نسخة ${esc(p.version)} ما فيها توتم. غيّر النسخة من إعدادات الباك.` : `ما فيه تكسترات بهالقسم لنسخة ${esc(p.version)}`}<div style="margin-top:14px"><button class="btn sm" onclick="S.tab='all';renderProject($('#main'))">${icon('layers', 15)} دوّر في كل الملفات</button></div></div>`;
}
function bindBaseActions(b) {
  const f = $('[data-a=findjar]', b), pk = $('[data-a=pickjar]', b), dl = $('[data-a=dljar]', b);
  if (dl) dl.onclick = async () => { const j = await ensureGameFiles(S.project.version, true); if (j) { S.project.baseJar = j; S.project.baseApprox = null; await saveProject(); render(); } };
  const pc = $('[data-a=pickclient]', b);
  if (pc) pc.onclick = async () => { if (await pickClientFiles()) { S.project.baseJar = null; S.project.baseApprox = null; if (await autoBase(S.project, false)) render(); else toast('لقيت ملفات بس مو لنسخة قريبة من ' + S.project.version, 'err'); } };
  if (f) f.onclick = async () => {
    const j = await api.jar.find(S.project.version);
    if (j.exact) { S.project.baseJar = j.exact.path; await saveProject(); toast('لقيت ملفات ' + S.project.version); render(); }
    else toast(j.all.length ? `ما لقيت ${S.project.version} بالضبط. النسخ الموجودة: ${j.all.map((x) => x.version).slice(0, 6).join('، ')}` : 'ما لقيت أي نسخة بمجلد .minecraft/versions', 'err');
  };
  if (pk) pk.onclick = async () => { const r = await api.fs.pickFiles('اختر ملف jar لماينكرافت', ['jar']); if (r) { S.project.baseJar = r[0]; S.project.baseApprox = null; await saveProject(); render(); } };
}
// asks how to start, then opens the editor
async function editTexture(t, after) {
  const p = S.project;
  const cur = await api.tex.get(p, t.path);
  const base = await api.tex.get(p, t.path, true);
  const curImg = cur ? await IMG.fromB64(cur.data) : null;
  const baseImg = base ? await IMG.fromB64(base.data) : null;
  const [w0, h0] = curImg ? [curImg.width, curImg.height] : t.size;
  const opt = (id, ic, title, desc, img) => `<button class="start-opt" data-s="${id}"><div class="so-pv">${img ? '<canvas></canvas>' : icon(ic, 34)}</div><b>${title}</b><span>${desc}</span></button>`;
  const m = modal({
    cls: 'lg', title: 'وش تبي تسوي بـ ' + esc(t.name) + '؟', sub: `<span class="ltr mono">${esc(t.path)}</span>`,
    body: `<div class="start-grid">
      ${curImg ? opt('cur', 'edit', cur.source === 'custom' ? 'عدّل على تعديلك' : 'عدّل على الموجود', cur.source === 'custom' ? 'كمّل من آخر شي سويته' : 'خذ شكل ماينكرافت الأصلي وعدّل عليه', curImg) : ''}
      ${cur && cur.source === 'custom' && baseImg ? opt('base', 'reset', 'ابدأ من الأصلي', 'ارجع لشكل ماينكرافت وعدّل من جديد', baseImg) : ''}
      ${opt('blank', 'pencil', 'من الصفر', 'كانفس فاضي وارسم بيدك', null)}
      ${opt('import', 'image', 'استورد تصميمك', 'صورة من جهازك (PNG / JPG)', null)}
    </div>
    <div class="row" id="szrow" style="margin-top:18px;display:none"><span class="muted">مقاس الرسم من الصفر:</span>
      <span class="seg" id="sz">${[1, 2, 4].map((k) => `<button data-k="${k}" ${k === 1 ? 'class="on"' : ''}>${w0 * k}×${h0 * k}${k > 1 ? ' HD' : ''}</button>`).join('')}</span>
      <button class="btn primary" id="szgo">${icon('pencil', 16)} ابدأ</button></div>
    ${!curImg && !p.baseJar ? `<div class="notice info" style="margin:18px 0 0">${icon('cube', 20)}<div style="flex:1"><b>تبي التكستر الأصلي حق ماينكرافت؟</b><span class="muted small">اختر مجلد الكلاينت أو حمّل ملفات اللعبة، وبيطلع لك الأصلي تعدّل عليه.</span></div><button class="btn sm primary" id="getclient">${icon('folder', 14)} مجلد الكلاينت</button><button class="btn sm" id="getgame">${icon('download', 14)} Mojang</button></div>` : ''}
    ${!curImg && p.baseJar ? `<div class="notice" style="margin:18px 0 0">${icon('cube', 20)}<div style="flex:1"><b>هذا التكستر مو موجود في ملفات ${esc(p.baseApprox || p.version)}</b><span class="muted small">يمكن الملف انضاف بنسخة ثانية أو اسمه مختلف. دوّر عليه في "كل الملفات".</span></div></div>` : ''}`,
  });
  const cvs = $$('.start-opt canvas', m.el);
  [curImg, cur && cur.source === 'custom' ? baseImg : null].filter(Boolean).forEach((im, i) => {
    if (!cvs[i]) return; const fh = im.height > im.width && im.height % im.width === 0 ? im.width : im.height;
    cvs[i].width = im.width; cvs[i].height = fh; cvs[i].getContext('2d').putImageData(im, 0, 0);
    if (t.cat === 'skin') { const d = drawDoll(cvs[i], IMG.toCanvas(im), { scale: 3 }); d.style.width = 'auto'; }
  });
  let k = 1;
  $$('#sz button', m.el).forEach((x) => x.onclick = () => { k = +x.dataset.k; $$('#sz button', m.el).forEach((y) => y.classList.toggle('on', y === x)); });
  $('#szgo', m.el).onclick = () => { m.close(true); openTexEditor(t, after, IMG.blank(w0 * k, h0 * k), cur); };
  if ($('#getgame', m.el)) $('#getgame', m.el).onclick = async () => { m.close(true); const j = await ensureGameFiles(p.version, true); if (j) { p.baseJar = j; p.baseApprox = null; await saveProject(); render(); editTexture(t, after); } };
  if ($('#getclient', m.el)) $('#getclient', m.el).onclick = async () => { m.close(true); if (await pickClientFiles() && await autoBase(S.project, false)) { render(); editTexture(t, after); } };
  $$('.start-opt', m.el).forEach((x) => x.onclick = async () => {
    const s2 = x.dataset.s;
    if (s2 === 'blank') { $('#szrow', m.el).style.display = ''; $$('.start-opt', m.el).forEach((y) => y.classList.toggle('on', y === x)); return; }
    if (s2 === 'import') {
      const f = await api.fs.pickFiles('اختر صورة', ['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp']); if (!f) return;
      const ext = f[0].split('.').pop().toLowerCase();
      const im = await IMG.load(`data:image/${ext === 'jpg' ? 'jpeg' : ext};base64,` + await api.fs.readB64(f[0]));
      // keep the picture's own resolution if it's bigger (HD), matching the texture's shape
      const ratio = w0 / h0; let w = Math.max(w0, Math.min(im.width, 512)); let h = Math.round(w / ratio);
      if (w0 === h0 && im.width !== im.height) { w = h = Math.max(w0, Math.min(Math.max(im.width, im.height), 512)); }
      m.close(true); openTexEditor(t, after, IMG.resize(im, w, h), cur); return;
    }
    m.close(true);
    openTexEditor(t, after, s2 === 'base' ? baseImg : curImg, cur);
  });
}
async function openTexEditor(t, after, startImg, cur) {
  const p = S.project;
  if ((t.cat === 'skin' || /entity\/(player\/|steve|alex)/.test(t.path)) && startImg && startImg.width === 64 && (startImg.height === 64 || startImg.height === 32)) {
    const im = startImg.height === 32 ? upgradeLegacySkin(startImg) : startImg;
    return openSkinPainter({ title: t.name, image: im, slim: /alex|slim/.test(t.path), onSave: async (img, slim) => { await api.tex.put(p.id, t.path, IMG.toB64(img)); toast('انحفظ: ' + esc(t.name)); after && after(); reveal3D(img, { skin: true, slim, title: t.name }); } });
  }
  const meta = await api.tex.getMeta(p, t.path);
  openPixelEditor({
    title: t.name, subtitle: `<span class="ltr mono">assets/minecraft/${esc(t.path)}</span>`, size: t.size,
    ...(t.cat === 'skin' || /entity\/(player\/|steve|alex)/.test(t.path) ? { extraTitle: 'شكل الشخصية', renderExtra: (box, full) => { box.innerHTML = ''; const sl = /alex|slim/.test(t.path); box.append(drawDoll(document.createElement('canvas'), full, { scale: 4, slim: sl }), drawDoll(document.createElement('canvas'), full, { scale: 4, back: true, slim: sl })); } } : {}),
    fileName: t.path.split('/').pop().replace('.png', ''),
    image: startImg, original: await (async () => { const r = await api.tex.get(p, t.path, true); return r ? IMG.fromB64(r.data) : null; })(),
    meta,
    usePreview: /^textures\/(item|items)\//.test(t.path) || /entity\/shield/.test(t.path) ? (img) => openUsePreview(t.path, img) : null,
    onSave: async (img, mt) => {
      await api.tex.put(p.id, t.path, IMG.toB64(img), mt);
      toast('انحفظ: ' + esc(t.name)); after && after();
      if (/^textures\/(item|items|block|blocks)\//.test(t.path)) reveal3D(img.height > img.width ? IMG.resize(IMG.toCanvas(img), img.width, img.width) : img, { title: t.name, use: /^textures\/(item|items)\//.test(t.path) ? () => openUsePreview(t.path, img) : null });
    },
    onReset: cur && cur.source === 'custom' ? async () => { await api.tex.reset(p.id, t.path); toast('رجع للأصلي'); after && after(); } : null,
  });
}


// find the real game textures for a pack: client files first, exact version preferred
async function autoBase(p, allowDownload) {
  if (p.baseJar && !p.baseApprox && await api.jar.valid(p.baseJar)) { await syncPackFormat(p); return true; }
  if (p.baseJar && !(await api.jar.valid(p.baseJar))) { p.baseJar = null; p.baseApprox = null; }
  let j = await api.jar.find(p.version);
  if (!j.exact) { const t = toastLoading('أدوّر على تكسترات ماينكرافت بملفات الكلاينتات...'); await api.game.scan(); t(); j = await api.jar.find(p.version); }
  let path = j.exact ? j.exact.path : null, approx = null;
  if (!path && allowDownload) path = await ensureGameFiles(p.version);
  if (!path && j.nearest) { path = j.nearest.path; approx = j.nearest.version; }
  if (!path) return false;
  p.baseJar = path; p.baseApprox = approx;
  if (S.project && S.project.id === p.id) { S.project = p; await saveProject(); } else await api.projects.save(p);
  await syncPackFormat(p);
  return true;
}
function toastLoading(msg) {
  const t = document.createElement('div'); t.className = 'toast'; t.innerHTML = `<div class="dl-ring" style="width:22px;height:22px"><div class="dl-cube" style="width:16px;height:16px"></div></div><span>${msg}</span>`;
  $('#toasts').append(t); return () => t.remove();
}
async function pickClientFiles() {
  const f = await api.fs.pickFolder('اختر مجلد الكلاينت (مثل .lunarclient أو .minecraft)');
  if (!f) return null;
  const done = toastLoading('أدوّر داخل المجلد على ملفات اللعبة...');
  api.onScanProgress((n) => {});
  const r = await api.game.scan(f); done();
  if (!r.inExtra.length) {
    const lunar = /lunarclient/i.test(f);
    const ok = await confirmBox(lunar ? 'Lunar ما يحفظ التكسترات بجهازك' : 'ما لقيت تكسترات بهذا المجلد',
      lunar ? 'Lunar يحمّل ملفات اللعبة وقت التشغيل وما يخليها بالجهاز، عشان كذا ما لقيت التكسترات الأصلية داخل مجلده.<br><br>أحمّلها لك الحين من سيرفرات Mojang الرسمية؟ (نفس التكسترات بالضبط، مرة وحدة بس)'
        : 'ما لقيت ملفات ماينكرافت داخل هذا المجلد. أحمّل التكسترات الأصلية من سيرفرات Mojang الرسمية؟', 'حمّل من Mojang');
    if (!ok) return null;
    const v = S.project ? S.project.version : VERSIONS[0].id;
    const j = await ensureGameFiles(v, true);
    if (j && S.project) { S.project.baseJar = j; S.project.baseApprox = null; await saveProject(); render(); }
    return null;
  }
  toast(`لقيت تكسترات: ${[...new Set(r.inExtra.map((x) => x.version))].join('، ')} ✓`);
  return r;
}

async function importShared() {
  try { const p = await api.proj.import(); if (!p) return; toast(`انفتح "${esc(p.name)}" ✓`); openProject(p.id, p); }
  catch (e) { toast(String(e.message || e).replace(/^Error invoking remote method '[^']+': (Error: )?/, ''), 'err'); }
}

// ------------------------------------------------------------- starter templates
const TEMPLATES = [
  ['blank', 'فاضي', 'file', 'تبدأ من تكسترات ماينكرافت الأصلية بدون أي تغيير'],
  ['pvp', 'PvP نظيف', 'sword', 'نار قصيرة، شيلد قصير، سيف صغير، كروس هير نقطة، زجاج شفاف'],
  ['bedwars', 'Bedwars', 'cube', 'زجاج شفاف، نار قصيرة، أدوات صغيرة، بدون قرعة'],
  ['fps', 'رؤية صافية', 'monitor', 'بدون تظليل وبدون قرعة، نار شفافة، زجاج شفاف'],
  ['dark', 'داكن', 'palette', 'واجهة داكنة بلون بنفسجي غامق مع نار بنفسجية'],
];
async function texImg(p, rel, baseOnly = true) { const r = await api.tex.get(p, rel, baseOnly) || (baseOnly ? await api.tex.get(p, rel) : null); return r ? IMG.fromB64(r.data) : null; }
async function applyQuickTweak(p, id) {
  const rel = id === 'glass' ? texPath(TEXTURES.find((t) => t.id === 'glass'), p.packFormat) : id === 'pumpkin' ? 'textures/misc/pumpkinblur.png' : 'textures/misc/vignette.png';
  const im = await texImg(p, rel);
  if (id === 'glass') { if (!im) return; const w = im.width, h = im.height; for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) im.data[(y * w + x) * 4 + 3] = 0; await api.tex.put(p.id, rel, IMG.toB64(im)); }
  else await api.tex.put(p.id, rel, IMG.toB64(IMG.blank(im ? im.width : 256, im ? im.height : 256)));
}
async function applyCross(p, o) {
  const im = crossImg(o); p.cross = o;
  if (p.packFormat >= 18) return api.tex.put(p.id, 'textures/gui/sprites/hud/crosshair.png', IMG.toB64(im));
}
async function applyTint(p, cats, color, strength = 0.7) {
  for (const t of TEXTURES.filter((t) => cats.includes(t.cat) && texPath(t, p.packFormat))) {
    const rel = texPath(t, p.packFormat); const im = await texImg(p, rel); if (!im) continue;
    await api.tex.put(p.id, rel, IMG.toB64(IMG.tint(im, color, strength, true)), im.height > im.width ? await api.tex.getMeta(p, rel) : null);
  }
}
async function applyTemplate(p, tpl) {
  if (!tpl || tpl === 'blank' || !p.baseJar) return;
  const done = toastLoading('أجهّز القالب...');
  try {
    if (tpl === 'pvp') {
      await applyFire(p, { lower: 0.5, opacity: 1, useTint: false });
      p.shield = { enabled: true, lower: 6, blockLower: 5, scale: 0.9 };
      p.held = Object.assign({}, HELD_DEF, { on: true, hLower: 2.5, hScale: 0.85 });
      await applyCross(p, { style: 'dot', size: 2, thick: 1, gap: 0, color: '#ffffff', outline: true, dot: true });
      await applyQuickTweak(p, 'glass');
    } else if (tpl === 'bedwars') {
      await applyQuickTweak(p, 'glass'); await applyQuickTweak(p, 'pumpkin');
      await applyFire(p, { lower: 0.45, opacity: 1, useTint: false });
      p.held = Object.assign({}, HELD_DEF, { on: true, hLower: 3, hScale: 0.8, gOn: true, gLower: 2, gScale: 0.8 });
    } else if (tpl === 'fps') {
      await applyQuickTweak(p, 'vignette'); await applyQuickTweak(p, 'pumpkin'); await applyQuickTweak(p, 'glass');
      await applyFire(p, { lower: 0.55, opacity: 0.5, useTint: false });
    } else if (tpl === 'dark') {
      await applyTint(p, ['gui'], '#3b2a5c', 0.75);
      await applyFire(p, { lower: 0.4, opacity: 1, useTint: true, tint: '#7c3aed' });
    }
    await saveProject();
    toast('جهز القالب ✓');
  } finally { done(); }
}
// ------------------------------------------------------------- official game files
async function ensureGameFiles(version, force) {
  const st = await api.game.status([version]);
  if (st[0].downloaded && !force) return (await api.jar.find(version)).exact?.path;
  const m = modal({ title: 'تحميل ملفات ماينكرافت ' + esc(version), body: `<div class="stack" style="align-items:center;text-align:center;padding:10px 0">
      <div class="dl-ring"><div class="dl-cube">${icon('cube', 34)}</div></div>
      <b id="dlt">قاعد أتصل بسيرفرات Mojang...</b>
      <div class="bar"><i id="dlb"></i></div><span class="muted small ltr" id="dls"></span>
      <span class="dim small">الملفات تنحمّل من Mojang الرسمي (نفس اللانشر). نحتاجها عشان التكسترات تطلع بشكلها الأصلي.</span></div>` });
  api.onGameProgress((d) => {
    if (d.version !== version) return;
    const pct = d.total ? Math.round(d.got / d.total * 100) : 0;
    $('#dlb', m.el) && ($('#dlb', m.el).style.width = (d.stage === 'meta' ? 4 : pct) + '%');
    if (d.stage === 'jar') { $('#dlt', m.el).textContent = `قاعد أحمّل... ${pct}%`; $('#dls', m.el).textContent = `${(d.got / 1048576).toFixed(1)} / ${(d.total / 1048576).toFixed(1)} MB`; }
  });
  try {
    const path = await api.game.download(version);
    m.close(true); toast(`تحمّلت ملفات ${esc(version)} ✓`);
    if (S.project && S.project.version === version) { S.project.baseJar = path; await saveProject(); }
    return path;
  } catch (e) {
    const msg = String(e.message || e).replace(/^Error invoking remote method '[^']+': (Error: )?/, '');
    $('.modal-b', m.el).innerHTML = `<div class="empty" style="padding:20px"><div class="big" style="color:var(--err)">${icon('x', 30)}</div><b>ما قدرت أحمّل الملفات</b><p class="muted small ltr">${esc(msg)}</p><p class="muted small">تأكد إن النت شغال وجرب مرة ثانية، أو اختر ملف jar من جهازك.</p>
      <div class="row" style="justify-content:center"><button class="btn primary" id="retry">${icon('reset', 16)} جرّب مرة ثانية</button><button class="btn" id="pj">${icon('folder', 16)} اختر jar</button></div></div>`;
    return new Promise((res) => {
      $('#retry', m.el).onclick = async () => { m.close(true); res(await ensureGameFiles(version, force)); };
      $('#pj', m.el).onclick = async () => { const r = await api.fs.pickFiles('اختر ملف jar لماينكرافت', ['jar']); m.close(true); if (r && S.project) { S.project.baseJar = r[0]; await saveProject(); } res(r ? r[0] : null); };
    });
  }
}
function addCustomTexture() {
  const pf = S.project.packFormat;
  const ex = pf <= 3 ? 'textures/items/stick.png' : 'textures/item/stick.png';
  const m = modal({ title: 'أضف تكستر بالمسار', body: `<div class="stack">
    <label class="f">المسار داخل assets/minecraft/<input class="inp mono" id="cp" placeholder="${ex}" value="${ex}"></label>
    <div class="grid" style="grid-template-columns:1fr 1fr"><label class="f">العرض<input class="inp" id="cw" type="number" value="16"></label><label class="f">الطول<input class="inp" id="ch" type="number" value="16"></label></div>
    <span class="muted small">إذا الملف موجود في ملفات الفانيلا بيفتح هو، غير كذا بيفتح كانفس فاضي بالمقاس.</span></div>`,
    foot: `<button class="btn primary" id="go">${icon('pencil', 16)} افتح بالمحرر</button>` });
  $('#go', m.el).onclick = () => {
    let path = $('#cp', m.el).value.trim().replace(/^\/+/, '').replace(/^assets\/minecraft\//, '');
    if (!path.endsWith('.png')) path += '.png';
    m.close(true);
    editTexture({ name: path.split('/').pop(), path, size: [+$('#cw', m.el).value || 16, +$('#ch', m.el).value || 16] }, () => renderTab());
  };
}


// in-game style hotbar with the pack's current textures
async function drawHotbar(el) {
  const p = S.project;
  const items = [['diamond_sword'], ['bow'], ['ender_pearl', 16], ['golden_apple', 8], ['fishing_rod'], ['cooked_beef', 64], ['lava_bucket'], ['water_bucket'], ['white_wool', 64]];
  el.innerHTML = items.map((_, i) => `<div class="slot ${i === 0 ? 'sel' : ''}"></div>`).join('');
  const slots = $$('.slot', el);
  items.forEach(async ([id, n], i) => {
    const t = TEXTURES.find((x) => x.id === id); const path = t && texPath(t, p.packFormat); if (!path) return;
    const r = await api.tex.get(p, path); if (!r) return;
    const im = await IMG.fromB64(r.data); const c = document.createElement('canvas'); c.width = im.width; c.height = Math.min(im.width, im.height);
    c.getContext('2d').putImageData(im, 0, 0); slots[i].append(c);
    if (n) slots[i].insertAdjacentHTML('beforeend', `<span class="n">${n}</span>`);
  });
  slots.forEach((sl) => sl.onclick = () => { slots.forEach((x) => x.classList.remove('sel')); sl.classList.add('sel'); });
}

// ---------- PvP tweaks
function crossImg(o) {
  const N = 15, c = 7, img = new ImageData(N, N), [r, g, b] = IMG.hex2rgb(o.color);
  const on = new Set(); const put = (x, y) => { if (x >= 0 && y >= 0 && x < N && y < N) on.add(y * N + x); };
  const th = []; for (let k = -(o.thick - 1) / 2; k <= (o.thick - 1) / 2; k++) th.push(k);
  const from = o.gap + 1, to = o.gap + o.size;
  if (o.style === 'plus' || o.style === 't') for (let d = from; d <= to; d++) for (const k of th) { put(c + d, c + k); put(c - d, c + k); put(c + k, c + d); if (o.style === 'plus') put(c + k, c - d); }
  if (o.style === 'x') for (let d = from; d <= to; d++) for (const k of th) { put(c + d + k, c + d); put(c - d + k, c - d); put(c + d + k, c - d); put(c - d + k, c + d); }
  if (o.style === 'circle') { const R = o.gap + o.size / 2 + 1; for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (Math.abs(Math.hypot(x - c, y - c) - R) < o.thick * 0.5 + 0.15) put(x, y); }
  if (o.style === 'square') { const h = Math.min(7, o.gap + Math.ceil(o.size / 2) + 1); for (let i = -h; i <= h; i++) { put(c + i, c - h); put(c + i, c + h); put(c - h, c + i); put(c + h, c + i); } }
  if (o.style === 'dot' || o.dot) for (const k of th) for (const q of th) put(c + k, c + q);
  for (const i of on) { img.data.set([r, g, b, 255], i * 4); }
  if (o.outline) for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const i = y * N + x; if (on.has(i)) continue;
    if ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b2]) => on.has((y + b2) * N + x + a) && x + a >= 0 && x + a < N)) img.data.set([0, 0, 0, 255], i * 4);
  }
  return img;
}
async function tabTweaks(b) {
  const p = S.project, pf = p.packFormat;
  const cx = p.cross || { style: 'plus', size: 4, thick: 1, gap: 1, color: '#ffffff', outline: false, dot: false };
  const files = new Set(await api.files.list(p.id));
  const has = (rel) => rel && files.has('assets/minecraft/' + rel);
  const glassP = texPath(TEXTURES.find((t) => t.id === 'glass'), pf);
  const tw = [
    ['glass', 'cube', 'زجاج شفاف (Clear Glass)', 'يشيل الخطوط من نص الزجاج ويخلي الإطار بس — رؤية أوضح ببدواز', glassP],
    ['pumpkin', 'monitor', 'بدون قرعة على الشاشة', 'لو لبست قرعة ما تتغطى الشاشة', 'textures/misc/pumpkinblur.png'],
    ['vignette', 'sun', 'بدون تظليل أطراف الشاشة (Vignette)', 'شاشة أصفى بدون الظل اللي على الأطراف', 'textures/misc/vignette.png'],
  ];
  b.innerHTML = `${noBaseNotice()}<div class="two" style="grid-template-columns:400px 1fr">
    <div class="card stack"><h3 style="margin:0">${icon('cross', 18)} مصمم الكروس هير</h3>
      <div class="seg" id="cst" style="flex-wrap:wrap">${[['plus', '+'], ['t', 'T'], ['x', '×'], ['dot', '•'], ['circle', '○'], ['square', '□']].map(([k, l]) => `<button data-s="${k}" style="font-size:17px;min-width:44px">${l}</button>`).join('')}</div>
      <div><div class="slider-row" style="grid-template-columns:70px 1fr 30px"><span>الطول</span><input type="range" id="csz" min="1" max="6" value="${cx.size}"><output class="ltr"></output></div>
      <div class="slider-row" style="grid-template-columns:70px 1fr 30px"><span>السماكة</span><input type="range" id="cth" min="1" max="3" step="2" value="${cx.thick}"><output class="ltr"></output></div>
      <div class="slider-row" style="grid-template-columns:70px 1fr 30px"><span>الفراغ</span><input type="range" id="cgp" min="0" max="4" value="${cx.gap}"><output class="ltr"></output></div></div>
      <div class="row"><input type="color" id="ccl" value="${cx.color}"><label class="check"><span class="switch"><input type="checkbox" id="col" ${cx.outline ? 'checked' : ''}><span></span></span>إطار أسود</label><label class="check"><span class="switch"><input type="checkbox" id="cdt" ${cx.dot ? 'checked' : ''}><span></span></span>نقطة بالنص</label></div>
      <div class="row"><button class="btn primary" id="capply">${icon('check', 16)} طبّق الكروس هير</button><button class="btn ghost" id="creset">${icon('reset', 16)} الأصلي</button></div>
      <span class="dim small" style="line-height:1.7">ملاحظة: ماينكرافت يعكس لون الكروس هير حسب الخلفية، فالأبيض أوضح شي.</span></div>
    <div class="stack"><div class="cross-prev"><canvas id="cpv"></canvas></div>
      <h3 style="margin:8px 0 0">${icon('wand', 18)} تحسينات بضغطة</h3>
      ${tw.map(([id, ic, t, d, rel]) => rel ? `<div class="tweak"><div class="ti">${icon(ic, 22)}</div><div class="tx"><b>${t}</b><span>${d}</span></div>
        ${has(rel) ? `<span class="badge acc">مفعّل</span><button class="btn sm ghost" data-off="${id}">${icon('reset', 14)} إلغاء</button>` : `<button class="btn sm primary" data-on="${id}">${icon('check', 14)} فعّل</button>`}</div>` : '').join('')}
      <div class="tweak"><div class="ti">${icon('fire', 22)}</div><div class="tx"><b>نار قصيرة</b><span>من صفحة النار</span></div><button class="btn sm" data-go="fire">افتح</button></div>
      ${pf >= 2 ? `<div class="tweak"><div class="ti">${icon('shield', 22)}</div><div class="tx"><b>شيلد قصير</b><span>من صفحة الشيلد</span></div><button class="btn sm" data-go="shield">افتح</button></div>` : ''}
    </div></div>`;
  bindBaseActions(b);
  const cur = () => ({ style: $('#cst .on', b)?.dataset.s || cx.style, size: +$('#csz', b).value, thick: +$('#cth', b).value, gap: +$('#cgp', b).value, color: $('#ccl', b).value, outline: $('#col', b).checked, dot: $('#cdt', b).checked });
  const draw = () => {
    $$('.slider-row output', b).forEach((o) => o.textContent = o.previousElementSibling.value);
    const cv = $('#cpv', b), z = 14, im = crossImg(cur()); cv.width = 15 * z; cv.height = 15 * z;
    const x = cv.getContext('2d'); x.imageSmoothingEnabled = false; x.drawImage(IMG.toCanvas(im), 0, 0, 15 * z, 15 * z);
  };
  $$('#cst button', b).forEach((x) => { x.classList.toggle('on', x.dataset.s === cx.style); x.onclick = () => { $$('#cst button', b).forEach((y) => y.classList.toggle('on', y === x)); draw(); }; });
  ['csz', 'cth', 'cgp', 'ccl', 'col', 'cdt'].forEach((id) => $('#' + id, b).oninput = draw);
  draw();
  $('#capply', b).onclick = async () => {
    const o = cur(); p.cross = o; await saveProject(); const im = crossImg(o);
    if (pf >= 18) { await api.tex.put(p.id, 'textures/gui/sprites/hud/crosshair.png', IMG.toB64(im)); }
    else {
      const r = await api.tex.get(p, 'textures/gui/icons.png'); if (!r) return toast('نحتاج ملفات اللعبة عشان نعدّل icons.png', 'err');
      const sheet = await IMG.fromB64(r.data); const k = sheet.width / 256;
      const c = IMG.toCanvas(sheet), x = c.getContext('2d'); x.imageSmoothingEnabled = false;
      x.clearRect(0, 0, 16 * k, 16 * k); x.drawImage(IMG.toCanvas(im), 0, 0, 15 * k, 15 * k);
      await api.tex.put(p.id, 'textures/gui/icons.png', c.toDataURL('image/png').split(',')[1]);
    }
    toast('تغيّر الكروس هير ✓');
  };
  $('#creset', b).onclick = async () => { await api.tex.reset(p.id, pf >= 18 ? 'textures/gui/sprites/hud/crosshair.png' : 'textures/gui/icons.png'); toast('رجع الأصلي (لو عدّلت icons.png بيدك برضو رجع)'); };
  const relOf = (id) => tw.find((x) => x[0] === id)[4];
  $$('[data-on]', b).forEach((x) => x.onclick = async () => {
    const id = x.dataset.on, rel = relOf(id);
    if (id === 'glass') {
      const r = await api.tex.get(p, rel, true); if (!r) return toast('نحتاج ملفات اللعبة للزجاج', 'err');
      const im = await IMG.fromB64(r.data); const w = im.width, h = im.height;
      for (let y = 1; y < h - 1; y++) for (let x2 = 1; x2 < w - 1; x2++) im.data[(y * w + x2) * 4 + 3] = 0;
      await api.tex.put(p.id, rel, IMG.toB64(im));
    } else { const r = await api.tex.get(p, rel, true); const im = r ? await IMG.fromB64(r.data) : null; await api.tex.put(p.id, rel, IMG.toB64(IMG.blank(im ? im.width : 256, im ? im.height : 256))); }
    toast('تفعّل ✓'); tabTweaks(b);
  });
  $$('[data-off]', b).forEach((x) => x.onclick = async () => { await api.tex.reset(p.id, relOf(x.dataset.off)); tabTweaks(b); });
  $$('[data-go]', b).forEach((x) => x.onclick = () => { S.tab = x.dataset.go; renderProject($('#main')); });
}


// ---------- custom sky (OptiFine Custom Sky format — Lunar / Badlion / Feather / OptiFine)
// layout of the sky texture (3 x 2 cells): top row = bottom, top, back(south) | bottom row = left(west), front(north), right(east)
const SKY_FACES = [
  ['front', 'قدام', 4], ['back', 'ورا', 2], ['right', 'يمين', 5], ['left', 'يسار', 3], ['top', 'فوق', 1], ['bottom', 'تحت', 0],
];
const SKY_PNG = 'optifine/sky/world0/sky1.png', SKY_PROPS = 'assets/minecraft/optifine/sky/world0/sky1.properties';
async function tabSky(b) {
  const p = S.project;
  const st = p.sky || { size: 512, rotate: false, blend: false };
  const faces = {}; // id -> canvas
  // load existing sky back into faces
  const ex = await api.tex.get(p, SKY_PNG);
  if (ex) {
    const im = IMG.toCanvas(await IMG.fromB64(ex.data)); const n = im.width / 3;
    for (const [id, , cell] of SKY_FACES) { const c = document.createElement('canvas'); c.width = c.height = n; c.getContext('2d').drawImage(im, (cell % 3) * n, Math.floor(cell / 3) * n, n, n, 0, 0, n, n); if (!isEmpty(c)) faces[id] = c; }
  }
  function isEmpty(c) { const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; for (let i = 3; i < d.length; i += 64) if (d[i]) return false; return true; }
  b.innerHTML = `<div class="notice info">${icon('sun', 22)}<div style="flex:1"><b>سما مخصصة بصورك</b><span class="muted small" style="line-height:1.7">حط صورة لكل جهة. تشتغل في Lunar و Badlion و Feather وأي نسخة فيها OptiFine (فعّل "Custom Sky" من إعدادات الكلاينت). الماينكرافت الأصلي بدون OptiFine ما يدعمها.</span></div></div>
    <div class="sky-wrap"><div class="stack">
      <div class="sky-view" id="sv"><div class="sky-cube" id="cube">${SKY_FACES.map(([id, l]) => `<div class="sky-face" data-f="${id}">${l}</div>`).join('')}</div>
        <span class="badge dark sky-hint">${icon('reset', 12)} اسحب بالماوس عشان تلف وتشوف السما</span></div>
      <div class="row"><span class="seg" id="look">${SKY_FACES.map(([id, l]) => `<button data-l="${id}">${l}</button>`).join('')}</span></div></div>
    <div class="card stack"><h3 style="margin:0">${icon('image', 18)} صور السما</h3>
      <div class="faces">${[['top', 1, 2], ['left', 2, 1], ['front', 2, 2], ['right', 2, 3], ['back', 2, 4], ['bottom', 3, 2]].map(([id, r, c]) => { const l = SKY_FACES.find((f) => f[0] === id)[1]; return `<div class="face" data-face="${id}" style="grid-row:${r};grid-column:${c}"><div class="ad">${icon('plus', 20)}أضف</div><span class="lb">${l}</span><button class="rm" title="شيل">${icon('x', 14)}</button></div>`; }).join('')}</div>
      <div class="row"><button class="btn sm" id="sall">${icon('copy', 15)} صورة وحدة لكل الجهات</button><button class="btn sm" id="spano">${icon('image', 15)} صورة بانوراما (تتقسم 4)</button></div>
      <div class="slider-row" style="grid-template-columns:90px 1fr 60px;margin:0"><span>دقة كل جهة</span><select class="inp" id="ssz" style="height:36px;grid-column:span 2">${[256, 512, 1024].map((n) => `<option value="${n}" ${st.size === n ? 'selected' : ''}>${n}×${n}${n === 1024 ? ' (ثقيلة)' : ''}</option>`).join('')}</select></div>
      <label class="check"><span class="switch"><input type="checkbox" id="srot" ${st.rotate ? 'checked' : ''}><span></span></span>السما تلف مع الوقت (زي الشمس)</label>
      <label class="check"><span class="switch"><input type="checkbox" id="sbl" ${st.blend ? 'checked' : ''}><span></span></span>ادمجها مع ألوان سما اللعبة (تصير أفتح)</label>
      <div class="row"><button class="btn primary" id="sapply">${icon('check', 16)} احفظ السما في الباك</button><button class="btn ghost danger" id="sdel">${icon('trash', 16)} شيل السما</button></div>
    </div></div>`;
  const view = $('#sv', b), cube = $('#cube', b);
  let yaw = 0, pitch = 0;
  const faceTf = { front: 'translateZ(-500px)', back: 'rotateY(180deg) translateZ(-500px)', right: 'rotateY(-90deg) translateZ(-500px)', left: 'rotateY(90deg) translateZ(-500px)', top: 'rotateX(-90deg) translateZ(-500px)', bottom: 'rotateX(90deg) translateZ(-500px)' };
  $$('.sky-face', b).forEach((f) => f.style.transform = faceTf[f.dataset.f]);
  const place = () => { cube.style.transform = `translateZ(340px) rotateX(${pitch}deg) rotateY(${yaw}deg)`; };
  place();
  let drag = null;
  view.onpointerdown = (e) => { drag = [e.clientX, e.clientY, yaw, pitch]; view.setPointerCapture(e.pointerId); };
  view.onpointermove = (e) => { if (!drag) return; yaw = drag[2] + (e.clientX - drag[0]) * 0.3; pitch = Math.max(-89, Math.min(89, drag[3] - (e.clientY - drag[1]) * 0.3)); cube.style.transition = 'none'; place(); };
  view.onpointerup = () => { drag = null; };
  const looks = { front: [0, 0], right: [90, 0], back: [180, 0], left: [-90, 0], top: [0, 89], bottom: [0, -89] };
  $$('#look button', b).forEach((x) => x.onclick = () => { [yaw, pitch] = looks[x.dataset.l]; cube.style.transition = 'transform .5s'; place(); });
  function refresh() {
    for (const [id] of SKY_FACES) {
      const url = faces[id] ? faces[id].toDataURL() : '';
      const f3 = $(`.sky-face[data-f="${id}"]`, b); f3.style.backgroundImage = url ? `url(${url})` : ''; f3.textContent = url ? '' : SKY_FACES.find((x) => x[0] === id)[1];
      const tile = $(`.face[data-face="${id}"]`, b); tile.classList.toggle('has', !!url); tile.style.backgroundImage = url ? `url(${url})` : ''; $('.ad', tile).style.display = url ? 'none' : '';
    }
  }
  const toFace = (img, sx = 0, sy = 0, sw = img.width, sh = img.height) => {
    const n = +$('#ssz', b).value; const c = document.createElement('canvas'); c.width = c.height = n; const x = c.getContext('2d'); x.imageSmoothingQuality = 'high';
    const s = Math.min(sw, sh); x.drawImage(img, sx + (sw - s) / 2, sy + (sh - s) / 2, s, s, 0, 0, n, n); return c;
  };
  const pickImg = async (title) => { const f = await api.fs.pickFiles(title, ['png', 'jpg', 'jpeg', 'webp', 'bmp']); if (!f) return null; const ext = f[0].split('.').pop().toLowerCase(); return IMG.load(`data:image/${ext === 'jpg' ? 'jpeg' : ext};base64,` + await api.fs.readB64(f[0])); };
  $$('.face', b).forEach((tile) => tile.onclick = async (e) => {
    const id = tile.dataset.face;
    if (e.target.closest('.rm')) { delete faces[id]; refresh(); return; }
    const im = await pickImg('صورة ' + SKY_FACES.find((x) => x[0] === id)[1]); if (!im) return;
    faces[id] = toFace(im); refresh(); [yaw, pitch] = looks[id]; cube.style.transition = 'transform .5s'; place();
  });
  $('#sall', b).onclick = async () => { const im = await pickImg('صورة لكل الجهات'); if (!im) return; for (const [id] of SKY_FACES) faces[id] = toFace(im); refresh(); };
  $('#spano', b).onclick = async () => {
    const im = await pickImg('صورة بانوراما عريضة'); if (!im) return;
    const w = im.width / 4; ['front', 'right', 'back', 'left'].forEach((id, i) => faces[id] = toFace(im, i * w, 0, w, im.height)); refresh();
    toast('انقسمت الصورة على قدام، يمين، ورا، يسار');
  };
  refresh();
  $('#sapply', b).onclick = async () => {
    if (!Object.keys(faces).length) return toast('حط صورة وحدة على الأقل', 'err');
    const n = +$('#ssz', b).value; const c = document.createElement('canvas'); c.width = n * 3; c.height = n * 2; const x = c.getContext('2d');
    for (const [id, , cell] of SKY_FACES) if (faces[id]) x.drawImage(faces[id], (cell % 3) * n, Math.floor(cell / 3) * n, n, n);
    p.sky = { size: n, rotate: $('#srot', b).checked, blend: $('#sbl', b).checked }; await saveProject();
    await api.tex.put(p.id, SKY_PNG, c.toDataURL('image/png').split(',')[1]);
    await api.file.putRaw(p.id, SKY_PROPS, `# made with MC Pack Studio\nsource=./sky1.png\nblend=${p.sky.blend ? 'add' : 'alpha'}\nrotate=${p.sky.rotate}\n`);
    toast('انحفظت السما ✓ ثبّت الباك وفعّل Custom Sky في الكلاينت');
  };
  $('#sdel', b).onclick = async () => { await api.tex.reset(p.id, SKY_PNG); await api.file.remove(p.id, SKY_PROPS); for (const k in faces) delete faces[k]; refresh(); toast('انشالت السما'); };
}


// ---------- sounds
const SND_QUICK = [
  ['hit', 'صوت الضربة', 'sword', [/^sounds\/damage\/hit\d\.ogg$/]],
  ['orb', 'صوت XP', 'star', [/^sounds\/random\/orb\.ogg$/]],
  ['arrowhit', 'السهم لما يصيب لاعب', 'bow', [/^sounds\/random\/successful_hit\.ogg$/]],
  ['bow', 'رمي السهم', 'bow', [/^sounds\/random\/bow\.ogg$/]],
  ['bowhit', 'السهم لما يطيح', 'bow', [/^sounds\/random\/bowhit\d\.ogg$/]],
  ['pearl', 'الإندر بيرل', 'cube', [/^sounds\/mob\/endermen\/portal2?\.ogg$/]],
  ['eat', 'الأكل', 'star', [/^sounds\/random\/eat\d\.ogg$/, /^sounds\/random\/burp\.ogg$/]],
  ['break', 'انكسار الأداة', 'x', [/^sounds\/random\/break\.ogg$/]],
  ['explode', 'الانفجار / TNT', 'fire', [/^sounds\/random\/explode\d\.ogg$/]],
  ['levelup', 'ليفل أب', 'star', [/^sounds\/random\/levelup\.ogg$/]],
  ['click', 'ضغطة الأزرار', 'check', [/^sounds\/random\/click\.ogg$/, /^sounds\/random\/wood_click\.ogg$/]],
  ['totem', 'التوتم', 'totem', [/^sounds\/item\/totem\/use_totem\.ogg$/]],
  ['elytra', 'الإليترا', 'wand', [/^sounds\/item\/elytra\/elytra_loop\.ogg$/]],
  ['glass', 'كسر الزجاج', 'cube', [/^sounds\/random\/glass\d\.ogg$/]],
  ['anvil', 'السندان', 'cube', [/^sounds\/random\/anvil_land\.ogg$/]],
  ['door', 'الباب', 'cube', [/^sounds\/random\/door_(open|close)\.ogg$/, /^sounds\/block\/wooden_door\/(open|close)\d?\.ogg$/]],
];
let curAudio = null;
function playB64(b64, btn) {
  if (curAudio) { curAudio.pause(); if (curAudio._btn) { curAudio._btn.classList.remove('on'); curAudio._btn.innerHTML = icon('play', 14); } if (curAudio._btn === btn) { curAudio = null; return; } }
  const url = URL.createObjectURL(new Blob([Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))], { type: 'audio/ogg' }));
  const a = new Audio(url); a._btn = btn; curAudio = a;
  if (btn) { btn.classList.add('on'); btn.innerHTML = icon('pause', 14); }
  a.onended = () => { if (btn) { btn.classList.remove('on'); btn.innerHTML = icon('play', 14); } curAudio = null; URL.revokeObjectURL(url); };
  a.play().catch(() => toast('ما قدرت أشغّل الصوت', 'err'));
}
async function oggEncoder() {
  if (!window.__oggEnc) window.__oggEnc = await WasmMediaEncoder.createEncoder('audio/ogg', Uint8Array.from(atob(window.OGG_WASM_B64), (c) => c.charCodeAt(0)));
  return window.__oggEnc;
}
async function encodeOgg(buf, { start = 0, end = buf.duration, volume = 1, mono = true } = {}) {
  const enc = await oggEncoder(); const sr = buf.sampleRate;
  const s0 = Math.max(0, Math.floor(start * sr)), s1 = Math.min(buf.length, Math.floor(end * sr)), n = Math.max(1, s1 - s0);
  const ch = mono ? 1 : Math.min(2, buf.numberOfChannels);
  const src = Array.from({ length: buf.numberOfChannels }, (_, i) => buf.getChannelData(i).subarray(s0, s1));
  const outCh = [];
  if (mono) { const m = new Float32Array(n); for (const c of src) for (let i = 0; i < n; i++) m[i] += c[i] / src.length; outCh.push(m); }
  else for (let i = 0; i < ch; i++) outCh.push(Float32Array.from(src[Math.min(i, src.length - 1)]));
  // volume + short fades to avoid clicks
  const fade = Math.min(Math.floor(sr * 0.008), Math.floor(n / 4));
  for (const c of outCh) for (let i = 0; i < n; i++) { let g = volume; if (i < fade) g *= i / fade; if (i > n - fade) g *= (n - i) / fade; c[i] = Math.max(-1, Math.min(1, c[i] * g)); }
  enc.configure({ sampleRate: sr, channels: ch, vbrQuality: 5 });
  const parts = []; let total = 0;
  for (let i = 0; i < n; i += 8192) { const d = enc.encode(outCh.map((c) => c.subarray(i, Math.min(n, i + 8192)))); parts.push(d.slice()); total += d.length; }
  const last = enc.finalize(); parts.push(last.slice()); total += last.length;
  const out = new Uint8Array(total); let o = 0; for (const p of parts) { out.set(p, o); o += p.length; }
  return out;
}
async function replaceSoundDialog(targets, title, after) {
  const f = await api.fs.pickFiles('اختر صوت (MP3 / WAV / OGG / M4A)', ['mp3', 'wav', 'ogg', 'm4a', 'flac', 'aac', 'webm', 'opus']);
  if (!f) return;
  const ab = Uint8Array.from(atob(await api.fs.readB64(f[0])), (c) => c.charCodeAt(0)).buffer;
  let buf;
  try { buf = await new AudioContext().decodeAudioData(ab); } catch { return toast('ما قدرت أقرأ ملف الصوت هذا', 'err'); }
  const dur = buf.duration;
  const m = modal({ title: 'استبدال: ' + esc(title), sub: `<span class="ltr">${esc(f[0].split(/[\\/]/).pop())}</span> · ${dur.toFixed(2)} ثانية`,
    body: `<div class="stack ltr-range"><canvas class="wave" id="wv"></canvas>
      <div class="slider-row" style="grid-template-columns:90px 1fr 60px"><span>البداية</span><input type="range" id="ws" min="0" max="${dur}" step="0.01" value="0"><output class="ltr"></output></div>
      <div class="slider-row" style="grid-template-columns:90px 1fr 60px"><span>النهاية</span><input type="range" id="we" min="0" max="${dur}" step="0.01" value="${Math.min(dur, 5).toFixed(2)}"><output class="ltr"></output></div>
      <div class="slider-row" style="grid-template-columns:90px 1fr 60px"><span>الصوت</span><input type="range" id="wvol" min="0" max="200" value="100"><output class="ltr"></output></div>
      <label class="check"><span class="switch"><input type="checkbox" id="wmono" checked><span></span></span>ستيريو → مونو (عشان الصوت يجي من مكانه باللعبة)</label>
      ${targets.length > 1 ? `<div class="muted small">بيتبدّل ${targets.length} ملف: <span class="ltr">${targets.slice(0, 4).map(esc).join(', ')}${targets.length > 4 ? '…' : ''}</span></div>` : ''}</div>`,
    foot: `<button class="btn primary" id="wsave">${icon('check', 16)} احفظ الصوت</button><button class="btn" id="wplay">${icon('play', 16)} اسمع</button><span class="spacer"></span><span class="muted small">يتحوّل تلقائياً لـ OGG (الصيغة اللي تقبلها ماينكرافت)</span>` });
  const cv = $('#wv', m.el), ctx = cv.getContext('2d');
  const draw = () => {
    const w = cv.width = cv.clientWidth * 2, h = cv.height = 220, d = buf.getChannelData(0), st = +$('#ws', m.el).value, en = +$('#we', m.el).value;
    ctx.clearRect(0, 0, w, h); const a1 = getComputedStyle(document.documentElement).getPropertyValue('--a1').trim() || '#8b5cf6';
    ctx.fillStyle = 'rgba(255,255,255,.06)'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = a1 + '33'; ctx.fillRect(st / dur * w, 0, (en - st) / dur * w, h);
    ctx.fillStyle = a1; const step = Math.max(1, Math.floor(d.length / w));
    for (let x = 0; x < w; x++) { let mx = 0; for (let i = x * step; i < (x + 1) * step && i < d.length; i += 4) mx = Math.max(mx, Math.abs(d[i])); const y = mx * h * 0.45 * (+$('#wvol', m.el).value / 100); ctx.fillRect(x, h / 2 - y, 1, Math.max(1, y * 2)); }
    $$('.slider-row output', m.el).forEach((o, i) => o.textContent = i < 2 ? (+o.previousElementSibling.value).toFixed(2) + 's' : o.previousElementSibling.value + '%');
  };
  ['ws', 'we', 'wvol'].forEach((id) => $('#' + id, m.el).oninput = () => { if (+$('#ws', m.el).value >= +$('#we', m.el).value) $('#ws', m.el).value = Math.max(0, +$('#we', m.el).value - 0.05); draw(); });
  requestAnimationFrame(draw);
  const opts = () => ({ start: +$('#ws', m.el).value, end: +$('#we', m.el).value, volume: +$('#wvol', m.el).value / 100, mono: $('#wmono', m.el).checked });
  $('#wplay', m.el).onclick = async () => { const o = await encodeOgg(buf, opts()); playB64(bytesToB64(o)); };
  $('#wsave', m.el).onclick = async () => {
    $('#wsave', m.el).disabled = true;
    try { const b64 = bytesToB64(await encodeOgg(buf, opts())); for (const t of targets) await api.tex.put(S.project.id, t, b64); m.close(true); toast('انحفظ الصوت 🔊'); after && after(); }
    catch (e) { console.error(e); toast('صار خطأ بالتحويل', 'err'); $('#wsave', m.el).disabled = false; }
  };
}
async function tabSounds(b) {
  const p = S.project;
  b.innerHTML = `<div class="empty"><div class="dl-ring" style="margin:0 auto 14px"><div class="dl-cube">${icon('sound', 30)}</div></div>أجيب قائمة أصوات ماينكرافت ${esc(p.version)}...</div>`;
  let list;
  try { list = await api.sounds.list(p.version); }
  catch (e) { b.innerHTML = `<div class="empty"><div class="big">${icon('sound', 30)}</div><h2>ما قدرت أجيب قائمة الأصوات</h2><p class="muted">تحتاج نت أول مرة بس. تأكد من الاتصال وجرب.</p><button class="btn primary" id="rt">${icon('reset', 16)} جرّب مرة ثانية</button></div>`; $('#rt', b).onclick = () => tabSounds(b); return; }
  const files = new Set(await api.files.list(p.id));
  const custom = (path) => files.has('assets/minecraft/' + path);
  const groups = SND_QUICK.map(([id, n, ic, res]) => ({ id, n, ic, items: list.filter((x) => res.some((r) => r.test(x.path))) })).filter((g) => g.items.length);
  b.innerHTML = `<div class="notice info">${icon('sound', 22)}<div style="flex:1"><b>غيّر أي صوت باللعبة</b><span class="muted small">اسمع الصوت الأصلي، وحط أي صوت من جهازك (MP3 أو WAV أو غيرها) والتطبيق يحوّله ويقصّه لك.</span></div></div>
    <div class="sec-h" style="margin-top:6px"><h2>أصوات PvP المشهورة</h2><div class="line"></div></div>
    <div class="snd-quick">${groups.map((g) => `<div class="snd-card" data-g="${g.id}"><div class="si">${icon(g.ic, 20)}</div><div class="tx"><b>${g.n}</b><span>${g.items.length} ملف ${g.items.some((x) => custom(x.path)) ? '· <span style="color:var(--a2)">معدّل</span>' : ''}</span></div>
      <button class="playbtn" data-pg="${g.id}" title="اسمع">${icon('play', 14)}</button><button class="btn sm" data-rg="${g.id}">${icon('upload', 14)} غيّر</button>
      ${g.items.some((x) => custom(x.path)) ? `<button class="btn sm ghost icon" data-xg="${g.id}" title="رجّع الأصلي">${icon('reset', 14)}</button>` : ''}</div>`).join('')}</div>
    <div class="sec-h"><h2>كل الأصوات</h2><div class="line"></div><span class="badge">${list.length}</span></div>
    <div class="row" style="margin-bottom:12px"><div class="search" style="flex:1"><input class="inp" id="sq" placeholder="ابحث بالإنجليزي: hit, orb, bow, step, zombie, music...">${icon('search', 18)}</div><label class="check small"><span class="switch"><input type="checkbox" id="sonly"><span></span></span>المعدّل بس</label></div>
    <div id="sl"></div><div id="smore"></div>`;
  const getSnd = async (x) => custom(x.path) ? (await api.tex.get(p, x.path))?.data : api.sounds.get(x.hash);
  $$('[data-pg]', b).forEach((btn) => btn.onclick = async () => { const g = groups.find((x) => x.id === btn.dataset.pg); const it = g.items[Math.floor(Math.random() * g.items.length)]; try { playB64(await getSnd(it), btn); } catch { toast('ما قدرت أجيب الصوت', 'err'); } });
  $$('[data-rg]', b).forEach((btn) => btn.onclick = () => { const g = groups.find((x) => x.id === btn.dataset.rg); replaceSoundDialog(g.items.map((x) => x.path), g.n, () => tabSounds(b)); });
  $$('[data-xg]', b).forEach((btn) => btn.onclick = async () => { const g = groups.find((x) => x.id === btn.dataset.xg); for (const x of g.items) await api.tex.reset(p.id, x.path); toast('رجع الأصلي'); tabSounds(b); });
  let shown = 0, cur = [];
  const row = (x) => `<div class="snd-row"><button class="playbtn" data-p="${esc(x.path)}">${icon('play', 14)}</button><span class="nm" title="${esc(x.path)}">${esc(x.path.replace(/^sounds\//, ''))}</span>
    ${custom(x.path) ? `<span class="badge acc">معدّل</span><button class="btn sm ghost icon" data-x="${esc(x.path)}" title="الأصلي">${icon('reset', 14)}</button>` : ''}<button class="btn sm" data-r="${esc(x.path)}">${icon('upload', 14)} غيّر</button></div>`;
  function draw() { const q = $('#sq', b).value.toLowerCase().trim(); cur = list.filter((x) => (!q || x.path.toLowerCase().includes(q)) && (!$('#sonly', b).checked || custom(x.path))); shown = 0; $('#sl', b).innerHTML = ''; more(); }
  function more() {
    $('#sl', b).insertAdjacentHTML('beforeend', cur.slice(shown, shown + 150).map(row).join('')); shown += 150;
    $('#smore', b).innerHTML = shown < cur.length ? `<div style="text-align:center;margin-top:12px"><button class="btn" id="sm">المزيد (${cur.length - shown})</button></div>` : '';
    if ($('#sm', b)) $('#sm', b).onclick = more;
  }
  $('#sl', b).onclick = async (e) => {
    const pb = e.target.closest('[data-p]'), rb = e.target.closest('[data-r]'), xb = e.target.closest('[data-x]');
    if (pb) { const x = list.find((y) => y.path === pb.dataset.p); try { playB64(await getSnd(x), pb); } catch { toast('ما قدرت أجيب الصوت', 'err'); } }
    if (rb) replaceSoundDialog([rb.dataset.r], rb.dataset.r.split('/').pop(), () => { files.add('assets/minecraft/' + rb.dataset.r); draw(); });
    if (xb) { await api.tex.reset(p.id, xb.dataset.x); files.delete('assets/minecraft/' + xb.dataset.x); draw(); }
  };
  let t; $('#sq', b).oninput = () => { clearTimeout(t); t = setTimeout(draw, 200); }; $('#sonly', b).onchange = draw;
  draw();
}

// ------------------------------------------------------------- 3D preview
window.open3D = function (img, { skin = false, slim = false, title = '' } = {}) {
  const m = modal({ cls: 'lg', title: `${icon('cube', 18)} معاينة 3D ${title ? '— ' + esc(title) : ''}`, sub: 'اسحب بالماوس عشان تلف، والعجلة للتقريب',
    body: `<div class="v3d"><canvas id="c3d"></canvas></div>
      <div class="row" style="margin-top:12px"><label class="check small"><span class="switch"><input type="checkbox" id="v3a" checked><span></span></span>لف تلقائي</label>
      ${skin ? `<label class="check small"><span class="switch"><input type="checkbox" id="v3o" checked><span></span></span>الطبقة الثانية</label><label class="check small"><span class="switch"><input type="checkbox" id="v3s" ${slim ? 'checked' : ''}><span></span></span>نحيف</label>` : ''}</div>` });
  const cv = $('#c3d', m.el);
  const build = () => skin ? Lite3D.skinQuads(img, $('#v3s', m.el).checked, $('#v3o', m.el).checked) : Lite3D.itemQuads(img);
  const v = Lite3D.viewer(cv, build(), { dist: skin ? 62 : 40, pitch: skin ? 0.15 : 0.3 });
  $('#v3a', m.el).onchange = (e) => v.st.auto = e.target.checked;
  if (skin) { $('#v3o', m.el).onchange = () => v.set(build()); $('#v3s', m.el).onchange = () => v.set(build()); }
};

// ------------------------------------------------------------- held item size
const HELD_DEF = { hOn: true, hLower: 2.5, hScale: 0.85, hX: 0, gOn: false, gLower: 2, gScale: 0.85 };
async function tabHeld(b) {
  const p = S.project, h = p.held = Object.assign({ on: false }, HELD_DEF, p.held || {});
  b.innerHTML = `${p.baseJar ? '' : noBaseNotice()}<div class="two">
    <div class="card stack">
      <label class="check" style="justify-content:space-between"><b>${icon('sword', 18)} غيّر حجم ومكان الأدوات باليد</b><span class="switch"><input type="checkbox" id="hon" ${h.on ? 'checked' : ''}><span></span></span></label>
      <div id="hctl" class="stack">
        <div><div class="muted small" style="margin-bottom:8px"><b>السيوف والأدوات</b> (سيف، فاس، معول، سنارة...)</div>
          <div class="slider-row" style="grid-template-columns:90px 1fr 40px"><span>نزول</span><input type="range" id="hl" min="0" max="8" step="0.25" value="${h.hLower}"><output class="ltr"></output></div>
          <div class="slider-row" style="grid-template-columns:90px 1fr 40px"><span>الحجم</span><input type="range" id="hs" min="0.3" max="1.3" step="0.05" value="${h.hScale}"><output class="ltr"></output></div>
          <div class="slider-row" style="grid-template-columns:90px 1fr 40px"><span>يمين/يسار</span><input type="range" id="hx" min="-4" max="4" step="0.25" value="${h.hX}"><output class="ltr"></output></div></div>
        <div><label class="check small" style="margin-bottom:8px"><span class="switch"><input type="checkbox" id="gon" ${h.gOn ? 'checked' : ''}><span></span></span><b>باقي الأشياء</b> (بيرل، تفاح، بلوكات صغيرة...)</label>
          <div class="slider-row" style="grid-template-columns:90px 1fr 40px"><span>نزول</span><input type="range" id="gl" min="0" max="8" step="0.25" value="${h.gLower}"><output class="ltr"></output></div>
          <div class="slider-row" style="grid-template-columns:90px 1fr 40px"><span>الحجم</span><input type="range" id="gs" min="0.3" max="1.3" step="0.05" value="${h.gScale}"><output class="ltr"></output></div></div>
        <div class="row"><button class="btn sm" data-hp="2.5,0.85,0">Low Sword</button><button class="btn sm" data-hp="4,0.7,0.5">صغير ونازل</button><button class="btn sm" data-hp="5.5,0.55,1">أصغر شي</button><button class="btn sm ghost" data-hp="0,1,0">الأصلي</button></div>
        <div class="row"><button class="btn sm" id="hmeas">${icon('download', 15)} خذ القياسات من باك</button>${Object.keys(h.imported || {}).length ? `<button class="btn sm ghost" id="hclr">${icon('x', 14)} شيل القياسات المأخوذة (${Object.keys(h.imported).length})</button>` : ''}<button class="btn sm ghost" id="hgosh">${icon('shield', 14)} الشيلد له قسم خاص</button></div>
      </div>
      <span class="muted small" style="line-height:1.7">يعدّل موديلات الأدوات بالباك وقت التثبيت. يحتاج ملفات اللعبة محمّلة. يشتغل على كل النسخ.</span>
    </div>
    <div class="card"><h3>كيف بيطلع باللعبة <span class="muted small">(نفس حسابات ماينكرافت بالضبط)</span></h3><div class="fp-stage"><canvas id="hcv"></canvas></div>
      <div class="hstat" id="hstat"></div>
      <div class="row" style="margin-top:10px"><span class="seg" id="hpv"><button data-v="sword" class="on">سيف</button><button data-v="pearl">بيرل</button></span><span class="muted small" id="hpvn"></span></div></div></div>
    <div class="card" style="margin-top:20px"><div class="row" style="margin-bottom:12px"><h3 style="margin:0;flex:1">${icon('sword', 18)} كل أداة لحالها</h3><span class="muted small">اختر أي أداة من القائمة واعطها حجمها ومكانها الخاص (يغلب على الإعدادات اللي فوق)</span></div>
      <div id="hitems" class="stack" style="gap:8px;margin-bottom:14px"></div>
      <div class="row" style="gap:6px;margin-bottom:10px" id="hcats">${ITEM_CATS.map(([k, n]) => `<button class="chip ${k === 'weapons' ? 'on' : ''}" data-c="${k}">${n}</button>`).join('')}</div>
      <div class="igrid" id="hgrid"></div></div>`;
  bindBaseActions(b);
  const load = async (id) => { const t = TEXTURES.find((x) => x.id === id); const r = await api.tex.get(p, texPath(t, p.packFormat)); return r ? IMG.toCanvas(await IMG.fromB64(r.data)) : null; };
  const imgs = { sword: await load('diamond_sword'), pearl: await load('ender_pearl') };
  let pv = 'sword', pvItem = null;
  h.items = h.items || {};
  const models = p.baseJar ? await api.models.list(p) : [];
  const texCache = {};
  const thumb = async (m) => { if (!m || !m.tex) return null; if (texCache[m.tex] !== undefined) return texCache[m.tex];
    if (m.tex === 'shield') { const st = TEXTURES.find((t) => t.id === 'shield_tex'), rr = st && await api.tex.get(p, texPath(st, p.packFormat)); if (!rr) return (texCache.shield = null); const im = IMG.toCanvas(await IMG.fromB64(rr.data)), k = im.width / 64, c = document.createElement('canvas'); c.width = 12 * k; c.height = 22 * k; c.getContext('2d').drawImage(im, k, k, 12 * k, 22 * k, 0, 0, 12 * k, 22 * k); return (texCache.shield = c); }
    const r = await api.tex.get(p, m.tex); texCache[m.tex] = r ? IMG.toCanvas(await IMG.fromB64(r.data)) : null; return texCache[m.tex]; };
  const cv = $('#hcv', b);
  const PV = { sword: 'diamond_sword', pearl: 'ender_pearl', shield: 'shield' };
  const disp = p.baseJar ? await api.held.displays(p, [...new Set([...models.map((m) => m.name), 'shield', 'diamond_sword', 'ender_pearl'])]) : {};
  const shieldT = TEXTURES.find((t) => t.id === 'shield_tex'), shieldRel = shieldT && texPath(shieldT, p.packFormat);
  const qCache = {};
  const isToolN = (n) => /(_sword|_axe|_pickaxe|_shovel|_hoe|_spear)$/.test(n) || /^(stick|blaze_rod|breeze_rod|bone|fishing_rod|carrot_on_a_stick|warped_fungus_on_a_stick|mace|trident)$/.test(n);
  async function quadsOf(n) {
    if (qCache[n]) return qCache[n];
    let im = null;
    if (/^shield/.test(n) && shieldRel) { const r = await api.tex.get(p, shieldRel); im = r ? await IMG.fromB64(r.data) : null; }
    else { const m = models.find((x) => x.name === n); if (m && m.tex) { const r = await api.tex.get(p, m.tex); im = r ? await IMG.fromB64(r.data) : null; } }
    return (qCache[n] = heldQuads(im, disp[n] && disp[n].special, n));
  }
  // the size/place this item really gets (per-item beats the group sliders; shields aren't in the groups)
  function setFor(n) {
    if (!$('#hon', b).checked) return [0, 1, 0];
    if (h.items[n]) return [h.items[n].lower, h.items[n].scale, h.items[n].x];
    const info = disp[n] || {};
    if (info.special || /^shield/.test(n)) return [0, 1, 0];
    if (isToolN(n)) return [+$('#hl', b).value, +$('#hs', b).value, +$('#hx', b).value];
    return $('#gon', b).checked ? [+$('#gl', b).value, +$('#gs', b).value, 0] : [0, 1, 0];
  }
  const anchors = {};
  async function anchorOf(n) { if (anchors[n] !== undefined) return anchors[n]; const q = await quadsOf(n), info = disp[n] || {}; return (anchors[n] = (q.length && heldAnchor(q, heldApply(info.disp, null, 0, 1, 0))) || info.center || null); }
  // per-item: shrink around the visible part (same anchor goes into the pack); group sliders change shared models, no anchor
  const groupAnchor = (n) => (isToolN(n) ? h.hAnchor : h.gAnchor) || null;
  const effFor = (n) => { const info = disp[n] || {}; const [l, sc, x] = setFor(n); return heldApply(info.disp, h.items[n] ? (h.items[n].anchor || anchors[n] || info.center) : (info.special || /^shield/.test(n) ? info.center : groupAnchor(n)), l, sc, x); };
  // the shared sliders also shrink around what you see (taken from the diamond sword / ender pearl)
  if (p.baseJar) { h.hAnchor = await anchorOf('diamond_sword'); h.gAnchor = await anchorOf('ender_pearl'); }
  const baseOf = (n, q) => { const info = disp[n] || {}; return heldProject(q, heldApply(info.disp, info.center, 0, 1, 0), 1600, 900); };
  async function statusFor(n) { await ensureAnchor(n); const q = await quadsOf(n); if (!q.length) return null; return heldStatus(heldProject(q, effFor(n), 1600, 900), baseOf(n, q)); }
  async function ensureAnchor(n) { if (!h.items[n]) return; const u = unitOf[n], a = await anchorOf(u ? u.rep.name : n); (u ? u.members : [n]).forEach((m) => { if (h.items[m] && !h.items[m].anchor && a) h.items[m].anchor = a; }); }
  async function draw() {
    if (!cv.isConnected) return;
    const n = pv === 'item' ? pvItem && pvItem.name : PV[pv]; if (!n) return;
    await ensureAnchor(n);
    const r = cv.getBoundingClientRect(); cv.width = Math.max(320, r.width * devicePixelRatio); cv.height = cv.width * 9 / 16;
    const q = await quadsOf(n); const res = heldProject(q, effFor(n), cv.width, cv.height); heldDraw(cv, res);
    const st = q.length ? heldStatus(heldProject(q, effFor(n), 1600, 900), baseOf(n, q)) : null, box = $('#hstat', b);
    box.className = 'hstat ' + (st ? st.k : '');
    box.innerHTML = st ? `${icon(st.k === 'ok' ? 'check' : 'sun', 15)}<span>${st.t}</span>${st.k !== 'ok' ? `<button class="btn sm" id="hfix">${icon('wand', 14)} صلّحها لي</button>` : ''}` : `<span class="muted small">${p.baseJar ? 'ما لقيت تكستر هذي الأداة' : 'حمّل ملفات اللعبة عشان تشوف المعاينة'}</span>`;
    const fx = $('#hfix', b); if (fx) fx.onclick = () => fixItem(n);
  }
  // nudge the values back until the item is clearly visible again
  async function fixItem(n) {
    const per = !!h.items[n], info = disp[n] || {}, tool = isToolN(n);
    let [l, sc, x] = setFor(n); const q = await quadsOf(n), base = baseOf(n, q);
    await ensureAnchor(n); const anc = per ? (h.items[n].anchor || info.center) : info.center;
    for (let i = 0; i < 40; i++) { const st = heldStatus(heldProject(q, heldApply(info.disp, anc, l, sc, x), 1600, 900), base); if (st && st.k === 'ok') break; l = l > 0 ? Math.max(0, l - 0.5) : Math.min(0, l + 0.5); sc = sc < 1 ? Math.min(1, sc + 0.05) : Math.max(1, sc - 0.05); x = x > 0 ? Math.max(0, x - 0.25) : Math.min(0, x + 0.25); }
    l = Math.round(l * 4) / 4; sc = Math.round(sc * 20) / 20; x = Math.round(x * 4) / 4;
    if (false) {}
    else if (per) { const u = unitOf[n]; (u ? u.members : [n]).forEach((m) => { h.items[m] = { lower: l, scale: sc, x, anchor: h.items[m] && h.items[m].anchor }; }); drawItems(); }
    else if (tool) { $('#hl', b).value = l; $('#hs', b).value = sc; $('#hx', b).value = x; }
    else { $('#gl', b).value = l; $('#gs', b).value = sc; }
    upd(); toast('ضبطتها عشان تبان زين ✓');
  }
  const upd = () => {
    Object.assign(h, { on: $('#hon', b).checked, hLower: +$('#hl', b).value, hScale: +$('#hs', b).value, hX: +$('#hx', b).value, gOn: $('#gon', b).checked, gLower: +$('#gl', b).value, gScale: +$('#gs', b).value, hOn: true });
    $('#hctl', b).style.opacity = h.on ? 1 : .4; $('#hctl', b).style.pointerEvents = h.on ? '' : 'none';
    $$('#hctl output', b).forEach((o) => o.textContent = o.previousElementSibling.value);
    draw(); clearTimeout(upd.t); upd.t = setTimeout(saveProject, 400);
  };
  ['hon', 'hl', 'hs', 'hx', 'gon', 'gl', 'gs'].forEach((id) => $('#' + id, b).oninput = upd);
  $$('[data-hp]', b).forEach((x) => x.onclick = () => { const [l, s, xx] = x.dataset.hp.split(',').map(Number); $('#hl', b).value = l; $('#hs', b).value = s; $('#hx', b).value = xx; $('#gl', b).value = l * 0.8; $('#gs', b).value = s; upd(); });
  $$('#hpv button', b).forEach((x) => x.onclick = () => { pv = x.dataset.v; $('#hpvn', b).textContent = ''; $$('#hpv button', b).forEach((y) => y.classList.toggle('on', y === x)); draw(); });
  new ResizeObserver(() => draw()).observe(cv);
  $('#hmeas', b).onclick = () => importMeasurements(() => tabHeld(b));
  const hc = $('#hclr', b); if (hc) hc.onclick = async () => { h.imported = {}; await saveProject(); tabHeld(b); toast('رجعت القياسات لقياسات اللعبة'); };
  $('#hgosh', b).onclick = () => $('.tab[data-t=shield]').click();
  // ---- per-item list — the same kind of item (all swords, all axes…) is handled together
  const MAT_RE = /^(wooden|stone|iron|golden|gold|diamond|netherite|copper|leather|chainmail|turtle)_(.+)$/;
  const famKey = itemFamily;
  const famCount = {}; models.forEach((m) => { const f = famKey(m.name); if (f) famCount[f] = (famCount[f] || 0) + 1; });
  for (let i = models.length - 1; i >= 0; i--) if (/^shield/.test(models[i].name)) models.splice(i, 1);
  if (h.items) Object.keys(h.items).forEach((n) => { if (/^shield/.test(n)) delete h.items[n]; });
  const units = []; const unitOf = {};
  for (const m of models) {
    const f = famKey(m.name), key = f && famCount[f] >= 2 ? 'fam:' + f : m.name;
    let u = units.find((x) => x.key === key);
    if (!u) { u = { key, fam: key.startsWith('fam:') ? f : null, members: [], rep: m }; units.push(u); }
    u.members.push(m.name); unitOf[m.name] = u;
    if (/^(diamond_|golden_apple$|cooked_beef$|cooked_cod$|red_|oak_|potion$|arrow$|baked_potato$|golden_carrot$|bucket$)/.test(m.name) && !(u.rep && /^diamond_/.test(u.rep.name))) u.rep = m;
  }
  const unitLabel = (u) => (u.fam ? (famLabel(u.fam)) : itemName(u.key));
  const unitOn = (u) => u.members.some((n) => h.items[n]);
  // old saves: items added one by one still show (as their own row)
  Object.keys(h.items).forEach((n) => { if (!unitOf[n]) { const u = { key: n, fam: null, members: [n], rep: { name: n } }; units.push(u); unitOf[n] = u; } });
  const showItem = async (m) => { pvItem = m; pv = 'item'; await thumb(m); $$('#hpv button', b).forEach((y) => y.classList.remove('on')); $('#hpvn', b).textContent = m.name; draw(); };
  const drawItems = async () => {
    const box = $('#hitems', b); const sel = units.filter(unitOn);
    if (!sel.length) { box.innerHTML = `<div class="muted small">${models.length ? 'ما اخترت أدوات للحين — اضغط على أي أداة من القائمة تحت' : 'تحتاج ملفات اللعبة محمّلة عشان تطلع قائمة الأدوات'}</div>`; return; }
    box.innerHTML = sel.map((u) => { const c = h.items[u.members.find((n) => h.items[n])]; return `<div class="hitem" data-k="${esc(u.key)}"><canvas class="hth"></canvas><div style="width:150px;overflow:hidden"><b style="display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(unitLabel(u))}</b>${u.fam ? `<span class="dim small">${u.members.length} أنواع</span>` : ''}<span class="hbadge"></span></div>
      <div class="slider-row" style="grid-template-columns:40px 1fr 34px;margin:0;flex:1"><span>نزول</span><input type="range" data-p="lower" min="-4" max="8" step="0.25" value="${c.lower}"><output class="ltr">${c.lower}</output></div>
      <div class="slider-row" style="grid-template-columns:40px 1fr 34px;margin:0;flex:1"><span>الحجم</span><input type="range" data-p="scale" min="0.2" max="1.6" step="0.05" value="${c.scale}"><output class="ltr">${c.scale}</output></div>
      <div class="slider-row" style="grid-template-columns:40px 1fr 34px;margin:0;flex:1"><span>جنب</span><input type="range" data-p="x" min="-6" max="6" step="0.25" value="${c.x}"><output class="ltr">${c.x}</output></div>
      <button class="btn sm ghost icon" data-v="1" title="معاينة">${icon('monitor', 15)}</button><button class="btn sm ghost icon danger" data-d="1" title="شيل">${icon('x', 15)}</button></div>`; }).join('');
    for (const row of $$('.hitem', box)) {
      const u = units.find((x) => x.key === row.dataset.k), m = u.rep;
      thumb(m).then((c) => { const cv = $('.hth', row); if (c) { cv.width = c.width; cv.height = Math.min(c.width, c.height); cv.getContext('2d').drawImage(c, 0, 0); } });
      $$('input', row).forEach((inp) => inp.oninput = () => { u.members.forEach((n) => { h.items[n] = h.items[n] || { lower: 2, scale: 0.8, x: 0 }; h.items[n][inp.dataset.p] = +inp.value; }); inp.nextElementSibling.textContent = inp.value; if (pvItem && u.members.includes(pvItem.name)) draw(); row.badge && row.badge(); clearTimeout(upd.t); upd.t = setTimeout(saveProject, 400); });
      $('[data-v]', row).onclick = () => showItem(m);
      $('[data-d]', row).onclick = async () => { u.members.forEach((n) => delete h.items[n]); await saveProject(); drawItems(); drawGrid(); };
      const badge = async () => { const st = await statusFor(m.name); const el = $('.hbadge', row); if (el) { el.className = 'hbadge ' + (st ? st.k : ''); el.textContent = st ? (st.k === 'ok' ? '✓ واضح' : st.k === 'off' ? '⚠ ما بيبان' : st.k === 'tiny' ? '⚠ صغير مرة' : '⚠ نصه برا') : ''; el.title = st ? st.t : ''; } };
      row.badge = badge; badge();
    }
  };
  // ---- browsable list of every item (no typing needed)
  let cat = 'weapons';
  const gridEl = $('#hgrid', b);
  const io = new IntersectionObserver((ents) => ents.forEach((en) => { if (!en.isIntersecting) return; io.unobserve(en.target); const u = units.find((x) => x.key === en.target.dataset.k); thumb(u && u.rep).then((c) => { const cv = $('canvas', en.target); if (c && cv) { cv.width = c.width; cv.height = Math.min(c.width, c.height); cv.getContext('2d').drawImage(c, 0, 0); } }); }), { rootMargin: '150px' });
  function drawGrid() {
    if (!models.length) { gridEl.innerHTML = `<div class="muted small">تحتاج ملفات اللعبة محمّلة عشان تطلع قائمة الأدوات</div>`; return; }
    const list = units.filter((u) => models.includes(u.rep) && (itemCat(u.rep) === cat || (cat === 'all' && u.rep.tex)));
    gridEl.innerHTML = list.map((u) => `<button class="icell ${unitOn(u) ? 'on' : ''} ${u.fam ? 'fam' : ''}" data-k="${esc(u.key)}" title="${esc(u.members.join(', '))}"><canvas></canvas><span>${esc(unitLabel(u))}</span>${u.fam ? `<em>${u.members.length}</em>` : ''}${unitOn(u) ? `<i>${icon('check', 12)}</i>` : ''}</button>`).join('') || `<div class="muted small">ما فيه شي بهالقسم</div>`;
    $$('.icell', gridEl).forEach((x) => io.observe(x));
  }
  $$('#hcats .chip', b).forEach((x) => x.onclick = () => { cat = x.dataset.c; $$('#hcats .chip', b).forEach((y) => y.classList.toggle('on', y === x)); drawGrid(); });
  gridEl.onclick = async (e) => {
    const el = e.target.closest('.icell'); if (!el) return; const u = units.find((x) => x.key === el.dataset.k);
    if (unitOn(u)) u.members.forEach((n) => delete h.items[n]);
    else { const a = await anchorOf(u.rep.name); u.members.forEach((n) => { h.items[n] = { lower: 0, scale: 0.8, x: 0, ...(a ? { anchor: a } : {}) }; }); if (!$('#hon', b).checked) { $('#hon', b).checked = true; upd(); } }
    await saveProject(); await drawItems(); drawGrid(); if (unitOn(u)) { showItem(u.rep); $('#hitems', b).scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }
  };
  drawGrid();
  drawItems();
  requestAnimationFrame(upd);
}

// ------------------------------------------------------------- القياسات: every size/position in one place
const MEAS_CATS = [['all', 'الكل'], ['changed', 'المتغيّر'], ['main', 'الأساسية'], ['weapons', 'أسلحة'], ['tools', 'أدوات'], ['throw', 'رمي'], ['food', 'أكل'], ['armor', 'دروع وتوتم'], ['misc', 'باقي الأشياء'], ['blocks', 'بلوكات']];
async function tabMeasure(b) {
  const p = S.project, h = p.held = Object.assign({ on: false }, HELD_DEF, p.held || {});
  h.items = h.items || {}; h.imported = h.imported || {};
  const sh = p.shield = Object.assign({ enabled: false, lower: 0, scale: 1, blockLower: 0 }, p.shield || {});
  const nImp = Object.keys(h.imported).length + Object.keys(sh.imported || {}).length;
  b.innerHTML = `${p.baseJar ? '' : noBaseNotice()}
    <div class="row" style="margin-bottom:12px;gap:8px"><div class="search" style="flex:1"><input class="inp" id="mq" placeholder="ابحث: سيف، شيلد، نار، بيرل، sword...">${icon('search', 18)}</div>
      <button class="btn" id="mmeas">${icon('download', 16)} خذ القياسات من باك</button>${nImp ? `<button class="btn ghost" id="mclr">${icon('x', 15)} شيل المأخوذة (${nImp})</button>` : ''}</div>
    <div class="presets-row" id="mpre"><span class="muted small">${icon('star', 14)} جاهز بضغطة:</span>
      <button class="btn sm" data-preset="light">${icon('wand', 14)} PvP خفيف</button><button class="btn sm" data-preset="strong">${icon('sword', 14)} PvP قوي</button><button class="btn sm" data-preset="bedwars">${icon('layers', 14)} Bedwars</button><button class="btn sm" data-preset="fps">${icon('monitor', 14)} شاشة صافية</button><button class="btn sm ghost" data-preset="reset">${icon('reset', 14)} رجّع الكل</button></div>
    <div class="row" style="gap:6px;margin-bottom:12px" id="mcats">${MEAS_CATS.map(([k, n]) => `<button class="chip ${k === 'main' ? 'on' : ''}" data-c="${k}">${n}</button>`).join('')}</div>
    <div class="meas-split"><div class="meas-list" id="mlistm"></div>
      <div class="card meas-ed" id="med"></div></div>`;
  bindBaseActions(b);
  const models = p.baseJar ? await api.models.list(p) : [];
  for (let i = models.length - 1; i >= 0; i--) if (/^shield/.test(models[i].name)) models.splice(i, 1);
  const disp = p.baseJar ? await api.held.displays(p, [...new Set([...models.map((m) => m.name), 'diamond_sword', 'ender_pearl'])]) : {};
  // ---- textures / quads
  const texCache = {}, qCache = {}, anchors = {};
  const imgOf = async (rel) => { if (texCache[rel] !== undefined) return texCache[rel]; const r = await api.tex.get(p, rel); return (texCache[rel] = r ? await IMG.fromB64(r.data) : null); };
  const modelOf = (n) => models.find((x) => x.name === n);
  async function quadsOf(n) { if (qCache[n]) return qCache[n]; const m = modelOf(n); const im = m && m.tex ? await imgOf(m.tex) : null; return (qCache[n] = heldQuads(im, (disp[n] && disp[n].special) || (m && m.special), n, m && m.block)); }
  async function anchorOf(n) { if (anchors[n] !== undefined) return anchors[n]; const q = await quadsOf(n), info = disp[n] || {}; return (anchors[n] = (q.length && heldAnchor(q, heldApply(info.disp, null, 0, 1, 0))) || info.center || null); }
  const isToolN = (n) => /(_sword|_axe|_pickaxe|_shovel|_hoe|_spear)$/.test(n) || /^(stick|blaze_rod|breeze_rod|bone|fishing_rod|carrot_on_a_stick|warped_fungus_on_a_stick|mace|trident)$/.test(n);
  if (p.baseJar) { h.hAnchor = await anchorOf('diamond_sword'); h.gAnchor = await anchorOf('ender_pearl'); }
  // turning held sizes on for the first time must not wake up old default group values
  const ensureOn = () => { if (!h.on) { h.on = true; h.hOn = true; h.hLower = 0; h.hScale = 1; h.hX = 0; h.gOn = true; h.gLower = 0; h.gScale = 1; } h.gOn = true; h.hOn = true; };
  const N5 = [0, 1, 0, 0, 0], pad5 = (v) => [v[0] || 0, v[1] === undefined ? 1 : v[1], v[2] || 0, v[3] || 0, v[4] || 0], isNeutral = (v) => !v[0] && v[1] === 1 && !v[2] && !v[3] && !v[4];
  const grpVals = (tool) => (!h.on ? N5 : tool ? [h.hLower, h.hScale, h.hX, 0, 0] : h.gOn ? [h.gLower, h.gScale, 0, 0, 0] : N5);
  const itemVals = (n) => (h.on && h.items[n] ? pad5([h.items[n].lower, h.items[n].scale, h.items[n].x, h.items[n].z, h.items[n].rot]) : null);
  const effItem = (n) => { const info = disp[n] || {}, iv = itemVals(n); if (iv) return heldApply(info.disp, h.items[n].anchor || anchors[n] || info.center, ...iv); const mm = modelOf(n); if (mm && mm.block && h.on && h.blocks) return heldApply(info.disp, h.blocks.anchor, h.blocks.lower, h.blocks.scale, h.blocks.x || 0, h.blocks.z || 0, h.blocks.rot || 0); const tool = isToolN(n); return heldApply(info.disp, tool ? h.hAnchor : h.gAnchor, ...grpVals(tool)); };
  // ---- shield
  const shBase = p.packFormat >= 2 ? await shieldBase(p) : null, shQ = shBase ? await shieldQuadsOf(p) : [], [shA, shBA] = shBase ? await shieldAnchors(p, shBase) : [null, null];
  const shVals = (block) => (block ? [sh.blockLower, sh.bscale || sh.scale, sh.bx || 0, sh.bz || 0, sh.brot || 0] : [sh.lower, sh.scale, sh.x || 0, sh.z || 0, sh.rot || 0]);
  const shEff = (block, on = sh.enabled) => { const m = block ? shBase.bl : shBase.a, d = m && m.display && m.display.firstperson_righthand; return heldApply(d, block ? shBA : shA, ...(on ? shVals(block) : N5)); };
  // ---- fire (screen)
  const f1rel = texPath(TEXTURES.find((t) => t.id === 'fire_1'), p.packFormat), fireOrig = f1rel ? await texImg(p, f1rel) : null;
  const fireCfg = () => Object.assign({ lower: 0, opacity: 1 }, p.fire || {});
  // ---- units: families of items (all swords…) and single items
  const MAT_RE = /^(wooden|stone|iron|golden|gold|diamond|netherite|copper|leather|chainmail|turtle)_(.+)$/;
  const famKey = itemFamily;
  const famCount = {}; models.forEach((m) => { const f = famKey(m.name); if (f) famCount[f] = (famCount[f] || 0) + 1; });
  const units = []; const unitOf = {};
  for (const m of models) {
    const f = famKey(m.name), key = f && famCount[f] >= 2 ? 'fam:' + f : m.name;
    let u = units.find((x) => x.key === key);
    if (!u) { u = { key, fam: key.startsWith('fam:') ? f : null, members: [], rep: m }; units.push(u); }
    u.members.push(m.name); unitOf[m.name] = u;
    if (/^(diamond_|golden_apple$|cooked_beef$|cooked_cod$|red_|oak_|potion$|arrow$|baked_potato$|golden_carrot$|bucket$)/.test(m.name) && !(u.rep && /^diamond_/.test(u.rep.name))) u.rep = m;
  }
  const things = [];
  const oldGrp = h.on && (h.hLower || h.hScale !== 1 || h.hX || (h.gOn && (h.gLower || h.gScale !== 1)));
  if (oldGrp) things.push({ id: 'g:h', kind: 'group', tool: true, cat: 'main', label: 'كل السيوف والأدوات مع بعض', en: 'all swords tools handheld low sword سيف فاس معول أدوات', rep: 'diamond_sword', sliders: ['lower', 'scale', 'x', 'z', 'rot'] });
  if (oldGrp) things.push({ id: 'g:g', kind: 'group', tool: false, cat: 'main', label: 'كل الأشياء العادية مع بعض', en: 'all items generated pearl apple بيرل تفاح أكل', rep: 'ender_pearl', sliders: ['lower', 'scale'] });
  if (shBase) { things.push({ id: 'sh:0', kind: 'shield', block: false, cat: 'main', label: 'الشيلد', en: 'shield low shield', sliders: ['lower', 'scale', 'x', 'z', 'rot'] }); things.push({ id: 'sh:1', kind: 'shield', block: true, cat: 'main', label: 'الشيلد وقت البلوك', en: 'shield blocking', sliders: ['lower', 'scale', 'x', 'z', 'rot'] }); }
  const totemRel = 'textures/item/totem_of_undying.png';
  if (modelOf('totem_of_undying')) things.push({ id: 'totem', kind: 'totem', cat: 'main', label: 'التوتم لما ينكسر', en: 'totem pop break توتم ينكسر', rep: 'totem_of_undying', sliders: ['lower', 'scale'] });
  if (fireOrig) things.push({ id: 'fire', kind: 'fire', cat: 'main', label: 'النار على الشاشة', en: 'fire low fire نار نار قصيرة', sliders: ['fire'] });
  // whole categories at once
  const CAT_ALL = [['blocks', 'كل البلوكات', 'stone red_wool end_stone obsidian oak_planks', 'بلوك بلوكات block'], ['weapons', 'كل الأسلحة', 'diamond_sword bow', 'سلاح أسلحة سيف'], ['tools', 'كل الأدوات', 'diamond_pickaxe fishing_rod', 'أداة أدوات معول'], ['throw', 'كل أشياء الرمي', 'ender_pearl snowball', 'رمي بيرل'], ['food', 'كل الأكل', 'golden_apple cooked_beef', 'أكل تفاح'], ['armor', 'كل الدروع والتوتم', 'totem_of_undying diamond_chestplate', 'درع دروع توتم'], ['misc', 'كل باقي الأشياء', '', 'باقي']];
  const catMembers = (c) => models.filter((m) => m.tex && itemCat(m) === c).map((m) => m.name);
  const catThings = [];
  for (const [c, label, reps, ar] of CAT_ALL) {
    const mem = catMembers(c); if (!mem.length) continue;
    const rep = reps.split(' ').find((r) => mem.includes(r)) || mem[0];
    const t = { id: 'c:' + c, kind: c === 'blocks' ? 'blocks' : 'cat', catKey: c, members: mem, cat: 'main', label: `${label} مرة وحدة`, en: 'all ' + c + ' ' + ar + ' كل', rep, sliders: ['lower', 'scale', 'x', 'z', 'rot'] };
    catThings.push(t); things.push(t);
  }
  things.push({ id: 'c:*', kind: 'everything', cat: 'main', label: 'كل شي باللعبة مرة وحدة', en: 'everything all كل شي', rep: (catThings[0] || {}).rep || 'diamond_sword', sliders: ['lower', 'scale', 'x', 'z', 'rot'] });
  for (const u of units) if (u.rep.tex) things.push({ id: 'u:' + u.key, kind: 'item', unit: u, cat: itemCat(u.rep), label: u.fam ? famLabel(u.fam) : itemName(u.key), en: u.members.join(' ').replace(/_/g, ' ') + ' ' + u.members.map(itemName).join(' ') + ' ' + (FAM_SING[u.fam] || ''), rep: u.rep.name, sliders: ['lower', 'scale', 'x', 'z', 'rot'] });
  // ---- values per thing
  const valsOf = (t) => {
    if (t.kind === 'group') return grpVals(t.tool);
    if (t.kind === 'item') return itemVals(t.rep) || N5;
    if (t.kind === 'shield') return sh.enabled ? shVals(t.block) : N5;
    if (t.kind === 'fire') return [fireCfg().lower];
    if (t.kind === 'totem') return h.on && h.totemPop ? [h.totemPop.lower || 0, h.totemPop.scale] : [0, 1];
    if (t.kind === 'blocks') return h.on && h.blocks ? pad5([h.blocks.lower, h.blocks.scale, h.blocks.x, h.blocks.z, h.blocks.rot]) : N5;
    if (t.kind === 'cat' || t.kind === 'everything') { const v = (h.cats || {})[t.kind === 'cat' ? t.catKey : '*']; return h.on && v ? pad5(v) : N5; }
  };
  const changed = (t) => { const v = valsOf(t); if (t.kind === 'fire') return v[0] > 0.001; return !isNeutral(pad5(v)) || (t.kind === 'item' && t.unit.members.some((n) => h.imported[n])) || (t.kind === 'shield' && !!(sh.imported && sh.imported[t.block ? 'shield_blocking' : 'shield'])); };
  let fireTimer = 0;
  // a whole category: every item in it gets the same size (shrunk around what you see of the category's main item)
  async function setCat(t, v) {
    h.cats = h.cats || {}; v = pad5(v);
    if (isNeutral(v)) { delete h.cats[t.catKey]; t.members.forEach((n) => delete h.items[n]); return; }
    ensureOn(); h.cats[t.catKey] = v.slice(); const a = await anchorOf(t.rep);
    t.members.forEach((n) => { h.items[n] = { lower: v[0], scale: v[1], x: v[2], z: v[3], rot: v[4], ...(a ? { anchor: a } : {}) }; });
  }
  async function setVals(t, v) {
    if (t.kind === 'group') { ensureOn(); if (t.tool) { h.hLower = v[0]; h.hScale = v[1]; h.hX = v[2] || 0; } else { h.gLower = v[0]; h.gScale = v[1]; } }
    else if (t.kind === 'item') { v = pad5(v); if (isNeutral(v)) t.unit.members.forEach((n) => delete h.items[n]); else { ensureOn(); const a = await anchorOf(t.rep); t.unit.members.forEach((n) => { h.items[n] = { lower: v[0], scale: v[1], x: v[2], z: v[3], rot: v[4], ...(a ? { anchor: a } : {}) }; }); } }
    else if (t.kind === 'shield') { v = pad5(v); sh.enabled = true; if (t.block) { sh.blockLower = v[0]; sh.bscale = v[1]; sh.bx = v[2]; sh.bz = v[3]; sh.brot = v[4]; } else { sh.lower = v[0]; sh.scale = v[1]; sh.x = v[2]; sh.z = v[3]; sh.rot = v[4]; } if (isNeutral(shVals(false)) && isNeutral(shVals(true))) sh.enabled = false; }
    else if (t.kind === 'fire') { p.fire = Object.assign(fireCfg(), { lower: v[0] }); clearTimeout(fireTimer); fireTimer = setTimeout(() => applyFire(p, p.fire), 500); }
    else if (t.kind === 'blocks') { v = pad5(v); if (isNeutral(v)) delete h.blocks; else { ensureOn(); h.blocks = { lower: v[0], scale: v[1], x: v[2], z: v[3], rot: v[4], anchor: await anchorOf(t.rep) }; } }
    else if (t.kind === 'cat') await setCat(t, v);
    else if (t.kind === 'totem') { if (!v[0] && v[1] === 1) delete h.totemPop; else { ensureOn(); h.totemPop = { lower: v[0], scale: v[1] }; } }
    else if (t.kind === 'everything') { h.cats = h.cats || {}; h.cats['*'] = v.slice(); for (const ct of catThings) { if (ct.kind === 'blocks') await setVals(ct, v); else await setCat(ct, v); } }
    clearTimeout(setVals.t); setVals.t = setTimeout(saveProject, 400);
  }
  // ---- status of one thing (same maths as the game)
  async function project(t, W, H, neutral) {
    if (t.kind === 'shield') return shQ.length ? heldProject(shQ, shEff(t.block, !neutral && sh.enabled), W, H) : null;
    const n = t.rep, q = await quadsOf(n); if (!q.length) return null;
    if (neutral) { const info = disp[n] || {}; return heldProject(q, heldApply(info.disp, null, ...N5), W, H); }
    if (t.kind === 'group') { const info = disp[n] || {}; return heldProject(q, heldApply(info.disp, t.tool ? h.hAnchor : h.gAnchor, ...grpVals(t.tool)), W, H); }
    if (t.kind === 'blocks') { const info = disp[n] || {}, v = valsOf(t); return heldProject(q, heldApply(info.disp, (h.blocks && h.blocks.anchor) || await anchorOf(n), ...v), W, H); }
    if ((t.kind === 'item' || t.kind === 'cat' || t.kind === 'everything') && !itemVals(n)) await anchorOf(n);
    return heldProject(q, effItem(n), W, H);
  }
  function fireFrame(lower) { const c = fireCfg(); const im = IMG.toCanvas(fireTransform(fireOrig, lower, c.opacity, c.useTint ? c.tint : null)); const w = im.width, fr = document.createElement('canvas'); fr.width = fr.height = w; fr.getContext('2d').drawImage(im, 0, 0, w, w, 0, 0, w, w); return fr; }
  async function statusOf(t) {
    if (t.kind === 'totem') { const sc = valsOf(t)[1]; return sc < 0.15 ? { k: 'tiny', t: 'صغير مرة — بالكاد بتشوفه لما ينكسر', s: '⚠ صغير مرة' } : sc < 0.999 ? { k: 'ok', t: `التوتم بيطلع ${Math.round(sc * 100)}% من حجمه لما ينكسر ✓`, s: `✓ ${Math.round(sc * 100)}%` } : { k: 'cut', t: 'الحجم الأصلي — يغطي نص الشاشة لما ينكسر', s: '' }; }
    if (t.kind === 'fire') { const cv = fireCoverage(fireFrame(fireCfg().lower)), pct = Math.round(cv.cover * 100); return cv.cover < 0.005 ? { k: 'off', t: 'النار ما بتطلع على الشاشة أبد', s: '⚠ ما بيبان' } : cv.cover < 0.12 ? { k: 'ok', t: `نار قصيرة ✓ — تغطي ${pct}% من الشاشة`, s: `✓ ${pct}%` } : { k: 'cut', t: `تغطي ${pct}% من الشاشة`, s: `${pct}%` }; }
    const now = await project(t, 1600, 900), base = await project(t, 1600, 900, true); if (!now) return null;
    const st = heldStatus(now, base); return { ...st, s: st.k === 'ok' ? '✓ واضح' : st.k === 'off' ? '⚠ ما بيبان' : st.k === 'tiny' ? '⚠ صغير مرة' : '⚠ نصه برا' };
  }
  // ---- list
  let cat = 'main', sel = things.find((t) => t.id === 'c:weapons') || things[0];
  const listEl = $('#mlistm', b);
  const thumbOf = async (t, cv) => {
    let im = null;
    if (t.kind === 'shield') { const st = TEXTURES.find((x) => x.id === 'shield_tex'), r = st && await api.tex.get(p, texPath(st, p.packFormat)); if (r) { const s0 = IMG.toCanvas(await IMG.fromB64(r.data)), k = s0.width / 64; im = document.createElement('canvas'); im.width = 12 * k; im.height = 22 * k; im.getContext('2d').drawImage(s0, k, k, 12 * k, 22 * k, 0, 0, 12 * k, 22 * k); } }
    else if (t.kind === 'fire') { im = fireFrame(0); }
    else { const m = modelOf(t.rep); const d = m && m.tex ? await imgOf(m.tex) : null; if (d) { im = IMG.toCanvas(d); if (im.height > im.width) { const c = document.createElement('canvas'); c.width = c.height = im.width; c.getContext('2d').drawImage(im, 0, 0); im = c; } } }
    if (im && cv.isConnected) { cv.width = im.width; cv.height = im.height; cv.getContext('2d').drawImage(im, 0, 0); }
  };
  const io = new IntersectionObserver((ents) => ents.forEach(async (en) => { if (!en.isIntersecting) return; io.unobserve(en.target); const t = things.find((x) => x.id === en.target.dataset.id); thumbOf(t, $('canvas', en.target)); if (changed(t)) { const st = await statusOf(t); const bd = $('.mbadge', en.target); if (bd && st) { bd.className = 'mbadge ' + st.k; bd.textContent = st.s; } } }), { root: listEl, rootMargin: '120px' });
  function drawList() {
    const q = $('#mq', b).value.trim().toLowerCase();
    const list = things.filter((t) => (q ? (t.label + ' ' + t.en).toLowerCase().includes(q) : cat === 'all' ? true : cat === 'changed' ? changed(t) : cat === 'main' ? t.cat === 'main' || t.kind === 'cat' : t.cat === cat)).sort((a, b) => (b.top ? 1 : 0) - (a.top ? 1 : 0));
    listEl.innerHTML = list.map((t) => `<button class="mitem ${t === sel ? 'on' : ''}" data-id="${esc(t.id)}"><canvas></canvas><span class="ml"><b>${esc(t.label)}</b>${t.unit && t.unit.fam ? `<i>${t.unit.members.length} أنواع</i>` : t.kind === 'cat' ? `<i>${t.members.length} شي</i>` : ''}</span><span class="mbadge">${changed(t) ? 'متغيّر' : ''}</span></button>`).join('') || `<div class="muted small" style="padding:12px">${models.length || q ? 'ما لقيت شي' : 'حمّل ملفات اللعبة عشان تطلع كل الأدوات'}</div>`;
    $$('.mitem', listEl).forEach((x) => io.observe(x));
  }
  listEl.onclick = (e) => { const el = e.target.closest('.mitem'); if (!el) return; sel = things.find((t) => t.id === el.dataset.id); $$('.mitem', listEl).forEach((x) => x.classList.toggle('on', x === el)); drawEditor(); };
  $('#mq', b).oninput = () => drawList();
  $$('#mcats .chip', b).forEach((x) => x.onclick = () => { cat = x.dataset.c; $('#mq', b).value = ''; $$('#mcats .chip', b).forEach((y) => y.classList.toggle('on', y === x)); drawList(); });
  // ---- editor (one place for every measurement)
  const ed = $('#med', b); let pcv = null;
  const SL = { lower: ['فوق/تحت', -6, 10, 0.25], scale: ['الحجم', 0.2, 1.6, 0.05], x: ['يمين/يسار', -10, 10, 0.25], z: ['قدام/ورا', -10, 10, 0.25], rot: ['الميلان', -90, 90, 1], fire: ['نزّل النار', 0, 0.9, 0.01] };
  function drawEditor() {
    const t = sel; if (!t) { ed.innerHTML = ''; return; }
    const v = valsOf(t);
    const presets = t.kind === 'totem' ? [['الأصلي', [0, 1]], ['أصغر', [0, 0.6]], ['صغير', [0, 0.35]], ['صغير مرة', [0, 0.15]]] : t.kind === 'fire' ? [['عادي', [0]], ['قصير', [0.45]], ['قصير مرة', [0.6]], ['مخفي', [0.9]]] : t.kind === 'shield' ? [['قصير', [1, 0.85, 0, 0, 0]], ['قصير مرة', [2, 0.7, 0, 0, 0]], ['الأصلي', N5]] : [['Low', [2.5, 0.85, 0, 0, 0]], ['صغير', [3, 0.65, 0.5, 0, 0]], ['الأصلي', N5]];
    ed.innerHTML = `<div class="row" style="margin-bottom:10px"><h3 style="margin:0;flex:1">${esc(t.label)}</h3>${t.unit && t.unit.fam ? `<span class="muted small" title="${esc(t.unit.members.join(', '))}">ينطبق على ${t.unit.members.length} أنواع</span>` : t.kind === 'cat' ? `<span class="muted small">ينطبق على ${t.members.length} شي</span>` : ''}</div>
      ${t.kind === 'cat' || t.kind === 'blocks' || t.kind === 'everything' ? `<div class="muted small" style="margin-bottom:8px;line-height:1.6">${t.kind === 'everything' ? 'يغيّر كل الأقسام مرة وحدة (البلوكات والأسلحة والأدوات والأكل وكل شي).' : `يغيّر ${t.members.length} شي مرة وحدة. المعاينة على ${esc(itemName(t.rep))}.`} بعدها تقدر تعدّل أي شي لحاله.</div>` : ''}
      ${t.kind === 'group' ? `<div class="muted small" style="margin-bottom:8px;line-height:1.6">ينطبق على كل ${t.tool ? 'السيوف والأدوات' : 'الأشياء العادية'} اللي ما لها قياس خاص. الأداة اللي تعطيها قياس لحالها يغلب.</div>` : ''}
      <div class="fp-stage"><canvas id="mpcv"></canvas></div><div class="muted small mhint">${icon('wand', 13)}<span>${t.kind === 'totem' ? 'هذا التوتم اللي يطلع بنص الشاشة لما ينكسر — العجلة تكبّره وتصغّره' : t.kind === 'fire' ? 'اسحب لفوق أو لتحت عشان تنزّل النار' : 'اسحب الأداة بالماوس عشان تحرّكها — العجلة تكبّر وتصغّر، ومع Shift تميّلها'}</span></div><div class="hstat" id="mstat"></div>
      <div class="stack" style="gap:2px;margin-top:10px">${t.sliders.map((k, i) => `<div class="slider-row" style="grid-template-columns:90px 1fr 46px"><span>${SL[k][0]}</span><input type="range" data-i="${i}" min="${SL[k][1]}" max="${SL[k][2]}" step="${SL[k][3]}" value="${v[i]}"><output class="ltr">${k === 'fire' ? Math.round(v[i] * 100) + '%' : v[i]}</output></div>`).join('')}</div>
      <div class="row" style="margin-top:8px;gap:6px">${presets.map(([n, pv], i) => `<button class="btn sm ${n === 'الأصلي' || n === 'عادي' ? 'ghost' : ''}" data-pre="${i}">${n}</button>`).join('')}</div>`;
    pcv = $('#mpcv', ed);
    const inputs = $$('input[type=range]', ed);
    const readV = () => inputs.map((x) => +x.value);
    // drag the item in the preview to move it; the wheel makes it bigger/smaller
    const byKey = (k) => inputs[t.sliders.indexOf(k)];
    const nudge = (k, d) => { const inp = byKey(k); if (!inp) return; const v = Math.max(+inp.min, Math.min(+inp.max, +inp.value + d)); inp.value = Math.round(v / +inp.step) * +inp.step; inp.nextElementSibling.textContent = k === 'fire' ? Math.round(+inp.value * 100) + '%' : (+inp.value).toFixed(2).replace(/\.?0+$/, ''); };
    let drag = null, pend = 0;
    const commit = () => { cancelAnimationFrame(pend); pend = requestAnimationFrame(async () => { await setVals(t, readV()); render(); }); };
    pcv.style.cursor = 'grab'; pcv.style.touchAction = 'none';
    pcv.onpointerdown = (e) => { drag = { x: e.clientX, y: e.clientY }; pcv.setPointerCapture(e.pointerId); pcv.style.cursor = 'grabbing'; };
    pcv.onpointermove = (e) => {
      if (!drag) return; const r = pcv.getBoundingClientRect(), dx = e.clientX - drag.x, dy = e.clientY - drag.y; drag = { x: e.clientX, y: e.clientY };
      if (t.kind === 'fire') nudge('fire', dy / r.height * 0.9); else { nudge('x', dx / r.width * 16); nudge('lower', dy / r.height * 12); }
      commit();
    };
    pcv.onpointerup = pcv.onpointercancel = () => { drag = null; pcv.style.cursor = 'grab'; };
    pcv.onwheel = (e) => { if (t.kind === 'fire') return; e.preventDefault(); nudge(e.shiftKey ? 'rot' : 'scale', (e.deltaY < 0 ? 1 : -1) * (e.shiftKey ? 5 : 0.05)); commit(); };
    inputs.forEach((inp) => inp.oninput = async () => { inp.nextElementSibling.textContent = t.kind === 'fire' ? Math.round(+inp.value * 100) + '%' : inp.value; await setVals(t, readV()); render(); });
    $$('[data-pre]', ed).forEach((x) => x.onclick = async () => { const pv = presets[+x.dataset.pre][1]; inputs.forEach((inp, i) => { inp.value = pv[i]; inp.nextElementSibling.textContent = t.kind === 'fire' ? Math.round(pv[i] * 100) + '%' : pv[i]; }); await setVals(t, pv); render(); });
    render();
  }
  async function render() {
    const t = sel; if (!pcv || !pcv.isConnected) return;
    const r = pcv.getBoundingClientRect(); pcv.width = Math.max(320, r.width * devicePixelRatio); pcv.height = pcv.width * 9 / 16;
    if (t.kind === 'totem') {
      const x = pcv.getContext('2d'), W = pcv.width, H = pcv.height; heldDraw(pcv, { polys: [] });
      const im = await imgOf(totemRel), [l, sc] = valsOf(t);
      if (im) { const c = IMG.toCanvas(im), w = c.width, size = H * 0.62 * sc, k = ((performance.now() / 1600) % 1), grow = Math.sin(Math.min(1, k * 2.2) * Math.PI / 2);
        x.imageSmoothingEnabled = false; x.save(); x.translate(W / 2, H / 2 + l / 16 * H * 0.6); x.rotate(Math.sin(k * 9) * 0.2 * (1 - k)); const sz = size * (0.5 + 0.5 * grow); x.globalAlpha = k > 0.8 ? 1 - (k - 0.8) / 0.2 : 1; x.drawImage(c, 0, 0, w, w, -sz / 2, -sz / 2, sz, sz); x.restore(); }
      clearTimeout(render.t); render.t = setTimeout(() => sel === t && render(), 60);
    } else if (t.kind === 'fire') {
      const x = pcv.getContext('2d'), W = pcv.width, H = pcv.height, fr = fireFrame(fireCfg().lower); heldDraw(pcv, { polys: [] }); x.imageSmoothingEnabled = false; x.globalAlpha = 0.9;
      for (const rc of fireScreenRects(W, H)) { const xs = rc.map((q) => q[0]), ys = rc.map((q) => q[1]); x.drawImage(fr, Math.min(...xs), Math.min(...ys), Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)); }
      x.globalAlpha = 1;
    } else { const res = await project(t, pcv.width, pcv.height); heldDraw(pcv, res || { polys: [] }); }
    const st = await statusOf(t), box = $('#mstat', ed); if (!box) return;
    box.className = 'hstat ' + (st ? st.k : '');
    box.innerHTML = st ? `${icon(st.k === 'ok' ? 'check' : 'sun', 15)}<span>${st.t}</span>${st.k !== 'ok' && st.k !== 'cut' || (st.k === 'cut' && t.kind !== 'fire') ? `<button class="btn sm" id="mfix">${icon('wand', 14)} صلّحها لي</button>` : ''}` : `<span class="muted small">${p.baseJar ? 'ما لقيت تكستر لهذا' : 'حمّل ملفات اللعبة عشان تشوف المعاينة'}</span>`;
    const fx = $('#mfix', ed); if (fx) fx.onclick = () => fix(t);
    const row = $(`.mitem[data-id="${CSS.escape(t.id)}"] .mbadge`, listEl); if (row) { row.className = 'mbadge ' + (changed(t) && st ? st.k : ''); row.textContent = changed(t) && st ? st.s : ''; }
  }
  async function fix(t) {
    let v = valsOf(t).slice();
    for (let i = 0; i < 40; i++) {
      const st = await statusOf(t); if (!st || st.k === 'ok') break;
      if (t.kind === 'fire') v[0] = Math.max(0, v[0] - 0.05);
      else { v = pad5(v); const toward = (x, z0, st) => (x > z0 ? Math.max(z0, x - st) : Math.min(z0, x + st)); v[0] = toward(v[0], 0, 0.5); v[1] = toward(v[1], 1, 0.05); v[2] = toward(v[2], 0, 0.25); v[3] = toward(v[3], 0, 0.5); v[4] = toward(v[4], 0, 5); }
      v = v.map((x) => Math.round(x * 100) / 100);
      await setVals(t, v);
    }
    toast('ضبطتها عشان تبان زين ✓'); drawEditor();
  }
  // ready-made sets: a whole look in one click (you can still change anything after)
  const PRESETS = {
    light: { cats: [1.5, 0.85, 0, 0, 0], other: [1, 0.85, 0, 0, 0], shield: [1, 0.85, 0, 0, 0], block: [1, 0.85, 0, 0, 0], fire: 0.45, totem: 0.6, name: 'PvP خفيف' },
    strong: { cats: [2.5, 0.7, 0.5, 0, 0], other: [2, 0.7, 0, 0, 0], shield: [2, 0.7, 0, 0, 0], block: [2, 0.7, 0, 0, 0], fire: 0.6, totem: 0.35, name: 'PvP قوي' },
    bedwars: { cats: [2, 0.8, 0, 0, 0], other: [1.5, 0.75, 0, 0, 0], shield: [1.5, 0.8, 0, 0, 0], block: [1.5, 0.8, 0, 0, 0], fire: 0.5, totem: 0.5, name: 'Bedwars' },
    fps: { cats: [3, 0.65, 0.5, 0, 0], other: [3, 0.6, 0, 0, 0], shield: [2.5, 0.6, 0, 0, 0], block: [2.5, 0.6, 0, 0, 0], fire: 0.75, totem: 0.25, name: 'شاشة صافية' },
    reset: { cats: N5, other: N5, shield: N5, block: N5, fire: 0, totem: 1, name: 'الأصلي' },
  };
  $$('[data-preset]', b).forEach((bt) => bt.onclick = async () => {
    const P = PRESETS[bt.dataset.preset]; bt.disabled = true;
    for (const t of things) {
      if (t.kind === 'cat') await setVals(t, /weapons|tools/.test(t.catKey) ? P.cats : P.other);
      else if (t.kind === 'blocks') await setVals(t, P.other);
      else if (t.kind === 'shield') await setVals(t, t.block ? P.block : P.shield);
      else if (t.kind === 'fire') await setVals(t, [P.fire]);
      else if (t.kind === 'totem') await setVals(t, [0, P.totem]);
      else if (t.kind === 'item' && bt.dataset.preset === 'reset') await setVals(t, N5);
    }
    if (bt.dataset.preset === 'reset') { h.cats = {}; delete h.blocks; }
    bt.disabled = false; drawList(); drawEditor(); celebrate(); toast(`طبّقت «${P.name}» ✓ — تقدر تعدّل أي شي بعدها`);
  });
  $('#mmeas', b).onclick = () => importMeasurements(() => tabMeasure(b));
  const mc = $('#mclr', b); if (mc) mc.onclick = async () => { h.imported = {}; delete sh.imported; await saveProject(); tabMeasure(b); toast('رجعت القياسات لقياسات اللعبة'); };
  new ResizeObserver(() => render()).observe(ed);
  drawList(); drawEditor();
}

// ------------------------------------------------------------- exact first-person maths (same as Minecraft)
function heldRot(v, r, left) {
  const [rx, ry, rz] = r.map((a, i) => (left && i > 0 ? -a : a) * Math.PI / 180);
  let [x, y, z] = v;
  [x, y] = [x * Math.cos(rz) - y * Math.sin(rz), x * Math.sin(rz) + y * Math.cos(rz)];
  [x, z] = [x * Math.cos(ry) + z * Math.sin(ry), -x * Math.sin(ry) + z * Math.cos(ry)];
  [y, z] = [y * Math.cos(rx) - z * Math.sin(rx), y * Math.sin(rx) + z * Math.cos(rx)];
  return [x, y, z];
}
// same change the pack gets on install (keep in step with held:build in main.js)
function heldApply(disp, center, lower, scale, xs, z = 0, rot = 0) {
  const d = disp || { rotation: [0, -90, 25], translation: [1.13, 3.2, 1.13], scale: [0.68, 0.68, 0.68] };
  const r0 = d.rotation || [0, 0, 0], r = [r0[0], r0[1], r0[2] + (rot || 0)], t = [...(d.translation || [0, 0, 0])], S0 = d.scale || [1, 1, 1], S1 = S0.map((v) => v * scale);
  if (center) { const a = heldRot([0, 1, 2].map((i) => S0[i] * center[i]), r0), b = heldRot([0, 1, 2].map((i) => S1[i] * center[i]), r); for (let i = 0; i < 3; i++) t[i] += (a[i] - b[i]) * 16; }
  t[1] -= lower; t[0] += xs || 0; t[2] += z || 0;
  return { r, t: t.map((v) => Math.max(-80, Math.min(80, v)) / 16), s: S1.map((v) => Math.max(-4, Math.min(4, v))) };
}
// item-space quads (blocks). Normal items are centred; the shield is drawn flipped around the -0.5 corner
function cubeQuads(img, size = 1) {
  const w = img.width, h = Math.min(img.width, img.height), d = img.data, q = [], N = Math.min(16, w), k = w / N, s = size / N, o = -size / 2;
  const px = (x, y) => { const i = (Math.floor(y * k) * w + Math.floor(x * k)) * 4; return [d[i], d[i + 1], d[i + 2], d[i + 3]]; };
  const faces = [[[0, 0, 1], (a, b) => [o + a * s, -o - b * s, -o]], [[0, 0, -1], (a, b) => [-o - a * s, -o - b * s, o]], [[1, 0, 0], (a, b) => [-o, -o - b * s, -o - a * s]], [[-1, 0, 0], (a, b) => [o, -o - b * s, o + a * s]], [[0, 1, 0], (a, b) => [o + a * s, -o, o + b * s]], [[0, -1, 0], (a, b) => [o + a * s, o, -o - b * s]]];
  for (const [n, f] of faces) for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const c = px(x, y); if (c[3] < 10) continue; q.push({ p: [f(x, y), f(x + 1, y), f(x + 1, y + 1), f(x, y + 1)], c, n }); }
  return q;
}
function heldQuads(img, special, name, block) {
  if (!img) return [];
  if (block || (special && !/shield|trident/.test(name))) return cubeQuads(img);
  if (special && /shield/.test(name) && img.width >= 64) {
    const k = img.width / 64, q = [];
    Lite3D.boxQuads(img, k, 0, 0, 12, 22, 1, 0, 0, 1.5, 0, q);
    Lite3D.boxQuads(img, k, 26, 0, 2, 6, 6, 0, 0, -2, 0, q);
    return q.map((o) => ({ p: o.p.map(([x, y, z]) => [x / 16 - 0.5, y / 16 - 0.5, z / 16 - 0.5]), c: o.c, n: o.n }));
  }
  const q = Lite3D.itemQuads(img);
  return q.map((o) => ({ p: o.p.map(([x, y, z]) => [x / 16, y / 16, z / 16]), c: o.c, n: o.n }));
}
// project into the player's view: hand at (0.56,-0.52,-0.72), hand FOV is always 70°
function heldProject(quads, eff, W, H) {
  const f = 1 / Math.tan(35 * Math.PI / 180), asp = W / H, out = [];
  let minX = 1e9, minY = 1e9, maxX = -1e9, maxY = -1e9, behind = false;
  for (const o of quads) {
    const pts = o.p.map((p) => { const v = heldRot([p[0] * eff.s[0], p[1] * eff.s[1], p[2] * eff.s[2]], eff.r); return [v[0] + eff.t[0] + 0.56, v[1] + eff.t[1] - 0.52, v[2] + eff.t[2] - 0.72]; });
    let zs = 0; const sp = pts.map(([x, y, z]) => { if (z > -0.05) behind = true; const zz = Math.min(z, -0.05); zs += z; return [W / 2 + (f / asp) * (x / -zz) * W / 2, H / 2 - f * (y / -zz) * H / 2]; });
    for (const [x, y] of sp) { if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y; }
    const n = heldRot(o.n, eff.r); out.push({ sp, z: zs / 4, c: o.c, l: 0.62 + 0.38 * Math.max(0, n[2] * 0.6 + n[1] * 0.5 + 0.3) });
  }
  out.sort((a, b) => a.z - b.z);
  // count real pixels: draw small on a canvas 3× the screen and see how much lands inside it
  const RW = 96, RH = Math.round(96 / asp), c = heldProject.cv || (heldProject.cv = document.createElement('canvas'));
  c.width = RW * 3; c.height = RH * 3; const x = c.getContext('2d', { willReadFrequently: true }); x.clearRect(0, 0, c.width, c.height); x.fillStyle = '#000';
  const kx = RW / W, ky = RH / H;
  for (const o of out) { if (o.c[3] < 10) continue; x.beginPath(); o.sp.forEach(([a, b], i) => { const X = RW + a * kx, Y = RH + b * ky; i ? x.lineTo(X, Y) : x.moveTo(X, Y); }); x.closePath(); x.fill(); }
  const d = x.getImageData(0, 0, c.width, c.height).data; let tot = 0, inn = 0, top = 1e9, bot = -1;
  for (let yy = 0; yy < c.height; yy++) for (let xx = 0; xx < c.width; xx++) if (d[(yy * c.width + xx) * 4 + 3] > 40) { tot++; if (xx >= RW && xx < RW * 2 && yy >= RH && yy < RH * 2) { inn++; if (yy < top) top = yy; if (yy > bot) bot = yy; } }
  return { polys: out, box: [minX, minY, maxX, maxY], visible: tot ? inn / tot : 0, area: inn / (RW * RH), height: bot >= 0 ? (bot - top + 1) / RH : 0, behind };
}
// the part of the item you actually see in vanilla — shrinking keeps that spot in place
function heldAnchor(quads, eff, W = 1600, H = 900) {
  const f = 1 / Math.tan(35 * Math.PI / 180), asp = W / H; let sx = 0, sy = 0, sz = 0, n = 0;
  for (const o of quads) for (const p of o.p) {
    const v = heldRot([p[0] * eff.s[0], p[1] * eff.s[1], p[2] * eff.s[2]], eff.r); const x = v[0] + eff.t[0] + 0.56, y = v[1] + eff.t[1] - 0.52, z = v[2] + eff.t[2] - 0.72;
    if (z > -0.05) continue; const X = 0.5 + 0.5 * (f / asp) * x / -z, Y = 0.5 - 0.5 * f * y / -z;
    if (X >= 0 && X <= 1 && Y >= 0 && Y <= 1) { sx += p[0]; sy += p[1]; sz += p[2]; n++; }
  }
  return n ? [sx / n, sy / n, sz / n].map((v) => +v.toFixed(4)) : null;
}
// judged against how the same item looks in vanilla (some items are half off-screen even there)
function heldStatus(st, base) {
  if (!st || !isFinite(st.visible)) return null;
  const ba = base && base.area > 0 ? base.area : 0.05, bv = base && base.visible > 0 ? base.visible : 0.6;
  if (st.area < Math.min(0.004, ba * 0.12) || st.visible < bv * 0.25) return { k: 'off', t: 'طالع برا الشاشة — باللعبة ما بيبان' };
  if (st.area < ba * 0.28) return { k: 'tiny', t: 'صغير مرة — باللعبة بيصير كأنه مخفي' };
  if (st.visible < bv * 0.6) return { k: 'cut', t: 'أغلبه طالع برا الشاشة' };
  return { k: 'ok', t: 'واضح باللعبة ✓' };
}
function heldDraw(cv, res) {
  const W = cv.width, H = cv.height, x = cv.getContext('2d');
  const g = x.createLinearGradient(0, 0, 0, H * 0.55); g.addColorStop(0, '#78a7ff'); g.addColorStop(1, '#c4dcff'); x.fillStyle = g; x.fillRect(0, 0, W, H);
  x.fillStyle = '#5d9b3a'; x.fillRect(0, H * 0.55, W, H);
  for (const p of res.polys) { x.beginPath(); p.sp.forEach(([a, b], i) => (i ? x.lineTo(a, b) : x.moveTo(a, b))); x.closePath(); x.fillStyle = `rgba(${p.c[0] * p.l | 0},${p.c[1] * p.l | 0},${p.c[2] * p.l | 0},${p.c[3] / 255})`; x.fill(); x.strokeStyle = x.fillStyle; x.lineWidth = 0.6; x.stroke(); }
  const u = H / 100; x.fillStyle = 'rgba(255,255,255,.9)'; x.fillRect(W / 2 - u * 1.6, H / 2 - u * 0.25, u * 3.2, u * 0.5); x.fillRect(W / 2 - u * 0.25, H / 2 - u * 1.6, u * 0.5, u * 3.2);
  const sl = u * 8, hx = W / 2 - sl * 4.5; x.fillStyle = 'rgba(0,0,0,.4)'; x.fillRect(hx, H - sl - u, sl * 9, sl); x.strokeStyle = 'rgba(255,255,255,.85)'; x.lineWidth = u * 0.5; x.strokeRect(hx, H - sl - u, sl, sl);
}

// ------------------------------------------------------------- CIT (custom textures by item name)
const CIT_ITEMS = [['diamond_sword', 'سيف دايموند'], ['netherite_sword', 'سيف نذرايت'], ['iron_sword', 'سيف حديد'], ['golden_sword', 'سيف ذهب'], ['stone_sword', 'سيف حجر'], ['wooden_sword', 'سيف خشب'], ['bow', 'القوس'], ['crossbow', 'كروس بو'], ['fishing_rod', 'السنارة'], ['ender_pearl', 'إندر بيرل'], ['golden_apple', 'تفاحة ذهبية'], ['diamond_axe', 'فاس دايموند'], ['netherite_axe', 'فاس نذرايت'], ['diamond_pickaxe', 'معول دايموند'], ['stick', 'عصا'], ['totem_of_undying', 'التوتم'], ['trident', 'ترايدنت'], ['mace', 'الميس'], ['snowball', 'كرة ثلج'], ['potion', 'جرعة']];
const citTexFor = (id, pf) => { const t = TEXTURES.find((x) => x.id === id || (id === 'totem_of_undying' && x.id === 'totem')); if (t && texPath(t, pf)) return texPath(t, pf); return (pf <= 3 ? 'textures/items/' : 'textures/item/') + id + '.png'; };
async function tabCIT(b) {
  const p = S.project, files = await api.files.list(p.id);
  const props = files.filter((f) => /^assets\/minecraft\/optifine\/cit\/[^/]+\.properties$/.test(f));
  const rules = [];
  for (const f of props) {
    const txt = await api.file.getRaw(p.id, f) || ''; const g = (k) => (txt.match(new RegExp('^' + k.replace('.', '\\.') + '=(.*)$', 'm')) || [])[1];
    const name = (g('nbt.display.Name') || '').replace(/^ipattern:\*?|\*$/g, '').replace(/^ipattern:/, '');
    rules.push({ file: f, item: (g('items') || '').replace('minecraft:', ''), name, tex: g('texture'), contains: /\*/.test(g('nbt.display.Name') || '') });
  }
  b.innerHTML = `<div class="notice info">${icon('star', 22)}<div style="flex:1"><b>أشكال خاصة حسب اسم الأداة (CIT)</b><span class="muted small" style="line-height:1.7">سمِّ السيف بالسندان مثلاً "Excalibur" ويطلع له شكل خاص فيه. يشتغل مع OptiFine و Lunar وأي كلاينت يدعم Custom Item Textures (فعّلها من إعدادات الكلاينت).</span></div><button class="btn primary" id="cnew">${icon('plus', 16)} شكل جديد</button></div>
    <div class="tex-grid" id="cg">${rules.length ? '' : `<div class="empty" style="grid-column:1/-1"><div class="big">${icon('star', 30)}</div>ما سويت أشكال خاصة للحين</div>`}</div>`;
  const g = $('#cg', b);
  for (const r of rules) {
    const el = document.createElement('div'); el.className = 'tex';
    el.innerHTML = `<div class="pv"><span class="none">…</span></div><div class="nm">"${esc(r.name)}"</div><div class="ft"><span class="badge">${esc((CIT_ITEMS.find((x) => x[0] === r.item) || [, r.item])[1])}</span><button class="btn sm ghost icon danger" title="حذف">${icon('trash', 14)}</button></div>`;
    const texRel = 'optifine/cit/' + r.tex;
    api.tex.get(p, texRel).then(async (x) => { if (!x) return; const im = await IMG.fromB64(x.data); const c = document.createElement('canvas'); c.width = im.width; c.height = Math.min(im.width, im.height); c.getContext('2d').putImageData(im, 0, 0); $('.pv', el).innerHTML = ''; $('.pv', el).append(c); });
    el.onclick = async (e) => {
      if (e.target.closest('.danger')) { if (await confirmBox('حذف الشكل', `تحذف شكل "${esc(r.name)}"؟`, 'احذف', true)) { await api.file.remove(p.id, r.file); await api.file.remove(p.id, 'assets/minecraft/' + texRel); await api.file.remove(p.id, 'assets/minecraft/' + texRel + '.mcmeta'); tabCIT(b); } return; }
      const x = await api.tex.get(p, texRel); const meta = await api.tex.getMeta(p, texRel);
      openPixelEditor({ title: `"${esc(r.name)}"`, size: [16, 16], image: x ? await IMG.fromB64(x.data) : null, meta, onSave: async (img, mt) => { await api.tex.put(p.id, texRel, IMG.toB64(img), mt); toast('انحفظ'); tabCIT(b); } });
    };
    g.append(el);
  }
  $('#cnew', b).onclick = () => {
    const m = modal({ title: 'شكل خاص حسب الاسم', body: `<div class="stack">
      <label class="f">الأداة<select class="inp" id="ci">${CIT_ITEMS.map(([id, n]) => `<option value="${id}">${n}</option>`).join('')}<option value="__custom">أداة ثانية (اكتب الـ ID)</option></select></label>
      <input class="inp mono" id="cid" placeholder="مثلاً: netherite_pickaxe" style="display:none">
      <label class="f">الاسم اللي تكتبه بالسندان<input class="inp" id="cn" placeholder="Excalibur"></label>
      <div class="seg" id="cm"><button data-m="contains" class="on">الاسم يحتوي الكلمة</button><button data-m="exact">الاسم بالضبط</button></div>
      <div class="muted small">ابدأ الرسم من:</div><div class="seg" id="cs"><button data-s="cur" class="on">شكل الأداة الحالي</button><button data-s="blank">فاضي</button><button data-s="import">صورة من جهازي</button></div></div>`,
      foot: `<button class="btn primary" id="cgo">${icon('pencil', 16)} كمّل للرسم</button>` });
    let mode = 'contains', src = 'cur';
    $('#ci', m.el).onchange = (e) => $('#cid', m.el).style.display = e.target.value === '__custom' ? '' : 'none';
    $$('#cm button', m.el).forEach((x) => x.onclick = () => { mode = x.dataset.m; $$('#cm button', m.el).forEach((y) => y.classList.toggle('on', y === x)); });
    $$('#cs button', m.el).forEach((x) => x.onclick = () => { src = x.dataset.s; $$('#cs button', m.el).forEach((y) => y.classList.toggle('on', y === x)); });
    $('#cgo', m.el).onclick = async () => {
      const item = $('#ci', m.el).value === '__custom' ? $('#cid', m.el).value.trim().replace(/^minecraft:/, '').toLowerCase() : $('#ci', m.el).value;
      const name = $('#cn', m.el).value.trim();
      if (!item || !/^[a-z0-9_]+$/.test(item)) return toast('اكتب ID صحيح بالإنجليزي', 'err');
      if (!name) return toast('اكتب الاسم', 'err');
      let start = null;
      if (src === 'cur') { const r = await api.tex.get(p, citTexFor(item, p.packFormat)); if (r) start = await IMG.fromB64(r.data); }
      if (src === 'import') { const f = await api.fs.pickFiles('اختر صورة', ['png', 'jpg', 'jpeg', 'webp']); if (!f) return; const ext = f[0].split('.').pop().toLowerCase(); const im = await IMG.load(`data:image/${ext === 'jpg' ? 'jpeg' : ext};base64,` + await api.fs.readB64(f[0])); const n = Math.max(16, Math.min(128, im.width)); start = IMG.resize(im, n, n); }
      m.close(true);
      const slug = (item + '_' + (name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || Date.now().toString(36))).slice(0, 48);
      const pat = mode === 'contains' ? `ipattern:*${name}*` : `ipattern:${name}`;
      const id = p.packFormat >= 4 ? 'minecraft:' + item : item;
      openPixelEditor({ title: `${esc(name)}`, size: [16, 16], image: start, onSave: async (img, mt) => {
        await api.tex.put(p.id, 'optifine/cit/' + slug + '.png', IMG.toB64(img), mt);
        let txt = `# MC Pack Studio — custom texture for "${name}"\ntype=item\nitems=${id}\ntexture=${slug}.png\nnbt.display.Name=${pat}\n`;
        if (p.packFormat >= 32) txt += `components.custom_name=${pat}\n`;
        await api.file.putRaw(p.id, 'assets/minecraft/optifine/cit/' + slug + '.properties', txt);
        toast(`انحفظ — سمِّ ${esc((CIT_ITEMS.find((x) => x[0] === item) || [, item])[1])} "${esc(name)}" باللعبة`); tabCIT(b);
      } });
    };
  };
}

// ------------------------------------------------------------- merge packs
const MERGE_GROUPS = [['g_item', 'الآيتمز (كل الأدوات)', 'sword'], ['g_block', 'البلوكات', 'layers'], ['g_entity', 'الموبات والكيانات', 'user'], ['g_gui', 'الواجهة', 'monitor'], ['g_particle', 'الجزيئات', 'wand'], ['g_env', 'السما والطقس', 'sun'], ['g_misc', 'باقي التكسترات', 'image'], ['g_font', 'الخطوط', 'edit'], ['g_sound', 'الأصوات', 'sound'], ['g_model', 'الموديلات', 'file'], ['g_optifine', 'OptiFine (سما، CIT...)', 'star'], ['g_other', 'ملفات أخرى', 'file']];
function mergeGroup(rel) {
  if (/\/optifine\/|\/mcpatcher\//.test(rel)) return 'g_optifine';
  if (/\.ogg$|\/sounds\.json$/.test(rel)) return 'g_sound';
  if (/\/(models|items|blockstates)\//.test(rel)) return 'g_model';
  if (/\/font\//.test(rel)) return 'g_font';
  const m = rel.match(/\/textures\/([^/]+)\//); if (!m) return 'g_other';
  return { item: 'g_item', items: 'g_item', block: 'g_block', blocks: 'g_block', entity: 'g_entity', gui: 'g_gui', particle: 'g_particle', environment: 'g_env' }[m[1]] || 'g_misc';
}
async function openMerge() {
  const p = S.project, packs = await api.merge.open();
  if (!packs || !packs.length) return;
  const ok = packs.filter((x) => !x.error);
  if (!ok.length) return toast('ما قدرت أقرأ الباكات', 'err');
  const pf = p.packFormat;
  // old packs (1.8…1.12: textures/blocks, wool_colored_red…) get the modern names so every block works
  let legacyN = 0;
  for (const k of ok) { k.src = {}; k.files = k.files.map((f) => { const d = pf >= 4 ? LEGACY.map(f, pf) : f; if (d !== f) legacyN++; k.src[d] = f; return d; }); }
  const srcOf = (i, rel) => ok[i].src[rel] || rel;
  const pairs = (i, rels) => rels.flatMap((r) => (r.endsWith('.png') ? [[srcOf(i, r), r], [srcOf(i, r + '.mcmeta'), r + '.mcmeta']] : [[srcOf(i, r), r]]));
  // every file that any of the packs changes (not just the textures the app knows by name)
  const known = {}; TEXTURES.forEach((t) => { const r = texPath(t, pf); if (r) known['assets/minecraft/' + r] = t; });
  const sets = ok.map((k) => new Set(k.files));
  const allRels = [...new Set(ok.flatMap((k) => k.files))].filter((r) => !r.endsWith('.mcmeta') || !sets.some((st) => st.has(r.slice(0, -7)))).sort();
  const items = allRels.map((rel) => { const t = known[rel]; return { rel, t, cat: t ? t.cat : mergeGroup(rel), name: t ? t.name : rel.split('/').pop().replace(/\.(png|json|ogg|properties|mcmeta|txt)$/, '').replace(/_/g, ' '), png: rel.endsWith('.png'), in: ok.map((k, i) => (sets[i].has(rel) ? i : -1)).filter((i) => i >= 0) }; });
  // all swords / axes / armor… become one row: picking a pack changes every one of them
  const famOfRel = (rel) => { let m = rel.match(/^assets\/minecraft\/textures\/(items?|blocks?)\/([a-z0-9_]+)\.png$/); if (m && !/overlay|_top$|_bottom$|_side$|_front$|_inner$|_end$/.test(m[2])) { const f = itemFamily(m[2]); return f ? (m[1].startsWith('item') ? 'i:' : 'b:') + f : null; } m = rel.match(/^assets\/minecraft\/textures\/entity\/equipment\/(humanoid|humanoid_leggings)\/[a-z_]+\.png$/); if (m) return 'e:' + m[1]; m = rel.match(/^assets\/minecraft\/textures\/models\/armor\/[a-z]+_layer_([12])\.png$/); if (m) return 'e:layer' + m[1]; return null; };
  const famLabelM = (k) => ({ 'e:humanoid': 'كل الدروع وهي ملبوسة (فوق)', 'e:humanoid_leggings': 'كل البناطيل وهي ملبوسة', 'e:layer1': 'كل الدروع وهي ملبوسة (فوق)', 'e:layer2': 'كل البناطيل وهي ملبوسة' })[k] || famLabel(k.slice(2));
  const fams = {}; items.forEach((x) => { const k = famOfRel(x.rel); if (k) (fams[k] = fams[k] || []).push(x); });
  for (const [k, list] of Object.entries(fams)) {
    if (list.length < 2) continue;
    const rep = list.find((x) => /diamond/.test(x.rel)) || list[0];
    const row = { rel: 'fam:' + k, fam: true, members: list.map((x) => x.rel), thumb: rep.rel, t: null, cat: rep.cat, name: famLabelM(k) + ` (${list.length})`, png: true, in: ok.map((_, i) => (list.some((x) => x.in.includes(i)) ? i : -1)).filter((i) => i >= 0) };
    const at = items.indexOf(list[0]); list.forEach((x) => items.splice(items.indexOf(x), 1)); items.splice(Math.min(at, items.length), 0, row);
  }
  const choice = {}; // rel -> pack index | -1 (keep)
  const m = modal({ cls: 'xl', title: `${icon('layers', 18)} دمج الباكات`, sub: `${ok.length} باك — اختر من كل باك اللي يعجبك`,
    body: `<div class="merge-split"><aside class="merge-side">
        <div class="muted small">باك أساسي (ياخذ منه كل شي، وبعدها اختياراتك فوقه):</div>
        <select class="inp" id="mbase"><option value="-1">بدون — بس اللي أختاره</option>${ok.map((k, i) => `<option value="${i}">${esc(k.name)}</option>`).join('')}</select>
        <div class="muted small" style="margin-top:8px">اختر كل شي من باك واحد:</div>
        ${ok.map((k, i) => `<button class="btn sm" data-all="${i}">كله من ${esc(k.name.slice(0, 18))}</button>`).join('')}
        <div class="muted small" style="margin-top:8px">الأقسام:</div><div id="mnav" class="merge-nav"></div>
      </aside><div class="merge-main" id="mmain"><div id="mlist"></div></div></div>`,
    foot: `<button class="btn primary" id="mgo">${icon('check', 16)} ادمج في الباك</button><span class="muted small" id="mcount"></span>` });
  const list = $('#mlist', m.el);
  const groups = [...CATEGORIES.map((c) => [c.id, c.name, c.icon]), ...MERGE_GROUPS].filter(([id]) => items.some((x) => x.cat === id));
  list.innerHTML = `<div class="muted small" style="margin-bottom:6px">${items.length} ملف متغيّر بالباكات${legacyN ? ` · ${icon('check', 13)} حوّلت ${legacyN} ملف من باك قديم (1.8) لأسماء النسخة الجديدة` : ''}</div>` + groups.map(([id, name, ic]) => { const its = items.filter((x) => x.cat === id); return `<details class="mgrp" open id="mg-${id}"><summary><h3 style="display:inline-flex;gap:8px;align-items:center;margin:14px 0 10px">${icon(ic, 16)} ${name} <span class="badge">${its.length}</span></h3>
      <span class="mg-all">${ok.map((k, i) => `<button class="btn sm ghost" data-gall="${i}" data-g="${id}">كله من ${esc(k.name.slice(0, 12))}</button>`).join('')}</span></summary>` + its.map((x) => `
    <div class="mrow" data-rel="${esc(x.rel)}" title="${esc(x.rel)}"><b class="small" style="width:170px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(x.name)}</b>
      <div class="mopt on" data-i="-1"><span class="small muted">بدون تغيير</span></div>
      ${ok.map((k, i) => x.in.includes(i) ? `<div class="mopt" data-i="${i}">${x.png ? '<canvas></canvas>' : `<span class="ftype">${esc(x.rel.split('.').pop())}</span>`}<span class="small">${esc(k.name.slice(0, 16))}</span></div>` : `<div class="mopt off"><span class="dim small">—</span></div>`).join('')}</div>`).join('') + '</details>'; }).join('');
  $('#mnav', m.el).innerHTML = groups.map(([id, name, ic]) => `<button data-go="${id}">${icon(ic, 14)}<span>${name}</span><b>${items.filter((x) => x.cat === id).length}</b></button>`).join('');
  $$('#mnav [data-go]', m.el).forEach((bt) => bt.onclick = () => $('#mg-' + bt.dataset.go, m.el).scrollIntoView({ behavior: 'smooth', block: 'start' }));
  list.addEventListener('click', (e) => { const g = e.target.closest('[data-gall]'); if (!g) return; e.preventDefault(); const i = +g.dataset.gall; $$('.mrow', g.closest('.mgrp')).forEach((row) => { const o = $(`.mopt[data-i="${i}"]`, row); if (o) { $$('.mopt', row).forEach((x) => x.classList.toggle('on', x === o)); choice[row.dataset.rel] = i; } }); count(); });
  const count = () => { const n = Object.values(choice).filter((v) => v >= 0).length; $('#mcount', m.el).textContent = n ? `${n} تكستر مختار` : ''; };
  list.onclick = (e) => {
    const o = e.target.closest('.mopt:not(.off)'); if (!o) return; const row = o.closest('.mrow');
    $$('.mopt', row).forEach((x) => x.classList.toggle('on', x === o)); choice[row.dataset.rel] = +o.dataset.i; count();
  };
  $$('[data-all]', m.el).forEach((b) => b.onclick = () => { const i = +b.dataset.all; $$('.mrow', list).forEach((row) => { const o = $(`.mopt[data-i="${i}"]`, row); if (o) { $$('.mopt', row).forEach((x) => x.classList.toggle('on', x === o)); choice[row.dataset.rel] = i; } }); count(); });
  // lazy thumbnails
  const io = new IntersectionObserver((ents) => ents.forEach(async (en) => {
    if (!en.isIntersecting) return; io.unobserve(en.target); const row = en.target;
    const it = items.find((x) => x.rel === row.dataset.rel);
    for (const o of $$('.mopt[data-i]', row)) { const i = +o.dataset.i; if (i < 0 || !$('canvas', o)) continue; const tr = it && it.fam ? (it.members.find((r) => /diamond/.test(r) && sets[i].has(r)) || it.members.find((r) => sets[i].has(r))) : row.dataset.rel; const b64 = await api.merge.read(ok[i].path, srcOf(i, tr)); if (!b64) continue; const im = await IMG.fromB64(b64); const c = $('canvas', o); c.width = im.width; c.height = Math.min(im.width, im.height); c.getContext('2d').putImageData(im, 0, 0); }
  }), { root: $('#mmain', m.el), rootMargin: '200px' });
  $$('.mrow', list).forEach((r) => io.observe(r));
  $('#mgo', m.el).onclick = async () => {
    $('#mgo', m.el).disabled = true;
    await api.snap.create(p.id, 'تلقائي: قبل دمج الباكات');
    const base = +$('#mbase', m.el).value; let n = 0;
    if (base >= 0) n += await api.merge.copy(p.id, ok[base].path, ok[base].files.map((r) => [srcOf(base, r), r]));
    for (const [rel, i] of Object.entries(choice)) {
      if (i < 0) continue; const it = items.find((x) => x.rel === rel);
      const rels = it && it.fam ? it.members.filter((r) => sets[i].has(r)) : [rel];
      n += await api.merge.copy(p.id, ok[i].path, pairs(i, rels));
    }
    m.close(true); toast(`اندمج ✓ (${n} ملف) — حفظت نسخة احتياطية قبل الدمج`); renderTab();
  };
}

// ------------------------------------------------------------- pack checker
async function openChecker() {
  const p = S.project;
  const r = await api.pack.check(p);
  const lv = { err: ['خطأ', 'var(--err)', 'x'], warn: ['انتبه', 'var(--warn)', 'sun'], info: ['ملاحظة', 'var(--a2)', 'check'] };
  const fixable = r.issues.filter((x) => x.fix);
  const m = modal({ cls: 'lg', title: `${icon('check', 18)} فحص الباك`, sub: `${r.files} ملف · ${(r.size / 1048576).toFixed(2)} MB`,
    body: r.issues.length ? `<div class="stack" style="gap:8px">${r.issues.map((x) => `<div class="chk"><span class="ci" style="color:${lv[x.level][1]}">${icon(lv[x.level][2], 18)}</span><div style="flex:1;min-width:0"><b class="small">${esc(x.msg)}</b>${x.file ? `<div class="dim small ltr" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(x.file.replace('assets/minecraft/', ''))}</div>` : ''}</div>${x.fix ? `<span class="badge">${x.fix === 'delete' ? 'بينحذف' : 'بيتصلّح'}</span>` : ''}</div>`).join('')}</div>`
      : `<div class="empty"><div class="big">${icon('check', 34)}</div><h2>الباك سليم 👌</h2><p class="muted">ما لقيت أي مشكلة، جاهز تثبّته.</p></div>`,
    foot: fixable.length ? `<button class="btn primary" id="kfix">${icon('wand', 16)} صلّح الكل (${fixable.length})</button><span class="muted small">بحفظ نسخة احتياطية قبل</span>` : `<button class="btn primary" id="kok">تمام</button>` });
  if ($('#kok', m.el)) $('#kok', m.el).onclick = () => m.close(true);
  if ($('#kfix', m.el)) $('#kfix', m.el).onclick = async () => { await api.snap.create(p.id, 'تلقائي: قبل فحص الباك'); const n = await api.pack.fix(p, fixable); m.close(true); toast(`صلّحت ${n} مشكلة ✓`); renderTab(); };
}

// ------------------------------------------------------------- armor & elytra colors (3D)
const ARMOR_MATS = [['diamond', 'دايموند'], ['netherite', 'نذرايت'], ['iron', 'حديد'], ['gold', 'ذهب'], ['chainmail', 'سلاسل'], ['leather', 'جلد']];
const armorPaths = (mat, pf) => pf >= 42
  ? [`textures/entity/equipment/humanoid/${mat}.png`, `textures/entity/equipment/humanoid_leggings/${mat}.png`]
  : [`textures/models/armor/${mat}_layer_1.png`, `textures/models/armor/${mat}_layer_2.png`];
const ARMOR_DEF = { diamond: '#3b82f6', netherite: '#ef4444', iron: '#e5e7eb', gold: '#facc15', chainmail: '#9ca3af', leather: '#a16207' };
const armorItemPaths = (mat) => { const n = mat === 'gold' ? 'golden' : mat; return ['helmet', 'chestplate', 'leggings', 'boots'].map((x) => `textures/item/${n}_${x}.png`); };
// ---------- armor & elytra style: colour + pattern + glow (keeps the game's shading)
const SWATCHES = ['#ef4444', '#f97316', '#facc15', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#ffffff', '#111111'];
const PATTERNS = [['solid', 'سادة'], ['grad', 'تدرّج'], ['camo', 'كامو'], ['rainbow', 'قوس قزح'], ['galaxy', 'جالكسي']];
function styleTex(img, st) {
  if (!img || !st || !st.on) return img;
  const W = img.width, H = img.height, out = IMG.clone(img), d = out.data, src = img.data, k = Math.max(1, W / 64);
  const c1 = hexRgb(st.color || '#3b82f6'), c2 = hexRgb(st.color2 || '#111111'), s = st.s === undefined ? 0.9 : st.s;
  const hash = (x, y) => { const v = Math.sin(x * 127.1 + y * 311.7 + (st.seed || 0) * 17.3) * 43758.5453; return v - Math.floor(v); };
  const noise = (x, y) => { const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), e = hash(xi + 1, yi + 1), u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf); return a + (b - a) * u + (c - a) * v * (1 - u) + (e - b) * u * v; };
  const alpha = (x, y) => (x < 0 || y < 0 || x >= W || y >= H ? 0 : src[(y * W + x) * 4 + 3]);
  const gc = hexRgb(st.glowColor || st.color || '#ffffff');
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = (y * W + x) * 4; if (src[i + 3] < 8) continue;
    const lum = (0.299 * src[i] + 0.587 * src[i + 1] + 0.114 * src[i + 2]) / 255;
    let c = c1;
    if (st.pattern === 'grad') { const t = y / H; c = c1.map((v, j) => v + (c2[j] - v) * t); }
    else if (st.pattern === 'camo') { const n = noise(x / (3 * k), y / (3 * k)) * 0.65 + noise(x / (1.5 * k), y / (1.5 * k)) * 0.35; c = n < 0.38 ? c2 : n < 0.62 ? c1 : c1.map((v, j) => (v + c2[j]) / 2 * 0.75); }
    else if (st.pattern === 'rainbow') c = hslRgb(((x + y) / (W * 0.6)) % 1, 0.85, 0.55);
    else if (st.pattern === 'galaxy') { const n = noise(x / (4 * k), y / (4 * k)); c = c1.map((v, j) => v * (1 - n) + c2[j] * n); if (hash(x, y) > 0.965) c = [255, 255, 255]; }
    const shade = 0.3 + 0.95 * lum, t = [c[0] * shade, c[1] * shade, c[2] * shade].map((v) => Math.min(255, v));
    for (let j = 0; j < 3; j++) d[i + j] = src[i + j] + (t[j] - src[i + j]) * s;
    // glow: brighten the edges of every piece (next to an empty pixel) toward the glow colour
    if (st.glow) {
      let edge = 0; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (alpha(x + dx, y + dy) < 8) edge = 1;
      const g = st.glow * (edge ? 1 : 0.18 * lum);
      for (let j = 0; j < 3; j++) d[i + j] = Math.min(255, d[i + j] + (gc[j] * 1.1 + 40 - d[i + j]) * g);
    }
  }
  return out;
}
// only the glowing pixels — OptiFine/Lunar draw "_e" textures at full brightness (glow in the dark)
function emissiveOf(styled, st) {
  if (!styled || !st || !st.glow || !st.emissive) return null;
  const W = styled.width, H = styled.height, out = new ImageData(W, H), a = (x, y) => (x < 0 || y < 0 || x >= W || y >= H ? 0 : styled.data[(y * W + x) * 4 + 3]);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = (y * W + x) * 4; if (styled.data[i + 3] < 8) continue; let edge = false; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (a(x + dx, y + dy) < 8) edge = true; if (edge) { out.data.set(styled.data.subarray(i, i + 4), i); } }
  return out;
}
async function putStyled(p, rel, base, st) {
  const e = rel.replace(/\.png$/, '_e.png');
  if (!st || !st.on) { await api.tex.reset(p.id, rel); await api.tex.reset(p.id, e); return; }
  const im = styleTex(base, st); await api.tex.put(p.id, rel, IMG.toB64(im));
  const em = emissiveOf(im, st);
  if (em) { await api.tex.put(p.id, e, IMG.toB64(em)); await api.file.putRaw(p.id, 'assets/minecraft/optifine/emissive.properties', 'suffix.emissive=_e\n'); } else await api.tex.reset(p.id, e);
}
async function tabArmor(b) {
  const p = S.project;
  p.armorTint = p.armorTint || {};
  const st = (m) => (p.armorTint[m] = Object.assign({ color: ARMOR_DEF[m], color2: '#111111', pattern: 'solid', s: 0.9, on: false, icons: true, glow: 0, emissive: false }, p.armorTint[m] || {}));
  const est = () => (p.elytraTint = Object.assign({ color: '#8b5cf6', color2: '#111111', pattern: 'solid', s: 0.9, on: false, glow: 0, emissive: false }, p.elytraTint || {}));
  let mat = 'diamond', target = 'armor';
  b.innerHTML = `${p.baseJar ? '' : noBaseNotice()}
  <div class="two" style="grid-template-columns:minmax(360px,460px) 1fr">
    <div class="card stack">
      <div class="seg" id="atarget"><button data-t="armor" class="on">${icon('shield', 15)} الدروع</button><button data-t="elytra">${icon('wand', 15)} الإليترا</button></div>
      <div id="arm-only" class="stack" style="gap:8px">
        <div class="muted small">اضغط على اللون جنب الدرع — ينحفظ لحاله</div>
        <div class="mat-list" id="mats">${ARMOR_MATS.map(([k, n]) => `<div class="mat-row2 ${k === mat ? 'sel' : ''}" data-m="${k}"><span class="mat-name">${n}</span>
          <span class="sw-row">${SWATCHES.map((c) => `<button class="sw" data-c="${c}" style="background:${c}"></button>`).join('')}<input type="color" data-col title="لون من عندك"><button class="sw orig" data-orig title="الأصلي">${icon('reset', 12)}</button></span></div>`).join('')}</div>
        <div class="row" style="gap:6px"><span class="muted small">كل الدروع بلون واحد:</span>${SWATCHES.slice(0, 8).map((c) => `<button class="sw" data-all="${c}" style="background:${c}"></button>`).join('')}<button class="btn sm ghost" id="aallorig">${icon('reset', 13)} كلها أصلي</button></div>
      </div>
      <div id="ely-only" class="stack" style="gap:8px;display:none">
        <div class="row" style="gap:6px"><span class="muted small">لون الإليترا:</span>${SWATCHES.map((c) => `<button class="sw" data-ec="${c}" style="background:${c}"></button>`).join('')}<input type="color" id="ecol"><button class="sw orig" id="eorig" title="الأصلي">${icon('reset', 12)}</button></div>
        <div class="row"><button class="btn sm" id="eimg">${icon('image', 15)} حط صورة عليها</button><button class="btn sm" id="edraw">${icon('edit', 15)} ارسمها وأنت طاير</button></div>
      </div>
      <h3 style="margin:8px 0 0">${icon('star', 16)} النقشة <span class="muted small" id="stfor"></span></h3>
      <div class="seg wrap" id="apat">${PATTERNS.map(([k, n]) => `<button data-p="${k}">${n}</button>`).join('')}</div>
      <div class="row" id="c2row"><span class="muted small">اللون الثاني:</span>${SWATCHES.map((c) => `<button class="sw" data-c2="${c}" style="background:${c}"></button>`).join('')}<input type="color" id="acol2"></div>
      <h3 style="margin:8px 0 0">${icon('sun', 16)} الجلو</h3>
      <div class="slider-row" style="grid-template-columns:90px 1fr 46px"><span>قوة الجلو</span><input type="range" id="aglow" min="0" max="100"><output class="ltr"></output></div>
      <label class="check small"><span class="switch"><input type="checkbox" id="aemis"><span></span></span>يضوي بالظلام (OptiFine / Lunar)</label>
      <div class="slider-row" style="grid-template-columns:90px 1fr 46px"><span>قوة اللون</span><input type="range" id="astr" min="10" max="100"><output class="ltr"></output></div>
      <label class="check small" id="iconsrow"><span class="switch"><input type="checkbox" id="aicons"><span></span></span>لوّن أيقونات الدروع بعد (بالإنفنتوري)</label>
      <div class="hstat ok" id="asaved" style="visibility:hidden">${icon('check', 15)}<span>انحفظ</span></div>
    </div>
    <div class="card"><h3 id="pvtitle">معاينة 3D</h3><div class="v3d" id="pvbox" style="height:540px"><canvas id="a3d"></canvas></div>
      <div class="row" style="margin-top:8px" id="aparts">${[['helmet', 'خوذة'], ['chest', 'صدرية'], ['legs', 'بنطلون'], ['boots', 'بوت']].map(([k, n]) => `<label class="check small"><span class="switch"><input type="checkbox" data-p="${k}" checked><span></span></span>${n}</label>`).join('')}</div></div></div>`;
  bindBaseActions(b);
  const skin = (await realSteve()) || defaultSkin();
  const bases = {}; let v = null;
  const parts = () => Object.fromEntries($$('#aparts input', b).map((x) => [x.dataset.p, x.checked]));
  const baseOf = async (m) => { if (!bases[m]) { const [r1, r2] = armorPaths(m, p.packFormat); bases[m] = [await texImg(p, r1), await texImg(p, r2)]; } return bases[m]; };
  const eRel = texPath(TEXTURES.find((t) => t.id === 'elytra_wings'), p.packFormat), eOrig = eRel ? await texImg(p, eRel) : null;
  let eCustom = null; // a picture / drawing the user put on the elytra
  const cur = () => (target === 'armor' ? st(mat) : est());
  async function draw() {
    if (target === 'armor') {
      const s = st(mat), [b1, b2] = await baseOf(mat);
      $('#pvtitle', b).textContent = 'معاينة 3D — ' + ARMOR_MATS.find((x) => x[0] === mat)[1];
      const q = [...Lite3D.skinQuads(skin, false, true), ...Lite3D.armorQuads(b1 && styleTex(b1, s), b2 && styleTex(b2, s), false, parts())];
      if (!v || v.kind !== 'a') { if (v) v.stop(); $('#pvbox', b).classList.remove('sky3d'); v = Lite3D.viewer($('#a3d', b), q, { dist: 62, pitch: 0.15 }); v.kind = 'a'; } else v.set(q);
    } else {
      const e = est(), im = eCustom || (e.on ? styleTex(eOrig, e) : eOrig);
      $('#pvtitle', b).textContent = 'الإليترا وأنت طاير ✈';
      const q = Lite3D.flyingQuads(skin, im, 1);
      if (!v || v.kind !== 'e') { if (v) v.stop(); $('#pvbox', b).classList.add('sky3d'); v = Lite3D.viewer($('#a3d', b), q, { dist: 70, pitch: 0.55, yaw: Math.PI }); v.kind = 'e'; } else v.set(q);
    }
  }
  function syncUI() {
    const s = cur();
    $('#stfor', b).textContent = target === 'armor' ? '— ' + ARMOR_MATS.find((x) => x[0] === mat)[1] : '— الإليترا';
    $$('#apat button', b).forEach((x) => x.classList.toggle('on', x.dataset.p === s.pattern));
    $('#c2row', b).style.display = s.pattern === 'grad' || s.pattern === 'camo' || s.pattern === 'galaxy' ? '' : 'none';
    $('#acol2', b).value = s.color2; $('#aglow', b).value = Math.round((s.glow || 0) * 100); $('#aemis', b).checked = !!s.emissive; $('#astr', b).value = Math.round(s.s * 100);
    $('#aicons', b).checked = s.icons !== false; $('#iconsrow', b).style.display = target === 'armor' ? '' : 'none';
    $$('.slider-row output', b).forEach((o) => o.textContent = o.previousElementSibling.value + '%');
    $$('.mat-row2', b).forEach((r) => { const m = r.dataset.m, x = st(m); r.classList.toggle('sel', m === mat && target === 'armor'); r.querySelectorAll('[data-c]').forEach((sw) => sw.classList.toggle('on', x.on && sw.dataset.c === x.color)); r.querySelector('[data-col]').value = x.color; r.querySelector('[data-orig]').classList.toggle('on', !x.on); });
    $$('[data-ec]', b).forEach((sw) => sw.classList.toggle('on', est().on && sw.dataset.ec === est().color)); $('#ecol', b).value = est().color; $('#eorig', b).classList.toggle('on', !est().on && !eCustom);
  }
  // saves by itself (a moment after the last change)
  let saveT = 0;
  const changed = (what) => { syncUI(); draw(); clearTimeout(saveT); saveT = setTimeout(() => save(what), 450); };
  async function save(what) {
    if (what === 'elytra') { if (eRel && !eCustom) await putStyled(p, eRel, eOrig, est()); }
    else for (const m of what === 'all' ? ARMOR_MATS.map((x) => x[0]) : [what]) {
      const s = st(m), [r1, r2] = armorPaths(m, p.packFormat), [b1, b2] = await baseOf(m);
      if (b1) await putStyled(p, r1, b1, s); if (b2) await putStyled(p, r2, b2, s);
      for (const ip of armorItemPaths(m)) { const im = await texImg(p, ip); if (im) await putStyled(p, ip, im, s.on && s.icons !== false ? s : null); }
    }
    await saveProject(); const sv = $('#asaved', b); if (sv) { sv.style.visibility = 'visible'; clearTimeout(sv.t); sv.t = setTimeout(() => (sv.style.visibility = 'hidden'), 1500); }
  }
  const selMat = (m) => { mat = m; syncUI(); draw(); };
  $$('.mat-row2', b).forEach((r) => {
    const m = r.dataset.m;
    r.onclick = (e) => { if (!e.target.closest('button,input')) selMat(m); };
    r.querySelectorAll('[data-c]').forEach((sw) => sw.onclick = () => { mat = m; Object.assign(st(m), { color: sw.dataset.c, on: true }); changed(m); });
    r.querySelector('[data-col]').oninput = (e) => { mat = m; Object.assign(st(m), { color: e.target.value, on: true }); changed(m); };
    r.querySelector('[data-orig]').onclick = () => { mat = m; st(m).on = false; changed(m); };
  });
  $$('[data-all]', b).forEach((sw) => sw.onclick = () => { ARMOR_MATS.forEach(([m]) => Object.assign(st(m), { color: sw.dataset.all, on: true })); changed('all'); });
  $('#aallorig', b).onclick = () => { ARMOR_MATS.forEach(([m]) => (st(m).on = false)); changed('all'); };
  const key = () => (target === 'armor' ? mat : 'elytra');
  $$('#apat button', b).forEach((x) => x.onclick = () => { const s = cur(); s.pattern = x.dataset.p; s.on = true; if (target === 'elytra') eCustom = null; changed(key()); });
  $$('[data-c2]', b).forEach((sw) => sw.onclick = () => { cur().color2 = sw.dataset.c2; cur().on = true; changed(key()); });
  $('#acol2', b).oninput = (e) => { cur().color2 = e.target.value; cur().on = true; changed(key()); };
  $('#aglow', b).oninput = (e) => { cur().glow = +e.target.value / 100; cur().on = true; changed(key()); };
  $('#aemis', b).onchange = (e) => { cur().emissive = e.target.checked; if (e.target.checked && !cur().glow) cur().glow = 0.6; cur().on = true; changed(key()); };
  $('#astr', b).oninput = (e) => { cur().s = +e.target.value / 100; changed(key()); };
  $('#aicons', b).onchange = (e) => { st(mat).icons = e.target.checked; changed(mat); };
  $$('#aparts input', b).forEach((x) => x.onchange = draw);
  $$('#atarget button', b).forEach((x) => x.onclick = () => { target = x.dataset.t; $$('#atarget button', b).forEach((y) => y.classList.toggle('on', y === x)); $('#arm-only', b).style.display = target === 'armor' ? '' : 'none'; $('#ely-only', b).style.display = target === 'elytra' ? '' : 'none'; $('#aparts', b).style.display = target === 'armor' ? '' : 'none'; syncUI(); draw(); });
  // elytra colour / picture / drawing
  $$('[data-ec]', b).forEach((sw) => sw.onclick = () => { eCustom = null; Object.assign(est(), { color: sw.dataset.ec, on: true }); changed('elytra'); });
  $('#ecol', b).oninput = (e) => { eCustom = null; Object.assign(est(), { color: e.target.value, on: true }); changed('elytra'); };
  $('#eorig', b).onclick = async () => { eCustom = null; est().on = false; changed('elytra'); };
  $('#eimg', b).onclick = () => elytraFromImage(p, eOrig, async (img, edit) => {
    if (edit) return drawElytra(img);
    eCustom = img; est().on = false; await api.tex.put(p.id, eRel, IMG.toB64(img)); await saveProject(); syncUI(); draw(); celebrate(); toast('انحطت الصورة على الإليترا ✓');
  });
  $('#edraw', b).onclick = () => drawElytra(eCustom || (est().on ? styleTex(eOrig, est()) : eOrig));
  function drawElytra(start) {
    if (!eOrig) return toast('ما لقيت تكستر الإليترا', 'err');
    let fv = null;
    openPixelEditor({
      title: 'الإليترا — ارسم وأنت طاير', image: start, original: eOrig, size: [start ? start.width : 64, start ? start.height : 32], fileName: 'elytra', extraTitle: 'وأنت طاير ✈',
      renderExtra(box, cv) {
        const img = cv.getContext ? cv.getContext('2d').getImageData(0, 0, cv.width, cv.height) : cv;
        if (!fv || !box.querySelector('canvas')) { box.innerHTML = '<div class="v3d sky3d" style="height:260px"><canvas></canvas></div>'; fv = Lite3D.viewer(box.querySelector('canvas'), Lite3D.flyingQuads(skin, img, 1), { dist: 70, pitch: 0.55, yaw: Math.PI }); return; }
        cancelAnimationFrame(fv.pend); fv.pend = requestAnimationFrame(() => fv.set(Lite3D.flyingQuads(skin, img, 1)));
      },
      onSave: async (img) => { eCustom = img; est().on = false; await api.tex.put(p.id, eRel, IMG.toB64(img)); await saveProject(); syncUI(); draw(); toast('انحفظت الإليترا ✓'); },
      onReset: async () => { eCustom = null; await api.tex.reset(p.id, eRel); draw(); },
    });
  }
  syncUI(); draw();
}

// ------------------------------------------------------------- guided tour (first run)
const TOURS = {
  app: [
    { t: 'هلا فيك 👋', d: 'هذا MC Pack Studio — تسوي فيه ريسورس باك لماينكرافت بسهولة وبدون خبرة. خلني أوريك كل شي بسرعة.' },
    { el: '#newp', t: 'سوّ باك جديد', d: 'من هنا تبدأ. تختار الكلاينت (Lunar أو غيره) وقالب جاهز مثل PvP، وخلاص.' },
    { el: '#side [data-v=packs]', t: 'باكاتي', d: 'كل الباكات اللي سويتها تلقاها هنا. تقدر تكمّل عليها بأي وقت.' },
    { el: '#side [data-v=skins]', t: 'السكنات', d: 'ارسم سكنك على الشخصية مباشرة، وشوفه 3D.' },
    { el: '#side [data-v=mods]', t: 'المودات', d: 'فعّل أو عطّل أو احذف المودات حقت الكلاينت.' },
    { el: '#side [data-v=clients]', t: 'الكلاينتات', d: 'الكلاينتات اللي على جهازك. الأخضر يعني لقيته.' },
    { el: '#side [data-v=settings]', t: 'الإعدادات', d: 'غيّر شكل التطبيق واللغة، وتقدر تشغّل هذا الشرح مرة ثانية من هنا.' },
    { t: 'يلا نبدأ! 🎉', d: 'اضغط "باك جديد" وسوّ أول باك لك. وإذا علقت بشي، كل صفحة فوقها سطر يشرح وش تسوي.' },
  ],
  project: [
    { t: 'هذا المحرر ✏', d: 'هنا تعدّل الباك حقك. خلني أوريك وين كل شي.' },
    { el: '.tabs', t: 'الأقسام', d: 'كل قسم يغيّر شي: التكسترات، الدروع، الجزيئات، النار، السما، الأصوات... الأقسام مقسّمة: الشكل، PvP، الصوت، ومتقدم.' },
    { el: '#wsb', t: 'التكسترات', d: 'اضغط على أي شي (سيف، توتم...) وبيفتح لك تعدّل عليه أو تبدأ من الصفر.' },
    { el: '#live', t: 'تثبيت تلقائي', d: 'شغّله وكل ما تحفظ، الباك ينزل في الكلاينت لحاله. باللعبة اضغط F3+T يتحدّث.' },
    { el: '#inst', t: 'ثبّت الباك', d: 'لما تخلص اضغط هنا، والباك ينزل في مجلد الكلاينت. بعدها فعّله من إعدادات الريسورس باك باللعبة.' },
  ],
};
function startTour(name) {
  const steps = TOURS[name]; if (!steps) return; let i = 0;
  const shade = document.createElement('div'); shade.className = 'tour-click';
  const hole = document.createElement('div'); hole.className = 'tour-hole';
  const box = document.createElement('div'); box.className = 'tour-box';
  document.body.append(shade, hole, box);
  const end = async () => { shade.remove(); hole.remove(); box.remove(); removeEventListener('keydown', key); S.settings.tours = { ...(S.settings.tours || {}), [name]: true }; await api.settings.set(S.settings); };
  const key = (e) => { if (e.key === 'Escape') end(); if (e.key === 'ArrowLeft' || e.key === 'Enter') next(1); if (e.key === 'ArrowRight') next(-1); };
  addEventListener('keydown', key);
  function show() {
    const s = steps[i], el = s.el && document.querySelector(s.el);
    box.innerHTML = `<h4>${s.t}</h4><p>${s.d}</p><div class="row" style="align-items:center"><div class="dots">${steps.map((_, k) => `<i class="${k === i ? 'on' : ''}"></i>`).join('')}</div><span class="spacer"></span>
      <button class="btn ghost sm" data-x>${i === steps.length - 1 ? '' : 'تخطّي'}</button>${i ? '<button class="btn sm" data-b>رجوع</button>' : ''}<button class="btn primary sm" data-n>${i === steps.length - 1 ? 'يلا!' : 'التالي'}</button></div>`;
    if (!box.querySelector('[data-x]').textContent) box.querySelector('[data-x]').remove(); else box.querySelector('[data-x]').onclick = end;
    box.querySelector('[data-n]').onclick = () => next(1); const bb = box.querySelector('[data-b]'); if (bb) bb.onclick = () => next(-1);
    if (el) {
      el.scrollIntoView({ block: 'nearest' });
      const r = el.getBoundingClientRect(), pad = 6;
      Object.assign(hole.style, { display: '', left: r.left - pad + 'px', top: r.top - pad + 'px', width: r.width + pad * 2 + 'px', height: Math.min(r.height, innerHeight - 40) + pad * 2 + 'px' });
      const bw = 340, below = r.bottom + 16 + 200 < innerHeight;
      let left = Math.min(innerWidth - bw - 16, Math.max(16, r.left + r.width / 2 - bw / 2));
      if (r.width < 300 && r.height > 20 && r.left > innerWidth / 2) left = Math.max(16, r.left - bw - 20); // sidebar on the right (Arabic)
      else if (r.width < 300 && r.right < innerWidth / 2) left = r.right + 20;
      const top = r.width < 300 ? Math.min(innerHeight - 220, Math.max(16, r.top - 20)) : below ? r.bottom + 16 : Math.max(16, r.top - 216);
      Object.assign(box.style, { left: left + 'px', top: top + 'px' });
    } else {
      Object.assign(hole.style, { display: '', left: innerWidth / 2 + 'px', top: innerHeight / 2 + 'px', width: '0px', height: '0px' });
      Object.assign(box.style, { left: innerWidth / 2 - 170 + 'px', top: innerHeight / 2 - 100 + 'px' });
    }
  }
  function next(d) { i += d; if (i >= steps.length) { end(); if (name === 'app') celebrate(); return; } if (i < 0) i = 0; show(); }
  show();
}

// ------------------------------------------------------------- fun: animations & tips
const fxOn = () => !S.settings || S.settings.anim !== false;
function tabHint(txt) { return `<div class="tab-hint">${icon('star', 15)}<span>${txt}</span></div>`; }
function celebrate() {
  if (!fxOn()) return;
  const c = document.createElement('canvas'); c.className = 'fx-layer'; document.body.append(c);
  const W = c.width = innerWidth, H = c.height = innerHeight, x = c.getContext('2d');
  const cols = ['#a78bfa', '#f472b6', '#facc15', '#34d399', '#60a5fa', '#fb923c'];
  const ps = Array.from({ length: 70 }, () => ({ x: W / 2 + (Math.random() - 0.5) * 120, y: H * 0.35, vx: (Math.random() - 0.5) * 14, vy: -6 - Math.random() * 9, s: 5 + Math.random() * 6, c: cols[(Math.random() * cols.length) | 0], r: Math.random() * 6 }));
  const t0 = performance.now();
  (function f(t) {
    const k = (t - t0) / 1300; x.clearRect(0, 0, W, H);
    for (const p of ps) { p.x += p.vx; p.y += p.vy; p.vy += 0.45; p.r += 0.2; x.save(); x.globalAlpha = Math.max(0, 1 - k); x.translate(p.x, p.y); x.rotate(p.r); x.fillStyle = p.c; x.fillRect(-p.s / 2, -p.s / 2, p.s, p.s); x.restore(); }
    if (k < 1) requestAnimationFrame(f); else c.remove();
  })(t0);
}
// ------------------------------------------------------------- "try it in use": first-person animation preview
const USE_ANIMS = [['swing', 'ضربة'], ['bow', 'سحب القوس'], ['crossbow', 'الكروس بو'], ['throw', 'رمي'], ['eat', 'أكل / شرب'], ['totem', 'التوتم ينكسر'], ['shield', 'بلوك بالشيلد'], ['rod', 'رمي السنارة'], ['trident', 'رمي الترايدنت']];
function useAnimFor(name) {
  if (/^bow/.test(name)) return 'bow';
  if (/^crossbow/.test(name)) return 'crossbow';
  if (/totem/.test(name)) return 'totem';
  if (/shield/.test(name)) return 'shield';
  if (/fishing_rod/.test(name)) return 'rod';
  if (/trident/.test(name)) return 'trident';
  if (/ender_pearl|snowball|^egg$|splash_potion|lingering_potion|experience_bottle|wind_charge|fire_charge|ender_eye/.test(name)) return 'throw';
  if (/apple|bread|beef|porkchop|chicken|mutton|rabbit|cod|salmon|potato|carrot|melon_slice|cookie|pie$|stew|soup|berries|beetroot|honey_bottle|kelp|chorus|^potion$|milk_bucket|fish/.test(name)) return 'eat';
  return 'swing';
}
async function openUsePreview(rel, img) {
  const p = S.project; if (!p) return;
  const name = rel.split('/').pop().replace('.png', '');
  const T = async (r) => { if (r === rel) return img; const im = await texImg(p, r, false); return im; };
  const item = (n) => [`textures/item/${n}.png`, `textures/items/${n}.png`];
  const first = async (list) => { for (const r of list) { const im = await T(r); if (im) return im; } return null; };
  const C = (im) => (im ? IMG.toCanvas(im) : null);
  const tex = {
    main: C(img), arrow: C(await first(item('arrow'))),
    pull: [C(await first(item('bow_pulling_0'))), C(await first(item('bow_pulling_1'))), C(await first(item('bow_pulling_2')))],
    cpull: [C(await first(item('crossbow_pulling_0'))), C(await first(item('crossbow_pulling_1'))), C(await first(item('crossbow_pulling_2')))], carrow: C(await first(item('crossbow_arrow'))),
    rodCast: C(await first(item('fishing_rod_cast'))), crit: C(await T('textures/particle/critical_hit.png')),
    sweep: (await Promise.all([0, 1, 2, 3, 4, 5, 6, 7].map((i) => T(`textures/particle/sweep_${i}.png`)))).map(C),
  };
  // a frame of an animated texture → only the first square
  const sq = (c) => { if (!c || c.height <= c.width) return c; const o = document.createElement('canvas'); o.width = o.height = c.width; o.getContext('2d').drawImage(c, 0, 0); return o; };
  Object.keys(tex).forEach((k) => { tex[k] = Array.isArray(tex[k]) ? tex[k].map(sq) : sq(tex[k]); });
  if (/shield/.test(rel) && tex.main && tex.main.width >= 64) { const k = tex.main.width / 64, o = document.createElement('canvas'); o.width = 12 * k; o.height = 22 * k; o.getContext('2d').drawImage(tex.main, k, k, 12 * k, 22 * k, 0, 0, 12 * k, 22 * k); tex.main = o; }
  let anim = useAnimFor(name), raf = 0, t0 = performance.now(), parts = [];
  const m = modal({ cls: 'lg', title: `${icon('play', 18)} جرّبه وأنت تستخدمه`, sub: 'كيف بيطلع باللعبة لما تستخدمه (منظور أول شخص)',
    body: `<div class="use-stage"><canvas id="ucv"></canvas></div>
      <div class="row" style="margin-top:12px;gap:6px">${USE_ANIMS.map(([k, n]) => `<button class="chip ${k === anim ? 'on' : ''}" data-a="${k}">${n}</button>`).join('')}<span class="spacer"></span><button class="btn sm" id="urep">${icon('reset', 15)} من جديد</button></div>`,
    onClose: () => cancelAnimationFrame(raf) });
  $$('[data-a]', m.el).forEach((b) => b.onclick = () => { anim = b.dataset.a; $$('[data-a]', m.el).forEach((y) => y.classList.toggle('on', y === b)); t0 = performance.now(); parts = []; });
  $('#urep', m.el).onclick = () => { t0 = performance.now(); parts = []; };
  const cv = $('#ucv', m.el), x = cv.getContext('2d');
  const burst = (px, py, n, colors, sz = 6, sp = 4) => { for (let i = 0; i < n; i++) { const a = Math.random() * Math.PI * 2, v = Math.random() * sp; parts.push({ x: px, y: py, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 2, s: sz * (0.5 + Math.random()), c: colors[(Math.random() * colors.length) | 0], life: 1 }); } };
  const imgColors = (c) => { if (!c) return ['#fff']; const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data, out = []; for (let i = 0; i < d.length; i += 16) if (d[i + 3] > 200) out.push(`rgb(${d[i]},${d[i + 1]},${d[i + 2]})`); return out.length ? out : ['#fff']; };
  const crumbs = imgColors(tex.main);
  let lastPhase = -1;
  const ease = (k) => 1 - Math.pow(1 - Math.min(1, Math.max(0, k)), 3);
  function draw(now) {
    if (!cv.isConnected) return;
    const W = cv.width = cv.clientWidth * devicePixelRatio, H = cv.height = cv.clientHeight * devicePixelRatio, u = H / 100;
    x.imageSmoothingEnabled = false;
    // world
    const g = x.createLinearGradient(0, 0, 0, H * 0.62); g.addColorStop(0, '#78a7ff'); g.addColorStop(1, '#c4dcff'); x.fillStyle = g; x.fillRect(0, 0, W, H);
    x.fillStyle = '#5d9b3a'; x.fillRect(0, H * 0.62, W, H); x.fillStyle = '#4b8a2e'; for (let i = 0; i < 40; i++) x.fillRect((i * 97) % W, H * 0.62 + ((i * 53) % 40) * u * 0.9, 3 * u, 1.2 * u);
    const tx = W / 2, ty = H * 0.5;
    const dur = { swing: 1400, bow: 2600, crossbow: 2800, throw: 1800, eat: 2600, totem: 2400, shield: 2200, rod: 2600, trident: 2600 }[anim];
    const tt = (now - t0) % (dur + 700), k = tt / dur, phase = Math.floor((now - t0) / (dur + 700));
    if (phase !== lastPhase) { lastPhase = phase; parts = []; }
    // target dummy (a zombie-ish mob)
    let hit = 0;
    const mob = (flash) => { const s = u * 1.1; x.save(); x.translate(tx, ty + 12 * s); x.fillStyle = flash ? '#d24a4a' : '#3f7d4a'; x.fillRect(-4 * s, -24 * s, 8 * s, 8 * s); x.fillStyle = flash ? '#c43c3c' : '#2f6fa8'; x.fillRect(-4 * s, -16 * s, 8 * s, 12 * s); x.fillStyle = flash ? '#a83232' : '#3b3b8f'; x.fillRect(-4 * s, -4 * s, 8 * s, 12 * s); x.fillStyle = flash ? '#d24a4a' : '#3f7d4a'; x.fillRect(-8 * s, -16 * s, 4 * s, 12 * s); x.fillRect(4 * s, -16 * s, 4 * s, 12 * s); x.restore(); };
    // hand transform
    let hx = W * 0.72, hy = H * 0.78, rot = -0.35, sc = 1, show = tex.main, alpha = 1;
    const S0 = H * 0.42;
    if (anim === 'swing') {
      const a = Math.sin(Math.min(1, k * 2.2) * Math.PI); hx -= a * W * 0.12; hy -= a * H * 0.1; rot = -0.35 - a * 1.1;
      hit = k > 0.2 && k < 0.45;
      if (k > 0.22 && k < 0.24 && !parts.length) { burst(tx, ty, 14, ['#fff', '#dfe7ff'], 7, 6); }
    } else if (anim === 'bow' || anim === 'crossbow') {
      const P = anim === 'bow' ? tex.pull : tex.cpull, pk = Math.min(1, k / 0.6);
      if (k < 0.6) { const i = Math.min(2, Math.floor(pk * 3)); show = P[i] || tex.main; hx = W * (0.72 - 0.16 * ease(pk)); hy = H * (0.78 - 0.08 * ease(pk)); rot = -0.35 + 0.45 * ease(pk); if (pk > 0.9) { hx += Math.sin(now / 25) * u * 0.4; } }
      else if (anim === 'crossbow' && k < 0.75) { show = tex.carrow || P[2] || tex.main; hx = W * 0.56; hy = H * 0.7; rot = 0.1; }
      else { show = anim === 'crossbow' && k < 0.76 ? tex.carrow : tex.main; const r = ease((k - (anim === 'crossbow' ? 0.75 : 0.6)) * 5); hx = W * (0.56 + 0.16 * r); hy = H * (0.7 + 0.08 * r); rot = 0.1 - 0.45 * r;
        const fk = Math.min(1, (k - (anim === 'crossbow' ? 0.75 : 0.6)) / 0.22);
        if (fk < 1 && tex.arrow) { const ax = W * 0.56 + (tx - W * 0.56) * fk, ay = H * 0.62 + (ty - H * 0.62) * fk, as = S0 * 0.6 * (1 - fk * 0.85); x.save(); x.translate(ax, ay); x.rotate(-Math.PI / 4 - 0.3); x.drawImage(tex.arrow, -as / 2, -as / 2, as, as); x.restore(); }
        hit = fk >= 1 && k < (anim === 'crossbow' ? 0.75 : 0.6) + 0.45; if (fk >= 1 && !parts.length) burst(tx, ty, 12, ['#fff', '#ffd27a'], 6, 5);
      }
    } else if (anim === 'throw') {
      const a = Math.sin(Math.min(1, k * 3) * Math.PI); hx -= a * W * 0.05; hy -= a * H * 0.08; rot = -0.35 - a * 0.6;
      if (k > 0.25) { const fk = Math.min(1, (k - 0.25) / 0.45); show = k > 0.3 ? null : show;
        if (fk < 1) { const ix = W * 0.62 + (tx - W * 0.62) * fk, iy = H * 0.6 + (ty - H * 0.6) * fk - Math.sin(fk * Math.PI) * H * 0.15, is = S0 * 0.4 * (1 - fk * 0.8); x.save(); x.translate(ix, iy); x.rotate(fk * 8); x.drawImage(tex.main, -is / 2, -is / 2, is, is); x.restore(); }
        else if (!parts.length) burst(tx, ty, 26, /pearl|ender_eye/.test(name) ? ['#c084fc', '#7e22ce', '#e9d5ff'] : crumbs, 6, 5);
        if (k > 0.75) show = tex.main;
      }
    } else if (anim === 'eat') {
      const ek = Math.min(1, k / 0.15), done = k > 0.85;
      hx = W * (0.72 - 0.22 * ease(ek)); hy = H * (0.78 - 0.06 * ease(ek)) + (k > 0.15 && !done ? Math.abs(Math.sin(now / 70)) * u * 2.5 : 0); rot = -0.35 + 0.35 * ease(ek);
      if (k > 0.15 && !done && Math.random() < 0.5) burst(W * 0.5, H * 0.72, 1, crumbs, 5, 3);
      if (done) { sc = 1 - ease((k - 0.85) / 0.15); }
    } else if (anim === 'totem') {
      if (k < 0.15) { hx = W * 0.72; } else {
        show = null; const pk = (k - 0.15) / 0.85, e = pk < 0.3 ? pk / 0.3 : 1, size = H * (0.25 + 0.55 * Math.sin(e * Math.PI / 2)) * (pk > 0.7 ? 1 - (pk - 0.7) / 0.3 : 1);
        if (pk < 0.05 && !parts.length) { burst(W / 2, H / 2, 90, ['#facc15', '#4ade80', '#fde047', '#22c55e'], 8, 12); }
        x.save(); x.globalAlpha = pk > 0.75 ? Math.max(0, 1 - (pk - 0.75) / 0.25) : 1; x.translate(W / 2, H / 2 - pk * H * 0.12); x.rotate(Math.sin(pk * 9) * 0.25 * (1 - pk)); x.drawImage(tex.main, -size / 2, -size / 2, size, size); x.restore();
      }
    } else if (anim === 'shield') {
      const r = k < 0.2 ? ease(k / 0.2) : k > 0.8 ? 1 - ease((k - 0.8) / 0.2) : 1; hx = W * (0.75 - 0.22 * r); hy = H * (0.85 - 0.12 * r); rot = -0.2 + 0.2 * r; sc = 1 + 0.25 * r;
      if (k > 0.45 && k < 0.47 && !parts.length) burst(hx - S0 * 0.3, hy - S0 * 0.3, 10, ['#fff', '#ddd'], 6, 5);
    } else if (anim === 'rod') {
      const a = k < 0.25 ? Math.sin(k / 0.25 * Math.PI) : 0; rot = -0.35 - a * 0.9; hy -= a * H * 0.08;
      if (k > 0.25) { show = tex.rodCast || tex.main; const fk = Math.min(1, (k - 0.25) / 0.35), bx = W * 0.62 + (tx - W * 0.62) * fk, by = H * 0.45 + (ty + H * 0.1 - H * 0.45) * fk - Math.sin(fk * Math.PI) * H * 0.2;
        x.strokeStyle = 'rgba(30,30,30,.85)'; x.lineWidth = Math.max(1, u * 0.3); x.beginPath(); x.moveTo(W * 0.62, H * 0.5); x.quadraticCurveTo((W * 0.62 + bx) / 2, Math.max(by, H * 0.5) + H * 0.05, bx, by); x.stroke();
        const bob = fk >= 1 ? Math.sin(now / 200) * u : 0; x.fillStyle = '#e33'; x.fillRect(bx - u, by - u + bob, 2 * u, u); x.fillStyle = '#fff'; x.fillRect(bx - u, by + bob, 2 * u, u);
        if (fk >= 1 && k > 0.7 && k < 0.72 && parts.length < 5) burst(bx, by, 8, ['#8ecbff', '#cfe8ff'], 4, 3);
      }
    } else if (anim === 'trident') {
      if (k < 0.45) { const r = ease(k / 0.45); hy = H * (0.78 + 0.05 * r); rot = -0.35 + 2.6 * r; hx = W * (0.72 - 0.05 * r); }
      else { show = null; const fk = Math.min(1, (k - 0.45) / 0.25); if (fk < 1) { const ix = W * 0.68 + (tx - W * 0.68) * fk, iy = H * 0.7 + (ty - H * 0.7) * fk, is = S0 * (1 - fk * 0.85); x.save(); x.translate(ix, iy); x.rotate(-Math.PI * 0.75); x.drawImage(tex.main, -is / 2, -is / 2, is, is); x.restore(); } else { hit = k < 0.95; if (!parts.length) burst(tx, ty, 16, ['#7dd3fc', '#e0f2fe'], 6, 5); } if (k > 0.9) show = tex.main; }
    }
    if (anim !== 'totem' || k < 0.15) mob(hit);
    else mob(false);
    // sweep + crit for melee
    if (anim === 'swing' && k > 0.22 && k < 0.22 + 0.34) { const i = Math.min(7, Math.floor((k - 0.22) / 0.34 * 8)), sw = tex.sweep[i]; if (sw) { const s = H * 0.45; x.drawImage(sw, tx - s / 2, ty - s / 2, s, s); } }
    // particles
    for (const q of parts) { q.x += q.vx; q.y += q.vy; q.vy += 0.15; q.life -= 0.018; if (q.life <= 0) continue; x.globalAlpha = Math.max(0, q.life); if (anim === 'swing' && tex.crit) x.drawImage(tex.crit, q.x, q.y, q.s * u * 0.25, q.s * u * 0.25); else { x.fillStyle = q.c; x.fillRect(q.x, q.y, q.s * u * 0.18, q.s * u * 0.18); } }
    x.globalAlpha = 1;
    // held item
    if (show && sc > 0.01) { x.save(); x.globalAlpha = alpha; x.translate(hx, hy); x.rotate(rot); x.scale(-sc, sc); x.drawImage(show, -S0 / 2, -S0 / 2, S0, S0); x.restore(); }
    // crosshair + hotbar
    x.fillStyle = 'rgba(255,255,255,.85)'; x.fillRect(W / 2 - u * 1.4, H / 2 - u * 0.2, u * 2.8, u * 0.4); x.fillRect(W / 2 - u * 0.2, H / 2 - u * 1.4, u * 0.4, u * 2.8);
    const sl = u * 7, hbx = W / 2 - sl * 4.5, hby = H - sl - u; x.fillStyle = 'rgba(0,0,0,.45)'; x.fillRect(hbx, hby, sl * 9, sl);
    x.strokeStyle = 'rgba(255,255,255,.9)'; x.lineWidth = u * 0.5; x.strokeRect(hbx, hby, sl, sl); if (tex.main) x.drawImage(tex.main, hbx + sl * 0.15, hby + sl * 0.15, sl * 0.7, sl * 0.7);
    raf = requestAnimationFrame(draw);
  }
  raf = requestAnimationFrame(draw);
}

// ------------------------------------------------------------- 3D reveal after saving
function reveal3D(img, opts = {}) {
  if (!img || !fxOn()) return;
  const skin = img.width === 64 && (img.height === 64 || img.height === 32) && opts.skin;
  if (!skin && (img.width !== img.height || img.width > 128)) return; // only items / skins
  const ov = document.createElement('div'); ov.className = 'reveal3d';
  ov.innerHTML = `<div class="rv-card"><canvas></canvas><div class="rv-t">${icon('check', 18)} ${opts.title ? esc(opts.title) + ' — ' : ''}انحفظ</div><div class="muted small">اسحب عشان تلفه · اضغط برا يسكّر</div>${opts.use ? `<button class="btn primary sm" data-use style="margin-top:12px">${icon('play', 15)} جرّبه وأنت تستخدمه</button>` : ''}</div>`;
  document.body.append(ov);
  if (opts.use) ov.querySelector('[data-use]').onclick = () => { close(); opts.use(); };
  const v = Lite3D.viewer(ov.querySelector('canvas'), skin ? Lite3D.skinQuads(img.height === 32 ? upgradeLegacySkin(img) : img, opts.slim, true) : Lite3D.itemQuads(img), { dist: skin ? 60 : 34, pitch: 0.2, yaw: -0.4 });
  v.st.yaw = -2.6; // starts turned and spins in
  let t = setTimeout(close, 4200);
  function close() { clearTimeout(t); ov.classList.add('out'); setTimeout(() => { v.stop(); ov.remove(); }, 300); }
  ov.onmousedown = (e) => { if (e.target === ov) close(); else { clearTimeout(t); t = setTimeout(close, 6000); } };
}
// ------------------------------------------------------------- picture → elytra
// wing box on the 64x32 texture: uv (22,0), 10 wide, 20 tall, 2 deep
async function elytraFromImage(p, eOrig, onDone) {
  const f = await api.fs.pickFiles('اختر صورة للإليترا', ['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp']); if (!f) return;
  const ext = f[0].split('.').pop().toLowerCase();
  const pic = await IMG.load(`data:image/${ext === 'jpg' ? 'jpeg' : ext};base64,` + await api.fs.readB64(f[0]));
  const skin = (await realSteve()) || defaultSkin();
  const o = { fit: 'cover', shape: true, k: pic.width >= 160 ? 4 : pic.width >= 80 ? 2 : 1, zoom: 100, x: 0, y: 0 };
  let v = null, out = null;
  const m = modal({
    cls: 'lg', title: 'حط صورة على الإليترا', sub: 'التطبيق يقص الصورة ويركّبها على الجناحين بالمقاس الصح',
    body: `<div class="two" style="grid-template-columns:300px 1fr;gap:16px">
      <div class="stack">
        <label class="f">طريقة التركيب<div class="seg" id="efit"><button data-f="cover" class="on">املأ الجناح</button><button data-f="contain">الصورة كاملة</button><button data-f="stretch">مطّها</button></div></label>
        <div class="slider-row" style="grid-template-columns:80px 1fr 46px"><span>تكبير</span><input type="range" id="ez" min="50" max="300" value="100"><output class="ltr"></output></div>
        <div class="slider-row" style="grid-template-columns:80px 1fr 46px"><span>يمين/يسار</span><input type="range" id="ex" min="-50" max="50" value="0"><output class="ltr"></output></div>
        <div class="slider-row" style="grid-template-columns:80px 1fr 46px"><span>فوق/تحت</span><input type="range" id="ey" min="-50" max="50" value="0"><output class="ltr"></output></div>
        <label class="check small"><span class="switch"><input type="checkbox" id="eshape" checked><span></span></span>خلّ شكل الجناح الأصلي (يقص الأطراف)</label>
        <label class="f">الدقة<div class="seg" id="ek">${[[1, 'عادي'], [2, 'HD'], [4, 'HD+'], [8, 'خيالية']].map(([k, n]) => `<button data-k="${k}" class="${k === o.k ? 'on' : ''}">${n}</button>`).join('')}</div></label>
        <canvas id="eflat" style="width:100%;image-rendering:pixelated;border-radius:8px;background:repeating-conic-gradient(#1a1f2b 0 25%,#151922 0 50%) 0 0/12px 12px"></canvas>
      </div>
      <div class="v3d sky3d" style="height:420px"><canvas id="ev"></canvas></div></div>`,
    foot: `<button class="btn ghost" data-c>إلغاء</button><span class="spacer"></span><button class="btn" data-ed>${icon('edit', 16)} عدّل بيدك بعدها</button><button class="btn primary" data-s>${icon('check', 16)} حطها على الإليترا</button>`,
    onClose: () => v && v.stop(),
  });
  const el = m.el;
  function build() {
    const k = o.k, W = 64 * k, H = 32 * k, c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d');
    x.imageSmoothingEnabled = k > 1;
    if (eOrig) { x.save(); x.imageSmoothingEnabled = false; x.drawImage(IMG.toCanvas(eOrig), 0, 0, W, H); x.restore(); }
    // draw the picture into a 10x20 face
    const face = document.createElement('canvas'); face.width = 10 * k; face.height = 20 * k; const fx = face.getContext('2d'); fx.imageSmoothingEnabled = true; fx.imageSmoothingQuality = 'high';
    const fw = face.width, fh = face.height, z = o.zoom / 100;
    let dw, dh;
    if (o.fit === 'stretch') { dw = fw; dh = fh; } else { const s = (o.fit === 'cover' ? Math.max : Math.min)(fw / pic.width, fh / pic.height); dw = pic.width * s; dh = pic.height * s; }
    dw *= z; dh *= z;
    fx.drawImage(pic, (fw - dw) / 2 + o.x / 100 * fw, (fh - dh) / 2 + o.y / 100 * fh, dw, dh);
    const fd = fx.getImageData(0, 0, fw, fh);
    // fill both big faces (back one mirrored so it lines up through the wing), then the edges
    const put = (dx, mirror) => { for (let yy = 0; yy < fh; yy++) for (let xx = 0; xx < fw; xx++) { const si = (yy * fw + (mirror ? fw - 1 - xx : xx)) * 4; x.fillStyle = `rgba(${fd.data[si]},${fd.data[si + 1]},${fd.data[si + 2]},${fd.data[si + 3] / 255})`; x.clearRect(dx + xx, 2 * k + yy, 1, 1); x.fillRect(dx + xx, 2 * k + yy, 1, 1); } };
    put(24 * k, false); put(36 * k, true);
    const edgeCol = (sx) => { x.clearRect(sx, 2 * k, 2 * k, 20 * k); };
    // sides take the picture's edge column, top/bottom its edge row
    edgeCol(22 * k); edgeCol(34 * k);
    x.drawImage(face, 0, 0, 1, fh, 22 * k, 2 * k, 2 * k, fh); x.drawImage(face, fw - 1, 0, 1, fh, 34 * k, 2 * k, 2 * k, fh);
    x.clearRect(24 * k, 0, 20 * k, 2 * k); x.drawImage(face, 0, 0, fw, 1, 24 * k, 0, 10 * k, 2 * k); x.drawImage(face, 0, fh - 1, fw, 1, 34 * k, 0, 10 * k, 2 * k);
    let im = x.getImageData(0, 0, W, H);
    if (o.shape && eOrig) { // keep the vanilla wing outline
      const mk = IMG.resize(IMG.toCanvas(eOrig), W, H);
      for (let i = 3; i < im.data.length; i += 4) if (mk.data[i] < 10) im.data[i] = 0;
    }
    out = im;
    const fl = $('#eflat', el); fl.width = W; fl.height = H; fl.getContext('2d').putImageData(im, 0, 0);
    const q = Lite3D.flyingQuads(skin, k > 2 ? IMG.resize(IMG.toCanvas(im), 128, 64) : im, 1);
    if (!v) v = Lite3D.viewer($('#ev', el), q, { dist: 70, pitch: 0.55, yaw: Math.PI }); else v.set(q);
    ['ez', 'ex', 'ey'].forEach((id) => { $('#' + id, el).nextElementSibling.textContent = $('#' + id, el).value + (id === 'ez' ? '%' : ''); });
  }
  $$('#efit button', el).forEach((b) => b.onclick = () => { o.fit = b.dataset.f; $$('#efit button', el).forEach((y) => y.classList.toggle('on', y === b)); build(); });
  $$('#ek button', el).forEach((b) => b.onclick = () => { o.k = +b.dataset.k; $$('#ek button', el).forEach((y) => y.classList.toggle('on', y === b)); build(); });
  $('#ez', el).oninput = (e) => { o.zoom = +e.target.value; build(); }; $('#ex', el).oninput = (e) => { o.x = +e.target.value; build(); }; $('#ey', el).oninput = (e) => { o.y = +e.target.value; build(); };
  $('#eshape', el).onchange = (e) => { o.shape = e.target.checked; build(); };
  el.querySelector('[data-c]').onclick = () => m.close(true);
  el.querySelector('[data-s]').onclick = async () => { m.close(true); await onDone(out, false); };
  el.querySelector('[data-ed]').onclick = async () => { m.close(true); await onDone(out, true); };
  build();
}

// ------------------------------------------------------------- particle studio (sweep, crit...)
const PARTICLES = [
  { id: 'sweep', name: 'السويب (ضربة السيف)', frames: 8, file: (i) => `textures/particle/sweep_${i}.png`, size: 32, big: true, hint: 'الضربة اللي تطلع لما تضرب بالسيف وأنت ماشي' },
  { id: 'crit', name: 'الكريتكال', frames: 1, file: () => 'textures/particle/critical_hit.png', size: 8, hint: 'النجوم اللي تطلع لما تضرب وأنت نازل من نطة' },
  { id: 'enchanted_hit', name: 'ضربة الإنشانت', frames: 1, file: () => 'textures/particle/enchanted_hit.png', size: 8, hint: 'الجزيئات الزرقا لما تضرب بسيف مإنشانت' },
  { id: 'damage', name: 'قلوب الضرر', frames: 1, file: () => 'textures/particle/damage.png', size: 8, hint: 'القلوب السودا اللي تطلع من اللاعب لما ينضرب' },
  { id: 'glitter', name: 'جزيئات التوتم', frames: 8, file: (i) => `textures/particle/glitter_${i}.png`, size: 8, hint: 'اللي تطلع لما ينكسر التوتم' },
  { id: 'flame', name: 'لهب', frames: 1, file: () => 'textures/particle/flame.png', size: 8, hint: 'لهب الشموع والفرن والسبونر' },
  { id: 'explosion', name: 'الانفجار', frames: 16, file: (i) => `textures/particle/explosion_${i}.png`, size: 32, big: true, hint: 'دخان انفجار التي إن تي والكريبر' },
];
const P_STYLES = [
  ['orig', 'الأصلي', null],
  ['fire', 'نار 🔥', ['#2a0000', '#b91c1c', '#f97316', '#facc15', '#fffbe6']],
  ['ice', 'ثلج ❄', ['#06142e', '#1d4ed8', '#38bdf8', '#e0f2fe', '#ffffff']],
  ['bolt', 'برق ⚡', ['#14002b', '#6d28d9', '#a78bfa', '#f5f3ff', '#ffffff']],
  ['toxic', 'سم ☣', ['#03140a', '#15803d', '#4ade80', '#ecfccb', '#ffffff']],
  ['blood', 'دم 🩸', ['#120000', '#7f1d1d', '#dc2626', '#fca5a5', '#fff1f2']],
  ['gold', 'ذهب ✨', ['#1c1000', '#a16207', '#eab308', '#fef08a', '#fffef0']],
  ['rainbow', 'قوس قزح 🌈', 'rainbow'],
  ['custom', 'لون من عندك', 'custom'],
  ['hide', 'شيلها (مخفية)', 'hide'],
];
const P_SHAPES = [['orig', 'الشكل الأصلي'], ['arc', 'قوس'], ['ring', 'دائرة'], ['slash', 'ضربة'], ['star', 'نجمة'], ['heart', 'قلب'], ['spark', 'شرار']];
const hexRgb = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
function gradMap(stops, t) { const n = stops.length - 1, i = Math.min(n - 1, Math.floor(t * n)), f = t * n - i, a = hexRgb(stops[i]), b = hexRgb(stops[i + 1]); return a.map((v, k) => v + (b[k] - v) * f); }
function hslRgb(h, s, l) { const k = (n) => (n + h * 12) % 12, a = s * Math.min(l, 1 - l), f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1)); return [f(0) * 255, f(8) * 255, f(4) * 255]; }
function colorFrame(im, style, color, fi, nf) {
  const out = IMG.clone(im), d = out.data, W = im.width;
  if (style === 'orig') return out;
  const st = P_STYLES.find((x) => x[0] === style)[2];
  const stops = st === 'custom' ? ['#000000', color, '#ffffff'] : st;
  for (let i = 0; i < d.length; i += 4) {
    if (st === 'hide') { d[i + 3] = 0; continue; }
    if (!d[i + 3]) continue;
    const l = (0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]) / 255;
    let c;
    if (st === 'rainbow') { const x = (i / 4) % W; c = hslRgb(((x / W) + fi / Math.max(1, nf)) % 1, 0.9, 0.25 + l * 0.6); }
    else c = gradMap(stops, Math.min(1, Math.max(0, l)));
    d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2];
  }
  return out;
}
// draws a white shape (brightness = intensity) for frame t (0..1)
function shapeFrame(shape, S, t) {
  const c = document.createElement('canvas'); c.width = c.height = S; const x = c.getContext('2d');
  const fade = t < 0.6 ? 1 : 1 - (t - 0.6) / 0.4, m = S / 2;
  x.globalAlpha = Math.max(0.05, fade); x.lineCap = 'round';
  const grad = (r) => { const g = x.createRadialGradient(m, m, 0, m, m, r); g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#8a8a8a'); return g; };
  if (shape === 'arc') { const a = Math.PI * (0.25 + 0.9 * Math.min(1, t * 1.6)); x.strokeStyle = grad(m); x.lineWidth = S * 0.16; x.beginPath(); x.arc(m, m * 1.35, m * 0.95, -Math.PI / 2 - a / 2, -Math.PI / 2 + a / 2); x.stroke(); x.strokeStyle = '#ffffff'; x.lineWidth = S * 0.05; x.stroke(); }
  else if (shape === 'ring') { const r = m * (0.3 + 0.6 * t); x.strokeStyle = '#ffffff'; x.lineWidth = Math.max(1, S * 0.12 * (1 - t * 0.6)); x.beginPath(); x.arc(m, m, r, 0, Math.PI * 2); x.stroke(); }
  else if (shape === 'slash') { const L = S * (0.3 + 0.6 * Math.min(1, t * 1.5)); x.strokeStyle = grad(m); x.lineWidth = S * 0.14; x.beginPath(); x.moveTo(m - L / 2, m + L / 2); x.lineTo(m + L / 2, m - L / 2); x.stroke(); x.strokeStyle = '#fff'; x.lineWidth = S * 0.05; x.stroke(); }
  else if (shape === 'star') { const R = m * (0.55 + 0.35 * Math.sin(t * Math.PI)), r = R * 0.42; x.fillStyle = grad(R); x.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5 + t; const rr = i % 2 ? r : R; x.lineTo(m + Math.cos(a) * rr, m + Math.sin(a) * rr); } x.fill(); }
  else if (shape === 'heart') { const s = S * (0.8 + 0.12 * Math.sin(t * Math.PI)) / 16; x.fillStyle = grad(m); x.save(); x.translate(m, m); x.scale(s, s); x.beginPath(); x.moveTo(0, 5); x.bezierCurveTo(-8, -1, -6, -8, 0, -3.5); x.bezierCurveTo(6, -8, 8, -1, 0, 5); x.fill(); x.restore(); }
  else if (shape === 'spark') { x.strokeStyle = '#fff'; x.lineWidth = Math.max(1, S / 12); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, r0 = m * 0.15 + m * 0.5 * t, r1 = r0 + m * 0.35 * (1 - t * 0.5); x.beginPath(); x.moveTo(m + Math.cos(a) * r0, m + Math.sin(a) * r0); x.lineTo(m + Math.cos(a) * r1, m + Math.sin(a) * r1); x.stroke(); } }
  return x.getImageData(0, 0, S, S);
}
// one picture → a little animation: pops in bigger, then fades out
function autoAnim(f, S, t) {
  const c = document.createElement('canvas'); c.width = c.height = S; const x = c.getContext('2d'); x.imageSmoothingEnabled = false;
  const sc = 0.55 + 0.45 * Math.min(1, t * 2.2), fade = t < 0.6 ? 1 : 1 - (t - 0.6) / 0.4, d = S * sc;
  x.globalAlpha = Math.max(0.05, fade); x.drawImage(IMG.toCanvas(f), (S - d) / 2, (S - d) / 2, d, d);
  return x.getImageData(0, 0, S, S);
}
async function decodeImageFrames(path) {
  const ext = path.split('.').pop().toLowerCase(), b64 = await api.fs.readB64(path);
  if (ext === 'gif' && window.ImageDecoder) {
    try {
      const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
      const dec = new ImageDecoder({ data: bytes, type: 'image/gif' }); await dec.tracks.ready;
      const n = Math.min(dec.tracks.selectedTrack.frameCount, 64), out = [];
      for (let i = 0; i < n; i++) { const { image } = await dec.decode({ frameIndex: i }); const c = document.createElement('canvas'); c.width = image.displayWidth; c.height = image.displayHeight; c.getContext('2d').drawImage(image, 0, 0); out.push(c.getContext('2d').getImageData(0, 0, c.width, c.height)); image.close(); }
      if (out.length) return out;
    } catch {}
  }
  const im0 = await IMG.load(`data:image/${ext === 'jpg' ? 'jpeg' : ext};base64,` + b64);
  const im = IMG.resize(im0, im0.width, im0.height);
  // a strip of square frames (horizontal or vertical) → split it
  const cut = (n, horiz) => Array.from({ length: n }, (_, i) => { const c = IMG.toCanvas(im), s = horiz ? im.height : im.width; return c.getContext('2d').getImageData(horiz ? i * s : 0, horiz ? 0 : i * s, s, s); });
  if (im.width >= im.height * 2 && im.width % im.height === 0) return cut(im.width / im.height, true);
  if (im.height >= im.width * 2 && im.height % im.width === 0) return cut(im.height / im.width, false);
  return [im];
}
async function tabParticles(b) {
  const p = S.project; p.particles = p.particles || {};
  let cur = PARTICLES[0], base = [], own = null, anim = null;
  const cfg = () => (p.particles[cur.id] = p.particles[cur.id] || { shape: 'orig', style: 'orig', color: '#f97316' });
  b.innerHTML = `${p.baseJar ? '' : noBaseNotice()}
  <div class="two" style="grid-template-columns:420px 1fr">
    <div class="card stack">
      <h3 style="margin:0">${icon('wand', 18)} اختر الجزيء</h3>
      <div class="plist" id="plist">${PARTICLES.map((x) => `<button class="pchip" data-id="${x.id}"><canvas width="32" height="32"></canvas><span>${x.name}</span></button>`).join('')}</div>
      <div class="muted small" id="phint"></div>
      <h3 style="margin:6px 0 0">شكل الجزيء</h3>
      <div class="seg wrap" id="pshape">${P_SHAPES.map(([k, n]) => `<button data-s="${k}">${n}</button>`).join('')}</div>
      <div class="row" style="gap:6px"><button class="btn sm" id="pdraw">${icon('pencil', 15)} ارسم شكلك</button><button class="btn sm" id="pframes">${icon('play', 15)} سوّ الأنيميشن بنفسك</button><button class="btn sm" id="pown">${icon('image', 15)} صورة أو GIF</button></div>
      <div id="plibw"><div class="muted small" style="margin:2px 0 6px">أشكالك المحفوظة:</div><div class="shape-lib" id="plib"></div></div>
      <h3 style="margin:6px 0 0">اللون</h3>
      <div class="pstyles" id="pstyle">${P_STYLES.map(([k, n, st]) => `<button data-st="${k}" title="${n}"><i style="background:${Array.isArray(st) ? `linear-gradient(90deg,${st.join(',')})` : st === 'rainbow' ? 'linear-gradient(90deg,#ef4444,#f59e0b,#22c55e,#3b82f6,#a855f7)' : st === 'hide' ? 'repeating-linear-gradient(45deg,#333 0 4px,#222 4px 8px)' : st === 'custom' ? 'conic-gradient(red,yellow,lime,cyan,blue,magenta,red)' : '#888'}"></i>${n}</button>`).join('')}</div>
      <div class="row" id="pcolrow"><input type="color" id="pcol"><span class="muted small">اختر لونك</span></div>
      <div class="row"><button class="btn primary" id="papply">${icon('check', 16)} طبّق على الباك</button><button class="btn ghost" id="preset">${icon('reset', 16)} الأصلي</button></div>
    </div>
    <div class="card"><h3>كيف بتطلع باللعبة <span class="muted small">(معاينة متحركة)</span></h3>
      <div class="pstage"><canvas id="pcv"></canvas></div>
      <div class="pframes" id="pfr"></div></div></div>`;
  bindBaseActions(b);
  const frames = () => {
    const c = cfg(), S0 = base[0] ? base[0].width : cur.size, n = cur.frames;
    let src;
    if (c.shape === 'orig') src = base.length ? base : Array.from({ length: n }, (_, i) => shapeFrame(cur.id === 'sweep' ? 'arc' : 'star', S0, n > 1 ? i / (n - 1) : 0.4));
    else if (c.shape === 'own' || c.shape === 'custom') src = own ? Array.from({ length: n }, (_, i) => { const f = own[Math.floor(i * own.length / n)]; if (own.length === 1 && n > 1) return autoAnim(f, S0, i / (n - 1)); return IMG.resize(IMG.toCanvas(f), S0, S0); }) : (base.length ? base : []);
    else src = Array.from({ length: n }, (_, i) => shapeFrame(c.shape, S0, n > 1 ? i / (n - 1) : 0.4));
    const style = c.style;
    return src.map((f, i) => colorFrame(f, style, c.color, i, src.length));
  };
  function sync() {
    const c = cfg();
    $('#phint', b).textContent = cur.hint;
    $$('#plist .pchip', b).forEach((x) => x.classList.toggle('on', x.dataset.id === cur.id));
    $$('#pshape button', b).forEach((x) => x.classList.toggle('on', x.dataset.s === c.shape));
    $$('#pstyle button', b).forEach((x) => x.classList.toggle('on', x.dataset.st === c.style));
    $('#pcolrow', b).style.display = c.style === 'custom' ? '' : 'none'; $('#pcol', b).value = c.color;
    $('#pdraw', b).classList.toggle('primary', c.shape === 'custom' && c.how === 'draw'); $('#pframes', b).classList.toggle('primary', c.shape === 'custom' && c.how === 'frames'); $('#pown', b).classList.toggle('primary', c.shape === 'custom' && c.how === 'own');
    renderLib(); play();
  }
  function play() {
    cancelAnimationFrame(anim); const fr = frames(), cv = $('#pcv', b); if (!cv) return;
    $('#pfr', b).innerHTML = ''; fr.forEach((f) => { const c = IMG.toCanvas(f); $('#pfr', b).append(c); });
    const ctx = cv.getContext('2d'); const W = cv.width = cv.clientWidth * devicePixelRatio, H = cv.height = cv.clientHeight * devicePixelRatio;
    const cvs = fr.map((f) => IMG.toCanvas(f)); let t0 = performance.now(); const parts = [];
    const loop = (t) => {
      if (!cv.isConnected) return; ctx.clearRect(0, 0, W, H); ctx.imageSmoothingEnabled = false;
      if (!cvs.length) { anim = requestAnimationFrame(loop); return; }
      if (cur.big) { // one big sprite in the middle, played like the game (fast), then a short pause
        const dur = cur.frames * 60, k = (Math.max(0, t - t0) % (dur + 500)); const i = Math.max(0, Math.min(cvs.length - 1, Math.floor(k / 60)));
        if (k < dur) { const s = Math.min(W, H) * 0.7; ctx.drawImage(cvs[i], W / 2 - s / 2, H / 2 - s / 2, s, s); }
      } else { // a burst of little particles flying out
        if (!parts.length || t - t0 > 1400) { t0 = t; parts.length = 0; for (let i = 0; i < 26; i++) { const a = Math.random() * Math.PI * 2, v = 0.5 + Math.random(); parts.push({ x: W / 2, y: H / 2, vx: Math.cos(a) * v * W / 400, vy: Math.sin(a) * v * H / 400 - H / 500, s: (0.6 + Math.random() * 0.6) * Math.min(W, H) / 14 }); } }
        const age = Math.max(0, (t - t0) / 1400);
        for (const q of parts) { q.x += q.vx; q.y += q.vy; q.vy += H / 30000; const i = Math.max(0, Math.min(cvs.length - 1, Math.floor(age * cvs.length))); ctx.globalAlpha = Math.max(0, 1 - age); ctx.drawImage(cvs[i], q.x - q.s / 2, q.y - q.s / 2, q.s, q.s); }
        ctx.globalAlpha = 1;
      }
      anim = requestAnimationFrame(loop);
    };
    anim = requestAnimationFrame(loop);
  }
  async function load(pt) {
    cur = pt; own = null; base = [];
    for (let i = 0; i < pt.frames; i++) { const im = await texImg(p, pt.file(i)); if (im) base.push(im); }
    if (base.length && base.length < pt.frames) base = [];
    const c = cfg(); if (c.custom && c.custom.length) own = await Promise.all(c.custom.map((x) => IMG.fromB64(x)));
    sync();
  }
  const S0 = () => (base[0] ? base[0].width : cur.size);
  async function setCustom(frs, how, keepStyle) {
    own = frs; const c = cfg(); c.shape = 'custom'; c.how = how; c.custom = frs.map((f) => IMG.toB64(f)); if (!keepStyle) c.style = 'orig';
    await saveProject(); sync();
  }
  function renderLib() {
    const lib = S.settings.pShapes || []; $('#plibw', b).style.display = lib.length ? '' : 'none';
    $('#plib', b).innerHTML = lib.map((x, i) => `<button data-i="${i}" title="استخدم هذا الشكل"><canvas></canvas><i data-del="${i}">×</i></button>`).join('');
    lib.forEach(async (x, i) => { const im = await IMG.fromB64(x); const cv = $(`#plib [data-i="${i}"] canvas`, b); if (!cv) return; cv.width = im.width; cv.height = im.height; cv.getContext('2d').putImageData(im, 0, 0); });
    $$('#plib [data-i]', b).forEach((x) => x.onclick = async (e) => {
      const i = +x.dataset.i;
      if (e.target.dataset.del !== undefined) { if (!(await confirmBox('حذف الشكل', 'تحذف هذا الشكل من أشكالك؟', 'احذف', true))) return; S.settings.pShapes.splice(i, 1); await api.settings.set(S.settings); return renderLib(); }
      await setCustom([IMG.resize(IMG.toCanvas(await IMG.fromB64(lib[i])), S0(), S0())], 'draw', true);
    });
  }
  // chip icons
  for (const x of PARTICLES) { const im = await texImg(p, x.file(Math.floor(x.frames / 2))); const cv = $(`.pchip[data-id="${x.id}"] canvas`, b); if (im && cv) { const c = cv.getContext('2d'); c.imageSmoothingEnabled = false; c.fillStyle = '#0b0e14'; c.fillRect(0, 0, 32, 32); c.drawImage(IMG.toCanvas(im), 0, 0, 32, 32); } }
  $$('#plist .pchip', b).forEach((x) => x.onclick = () => load(PARTICLES.find((q) => q.id === x.dataset.id)));
  $$('#pshape button', b).forEach((x) => x.onclick = () => { cfg().shape = x.dataset.s; sync(); });
  $('#pown', b).onclick = async () => {
    const f = await api.fs.pickFiles('اختر صورة أو GIF للجزيء', ['png', 'gif', 'jpg', 'jpeg', 'webp']); if (!f) return;
    const frs = await decodeImageFrames(f[0]); toast(frs.length > 1 ? `انقسمت لـ ${frs.length} إطارات ✓` : 'انضافت الصورة ✓');
    await setCustom(frs.map((im) => IMG.resize(IMG.toCanvas(im), S0(), S0())), 'own');
  };
  // draw one shape — the app animates it (grow & fade) and keeps it in your shapes
  $('#pdraw', b).onclick = () => {
    const n = S0(), c = cfg(), start = c.shape === 'custom' && own && own.length === 1 ? own[0] : IMG.blank(Math.max(n, 16), Math.max(n, 16));
    openPixelEditor({
      title: 'ارسم شكل الجزيء', subtitle: 'ارسم بالأبيض أو بأي لون — بعدين تقدر تلوّنه نار أو ثلج', image: start, size: [start.width, start.height], fileName: 'particle',
      onSave: async (img) => {
        S.settings.pShapes = [IMG.toB64(img), ...(S.settings.pShapes || [])].slice(0, 24); await api.settings.set(S.settings);
        await setCustom([IMG.resize(IMG.toCanvas(img), n, n)], 'draw', true); toast('انحفظ شكلك ✓ — تلقاه بأشكالك المحفوظة');
      },
    });
  };
  // draw every frame yourself (with the app's frame tools: add, delete, play, onion)
  $('#pframes', b).onclick = () => {
    const n = S0(), fr = frames().map((f) => (f.width === n ? f : IMG.resize(IMG.toCanvas(f), n, n)));
    const nf = Math.max(1, fr.length), strip = document.createElement('canvas'); strip.width = n; strip.height = n * nf;
    fr.forEach((f, i) => strip.getContext('2d').putImageData(f, 0, i * n));
    openPixelEditor({
      title: 'سوّ أنيميشن الجزيء بنفسك', subtitle: cur.frames > 1 ? `ارسم كل إطار — ${cur.name} فيه ${cur.frames} إطارات باللعبة` : 'هذا الجزيء صورة وحدة باللعبة (بدون إطارات)',
      image: strip.getContext('2d').getImageData(0, 0, n, n * nf), size: [n, n], fileName: cur.id, meta: nf > 1 ? JSON.stringify({ animation: { frametime: 1 } }) : '',
      onSave: async (img) => {
        const k = Math.max(1, Math.floor(img.height / img.width)), w = img.width, cv = IMG.toCanvas(img);
        const list = Array.from({ length: k }, (_, i) => cv.getContext('2d').getImageData(0, i * w, w, w));
        // the game always plays a fixed number of frames → spread what you drew over them
        const outF = Array.from({ length: cur.frames }, (_, i) => list[Math.min(k - 1, Math.floor(i * k / cur.frames))]);
        await setCustom(outF, 'frames', true); toast('انحفظ الأنيميشن ✓');
      },
    });
  };
  $$('#pstyle button', b).forEach((x) => x.onclick = () => { cfg().style = x.dataset.st; sync(); });
  $('#pcol', b).oninput = () => { cfg().color = $('#pcol', b).value; play(); };
  $('#papply', b).onclick = async () => {
    const fr = frames(); if (!fr.length) return toast('ما فيه شكل — حمّل ملفات اللعبة أو اختر شكل', 'err');
    for (let i = 0; i < cur.frames; i++) await api.tex.put(p.id, cur.file(i), IMG.toB64(fr[Math.min(i, fr.length - 1)]));
    await saveProject(); celebrate(); toast(`تغيّر ${cur.name} ✓ — ثبّت الباك وجربه`);
  };
  $('#preset', b).onclick = async () => { for (let i = 0; i < cur.frames; i++) await api.tex.reset(p.id, cur.file(i)); p.particles[cur.id] = null; own = null; await saveProject(); sync(); toast('رجع للأصلي'); };
  load(cur);
}

// ------------------------------------------------------------- font generator
const FONT_LIST = ['Segoe UI', 'Arial', 'Tahoma', 'Verdana', 'Consolas', 'Comic Sans MS', 'Impact', 'Georgia', 'Trebuchet MS', 'Courier New', 'Bahnschrift', 'Lucida Console', 'Times New Roman', 'Calibri'];
async function tabFont(b) {
  const p = S.project, fs0 = p.font || { family: 'Segoe UI', bold: true, cell: 16, pixel: false, offset: 0, scale: 100 };
  const layout = p.baseJar ? await api.font.layout(p) : null;
  if (!layout) { b.innerHTML = noBaseNotice() + `<div class="empty"><div class="big">${icon('file', 30)}</div>نحتاج ملفات اللعبة عشان نعرف ترتيب الحروف</div>`; bindBaseActions(b); return; }
  b.innerHTML = `<div class="two" style="grid-template-columns:380px 1fr"><div class="card stack">
      <h3 style="margin:0">${icon('edit', 18)} خط اللعبة</h3>
      <label class="f">الخط<select class="inp" id="ff">${FONT_LIST.map((f) => `<option ${f === fs0.family ? 'selected' : ''} style="font-family:'${f}'">${f}</option>`).join('')}<option value="__c">خط ثاني (اكتب اسمه)...</option></select></label>
      <input class="inp" id="ffc" placeholder="اسم الخط مثل: Minecraftia" style="display:none">
      <div class="row"><label class="check small"><span class="switch"><input type="checkbox" id="fb" ${fs0.bold ? 'checked' : ''}><span></span></span>عريض</label><label class="check small"><span class="switch"><input type="checkbox" id="fp" ${fs0.pixel ? 'checked' : ''}><span></span></span>بكسلي (بدون تنعيم)</label></div>
      <div class="slider-row" style="grid-template-columns:70px 1fr 46px"><span>الدقة</span><select class="inp" id="fc" style="height:34px;grid-column:span 2">${[8, 16, 32].map((n) => `<option value="${n}" ${n === fs0.cell ? 'selected' : ''}>${n * 16}×${n * 16}${n === 8 ? ' (زي الأصلي)' : n === 32 ? ' (ناعم مرة)' : ''}</option>`).join('')}</select></div>
      <div class="slider-row" style="grid-template-columns:70px 1fr 46px"><span>الحجم</span><input type="range" id="fsz" min="60" max="120" value="${fs0.scale}"><output class="ltr"></output></div>
      <div class="slider-row" style="grid-template-columns:70px 1fr 46px"><span>فوق/تحت</span><input type="range" id="fo" min="-4" max="4" step="0.5" value="${fs0.offset}"><output class="ltr"></output></div>
      <div class="row"><button class="btn primary" id="fapply">${icon('check', 16)} طبّق الخط</button><button class="btn ghost" id="freset">${icon('reset', 16)} الأصلي</button></div>
      <span class="muted small" style="line-height:1.7">يغيّر خط الشات والقوائم والأرقام. الخطوط المتاحة هي اللي مثبّتة على جهازك.</span></div>
    <div class="card"><h3>معاينة</h3><div class="font-prev"><canvas id="fpv"></canvas></div><canvas id="fsheet" style="width:256px;height:256px;image-rendering:pixelated;margin-top:12px;border-radius:10px;background:repeating-conic-gradient(#1a1f2b 0 25%,#151922 0 50%) 0 0/16px 16px"></canvas></div></div>`;
  const opts = () => ({ family: $('#ff', b).value === '__c' ? ($('#ffc', b).value.trim() || 'Arial') : $('#ff', b).value, bold: $('#fb', b).checked, pixel: $('#fp', b).checked, cell: +$('#fc', b).value, scale: +$('#fsz', b).value, offset: +$('#fo', b).value });
  function build(o) {
    const rows = layout.chars, c = o.cell, W = 16 * c, H = rows.length * c;
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const x = cv.getContext('2d');
    x.fillStyle = '#fff'; x.textBaseline = 'alphabetic'; x.font = `${o.bold ? 'bold ' : ''}${Math.round(c * 0.8 * o.scale / 100)}px "${o.family}"`;
    rows.forEach((row, ry) => [...row].forEach((ch, cx) => {
      if (ch === '\u0000' || ch === ' ') return;
      // keep each glyph inside its own cell (descenders/overhang would bleed into neighbours)
      x.save(); x.beginPath(); x.rect(cx * c, ry * c, c - Math.max(1, c / 8), c); x.clip();
      x.fillText(ch, cx * c, ry * c + c * (layout.ascent / layout.height) + o.offset * c / 8); x.restore();
    }));
    const id = x.getImageData(0, 0, W, H);
    if (o.pixel) for (let i = 3; i < id.data.length; i += 4) id.data[i] = id.data[i] > 110 ? 255 : 0;
    return id;
  }
  function preview() {
    $$('.slider-row output', b).forEach((o) => o.textContent = o.previousElementSibling.value);
    const o = opts(), sheet = build(o); const sc = $('#fsheet', b); sc.width = sheet.width; sc.height = sheet.height; sc.getContext('2d').putImageData(sheet, 0, 0);
    // render sample text using the sheet like the game does
    const pv = $('#fpv', b); const r = pv.getBoundingClientRect(); pv.width = r.width; pv.height = 170; const x = pv.getContext('2d'); x.imageSmoothingEnabled = false;
    x.fillStyle = '#3b6b2a'; x.fillRect(0, 0, pv.width, pv.height);
    const map = {}; layout.chars.forEach((row, ry) => [...row].forEach((ch, cx) => map[ch] = [cx, ry]));
    const c = o.cell, scale = 16 / c * 1.5, src = IMG.toCanvas(sheet);
    const lines = [['<Abood> GG wp! 1v1?', '#ffffff'], ['Health: 20 ♥  Kills: 7', '#ffff55'], ['MC Pack Studio 123', '#55ffff']];
    lines.forEach(([t, col], li) => {
      let px = 16; const py = 20 + li * 46;
      x.fillStyle = 'rgba(0,0,0,.35)'; x.fillRect(8, py - 6, pv.width - 16, 40);
      for (const ch of t) {
        if (ch === ' ') { px += c * 0.5 * scale; continue; }
        const m = map[ch]; if (!m) { px += c * 0.6 * scale; continue; }
        // measure glyph width like the game (rightmost opaque column)
        let gw = 1; const d = sheet.data; for (let gx = c - 1; gx >= 0; gx--) { let any = false; for (let gy = 0; gy < c; gy++) if (d[((m[1] * c + gy) * sheet.width + m[0] * c + gx) * 4 + 3] > 20) { any = true; break; } if (any) { gw = gx + 1; break; } }
        const tmp = document.createElement('canvas'); tmp.width = c; tmp.height = c; const tx = tmp.getContext('2d'); tx.drawImage(src, m[0] * c, m[1] * c, c, c, 0, 0, c, c); tx.globalCompositeOperation = 'source-in'; tx.fillStyle = col; tx.fillRect(0, 0, c, c);
        x.drawImage(tmp, 0, 0, c, c, px, py, c * scale, c * scale); px += (gw + c / 8) * scale;
      }
    });
  }
  ['ff', 'ffc', 'fb', 'fp', 'fc', 'fsz', 'fo'].forEach((id) => $('#' + id, b).oninput = () => { if (id === 'ff') $('#ffc', b).style.display = $('#ff', b).value === '__c' ? '' : 'none'; preview(); });
  $('#fc', b).onchange = preview; $('#ff', b).onchange = $('#ff', b).oninput;
  document.fonts.ready.then(preview); preview();
  $('#fapply', b).onclick = async () => { const o = opts(); p.font = o; await saveProject(); await api.tex.put(p.id, layout.file, IMG.toB64(build(o))); toast('تغيّر الخط ✓ — ثبّت الباك وشوفه باللعبة'); };
  $('#freset', b).onclick = async () => { await api.tex.reset(p.id, layout.file); toast('رجع الخط الأصلي'); };
}

// ---------- fire tab
function fireTransform(img, lower, opacity, tint) {
  const w = img.width, n = img.height > img.width && img.height % w === 0 ? img.height / w : 1, h = n > 1 ? w : img.height;
  let src = tint ? IMG.tint(img, tint, 1, false) : img;
  const out = new ImageData(w, img.height), shift = Math.round(lower * h);
  for (let f = 0; f < n; f++) for (let y = 0; y < h - shift; y++) for (let x = 0; x < w; x++) {
    const si = ((f * h + y) * w + x) * 4, di = ((f * h + y + shift) * w + x) * 4;
    out.data[di] = src.data[si]; out.data[di + 1] = src.data[si + 1]; out.data[di + 2] = src.data[si + 2]; out.data[di + 3] = src.data[si + 3] * opacity;
  }
  return out;
}
// ---------- fire: the screen overlay and the fire on the ground are separate
// Minecraft draws the burning-screen effect with fire_1 only, and ground fire alternates fire_0 / fire_1.
// So: fire_1 = screen look; ground fire gets its own copy (fire_1_ground) + fire_0, each with its own size.
const FIRE_GROUND_MODELS = ['fire_floor1', 'fire_side1', 'fire_side_alt1', 'fire_up1', 'fire_up_alt1'];
const FIRE_GROUND_TEX = 'textures/block/fire_1_ground.png';
function fireGround(img, size, opacity, tint) {
  const w = img.width, n = img.height > img.width && img.height % w === 0 ? img.height / w : 1, h = n > 1 ? w : img.height;
  const src = tint ? IMG.tint(img, tint, 1, false) : img, out = new ImageData(w, img.height), nh = Math.max(0, Math.round(h * size));
  if (!nh || opacity <= 0) return out;
  for (let f = 0; f < n; f++) for (let y = 0; y < nh; y++) { const sy = Math.min(h - 1, Math.floor(y * h / nh)), dy = h - nh + y; for (let x = 0; x < w; x++) {
    const si = ((f * h + sy) * w + x) * 4, di = ((f * h + dy) * w + x) * 4;
    out.data[di] = src.data[si]; out.data[di + 1] = src.data[si + 1]; out.data[di + 2] = src.data[si + 2]; out.data[di + 3] = src.data[si + 3] * opacity; } }
  return out;
}
async function applyFire(p, c) {
  c = Object.assign({ lower: 0, opacity: 1, useTint: false, tint: null, gSize: 1, gOpacity: 1, gTint: true }, c);
  const r0 = texPath(TEXTURES.find((t) => t.id === 'fire_0'), p.packFormat), r1 = texPath(TEXTURES.find((t) => t.id === 'fire_1'), p.packFormat);
  const i0 = await texImg(p, r0), i1 = await texImg(p, r1); if (!i1) return false;
  const m0 = (await api.tex.getMeta(p, r0)) || '{"animation":{}}', m1 = (await api.tex.getMeta(p, r1)) || '{"animation":{}}';
  const tint = c.useTint ? c.tint : null, gt = c.useTint && c.gTint ? c.tint : null;
  await api.tex.put(p.id, r1, IMG.toB64(fireTransform(i1, c.lower, c.opacity, tint)), m1);
  if (i0) await api.tex.put(p.id, r0, IMG.toB64(fireGround(i0, c.gSize, c.gOpacity, gt)), m0);
  await api.tex.put(p.id, FIRE_GROUND_TEX, IMG.toB64(fireGround(i1, c.gSize, c.gOpacity, gt)), m1);
  for (const n of FIRE_GROUND_MODELS) {
    const txt = await api.jar.text(p, `assets/minecraft/models/block/${n}.json`); if (!txt) continue;
    try { const j = JSON.parse(txt); j.textures = Object.assign({}, j.textures, { fire: 'minecraft:block/fire_1_ground' }); await api.file.putRaw(p.id, `assets/minecraft/models/block/${n}.json`, JSON.stringify(j, null, 2)); } catch {}
  }
  p.fire = c; return true;
}
async function resetFire(p) {
  for (const id of ['fire_0', 'fire_1']) await api.tex.reset(p.id, texPath(TEXTURES.find((t) => t.id === id), p.packFormat));
  await api.tex.reset(p.id, FIRE_GROUND_TEX);
  for (const n of FIRE_GROUND_MODELS) await api.file.remove(p.id, `assets/minecraft/models/block/${n}.json`);
  p.fire = null;
}
// the burning-screen overlay, placed exactly like Minecraft (two quads at z=-0.5, shifted ±0.24 / -0.3, turned 10°, hand FOV 70°)
function fireScreenRects(W, H) {
  const f = 1 / Math.tan(35 * Math.PI / 180), asp = W / H, out = [];
  for (let i = 0; i < 2; i++) {
    const sgn = -(i * 2 - 1), ry = (i * 2 - 1) * 10 * Math.PI / 180, pts = [];
    for (const [x, y] of [[-0.5, -0.5], [0.5, -0.5], [0.5, 0.5], [-0.5, 0.5]]) {
      const X = x * Math.cos(ry) + -0.5 * Math.sin(ry) + sgn * 0.24, Z = -x * Math.sin(ry) + -0.5 * Math.cos(ry), Y = y - 0.3;
      pts.push([W / 2 + (f / asp) * (X / -Z) * W / 2, H / 2 - f * (Y / -Z) * H / 2]);
    }
    out.push(pts);
  }
  return out;
}
function fireCoverage(frame, W = 160, H = 90) {
  const c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d', { willReadFrequently: true });
  for (const r of fireScreenRects(W, H)) { const xs = r.map((p) => p[0]), ys = r.map((p) => p[1]); x.drawImage(frame, Math.min(...xs), Math.min(...ys), Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)); }
  const d = x.getImageData(0, 0, W, H).data; let n = 0, top = H; for (let i = 3; i < d.length; i += 4) if (d[i] > 60) { n++; top = Math.min(top, Math.floor((i >> 2) / W)); }
  return { cover: n / (W * H), top: top / H };
}
async function tabFire(b) {
  const p = S.project;
  const t0 = TEXTURES.find((t) => t.id === 'fire_0'), t1 = TEXTURES.find((t) => t.id === 'fire_1');
  const p0 = texPath(t0, p.packFormat), p1 = texPath(t1, p.packFormat);
  const fs = Object.assign({ lower: 0.45, opacity: 1, tint: null, useTint: false, gSize: 1, gOpacity: 1, gTint: true }, p.fire || {});
  b.innerHTML = `${noBaseNotice()}<div class="two">
    <div class="card stack">
      <h3 style="margin:0">${icon('fire', 18)} النار على الشاشة <span class="muted small">(لما تحترق)</span></h3>
      <div class="seg" id="fmode"><button data-m="normal">عادي</button><button data-m="low">نار قصيرة (Low Fire)</button><button data-m="none">بدون نار</button></div>
      <div><div class="slider-row" style="grid-template-columns:90px 1fr 46px"><span>نزّل النار</span><input type="range" id="fl" min="0" max="90" value="${Math.round(fs.lower * 100)}"><output class="ltr"></output></div>
      <div class="slider-row" style="grid-template-columns:90px 1fr 46px"><span>الشفافية</span><input type="range" id="fo" min="10" max="100" value="${Math.round(fs.opacity * 100)}"><output class="ltr"></output></div></div>
      <div class="hstat" id="fstat"></div>
      <h3 style="margin:10px 0 0">${icon('fire', 18)} النار بالأرض <span class="muted small">(النار اللي تولّعها)</span></h3>
      <div class="seg" id="gmode"><button data-g="1">عادي</button><button data-g="0.6">صغير</button><button data-g="0.35">صغير مرة</button><button data-g="0">مخفي</button></div>
      <div><div class="slider-row" style="grid-template-columns:90px 1fr 46px"><span>الطول</span><input type="range" id="gsz" min="0" max="100" value="${Math.round(fs.gSize * 100)}"><output class="ltr"></output></div>
      <div class="slider-row" style="grid-template-columns:90px 1fr 46px"><span>الشفافية</span><input type="range" id="gop" min="10" max="100" value="${Math.round(fs.gOpacity * 100)}"><output class="ltr"></output></div></div>
      <label class="check"><span class="switch"><input type="checkbox" id="ft" ${fs.useTint ? 'checked' : ''}><span></span></span>لوّن النار<input type="color" id="ftc" value="${fs.tint || '#7c3aed'}" style="margin-inline-start:auto"></label>
      <label class="check small"><span class="switch"><input type="checkbox" id="fgt" ${fs.gTint !== false ? 'checked' : ''}><span></span></span>نفس اللون للنار اللي بالأرض</label>
      <div class="row"><button class="btn primary" id="fapply">${icon('check', 16)} طبّق على النار</button><button class="btn" id="fedit">${icon('pencil', 16)} ارسم بيدك</button><button class="btn ghost" id="freset">${icon('reset', 16)} الأصلي</button></div>
    </div>
    <div class="stack">
      <div class="card"><h3>كيف بيطلع على الشاشة <span class="muted small">(نفس حسابات ماينكرافت)</span></h3><div class="fp-stage"><canvas id="fcv"></canvas></div></div>
      <div class="card"><h3>النار بالأرض</h3><div class="fp-stage"><canvas id="gcv"></canvas></div></div>
    </div></div>`;
  bindBaseActions(b);
  const im1 = await texImg(p, p1), im0 = await texImg(p, p0);
  let mode = fs.lower === 0 && fs.opacity === 1 ? 'normal' : fs.opacity === 0 ? 'none' : 'low';
  const outs = () => $$('.slider-row output', b).forEach((o) => o.textContent = o.previousElementSibling.value + '%');
  const setMode = (md) => { mode = md; $$('#fmode button', b).forEach((x) => x.classList.toggle('on', x.dataset.m === md)); if (md === 'normal') { $('#fl', b).value = 0; $('#fo', b).value = 100; } if (md === 'low' && +$('#fl', b).value === 0) $('#fl', b).value = 45; upd(); };
  const syncG = () => { const v = +$('#gsz', b).value / 100; $$('#gmode button', b).forEach((x) => x.classList.toggle('on', Math.abs(+x.dataset.g - v) < 0.01)); };
  $$('#fmode button', b).forEach((x) => x.onclick = () => setMode(x.dataset.m));
  $$('#gmode button', b).forEach((x) => x.onclick = () => { $('#gsz', b).value = Math.round(+x.dataset.g * 100); upd(); });
  function cur() { return { lower: +$('#fl', b).value / 100, opacity: mode === 'none' ? 0 : +$('#fo', b).value / 100, useTint: $('#ft', b).checked, tint: $('#ftc', b).value, gSize: +$('#gsz', b).value / 100, gOpacity: +$('#gop', b).value / 100, gTint: $('#fgt', b).checked }; }
  let scr = null, gnd = null;
  function upd() {
    outs(); syncG(); const c = cur();
    scr = im1 ? IMG.toCanvas(fireTransform(im1, c.lower, c.opacity, c.useTint ? c.tint : null)) : null;
    gnd = im1 ? [im0 || im1, im1].map((im) => IMG.toCanvas(fireGround(im, c.gSize, c.gOpacity, c.useTint && c.gTint ? c.tint : null))) : null;
    const st = $('#fstat', b);
    if (!scr) { st.className = 'hstat'; st.innerHTML = `<span class="muted small">المعاينة تحتاج ملفات الفانيلا</span>`; return; }
    const w = scr.width, fr = document.createElement('canvas'); fr.width = fr.height = w; fr.getContext('2d').drawImage(scr, 0, 0, w, w, 0, 0, w, w);
    const cv = fireCoverage(fr), pct = Math.round(cv.cover * 100);
    const k = cv.cover < 0.005 ? ['off', 'النار ما بتطلع على الشاشة أبد — بس اللي حولك يشوفونك تحترق'] : cv.cover < 0.12 ? ['ok', `نار قصيرة ✓ — تغطي ${pct}% من الشاشة بس`] : cv.cover < 0.3 ? ['cut', `تغطي ${pct}% من الشاشة`] : ['cut', `تغطي ${pct}% من الشاشة — كثير (هذا الطبيعي باللعبة)`];
    st.className = 'hstat ' + k[0]; st.innerHTML = `${icon('fire', 15)}<span>${k[1]}</span>`;
  }
  ['fl', 'fo', 'ft', 'ftc', 'gsz', 'gop', 'fgt'].forEach((id) => $('#' + id, b).oninput = () => { if (mode === 'normal' && (id === 'fl' || id === 'fo')) { mode = 'low'; $$('#fmode button', b).forEach((x) => x.classList.toggle('on', x.dataset.m === 'low')); } upd(); });
  setMode(mode);
  const cv = $('#fcv', b), gv = $('#gcv', b); let tick = 0;
  const sky = (x, W, H) => { const g = x.createLinearGradient(0, 0, 0, H * 0.55); g.addColorStop(0, '#78a7ff'); g.addColorStop(1, '#c4dcff'); x.fillStyle = g; x.fillRect(0, 0, W, H); x.fillStyle = '#5d9b3a'; x.fillRect(0, H * 0.55, W, H); };
  const loop = () => {
    if (!document.body.contains(cv)) return;
    tick++;
    for (const c of [cv, gv]) { const r = c.getBoundingClientRect(); c.width = Math.max(320, r.width * devicePixelRatio); c.height = c.width * 9 / 16; }
    // screen
    let x = cv.getContext('2d'), W = cv.width, H = cv.height; x.imageSmoothingEnabled = false; sky(x, W, H);
    if (scr) { const w = scr.width, n = Math.max(1, Math.floor(scr.height / w)), f = tick % n; x.globalAlpha = 0.9;
      for (const rc of fireScreenRects(W, H)) { const xs = rc.map((q) => q[0]), ys = rc.map((q) => q[1]); x.drawImage(scr, 0, f * w, w, w, Math.min(...xs), Math.min(...ys), Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)); }
      x.globalAlpha = 1; }
    const u = H / 100; x.fillStyle = 'rgba(255,255,255,.9)'; x.fillRect(W / 2 - u * 1.6, H / 2 - u * 0.25, u * 3.2, u * 0.5); x.fillRect(W / 2 - u * 0.25, H / 2 - u * 1.6, u * 0.5, u * 3.2);
    // ground: a burning block in front of you, with a player-height marker
    x = gv.getContext('2d'); W = gv.width; H = gv.height; x.imageSmoothingEnabled = false; sky(x, W, H);
    const bs = H * 0.34, bx = W / 2 - bs / 2, by = H * 0.55;
    x.fillStyle = '#6b4a2b'; x.fillRect(bx - bs * 1.2, by, bs * 3.4, bs * 0.9); x.fillStyle = '#5d9b3a'; x.fillRect(bx - bs * 1.2, by, bs * 3.4, bs * 0.18);
    if (gnd) for (let k = 0; k < 2; k++) { const im = gnd[k], w = im.width, n = Math.max(1, Math.floor(im.height / w)), f = (tick + k * 7) % n, fh = bs * 1.4; x.globalAlpha = 0.95; x.drawImage(im, 0, f * w, w, w, bx + (k ? bs * 0.12 : -bs * 0.12), by - fh + bs * 0.04, bs, fh); }
    x.globalAlpha = 1;
    x.fillStyle = 'rgba(0,0,0,.45)'; const ph = bs * 1.8; x.fillRect(bx + bs * 1.7, by - ph, bs * 0.45, ph); x.fillStyle = '#fff'; x.font = `${Math.round(u * 3.4)}px Segoe UI`; x.textAlign = 'center'; x.fillText('طول اللاعب', bx + bs * 1.92, by - ph - u * 2);
    setTimeout(() => requestAnimationFrame(loop), 70);
  };
  loop();
  $('#fapply', b).onclick = async () => {
    const ok = await applyFire(p, cur()); if (!ok) return toast('ما فيه تكستر نار أساسي — حمّل ملفات الفانيلا أو ارسمه', 'err');
    await saveProject(); celebrate(); toast('تغيّرت النار 🔥 — الشاشة والأرض كل وحدة لحالها');
  };
  $('#freset', b).onclick = async () => { await resetFire(p); await saveProject(); toast('رجعت النار للأصلي'); tabFire(b); };
  $('#fedit', b).onclick = () => editTexture({ ...t1, path: p1 }, () => tabFire(b));
}

// ---------- shield tab
const SHIELD_DEFAULT = {
  parent: 'builtin/entity', gui_light: 'front', textures: { particle: 'block/dark_oak_planks' },
  display: {
    thirdperson_righthand: { rotation: [0, 90, 0], translation: [10, 6, -4], scale: [1, 1, 1] },
    thirdperson_lefthand: { rotation: [0, 90, 0], translation: [10, 6, 12], scale: [1, 1, 1] },
    firstperson_righthand: { rotation: [0, 180, 5], translation: [-10, 2, -10], scale: [1.25, 1.25, 1.25] },
    firstperson_lefthand: { rotation: [0, 180, 5], translation: [10, 0, -10], scale: [1.25, 1.25, 1.25] },
    gui: { rotation: [15, -25, -5], translation: [2, 3, 0], scale: [0.65, 0.65, 0.65] },
    fixed: { rotation: [0, 180, 0], translation: [-4.5, 4.5, -5], scale: [0.55, 0.55, 0.55] },
    ground: { rotation: [0, 0, 0], translation: [2, 4, 2], scale: [0.25, 0.25, 0.25] },
  },
  overrides: [{ predicate: { blocking: 1 }, model: 'item/shield_blocking' }],
};
const SHIELD_BLOCK_DEFAULT = {
  parent: 'builtin/entity', gui_light: 'front', textures: { particle: 'block/dark_oak_planks' },
  display: {
    thirdperson_righthand: { rotation: [45, 135, 0], translation: [3.51, 11, -2], scale: [1, 1, 1] },
    thirdperson_lefthand: { rotation: [45, 135, 0], translation: [13.51, 3, 5], scale: [1, 1, 1] },
    firstperson_righthand: { rotation: [0, 180, -5], translation: [-15, 5, -11], scale: [1.25, 1.25, 1.25] },
    firstperson_lefthand: { rotation: [0, 180, -5], translation: [5, 5, -11], scale: [1.25, 1.25, 1.25] },
    gui: { rotation: [15, -25, -5], translation: [2, 3, 0], scale: [0.65, 0.65, 0.65] },
  },
};
// shield base models: sizes taken from another pack win, then the game's own, then the built-in copy
async function shieldBase(p) {
  const get = async (rel, def) => { const t = await api.asset.baseText(p, rel); try { if (t) return JSON.parse(t); } catch {} return p.packFormat >= 46 ? JSON.parse(JSON.stringify(def)) : JSON.parse(JSON.stringify(def)); };
  const a = await get('models/item/shield.json', SHIELD_DEFAULT), bl = await get('models/item/shield_blocking.json', SHIELD_BLOCK_DEFAULT);
  const imp = (p.shield && p.shield.imported) || {};
  if (imp.shield && a) a.display = { ...(a.display || {}), ...JSON.parse(JSON.stringify(imp.shield)) };
  if (imp.shield_blocking && bl) bl.display = { ...(bl.display || {}), ...JSON.parse(JSON.stringify(imp.shield_blocking)) };
  return { a, bl };
}
async function shieldQuadsOf(p) {
  const st = texPath(TEXTURES.find((t) => t.id === 'shield_tex'), p.packFormat); const r = st && await api.tex.get(p, st);
  return r ? heldQuads(await IMG.fromB64(r.data), true, 'shield') : [];
}
// same maths as held:build — shrink around the part you see, then lower
function shieldMod(m, lower, scale, anchor, p, xs = 0, z = 0, rot = 0) {
  if (!m || !m.display) return m;
  if (p && p.packFormat <= 3) delete m.gui_light;
  for (const k of ['firstperson_righthand', 'firstperson_lefthand']) {
    const d = m.display[k]; if (!d) continue; const left = k.includes('left');
    d.translation = [...(d.translation || [0, 0, 0])];
    const r0 = [...(d.rotation || [0, 0, 0])], r1 = [r0[0], r0[1], r0[2] + rot], S0 = d.scale || [1, 1, 1], S1 = S0.map((v) => v * scale);
    if (anchor) { const a = heldRot([0, 1, 2].map((i) => S0[i] * anchor[i]), r0, left), b = heldRot([0, 1, 2].map((i) => S1[i] * anchor[i]), r1, left); const dv = [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; if (left) dv[0] = -dv[0]; for (let i = 0; i < 3; i++) d.translation[i] += dv[i] * 16; }
    if (rot) d.rotation = r1.map((v) => +v.toFixed(2));
    d.translation[1] -= lower; d.translation[0] += left ? -xs : xs; d.translation[2] += z;
    d.translation = d.translation.map((v) => +Math.max(-80, Math.min(80, v)).toFixed(3));
    d.scale = S1.map((v) => +Math.max(-4, Math.min(4, v)).toFixed(3));
  }
  return m;
}
async function shieldAnchors(p, base) {
  const q = await shieldQuadsOf(p); if (!q.length) return [null, null];
  const an = (m) => (m && m.display && m.display.firstperson_righthand ? heldAnchor(q, heldApply(m.display.firstperson_righthand, null, 0, 1, 0)) : null);
  return [an(base.a) || [-0.5, -0.5, -0.41], an(base.bl) || [-0.5, -0.5, -0.41]];
}
async function buildExtras() {
  const p = S.project, ex = {};
  const sh = p.shield;
  if (sh && (sh.enabled || sh.imported) && p.packFormat >= 2) {
    const base = await shieldBase(p), [an, abl] = sh.enabled ? await shieldAnchors(p, base) : [null, null];
    const on = !!sh.enabled;
    if (base.a) ex['assets/minecraft/models/item/shield.json'] = JSON.stringify(on ? shieldMod(base.a, sh.lower, sh.scale, an, p, sh.x || 0, sh.z || 0, sh.rot || 0) : base.a, null, 2);
    if (base.bl) ex['assets/minecraft/models/item/shield_blocking.json'] = JSON.stringify(on ? shieldMod(base.bl, sh.blockLower, sh.bscale || sh.scale, abl, p, sh.bx || 0, sh.bz || 0, sh.brot || 0) : base.bl, null, 2);
  }
  if (p.held && (p.held.on || Object.keys(p.held.imported || {}).length) && p.baseJar) { const r = await api.held.build(p, p.held); Object.assign(ex, r.extras || {}); }
  return ex;
}
// take only sizes/positions from any pack (shield, swords, every item, low fire) — no textures
async function importMeasurements(after) {
  const p = S.project; const r = await api.pack.measure(); if (!r) return;
  if (r.error) return toast('ما قدرت أقرأ الباك', 'err');
  let fireLow = null;
  if (r.fire) {
    const top = (im) => { const w = im.width, h = Math.min(im.width, im.height); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (im.data[(y * w + x) * 4 + 3] > 20) return y / h; return 1; };
    const t1 = texPath(TEXTURES.find((t) => t.id === 'fire_1'), p.packFormat), van = await texImg(p, t1);
    if (van) { const d = top(await IMG.fromB64(r.fire)) - top(van); if (d > 0.03) fireLow = Math.min(0.95, +d.toFixed(2)); }
  }
  const names0 = Object.keys(r.models).sort((a, b) => (/shield/.test(b) ? 1 : 0) - (/shield/.test(a) ? 1 : 0) || a.localeCompare(b));
  const fk = itemFamily;
  const fc = {}; names0.forEach((n) => { const f = fk(n); if (f) (fc[f] = fc[f] || []).push(n); });
  const groupsM = []; const seen = new Set();
  for (const n of names0) { if (seen.has(n)) continue; const f = fk(n); if (f && fc[f].length >= 2) { fc[f].forEach((x) => seen.add(x)); groupsM.push({ key: 'fam:' + f, label: famLabel(f) + ` (${fc[f].length})`, members: fc[f] }); } else { seen.add(n); groupsM.push({ key: n, members: [n] }); } }
  const names = groupsM.map((g) => g.key);
  if (!names0.length && fireLow == null) return toast('هذا الباك ما فيه قياسات مختلفة (أحجام أو نار قصيرة)');
  const label = (n) => (n === 'shield' ? 'الشيلد' : n === 'shield_blocking' ? 'الشيلد وقت البلوك' : /^(handheld|generated|handheld_rod|handheld_mace)$/.test(n) ? `كل ${n === 'generated' ? 'الأشياء العادية' : n === 'handheld_rod' ? 'السنانير' : 'السيوف والأدوات'} (${n})` : itemName(n));
  const m = modal({ title: `${icon('download', 18)} خذ القياسات من «${esc(r.name)}»`, sub: 'آخذ الأحجام والأماكن بس — التكسترات حقتك ما تتغيّر',
    body: `<div class="stack" style="gap:6px;max-height:420px;overflow:auto">
      ${fireLow != null ? `<label class="check mrow2"><span class="switch"><input type="checkbox" data-fire checked><span></span></span>${icon('fire', 16)} النار القصيرة <span class="muted small">(نازل ${Math.round(fireLow * 100)}%)</span></label>` : ''}
      ${groupsM.map((g) => `<label class="check mrow2"><span class="switch"><input type="checkbox" data-n="${esc(g.key)}" checked><span></span></span>${esc(g.label || label(g.key))}<span class="dim small ltr" style="margin-inline-start:auto;max-width:45%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(g.members.join(', '))}</span></label>`).join('')}</div>`,
    foot: `<button class="btn ghost" data-all>${icon('check', 15)} الكل</button><span class="spacer"></span><button class="btn primary" data-go>${icon('check', 16)} خذ المختار</button>` });
  m.el.querySelector('[data-all]').onclick = () => $$('input[type=checkbox]', m.el).forEach((x) => (x.checked = true));
  m.el.querySelector('[data-go]').onclick = async () => {
    const pick = $$('input[data-n]', m.el).filter((x) => x.checked).flatMap((x) => (groupsM.find((g) => g.key === x.dataset.n) || { members: [x.dataset.n] }).members);
    p.held = Object.assign({ on: false }, HELD_DEF, p.held || {}); p.held.imported = { ...(p.held.imported || {}) };
    const shImp = {};
    for (const n of pick) { if (/^shield(_blocking)?$/.test(n)) shImp[n] = r.models[n]; else { p.held.imported[n] = r.models[n]; if (p.held.items) delete p.held.items[n]; } }
    if (Object.keys(shImp).length) p.shield = Object.assign({ enabled: false, lower: 0, scale: 1, blockLower: 0 }, p.shield || {}, { imported: { ...((p.shield && p.shield.imported) || {}), ...shImp }, enabled: false, lower: 0, blockLower: 0, scale: 1 });
    const fc = m.el.querySelector('[data-fire]');
    if (fc && fc.checked) await applyFire(p, { ...(p.fire || {}), lower: fireLow, opacity: (p.fire && p.fire.opacity) || 1 });
    await saveProject(); m.close(true); celebrate();
    toast(`أخذت ${pick.length + (fc && fc.checked ? 1 : 0)} قياسات من ${r.name} ✓`); after && after();
  };
}
function clearMeasurements(p) { if (p.held) p.held.imported = {}; if (p.shield) delete p.shield.imported; }
async function tabShield(b) {
  const p = S.project;
  if (p.packFormat < 2) { b.innerHTML = `<div class="empty"><div class="big">${icon('shield', 32)}</div><h2>الشيلد مو موجود في ${esc(p.version)}</h2><p>الشيلد انضاف في 1.9 — غيّر نسخة الملف من إعدادات الملف لو تبي تعدّله.</p></div>`; return; }
  const sh = p.shield = Object.assign({ enabled: false, lower: 0, scale: 1, blockLower: 0 }, p.shield || {});
  const imp = sh.imported && Object.keys(sh.imported).length;
  b.innerHTML = `${p.baseJar ? '' : noBaseNotice()}
  <div class="two"><div class="card stack">
    <label class="check" style="justify-content:space-between"><b>${icon('shield', 18)} شيلد قصير (Low Shield)</b><span class="switch"><input type="checkbox" id="sen" ${sh.enabled ? 'checked' : ''}><span></span></span></label>
    <div id="sctl">
      <div class="slider-row" style="grid-template-columns:110px 1fr 40px"><span>نزول الشيلد</span><input type="range" id="sl" min="-4" max="12" step="0.5" value="${sh.lower}"><output class="ltr"></output></div>
      <div class="slider-row" style="grid-template-columns:110px 1fr 40px"><span>وقت البلوك</span><input type="range" id="sb" min="-4" max="12" step="0.5" value="${sh.blockLower}"><output class="ltr"></output></div>
      <div class="slider-row" style="grid-template-columns:110px 1fr 40px"><span>الحجم</span><input type="range" id="ss" min="0.3" max="1.3" step="0.05" value="${sh.scale}"><output class="ltr"></output></div>
      <div class="row" style="margin-top:6px"><button class="btn sm" data-pre="1,1,0.85">قصير</button><button class="btn sm" data-pre="2,2,0.7">قصير مرة</button><button class="btn sm" data-pre="3,3,0.55">أقصى شي</button><button class="btn sm ghost" data-pre="0,0,1">الأصلي</button></div>
    </div>
    <div class="row"><button class="btn" id="smeas">${icon('download', 16)} خذ القياسات من باك</button>${imp ? `<button class="btn ghost" id="sclr">${icon('x', 15)} شيل القياسات المأخوذة</button>` : ''}<button class="btn" id="stex">${icon('pencil', 16)} عدّل تكستر الشيلد</button></div>
    ${imp ? `<div class="muted small">${icon('check', 14)} مستخدم قياسات شيلد من باك ثاني</div>` : ''}
    <span class="muted small" style="line-height:1.7">يتعدّل موديل <span class="mono">shield.json</span> و <span class="mono">shield_blocking.json</span> — نفس الملف اللي يعدّله "حجم الأدوات"، فكل شي عن الشيلد هنا.</span>
  </div>
  <div class="card"><h3>كيف بيطلع باللعبة <span class="muted small">(نفس حسابات ماينكرافت)</span></h3><div class="fp-stage"><canvas id="scv"></canvas></div><div class="hstat" id="sstat"></div>
    <div class="row" style="margin-top:10px"><span class="seg" id="sview"><button data-v="0" class="on">عادي</button><button data-v="1">وقت البلوك</button></span></div></div></div>`;
  bindBaseActions(b);
  const st = texPath(TEXTURES.find((t) => t.id === 'shield_tex'), p.packFormat);
  const base = await shieldBase(p), q = await shieldQuadsOf(p), [an, abl] = await shieldAnchors(p, base);
  let view = 0;
  const cv = $('#scv', b);
  const eff = (v, on) => { const m = v ? base.bl : base.a, d = m && m.display && m.display.firstperson_righthand; return heldApply(d, v ? abl : an, on ? +(v ? $('#sb', b).value : $('#sl', b).value) : 0, on ? +$('#ss', b).value : 1, 0); };
  function draw() {
    if (!cv.isConnected) return;
    const r = cv.getBoundingClientRect(); cv.width = Math.max(320, r.width * devicePixelRatio); cv.height = cv.width * 9 / 16;
    const res = heldProject(q, eff(view, $('#sen', b).checked), cv.width, cv.height); heldDraw(cv, res);
    const box = $('#sstat', b);
    if (!q.length) { box.className = 'hstat'; box.innerHTML = `<span class="muted small">حمّل ملفات اللعبة عشان تشوف الشيلد</span>`; return; }
    const stt = heldStatus(heldProject(q, eff(view, $('#sen', b).checked), 1600, 900), heldProject(q, eff(view, false), 1600, 900));
    box.className = 'hstat ' + stt.k; box.innerHTML = `${icon(stt.k === 'ok' ? 'check' : 'sun', 15)}<span>${stt.t}</span>${stt.k !== 'ok' ? `<button class="btn sm" id="sfix">${icon('wand', 14)} صلّحها لي</button>` : ''}`;
    const fx = $('#sfix', b); if (fx) fx.onclick = fix;
  }
  function fix() {
    let l = +(view ? $('#sb', b).value : $('#sl', b).value), sc = +$('#ss', b).value; const m = view ? base.bl : base.a, d = m.display.firstperson_righthand, bs = heldProject(q, eff(view, false), 1600, 900);
    for (let i = 0; i < 40; i++) { const s2 = heldStatus(heldProject(q, heldApply(d, view ? abl : an, l, sc, 0), 1600, 900), bs); if (s2.k === 'ok') break; l = l > 0 ? Math.max(0, l - 0.5) : Math.min(0, l + 0.5); sc = sc < 1 ? Math.min(1, sc + 0.05) : Math.max(1, sc - 0.05); }
    $(view ? '#sb' : '#sl', b).value = Math.round(l * 2) / 2; $('#ss', b).value = Math.round(sc * 20) / 20; upd(); toast('ضبطت الشيلد عشان يبان ✓');
  }
  const upd = () => {
    sh.enabled = $('#sen', b).checked; sh.lower = +$('#sl', b).value; sh.blockLower = +$('#sb', b).value; sh.scale = +$('#ss', b).value;
    $('#sctl', b).style.opacity = sh.enabled ? 1 : .4; $('#sctl', b).style.pointerEvents = sh.enabled ? '' : 'none';
    $$('#sctl output', b).forEach((o) => o.textContent = o.previousElementSibling.value);
    draw(); clearTimeout(upd.t); upd.t = setTimeout(saveProject, 400);
  };
  ['sen', 'sl', 'sb', 'ss'].forEach((id) => $('#' + id, b).oninput = upd);
  $$('[data-pre]', b).forEach((x) => x.onclick = () => { const [l, bl, s] = x.dataset.pre.split(',').map(Number); $('#sen', b).checked = true; $('#sl', b).value = l; $('#sb', b).value = bl; $('#ss', b).value = s; upd(); });
  $$('#sview button', b).forEach((x) => x.onclick = () => { view = +x.dataset.v; $$('#sview button', b).forEach((y) => y.classList.toggle('on', y === x)); draw(); });
  $('#stex', b).onclick = () => editTexture({ ...TEXTURES.find((t) => t.id === 'shield_tex'), path: st }, () => tabShield(b));
  $('#smeas', b).onclick = () => importMeasurements(() => tabShield(b));
  const cl = $('#sclr', b); if (cl) cl.onclick = async () => { delete sh.imported; await saveProject(); tabShield(b); toast('رجع الشيلد لقياسات اللعبة'); };
  new ResizeObserver(() => draw()).observe(cv);
  requestAnimationFrame(upd);
}

// ---------- theme tab
async function tabTheme(b) {
  const p = S.project, pf = p.packFormat;
  const th = p.theme || { color: '#8b5cf6', strength: 100, keepGray: true, cats: ['swords', 'pvp', 'gui'] };
  const cats = CATEGORIES.filter((c) => c.id !== 'custom');
  const presets = ['#ef4444', '#f97316', '#facc15', '#22c55e', '#14b8a6', '#3b82f6', '#8b5cf6', '#ec4899', '#ffffff', '#111111'];
  b.innerHTML = `${noBaseNotice()}<div class="two"><div class="card stack">
    <h3 style="margin:0">${icon('palette', 18)} لوّن الباك كامل بلون واحد</h3>
    <div class="row"><input type="color" id="tc" value="${th.color}"><div class="row" style="gap:6px">${presets.map((c) => `<button class="sw" data-c="${c}" style="width:26px;height:26px;background:${c}"></button>`).join('')}</div></div>
    <div class="slider-row" style="grid-template-columns:70px 1fr 46px"><span>القوة</span><input type="range" id="tsn" min="10" max="100" value="${th.strength}"><output class="ltr"></output></div>
    <label class="check"><span class="switch"><input type="checkbox" id="tkg" ${th.keepGray ? 'checked' : ''}><span></span></span>خلّ الألوان الرمادية والبيضاء (مثل يد السيف) زي ما هي</label>
    <div><div class="muted small" style="margin-bottom:8px">الأقسام اللي بتتلوّن:</div><div class="cats" style="margin:0">${cats.map((c) => `<button class="chip ${th.cats.includes(c.id) ? 'on' : ''}" data-tc="${c.id}">${icon(c.icon, 14)}${c.name}</button>`).join('')}</div></div>
    <div class="row"><button class="btn primary" id="tapply">${icon('wand', 16)} طبّق السمة</button><button class="btn ghost danger" id="treset">${icon('reset', 16)} رجّع الأقسام للأصلي</button></div>
    <span class="muted small" style="line-height:1.7">التلوين يصير على التكستر الأصلي كل مرة، فتقدر تجرب ألوان كثيرة بدون ما تخرب شي. بعدها تقدر تعدّل أي تكستر بيدك.</span>
  </div><div class="card"><h3>معاينة</h3><div class="tex-grid" id="tprev" style="grid-template-columns:repeat(auto-fill,minmax(110px,1fr))"></div></div></div>`;
  bindBaseActions(b);
  const sample = ['diamond_sword', 'iron_sword', 'bow', 'ender_pearl', 'golden_apple', 'crosshair', 'white_wool', 'diamond_helmet', 'fire_0'].map((id) => TEXTURES.find((t) => t.id === id)).filter((t) => texPath(t, pf));
  const bases = {};
  for (const t of sample) { const r = await api.tex.get(p, texPath(t, pf), true); if (r) bases[t.id] = await IMG.fromB64(r.data); }
  function cur() { return { color: $('#tc', b).value, strength: +$('#tsn', b).value, keepGray: $('#tkg', b).checked, cats: $$('[data-tc].on', b).map((x) => x.dataset.tc) }; }
  function upd() {
    const c = cur(); $('#tsn', b).nextElementSibling.textContent = c.strength + '%';
    const g = $('#tprev', b); g.innerHTML = '';
    const shown = sample.filter((t) => bases[t.id] && c.cats.includes(t.cat));
    if (!shown.length) { g.innerHTML = `<div class="empty" style="grid-column:1/-1">${Object.keys(bases).length ? 'اختر قسم' : 'المعاينة تحتاج ملفات الفانيلا'}</div>`; return; }
    for (const t of shown) {
      const im = bases[t.id]; const fh = im.height > im.width ? im.width : im.height;
      const out = IMG.tint(im, c.color, c.strength / 100, c.keepGray);
      const cv = IMG.toCanvas(out); const d = document.createElement('div'); d.className = 'tex'; d.style.cursor = 'default';
      d.innerHTML = `<div class="pv"></div><div class="nm small">${esc(t.name)}</div>`;
      const cc = document.createElement('canvas'); cc.width = im.width; cc.height = fh; cc.getContext('2d').drawImage(cv, 0, 0);
      $('.pv', d).append(cc); g.append(d);
    }
  }
  $('#tc', b).oninput = upd; $('#tsn', b).oninput = upd; $('#tkg', b).onchange = upd;
  $$('.sw[data-c]', b).forEach((x) => x.onclick = () => { $('#tc', b).value = x.dataset.c; upd(); });
  $$('[data-tc]', b).forEach((x) => x.onclick = () => { x.classList.toggle('on'); upd(); });
  upd();
  $('#tapply', b).onclick = async () => {
    const c = cur(); p.theme = c; await saveProject();
    const targets = TEXTURES.filter((t) => c.cats.includes(t.cat) && texPath(t, pf));
    let n = 0;
    for (const t of targets) {
      const path = texPath(t, pf);
      const r = await api.tex.get(p, path, true); if (!r) continue;
      const out = IMG.tint(await IMG.fromB64(r.data), c.color, c.strength / 100, c.keepGray);
      const meta = await api.tex.getMeta(p, path);
      await api.tex.put(p.id, path, IMG.toB64(out), out.height > out.width ? meta : null); n++;
    }
    toast(n ? `تلوّن ${n} تكستر 🎨` : 'ما فيه تكسترات أصلية للتلوين — حمّل ملفات الفانيلا', n ? 'ok' : 'err');
  };
  $('#treset', b).onclick = async () => {
    const c = cur(); if (!await confirmBox('ترجيع للأصلي', `بترجع كل تكسترات الأقسام المختارة (${c.cats.length}) للأصلي وتنحذف تعديلاتها.`, 'رجّع', true)) return;
    for (const t of TEXTURES.filter((t) => c.cats.includes(t.cat) && texPath(t, pf))) await api.tex.reset(p.id, texPath(t, pf));
    toast('رجعت للأصلي');
  };
}

// ---------- mods tab
async function tabMods(b) {
  const p = S.project, c = clientOf(p.clientId);
  if (!p.modsPath) {
    b.innerHTML = `<div class="empty"><div class="big">${icon('puzzle', 32)}</div><h2>ما فيه مجلد مودات لهالباك</h2>
      <p style="line-height:1.8">${c.mods === null ? `${esc(c.name)} ما يدعم مودات خارجية. إذا عندك Fabric أو Forge اختر مجلد المودات حقه.` : 'حدد مجلد المودات عشان تشوفها وتعدّل عليها.'}</p>
      <button class="btn primary" id="pickm">${icon('folder', 16)} اختر مجلد المودات</button></div>`;
    $('#pickm', b).onclick = async () => { const f = await api.fs.pickFolder('مجلد المودات'); if (f) { p.modsPath = f; await saveProject(); tabMods(b); } };
    return;
  }
  modsPanel(b, { path: p.modsPath, setPath: async (f) => { p.modsPath = f; await saveProject(); } });
}
async function modsPanel(b, ctx) {
  b.innerHTML = `<div class="row" style="margin-bottom:16px">
    ${ctx.picker || ''}<div class="search" style="flex:1;max-width:340px"><input class="inp" id="ms" placeholder="ابحث في المودات..." value="${esc(S.search)}">${icon('search', 18)}</div>
    <span class="spacer"></span>
    <button class="btn" id="madd">${icon('plus', 16)} أضف مود</button>
    <button class="btn" id="mopen">${icon('folder', 16)} افتح المجلد</button>
    <button class="btn ghost icon" id="mref" title="تحديث">${icon('reset', 17)}</button></div>
    <div class="muted small ltr" style="margin-bottom:12px">${esc(ctx.path)}</div><div id="ml"><div class="empty">...قاعد أحمّل</div></div>`;
  $('#madd', b).onclick = async () => { const f = await api.fs.pickFiles('اختر مودات', ['jar'], true); if (f) { await api.mods.add(ctx.path, f); toast(`انضاف ${f.length} مود`); modsPanel(b, ctx); } };
  $('#mopen', b).onclick = () => api.fs.open(ctx.path);
  $('#mref', b).onclick = () => modsPanel(b, ctx);
  const mods = await api.mods.list(ctx.path);
  const ml = $('#ml', b);
  if (mods === null) { ml.innerHTML = `<div class="empty"><div class="big">${icon('folder', 30)}</div>المجلد مو موجود. <button class="btn sm" id="mk">اختر مجلد ثاني</button></div>`; $('#mk', b).onclick = async () => { const f = await api.fs.pickFolder('مجلد المودات'); if (f) { await ctx.setPath(f); modsPanel(b, ctx); } }; return; }
  const draw = () => {
    const q = $('#ms', b).value.toLowerCase(); S.search = q;
    const list = mods.filter((m) => !q || (m.name || '').toLowerCase().includes(q) || m.file.toLowerCase().includes(q));
    ml.innerHTML = list.length ? '' : `<div class="empty"><div class="big">${icon('puzzle', 30)}</div>${mods.length ? 'ما فيه نتائج' : 'ما فيه مودات — اضغط "أضف مود"'}</div>`;
    for (const m of list) {
      const d = document.createElement('div'); d.className = 'mod' + (m.enabled ? '' : ' off');
      d.innerHTML = `${m.icon ? `<img src="data:image/png;base64,${m.icon}">` : `<div class="mi">${icon('puzzle', 20)}</div>`}
        <div class="info"><div class="t">${esc(m.name || m.file)}${m.version ? `<span class="badge ltr" style="height:20px">${esc(m.version)}</span>` : ''}${m.loader ? `<span class="badge" style="height:20px">${esc(m.loader)}</span>` : ''}</div>
        <div class="d">${esc(m.description || m.authors || '')} <span class="ltr dim">${esc(m.file)} · ${fmtSize(m.size)}</span></div></div>
        <button class="btn sm" data-x="edit">${icon('edit', 15)} عدّل</button>
        <button class="btn sm ghost icon danger" data-x="del" title="حذف (يروح لسلة المحذوفات)">${icon('trash', 16)}</button>
        <label class="switch" title="${m.enabled ? 'مفعّل' : 'معطّل'}"><input type="checkbox" ${m.enabled ? 'checked' : ''}><span></span></label>`;
      $('input', d).onchange = async () => { m.path = await api.mods.toggle(m.path); m.enabled = !m.enabled; m.file = m.path.split(/[\\/]/).pop(); d.classList.toggle('off', !m.enabled); toast(m.enabled ? 'تفعّل المود' : 'تعطّل المود'); };
      $('[data-x=del]', d).onclick = async () => { if (await confirmBox('حذف المود', `تبي تحذف <b>${esc(m.name || m.file)}</b>؟ بيروح لسلة المحذوفات.`, 'احذف', true)) { await api.mods.delete(m.path); toast('انحذف'); modsPanel(b, ctx); } };
      $('[data-x=edit]', d).onclick = () => openModEditor(m);
      ml.append(d);
    }
  };
  $('#ms', b).oninput = draw; draw();
}

const TEXT_EXT = /\.(json5?|toml|cfg|properties|txt|lang|mcmeta|md|ya?ml|ini|conf|snbt|fsh|vsh|glsl|mf|accesswidener|mixins\.json)$/i;
async function openModEditor(mod) {
  const entries = await api.mods.entries(mod.path);
  const changes = {}; let curEntry = null;
  const m = modal({
    cls: 'xl', title: `تعديل: ${esc(mod.name || mod.file)}`, sub: `<span class="ltr">${esc(mod.file)} · ${entries.length} ملف</span> — تقدر تعدّل الصور والنصوص والإعدادات داخل المود (ملفات الكود .class ما تنعدل)`,
    body: `<div class="split" style="padding:16px;height:100%">
      <div class="card scroll" style="padding:10px;display:flex;flex-direction:column;gap:8px">
        <input class="inp" id="es" placeholder="بحث... (مثلاً png أو json)" style="height:34px">
        <div class="seg" id="ef" style="align-self:flex-start"><button data-f="all" class="on">الكل</button><button data-f="img">صور</button><button data-f="txt">نصوص</button></div>
        <div class="tree scroll" id="et" style="flex:1"></div></div>
      <div id="ev" class="card" style="display:flex;flex-direction:column;min-height:0"><div class="empty" style="margin:auto"><div class="big">${icon('file', 30)}</div>اختر ملف من القائمة</div></div></div>`,
    foot: `<button class="btn primary" id="esave" disabled>${icon('check', 16)} حفظ التعديلات في المود</button><span class="muted small" id="ecount"></span><span class="spacer"></span><span class="muted small">قبل الحفظ تنحفظ نسخة احتياطية تلقائياً</span>`,
    beforeClose: () => !Object.keys(changes).length || confirmBox('تعديلات ما انحفظت', 'فيه تعديلات ما انحفظت في المود، تطلع بدونها؟', 'اطلع', true),
  });
  const el = m.el; let filter = 'all';
  const updCount = () => { const n = Object.keys(changes).length; $('#esave', el).disabled = !n; $('#ecount', el).textContent = n ? `${n} ملف متعدّل` : ''; drawTree(); };
  function drawTree() {
    const q = $('#es', el).value.toLowerCase();
    const list = entries.filter((e) => (!q || e.name.toLowerCase().includes(q)) && (filter === 'all' || (filter === 'img' ? /\.png$/i.test(e.name) : TEXT_EXT.test(e.name)))).slice(0, 1500);
    $('#et', el).innerHTML = list.map((e) => `<div class="it ${e.name === curEntry ? 'on' : ''} ${changes[e.name] !== undefined ? 'chg' : ''}" data-e="${esc(e.name)}" title="${esc(e.name)}">${icon(/\.png$/i.test(e.name) ? 'image' : 'file', 14)}${esc(e.name)}</div>`).join('') || '<div class="dim" style="padding:8px">لا شيء</div>';
  }
  $('#es', el).oninput = drawTree;
  $$('#ef button', el).forEach((x) => x.onclick = () => { filter = x.dataset.f; $$('#ef button', el).forEach((y) => y.classList.toggle('on', y === x)); drawTree(); });
  $('#et', el).onclick = (e) => { const it = e.target.closest('[data-e]'); if (it) show(it.dataset.e); };
  const readEntry = async (name) => changes[name] !== undefined ? changes[name] : api.mods.read(mod.path, name);
  async function show(name) {
    curEntry = name; drawTree();
    const ev = $('#ev', el); const b64 = await readEntry(name);
    const head = `<div class="row" style="margin-bottom:12px"><b class="ltr mono" style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(name)}</b>`;
    if (/\.png$/i.test(name)) {
      const im = await IMG.fromB64(b64);
      ev.innerHTML = `${head}<button class="btn sm primary" id="pe">${icon('pencil', 15)} عدّل بالمحرر</button><button class="btn sm" id="rp">${icon('upload', 15)} استبدال بصورة</button><button class="btn sm ghost" id="ex">${icon('download', 15)} استخراج</button></div>
        <div style="flex:1;display:grid;place-items:center;background:repeating-conic-gradient(#1a1f2b 0 25%, #151922 0 50%) 0 0/16px 16px;border-radius:12px"><img src="data:image/png;base64,${b64}" style="image-rendering:pixelated;max-width:90%;max-height:90%;min-width:${Math.min(360, im.width * 20)}px"></div>
        <div class="muted small ltr" style="margin-top:8px">${im.width}×${im.height}</div>`;
      $('#pe', ev).onclick = () => openPixelEditor({ title: name.split('/').pop(), size: [im.width, im.height], image: im, fileName: name.split('/').pop().replace('.png', ''), onSave: (img) => { changes[name] = IMG.toB64(img); updCount(); show(name); } });
      $('#rp', ev).onclick = async () => { const f = await api.fs.pickFiles('اختر صورة PNG', ['png']); if (f) { changes[name] = await api.fs.readB64(f[0]); updCount(); show(name); } };
      $('#ex', ev).onclick = async () => { const r = await api.fs.saveB64(name.split('/').pop(), b64); if (r) toast('انحفظ'); };
    } else if (TEXT_EXT.test(name) || (b64 && atob(b64).slice(0, 2000).split('').every((ch) => ch.charCodeAt(0) >= 9 && ch.charCodeAt(0) < 0xF8))) {
      const txt = new TextDecoder().decode(Uint8Array.from(atob(b64), (c) => c.charCodeAt(0)));
      ev.innerHTML = `${head}<button class="btn sm" id="fmt" ${/\.json$/i.test(name) ? '' : 'style="display:none"'}>تنسيق JSON</button><button class="btn sm primary" id="ap">${icon('check', 15)} اعتمد التعديل</button></div><textarea class="code" id="ta" spellcheck="false"></textarea><div class="small" id="jerr" style="color:var(--err);margin-top:6px;min-height:18px"></div>`;
      const ta = $('#ta', ev); ta.value = txt;
      ta.onkeydown = (e) => { if (e.key === 'Tab') { e.preventDefault(); const s = ta.selectionStart; ta.setRangeText('  ', s, ta.selectionEnd, 'end'); } };
      const valid = () => { if (!/\.json$/i.test(name)) return true; try { JSON.parse(ta.value); $('#jerr', ev).textContent = ''; return true; } catch (e) { $('#jerr', ev).textContent = 'خطأ JSON: ' + e.message; return false; } };
      ta.oninput = valid;
      $('#fmt', ev).onclick = () => { if (valid()) ta.value = JSON.stringify(JSON.parse(ta.value), null, 2); };
      $('#ap', ev).onclick = async () => { if (!valid() && !(await confirmBox('خطأ JSON', 'الملف فيه خطأ، تعتمده كذا؟', 'اعتمد'))) return; changes[name] = bytesToB64(new TextEncoder().encode(ta.value)); updCount(); toast('اعتمد — اضغط حفظ تحت عشان ينكتب في المود'); };
    } else {
      ev.innerHTML = `${head}</div><div class="empty" style="margin:auto"><div class="big">${icon('file', 30)}</div>ملف ثنائي (${esc(name.split('.').pop())}) — ما ينعدل هنا<div class="row" style="justify-content:center;margin-top:14px"><button class="btn sm" id="rp">${icon('upload', 15)} استبدال</button><button class="btn sm ghost" id="ex">${icon('download', 15)} استخراج</button></div></div>`;
      $('#rp', ev).onclick = async () => { const f = await api.fs.pickFiles('اختر ملف'); if (f) { changes[name] = await api.fs.readB64(f[0]); updCount(); toast('انستبدل'); } };
      $('#ex', ev).onclick = async () => { const r = await api.fs.saveB64(name.split('/').pop(), b64); if (r) toast('انحفظ'); };
    }
  }
  $('#esave', el).onclick = async () => {
    try { const r = await api.mods.write(mod.path, changes); Object.keys(changes).forEach((k) => delete changes[k]); updCount(); toast('انحفظ المود ✓ (فيه نسخة احتياطية)', 'ok', { label: 'النسخ الاحتياطية', fn: () => api.fs.reveal(r.backup) }); }
    catch (e) { toast('ما قدرت أحفظ — تأكد إن اللعبة مسكّرة', 'err'); }
  };
  drawTree();
}

// ---------- configs tab
async function tabConfigs(b) {
  const p = S.project;
  const gameDir = p.rpPath ? p.rpPath.replace(/[\\/]resourcepacks[\\/]?$/i, '') : '';
  const cfgDir = p.configPath || (gameDir ? gameDir + (gameDir.includes('\\') ? '\\' : '/') + 'config' : '');
  const files = cfgDir ? await api.cfg.list(cfgDir) : null;
  b.innerHTML = `<div class="row" style="margin-bottom:12px"><span class="muted small ltr" style="flex:1">${esc(cfgDir || '—')}</span><button class="btn sm" id="cpick">${icon('folder', 15)} غيّر المجلد</button></div>`;
  $('#cpick', b).onclick = async () => { const f = await api.fs.pickFolder('مجلد config'); if (f) { p.configPath = f; await saveProject(); tabConfigs(b); } };
  if (!files) { b.insertAdjacentHTML('beforeend', `<div class="empty"><div class="big">${icon('file', 30)}</div>ما لقيت مجلد config — هذا المجلد فيه إعدادات المودات (Fabric/Forge). اختر المجلد يدوي.</div>`); return; }
  const wrap = document.createElement('div'); wrap.className = 'split'; wrap.style.height = 'calc(100vh - 280px)';
  wrap.innerHTML = `<div class="card scroll" style="padding:10px"><input class="inp" id="cs" placeholder="بحث..." style="height:34px;margin-bottom:8px"><div class="tree" id="ct"></div></div>
    <div class="card" id="cv" style="display:flex;flex-direction:column"><div class="empty" style="margin:auto">${files.length ? 'اختر ملف إعدادات' : 'المجلد فاضي'}</div></div>`;
  b.append(wrap);
  let cur = null;
  const drawT = () => { const q = $('#cs', b).value.toLowerCase(); $('#ct', b).innerHTML = files.filter((f) => f.toLowerCase().includes(q)).map((f) => `<div class="it ${f === cur ? 'on' : ''}" data-f="${esc(f)}">${icon('file', 14)}${esc(f)}</div>`).join(''); };
  $('#cs', b).oninput = drawT; drawT();
  $('#ct', b).onclick = async (e) => {
    const it = e.target.closest('[data-f]'); if (!it) return; cur = it.dataset.f; drawT();
    const txt = await api.cfg.read(cfgDir, cur);
    const cv = $('#cv', b);
    cv.innerHTML = `<div class="row" style="margin-bottom:10px"><b class="ltr mono" style="flex:1">${esc(cur)}</b><button class="btn sm primary" id="csave">${icon('check', 15)} حفظ</button></div><textarea class="code" id="cta" spellcheck="false" style="flex:1"></textarea>`;
    $('#cta', cv).value = txt;
    $('#csave', cv).onclick = async () => { await api.cfg.write(cfgDir, cur, $('#cta', cv).value); toast('انحفظ (مع نسخة احتياطية)'); };
  };
}

// ---------- project settings tab
async function tabPSettings(b) {
  const p = S.project;
  b.innerHTML = `<div class="grid" style="grid-template-columns:1fr 1fr;align-items:start">
    <div class="card"><h3>معلومات الملف</h3>
      <div class="kv"><span class="muted">الاسم</span><b>${esc(p.name)}</b></div>
      <div class="kv"><span class="muted">الكلاينت</span><span>${esc(clientOf(p.clientId).name)}${p.instance ? ' · ' + esc(p.instance) : ''}</span></div>
      <div class="kv"><span class="muted">النسخة</span><span class="ltr">${esc(p.version)} (pack_format ${p.packFormat})</span></div>
      <div class="kv"><span class="muted">مكان حفظ الباك</span><span class="row" style="gap:6px;max-width:70%"><span class="ltr small" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(p.rpPath || '—')}</span><button class="btn sm" id="srp">${icon('folder', 14)} غيّر</button></span></div>
      <div class="kv"><span class="muted">المودات</span><span class="ltr small" style="max-width:60%;overflow:hidden;text-overflow:ellipsis">${esc(p.modsPath || '—')}</span></div>
      <div class="kv"><span class="muted">ملفات الفانيلا</span><span class="ltr small" style="max-width:60%;overflow:hidden;text-overflow:ellipsis">${esc(p.baseJar || '—')}</span></div>
      <div class="row" style="margin-top:14px"><button class="btn primary" id="sedit">${icon('edit', 16)} تعديل الإعدادات</button><button class="btn" id="sjar">${icon('cube', 16)} اختر jar</button><button class="btn ghost" id="sopen">${icon('folder', 16)} مجلد الريسورس باك</button></div></div>
    <div class="card"><h3>أيقونة الباك</h3><div class="row"><img class="pack-icon" id="sicon" style="width:96px;height:96px"><div class="stack" style="gap:8px">
      <button class="btn sm" id="iedit">${icon('pencil', 15)} ارسمها</button><button class="btn sm" id="iimp">${icon('image', 15)} استورد صورة</button><button class="btn sm ghost" id="igen">${icon('wand', 15)} ولّد وحدة جديدة</button></div></div>
      <h3 style="margin-top:22px">${icon('copy', 16)} نسخ احتياطية للباك</h3>
      <div class="row"><input class="inp" id="snn" placeholder="اسم النسخة (مثلاً: قبل ما أغيّر السيوف)" style="flex:1"><button class="btn primary" id="snc">${icon('plus', 15)} احفظ نسخة</button></div>
      <div id="snl" class="stack" style="gap:6px;margin-top:10px"></div>
      <h3 style="margin-top:22px">ثبّت في أكثر من كلاينت</h3><div id="multi" class="stack" style="gap:6px"></div>
      <button class="btn" id="minst" style="margin-top:8px">${icon('download', 16)} ثبّت في المختار</button>
      <h3 style="margin-top:22px">${icon('upload', 16)} شارك الباك</h3><p class="muted small" style="margin:0 0 8px">يطلع لك ملف <span class="ltr">.mcps</span> ترسله لخويك، يفتحه في التطبيق ويعدّل على نسخته.</p><button class="btn" id="sshare">${icon('upload', 16)} صدّر ملف للمشاركة</button>
      <h3 style="margin-top:22px">إجراءات</h3><div class="row"><button class="btn" id="sdup">${icon('copy', 16)} نسخ الملف</button><button class="btn danger" id="sdel">${icon('trash', 16)} حذف الملف</button></div></div></div>`;
  const setI = async () => { const x = await api.file.icon(p.id); if (x) { $('#sicon', b).src = 'data:image/png;base64,' + x; const h = $('#picon'); if (h) h.src = $('#sicon', b).src; } };
  setI();
  $('#sedit', b).onclick = () => openProjectForm(p);
  $('#sjar', b).onclick = async () => { const r = await api.fs.pickFiles('اختر ملف jar', ['jar']); if (r) { p.baseJar = r[0]; await saveProject(); render(); } };
  $('#sopen', b).onclick = () => api.fs.open(p.rpPath);
  $('#srp', b).onclick = () => openSaveWhere();
  $('#iedit', b).onclick = async () => { await editPackIcon(); };
  $('#iimp', b).onclick = async () => { const f = await api.fs.pickFiles('صورة', ['png', 'jpg', 'jpeg', 'webp']); if (!f) return; const im = await IMG.load('data:image/png;base64,' + await api.fs.readB64(f[0])); const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'); const s = Math.min(im.width, im.height); x.drawImage(im, (im.width - s) / 2, (im.height - s) / 2, s, s, 0, 0, 128, 128); await api.file.setIcon(p.id, c.toDataURL('image/png').split(',')[1]); setI(); };
  $('#igen', b).onclick = async () => { await api.file.setIcon(p.id, await makeIcon(p.name, clientOf(p.clientId).color)); setI(); };
  const drawSnaps = async () => {
    const list = await api.snap.list(p.id);
    $('#snl', b).innerHTML = list.length ? list.map((x) => `<div class="kv" style="padding:8px 0"><div><b class="small">${esc(x.name)}</b><div class="dim small">${new Date(x.at).toLocaleString('ar-SA-u-nu-latn')} · ${x.count || 0} ملف</div></div><div class="row" style="gap:6px"><button class="btn sm" data-sr="${x.id}">${icon('reset', 14)} رجّع</button><button class="btn sm ghost icon danger" data-sd="${x.id}">${icon('trash', 14)}</button></div></div>`).join('') : '<span class="muted small">ما فيه نسخ. احفظ نسخة قبل أي تغيير كبير.</span>';
    $$('[data-sr]', b).forEach((x) => x.onclick = async () => { if (!(await confirmBox('ترجيع نسخة', 'بيرجع الباك لهذي النسخة. بحفظ لك نسخة من الوضع الحالي قبل، عشان لو غيرت رأيك.', 'رجّع'))) return; await api.snap.create(p.id, 'تلقائي: قبل الترجيع'); const pj = await api.snap.restore(p.id, x.dataset.sr); if (pj) S.project = pj; toast('رجعت النسخة ✓'); render(); });
    $$('[data-sd]', b).forEach((x) => x.onclick = async () => { await api.snap.delete(p.id, x.dataset.sd); drawSnaps(); });
  };
  drawSnaps();
  $('#snc', b).onclick = async () => { await api.snap.create(p.id, $('#snn', b).value.trim() || 'نسخة احتياطية'); $('#snn', b).value = ''; toast('انحفظت نسخة احتياطية'); drawSnaps(); };
  const targets = [];
  for (const c of S.clients) { if (c.type === 'single' && c.detected && c.rpPath) targets.push([c.name, c.rpPath]); if (c.instances) c.instances.forEach((i) => targets.push([c.name + ' · ' + i.name, i.rp])); }
  const uniq = [...new Map(targets.map((t) => [t[1], t])).values()];
  $('#multi', b).innerHTML = uniq.map(([n, rp], i) => `<label class="check small"><input type="checkbox" data-rp="${esc(rp)}" ${rp === p.rpPath ? 'checked' : ''}><span>${esc(n)}</span><span class="dim ltr" style="margin-inline-start:auto;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(rp)}</span></label>`).join('') || '<span class="muted small">ما لقيت كلاينتات</span>';
  $('#minst', b).onclick = async () => {
    const sel = $$('#multi input:checked', b).map((x) => x.dataset.rp); if (!sel.length) return toast('اختر كلاينت', 'err');
    const ex = await buildExtras(); let n = 0;
    for (const rp of sel) { try { await api.pack.install(p, ex, false, rp); n++; } catch {} }
    toast(`تثبّت في ${n} كلاينت ✓`);
  };
  $('#sshare', b).onclick = async () => { const f = await api.proj.export(p.id); if (f) toast('انحفظ ملف المشاركة ✓', 'ok', { label: 'افتح', fn: () => api.fs.reveal(f) }); };
  $('#sdup', b).onclick = async () => { const np = await api.projects.duplicate(p.id); toast('انسخ الملف'); openProject(np.id, np); };
  $('#sdel', b).onclick = async () => { if (await confirmBox('حذف الملف', `تبي تحذف "${esc(p.name)}"؟ بيروح لسلة المحذوفات. (الباك المثبت في الكلاينت ما بينحذف)`, 'احذف', true)) { await api.projects.delete(p.id); S.project = null; go('home'); toast('انحذف'); } };
}

// ------------------------------------------------------------- clients view
function renderClients(main) {
  main.innerHTML = `<div class="view"><h1>الكلاينتات</h1><p class="sub">كل الكلاينتات المدعومة — الأخضر يعني لقيته على جهازك</p>
    <div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(320px,1fr))">${S.clients.filter((c) => c.id !== 'custom').map((c) => `<div class="card client-card"><div class="glow" style="background:${c.color}"></div>
      <div class="row" style="position:relative">${clientLogo(c, 50)}<div style="flex:1"><b style="font-size:16px">${esc(c.name)}</b><div style="margin-top:5px">${c.detected ? `<span class="badge ok">${icon('check', 12)} موجود</span>` : `<span class="badge">مو موجود</span>`}</div></div>
      <button class="btn sm primary" data-new="${c.id}">${icon('plus', 15)} باك</button></div>
      ${c.type === 'single' ? `<div class="small" style="position:relative"><div class="muted">الريسورس باك</div><div class="ltr dim" style="word-break:break-all">${esc(c.rpPath)}</div>${c.modsPath ? `<div class="muted" style="margin-top:6px">المودات</div><div class="ltr dim" style="word-break:break-all">${esc(c.modsPath)}</div>` : ''}</div>
      <div class="row"><button class="btn sm" data-open="${esc(c.rpPath)}">${icon('folder', 15)} افتح</button><button class="btn sm" data-cd="${c.id}">${icon('edit', 15)} ${c.detected ? 'غيّر المجلد' : 'اختر المجلد'}</button>${c.custom ? `<button class="btn sm ghost" data-cr="${c.id}">${icon('reset', 15)} الافتراضي</button>` : ''}</div>`
      : `<div class="small muted">${c.instances.length ? `${c.instances.length} إنستانس: ${c.instances.slice(0, 5).map((i) => esc(i.name)).join('، ')}` : 'ما فيه إنستانسات'}</div>`}
      ${c.note ? `<div class="small dim" style="line-height:1.6">${esc(c.note)}</div>` : ''}</div>`).join('')}</div></div>`;
  $$('[data-open]', main).forEach((x) => x.onclick = () => api.fs.open(x.dataset.open));
  $$('[data-cd]', main).forEach((x) => x.onclick = async () => { if (await pickClientDir(S.clients.find((c) => c.id === x.dataset.cd))) renderClients(main); });
  $$('[data-cr]', main).forEach((x) => x.onclick = async () => { await resetClientDir(S.clients.find((c) => c.id === x.dataset.cr)); renderClients(main); });
  $$('[data-new]', main).forEach((x) => x.onclick = () => { openProjectForm(); setTimeout(() => { const el = $(`.client[data-c="${x.dataset.new}"]`); if (el) el.click(); }, 30); });
}

// ------------------------------------------------------------- app settings
async function renamePack() {
  const p = S.project, old = p.name;
  const m = modal({ title: `${icon('edit', 18)} اسم الباك`, body: `<input class="inp" id="rn" value="${esc(old)}" maxlength="60" style="width:100%"><div class="muted small" style="margin-top:8px">الاسم اللي يطلع باللعبة بقائمة الريسورس باك. لو الباك مثبّت، أغيّر اسمه هناك بعد.</div>`,
    foot: `<button class="btn ghost" data-c>إلغاء</button><span class="spacer"></span><button class="btn primary" data-s>${icon('check', 16)} احفظ الاسم</button>` });
  const inp = $('#rn', m.el); inp.focus(); inp.select();
  const save = async () => {
    const name = inp.value.trim(); if (!name || name === old) return m.close(true);
    p.name = name; await saveProject(); const moved = await api.pack.renameInstalled(p.rpPath, old, name);
    m.close(true); toast(moved ? 'تغيّر الاسم ✓ (وتغيّر بالكلاينت بعد)' : 'تغيّر الاسم ✓'); render(); renderRail();
  };
  m.el.querySelector('[data-s]').onclick = save; m.el.querySelector('[data-c]').onclick = () => m.close(true);
  inp.onkeydown = (e) => { if (e.key === 'Enter') save(); };
}
// where the pack gets saved (installed) — any folder the user wants
function openSaveWhere() {
  const p = S.project, c = clientOf(p.clientId);
  const def = p.instance && c.instances ? (c.instances.find((i) => i.name === p.instance) || {}).rp : c.rpPath;
  const m = modal({ title: `${icon('folder', 18)} مكان حفظ الباك`, sub: 'لما تضغط "تثبيت" الباك ينحفظ هنا',
    body: `<div class="stack"><div class="where-box"><div class="muted small">المكان الحالي</div><div class="ltr" id="wcur" style="word-break:break-all;font-weight:600">${esc(p.rpPath || '—')}</div></div>
      <div class="muted small" style="line-height:1.7">تقدر تختار أي مجلد: مجلد resourcepacks حق أي كلاينت، أو سطح المكتب، أو فلاشة… إذا اخترت مجلد resourcepacks حق كلاينت، الباك يتفعّل باللعبة لحاله.</div></div>`,
    foot: `<button class="btn" data-open>${icon('folder', 15)} افتح المجلد</button>${def && def !== p.rpPath ? `<button class="btn ghost" data-def>${icon('reset', 15)} رجّع لمجلد ${esc(c.name)}</button>` : ''}<span class="spacer"></span><button class="btn primary" data-pick>${icon('edit', 15)} اختر مكان ثاني</button>` });
  const set = async (dir) => { p.rpPath = dir; await saveProject(); m.close(true); toast('صار الباك ينحفظ في: ' + dir); const w = $('#where'); if (w) w.title = dir; if (S.tab === 'psettings') renderTab(); };
  m.el.querySelector('[data-open]').onclick = () => p.rpPath && api.fs.open(p.rpPath);
  const d = m.el.querySelector('[data-def]'); if (d) d.onclick = () => set(def);
  m.el.querySelector('[data-pick]').onclick = async () => { const dir = await api.fs.pickFolder('اختر وين ينحفظ الباك'); if (dir) set(dir); };
}
async function setLang(l) {
  S.settings.lang = l; await api.settings.set(S.settings);
  if (l === 'en') { I18N.set('en'); render(); } else location.reload();
}
async function renderSettings(main) {
  const info = await api.app.info();
  main.innerHTML = `<div class="view" style="max-width:860px"><h1>الإعدادات</h1><p class="sub">شكل التطبيق ومعلوماته</p>
    <div class="card stack"><h3 style="margin:0">${icon('palette', 18)} الثيم</h3>
      <div class="theme-grid">${THEMES.map(([k, n, [a, b, c]]) => { const [x1, x2] = ACCENTS[S.settings.accent] || ACCENTS.violet; return `<div class="theme-card ${(S.settings.theme || 'midnight') === k ? 'on' : ''}" data-th="${k}"><div class="tp" style="background:${a}"><div class="s" style="background:${b}"></div><div class="m"><i style="background:linear-gradient(135deg,${x1},${x2})"></i><i style="background:${c}"></i></div></div><div class="tn">${n}${(S.settings.theme || 'midnight') === k ? icon('check', 16) : ''}</div></div>`; }).join('')}</div>
      <h3 style="margin:10px 0 0">${icon('star', 18)} اللون الأساسي</h3>
      <div class="accent-pick">${Object.entries(ACCENTS).map(([k, [a, b]]) => `<button data-acc="${k}" class="${S.settings.accent === k ? 'on' : ''}" style="background:linear-gradient(135deg,${a},${b})"></button>`).join('')}</div></div>
    <div class="card" style="margin-top:16px"><h3 style="margin:0 0 10px">${icon('edit', 18)} اللغة / Language</h3>
      <div class="lang-pick" data-noi18n><button data-lang="ar" class="${(S.settings.lang || 'ar') === 'ar' ? 'on' : ''}">العربية</button><button data-lang="en" class="${S.settings.lang === 'en' ? 'on' : ''}">English</button></div></div>
    <div class="card" style="margin-top:16px"><h3 style="margin:0 0 10px">${icon('wand', 18)} الحركة والشرح</h3>
      <div class="row"><label class="check"><span class="switch"><input type="checkbox" id="oanim" ${S.settings.anim !== false ? 'checked' : ''}><span></span></span>أنيميشن وحركات بالتطبيق</label>
      <button class="btn" id="otour">${icon('play', 16)} شغّل الشرح من جديد</button></div></div>
    <div class="card" style="margin-top:16px"><h3>معلومات</h3>
      <div class="kv"><span class="muted">الإصدار</span><span class="row"><span class="ltr">MC Pack Studio ${esc(info.version)}</span><button class="btn sm primary" id="oupd">${icon('reset', 14)} تحقق من التحديثات</button></span></div>
      <div class="kv"><span class="muted">تحقق تلقائي من التحديثات</span><label class="switch"><input type="checkbox" id="oauto" ${S.settings.autoUpdate !== false ? 'checked' : ''}><span></span></label></div>
      <div class="kv"><span class="muted">مجلد ماينكرافت</span><span class="ltr small">${esc(info.mcDir)}</span></div>
      <div class="kv"><span class="muted">مكان حفظ ملفاتك</span><span class="row"><span class="ltr small">${esc(info.dataDir)}</span><button class="btn sm ghost icon" id="odata">${icon('folder', 15)}</button><button class="btn sm" id="mdata">${icon('edit', 14)} غيّر</button>${info.dataDefault ? '' : `<button class="btn sm ghost" id="rdata">${icon('reset', 14)} الافتراضي</button>`}</span></div>
      <div class="kv"><span class="muted">ملفات اللعبة المحمّلة</span><span class="row"><button class="btn sm" id="owiz">${icon('download', 15)} معالج الإعداد</button><button class="btn sm ghost icon" id="ogame">${icon('folder', 15)}</button></span></div>
      <div class="kv"><span class="muted">النسخ الاحتياطية للمودات</span><button class="btn sm ghost" id="obak">${icon('folder', 15)} افتح</button></div></div>
    <p class="dim small" style="margin-top:18px;line-height:1.8">التطبيق ما فيه أي ملفات من ماينكرافت — يقرأ التكسترات الأصلية من نسخة اللعبة المثبتة عندك. مو تابع لـ Mojang أو Microsoft.</p></div>`;
  $$('[data-th]', main).forEach((x) => x.onclick = async () => { S.settings.theme = x.dataset.th; await api.settings.set(S.settings); applyAccent(); renderSettings(main); renderRail(); });
  $$('[data-acc]', main).forEach((x) => x.onclick = async () => { S.settings.accent = x.dataset.acc; await api.settings.set(S.settings); applyAccent(); renderSettings(main); renderRail(); });
  const moveData = async (dir) => {
    if (!(await confirmBox('نقل ملفاتك', `بنسخ كل باكاتك وإعداداتك للمكان الجديد، وبعدها التطبيق يقفل ويفتح لحاله.<br><span class="ltr small">${esc(dir || 'المكان الافتراضي')}</span><br>النسخة القديمة تبقى مكانها احتياط.`, 'انقل'))) return;
    try { const r = await api.app.moveData(dir); if (r && r.same) toast('هذا نفس المكان الحالي'); else toast('نقلت ملفاتك ✓ — التطبيق بيفتح من جديد'); } catch (e) { toast(String(e.message || e).replace(/^Error.*?: /, ''), 'err'); }
  };
  $('#mdata', main).onclick = async () => { const dir = await api.fs.pickFolder('اختر وين تنحفظ باكاتك'); if (dir) moveData(dir); };
  const rd = $('#rdata', main); if (rd) rd.onclick = () => moveData('');
  $('#odata', main).onclick = () => api.fs.open(info.dataDir);
  $('#obak', main).onclick = async () => api.fs.open(await api.mods.backups());
  $('#owiz', main).onclick = () => openWizard();
  $('#oupd', main).onclick = () => checkUpdates(true);
  $$('[data-lang]', main).forEach((x) => x.onclick = () => setLang(x.dataset.lang));
  $('#oanim', main).onchange = async (e) => { S.settings.anim = e.target.checked; document.documentElement.classList.toggle('no-anim', !e.target.checked); await api.settings.set(S.settings); };
  $('#otour', main).onclick = () => { go('home'); setTimeout(() => startTour('app'), 300); };
  $('#oauto', main).onchange = async (e) => { S.settings.autoUpdate = e.target.checked; await api.settings.set(S.settings); };
  $('#ogame', main).onclick = async () => api.fs.open(await api.game.dir());
}

// ---------- all files browser (every texture in the game)
const FOLDER_NAMES = { item: 'الآيتمز', items: 'الآيتمز', block: 'البلوكات', blocks: 'البلوكات', entity: 'الموبات والكيانات', gui: 'الواجهة', particle: 'الجزيئات', environment: 'السماء والطقس', misc: 'متفرقات', models: 'الدروع', mob_effect: 'أيقونات التأثيرات', painting: 'اللوحات', map: 'الخريطة', font: 'الخطوط', colormap: 'ألوان العشب', effect: 'تأثيرات', trims: 'زخارف الدروع', armor: 'الدروع', 'trim': 'زخارف' };
async function tabAll(b) {
  const p = S.project;
  const all = await api.assets.list(p);
  if (!all.length) { b.innerHTML = noBaseNotice() + `<div class="empty"><div class="big">${icon('layers', 30)}</div><h2>ما فيه ملفات</h2><p>حمّل ملفات اللعبة (فوق) أو استورد باك جاهز، وبيطلع لك هنا كل تكستر باللعبة.</p></div>`; bindBaseActions(b); return; }
  const groups = {};
  for (const a of all) { const f = a.path.split('/')[1] || 'other'; (groups[f] = groups[f] || []).push(a); }
  const folders = Object.keys(groups).sort((x, y) => groups[y].length - groups[x].length);
  S.allFolder = S.allFolder && groups[S.allFolder] ? S.allFolder : (groups.item ? 'item' : groups.items ? 'items' : folders[0]);
  b.innerHTML = `<div class="browser"><div class="folders">
      <div class="folder ${S.allFolder === '*' ? 'on' : ''}" data-f="*">${icon('layers', 16)}<span>الكل</span><span class="n">${all.length}</span></div>
      <div class="folder ${S.allFolder === '#' ? 'on' : ''}" data-f="#">${icon('star', 16)}<span>المعدّل</span><span class="n">${all.filter((a) => a.source === 'custom').length}</span></div>
      ${folders.map((f) => `<div class="folder ${S.allFolder === f ? 'on' : ''}" data-f="${esc(f)}">${icon('folder', 16)}<span>${FOLDER_NAMES[f] || esc(f)}</span><span class="n">${groups[f].length}</span></div>`).join('')}</div>
    <div><div class="row" style="margin-bottom:14px"><div class="search" style="flex:1"><input class="inp" id="as" placeholder="ابحث بالإنجليزي: totem, sword, zombie, diamond, heart..." value="${esc(S.allQ || '')}">${icon('search', 18)}</div><span class="muted small" id="acount"></span></div>
      <div class="tex-grid" id="ag" style="grid-template-columns:repeat(auto-fill,minmax(128px,1fr))"></div><div id="amore"></div></div></div>`;
  $$('.folder', b).forEach((x) => x.onclick = () => { S.allFolder = x.dataset.f; $$('.folder', b).forEach((y) => y.classList.toggle('on', y === x)); draw(); });
  const io = new IntersectionObserver((ents) => ents.forEach((e) => { if (!e.isIntersecting) return; io.unobserve(e.target); loadThumb(e.target); }), { root: b, rootMargin: '300px' });
  async function loadThumb(el) {
    const r = await api.tex.get(p, el.dataset.path); const pv = $('.pv', el);
    if (!r) { pv.innerHTML = '<span class="none">؟</span>'; return; }
    const im = await IMG.fromB64(r.data);
    const fh = im.height > im.width && im.height % im.width === 0 ? im.width : im.height;
    const c = document.createElement('canvas'); c.width = im.width; c.height = fh; c.getContext('2d').putImageData(im, 0, 0);
    pv.innerHTML = ''; pv.append(c); el.dataset.w = im.width; el.dataset.h = im.height;
  }
  let shown = 0, list = [];
  function draw() {
    const q = $('#as', b).value.toLowerCase().trim(); S.allQ = q;
    list = (S.allFolder === '*' ? all : S.allFolder === '#' ? all.filter((a) => a.source === 'custom') : groups[S.allFolder] || []);
    if (q) list = (S.allFolder === '*' ? all : list).filter((a) => a.path.toLowerCase().includes(q));
    $('#acount', b).textContent = list.length + ' ملف';
    $('#ag', b).innerHTML = ''; shown = 0; more();
  }
  function more() {
    const g = $('#ag', b);
    for (const a of list.slice(shown, shown + 120)) {
      const el = document.createElement('div'); el.className = 'tex'; el.dataset.path = a.path;
      const name = a.path.split('/').pop().replace('.png', '');
      el.innerHTML = `<div class="pv"><span class="none">…</span>${a.source === 'custom' ? `<span class="badge acc mark">معدّل</span>` : ''}</div><div class="nm ltr" title="${esc(a.path)}">${esc(name)}</div>`;
      el.onclick = () => editTexture({ name, path: a.path, size: [+el.dataset.w || 16, +el.dataset.h || 16] }, () => { a.source = 'custom'; loadThumb(el); if (!$('.mark', el)) $('.pv', el).insertAdjacentHTML('beforeend', '<span class="badge acc mark">معدّل</span>'); });
      g.append(el); io.observe(el);
    }
    shown += 120;
    $('#amore', b).innerHTML = shown < list.length ? `<div style="text-align:center;margin-top:18px"><button class="btn" id="am">شوف أكثر (${list.length - shown})</button></div>` : '';
    if ($('#am', b)) $('#am', b).onclick = more;
  }
  let t; $('#as', b).oninput = () => { clearTimeout(t); t = setTimeout(draw, 200); };
  draw();
}

// ---------- skins studio
const SK = { skin: null, name: 'سكني', slim: false, id: null, view: 'both' };
async function renderSkins(main) {
  const lib = await api.skins.list();
  main.innerHTML = `<div class="view"><div class="row" style="margin-bottom:20px"><div style="flex:1"><h1>محرر <span class="grad-text">السكنات</span></h1><p class="sub" style="margin:0">ارسم سكنك، شوفه من قدام وورا، احفظه أو حطه في الباك</p></div></div>
    <div class="two" style="grid-template-columns:1fr 380px">
      <div class="skin-stage" id="stage"><div class="dolls" id="dolls"></div>
        <div style="position:absolute;top:16px;right:16px;z-index:2" class="row"><span class="seg" id="sv"><button data-v="both">قدام وورا</button><button data-v="front">قدام</button><button data-v="back">ورا</button></span></div>
        <div style="position:absolute;top:16px;left:16px;z-index:2"><label class="check badge dark" style="height:34px;padding:0 12px"><span class="switch" style="transform:scale(.8)"><input type="checkbox" id="slim" ${SK.slim ? 'checked' : ''}><span></span></span>نحيف (Alex)</label></div>
      </div>
      <div class="stack">
        <div class="card stack">
          <label class="f">اسم السكن<input class="inp" id="sname" value="${esc(SK.name)}"></label>
          <button class="btn primary lg" id="sedit">${icon('pencil', 18)} ارسم / عدّل السكن</button>
          <button class="btn" id="s3d">${icon('cube', 16)} معاينة 3D</button>
          <div class="grid" style="grid-template-columns:1fr 1fr;gap:8px">
            <button class="btn" id="simp">${icon('upload', 16)} استورد PNG</button>
            <button class="btn" id="sexp">${icon('download', 16)} حفظ PNG</button>
            <button class="btn" id="ssave">${icon('star', 16)} حفظ بالمكتبة</button>
            <button class="btn" id="snew">${icon('plus', 16)} سكن جديد</button>
          </div>
          <button class="btn" id="spack">${icon('layers', 16)} حطه بالباك كسكن افتراضي (Steve/Alex)</button>
          <span class="muted small" style="line-height:1.7">"حفظ PNG" عشان ترفعه على minecraft.net أو بالكلاينت. "حطه بالباك" يغيّر شكل ستيف/أليكس الافتراضي في الباك.</span>
        </div>
      </div></div>
    <div class="sec-h"><h2>مكتبة السكنات</h2><div class="line"></div><span class="badge">${lib.length}</span></div>
    <div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(150px,1fr))" id="slib">${lib.length ? '' : '<div class="muted">لسا ما حفظت سكنات</div>'}</div></div>`;
  if (!SK.skin) SK.skin = (await realSteve()) || defaultSkin();
  const draw = () => {
    const d = $('#dolls'); d.innerHTML = '';
    const cv = IMG.toCanvas(SK.skin);
    const views = SK.view === 'both' ? [false, true] : [SK.view === 'back'];
    for (const back of views) d.append(drawDoll(document.createElement('canvas'), cv, { scale: SK.view === 'both' ? 11 : 13, back, slim: SK.slim }));
    $$('#sv button').forEach((x) => x.classList.toggle('on', x.dataset.v === SK.view));
  };
  draw();
  $$('#sv button').forEach((x) => x.onclick = () => { SK.view = x.dataset.v; draw(); });
  $('#slim').onchange = (e) => { SK.slim = e.target.checked; draw(); };
  $('#sname').oninput = (e) => SK.name = e.target.value;
  $('#sedit').onclick = () => openSkinPainter({ title: 'محرر السكن: ' + esc(SK.name), image: SK.skin, slim: SK.slim, onSave: (img, slim) => { SK.skin = img; SK.slim = slim; renderSkins(main); toast('تحدّث السكن'); } });
  $('#s3d').onclick = () => open3D(SK.skin, { skin: true, slim: SK.slim, title: SK.name });
  $('#simp').onclick = async () => {
    const f = await api.fs.pickFiles('اختر سكن PNG', ['png']); if (!f) return;
    const im = await IMG.fromB64(await api.fs.readB64(f[0]));
    if (im.width !== im.height && im.width !== im.height * 2) return toast('هذا مو سكن ماينكرافت (لازم 64×64 أو 64×32)', 'err');
    SK.skin = im.width === im.height * 2 ? upgradeLegacySkin(im) : im; SK.id = null; SK.name = f[0].split(/[\\/]/).pop().replace(/\.png$/i, ''); renderSkins(main);
  };
  $('#sexp').onclick = async () => { const r = await api.fs.saveB64((SK.name || 'skin') + '.png', IMG.toB64(SK.skin)); if (r) toast('انحفظ السكن', 'ok', { label: 'افتح', fn: () => api.fs.reveal(r) }); };
  $('#ssave').onclick = async () => { SK.id = await api.skins.save({ id: SK.id, name: SK.name, slim: SK.slim, data: IMG.toB64(SK.skin) }); toast('انحفظ بالمكتبة'); renderSkins(main); };
  $('#snew').onclick = async () => { SK.skin = (await realSteve(SK.slim)) || defaultSkin(); SK.id = null; SK.name = 'سكن جديد'; renderSkins(main); };
  $('#spack').onclick = () => skinToPack();
  const libEl = $('#slib');
  for (const s of lib) {
    const el = document.createElement('div'); el.className = 'skin-card' + (s.id === SK.id ? ' on' : '');
    el.innerHTML = `<div class="pv"></div><b class="small">${esc(s.name)}</b><div class="row" style="gap:4px"><button class="btn sm ghost icon danger" title="حذف">${icon('trash', 15)}</button></div>`;
    IMG.fromB64(s.data).then((im) => $('.pv', el).append(drawDoll(document.createElement('canvas'), IMG.toCanvas(im), { scale: 4, slim: s.slim })));
    el.onclick = async (e) => {
      if (e.target.closest('.danger')) { if (await confirmBox('حذف السكن', `تحذف "${esc(s.name)}"؟`, 'احذف', true)) { await api.skins.delete(s.id); renderSkins(main); } return; }
      SK.skin = await IMG.fromB64(s.data); SK.id = s.id; SK.name = s.name; SK.slim = s.slim; renderSkins(main);
    };
    libEl.append(el);
  }
}
async function realSteve(slim) {
  const files = (await api.game.found()).sort((a, b) => (b.downloaded ? 1 : 0) - (a.downloaded ? 1 : 0));
  for (const f of files) {
    const fake = { id: '_none', baseJar: f.path };
    for (const rel of slim ? ['textures/entity/player/slim/alex.png', 'textures/entity/alex.png'] : ['textures/entity/player/wide/steve.png', 'textures/entity/steve.png']) {
      const r = await api.tex.get(fake, rel, true); if (r) { const im = await IMG.fromB64(r.data); return im.width === im.height * 2 ? upgradeLegacySkin(im) : im; }
    }
  }
  return null;
}
function defaultSkin() {
  // simple original starter skin (not Mojang's)
  const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d');
  const r = (col, X, Y, W, H) => { x.fillStyle = col; x.fillRect(X, Y, W, H); };
  r('#c8956a', 0, 0, 32, 16); r('#3b2a1e', 0, 0, 32, 10); r('#3b2a1e', 8, 8, 8, 2); // head + hair
  r('#ffffff', 9, 12, 2, 1); r('#ffffff', 13, 12, 2, 1); r('#2d4bd8', 10, 12, 1, 1); r('#2d4bd8', 13, 12, 1, 1); r('#8a5a3c', 11, 14, 2, 1);
  const [a1, a2] = ACCENTS[S.settings.accent] || ACCENTS.violet;
  r(a1, 16, 16, 24, 16); r(a2, 20, 20, 8, 3); // body
  r(a1, 40, 16, 16, 16); r('#c8956a', 44, 28, 4, 4); r(a1, 32, 48, 16, 16); r('#c8956a', 36, 60, 4, 4); // arms
  r('#22283a', 0, 16, 16, 16); r('#22283a', 16, 48, 16, 16); r('#111', 4, 29, 4, 3); r('#111', 20, 61, 4, 3); // legs
  return x.getImageData(0, 0, 64, 64);
}
function upgradeLegacySkin(im) {
  const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d');
  x.drawImage(IMG.toCanvas(im), 0, 0);
  const mir = (sx, sy, w, h, dx, dy) => { x.save(); x.translate(dx + w, dy); x.scale(-1, 1); x.drawImage(IMG.toCanvas(im), sx, sy, w, h, 0, 0, w, h); x.restore(); };
  mir(4, 20, 4, 12, 20, 52); mir(0, 20, 4, 12, 24, 52); mir(8, 20, 4, 12, 16, 52); mir(12, 20, 4, 12, 28, 52); mir(4, 16, 4, 4, 20, 48); mir(8, 16, 4, 4, 24, 48);
  mir(44, 20, 4, 12, 36, 52); mir(40, 20, 4, 12, 40, 52); mir(48, 20, 4, 12, 32, 52); mir(52, 20, 4, 12, 44, 52); mir(44, 16, 4, 4, 36, 48); mir(48, 16, 4, 4, 40, 48);
  return x.getImageData(0, 0, 64, 64);
}
async function skinToPack() {
  const projects = await api.projects.list();
  if (!projects.length) return toast('سوّ باك أول', 'err');
  const m = modal({ title: 'حط السكن بالباك', body: `<div class="stack">
    <label class="f">الباك<select class="inp" id="kp">${projects.map((p) => `<option value="${p.id}" ${S.project && S.project.id === p.id ? 'selected' : ''}>${esc(p.name)} (${esc(p.version)})</option>`).join('')}</select></label>
    <label class="f">بدل أي سكن افتراضي<select class="inp" id="kw"><option value="steve">Steve (عريض)</option><option value="alex">Alex (نحيف)</option></select></label>
    <span class="muted small">يتغيّر شكل اللاعبين اللي سكنهم الافتراضي (وأنت لو ما عندك سكن).</span></div>`,
    foot: `<button class="btn primary" id="kgo">${icon('check', 16)} حطه</button>` });
  $('#kw', m.el).value = SK.slim ? 'alex' : 'steve';
  $('#kgo', m.el).onclick = async () => {
    const p = projects.find((x) => x.id === $('#kp', m.el).value);
    const t = TEXTURES.find((x) => x.id === $('#kw', m.el).value);
    await api.tex.put(p.id, texPath(t, p.packFormat), IMG.toB64(SK.skin));
    m.close(true); toast(`انحط السكن في "${esc(p.name)}"`);
  };
}

// ---------- standalone mods page
async function renderModsView(main) {
  const folders = await api.mods.folders();
  const projects = await api.projects.list();
  for (const p of projects) if (p.modsPath && !folders.find((f) => f.mods === p.modsPath)) folders.push({ label: 'باك: ' + p.name, mods: p.modsPath, exists: true });
  const custom = (S.settings.modFolders || []).map((m) => ({ label: m.split(/[\\/]/).slice(-2).join('/'), mods: m, exists: true }));
  const all = [...folders.filter((f) => f.exists), ...custom];
  if (!S.modsFolder || !all.find((f) => f.mods === S.modsFolder)) S.modsFolder = (S.project && S.project.modsPath) || (all[0] && all[0].mods);
  main.innerHTML = `<div class="view"><h1>مدير <span class="grad-text">المودات</span></h1><p class="sub">فعّل، عطّل، احذف، وعدّل الصور والإعدادات داخل أي مود</p><div id="mp"></div></div>`;
  const b = $('#mp');
  if (!S.modsFolder) {
    b.innerHTML = `<div class="empty"><div class="big">${icon('puzzle', 32)}</div><h2>ما لقيت مجلد مودات</h2><p>اختر مجلد mods حق الكلاينت أو اللانشر (Fabric / Forge).</p><button class="btn primary" id="pk">${icon('folder', 16)} اختر مجلد</button></div>`;
    $('#pk', b).onclick = addFolder; return;
  }
  const picker = `<select class="inp" id="mf" style="width:280px">${all.map((f) => `<option value="${esc(f.mods)}" ${f.mods === S.modsFolder ? 'selected' : ''}>${esc(f.label)}</option>`).join('')}<option value="+">+ مجلد ثاني...</option></select>`;
  modsPanel(b, { path: S.modsFolder, picker, setPath: async (f) => { S.modsFolder = f; } });
  setTimeout(() => { const sel = $('#mf'); if (sel) sel.onchange = () => { if (sel.value === '+') return addFolder(); S.modsFolder = sel.value; renderModsView(main); }; }, 50);
  async function addFolder() {
    const f = await api.fs.pickFolder('مجلد المودات'); if (!f) { renderModsView(main); return; }
    S.settings.modFolders = [...new Set([...(S.settings.modFolders || []), f])]; await api.settings.set(S.settings);
    S.modsFolder = f; renderModsView(main);
  }
}


async function pickClientDir(c) {
  const f = await api.fs.pickFolder(`اختر مجلد اللعبة حق ${c.name} (مثل .minecraft)`);
  if (!f) return false;
  S.settings.clientDirs = { ...(S.settings.clientDirs || {}), [c.id]: f.replace(/[\\/]resourcepacks[\\/]?$/i, '') };
  await api.settings.set(S.settings);
  S.clients = await api.clients.list();
  Object.assign(c, S.clients.find((x) => x.id === c.id));
  toast(`انحفظ مجلد ${esc(c.name)}`);
  return true;
}
async function resetClientDir(c) {
  const d = { ...(S.settings.clientDirs || {}) }; delete d[c.id]; S.settings.clientDirs = d;
  await api.settings.set(S.settings); S.clients = await api.clients.list();
}

// ------------------------------------------------------------- first-run setup wizard
async function openWizard() {
  let step = 0;
  const pick = new Set();
  const w = document.createElement('div'); w.className = 'wiz';
  w.innerHTML = `<div class="wiz-box"><div class="wiz-top" style="background-image:url(${bannerArt(3, 300, 70)})"></div><div class="wiz-steps"><i></i><i></i><i></i><i></i><i></i></div><div class="wiz-body"></div><div class="wiz-foot"></div></div>`;
  document.body.append(w);
  const body = $('.wiz-body', w), foot = $('.wiz-foot', w);
  const finish = async () => { S.settings.setupDone = true; S.settings.setupVersion = 2; await api.settings.set(S.settings); w.remove(); go('home'); if (!(S.settings.tours || {}).app) setTimeout(() => startTour('app'), 500); };
  async function draw() {
    $$('.wiz-steps i', w).forEach((x, i) => x.classList.toggle('on', i <= step));
    if (step === 0) {
      body.innerHTML = `<h1 style="text-align:center">هلا والله في <span class="grad-text">MC Pack Studio</span> 👋</h1>
        <p class="sub" style="text-align:center;line-height:1.9;max-width:560px;margin:10px auto 24px">خلنا نجهّز كل شي بدقيقة: بنطلّع تكسترات ماينكرافت الأصلية من ملفات الكلاينت حقك، ونتأكد من الكلاينتات اللي عندك.</p>
        <div class="grid" style="grid-template-columns:repeat(3,1fr)">${[['download', 'ملفات اللعبة', 'تكسترات ماينكرافت الأصلية'], ['monitor', 'الكلاينتات', 'Lunar, Badlion, Feather...'], ['wand', 'جاهز تصمم', 'سيوف، نار، توتم، سكنات']].map(([ic, t, d]) => `<div class="tweak" style="flex-direction:column;text-align:center"><div class="ti">${icon(ic, 22)}</div><div class="tx"><b>${t}</b><span>${d}</span></div></div>`).join('')}</div>`;
      foot.innerHTML = `<button class="btn primary lg" data-n>يلا نبدأ ${icon('play', 16)}</button><span class="spacer"></span><div class="lang-pick" data-noi18n><button data-lang="ar" class="${(S.settings.lang || 'ar') === 'ar' ? 'on' : ''}">العربية</button><button data-lang="en" class="${S.settings.lang === 'en' ? 'on' : ''}">English</button></div><button class="btn ghost" data-skip>تخطّي</button>`;
      $$('[data-lang]', foot).forEach((x) => x.onclick = async () => { S.settings.lang = x.dataset.lang; await api.settings.set(S.settings); if (x.dataset.lang === 'en') { I18N.set('en'); draw(); } else location.reload(); });
    } else if (step === 1) {
      body.innerHTML = `<h2>${icon('folder', 20)} وين ملفات الكلاينت حقك؟</h2><p class="sub" style="margin-bottom:14px">بطلّع تكسترات ماينكرافت الأصلية من ملفات الكلاينت نفسه (Lunar، Badlion، Feather، .minecraft...).</p>
        <div id="gf"><div class="row"><div class="dl-ring" style="width:26px;height:26px"><div class="dl-cube" style="width:20px;height:20px"></div></div><span class="muted">أدوّر بجهازك...</span></div></div>`;
      foot.innerHTML = `<button class="btn primary lg" data-n>كمّل ${icon('play', 16)}</button><button class="btn lg" data-pick>${icon('folder', 18)} اختر مجلد الكلاينت</button><button class="btn ghost" data-b>رجوع</button>`;
      const show = (found) => {
        const vs = [...new Map(found.filter((f) => f.version !== 'unknown').map((f) => [f.version, f])).values()].sort((a, b) => b.version.localeCompare(a.version, undefined, { numeric: true }));
        $('#gf', body).innerHTML = vs.length ? `<div class="grid" style="grid-template-columns:repeat(2,1fr);gap:8px;max-height:250px;overflow:auto">${vs.map((f) => `<div class="vrow" style="margin:0">${icon('check', 18)}<b class="ltr">${esc(f.version)}</b><span class="dim small ltr" style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${esc(f.path)}">${esc(f.path.split(/[\\/]/).slice(-3).join('/'))}</span></div>`).join('')}</div><p class="muted small" style="margin-top:12px">${icon('check', 14)} لقيت تكسترات ماينكرافت الأصلية لهذي النسخ. لو كلاينتك مو موجود فوق، اختر مجلده.</p>`
          : `<div class="notice" style="margin:0">${icon('folder', 20)}<div><b>ما لقيت ملفات اللعبة تلقائياً</b><span class="muted small">اضغط "اختر مجلد الكلاينت" واختر مجلد الكلاينت (مثل C:\\Users\\اسمك\\.lunarclient)، أو كمّل وبنحمّلها من Mojang.</span></div></div>`;
      };
      api.game.scan().then((r) => show(r.found));
      $('[data-pick]', foot).onclick = async () => { const r = await pickClientFiles(); if (r) show(r.found); };
    } else if (step === 2) {
      const have = new Set((await api.game.found()).map((f) => f.version));
      const st = await api.game.status(VERSIONS.map((v) => v.id));
      body.innerHTML = `<h2>${icon('download', 20)} تبي تحمّل نسخ ثانية؟</h2><p class="sub" style="margin-bottom:14px">النسخ اللي ما لقيتها بملفاتك تقدر تحمّلها من Mojang الرسمي (كل نسخة 10-30 ميقا). اختياري.</p>
        <div style="max-height:270px;overflow:auto">${VERSIONS.map((v) => { const d = st.find((x) => x.version === v.id).downloaded || have.has(v.id); return `<label class="vrow" data-v="${v.id}"><span class="switch"><input type="checkbox" ${d ? 'checked disabled' : ''}><span></span></span><b class="ltr" style="width:130px">${v.label}</b>
          ${d ? `<span class="badge ok">${icon('check', 12)} موجودة</span>` : `<div class="bar" style="display:none"><i></i></div><span class="muted small st"></span>`}</label>`; }).join('')}</div>`;
      pick.clear();
      $$('.vrow input', body).forEach((x) => x.onchange = () => { const v = x.closest('.vrow').dataset.v; x.checked ? pick.add(v) : pick.delete(v); });
      foot.innerHTML = `<button class="btn primary lg" data-dl>${icon('download', 18)} حمّل المختار وكمّل</button><button class="btn ghost" data-b>رجوع</button><span class="spacer"></span><button class="btn ghost" data-n>تخطّي</button>`;
      $('[data-dl]', foot).onclick = async () => {
        $$('button', foot).forEach((x) => x.disabled = true);
        let fails = 0;
        for (const v of [...pick]) {
          const row = $(`.vrow[data-v="${v}"]`, body); if (!row || !$('.bar', row)) continue;
          $('.bar', row).style.display = ''; $('.st', row).textContent = 'لحظة...';
          api.onGameProgress((d) => { if (d.version === v && d.total) { $('.bar i', row).style.width = Math.round(d.got / d.total * 100) + '%'; $('.st', row).textContent = Math.round(d.got / d.total * 100) + '%'; } });
          try { await api.game.download(v); $('.bar i', row).style.width = '100%'; $('.st', row).innerHTML = `<span class="badge ok">${icon('check', 12)} تم</span>`; }
          catch (e) { fails++; $('.st', row).innerHTML = `<span style="color:var(--err)">ما زبط</span>`; }
        }
        $$('button', foot).forEach((x) => x.disabled = false);
        if (fails) toast(`ما قدرت أحمّل ${fails} نسخة — تأكد من النت`, 'err');
        setTimeout(() => { step = 3; draw(); }, fails ? 1200 : 300);
      };
    } else if (step === 3) {
      S.clients = await api.clients.list();
      body.innerHTML = `<h2>${icon('monitor', 20)} الكلاينتات اللي عندك</h2><p class="sub" style="margin-bottom:14px">الأخضر لقيته. لو كلاينت مثبّت بمكان ثاني اختر مجلده.</p>
        <div class="grid" style="grid-template-columns:repeat(2,1fr);gap:8px;max-height:290px;overflow:auto">${S.clients.filter((c) => c.id !== 'custom').map((c) => `<div class="vrow" style="margin:0">${clientLogo(c, 32)}<b style="flex:1">${esc(c.name)}</b>
          ${c.detected ? `<span class="badge ok">${icon('check', 12)} موجود</span>` : c.type === 'single' ? `<button class="btn sm" data-cd="${c.id}">${icon('folder', 14)} اختر المجلد</button>` : '<span class="badge">مو موجود</span>'}</div>`).join('')}</div>`;
      $$('[data-cd]', body).forEach((x) => x.onclick = async () => { if (await pickClientDir(S.clients.find((c) => c.id === x.dataset.cd))) draw(); });
      foot.innerHTML = `<button class="btn primary lg" data-n>كمّل ${icon('play', 16)}</button><button class="btn ghost" data-b>رجوع</button>`;
    } else {
      body.innerHTML = `<div class="empty" style="padding:30px 0"><div class="big">${icon('check', 34)}</div><h1>كل شي جاهز!</h1><p class="sub">يلا سوّ أول باك لك.</p></div>`;
      foot.innerHTML = `<button class="btn primary lg" data-new>${icon('plus', 18)} سوّ أول باك</button><span class="spacer"></span><button class="btn ghost" data-done>روح للرئيسية</button>`;
      $('[data-new]', foot).onclick = async () => { await finish(); openProjectForm(); };
      $('[data-done]', foot).onclick = finish;
    }
    const n = $('[data-n]', foot), b = $('[data-b]', foot), sk = $('[data-skip]', foot);
    if (n) n.onclick = () => { step++; draw(); };
    if (b) b.onclick = () => { step--; draw(); };
    if (sk) sk.onclick = finish;
  }
  draw();
}

// download the original game textures automatically in the background (no clicks needed)
async function autoFetchGame() {
  const projects = await api.projects.list();
  const want = [...new Set([VERSIONS[0].id, ...projects.map((p) => p.version).filter((v) => VERSIONS.some((x) => x.id === v))])];
  const found = new Set((await api.game.found()).filter((f) => f.downloaded).map((f) => f.version));
  const missing = want.filter((v) => !found.has(v));
  if (!missing.length) return;
  const t = document.createElement('div'); t.className = 'toast'; t.style.minWidth = '320px';
  t.innerHTML = `<div class="dl-ring" style="width:24px;height:24px;flex:none"><div class="dl-cube" style="width:18px;height:18px"></div></div><div style="flex:1"><b class="small">أجهّز تكسترات ماينكرافت الأصلية...</b><div class="bar" style="margin-top:6px;height:6px"><i></i></div><span class="dim small ltr lbl"></span></div>`;
  $('#toasts').append(t);
  let ok = 0;
  for (const v of missing) {
    $('.lbl', t).textContent = v;
    api.onGameProgress((d) => { if (d.version === v && d.total) $('.bar i', t).style.width = Math.round(d.got / d.total * 100) + '%'; });
    try { await api.game.download(v); ok++; } catch {}
  }
  t.remove();
  if (ok) {
    toast(`جاهزة: تكسترات ماينكرافت الأصلية (${ok}) ✓`);
    if (S.project) { const had = S.project.baseJar; S.project.baseJar = null; S.project.baseApprox = null; await autoBase(S.project, false); if (S.project.baseJar !== had) render(); }
  }
}

// ------------------------------------------------------------- updates
async function checkUpdates(manual) {
  let r;
  try { r = await api.update.check(); } catch (e) { if (manual) toast('ما قدرت أتحقق من التحديثات — تأكد من النت', 'err'); return; }
  if (!r.available) { if (manual) toast(r.none ? 'ما فيه إصدارات منشورة للحين' : `عندك آخر نسخة (${esc(r.current)}) ✓`); return; }
  if (!manual && S.settings.skipVersion === r.version) return;
  const notes = esc(r.notes || '').replace(/\r?\n/g, '<br>').slice(0, 3000);
  const m = modal({ title: `${icon('download', 18)} فيه تحديث جديد: ${esc(r.version)}`, sub: `نسختك الحالية ${esc(r.current)}`,
    body: `<div class="stack">${notes ? `<div class="card" style="max-height:260px;overflow:auto;line-height:1.8">${notes}</div>` : '<p class="muted">تحسينات وإصلاحات.</p>'}
      <div id="upb" style="display:none"><div class="bar"><i id="upi"></i></div><span class="muted small ltr" id="ups"></span></div></div>`,
    foot: `<button class="btn primary" id="upgo">${icon('download', 16)} حدّث الحين</button><button class="btn ghost" id="uplater">بعدين</button><span class="spacer"></span><button class="btn ghost small" id="upskip">تجاهل هذي النسخة</button>` });
  $('#uplater', m.el).onclick = () => m.close(true);
  $('#upskip', m.el).onclick = async () => { S.settings.skipVersion = r.version; await api.settings.set(S.settings); m.close(true); };
  $('#upgo', m.el).onclick = async () => {
    $$('.modal-f button', m.el).forEach((x) => x.disabled = true); $('#upb', m.el).style.display = '';
    api.onUpdateProgress((d) => { if (d.total) { $('#upi', m.el).style.width = Math.round(d.got / d.total * 100) + '%'; $('#ups', m.el).textContent = `${(d.got / 1048576).toFixed(1)} / ${(d.total / 1048576).toFixed(1)} MB`; } });
    try { await api.update.install(r.url, r.version); $('#ups', m.el).textContent = 'يتثبّت التحديث... التطبيق بيقفل ويرجع يفتح لحاله'; }
    catch (e) { toast('ما قدرت أحمّل التحديث', 'err'); $$('.modal-f button', m.el).forEach((x) => x.disabled = false); }
  };
}
// ------------------------------------------------------------- versions (1.21.11+, live)
async function loadVersions() {
  let list = [];
  try { list = await api.versions.list(); } catch {}
  if (!list.length) list = [{ id: '1.21.11' }];
  const saved = S.settings.knownPf || {};
  window.VERSIONS = list.map((v, i) => ({ id: v.id, pf: saved[v.id] || KNOWN_PF[v.id] || 999, label: v.id + (i === 0 ? ' (الأحدث)' : '') }));
}
// after the game files are available, store the exact pack format for the version
async function syncPackFormat(p) {
  if (!p || !p.baseJar || p.baseApprox) return;
  const pf = await api.jar.packFormat(p.baseJar); if (!pf) return;
  const [maj, min] = pf;
  S.settings.knownPf = Object.assign({}, S.settings.knownPf, { [p.version]: maj }); api.settings.set(S.settings);
  const v = VERSIONS.find((x) => x.id === p.version); if (v) v.pf = maj;
  if (p.packFormat !== maj || (p.packFormatMinor || 0) !== min) { p.packFormat = maj; p.packFormatMinor = min; if (S.project && S.project.id === p.id) { await saveProject(); const bd = $('.ws-banner .badge.ltr'); if (bd) bd.textContent = `${p.version} · pack_format ${maj}`; } else await api.projects.save(p); }
}

// ------------------------------------------------------------- boot
(async function boot() {
  S.settings = await api.settings.get(); applyAccent();
  if (S.settings.lang === 'en') I18N.set('en');
  document.documentElement.classList.toggle('no-anim', S.settings.anim === false);
  S.clients = await api.clients.list();
  S.projects = await api.projects.list();
  await loadVersions();
  renderRail(); render();
  if (S.settings.setupVersion !== 2) openWizard();
  else if (!(S.settings.tours || {}).app) setTimeout(() => startTour('app'), 700);
  autoFetchGame();
  if (S.settings.autoUpdate !== false) setTimeout(() => checkUpdates(false), 4000);
})();
