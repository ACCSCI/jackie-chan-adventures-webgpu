// ================= 第五集 · 虎之护身符：雪山栈道 / 雪山古寺（钟） / 阴阳台；刀鲁、黑成龙、影子；虎符觉醒 =================
const SN = { x: -300, z: 400, hx: 5, hz: 28 };
const BT = { x: -300, z: 520, hx: 13, hz: 13 };
const YY = { x: -300, z: 640, r: 12.2 };
Object.assign(ETYPES, {
  tohru5: { name: '刀鲁 · 古寺守卫', hp: 1100, dmg: 22, spd: 2.5, radius: 0.85, scale: 1.45, beast: 1, poise: 1, elite: 1, dieMsg: '刀鲁倒下了！<small>“……这口钟……很硬。”</small>' },
  darkj: { name: '黑成龙', hp: 880, dmg: 14, spd: 4.0, radius: 0.42, scale: 1, beast: 1, elite: 1 },
  shade: Object.assign({}, ETYPES.khan, { base: 'khan', name: '影子', hp: 42, dmg: 9, spd: 4.5, windup: 0.4, scale: 0.95, tint: [0.22, 0.16, 0.36] }),
});
ETYPES.shade.base = 'khan';
Object.assign(WHO, {
  darkj: { n: '黑成龙', c: '#b48aff', e: () => enemies.find(e => e.type === 'darkj') || player },
});
{ const _te = WHO.tohru.e; WHO.tohru.e = () => enemies.find(e => e.type === 'tohru5') || _te(); }
// 圆形场地：额外的半径约束
{
  const _aa = applyArea;
  applyArea = function (name) { _aa(name); const D = AREA_DEF[name](); AREA.round = D.round || 0; };
  const _cc = collideCircle;
  collideCircle = function (p, r) { _cc(p, r); if (AREA.round) { const dx = p.x - AREA.cx, dz = p.z - AREA.cz, d = Math.hypot(dx, dz), R = AREA.round - r; if (d > R) { p.x = AREA.cx + dx / d * R; p.z = AREA.cz + dz / d * R; } } };
}
const snowTex = canvasTex(256, 256, (g, W) => { g.clearRect(0, 0, W, W); for (let i = 0; i < 90; i++) { const x = Math.random() * W, y = Math.random() * W, r = rand(10, 40), gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, 'rgba(250,252,255,.85)'); gr.addColorStop(1, 'rgba(250,252,255,0)'); g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); } });
const snowM = M(0xf4f8ff, { emissive: 0x1a1e26 }), rockM = M(0x8a8c94, { map: stoneTex }), rockD = M(0x55585f, { map: stoneTex });
function snowCap(G, w, d, x, y, z) { const b = box(w + 0.1, 0.16, d + 0.1, snowM, x, y + 0.08, z, G); b.castShadow = false; return b; }
function farPeaks(G, list) {
  const pk = M(0x6a7286), cap = M(0xffffff, { emissive: 0x30343c });
  for (const [x, y, z, r, h] of list) { mesh(new THREE.ConeGeometry(r, h, 7), pk, x, y + h / 2, z, G, false); mesh(new THREE.ConeGeometry(r * 0.42, h * 0.42, 7), cap, x, y + h - h * 0.21 + 0.05, z, G, false); }
}
function prayerFlags(G, a, b, n = 12) {
  const cols = [0x2a5ad8, 0xf2f2f2, 0xd8322a, 0x2aa04a, 0xf0c020];
  const L = a.distanceTo(b), mid = a.clone().lerp(b, 0.5); mid.y -= 0.5;
  const crv = new THREE.QuadraticBezierCurve3(a, mid, b);
  mesh(new THREE.TubeGeometry(crv, 16, 0.012, 3), M(0x6a5a40), 0, 0, 0, G, false);
  for (let i = 1; i < n; i++) { const p = crv.getPoint(i / n); const f = mesh(new THREE.PlaneGeometry(0.34, 0.42), new THREE.MeshLambertMaterial({ color: cols[i % 5], side: THREE.DoubleSide }), p.x, p.y - 0.22, p.z, G, false); f.lookAt(G.localToWorld(p.clone().add(new THREE.Vector3(b.z - a.z, 0, a.x - b.x)))); }
}

// ================= 雪山栈道 =================
const SNOW = { stage: 0, gustT: 5, rockT: 8, gusts: [], rocks: [], told: {}, rockGeo: null };
(function buildSnowPath() {
  const G = new THREE.Group(); G.position.set(SN.x, 0, SN.z); scene.add(G); AREA_GROUPS.snow = G;
  const { hx, hz } = SN;
  const pl = _tex.planks(['#6c5236', '#5e4630', '#77593a', '#634a30']); pl.repeat.set(2, 10);
  const fl = mesh(new THREE.PlaneGeometry(hx * 2 + 0.6, hz * 2 + 6), M(0xffffff, { map: pl }), 0.3, 0.002, 0, G, false); fl.rotation.x = -Math.PI / 2; fl.receiveShadow = true;
  const st = snowTex.clone(); st.needsUpdate = true; st.wrapS = st.wrapT = THREE.RepeatWrapping; st.repeat.set(2, 9);
  const sf = mesh(new THREE.PlaneGeometry(hx * 2 + 0.6, hz * 2 + 6), new THREE.MeshLambertMaterial({ map: st, transparent: true, depthWrite: false }), 0.3, 0.008, 0, G, false); sf.rotation.x = -Math.PI / 2; sf.receiveShadow = true;
  // 栈道下面的托梁（往崖壁斜插）
  const beamM = M(0x4a3624);
  box(hx * 2 + 0.6, 0.35, hz * 2 + 6, beamM, 0.3, -0.2, 0, G);
  for (let z = -hz - 2; z <= hz + 2; z += 3) { const b = box(0.25, 0.25, 7.5, beamM, hx - 1.5, -2.6, z, G); b.rotation.set(0, Math.PI / 2, 0); b.rotation.z = 0; const s = box(0.22, 6, 0.22, beamM, hx - 0.1, -2.6, z, G); s.rotation.z = -0.55; }
  // 西侧：山壁
  const wall = box(5, 34, hz * 2 + 14, rockM, -hx - 2.5, 12, 0, G); wall.material = rockM;
  for (let z = -hz - 4; z <= hz + 4; z += 2.2) {
    const r = rand(0.8, 1.6), b = mesh(new THREE.DodecahedronGeometry(r, 0), Math.random() < 0.5 ? rockM : rockD, -hx - 0.3 + rand(-0.3, 0.2), r * 0.5, z + rand(-0.6, 0.6), G);
    b.rotation.set(rand(0, 3), rand(0, 3), 0); const c = mesh(new THREE.DodecahedronGeometry(r * 0.75, 0), snowM, b.position.x, b.position.y + r * 0.45, b.position.z, G, false); c.scale.y = 0.35;
  }
  for (let i = 0; i < 26; i++) { const y = rand(2.5, 22), z = rand(-hz - 6, hz + 6); const s = box(rand(0.6, 2.4), 0.25, rand(1.5, 4), snowM, -hx - 0.05 + 0.1, y, z, G); s.castShadow = false; }
  addColH(G, -hx - 5, -hx, -hz - 8, hz + 8, 30);
  // 东侧：悬崖边——稀疏的木桩和断掉的绳栏
  const postM = M(0x3e2c1c), ropeM = M(0x8a7550);
  let prev = null;
  for (let z = -hz - 2; z <= hz + 2; z += 3.4) {
    const broken = Math.random() < 0.3;
    const h = broken ? rand(0.35, 0.6) : 1.0; box(0.16, h, 0.16, postM, hx + 0.45, h / 2, z, G); snowCap(G, 0.16, 0.16, hx + 0.45, h, z);
    if (prev && !broken && !prev.broken) { const r = mesh(new THREE.CylinderGeometry(0.02, 0.02, 3.4, 4), ropeM, hx + 0.45, 0.82, z - 1.7, G, false); r.rotation.x = Math.PI / 2; }
    prev = { broken };
  }
  // 起点与终点：山门 + 经幡
  [-hz - 1.5, hz + 1.5].forEach((z, i) => {
    [-hx + 0.4, hx + 0.1].forEach(x => { box(0.35, 4.2, 0.35, M(0x7a2018), x, 2.1, z, G); snowCap(G, 0.35, 0.35, x, 4.2, z); });
    box(hx * 2 + 0.4, 0.3, 0.45, M(0x7a2018), 0.25, 4.0, z, G); snowCap(G, hx * 2 + 0.4, 0.45, 0.25, 4.15, z);
  });
  for (let z = -hz + 4; z < hz; z += 9) prayerFlags(G, new THREE.Vector3(-hx, 5.2, z), new THREE.Vector3(hx + 0.45, 3.4, z + 2.5), 14);
  // 远山与云海（东侧深谷）
  farPeaks(G, [[60, -50, -80, 30, 70], [95, -50, 10, 38, 85], [70, -50, 110, 28, 60], [150, -50, -40, 45, 110], [140, -50, 140, 40, 90], [40, -50, 190, 26, 55], [30, -50, -170, 30, 60]]);
  const ct = SHIP.cloudTex ? SHIP.cloudTex.clone() : snowTex; ct.needsUpdate = true; ct.wrapS = ct.wrapT = THREE.RepeatWrapping; ct.repeat.set(3, 3); SNOW.cloudTex = ct;
  const sea = mesh(new THREE.PlaneGeometry(500, 500), new THREE.MeshBasicMaterial({ map: ct, transparent: true, opacity: 0.9, color: 0xf2f4ff, depthWrite: false }), 120, -26, 0, G, false); sea.rotation.x = -Math.PI / 2;
  const sea2 = mesh(new THREE.PlaneGeometry(500, 500), new THREE.MeshBasicMaterial({ color: 0xaab8cc }), 120, -40, 0, G, false); sea2.rotation.x = -Math.PI / 2;
  BATCH.push(Object.assign(staticBatch([G], new Set([sea])), { cx: SN.x, cz: SN.z, r: 140 }));
  BATCH.push({ group: G, cx: SN.x, cz: SN.z, r: 140 });
})();
AREA_DEF.snow = () => ({ cx: SN.x, cz: SN.z, hx: SN.hx - 0.4, hz: SN.hz - 0.5, room: false, sun: 2.3, sunC: 0xfff0e0, hemi: [0xdfe8ff, 0x7c8698, 1.3], fog: [0xc6d2e2, 34, 170], night: false, ep4: 1, squad: 1, occl: 1, follow: 1 });
spawnWeapon(1, SN.x - 3.6, SN.z + 14); spawnWeapon(0, SN.x - 3.5, SN.z - 8);

