// ================= 大地图 2~4：内华达沙漠（第四集）、喜马拉雅（第五集）、天界仙山（第九集） =================
function shapeDist(s, x, z) {
  if (s.t === 'rect') { const dx = Math.max(s.x0 - x, 0, x - s.x1), dz = Math.max(s.z0 - z, 0, z - s.z1); return Math.hypot(dx, dz); }
  if (s.t === 'circ') return Math.max(0, Math.hypot(x - s.x, z - s.z) - s.r);
  const ax = s.a[0], az = s.a[1], dx = s.b[0] - ax, dz = s.b[1] - az, L2 = dx * dx + dz * dz || 1, t = clamp(((x - ax) * dx + (z - az) * dz) / L2, 0, 1); return Math.max(0, Math.hypot(x - ax - dx * t, z - az - dz * t) - s.w / 2);
}
const walkDist = (d, x, z) => { let m = 1e9; for (const s of d.walk) m = Math.min(m, shapeDist(s, x, z)); return m; };
WB.mesa = function (G, x, z, r, h, col) { const geo = new THREE.CylinderGeometry(r * 0.82, r, h, 9, 4), p = geo.attributes.position; for (let i = 0; i < p.count; i++) { const a = Math.atan2(p.getZ(i), p.getX(i)); const k = 1 + 0.12 * Math.sin(a * 3 + x) + 0.06 * Math.sin(a * 7 + z); p.setX(i, p.getX(i) * k); p.setZ(i, p.getZ(i) * k); } geo.computeVertexNormals();
  const m = mesh(geo, M(col, { flatShading: true }), x, h / 2 - 1, z, G, false); for (let i = 1; i < 4; i++) mesh(new THREE.CylinderGeometry(r * (1.005 - i * 0.04), r * (1.01 - i * 0.04), h * 0.02, 9), M(0xe8b08a), x, h * i / 4.4, z, G, false); return m; };
WB.island = function (G, x, y, z, r, top = 0x6aaa5a, rock = 0x8a7a6a) { const K = new THREE.Group(); K.position.set(x, y, z); G.add(K); const g = new THREE.ConeGeometry(r, r * 1.6, 10, 3), p = g.attributes.position; for (let i = 0; i < p.count; i++) if (p.getY(i) < r * 0.79) { p.setX(i, p.getX(i) * (0.85 + 0.3 * vnoise(i, r))); p.setZ(i, p.getZ(i) * (0.85 + 0.3 * vnoise(r, i))); } g.computeVertexNormals();
  const c = mesh(g, M(rock, { flatShading: true }), 0, -r * 0.8 - 0.4, 0, K, false); c.rotation.x = Math.PI; mesh(new THREE.CylinderGeometry(r * 1.02, r, 0.8, 24), M(top), 0, -0.4, 0, K, false); return K; };
