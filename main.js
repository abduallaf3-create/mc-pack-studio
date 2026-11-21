// MC Pack Studio - main process
const { app, BrowserWindow, ipcMain, dialog, shell, net } = require('electron');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const os = require('os');
const AdmZip = require('adm-zip');

const HOME = os.homedir();
const APPDATA = process.env.APPDATA || (process.platform === 'darwin'
  ? path.join(HOME, 'Library', 'Application Support')
  : path.join(HOME, '.config'));
const MC_DIR = process.platform === 'darwin'
  ? path.join(APPDATA, 'minecraft')
  : path.join(APPDATA, '.minecraft');

const DATA_DIR = path.join(app.getPath('userData'), 'studio');
const PROJECTS_DIR = path.join(DATA_DIR, 'projects');
const BACKUP_DIR = path.join(DATA_DIR, 'mod-backups');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');
const GAME_DIR = path.join(DATA_DIR, 'game-files');
fs.mkdirSync(GAME_DIR, { recursive: true });
fs.mkdirSync(PROJECTS_DIR, { recursive: true });
fs.mkdirSync(BACKUP_DIR, { recursive: true });

// ---------------------------------------------------------------- clients
const CLIENTS = [
  { id: 'lunar', name: 'Lunar Client', color: '#5b8cff', type: 'instances', roots: ['{home}/.lunarclient/profiles'], subs: [''], rpSub: 'resourcepacks', modsSub: 'mods',
    extra: [{ name: '1.8.9 / الافتراضي (.minecraft)', rp: '{mc}/resourcepacks', mods: '' }],
    note: 'Lunar الجديد (1.21) يحفظ الباكات داخل البروفايل حقك في .lunarclient/profiles. نسخة 1.8.9 تستخدم .minecraft. Lunar ما يحفظ تكسترات اللعبة بالجهاز، فالتطبيق يحمّلها من Mojang.' },
  { id: 'badlion', name: 'Badlion Client', color: '#ff4d5e', type: 'single', rp: '{mc}/resourcepacks', mods: null, note: 'يستخدم مجلد ريسورس باك ماينكرافت الأساسي. لا يدعم مودات خارجية.' },
  { id: 'feather', name: 'Feather Client', color: '#3fd0c9', type: 'single', rp: '{mc}/resourcepacks', mods: '{appdata}/.feather/user-mods', note: 'المودات الخاصة في مجلد user-mods (تقدر تغيّر المسار).' },
  { id: 'labymod', name: 'LabyMod 4', color: '#4fa3ff', type: 'single', rp: '{mc}/resourcepacks', mods: '{mc}/labymod-neo/addons', note: 'الإضافات (Addons) في مجلد labymod-neo.' },
  { id: 'cheatbreaker', name: 'CheatBreaker', color: '#ff2d55', type: 'single', rp: '{mc}/resourcepacks', mods: null },
  { id: 'salwyrr', name: 'Salwyrr', color: '#ffb020', type: 'single', rp: '{mc}/resourcepacks', mods: null },
  { id: 'vanilla', name: 'Minecraft Launcher', color: '#62c462', type: 'single', rp: '{mc}/resourcepacks', mods: '{mc}/mods', note: 'الماينكرافت الأصلي (Fabric / Forge يستخدمون نفس مجلد mods).' },
  { id: 'tlauncher', name: 'TLauncher', color: '#2ea8ff', type: 'single', rp: '{mc}/resourcepacks', mods: '{mc}/mods' },
  { id: 'curseforge', name: 'CurseForge', color: '#f16436', type: 'instances', roots: ['{home}/curseforge/minecraft/Instances'], subs: [''], rpSub: 'resourcepacks', modsSub: 'mods' },
  { id: 'modrinth', name: 'Modrinth App', color: '#1bd96a', type: 'instances', roots: ['{appdata}/ModrinthApp/profiles', '{appdata}/com.modrinth.theseus/profiles'], subs: [''], rpSub: 'resourcepacks', modsSub: 'mods' },
  { id: 'prism', name: 'Prism Launcher', color: '#9c6bff', type: 'instances', roots: ['{appdata}/PrismLauncher/instances'], subs: ['.minecraft', 'minecraft'], rpSub: 'resourcepacks', modsSub: 'mods' },
  { id: 'multimc', name: 'MultiMC', color: '#c9a227', type: 'instances', roots: ['{home}/MultiMC/instances', 'C:/MultiMC/instances'], subs: ['.minecraft', 'minecraft'], rpSub: 'resourcepacks', modsSub: 'mods' },
  { id: 'custom', name: 'مسار مخصص', color: '#8a8fa3', type: 'single', rp: '', mods: '' },
];

function expand(p) {
  if (!p) return '';
  return path.normalize(p.replace('{mc}', MC_DIR).replace('{appdata}', APPDATA).replace('{home}', HOME));
}
const exists = (p) => { try { return !!p && fs.existsSync(p); } catch { return false; } };

function listInstances(c) {
  const out = [];
  for (const x of c.extra || []) out.push({ name: x.name, rp: expand(x.rp), mods: expand(x.mods) });
  for (const r of c.roots) {
    const root = expand(r);
    if (!exists(root)) continue;
    for (const name of fs.readdirSync(root)) {
      const base = path.join(root, name);
      try { if (!fs.statSync(base).isDirectory()) continue; } catch { continue; }
      let gameDir = base;
      for (const s of c.subs) { if (s && exists(path.join(base, s))) { gameDir = path.join(base, s); break; } }
      out.push({ name, rp: path.join(gameDir, c.rpSub), mods: path.join(gameDir, c.modsSub) });
    }
  }
  return out;
}

ipcMain.handle('clients:list', () => {
  const ov = (readJSON(SETTINGS_FILE, {}).clientDirs) || {};
  return CLIENTS.map((c) => {
  const r = { ...c, roots: undefined };
  const dir = ov[c.id];
  if (dir) {
    r.type = 'single'; r.gameDir = dir; r.custom = true;
    r.rpPath = path.join(dir, 'resourcepacks');
    r.modsPath = c.mods === null ? '' : path.join(dir, c.id === 'labymod' ? 'labymod-neo/addons' : 'mods');
    r.detected = exists(dir);
  } else if (c.type === 'single') {
    r.rpPath = expand(c.rp); r.modsPath = expand(c.mods);
    r.detected = c.id !== 'custom' && exists(r.rpPath ? path.dirname(r.rpPath) : '');
  } else {
    r.instances = listInstances(c); r.detected = r.instances.length > (c.extra || []).length || (c.id === 'lunar' && exists(path.join(HOME, '.lunarclient')));
  }
  return r;
  });
});

// ---------------------------------------------------------------- settings
function readJSON(f, d) { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return d; } }
function writeJSON(f, o) { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, JSON.stringify(o, null, 2)); }
ipcMain.handle('settings:get', () => readJSON(SETTINGS_FILE, { accent: 'violet' }));
ipcMain.handle('settings:set', (_e, s) => { writeJSON(SETTINGS_FILE, s); return true; });

