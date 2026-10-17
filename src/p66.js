// ================= 大地图引擎：把一个个封闭场景用可以自由探索的大世界连起来 =================
// 剧情里从 A 场景淡出去 B 场景时，先把成龙放进大地图（A 的门口），走到 B 的门口（金色光柱）再淡入 B 继续剧情。
// 大地图本身是可行走的平地（y=0）+ 远处巨大的山、桥、建筑等纯视觉景观；可行走区域由形状列表描述。
const WORLD = {
  defs: {}, cur: null, built: {}, night: false, ents: [], save: { chest: {}, quest: {}, disc: {} },
  off: QS.has('notravel'),
  reg(d) { this.defs[d.key] = d; AREA_DEF['w_' + d.key] = () => this.areaDef(d); },
  areaDef(d) {
    const N = this.night, L = N ? d.lightN : d.light;
    return { cx: d.x, cz: d.z, hx: d.hx, hz: d.hz, room: false, sun: L.sun, sunC: L.sunC, hemi: L.hemi, fog: L.fog, night: false, follow: 1, occl: 1 };
  },
  walk(x, z) { const d = this.cur; if (!d) return true; const lx = x - d.x, lz = z - d.z; let ok = false; for (const s of d.walk) if (shapeIn(s, lx, lz, 0)) { ok = true; break; } if (!ok) return false; if (d.hole) for (const s of d.hole) if (shapeIn(s, lx, lz, 0)) return false; return true; },
  loadSave() { try { const o = JSON.parse(localStorage.getItem('jc_world') || '{}'); this.save = Object.assign({ chest: {}, quest: {}, disc: {} }, o); } catch (e) { } },
  saveNow() { try { localStorage.setItem('jc_world', JSON.stringify(this.save)); } catch (e) { } },
};
WORLD.loadSave();
function shapeIn(s, x, z, m) {
  if (s.t === 'rect') return x >= s.x0 - m && x <= s.x1 + m && z >= s.z0 - m && z <= s.z1 + m;
  if (s.t === 'circ') return Math.hypot(x - s.x, z - s.z) <= s.r + m;
  if (s.t === 'seg') { const ax = s.a[0], az = s.a[1], bx = s.b[0], bz = s.b[1], dx = bx - ax, dz = bz - az, L2 = dx * dx + dz * dz || 1; const t = clamp(((x - ax) * dx + (z - az) * dz) / L2, 0, 1); return Math.hypot(x - ax - dx * t, z - az - dz * t) <= s.w / 2 + m; }
  return false;
}
// ---------- 工具：文字牌、程序化地形、天空 ----------
function labelSprite(text, color = '#ffe28a', h = 1, sub) {
  const c = document.createElement('canvas'), g = c.getContext('2d'); g.font = 'bold 64px "Noto Sans SC",sans-serif'; const w = Math.max(256, Math.ceil(g.measureText(text).width + 60)); c.width = w; c.height = sub ? 150 : 100;
  g.font = 'bold 64px "Noto Sans SC",sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineWidth = 10; g.strokeStyle = 'rgba(0,0,0,.75)'; g.strokeText(text, w / 2, 50); g.fillStyle = color; g.fillText(text, w / 2, 50);
  if (sub) { g.font = '36px "Noto Sans SC",sans-serif'; g.lineWidth = 7; g.strokeText(sub, w / 2, 118); g.fillStyle = '#ddd'; g.fillText(sub, w / 2, 118); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false, fog: false, toneMapped: false })); s.scale.set(h * w / 100, h * c.height / 100, 1); s.renderOrder = 5; return s;
}
function vnoise(x, z) { const s = Math.sin(x * 12.9898 + z * 78.233) * 43758.5453; return s - Math.floor(s); }
function snoise(x, z) { const ix = Math.floor(x), iz = Math.floor(z), fx = x - ix, fz = z - iz, u = fx * fx * (3 - 2 * fx), v = fz * fz * (3 - 2 * fz); const a = vnoise(ix, iz), b = vnoise(ix + 1, iz), c = vnoise(ix, iz + 1), d = vnoise(ix + 1, iz + 1); return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; }
function fbm(x, z, o = 5) { let s = 0, a = 0.5, f = 1; for (let i = 0; i < o; i++) { s += a * snoise(x * f, z * f); f *= 2.03; a *= 0.5; } return s; }
// 地形网格：hf(x,z) 给出高度，cf(h, x, z) 给出颜色
function terrainMesh(w, d, seg, hf, cf, parent, x = 0, z = 0) {
  const geo = new THREE.PlaneGeometry(w, d, seg, seg); geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position, col = [];
  for (let i = 0; i < pos.count; i++) { const px = pos.getX(i) + x, pz = pos.getZ(i) + z, h = hf(px, pz); pos.setY(i, h); const c = cf(h, px, pz); col.push(c.r, c.g, c.b); }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); geo.computeVertexNormals();
  const m = new THREE.Mesh(geo, M(0xffffff, { vertexColors: true })); m.position.set(x, 0, z); m.receiveShadow = true; m.castShadow = false; parent.add(m); return m;
}
function skyDome(top, mid, low, stars) {
  const geo = new THREE.SphereGeometry(2300, 32, 16), pos = geo.attributes.position, cols = [];
  const T = new THREE.Color(top), Mi = new THREE.Color(mid), Lo = new THREE.Color(low);
  for (let i = 0; i < pos.count; i++) { const h = pos.getY(i) / 2300; const c = h > 0.04 ? Mi.clone().lerp(T, Math.min(1, (h - 0.04) / 0.5)) : Lo.clone().lerp(Mi, Math.max(0, (h + 0.05) / 0.09)); cols.push(c.r, c.g, c.b); }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
  const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false, depthWrite: false, toneMapped: false })); m.renderOrder = -10; m.frustumCulled = false;
  if (stars) { const g = new THREE.BufferGeometry(), P = []; for (let i = 0; i < 1600; i++) { const a = Math.random() * TAU, e = Math.asin(Math.random() * 0.95 + 0.03), r = 2200; P.push(Math.cos(a) * Math.cos(e) * r, Math.sin(e) * r, Math.sin(a) * Math.cos(e) * r); } g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); const st = new THREE.Points(g, new THREE.PointsMaterial({ color: 0xffffff, size: 2.2, sizeAttenuation: false, fog: false, depthWrite: false, toneMapped: false })); st.renderOrder = -9; st.frustumCulled = false; m.add(st); }
  return m;
}
// ---------- 进入 / 离开大地图 ----------
Object.assign(WORLD, {
  col(d, x0, z0, x1, z1, h = 6) { const c = { x0: d.x + Math.min(x0, x1), x1: d.x + Math.max(x0, x1), z0: d.z + Math.min(z0, z1), z1: d.z + Math.max(z0, z1), h }; colliders.push(c); return c; },
  build(d) {
    if (this.built[d.key]) return this.built[d.key];
    const G = new THREE.Group(); G.position.set(d.x, 0, d.z); scene.add(G);
    const B = { G, sky: skyDome(...d.sky), skyN: skyDome(...d.skyN, true), labels: {}, anim: [] };
    scene.add(B.sky); scene.add(B.skyN); B.sky.visible = B.skyN.visible = false;
    d.build(G, d, B);
    for (const k in d.gates) { const g = d.gates[k]; const s = labelSprite(g.label, '#ffe28a', 1.5, g.sub); s.position.set(g.x, g.ly || 6.5, g.z); G.add(s); B.labels[k] = s; }
    BATCH.push({ group: G, cx: d.x, cz: d.z, r: 900 });
    this.built[d.key] = B; return B;
  },
  enter(key, night) {
    const d = this.defs[key]; const B = this.build(d); this.night = !!night;
    this.cur = d; this.B = B; applyArea('w_' + key);
    B.sky.visible = !this.night; B.skyN.visible = this.night; if (DAY.sky) DAY.sky.visible = false; if (DAY.sun) DAY.sun.visible = false; NIGHT.visible = false;
    camera.far = 2600; camera.near = 0.08; camera.updateProjectionMatrix();
    d.onNight && d.onNight(B, this.night);
    this.spawnStuff(d); WHUD.show(true); WHUD.bake(d);
    if (d.bgm && typeof BGM !== 'undefined') { this._bgm = this.night ? (d.bgmN || d.bgm) : d.bgm; }
  },
  leave() {
    if (!this.cur) return; const B = this.B;
    B.sky.visible = B.skyN.visible = false; camera.far = 400; camera.near = 0.05; camera.updateProjectionMatrix();
    for (let i = enemies.length - 1; i >= 0; i--) { const e = enemies[i]; if (e.world) { scene.remove(e.rig.root); e.hb && e.hb.remove(); enemies.splice(i, 1); } }
    this.ents.forEach(o => o.g && o.g.parent && o.g.parent.remove(o.g)); this.ents = [];
    Quest.cleanup(); this.cur = null; this.B = null; this._bgm = null; WHUD.show(false); Beacon.hide();
  },
  spawnStuff(d) {
    const S = this.save;
    // 宝箱
    (d.chests || []).forEach(c => { if (S.chest[c.id]) return; const g = chestMesh(); g.position.set(d.x + c.x, 0, d.z + c.z); g.rotation.y = c.yaw || 0; scene.add(g); this.ents.push({ kind: 'chest', g, c, x: d.x + c.x, z: d.z + c.z }); });
    // 巡逻的敌人
    (d.packs || []).forEach((P, pi) => P.types.forEach((t, k) => { const a = k / P.types.length * TAU, x = d.x + P.x + Math.sin(a) * 2.2, z = d.z + P.z + Math.cos(a) * 2.2; const e = spawnAt(t, x, z); Object.assign(e, { dormant: true, world: true, pack: 'p' + pi, patrol: { x, z, r: P.r || 5 }, aggroR: P.aggro || 12 }); e.yaw = rand(0, TAU); }));
    // 路人
    (d.villagers || []).forEach(v => { const o = villager(v.look || {}); o.g.position.set(d.x + v.x, 0, d.z + v.z); scene.add(o.g); Object.assign(o, { kind: 'vil', v, path: (v.path || []).map(([x, z]) => [d.x + x, d.z + z]), pi: 0, x: d.x + v.x, z: d.z + v.z }); this.ents.push(o); });
    Quest.spawn(d);
  },
});
{
  const _aa = applyArea;
  applyArea = function (name) { if (WORLD.cur && !name.startsWith('w_')) WORLD.leave(); _aa(name); };
}
// 行走限制：玩家 / 敌人 只能在可走区域里
{
  const _up = updatePlayer;
  updatePlayer = function (dt) {
    const p = player, x0 = p.pos.x, z0 = p.pos.z; _up(dt);
    if (!WORLD.cur || WORLD.walk(p.pos.x, p.pos.z)) return;
    if (WORLD.walk(p.pos.x, z0)) p.pos.z = z0; else if (WORLD.walk(x0, p.pos.z)) p.pos.x = x0; else { p.pos.x = x0; p.pos.z = z0; }
  };
  const _uw = updateWaves;
  updateWaves = function (dt) {
    if (WORLD.cur) for (const e of enemies) { if (WORLD.walk(e.pos.x, e.pos.z)) { e._wx = e.pos.x; e._wz = e.pos.z; } else if (e._wx != null) { e.pos.x = e._wx; e.pos.z = e._wz; e.vel.x *= -0.3; e.vel.z *= -0.3; } }
    _uw(dt); if (WORLD.cur) WORLD.tick(dt);
  };
}
// ---------- 道具模型 ----------
function chestMesh() {
  const g = new THREE.Group(), w = M(0x8a4a22), gd = M(0xffc84a, { emissive: 0x3a2400 });
  box(1.0, 0.55, 0.65, w, 0, 0.28, 0, g); const lid = new THREE.Group(); lid.position.set(0, 0.55, -0.32); g.add(lid); box(1.02, 0.22, 0.67, w, 0, 0.1, 0.32, lid);
  [-0.4, 0, 0.4].forEach(x => box(0.08, 0.6, 0.69, gd, x, 0.32, 0, g)); box(0.16, 0.18, 0.06, gd, 0, 0.5, 0.34, g);
  const glow = mesh(new THREE.SphereGeometry(0.5, 12, 8), new THREE.MeshBasicMaterial({ color: 0xffd04a, transparent: true, opacity: 0.18, depthWrite: false, toneMapped: false }), 0, 0.5, 0, g, false);
  g.userData = { lid, glow }; return g;
}
function villager(o = {}) {
  const g = new THREE.Group(), sk = M(o.skin || 0xe8c098), cl = M(o.cloth || [0x4a6a9a, 0x8a4a3a, 0x5a7a4a, 0x7a6a8a, 0xb08a4a][Math.floor(Math.random() * 5)]), dk = M(o.pants || 0x2a2a30);
  const body = new THREE.Group(); g.add(body); const s = o.s || rand(0.9, 1.05); body.scale.setScalar(s);
  mesh(new THREE.CylinderGeometry(0.2, 0.26, 0.75, 10), cl, 0, 1.12, 0, body); mesh(new THREE.SphereGeometry(0.16, 12, 10), sk, 0, 1.68, 0, body);
  const lL = box(0.13, 0.75, 0.15, dk, -0.1, 0.38, 0, body), lR = box(0.13, 0.75, 0.15, dk, 0.1, 0.38, 0, body);
  const aL = box(0.1, 0.6, 0.12, cl, -0.3, 1.15, 0, body), aR = box(0.1, 0.6, 0.12, cl, 0.3, 1.15, 0, body);
  if (o.hat === 'straw') { const h = mesh(new THREE.ConeGeometry(0.42, 0.22, 16), M(0xd8c07a), 0, 1.9, 0, body); }
  else if (o.hat === 'monk') { mesh(new THREE.SphereGeometry(0.165, 12, 10), M(0xb8862a), 0, 1.7, 0, body).scale.set(1, 0.6, 1); }
  else if (o.hat !== 'none') mesh(new THREE.SphereGeometry(0.17, 12, 8, 0, TAU, 0, Math.PI / 2), M(0x1a1410), 0, 1.71, 0, body);
  if (o.glow) body.traverse(m => { if (m.material) { m.material = m.material.clone(); m.material.transparent = true; m.material.opacity = 0.7; m.material.emissive = new THREE.Color(o.glow); } });
  return { g, body, lL, lR, aL, aR, ph: rand(0, 6), spd: 0 };
}
// ---------- 目标光柱 ----------
const Beacon = {
  g: null,
  make() { const g = new THREE.Group(); const m = new THREE.MeshBasicMaterial({ color: 0xffd04a, transparent: true, opacity: 0.32, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, fog: false, side: THREE.DoubleSide });
    const c = mesh(new THREE.CylinderGeometry(1.0, 1.6, 260, 16, 1, true), m, 0, 130, 0, g, false); const c2 = mesh(new THREE.CylinderGeometry(0.35, 0.5, 260, 10, 1, true), m.clone(), 0, 130, 0, g, false); c2.material.opacity = 0.6;
    const ring = mesh(new THREE.TorusGeometry(2.2, 0.08, 6, 40), new THREE.MeshBasicMaterial({ color: 0xffe28a, toneMapped: false }), 0, 0.1, 0, g, false); ring.rotation.x = Math.PI / 2; g.userData.ring = ring; scene.add(g); return g; },
  show(x, z) { this.g = this.g || this.make(); this.g.visible = true; this.g.position.set(x, 0, z); },
  hide() { if (this.g) this.g.visible = false; },
  tick() { if (this.g && this.g.visible) { this.g.userData.ring.scale.setScalar(1 + 0.15 * Math.sin(now * 3)); this.g.children[0].material.opacity = 0.22 + 0.1 * Math.sin(now * 2); } },
};
// ---------- HUD：小地图 + 目标 ----------
document.head.insertAdjacentHTML('beforeend', `<style>
#wmap{position:absolute;left:18px;top:40px;width:190px;height:190px;border-radius:50%;border:2px solid rgba(255,208,74,.55);box-shadow:0 0 12px #000;display:none;background:#0a0c10;overflow:hidden}
#wobj{position:absolute;left:18px;top:238px;max-width:300px;font-size:13px;color:#ffe9b0;text-shadow:0 1px 3px #000;display:none;line-height:1.5;pointer-events:auto;cursor:pointer}
#wobj b{color:#ffd04a}#wobj .q{color:#9fe8ff;font-size:12px;display:block}#wobj .go{display:inline-block;margin-top:3px;padding:2px 8px;border:1px solid rgba(255,208,74,.6);border-radius:10px;font-size:11px;color:#ffd04a;background:rgba(0,0,0,.35)}
#wcard{position:fixed;inset:0;z-index:35;display:none;align-items:center;justify-content:center;flex-direction:column;color:#ffe9b0;font-size:30px;letter-spacing:6px;text-shadow:0 2px 10px #000;pointer-events:none}#wcard small{font-size:15px;letter-spacing:2px;color:#ccc;margin-top:10px}
body.cine #wmap,body.cine #wobj{display:none!important}
</style>`);
$('hud').insertAdjacentHTML('beforeend', '<canvas id="wmap" width="190" height="190"></canvas><div id="wobj"></div>');
document.body.insertAdjacentHTML('beforeend', '<div id="wcard"></div>');
const WHUD = {
  img: null, scale: 1,
  show(on) { $('wmap').style.display = on ? 'block' : 'none'; $('wobj').style.display = on ? 'block' : 'none'; },
  bake(d) {
    const S = 2, W = d.hx * 2 * S + 40, H = d.hz * 2 * S + 40, c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d');
    g.fillStyle = d.mapBg || '#1d3a5a'; g.fillRect(0, 0, W, H);
    const X = x => (x + d.hx) * S + 20, Z = z => (d.hz - z) * S + 20; // 北（+z）在上
    g.fillStyle = d.mapLand || '#b8a582'; g.strokeStyle = d.mapLand || '#b8a582'; g.lineCap = 'round';
    for (const s of d.walk) { if (s.t === 'rect') g.fillRect(X(s.x0), Z(s.z1), (s.x1 - s.x0) * S, (s.z1 - s.z0) * S); else if (s.t === 'circ') { g.beginPath(); g.arc(X(s.x), Z(s.z), s.r * S, 0, TAU); g.fill(); } else { g.lineWidth = s.w * S; g.beginPath(); g.moveTo(X(s.a[0]), Z(s.a[1])); g.lineTo(X(s.b[0]), Z(s.b[1])); g.stroke(); } }
    g.fillStyle = 'rgba(40,30,30,.75)';
    for (const c2 of colliders) { if (c2.h < 1.5) continue; const lx0 = c2.x0 - d.x, lx1 = c2.x1 - d.x, lz0 = c2.z0 - d.z, lz1 = c2.z1 - d.z; if (lx1 < -d.hx || lx0 > d.hx || lz1 < -d.hz || lz0 > d.hz) continue; g.fillRect(X(lx0), Z(lz1), (lx1 - lx0) * S, (lz1 - lz0) * S); }
    this.img = c; this.S = S; this.d = d; this.X = X; this.Z = Z;
  },
  draw() {
    if (!this.img || !WORLD.cur) return; const cv = $('wmap'), g = cv.getContext('2d'), d = this.d, S = this.S, p = player, R = 95, span = 1.1;
    g.save(); g.clearRect(0, 0, 190, 190); g.beginPath(); g.arc(95, 95, 94, 0, TAU); g.clip();
    const px = this.X(p.pos.x - d.x), pz = this.Z(p.pos.z - d.z);
    g.translate(95, 95); g.scale(span, span); g.drawImage(this.img, -px, -pz);
    const dot = (wx, wz, col, r = 4, txt) => { let x = (this.X(wx - d.x) - px), z = (this.Z(wz - d.z) - pz); const L = Math.hypot(x, z), lim = 92 / span; if (L > lim) { x *= lim / L; z *= lim / L; } g.fillStyle = col; g.beginPath(); g.arc(x, z, r / span, 0, TAU); g.fill(); if (txt) { g.font = `bold ${12 / span}px sans-serif`; g.fillStyle = '#111'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(txt, x, z + 0.5); } };
    for (const k in d.gates) { const G = d.gates[k]; if (Travel.dest && Travel.dest.to === k) continue; dot(d.x + G.x, d.z + G.z, 'rgba(230,220,200,.7)', 3); }
    Quest.mapDots(dot);
    if (Travel.dest) { const G = Travel.dest.gate; dot(d.x + G.x, d.z + G.z, '#ffd04a', 6, '★'); }
    g.restore();
    // 玩家箭头（按镜头朝向）
    g.save(); g.translate(95, 95); g.rotate(camYaw); g.fillStyle = '#fff'; g.beginPath(); g.moveTo(0, -8); g.lineTo(5.5, 6); g.lineTo(0, 3); g.lineTo(-5.5, 6); g.closePath(); g.fill(); g.restore();
    g.fillStyle = 'rgba(255,220,140,.9)'; g.font = 'bold 12px sans-serif'; g.textAlign = 'center'; g.fillText('北', 95, 14);
  },
  obj() {
    const T = Travel.dest; let h = '';
    if (T) { const G = T.gate, d = WORLD.cur, dist = Math.round(Math.hypot(d.x + G.x - player.pos.x, d.z + G.z - player.pos.z)); h += `▶ 前往：<b>${G.label}</b> · ${dist} 米<br><span class="go">T 直接前往</span>`; }
    h += Quest.objHTML();
    if (this._h !== h) { this._h = h; $('wobj').innerHTML = h; }
  },
};
$('wobj').addEventListener('pointerdown', e => { if (e.target.closest('.go')) { e.preventDefault(); e.stopPropagation(); Travel.fast(); } });