WB.dish = function (G, x, z, s, yaw) { const K = new THREE.Group(); K.position.set(x, 0, z); K.rotation.y = yaw; K.scale.setScalar(s); G.add(K); const w = M(0xf0f0f0); box(1.5, 8, 1.5, w, 0, 4, 0, K); const d = mesh(new THREE.SphereGeometry(6, 20, 8, 0, TAU, 0, 0.9), M(0xf4f4f4, { side: THREE.DoubleSide }), 0, 10, 0, K, false); d.rotation.x = -0.9; mesh(new THREE.CylinderGeometry(0.1, 0.1, 6, 4), w, 0, 12.5, 1.6, K, false).rotation.x = -0.9; return K; };
// ---------- 内华达沙漠 ----------
WORLD.reg({
  key: 'nev', title: '内华达沙漠', sub: '第十三号基地以南 · 红岩峡谷', x: 3000, z: 3000, hx: 120, hz: 190,
  entry: { x: 0, z: -165, yaw: 0 }, bgm: 'base13', mapBg: '#5a2a1a', mapLand: '#e0a070',
  light: { sun: 2.8, sunC: 0xffe0b0, hemi: [0xffe8d0, 0x8a4a2a, 1.0], fog: [0xe8c8a0, 300, 1700] },
  lightN: { sun: 0.6, sunC: 0x9aa8ff, hemi: [0x6070b0, 0x3a2020, 0.85], fog: [0x161a2c, 180, 1200] },
  sky: [0x2a6ad0, 0x8ab8e8, 0xf0d8b0], skyN: [0x02040c, 0x101838, 0x2a2440],
  walk: [{ t: 'rect', x0: -40, x1: 40, z0: -178, z1: 178 }, { t: 'circ', x: -60, z: -40, r: 38 }, { t: 'circ', x: 70, z: 60, r: 34 }, { t: 'rect', x0: -60, x1: 60, z0: 150, z1: 186 }],
  gates: { base: { x: 0, z: 180, yaw: Math.PI, label: '第十三号基地', sub: '禁区 · 闲人免进' } },
  marks: [{ id: 'arch', name: '红岩拱门', sub: '风沙雕出的天然石桥', x: 0, z: 20, r: 12 }, { id: 'dam', name: '胡佛大坝观景台', sub: '两百米高的混凝土巨墙', x: 70, z: 60, r: 16 }, { id: 'vla', name: '射电天线阵', sub: '它们在听什么？', x: -60, z: -40, r: 16 }],
  chests: [{ id: 'n1', x: -88, z: -40, items: { wine: 1 } }, { id: 'n2', x: 95, z: 70, items: { scroll: 1 } }, { id: 'n3', x: 35, z: -120, items: { tea: 1 } }, { id: 'n4', x: -55, z: 180, items: { bun: 2 } }],
  packs: [{ x: 0, z: -40, types: ['thug', 'khan'] }, { x: 60, z: 80, types: ['ninja', 'thug'] }, { x: -10, z: 120, types: ['khan', 'khan', 'thug'] }],
  villagers: [{ x: 4, z: -150, look: { hat: 'straw', cloth: 0x8a5a3a } }, { x: -58, z: -12, path: [[-58, -12], [-80, -55], [-40, -70]], look: { hat: 'none', cloth: 0xf0f0f0 } }],
  quests: [{ id: 'meteor', title: '天外来石', goal: '在峡谷里找回 4 块陨石碎片', type: 'collect', item: '陨石碎片', giver: { x: -8, z: -150, yaw: Math.PI / 2, name: '公路旅馆老板娘', look: { hat: 'straw', cloth: 0xb04a5a } }, spots: [[-75, -20], [30, 40], [88, 52], [-30, 160]],
    intro: [{ who: 'npc', text: '昨晚天上掉下来一颗会发光的石头，碎成好几块落进了峡谷，听说军方的人也在找……' }, { who: 'jackie', text: '军方？那可不能让他们抢先！我去看看。' }],
    done: [{ who: 'npc', text: '就是这些！我把它们放进柜台展示，生意肯定好。这瓶老酒请你喝！' }, { who: 'jackie', text: '谢谢……我还是比较喜欢喝茶。' }], remind: '小心点，峡谷里不太平。', thanks: '下次路过，住店给你打折！', reward: { xp: 120, items: { wine: 1, tea: 1 } } }],
  onNight(B, on) { WB.night(B, on); },
  build(G, d, B) {
    B.d = d; Object.assign(B, { lit: [], lampsM: [], lanterns: [], blink: [], nightOnly: [], dyn: [] });
    const hf = (x, z) => { const w = walkDist(d, x, z); if (w < 2) return -0.05; return Math.min(260, Math.pow(w, 1.05) * 0.35 + fbm(x / 90, z / 90) * 60 * Math.min(1, w / 40)); };
    const cf = (h, x, z) => new THREE.Color(h < 2 ? 0xd89a68 : h < 60 ? 0xc87a4a : 0xb05a3a).lerp(new THREE.Color(0xe8b080), Math.max(0, Math.sin(h * 0.3)) * 0.3);
    terrainMesh(2400, 2400, 150, hf, cf, G, 0, 0);
    WB.ground(G, 140, 400, '#d8a070', '#e0b080', 20);
    WB.strip(G, 0, -178, 0, 178, 9, 0x4a4a4c); WB.strip(G, 0, -178, 0, 178, 0.3, 0xffd04a, 0.03);
    let seed = 3; const r = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
    // 红色台地与石柱
    for (let i = 0; i < 26; i++) { const a = r() * TAU, dist = 260 + r() * 700; WB.mesa(G, Math.cos(a) * dist, Math.sin(a) * dist, 40 + r() * 90, 90 + r() * 240, [0xb8582a, 0xc86a3a, 0xa04a2a][i % 3]); }
    for (let i = 0; i < 10; i++) WB.mesa(G, (r() > 0.5 ? 1 : -1) * (70 + r() * 60), -170 + i * 36, 6 + r() * 8, 30 + r() * 60, 0xc0603a);
    // 天然石拱
    { const a = mesh(new THREE.TorusGeometry(70, 9, 8, 30, Math.PI), M(0xc06a3a, { flatShading: true }), 0, 0, 20, G, false); a.scale.set(1, 1.2, 1); }
    // 胡佛大坝 + 水库
    { const K = new THREE.Group(); K.position.set(190, 0, 60); G.add(K); const dam = mesh(new THREE.CylinderGeometry(150, 150, 220, 40, 1, true, -0.55, 1.1), M(0xd8d4c8, { side: THREE.DoubleSide }), -120, 80, 0, K, false); dam.rotation.y = Math.PI / 2;
      for (let i = 0; i < 4; i++) mesh(new THREE.CylinderGeometry(7, 7, 230, 12), M(0xe8e4d8), 12, 85, -60 + i * 40, K, false); WB.water(G, 420, 60, 400, 500, 0x2a6a8a).position.y = 160;
      for (let i = 0; i < 6; i++) B.lampsM.push(mesh(new THREE.SphereGeometry(1.2, 8, 6), new THREE.MeshBasicMaterial({ color: 0x8a8270, toneMapped: false }), 30, 192, -75 + i * 30, K, false)); }
    // 射电天线阵
    for (let i = 0; i < 9; i++) { const a = i / 9 * TAU; WB.dish(G, -60 + Math.cos(a) * 26, -40 + Math.sin(a) * 26, 1.3, a + 0.4); WORLD.col(d, -61 + Math.cos(a) * 26, -41 + Math.sin(a) * 26, -59 + Math.cos(a) * 26, -39 + Math.sin(a) * 26, 8); }
    WB.dish(G, -400, -200, 6, 0.7); WB.dish(G, -480, 60, 5, 1.4);
    // 基地外围：围栏、机库、塔台；南面公路旅馆 + 加油站
    for (let x = -60; x <= 60; x += 3) box(0.12, 3, 0.12, M(0x7a7a7a), x, 1.5, 192, G); box(120, 0.1, 0.1, M(0x9a9a9a), 0, 2.9, 192, G);
    for (let i = 0; i < 3; i++) { const h = mesh(new THREE.CylinderGeometry(14, 14, 50, 16, 1, false, 0, Math.PI), M(0x9aa0a4, { side: THREE.DoubleSide }), -70 + i * 70, 0, 230, G, false); h.rotation.z = Math.PI / 2; h.rotation.y = Math.PI / 2; }
    box(4, 30, 4, M(0x8a8a8a), 55, 15, 205, G); box(8, 5, 8, M(0x3a4a5a, { emissive: 0x203040 }), 55, 32, 205, G); B.blink.push(mesh(new THREE.SphereGeometry(0.8, 8, 6), new THREE.MeshBasicMaterial({ color: 0xff3a2a, toneMapped: false }), 55, 36, 205, G, false));
    WB.shophouse(G, B, d, -22, -150, 14, 10, 1, Math.PI / 2, 0xe8d0a0, '66号公路旅馆'); box(12, 0.4, 8, M(0xd02a2a), 22, 4.5, -140, G); for (const z of [-143, -137]) box(0.4, 4.4, 0.4, M(0xeeeeee), 22, 2.2, z, G); WORLD.col(d, 21, -144, 23, -136, 3);
    for (let i = 0; i < 30; i++) { const x = (r() - 0.5) * 70, z = -170 + r() * 340; if (Math.abs(x) < 7) continue; const c = mesh(new THREE.CylinderGeometry(0.3, 0.35, 2.4, 6), M(0x4a7a3a), x, 1.2, z, G); mesh(new THREE.CylinderGeometry(0.2, 0.22, 1, 6), M(0x4a7a3a), x + 0.5, 1.6, z, G).rotation.z = 0.9; }
    for (let z = -170; z < 180; z += 22) { WB.lamp(G, B, -5.5, z, 0xffe0a0); }
    B.anim.push(() => { const v = Math.sin(now * 3) > 0.6; B.blink.forEach(m => m.visible = v); });
  },
});
// ---------- 喜马拉雅 ----------
WB.flags = function (G, a, b, y0, n = 14) { const cols = [0x2a6ad0, 0xf0f0f0, 0xd02a2a, 0x3a9a4a, 0xf0c02a]; for (let i = 0; i <= n; i++) { const t = i / n, x = a[0] + (b[0] - a[0]) * t, z = a[1] + (b[1] - a[1]) * t, y = y0 - Math.sin(t * Math.PI) * 2.2; const f = box(0.7, 0.9, 0.04, M(cols[i % 5], { side: THREE.DoubleSide }), x, y - 0.45, z, G); f.rotation.y = Math.atan2(b[0] - a[0], b[1] - a[1]) + Math.PI / 2; } };
WORLD.reg({
  key: 'him', title: '喜马拉雅', sub: '雪域高原 · 云端古寺', x: 3000, z: 6000, hx: 110, hz: 200,
  entry: { x: 0, z: -170, yaw: 0 }, bgm: 'snow', mapBg: '#2a3442', mapLand: '#e8eef4',
  light: { sun: 2.6, sunC: 0xfff0e0, hemi: [0xdce8ff, 0x6a6a7a, 1.15], fog: [0xd8e2ee, 220, 1900] },
  lightN: { sun: 0.7, sunC: 0x9ab0ff, hemi: [0x6a7ab8, 0x2a2a3a, 0.9], fog: [0x1a2236, 160, 1300] },
  sky: [0x1a4aa8, 0x7aa8e0, 0xe8eef6], skyN: [0x01030a, 0x0a1430, 0x283454],
  walk: [{ t: 'circ', x: 0, z: -150, r: 40 }, { t: 'seg', a: [0, -115], b: [-45, -50], w: 7 }, { t: 'circ', x: -45, z: -40, r: 24 }, { t: 'seg', a: [-40, -20], b: [55, 35], w: 4.5 }, { t: 'circ', x: 60, z: 55, r: 30 }, { t: 'seg', a: [50, 82], b: [0, 160], w: 7 }, { t: 'circ', x: 0, z: 170, r: 18 }],
  gates: { snow: { x: -52, z: -50, yaw: Math.PI * 0.75, label: '雪山栈道', sub: '风雪很大' }, bell: { x: 68, z: 72, yaw: Math.PI, label: '钟楼古寺' }, yy: { x: 0, z: 178, yaw: Math.PI, label: '阴阳台', sub: '天梯尽头' } },
  marks: [{ id: 'village', name: '雪山脚下的村子', x: 0, z: -150, r: 14 }, { id: 'bridge', name: '万丈深渊吊桥', sub: '千万别往下看', x: 8, z: 8, r: 10 }, { id: 'buddha', name: '摩崖大佛', sub: '整面山崖雕成的佛像', x: 60, z: 55, r: 18 }, { id: 'ladder', name: '天梯', sub: '一千级台阶直上云端', x: 25, z: 120, r: 10 }],
  chests: [{ id: 'h1', x: 30, z: -160, items: { tea: 2 } }, { id: 'h2', x: -60, z: -30, items: { scroll: 1 } }, { id: 'h3', x: 80, z: 40, items: { wine: 1 } }, { id: 'h4', x: -12, z: 172, xp: 60 }],
  packs: [{ x: -40, z: -30, types: ['ninja', 'ninja'] }, { x: 55, z: 45, types: ['khan', 'ninja'] }, { x: 15, z: 140, types: ['ninja', 'ninja', 'khan'], aggro: 10 }],
  villagers: [{ x: 10, z: -140, path: [[10, -140], [-20, -160], [15, -170]], look: { hat: 'monk', cloth: 0x9a2a2a } }, { x: -14, z: -132, look: { hat: 'none', cloth: 0x6a4a2a } }, { x: 52, z: 66, path: [[52, 66], [72, 48], [60, 40]], look: { hat: 'monk', cloth: 0xc8862a } }],
  quests: [{ id: 'yak', title: '走失的牦牛铃', goal: '把 4 只牦牛铃找回来', type: 'collect', item: '牦牛铃', giver: { x: -10, z: -158, yaw: Math.PI / 2, name: '放牧的扎西', look: { hat: 'none', cloth: 0x7a3a2a } }, spots: [[30, -128], [-60, -48], [70, 30], [10, 150]],
    intro: [{ who: 'npc', text: '一场暴风雪，我家牦牛脖子上的铃铛全掉了，散在山路上……没有铃铛，起雾的时候就找不到它们了。' }, { who: 'jackie', text: '我正好要上山，顺路帮你找！' }],
    done: [{ who: 'npc', text: '叮叮当当，一个不少！这是我阿妈煮的酥油茶，暖暖身子。' }, { who: 'jackie', text: '谢谢扎西！' }], remind: '铃铛亮晶晶的，雪地里好找。', thanks: '扎西德勒！一路平安！', reward: { xp: 120, items: { tea: 2 } } },
   { id: 'monk', title: '武僧的考验', goal: '接下守山武僧的三招', type: 'duel', foe: 'khan', giver: { x: 48, z: 62, yaw: Math.PI / 2, name: '守山武僧', look: { hat: 'monk', cloth: 0xd8962a } },
    intro: [{ who: 'npc', text: '施主，上天梯之前，先让贫僧看看你的功夫是否够格。' }, { who: 'jackie', text: '大师，请手下留情……' }],
    done: [{ who: 'npc', text: '阿弥陀佛，施主身手不凡。这卷心法，望你善用。' }], remind: '施主，请出招吧。', thanks: '阿弥陀佛，施主一路走好。', reward: { xp: 130, items: { scroll: 1 } } }],
  onNight(B, on) { WB.night(B, on); },
  build(G, d, B) {
    B.d = d; Object.assign(B, { lit: [], lampsM: [], lanterns: [], blink: [], nightOnly: [], dyn: [] });
    const hf = (x, z) => { const w = walkDist(d, x, z); if (w < 1.5) return -0.05; if (w < 70) return -0.05 - Math.min(1, (w - 1.5) / 6) * 320 + fbm(x / 20, z / 20, 3) * 30; return -320 + Math.min(1300, (w - 70) * 2.2 + fbm(x / 160, z / 160) * 600 * Math.min(1, (w - 70) / 200)); };
    const cf = (h, x, z) => { const c = new THREE.Color(); if (h > 120 || (h > -1 && h < 1)) c.set(0xf4f8fc); else if (h > -60) c.set(0x9a9aa4); else c.set(0x5a5a68); return c.lerp(new THREE.Color(0xc8d4e4), fbm(x / 10, z / 10, 2) * 0.4); };
    terrainMesh(3400, 3400, 180, hf, cf, G, 0, 0);
    // 可走的雪地平台：每个平台一块雪盘
    for (const s of d.walk) if (s.t === 'circ') mesh(new THREE.CylinderGeometry(s.r + 1, s.r - 3, 6, 32), M(0xf0f4f8), s.x, -3, s.z, G, false);
    // 吊桥
    { const a = [-40, -20], b = [55, 35], L = Math.hypot(b[0] - a[0], b[1] - a[1]), yaw = Math.atan2(b[0] - a[0], b[1] - a[1]), K = new THREE.Group(); K.position.set((a[0] + b[0]) / 2, 0, (a[1] + b[1]) / 2); K.rotation.y = yaw; G.add(K);
      for (let i = 0; i < L; i += 1.2) box(4.6, 0.12, 0.9, M(0x7a5a3a), 0, 0, -L / 2 + i, K); for (const s of [-1, 1]) { const pts = []; for (let i = 0; i <= 20; i++) pts.push(new THREE.Vector3(s * 2.4, 1.2 + Math.abs(i - 10) * 0.08, -L / 2 + L * i / 20)); mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, 0.06, 4), M(0x5a4a3a), 0, 0, 0, K, false); }
      for (const e of [-1, 1]) for (const s of [-1, 1]) box(0.4, 2.4, 0.4, M(0x6a4a2a), s * 2.5, 1.2, e * L / 2, K); WB.flags(K, [-2.4, -L / 2], [-2.4, L / 2], 3, 30); }
    // 摩崖大佛（雕在东边的山崖上）
    { const K = new THREE.Group(); K.position.set(120, -40, 70); K.rotation.y = -Math.PI / 2; G.add(K); const st = M(0xc8b8a0, { flatShading: true });
      box(120, 200, 20, M(0x8a8a90), 0, 60, -14, K); mesh(new THREE.SphereGeometry(30, 16, 12), st, 0, 30, 0, K, false).scale.set(1.6, 0.9, 0.8); mesh(new THREE.CylinderGeometry(22, 30, 70, 14), st, 0, 85, 0, K, false); mesh(new THREE.SphereGeometry(17, 16, 12), st, 0, 135, 2, K, false);
      mesh(new THREE.SphereGeometry(10, 12, 8), st, 0, 150, 0, K, false); for (const s of [-1, 1]) mesh(new THREE.BoxGeometry(5, 20, 3), st, s * 15, 130, 2, K, false); }
    // 钟楼古寺 + 天梯 + 阴阳台
    { const K = new THREE.Group(); K.position.set(72, 0, 80); G.add(K); box(18, 9, 12, M(0xa82a22), 0, 4.5, 6, K); WB.roof(K, 0, 11, 6, 22, 16, 0xc8962a); box(8, 18, 8, M(0xd8c8a8), -14, 9, 4, K); WB.roof(K, -14, 20, 4, 11, 11, 0x2a2a2a); WORLD.col(d, 63, 80, 81, 92, 9); WORLD.col(d, 54, 80, 62, 88, 18); }
    { const a = [50, 82], b = [0, 160], n = 60; for (let i = 0; i < n; i++) { const t = i / n; const s = box(7.5, 0.4, 1.4, M(0xd8d0c4), a[0] + (b[0] - a[0]) * t, 0.05, a[1] + (b[1] - a[1]) * t, G); s.rotation.y = Math.atan2(b[0] - a[0], b[1] - a[1]); }
      for (let i = 0; i < 8; i++) { const t = i / 8, x = a[0] + (b[0] - a[0]) * t, z = a[1] + (b[1] - a[1]) * t; for (const s of [-1, 1]) { const px = x + s * 4.2 * Math.cos(-0.57), pz = z + s * 4.2 * Math.sin(0.57); box(0.5, 3, 0.5, M(0xa82a22), px, 1.5, pz, G); WB.lantern(G, B, px, 3.3, pz, 0.8); } } }
    { const K = new THREE.Group(); K.position.set(0, 0, 175); G.add(K); const yin = canvasTex(256, 256, (g) => { g.fillStyle = '#111'; g.fillRect(0, 0, 256, 256); g.fillStyle = '#f4f4f4'; g.beginPath(); g.arc(128, 128, 126, -Math.PI / 2, Math.PI / 2); g.fill(); g.beginPath(); g.arc(128, 64, 63, 0, TAU); g.fill(); g.fillStyle = '#111'; g.beginPath(); g.arc(128, 192, 63, 0, TAU); g.fill(); g.beginPath(); g.arc(128, 64, 18, 0, TAU); g.fill(); g.fillStyle = '#f4f4f4'; g.beginPath(); g.arc(128, 192, 18, 0, TAU); g.fill(); });
      const disc = mesh(new THREE.CircleGeometry(9, 48), M(0xffffff, { map: yin }), 0, 0.06, 0, K, false); disc.rotation.x = -Math.PI / 2; B.dyn = [disc]; B.anim.push(dt => disc.rotation.z += dt * 0.2); }
    // 远处的雪峰（巨大）
    let seed = 11; const r = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
    for (let i = 0; i < 9; i++) { const a = i / 9 * TAU + r(), dist = 900 + r() * 500, h = 700 + r() * 700; const c = mesh(new THREE.ConeGeometry(h * 0.6, h, 7, 3), M(0xe8eef4, { flatShading: true }), Math.cos(a) * dist, h / 2 - 200, Math.sin(a) * dist, G, false); c.rotation.y = r() * 3; }
    // 冰瀑
    { const ice = mesh(new THREE.PlaneGeometry(40, 260), new THREE.MeshBasicMaterial({ color: 0xbfe8ff, transparent: true, opacity: 0.7, side: THREE.DoubleSide, toneMapped: false }), -130, -40, -60, G, false); ice.rotation.y = Math.PI / 2; }
    // 村子：石屋、经幡、玛尼堆
    for (let i = 0; i < 7; i++) { const a = i / 7 * TAU + 0.3, x = Math.cos(a) * 30, z = -150 + Math.sin(a) * 30; if (z > -125 && x < 10 && x > -20) continue; WB.shophouse(G, B, d, x, z, 7, 6, 1 + (i % 2), Math.atan2(-x, -150 - z), 0xe8e0d0); }
    WB.flags(G, [-30, -140], [30, -160], 6); WB.flags(G, [-20, -180], [25, -120], 7);
    for (const [x, z] of [[-45, -40], [60, 55], [0, 170]]) { WB.flags(G, [x - 15, z - 10], [x + 15, z + 10], 6, 12); }
    // 飘雪
    { const g = new THREE.BufferGeometry(), P = []; for (let i = 0; i < 3000; i++) P.push((r() - 0.5) * 120, r() * 50, (r() - 0.5) * 120); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); const sn = new THREE.Points(g, new THREE.PointsMaterial({ color: 0xffffff, size: 0.18, transparent: true, opacity: 0.8, depthWrite: false })); sn.frustumCulled = false; scene.add(sn); B.snow = sn; sn.visible = false;
      B.anim.push(dt => { sn.visible = true; sn.position.set(player.pos.x, 0, player.pos.z); const p = g.attributes.position; for (let i = 0; i < p.count; i++) { let y = p.getY(i) - dt * 3; if (y < 0) y += 50; p.setY(i, y); p.setX(i, p.getX(i) + Math.sin(now + i) * dt * 0.5); } p.needsUpdate = true; }); }
  },
});
// ---------- 天界仙山 ----------
WORLD.reg({
  key: 'sky', title: '天界仙山', sub: '十二生肖守护的云上神域', x: 3000, z: 9000, hx: 110, hz: 190,
  entry: { x: 0, z: -160, yaw: 0 }, bgm: 'sky', mapBg: '#f4e8d8', mapLand: '#7ab86a',
  light: { sun: 2.6, sunC: 0xfff0c8, hemi: [0xfff0e0, 0xb0a0c0, 1.25], fog: [0xf0dcc8, 260, 2000] },
  lightN: { sun: 1.2, sunC: 0xd0b0ff, hemi: [0x8a7ad0, 0x40305a, 1.05], fog: [0x2a2040, 200, 1500] },
  sky: [0x5a8ae0, 0xf0c8a8, 0xfff0d8], skyN: [0x0a0820, 0x3a2a6a, 0x8a5a8a],
  walk: [{ t: 'circ', x: 0, z: -150, r: 26 }, { t: 'seg', a: [0, -126], b: [-50, -64], w: 5 }, { t: 'circ', x: -55, z: -40, r: 30 }, { t: 'seg', a: [-30, -30], b: [25, 25], w: 5 }, { t: 'circ', x: 45, z: 40, r: 28 }, { t: 'seg', a: [35, 66], b: [8, 118], w: 6 }, { t: 'circ', x: 0, z: 145, r: 32 }],
  gates: { ptemple: { x: 0, z: 168, yaw: Math.PI, label: '天门神殿', sub: '圣主的封印之地' } },
  marks: [{ id: 'gate', name: '南天门', sub: '比山还高的天门', x: 0, z: 130, r: 16 }, { id: 'ring', name: '生肖环', sub: '十二块神石环绕仙山', x: -55, z: -40, r: 18 }, { id: 'fall', name: '云海飞瀑', x: 45, z: 40, r: 16 }],
  chests: [{ id: 's1', x: 18, z: -158, items: { tea: 1 } }, { id: 's2', x: -75, z: -40, items: { scroll: 1 } }, { id: 's3', x: 66, z: 46, items: { wine: 2 } }, { id: 's4', x: -24, z: 150, xp: 80, items: { bun: 2 } }],
  packs: [{ x: -55, z: -30, types: ['sninja', 'sninja'] }, { x: 45, z: 40, types: ['skhan', 'sninja'] }, { x: 0, z: 128, types: ['sninja', 'skhan', 'sninja'], aggro: 10 }],
  villagers: [{ x: 6, z: -140, look: { hat: 'none', cloth: 0xf0f0ff, glow: 0x6a8aff } }, { x: -48, z: -55, path: [[-48, -55], [-70, -30], [-40, -20]], look: { hat: 'monk', cloth: 0xffe0a0, glow: 0xffc84a } }],
  quests: [{ id: 'lamp', title: '天灯', goal: '点亮散落在仙山的 4 盏天灯', type: 'collect', item: '天灯', giver: { x: -6, z: -140, yaw: Math.PI / 2, name: '守灯仙童', look: { hat: 'none', cloth: 0xfff0f0, glow: 0xff9ad8, s: 0.8 } }, spots: [[-20, -165], [-75, -55], [62, 25], [25, 150]],
    intro: [{ who: 'npc', text: '圣主的黑气把天灯都吹灭了……没有灯，迷路的灵魂就找不到回家的路。' }, { who: 'jackie', text: '别担心，我帮你一盏一盏点回来。' }],
    done: [{ who: 'npc', text: '灯都亮了！谢谢你，凡人。这壶仙茶喝了可以身轻如燕哦。' }], remind: '还有几盏灯是暗的哦。', thanks: '天灯会一直为你亮着的。', reward: { xp: 150, items: { tea: 2, scroll: 1 } } }],
  onNight(B, on) { WB.night(B, on); },
  build(G, d, B) {
    B.d = d; Object.assign(B, { lit: [], lampsM: [], lanterns: [], blink: [], nightOnly: [], dyn: [] });
    // 浮岛：每个平台下面是倒锥形的岩石
    for (const s of d.walk) if (s.t === 'circ') WB.island(G, s.x, 0, s.z, s.r + 2);
    // 云桥
    for (const s of d.walk) if (s.t === 'seg') { const L = Math.hypot(s.b[0] - s.a[0], s.b[1] - s.a[1]), yaw = Math.atan2(s.b[0] - s.a[0], s.b[1] - s.a[1]); const K = new THREE.Group(); K.position.set((s.a[0] + s.b[0]) / 2, 0, (s.a[1] + s.b[1]) / 2); K.rotation.y = yaw; G.add(K);
      box(s.w, 0.5, L + 4, M(0xf4ecd8), 0, -0.25, 0, K); for (const sx of [-1, 1]) { box(0.3, 1, L + 4, M(0xd8b04a), sx * s.w / 2, 0.5, 0, K); for (let i = -L / 2; i <= L / 2; i += 6) WB.lantern(K, B, sx * s.w / 2, 1.4, i, 0.7); } }
    // 云海
    { const t = canvasTex(256, 256, (g, W, H) => { g.fillStyle = '#fff'; g.fillRect(0, 0, W, H); for (let i = 0; i < 60; i++) { const x = Math.random() * W, y = Math.random() * H, r = 20 + Math.random() * 40; const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, 'rgba(220,210,240,.6)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, W, H); } }, [30, 30]);
      for (const [y, o] of [[-70, 1], [-40, 0.55]]) { const c = mesh(new THREE.PlaneGeometry(6000, 6000), new THREE.MeshBasicMaterial({ map: t, transparent: true, opacity: o, depthWrite: false, color: 0xfff4ee }), 0, y, 0, G, false); c.rotation.x = -Math.PI / 2; B.anim.push(dt => { t.offset.x += dt * 0.002; }); } }
    // 南天门：巨大的牌楼
    WB.paifang(G, B, 0, 128, Math.PI, '南天門', 6); 
    // 天门神殿（在最北的岛后面）
    { const K = new THREE.Group(); K.position.set(0, 0, 200); G.add(K); for (let i = 0; i < 4; i++) { const r = 34 - i * 7; mesh(new THREE.CylinderGeometry(r, r + 2, 14, 8), M(i % 2 ? 0xc8302a : 0xf4ecd8), 0, 7 + i * 16, 0, K, false); mesh(new THREE.CylinderGeometry(r * 0.6, r * 1.45, 6, 8), M(0xe0b040), 0, 16 + i * 16, 0, K, false); }
      WB.island(G, 0, 0, 200, 40); mesh(new THREE.SphereGeometry(6, 16, 12), new THREE.MeshBasicMaterial({ color: 0xffe08a, toneMapped: false }), 0, 76, 0, K, false); }
    // 十二生肖神石：环绕仙山缓缓转动
    { const ring = new THREE.Group(); G.add(ring); ring.position.set(0, 0, 0); RUNES.forEach((R, i) => { const a = i / 12 * TAU, K = new THREE.Group(); K.position.set(Math.cos(a) * 340, 70 + Math.sin(i * 1.7) * 30, Math.sin(a) * 340); ring.add(K);
        WB.island(K, 0, -8, 0, 22, 0x8aba7a); const disc = mesh(new THREE.CylinderGeometry(16, 16, 3, 32), M(0xd8d0c0), 0, 14, 0, K, false); disc.rotation.x = Math.PI / 2;
        const tx = canvasTex(256, 256, (g) => { g.fillStyle = '#d8d0c0'; g.fillRect(0, 0, 256, 256); g.strokeStyle = R.color; g.lineWidth = 12; g.beginPath(); g.arc(128, 128, 112, 0, TAU); g.stroke(); g.fillStyle = R.color; g.font = 'bold 150px "Noto Sans SC",serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(R.name, 128, 136); });
        for (const s of [1, -1]) { const f = mesh(new THREE.CircleGeometry(15, 32), new THREE.MeshBasicMaterial({ map: tx, toneMapped: false }), 0, 14, s * 1.6, K, false); if (s < 0) f.rotation.y = Math.PI; }
        K.lookAt(0, K.position.y, 0); });
      B.dyn = [ring]; B.anim.push(dt => ring.rotation.y += dt * 0.01); }
    // 瀑布（从岛边落进云海）
    for (const [x, z, w] of [[70, 52, 10], [-82, -50, 8], [22, -170, 6]]) { const f = mesh(new THREE.PlaneGeometry(w, 90), new THREE.MeshBasicMaterial({ color: 0xcfeaff, transparent: true, opacity: 0.6, side: THREE.DoubleSide, toneMapped: false }), x, -44, z, G, false); f.lookAt(0, -44, 0); }
    // 远方的仙山
    let seed = 5; const r = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
    for (let i = 0; i < 14; i++) { const a = r() * TAU, dist = 600 + r() * 900, h = 200 + r() * 500; const K = new THREE.Group(); K.position.set(Math.cos(a) * dist, -60 - r() * 90, Math.sin(a) * dist); G.add(K); const c = mesh(new THREE.ConeGeometry(h * 0.25, h, 6, 2), M(0x6a9a7a, { flatShading: true }), 0, h / 2, 0, K, false); WB.island(K, 0, 0, 0, h * 0.27, 0x7aba7a); mesh(new THREE.ConeGeometry(h * 0.08, h * 0.25, 6), M(0xf4f4f0), 0, h * 0.9, 0, K, false); }
    // 仙鹤
    for (let i = 0; i < 6; i++) { const b = new THREE.Group(); G.add(b); B.dyn.push(b); box(1.4, 0.3, 0.3, M(0xffffff), 0, 0, 0, b); const wl = box(0.1, 0.05, 2.4, M(0xffffff), 0, 0, 1.2, b), wr = box(0.1, 0.05, 2.4, M(0xffffff), 0, 0, -1.2, b); const ph = i * 1.3, R = 60 + i * 25;
      B.anim.push(() => { const a = now * 0.08 + ph; b.position.set(Math.cos(a) * R, 25 + i * 6 + Math.sin(now + i) * 3, Math.sin(a) * R); b.rotation.y = -a; wl.rotation.x = Math.sin(now * 4 + i) * 0.5; wr.rotation.x = -wl.rotation.x; }); }
    for (const s of d.walk) if (s.t === 'circ') for (let i = 0; i < 5; i++) { const a = i / 5 * TAU + s.x; WB.tree(G, s.x + Math.cos(a) * (s.r - 3), s.z + Math.sin(a) * (s.r - 3), 1.3, 0xf0a0c0); }
  },
});