// ---------------------------------------------------------------- projects
const projDir = (id) => path.join(PROJECTS_DIR, String(id).replace(/[^\w-]/g, ''));
const filesDir = (id) => path.join(projDir(id), 'files');
function safeRel(rel) {
  const n = path.normalize(String(rel)).replace(/^([/\\])+/, '');
  if (n.startsWith('..') || path.isAbsolute(n)) throw new Error('bad path');
  return n;
}

ipcMain.handle('projects:list', () => {
  return fs.readdirSync(PROJECTS_DIR).map((id) => readJSON(path.join(projDir(id), 'project.json'), null))
    .filter(Boolean).sort((a, b) => (b.updated || 0) - (a.updated || 0));
});
ipcMain.handle('projects:save', (_e, p) => {
  if (!p.id) p.id = 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  p.updated = Date.now();
  fs.mkdirSync(filesDir(p.id), { recursive: true });
  writeJSON(path.join(projDir(p.id), 'project.json'), p);
  return p;
});
ipcMain.handle('projects:delete', async (_e, id) => {
  await shell.trashItem(projDir(id)).catch(() => fs.rmSync(projDir(id), { recursive: true, force: true }));
  return true;
});
ipcMain.handle('projects:duplicate', (_e, id) => {
  const p = readJSON(path.join(projDir(id), 'project.json'), null);
  if (!p) return null;
  const np = { ...p, id: 'p' + Date.now().toString(36), name: p.name + ' (نسخة)', created: Date.now(), updated: Date.now() };
  fs.cpSync(projDir(id), projDir(np.id), { recursive: true });
  writeJSON(path.join(projDir(np.id), 'project.json'), np);
  return np;
});

// list of overridden files in project
function walk(dir, base = dir, out = []) {
  if (!exists(dir)) return out;
  for (const n of fs.readdirSync(dir)) {
    const f = path.join(dir, n);
    if (fs.statSync(f).isDirectory()) walk(f, base, out);
    else out.push(path.relative(base, f).split(path.sep).join('/'));
  }
  return out;
}
ipcMain.handle('files:list', (_e, id) => walk(filesDir(id)));

// ---------------------------------------------------------------- vanilla jar base
const jarCache = new Map();
function openJar(jarPath) {
  if (!jarPath || !exists(jarPath)) return null;
  if (!jarCache.has(jarPath)) { try { jarCache.set(jarPath, new AdmZip(jarPath)); } catch { return null; } }
  return jarCache.get(jarPath);
}
ipcMain.handle('jar:find', (_e, version) => {
  const found = [];
  const vdir = path.join(MC_DIR, 'versions');
  if (exists(vdir)) for (const v of fs.readdirSync(vdir)) { const j = path.join(vdir, v, v + '.jar'); if (exists(j)) found.push({ version: v, path: j }); }
  for (const f of allGameFiles()) found.push(f);
  const uniq = [...new Map(found.map((f) => [f.path, f])).values()];
  const exact = uniq.find((f) => f.version === version && f.downloaded) || uniq.find((f) => f.version === version) || null;
  // nearest release with the same texture layout
  const isLegacy = (v) => /^1\.([0-9]|1[0-2])(\.|$)/.test(v);
  const cands = uniq.filter((f) => /^\d/.test(f.version) && isLegacy(f.version) === isLegacy(version));
  cands.sort((a, b) => Math.abs(verDist(a.version, version)) - Math.abs(verDist(b.version, version)));
  return { exact, nearest: exact || cands[0] || null, all: uniq };
});
function verDist(a, b) { const x = String(a).split('.').map(Number), y = String(b).split('.').map(Number); return ((x[1] || 0) - (y[1] || 0)) * 100 + ((x[2] || 0) - (y[2] || 0)); }

function readBase(project, rel) {
  // zip entries always use '/', but path.normalize on Windows gives '\\'
  const zipPath = 'assets/minecraft/' + String(rel).replace(/\\/g, '/');
  if (project && project.baseJar) {
    const z = openJar(project.baseJar);
    const e = z && z.getEntry(zipPath);
    if (e) return e.getData();
  }
  return null;
}

ipcMain.handle('tex:get', (_e, project, rel, baseOnly) => {
  rel = safeRel(rel);
  const own = path.join(filesDir(project.id), 'assets/minecraft', rel);
  if (!baseOnly && exists(own)) return { data: fs.readFileSync(own).toString('base64'), source: 'custom' };
  const b = readBase(project, rel);
  if (b) return { data: b.toString('base64'), source: 'vanilla' };
  return null;
});
ipcMain.handle('tex:getMeta', (_e, project, rel) => {
  rel = safeRel(rel) + '.mcmeta';
  const own = path.join(filesDir(project.id), 'assets/minecraft', rel);
  if (exists(own)) return fs.readFileSync(own, 'utf8');
  const b = readBase(project, rel);
  return b ? b.toString('utf8') : null;
});
// every texture available: vanilla jar + project overrides
ipcMain.handle('assets:list', (_e, project) => {
  const m = new Map();
  const z = openJar(project.baseJar);
  if (z) for (const e of z.getEntries()) {
    const n = e.entryName;
    if (n.startsWith('assets/minecraft/textures/') && n.endsWith('.png')) m.set(n.slice(17), 'vanilla');
  }
  for (const f of walk(filesDir(project.id))) if (f.startsWith('assets/minecraft/textures/') && f.endsWith('.png')) m.set(f.slice(17), 'custom');
  return [...m].map(([path, source]) => ({ path, source })).sort((a, b) => a.path.localeCompare(b.path));
});

// saved skins library
const SKINS_DIR = path.join(DATA_DIR, 'skins');
fs.mkdirSync(SKINS_DIR, { recursive: true });
ipcMain.handle('skins:list', () => fs.readdirSync(SKINS_DIR).filter((n) => n.endsWith('.png')).map((n) => {
  const f = path.join(SKINS_DIR, n);
  const meta = readJSON(f.replace(/\.png$/, '.json'), {});
  return { id: n.replace(/\.png$/, ''), name: meta.name || n.replace(/\.png$/, ''), slim: !!meta.slim, data: fs.readFileSync(f).toString('base64'), mtime: fs.statSync(f).mtimeMs };
}).sort((a, b) => b.mtime - a.mtime));
ipcMain.handle('skins:save', (_e, s) => {
  const id = s.id || 's' + Date.now().toString(36);
  fs.writeFileSync(path.join(SKINS_DIR, id + '.png'), Buffer.from(s.data, 'base64'));
  writeJSON(path.join(SKINS_DIR, id + '.json'), { name: s.name, slim: !!s.slim });
  return id;
});
ipcMain.handle('skins:delete', (_e, id) => {
  id = String(id).replace(/[^\w-]/g, '');
  fs.rmSync(path.join(SKINS_DIR, id + '.png'), { force: true }); fs.rmSync(path.join(SKINS_DIR, id + '.json'), { force: true });
  return true;
});
// all mod folders found on this PC
ipcMain.handle('mods:folders', () => {
  const out = [];
  const seen = new Set();
  const add = (label, mods, client) => { if (!mods || seen.has(mods)) return; seen.add(mods); out.push({ label, mods, client, exists: exists(mods) }); };
  for (const c of CLIENTS) {
    if (c.type === 'single' && c.mods) add(c.name, expand(c.mods), c.id);
    if (c.type === 'instances') for (const i of listInstances(c)) add(`${c.name} · ${i.name}`, i.mods, c.id);
  }
  return out;
});

