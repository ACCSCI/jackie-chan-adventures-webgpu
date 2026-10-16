// ================= 第四集 · 鼠之护身符：第十三区地下基地 / 文物库 / 升降井 / 云端飞艇 =================
const B13 = { x: 0, z: 400, hx: 44, hz: 12, h: 6 };
const VT = { x: 0, z: 520, hx: 18, hz: 16, h: 8 };
const SH = { x: 200, z: 400, hx: 7.5, hz: 7.5, h: 40 };
const AS = { x: 200, z: 560, hx: 7, hz: 22 };
// applyArea 只拷贝固定字段：把第四集用到的开关也带上
{
  const _aa = applyArea;
  applyArea = function (name) { _aa(name); const D = AREA_DEF[name](); AREA.squad = !!D.squad; AREA.occl = !!D.occl; AREA.follow = !!D.follow; AREA.ep4 = !!D.ep4; };
}
const metalFloor = (base, line, hazard) => canvasTex(512, 512, (g, W) => {
  g.fillStyle = base; g.fillRect(0, 0, W, W);
  for (let i = 0; i < 1800; i++) { const v = Math.random() * 30 | 0; g.fillStyle = `rgba(${v},${v},${v + 6},.18)`; g.fillRect(Math.random() * W, Math.random() * W, 2, 2); }
  g.strokeStyle = line; g.lineWidth = 3; for (let k = 0; k <= 4; k++) { g.beginPath(); g.moveTo(0, k * 128); g.lineTo(W, k * 128); g.moveTo(k * 128, 0); g.lineTo(k * 128, W); g.stroke(); }
  g.fillStyle = 'rgba(0,0,0,.35)'; for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) [[8, 8], [120, 8], [8, 120], [120, 120]].forEach(([x, y]) => { g.beginPath(); g.arc(c * 128 + x, r * 128 + y, 3, 0, TAU); g.fill(); });
  if (hazard) { for (let i = -W; i < W * 2; i += 40) { g.fillStyle = '#d8a818'; g.beginPath(); g.moveTo(i, 0); g.lineTo(i + 20, 0); g.lineTo(i + 20 - 30, 30); g.lineTo(i - 30, 30); g.fill(); } g.fillStyle = '#111'; }
});
const panelWall = (base, accent) => canvasTex(512, 256, (g, W, H) => {
  g.fillStyle = base; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 4; i++) { g.fillStyle = 'rgba(255,255,255,.04)'; g.fillRect(i * 128 + 6, 10, 116, H - 20); g.strokeStyle = 'rgba(0,0,0,.45)'; g.lineWidth = 3; g.strokeRect(i * 128 + 4, 8, 120, H - 16); }
  g.fillStyle = accent; g.fillRect(0, H * 0.62, W, 10); g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(0, H * 0.62 + 10, W, 3);
  for (let i = 0; i < 600; i++) { g.fillStyle = `rgba(0,0,0,${Math.random() * .12})`; g.fillRect(Math.random() * W, Math.random() * H, 2, 2); }
});
const S13_LOGO = canvasTex(256, 256, (g) => { g.fillStyle = '#0f1a2a'; g.beginPath(); g.arc(128, 128, 124, 0, TAU); g.fill(); g.strokeStyle = '#c8d4e0'; g.lineWidth = 10; g.beginPath(); g.arc(128, 128, 104, 0, TAU); g.stroke(); g.fillStyle = '#c8d4e0'; g.font = 'bold 96px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('13', 128, 122); g.font = 'bold 26px sans-serif'; g.fillText('SECTION', 128, 196); });
// 轴对齐墙段（含碰撞体）
function wallBox(G, x0, z0, x1, z1, h, mat, o = {}) {
  const w = Math.max(0.3, Math.abs(x1 - x0)), d = Math.max(0.3, Math.abs(z1 - z0)), cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
  const m = box(w, h, d, mat, cx, h / 2, cz, G); m.receiveShadow = true; if (o.noShadow) m.castShadow = false;
  const c = addColH(G, cx - w / 2, cx + w / 2, cz - d / 2, cz + d / 2, h); Object.assign(c, o.col || {}); return { m, c };
}
const B13S = { hacked: false, grate: null, lasers: [], cams: [], door: null, lights: [] };
(function buildBase() {
  const G = new THREE.Group(); G.position.set(B13.x, 0, B13.z); scene.add(G); AREA_GROUPS.base = G;
  const { hx, hz, h } = B13;
  const fl = mesh(new THREE.PlaneGeometry(hx * 2, hz * 2), MS(0xffffff, { map: metalFloor('#3a3f46', 'rgba(15,18,22,.8)'), roughness: 0.6, metalness: 0.25 }), 0, 0.002, 0, G, false); fl.rotation.x = -Math.PI / 2; fl.receiveShadow = true; fl.material.map.repeat.set(hx / 3, hz / 3);
  const wt = panelWall('#4a525c', '#c89a1a'); wt.repeat.set(1, 1);
  const wm = M(0xffffff, { map: wt }), wm2 = M(0x59616b), dark = M(0x23272c), yl = M(0xd8a818), red = M(0x9a1c1c);
  const outer = (w, x, z, ry) => { const t = wt.clone(); t.needsUpdate = true; t.repeat.set(w / 8, 1); t.wrapS = THREE.RepeatWrapping; plane(w, h, M(0xffffff, { map: t }), x, h / 2, z, ry, G); };
  outer(hx * 2, 0, -hz, 0); outer(hx * 2, 0, hz, Math.PI); outer(hz * 2, -hx, 0, Math.PI / 2); outer(hz * 2, hx, 0, -Math.PI / 2);
  const ceil = mesh(new THREE.PlaneGeometry(hx * 2, hz * 2), M(0x1c2026), 0, h, 0, G, false); ceil.rotation.x = Math.PI / 2;
  // 顶灯条 + 地面光斑
  const lampM = glowMat(1.6, 1.7, 1.9);
  for (let x = -40; x <= 40; x += 8) for (const z of [-6, 6]) { box(2.4, 0.08, 0.3, lampM, x, h - 0.05, z, G).castShadow = false; lightPool(x, z, 3.2, new THREE.Color(0.16, 0.18, 0.22), G); }
  // —— 内墙：A 区 | B 大厅 | C 金库前厅；北侧暗道 ——
  const W = (x0, z0, x1, z1, o) => wallBox(G, x0, z0, x1, z1, h, wm2, o);
  W(-16.2, -hz, -15.8, -2.5); W(-16.2, 2.5, -15.8, 7.5);
  W(-16, 7.3, 16, 7.7); // 暗道南墙
  W(15.8, -hz, 16.2, -2.2); W(15.8, 2.2, 16.2, 7.5);
  // 门框（黄黑警示）
  [[-16, -2.5], [-16, 2.5], [16, -2.2], [16, 2.2]].forEach(([x, z]) => box(0.5, h, 0.3, yl, x, h / 2, z, G).castShadow = false);
  [[-16, 0, 5.4], [16, 0, 4.8]].forEach(([x, z, w]) => box(0.5, 0.6, w, dark, x, h - 0.3, z, G).castShadow = false);
  // 暗道入口格栅（按 E 撬开）
  const grate = new THREE.Group(); grate.position.set(-16, 0, 9.75); G.add(grate);
  for (let i = -5; i <= 5; i++) box(0.08, 2.6, 0.06, dark, 0, 1.3, i * 0.4, grate);
  for (let y = 0.2; y < 2.7; y += 0.6) box(0.1, 0.08, 4.4, dark, 0, y, 0, grate);
  B13S.grate = { g: grate, col: addColH(G, -16.3, -15.7, 7.5, 12, h) };
  // 暗道里的管道
  const pipeM = M(0x6a737e);
  [0.5, 1.0].forEach((y, i) => { const p = mesh(new THREE.CylinderGeometry(0.12, 0.12, 32, 10), i ? M(0x8a3a2a) : pipeM, 0, h - y - 0.6, 11.6 - i * 0.35, G); p.rotation.z = Math.PI / 2; p.castShadow = false; });
  for (let x = -12; x <= 12; x += 6) lightPool(x, 9.8, 1.6, new THREE.Color(0.05, 0.12, 0.08), G);
  // —— A 区：箱子（矮箱可蹲着躲，高箱完全挡住） ——
  const low = (x, z, w = 1.6, d = 1.2) => { box(w, 1.0, d, crateM2, x, 0.5, z, G); addColH(G, x - w / 2, x + w / 2, z - d / 2, z + d / 2, 1.0); };
  const tall = (x, z, w = 1.6, d = 1.6) => { box(w, 1.1, d, crateM2, x, 0.55, z, G); box(w * 0.92, 1.1, d * 0.92, crateM2, x, 1.65, z, G).rotation.y = 0.08; addColH(G, x - w / 2, x + w / 2, z - d / 2, z + d / 2, 2.2); };
  low(-38, -2.5); low(-33, -3); tall(-28, -2); low(-24, -3.4); tall(-34, 7.5); low(-29, 5.5, 2.4); tall(-21, 7); low(-40, 7.5); low(-19, -9.5); tall(-26, -10.2, 2.4, 1.4); low(-36, -10.5);
  // 叉车
  const fk = new THREE.Group(); fk.position.set(-31, 0, -9); fk.rotation.y = 0.4; G.add(fk);
  box(1.4, 1.0, 2.2, yl, 0, 0.7, 0, fk); box(1.3, 0.08, 1.2, dark, 0, 2.0, -0.4, fk); [-0.55, 0.55].forEach(x => box(0.08, 1.9, 0.08, dark, x, 1.15, 0.2, fk)); [-0.3, 0.3].forEach(x => box(0.12, 0.06, 1.2, dark, x, 0.2, 1.6, fk));
  [[-0.7, -0.7], [0.7, -0.7], [-0.7, 0.7], [0.7, 0.7]].forEach(([x, z]) => { const w = mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.25, 12), dark, x, 0.3, z, fk); w.rotation.z = Math.PI / 2; });
  addColH(G, -32.3, -29.7, -10.4, -7.6, 2.0);
  // —— B 大厅：服务器机柜（高掩体），指示灯 ——
  const rackM = M(0x1e232a), ledG = glowMat(0.3, 2.5, 0.6), ledB = glowMat(0.3, 1.2, 3), ledR = glowMat(3, 0.3, 0.2);
  const rack = (x, z, len) => {
    box(len, 2.3, 0.9, rackM, x, 1.15, z, G); addColH(G, x - len / 2, x + len / 2, z - 0.45, z + 0.45, 2.3);
    for (let i = 0; i < len / 0.6 - 1; i++) for (let j = 0; j < 4; j++) [-1, 1].forEach(s => box(0.05, 0.04, 0.02, [ledG, ledB, ledR][(i + j * 3) % 3], x - len / 2 + 0.4 + i * 0.6, 0.5 + j * 0.45, z + s * 0.46, G).castShadow = false);
  };
  [-8, -3, 2].forEach(z => { rack(-6, z, 6); rack(6, z, 6); });
  lightPool(0, -3, 4, new THREE.Color(0.05, 0.12, 0.22), G);
  // 电闸（大厅西墙）
  const fuse = new THREE.Group(); fuse.position.set(-15.65, 0, -9.5); G.add(fuse);
  box(0.25, 1.1, 0.8, M(0x5a6a3a), 0, 1.5, 0, fuse); box(0.06, 0.3, 0.12, red, 0.15, 1.6, 0, fuse); plane(0.5, 0.25, new THREE.MeshBasicMaterial({ map: _tex.sign('⚡ 电闸', 256, 128, '#d8a818', '#111') }), 0.13, 2.25, 0, Math.PI / 2, fuse);
  B13S.fuseLever = fuse.children[1]; B13S.fuseLamp = mesh(new THREE.SphereGeometry(0.06, 8, 6), glowMat(0.3, 3, 0.4), 0.14, 1.95, 0.25, fuse, false);
  // —— C 前厅：金库大门 + 控制台 ——
  const vd = new THREE.Group(); vd.position.set(hx - 0.25, 0, 0); G.add(vd);
  const ring = mesh(new THREE.CylinderGeometry(2.6, 2.6, 0.5, 40), M(0x8a929c, { emissive: 0x050608 }), 0, 2.8, 0, vd); ring.rotation.z = Math.PI / 2;
  const door = new THREE.Group(); door.position.set(-0.15, 2.8, 0); vd.add(door);
  const dm = mesh(new THREE.CylinderGeometry(2.25, 2.25, 0.5, 40), M(0xb8c0c8, { emissive: 0x070808 }), 0, 0, 0, door); dm.rotation.z = Math.PI / 2;
  for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; const b = box(0.2, 1.6, 0.2, M(0x5a626c), -0.3, Math.sin(a) * 0.9, Math.cos(a) * 0.9, door); b.rotation.x = -a; }
  const wheel = mesh(new THREE.TorusGeometry(0.6, 0.07, 8, 24), M(0xd8a818), -0.32, 0, 0, door); wheel.rotation.y = Math.PI / 2;
  plane(1.4, 1.4, M(0xffffff, { map: S13_LOGO }), -0.42, 0, 0, -Math.PI / 2, door);
  B13S.door = door; B13S.wheel = wheel;
  const con = new THREE.Group(); con.position.set(41, 0, -3.6); con.rotation.y = -Math.PI / 2; G.add(con);
  box(1.4, 1.0, 0.7, dark, 0, 0.5, 0, con); const scr = box(1.2, 0.6, 0.05, glowMat(0.2, 1.4, 2.2), 0, 1.35, -0.1, con); scr.rotation.x = -0.4; scr.castShadow = false; B13S.screen = scr;
  addColH(G, 40.6, 41.4, -4.3, -2.9, 1.0);
  low(24, -3); low(30, 3.5, 2.4, 1); tall(35, -6); low(21, 9.5); low(38, 4); tall(27, 10.5, 1.6, 1.4);
  // 标牌
  plane(6, 1, new THREE.MeshBasicMaterial({ map: _tex.sign('第十三区 · 外围仓储', 640, 110, '#0f1a2a', '#c8d4e0') }), -30, 4.4, -hz + 0.05, 0, G);
  plane(5, 1, new THREE.MeshBasicMaterial({ map: _tex.sign('数据中心 · 闲人免进', 640, 110, '#0f1a2a', '#c8d4e0') }), 0, 4.6, -hz + 0.05, 0, G);
  plane(5, 1, new THREE.MeshBasicMaterial({ map: _tex.sign('超自然证物库', 640, 110, '#3a0c0c', '#ffd8a0') }), 30, 4.6, -hz + 0.05, 0, G);
  plane(2.2, 2.2, M(0xffffff, { map: S13_LOGO }), -hx + 0.05, 3.2, 0, Math.PI / 2, G);
  // —— 激光绊线 ——
  const lzr = (x0, z0, x1, z1, y) => {
    const len = Math.hypot(x1 - x0, z1 - z0), mat = new THREE.MeshBasicMaterial({ color: new THREE.Color(4, 0.25, 0.2), transparent: true, opacity: 0.85, depthWrite: false, toneMapped: false, blending: THREE.AdditiveBlending, fog: false });
    const m = mesh(new THREE.CylinderGeometry(0.02, 0.02, len, 5), mat, (x0 + x1) / 2, y, (z0 + z1) / 2, G, false); m.rotation.x = Math.PI / 2; m.rotation.z = -Math.atan2(x1 - x0, z1 - z0) * 0 ; if (Math.abs(x1 - x0) > Math.abs(z1 - z0)) { m.rotation.x = 0; m.rotation.z = Math.PI / 2; }
    [[x0, z0], [x1, z1]].forEach(([x, z]) => box(0.12, 0.16, 0.12, dark, x, y, z, G).castShadow = false);
    const L = { x0: B13.x + x0, z0: B13.z + z0, x1: B13.x + x1, z1: B13.z + z1, y, mesh: m }; B13S.lasers.push(L); return L;
  };
  lzr(-15.2, -2.5, -15.2, 2.5, 0.35); lzr(-13.9, -2.5, -13.9, 2.5, 1.25);
  lzr(0, 7.7, 0, 12, 1.2); lzr(16.9, -2.2, 16.9, 2.2, 0.35);
  // —— 摄像头（模型） ——
  const camM = M(0xd8dde2), camLens = glowMat(3, 0.3, 0.2), camOff = M(0x111111);
  const cam = (x, z, yaw) => { const g = new THREE.Group(); g.position.set(x, 3.6, z); G.add(g); box(0.12, 0.5, 0.12, dark, 0, 0.25, 0, g); const hd = new THREE.Group(); g.add(hd); box(0.26, 0.24, 0.5, camM, 0, 0, 0.12, hd); const l = mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.06, 10), camLens, 0, 0, 0.39, hd, false); l.rotation.x = Math.PI / 2;
    B13S.cams.push({ x: B13.x + x, z: B13.z + z, yaw, head: hd, lens: l, lensOn: camLens, lensOff: camOff }); };
  cam(-16.6, -11.5, -0.95); cam(15.6, -11.5, -0.9); cam(43.6, 11.5, -2.25);
  BATCH.push(Object.assign(staticBatch([G], new Set([grate, door, fuse, con, ...B13S.lasers.map(l => l.mesh), ...B13S.cams.map(c => c.head.parent)])), { cx: B13.x, cz: B13.z, r: 120 }));
  BATCH.push({ group: G, cx: B13.x, cz: B13.z, r: 120 });
})();
AREA_DEF.base = () => ({ cx: B13.x, cz: B13.z, hx: B13.hx - 0.5, hz: B13.hz - 0.5, room: true, h: B13.h, sun: 0.8, sunC: 0xaac4ff, hemi: [0x8aa0c8, 0x23262c, 1.05], fog: [0x0b0f16, 24, 75], night: true, occl: 1, follow: 1, ep4: 1, squad: 1 });
spawnWeapon(5, B13.x - 37, B13.z + 10); spawnWeapon(0, B13.x + 22, B13.z - 10.5);
const bL = (x, z) => [B13.x + x, B13.z + z];
const GUARD_ROUTES = [
  { at: [-30, -6.5], r: [[-37, -6.5, 2.2], [-20, -6.5, 2.2]] },
  { at: [-25, 4.5], r: [[-25, 3.6, 2.5, Math.PI / 2], [-32, 10, 1.8], [-38, 3.5, 2]] },
  { at: [-12, -10.5], r: [[-12, -10.5, 1.2], [12, -10.5, 1.8], [12, 5, 1.2], [-12, 5, 1.8]] },
  { at: [12, -0.5], r: [[12, -0.5, 5, -Math.PI / 2], [12.2, -0.4, 4, -Math.PI / 2 - 0.6]], half: 0.7 },
  { at: [21, -9], r: [[20, -9, 2], [39, -9, 2]] },
  { at: [37, 7.8], r: [[38, 7.8, 2], [20, 7.8, 2.4]] },
];
function setupBase() {
  B13S.hacked = false; Story.b13 = null;
  SNEAK.start({ cams: B13S.cams.map(c => ({ x: c.x, z: c.z, yaw: c.yaw, head: c.head, lens: c.lens, lensOn: c.lensOn, lensOff: c.lensOff, parentYaw: 0 })), lasers: B13S.lasers,
    reinf: () => { const p = player, pts = [[-42, -10], [0, -11], [42, 10], [0, 10], [-30, 10]].map(([x, z]) => bL(x, z)).filter(([x, z]) => Math.hypot(x - p.pos.x, z - p.pos.z) > 7).sort((a, b) => Math.hypot(a[0] - p.pos.x, a[1] - p.pos.z) - Math.hypot(b[0] - p.pos.x, b[1] - p.pos.z));
      const [x, z] = pts[0]; ['guard13', 'ninja', 'guard13'].forEach((t, i) => Story.timers.push({ t: 1.5 + i * 0.9, f: () => { if (gameOver || wave !== 12) return; const e = spawnAt(t, x + rand(-1, 1), z + rand(-1, 1)); burst(e.pos.clone().setY(1), 0xff4030, 16, 3); } })); } });
  enemies.forEach((e, i) => { const R = GUARD_ROUTES[i]; if (!R) return; SNEAK.guard(e, R.r.map(w => [B13.x + w[0], B13.z + w[1], w[2], w[3]]), R.half ? { half: R.half } : {}); });
  B13S.cams.forEach(c => c.lens.material = c.lensOn); B13S.fuseLamp.material.color.setRGB(0.3, 3, 0.4);
  B13S.door.position.x = -0.15; B13S.door.rotation.set(0, 0, 0); B13S.screen.material.color.setRGB(0.2, 1.4, 2.2);
  B13S.grate.g.visible = true; if (!colliders.includes(B13S.grate.col)) colliders.push(B13S.grate.col);
  Interact.list = Interact.list.filter(o => o.area !== 'base');
  Interact.add({ area: 'base', x: B13.x - 15.2, z: B13.z - 9.5, r: 1.6, prompt: '按 E 拉下电闸（所有摄像头断电）', use() { SNEAK.power = false; B13S.fuseLamp.material.color.setRGB(3, 0.2, 0.1); burst(new THREE.Vector3(this.x, 1.8, this.z), 0xffe08a, 24, 4); Foley.at('zap', player.pos, { vol: 0.7 }); tip('电闸拉下——摄像头全部断电！', 2.2); player.noise = 5; } });
  Interact.add({ area: 'base', x: B13.x - 17, z: B13.z + 9.75, r: 1.7, prompt: '按 E 撬开通风暗道的格栅', use() { B13S.grate.g.visible = false; const i = colliders.indexOf(B13S.grate.col); if (i >= 0) colliders.splice(i, 1); Foley.at('chain', player.pos, { vol: 0.6 }); burst(new THREE.Vector3(B13.x - 16, 1.2, B13.z + 9.75), 0x8a929c, 16, 3); tip('格栅撬开了——暗道可以绕开大厅（里面也有激光）', 2.4); player.noise = 3; } });
  Interact.add({ area: 'base', x: B13.x + 40.2, z: B13.z - 3.6, r: 1.6, holdDur: 3.2, label: '破解金库控制台中…（按住 E）', prompt: '按住 E 破解金库控制台', prog: 0,
    tick(dt) { this.bt = (this.bt || 0) - dt; if (this.bt <= 0) { this.bt = 0.45; Foley.at('beep', player.pos, { vol: 0.3, rate: 1 + this.prog }); player.noise = Math.max(player.noise || 0, 4.5); } },
    use() { B13S.hacked = true; B13S.screen.material.color.setRGB(0.3, 3, 0.5); Foley.at('mech', player.pos, { vol: 0.8, rate: 0.7 }); tip('破解成功！金库大门正在打开……', 2.5); } });
}
// 结算评价
function baseRating() { if (!SNEAK.seen && !SNEAK.alarmed) return { k: 'ghost', n: '幽灵', d: '从头到尾没有被任何人发现' }; if (!SNEAK.alarmed) return { k: 'shadow', n: '暗影', d: '被发现过，但没让任何人拉响警报' }; return { k: 'assault', n: '强攻', d: '警报响了——成龙式“潜入”' }; }

