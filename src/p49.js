// ================= 第二集 · 龙之护身符：唐人街龙王庙（夜） =================
const TP = { x: -170, z: -170, hx: 16, hz: 12 };
// 新敌人（复用模型，换色调与数值）
Object.assign(ETYPES, {
  ninja: Object.assign({}, ETYPES.khan, { name: '赤影忍者', hp: 62, dmg: 11, spd: 4.7, windup: 0.36, scale: 0.97, tint: [1.7, 0.5, 0.45] }),
  brute: Object.assign({}, ETYPES.thug, { base: 'thug', name: '铁臂打手', hp: 180, dmg: 18, spd: 2.4, windup: 0.6, scale: 1.24, tint: [0.7, 0.72, 0.8], poise: 1, elite: 1 }),
  valmont: Object.assign({}, ETYPES.thug, { base: 'thug', name: '瓦尔蒙 · 龙之力', hp: 780, dmg: 20, spd: 3.0, windup: 0.5, scale: 1.08, tint: [1.55, 1.42, 1.15], poise: 1, elite: 1, fire: 1, dieMsg: '击败 瓦尔蒙！<small>“这……这不可能！”</small>' }),
});
ETYPES.ninja.base = 'khan';
Object.assign(WHO, {
  valmont: { n: '瓦尔蒙', c: '#f0d890', e: () => enemies.find(e => e.type === 'valmont') || player },
  brute: { n: '铁臂打手', c: '#b8c0d8', e: () => enemies.find(e => !e.dead && e.type === 'brute') || player },
});
RUNE_CLEAR[8] = 'dragon';
let dragonAltar = null;
(function buildTemple() {
  const G = new THREE.Group(); G.position.set(TP.x, 0, TP.z); scene.add(G); AREA_GROUPS.temple = G;
  const { hx, hz } = TP;
  // 地面：青石板
  const stone = canvasTex(512, 512, (g, W) => {
    g.fillStyle = '#55565c'; g.fillRect(0, 0, W, W);
    for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) { const v = 78 + Math.random() * 26 | 0; g.fillStyle = `rgb(${v},${v},${v + 6})`; g.fillRect(c * 128 + (r % 2) * 64 + 3, r * 128 + 3, 122, 122); }
    for (let i = 0; i < 1800; i++) { const v = 60 + Math.random() * 50 | 0; g.fillStyle = `rgba(${v},${v},${v},.3)`; g.fillRect(Math.random() * W, Math.random() * W, 2, 2); }
  }, [8, 6]);
  const fl = mesh(new THREE.PlaneGeometry(hx * 2, hz * 2), MS(0xffffff, { map: stone, roughness: 0.9 }), 0, 0.002, 0, G, false); fl.rotation.x = -Math.PI / 2;
  const out = mesh(new THREE.PlaneGeometry(160, 160), M(0x1a1a20), 0, -0.01, 0, G, false); out.rotation.x = -Math.PI / 2;
  // 中轴红毯石道
  const path = mesh(new THREE.PlaneGeometry(3.2, hz * 2), MS(0x6a6866, { roughness: 0.95 }), 0, 0.006, 0, G, false); path.rotation.x = -Math.PI / 2;
  // 院墙：红墙 + 灰瓦顶
  const redW = M(0x8a2018), tile = M(0x2c3036), gold = M(0xd8a83a, { emissive: 0x3a2a08 });
  const wall = (w, d, x, z) => { box(w, 3.4, d, redW, x, 1.7, z, G); box(w + 0.5, 0.25, d + 0.5, tile, x, 3.5, z, G); };
  wall(hx * 2, 0.4, 0, -hz - 6); wall(0.4, hz * 2 + 6, -hx, -3); wall(0.4, hz * 2 + 6, hx, -3);
  wall(hx - 2.6, 0.4, -(hx + 2.6) / 2, hz); wall(hx - 2.6, 0.4, (hx + 2.6) / 2, hz);
  // 山门
  [-2.6, 2.6].forEach(x => { box(0.55, 4.6, 0.55, redW, x, 2.3, hz, G); addCol(G, x - 0.3, x + 0.3, hz - 0.3, hz + 0.3); });
  box(6.4, 0.5, 0.8, redW, 0, 4.4, hz, G); box(7.4, 0.3, 1.6, tile, 0, 4.8, hz, G);
  plane(2.6, 0.7, new THREE.MeshBasicMaterial({ map: _tex.sign('龍王廟', 512, 140, '#1a0e08', '#ffd34d') }), 0, 4.0, hz - 0.42, Math.PI, G);
  // 大殿：台基 + 台阶 + 红柱 + 两重屋檐
  const hallZ = -hz - 2.5;
  box(22, 0.9, 7, M(0x6c6a68), 0, 0.45, hallZ, G);
  for (let k = 0; k < 3; k++) box(6, 0.3, 0.5, M(0x7a7876), 0, 0.15 + k * 0.3, hallZ + 3.5 + (2 - k) * 0.5 + 0.25, G);
  addCol(G, -11, 11, hallZ - 3.5, hallZ + 3.5);
  box(17, 4.6, 4, M(0x5a1810), 0, 0.9 + 2.3, hallZ - 0.8, G);
  for (let x = -7.5; x <= 7.5; x += 3) box(0.4, 4.6, 0.4, redW, x, 0.9 + 2.3, hallZ + 1.6, G);
  const doorT = canvasTex(256, 256, (g, W) => { g.fillStyle = '#4a120c'; g.fillRect(0, 0, W, W); g.strokeStyle = '#d8a83a'; g.lineWidth = 4; for (let x = 16; x < W; x += 30) { g.beginPath(); g.moveTo(x, 10); g.lineTo(x, W - 10); g.stroke(); } for (let y = 16; y < W; y += 30) { g.beginPath(); g.moveTo(10, y); g.lineTo(W - 10, y); g.stroke(); } });
  [-3, 0, 3].forEach(x => plane(2.4, 3.4, M(0xffffff, { map: doorT, emissive: 0x3a1006, emissiveMap: doorT }), x, 0.9 + 1.7, hallZ + 1.21, 0, G));
  const roof = (W, D, H, y, z) => { const g = new THREE.CylinderGeometry(0.42, 1, 1, 4, 1); g.rotateY(Math.PI / 4); const m = mesh(g, tile, 0, y + H / 2, z, G); m.scale.set(W / 1.414, H, D / 1.414); box(W * 0.42, 0.22, 0.25, gold, 0, y + H + 0.05, z, G); [-1, 1].forEach(s => { const c = mesh(new THREE.ConeGeometry(0.18, 0.7, 6), gold, s * W * 0.21, y + H + 0.35, z, G); c.rotation.z = -s * 0.5; }); };
  roof(23, 9, 1.7, 0.9 + 4.6, hallZ - 0.6);
  box(12, 1.2, 3.6, M(0x5a1810), 0, 0.9 + 4.6 + 1.7 + 0.6, hallZ - 0.8, G);
  roof(14, 6, 1.5, 0.9 + 4.6 + 1.7 + 1.2, hallZ - 0.8);
  plane(3.6, 1, new THREE.MeshBasicMaterial({ map: _tex.sign('龍 王 殿', 512, 140, '#1a0e08', '#ffd34d') }), 0, 0.9 + 4.0, hallZ + 1.25, 0, G);
  // 龙王像：石柱 + 盘龙
  const alt = new THREE.Group(); alt.position.set(0, 0, -8.5); G.add(alt);
  mesh(new THREE.CylinderGeometry(1.25, 1.4, 0.6, 8), M(0x6a6a70), 0, 0.3, 0, alt);
  mesh(new THREE.CylinderGeometry(0.35, 0.42, 3.0, 12), M(0x7a7a80), 0, 2.1, 0, alt);
  const pts = []; for (let i = 0; i <= 60; i++) { const t = i / 60, a = t * Math.PI * 4.2; pts.push(new THREE.Vector3(Math.cos(a) * 0.62, 0.7 + t * 2.7, Math.sin(a) * 0.62)); }
  const jadeM = M(0x2f9a62, { emissive: 0x0a2a18 });
  const body = mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 120, 0.17, 10), jadeM, 0, 0, 0, alt);
  const hp = pts[pts.length - 1];
  const head = mesh(new THREE.BoxGeometry(0.42, 0.34, 0.6), jadeM, hp.x, hp.y + 0.1, hp.z + 0.15, alt);
  head.rotation.y = 0.6;
  [-1, 1].forEach(s => { const h = mesh(new THREE.ConeGeometry(0.05, 0.4, 6), gold, hp.x + s * 0.12, hp.y + 0.38, hp.z, alt); h.rotation.x = -0.5; mesh(new THREE.SphereGeometry(0.045, 8, 6), glowMat(4, 1.2, 0.2), hp.x + s * 0.13, hp.y + 0.18, hp.z + 0.4, alt, false); });
  addCol(G, -1.3, 1.3, -9.8, -7.2);
  const dt = canvasTex(128, 128, (g) => { g.fillStyle = '#b8862a'; g.beginPath(); g.arc(64, 64, 60, 0, TAU); g.fill(); g.fillStyle = '#fff1b0'; g.font = 'bold 76px "Noto Sans SC",serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('龍', 64, 68); });
  const dm = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.07, 20), [M(0xffc850, { emissive: 0x6a4a10 }), M(0xffffff, { map: dt, emissive: 0x554422, emissiveMap: dt }), M(0xffffff, { map: dt })]);
  dm.rotation.x = Math.PI / 2; const dg = new THREE.Group(); dg.add(dm); dg.position.set(0, 4.1, 0); alt.add(dg); dragonAltar = dg;
  lightPool(0, 0, 3.4, new THREE.Color(0.55, 0.38, 0.1), alt);
  // 香炉 ×2
  [-6.5, 6.5].forEach(x => {
    const b = new THREE.Group(); b.position.set(x, 0, -4.5); G.add(b);
    mesh(new THREE.CylinderGeometry(0.75, 0.55, 0.9, 12), M(0x3a3226), 0, 0.75, 0, b); mesh(new THREE.TorusGeometry(0.75, 0.06, 6, 18), gold, 0, 1.2, 0, b, false).rotation.x = Math.PI / 2;
    [0, 1, 2].forEach(k => { const a = k * TAU / 3; box(0.12, 0.35, 0.12, M(0x2a241c), Math.cos(a) * 0.5, 0.17, Math.sin(a) * 0.5, b); });
    [-0.1, 0, 0.1].forEach(dx => { mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.5, 4), M(0x6a2a1a), dx, 1.45, 0, b, false); mesh(new THREE.SphereGeometry(0.025, 6, 4), glowMat(4, 1, 0.2), dx, 1.7, 0, b, false); });
    lightPool(0, 0, 1.6, new THREE.Color(0.4, 0.15, 0.04), b);
    addCol(G, x - 0.75, x + 0.75, -5.25, -3.75);
  });
  // 石狮 ×2
  const lionM = M(0x8a8a8e);
  [-4.4, 4.4].forEach(x => {
    const l = new THREE.Group(); l.position.set(x, 0, hz - 1.4); l.rotation.y = Math.PI; G.add(l);
    box(1.2, 0.8, 1.2, M(0x6a6a70), 0, 0.4, 0, l); mesh(new THREE.SphereGeometry(0.42, 12, 10), lionM, 0, 1.25, 0.05, l).scale.set(1, 1.1, 1.2);
    mesh(new THREE.SphereGeometry(0.34, 12, 10), lionM, 0, 1.85, 0.25, l); mesh(new THREE.TorusGeometry(0.32, 0.1, 6, 14), lionM, 0, 1.8, 0.2, l).rotation.x = 0.3;
    mesh(new THREE.SphereGeometry(0.16, 10, 8), lionM, x < 0 ? 0.32 : -0.32, 0.95, 0.42, l);
    addCol(G, x - 0.65, x + 0.65, hz - 2.05, hz - 0.75);
  });
  // 灯笼串
  const lanM = glowMat(1.5, 0.16, 0.05), capM = M(0x2a1608), cord = M(0x1a1008);
  [-3, 4].forEach(z => {
    for (let x = -hx + 1; x <= hx - 1; x += 2.5) {
      const y = 4.2 - 1.1 * (1 - Math.pow(x / hx, 2));
      const l = mesh(new THREE.SphereGeometry(0.28, 14, 10), lanM, x, y, z, G, false); l.scale.y = 0.85;
      box(0.2, 0.06, 0.2, capM, x, y + 0.25, z, G).castShadow = false; box(0.2, 0.06, 0.2, capM, x, y - 0.25, z, G).castShadow = false;
      lightPool(x, z, 2.2, new THREE.Color(0.32, 0.08, 0.04), G);
    }
    for (let x = -hx; x < hx; x += 1) { const y0 = 4.4 - 1.1 * (1 - Math.pow(x / hx, 2)), y1 = 4.4 - 1.1 * (1 - Math.pow((x + 1) / hx, 2)); const c = mesh(new THREE.CylinderGeometry(0.01, 0.01, Math.hypot(1, y1 - y0), 3), cord, x + 0.5, (y0 + y1) / 2, z, G, false); c.rotation.z = Math.PI / 2 - Math.atan2(y1 - y0, 1); }
  });
  // 墙外：唐人街楼房剪影
  const sil = new THREE.MeshBasicMaterial({ color: 0x0c0a16 }), winM = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.6, 0.9, 0.5), toneMapped: false });
  for (let i = 0; i < 14; i++) {
    const side = i % 3, w = rand(6, 9), h = rand(9, 20);
    let x, z; if (side === 0) { x = -hx - 8; z = -18 + (i / 3 | 0) * 9; } else if (side === 1) { x = hx + 8; z = -18 + (i / 3 | 0) * 9; } else { x = -14 + (i / 3 | 0) * 7; z = -hz - 16; }
    mesh(new THREE.BoxGeometry(w, h, w), sil, x, h / 2, z, G, false);
    for (let k = 0; k < 5; k++) { const wy = rand(3, h - 1); const wx = rand(-w / 2 + 1, w / 2 - 1); const m = mesh(new THREE.PlaneGeometry(0.9, 0.7), winM, side === 0 ? x + w / 2 + 0.02 : side === 1 ? x - w / 2 - 0.02 : x + wx, wy, side === 2 ? z + w / 2 + 0.02 : z + wx, G, false); m.rotation.y = side === 0 ? Math.PI / 2 : side === 1 ? -Math.PI / 2 : 0; }
  }
  BATCH.push(Object.assign(staticBatch([G], new Set([dragonAltar])), { cx: TP.x, cz: TP.z, r: 90 }));
  BATCH.push({ group: G, cx: TP.x, cz: TP.z, r: 90 });
})();
spawnWeapon(7, TP.x - 11, TP.z + 6); spawnWeapon(4, TP.x + 11, TP.z - 7); spawnWeapon(3, TP.x + 10, TP.z + 7);
AREA_DEF.temple = () => ({ cx: TP.x, cz: TP.z, hx: TP.hx - 1, hz: TP.hz - 1.3, room: false, sun: 1.5, sunC: 0xb0a0ff, hemi: [0x9a80c8, 0x40222a, 1.15], fog: [0x1a1024, 24, 85], night: true });
// ================= 第二集剧情 =================
const EP2_PROLOGUE = [
  { who: 'narr', text: '第二集 · 龙之护身符', act: () => sfx('clang'), shot: () => [SC.x + 2.5, 2.2, SC.z + 1, SC.x, 1.3, SC.z - 4] },
  { who: 'uncle', text: '成龙！快过来！老爹在古书里找到第二个护身符的线索了！', act: () => uncle.mood = 'scold' },
  { who: 'jackie', text: '老爹，我才刚把背上的膏药贴好……', to: 'uncle' },
  { who: 'uncle', text: '少废话！书上写着——“龙之护身符，藏于龙王像之心。”就在唐人街的龙王庙！', act: () => uncle.mood = null },
  { who: 'jade', text: '龙王庙？就是那座半夜会闹鬼的老庙？酷！' },
  { who: 'jackie', text: '小玉，你——', to: 'jade' },
  { who: 'jade', text: '我知道我知道——待在家里。' },
  { who: 'uncle', text: '还有！黑手帮的老大瓦尔蒙也在找它。要是让他先拿到龙之护身符……' },
  { who: 'jackie', text: '会怎么样？', to: 'uncle' },
  { who: 'uncle', text: '他就能喷火！把我的店烧个精光！快去快去！', act: () => uncle.mood = 'scold' },
  { fade: () => Story.toTemple() },
];
const TEMPLE_INTRO = [
  { who: 'narr', text: '唐人街 · 龙王庙 · 深夜', shot: () => [TP.x + 9, 6, TP.z + 13, TP.x, 2, TP.z - 6] },
  { who: 'narr', text: '（院子里的红灯笼在夜风里摇晃，龙王像顶端有什么东西在发光）', shot: () => [TP.x + 2.5, 3.2, TP.z - 4, TP.x, 3.8, TP.z - 8.5] },
  { who: 'jackie', text: '（小声）龙王像……护身符应该就在上面。', to: 'narr', shot: () => [TP.x + 1.2, 1.7, TP.z + 6.8, TP.x, 1.4, TP.z + 9] },
  { who: 'jade', text: '成龙！等等我！', act: () => { jade.place(TP.x + 1.5, TP.z + 13, Math.PI); jade.walkTo(TP.x + 1.6, TP.z + 10.4, 3); } },
  { who: 'jackie', text: '小玉？！……我就知道。', to: 'jade' },
  { who: 'jade', text: '我是来帮忙的！你看——那边有人！' },
  { who: 'thug', text: '是成龙！老板说了，谁敢靠近龙王像就揍谁！', act: () => { spawnWave(6); jade.mood = 'scared'; sfx('whoosh'); }, shot: () => [TP.x + 3, 2.4, TP.z + 6, TP.x, 1.4, TP.z - 3] },
  { who: 'jade', text: '我躲到石狮子后面去！', act: () => { jade.mood = null; jade.walkTo(TP.x - 5.6, TP.z + 10.6, 3.4); } },
];
EP2_PROLOGUE.push(...TEMPLE_INTRO);
const NINJA_INTRO = [
  { who: 'jackie', text: '呼……应该没人了吧？', to: 'jade' },
  { who: 'narr', text: '（屋檐上，一排红色的影子无声地落了下来）', act: () => { spawnWave(7); enemies.forEach(e => { if (!e.dead) burst(e.pos.clone().setY(1), 0xff3a2a, 24, 4); }); sfx('whoosh'); jade.mood = 'scared'; }, shot: () => [TP.x + 2, 2.6, TP.z + 3, TP.x, 1.4, TP.z - 5] },
  { who: 'jade', text: '是赤影忍者！他们比影武者还要快！' },
  { who: 'brute', text: '小子，我这双铁臂专门敲碎骨头。' },
  { who: 'jackie', text: '我的骨头已经够碎了，谢谢。', to: 'brute' },
  { who: 'jade', text: '成龙！那个大个子挨打不会停——用重击和扫堂腿！', act: () => jade.mood = null },
];
const VALMONT_INTRO = [
  { who: 'narr', text: '（啪、啪、啪——大殿里传出一阵慢悠悠的掌声）', shot: () => [TP.x + 3, 2.5, TP.z - 2, TP.x, 2.4, TP.z - 13] },
  { who: 'valmont', text: '精彩，真精彩。成龙先生，谢谢你替我把院子打扫干净了。', act: () => { spawnWave(8); burst(new THREE.Vector3(TP.x, 1, TP.z - 5.5), 0x6a5aff, 30, 4); } },
  { who: 'jackie', text: '你就是瓦尔蒙？黑手帮的老大？', to: 'valmont' },
  { who: 'valmont', text: '正是在下。至于这个——' },
  { who: 'narr', text: '（瓦尔蒙一把摘下龙王像上的护身符——火焰顺着他的手臂燃了起来！）', act: () => { if (dragonAltar) { burst(dragonAltar.getWorldPosition(new THREE.Vector3()), 0xffc850, 30, 4); dragonAltar.visible = false; } const v = enemies.find(e => e.type === 'valmont'); if (v) { burst(v.pos.clone().setY(1.3), 0xff7a2a, 50, 6); shock(v.pos.clone().setY(0.1), 0xff7a2a, 3); } shake = 0.4; sfx('heavy'); }, shot: () => [TP.x + 2.2, 1.9, TP.z - 2.8, TP.x, 1.5, TP.z - 5.5] },
  { who: 'valmont', text: '龙之力！哈哈哈哈——现在还有谁挡得住我？' },
  { who: 'uncle', text: '成龙！他会喷火球！蹲下或闪开——完美格挡还能把火球打回去！', act: () => { uncle.place(TP.x - 1.6, TP.z + 10.8, Math.PI); uncle.mood = 'scold'; } },
  { who: 'jackie', text: '把火球……打回去？老爹你是认真的吗？', to: 'uncle' },
  { who: 'uncle', text: '一百个认真！', act: () => uncle.mood = null },
  { who: 'jade', text: '狗符给你！撑不住了就去捡！', act: () => { if (!jade.rig.root.visible) jade.place(TP.x - 5.6, TP.z + 10.6, Math.PI); spawnTalisman(2, TP.x + 6, TP.z + 6); } },
];
const EP2_ENDING = [
  { who: 'narr', text: '（瓦尔蒙单膝跪地，龙之护身符从他手里滚落）', act: () => { const v = enemies.find(e => e.type === 'valmont'); burst((v ? v.pos : player.pos).clone().setY(0.5), 0xffc850, 30, 4); sfx('clang'); } },
  { who: 'jackie', text: '龙之力是很厉害——可惜用的人不怎么样。', to: 'narr' },
  { who: 'narr', text: '（一阵黑烟升起……再散开时，瓦尔蒙已经不见了）', act: () => { burst(player.pos.clone().add(new THREE.Vector3(0, 1, -3)), 0x333344, 40, 4); sfx('whoosh'); } },
  { who: 'jade', text: '他跑了！', act: () => { jade.place(player.pos.x - 2, player.pos.z + 2.4, 0); uncle.place(player.pos.x + 2, player.pos.z + 2.2, 0); } },
  { who: 'uncle', text: '让他跑！护身符才是最重要的！' },
  { who: 'narr', text: '（龙之护身符飘进了成龙的手里，暖得像一团小小的火）', act: () => { burst(player.pos.clone().setY(1.3), 0xffc850, 40, 4); shock(player.pos.clone().setY(0.1), 0xffc850, 2); } },
  { who: 'uncle', text: '两个找回来了。还有——十个！' },
  { who: 'jade', text: '还有十次大冒险！耶！', act: () => jade.mood = 'cheer' },
  { who: 'jackie', text: '我需要一个……很长、很长的假期。', to: 'jade' },
  { who: 'uncle', text: '还有一件事！', act: () => { jade.mood = null; uncle.mood = 'scold'; } },
  { who: 'uncle', text: '龙王庙的香炉被你踢歪了——修理费，从你的工资里扣！' },
  { who: 'jackie', text: '老爹……我根本就没有工资啊！', to: 'uncle' },
  { who: 'jade', text: '哈哈哈哈！', act: () => { uncle.mood = null; jade.mood = 'cheer'; } },
];
Object.assign(Story, {
  toTemple() { this.setArea('temple'); this.putPlayer(TP.x, TP.z + 8.5, Math.PI); uncle.hide(); jade.hide(); if (dragonAltar) dragonAltar.visible = true; },
  beginEp2(ch) {
    if (ch >= 9) return this.beginEp3(ch);
    if (ch === 6) {
      this.setArea('shop'); this.putPlayer(SC.x + 0.4, SC.z - 1.6, Math.PI);
      uncle.place(SC.x, SC.z - 5.3, 0); jade.place(SC.x + 1.7, SC.z - 3.8, -0.6);
      this.play(EP2_PROLOGUE, () => startWave(6));
    } else if (ch === 7) { this.toTemple(); jade.place(TP.x - 5.6, TP.z + 10.6, Math.PI); this.play(NINJA_INTRO, () => startWave(7)); }
    else { this.toTemple(); jade.place(TP.x - 5.6, TP.z + 10.6, Math.PI); this.play(VALMONT_INTRO, () => startWave(8)); }
  },
  onClearEp2(w, T) {
    if (w >= 9) return this.onClearEp3(w, T);
    if (w === 6) T(1.6, NINJA_INTRO, () => startWave(7));
    else if (w === 7) T(1.8, VALMONT_INTRO, () => startWave(8));
    else T(2.2, EP2_ENDING, () => gameEnd(true, 2));
  },
});
