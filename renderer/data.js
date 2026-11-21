// Versions, texture catalog and icons
window.VERSIONS = [
  { id: '1.8.9', pf: 1, label: '1.8.9 (PvP)' },
  { id: '1.12.2', pf: 3, label: '1.12.2' },
  { id: '1.16.5', pf: 6, label: '1.16.5' },
  { id: '1.20.1', pf: 15, label: '1.20.1' },
  { id: '1.20.4', pf: 22, label: '1.20.4' },
  { id: '1.21.1', pf: 34, label: '1.21.1' },
  { id: '1.21.4', pf: 46, label: '1.21.4' },
  { id: '1.21.8', pf: 64, label: '1.21.8' },
  { id: '1.21.10', pf: 69, label: '1.21.10' },
  { id: '1.21.11', pf: 75, label: '1.21.11 (الأحدث)' },
];

const T = 'textures/';
const L = (p) => [1, 3, T + p];        // 1.8 - 1.12
const F = (p, min = 4, max = 999) => [min, max, T + p]; // 1.13+
const A = (p) => [1, 999, T + p];      // every version

window.CATEGORIES = [
  { id: 'swords', name: 'السيوف', icon: 'sword' },
  { id: 'totem', name: 'التوتم', icon: 'totem' },
  { id: 'skin', name: 'سكن اللاعب', icon: 'user' },
  { id: 'elytra', name: 'الإليترا وأدوات جديدة', icon: 'wand' },
  { id: 'pvp', name: 'أدوات PvP', icon: 'bow' },
  { id: 'armor', name: 'الدروع', icon: 'shield' },
  { id: 'effects', name: 'الفاير والتأثيرات', icon: 'fire' },
  { id: 'gui', name: 'الواجهة والكروس هير', icon: 'cross' },
  { id: 'blocks', name: 'البلوكات (Bedwars)', icon: 'cube' },
  { id: 'sky', name: 'السماء', icon: 'sun' },
  { id: 'custom', name: 'ملفات أخرى', icon: 'file' },
];