// 坠崖：被打到/吹到东边崖缘、还在往外飞 → 掉下去
function cliffFall(e, why) {
  if (e.cliff || e.beast) return;
  e.cliff = { x: e.pos.x, y: e.pos.y, z: e.pos.z, vy: 3.2, vx: 3.5, t: 0 };
  if (!e.dead) { e.hp = 0; e.die(new THREE.Vector2(1, 0), MOVES.push); }
  floatText(e.pos.clone().setY(2.2), why || '坠崖！', '#9fe0ff', 30); Foley.at('cHurt', e.pos, { vol: 0.8, rate: 0.8 }); Foley.at('swishH', e.pos, { vol: 0.6, rate: 0.6 });
  slowmo = Math.max(slowmo, 0.25); SNOW.falls = (SNOW.falls || 0) + 1;
  if (!SNOW.told.fall) { SNOW.told.fall = 1; showMove('打下悬崖！一击毙命', '#9fe0ff'); }
}
function updateCliffFalls(dt) {
  for (const e of enemies) {
    const c = e.cliff; if (!c) continue;
    c.t += dt; c.vy -= 22 * dt; c.y += c.vy * dt; c.x += c.vx * dt;
    e.rig.root.position.set(c.x, c.y, c.z); e.rig.root.rotation.z = -Math.min(2.5, c.t * 2.6); e.rig.root.rotation.x = Math.sin(c.t * 5) * 0.3;
    if (c.t > 2.4) { e.rig.root.visible = false; }
  }
}
function snowGust() {
  const z = clamp(player.pos.z + rand(-3, 3), SN.z - SN.hz + 3, SN.z + SN.hz - 3), w = 5;
  Tele.add({ shape: 'lane', x: SN.x - SN.hx - 0.3, z, yaw: Math.PI / 2, w, len: SN.hx * 2 + 0.6, wind: 1.6, col: 'cyan',
    onFire: () => { SNOW.gusts.push({ z, w, t: 0 }); Foley.at('swishL', player.pos, { vol: 0.9, rate: 0.45 }); Foley.at('cloth', player.pos, { vol: 0.6, rate: 0.7 }); } });
  if (!SNOW.told.gust) { SNOW.told.gust = 1; tip('山风来了！青色风带——按 C 蹲下抓稳（敌人会被吹下悬崖）', 2.6); }
}
function snowRock() {
  const z = clamp(player.pos.z + rand(-1.5, 1.5), SN.z - SN.hz + 2, SN.z + SN.hz - 2), w = 2.6;
  Foley.at('stone', player.pos, { vol: 0.5, rate: 0.6 }); shake = Math.max(shake, 0.08);
  Tele.add({ shape: 'lane', x: SN.x - SN.hx - 0.3, z, yaw: Math.PI / 2, w, len: SN.hx * 2 + 0.6, wind: 1.35, col: 'red',
    onFire: (T) => {
      if (!SNOW.rockGeo) SNOW.rockGeo = new THREE.DodecahedronGeometry(1.05, 1);
      const m = mesh(SNOW.rockGeo, rockM, SN.x - SN.hx - 1, 1.05, z, scene); SNOW.rocks.push({ m, t: 0, z, hit: new Set() });
      Foley.at('stone', player.pos, { vol: 1, rate: 0.7 }); shake = Math.max(shake, 0.25);
    } });
  if (!SNOW.told.rock) { SNOW.told.rock = 1; tip('落石！红线上的东西都会被撞下山——包括你的敌人', 2.6); }
}
function updateSnow(dt) {
  for (let i = SNOW.gusts.length - 1; i >= 0; i--) {
    const g = SNOW.gusts[i]; g.t += dt; if (g.t > 1.2) { SNOW.gusts.splice(i, 1); continue; }
    if (Math.random() < dt * 50) burst(new THREE.Vector3(SN.x - SN.hx + rand(0, SN.hx * 2), rand(0.3, 2.2), g.z + rand(-g.w / 2, g.w / 2)), 0xffffff, 1, 7);
    for (const e of [player, ...enemies]) {
      if (e.dead || e.cliff || Math.abs(e.pos.z - g.z) > g.w / 2 + 0.3) continue;
      if (e === player) {
        if (player.crouch && player.grounded) { if (!g.saidP) { g.saidP = 1; floatText(player.pos.clone().setY(1.6), '蹲稳了！', '#7fe8ff', 22); } continue; }
        if (player.state === 'dead') continue; player.pos.x += 7.5 * dt;
        if (player.pos.x > AREA.cx + AREA.hx - 0.15 && !g.edgeP) { g.edgeP = 1; player.hp -= 5; hurtFx(0.6); floatText(player.pos.clone().setY(1.8), '差点掉下去！', '#7fe8ff', 24); shake = 0.15; }
      } else if (!e.beast) { e.pos.x += 6.8 * dt; e.windT = now; }
    }
  }
  for (let i = SNOW.rocks.length - 1; i >= 0; i--) {
    const r = SNOW.rocks[i]; r.t += dt; const x = SN.x - SN.hx - 1 + r.t * 16; r.m.position.x = x; r.m.rotation.z -= dt * 15; r.m.position.y = 1.05 + (x > SN.x + SN.hx + 0.6 ? -Math.pow(x - SN.x - SN.hx - 0.6, 2) * 0.15 : 0);
    if (Math.random() < dt * 30) burst(r.m.position.clone().setY(0.2), 0xf4f8ff, 2, 3);
    if (Math.abs(player.pos.x - x) < 1.3 && Math.abs(player.pos.z - r.z) < 1.5 && player.pos.y < 1.6 && !r.hit.has(player)) { r.hit.add(player); playerTakeHit({ pos: new THREE.Vector3(x - 2, 0, r.z), parried() { } }, 20, { kd: 1, unblockable: 1 }); }
    for (const e of enemies) if (!e.cliff && !e.beast && !r.hit.has(e) && Math.abs(e.pos.x - x) < 1.3 && Math.abs(e.pos.z - r.z) < 1.5) { r.hit.add(e); cliffFall(e, '被落石撞下去了！'); }
    if (r.t > 2.2) { scene.remove(r.m); SNOW.rocks.splice(i, 1); }
  }
  const edge = AREA.cx + AREA.hx - 0.4;
  for (const e of enemies) {
    if (e.cliff || e.beast || e.pos.x < edge) continue;
    const knocked = e.state !== 'loco' && e.state !== 'attack' && e.vel.x > 1.6;
    if (knocked || now - (e.windT || -9) < 0.12) cliffFall(e);
  }
}
function snowScript(dt) {
  if ((SNOW.gustT -= dt) <= 0) { SNOW.gustT = rand(7, 10); snowGust(); }
  if ((SNOW.rockT -= dt) <= 0) { SNOW.rockT = rand(9, 13); snowRock(); }
  const alive = enemies.filter(e => !e.dead).length;
  const near = (dz, dx = 0) => [SN.x + dx, clamp(player.pos.z + dz, SN.z - SN.hz + 1.5, SN.z + SN.hz - 1.5)];
  if (SNOW.stage === 0 && alive <= 1) {
    SNOW.stage = 1; banner('增援！<small>芬恩带人从两头包了过来</small>', 2.2);
    [['finn', -9, 0], ['khan', -10, -2], ['khan', 8, 1.5]].forEach(([t, dz, dx]) => { const [x, z] = near(dz, dx); const e = spawnAt(t, x, z); e.cd = 1.6; burst(e.pos.clone().setY(1), 0xffffff, 18, 3); });
    Story.bark('finn', '兄弟们，把他推下去！');
  } else if (SNOW.stage === 1 && alive <= 1) {
    SNOW.stage = 2; banner('最后一批！<small>拉索和铁臂打手</small>', 2.2);
    [['ratso', -9, -1], ['brute', -11, 1.5], ['thug', 9, 0]].forEach(([t, dz, dx]) => { const [x, z] = near(dz, dx); const e = spawnAt(t, x, z); e.cd = 1.6; burst(e.pos.clone().setY(1), 0xffffff, 18, 3); });
    Story.bark('ratso', '嘿嘿，这上面风可大了！');
  }
}