ipcMain.handle('asset:baseText', (_e, project, rel) => {
  rel = safeRel(rel);
  const b = readBase(project, rel);
  return b ? b.toString('utf8') : null;
});
ipcMain.handle('tex:put', (_e, id, rel, b64, meta) => {
  rel = safeRel(rel);
  const f = path.join(filesDir(id), 'assets/minecraft', rel);
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, Buffer.from(b64, 'base64'));
  if (meta) fs.writeFileSync(f + '.mcmeta', meta);
  else if (meta === '') fs.rmSync(f + '.mcmeta', { force: true });
  return true;
});
ipcMain.handle('tex:reset', (_e, id, rel) => {
  rel = safeRel(rel);
  const f = path.join(filesDir(id), 'assets/minecraft', rel);
  fs.rmSync(f, { force: true }); fs.rmSync(f + '.mcmeta', { force: true });
  return true;
});
ipcMain.handle('file:putRaw', (_e, id, rel, text) => {
  const f = path.join(filesDir(id), safeRel(rel));
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, text);
  return true;
});
ipcMain.handle('file:remove', (_e, id, rel) => { fs.rmSync(path.join(filesDir(id), safeRel(rel)), { force: true }); return true; });
ipcMain.handle('file:icon', (_e, id) => {
  const f = path.join(projDir(id), 'pack.png');
  return exists(f) ? fs.readFileSync(f).toString('base64') : null;
});
ipcMain.handle('file:setIcon', (_e, id, b64) => { fs.writeFileSync(path.join(projDir(id), 'pack.png'), Buffer.from(b64, 'base64')); return true; });

// import an existing resource pack (zip or folder) into the project
ipcMain.handle('pack:import', async (_e, id) => {
  const r = await dialog.showOpenDialog(win, { title: 'اختر ريسورس باك (zip)', filters: [{ name: 'Resource Pack', extensions: ['zip'] }], properties: ['openFile'] });
  if (r.canceled) return null;
  const zip = new AdmZip(r.filePaths[0]);
  let entries = zip.getEntries().filter((e) => !e.isDirectory);
  // pack may be nested in a top folder
  const mc = entries.find((e) => /(^|\/)pack\.mcmeta$/.test(e.entryName));
  const prefix = mc ? mc.entryName.replace(/pack\.mcmeta$/, '') : '';
  let count = 0, desc = null;
  for (const e of entries) {
    if (prefix && !e.entryName.startsWith(prefix)) continue;
    const rel = e.entryName.slice(prefix.length);
    if (rel === 'pack.png') { fs.writeFileSync(path.join(projDir(id), 'pack.png'), e.getData()); continue; }
    if (rel === 'pack.mcmeta') { try { desc = JSON.parse(e.getData().toString('utf8').replace(/^\uFEFF/, '')).pack.description; } catch {} continue; }
    if (!rel.startsWith('assets/')) continue;
    const f = path.join(filesDir(id), safeRel(rel));
    fs.mkdirSync(path.dirname(f), { recursive: true });
    fs.writeFileSync(f, e.getData()); count++;
  }
  return { count, name: path.basename(r.filePaths[0], '.zip'), description: typeof desc === 'string' ? desc : null };
});