// [id, name, category, variants, defaultSize]
window.TEXTURES = [
  ['wooden_sword', 'سيف خشب', 'swords', [L('items/wood_sword.png'), F('item/wooden_sword.png')]],
  ['stone_sword', 'سيف حجر', 'swords', [L('items/stone_sword.png'), F('item/stone_sword.png')]],
  ['iron_sword', 'سيف حديد', 'swords', [L('items/iron_sword.png'), F('item/iron_sword.png')]],
  ['golden_sword', 'سيف ذهب', 'swords', [L('items/gold_sword.png'), F('item/golden_sword.png')]],
  ['diamond_sword', 'سيف دايموند', 'swords', [L('items/diamond_sword.png'), F('item/diamond_sword.png')]],
  ['netherite_sword', 'سيف نذرايت', 'swords', [F('item/netherite_sword.png', 5)]],

  ['bow', 'القوس', 'pvp', [L('items/bow_standby.png'), F('item/bow.png')]],
  ['bow_pulling_0', 'القوس (سحب 1)', 'pvp', [L('items/bow_pulling_0.png'), F('item/bow_pulling_0.png')]],
  ['bow_pulling_1', 'القوس (سحب 2)', 'pvp', [L('items/bow_pulling_1.png'), F('item/bow_pulling_1.png')]],
  ['bow_pulling_2', 'القوس (سحب 3)', 'pvp', [L('items/bow_pulling_2.png'), F('item/bow_pulling_2.png')]],
  ['arrow', 'السهم', 'pvp', [L('items/arrow.png'), F('item/arrow.png')]],
  ['ender_pearl', 'إندر بيرل', 'pvp', [L('items/ender_pearl.png'), F('item/ender_pearl.png')]],
  ['golden_apple', 'تفاحة ذهبية', 'pvp', [L('items/apple_golden.png'), F('item/golden_apple.png')]],
  ['fishing_rod', 'السنارة', 'pvp', [L('items/fishing_rod_uncast.png'), F('item/fishing_rod.png')]],
  ['snowball', 'كرة ثلج', 'pvp', [L('items/snowball.png'), F('item/snowball.png')]],
  ['egg', 'البيضة', 'pvp', [L('items/egg.png'), F('item/egg.png')]],
  ['splash_potion', 'جرعة رمي', 'pvp', [L('items/potion_bottle_splash.png'), F('item/splash_potion.png')]],
  ['potion_overlay', 'لون الجرعة', 'pvp', [L('items/potion_overlay.png'), F('item/potion_overlay.png')]],
  ['cooked_beef', 'ستيك', 'pvp', [L('items/beef_cooked.png'), F('item/cooked_beef.png')]],
  ['flint_and_steel', 'ولّاعة', 'pvp', [L('items/flint_and_steel.png'), F('item/flint_and_steel.png')]],
  ['lava_bucket', 'سطل لافا', 'pvp', [L('items/bucket_lava.png'), F('item/lava_bucket.png')]],
  ['water_bucket', 'سطل ماء', 'pvp', [L('items/bucket_water.png'), F('item/water_bucket.png')]],
  ['totem', 'التوتم', 'totem', [[3, 3, T + 'items/totem.png'], F('item/totem_of_undying.png')]],
  ['totem_particle', 'جزيئات التوتم', 'totem', [F('particle/glitter_7.png', 5)], [16, 16]],
  ['elytra_wings', 'الإليترا (الأجنحة)', 'elytra', [[2, 3, T + 'entity/elytra.png'], F('entity/elytra.png', 4, 41), F('entity/equipment/wings/elytra.png', 42)], [64, 32]],
  ['elytra_item', 'الإليترا (أيقونة)', 'elytra', [[2, 3, T + 'items/elytra.png'], F('item/elytra.png')]],
  ['broken_elytra', 'إليترا مكسورة', 'elytra', [[2, 3, T + 'items/broken_elytra.png'], F('item/broken_elytra.png')]],
  ['firework', 'الألعاب النارية (Rocket)', 'elytra', [L('items/fireworks.png'), F('item/firework_rocket.png')]],
  ['trident', 'الترايدنت', 'elytra', [F('item/trident.png', 4)]],
  ['crossbow', 'الكروس بو', 'elytra', [F('item/crossbow_standby.png', 4)]],
  ['mace', 'الميس (Mace)', 'elytra', [F('item/mace.png', 34)]],
  ['wind_charge', 'Wind Charge', 'elytra', [F('item/wind_charge.png', 34)]],
  ['end_crystal', 'إند كريستال', 'elytra', [[2, 3, T + 'items/end_crystal.png'], F('item/end_crystal.png')]],
  ['spyglass', 'المنظار', 'elytra', [F('item/spyglass.png', 7)]],
  ['netherite_helmet', 'خوذة نذرايت', 'armor', [F('item/netherite_helmet.png', 5)]],
  ['iron_helmet', 'خوذة حديد (أيقونة)', 'armor', [L('items/iron_helmet.png'), F('item/iron_helmet.png')]],
  ['diamond_boots', 'بوت دايموند (أيقونة)', 'armor', [L('items/diamond_boots.png'), F('item/diamond_boots.png')]],
  ['diamond_leggings', 'بنطلون دايموند (أيقونة)', 'armor', [L('items/diamond_leggings.png'), F('item/diamond_leggings.png')]],
  ['steve', 'ستيف (السكن الافتراضي)', 'skin', [[1, 11, T + 'entity/steve.png'], F('entity/player/wide/steve.png', 12)], [64, 64]],
  ['alex', 'أليكس (السكن الافتراضي)', 'skin', [[1, 11, T + 'entity/alex.png'], F('entity/player/slim/alex.png', 12)], [64, 64]],
  ...['ari', 'efe', 'kai', 'makena', 'noor', 'sunny', 'zuri'].flatMap((n) => [
    [n + '_wide', `سكن ${n} (عريض)`, 'skin', [F(`entity/player/wide/${n}.png`, 12)], [64, 64]],
    [n + '_slim', `سكن ${n} (نحيف)`, 'skin', [F(`entity/player/slim/${n}.png`, 12)], [64, 64]]]),
  ['shield_tex', 'تكستر الشيلد', 'pvp', [[2, 3, T + 'entity/shield_base_nopattern.png'], F('entity/shield_base_nopattern.png')], [64, 64]],

  ['diamond_armor1', 'درع دايموند (فوق)', 'armor', [[1, 41, T + 'models/armor/diamond_layer_1.png'], F('entity/equipment/humanoid/diamond.png', 42)], [64, 32]],
  ['diamond_armor2', 'درع دايموند (بنطلون)', 'armor', [[1, 41, T + 'models/armor/diamond_layer_2.png'], F('entity/equipment/humanoid_leggings/diamond.png', 42)], [64, 32]],
  ['iron_armor1', 'درع حديد (فوق)', 'armor', [[1, 41, T + 'models/armor/iron_layer_1.png'], F('entity/equipment/humanoid/iron.png', 42)], [64, 32]],
  ['iron_armor2', 'درع حديد (بنطلون)', 'armor', [[1, 41, T + 'models/armor/iron_layer_2.png'], F('entity/equipment/humanoid_leggings/iron.png', 42)], [64, 32]],
  ['netherite_armor1', 'درع نذرايت (فوق)', 'armor', [[5, 41, T + 'models/armor/netherite_layer_1.png'], F('entity/equipment/humanoid/netherite.png', 42)], [64, 32]],
  ['diamond_helmet', 'خوذة دايموند (أيقونة)', 'armor', [L('items/diamond_helmet.png'), F('item/diamond_helmet.png')]],
  ['diamond_chestplate', 'صدرية دايموند (أيقونة)', 'armor', [L('items/diamond_chestplate.png'), F('item/diamond_chestplate.png')]],

  ['fire_0', 'الفاير (طبقة 1)', 'effects', [L('blocks/fire_layer_0.png'), F('block/fire_0.png')], [16, 512]],
  ['fire_1', 'الفاير (طبقة 2)', 'effects', [L('blocks/fire_layer_1.png'), F('block/fire_1.png')], [16, 512]],
  ['glint', 'لمعة الإنشانت', 'effects', [[1, 22, T + 'misc/enchanted_item_glint.png'], F('misc/enchanted_glint_item.png', 32)], [64, 64]],
  ['particles', 'الجزيئات (Particles)', 'effects', [L('particle/particles.png')], [128, 128]],
  ['crit', 'جزيء الكريتكال', 'effects', [F('particle/critical_hit.png', 5)], [8, 8]],
  ['pumpkin', 'شاشة القرعة', 'effects', [A('misc/pumpkinblur.png')], [256, 256]],

  ['icons', 'أيقونات الواجهة (كروس هير، قلوب، أكل)', 'gui', [[1, 15, T + 'gui/icons.png']], [256, 256]],
  ['crosshair', 'الكروس هير', 'gui', [F('gui/sprites/hud/crosshair.png', 18)], [15, 15]],
  ['heart_full', 'القلب', 'gui', [F('gui/sprites/hud/heart/full.png', 18)], [9, 9]],
  ['food_full', 'الأكل', 'gui', [F('gui/sprites/hud/food_full.png', 18)], [9, 9]],
  ['widgets', 'الهوت بار والأزرار', 'gui', [[1, 15, T + 'gui/widgets.png']], [256, 256]],
  ['hotbar', 'الهوت بار', 'gui', [F('gui/sprites/hud/hotbar.png', 18)], [182, 22]],
  ['hotbar_sel', 'تحديد الهوت بار', 'gui', [F('gui/sprites/hud/hotbar_selection.png', 18)], [24, 23]],
  ['button', 'الأزرار', 'gui', [F('gui/sprites/widget/button.png', 18)], [200, 20]],
  ['inventory', 'الإنفنتوري', 'gui', [A('gui/container/inventory.png')], [256, 256]],
  ['title', 'شعار ماينكرافت', 'gui', [A('gui/title/minecraft.png')], [256, 256]],

  ['white_wool', 'صوف أبيض', 'blocks', [L('blocks/wool_colored_white.png'), F('block/white_wool.png')]],
  ['red_wool', 'صوف أحمر', 'blocks', [L('blocks/wool_colored_red.png'), F('block/red_wool.png')]],
  ['blue_wool', 'صوف أزرق', 'blocks', [L('blocks/wool_colored_blue.png'), F('block/blue_wool.png')]],
  ['obsidian', 'أوبسيديان', 'blocks', [L('blocks/obsidian.png'), F('block/obsidian.png')]],
  ['end_stone', 'إند ستون', 'blocks', [L('blocks/end_stone.png'), F('block/end_stone.png')]],
  ['oak_planks', 'خشب', 'blocks', [L('blocks/planks_oak.png'), F('block/oak_planks.png')]],
  ['glass', 'زجاج', 'blocks', [L('blocks/glass.png'), F('block/glass.png')]],
  ['tnt_side', 'TNT', 'blocks', [L('blocks/tnt_side.png'), F('block/tnt_side.png')]],

  ['sun', 'الشمس', 'sky', [A('environment/sun.png')], [32, 32]],
  ['moon', 'القمر', 'sky', [A('environment/moon_phases.png')], [128, 64]],
  ['clouds', 'الغيوم', 'sky', [A('environment/clouds.png')], [256, 256]],
].map(([id, name, cat, v, size]) => ({ id, name, cat, v, size: size || [16, 16] }));