// ================= 雪山古寺：钟亭 =================
const BELL = { g: null, y0: 3.0, y: 3.0, vy: 0, state: 'hang', t: 0, cd: 0, trapped: null, col: null, rope: null, used: 0 };
(function buildBellTemple() {
  const G = new THREE.Group(); G.position.set(BT.x, 0, BT.z); scene.add(G); AREA_GROUPS.bell = G;
  const { hx, hz } = BT;
  const stone = canvasTex(512, 512, (g, W) => {
    g.fillStyle = '#5c5e64'; g.fillRect(0, 0, W, W);
    for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) { const v = 88 + Math.random() * 24 | 0; g.fillStyle = `rgb(${v},${v + 2},${v + 8})`; g.fillRect(c * 128 + (r % 2) * 64 + 3, r * 128 + 3, 122, 122); }
    for (let i = 0; i < 60; i++) { const x = Math.random() * W, y = Math.random() * W, rr = rand(8, 30), gr = g.createRadialGradient(x, y, 0, x, y, rr); gr.addColorStop(0, 'rgba(245,248,255,.8)'); gr.addColorStop(1, 'rgba(245,248,255,0)'); g.fillStyle = gr; g.beginPath(); g.arc(x, y, rr, 0, TAU); g.fill(); }
  }, [7, 7]);
  const fl = mesh(new THREE.PlaneGeometry(hx * 2 + 2, hz * 2 + 2), MS(0xffffff, { map: stone, roughness: 0.92 }), 0, 0.002, 0, G, false); fl.rotation.x = -Math.PI / 2; fl.receiveShadow = true;
  const out = mesh(new THREE.PlaneGeometry(220, 220), snowM, 0, -0.02, 0, G, false); out.rotation.x = -Math.PI / 2;
  const redW = M(0x8a2a1c), tile = M(0x2a2e36), gold = M(0xd8a83a, { emissive: 0x3a2a08 }), wood = M(0x6a2216);
  const wall = (w, d, x, z) => { box(w, 3.4, d, redW, x, 1.7, z, G); box(w + 0.5, 0.25, d + 0.5, tile, x, 3.5, z, G); snowCap(G, w + 0.4, d + 0.4, x, 3.6, z); };
  wall(hx * 2 + 2, 0.5, 0, -hz - 1); wall(0.5, hz * 2 + 2, -hx - 1, 0); wall(0.5, hz * 2 + 2, hx + 1, 0);
  wall(hx - 2, 0.5, -(hx + 4) / 2, hz + 1); wall(hx - 2, 0.5, (hx + 4) / 2, hz + 1);
  [-3, 3].forEach(x => { box(0.6, 4.8, 0.6, redW, x, 2.4, hz + 1, G); snowCap(G, 0.6, 0.6, x, 4.8, hz + 1); });
  box(7, 0.5, 0.9, redW, 0, 4.5, hz + 1, G); box(8, 0.3, 1.8, tile, 0, 4.9, hz + 1, G); snowCap(G, 7.8, 1.6, 0, 5.05, hz + 1);
  plane(2.8, 0.75, new THREE.MeshBasicMaterial({ map: _tex.sign('雪 峰 寺', 512, 140, '#1a0e08', '#ffd34d') }), 0, 4.05, hz + 0.53, Math.PI, G);
  // 北面大殿
  const hallZ = -hz - 4.5;
  box(24, 1, 7, M(0x6c6a68), 0, 0.5, hallZ, G);
  box(18, 4.6, 4, M(0x5a1810), 0, 1 + 2.3, hallZ - 0.5, G);
  for (let x = -7.5; x <= 7.5; x += 3) box(0.42, 4.6, 0.42, redW, x, 1 + 2.3, hallZ + 1.9, G);
  const roof = (W, D, H, y, z) => { const g = new THREE.CylinderGeometry(0.42, 1, 1, 4, 1); g.rotateY(Math.PI / 4); const m = mesh(g, tile, 0, y + H / 2, z, G); m.scale.set(W / 1.414, H, D / 1.414); const s = mesh(g.clone(), snowM, 0, y + H / 2 + 0.12, z, G, false); s.scale.set(W / 1.414 * 0.96, H * 0.9, D / 1.414 * 0.96); };
  roof(25, 9.5, 2, 5.6, hallZ - 0.3);
  plane(3.6, 1, new THREE.MeshBasicMaterial({ map: _tex.sign('虎 殿', 512, 140, '#1a0e08', '#ffd34d') }), 0, 4.9, hallZ + 1.55, 0, G);
  // 石灯笼（可以被冲撞——柱子）
  const lanM = glowMat(1.6, 0.7, 0.2);
  [[-8, -6], [8, -6], [-8, 6], [8, 6]].forEach(([x, z]) => {
    box(1.1, 0.4, 1.1, rockD, x, 0.2, z, G); box(0.55, 1.6, 0.55, rockM, x, 1.2, z, G); box(1.0, 0.6, 1.0, rockM, x, 2.3, z, G); box(0.5, 0.35, 0.5, lanM, x, 2.3, z, G).castShadow = false;
    box(1.4, 0.3, 1.4, rockD, x, 2.75, z, G); snowCap(G, 1.3, 1.3, x, 2.9, z); lightPool(x, z, 2.2, new THREE.Color(0.35, 0.18, 0.05), G);
    addColH(G, x - 0.55, x + 0.55, z - 0.55, z + 0.55, 3).pillar = true;
  });
  // 钟亭：四根红柱 + 双层顶 + 横梁
  const P = 2.6;
  [[-P, -P], [P, -P], [-P, P], [P, P]].forEach(([x, z]) => { mesh(new THREE.CylinderGeometry(0.28, 0.3, 6, 12), redW, x, 3, z, G); box(0.8, 0.3, 0.8, rockD, x, 0.15, z, G); addColH(G, x - 0.32, x + 0.32, z - 0.32, z + 0.32, 6).pillar = true; });
  box(P * 2 + 0.8, 0.4, 0.4, wood, 0, 6, -P, G); box(P * 2 + 0.8, 0.4, 0.4, wood, 0, 6, P, G); box(0.4, 0.4, P * 2 + 0.8, wood, -P, 6, 0, G); box(0.4, 0.4, P * 2 + 0.8, wood, P, 6, 0, G);
  box(0.35, 0.35, P * 2 + 0.4, wood, 0, 5.85, 0, G);
  const pr = new THREE.CylinderGeometry(0.4, 1, 1, 4, 1); pr.rotateY(Math.PI / 4);
  const r1 = mesh(pr, tile, 0, 7, 0, G); r1.scale.set(8.4 / 1.414, 1.8, 8.4 / 1.414);
  const r1s = mesh(pr.clone(), snowM, 0, 7.12, 0, G, false); r1s.scale.set(8 / 1.414, 1.6, 8 / 1.414);
  mesh(new THREE.SphereGeometry(0.3, 10, 8), gold, 0, 8, 0, G);
  // 大钟（LatheGeometry）
  const bg = new THREE.Group(); bg.position.set(0, BELL.y0, 0); G.add(bg); BELL.g = bg;
  const prof = []; for (let i = 0; i <= 14; i++) { const t = i / 14; prof.push(new THREE.Vector2(1.55 - 0.55 * Math.pow(t, 0.8) + (t < 0.08 ? 0.12 * (1 - t / 0.08) : 0), t * 2.5)); }
  prof.push(new THREE.Vector2(0.6, 2.55)); prof.push(new THREE.Vector2(0.01, 2.58));
  const bronze = MS(0x6a5230, { metalness: 0.75, roughness: 0.42, emissive: 0x0a0602 });
  const bl = mesh(new THREE.LatheGeometry(prof, 28), bronze, 0, 0, 0, bg); bl.material.side = THREE.DoubleSide;
  for (let k = 0; k < 3; k++) mesh(new THREE.TorusGeometry(1.48 - k * 0.2, 0.05, 6, 28), MS(0x8a6a38, { metalness: 0.7, roughness: 0.4 }), 0, 0.25 + k * 0.85, 0, bg, false).rotation.x = Math.PI / 2;
  const tg = canvasTex(256, 256, (g) => { g.fillStyle = 'rgba(0,0,0,0)'; g.clearRect(0, 0, 256, 256); g.fillStyle = '#c8a050'; g.font = 'bold 150px "Noto Sans SC",serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('虎', 128, 128); });
  [0, Math.PI].forEach(a => { const p = plane(0.9, 0.9, new THREE.MeshBasicMaterial({ map: tg, transparent: true }), Math.sin(a) * 1.32, 1.2, Math.cos(a) * 1.32, a, bg); p.rotation.x = -0.18 * (a ? -1 : 1) * 0; });
  mesh(new THREE.TorusGeometry(0.22, 0.07, 8, 16), bronze, 0, 2.7, 0, bg);
  // 钟绳：横梁 → 南北两根拴绳桩
  const ropeM = M(0x9a7a48);
  BELL.rope = [];
  const seg = (a, b) => { const L = a.distanceTo(b), m = mesh(new THREE.CylinderGeometry(0.035, 0.035, L, 5), ropeM, (a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2, G, false); m.lookAt(G.localToWorld(b.clone())); m.rotateX(Math.PI / 2); return m; };
  BELL.hangRope = seg(new THREE.Vector3(0, 5.85, 0), new THREE.Vector3(0, BELL.y0 + 2.7, 0));
  [-1, 1].forEach(s => {
    box(0.3, 1.2, 0.3, wood, 0, 0.6, s * 4.3, G); mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.5, 6), gold, 0, 1.05, s * 4.3, G).rotation.x = Math.PI / 2;
    addColH(G, -0.18, 0.18, s * 4.3 - 0.18, s * 4.3 + 0.18, 1.2);
    BELL.rope.push(seg(new THREE.Vector3(0, 1.1, s * 4.3), new THREE.Vector3(0, 5.85, s * P)));
  });
  // 寺外：雪山
  farPeaks(G, [[-60, -6, -60, 30, 60], [10, -6, -90, 40, 80], [70, -6, -50, 30, 55], [-80, -6, 30, 30, 50], [80, -6, 40, 28, 45], [0, -6, 90, 40, 60]]);
  for (let i = 0; i < 16; i++) { const a = i / 16 * TAU, r = rand(20, 30), h = rand(4, 9); const t = mesh(new THREE.ConeGeometry(rand(1.2, 2), h, 7), M(0x24402e), Math.cos(a) * r, h / 2, Math.sin(a) * r, G, false); mesh(new THREE.ConeGeometry(1.0, h * 0.4, 7), snowM, t.position.x, h * 0.85, t.position.z, G, false); }
  BATCH.push(Object.assign(staticBatch([G], new Set([bg, BELL.hangRope, ...BELL.rope])), { cx: BT.x, cz: BT.z, r: 120 }));
  BATCH.push({ group: G, cx: BT.x, cz: BT.z, r: 120 });
})();
AREA_DEF.bell = () => ({ cx: BT.x, cz: BT.z, hx: BT.hx - 0.4, hz: BT.hz - 0.4, room: false, sun: 1.9, sunC: 0xffd8b0, hemi: [0xd8e0f0, 0x6a6470, 1.2], fog: [0xb8c2d2, 30, 130], night: false, ep4: 1, occl: 1 });
spawnWeapon(2, BT.x - 10, BT.z + 9);
function bellReset() {
  BELL.state = 'hang'; BELL.y = BELL.y0; BELL.vy = 0; BELL.t = 0; BELL.cd = 0; BELL.trapped = null; BELL.used = 0;
  if (BELL.g) { BELL.g.position.y = BELL.y0; BELL.g.rotation.set(0, 0, 0); }
  if (BELL.col) { const i = colliders.indexOf(BELL.col); if (i >= 0) colliders.splice(i, 1); BELL.col = null; }
  BELL.rope.forEach(r => r.visible = true); if (BELL.hangRope) BELL.hangRope.visible = true;
  BELL_POSTS.forEach(o => o.on = false);
}
function dropBell() {
  if (BELL.state !== 'hang') return;
  BELL.state = 'warn'; BELL.t = 0; BELL.used++; BELL_POSTS.forEach(o => o.on = false);
  BELL.rope.forEach(r => r.visible = false); Foley.at('chain', player.pos, { vol: 0.9, rate: 0.8 }); Foley.at('swishL', player.pos, { vol: 0.5 });
  floatText(player.pos.clone().setY(1.9), '咔嚓！', '#ffd84a', 26);
  Tele.add({ shape: 'circle', x: BT.x, z: BT.z, r: 2.1, wind: 0.5, col: 'red', onFire: () => { BELL.state = 'drop'; BELL.vy = 0; } });
  // 钟一松，刀鲁就被“吸”过去一点（钟口宽）
}
function bellLand() {
  BELL.state = 'down'; BELL.t = 0; BELL.y = 0; shake = 0.7; slowmo = Math.max(slowmo, 0.3);
  Foley.at('gong', player.pos, { vol: 1, rate: 0.7 }); Foley.at('bell', player.pos, { vol: 0.8, rate: 0.5 }); impact('fall', { pos: new THREE.Vector3(BT.x, 0, BT.z), big: true });
  burst(new THREE.Vector3(BT.x, 0.3, BT.z), 0xf4f8ff, 60, 8); shock(new THREE.Vector3(BT.x, 0.1, BT.z), 0xffd84a, 4);
  BELL.col = { x0: BT.x - 1.5, x1: BT.x + 1.5, z0: BT.z - 1.5, z1: BT.z + 1.5, h: 2.6 }; colliders.push(BELL.col);
  const t = enemies.find(e => e.type === 'tohru5' && !e.dead);
  if (t && Math.hypot(t.pos.x - BT.x, t.pos.z - BT.z) < 2.9 && t.state !== 'charge') { t.trap(); BELL.trapped = t; }
  else { floatText(new THREE.Vector3(BT.x, 3, BT.z), '扣空了！', '#ffb84a', 26); if (t && !BELL.toldMiss) { BELL.toldMiss = 1; Story.bark('uncleP', '笨！要等他站到钟底下再拉！'); } }
  if (Math.hypot(player.pos.x - BT.x, player.pos.z - BT.z) < 2.1 && player.pos.y < 2) playerTakeHit({ pos: new THREE.Vector3(BT.x, 0, BT.z), parried() { } }, 25, { kd: 1, unblockable: 1 });
}
function updateBell(dt) {
  if (!BELL.g) return; BELL.t += dt;
  if (BELL.state === 'drop') { BELL.vy -= 34 * dt; BELL.y += BELL.vy * dt; if (BELL.y <= 0) bellLand(); }
  else if (BELL.state === 'down') {
    const tr = BELL.trapped, hold = tr ? 4 : 1.6;
    BELL.g.rotation.z = tr ? Math.sin(now * 37) * 0.012 * (1 + Math.sin(now * 3)) : 0;
    if (tr && (BELL.knock = (BELL.knock || 0) - dt) <= 0) { BELL.knock = rand(0.5, 0.9); Foley.at('gong', player.pos, { vol: 0.55, rate: rand(0.9, 1.1) }); shake = Math.max(shake, 0.1); floatText(new THREE.Vector3(BT.x + rand(-1, 1), 2.8, BT.z), '咚！', '#ffd84a', 22); }
    if (BELL.t > hold) { BELL.state = 'lift'; BELL.t = 0; if (tr) tr.untrap(); BELL.trapped = null; if (BELL.col) { const i = colliders.indexOf(BELL.col); if (i >= 0) colliders.splice(i, 1); BELL.col = null; } }
  } else if (BELL.state === 'lift') {
    BELL.y = Math.min(BELL.y0, BELL.y + dt * 1.4); BELL.g.rotation.z = 0;
    if (BELL.y >= BELL.y0) { BELL.state = 'cool'; BELL.cd = 10; Foley.at('mech', player.pos, { vol: 0.4, rate: 0.5 }); }
  } else if (BELL.state === 'cool') {
    if ((BELL.cd -= dt) <= 0) { BELL.state = 'hang'; BELL.rope.forEach(r => r.visible = true); if (wave === 19 && !gameOver) { BELL_POSTS.forEach(o => o.on = true); tip('钟绳重新系好了——还能再拉一次！', 2); } }
  }
  BELL.g.position.y = BELL.y; if (BELL.hangRope) BELL.hangRope.visible = BELL.state === 'hang' || BELL.state === 'warn' || BELL.state === 'lift' || BELL.state === 'cool';
}
const BELL_POSTS = [-1, 1].map(s => Interact.add({ area: 'bell', x: BT.x, z: BT.z + s * 4.3 + s * 0.6, r: 1.6, on: false, prompt: '按 E 拉断钟绳——大钟会砸下来罩住钟底下的人', use() { dropBell(); } }));