// ---------------------------------------------------------------- find real game textures inside client folders
// reads only a zip's central directory (fast, no full load)
function zipNames(file) {
  let fd;
  try {
    fd = fs.openSync(file, 'r');
    const size = fs.fstatSync(fd).size; if (size < 22) return null;
    const tailLen = Math.min(size, 65557);
    const tail = Buffer.alloc(tailLen); fs.readSync(fd, tail, 0, tailLen, size - tailLen);
    let i = tail.length - 22; while (i >= 0 && tail.readUInt32LE(i) !== 0x06054b50) i--;
    if (i < 0) return null;
    let cdSize = tail.readUInt32LE(i + 12), cdOff = tail.readUInt32LE(i + 16);
    if (cdOff === 0xffffffff || cdSize === 0xffffffff) { // zip64
      const loc = i - 20;
      if (loc >= 0 && tail.readUInt32LE(loc) === 0x07064b50) {
        const z64 = Number(tail.readBigUInt64LE(loc + 8)); const b = Buffer.alloc(56); fs.readSync(fd, b, 0, 56, z64);
        cdSize = Number(b.readBigUInt64LE(40)); cdOff = Number(b.readBigUInt64LE(48));
      } else return null;
    }
    if (cdSize > 64 * 1024 * 1024) return null;
    const cd = Buffer.alloc(cdSize); fs.readSync(fd, cd, 0, cdSize, cdOff);
    const names = []; let o = 0;
    while (o + 46 <= cd.length && cd.readUInt32LE(o) === 0x02014b50) {
      const nl = cd.readUInt16LE(o + 28), xl = cd.readUInt16LE(o + 30), cl = cd.readUInt16LE(o + 32);
      names.push(cd.toString('utf8', o + 46, o + 46 + nl)); o += 46 + nl + xl + cl;
    }
    return names;
  } catch { return null; } finally { if (fd !== undefined) try { fs.closeSync(fd); } catch {} }
}
const LATEST_PATCH = { '1.7': '1.7.10', '1.8': '1.8.9', '1.9': '1.9.4', '1.10': '1.10.2', '1.11': '1.11.2', '1.12': '1.12.2', '1.16': '1.16.5', '1.17': '1.17.1', '1.18': '1.18.2', '1.19': '1.19.4', '1.20': '1.20.6' };
const isLegacyVer = (v) => /^1\.([0-9]|1[0-2])(\.|$)/.test(v);
function versionFromPath(file) {
  const f = file.replace(/\\/g, '/');
  const cands = [];
  for (const m of f.matchAll(/(^|[^\d.])(1)[._](\d{1,2})(?:[._](\d{1,2}))?(?![\d])/g)) {
    const minor = +m[3]; if (minor < 7 || minor > 40) continue;
    cands.push(m[4] !== undefined ? `1.${minor}.${+m[4]}` : `1.${minor}`);
  }
  if (!cands.length) return null;
  const v = cands[cands.length - 1];
  return LATEST_PATCH[v] || v;
}
const verCmp = (a, b) => { const x = String(a).split('.').map(Number), y = String(b).split('.').map(Number); for (let i = 0; i < 4; i++) { const d = (x[i] || 0) - (y[i] || 0); if (d) return d; } return 0; };
function probeJar(file) {
  const names = zipNames(file); if (!names) return null;
  const set = new Set(names);
  const legacy = set.has('assets/minecraft/textures/items/diamond_sword.png');
  const modern = set.has('assets/minecraft/textures/item/diamond_sword.png');
  if (!legacy && !modern) return null;
  const textures = names.filter((n) => n.startsWith('assets/minecraft/textures/') && n.endsWith('.png')).length;
  const minTex = +process.env.MCS_MINTEX || 800;
  if (textures < minTex) return null; // a resource pack or a mod, not the game itself
  // the real game always has these core textures
  const core = legacy ? ['blocks/stone.png', 'blocks/dirt.png', 'items/apple.png', 'gui/widgets.png'] : ['block/stone.png', 'block/dirt.png', 'item/apple.png', 'entity/creeper/creeper.png'];
  if (!process.env.MCS_MINTEX && !core.every((c) => set.has('assets/minecraft/textures/' + c))) return null;
  let version = null;
  if (set.has('version.json')) { try { version = JSON.parse(new AdmZip(file).getEntry('version.json').getData().toString('utf8')).id; } catch {} }
  if (!version) version = versionFromPath(file);
  if (version && legacy !== isLegacyVer(version)) version = null; // name didn't match the texture layout
  if (!version) version = legacy ? (set.has('assets/minecraft/textures/items/totem.png') ? '1.12.2' : '1.8.9') : 'unknown';
  if (/^1\.\d+(\.\d+)?$/.test(version) === false && /^\d+\.\d+/.test(version) === false) version = 'unknown';
  return { path: file, version, legacy, textures, size: fs.statSync(file).size };
}
const SCAN_FILE = path.join(DATA_DIR, 'found-game-files.json');
function defaultRoots() {
  const st = readJSON(SETTINGS_FILE, {});
  return [...new Set([
    path.join(MC_DIR, 'versions'), path.join(HOME, '.lunarclient'), path.join(APPDATA, '.feather'), path.join(APPDATA, 'Badlion Client'),
    path.join(APPDATA, '.badlion'), path.join(HOME, 'curseforge', 'minecraft', 'Install', 'versions'), path.join(APPDATA, 'ModrinthApp', 'meta', 'versions'),
    path.join(APPDATA, 'PrismLauncher', 'libraries', 'com', 'mojang', 'minecraft'), path.join(APPDATA, '.tlauncher'), path.join(APPDATA, '.labymod'),
    ...Object.values(st.clientDirs || {}), ...(st.gameRoots || []),
  ])].filter(exists);
}
function scanRoots(roots, onProgress) {
  const found = []; let jars = 0;
  const skip = /^(node_modules|\.git|logs|crash-reports|screenshots|saves|resourcepacks|shaderpacks|cache|jre|java|runtime|objects|indexes|skins|cosmetics|mods|essential|flashback|config|libraries-cache)$/i;
  const walkJ = (dir, depth) => {
    if (depth > 7 || jars > 1500) return;
    let list; try { list = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const d of list) {
      const f = path.join(dir, d.name);
      if (d.isDirectory()) { if (!skip.test(d.name)) walkJ(f, depth + 1); continue; }
      if (!/\.jar$/i.test(d.name)) continue;
      let sz = 0; try { sz = fs.statSync(f).size; } catch {} if (sz < 1.5 * 1048576) continue;
      jars++; const r = probeJar(f); if (r) found.push(r);
      if (onProgress && jars % 10 === 0) onProgress(jars);
    }
  };
  for (const r of roots) walkJ(r, 0);
  return found;
}
function allGameFiles() {
  const out = [...(readJSON(SCAN_FILE, { found: [] }).found || [])].filter((f) => exists(f.path));
  for (const n of (exists(GAME_DIR) ? fs.readdirSync(GAME_DIR) : [])) if (n.endsWith('.jar')) out.push({ path: path.join(GAME_DIR, n), version: n.replace(/\.jar$/, ''), downloaded: true });
  return out;
}
ipcMain.handle('game:scan', (e, extraRoot) => {
  if (extraRoot) { const st = readJSON(SETTINGS_FILE, {}); st.gameRoots = [...new Set([...(st.gameRoots || []), extraRoot])]; writeJSON(SETTINGS_FILE, st); }
  const roots = extraRoot ? [extraRoot, ...defaultRoots()] : defaultRoots();
  const found = scanRoots(roots, (n) => { try { e.sender.send('game:scanProgress', n); } catch {} });
  const uniq = [...new Map(found.map((f) => [f.path, f])).values()];
  writeJSON(SCAN_FILE, { at: Date.now(), roots, found: uniq });
  return { found: uniq, roots, inExtra: extraRoot ? uniq.filter((f) => f.path.startsWith(extraRoot)) : [] };
});
ipcMain.handle('game:found', () => allGameFiles());
ipcMain.handle('jar:valid', (_e, p) => { if (!p || !exists(p)) return false; if (p.startsWith(GAME_DIR)) return true; return !!probeJar(p); });

// ---------------------------------------------------------------- official game files (Mojang)
const MANIFEST = process.env.MCS_MANIFEST || 'https://piston-meta.mojang.com/mc/game/version_manifest_v2.json';
async function fetchJSON(url) { const r = await net.fetch(url); if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); }
ipcMain.handle('game:status', (_e, versions) => versions.map((v) => ({ version: v, downloaded: exists(path.join(GAME_DIR, v + '.jar')) })));
ipcMain.handle('game:download', async (e, version) => {
  const dest = path.join(GAME_DIR, version + '.jar');
  if (exists(dest)) return dest;
  const send = (d) => { try { e.sender.send('game:progress', { version, ...d }); } catch {} };
  send({ stage: 'meta', got: 0, total: 0 });
  const man = await fetchJSON(MANIFEST);
  const v = man.versions.find((x) => x.id === version);
  if (!v) throw new Error('النسخة ' + version + ' مو موجودة عند Mojang');
  const vj = await fetchJSON(v.url);
  const c = vj.downloads && vj.downloads.client;
  if (!c) throw new Error('ما فيه ملف للنسخة');
  const res = await net.fetch(c.url);
  if (!res.ok) throw new Error('HTTP ' + res.status);
  const total = c.size || +res.headers.get('content-length') || 0;
  const reader = res.body.getReader();
  const chunks = []; let got = 0, last = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(Buffer.from(value)); got += value.length;
    if (Date.now() - last > 120) { last = Date.now(); send({ stage: 'jar', got, total }); }
  }
  const buf = Buffer.concat(chunks);
  if (c.sha1 && crypto.createHash('sha1').update(buf).digest('hex') !== c.sha1) throw new Error('الملف خربان، جرّب مرة ثانية');
  fs.writeFileSync(dest + '.part', buf); fs.renameSync(dest + '.part', dest);
  send({ stage: 'done', got: total, total });
  return dest;
});
ipcMain.handle('game:dir', () => GAME_DIR);