window.texPath = (tex, pf) => {
  const m = tex.v.find(([a, b]) => pf >= a && pf <= b);
  return m ? m[2] : null;
};
window.versionByPf = (pf) => VERSIONS.find((v) => v.pf === pf);

// Theme presets for the app
window.ACCENTS = {
  violet: ['#8b5cf6', '#c084fc'], blue: ['#3b82f6', '#22d3ee'], green: ['#22c55e', '#a3e635'],
  red: ['#ef4444', '#f97316'], pink: ['#ec4899', '#f472b6'], gold: ['#f59e0b', '#facc15'], cyan: ['#06b6d4', '#a855f7'], mint: ['#10b981', '#06b6d4'],
};

// minimal stroke icons
const I = {
  home: '<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>',
  sword: '<path d="M14.5 3.5L20 3l-.5 5.5L9 19l-4 1 1-4z"/><path d="M5 14l5 5M3 21l2-2"/>',
  bow: '<path d="M5 3c8 2 14 8 16 16"/><path d="M5 3l16 16M14 4h6v6"/>',
  shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/>',
  fire: '<path d="M12 3c1 4 6 6 6 11a6 6 0 0 1-12 0c0-3 2-4 2-7 2 1 3 3 3 5 1-2 1-5 1-9z"/>',
  cross: '<path d="M12 4v6M12 14v6M4 12h6M14 12h6"/>',
  cube: '<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z"/><path d="M4 7.5l8 4.5 8-4.5M12 12v9"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  file: '<path d="M6 3h8l5 5v13H6z"/><path d="M14 3v5h5"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  puzzle: '<path d="M10 3h4v3a2 2 0 1 0 4 0V3h3v7h-3a2 2 0 1 0 0 4h3v7h-7v-3a2 2 0 1 0-4 0v3H3v-7h3a2 2 0 1 0 0-4H3V3z"/>',
  palette: '<path d="M12 3a9 9 0 1 0 0 18c1 0 1.5-.8 1.5-1.5 0-1.5-1.5-1.5-1.5-3a2 2 0 0 1 2-2h2a5 5 0 0 0 5-5c0-3.6-4-6.5-9-6.5z"/><circle cx="7.5" cy="11" r="1"/><circle cx="10" cy="7" r="1"/><circle cx="15" cy="7" r="1"/>',
  download: '<path d="M12 3v12M7 10l5 5 5-5M4 20h16"/>',
  upload: '<path d="M12 21V9M7 14l5-5 5 5M4 4h16"/>',
  folder: '<path d="M3 6a1 1 0 0 1 1-1h5l2 2h9a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z"/>',
  trash: '<path d="M4 7h16M10 11v6M14 11v6M5 7l1 13h12l1-13M9 7V4h6v3"/>',
  copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>',
  pencil: '<path d="M4 20l1-4L16 5l3 3L8 19z"/>',
  eraser: '<path d="M4 16l9-9 6 6-6 6H8z"/><path d="M13 19h7"/>',
  bucket: '<path d="M5 11l7-7 7 7-7 7z"/><path d="M20 15s2 2.5 2 3.5a2 2 0 0 1-4 0c0-1 2-3.5 2-3.5z"/>',
  picker: '<path d="M14 4l6 6-2 2-6-6zM12 8l-8 8v4h4l8-8"/>',
  line: '<path d="M5 19L19 5"/>',
  rect: '<rect x="4" y="5" width="16" height="14" rx="1"/>',
  undo: '<path d="M9 7L4 12l5 5"/><path d="M4 12h11a5 5 0 0 1 0 10h-2"/>',
  redo: '<path d="M15 7l5 5-5 5"/><path d="M20 12H9a5 5 0 0 0 0 10h2"/>',
  flipH: '<path d="M12 3v18M8 7L3 12l5 5zM16 7l5 5-5 5z"/>',
  flipV: '<path d="M3 12h18M7 8l5-5 5 5zM7 16l5 5 5-5z"/>',
  rotate: '<path d="M20 12a8 8 0 1 1-2.3-5.7M20 4v5h-5"/>',
  grid: '<path d="M4 4h16v16H4zM4 10h16M4 15h16M10 4v16M15 4v16"/>',
  image: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 17l-5-5-9 8"/>',
  reset: '<path d="M4 12a8 8 0 1 0 2.3-5.7M4 4v5h5"/>',
  check: '<path d="M5 12l5 5 9-10"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
  mirror: '<path d="M12 3v18" stroke-dasharray="2 2"/><path d="M9 7l-5 5 5 5M15 7l5 5-5 5"/>',
  zip: '<path d="M6 3h12v18H6z"/><path d="M11 3v2h2v2h-2v2h2v2h-2v2"/>',
  play: '<path d="M7 4l13 8-13 8z"/>',
  monitor: '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13 7l4 4"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>',
  totem: '<rect x="7" y="3" width="10" height="7" rx="1"/><path d="M9 10v4H5v3h4v4h6v-4h4v-3h-4v-4"/><path d="M10 6h.01M14 6h.01"/>',
  layers: '<path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/>',
  star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  sound: '<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16 8a5 5 0 0 1 0 8M19 5a9 9 0 0 1 0 14"/>',
  pause: '<path d="M7 4h3v16H7zM14 4h3v16h-3z"/>',
  wand: '<path d="M4 20L16 8M15 4v2M19 8h2M18 5l1-1M13 3h0M21 11h0"/>',
};
window.icon = (n, s = 18) => `<svg class="ic" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${I[n] || ''}</svg>`;
