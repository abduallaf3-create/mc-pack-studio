/* Old (1.8–1.12) pack paths → modern names, so blocks/items from old PvP packs work on new versions */
(function () {
  const COL = ['white', 'orange', 'magenta', 'light_blue', 'yellow', 'lime', 'pink', 'gray', 'silver', 'cyan', 'purple', 'blue', 'brown', 'green', 'red', 'black'];
  const c = (x) => (x === 'silver' ? 'light_gray' : x);
  const WOOD = { oak: 'oak', spruce: 'spruce', birch: 'birch', jungle: 'jungle', acacia: 'acacia', big_oak: 'dark_oak' };
  const B = {
    stonebrick: 'stone_bricks', stonebrick_mossy: 'mossy_stone_bricks', stonebrick_cracked: 'cracked_stone_bricks', stonebrick_carved: 'chiseled_stone_bricks',
    hardened_clay: 'terracotta', grass_top: 'grass_block_top', grass_side: 'grass_block_side', grass_side_overlay: 'grass_block_side_overlay', grass_side_snowed: 'grass_block_snow',
    sandstone_normal: 'sandstone', sandstone_top: 'sandstone_top', sandstone_bottom: 'sandstone_bottom', sandstone_carved: 'chiseled_sandstone', sandstone_smooth: 'cut_sandstone',
    fire_layer_0: 'fire_0', fire_layer_1: 'fire_1', web: 'cobweb', brick: 'bricks', end_stone: 'end_stone', obsidian: 'obsidian', ladder: 'ladder', glass: 'glass', glass_pane_top: 'glass_pane_top',
    quartz_block_side: 'quartz_block_side', quartz_block_top: 'quartz_block_top', quartz_block_chiseled: 'chiseled_quartz_block', quartz_block_lines: 'quartz_pillar',
    stone_slab_side: 'smooth_stone_slab_side', stone_slab_top: 'smooth_stone', cobblestone_mossy: 'mossy_cobblestone', noteblock: 'note_block', netherrack: 'netherrack',
    redstone_lamp_off: 'redstone_lamp', redstone_lamp_on: 'redstone_lamp_on', melon_side: 'melon_side', melon_top: 'melon_top', pumpkin_face_off: 'carved_pumpkin', pumpkin_face_on: 'jack_o_lantern',
    trapdoor: 'oak_trapdoor', door_wood_lower: 'oak_door_bottom', door_wood_upper: 'oak_door_top', door_iron_lower: 'iron_door_bottom', door_iron_upper: 'iron_door_top',
    furnace_front_off: 'furnace_front', furnace_front_on: 'furnace_front_on', crafting_table_front: 'crafting_table_front', crafting_table_side: 'crafting_table_side', crafting_table_top: 'crafting_table_top',
    water_still: 'water_still', water_flow: 'water_flow', lava_still: 'lava_still', lava_flow: 'lava_flow', snow: 'snow', ice: 'ice', ice_packed: 'packed_ice', slime: 'slime_block',
    tnt_side: 'tnt_side', tnt_top: 'tnt_top', tnt_bottom: 'tnt_bottom', mob_spawner: 'spawner', bed_feet_end: 'bed_feet_end', torch_on: 'torch', reeds: 'sugar_cane', deadbush: 'dead_bush',
  };
  for (const x of COL) { B['wool_colored_' + x] = c(x) + '_wool'; B['glass_' + x] = c(x) + '_stained_glass'; B['glass_pane_top_' + x] = c(x) + '_stained_glass_pane_top'; B['hardened_clay_stained_' + x] = c(x) + '_terracotta'; B['concrete_' + x] = c(x) + '_concrete'; B['concrete_powder_' + x] = c(x) + '_concrete_powder'; }
  for (const [o, n] of Object.entries(WOOD)) { B['planks_' + o] = n + '_planks'; B['log_' + o] = n + '_log'; B['log_' + o + '_top'] = n + '_log_top'; B['leaves_' + o] = n + '_leaves'; B['sapling_' + o] = n + '_sapling'; }
  const I = {
    wood_sword: 'wooden_sword', gold_sword: 'golden_sword', wood_axe: 'wooden_axe', gold_axe: 'golden_axe', wood_pickaxe: 'wooden_pickaxe', gold_pickaxe: 'golden_pickaxe',
    wood_shovel: 'wooden_shovel', gold_shovel: 'golden_shovel', wood_hoe: 'wooden_hoe', gold_hoe: 'golden_hoe', gold_helmet: 'golden_helmet', gold_chestplate: 'golden_chestplate', gold_leggings: 'golden_leggings', gold_boots: 'golden_boots',
    bow_standby: 'bow', apple_golden: 'golden_apple', potion_bottle_drinkable: 'potion', potion_bottle_splash: 'splash_potion', potion_bottle_lingering: 'lingering_potion', potion_overlay: 'potion_overlay',
    bucket_water: 'water_bucket', bucket_lava: 'lava_bucket', bucket_empty: 'bucket', bucket_milk: 'milk_bucket', fishing_rod_uncast: 'fishing_rod', fishing_rod_cast: 'fishing_rod_cast',
    beef_cooked: 'cooked_beef', beef_raw: 'beef', porkchop_cooked: 'cooked_porkchop', porkchop_raw: 'porkchop', chicken_cooked: 'cooked_chicken', chicken_raw: 'chicken', mutton_cooked: 'cooked_mutton', mutton_raw: 'mutton',
    carrot_golden: 'golden_carrot', potato_baked: 'baked_potato', book_normal: 'book', fireball: 'fire_charge', ender_eye: 'ender_eye', experience_bottle: 'experience_bottle', snowball: 'snowball', ender_pearl: 'ender_pearl',
    leather_helmet_overlay: 'leather_helmet_overlay', totem: 'totem_of_undying', clock: 'clock_00', compass: 'compass_00', reeds: 'sugar_cane', seeds_wheat: 'wheat_seeds', dye_powder_black: 'ink_sac', slimeball: 'slime_ball',
  };
  const map = (rel) => {
    const m = rel.match(/^(assets\/minecraft\/textures\/)(blocks|items)\/([^/]+?)(\.png(?:\.mcmeta)?)$/);
    if (!m) return rel;
    const [, pre, kind, name, ext] = m, T = kind === 'blocks' ? B : I;
    return pre + (kind === 'blocks' ? 'block/' : 'item/') + (T[name] || name) + ext;
  };
  const armor = (rel) => { const m = rel.match(/^assets\/minecraft\/textures\/models\/armor\/(leather|chainmail|iron|gold|diamond|netherite)_layer_([12])(_overlay)?\.png$/); if (!m) return rel; return `assets/minecraft/textures/entity/equipment/${m[2] === '1' ? 'humanoid' : 'humanoid_leggings'}/${m[1]}${m[3] || ''}.png`; };
  window.LEGACY = { map: (rel, pf) => { let r = map(rel); if (pf >= 46) r = armor(r); return r; }, isLegacy: (rel) => /^assets\/minecraft\/textures\/(blocks|items)\//.test(rel) };
})();