// ================= 刀鲁（第五集） =================
class Tohru5 extends Beast {
  build() { this.rig = makeSkinRig('tohru', this.scale); this.kbScale = 0.06; this.hbY = 1.95; this.roarCd = 0; }
  update(dt) {
    if (this.state !== 'trap') return super.update(dt);
    this.t += dt; this.pos.x = lerp(this.pos.x, BT.x, 1 - Math.exp(-dt * 10)); this.pos.z = lerp(this.pos.z, BT.z, 1 - Math.exp(-dt * 10)); this.vel.set(0, 0, 0);
    this.rig.root.position.copy(this.pos); this.hb.style.display = 'none'; this.pose(dt, 0);
  }
  trap() { this.cancelTele(); this.release(); this.threat = null; this.setState('trap'); this.rig.root.visible = false; banner('罩住了！<small>刀鲁在钟里乱撞——钟被顶开时他会头昏眼花，伤害 ×1.8</small>', 2.6); Story.bark('tohru', '放我出去！'); gameEvent('bellTrap'); }
  untrap() { this.rig.root.visible = true; this.bellDaze = true; this.pos.set(BT.x, 0, BT.z + 1.8); this.stun(3.2, '头昏眼花！ 伤害 ×1.8', '#ffd84a'); burst(this.pos.clone().setY(2), 0xffd84a, 30, 4); }
  dmgMul() { return this.state === 'stun' ? (this.bellDaze ? 1.8 : 1.5) : this.state === 'trap' ? 0 : 1; }
  takeHit(dmg, dir, m, kbMul, counter) { if (this.state === 'trap') { floatText(new THREE.Vector3(BT.x, 2.6, BT.z), '当！', '#ffd84a', 22); Foley.at('bell', this.pos, { vol: 0.5 }); return; } super.takeHit(dmg, dir, m, kbMul, counter); }
  stun(t, txt, col) { super.stun(t, txt, col); if (!/头昏/.test(txt || '')) this.bellDaze = false; }
  think(dt) {
    const p = player, dx = p.pos.x - this.pos.x, dz = p.pos.z - this.pos.z, d = Math.hypot(dx, dz) || 1;
    this.bellDaze = false;
    if (!this.raged && this.hp < this.maxHp * 0.5 && this.state === 'loco') { this.raged = true; this.startRoar(); return; }
    const S = this.state;
    if (S === 'loco') {
      this.threat = null; this.face(dt, 3.5);
      let fx = 0, fz = 0; if (d > 2.6) { fx = dx / d; fz = dz / d; } else if (d < 1.6) { fx = -dx / d * 0.4; fz = -dz / d * 0.4; }
      [fx, fz] = this.sep(fx, fz, 1.6);
      this.steer(dt, fx, fz, this.T.spd * (this.raged ? 1.15 : 1), 3);
      if (this.cd <= 0 && p.state !== 'dead') {
        const r = Math.random();
        if (d > 6.5) { if (r < 0.7) this.startCharge(); else this.cd = 0.4; }
        else if (d < 3.3) { if (p.guard && r < 0.55) this.startGrab(); else if (r < 0.55) this.startSwipe(); else if (r < 0.85) this.startStomp(); else this.startGrab(); }
        else if (r < 0.35) this.startStomp(); else if (r < 0.6) this.startCharge(); else this.cd = 0.3;
      }
    } else if (S === 'swipe' || S === 'grab' || S === 'stomp') {
      this.steer(dt, 0, 0, 0, 8); if (this.t < this.hitAt * 0.6) this.face(dt, 6);
      if (S === 'grab' && this.t > this.hitAt - 0.1 && this.t < this.hitAt + 0.15) { this.vel.set(Math.sin(this.yaw) * 5, 0, Math.cos(this.yaw) * 5); }
      if (this.t >= this.D) { this.setState('loco'); this.cd = rand(0.8, 1.4) * (this.raged ? 0.8 : 1); }
    } else if (S === 'cwind') {
      this.steer(dt, 0, 0, 0, 8); this.threat = 'red';
      if (this.tele && !this.tele.fired && this.t < this.tele.wind * this.tele.lock) this.face(dt, 5);
    } else if (S === 'charge') {
      this.threat = null; const sp = 13.5, fx = Math.sin(this.yaw), fz = Math.cos(this.yaw);
      this.vel.set(fx * sp, 0, fz * sp); this.run = (this.run || 0) + sp * dt;
      if (!this.hitP && Math.hypot(p.pos.x - this.pos.x, p.pos.z - this.pos.z) < this.radius + 0.6 && p.pos.y < 1.5) { this.hitP = true; playerTakeHit(this, 24, { kd: 1, unblockable: 1 }); }
      if (Math.random() < dt * 30) burst(this.pos.clone().setY(0.1), 0xf4f8ff, 2, 3);
      const nx = this.pos.x + fx * (this.radius + 0.25), nz = this.pos.z + fz * (this.radius + 0.25);
      const pil = areaCols().find(c => nx > c.x0 && nx < c.x1 && nz > c.z0 && nz < c.z1);
      const wall = Math.abs(nx - AREA.cx) > AREA.hx - 0.1 || Math.abs(nz - AREA.cz) > AREA.hz - 0.1;
      if (pil || wall) this.crash(pil && pil.pillar);
      else if (this.run > this.runMax) { this.setState('loco'); this.cd = rand(0.9, 1.5); this.vel.multiplyScalar(0.3); }
    } else if (S === 'roar') { this.steer(dt, 0, 0, 0, 8); this.threat = 'red'; if (this.t > 2.4) { this.setState('loco'); this.cd = 0.8; } }
  }
  act(st, D, hitAt) { this.setState(st); this.D = D; this.hitAt = hitAt; }
  startSwipe() {
    this.act('swipe', 1.45, 0.78); Foley.at('swishH', this.pos, { vol: 0.7, rate: 0.6, delay: 0.62 });
    this.tele = Tele.add({ shape: 'sector', x: this.pos.x, z: this.pos.z, yaw: this.yaw, r: 3.6, arc: 0.95, wind: 0.78, lock: 0.6, col: 'amber', src: this,
      follow: (T) => { T.x = this.pos.x; T.z = this.pos.z; T.yaw = this.yaw; }, onFire: (T) => { this.tele = null; if (Tele.inside(T, player.pos) && player.pos.y < 1.4) playerTakeHit(this, 18, {}); } });
  }
  startGrab() {
    this.act('grab', 1.3, 0.72); Foley.at('growl', this.pos, { vol: 0.5, rate: 0.6 });
    this.tele = Tele.add({ shape: 'sector', x: this.pos.x, z: this.pos.z, yaw: this.yaw, r: 2.8, arc: 0.6, wind: 0.72, lock: 0.7, col: 'purple', src: this,
      follow: (T) => { T.x = this.pos.x; T.z = this.pos.z; T.yaw = this.yaw; },
      onFire: (T) => { this.tele = null; if (Tele.inside(T, player.pos) && player.pos.y < 1.3) { if (player.iframe > 0) return playerTakeHit(this, 0, {}); player.guard = false; floatText(player.pos.clone().setY(2), '被刀鲁抓住了！', '#c04dff', 28); playerTakeHit(this, 26, { kd: 1, unblockable: 1 }); shake = 0.4; } } });
    if (!this.toldGrab) { this.toldGrab = 1; tip('紫色是抓取：格挡没用，只能闪开！', 2.2); }
  }
  startStomp() {
    this.act('stomp', 1.75, 1.0); Foley.at('growl', this.pos, { vol: 0.7, rate: 0.5 });
    this.tele = Tele.add({ shape: 'circle', x: this.pos.x, z: this.pos.z, r: 3.7, wind: 1.0, col: 'red', src: this,
      onFire: (T) => { this.tele = null; shake = 0.5; shock(this.pos.clone().setY(0.05), 0xffffff, 3.6); burst(this.pos.clone().setY(0.2), 0xf4f8ff, 46, 7); impact('fall', { pos: this.pos, big: true });
        if (Tele.inside(T, player.pos) && player.pos.y < 1.2) playerTakeHit(this, 22, { kd: 1, unblockable: 1 });
        if (this.raged) Tele.add({ shape: 'ring', x: this.pos.x, z: this.pos.z, r: 11, wind: 0.01, speed: 9, col: 'red', src: this, dmg: 14, opts: { kd: 1, unblockable: 1 } }); } });
    if (this.raged && !this.toldRing) { this.toldRing = 1; banner('刀鲁发怒了！<small>跺地会震出冲击环——在它扫过脚下时跳起来</small>', 2.4); }
  }
  startCharge() {
    this.setState('cwind'); this.hitP = false; this.run = 0; const p = player;
    const len = clamp(Math.hypot(p.pos.x - this.pos.x, p.pos.z - this.pos.z) + 5, 8, 20); this.runMax = len;
    Foley.at('roar', this.pos, { vol: 0.6, rate: 0.7 });
    this.tele = Tele.add({ shape: 'lane', x: this.pos.x, z: this.pos.z, yaw: this.yaw, w: 2.2, len, wind: 1.05, lock: 0.7, col: 'red', src: this,
      follow: (T) => { T.x = this.pos.x; T.z = this.pos.z; T.yaw = this.yaw; }, onFire: () => { this.tele = null; if (this.state === 'cwind') this.setState('charge'); } });
  }
  crash(pillar) {
    this.vel.set(-Math.sin(this.yaw) * 3, 0, -Math.cos(this.yaw) * 3); shake = pillar ? 0.5 : 0.3; impact('fall', { pos: this.pos, big: true }); Foley.at('stone', this.pos, { vol: 1 });
    burst(this.pos.clone().setY(1.6).addScaledVector(new THREE.Vector3(Math.sin(this.yaw), 0, Math.cos(this.yaw)), 1.2), 0xd8d0c0, 40, 7);
    if (pillar) { this.hp = Math.max(1, this.hp - 40); floatText(this.pos.clone().setY(3), '-40', '#ffcf6a', 26); this.stun(2.6, '撞柱子了！ 快打！', '#ffd84a'); }
    else this.stun(1.0, '撞墙了！', '#ffd84a');
  }
  startRoar() {
    this.setState('roar'); this.cancelTele(); Foley.at('roar', this.pos, { vol: 1, rate: 0.6 }); shake = 0.3;
    Story.bark('tohru', '影武者——出来！');
    Story.timers.push({ t: 1.0, f: () => { if (this.dead) return; [-1, 1].forEach(s => { const a = this.yaw + s * 1.6; const e = spawnAt('ninja', clamp(this.pos.x + Math.sin(a) * 3, BT.x - 11, BT.x + 11), clamp(this.pos.z + Math.cos(a) * 3, BT.z - 11, BT.z + 11)); e.cd = 1.4; burst(e.pos.clone().setY(1), 0x5a3a8a, 20, 3); }); } });
  }
  parried() { this.release(); this.cancelTele(); this.stun(1.2, '破绽!'); }
  pose(dt, v) {
    const sk = this.rig.sk; if (!sk || !sk.mixer) return;
    const S = this.state;
    if (cutscene && !this.dead) sk.set('cut', { boss_idle: 1 }, null, 0.25);
    else if (S === 'loco' || S === 'trap') sk.set('loco', skLoco(sk, { v, idle: 'boss_idle', walk: 'boss_walk', walkV: 1.2 }), null, 0.2);
    else if (S === 'swipe' || S === 'grab') { const map = ['boss_swipe', .3, 1.23, 2.4]; sk.set(S, { boss_swipe: 1 }, null, 0.1); sk.time('boss_swipe', skMap(map, Math.min(1, this.t / this.D), this.hitAt / this.D)); }
    else if (S === 'stomp') { const map = ['boss_stomp', .1, 1.75, 3.0]; sk.set(S, { boss_stomp: 1 }, null, 0.1); sk.time('boss_stomp', skMap(map, Math.min(1, this.t / this.D), this.hitAt / this.D)); }
    else if (S === 'cwind' || S === 'roar') { sk.set(S, { boss_roar: 1 }, null, 0.15); sk.time('boss_roar', Math.min(sk.dur('boss_roar') - 0.01, 0.2 + this.t * (S === 'roar' ? 1 : 1.6))); }
    else if (S === 'charge') { sk.set('charge', { boss_walk: 1 }, null, 0.1); sk.speed('boss_walk', 3.2); }
    else if (S === 'stun') { sk.set('stun', { drunk_stumble: 1 }, null, 0.2); sk.speed('drunk_stumble', 0.75); }
    else if (S === 'dead') skDown(sk, false, Math.min(this.t, 1.0), 2.1, true);
    sk.update(dt);
  }
  deathAnim(dt) { if (this.t > 0.36 && !this.thud) { this.thud = 1; impact('fall', { pos: this.pos, big: true }); shake = 0.5; burst(this.pos.clone().setY(0.3), 0xf4f8ff, 40, 6); } }
}
BEAST_CLS.tohru5 = Tohru5;