// ================= 文物库 =================
let lionStatue = null;
(function buildVault() {
  const G = new THREE.Group(); G.position.set(VT.x, 0, VT.z); scene.add(G); AREA_GROUPS.vault = G;
  const { hx, hz, h } = VT;
  const fl = mesh(new THREE.PlaneGeometry(hx * 2, hz * 2), MS(0xffffff, { map: metalFloor('#2c3036', 'rgba(10,12,14,.8)'), roughness: 0.55, metalness: 0.3 }), 0, 0.002, 0, G, false); fl.rotation.x = -Math.PI / 2; fl.receiveShadow = true; fl.material.map.repeat.set(hx / 3, hz / 3);
  const wt = panelWall('#3a4048', '#8a1c1c'); wt.wrapS = THREE.RepeatWrapping;
  const wall = (w, x, z, ry) => { const t = wt.clone(); t.needsUpdate = true; t.repeat.set(w / 8, 1); plane(w, h, M(0xffffff, { map: t }), x, h / 2, z, ry, G); };
  wall(hx * 2, 0, -hz, 0); wall(hx * 2, 0, hz, Math.PI); wall(hz * 2, -hx, 0, Math.PI / 2); wall(hz * 2, hx, 0, -Math.PI / 2);
  const ceil = mesh(new THREE.PlaneGeometry(hx * 2, hz * 2), M(0x15181c), 0, h, 0, G, false); ceil.rotation.x = Math.PI / 2;
  const lampM = glowMat(1.5, 1.4, 1.2); for (let x = -12; x <= 12; x += 8) for (let z = -10; z <= 10; z += 10) { box(2, 0.08, 2, lampM, x, h - 0.05, z, G).castShadow = false; lightPool(x, z, 3.6, new THREE.Color(0.2, 0.17, 0.12), G); }
  // 六根承重柱（石狮撞上去会晕）
  const pm = M(0x6a727c), band = M(0xd8a818);
  [[-7, -7], [7, -7], [-7, 1], [7, 1], [-7, 9], [7, 9]].forEach(([x, z]) => { box(1.4, h, 1.4, pm, x, h / 2, z, G); box(1.5, 0.4, 1.5, band, x, 1.1, z, G).castShadow = false; addColH(G, x - 0.7, x + 0.7, z - 0.7, z + 0.7, h).pillar = true; });
  // 货架（靠墙）
  const shelfM = M(0x4a4038), boxM = crateM2;
  const shelf = (x, z, len, ry) => { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; G.add(g); for (let y = 0.05; y < 3.2; y += 1.05) box(len, 0.08, 1.0, shelfM, 0, y, 0, g); [-1, 1].forEach(s => box(0.1, 3.2, 1.0, shelfM, s * len / 2, 1.6, 0, g)); for (let i = 0; i < len / 1.1 - 1; i++) for (let j = 0; j < 3; j++) if (Math.random() < 0.7) box(0.7, 0.6, 0.6, boxM, -len / 2 + 0.7 + i * 1.1, 0.4 + j * 1.05, 0, g); };
  shelf(-hx + 0.6, -6, 8, Math.PI / 2); shelf(-hx + 0.6, 6, 8, Math.PI / 2); shelf(hx - 0.6, -6, 8, Math.PI / 2); shelf(hx - 0.6, 6, 8, Math.PI / 2);
  addColH(G, -hx, -hx + 1.1, -10, -2, 3.2); addColH(G, -hx, -hx + 1.1, 2, 10, 3.2); addColH(G, hx - 1.1, hx, -10, -2, 3.2); addColH(G, hx - 1.1, hx, 2, 10, 3.2);
  // 证物：兵马俑摆件（不会动的那些）、铜鼎、镜子
  const clay = M(0xa86a48);
  [-10, -6, 6, 10].forEach((x, i) => { const g = new THREE.Group(); g.position.set(x, 0, -hz + 1.6); G.add(g); box(0.9, 0.3, 0.9, M(0x3a3028), 0, 0.15, 0, g); mesh(new THREE.CylinderGeometry(0.28, 0.38, 1.1, 10), clay, 0, 0.85, 0, g); mesh(new THREE.SphereGeometry(0.2, 10, 8), clay, 0, 1.6, 0, g); box(0.25, 0.12, 0.25, clay, 0, 1.78, 0, g); [-1, 1].forEach(s => mesh(new THREE.CylinderGeometry(0.08, 0.07, 0.6, 6), clay, s * 0.33, 1.05, 0.08, g).rotation.x = -0.6); addColH(G, x - 0.45, x + 0.45, -hz + 1.15, -hz + 2.05, 1.9); });
  const bronze = MS(0x7a5a2a, { metalness: 0.75, roughness: 0.4 });
  { const g = new THREE.Group(); g.position.set(-12, 0, 13); G.add(g); mesh(new THREE.CylinderGeometry(0.8, 0.65, 0.9, 16), bronze, 0, 0.75, 0, g); [0, 1, 2].forEach(i => { const a = i / 3 * TAU; mesh(new THREE.CylinderGeometry(0.08, 0.06, 0.4, 6), bronze, Math.sin(a) * 0.55, 0.2, Math.cos(a) * 0.55, g); }); [-1, 1].forEach(s => mesh(new THREE.TorusGeometry(0.18, 0.04, 6, 12), bronze, s * 0.7, 1.3, 0, g, false).rotation.y = Math.PI / 2); addColH(G, -12.8, -11.2, 12.2, 13.8, 1.3); }
  // 石狮的基座（第十四章前它就蹲在这里）
  box(3.4, 0.5, 3.4, M(0x4a4a4a), 0, 0.25, -11, G); addColH(G, -1.7, 1.7, -12.7, -9.3, 0.5).noLos = true;
  lionStatue = new Lion('lion', VT.x, VT.z - 11); lionStatue.hb.remove(); lionStatue.rig.root.position.set(VT.x, 0.5, VT.z - 11); lionStatue.rig.root.rotation.y = 0; lionStatue.pose(0.016, 0); lionStatue.eyeM.color.setRGB(0.15, 0.13, 0.1); G.add(lionStatue.rig.root); lionStatue.rig.root.position.set(0, 0.5, -11);
  plane(5.5, 1, new THREE.MeshBasicMaterial({ map: _tex.sign('超自然证物库 · 第 7 号', 640, 110, '#3a0c0c', '#ffd8a0') }), 0, 6, hz - 0.05, Math.PI, G);
  plane(2.4, 2.4, M(0xffffff, { map: S13_LOGO }), 0, 5.2, -hz + 0.05, 0, G);
  BATCH.push(Object.assign(staticBatch([G], new Set([lionStatue.rig.root])), { cx: VT.x, cz: VT.z, r: 90 }));
  BATCH.push({ group: G, cx: VT.x, cz: VT.z, r: 90 });
})();
AREA_DEF.vault = () => ({ cx: VT.x, cz: VT.z, hx: VT.hx - 0.5, hz: VT.hz - 0.5, room: true, h: VT.h, sun: 1.0, sunC: 0xffe0b8, hemi: [0xd8c0a0, 0x2a2420, 1.1], fog: [0x100c0a, 26, 80], night: true, occl: 1, ep4: 1, squad: 1 });
spawnWeapon(2, VT.x - 12, VT.z + 4); spawnWeapon(1, VT.x + 12, VT.z - 12);