// ---------------------------------------------------------------- sounds (from the official asset index)
const RES_URL = process.env.MCS_RES || 'https://resources.download.minecraft.net';
async function versionJson(version) {
  const f = path.join(GAME_DIR, 'meta', version + '.json');
  if (exists(f)) return readJSON(f, null);
  const man = await fetchJSON(MANIFEST);
  const v = man.versions.find((x) => x.id === version);
  if (!v) throw new Error('النسخة ' + version + ' مو موجودة');
  const vj = await fetchJSON(v.url); writeJSON(f, vj); return vj;
}
const assetRoots = () => [GAME_DIR, path.join(MC_DIR, 'assets'), path.join(HOME, '.lunarclient', 'shared', 'assets'), path.join(HOME, 'curseforge', 'minecraft', 'Install', 'assets'), path.join(APPDATA, 'ModrinthApp', 'meta', 'assets'), path.join(APPDATA, 'PrismLauncher', 'assets')];
ipcMain.handle('sounds:list', async (_e, version) => {
  const vj = await versionJson(version);
  const ai = vj.assetIndex; if (!ai) throw new Error('ما فيه فهرس أصوات');
  let idx = null;
  for (const r of assetRoots()) { const f = path.join(r, 'indexes', ai.id + '.json'); if (exists(f)) { idx = readJSON(f, null); if (idx) break; } }
  if (!idx) { idx = await fetchJSON(ai.url); writeJSON(path.join(GAME_DIR, 'indexes', ai.id + '.json'), idx); }
  return Object.entries(idx.objects || {}).filter(([k]) => /^(minecraft\/)?sounds\/.+\.ogg$/.test(k))
    .map(([k, v]) => ({ path: k.replace(/^minecraft\//, ''), hash: v.hash, size: v.size }));
});
ipcMain.handle('sounds:get', async (_e, hash) => {
  hash = String(hash).replace(/[^0-9a-f]/gi, ''); if (hash.length !== 40) throw new Error('bad hash');
  for (const r of assetRoots()) { const f = path.join(r, 'objects', hash.slice(0, 2), hash); if (exists(f)) return fs.readFileSync(f).toString('base64'); }
  const res = await net.fetch(`${RES_URL}/${hash.slice(0, 2)}/${hash}`); if (!res.ok) throw new Error('HTTP ' + res.status);
  const buf = Buffer.from(await res.arrayBuffer());
  const f = path.join(GAME_DIR, 'objects', hash.slice(0, 2), hash); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, buf);
  return buf.toString('base64');
});


// ---------------------------------------------------------------- pack snapshots (backups)
const snapDir = (id) => path.join(projDir(id), 'snapshots');
ipcMain.handle('snap:list', (_e, id) => {
  const d = snapDir(id); if (!exists(d)) return [];
  return fs.readdirSync(d).map((n) => ({ id: n, ...readJSON(path.join(d, n, 'snap.json'), { name: n, at: 0 }) })).sort((a, b) => b.at - a.at);
});
ipcMain.handle('snap:create', (_e, id, name) => {
  const sid = 's' + Date.now(); const d = path.join(snapDir(id), sid); fs.mkdirSync(d, { recursive: true });
  if (exists(filesDir(id))) fs.cpSync(filesDir(id), path.join(d, 'files'), { recursive: true });
  for (const f of ['project.json', 'pack.png']) if (exists(path.join(projDir(id), f))) fs.copyFileSync(path.join(projDir(id), f), path.join(d, f));
  const count = walk(path.join(d, 'files')).length;
  writeJSON(path.join(d, 'snap.json'), { name: name || 'نسخة احتياطية', at: Date.now(), count });
  return sid;
});
ipcMain.handle('snap:restore', (_e, id, sid) => {
  const d = path.join(snapDir(id), String(sid).replace(/[^\w-]/g, '')); if (!exists(d)) throw new Error('missing');
  fs.rmSync(filesDir(id), { recursive: true, force: true });
  if (exists(path.join(d, 'files'))) fs.cpSync(path.join(d, 'files'), filesDir(id), { recursive: true }); else fs.mkdirSync(filesDir(id), { recursive: true });
  if (exists(path.join(d, 'pack.png'))) fs.copyFileSync(path.join(d, 'pack.png'), path.join(projDir(id), 'pack.png'));
  const pj = readJSON(path.join(d, 'project.json'), null); if (pj) { pj.updated = Date.now(); writeJSON(path.join(projDir(id), 'project.json'), pj); }
  return pj;
});
ipcMain.handle('snap:delete', (_e, id, sid) => { fs.rmSync(path.join(snapDir(id), String(sid).replace(/[^\w-]/g, '')), { recursive: true, force: true }); return true; });


// ---------------------------------------------------------------- merge packs
const mergeZips = new Map();
function packEntries(zipPath) {
  if (!mergeZips.has(zipPath)) mergeZips.set(zipPath, new AdmZip(zipPath));
  const z = mergeZips.get(zipPath);
  const all = z.getEntries().filter((e) => !e.isDirectory);
  const mc = all.find((e) => /(^|\/)pack\.mcmeta$/.test(e.entryName));
  const prefix = mc ? mc.entryName.replace(/pack\.mcmeta$/, '') : '';
  return { z, prefix, all };
}
ipcMain.handle('merge:open', async () => {
  const r = testPicks ? { canceled: !testPicks.length, filePaths: testPicks.splice(0) } : await dialog.showOpenDialog(win, { title: 'اختر الباكات اللي تبي تدمجها', filters: [{ name: 'Resource Pack', extensions: ['zip'] }], properties: ['openFile', 'multiSelections'] });
  if (r.canceled) return null;
  return r.filePaths.map((f) => {
    try {
      const { prefix, all } = packEntries(f);
      const files = all.filter((e) => e.entryName.startsWith(prefix + 'assets/')).map((e) => e.entryName.slice(prefix.length));
      let icon = null; const ic = all.find((e) => e.entryName === prefix + 'pack.png'); if (ic) icon = ic.getData().toString('base64');
      return { path: f, name: path.basename(f, '.zip'), files, icon };
    } catch (e) { return { path: f, name: path.basename(f), error: String(e.message), files: [] }; }
  });
});
ipcMain.handle('merge:read', (_e, zipPath, rel) => {
  const { z, prefix } = packEntries(zipPath); const e = z.getEntry(prefix + rel);
  return e ? e.getData().toString('base64') : null;
});
ipcMain.handle('merge:copy', (_e, id, zipPath, rels) => {
  const { z, prefix } = packEntries(zipPath); let n = 0;
  for (const rel of rels) {
    const e = z.getEntry(prefix + rel);
    if (!e) { if (rel.endsWith('.mcmeta')) fs.rmSync(path.join(filesDir(id), safeRel(rel)), { force: true }); continue; }
    const f = path.join(filesDir(id), safeRel(rel)); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, e.getData()); n++;
  }
  return n;
});

// ---------------------------------------------------------------- pack checker
function pngSize(buf) { if (buf.length < 24 || buf.readUInt32BE(0) !== 0x89504e47) return null; return [buf.readUInt32BE(16), buf.readUInt32BE(20)]; }
ipcMain.handle('pack:check', (_e, project) => {
  const dir = filesDir(project.id); const files = walk(dir); const set = new Set(files); const issues = [];
  let base = null; if (project.baseJar && exists(project.baseJar)) { const n = zipNames(project.baseJar); if (n) base = new Set(n); }
  let total = 0;
  for (const rel of files) {
    const f = path.join(dir, rel); const st = fs.statSync(f); total += st.size;
    if (rel.endsWith('.png')) {
      const buf = Buffer.alloc(32); const fd = fs.openSync(f, 'r'); fs.readSync(fd, buf, 0, 32, 0); fs.closeSync(fd);
      const sz = pngSize(buf);
      if (!sz) { issues.push({ level: 'err', file: rel, msg: 'الملف مو صورة PNG صحيحة', fix: 'delete' }); continue; }
      const [w, h] = sz;
      if (w > 1024 || h > 4096) issues.push({ level: 'warn', file: rel, msg: `الصورة كبيرة جداً (${w}×${h}) — تثقّل اللعبة` });
      const unused = rel.startsWith('assets/minecraft/textures/') && base && !base.has(rel) && !/optifine|mcpatcher/.test(rel);
      if (!unused && rel.startsWith('assets/minecraft/textures/') && h > w && h % w === 0 && !set.has(rel + '.mcmeta') && !(base && base.has(rel + '.mcmeta')) && !/gui|font|colormap|environment|misc|entity/.test(rel))
        issues.push({ level: 'warn', file: rel, msg: 'صورة أنيميشن بدون ملف mcmeta (بتطلع ممطوطة)', fix: 'addmeta' });
      if (unused)
        issues.push({ level: 'warn', file: rel, msg: `${project.version} ما يستخدم هذا الملف (اسمه أو مكانه غلط لهالنسخة)`, fix: 'delete' });
      if (base && base.has(rel)) {
        const vz = openJar(project.baseJar); const ve = vz && vz.getEntry(rel);
        if (ve) { const vs = pngSize(ve.getData().subarray(0, 32)); if (vs && (w / vs[0] !== h / vs[1]) && !(h > w && vs[1] > vs[0])) issues.push({ level: 'warn', file: rel, msg: `المقاس ${w}×${h} مو بنفس نسبة الأصلي ${vs[0]}×${vs[1]} — ممكن يطلع مشوّه` }); }
      }
    } else if (rel.endsWith('.mcmeta')) {
      if (!set.has(rel.replace(/\.mcmeta$/, '')) && rel !== 'pack.mcmeta') issues.push({ level: 'info', file: rel, msg: 'ملف mcmeta بدون صورة', fix: 'delete' });
      try { JSON.parse(fs.readFileSync(f, 'utf8')); } catch { issues.push({ level: 'err', file: rel, msg: 'ملف mcmeta فيه خطأ JSON', fix: 'addmeta-replace' }); }
    } else if (rel.endsWith('.json')) {
      try { JSON.parse(fs.readFileSync(f, 'utf8').replace(/^﻿/, '')); } catch (e) { issues.push({ level: 'err', file: rel, msg: 'ملف JSON فيه خطأ: ' + String(e.message).slice(0, 60) }); }
    } else if (rel.endsWith('.ogg')) {
      const b = Buffer.alloc(64); const fd = fs.openSync(f, 'r'); fs.readSync(fd, b, 0, 64, 0); fs.closeSync(fd);
      if (b.toString('latin1', 0, 4) !== 'OggS' || !b.toString('latin1').includes('vorbis')) issues.push({ level: 'err', file: rel, msg: 'الصوت مو OGG Vorbis — اللعبة ما بتشغله', fix: 'delete' });
    }
  }
  if (total > 50 * 1048576) issues.push({ level: 'warn', file: '', msg: `حجم الباك كبير (${(total / 1048576).toFixed(1)} MB) — ممكن يبطّئ تحميل اللعبة` });
  return { issues, files: files.length, size: total };
});
ipcMain.handle('pack:fix', (_e, project, items) => {
  const dir = filesDir(project.id); let n = 0;
  for (const it of items) {
    const f = path.join(dir, safeRel(it.file));
    if (it.fix === 'delete') { fs.rmSync(f, { force: true }); fs.rmSync(f + '.mcmeta', { force: true }); n++; }
    if (it.fix === 'addmeta') { fs.writeFileSync(f + '.mcmeta', JSON.stringify({ animation: { frametime: 2 } }, null, 2)); n++; }
    if (it.fix === 'addmeta-replace') { fs.writeFileSync(f, JSON.stringify({ animation: { frametime: 2 } }, null, 2)); n++; }
  }
  return n;
});


// ---------------------------------------------------------------- held item size (low sword / small items)
ipcMain.handle('held:build', (_e, project, cfg) => {
  const z = openJar(project.baseJar); if (!z) return { error: 'nojar', extras: {}, count: 0 };
  const pre = 'assets/minecraft/models/item/';
  const names = z.getEntries().map((e) => e.entryName).filter((n) => n.startsWith(pre) && n.endsWith('.json')).map((n) => n.slice(pre.length, -5)).filter((n) => !n.includes('/'));
  const read = (n) => { const e = z.getEntry(pre + n + '.json'); if (!e) return null; try { return JSON.parse(e.getData().toString('utf8')); } catch { return null; } };
  const isTool = (n) => /(_sword|_axe|_pickaxe|_shovel|_hoe|_spear)$/.test(n) || /^(stick|blaze_rod|breeze_rod|bone|fishing_rod|carrot_on_a_stick|warped_fungus_on_a_stick|mace|handheld|handheld_rod|handheld_mace|trident)$/.test(n);
  const skip = (n) => /^(shield|shield_blocking|template_|air)/.test(n);
  const mod = (m, lower, scale, xs) => {
    let ch = false;
    for (const k of Object.keys(m.display || {})) {
      if (!/^firstperson/.test(k)) continue;
      const d = m.display[k];
      d.translation = [...(d.translation || [0, 0, 0])];
      d.translation[1] = +(d.translation[1] - lower).toFixed(3);
      if (xs) d.translation[0] = +(d.translation[0] + xs).toFixed(3);
      d.scale = (d.scale || [1, 1, 1]).map((v) => +(v * scale).toFixed(3));
      ch = true;
    }
    return ch;
  };
  const out = {};
  const groups = [];
  if (cfg.hOn) groups.push([names.filter((n) => isTool(n) && !skip(n)), cfg.hLower, cfg.hScale, cfg.hX]);
  if (cfg.gOn) groups.push([names.filter((n) => !isTool(n) && !skip(n)), cfg.gLower, cfg.gScale, 0]);
  for (const [list, lower, scale, xs] of groups) for (const n of list) {
    const m = read(n); if (!m || !m.display) continue; // only models that define their own hand position
    if (mod(m, +lower || 0, +scale || 1, +xs || 0)) out[pre + n + '.json'] = JSON.stringify(m, null, 2);
  }
  return { extras: out, count: Object.keys(out).length };
});
ipcMain.handle('file:getRaw', (_e, id, rel) => { const f = path.join(filesDir(id), safeRel(rel)); return exists(f) ? fs.readFileSync(f, 'utf8') : null; });

// ---------------------------------------------------------------- build / install
function buildZip(project, extra) {
  const zip = new AdmZip();
  const pf = project.packFormat;
  const meta = { pack: { description: project.description || project.name } };
  if (pf >= 65) { meta.pack.min_format = [pf, 0]; meta.pack.max_format = [pf, 0]; }
  else { meta.pack.pack_format = pf; if (pf >= 18) meta.pack.supported_formats = [pf, 64]; }
  zip.addFile('pack.mcmeta', Buffer.from(JSON.stringify(meta, null, 2)));
  const icon = path.join(projDir(project.id), 'pack.png');
  if (exists(icon)) zip.addFile('pack.png', fs.readFileSync(icon));
  for (const rel of walk(filesDir(project.id))) { if (extra && extra[rel] !== undefined) continue; zip.addFile(rel, fs.readFileSync(path.join(filesDir(project.id), rel))); }
  for (const [rel, content] of Object.entries(extra || {})) zip.addFile(rel, Buffer.from(content));
  return zip;
}
const safeName = (s) => (s || 'pack').replace(/[<>:"/\\|?*\x00-\x1f]/g, '').trim() || 'pack';

function activateInOptions(gameDir, zipName, legacy) {
  const opt = path.join(gameDir, 'options.txt');
  if (!exists(opt)) return false;
  let txt = fs.readFileSync(opt, 'utf8');
  const entry = legacy ? `"${zipName}"` : `"file/${zipName}"`;
  const m = txt.match(/^resourcePacks:(.*)$/m);
  let list = [];
  if (m) { try { list = JSON.parse(m[1]); } catch { list = []; } }
  const val = JSON.parse(entry);
  list = list.filter((x) => x !== val);
  list.push(val);
  const line = 'resourcePacks:' + JSON.stringify(list);
  txt = m ? txt.replace(/^resourcePacks:.*$/m, line) : txt + '\n' + line;
  fs.writeFileSync(opt, txt);
  return true;
}

ipcMain.handle('pack:install', (_e, project, extra, activate, target) => {
  if (target) project = { ...project, rpPath: target };
  if (!project.rpPath) throw new Error('حدد مجلد الريسورس باك للكلاينت أولاً');
  fs.mkdirSync(project.rpPath, { recursive: true });
  const name = safeName(project.name) + '.zip';
  const out = path.join(project.rpPath, name);
  buildZip(project, extra).writeZip(out);
  let activated = false;
  if (activate) { try { activated = activateInOptions(path.dirname(project.rpPath), name, project.packFormat <= 3); } catch {} }
  return { path: out, activated };
});
ipcMain.handle('pack:export', async (_e, project, extra) => {
  const r = await dialog.showSaveDialog(win, { defaultPath: safeName(project.name) + '.zip', filters: [{ name: 'Zip', extensions: ['zip'] }] });
  if (r.canceled) return null;
  buildZip(project, extra).writeZip(r.filePath);
  return { path: r.filePath };
});

// ---------------------------------------------------------------- generic fs helpers
ipcMain.handle('fs:exists', (_e, p) => exists(p));
ipcMain.handle('fs:pickFolder', async (_e, title) => {
  const r = await dialog.showOpenDialog(win, { title, properties: ['openDirectory', 'createDirectory'] });
  return r.canceled ? null : r.filePaths[0];
});
const testPicks = process.env.MCS_PICK ? process.env.MCS_PICK.split(',') : null;
ipcMain.handle('fs:pickFiles', async (_e, title, exts, multi) => {
  if (testPicks) return testPicks.length ? [testPicks.shift()] : null;
  const r = await dialog.showOpenDialog(win, { title, filters: exts ? [{ name: exts.join(', '), extensions: exts }] : [], properties: multi ? ['openFile', 'multiSelections'] : ['openFile'] });
  return r.canceled ? null : r.filePaths;
});
ipcMain.handle('fs:readB64', (_e, p) => fs.readFileSync(p).toString('base64'));
ipcMain.handle('fs:open', (_e, p) => { if (exists(p)) shell.openPath(p); else if (exists(path.dirname(p))) shell.openPath(path.dirname(p)); return true; });
ipcMain.handle('fs:reveal', (_e, p) => { shell.showItemInFolder(p); return true; });
ipcMain.handle('fs:saveB64', async (_e, name, b64) => {
  const r = await dialog.showSaveDialog(win, { defaultPath: name });
  if (r.canceled) return null;
  fs.writeFileSync(r.filePath, Buffer.from(b64, 'base64'));
  return r.filePath;
});

// ---------------------------------------------------------------- mods
function modInfo(file) {
  const info = { name: null, version: null, loader: null, description: null, icon: null, authors: null };
  try {
    const z = new AdmZip(file);
    const fab = z.getEntry('fabric.mod.json') || z.getEntry('quilt.mod.json');
    if (fab) {
      const j = JSON.parse(fab.getData().toString('utf8').replace(/^\uFEFF/, '').replace(/[\u0000-\u001f]+/g, ' '));
      const q = j.quilt_loader ? { ...j.quilt_loader.metadata, id: j.quilt_loader.id, version: j.quilt_loader.version, icon: j.quilt_loader.metadata?.icon } : j;
      info.loader = j.quilt_loader ? 'Quilt' : 'Fabric';
      info.name = q.name || q.id; info.version = q.version; info.description = q.description;
      info.authors = Array.isArray(q.authors) ? q.authors.map((a) => (typeof a === 'string' ? a : a.name)).join(', ') : null;
      let ic = q.icon; if (ic && typeof ic === 'object') ic = Object.values(ic).pop();
      if (ic) { const e = z.getEntry(String(ic).replace(/^\//, '')); if (e) info.icon = e.getData().toString('base64'); }
    }
    const toml = z.getEntry('META-INF/mods.toml') || z.getEntry('META-INF/neoforge.mods.toml');
    if (!fab && toml) {
      const t = toml.getData().toString('utf8');
      info.loader = toml.entryName.includes('neoforge') ? 'NeoForge' : 'Forge';
      const g = (k) => { const m = t.match(new RegExp('^\\s*' + k + '\\s*=\\s*"([^"]*)"', 'm')); return m ? m[1] : null; };
      info.name = g('displayName'); info.version = g('version'); info.authors = g('authors');
      const lg = g('logoFile'); if (lg) { const e = z.getEntry(lg); if (e) info.icon = e.getData().toString('base64'); }
      if (info.version && info.version.includes('${')) {
        const mf = z.getEntry('META-INF/MANIFEST.MF');
        const m = mf && mf.getData().toString('utf8').match(/Implementation-Version:\s*(.+)/);
        info.version = m ? m[1].trim() : null;
      }
    }
    const mcmod = z.getEntry('mcmod.info');
    if (!fab && !toml && mcmod) {
      try {
        let j = JSON.parse(mcmod.getData().toString('utf8').replace(/^\uFEFF/, ''));
        if (j.modList) j = j.modList; j = Array.isArray(j) ? j[0] : j;
        info.loader = 'Forge (Legacy)'; info.name = j.name; info.version = j.version; info.description = j.description;
        if (j.logoFile) { const e = z.getEntry(j.logoFile.replace(/^\//, '')); if (e) info.icon = e.getData().toString('base64'); }
      } catch {}
    }
  } catch { info.broken = true; }
  return info;
}

ipcMain.handle('mods:list', (_e, dir) => {
  if (!exists(dir)) return null;
  return fs.readdirSync(dir).filter((n) => /\.jar(\.disabled)?$/i.test(n)).map((n) => {
    const f = path.join(dir, n);
    const st = fs.statSync(f);
    return { file: n, path: f, size: st.size, enabled: !/\.disabled$/i.test(n), mtime: st.mtimeMs, ...modInfo(f) };
  }).sort((a, b) => (a.name || a.file).localeCompare(b.name || b.file));
});
ipcMain.handle('mods:toggle', (_e, p) => {
  const np = /\.disabled$/i.test(p) ? p.replace(/\.disabled$/i, '') : p + '.disabled';
  fs.renameSync(p, np); return np;
});
ipcMain.handle('mods:delete', async (_e, p) => { await shell.trashItem(p); return true; });
ipcMain.handle('mods:add', (_e, dir, files) => {
  fs.mkdirSync(dir, { recursive: true });
  for (const f of files) fs.copyFileSync(f, path.join(dir, path.basename(f)));
  return true;
});
ipcMain.handle('mods:entries', (_e, p) => {
  const z = new AdmZip(p);
  return z.getEntries().filter((e) => !e.isDirectory).map((e) => ({ name: e.entryName, size: e.header.size }));
});
ipcMain.handle('mods:read', (_e, p, entry) => {
  const z = new AdmZip(p); const e = z.getEntry(entry);
  return e ? e.getData().toString('base64') : null;
});
// changes: { entryName: base64 | null(delete) }
ipcMain.handle('mods:write', (_e, p, changes) => {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const bak = path.join(BACKUP_DIR, stamp + '_' + path.basename(p));
  fs.copyFileSync(p, bak);
  const z = new AdmZip(p);
  for (const [name, b64] of Object.entries(changes)) {
    if (b64 === null) { if (z.getEntry(name)) z.deleteFile(name); continue; }
    const buf = Buffer.from(b64, 'base64');
    if (z.getEntry(name)) z.updateFile(name, buf); else z.addFile(name, buf);
  }
  const tmp = p + '.tmp';
  z.writeZip(tmp);
  fs.renameSync(tmp, p);
  return { backup: bak };
});
ipcMain.handle('mods:backups', () => BACKUP_DIR);

// config files (text) in game dir
ipcMain.handle('cfg:list', (_e, dir) => {
  if (!exists(dir)) return null;
  return walk(dir).filter((r) => /\.(json5?|toml|cfg|properties|txt|ya?ml|conf|ini|snbt)$/i.test(r)).slice(0, 2000);
});
ipcMain.handle('cfg:read', (_e, dir, rel) => fs.readFileSync(path.join(dir, safeRel(rel)), 'utf8'));
ipcMain.handle('cfg:write', (_e, dir, rel, text) => {
  const f = path.join(dir, safeRel(rel));
  fs.copyFileSync(f, path.join(BACKUP_DIR, Date.now() + '_' + path.basename(f)));
  fs.writeFileSync(f, text); return true;
});


// ---------------------------------------------------------------- auto update (GitHub Releases)
const UPDATE_REPO = require('./package.json').updateRepo || 'abduallaf3-create/mc-pack-studio';
const semverGt = (a, b) => { const x = String(a).replace(/^v/, '').split('.').map(Number), y = String(b).replace(/^v/, '').split('.').map(Number); for (let i = 0; i < 3; i++) { if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) > (y[i] || 0); } return false; };
ipcMain.handle('update:check', async () => {
  const r = await net.fetch(`${process.env.MCS_UPDATE_API || 'https://api.github.com'}/repos/${UPDATE_REPO}/releases/latest`, { headers: { 'User-Agent': 'MC-Pack-Studio', Accept: 'application/vnd.github+json' } });
  if (r.status === 404) return { available: false, current: app.getVersion(), none: true };
  if (!r.ok) throw new Error('HTTP ' + r.status);
  const rel = await r.json();
  const asset = (rel.assets || []).find((a) => /setup.*\.exe$/i.test(a.name)) || (rel.assets || []).find((a) => /\.exe$/i.test(a.name));
  const version = String(rel.tag_name || '').replace(/^v/, '');
  return { available: !!asset && semverGt(version, app.getVersion()), current: app.getVersion(), version, notes: rel.body || '', name: rel.name || version, url: asset && asset.browser_download_url, size: asset && asset.size, page: rel.html_url };
});
ipcMain.handle('update:install', async (e, url, version) => {
  if (!/^https:\/\/github\.com\/|^https:\/\/objects\.githubusercontent\.com\//.test(url)) throw new Error('bad url');
  const res = await net.fetch(url, { headers: { 'User-Agent': 'MC-Pack-Studio' } });
  if (!res.ok) throw new Error('HTTP ' + res.status);
  const total = +res.headers.get('content-length') || 0; const reader = res.body.getReader();
  const chunks = []; let got = 0, last = 0;
  for (;;) { const { done, value } = await reader.read(); if (done) break; chunks.push(Buffer.from(value)); got += value.length; if (Date.now() - last > 150) { last = Date.now(); try { e.sender.send('update:progress', { got, total }); } catch {} } }
  const file = path.join(os.tmpdir(), `MC-Pack-Studio-Setup-${String(version).replace(/[^\w.-]/g, '')}.exe`);
  fs.writeFileSync(file, Buffer.concat(chunks));
  // run the installer silently; it closes this app, installs, then starts the new version
  require('child_process').spawn(file, ['/S'], { detached: true, stdio: 'ignore' }).unref();
  setTimeout(() => app.quit(), 800);
  return true;
});
ipcMain.handle('update:open', (_e, u) => { if (/^https:\/\/github\.com\//.test(u)) shell.openExternal(u); return true; });

// ---------------------------------------------------------------- window
let win;
function createWindow() {
  win = new BrowserWindow({
    width: 1360, height: 860, minWidth: 1080, minHeight: 680,
    backgroundColor: '#0b0d12',
    title: 'MC Pack Studio',
    icon: path.join(__dirname, 'build', 'icon.png'),
    titleBarStyle: 'hidden',
    titleBarOverlay: process.platform === 'win32' ? { color: '#0b0d12', symbolColor: '#c9cbe0', height: 38 } : undefined,
    frame: process.platform === 'win32' ? undefined : true,
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, sandbox: false },
  });
  win.setMenuBarVisibility(false);
  win.on('focus', () => { try { win.webContents.focus(); } catch {} });
  win.loadFile(path.join(__dirname, 'renderer', 'index.html'));
  win.webContents.setWindowOpenHandler(({ url }) => { shell.openExternal(url); return { action: 'deny' }; });
  if (process.env.MCS_SHOT) require(process.env.MCS_SCRIPT || './test/shot.js')(win, app);
}
ipcMain.handle('app:info', () => ({ version: app.getVersion(), platform: process.platform, mcDir: MC_DIR, dataDir: DATA_DIR }));

app.whenReady().then(createWindow);
app.on('window-all-closed', () => app.quit());