// ================= 黑成龙：镜像连招 + 阴阳盘 =================
document.head.insertAdjacentHTML('beforeend', `<style>
#yyhud{position:fixed;left:50%;top:78px;transform:translateX(-50%);width:340px;padding:8px 14px 9px;border-radius:12px;background:rgba(10,8,18,.72);border:1px solid rgba(190,150,255,.35);font:12px "Noto Sans SC",sans-serif;color:#e6dcff;display:none;pointer-events:none;z-index:6;text-align:center}
#yyhud .row{display:flex;align-items:center;gap:8px}
#yyhud .lab{width:52px;font-size:12px;opacity:.85}
#yyhud .bar{position:relative;flex:1;height:12px;border-radius:6px;background:linear-gradient(90deg,#1a1430,#4a3a6a 35%,#6a6070 50%,#c8b48a 65%,#f4ecd8);overflow:hidden}
#yyhud .bar .z{position:absolute;left:32.5%;width:35%;top:0;bottom:0;border-left:2px solid rgba(255,216,74,.9);border-right:2px solid rgba(255,216,74,.9);background:rgba(255,216,74,.12)}
#yyhud .bar .z2{position:absolute;left:15%;width:70%;top:0;bottom:0;border-left:1px dashed rgba(255,255,255,.35);border-right:1px dashed rgba(255,255,255,.35)}
#yyhud .bar b{position:absolute;top:-3px;bottom:-3px;width:16px;margin-left:-8px;left:50%;border-radius:50%;background:radial-gradient(circle,#fff 0 35%,#000 36% 100%);box-shadow:0 0 8px #fff}
#yyhud small{display:block;margin-top:5px;font-size:13px;font-weight:700}
#yyhud em{display:block;font-style:normal;opacity:.6;font-size:11px;margin-top:2px}
</style>`);
document.body.insertAdjacentHTML('beforeend', '<div id="yyhud"><div class="row"><span class="lab">阴 · 守</span><div class="bar"><span class="z2"></span><span class="z"></span><b id="yyb"></b></div><span class="lab">攻 · 阳</span></div><small id="yyst">平衡</small><em>出手推向“阳”，格挡/闪避推向“阴”——指针在金框内伤害最高</em></div>');
const YYS = { b: 0, rec: [], last: null, on: false, healT: 0 };
function yyMul() { const a = Math.abs(YYS.b); return a < 0.35 ? 1.25 : a < 0.7 ? 0.8 : 0.35; }
function yyNudge(d) { if (!YYS.on) return; YYS.b = clamp(YYS.b + d, -1, 1); }
function updateYY(dt) {
  const h = $('yyhud'); const show = YYS.on && started && !gameOver && !cutscene; h.style.display = show ? 'block' : 'none'; if (!show) return;
  YYS.b -= Math.sign(YYS.b) * Math.min(Math.abs(YYS.b), dt * 0.045);
  $('yyb').style.left = (50 + YYS.b * 50) + '%';
  const a = Math.abs(YYS.b), st = $('yyst');
  if (a < 0.35) { st.textContent = '阴阳平衡 · 伤害 ×1.25'; st.style.color = '#ffd84a'; }
  else if (a < 0.7) { st.textContent = (YYS.b > 0 ? '偏阳（攻得太猛）' : '偏阴（守得太多）') + ' · 伤害 ×0.8'; st.style.color = '#e6dcff'; }
  else { st.textContent = (YYS.b > 0 ? '阳盛——他在吸收你的蛮力！' : '阴盛——光守是赢不了的！') + ' · 伤害 ×0.35'; st.style.color = '#ff7a6a'; }
}
// 记录玩家最近的出招（给黑成龙模仿）
{
  const _sm = startMove;
  startMove = function (m) { const r = _sm.apply(this, arguments); if (YYS.on && m && player.move === m) { const k = m.skKey, c = SKM[k]; if (c && c[0] !== 'idle_box' && SKIN.clips[c[0]]) { YYS.rec.push(k); if (YYS.rec.length > 8) YYS.rec.shift(); } } return r; };
}
const SJ_HEAVY = /^(heavy_p|quad|elbow|kick_spin|upper|kick_round|slash_in)$/, SJ_LOW = /^(sweep|kick_low)$/;
const SJ_BASIC = [['jab1', 'jab2', 'hook'], ['jab1', 'kick2', 'heavyK'], ['jab1', 'jab2', 'sweep'], ['kick1', 'kick3'], ['jab2', 'heavyF0']];
class ShadowJ extends Beast {
  build() { this.rig = makeSkinRig('jackie', 1); this.kbScale = 0.35; this.hbY = 2.0; this.dark = false; this.orb = 1; this.stepCd = 4; this.dodgeCd = 2; this.mirrorN = 0; }
  darken() {
    if (this.dark || !this.rig.loaded) return; this.dark = true;
    for (const m of this.rig.mats) { m.color.multiplyScalar(0.14); m.color.r += 0.015; m.color.b += 0.04; if (m.emissive) { m.emissive.setRGB(0.09, 0.02, 0.16); m.userData.e0 = m.emissive.clone(); } }
  }
  update(dt) { this.darken(); super.update(dt); if (!this.dead && this.rig.root.visible && Math.random() < dt * 14) burst(this.pos.clone().setY(rand(0.3, 1.7)).add(new THREE.Vector3(rand(-0.3, 0.3), 0, rand(-0.3, 0.3))), 0x6a3aaa, 1, 1.2); }
  idle(dt) { this.darken(); super.idle(dt); }
  dmgMul() { return (this.state === 'stun' ? 1.5 : 1) * yyMul(); }
  takeHit(dmg, dir, m, kbMul, counter) {
    super.takeHit(dmg, dir, m, kbMul, counter);
    if (!this.dead && yyMul() < 0.5) { this.hp = Math.min(this.maxHp, this.hp + 3); if (now - YYS.healT > 1.2) { YYS.healT = now; floatText(this.pos.clone().setY(2.3), YYS.b > 0 ? '他吸收了你的蛮力！' : '光守没有用！', '#c49aff', 22); } }
  }
  onHit(dmg, dir, m, counter) {
    if (counter && this.state === 'combo') { this.stun(0.8, '打断！'); return; }
    if (this.state === 'loco' && (m.heavy || counter || Math.random() < 0.35)) this.setState('flinch');
  }
  think(dt) {
    const p = player, dx = p.pos.x - this.pos.x, dz = p.pos.z - this.pos.z, d = Math.hypot(dx, dz) || 1, S = this.state;
    if (!this.summoned && this.hp < this.maxHp * 0.5 && S !== 'combo' && S !== 'step') { this.summoned = true; this.summon(); }
    this.dodgeCd -= dt; this.stepCd -= dt;
    if (S === 'loco') {
      this.threat = null; this.face(dt, 8); this.rig.root.visible = true;
      const ux = dx / d, uz = dz / d; let fx = 0, fz = 0;
      if (d > 2.9) { fx = ux; fz = uz; } else if (d < 1.5) { fx = -ux * 0.7; fz = -uz * 0.7; } else { fx = -uz * this.orb * 0.55; fz = ux * this.orb * 0.55; }
      if (Math.random() < dt * 0.5) this.orb = -this.orb;
      this.steer(dt, fx, fz, d > 5 ? this.T.spd * 1.35 : this.T.spd * 0.65, 6);
      if (p.state === 'attack' && d < 2.8 && this.dodgeCd <= 0 && p.move !== this.seenMove) { this.seenMove = p.move; if (Math.random() < 0.28) { this.dodgeCd = 2.6; this.startDodge(); return; } }
      if (this.cd <= 0 && p.state !== 'dead') { if (d > 6 && this.stepCd <= 0) this.shadowStep(); else if (d < 3.3) this.startCombo(); }
    } else if (S === 'combo') this.runCombo(dt);
    else if (S === 'dodge') { const k = Math.min(1, this.t / 0.42); this.vel.set(this.dv.x * 7.5 * (1 - k), 0, this.dv.z * 7.5 * (1 - k)); if (this.t > 0.45) { this.setState('loco'); this.cd = Math.min(this.cd, 0.25); } }
    else if (S === 'step') {
      this.steer(dt, 0, 0, 0, 10);
      if (this.t > 0.12 && !this.blinked) { this.blinked = true; this.rig.root.visible = false; burst(this.pos.clone().setY(1), 0x6a3aaa, 24, 4); Foley.at('swishH', this.pos, { vol: 0.6, rate: 1.3 }); }
      if (this.t > 0.32 && !this.arrived) { this.arrived = true; const b = -1; this.pos.set(p.pos.x + Math.sin(p.yaw) * 1.7 * b, 0, p.pos.z + Math.cos(p.yaw) * 1.7 * b); collideCircle(this.pos, this.radius); this.yaw = Math.atan2(p.pos.x - this.pos.x, p.pos.z - this.pos.z); this.rig.root.visible = true; burst(this.pos.clone().setY(1), 0x6a3aaa, 24, 4); floatText(this.pos.clone().setY(2.2), '影步！', '#b48aff', 24); }
      if (this.t > 0.42) this.startCombo(['jab1', 'jab2']);
    } else if (S === 'flinch') { this.steer(dt, 0, 0, 0, 8); if (this.t > 0.32) { this.setState('loco'); this.cd = Math.max(this.cd, 0.2); } }
  }
  summon() {
    banner('黑成龙召唤了影子！<small>打散影子，别忘了阴阳盘</small>', 2.4); Story.bark('darkj', '影子……都是我的影子。');
    [-1, 1].forEach(s => { const a = this.yaw + s * 1.9, e = spawnAt('shade', this.pos.x + Math.sin(a) * 2.5, this.pos.z + Math.cos(a) * 2.5); e.cd = 1.4; burst(e.pos.clone().setY(1), 0x6a3aaa, 26, 4); });
  }
  startDodge() {
    const p = player, ax = this.pos.x - p.pos.x, az = this.pos.z - p.pos.z, l = Math.hypot(ax, az) || 1, s = Math.random() < 0.5 ? 1 : -1;
    this.dv = new THREE.Vector3(ax / l * 0.6 - az / l * s * 0.8, 0, az / l * 0.6 + ax / l * s * 0.8).normalize(); this.dside = s;
    this.setState('dodge'); Foley.at('swishH', this.pos, { vol: 0.5, rate: 0.9 }); Foley.at('cloth', this.pos, { vol: 0.4 });
    if (!this.toldDodge) { this.toldDodge = 1; floatText(this.pos.clone().setY(2.2), '“你会闪，我也会。”', '#b48aff', 22); }
  }
  shadowStep() { this.setState('step'); this.blinked = false; this.arrived = false; this.stepCd = rand(5, 8); this.cancelTele(); }
  startCombo(force) {
    let keys = force, mirror = false;
    if (!keys) {
      const R = YYS.rec;
      if (R.length >= 3 && Math.random() < 0.7) { const n = Math.min(R.length, 3 + (Math.random() < 0.4 ? 1 : 0)); keys = R.slice(-n); mirror = true; }
      else keys = SJ_BASIC[Math.floor(Math.random() * SJ_BASIC.length)];
    }
    keys = keys.filter(k => SKM[k] && SKIN.clips[SKM[k][0]]); if (!keys.length) keys = ['jab1'];
    if (mirror) { this.mirrorN++; if (this.mirrorN === 1) banner('黑成龙在模仿你的连招！<small>琥珀色可以格挡 · 红色只能躲 · 冲击环要跳</small>', 2.6); else if (Math.random() < 0.3) Story.bark('darkj', ['这一套，是你的。', '你就只会这些？', '我学得比你快。'][Math.floor(Math.random() * 3)]); }
    this.seq = { keys, i: -1, mirror }; this.setState('combo'); this.nextMove();
  }
  nextMove() {
    const q = this.seq; q.i++;
    if (q.i >= q.keys.length) { this.seq = null; this.setState('loco'); this.cd = rand(1.2, 2.0); return; }
    const key = q.keys[q.i], map = SKM[key], len = Math.max(0.3, map[3] - map[1]);
    const hf = map[2] == null ? 0.55 : clamp((map[2] - map[1]) / len, 0.2, 0.85);
    let D = clamp(len / 1.15, 0.5, 1.25); if (D * hf < 0.4) D = 0.4 / hf;
    const kind = SJ_LOW.test(map[0]) ? 'low' : SJ_HEAVY.test(map[0]) ? 'heavy' : 'light';
    this.t = 0; this.cur = { key, map, D, hitAt: D * hf, kind };
    Foley.at(kind === 'light' ? 'swishS' : 'swishH', this.pos, { vol: 0.5, rate: kind === 'light' ? 1.1 : 0.85, delay: Math.max(0, D * hf - 0.1) });
    const f = (T) => { T.x = this.pos.x; T.z = this.pos.z; T.yaw = this.yaw; };
    if (kind === 'light') this.tele = Tele.add({ shape: 'sector', x: this.pos.x, z: this.pos.z, yaw: this.yaw, r: 2.3, arc: 0.75, wind: D * hf, lock: 0.7, col: 'amber', src: this, follow: f,
      onFire: (T) => { this.tele = null; if (Tele.inside(T, player.pos) && player.pos.y < 1.3) playerTakeHit(this, 11, {}); } });
    else if (kind === 'heavy') this.tele = Tele.add({ shape: 'sector', x: this.pos.x, z: this.pos.z, yaw: this.yaw, r: 2.6, arc: 0.85, wind: D * hf, lock: 0.65, col: 'red', src: this, follow: f,
      onFire: (T) => { this.tele = null; if (Tele.inside(T, player.pos) && player.pos.y < 1.3) playerTakeHit(this, 17, { kd: 1, unblockable: 1 }); } });
    else this.tele = Tele.add({ shape: 'ring', x: this.pos.x, z: this.pos.z, r: 4.6, wind: D * hf, speed: 8, col: 'red', src: this, dmg: 13, opts: { kd: 1, unblockable: 1 }, follow: f, onFire: () => { this.tele = null; } });
  }
  runCombo(dt) {
    const c = this.cur; if (!c) { this.setState('loco'); return; }
    if (this.t < c.hitAt * 0.7) this.face(dt, 9);
    const fw = this.t < c.hitAt ? 3.0 : 0; this.steer(dt, Math.sin(this.yaw) * fw / 3, Math.cos(this.yaw) * fw / 3, 3, 10);
    const d = Math.hypot(player.pos.x - this.pos.x, player.pos.z - this.pos.z); if (d < 1.0 && this.t < c.hitAt) this.steer(dt, 0, 0, 0, 20);
    this.threat = c.kind === 'light' ? 'amber' : 'red';
    if (this.t >= c.D) this.nextMove();
  }
  stun(t, txt, col) { this.seq = null; this.cur = null; this.rig.root.visible = true; super.stun(t, txt, col); }
  parried() { this.release(); this.cancelTele(); this.stun(1.15, '破绽!'); }
  die(dir) {
    super.die(dir); YYS.on = false; this.rig.root.visible = true;
    for (const e of enemies) if (e.type === 'shade' && !e.dead) { e.hp = 0; e.die(new THREE.Vector2(0, 1), MOVES.push); burst(e.pos.clone().setY(1), 0x6a3aaa, 30, 4); e.rig.root.visible = false; }
    banner('黑成龙跪倒了！<small>“为什么……”</small>', 2.6);
  }
  deathAnim() { }
  pose(dt, v) {
    const sk = this.rig.sk; if (!sk || !sk.mixer) return; const S = this.state;
    if (S === 'dead') { sk.set('kneel', { crouch_idle: 1 }, null, 0.4); }
    else if (cutscene || S === 'loco') {
      const sy = Math.sin(this.yaw), cy = Math.cos(this.yaw), vv = cutscene ? 0 : v;
      const fwd = (this.vel.x * sy + this.vel.z * cy) / Math.max(v, 1e-3), side = (this.vel.x * cy - this.vel.z * sy) / Math.max(v, 1e-3);
      sk.set(cutscene ? 'cut' : 'loco', skLoco(sk, { v: vv, idle: 'idle_box', walk: 'walk', walkV: 1.5, run: 'run', runV: 5.0, walkMax: 3.0, dir: 1, fwd, side, back: 'walk_back', strafe: ['strafe_l', 'strafe_r'] }), null, 0.18);
    } else if (S === 'combo' && this.cur) {
      const c = this.cur, m = c.map; sk.set('m' + this.seq?.i + c.key, m[4] ? { [m[4]]: 1 } : { [m[0]]: 1 }, { [m[0]]: 1 }, 0.06);
      sk.time(m[0], skMap(m, Math.min(1, this.t / c.D), c.hitAt / c.D));
    } else if (S === 'dodge') { sk.set('dside', { dodge_side: 1 }, null, 0.05); sk.time('dodge_side', 0.1 + Math.min(1, this.t / 0.45) * 1.4); }
    else if (S === 'step') { sk.set('roll', { roll: 1 }, null, 0.05); sk.time('roll', 0.3 + Math.min(1, this.t / 0.42) * 1.65); }
    else if (S === 'flinch') { sk.set('hit', { hit_light: 1 }, null, 0.05); sk.time('hit_light', Math.min(1, this.t / 0.32) * 0.85); }
    else if (S === 'stun') { sk.set('stun', { drunk_stumble: 1 }, null, 0.15); sk.speed('drunk_stumble', 0.8); }
    sk.update(dt);
  }
}
BEAST_CLS.darkj = ShadowJ;
{
  const _ge = gameEvent;
  gameEvent = function (k, d) {
    _ge(k, d);
    if (!YYS.on) return;
    if (k === 'hit' && d && d.e && !d.echo && (d.e.type === 'darkj' || d.e.type === 'shade')) yyNudge(d.counter ? 0.04 : d.m && d.m.heavy ? 0.14 : 0.08);
    else if (k === 'parry') yyNudge(-0.35);
    else if (k === 'pdodge') yyNudge(-0.3);
  };
  const _pth = playerTakeHit;
  playerTakeHit = function (e, dmg, opts) { _pth(e, dmg, opts); if (YYS.on && player.state === 'block' && e && e.type === 'darkj') yyNudge(-0.08); };
}