// ================= 货运升降井 =================
const SHAFTV = { tex: null, rails: [], moving: false, t: 0, script: 0 };
(function buildShaft() {
  const G = new THREE.Group(); G.position.set(SH.x, 0, SH.z); scene.add(G); AREA_GROUPS.shaft = G;
  const { hx, hz } = SH;
  const fl = mesh(new THREE.PlaneGeometry(hx * 2, hz * 2), MS(0xffffff, { map: metalFloor('#454b52', 'rgba(15,18,22,.85)'), roughness: 0.55, metalness: 0.4 }), 0, 0.002, 0, G, false); fl.rotation.x = -Math.PI / 2; fl.receiveShadow = true; fl.material.map.repeat.set(3, 3);
  // 边缘警示条
  const hz2 = canvasTex(256, 32, (g, W, H) => { g.fillStyle = '#111'; g.fillRect(0, 0, W, H); g.fillStyle = '#e0b018'; for (let i = -2; i < 16; i++) { g.beginPath(); g.moveTo(i * 20, 0); g.lineTo(i * 20 + 10, 0); g.lineTo(i * 20 - 6, H); g.lineTo(i * 20 - 16, H); g.fill(); } }); hz2.repeat.set(6, 1);
  const hm = M(0xffffff, { map: hz2 });
  [[0, -hz + 0.25, hx * 2, 0.5], [0, hz - 0.25, hx * 2, 0.5], [-hx + 0.25, 0, 0.5, hz * 2], [hx - 0.25, 0, 0.5, hz * 2]].forEach(([x, z, w, d]) => { const m = mesh(new THREE.PlaneGeometry(w, d), hm, x, 0.01, z, G, false); m.rotation.x = -Math.PI / 2; });
  // 平台下沿 + 护栏
  box(hx * 2, 0.6, hz * 2, M(0x2a2e33), 0, -0.3, 0, G).castShadow = false;
  const rail = M(0xd8a818);
  [[-1, 0], [1, 0], [0, -1], [0, 1]].forEach(([sx, sz]) => { const L = sx ? hz * 2 : hx * 2; const x = sx * (hx + 0.15), z = sz * (hz + 0.15); box(sx ? 0.08 : L, 0.08, sx ? L : 0.08, rail, x, 1.05, z, G).castShadow = false; for (let i = -L / 2; i <= L / 2; i += 1.5) box(0.08, 1.05, 0.08, rail, x + (sx ? 0 : i), 0.52, z + (sx ? i : 0), G).castShadow = false; });
  // 井壁：滚动贴图（平台上升时往下掠过）
  const st = canvasTex(256, 1024, (g, W, H) => { g.fillStyle = '#30353b'; g.fillRect(0, 0, W, H); for (let i = 0; i < 3000; i++) { const v = 30 + Math.random() * 30 | 0; g.fillStyle = `rgba(${v},${v},${v + 4},.4)`; g.fillRect(Math.random() * W, Math.random() * H, 3, 3); } g.fillStyle = '#1a1d21'; for (let y = 0; y < H; y += 256) { g.fillRect(0, y, W, 24); g.fillStyle = '#d8a818'; for (let x = 0; x < W; x += 32) g.fillRect(x, y + 6, 16, 12); g.fillStyle = '#1a1d21'; } g.fillStyle = 'rgba(255,220,150,.85)'; for (let y = 128; y < H; y += 256) { g.fillRect(40, y, 30, 10); g.fillRect(W - 70, y, 30, 10); } g.fillStyle = '#d8d0b8'; g.font = 'bold 48px sans-serif'; for (let y = 200, n = 9; y < H; y += 256, n--) g.fillText('B' + n, 100, y); });
  st.repeat.set(2, 3); SHAFTV.tex = st;
  const wm = new THREE.MeshBasicMaterial({ map: st, color: 0x9aa0a8 });
  const D = 3; [[0, -hz - D, 0], [0, hz + D, Math.PI], [-hx - D, 0, Math.PI / 2], [hx + D, 0, -Math.PI / 2]].forEach(([x, z, r]) => { const m = mesh(new THREE.PlaneGeometry((r % Math.PI ? hz : hx) * 2 + D * 2, 50), wm, x, 5, z, G, false); m.rotation.y = r; });
  // 导轨
  [[-hx - 1, -hz - 1], [hx + 1, -hz - 1], [-hx - 1, hz + 1], [hx + 1, hz + 1]].forEach(([x, z]) => box(0.4, 50, 0.4, M(0x6a6a6a), x, 5, z, G).castShadow = false);
  // 中央升降机控制柱
  box(1.0, 1.2, 1.0, M(0x2a2e33), 0, 0.6, 0, G); const lamp = mesh(new THREE.SphereGeometry(0.16, 10, 8), glowMat(3, 1.4, 0.2), 0, 1.35, 0, G, false); SHAFTV.lamp = lamp; addColH(G, -0.5, 0.5, -0.5, 0.5, 1.2);
  lightPool(0, 0, 6, new THREE.Color(0.22, 0.18, 0.1), G);
  [[-hx + 1, -hz + 1], [hx - 1, hz - 1]].forEach(([x, z]) => { box(1.2, 0.9, 1.2, crateM2, x, 0.45, z, G); addColH(G, x - 0.6, x + 0.6, z - 0.6, z + 0.6, 0.9); });
  BATCH.push(Object.assign(staticBatch([G], new Set([lamp])), { cx: SH.x, cz: SH.z, r: 70 }));
  BATCH.push({ group: G, cx: SH.x, cz: SH.z, r: 70 });
})();
AREA_DEF.shaft = () => ({ cx: SH.x, cz: SH.z, hx: SH.hx - 0.4, hz: SH.hz - 0.4, room: true, h: SH.h, sun: 1.2, sunC: 0xffd8a0, hemi: [0xc0b8a8, 0x2a2622, 1.15], fog: [0x0c0c0e, 18, 60], night: true, ep4: 1, squad: 1 });

