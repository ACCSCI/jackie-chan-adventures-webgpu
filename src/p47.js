// ================= 新场景：渔人码头（夜）/ 黑手帮仓库 / 练功房 =================
const DK = { x: 170, z: 0 }, WH = { x: 170, z: -160, hx: 13, hz: 10, h: 8 }, DJ = { x: -170, z: 0, hx: 10, hz: 8, h: 5.2 };
let playTime = 0;
const EP_TITLE = { 1: '第一集 · 公鸡护身符', 2: '第二集 · 龙之护身符', 3: '第三集 · 蛇之护身符' };
const _tex = {
  concrete: (dark) => canvasTex(512, 512, (g, W) => {
    g.fillStyle = dark ? '#3e4044' : '#5b5d60'; g.fillRect(0, 0, W, W);
    for (let i = 0; i < 2600; i++) { const v = (dark ? 50 : 80) + Math.random() * 40 | 0; g.fillStyle = `rgba(${v},${v},${v + 4},.35)`; g.fillRect(Math.random() * W, Math.random() * W, 3, 3); }
    g.strokeStyle = 'rgba(20,20,22,.55)'; g.lineWidth = 3; for (let k = 0; k <= 2; k++) { g.beginPath(); g.moveTo(0, k * 256); g.lineTo(W, k * 256); g.moveTo(k * 256, 0); g.lineTo(k * 256, W); g.stroke(); }
    g.strokeStyle = 'rgba(15,15,15,.35)'; g.lineWidth = 1.5; for (let k = 0; k < 6; k++) { g.beginPath(); let x = Math.random() * W, y = Math.random() * W; g.moveTo(x, y); for (let j = 0; j < 5; j++) { x += rand(-40, 40); y += rand(-40, 40); g.lineTo(x, y); } g.stroke(); }
    for (let k = 0; k < 5; k++) { g.fillStyle = 'rgba(10,10,12,.18)'; g.beginPath(); g.ellipse(Math.random() * W, Math.random() * W, rand(20, 60), rand(10, 40), rand(0, 3), 0, TAU); g.fill(); }
  }, [8, 5]),
  rib: (c1, c2, n = 16) => canvasTex(256, 256, (g, W) => { for (let i = 0; i < n; i++) { g.fillStyle = i % 2 ? c1 : c2; g.fillRect(i * W / n, 0, W / n, W); } g.fillStyle = 'rgba(0,0,0,.18)'; for (let k = 0; k < 40; k++) g.fillRect(Math.random() * W, Math.random() * W, rand(4, 20), rand(2, 30)); }),
  planks: (cols) => canvasTex(512, 512, (g, W) => {
    for (let i = 0; i < 8; i++) {
      g.fillStyle = cols[i % cols.length]; g.fillRect(0, i * 64, W, 64);
      g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(0, i * 64, W, 3);
      const off = (i % 2) * 180; for (let x = off; x < W; x += 360) g.fillRect(x, i * 64, 3, 64);
      g.strokeStyle = 'rgba(40,20,8,.22)'; for (let k = 0; k < 6; k++) { g.beginPath(); const y = i * 64 + 8 + Math.random() * 48; g.moveTo(0, y); g.bezierCurveTo(W * .3, y + 4, W * .6, y - 4, W, y + 2); g.stroke(); }
    }
  }, [4, 4]),
  pool: () => canvasTex(128, 128, (g, W) => { const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(255,255,255,.9)'); gr.addColorStop(0.45, 'rgba(255,255,255,.35)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, W, W); }),
  sign: (txt, w, h, bg, fg, font) => canvasTex(w, h, (g) => { g.fillStyle = bg; g.fillRect(0, 0, w, h); g.strokeStyle = fg; g.lineWidth = 6; g.strokeRect(6, 6, w - 12, h - 12); g.fillStyle = fg; g.font = font || `bold ${h * 0.55 | 0}px "Noto Sans SC",sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(txt, w / 2, h / 2 + 4); }),
  hand: () => canvasTex(256, 320, (g, W, H) => {
    g.fillStyle = '#1a0a0a'; g.fillRect(0, 0, W, H); g.fillStyle = '#b3121b';
    g.beginPath(); g.ellipse(128, 200, 62, 70, 0, 0, TAU); g.fill();
    [[-50, 120, -0.35], [-22, 92, -0.1], [10, 86, 0.05], [42, 98, 0.2]].forEach(([dx, y, r]) => { g.save(); g.translate(128 + dx, y); g.rotate(r); g.beginPath(); g.ellipse(0, 0, 15, 50, 0, 0, TAU); g.fill(); g.restore(); });
    g.save(); g.translate(68, 220); g.rotate(-1.0); g.beginPath(); g.ellipse(0, 0, 16, 42, 0, 0, TAU); g.fill(); g.restore();
    g.fillStyle = '#e8b84a'; g.font = 'bold 40px "Noto Sans SC",sans-serif'; g.textAlign = 'center'; g.fillText('黑手帮', 128, 300);
  }),
};
const POOL_TEX = _tex.pool();
function lightPool(x, z, r, color, parent, y = 0.02) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(r * 2, r * 2), new THREE.MeshBasicMaterial({ map: POOL_TEX, color, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, fog: false }));
  m.rotation.x = -Math.PI / 2; m.position.set(x, y, z); parent.add(m); return m;
}
function plane(w, h, mat, x, y, z, ry, parent) { const m = mesh(new THREE.PlaneGeometry(w, h), mat, x, y, z, parent, false); m.rotation.y = ry || 0; return m; }
function addCol(G, x0, x1, z0, z1) { colliders.push({ x0: G.position.x + x0, x1: G.position.x + x1, z0: G.position.z + z0, z1: G.position.z + z1 }); }
const crateTex2 = canvasTex(128, 128, (g) => { g.fillStyle = '#9a6a3a'; g.fillRect(0, 0, 128, 128); g.fillStyle = '#6a4120'; for (let i = 0; i < 4; i++) g.fillRect(0, i * 32 + 28, 128, 4); g.fillRect(0, 0, 128, 10); g.fillRect(0, 118, 128, 10); g.fillRect(0, 0, 10, 128); g.fillRect(118, 0, 10, 128); g.save(); g.translate(64, 64); g.rotate(Math.PI / 4); g.fillRect(-90, -6, 180, 12); g.restore(); });
const crateM2 = M(0xffffff, { map: crateTex2 }), barrelM2 = M(0x2e4a6a), barrelR = M(0x9a2a1a), hoopM2 = M(0x22252a);
function crate(G, x, z, s, stack) { box(s, s, s, crateM2, x, s / 2, z, G).rotation.y = rand(-0.3, 0.3); if (stack) box(s * 0.8, s * 0.8, s * 0.8, crateM2, x + rand(-0.1, 0.1), s + s * 0.4, z, G).rotation.y = rand(0, 1); addCol(G, x - s / 2, x + s / 2, z - s / 2, z + s / 2); }
function barrel(G, x, z, red) { mesh(new THREE.CylinderGeometry(0.42, 0.42, 1.2, 14), red ? barrelR : barrelM2, x, 0.6, z, G); [0.25, 0.95].forEach(y => mesh(new THREE.TorusGeometry(0.43, 0.025, 5, 18), hoopM2, x, y, z, G, false).rotation.x = Math.PI / 2); addCol(G, x - .42, x + .42, z - .42, z + .42); }
const CONT_COLS = [0xb5452a, 0x2f6a8a, 0x3f7a4a, 0xc89a2a, 0x7a3a6a];
const contMats = CONT_COLS.map(c => M(c, { map: _tex.rib('#ffffff', '#c8c8c8', 24) }));
function container(G, x, z, alongZ, ci, y = 0) {
  const w = alongZ ? 2.5 : 6.1, d = alongZ ? 6.1 : 2.5;
  box(w, 2.6, d, contMats[ci % contMats.length], x, y + 1.3, z, G);
  if (y === 0) addCol(G, x - w / 2, x + w / 2, z - d / 2, z + d / 2);
}
const AREA_GROUPS = {};
// ---------------- 渔人码头 ----------------
let waterTex = null;
(function buildDock() {
  const G = new THREE.Group(); G.position.set(DK.x, 0, DK.z); scene.add(G); AREA_GROUPS.dock = G;
  const fl = mesh(new THREE.PlaneGeometry(70, 30), MS(0xffffff, { map: _tex.concrete(false), roughness: 0.95 }), 0, 0, -1.5, G, false); fl.rotation.x = -Math.PI / 2;
  // 黄色警示线
  const yl = M(0xd8b030);
  [[0, -12.6, 36, 0.18], [0, 12.4, 36, 0.18]].forEach(([x, z, w, d]) => { const m = mesh(new THREE.PlaneGeometry(w, d), yl, x, 0.012, z, G, false); m.rotation.x = -Math.PI / 2; });
  for (let x = -16; x <= 16; x += 4) { const m = mesh(new THREE.PlaneGeometry(0.18, 2.4), yl, x, 0.012, -11.2, G, false); m.rotation.x = -Math.PI / 2; }
  // 木栈道 + 岸边
  const pk = mesh(new THREE.PlaneGeometry(70, 3), M(0xffffff, { map: _tex.planks(['#5a4030', '#634634', '#4f3828']) }), 0, 0.01, 15, G, false); pk.rotation.x = -Math.PI / 2;
  box(70, 0.35, 0.4, M(0x3a2a20), 0, 0.1, 16.4, G);
  for (let x = -34; x <= 34; x += 3.4) mesh(new THREE.CylinderGeometry(0.22, 0.22, 2.4, 10), M(0x2a2018), x, -0.9, 16.6, G);
  const bol = M(0x1e2228);
  for (let x = -16; x <= 16; x += 8) { mesh(new THREE.CylinderGeometry(0.22, 0.28, 0.6, 12), bol, x, 0.3, 14.2, G); mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.1, 12), bol, x, 0.62, 14.2, G); addCol(G, x - .3, x + .3, 13.9, 14.5); }
  // 海水（缓慢流动）
  waterTex = canvasTex(512, 512, (g, W) => { g.fillStyle = '#0c1e36'; g.fillRect(0, 0, W, W); g.strokeStyle = 'rgba(120,160,220,.22)'; g.lineWidth = 2; for (let k = 0; k < 90; k++) { const x = Math.random() * W, y = Math.random() * W, l = rand(10, 40); g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + l / 2, y - 3, x + l, y); g.stroke(); } }, [40, 30]);
  const wa = mesh(new THREE.PlaneGeometry(500, 400), MS(0xffffff, { map: waterTex, roughness: 0.3, metalness: 0.2 }), 0, -0.7, 200, G, false); wa.rotation.x = -Math.PI / 2; wa.receiveShadow = false;
  // 月光倒影
  const mr = mesh(new THREE.PlaneGeometry(9, 140), new THREE.MeshBasicMaterial({ map: POOL_TEX, color: new THREE.Color(0.5, 0.6, 0.9), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, fog: false }), 22, -0.66, 90, G, false); mr.rotation.x = -Math.PI / 2; mr.rotation.z = -0.25;
  // 货轮
  const hull = M(0x262c3a), hullR = M(0x8a1e18), white = M(0xd8d8d0), winG = glowMat(2.2, 1.7, 0.9);
  box(38, 5, 9, hull, 2, 0.8, 27, G); box(38.2, 0.7, 9.2, hullR, 2, -1.3, 27, G); box(38.4, 0.3, 9.4, white, 2, 3.35, 27, G);
  box(8, 4, 6.5, white, -10, 5.3, 27, G); box(6, 1.2, 5, white, -10, 7.9, 27, G);
  for (let i = 0; i < 5; i++) mesh(new THREE.PlaneGeometry(0.9, 0.7), winG, -13.2 + i * 1.6, 5.8, 23.7, G, false).rotation.y = Math.PI;
  mesh(new THREE.CylinderGeometry(0.7, 0.8, 3, 14), hullR, -10, 9.8, 28.5, G); mesh(new THREE.CylinderGeometry(0.08, 0.08, 9, 6), M(0x30343a), 8, 8, 27, G);
  mesh(new THREE.SphereGeometry(0.18, 10, 8), glowMat(3, 0.3, 0.2), 8, 12.6, 27, G, false);
  [[2, 0], [8.5, 1], [15, 2], [5, 3, 1]].forEach(([x, ci, up]) => container(G, x, 27, false, ci, up ? 5.9 : 3.3));
  // 仓库外墙（背景）
  const wallM = M(0xffffff, { map: _tex.rib('#6c7480', '#5a616c', 28) });
  box(52, 12, 5, wallM, 0, 6, -16.5, G); box(53, 0.6, 6, M(0x3a3e46), 0, 12.3, -16.5, G);
  plane(9, 6.5, M(0x0c0d10), 0, 3.25, -13.98, 0, G); box(9.6, 0.4, 0.3, M(0x2a2c30), 0, 6.6, -13.9, G);
  [-4.7, 4.7].forEach(x => box(0.4, 6.8, 0.3, M(0x2a2c30), x, 3.4, -13.9, G));
  const leak = mesh(new THREE.PlaneGeometry(8.8, 0.25), glowMat(2.4, 1.6, 0.7), 0, 0.14, -13.95, G, false);
  plane(8, 1.4, new THREE.MeshBasicMaterial({ map: _tex.sign('渔人码头 · 7号仓库', 512, 96, '#1c2430', '#e8d8a0') }), 0, 8.2, -13.96, 0, G);
  plane(2.6, 3.2, M(0xffffff, { map: _tex.hand() }), -13, 7, -13.96, 0, G); plane(2.6, 3.2, M(0xffffff, { map: _tex.hand() }), 13, 7, -13.96, 0, G);
  for (let i = 0; i < 9; i++) plane(1.6, 0.8, i % 3 ? glowMat(1.8, 1.3, 0.7) : M(0x1a1c22), -20 + i * 5, 10, -13.97, 0, G);
  // 两侧集装箱墙
  [-21.2, 21.2].forEach((x, s) => { [-9, -2.7, 3.6, 9.9].forEach((z, i) => { container(G, x, z, true, i + s * 2); container(G, x, z, true, i + s * 2 + 1, 2.62); }); });
  container(G, -11.5, -6.5, false, 0); container(G, -11.5, -6.5, false, 3, 2.62); container(G, 12.5, 4.5, true, 1);
  container(G, 9, -9.5, false, 4);
  // 木箱、油桶
  crate(G, -6, -11, 1.2, true); crate(G, -4.6, -11.3, 1.0); crate(G, 15.5, -10, 1.3, true); crate(G, -15.6, 8.5, 1.2, true); crate(G, -14.2, 9.4, 1.0); crate(G, 7.5, 9.5, 1.1, true); crate(G, 2, -11.4, 1.0);
  barrel(G, 4.4, -11.2, 1); barrel(G, 5.3, -10.6); barrel(G, -16, 0.5, 1); barrel(G, -16.4, 1.5); barrel(G, 16, 9.5); barrel(G, 11, 10.3, 1);
  // 路灯 + 灯下光斑
  const pole = M(0x22262c), lampG = glowMat(3.2, 2.0, 0.8);
  [[-9, 12.2], [9, 12.2], [-9, -11.8], [16, -2]].forEach(([x, z]) => {
    mesh(new THREE.CylinderGeometry(0.09, 0.13, 6.4, 8), pole, x, 3.2, z, G); box(1.2, 0.12, 0.12, pole, x + 0.55, 6.3, z, G);
    box(0.5, 0.25, 0.35, lampG, x + 1.05, 6.15, z, G).castShadow = false;
    lightPool(x + 1.05, z, 6.5, new THREE.Color(0.55, 0.36, 0.14), G); addCol(G, x - .15, x + .15, z - .15, z + .15);
  });
  // 港口吊机（远景）
  const yel = M(0xd8a020);
  [[24, 4], [24, 12], [30, 4], [30, 12]].forEach(([x, z]) => box(0.7, 15, 0.7, yel, x, 7.5, z, G));
  box(7.4, 1.2, 9, yel, 27, 15.2, 8, G); box(2, 1.4, 34, yel, 27, 16.4, 18, G); box(3, 2.2, 3, M(0x30343a), 27, 14, 8, G);
  mesh(new THREE.SphereGeometry(0.2, 8, 6), glowMat(3, 0.3, 0.2), 27, 17.3, 34.5, G, false);
  // 对岸城市剪影
  const sil = new THREE.MeshBasicMaterial({ color: 0x0b1020, fog: false }), win2 = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.6, 1.2, 0.6), fog: false, toneMapped: false });
  for (let i = 0; i < 26; i++) { const x = -150 + i * 12 + rand(-3, 3), h = rand(10, 45), w = rand(6, 11); mesh(new THREE.BoxGeometry(w, h, 6), sil, x, h / 2 - 1, 175, G, false); for (let k = 0; k < 4; k++) mesh(new THREE.PlaneGeometry(0.9, 0.6), win2, x + rand(-w / 2 + 1, w / 2 - 1), rand(2, h - 2), 171.9, G, false).rotation.y = Math.PI; }
})();
// ---------------- 黑手帮仓库（室内） ----------------
let roosterAltar = null;
(function buildWarehouse() {
  const G = new THREE.Group(); G.position.set(WH.x, 0, WH.z); scene.add(G); AREA_GROUPS.wh = G;
  const { hx, hz, h } = WH;
  const fl = mesh(new THREE.PlaneGeometry(hx * 2, hz * 2), MS(0xffffff, { map: _tex.concrete(true), roughness: 0.9 }), 0, 0.002, 0, G, false); fl.rotation.x = -Math.PI / 2; fl.material.map.repeat.set(5, 4);
  const yl = M(0xc8a028);
  [-3.4, 3.4].forEach(x => { const m = mesh(new THREE.PlaneGeometry(0.16, hz * 2 - 1), yl, x, 0.01, 0, G, false); m.rotation.x = -Math.PI / 2; });
  const wm = M(0xffffff, { map: _tex.rib('#5c6470', '#4c535e', 32) }); wm.map.wrapS = THREE.RepeatWrapping; wm.map.repeat.set(4, 1);
  const wall = (w, x, z, ry, y0 = 0, hh = h) => plane(w, hh, wm, x, y0 + hh / 2, z, ry, G);
  wall(hx * 2, 0, -hz, 0); wall(hz * 2, -hx, 0, Math.PI / 2); wall(hz * 2, hx, 0, -Math.PI / 2);
  wall(hx - 3, -(hx + 3) / 2, hz, Math.PI); wall(hx - 3, (hx + 3) / 2, hz, Math.PI); wall(6, 0, hz, Math.PI, 5.5, h - 5.5);
  const band = M(0x3a3c40);
  [[hx * 2, 0, -hz + 0.05, 0], [hz * 2, -hx + 0.05, 0, 1], [hz * 2, hx - 0.05, 0, 1]].forEach(([w, x, z, r]) => { const b = box(r ? 0.1 : w, 1.1, r ? w : 0.1, band, x, 0.55, z, G); b.castShadow = false; });
  plane(7, 5.6, new THREE.MeshBasicMaterial({ color: new THREE.Color(0.03, 0.045, 0.1) }), 0, 2.8, hz + 1.5, Math.PI, G);
  [-2, 1.5].forEach(x => mesh(new THREE.SphereGeometry(0.12, 8, 6), glowMat(3, 2, 0.9), x, 3.2, hz + 1.4, G, false));
  // 屋顶桁架 + 天窗
  const ceil = mesh(new THREE.PlaneGeometry(hx * 2, hz * 2), M(0x15171b), 0, h, 0, G, false); ceil.rotation.x = Math.PI / 2;
  const steel = M(0x434952);
  for (let z = -8; z <= 8; z += 4) { const b = box(hx * 2, 0.35, 0.3, steel, 0, h - 0.3, z, G); b.castShadow = false; }
  for (let z = -6; z <= 6; z += 4) { const s = mesh(new THREE.PlaneGeometry(hx * 1.6, 1.2), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.35, 0.48, 0.85), toneMapped: false }), 0, h - 0.02, z, G, false); s.rotation.x = Math.PI / 2; }
  // 立柱
  [[-6.5, -4], [6.5, -4], [-6.5, 4], [6.5, 4]].forEach(([x, z]) => { box(0.45, h, 0.45, steel, x, h / 2, z, G); box(0.8, 0.25, 0.8, steel, x, 0.12, z, G); addCol(G, x - .3, x + .3, z - .3, z + .3); });
  // 后墙：黑手帮旗 + 公鸡护身符祭台 + 走道
  plane(4, 5, M(0xffffff, { map: _tex.hand() }), 0, 4.6, -hz + 0.06, 0, G);
  box(hx * 2, 0.15, 1.6, steel, 0, 4.4, -hz + 0.8, G); box(hx * 2, 0.06, 0.06, steel, 0, 5.3, -hz + 1.58, G);
  for (let x = -12; x <= 12; x += 2) box(0.05, 0.9, 0.05, steel, x, 4.85, -hz + 1.58, G);
  [-9, 9].forEach(x => box(0.2, 4.4, 0.2, steel, x, 2.2, -hz + 1.5, G));
  const alt = new THREE.Group(); alt.position.set(0, 0, -8.2); G.add(alt);
  box(2.4, 0.9, 1.2, M(0x5a3420), 0, 0.45, 0, alt); box(2.6, 0.08, 1.35, M(0x2a1a10), 0, 0.92, 0, alt);
  const rt = canvasTex(128, 128, (g) => { g.fillStyle = '#3a6a5a'; g.beginPath(); g.arc(64, 64, 60, 0, TAU); g.fill(); g.fillStyle = '#ffe9a0'; g.font = 'bold 76px "Noto Sans SC",serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('雞', 64, 68); });
  const rm = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.07, 20), [M(0x7fe9b0, { emissive: 0x2a6a4a }), M(0xffffff, { map: rt, emissive: 0x335544, emissiveMap: rt }), M(0xffffff, { map: rt })]);
  rm.rotation.x = Math.PI / 2; const rg = new THREE.Group(); rg.add(rm); rg.position.set(0, 1.45, 0); alt.add(rg);
  lightPool(0, 0.4, 2.5, new THREE.Color(0.2, 0.6, 0.4), alt, 0.95); lightPool(0, 0.2, 3.5, new THREE.Color(0.15, 0.4, 0.3), alt);
  roosterAltar = rg; addCol(G, -1.3, 1.3, -8.85, -7.55);
  // 吊灯 + 光斑
  const lampG = glowMat(3, 2.2, 1.1), shade = M(0x2a2e34);
  [[-4.5, -2.5], [4.5, -2.5], [-4.5, 4.5], [4.5, 4.5]].forEach(([x, z]) => {
    mesh(new THREE.CylinderGeometry(0.01, 0.01, 2, 4), shade, x, h - 1, z, G, false);
    mesh(new THREE.ConeGeometry(0.55, 0.45, 14, 1, true), shade, x, h - 2.1, z, G, false);
    mesh(new THREE.SphereGeometry(0.16, 10, 8), lampG, x, h - 2.3, z, G, false);
    lightPool(x, z, 4.2, new THREE.Color(0.5, 0.38, 0.2), G);
  });
  // 货物
  crate(G, -11.3, -8.3, 1.4, true); crate(G, -9.7, -8.6, 1.2); crate(G, 11.3, -8.3, 1.4, true); crate(G, 11.4, 8.3, 1.3, true); crate(G, -11.4, 8.2, 1.2, true); crate(G, -11.5, 1.5, 1.2); crate(G, -11.4, 0.1, 1.0, true); crate(G, 9.6, -8.7, 1.0);
  barrel(G, 11.6, 1.2, 1); barrel(G, 11.5, 2.2); barrel(G, 10.7, 1.7, 1); barrel(G, -9.6, 8.7);
  // 叉车
  const fk = new THREE.Group(); fk.position.set(8.4, 0, 7); fk.rotation.y = -0.6; G.add(fk);
  box(1.2, 1.0, 2, M(0xd8a020), 0, 0.75, 0, fk); box(1.1, 1.2, 0.9, M(0x22262c), 0, 1.6, 0.3, fk); box(1.2, 0.08, 0.08, M(0x22262c), 0, 2.3, -0.2, fk);
  box(0.12, 2.4, 0.12, M(0x30343a), -0.45, 1.2, -1.1, fk); box(0.12, 2.4, 0.12, M(0x30343a), 0.45, 1.2, -1.1, fk);
  [-0.35, 0.35].forEach(x => box(0.12, 0.06, 1.2, M(0x30343a), x, 0.15, -1.7, fk));
  [[-0.6, 0.6], [0.6, 0.6], [-0.6, -0.6], [0.6, -0.6]].forEach(([x, z]) => mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.25, 12), M(0x111111), x, 0.3, z, fk).rotation.z = Math.PI / 2);
  addCol(G, 7.1, 9.7, 5.6, 8.4);
})();
// ---------------- 练功房 ----------------
(function buildDojo() {
  const G = new THREE.Group(); G.position.set(DJ.x, 0, DJ.z); scene.add(G); AREA_GROUPS.dojo = G;
  const { hx, hz, h } = DJ;
  const fl = mesh(new THREE.PlaneGeometry(hx * 2, hz * 2), MS(0xffffff, { map: _tex.planks(['#a8784a', '#b08050', '#9c6e44', '#a67a4c']), roughness: 0.7 }), 0, 0.002, 0, G, false); fl.rotation.x = -Math.PI / 2;
  const mt = canvasTex(512, 400, (g, W, H) => { g.fillStyle = '#d8c89a'; g.fillRect(0, 0, W, H); g.strokeStyle = '#8a1c14'; g.lineWidth = 22; g.strokeRect(11, 11, W - 22, H - 22); g.strokeStyle = 'rgba(138,28,20,.35)'; g.lineWidth = 5; g.beginPath(); g.arc(W / 2, H / 2, 110, 0, TAU); g.stroke(); g.fillStyle = 'rgba(0,0,0,.06)'; for (let x = 40; x < W; x += 40) g.fillRect(x, 22, 2, H - 44); });
  const mat = mesh(new THREE.PlaneGeometry(11, 8.5), M(0xffffff, { map: mt }), 0, 0.006, -0.3, G, false); mat.rotation.x = -Math.PI / 2;
  const plas = M(0xe8dcc0), woodD = M(0x4a2a16), woodM = M(0x6a3e22);
  const wall = (w, x, z, ry, y0 = 0, hh = h) => plane(w, hh, plas, x, y0 + hh / 2, z, ry, G);
  wall(hx * 2, 0, -hz, 0); wall(hz * 2, -hx, 0, Math.PI / 2); wall(hz * 2, hx, 0, -Math.PI / 2);
  wall(hx - 1.4, -(hx + 1.4) / 2, hz, Math.PI); wall(hx - 1.4, (hx + 1.4) / 2, hz, Math.PI); wall(2.8, 0, hz, Math.PI, 3.2, h - 3.2);
  plane(3.2, 3.4, new THREE.MeshBasicMaterial({ color: new THREE.Color(1.5, 1.05, 0.6), toneMapped: false }), 0, 1.7, hz + 1.2, Math.PI, G);
  // 护墙板 + 立柱
  [[hx * 2, 0, -hz + 0.05, 0], [hz * 2, -hx + 0.05, 0, 1], [hz * 2, hx - 0.05, 0, 1]].forEach(([w, x, z, r]) => { const b = box(r ? 0.08 : w, 1.2, r ? w : 0.08, woodD, x, 0.6, z, G); b.castShadow = false; });
  for (let x = -hx; x <= hx; x += 4) { box(0.25, h, 0.2, woodM, x, h / 2, -hz + 0.1, G).castShadow = false; }
  for (let z = -hz; z <= hz; z += 4) { box(0.2, h, 0.25, woodM, -hx + 0.1, h / 2, z, G).castShadow = false; box(0.2, h, 0.25, woodM, hx - 0.1, h / 2, z, G).castShadow = false; }
  // 纸窗（暖光）
  const sj = canvasTex(128, 128, (g, W) => { g.fillStyle = '#fff4dc'; g.fillRect(0, 0, W, W); g.fillStyle = '#5a3418'; for (let i = 0; i <= 4; i++) { g.fillRect(i * 31, 0, 4, W); g.fillRect(0, i * 31, W, 4); } });
  const sjM = new THREE.MeshBasicMaterial({ map: sj, color: new THREE.Color(1.25, 1.1, 0.85), toneMapped: false });
  [-4, 0, 4].forEach(z => { plane(2.4, 1.8, sjM, -hx + 0.07, 2.6, z + 2, Math.PI / 2, G); plane(2.4, 1.8, sjM, hx - 0.07, 2.6, z + 2, -Math.PI / 2, G); });
  // 天花板 + 梁
  const ceil = mesh(new THREE.PlaneGeometry(hx * 2, hz * 2), M(0x3a2414), 0, h, 0, G, false); ceil.rotation.x = Math.PI / 2;
  for (let z = -6; z <= 6; z += 3) box(hx * 2, 0.3, 0.3, woodD, 0, h - 0.15, z, G).castShadow = false;
  // 牌匾 + 字画
  plane(4.2, 1.2, new THREE.MeshBasicMaterial({ map: _tex.sign('练 功 房', 512, 140, '#1a0e08', '#ffd34d') }), 0, 4.2, -hz + 0.08, 0, G);
  ['龍', '蛇', '醉', '武'].forEach((c, i) => {
    const t = canvasTex(128, 320, (g, W, H) => { g.fillStyle = '#efe3c4'; g.fillRect(0, 0, W, H); g.fillStyle = '#6a3a1a'; g.fillRect(0, 0, W, 16); g.fillRect(0, H - 16, W, 16); g.fillStyle = ['#a8740a', '#1f7a3a', '#6a3a9a', '#1a0e08'][i]; g.font = 'bold 92px "Noto Sans SC",serif'; g.textAlign = 'center'; g.fillText(c, W / 2, H / 2 + 30); g.fillStyle = '#b8241a'; g.fillRect(W - 34, H - 60, 18, 18); });
    plane(0.9, 2.2, M(0xffffff, { map: t }), [-6, -3.4, 3.4, 6][i], 2.6, -hz + 0.08, 0, G);
  });
  // 香案
  box(2, 0.8, 0.7, woodD, 0, 0.4, -hz + 0.6, G); mesh(new THREE.CylinderGeometry(0.2, 0.16, 0.25, 12), M(0x8a6a2a), 0, 0.93, -hz + 0.6, G);
  [-0.06, 0, 0.06].forEach(x => { mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.4, 4), M(0x6a2a1a), x, 1.25, -hz + 0.6, G, false); mesh(new THREE.SphereGeometry(0.02, 6, 4), glowMat(4, 1, 0.2), x, 1.46, -hz + 0.6, G, false); });
  addCol(G, -1, 1, -hz, -hz + 1);
  // 兵器架
  box(0.3, 2.6, 4.4, woodD, -hx + 0.3, 1.3, -3.5, G);
  for (let i = 0; i < 7; i++) { mesh(new THREE.CylinderGeometry(0.035, 0.035, 2.8, 6), M([0x8a5a2a, 0x6a4020, 0xa07040][i % 3]), -hx + 0.55, 1.45, -5.3 + i * 0.6, G); if (i % 2) mesh(new THREE.ConeGeometry(0.06, 0.25, 6), M(0xc8cfd8), -hx + 0.55, 2.95, -5.3 + i * 0.6, G); }
  addCol(G, -hx, -hx + 0.75, -5.8, -1.2);
  // 大鼓
  const dr = new THREE.Group(); dr.position.set(8, 0, -6.4); G.add(dr);
  [[-0.5, -0.3], [0.5, -0.3], [-0.5, 0.3], [0.5, 0.3]].forEach(([x, z]) => box(0.08, 1.0, 0.08, woodD, x, 0.5, z, dr));
  const drum = mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.7, 20), M(0xa8241a), 0, 1.35, 0, dr); drum.rotation.x = Math.PI / 2;
  [-0.36, 0.36].forEach(z => mesh(new THREE.CircleGeometry(0.6, 20), M(0xe8d8b0), 0, 1.35, z, dr, false).rotation.y = z < 0 ? Math.PI : 0);
  addCol(G, 7.3, 8.7, -7, -5.8);
  // 灯笼
  [[-5, -2], [5, -2], [-5, 4], [5, 4]].forEach(([x, z]) => {
    mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.7, 4), woodD, x, h - 0.35, z, G, false);
    const l = mesh(new THREE.SphereGeometry(0.3, 16, 10), glowMat(2.4, 0.5, 0.2), x, h - 0.95, z, G, false); l.scale.y = 0.9;
    lightPool(x, z, 3.2, new THREE.Color(0.32, 0.18, 0.08), G);
  });
  // 沙袋的吊梁
  box(1.2, 0.25, 0.25, woodD, -5.8, h - 0.4, 1.8, G);
})();
// 静态合批（新场景）
{
  BATCH.push(Object.assign(staticBatch([AREA_GROUPS.dock], new Set()), { cx: DK.x, cz: DK.z, r: 120 }));
  BATCH.push(Object.assign(staticBatch([AREA_GROUPS.wh], new Set([roosterAltar])), { cx: WH.x, cz: WH.z, r: 90 }));
  BATCH.push(Object.assign(staticBatch([AREA_GROUPS.dojo], new Set()), { cx: DJ.x, cz: DJ.z, r: 90 }));
  for (const k in AREA_GROUPS) { const g = AREA_GROUPS[k]; BATCH.push({ group: g, cx: g.position.x, cz: g.position.z, r: k === 'dock' ? 120 : 90 }); }
}
// 场景里的武器
spawnWeapon(4, DK.x - 6.5, DK.z - 9.6); spawnWeapon(8, DK.x + 6, DK.z + 10.5); spawnWeapon(1, DK.x - 13.5, DK.z + 4);
spawnWeapon(4, WH.x - 10, WH.z + 4); spawnWeapon(6, WH.x + 10, WH.z - 4); spawnWeapon(8, WH.x - 4, WH.z - 9);
// 练功房武器架：每类两件，不会坏
[5, 4, 7, 6, 2, 9].forEach((t, i) => spawnWeapon(t, DJ.x - 8.6 - (i % 2) * 1.5, DJ.z + 1.5 + (i >> 1) * 1.6, 999));

// ================= 夜空 & 区域光照 =================
const DAY = { sky: scene.children.find(o => o.isMesh && o.geometry.parameters && o.geometry.parameters.radius === 300), sun: scene.children.find(o => o.isMesh && o.geometry.parameters && o.geometry.parameters.radius === 9) };
const HEMI = scene.children.find(o => o.isHemisphereLight);
const NIGHT = new THREE.Group(); NIGHT.visible = false; scene.add(NIGHT);
{
  const st = canvasTex(2048, 1024, (g, W, H) => {
    const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#02040c'); gr.addColorStop(0.35, '#08102a'); gr.addColorStop(0.5, '#1c2a52'); gr.addColorStop(0.56, '#141c34'); gr.addColorStop(1, '#05070e');
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 1400; i++) { const y = Math.pow(Math.random(), 1.4) * H * 0.48, a = Math.random(); g.fillStyle = `rgba(255,255,${220 + Math.random() * 35 | 0},${a * 0.9})`; const s = a > 0.93 ? 3 : a > 0.7 ? 2 : 1.2; g.fillRect(Math.random() * W, y, s, s); }
  });
  NIGHT.add(new THREE.Mesh(new THREE.SphereGeometry(200, 32, 16), new THREE.MeshBasicMaterial({ map: st, side: THREE.BackSide, fog: false, depthWrite: false })));
  const moon = new THREE.Mesh(new THREE.SphereGeometry(7, 24, 12), new THREE.MeshBasicMaterial({ color: new THREE.Color(2.4, 2.35, 2.1), fog: false, toneMapped: false })); moon.position.set(60, 75, 160); NIGHT.add(moon);
}
const AREA_DEF = {
  shop: () => ({ cx: SC.x, cz: SC.z, hx: SHOP.hx - 0.45, hz: SHOP.hz - 0.45, room: true, h: SHOP.h, sun: 1.1, sunC: 0xffd6a8, hemi: [0xffe6c8, 0x6a4a3a, 1.1], fog: [FOG, 32, 95], night: false }),
  street: () => ({ cx: 0, cz: 0, hx: ARENA, hz: ARENA, room: false, sun: 2.6, sunC: 0xffd6a8, hemi: [0xffe6c8, 0x6a4a3a, 1.1], fog: [FOG, 32, 95], night: false }),
  dock: () => ({ cx: DK.x, cz: DK.z, hx: 18, hz: 12, room: false, sun: 2.1, sunC: 0xa8c0ff, hemi: [0x8090d0, 0x342c38, 1.15], fog: [0x141c32, 24, 90], night: true }),
  wh: () => ({ cx: WH.x, cz: WH.z, hx: WH.hx - 0.5, hz: WH.hz - 0.5, room: true, h: WH.h, sun: 1.1, sunC: 0xa8c0ff, hemi: [0xffd8b0, 0x302830, 1.0], fog: [0x0e0e16, 26, 80], night: true }),
  dojo: () => ({ cx: DJ.x, cz: DJ.z, hx: DJ.hx - 0.45, hz: DJ.hz - 0.45, room: true, h: DJ.h, sun: 1.4, sunC: 0xffd6a8, hemi: [0xffe6c8, 0x6a4a3a, 1.2], fog: [FOG, 32, 95], night: false }),
};
function applyArea(name) {
  const D = AREA_DEF[name](); AREA.name = name;
  Object.assign(AREA, { cx: D.cx, cz: D.cz, hx: D.hx, hz: D.hz, room: D.room, h: D.h });
  sun.position.set(AREA.cx - 20, 28, AREA.cz + 14); sun.target.position.set(AREA.cx, 0, AREA.cz); sun.target.updateMatrixWorld();
  sun.intensity = D.sun; sun.color.set(D.sunC);
  if (HEMI) { HEMI.color.set(D.hemi[0]); HEMI.groundColor.set(D.hemi[1]); HEMI.intensity = D.hemi[2]; }
  scene.fog.color.set(D.fog[0]); scene.fog.near = D.fog[1]; scene.fog.far = D.fog[2];
  NIGHT.visible = D.night; if (DAY.sky) DAY.sky.visible = !D.night; if (DAY.sun) DAY.sun.visible = !D.night;
}
function updateAreas(dt) {
  if (NIGHT.visible) NIGHT.position.copy(camera.position);
  if (waterTex && AREA.name === 'dock') { waterTex.offset.x += dt * 0.004; waterTex.offset.y += dt * 0.01; }
  if (dragonAltar && dragonAltar.visible && AREA.name === 'temple') { dragonAltar.rotation.y += dt * 1.2; dragonAltar.position.y = 4.1 + Math.sin(now * 2) * 0.06; }
  if (roosterAltar && roosterAltar.visible) { roosterAltar.rotation.y += dt * 1.2; roosterAltar.position.y = 1.45 + Math.sin(now * 2) * 0.06; }
  if (started && !cutscene && !gameOver && locked) playTime += dt;
  document.body.classList.toggle('menu', !started);
  Dojo.update(dt);
  BGM.update(dt);
}

// ================= 剧情：新增章节 =================
Object.assign(Story, {
  toDock() { this.setArea('dock'); this.putPlayer(DK.x, DK.z + 7, Math.PI); uncle.hide(); jade.hide(); },
  toWarehouse() { this.setArea('wh'); this.putPlayer(WH.x, WH.z + 6.5, Math.PI); uncle.place(WH.x - 2.2, WH.z + 8.4, Math.PI); jade.place(WH.x + 2, WH.z + 8.6, Math.PI); },
});
const TOHRU_DOWN = [
  { who: 'jade', text: '耶——！成龙把大块头打趴下了！', act: () => { jade.place(player.pos.x - 2, player.pos.z + 2.4, 0); jade.mood = 'cheer'; uncle.place(player.pos.x + 2, player.pos.z + 2.2, 0); } },
  { who: 'jackie', text: '哎哟……我的背……', to: 'jade' },
  { who: 'uncle', text: '护身符呢？公鸡护身符在哪里？！', act: () => { jade.mood = null; uncle.mood = 'scold'; } },
  { who: 'narr', text: '（街角，一辆黑色货车发动了引擎——车门上印着一只红色的手）', act: () => { uncle.mood = null; sfx('whoosh'); }, shot: () => [-6, 2.2, 6, 0, 1.5, 30] },
  { who: 'jade', text: '是黑手帮的车！护身符一定在车上——它往渔人码头开去了！' },
  { who: 'jackie', text: '小玉，这次你真的、真的、真的要待在家里。', to: 'jade' },
  { who: 'jade', text: '知——道——啦——' },
  { who: 'uncle', text: '等一下！拿着这个——老爹秘制的除魔符水！打不过就泼他！', act: () => uncle.mood = 'scold' },
  { who: 'jackie', text: '老爹……这是酱油吧？', to: 'uncle' },
  { who: 'uncle', text: '少废话！快去！', act: () => uncle.mood = null },
  { fade: () => { Story.toDock(); player.hp = Math.min(player.maxHp, player.hp + 50); } },
];
const DOCK_START = [
  { who: 'narr', text: '渔人码头 · 深夜', shot: () => [DK.x + 14, 5, DK.z + 12, DK.x, 2, DK.z - 8] },
  { who: 'jackie', text: '（小声）好安静……太安静了。', to: 'narr', shot: () => [DK.x + 1.2, 1.7, DK.z + 4.8, DK.x, 1.4, DK.z + 7] },
  { who: 'narr', text: '（身后的木箱里传来“咚、咚”两声）', act: () => sfx('block'), shot: () => [DK.x - 2, 1.6, DK.z + 4, DK.x + 7.5, 0.8, DK.z + 9.5] },
  { who: 'jade', text: '嘿！成龙！是我！', act: () => { jade.place(DK.x + 6.4, DK.z + 8.6, -2); burst(new THREE.Vector3(DK.x + 7.5, 1, DK.z + 9.5), 0xa0703a, 20, 4); jade.walkTo(DK.x + 2, DK.z + 7.6, 2.6); } },
  { who: 'jackie', text: '小玉？！你怎么又——', to: 'jade' },
  { who: 'jade', text: '我躲在货车的备胎里跟过来的！放心，我最会躲猫猫了。' },
  { who: 'thug', text: '谁在那儿？！——是成龙！兄弟们，抄家伙！', act: () => { spawnWave(3); jade.mood = 'scared'; sfx('whoosh'); }, shot: () => [DK.x + 3, 2.4, DK.z + 2, DK.x, 1.4, DK.z - 9] },
  { who: 'jackie', text: '你确实很会躲……可惜我不会。', to: 'jade' },
  { who: 'jade', text: '我去集装箱后面！成龙加油！', act: () => { jade.mood = null; jade.walkTo(DK.x + 14.5, DK.z - 1.5, 3.4); } },
];
TOHRU_DOWN.push(...DOCK_START);
const DOCK_MID = [
  { who: 'narr', text: '（仓库的卷帘门“哗啦”一声升了起来）', act: () => { spawnWave(4); sfx('heavy'); shake = 0.25; }, shot: () => [DK.x + 2, 2.2, DK.z - 2, DK.x, 1.6, DK.z - 10] },
  { who: 'finn', text: '哟，这不是成龙吗？大老远跑来送护身符？' },
  { who: 'ratso', text: '芬恩，护身符在我们手里，不在他手里啊。' },
  { who: 'finn', text: '……我知道，拉索！我那是在讽刺他！' },
  { who: 'chow', text: '少废话。老板说了——打到他爬不起来为止。' },
  { who: 'jackie', text: '三个打一个？这不太公平吧。', to: 'finn' },
  { who: 'ratso', text: '对啊，对我们不公平——你可是成龙！' },
  { who: 'jade', text: '成龙，接着！老爹塞给我的牛符！', act: () => { if (!jade.rig.root.visible) jade.place(DK.x + 12, DK.z - 2, -1.2); spawnTalisman(1, player.pos.x + 1.5, player.pos.z + 1.5); } },
];
const DOCK_AFTER = [
  { who: 'jade', text: '三个全趴下了！成龙你太强了！', act: () => { jade.place(player.pos.x + 2, player.pos.z + 2, 0); jade.mood = 'cheer'; } },
  { who: 'jackie', text: '小玉，那个拉索刚才嘀咕什么来着？', to: 'jade' },
  { who: 'jade', text: '他说护身符被送进仓库里，交给大块头看着——刀鲁已经醒了！', act: () => jade.mood = null },
  { who: 'uncle', text: '哎呀呀呀呀呀！果然在这里！', act: () => { uncle.place(player.pos.x - 3, player.pos.z + 4, 0); uncle.walkTo(player.pos.x - 1.6, player.pos.z + 1.8, 1.8); } },
  { who: 'jackie', text: '老爹？！你怎么也来了？', to: 'uncle' },
  { who: 'uncle', text: '我坐出租车来的！计价器跳了四十块——从你工资里扣！' },
  { who: 'jackie', text: '……我根本没有工资。', to: 'uncle' },
  { fade: () => { Story.toWarehouse(); player.hp = Math.min(player.maxHp, player.hp + 40); } },
];
const WH_INTRO = [
  { who: 'narr', text: '黑手帮仓库', shot: () => [WH.x + 7, 4.5, WH.z + 8, WH.x, 1.5, WH.z - 6] },
  { who: 'narr', text: '（仓库深处，公鸡护身符在祭台上发出幽幽的绿光）', shot: () => [WH.x + 1.5, 1.8, WH.z - 5, WH.x, 1.3, WH.z - 8.2] },
  { who: 'jackie', text: '护身符！', to: 'narr', shot: () => [WH.x + 1, 1.7, WH.z + 4.2, WH.x, 1.4, WH.z + 6.5] },
  { who: 'narr', text: '咚！！！', act: () => { spawnWave(5); shake = 0.6; sfx('heavy'); burst(new THREE.Vector3(WH.x, 0.3, WH.z - 6), 0xc9a27a, 40, 6); NPCS.forEach(n => n.mood = 'scared'); }, shot: () => [WH.x + 2.5, 2.2, WH.z - 1, WH.x, 2, WH.z - 6] },
  { who: 'tohru', text: '又是你。' },
  { who: 'jackie', text: '嗨……刀鲁。你的背还好吗？我的不太好。', to: 'tohru' },
  { who: 'tohru', text: '这一次，我不会再输。' },
  { who: 'uncle', text: '成龙小心！他的眼睛都红了——魔法让他更强了！', act: () => uncle.mood = null },
  { who: 'jade', text: '狗符给你！撑不住了就去捡！', act: () => { jade.mood = null; spawnTalisman(2, WH.x - 5, WH.z + 5); } },
];
DOCK_AFTER.push(...WH_INTRO);
const ENDING = [
  { who: 'jade', text: '耶——！成龙赢啦！', act: () => { jade.place(player.pos.x - 2, player.pos.z + 2.4, 0); jade.mood = 'cheer'; uncle.place(player.pos.x + 2, player.pos.z + 2.2, 0); } },
  { who: 'narr', text: '（公鸡护身符缓缓飘进了成龙的手里）', act: () => { if (roosterAltar) { roosterAltar.visible = false; burst(roosterAltar.getWorldPosition(new THREE.Vector3()), 0x7fe9b0, 30, 3); } sfx('clang'); } },
  { who: 'jackie', text: '护身符……终于拿回来了。', to: 'uncle' },
  { who: 'uncle', text: '一个找回来了。可是——还有十一个！', act: () => jade.mood = null },
  { who: 'jade', text: '十一个？！那就是还有十一次大冒险！太棒了！', act: () => jade.mood = 'cheer' },
  { who: 'jackie', text: '太……棒……了……', to: 'jade' },
  { who: 'uncle', text: '还有一件事！', act: () => { jade.mood = null; uncle.mood = 'scold'; } },
  { who: 'uncle', text: () => Story.broken ? `店里打碎的 ${Story.broken} 件古董，再加四十块出租车费——全部从你的工资里扣！` : '这次一件古董都没打碎……成龙，你是不是发烧了？' },
  { who: 'jackie', text: '老爹……我根本就没有工资啊！', to: 'uncle' },
  { who: 'jade', text: '哈哈哈哈！', act: () => { uncle.mood = null; jade.mood = 'cheer'; } },
];
function saveProgress(w) { try { const m = +(localStorage.getItem('jc_prog') || 0); if (w > m) localStorage.setItem('jc_prog', String(w)); } catch (e) { } }
function getProgress() { try { return +(localStorage.getItem('jc_prog') || 0); } catch (e) { return 0; } }

// ================= 练功房：木头人 =================
class Dummy {
  constructor(kind, x, z, yaw) {
    this.kind = kind; this.type = 'dummy'; this.k = 'dummy';
    this.T = { name: { post: '木人桩', atk: '反击木人', bag: '沙袋' }[kind], poise: 1 }; this.scale = 1; this.radius = kind === 'bag' ? 0.42 : 0.36;
    this.home = new THREE.Vector3(x, 0, z); this.pos = this.home.clone(); this.vel = new THREE.Vector3(); this.vy = 0; this.yaw = yaw;
    this.hp = this.maxHp = kind === 'bag' ? 420 : 300; this.state = 'loco'; this.dead = false; this.idle = 9; this.koT = 0;
    this.tx = 0; this.tz = 0; this.vx = 0; this.vz = 0; this.spin = 0; this.spinV = 0; this.hop = 0; this.hopV = 0;
    this.atkT = 2; this.wind = -1; this.stun = 0; this.atkN = 0; this.fl = 0;
    const root = this.root = new THREE.Group(); root.position.copy(this.pos); scene.add(root);
    const wood = this.mat = M(kind === 'atk' ? 0x9a4428 : kind === 'bag' ? 0x8a5432 : 0x93603a, { emissive: 0x000000 }), dark = M(0x3a2414);
    this.mats = [wood];
    const pv = this.pivot = new THREE.Group(); root.add(pv); const body = this.body = new THREE.Group(); pv.add(body); body.rotation.y = yaw;
    if (kind === 'bag') {
      pv.position.y = DJ.h - 0.4;
      mesh(new THREE.CylinderGeometry(0.018, 0.018, 2.9, 5), dark, 0, -1.45, 0, body, false);
      mesh(new THREE.CylinderGeometry(0.34, 0.31, 1.3, 16), wood, 0, -3.55, 0, body);
      [-3.0, -4.1].forEach(y => mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.08, 16), dark, 0, y, 0, body));
      mesh(new THREE.SphereGeometry(0.31, 14, 8, 0, TAU, Math.PI / 2, Math.PI / 2), wood, 0, -4.2, 0, body);
    } else {
      box(0.9, 0.1, 0.9, dark, 0, 0.05, 0, root); mesh(new THREE.CylinderGeometry(0.1, 0.14, 0.35, 10), dark, 0, 0.27, 0, root);
      pv.position.y = 0.4;
      mesh(new THREE.CylinderGeometry(0.19, 0.2, 1.55, 14), wood, 0, 0.78, 0, body);
      mesh(new THREE.SphereGeometry(0.19, 14, 8, 0, TAU, 0, Math.PI / 2), wood, 0, 1.55, 0, body);
      [0.25, 1.35].forEach(y => mesh(new THREE.CylinderGeometry(0.205, 0.205, 0.06, 14), dark, 0, y, 0, body, false));
      const arm = (y, ax, ay, len, r = 0.035, parent = body) => { const g = new THREE.Group(); g.position.set(0, y, 0); g.rotation.set(ax, ay, 0); parent.add(g); mesh(new THREE.CylinderGeometry(r, r * 0.9, len, 8), wood, 0, 0, 0.18 + len / 2, g).rotation.x = Math.PI / 2; return g; };
      if (kind === 'post') { arm(1.15, -0.15, 0.32, 0.5); arm(1.15, -0.15, -0.32, 0.5); arm(0.85, 0, 0, 0.45); }
      else {
        arm(1.15, -0.15, 0.4, 0.45);
        const sw = this.swing = new THREE.Group(); sw.position.set(0.12, 1.15, 0); body.add(sw);
        mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.9, 8), wood, 0, 0, 0.6, sw).rotation.x = Math.PI / 2;
        mesh(new THREE.SphereGeometry(0.1, 10, 8), dark, 0, 0, 1.05, sw);
        box(0.42, 0.12, 0.42, M(0xb8241a), 0, 0.55, 0, body);
        this.eyes = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.3, 0.05, 0.02), toneMapped: false });
        [-0.07, 0.07].forEach(x => mesh(new THREE.SphereGeometry(0.03, 8, 6), this.eyes, x, 1.47, 0.17, body, false));
      }
      // 腿
      const lg = new THREE.Group(); lg.position.set(0, 0.35, 0); body.add(lg);
      mesh(new THREE.CylinderGeometry(0.04, 0.035, 0.5, 8), wood, 0, -0.08, 0.38, lg).rotation.x = Math.PI / 2 + 0.5;
    }
    const hb = document.createElement('div'); hb.className = 'ehp dummy'; hb.innerHTML = `${this.T.name}<div><i></i></div>`; $('hud').appendChild(hb); this.hb = hb;
    this.anim = { kick() { }, update() { } }; this.rig = { root };
  }
  flash(k) { this.mat.emissive.setRGB(k, k * 0.35, k * 0.1); }
  takeHit(dmg, dir, m, kbMul, counter) {
    if (this.dead) return;
    this.hp -= dmg; this.idle = 0; this.fl = 0.12;
    const bag = this.kind === 'bag';
    let imp = (bag ? 0.22 : 0.5) + dmg * (bag ? 0.03 : 0.035); if (m.heavy) imp *= 1.5; if (counter) imp *= 1.4;
    this.vx += dir.x * imp; this.vz += dir.y * imp;
    if (m.spin) this.spinV += (Math.random() < 0.5 ? -1 : 1) * (bag ? 2 : 5);
    if (m.launch && !bag) this.hopV = 3.2;
    if (this.kind === 'atk' && this.wind > 0 && (m.heavy || counter)) { this.wind = -1; this.stun = 1.2; floatText(this.pos.clone().setY(2.2), '打断!', '#ffd34d', 22); }
    if (this.hp <= 0) this.ko(dir);
  }
  ko(dir) {
    this.hp = 0; this.dead = true; this.koT = 1.6; this.wind = -1;
    this.spinV += 16; this.hopV = this.kind === 'bag' ? 0 : 4; this.vx += dir.x * 3; this.vz += dir.y * 3;
    const p = this.pos.clone().setY(1.2);
    burst(p, 0xa0703a, 34, 6); shock(this.pos, 0xffd34d, 2); sfx('heavy'); shake = Math.max(shake, 0.25); slowmo = Math.max(slowmo, 0.3);
    floatText(p.clone().setY(2.2), 'K.O.!', '#ffd34d', 36); Dojo.event('ko', { d: this });
    if (lockTarget === this) lockTarget = null;
  }
  parried() { this.wind = -1; this.stun = 1.6; this.vx -= Math.sin(this.yaw) * 1.5; this.vz -= Math.cos(this.yaw) * 1.5; floatText(this.pos.clone().setY(2.2), '破绽!', '#4fd1ff', 24); }
  update(dt) {
    const bag = this.kind === 'bag', K = bag ? 6 : 95, D = bag ? 0.5 : 7.5, lim = bag ? 0.9 : 0.55;
    this.vx += (-K * this.tx - D * this.vx) * dt; this.vz += (-K * this.tz - D * this.vz) * dt;
    this.tx = clamp(this.tx + this.vx * dt, -lim, lim); this.tz = clamp(this.tz + this.vz * dt, -lim, lim);
    this.spinV *= Math.exp(-dt * (this.dead ? 1.2 : 3)); this.spin += this.spinV * dt;
    this.hopV -= 22 * dt; this.hop = Math.max(0, this.hop + this.hopV * dt); if (this.hop === 0 && this.hopV < 0) { if (this.hopV < -3) burst(this.home.clone().setY(0.1), 0xc9a27a, 8, 2); this.hopV = 0; }
    if (bag) this.pivot.rotation.set(-this.tz, 0, this.tx); else this.pivot.rotation.set(this.tz, 0, -this.tx);
    this.pivot.position.y = (bag ? DJ.h - 0.4 : 0.4) + this.hop;
    this.pos.copy(this.home);
    // 反击木人：转向玩家、蓄力、出手
    const dx = player.pos.x - this.pos.x, dz = player.pos.z - this.pos.z, dist = Math.hypot(dx, dz);
    if (this.kind === 'atk') {
      const sw = this.swing;
      if (this.stun > 0) { this.stun -= dt; this.flash(0.15 + 0.12 * Math.sin(now * 20)); sw.rotation.x = lerp(sw.rotation.x, 0.6, 1 - Math.exp(-dt * 6)); }
      else if (!this.dead && Dojo.counterOn) {
        if (this.wind < 0) {
          this.yaw += angDiff(this.yaw, Math.atan2(dx, dz)) * (1 - Math.exp(-dt * 3));
          sw.rotation.x = lerp(sw.rotation.x, 0, 1 - Math.exp(-dt * 6));
          if (dist < 3.2 && player.state !== 'dead') { this.atkT -= dt; if (this.atkT <= 0) { this.wind = 0; this.atkHigh = this.atkN++ % 3 !== 2; } }
        } else {
          this.wind += dt; const W = 0.7;
          if (this.wind < W) { const k = this.wind / W; this.flash(k * 0.6 * (0.65 + 0.35 * Math.sin(now * 40))); sw.rotation.x = -1.3 * k * (this.atkHigh ? 1 : -0.6); sw.rotation.y = this.atkHigh ? 0 : 0.6 * k; this.yaw += angDiff(this.yaw, Math.atan2(dx, dz)) * (1 - Math.exp(-dt * 5)); }
          else if (this.wind - dt < W) { this.flash(0); sfx('whoosh'); sw.rotation.x = this.atkHigh ? 0.9 : -0.2; sw.rotation.y = this.atkHigh ? 0 : -0.9; const ang = Math.abs(angDiff(this.yaw, Math.atan2(dx, dz))); if (dist < 2.3 && ang < 1.0 && player.pos.y < 1.2) playerTakeHit(this, 8, { high: this.atkHigh ? 1 : 0 }); }
          else if (this.wind > 1.15) { this.wind = -1; this.atkT = rand(1.4, 2.6); sw.rotation.y = 0; }
        }
      } else { this.flash(0); sw.rotation.x = lerp(sw.rotation.x, 0, 1 - Math.exp(-dt * 6)); }
      if (this.eyes) { const e = this.wind > 0 && this.wind < 0.7 ? 3 : Dojo.counterOn ? 0.8 : 0.15; this.eyes.color.setRGB(e, e * 0.15, e * 0.05); }
    }
    this.body.rotation.y = this.yaw + this.spin;
    if (this.fl > 0) { this.fl -= dt; if (this.kind !== 'atk' || this.wind < 0) this.flash(this.fl > 0 ? 0.35 : 0); }
    if (this.dead) { this.koT -= dt; if (this.koT <= 0) { this.dead = false; this.hp = this.maxHp; floatText(this.pos.clone().setY(2), '复原', '#7dffb0'); } }
    else { this.idle += dt; if (this.idle > 2.5) this.hp = Math.min(this.maxHp, this.hp + this.maxHp * dt * 0.6); }
    const s = toScreen(this.pos.clone().setY(2.15));
    const far = Math.hypot(this.pos.x - camera.position.x, this.pos.z - camera.position.z) > 16;
    this.hb.style.display = s.vis && !far ? 'block' : 'none'; this.hb.style.left = s.x + 'px'; this.hb.style.top = s.y + 'px';
    this.hb.querySelector('i').style.width = (this.hp / this.maxHp * 100) + '%';
  }
}
const CHALLENGES = [
  { t: '打出 10 连击', f: S => S.maxCombo >= 10 },
  { t: '打出 25 连击', f: S => S.maxCombo >= 25 },
  { t: '龙形、蛇形、醉拳各命中一次', f: S => S.styles.size >= 3 },
  { t: '用旋风回旋踢命中', f: S => S.moves.has('旋风回旋踢') },
  { t: '蹲下用升龙拳把木人打飞', f: S => S.moves.has('升龙拳') },
  { t: '拿起武器打中木人', f: S => S.wpn > 0 },
  { t: '完美格挡反击木人 3 次', f: S => S.parry >= 3 },
  { t: '完美闪避 1 次', f: S => S.pdodge >= 1 },
  { t: '完美格挡/闪避后用重击反击', f: S => S.counter > 0 },
  { t: '打爆一个木头人', f: S => S.ko > 0 },
];
const Dojo = {
  on: false, dummies: [], counterOn: true, spar: null, sparI: 0, S: null, done: new Set(), log: [], uiT: 0, barkT: 10,
  newStats() { return { maxCombo: 0, dmg: 0, hits: 0, styles: new Set(), moves: new Set(), wpn: 0, parry: 0, pdodge: 0, counter: 0, ko: 0, last: '' }; },
  begin() {
    MODE = 'dojo'; this.on = true; this.S = this.newStats();
    try { JSON.parse(localStorage.getItem('jc_dojo') || '[]').forEach(i => this.done.add(i)); } catch (e) { }
    Story.setArea('dojo'); Story.putPlayer(DJ.x, DJ.z + 3.2, Math.PI);
    jade.hide(); uncle.place(DJ.x + 7.4, DJ.z - 4.4, -2.3);
    if (!this.dummies.length) {
      [['post', -3.6, -4.0, 0], ['post', 0, -4.6, 0], ['post', 3.6, -4.0, 0], ['atk', 5.8, 1.6, -Math.PI / 2], ['bag', -5.8, 1.8, 0]].forEach(([k, x, z, y]) => { const d = new Dummy(k, DJ.x + x, DJ.z + z, y); this.dummies.push(d); enemies.push(d); });
    }
    $('wave').textContent = '练功房'; $('dojoP').classList.add('show'); $('help').classList.add('hide');
    banner('练功房<small>木头人随便打——只有红色的“反击木人”会还手</small>', 3.5);
    this.ui(true);
  },
  event(k, d) {
    if (!this.on) return; const S = this.S;
    if (k === 'hit') {
      S.hits++; S.dmg += d.dmg; this.log.push([now, d.dmg]); S.maxCombo = Math.max(S.maxCombo, player.combo);
      S.styles.add(d.m.wpn ? 9 : player.style); S.moves.add(d.m.name); S.last = (d.m.wpn && player.weapon ? WEAPONS[player.weapon.type].name + '·' : '') + d.m.name;
      if (d.m.wpn) S.wpn++; if (d.counter) S.counter++;
      if (d.m.wpn && player.weapon) player.weapon.dur = 999;
    } else if (k === 'parry') S.parry++;
    else if (k === 'pdodge') S.pdodge++;
    else if (k === 'ko') S.ko++;
    // 风格计数里去掉武器标记
    if (S.styles.has(9)) { S.styles.delete(9); }
    CHALLENGES.forEach((c, i) => { if (!this.done.has(i) && c.f(S)) { this.done.add(i); this.saveDone(); banner(`挑战完成！<small>${c.t}</small>`, 2); sfx('clang'); this.ui(true); dojoRunes(this.done.size); } });
  },
  saveDone() { try { localStorage.setItem('jc_dojo', JSON.stringify([...this.done])); } catch (e) { } },
  reset() { this.S = this.newStats(); this.log.length = 0; player.combo = 0; tip('统计已重置', 1.2); this.ui(true); },
  toggleCounter() { this.counterOn = !this.counterOn; tip(this.counterOn ? '反击木人：开（红光时按 Q 完美格挡）' : '反击木人：关', 1.8); this.ui(true); },
  summon() {
    const list = ['thug', 'khan', 'finn', 'boss'], names = ['黑手帮打手', '影武者', '芬恩', '刀鲁'];
    if (this.spar && !this.spar.dead) { this.spar.release(); scene.remove(this.spar.rig.root); this.spar.hb.remove(); this.spar.dead = true; this.spar.gone = true; }
    const t = list[this.sparI % list.length], e = new Enemy(t, DJ.x, DJ.z - 1); e.yaw = Math.atan2(player.pos.x - e.pos.x, player.pos.z - e.pos.z); e.cd = 1.5;
    enemies.push(e); this.spar = e; tip(`陪练：${names[this.sparI % list.length]}（再按 G 换人）`, 2); this.sparI++;
  },
  update(dt) {
    if (!this.on || !this.S) return;
    this.uiT -= dt; if (this.uiT <= 0) this.ui();
    if (player.combo > this.S.maxCombo) this.S.maxCombo = player.combo;
    if (!cutscene && started) { this.barkT -= dt; if (this.barkT <= 0) { this.barkT = rand(13, 20); Story.bark('uncle', ['出拳要快！再快一点！', '左键连按是连招，右键是重击！', '看到红光就按 Q——完美格挡！', '蹲下按右键是升龙拳！', '换个拳法试试——按 1、2、3！', '老爹年轻的时候，一口气能打一百下！', '别光打木头——按 G 叫个陪练！', '挨了打别慌——躲开几秒不挨打，气血自己就回来了！', '武器架上的家伙随便拿！不同的兵器，套路完全不同！', '按 Tab 看看背包——护身符要装上才管用！', '完美格挡、完美闪避，体力一下就回满了！'][Math.floor(rand(0, 11))]); } }
  },
  ui(force) {
    this.uiT = 0.2; const S = this.S; if (!S) return;
    while (this.log.length && now - this.log[0][0] > 4) this.log.shift();
    const dps = Math.round(this.log.reduce((a, b) => a + b[1], 0) / 4);
    const nd = this.done.size;
    $('dojoStats').innerHTML = `<div><span>当前连击</span><b>${player.combo}</b></div><div><span>最高连击</span><b>${S.maxCombo}</b></div><div><span>总伤害</span><b>${S.dmg}</b></div><div><span>每秒伤害</span><b>${dps}</b></div><div><span>完美格挡</span><b>${S.parry}</b></div><div><span>完美闪避</span><b>${S.pdodge}</b></div><div class="w"><span>上一招</span><b>${S.last || '—'}</b></div>`;
    if (force) $('dojoCh').innerHTML = `<h5>练功挑战 ${nd}/${CHALLENGES.length}</h5>` + CHALLENGES.map((c, i) => `<div class="${this.done.has(i) ? 'ok' : ''}">${this.done.has(i) ? '✔' : '○'} ${c.t}</div>`).join('');
    $('dojoKeys').innerHTML = `<kbd>T</kbd>反击木人：${this.counterOn ? '开' : '关'} · <kbd>G</kbd>召唤陪练 · <kbd>Z</kbd>重置统计 · <kbd>K</kbd>招式表 · <kbd>Esc</kbd>菜单`;
  },
};
addEventListener('keydown', e => {
  if (!started || cutscene || MODE !== 'dojo' || e.repeat) return;
  if (e.code === 'KeyT') Dojo.toggleCounter(); else if (e.code === 'KeyG') Dojo.summon(); else if (e.code === 'KeyZ') Dojo.reset();
});
function gameEvent(k, d) { if (MODE === 'dojo') Dojo.event(k, d); }

// ================= 招式表 =================
function movesHTML() {
  const S = MOVES_STYLE[player.style], st = STYLES[player.style];
  const row = (k, v, n) => `<tr><td>${k}</td><td>${v}</td><td>${n || ''}</td></tr>`;
  const c = wcls();
  if (c) {
    const w = WEAPONS[player.weapon.type], WC = WCLASS[c], X = WMOVES[c][player.style], H = WSHARED[c];
    const ws = WEAPONS.filter(x => x.cls === c).map(x => x.name).join(' / ');
    return `<h3>招式表 · ${w.name} · <span style="color:${st.css}">${WC.styles[player.style]}</span> <small>（${WC.name}：1/2/3 切换 ${WC.styles.join(' / ')}）</small></h3><table>
  ${row('左键 连按', `${[X.L1, X.L2, X.L3, X.L4, X.L5].filter(Boolean).map(m => m.name).join(' → ')}`, X.L5 ? '轻棍五连 · 三派通用' : X.L4 ? '器械四连' : '器械三连')}
  ${c === 'staff' ? row('左键 按住', '棍花', '挡下正面攻击 · 弹回火球 · 持续耗体力') : ''}
  ${c === 'staff' ? row('右键按住蓄力 1–3 段 / 松开释放', `${X.H1.name} / ${X.H2.name} / ${X.H3.name}`, ['劈棍砸地 · 裂地尘环', '戳棍连刺 · 3/5/7 连', '立棍撑起（无敌）· 离棍扫踢'][player.style]) : row('右键', X.H.name, X.H.hits.length > 1 ? `${X.H.hits.length} 段连击` : X.H.kd ? '击倒' : '重击')}
  ${H.KL1 ? row('Caps 切腿法 · 左键连按', `${H.KL1.name} → ${H.KL2.name} → ${H.KL3.name}`, '棍类独有') + row('腿法 · 右键', H.KH.name, '跳起飞踢 · 击倒') : row('Caps 切腿法', '普通腿法', '只有棍类能撑棍踢')}
  ${row('C 蹲下 · 左键', H.CL.name, H.CL.kd ? '击倒' : '低位')}
  ${row('C 蹲下 · 右键', H.CH.name, '把敌人挑飞')}
  ${row('Space 跳起 · 左键 / 右键', `${H.A.name} / ${H.AH.name}`, '空中')}
  ${row('按住 Q · 左键 / 右键', `${MOVES.counter.name} / ${MOVES.push.name}`, '推掌能破防')}
  ${row('E', '丢下武器', `耐久 ${player.weapon.dur >= 999 ? '∞' : player.weapon.dur}`)}
  </table><p>${WC.name}（${ws}）：${WC.desc}。同类武器招式相同，伤害、距离、耐久不同。三种类别：棍类 · 刀剑类 · 短打类。</p>`;
  }
  return `<h3>招式表 · <span style="color:${st.css}">${st.name}</span> <small>（1/2/3 切换拳法时会更新）</small></h3><table>
  ${row('左键 连按', `${S.jab1.name} → ${S.jab2.name} → ${S.hook.name}`, '拳法三连')}
  ${row('右键', S.heavyF.name, '拳法重击')}
  ${row('Caps 切腿法 · 左键连按', `${S.kick1.name} → ${S.kick2.name} → ${S.kick3.name}`, '腿法三连')}
  ${row('腿法 · 右键', S.heavyK.name, '跳起来踢 · 击倒')}
  ${row('C 蹲下 · 左键', `${MOVES.cjab1.name} → ${MOVES.cjab2.name}`, '能躲高位拳')}
  ${row('C 蹲下 · 右键', MOVES.cheavyF.name, '把敌人打飞')}
  ${row('蹲下 + 腿法 · 左键 / 右键', `${MOVES.sweep.name} / ${MOVES.slide.name}`, '击倒')}
  ${row('Space 跳起 · 左键', MOVES.airKick.name, '空中')}
  ${row('按住 Q · 左键 / 右键', `${MOVES.counter.name} / ${MOVES.push.name}`, '推掌能破防')}
  ${row('E 拾取武器', '棍类 / 刀剑类 / 短打类', '每类 3 种器械套路，拿起后按 K 查看')}
  ${row('4 秒不掉血', '自动回血', '每秒 +14，挨打立即中断')}
  ${row('Tab', '装备 / 背包', '十二生肖符文（3 格）· 备用武器')}
  ${row(STYLES[player.style].name + ' 特性', STYLE_PASSIVE[player.style].split('：')[0], STYLE_PASSIVE[player.style].split('：')[1] || '')}
  ${row('红光一瞬按 Q', '完美格挡', '反击 ×2.2 · 体力回满')}
  ${row('出手瞬间 Alt', '完美闪避', '慢动作 + 反击 · 体力回满')}
  ${row('倒地时 Space', '鲤鱼打挺', '快速起身')}
  </table><p>连招技巧：轻击打完最后一下马上接重击；拳法和腿法可以随时用 Caps 混着打。</p>`;
}
function toggleMoves(force) {
  const el = $('movesP'); const show = force ?? !el.classList.contains('show');
  if (show) el.innerHTML = movesHTML() + '<div class="nx">K 关闭</div>';
  el.classList.toggle('show', show);
}

// ================= 主界面 / 暂停 =================
const Menu = {
  sub: 'main',
  init() {
    Music.on = SETTINGS.music !== false;
    document.querySelectorAll('[data-a]').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); this.act(b.dataset.a, b); }));
    $('ov').addEventListener('click', e => { const b = e.target.closest('[data-a]'); if (b) { e.stopPropagation(); this.act(b.dataset.a, b); } });
    $('sens').value = SETTINGS.sens; $('sens').addEventListener('input', () => { SETTINGS.sens = +$('sens').value; saveSettings(); $('sensV').textContent = SETTINGS.sens.toFixed(1); });
    document.addEventListener('pointerlockchange', () => { if (document.pointerLockElement) $('pause').classList.remove('show'); });
    this.refresh();
    const poll = () => { if (SKIN.ready) { $('menu').classList.add('ready'); $('mload').textContent = ''; } else { $('mload').textContent = SKIN.failed ? '角色模型载入失败' : '正在载入角色与动作…'; setTimeout(poll, 200); } };
    poll();
  },
  refresh() {
    const prog = getProgress(); let retry = null; try { retry = sessionStorage.getItem('jc_ch'); } catch (e) { }
    $('bRetry').style.display = retry != null ? '' : 'none';
    let nx = null; try { nx = sessionStorage.getItem('jc_nx'); } catch (e) { }
    if (retry != null) $('bRetry').innerHTML = `${nx ? '开始第二集' : '从本章重来'}<small>${WAVES[+retry] ? WAVES[+retry].title : ''}</small>`;
    $('bRetry').classList.toggle('hl', !!nx);
    $('bCont').style.display = prog > 0 && retry == null ? '' : 'none';
    const c = CHAPTERS[chapterOf(prog)]; $('bCont').innerHTML = `继续游戏<small>${c.n} · ${c.t}</small>`;
    $('chList').innerHTML = CHAPTERS.map((C, i) => { const ok = prog >= C.w || i === 0; const ep = C.ep || 1, hd = i === 0 || ep !== (CHAPTERS[i - 1].ep || 1) ? `<div class="eph">${EP_TITLE[ep]}</div>` : ''; return hd + `<button class="ch ${ok ? '' : 'lock'}" data-ch="${C.w}" ${ok ? '' : 'disabled'}><b>${C.n}</b> ${C.t}<small>${ok ? C.d : '🔒 通关前一章解锁'}</small></button>`; }).join('');
    $('chList').querySelectorAll('[data-ch]').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); this.start(() => Story.begin(+b.dataset.ch)); }));
    $('setHq').textContent = SETTINGS.hq ? '高清' : '标准'; $('setFps').textContent = SETTINGS.fps ? '开' : '关'; $('setMusic').textContent = Music.on ? '开' : '关'; $('setVoice').textContent = SETTINGS.voice !== false ? '开' : '关'; $('sensV').textContent = (+SETTINGS.sens).toFixed(1);
  },
  show(sub) { this.sub = sub; document.querySelectorAll('#menu .msub').forEach(p => p.classList.toggle('show', p.id === 'm' + sub)); },
  // 在同一文档内重置，不能 reload：导航会强制结束全屏与键盘锁定。
  resetSession() {
    started = false; locked = false; gameOver = false; cutscene = false;
    clearTimeout(gameEndTimer); gameEndTimer = null;
    clearTimeout(Story._fadeTimer); clearTimeout(Story._bt);
    Voice.stop(); SFX.stop(); Story.timers.length = 0;
    Object.assign(Story, { lines: null, done: null, i: 0, shown: 0, busy: false, camPos: null, prevWho: null, raged: false, broken: 0, barkT: 8 });
    for (const e of enemies) { e.rig.root.removeFromParent(); if (e.hb) e.hb.remove(); }
    enemies.length = 0; attackTokens = 0;
    for (const f of fireballs) f.g.removeFromParent(); fireballs.length = 0;
    for (const t of talismans) t.g.removeFromParent(); talismans.length = 0;
    for (const l of TAL_LIGHTS) { l.intensity = 0; l.userData.used = false; l.position.set(0, -50, 0); }
    for (const w of groundWeapons) w.mesh.removeFromParent(); groundWeapons.length = 0;
    for (const w of this.initialWeapons || []) spawnWeapon(w.type, w.x, w.z, w.dur);
    for (const w of [player.weapon, player.weapon2]) if (w && w.mesh) w.mesh.removeFromParent();
    Object.assign(player, { hp: 200, maxHp: 200, st: 100, stDelay: 0, weapon: null, weapon2: null, mode: 'fist', crouch: false, guard: false, guardPress: -9, grounded: true, vy: 0, jumpUntil: -Infinity, chargeT: 0, staffTrace: null, iframe: 0, move: null, clip: null, downClip: null, mt: 0, hitDone: [], combo: 0, comboT: 0, counterT: -9, buffs: {}, hurtT: -99, prevHp: 200, regen: false });
    player.rig.root.visible = true; player.rig.root.scale.setScalar(1);
    player.rig.mats.forEach(m => m.emissive.setRGB(0, 0, 0));
    for (const k in keys) keys[k] = false;
    buffer.type = null; mouseDX = mouseDY = 0; lockTarget = null;
    staffResetFx(); player.lmbHeld = false;
    shake = hitstop = slowmo = 0; wave = -1; waveDone = true; waveDelay = 0; kills = 0; playTime = 0;
    Dojo.on = false; Dojo.dummies.length = 0; Dojo.spar = null; Dojo.log.length = 0;
    for (const f of floaters) f.d.remove(); floaters.length = 0;
    for (const p of parts) p.life = 0; updateParts(0); updateRings(10);
    for (const v of vases) { v.broken = false; v.g.visible = true; if (!colliders.includes(v.col)) colliders.push(v.col); }
    NPCS.forEach(n => { n.hide(); n.mood = null; n.talk = 0; });
    Story.setArea('shop'); Story.putPlayer(SC.x + 0.4, SC.z - 1.6, Math.PI);
    uncle.place(SC.x, SC.z - 5.3, 0); MODE = 'story';
    if (roosterAltar) roosterAltar.visible = true;
    if (dragonAltar) dragonAltar.visible = true;
    document.body.classList.remove('cine'); document.body.classList.add('menu');
    Bag.open = false;
    for (const id of ['pause', 'bag', 'dlg', 'narr', 'bark', 'dojoP', 'movesP']) $(id).classList.remove('show');
    $('ov').style.display = 'none'; $('fade').style.opacity = 0;
    $('vign').style.boxShadow = 'none'; $('lock').style.display = 'none';
    $('tip').style.opacity = 0; tipTimer = 0; $('banner').classList.remove('show'); bannerTimer = 0;
    $('help').classList.remove('hide'); $('wave').textContent = '';
    $('menu').classList.remove('hide', 'autodojo'); this.show('Main'); this.refresh(); refreshChips();
    // 只释放鼠标锁，保留 document.fullscreenElement 与键盘锁定。
    if (document.pointerLockElement) document.exitPointerLock();
    BGM.want = null; BGM.wantT = 0; BGM.update(1.3); FS.ui();
  },
  start(fn) {
    if (!SKIN.ready || started) return;
    initAudio(); if (AC && AC.state === 'suspended') AC.resume();
    renderer.domElement.requestPointerLock();
    $('menu').classList.add('hide'); Music.start(); if (!Music.on && Music.out) Music.out.gain.value = 0;
    started = true; fn();
  },
  act(a) {
    switch (a) {
      case 'new': try { localStorage.removeItem('jc_broken'); } catch (e) { } this.start(() => Story.begin(0)); break;
      case 'continue': this.start(() => Story.begin(CHAPTERS[chapterOf(getProgress())].w)); break;
      case 'retry': { const ch = Math.max(0, wave); if (gameOver) this.resetSession(); this.start(() => Story.begin(ch)); break; }
      case 'chapters': this.show('Chapters'); break;
      case 'help': this.show('Help'); break;
      case 'settings': this.show('Settings'); break;
      case 'back': this.show('Main'); break;
      case 'dojo': if (gameOver || started) this.resetSession(); this.start(() => Dojo.begin()); break;
      case 'hq': setQuality(!SETTINGS.hq); this.refresh(); break;
      case 'fps': SETTINGS.fps = !SETTINGS.fps; saveSettings(); this.refresh(); break;
      case 'voice': Voice.on = !Voice.on; SETTINGS.voice = Voice.on; if (!Voice.on) Voice.stop(); saveSettings(); this.refresh(); break;
      case 'music': Music.toggle(); SETTINGS.music = Music.on; saveSettings(); this.refresh(); break;
      case 'resume': renderer.domElement.requestPointerLock(); break;
      case 'moves': toggleMoves(true); break;
      case 'fs': FS.toggle(); break;
      case 'restart': { const dojo = MODE === 'dojo', ch = Math.max(0, wave); this.resetSession(); this.start(() => dojo ? Dojo.begin() : Story.begin(ch)); break; }
      case 'ep2': this.resetSession(); this.start(() => Story.begin(6)); break;
      case 'ep3': this.resetSession(); this.start(() => Story.begin(9)); break;
      case 'menu': try { for (const k of ['jc_ch', 'jc_nx', 'jc_go']) sessionStorage.removeItem(k); } catch (e) { } this.resetSession(); break;
    }
  },
  pause() {
    const P = $('pause'); P.classList.add('show');
    $('pTitle').textContent = MODE === 'dojo' ? '练功房 · 暂停' : (WAVES[wave] ? WAVES[wave].title : '暂停');
    $('pRestart').textContent = MODE === 'dojo' ? '重新进入练功房' : '重新开始本章';
  },
};
Menu.init();
// 从结算画面点“去练功房”：刷新后直接进入
try { if (sessionStorage.getItem('jc_go') === 'dojo') { sessionStorage.removeItem('jc_go'); $('menu').classList.add('autodojo'); $('mload').textContent = '正在进入练功房…'; const w = () => { if (SKIN.ready) { $('menu').classList.remove('autodojo'); Menu.show('Main'); $('bDojo').classList.add('hl'); } else setTimeout(w, 200); }; w(); } } catch (e) { }