// ================= 虎符觉醒：完美格挡 / 完美闪避后 4 秒，每次命中都有影子追击 =================
const TIGER2 = { get on() { try { return localStorage.getItem('jc_tiger2') === '1'; } catch (e) { return false; } }, t: -9 };
function tigerDesc() { const R = RUNES.find(r => r.key === 'tiger'); if (R && TIGER2.on) { R.full = '虎符 · 阴阳平衡（觉醒）'; R.desc = '完美格挡、完美闪避的判定时间 +50%；完美格挡/闪避后 4 秒内，每次命中都有影子追击（50% 伤害）'; } }
tigerDesc();
{
  const _ge = gameEvent;
  gameEvent = function (k, d) {
    _ge(k, d);
    if (!(Runes.has('tiger') && TIGER2.on && MODE === 'story')) return;
    if (k === 'pdodge' || k === 'parry') { TIGER2.t = now + 4; showMove('虎符 · 影随身！', '#ffb84a'); Foley.at('spell', player.pos, { vol: 0.35, rate: 1.2 }); burst(player.pos.clone().setY(1.2), 0x6a3aaa, 20, 3); }
    else if (k === 'hit' && d && d.e && !d.echo && now < TIGER2.t) {
      const e = d.e, dmg = Math.max(1, Math.round(d.dmg * 0.5));
      Story.timers.push({ t: 0.12, f: () => {
        if (e.dead || !enemies.includes(e)) return; const dir = new THREE.Vector2(e.pos.x - player.pos.x, e.pos.z - player.pos.z).normalize();
        e.takeHit(dmg, dir, { kb: 0.6 }, 0.5, false); const hp = e.pos.clone(); hp.y += 1.3 * (e.scale || 1);
        burst(hp, 0x8a5ad8, 12, 4); floatText(hp.add(new THREE.Vector3(0.3, 0.3, 0)), dmg, '#c49aff', 20); Foley.at('swishS', e.pos, { vol: 0.35, rate: 1.4 });
        gameEvent('hit', { e, dmg, m: { kb: 0.6 }, echo: 1 });
      } });
    }
  };
}