// ================= 云端飞艇甲板 =================
const SHIP = { clouds: [], cloudTex: null, props: [], crate: null, gustT: 4 };
(function buildShip() {
  const G = new THREE.Group(); G.position.set(AS.x, 0, AS.z); scene.add(G); AREA_GROUPS.deck = G;
  const { hx, hz } = AS;
  const deckT = _tex.planks(['#6a4a30', '#5e4128', '#74522f', '#654528']); deckT.repeat.set(2, 6);
  const fl = mesh(new THREE.PlaneGeometry(hx * 2 + 1, hz * 2 + 2), M(0xffffff, { map: deckT }), 0, 0.002, 0, G, false); fl.rotation.x = -Math.PI / 2; fl.receiveShadow = true;
  // 船体
  const hullM = M(0x22262c), trimM = M(0x8a1c1c), brass = M(0xc89a3a, { emissive: 0x1a1004 });
  box(hx * 2 + 1.2, 1.6, hz * 2 + 2, hullM, 0, -0.82, 0, G);
  const bow = mesh(new THREE.ConeGeometry(hx + 0.6, 7, 4, 1), hullM, 0, -0.82, -hz - 4.4, G); bow.rotation.x = -Math.PI / 2; bow.rotation.y = Math.PI / 4; bow.scale.set(1, 1, 0.23);
  box(hx * 2 + 1.3, 0.2, 0.3, trimM, 0, 0.0, hz + 1.05, G);
  // 护栏
  [-1, 1].forEach(s => { box(0.1, 0.1, hz * 2 + 2, brass, s * (hx + 0.5), 1.05, 0, G).castShadow = false; for (let z = -hz - 1; z <= hz + 1; z += 1.6) box(0.08, 1.05, 0.08, brass, s * (hx + 0.5), 0.52, z, G).castShadow = false; });
  box(hx * 2 + 1, 0.1, 0.1, brass, 0, 1.05, hz + 1, G).castShadow = false;
  // 驾驶舱（船头）
  const cab = new THREE.Group(); cab.position.set(0, 0, -hz + 1.5); G.add(cab);
  box(6, 3, 3, M(0x2e333a), 0, 1.5, -1.5, cab); box(5.4, 1, 0.06, glowMat(1.2, 1.0, 0.6), 0, 2.2, 0.02, cab).castShadow = false;
  plane(2.4, 2.8, new THREE.MeshBasicMaterial({ map: _tex.hand() }), 0, 1.5, 0.05, 0, cab);
  addColH(G, -3, 3, -hz - 1.5, -hz + 1.5, 3);
  // 货箱、绞盘、绳索
  const lowC = (x, z, s = 1.2) => { box(s, s, s, crateM2, x, s / 2, z, G); addColH(G, x - s / 2, x + s / 2, z - s / 2, z + s / 2, s); };
  lowC(-4.5, -9); lowC(4.8, -3, 1.4); lowC(-5, 6); lowC(4.6, 12); lowC(-3.8, 15.5, 1.0);
  // T-13 的大货箱
  const tc = new THREE.Group(); tc.position.set(0, 0, -12); G.add(tc); SHIP.crate = tc;
  box(2.6, 3.2, 2.6, M(0x3a4048), 0, 1.6, 0, tc); [-1, 1].forEach(s => box(2.7, 0.2, 0.2, M(0xd8a818), 0, 1.6 + s * 1.2, 1.31, tc).castShadow = false);
  plane(1.8, 0.8, new THREE.MeshBasicMaterial({ map: _tex.sign('T-13', 256, 110, '#c8ced6', '#b02020') }), 0, 2.2, 1.32, 0, tc);
  SHIP.crateCol = addColH(G, -1.3, 1.3, -13.3, -10.7, 3.2);
  // 桅杆与绳索 → 气囊
  const mast = (x, z) => { mesh(new THREE.CylinderGeometry(0.12, 0.16, 12, 8), M(0x3a2a1a), x, 6, z, G); addColH(G, x - 0.2, x + 0.2, z - 0.2, z + 0.2, 12); };
  mast(-3, 2); mast(3, 2);
  const env = mesh(new THREE.SphereGeometry(1, 32, 16), M(0x30343a), 0, 17, 0, G); env.scale.set(10, 6.5, 30); env.castShadow = false;
  const envB = mesh(new THREE.TorusGeometry(1, 0.012, 6, 48), trimM, 0, 17, 0, G, false); envB.scale.set(10.05, 30.1, 6.6); envB.rotation.y = Math.PI / 2;
  plane(8, 8, new THREE.MeshBasicMaterial({ map: _tex.hand(), transparent: true }), 10.05, 17, 0, Math.PI / 2, G);
  const ropeM = M(0x6a5a40);
  for (let z = -16; z <= 16; z += 8) [-1, 1].forEach(s => { const a = new THREE.Vector3(s * (hx + 0.5), 1.05, z), b = new THREE.Vector3(s * 6.5, 12.5, z * 0.85); const L = a.distanceTo(b); const r = mesh(new THREE.CylinderGeometry(0.03, 0.03, L, 4), ropeM, (a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2, G, false); r.lookAt(G.localToWorld(b.clone())); r.rotateX(Math.PI / 2); });
  // 船尾引擎 + 螺旋桨
  [-1, 1].forEach(s => { const e = new THREE.Group(); e.position.set(s * (hx + 2.4), 0.6, hz - 1); G.add(e); mesh(new THREE.CylinderGeometry(0.7, 0.9, 2.6, 14), hullM, 0, 0, 0, e).rotation.x = Math.PI / 2; box(2.2, 0.3, 0.4, hullM, -s * 1.1, 0, -0.4, e); const pr = new THREE.Group(); pr.position.set(0, 0, 1.45); e.add(pr); for (let i = 0; i < 3; i++) { const b = box(0.3, 2.6, 0.06, M(0x7a6a4a), 0, 0, 0, pr); b.rotation.z = i / 3 * TAU; b.geometry.translate(0, 1.2, 0); } SHIP.props.push(pr); });
  // 云海
  const ct = canvasTex(512, 512, (g, W) => { g.clearRect(0, 0, W, W); for (let i = 0; i < 70; i++) { const x = Math.random() * W, y = Math.random() * W, r = rand(30, 90), gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, 'rgba(255,255,255,.85)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); } });
  ct.repeat.set(4, 4); SHIP.cloudTex = ct;
  const sea = mesh(new THREE.PlaneGeometry(600, 600), new THREE.MeshBasicMaterial({ map: ct, transparent: true, opacity: 0.95, color: 0xffe8d8, depthWrite: false, fog: false }), 0, -22, 0, G, false); sea.rotation.x = -Math.PI / 2;
  const sea2 = mesh(new THREE.PlaneGeometry(600, 600), new THREE.MeshBasicMaterial({ color: 0x9ab0d0, fog: false }), 0, -30, 0, G, false); sea2.rotation.x = -Math.PI / 2;
  const puffM = M(0xfff4ec, { emissive: 0x4a4038 });
  for (let i = 0; i < 9; i++) { const g = new THREE.Group(); for (let k = 0; k < 5; k++) mesh(new THREE.SphereGeometry(rand(2, 3.5), 10, 8), puffM, rand(-3, 3), rand(-0.8, 0.8), rand(-2, 2), g, false); g.position.set((i % 2 ? 1 : -1) * rand(20, 45), rand(-12, 4), rand(-120, 120)); G.add(g); SHIP.clouds.push(g); }
  BATCH.push(Object.assign(staticBatch([G], new Set([tc, ...SHIP.props, ...SHIP.clouds, sea])), { cx: AS.x, cz: AS.z, r: 120 }));
  BATCH.push({ group: G, cx: AS.x, cz: AS.z, r: 120 });
})();
AREA_DEF.deck = () => ({ cx: AS.x, cz: AS.z, hx: AS.hx - 0.4, hz: AS.hz - 0.4, room: false, sun: 2.4, sunC: 0xffc89a, hemi: [0xffd8c0, 0x6a7090, 1.2], fog: [0xc8b8c8, 60, 220], night: false, ep4: 1, squad: 1, occl: 1 });
spawnWeapon(4, AS.x + 4, AS.z + 6); spawnWeapon(0, AS.x - 5, AS.z - 3);
// 阵风：青色风带横扫甲板，蹲下（C）抓稳；站着会被吹走（敌人也一样）
const GUST = { list: [] };
function spawnGust() {
  const z = AS.z + rand(-AS.hz + 3, AS.hz - 3), s = Math.random() < 0.5 ? 1 : -1, w = 5;
  const T = Tele.add({ shape: 'lane', x: AS.x - s * (AS.hx + 0.3), z, yaw: s * Math.PI / 2, w, len: AS.hx * 2 + 0.6, wind: 1.5, col: 'cyan',
    onFire: (T) => { GUST.list.push({ z, s, w, t: 0 }); Foley.at('swishL', player.pos, { vol: 0.8, rate: 0.5 }); Foley.at('cloth', player.pos, { vol: 0.6, rate: 0.7 }); } });
  if (!SHIP.gustTold) { SHIP.gustTold = 1; tip('侧风来了！青色风带——按 C 蹲下抓稳', 2.5); }
  return T;
}
function updateGusts(dt) {
  for (let i = GUST.list.length - 1; i >= 0; i--) {
    const g = GUST.list[i]; g.t += dt; if (g.t > 1.1) { GUST.list.splice(i, 1); continue; }
    if (Math.random() < dt * 40) burst(new THREE.Vector3(AS.x - g.s * AS.hx + g.s * rand(0, AS.hx * 2), rand(0.3, 2), g.z + rand(-g.w / 2, g.w / 2)), 0xffffff, 1, 6);
    for (const e of [player, ...enemies]) {
      if (e.dead || Math.abs(e.pos.z - g.z) > g.w / 2 + 0.3) continue;
      if (e === player) { if (player.crouch && player.grounded) { if (!g.saidP) { g.saidP = 1; floatText(player.pos.clone().setY(1.6), '蹲稳了！', '#7fe8ff', 22); } continue; } if (player.state === 'dead') continue; player.pos.x += g.s * 7.5 * dt; if (!g.toldP) { g.toldP = 1; floatText(player.pos.clone().setY(1.8), '被风吹走了！', '#7fe8ff', 22); } }
      else if (!e.beast || e.type !== 't13') { e.pos.x += g.s * (e.beast ? 4 : 6.5) * dt; }
    }
  }
}

// ================= 波次与章节 =================
WAVES.push(
  { title: '第十二章 · 潜入第十三区', sub: '别被发现：蹲下潜行，背后按 F 制伏；到最里面的控制台按住 E', list: GUARD_ROUTES.map(() => 'guard13'), at: GUARD_ROUTES.map(R => R.at), objective: () => B13S.hacked && (!SNEAK.alarm || !enemies.some(e => !e.dead && Math.hypot(e.pos.x - player.pos.x, e.pos.z - player.pos.z) < 9)) },
  { title: '第十三章 · 活过来的文物库', sub: '陶俑有霸体——用重击！铜鼠很快但很脆', list: ['terra', 'rat', 'terraG', 'rat', 'terra', 'rat', 'terraG', 'rat'], at: [[-4, -5], [-2, -3], [4, -5], [2, -3], [0, -8], [-6, 3], [6, 3], [0, 4]] },
  { title: '第十四章 · 镇墓石狮', sub: '红色预警只能躲；引它撞柱子会晕；琥珀色爪击可以完美格挡', list: ['lion'], at: [[0, -9]], boss: 1 },
  { title: '第十五章 · 货运升降井', sub: '无人机瞄准线变亮就开火——完美格挡把光弹打回去；看地上红圈躲空降忍者', list: ['drone', 'drone'], at: [[-4, -4], [4, -4]], objective: () => SHAFTV.script >= 4 && !enemies.some(e => !e.dead), script: (dt) => shaftScript(dt) },
  { title: '第十六章 · 云端飞艇', sub: '他们会包抄你——别被围住！青色风带来了就蹲下', list: ['ratso4', 'thug', 'ninja', 'thug', 'brute'], at: [[0, -6], [-4, -2], [4, -2], [-3, 8], [3, 9]], boss: 1, script: (dt) => { if ((SHIP.gustT -= dt) <= 0) { SHIP.gustT = rand(6, 9); spawnGust(); } updateGusts(dt); } },
  { title: '第十七章 · T-13', sub: '它会学习你的习惯——看右边的分析面板，经常换打法！', list: ['t13'], at: [[0, -9]], boss: 1, script: (dt) => { if ((SHIP.gustT -= dt) <= 0) { SHIP.gustT = rand(11, 15); spawnGust(); } updateGusts(dt); } },
);
CHAPTERS.push(
  { w: 12, n: '第十二章', t: '潜入第十三区', d: '第四集 · 潜行：视野、摄像头与激光', ep: 4 },
  { w: 13, n: '第十三章', t: '活过来的文物库', d: '第四集 · 陶俑与铜鼠', ep: 4 },
  { w: 14, n: '第十四章', t: '镇墓石狮', d: '第四集 · 冲撞、扑击与怒吼', ep: 4 },
  { w: 15, n: '第十五章', t: '货运升降井', d: '第四集 · 无人机与空降忍者', ep: 4 },
  { w: 16, n: '第十六章', t: '云端飞艇', d: '第四集 · 小队包抄与侧风', ep: 4 },
  { w: 17, n: '第十七章', t: 'T-13', d: '第四集 · 会学习的安保机甲', ep: 4 },
);
EP_TITLE[4] = '第四集 · 鼠之护身符';
function shaftScript(dt) {
  SHAFTV.t += dt; const t = SHAFTV.t;
  const drop = (type, dx, dz) => { const p = player, x = clamp(p.pos.x + dx, SH.x - SH.hx + 1.2, SH.x + SH.hx - 1.2), z = clamp(p.pos.z + dz, SH.z - SH.hz + 1.2, SH.z + SH.hz - 1.2);
    Tele.add({ shape: 'circle', x, z, r: 1.4, wind: 1.1, col: 'red', onFire: (T) => { const e = spawnAt(type, T.x, T.z); e.pos.y = 0; shake = Math.max(shake, 0.2); shock(new THREE.Vector3(T.x, 0.05, T.z), 0xff4a3a, 1.6); burst(new THREE.Vector3(T.x, 0.3, T.z), 0xc9a27a, 20, 4); impact('fall', { pos: e.pos }); if (Tele.inside(T, player.pos) && player.pos.y < 1.2) playerTakeHit(e, 14, { kd: 1, unblockable: 1 }); } }); };
  const steps = [[7, () => { drop('ninja', 2, 2); drop('ninja', -2.5, -1); }], [17, () => { spawnAt('drone', SH.x + 6, SH.z + 6).pos.y = 6; drop('ninja', 0, 2.5); }], [27, () => { drop('ninja', 2, -2); drop('ninja', -2, 2); spawnAt('drone', SH.x - 6, SH.z - 6).pos.y = 6; }], [36, () => { banner('快到顶层了！<small>清掉剩下的敌人</small>', 2); }]];
  while (SHAFTV.script < steps.length && t >= steps[SHAFTV.script][0]) { steps[SHAFTV.script][1](); SHAFTV.script++; }
  // 前一批全清了就提前放下一批
  if (SHAFTV.script < steps.length && !enemies.some(e => !e.dead) && t < steps[SHAFTV.script][0] - 2) SHAFTV.t = steps[SHAFTV.script][0] - 2;
}

// ================= 第四集剧情 =================
Object.assign(WHO, {
  black: { n: '布莱克上尉（耳机）', c: '#7fb8ff', e: () => player },
  t13: { n: 'T-13', c: '#ff7a5a', e: () => enemies.find(e => e.type === 't13') || player },
  uncleP: { n: '老爹（电话）', c: '#8cff7a', e: () => player },
});
let ratsoActor = null;
function ratsoIn(x, z) { ratsoActor = spawnAt('ratso4', x, z); ratsoActor.hb.style.display = 'none'; return ratsoActor; }
function ratsoOut() { const r = ratsoActor; if (!r) return; burst(r.pos.clone().setY(1), 0x333344, 40, 4); Foley.at('swishH', r.pos, { vol: 0.5 }); r.rig.root.removeFromParent(); r.hb.remove(); r.dead = true; r.gone = true; const i = enemies.indexOf(r); if (i >= 0) enemies.splice(i, 1); ratsoActor = null; }
const EP4_PROLOGUE = [
  { who: 'narr', text: '第四集 · 鼠之护身符', act: () => sfx('clang'), shot: () => [SC.x + 2.5, 2.2, SC.z + 1, SC.x, 1.3, SC.z - 4] },
  { who: 'jade', text: '成龙！布莱克上尉的电话！他说十万火急！', act: () => jade.mood = 'cheer' },
  { who: 'black', text: '成龙，第十三区的地下基地出事了。黑手帮的拉索混了进来——他手里有鼠之护身符。', act: () => jade.mood = null },
  { who: 'uncle', text: '鼠符！拿着它的人能让没有生命的东西活过来！石头、铜像、机器……统统会动！', act: () => uncle.mood = 'scold' },
  { who: 'jackie', text: '机器？上尉，你们基地里不是有很多……', to: 'uncle' },
  { who: 'black', text: '没错。还有我们最新的安保机甲 T-13。它会学习对手的战斗习惯——要是被拉索唤醒……', act: () => uncle.mood = null },
  { who: 'black', text: '更糟的是，他的人穿着我们的制服，控制了外围。警报一响，他们就会带着护身符跑掉。' },
  { who: 'jackie', text: '所以我得……偷偷溜进去。', to: 'uncle' },
  { who: 'uncle', text: '一定要把鼠符拿回来！还有，不许碰坏第十三区的东西——我们赔不起！', act: () => uncle.mood = 'scold' },
  { who: 'jade', text: '我也去！我最会躲猫猫了！', act: () => { uncle.mood = null; jade.mood = 'cheer'; } },
  { who: 'jackie', text: '不行。', to: 'jade' },
  { fade: () => Story.toBase() },
];
const BASE_INTRO = [
  { who: 'narr', text: '第十三区 · 地下基地 · 外围仓储区', shot: () => [B13.x - 30, 5, B13.z + 9, B13.x - 18, 1, B13.z - 4] },
  { who: 'black', text: '我是布莱克。听得到吗？摄像头被他们黑了，守卫全是假的。', shot: () => [B13.x - 39.5, 1.8, B13.z + 1.6, B13.x - 36, 1.2, B13.z - 1] },
  { who: 'black', text: '守卫头上的“？”涨满就会变成“！”。按 C 蹲下走路没有声音，躲在矮箱子后面蹲着就看不见你。' },
  { who: 'black', text: '从背后靠近按 F 可以悄悄放倒他们。被发现了，就赶在他用无线电呼叫之前把他打倒！', shot: () => [B13.x - 27, 2.4, B13.z - 3, B13.x - 30, 1.2, B13.z - 6.5] },
  { who: 'black', text: '门口有激光绊线：低的跳过去，高的蹲着钻过去。大厅西墙有电闸，拉下来摄像头就瞎了。', shot: () => [B13.x - 18.5, 1.6, B13.z + 1.5, B13.x - 14.5, 0.8, B13.z] },
  { who: 'black', text: '目标是最里面的金库控制台。北边还有一条通风暗道，可以绕开大厅。', shot: () => [B13.x - 19, 2.2, B13.z + 9.5, B13.x - 14, 1.4, B13.z + 9.8] },
  { who: 'jackie', text: '（小声）明白……成龙式潜入，开始。', to: 'narr' },
];
EP4_PROLOGUE.push(...BASE_INTRO);
const VAULT_INTRO = [
  { who: 'narr', text: () => `潜入评价：${(Story.b13 || baseRating()).n}——${(Story.b13 || baseRating()).d}`, act: () => { B13S.door.position.x = -2.5; burst(new THREE.Vector3(B13.x + 42, 2.8, B13.z), 0xdddddd, 30, 3); Foley.at('mech', player.pos, { vol: 0.9, rate: 0.5 }); }, shot: () => [B13.x + 36, 2.6, B13.z + 4, B13.x + 44, 2.8, B13.z] },
  { fade: () => Story.toVault() },
  { who: 'narr', text: '（金库里堆满了第十三区收缴的各种古怪证物）', shot: () => [VT.x + 9, 5, VT.z + 13, VT.x, 1.5, VT.z - 6] },
  { who: 'jackie', text: '兵马俑？石狮子？上尉，你们这里是博物馆吗？', to: 'narr' },
  { who: 'black', text: '是“超自然证物库”。别乱碰任何东西。' },
  { who: 'ratso', text: '嘿嘿嘿，晚了一步，成龙！', act: () => { ratsoIn(VT.x + 1.5, VT.z - 6); }, shot: () => [VT.x + 0.8, 2.2, VT.z + 1, VT.x + 1.5, 1.4, VT.z - 6] },
  { who: 'ratso', text: '老大说了，鼠符能让死东西活过来。你看好了——' },
  { who: 'narr', text: '（拉索举起一块刻着老鼠的护身符，一道绿光扫过整个仓库）', act: () => { const r = ratsoActor; if (r) { shock(r.pos.clone().setY(0.1), 0x9adf7a, 5); burst(r.pos.clone().setY(1.8), 0x9adf7a, 50, 7); } Foley.at('spell', player.pos, { vol: 0.8 }); shake = 0.2; } },
  { who: 'narr', text: '（陶俑的眼睛亮了，架子上的铜鼠吱吱乱叫着跳了下来）', act: () => { spawnWave(13); enemies.forEach(e => { if (e !== ratsoActor) burst(e.pos.clone().setY(1), 0x9adf7a, 16, 3); }); Foley.at('chitter', player.pos, { vol: 0.7 }); }, shot: () => [VT.x - 3, 2.4, VT.z + 4, VT.x, 1, VT.z - 4] },
  { who: 'ratso', text: '陪它们玩吧！我还要去叫醒那个大家伙！', act: () => {} },
  { who: 'narr', text: '（拉索一溜烟钻进了后门）', act: () => ratsoOut() },
  { who: 'jackie', text: '陶俑……不是应该在西安吗？！', to: 'narr' },
  { who: 'black', text: '陶俑很硬，普通拳脚打不动，用重击（右键）！' },
];
const LION_INTRO = [
  { who: 'narr', text: '（仓库中央，镇墓石狮“咔啦啦”地抖落一身灰尘）', act: () => { shake = 0.25; Foley.at('stone', player.pos, { vol: 0.9 }); if (lionStatue) burst(lionStatue.rig.root.getWorldPosition(new THREE.Vector3()).setY(1.5), 0x9a9080, 40, 4); }, shot: () => [VT.x + 4, 2.4, VT.z - 4, VT.x, 1.5, VT.z - 11] },
  { who: 'jackie', text: '好狗狗……好狮子……', to: 'narr', act: () => { if (lionStatue) lionStatue.rig.root.visible = false; spawnWave(14); const l = enemies.find(e => e.type === 'lion'); if (l) { l.pos.set(VT.x, 0, VT.z - 9.5); l.yaw = 0; } Foley.at('roar', player.pos, { vol: 0.9, rate: 0.8 }); } },
  { who: 'black', text: '成龙，看地上的红色预警：直线是冲撞，圆圈是扑击。红色的挡不住，只能躲！' },
  { who: 'black', text: '琥珀色的扇形是爪击，可以格挡——完美格挡还能让它露出破绽。' },
  { who: 'jade', text: '成龙！让它撞柱子！它撞晕了就不能还手！', act: () => { jade.place(VT.x - 12.5, VT.z + 13.5, Math.PI); jade.mood = 'cheer'; } },
  { who: 'jackie', text: '小玉？！你怎么进来的？！', to: 'jade' },
  { who: 'jade', text: '通风管道啊，你刚才不是也爬过？', act: () => jade.mood = null },
];
const SHAFT_INTRO = [
  { who: 'narr', text: '（石狮碎成了一地石块。远处传来升降机启动的轰鸣）', shot: () => [VT.x + 3, 2.4, VT.z + 2, VT.x, 1, VT.z - 6] },
  { who: 'black', text: '拉索往货运升降井去了，他要去地面的停机坪！成龙，上平台！' },
  { who: 'jade', text: '等等我！', act: () => jade.mood = 'scared' },
  { fade: () => Story.toShaft() },
  { who: 'narr', text: '第十三区 · 货运升降井', shot: () => [SH.x + 6, 5, SH.z + 6, SH.x, 1, SH.z] },
  { who: 'narr', text: '（平台一路向上，井壁飞快地往下掠过）', act: () => { SHAFTV.moving = true; } },
  { who: 'jackie', text: '上尉，平台上为什么有你们的无人机？', to: 'narr', act: () => { spawnWave(15); enemies.forEach(e => { e.pos.y = 5; }); } },
  { who: 'black', text: '……它们也被鼠符“唤醒”了。瞄准线变亮就要开火——可以格挡，完美格挡能把光弹打回去！' },
  { who: 'black', text: '它们飞在半空：跳起来打，或者用弹回去的光弹把它们打下来。' },
  { who: 'jade', text: '还有头顶！忍者会从上面跳下来——看地上的红圈！', act: () => { jade.mood = null; } },
];
const DECK_INTRO = [
  { who: 'narr', text: '（平台冲出地面——停机坪上，一艘黑色飞艇正在升空）', act: () => { SHAFTV.moving = false; }, shot: () => [SH.x + 5, 3, SH.z + 5, SH.x, 6, SH.z] },
  { who: 'jackie', text: '是黑手帮的飞艇！', to: 'narr' },
  { who: 'jade', text: '快跳！', act: () => jade.mood = 'cheer' },
  { fade: () => Story.toDeck() },
  { who: 'narr', text: '云端 · 黑手帮飞艇甲板', shot: () => [AS.x + 12, 6, AS.z + 18, AS.x, 2, AS.z - 4] },
  { who: 'ratso', text: '你还真是阴魂不散啊，成龙！兄弟们，一起上，把他扔下去！', act: () => { spawnWave(16); }, shot: () => [AS.x + 1.5, 2.2, AS.z + 2, AS.x, 1.4, AS.z - 6] },
  { who: 'black', text: '成龙，他们会包抄你——别被围在中间。还有侧风：看到青色的风带就按 C 蹲下抓稳！' },
  { who: 'jackie', text: '我恐高……我恐高……我恐高……', to: 'narr' },
];
const T13_INTRO = [
  { who: 'narr', text: '（拉索摔在一个巨大的货箱旁边，货箱上印着“T-13”）', shot: () => [AS.x + 3, 2.6, AS.z - 6, AS.x, 2, AS.z - 12] },
  { who: 'ratso', text: '你打得赢我……可打不赢它！', act: () => { const r = enemies.find(e => e.type === 'ratso4'); if (r) burst(r.pos.clone().setY(1), 0x9adf7a, 20, 3); } },
  { who: 'narr', text: '（鼠之护身符飞进货箱——箱板炸开，T-13 的面罩亮起了红光）', act: () => { if (SHIP.crate) { burst(SHIP.crate.getWorldPosition(new THREE.Vector3()).setY(1.6), 0x8a929c, 50, 6); SHIP.crate.visible = false; const i = colliders.indexOf(SHIP.crateCol); if (i >= 0) colliders.splice(i, 1); } shake = 0.4; Foley.at('explode', player.pos, { vol: 0.6 }); spawnWave(17); } },
  { who: 't13', text: 'T-13，启动。目标：成龙。开始采集战斗数据。', act: () => Foley.at('beep', player.pos, { vol: 0.6, rate: 0.7 }) },
  { who: 'black', text: '成龙，T-13 会学你的习惯！你老用同一招，它就会专门针对你。' },
  { who: 'black', text: '右边的面板能看到它分析到哪一步了——经常换打法，它就会把数据忘掉。' },
  { who: 'jade', text: '成龙！它砸地以后会冒烟，那时候狠狠打！', act: () => { jade.place(AS.x - 4.5, AS.z + 17, Math.PI); } },
  { who: 'jackie', text: '一台会学习的机器人……我考驾照都考了三次！', to: 'jade' },
];
const EP4_ENDING = [
  { who: 'narr', text: '（T-13 单膝跪倒，胸口的鼠之护身符“啪”地弹了出来）', act: () => { const t = enemies.find(e => e.type === 't13'); burst((t ? t.pos : player.pos).clone().setY(1.8), 0x9adf7a, 40, 5); } },
  { who: 't13', text: '分析……失败……对手……无法……预测……' },
  { who: 'jackie', text: '当然无法预测——我自己都不知道下一招出什么。', to: 't13' },
  { who: 'narr', text: '（成龙接住鼠之护身符。云层下面，第十三区的直升机赶到了）', act: () => { burst(player.pos.clone().setY(1.3), 0x9adf7a, 40, 4); shock(player.pos.clone().setY(0.1), 0x9adf7a, 2); } },
  { who: 'black', text: '干得漂亮，成龙。T-13 我们会带回去……重新编程。' },
  { who: 'jade', text: '能不能把它编程成会写作业的？', act: () => { if (!jade.rig.root.visible) jade.place(player.pos.x - 2, player.pos.z + 2.4, 0); jade.mood = 'cheer'; } },
  { who: 'jackie', text: () => { const r = Story.b13 || { k: 'none' }; return r.k === 'none' ? '第十三区的基地……总算混过去了。' : r.k === 'ghost' ? '而且……基地里一个人都没发现我！' : r.k === 'shadow' ? '基地那边……我只被发现了一点点。' : '基地里的警报……可能是我弄响的。'; }, to: 'jade' },
  { who: 'uncleP', text: '鼠符拿回来了？好！四个了，还有八个！' },
  { who: 'uncleP', text: '还有！第十三区打电话来，说你打碎了他们一只石狮子！' },
  { who: 'jackie', text: '是它先动的手！', to: 'narr' },
  { who: 'uncleP', text: '从你工资里扣！' },
  { who: 'jade', text: '哈哈哈哈！' },
];
Object.assign(Story, {
  toBase() { this.setArea('base'); this.putPlayer(B13.x - 41, B13.z + 0.5, Math.PI / 2); uncle.hide(); jade.hide(); SNEAK.stop(); },
  toVault() { SNEAK.stop(); this.setArea('vault'); this.putPlayer(VT.x, VT.z + 12.5, Math.PI); uncle.hide(); jade.hide(); if (lionStatue) lionStatue.rig.root.visible = true; },
  toShaft() { this.setArea('shaft'); this.putPlayer(SH.x, SH.z + 4.5, Math.PI); uncle.hide(); jade.place(SH.x + 5.6, SH.z + 5.6, -2.3); SHAFTV.t = 0; SHAFTV.script = 0; SHAFTV.moving = false; },
  toDeck() { this.setArea('deck'); this.putPlayer(AS.x, AS.z + 14, Math.PI); uncle.hide(); jade.place(AS.x - 4.5, AS.z + 17, Math.PI); if (SHIP.crate) { SHIP.crate.visible = true; if (!colliders.includes(SHIP.crateCol)) colliders.push(SHIP.crateCol); } SHIP.gustT = 6; GUST.list.length = 0; },
  beginEp4(ch) {
    if (ch === 12) {
      this.setArea('shop'); this.putPlayer(SC.x + 0.4, SC.z - 1.6, Math.PI);
      uncle.place(SC.x, SC.z - 5.3, 0); jade.place(SC.x + 1.7, SC.z - 3.8, -0.6);
      this.play(EP4_PROLOGUE, () => { startWave(12); setupBase(); });
    } else if (ch === 13) { this.toVault(); this.play(VAULT_INTRO.slice(2), () => startWave(13)); }
    else if (ch === 14) { this.toVault(); this.play(LION_INTRO, () => startWave(14)); }
    else if (ch === 15) { this.toShaft(); this.play(SHAFT_INTRO.slice(4), () => { SHAFTV.moving = true; startWave(15); }); }
    else if (ch === 16) { this.toDeck(); this.play(DECK_INTRO.slice(4), () => startWave(16)); }
    else { this.toDeck(); this.play(T13_INTRO, () => startWave(17)); }
  },
  onClearEp4(w, T) {
    if (w === 12) { Story.b13 = baseRating(); try { localStorage.setItem('jc_b13', JSON.stringify(Story.b13)); } catch (e) { } SNEAK.stop(); T(1.0, VAULT_INTRO, () => startWave(13)); }
    else if (w === 13) T(1.6, LION_INTRO, () => startWave(14));
    else if (w === 14) T(2.2, SHAFT_INTRO, () => { SHAFTV.moving = true; startWave(15); });
    else if (w === 15) T(1.6, DECK_INTRO, () => startWave(16));
    else if (w === 16) T(2.0, T13_INTRO, () => startWave(17));
    else T(2.6, EP4_ENDING, () => { try { localStorage.setItem('jc_rat2', '1'); } catch (e) { } ratDesc(); gameEnd(true, 4); });
  },
});
{
  const _b3 = Story.beginEp3.bind(Story), _c3 = Story.onClearEp3.bind(Story);
  Story.beginEp3 = function (ch) { if (ch >= 12) return this.beginEp4(ch); return _b3(ch); };
  Story.onClearEp3 = function (w, T) { if (w >= 12) return this.onClearEp4(w, T); return _c3(w, T); };
  try { const b = localStorage.getItem('jc_b13'); if (b) Story.b13 = JSON.parse(b); if (localStorage.getItem('jc_clear3') === '1') saveProgress(12); } catch (e) { }
}
// 潜入时用博物馆那首安静的配乐，被发现/警报才切战斗
{
  const _pick = BGM.pick.bind(BGM);
  BGM.pick = function () { const r = _pick(); if (AREA.name === 'base' && started && !cutscene && !gameOver && !SNEAK.alarm && !SNEAK.guards.some(g => !g.dead && g.g.mode === 'combat')) return BGM_DATA.museum ? 'museum' : 'temple'; return r; };
}
// 场景动画
{
  const _ua = updateAreas;
  updateAreas = function (dt) {
    _ua(dt);
    if (AREA.name === 'shaft' && SHAFTV.tex) { if (SHAFTV.moving && !gameOver) SHAFTV.tex.offset.y -= dt * 0.12; SHAFTV.lamp.material.color.setRGB(3 * (0.5 + 0.5 * Math.sin(now * 6)), 1.4, 0.2); }
    if (AREA.name === 'deck') { SHIP.props.forEach((p, i) => p.rotation.z += dt * (i ? 14 : -14)); if (SHIP.cloudTex) SHIP.cloudTex.offset.y += dt * 0.01; SHIP.clouds.forEach(c => { c.position.z += dt * 9; if (c.position.z > 140) c.position.z = -140; }); }
    if (AREA.name === 'base' && B13S.hacked && B13S.door.position.x > -2.5) { B13S.door.position.x -= dt * 0.8; B13S.wheel.rotation.x += dt * 3; }
    if (AREA.name === 'base' && B13S.fuseLamp && SNEAK.on) B13S.cams.forEach(c => { });
  };
  const _rs = Menu.resetSession.bind(Menu);
  Menu.resetSession = function () { _rs(); SHAFTV.moving = false; SHAFTV.script = 0; SHAFTV.t = 0; GUST.list.length = 0; ratsoActor = null; B13S.hacked = false; if (lionStatue) lionStatue.rig.root.visible = true; if (SHIP.crate) { SHIP.crate.visible = true; if (!colliders.includes(SHIP.crateCol)) colliders.push(SHIP.crateCol); } B13S.grate.g.visible = true; if (!colliders.includes(B13S.grate.col)) colliders.push(B13S.grate.col); };
}
// ================= 鼠符觉醒（第四集通关奖励）：完美格挡 / 完美闪避时召唤两只铜鼠帮你咬人 =================
const RAT2 = { get on() { try { return localStorage.getItem('jc_rat2') === '1'; } catch (e) { return false; } } };
function ratDesc() { const R = RUNES.find(r => r.key === 'rat'); if (R && RAT2.on) { R.full = '鼠符 · 赋予生命（觉醒）'; R.desc = '武器耐久消耗减半；完美闪避/完美格挡时召唤两只铜鼠帮你咬敌人（8 秒）'; } }
ratDesc();
const ALLY_RATS = [];
function allyRat(x, z) {
  const r = new Rat('rat', x, z); r.hb.remove(); r.ally = true; r.life = 8; r.biteT = 0.5; ALLY_RATS.push(r);
  r.eyeM.color.setRGB(0.4, 3, 0.6); burst(r.pos.clone().setY(0.4), 0x9adf7a, 14, 3);
}
function updateAllyRats(dt) {
  for (let i = ALLY_RATS.length - 1; i >= 0; i--) {
    const r = ALLY_RATS[i]; r.life -= dt;
    if (r.life <= 0) { burst(r.pos.clone().setY(0.3), 0xb07a36, 14, 3); scene.remove(r.rig.root); ALLY_RATS.splice(i, 1); continue; }
    let tg = null, bd = 12; for (const e of enemies) { if (e.dead || e.hidden) continue; const d = Math.hypot(e.pos.x - r.pos.x, e.pos.z - r.pos.z); if (d < bd) { bd = d; tg = e; } }
    const to = tg ? tg.pos : player.pos, dx = to.x - r.pos.x, dz = to.z - r.pos.z, d = Math.hypot(dx, dz) || 1;
    const want = tg ? (tg.radius || 0.4) + 0.4 : 1.6;
    r.steer(dt, d > want ? dx / d : 0, d > want ? dz / d : 0, 6.5, 8); r.face(dt, 10, to);
    if (tg && d < want + 0.3 && (r.biteT -= dt) <= 0) { r.biteT = 0.7; tg.takeHit(6, new THREE.Vector2(dx, dz).normalize(), { kb: 0.5 }, 1, false); floatText(tg.pos.clone().setY(1.1 * (tg.scale || 1)), 6, '#9adf7a', 18); Foley.at('chitter', r.pos, { vol: 0.3, rate: 1.5 }); r.vy = 2.5; }
    r.vy -= 22 * dt; r.pos.y = Math.max(0, r.pos.y + r.vy * dt); if (r.pos.y === 0) r.vy = 0;
    r.pos.x += r.vel.x * dt; r.pos.z += r.vel.z * dt; collideCircle(r.pos, r.radius);
    r.rig.root.position.copy(r.pos); r.rig.root.rotation.y = r.yaw; r.pose(dt, Math.hypot(r.vel.x, r.vel.z));
  }
}
{
  const _ge = gameEvent;
  gameEvent = function (k, d) {
    _ge(k, d);
    if ((k === 'pdodge' || k === 'parry') && Runes.has('rat') && RAT2.on && MODE === 'story' && ALLY_RATS.length < 4) {
      showMove('鼠符 · 铜鼠助阵！', '#9adf7a'); Foley.at('spell', player.pos, { vol: 0.4 });
      [-1, 1].forEach(s => allyRat(player.pos.x + Math.cos(player.yaw) * s * 0.9, player.pos.z - Math.sin(player.yaw) * s * 0.9));
    }
  };
  const _uw = updateWaves; updateWaves = function (dt) { _uw(dt); updateAllyRats(dt); };
  const _rs = Menu.resetSession.bind(Menu); Menu.resetSession = function () { _rs(); ALLY_RATS.forEach(r => scene.remove(r.rig.root)); ALLY_RATS.length = 0; };
}
// ================= 结算 / 菜单 =================
{
  const _ge = gameEnd;
  gameEnd = function (win, ep = 1) {
    if (!(win && ep === 4)) return _ge(win, ep);
    gameOver = true;
    try { sessionStorage.removeItem('jc_ch'); localStorage.setItem('jc_clear', '1'); localStorage.setItem('jc_clear4', '1'); saveProgress(18); } catch (e) { }
    const mins = Math.floor(playTime / 60), secs = Math.floor(playTime % 60), r = Story.b13;
    clearTimeout(gameEndTimer);
    gameEndTimer = setTimeout(() => {
      document.exitPointerLock(); $('pause').classList.remove('show'); $('ov').style.display = 'flex';
      $('ov').querySelector('.box').innerHTML = `<h1>完</h1><h2>第四集 · 鼠之护身符</h2><p>击倒敌人 ${kills} 名 ·${r ? ` 潜入评价「${r.n}」（${r.d}）·` : ''} 用时 ${mins} 分 ${secs} 秒<br>老爹：“四个找回来了……还有八个！”</p><p style="color:#9adf7a">鼠符觉醒！装备鼠符后，完美闪避 / 完美格挡会召唤两只铜鼠帮你咬敌人</p><p style="opacity:.75;font-size:13px">下一集：虎之护身符——喜马拉雅山上的古寺，和另一个自己</p><div class="obtns"><div class="go" data-a="ep5">开始第五集</div><div class="go alt" data-a="menu">返回主界面</div><div class="go alt" data-a="dojo">去练功房</div></div>`;
    }, 1500);
  };
  const _act = Menu.act.bind(Menu);
  Menu.act = function (a, b) { if (a === 'ep4') { this.resetSession(); this.start(() => Story.begin(12)); return; } return _act(a, b); };
}
Menu.refresh();
Object.assign(window.__ep4, { B13S, SHAFTV, T13 });
