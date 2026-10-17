// ================= 大地图 1：龙城湾区（第一~三、六~九集的场景都在这片城市里） =================
// 公用小工具（p68 也会用到）
const WB = {
  winTex(night) { return canvasTex(64, 128, (g, w, h) => { g.fillStyle = night ? '#000' : '#5a6878'; g.fillRect(0, 0, w, h); for (let y = 4; y < h; y += 16) for (let x = 4; x < w; x += 16) { const on = Math.random(); g.fillStyle = night ? (on > 0.45 ? `rgba(255,${200 + Math.random() * 40 | 0},140,${0.6 + Math.random() * 0.4})` : '#000') : (on > 0.5 ? '#9fc4e0' : '#3a4a5a'); g.fillRect(x, y, 9, 11); } }); },
  uvBox(w, h, d, s = 4) { const g = new THREE.BoxGeometry(w, h, d), uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * Math.max(1, Math.round(Math.max(w, d) / s)), uv.getY(i) * Math.max(1, Math.round(h / s))); return g; },
  tower(G, B, x, z, w, h, d, col, cap) {
    const mat = M(col, { map: B.winD, emissiveMap: B.winN, emissive: 0xffffff, emissiveIntensity: 0 }); B.lit.push(mat);
    const m = mesh(WB.uvBox(w, h, d), mat, x, h / 2, z, G, false); m.receiveShadow = false;
    if (cap) { mesh(new THREE.BoxGeometry(w * 0.7, h * 0.06, d * 0.7), M(col), x, h + h * 0.03, z, G, false); const sp = mesh(new THREE.CylinderGeometry(0.3, 1, h * 0.18, 6), M(0xc8ccd4), x, h * 1.15, z, G, false); B.blink.push(mesh(new THREE.SphereGeometry(1.4, 8, 6), new THREE.MeshBasicMaterial({ color: 0xff3a2a, toneMapped: false }), x, h * 1.25, z, G, false)); }
    return m;
  },
  tree(G, x, z, s = 1, c = 0x3f7a3a) { mesh(new THREE.CylinderGeometry(0.15 * s, 0.22 * s, 2 * s, 6), M(0x5a3a22), x, s, z, G); mesh(new THREE.IcosahedronGeometry(1.3 * s, 0), M(c, { flatShading: true }), x, 2.6 * s, z, G); },
  lamp(G, B, x, z, c = 0xffd27a) { mesh(new THREE.CylinderGeometry(0.07, 0.1, 4, 6), M(0x2a2a30), x, 2, z, G); const b = mesh(new THREE.SphereGeometry(0.28, 8, 6), new THREE.MeshBasicMaterial({ color: c, toneMapped: false }), x, 4.1, z, G, false); B.lampsM.push(b); },
  lantern(G, B, x, y, z, s = 1) { const m = mesh(new THREE.SphereGeometry(0.35 * s, 10, 8), new THREE.MeshBasicMaterial({ color: 0xff3a2a, toneMapped: false }), x, y, z, G, false); m.scale.y = 1.25; B.lanterns.push(m); },
  roof(G, x, y, z, w, d, c = 0x2a5a3a) { const r = mesh(new THREE.ConeGeometry(Math.hypot(w, d) * 0.62, Math.min(w, d) * 0.35, 4), M(c), x, y, z, G); r.rotation.y = Math.PI / 4; r.scale.set(w / Math.hypot(w, d) * 1.4, 1, d / Math.hypot(w, d) * 1.4); return r; },
  // 悬链线大桥：x 从 a 到 b，塔在 t1/t2
  bridge(G, z, a, b, t1, t2, deckY, tH, col) {
    const red = M(col, { emissive: 0x200000 }), K = new THREE.Group(); G.add(K);
    mesh(new THREE.BoxGeometry(b - a, 3, 28), M(0x6a3020), (a + b) / 2, deckY, z, K, false);
    mesh(new THREE.BoxGeometry(b - a, 2.5, 1.2), red, (a + b) / 2, deckY + 2.5, z - 13.5, K, false); mesh(new THREE.BoxGeometry(b - a, 2.5, 1.2), red, (a + b) / 2, deckY + 2.5, z + 13.5, K, false);
    for (const tx of [t1, t2]) { for (const s of [-1, 1]) mesh(new THREE.BoxGeometry(7, tH, 6), red, tx, tH / 2, z + s * 14, K, false); for (const y of [deckY - 6, tH * 0.55, tH * 0.8, tH - 4]) mesh(new THREE.BoxGeometry(6, 5, 28), red, tx, y, z, K, false); mesh(new THREE.CylinderGeometry(11, 13, 14, 12), M(0x7a7a80), tx, 2, z, K, false); }
    const yAt = x => { if (x < t1) return deckY + 4 + (tH - deckY - 4) * Math.pow((x - a) / (t1 - a), 2); if (x > t2) return deckY + 4 + (tH - deckY - 4) * Math.pow((b - x) / (b - t2), 2); const u = (x - (t1 + t2) / 2) / ((t2 - t1) / 2); return deckY + 6 + (tH - deckY - 8) * u * u; };
    const susp = new THREE.InstancedMesh(new THREE.BoxGeometry(0.35, 1, 0.35), red, 2 * Math.ceil((b - a) / 12)); let n = 0; const o = new THREE.Object3D();
    for (const s of [-1, 1]) { const pts = []; for (let x = a; x <= b; x += 8) pts.push(new THREE.Vector3(x, yAt(x), z + s * 14)); mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 160, 0.9, 6), red, 0, 0, 0, K, false);
      for (let x = a + 6; x < b; x += 12) { const y1 = yAt(x), y0 = deckY + 2; if (y1 - y0 < 1.5) continue; o.position.set(x, (y0 + y1) / 2, z + s * 14); o.scale.set(1, y1 - y0, 1); o.updateMatrix(); susp.setMatrixAt(n++, o.matrix); } }
    susp.count = n; K.add(susp); return K;
  },
  water(G, x, z, w, d, c = 0x1f4f72) { const t = canvasTex(256, 256, (g, W, H) => { g.fillStyle = '#' + c.toString(16).padStart(6, '0'); g.fillRect(0, 0, W, H); for (let i = 0; i < 500; i++) { g.fillStyle = `rgba(255,255,255,${Math.random() * 0.12})`; g.fillRect(Math.random() * W, Math.random() * H, 8 + Math.random() * 20, 1.5); } }, [w / 30, d / 30]);
    const m = mesh(new THREE.PlaneGeometry(w, d), MS(0xffffff, { map: t, roughness: 0.25, metalness: 0.2 }), x, -1.2, z, G, false); m.rotation.x = -Math.PI / 2; m.userData.tex = t; return m; },
  ground(G, w, d, c1, c2, rep = 40) { const t = canvasTex(256, 256, (g, W, H) => { g.fillStyle = c1; g.fillRect(0, 0, W, H); for (let i = 0; i < 900; i++) { g.fillStyle = Math.random() > 0.5 ? c2 : 'rgba(0,0,0,.06)'; g.fillRect(Math.random() * W, Math.random() * H, 2 + Math.random() * 5, 2 + Math.random() * 5); } }, [rep, rep * d / w]);
    const m = mesh(new THREE.PlaneGeometry(w, d), M(0xffffff, { map: t }), 0, 0, 0, G, false); m.rotation.x = -Math.PI / 2; m.receiveShadow = true; return m; },
  strip(G, x0, z0, x1, z1, w, c, y = 0.02) { const L = Math.hypot(x1 - x0, z1 - z0), m = mesh(new THREE.PlaneGeometry(w, L), M(c), (x0 + x1) / 2, y, (z0 + z1) / 2, G, false); m.rotation.x = -Math.PI / 2; m.rotation.z = Math.atan2(x0 - x1, z0 - z1); m.receiveShadow = true; return m; },
  night(B, on) { B.lit.forEach(m => m.emissiveIntensity = on ? 1.1 : 0); B.lampsM.forEach(m => m.material.color.set(on ? 0xffd27a : 0x8a8270)); B.lanterns.forEach(m => m.material.color.set(on ? 0xff4a2a : 0xa83a2a)); (B.nightOnly || []).forEach(o => o.visible = on); },
};
// 小楼：唐人街两三层的骑楼，带招牌和灯笼
WB.shophouse = function (G, B, d, x, z, w, dp, fl, yaw, col, sign) {
  const H = fl * 3.4, K = new THREE.Group(); K.position.set(x, 0, z); K.rotation.y = yaw; G.add(K);
  const wall = M(col), trim = M(0xe8dcc0);
  box(w, H, dp, wall, 0, H / 2, 0, K); box(w + 0.4, 0.4, dp + 0.4, trim, 0, H + 0.2, 0, K);
  for (let f = 0; f < fl; f++) for (let i = 0; i < Math.floor(w / 2.6); i++) { const wx = -w / 2 + 1.3 + i * 2.6 + (w % 2.6) / 2; const wm = M(0x2a3440, { emissive: 0xffb860, emissiveIntensity: 0 }); B.lit.push(wm); box(1.2, 1.5, 0.1, wm, wx, f * 3.4 + 1.9, dp / 2 + 0.03, K); }
  box(w, 0.25, 1.6, M(0x7a2a22), 0, 3.3, dp / 2 + 0.8, K);
  if (sign) { const s = labelSprite(sign, '#ffd04a', 0.9); s.position.set(0, 4.3, dp / 2 + 0.2); K.add(s); }
  for (let i = 0; i < 3; i++) WB.lantern(K, B, -w / 3 + i * w / 3, 2.7, dp / 2 + 1.4);
  WB.roof(K, 0, H + 0.4 + Math.min(w, dp) * 0.17, 0, w + 1, dp + 1, [0x2a5a3a, 0x7a2a22, 0x3a3a4a][Math.abs(Math.round(x + z)) % 3]);
  const cs = Math.abs(Math.cos(yaw)), sn = Math.abs(Math.sin(yaw)), dg = Math.min(cs, sn) > 0.2 ? 0.8 : 1, c = [(cs * w + sn * dp) * dg, (sn * w + cs * dp) * dg]; WORLD.col(d, x - c[0] / 2, z - c[1] / 2, x + c[0] / 2, z + c[1] / 2, H);
  return K;
};
WB.paifang = function (G, B, x, z, yaw, title, s = 1) {
  const K = new THREE.Group(); K.position.set(x, 0, z); K.rotation.y = yaw; K.scale.setScalar(s); G.add(K);
  const red = M(0xb02a1e), gold = M(0xe0b040), green = M(0x2a6a4a);
  for (const px of [-5, -2, 2, 5]) mesh(new THREE.CylinderGeometry(0.35, 0.4, px % 5 ? 8 : 6, 10), red, px, px % 5 ? 4 : 3, 0, K);
  box(11.5, 0.8, 0.8, red, 0, 6.2, 0, K); box(5, 1.6, 0.4, gold, 0, 7.3, 0, K); box(12.5, 0.6, 1.6, green, 0, 8.4, 0, K); box(5.5, 0.5, 2, green, 0, 9.5, 0, K);
  for (const sx of [-1, 1]) { const r = box(1.2, 0.3, 1.8, green, sx * 6.4, 8.7, 0, K); r.rotation.z = sx * -0.35; }
  const t = labelSprite(title, '#2a1a10', 0.8); t.material.depthTest = true; t.position.set(0, 7.3, 0.35); K.add(t);
  WB.lantern(K, B, -3.5, 5.3, 0.6); WB.lantern(K, B, 3.5, 5.3, 0.6);
  if (B.d) for (const px of [-5, -2, 2, 5]) { const wx = x + Math.cos(yaw) * px * s, wz = z - Math.sin(yaw) * px * s; WORLD.col(B.d, wx - 0.5 * s, wz - 0.5 * s, wx + 0.5 * s, wz + 0.5 * s, 8); }
  return K;
};
WB.pagoda = function (G, B, x, z, n = 9, r = 7) {
  const K = new THREE.Group(); K.position.set(x, 0, z); G.add(K); let y = 0;
  box(r * 2.6, 1.6, r * 2.6, M(0x8a8478), 0, 0.8, 0, K); y = 1.6;
  for (let i = 0; i < n; i++) { const rr = r * (1 - i * 0.07), h = 4.2 - i * 0.12;
    mesh(new THREE.CylinderGeometry(rr * 0.8, rr * 0.85, h, 8), M(i % 2 ? 0xb02a1e : 0xc8402a), 0, y + h / 2, 0, K, false);
    const roof = mesh(new THREE.CylinderGeometry(rr * 0.55, rr * 1.35, 1.2, 8), M(0x2a5a3a), 0, y + h + 0.5, 0, K, false);
    for (let k = 0; k < 8; k++) { const a = k / 8 * TAU + Math.PI / 8; B.lanterns.push(mesh(new THREE.SphereGeometry(0.3, 8, 6), new THREE.MeshBasicMaterial({ color: 0xff4a2a, toneMapped: false }), Math.sin(a) * rr * 1.3, y + h - 0.3, Math.cos(a) * rr * 1.3, K, false)); }
    y += h + 1.1; }
  mesh(new THREE.CylinderGeometry(0.15, 0.4, 7, 8), M(0xe0b040), 0, y + 3.5, 0, K, false); return K;
};
WB.ferris = function (G, B, x, z, R, yaw) {
  const K = new THREE.Group(); K.position.set(x, 0, z); K.rotation.y = yaw; G.add(K); (B.dyn = B.dyn || []).push(K); const wh = new THREE.Group(); wh.position.y = R + 6; K.add(wh);
  const w = M(0xf0f0f0), legs = M(0xd0d0d8);
  for (const s of [-1, 1]) { mesh(new THREE.TorusGeometry(R, 0.45, 6, 64), w, 0, 0, s * 2, wh, false); for (const lx of [-1, 1]) { const l = box(0.8, R * 1.25 + 6, 0.8, legs, lx * R * 0.36, (R + 6) / 2, s * 3, K); l.rotation.z = lx * -0.3; } }
  for (let i = 0; i < 16; i++) { const a = i / 16 * TAU, sp = box(0.25, R, 0.25, w, Math.sin(a) * R / 2, Math.cos(a) * R / 2, 0, wh); sp.rotation.z = -a;
    const cab = new THREE.Group(); cab.position.set(Math.sin(a) * R, Math.cos(a) * R, 0); wh.add(cab); box(2.2, 2, 2.6, M([0xff5a4a, 0xffc84a, 0x4ac0ff, 0x7aff7a][i % 4], { emissive: 0x222222 }), 0, -1.2, 0, cab); }
  const ring = mesh(new THREE.TorusGeometry(R + 0.6, 0.18, 4, 96), new THREE.MeshBasicMaterial({ color: 0xff7ad8, toneMapped: false }), 0, 0, 0, wh, false); (B.nightOnly = B.nightOnly || []).push(ring);
  B.anim.push(dt => { wh.rotation.z += dt * 0.05; wh.children.forEach(c => { if (c.isGroup) c.rotation.z = -wh.rotation.z; }); });
  return K;
};
WB.crane = function (G, x, z, yaw, col = 0x2a6ad0) {
  const K = new THREE.Group(); K.position.set(x, 0, z); K.rotation.y = yaw; G.add(K); const m = M(col), dk = M(0x2a2a30);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(1.6, 48, 1.6, m, sx * 9, 24, sz * 10, K);
  box(20, 2.5, 22, m, 0, 48, 0, K); box(4, 3, 95, m, 0, 51, 25, K); box(3, 3, 25, m, 0, 51, -25, K); box(5, 6, 7, dk, 0, 47, -32, K);
  box(5, 3.5, 4, M(0xffd04a), 0, 46, 40, K); return K;
};
WB.containers = function (G, d, x, z, nx, nz, ny) {
  const cols = [0xc23a2a, 0x2a6ab0, 0xe0a030, 0x3a8a4a, 0xd0d0d0, 0x8a3a8a];
  for (let i = 0; i < nx; i++) for (let k = 0; k < nz; k++) { const h = 1 + ((i * 7 + k * 3) % ny); for (let y = 0; y < h; y++) box(6, 2.5, 2.4, M(cols[(i + k * 2 + y) % cols.length]), x + i * 6.2, 1.25 + y * 2.55, z + k * 2.6, G); }
  WORLD.col(d, x - 3, z - 1.2, x + (nx - 1) * 6.2 + 3, z + (nz - 1) * 2.6 + 1.2, 6);
};
WORLD.reg({
  key: 'bay', title: '龙城湾区', sub: '旧金山 · 唐人街与海湾', x: 3000, z: 0, hx: 200, hz: 215,
  entry: { x: 0, z: -132, yaw: 0 }, bgm: 'calm', bgmN: 'calm', mapBg: '#1d3a5a', mapLand: '#b8a582',
  light: { sun: 2.4, sunC: 0xffe2b8, hemi: [0xcfe4ff, 0x5a4a3a, 1.05], fog: [0xb8cde0, 260, 1500] },
  lightN: { sun: 0.55, sunC: 0x8aa0ff, hemi: [0x5868a8, 0x202030, 0.85], fog: [0x0e1426, 160, 1150] },
  sky: [0x3a78c8, 0x9cc4e8, 0xe4ecf0], skyN: [0x02040c, 0x0a1430, 0x1c2848],
  walk: [{ t: 'rect', x0: -178, x1: 178, z0: -165, z1: 146 }, { t: 'rect', x0: 40, x1: 178, z0: 140, z1: 174 }, { t: 'seg', a: [55, 170], b: [55, 206], w: 9 }, { t: 'circ', x: -60, z: 160, r: 15 }, { t: 'seg', a: [-150, 140], b: [-150, 162], w: 10 }],
  gates: {
    shop: { x: 6.5, z: -30, yaw: -Math.PI / 2, label: '老爹古董店', sub: '唐人街' },
    street: { x: 0, z: 44, yaw: Math.PI, label: '唐人街广场' },
    market: { x: -160, z: 40, yaw: Math.PI / 2, label: '夜市', sub: '鬼市入口' },
    museum: { x: -110, z: 80, yaw: Math.PI, label: '旧金山博物馆' },
    rail: { x: -166, z: -60, yaw: Math.PI / 2, label: '湾区火车站' },
    circus: { x: -110, z: -104, yaw: 0, label: '马戏团' },
    temple: { x: 0, z: -158, yaw: 0, label: '龙王庙', sub: '南山山门' },
    grave: { x: 110, z: -116, yaw: 0, label: '老墓园' },
    mall: { x: 166, z: -60, yaw: -Math.PI / 2, label: '家具城' },
    wh: { x: 140, z: 168, yaw: Math.PI, label: '黑手帮仓库' },
    dock: { x: 55, z: 202, yaw: Math.PI, label: '码头', sub: '栈桥尽头' },
  },
  marks: [{ id: 'arch', name: '唐人街牌楼', sub: '龙城湾区的心脏', x: 0, z: 52, r: 10 }, { id: 'pagoda', name: '九层宝塔', sub: '登高可望整片海湾', x: -62, z: -12, r: 14 }, { id: 'wheel', name: '海湾摩天轮', x: -60, z: 160, r: 14 }, { id: 'view', name: '大桥观景台', sub: '红色悬索桥横跨海湾', x: -150, z: 158, r: 8 }, { id: 'port', name: '集装箱码头', x: 110, z: 158, r: 16 }, { id: 'south', name: '南山山门', sub: '山顶的电视塔直入云霄', x: 0, z: -150, r: 10 }],
  chests: [{ id: 'b1', x: -172, z: 140, items: { bun: 1 } }, { id: 'b2', x: 172, z: -160, items: { wine: 1 } }, { id: 'b3', x: -68, z: 150, xp: 50, items: { tea: 1 } }, { id: 'b4', x: 172, z: 170, items: { scroll: 1 } }, { id: 'b5', x: -150, z: -158, items: { bun: 2 } }, { id: 'b6', x: 60, z: 12, items: { tea: 1 } }, { id: 'b7', x: 58, z: 186, xp: 40 }],
  packs: [{ x: -84, z: -22, types: ['thug', 'thug'] }, { x: 100, z: 20, types: ['thug', 'khan'] }, { x: 120, z: 156, types: ['ninja', 'ninja'], aggro: 10 }, { x: -60, z: 118, types: ['thug', 'thug', 'thug'] }, { x: 70, z: -128, types: ['khan', 'thug'] }],
  villagers: [
    { x: -4, z: -100, path: [[-4, -100], [-4, 120]], spd: 1.2 }, { x: 4, z: 110, path: [[4, 110], [4, -120]], spd: 1.4 }, { x: -3, z: 0, path: [[-3, 0], [-3, 90], [-3, -60]] , look: { hat: 'straw' } },
    { x: -100, z: 138, path: [[-170, 138], [30, 138]], spd: 1 }, { x: 20, z: 136, path: [[30, 136], [-160, 136]] }, { x: -60, z: 46, path: [[-150, 46], [150, 46]], spd: 1.3 },
    { x: 60, z: -54, path: [[150, -54], [-150, -54]] }, { x: 70, z: 145, path: [[70, 145], [170, 145], [170, 167], [70, 167]], look: { hat: 'straw', cloth: 0x2a4a8a } },
    { x: -40, z: -64, path: [[-40, -64], [-150, -64]], look: { hat: 'monk', cloth: 0xc8862a } }, { x: 2, z: 30 }, { x: -6, z: -40, look: { hat: 'none' } }, { x: 150, z: 120 },
  ],
  quests: [
    { id: 'bun', title: '包子铺的麻烦', goal: '打跑在后巷收保护费的打手', type: 'clear', giver: { x: -5, z: 8, yaw: Math.PI / 2, name: '包子铺王伯', look: { hat: 'none', cloth: 0xf0f0f0 } }, at: { x: -84, z: 18, types: ['thug', 'thug', 'khan'] },
      intro: [{ who: 'npc', text: '成龙先生！后巷那几个打手天天来收保护费，我这包子铺快开不下去了……' }, { who: 'jackie', text: '交给我吧，王伯。我最见不得欺负老实人的家伙。' }],
      done: [{ who: 'npc', text: '他们真被你打跑啦！来来来，刚出笼的叉烧包，拿着路上吃！' }, { who: 'jackie', text: '谢谢王伯，好香！' }], remind: '他们就在西边后巷，小心点啊！', thanks: '王伯的包子，随时管够！', reward: { xp: 90, items: { bun: 3 } } },
    { id: 'relic', title: '失落的古董', goal: '在湾区各处找回 5 件散落的古董', type: 'collect', item: '古董', giver: { x: 30, z: 128, yaw: Math.PI, name: '收破烂的阿福', look: { hat: 'straw', cloth: 0x6a5a3a } }, spots: [[140, 100], [-168, 128], [-60, -150], [150, -146], [-60, 172]],
      intro: [{ who: 'npc', text: '哎呀，我那辆三轮车翻了，收来的老古董撒得满城都是！' }, { who: 'jackie', text: '古董？要是被老爹知道了，他会骂我见死不救的……我帮你找！' }, { who: 'npc', text: '一共五件，金光闪闪的就是！看小地图上的黄点！' }],
      done: [{ who: 'npc', text: '一件都不少！这件玉坠你拿去，就当谢礼。' }, { who: 'jackie', text: '老爹一定会喜欢……不对，我自己留着！' }], remind: '还差几件呢，金光闪闪的！', thanks: '下次收到好东西，先拿给你老爹看！', reward: { xp: 120, items: { relic: 1, tea: 1 } } },
    { id: 'paper', title: '号外！号外！', goal: '40 秒内把报纸送到码头报亭', type: 'reach', time: 40, to: { x: 121, z: 149, label: '码头报亭' }, giver: { x: 5, z: 70, yaw: -Math.PI / 2, name: '报童小明', look: { hat: 'none', cloth: 0x8a3a3a, s: 0.75 } },
      intro: [{ who: 'npc', text: '成龙叔叔！码头报亭等着要今天的号外，我腿短跑不动……你能帮我送过去吗？' }, { who: 'jackie', text: '没问题，四十秒？小意思！' }],
      thanks: '成龙叔叔跑得比报纸印得还快！', remind: '快跑快跑！', reward: { xp: 70, items: { bun: 1 } } },
    { id: 'duel', title: '拳馆踢馆', goal: '和拳馆的大师兄过过招', type: 'duel', foe: 'brute', giver: { x: 30, z: -92, yaw: Math.PI, name: '洪拳馆师傅', look: { hat: 'none', cloth: 0x1a1a1a } },
      intro: [{ who: 'npc', text: '久仰成龙先生大名！我那大徒弟天天吹牛说没人打得过他，能不能请你教训教训他？' }, { who: 'jackie', text: '切磋可以，点到为止啊！' }],
      done: [{ who: 'npc', text: '好功夫！这本武学残卷是我师父传下来的，送给你！' }, { who: 'jackie', text: '谢谢师傅，我会好好练的。' }], remind: '我那徒弟就在旁边，别客气！', thanks: '有空常来拳馆坐坐！', reward: { xp: 110, items: { scroll: 1 } } },
  ],
  onNight(B, on) { WB.night(B, on); },
  build(G, d, B) { BAY_BUILD(G, d, B); },
});
function BAY_BUILD(G, d, B) {
  B.d = d; Object.assign(B, { lit: [], lampsM: [], lanterns: [], blink: [], nightOnly: [], dyn: [] }); B.winD = WB.winTex(false); B.winN = WB.winTex(true);
  // 地形：北面是海，南面和西面是连绵的山
  const inCity = (x, z) => x > -192 && x < 640 && z > -178 && z < 150;
  const hf = (x, z) => {
    if (inCity(x, z)) return -0.06;
    const out = Math.max(-192 - x, -178 - z, x - 640, 0), mt = Math.min(320, out * 0.32 + fbm(x / 140, z / 140) * 110 * Math.min(1, out / 80) + (z < -400 ? (-400 - z) * 0.12 : 0));
    if (z <= 148) return mt;
    const isl = Math.hypot(x + 360, z - 720), sea = isl < 70 ? 14 * (1 - isl / 70) + fbm(x / 30, z / 30, 3) * 6 - 4 : -9, t = clamp((z - 148) / 110 + (x > -200 && x < 650 ? 1 : 0), 0, 1);
    return mt + (sea - mt) * t;
  };
  const cf = (h, x, z) => { const c = new THREE.Color(); if (h < -2) c.set(0x6a7a6a); else if (h < 1) c.set(inCity(x, z) ? 0x7a7a72 : 0xc8b888); else if (h < 70) c.set(0x5a8a4a).lerp(new THREE.Color(0x3a6a3a), fbm(x / 20, z / 20, 2)); else if (h < 200) c.set(0x6a7a5a).lerp(new THREE.Color(0x8a8070), (h - 70) / 130); else c.set(0xe8eef0); return c; };
  terrainMesh(2600, 2600, 170, hf, cf, G, 0, 0);
  WB.water(G, 0, 1300, 5200, 2300);
  WB.ground(G, 400, 330, '#8a8478', '#9a948a', 50).position.set(0, 0, -15);
  WB.ground(G, 460, 330, '#6a6a6c', '#7a7a7c', 40).position.set(420, 0.01, -15);
  // 道路
  const road = 0x3a3a3e; WB.strip(G, 0, -165, 0, 140, 14, road); WB.strip(G, -178, 40, 178, 40, 12, road); WB.strip(G, -178, -60, 178, -60, 12, road); WB.strip(G, -178, 138, 178, 138, 10, 0x9a8a72);
  WB.strip(G, 0, -165, 0, 140, 0.3, 0xe8e0c0, 0.03); WB.strip(G, -178, 40, 178, 40, 0.3, 0xe8e0c0, 0.03);
  // 海堤 / 码头
  for (const [a, b] of [[-180, -156], [-144, -76], [-44, 38]]) box(b - a, 1.2, 1, M(0x8a8478), (a + b) / 2, 0.6, 146.8, G); mesh(new THREE.BoxGeometry(140, 2.6, 34), M(0x6a6660), 108, -1.25, 157, G);
  WB.strip(G, 55, 170, 55, 208, 9, 0x7a5a3a, 0.05); for (let z = 172; z < 208; z += 6) for (const sx of [-1, 1]) mesh(new THREE.CylinderGeometry(0.3, 0.3, 4, 6), M(0x4a3a2a), 55 + sx * 4.3, -1, z, G);
  mesh(new THREE.CylinderGeometry(15, 15, 2.4, 32), M(0x8a8478), -60, -1.2, 160, G); WB.strip(G, -150, 140, -150, 163, 10, 0x9a8a72, 0.05);
  // 唐人街：主街两侧骑楼
  const cols = [0xd8c8a8, 0xc89a7a, 0xe0d0b0, 0xb8a090, 0xd0b0a0, 0xe8d8c8], signs = ['金龙酒家', '福记茶楼', '同仁堂', '永安百货', '新华书店', '宝芝林', '大三元', '荣记烧腊', '和平饭店', '天后药行', '百利洋行', '金山钟表'];
  let si = 0; const blocks = [[-150, -68], [-52, 32], [48, 128]];
  for (const [a, b] of blocks) for (let z = a + 5; z < b - 4; z += 11) {
    const w = 10, fl = 2 + ((z * 7) & 1) + (Math.abs(z) % 3 === 0 ? 1 : 0);
    if (!(z > -36 && z < -24)) WB.shophouse(G, B, d, 12.5, z, w, 9, fl, -Math.PI / 2, cols[si % 6], signs[si++ % signs.length]);
    WB.shophouse(G, B, d, -12.5, z, w, 9, fl, Math.PI / 2, cols[(si + 3) % 6], signs[si++ % signs.length]);
  }
  // 老爹古董店（门口就是 shop 门）
  WB.shophouse(G, B, d, 12.5, -30, 10, 9, 2, -Math.PI / 2, 0x8a5a3a, '老爹古董店');
  // 横街两侧
  for (const zz of [40, -60]) for (let x = 24; x < 160; x += 13) for (const s of [-1, 1]) { if (zz === -60 && s === -1 && x > 95 && x < 125) continue; WB.shophouse(G, B, d, x * (s > 0 ? 1 : -1) * 1, zz + 11.5, 11, 9, 2 + (x % 3 === 0 ? 1 : 0), Math.PI, cols[(x + zz) % 6 | 0]); if (!(zz === 40 && x > 140) && !(zz === -60 && x > 150)) WB.shophouse(G, B, d, x * (s > 0 ? 1 : -1), zz - 11.5, 11, 9, 2, 0, cols[(x + 2) % 6 | 0]); }
  // 牌楼
  WB.paifang(G, B, 0, 52, 0, '龍城', 1.4); WB.paifang(G, B, 0, -140, Math.PI, '唐人街', 1.2);
  for (let z = -140; z < 130; z += 16) for (const s of [-1, 1]) WB.lamp(G, B, s * 7.5, z);
  for (let z = -130; z < 125; z += 10) { const y = 9.5 + Math.sin(z) * 0.3; WB.lantern(G, B, -5, y, z, 0.7); WB.lantern(G, B, 5, y, z + 5, 0.7); }
  // 九层宝塔
  WB.pagoda(G, B, -62, -12, 9, 6); WORLD.col(d, -70, -20, -54, -4, 30);
  // 博物馆
  { const K = new THREE.Group(); K.position.set(-110, 0, 102); G.add(K); const st = M(0xe8e0d0); box(44, 16, 30, st, 0, 8, 0, K); box(48, 2.2, 34, M(0xd0c8b8), 0, 17, 0, K); const ped = mesh(new THREE.CylinderGeometry(0.1, 26, 7, 3), st, 0, 21.5, -14.5, K); ped.rotation.z = Math.PI / 2; ped.rotation.y = Math.PI / 2; ped.scale.set(1, 1, 0.12);
    for (let i = -4; i <= 4; i++) mesh(new THREE.CylinderGeometry(0.9, 1, 14, 12), st, i * 4.6, 7.4, -16.5, K); for (let i = 0; i < 3; i++) box(40 - i * 2, 0.5, 2, M(0xc8c0b0), 0, 0.25 + i * 0.5, -18.5 + i, K); const s = labelSprite('旧金山博物馆', '#3a2a1a', 1.2); s.material.depthTest = true; s.position.set(0, 15.5, -15.6); K.add(s); WORLD.col(d, -132, 85, -88, 117, 16); }
  // 火车站
  { const K = new THREE.Group(); K.position.set(-200, 0, -60); G.add(K); box(30, 18, 70, M(0xb8784a), 0, 9, 0, K); const arc = mesh(new THREE.CylinderGeometry(20, 20, 80, 24, 1, false, 0, Math.PI), M(0x6a7a8a, { side: THREE.DoubleSide }), -10, 16, 0, K); arc.rotation.x = Math.PI / 2; arc.rotation.z = Math.PI / 2;
    const clk = mesh(new THREE.CylinderGeometry(3, 3, 0.5, 24), M(0xf0ead0), 15.2, 14, 0, K); clk.rotation.z = Math.PI / 2; box(6, 30, 6, M(0xa8683a), 12, 15, -26, K); const s = labelSprite('湾区火车站', '#ffe9b0', 1.3); s.position.set(15.5, 20, 0); K.add(s); }
  // 马戏团大帐篷
  { const K = new THREE.Group(); K.position.set(-110, 0, -135); G.add(K); mesh(new THREE.CylinderGeometry(22, 22, 8, 24), M(0xd84a3a), 0, 4, 0, K); const top = mesh(new THREE.ConeGeometry(24, 16, 24), M(0xf0e0c0), 0, 16, 0, K); for (let i = 0; i < 12; i++) { const s = box(0.6, 8.1, 0.6, M(0xffffff), Math.sin(i / 12 * TAU) * 22.1, 4, Math.cos(i / 12 * TAU) * 22.1, K); }
    mesh(new THREE.CylinderGeometry(0.3, 0.3, 8, 6), M(0x8a6a3a), 0, 27, 0, K); const f = box(4, 2.4, 0.1, M(0xff3a2a), 2, 30, 0, K); (B.dyn = B.dyn || []).push(f); B.anim.push(() => f.rotation.y = Math.sin(now * 3) * 0.4); WORLD.col(d, -128, -153, -92, -117, 10); }
  // 南山：龙王庙山门 + 石阶 + 山顶电视塔
  for (let i = 0; i < 18; i++) box(16, 0.5, 3, M(0x9a948a), 0, i * 0.7 - 0.2, -168 - i * 2.4, G);
  WB.paifang(G, B, 0, -170, 0, '龍王廟', 1.3);
  { const K = new THREE.Group(); K.position.set(0, hf(0, -235), -235); G.add(K); box(30, 10, 18, M(0xb03a2a), 0, 5, 0, K); WB.roof(K, 0, 13, 0, 34, 22, 0x2a3a2a); }
  { const tx = -60, tz = -460, ty = hf(tx, tz) - 4, K = new THREE.Group(); K.position.set(tx, ty, tz); G.add(K); const w = M(0xe8e8ec);
    for (let i = 0; i < 3; i++) { const l = box(4, 150, 4, M(0xc8302a), Math.sin(i / 3 * TAU) * 14, 70, Math.cos(i / 3 * TAU) * 14, K); l.rotation.set(Math.cos(i / 3 * TAU) * 0.08, 0, -Math.sin(i / 3 * TAU) * 0.08); }
    mesh(new THREE.CylinderGeometry(3, 6, 230, 12), w, 0, 115, 0, K, false); mesh(new THREE.SphereGeometry(14, 20, 14), M(0xd0d4e0, { emissive: 0x202630 }), 0, 170, 0, K, false); mesh(new THREE.SphereGeometry(8, 16, 12), M(0xe0e4f0), 0, 205, 0, K, false); mesh(new THREE.CylinderGeometry(0.5, 1.5, 60, 6), w, 0, 260, 0, K, false);
    B.blink.push(mesh(new THREE.SphereGeometry(2.5, 8, 6), new THREE.MeshBasicMaterial({ color: 0xff3a2a, toneMapped: false }), 0, 292, 0, K, false)); }
  // 墓园（铁栅栏 + 墓碑）
  for (let x = 90; x <= 130; x += 2.5) box(0.15, 2.2, 0.15, M(0x1a1a1a), x, 1.1, -120, G); box(42, 0.2, 0.2, M(0x1a1a1a), 110, 2.1, -120, G);
  for (let i = 0; i < 24; i++) box(1.2, 1.6, 0.35, M(0x8a8a88), 92 + (i % 6) * 7, 0.8, -128 - Math.floor(i / 6) * 7, G); WORLD.col(d, 88, -165, 132, -121, 2);
  // 家具城 + 仓库
  { const K = new THREE.Group(); K.position.set(205, 0, -60); G.add(K); box(70, 22, 80, M(0xe8e4dc), 0, 11, 0, K); box(4, 6, 30, M(0x3a6ab0), -35.5, 18, 0, K); const s = labelSprite('宜家家具城', '#ffd04a', 2); s.position.set(-36, 18, 0); K.add(s); }
  for (let i = 0; i < 3; i++) { const K = new THREE.Group(); K.position.set(120 + i * 22, 0, 192); G.add(K); box(20, 12, 26, M(0x7a6a5a), 0, 6, 0, K); const r = mesh(new THREE.CylinderGeometry(10.5, 10.5, 26, 16, 1, false, 0, Math.PI), M(0x5a5a62), 0, 12, 0, K); r.rotation.x = Math.PI / 2; r.rotation.z = Math.PI / 2; }
  WORLD.col(d, 108, 178, 178, 210, 12);
  // 集装箱码头：巨型吊机
  WB.containers(G, d, 80, 150, 6, 3, 4); for (let i = 0; i < 4; i++) WB.crane(G, 70 + i * 32, 240, Math.PI, [0x2a6ad0, 0xd0402a, 0x2a6ad0, 0xe0a030][i]);
  mesh(new THREE.BoxGeometry(170, 4, 60), M(0x5a5a5e), 115, -1, 240, G, false);
  // 摩天轮
  WB.ferris(G, B, -60, 168, 30, 0);
  // 红色悬索大桥 + 海湾小岛灯塔
  WB.bridge(G, 520, -900, 700, -320, 260, 52, 175, 0xc8402a);
  { const K = new THREE.Group(); K.position.set(-360, 8, 720); G.add(K); mesh(new THREE.CylinderGeometry(3, 4, 30, 12), M(0xf0f0f0), 0, 15, 0, K, false); mesh(new THREE.CylinderGeometry(3.4, 3.4, 4, 12), M(0xc8302a), 0, 32, 0, K, false);
    const beam = mesh(new THREE.ConeGeometry(16, 220, 16, 1, true), new THREE.MeshBasicMaterial({ color: 0xfff2b0, transparent: true, opacity: 0.12, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, side: THREE.DoubleSide }), 0, 0, 0, null, false);
    const piv = new THREE.Group(); piv.position.y = 33; K.add(piv); beam.rotation.z = Math.PI / 2; beam.position.x = 110; piv.add(beam); B.nightOnly.push(piv); B.anim.push(dt => piv.rotation.y += dt * 0.6);
    for (let i = 0; i < 6; i++) box(10, 4 + i % 3 * 2, 8, M(0xd8d0c0), -20 + i * 9, 2, 20 - (i % 2) * 14, K); }
  // 东边的摩天大楼群
  let seed = 7; const r = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
  for (let i = 0; i < 46; i++) { const x = 230 + r() * 380, z = -150 + r() * 290, h = 40 + Math.pow(r(), 1.6) * 190, w = 14 + r() * 16; WB.tower(G, B, x, z, w, h, w * (0.8 + r() * 0.5), [0x8a96a6, 0x6a7a8a, 0xa8b0b8, 0x5a6a7a, 0xc0b8a8][i % 5], h > 150); }
  WB.tower(G, B, 300, 60, 26, 260, 26, 0x9aa8b8, true);
  { const K = new THREE.Group(); K.position.set(380, 0, -40); G.add(K); const py = mesh(new THREE.ConeGeometry(30, 250, 4), M(0xe8eef4, { map: B.winD, emissiveMap: B.winN, emissive: 0xffffff, emissiveIntensity: 0 }), 0, 125, 0, K, false); B.lit.push(py.material); py.rotation.y = Math.PI / 4; }
  // 西边的树
  for (let i = 0; i < 40; i++) WB.tree(G, -150 + r() * 120, -100 + r() * 40 * (i % 2 ? 1 : -1) + (i % 3) * 60, 1 + r() * 0.6);
  for (let x = -170; x < 170; x += 18) WB.tree(G, x, 132, 1.1, 0x4a8a4a);
  B.anim.push(dt => { const v = (Math.sin(now * 3) > 0.6); B.blink.forEach(m => m.visible = v); });
}