// ================= 场景动画：落雪 =================
const SNOWFX = (() => {
  const N = 700, m = new THREE.InstancedMesh(new THREE.OctahedronGeometry(0.024, 0), new THREE.MeshBasicMaterial({ color: 0xffffff }), N);
  m.frustumCulled = false; m.visible = false; scene.add(m);
  const P = new Float32Array(N * 4); for (let i = 0; i < N; i++) { P[i * 4] = rand(-14, 14); P[i * 4 + 1] = rand(0, 12); P[i * 4 + 2] = rand(-14, 14); P[i * 4 + 3] = rand(0, TAU); }
  return { m, P, N, mx: new THREE.Matrix4() };
})();
{
  const _ua = updateAreas;
  updateAreas = function (dt) {
    _ua(dt);
    const on = AREA.name === 'snow' || AREA.name === 'bell' || AREA.name === 'yy'; SNOWFX.m.visible = on;
    if (on) {
      const { P, N, mx, m } = SNOWFX, c = camera.position, sp = AREA.name === 'yy' ? 0.5 : 1, wx = AREA.name === 'snow' ? 1.6 : 0.4;
      for (let i = 0; i < N; i++) {
        P[i * 4 + 1] -= dt * 1.3 * sp; P[i * 4] += dt * wx; P[i * 4 + 3] += dt;
        if (P[i * 4 + 1] < -2) { P[i * 4 + 1] = 12; P[i * 4] = rand(-14, 14); P[i * 4 + 2] = rand(-14, 14); }
        let x = P[i * 4] + Math.sin(P[i * 4 + 3]) * 0.3, z = P[i * 4 + 2];
        x = ((x % 28) + 42) % 28 - 14;
        mx.makeTranslation(c.x + x, c.y - 4 + P[i * 4 + 1], c.z + z); m.setMatrixAt(i, mx);
      }
      m.instanceMatrix.needsUpdate = true;
    }
    if (AREA.name === 'snow' && SNOW.cloudTex) SNOW.cloudTex.offset.x += dt * 0.004;
    if (AREA.name === 'bell') updateBell(dt);
    if (AREA.name === 'yy' && YYF.taiji) { YYF.taiji.rotation.z += dt * 0.05 * (YYS.on ? 1 + Math.abs(YYS.b) * 4 : 1); YYF.moonHalo.material.opacity = 0.35 + Math.sin(now) * 0.05; }
    updateYY(dt);
  };
}

