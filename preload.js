const { contextBridge, ipcRenderer } = require('electron');
const inv = (ch) => (...a) => ipcRenderer.invoke(ch, ...a);
const chans = [
  'clients:list', 'settings:get', 'settings:set', 'projects:list', 'projects:save', 'projects:delete', 'projects:duplicate',
  'files:list', 'jar:find', 'tex:get', 'tex:getMeta', 'tex:put', 'tex:reset', 'file:putRaw', 'file:remove', 'file:icon', 'file:setIcon',
  'pack:import', 'pack:install', 'pack:export', 'fs:exists', 'fs:pickFolder', 'fs:pickFiles', 'fs:readB64', 'fs:open', 'fs:reveal', 'fs:saveB64',
  'mods:list', 'mods:toggle', 'mods:delete', 'mods:add', 'mods:entries', 'mods:read', 'mods:write', 'mods:backups',
  'cfg:list', 'cfg:read', 'cfg:write', 'app:info', 'asset:baseText', 'assets:list', 'skins:list', 'skins:save', 'skins:delete', 'mods:folders', 'game:status', 'game:download', 'game:dir', 'game:scan', 'game:found', 'jar:valid', 'sounds:list', 'sounds:get', 'snap:list', 'snap:create', 'snap:restore', 'snap:delete', 'update:check', 'update:install', 'update:open', 'merge:open', 'merge:read', 'merge:copy', 'pack:check', 'pack:fix', 'held:build', 'file:getRaw', 'versions:list', 'jar:packFormat', 'models:list', 'proj:export', 'proj:import', 'font:layout',
];
const api = {};
for (const c of chans) {
  const [a, b] = c.split(':');
  (api[a] = api[a] || {})[b] = inv(c);
}
api.onProjectChanged = (fn) => { ipcRenderer.removeAllListeners('project:changed'); ipcRenderer.on('project:changed', (_e, id) => fn(id)); };
api.onUpdateProgress = (fn) => { ipcRenderer.removeAllListeners('update:progress'); ipcRenderer.on('update:progress', (_e, d) => fn(d)); };
api.onScanProgress = (fn) => { ipcRenderer.removeAllListeners('game:scanProgress'); ipcRenderer.on('game:scanProgress', (_e, n) => fn(n)); };
api.onGameProgress = (fn) => { ipcRenderer.removeAllListeners('game:progress'); ipcRenderer.on('game:progress', (_e, d) => fn(d)); };
contextBridge.exposeInMainWorld('api', api);