// ================= 阴阳台（夜） =================
const YYF = { taiji: null };
(function buildTerrace() {
  const G = new THREE.Group(); G.position.set(YY.x, 0, YY.z); scene.add(G); AREA_GROUPS.yy = G;
  const R = YY.r + 1.3;
  const tj = canvasTex(1024, 1024, (g, W) => {
    const c = W / 2; g.fillStyle = '#3a3a44'; g.fillRect(0, 0, W, W);
    g.fillStyle = '#585862'; g.beginPath(); g.arc(c, c, c - 4, 0, TAU); g.fill();
    g.strokeStyle = '#c8a050'; g.lineWidth = 10; g.beginPath(); g.arc(c, c, c - 30, 0, TAU); g.stroke(); g.beginPath(); g.arc(c, c, c * 0.62, 0, TAU); g.stroke();
    // 八卦
    const tri = ['111', '011', '101', '001', '110', '010', '100', '000'];
    g.fillStyle = '#d8b060';
    for (let i = 0; i < 8; i++) { g.save(); g.translate(c, c); g.rotate(i / 8 * TAU); for (let k = 0; k < 3; k++) { const y = -c * 0.86 + k * 34, w = 150; if (tri[i][k] === '1') g.fillRect(-w / 2, y, w, 20); else { g.fillRect(-w / 2, y, w * 0.42, 20); g.fillRect(w * 0.08, y, w * 0.42, 20); } } g.restore(); }
    const r = c * 0.56;
    g.fillStyle = '#f2ece0'; g.beginPath(); g.arc(c, c, r, -Math.PI / 2, Math.PI / 2); g.fill();
    g.fillStyle = '#16141c'; g.beginPath(); g.arc(c, c, r, Math.PI / 2, Math.PI * 1.5); g.fill();
    g.fillStyle = '#16141c'; g.beginPath(); g.arc(c, c - r / 2, r / 2, 0, TAU); g.fill();
    g.fillStyle = '#f2ece0'; g.beginPath(); g.arc(c, c + r / 2, r / 2, 0, TAU); g.fill();
    g.fillStyle = '#f2ece0'; g.beginPath(); g.arc(c, c - r / 2, r / 7, 0, TAU); g.fill();
    g.fillStyle = '#16141c'; g.beginPath(); g.arc(c, c + r / 2, r / 7, 0, TAU); g.fill();
    for (let i = 0; i < 3000; i++) { const v = Math.random() * 40 | 0; g.fillStyle = `rgba(${v},${v},${v},.12)`; g.fillRect(Math.random() * W, Math.random() * W, 3, 3); }
  });
  mesh(new THREE.CylinderGeometry(R, R + 0.6, 2.4, 64), rockM, 0, -1.2, 0, G);
  const top = mesh(new THREE.CircleGeometry(R, 64), MS(0xffffff, { map: tj, roughness: 0.8 }), 0, 0.004, 0, G, false); top.rotation.x = -Math.PI / 2; top.receiveShadow = true; YYF.taiji = top;
  mesh(new THREE.TorusGeometry(R, 0.18, 8, 72), M(0x8a7040), 0, 0.05, 0, G, false).rotation.x = Math.PI / 2;
  // 山崖基座
  const base = mesh(new THREE.CylinderGeometry(R - 1, 4, 30, 9), rockD, 0, -17, 0, G, false); base.rotation.y = 0.3;
  // 石灯笼一圈
  const lanM = glowMat(0.9, 0.5, 2.2);
  for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + Math.PI / 8, x = Math.cos(a) * (R - 0.5), z = Math.sin(a) * (R - 0.5); box(0.5, 1.1, 0.5, rockM, x, 0.55, z, G); box(0.36, 0.3, 0.36, lanM, x, 1.25, z, G).castShadow = false; box(0.7, 0.18, 0.7, rockD, x, 1.5, z, G); lightPool(x, z, 1.8, new THREE.Color(0.08, 0.06, 0.3), G); }
  // 月亮 + 远山
  const moon = mesh(new THREE.SphereGeometry(9, 24, 16), new THREE.MeshBasicMaterial({ color: new THREE.Color(2.2, 2.1, 1.9), fog: false }), -60, 48, -150, G, false);
  const halo = mesh(new THREE.PlaneGeometry(60, 60), new THREE.MeshBasicMaterial({ map: canvasTex(256, 256, (g) => { const gr = g.createRadialGradient(128, 128, 20, 128, 128, 128); gr.addColorStop(0, 'rgba(200,210,255,.9)'); gr.addColorStop(1, 'rgba(200,210,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 256, 256); }), transparent: true, depthWrite: false, fog: false, opacity: 0.35 }), -60, 48, -149, 0, G); YYF.moonHalo = halo; halo.lookAt(new THREE.Vector3(YY.x, 0, YY.z));
  farPeaks(G, [[-70, -40, -90, 30, 70], [10, -40, -120, 45, 90], [80, -40, -60, 32, 70], [-90, -40, 40, 30, 60], [90, -40, 50, 34, 66], [0, -40, 120, 40, 70]]);
  const ct = snowTex.clone(); ct.needsUpdate = true; ct.wrapS = ct.wrapT = THREE.RepeatWrapping; ct.repeat.set(4, 4);
  const sea = mesh(new THREE.PlaneGeometry(500, 500), new THREE.MeshBasicMaterial({ map: ct, transparent: true, opacity: 0.6, color: 0x7080a8, depthWrite: false }), 0, -24, 0, G, false); sea.rotation.x = -Math.PI / 2;
  BATCH.push(Object.assign(staticBatch([G], new Set([top, halo, moon])), { cx: YY.x, cz: YY.z, r: 140 }));
  BATCH.push({ group: G, cx: YY.x, cz: YY.z, r: 140 });
})();
AREA_DEF.yy = () => ({ cx: YY.x, cz: YY.z, hx: YY.r, hz: YY.r, round: YY.r, room: false, sun: 1.3, sunC: 0xb8c4ff, hemi: [0x8a90c8, 0x2a2436, 1.1], fog: [0x141a2c, 40, 150], night: true, ep4: 1, occl: 1 });
window.__ep5 = { SNOW, BELL, YYS, TIGER2, SN, BT, YY, cliffFall, dropBell, bellLand, updateBell, updateSnow, yyMul, yyNudge };
