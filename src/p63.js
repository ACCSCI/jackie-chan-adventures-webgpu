// ================= 第九集 · 狗与猪 · 圣主：旧墓园 / 猪神殿 / 天界祭坛 =================
const GY = { x: 0, z: 1120, hx: 13, hz: 13 };
const PT = { x: 220, z: 1120, r: 13 };
const ALT = { x: -220, z: 1120, r: 14 };
const SEAL = { list: [], told: {}, sealed: 0, revived: 0 };
// ---------- 旧墓园 ----------
(function buildGrave() {
  const G = new THREE.Group(); G.position.set(GY.x, 0, GY.z); scene.add(G); AREA_GROUPS.grave = G;
  const gt = canvasTex(256, 256, (g, S) => { g.fillStyle = '#2a3022'; g.fillRect(0, 0, S, S); for (let i = 0; i < 1400; i++) { g.fillStyle = Math.random() < 0.5 ? 'rgba(60,70,40,.5)' : 'rgba(20,24,16,.5)'; g.fillRect(Math.random() * S, Math.random() * S, 2, 4); } }, [8, 8]);
  const fl = mesh(new THREE.PlaneGeometry(80, 80), M(0xffffff, { map: gt }), 0, 0.001, 0, G, false); fl.rotation.x = -Math.PI / 2; fl.receiveShadow = true;
  const st = M(0x6a6a66, { roughness: 0.95 }), st2 = M(0x4a4a48, { roughness: 0.95 });
  // 墓碑：四周一圈 + 场内几块（矮，不挡路）
  for (let i = 0; i < 40; i++) { const a = rand(0, TAU), r = rand(GY.hx + 1.5, GY.hx + 10), x = Math.cos(a) * r, z = Math.sin(a) * r; const t = box(rand(0.6, 1), rand(0.9, 1.6), 0.25, i % 2 ? st : st2, x, 0.6, z, G); t.rotation.set(rand(-0.15, 0.15), rand(0, TAU), rand(-0.15, 0.15)); }
  // 围墙 + 牌楼
  const wall = M(0x5a5048);
  [-1, 1].forEach(s => { box(GY.hx * 2 + 6, 2.2, 0.5, wall, 0, 1.1, s * (GY.hz + 3), G); box(0.5, 2.2, GY.hz * 2 + 6, wall, s * (GY.hx + 3), 1.1, 0, G); });
  // 枯树
  const bark = M(0x2a1e16);
  [[-GY.hx - 1.5, -5], [GY.hx + 1.5, 6], [-8, GY.hz + 1.5], [9, -GY.hz - 1.5]].forEach(([x, z]) => { box(0.5, 5, 0.5, bark, x, 2.5, z, G); for (let k = 0; k < 4; k++) { const b = box(0.18, 2.2, 0.18, bark, x, 4 + k * 0.4, z, G); b.rotation.set(rand(-1, 1), rand(0, TAU), rand(0.6, 1.1)); b.position.x += Math.sin(k * 1.7) * 0.8; b.position.z += Math.cos(k * 1.7) * 0.8; } });
  // 灯笼与鬼火
  for (let i = 0; i < 14; i++) { const a = i / 14 * TAU; mesh(new THREE.SphereGeometry(0.14, 8, 6), glowMat(0.4, 2.4, 0.8), Math.cos(a) * (GY.hx + 1), 1.4 + Math.sin(i * 2) * 0.4, Math.sin(a) * (GY.hz + 1), G, false); }
  lightPool(0, 0, 9, new THREE.Color(0.08, 0.16, 0.1), G);
  BATCH.push(Object.assign(staticBatch([G], new Set()), { cx: GY.x, cz: GY.z, r: 120 }));
  BATCH.push({ group: G, cx: GY.x, cz: GY.z, r: 120 });
})();
AREA_DEF.grave = () => ({ cx: GY.x, cz: GY.z, hx: GY.hx, hz: GY.hz, room: false, sun: 0.6, sunC: 0xa0c0ff, hemi: [0x5a7060, 0x141810, 1.25], fog: [0x0c120e, 24, 90], night: true, occl: 1, ep4: 1, squad: 1 });
function graveWeapons() { [[-4, 5], [4, 5], [0, -6]].forEach(([x, z], i) => spawnWeapon([3, 0, 8][i], GY.x + x, GY.z + z)); }
// ---------- 老爹的金色封印阵 ----------
function addSeal(x, z, r = 1.7) {
  const g = new THREE.Group(); g.position.set(x, 0.04, z); scene.add(g);
  const tex = canvasTex(256, 256, (c, W) => { c.strokeStyle = '#ffd84a'; c.lineWidth = 8; c.beginPath(); c.arc(W / 2, W / 2, W / 2 - 8, 0, TAU); c.stroke(); c.lineWidth = 4; c.beginPath(); c.arc(W / 2, W / 2, W / 2 - 30, 0, TAU); c.stroke(); c.fillStyle = '#ffd84a'; c.font = 'bold 72px serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('封', W / 2, W / 2); for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; c.save(); c.translate(W / 2 + Math.cos(a) * 96, W / 2 + Math.sin(a) * 96); c.rotate(a); c.fillRect(-10, -3, 20, 6); c.restore(); } });
  const m = mesh(new THREE.CircleGeometry(r, 40), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, toneMapped: false, color: 0xffffff }), 0, 0, 0, g, false); m.rotation.x = -Math.PI / 2;
  const S = { x, z, r, g, m }; SEAL.list.push(S); return S;
}
function sealsClear() { SEAL.list.forEach(S => scene.remove(S.g)); SEAL.list.length = 0; }
function updateSeals(dt) { for (const S of SEAL.list) { S.m.rotation.z += dt * 0.6; S.m.material.color.setScalar(1 + 0.4 * Math.sin(now * 4)); } }
// ---------- 不死之身：血打空后倒地 3 秒再爬起来；倒地时被打进金色封印圈才算真正消灭 ----------
function Undying(Base) {
  return class extends Base {
    die(dir, m) {
      if (this.sealed || AREA.name === 'dojo' || !SEAL.list.length) return super.die(dir, m);
      this.hp = 0; this.cancelTele && this.cancelTele(); this.release(); this.threat = null; this.setState('down9'); this.downT = this.T.downT || 3.2; this.pushN = 0;
      if (dir) { this.vel.x += dir.x * 3; this.vel.z += dir.y * 3; }
      floatText(this.pos.clone().setY(2), '把它打进封印圈！', '#ffd84a', 22); Foley.at('bodyFall', this.pos, { vol: 0.6 });
      if (!SEAL.told.down) { SEAL.told.down = 1; banner('不死之身！<small>倒地的不死者 3 秒后会爬起来——趁它倒地，把它打进金色封印圈（重击打得更远）</small>', 2.8); }
    }
    takeHit(dmg, dir, m, kbMul, counter) {
      if (this.dead) return;
      if (this.state === 'down9') { const k = ((m && m.heavy) ? 7.5 : 3.2) * (this.T.pushK || 1); this.vel.x += dir.x * k; this.vel.z += dir.y * k; this.hitFl = 0.12; this.downT = Math.max(this.downT, 1.2); this.pushN++; Foley.at('bodyFall', this.pos, { vol: 0.4, rate: 1.3 }); return; }
      return super.takeHit(dmg, dir, m, kbMul, counter);
    }
    think(dt) {
      if (this.state !== 'down9') return super.think(dt);
      this.vel.multiplyScalar(Math.exp(-dt * 2.2)); this.downT -= dt;
      if (Math.random() < dt * 10) burst(this.pos.clone().setY(0.4), 0x7dff9a, 1, 1.5);
      const S = SEAL.list.find(S => Math.hypot(S.x - this.pos.x, S.z - this.pos.z) < S.r + 0.25);
      if (S) {
        this.sealed = true; SEAL.sealed++; this.vel.set(0, 0, 0); shock(new THREE.Vector3(S.x, 0.1, S.z), 0xffd84a, S.r + 1); burst(this.pos.clone().setY(1), 0xffd84a, 40, 5); Foley.at('spell', this.pos, { vol: 0.7 }); Foley.at('gong', this.pos, { vol: 0.4, rate: 1.3 });
        floatText(this.pos.clone().setY(2.2), '封印！', '#ffd84a', 30); return super.die(new THREE.Vector2(0, 1), {});
      }
      // 封印圈附近会把尸体往里吸一点
      for (const S of SEAL.list) { const dx = S.x - this.pos.x, dz = S.z - this.pos.z, d = Math.hypot(dx, dz); if (d < S.r + 1.6) { this.vel.x += dx / d * dt * 6; this.vel.z += dz / d * dt * 6; } }
      if (this.downT <= 0) { this.hp = Math.round(this.maxHp * (this.T.revHp || 0.5)); this.setState('loco'); this.cd = 0.8; SEAL.revived++; burst(this.pos.clone().setY(1), 0x7dff9a, 30, 4); Foley.at('growl', this.pos, { vol: 0.6 }); floatText(this.pos.clone().setY(2.2), '又爬起来了！', '#7dff9a', 24); }
    }
  };
}
Object.assign(ETYPES, {
  zomb: { name: '不死打手', hp: 85, dmg: 10, spd: 3.0, radius: 0.42, scale: 1, beast: 1, rig: 'thug', tint: [0.6, 1.0, 0.65], kb: 0.9, downT: 3.2 },
  hound9: { name: '不死犬 · 狗符', hp: 950, dmg: 20, spd: 3.3, radius: 0.95, scale: 1.25, beast: 1, poise: 1, elite: 1, downT: 4.5, revHp: 0.45, pushK: 0.75, dieMsg: '不死犬被封印了！<small>狗符的光暗了下去</small>' },
});
class Zombie extends Undying(SkinBoss) {
  think(dt) {
    if (this.state === 'down9') return super.think(dt);
    if (this.state !== 'loco') return this.runAtk(dt);
    const d = this.chase(dt, 1.8, this.T.spd);
    if (this.cd > 0 || player.state === 'dead' || d > 2.4) return;
    if (Math.random() < 0.6) this.strike({ st: 'z1', D: 0.9, hit: 0.48, clip: 'hook', lunge: 2.5, dmg: 10, tele: { shape: 'sector', r: 2.3, arc: 0.8, col: 'amber' } });
    else this.strike({ st: 'z2', D: 1.0, hit: 0.5, clip: 'jab', lunge: 3, dmg: 9, tele: { shape: 'sector', r: 2.3, arc: 0.6, col: 'amber' }, next: () => this.strike({ st: 'z3', D: 0.8, hit: 0.4, clip: 'hook', lunge: 2, dmg: 9, tele: { shape: 'sector', r: 2.3, arc: 0.8, col: 'amber' } }) });
    this.cd = rand(1.4, 2.2);
  }
  pose(dt, v) {
    const sk = this.rig.sk;
    if (sk && sk.mixer && this.state === 'down9') { skDown(sk, false, Math.min(this.t, 1.0), 2.1, true); sk.update(dt); return; }
    super.pose(dt, v);
  }
}
BEAST_CLS.zomb = Zombie;
class HoundDog extends Undying(Lion) {
  build() {
    super.build(); const t = new THREE.Color(0.45, 0.55, 0.45); this.rig.mats.forEach(m => { if (m.color) m.color.multiply(t); if (m.emissive && m !== this.eyeM) m.emissive.setRGB(0.02, 0.06, 0.03); });
    this.rig.root.scale.setScalar(this.T.scale / 1.6);
  }
  pose(dt, v) {
    if (this.state === 'down9') { this.body.rotation.z = lerp(this.body.rotation.z, Math.PI / 2 * 0.9, 1 - Math.exp(-dt * 8)); this.body.position.y = lerp(this.body.position.y, -0.6, 1 - Math.exp(-dt * 8)); this.eyeM.color.setRGB(0.3, 1.5, 0.5); return; }
    super.pose(dt, v); this.eyeM.color.setRGB(0.4, 3, 0.8);
  }
}
BEAST_CLS.hound9 = HoundDog;
function graveScript(dt) {
  updateSeals(dt);
  const alive = enemies.filter(e => !e.dead).length;
  if (SEAL.stage === 0 && SEAL.sealed >= 3) { SEAL.stage = 1; banner('墓地里爬出了更多不死者！', 2); [[-9, -9], [9, -9], [0, -11], [-11, 2]].forEach(([x, z]) => { const e = spawnAt('zomb', GY.x + x, GY.z + z); e.cd = 1.5; burst(e.pos.clone().setY(0.3), 0x7dff9a, 20, 3); }); }
  else if (SEAL.stage === 1 && alive <= 1) { SEAL.stage = 2; Story.bark('narr', '（地底传来一声狗吠——）'); const h = spawnAt('hound9', GY.x, GY.z - 10); h.cd = 2; shock(h.pos.clone().setY(0.1), 0x7dff9a, 4); burst(h.pos.clone().setY(1), 0x7dff9a, 50, 6); Foley.at('roar', h.pos, { vol: 0.9 }); banner('不死犬 · 狗符！<small>它也会爬起来——倒地时用重击把它推进封印圈</small>', 2.6); [[-10, 6], [10, 6]].forEach(([x, z]) => { const e = spawnAt('zomb', GY.x + x, GY.z + z); e.cd = 2; }); }
}
// ================= 猪神殿：旋转热光眼，躲到柱子后面 =================
const PIG = { pillars: [], told: {}, beams: 0, blocked: 0 };
(function buildTemple() {
  const G = new THREE.Group(); G.position.set(PT.x, 0, PT.z); scene.add(G); AREA_GROUPS.ptemple = G;
  const R = PT.r;
  const ft = canvasTex(512, 512, (g, W) => { const n = 8, s = W / n; for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) { const v = 70 + ((r * 7 + c * 13) % 5) * 8; g.fillStyle = `rgb(${v + 20},${v},${v - 20})`; g.fillRect(c * s + 2, r * s + 2, s - 4, s - 4); } }, [3, 3]);
  const fl = mesh(new THREE.CircleGeometry(R + 1, 64), M(0xffffff, { map: ft }), 0, 0.002, 0, G, false); fl.rotation.x = -Math.PI / 2; fl.receiveShadow = true;
  const st = M(0x9a7a5a, { roughness: 0.9 }), gold = M(0xd8a01a, { metalness: 0.7, roughness: 0.35 });
  mesh(new THREE.CylinderGeometry(R + 1.5, R + 1.5, 9, 40, 1, true), M(0x5a3a28, { side: THREE.DoubleSide }), 0, 4.5, 0, G, false);
  for (let i = 0; i < 16; i++) { const a = i / 16 * TAU; box(1.2, 9, 0.6, st, Math.sin(a) * (R + 1.2), 4.5, Math.cos(a) * (R + 1.2), G).rotation.y = a; }
  // 中央猪神像台座
  mesh(new THREE.CylinderGeometry(2.4, 2.8, 1.2, 24), st, 0, 0.6, 0, G); mesh(new THREE.TorusGeometry(2.45, 0.08, 6, 32), gold, 0, 1.2, 0, G, false).rotation.x = Math.PI / 2;
  for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; mesh(new THREE.SphereGeometry(0.12, 8, 6), glowMat(3, 1.2, 0.3), Math.sin(a) * (R + 0.4), 3, Math.cos(a) * (R + 0.4), G, false); }
  lightPool(0, 0, 10, new THREE.Color(0.3, 0.15, 0.06), G);
  BATCH.push(Object.assign(staticBatch([G], new Set()), { cx: PT.x, cz: PT.z, r: 120 }));
  BATCH.push({ group: G, cx: PT.x, cz: PT.z, r: 120 });
  // 六根柱子：挡热光（可被打坏）
  for (let i = 0; i < 6; i++) {
    const a = i / 6 * TAU + Math.PI / 6, r = 7, x = PT.x + Math.sin(a) * r, z = PT.z + Math.cos(a) * r;
    const g = new THREE.Group(); mesh(new THREE.CylinderGeometry(0.62, 0.7, 5.5, 14), st, 0, 2.75, 0, g); box(1.6, 0.4, 1.6, st, 0, 5.6, 0, g); box(1.5, 0.3, 1.5, st, 0, 0.15, 0, g); mesh(new THREE.TorusGeometry(0.66, 0.06, 6, 18), gold, 0, 4.6, 0, g, false).rotation.x = Math.PI / 2;
    const f = addFurn('ptemple', g, x, z, 0.62, 0.62, 5.5, 'rack', 0, { hp: 4, pillar: 1 }); f.pig = 1; PIG.pillars.push(f);
  }
})();
FURN_SND.rack = FURN_SND.rack || 'shelf';
AREA_DEF.ptemple = () => ({ cx: PT.x, cz: PT.z, hx: PT.r, hz: PT.r, round: PT.r, room: false, sun: 0.7, sunC: 0xffb070, hemi: [0x8a6a4a, 0x2a1a10, 1.25], fog: [0x1a100a, 28, 100], night: true, occl: 1, ep4: 1 });
function templeWeapons() { [[-3, 9], [3, 9]].forEach(([x, z], i) => spawnWeapon([0, 3][i], PT.x + x, PT.z + z)); }
// 猪神像：不会动；平时刀枪不入，每次热光扫完会“过热”几秒（背后发红）可以猛打
Object.assign(ETYPES, { pigIdol: { name: '猪神像 · 猪符', hp: 1600, dmg: 25, spd: 0, radius: 1.6, scale: 1, beast: 1, elite: 1, dieMsg: '猪神像裂开了！<small>猪符从神像的额头掉了出来</small>' } });
class PigIdol extends Beast {
  build() {
    const R = this.rig.root, st = this.mat(0xb08a5a, { roughness: 0.8 }), dk = this.mat(0x7a5a3a), gold = this.mat(0xd8a01a, { metalness: 0.7, roughness: 0.35 });
    const g = this.body = new THREE.Group(); g.position.y = 1.2; R.add(g);
    mesh(new THREE.SphereGeometry(1.25, 20, 14), st, 0, 1.3, 0, g).scale.set(1.1, 1, 1.25);
    const hd = this.head = new THREE.Group(); hd.position.set(0, 2.5, 0.9); g.add(hd);
    mesh(new THREE.SphereGeometry(0.85, 18, 12), st, 0, 0, 0, hd);
    mesh(new THREE.CylinderGeometry(0.38, 0.42, 0.4, 16), dk, 0, -0.15, 0.82, hd).rotation.x = Math.PI / 2;
    [-1, 1].forEach(k => { mesh(new THREE.SphereGeometry(0.07, 6, 4), M(0x2a1a10), k * 0.13, -0.15, 1.03, hd, false); const ear = mesh(new THREE.ConeGeometry(0.28, 0.5, 4), dk, k * 0.6, 0.6, 0, hd); ear.rotation.z = -k * 0.6; });
    this.eyeM = glowMat(3, 0.6, 0.1); this.eyes = [-1, 1].map(k => mesh(new THREE.SphereGeometry(0.13, 10, 8), this.eyeM, k * 0.32, 0.22, 0.72, hd, false));
    mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.06, 12), gold, 0, 0.55, 0.62, hd, false).rotation.x = 1.2; // 额头上的猪符
    [-1, 1].forEach(k => { mesh(new THREE.SphereGeometry(0.4, 10, 8), st, k * 0.95, 0.4, 0.9, g); });
    this.ventM = this.mat(0x3a1a0a, { emissive: 0x000000 }); mesh(new THREE.SphereGeometry(0.7, 14, 10), this.ventM, 0, 1.5, -1.2, g).scale.set(1, 1, 0.4);
    this.beamM = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.35, 1), new THREE.MeshBasicMaterial({ color: 0xff4a1a, transparent: true, opacity: 0.85, toneMapped: false })); this.beamM.geometry.translate(0, 0, 0.5); this.beamM.visible = false; scene.add(this.beamM);
    this.kbScale = 0; this.hbY = 5; this.ang = 0;
  }
  dmgMul() { if (this.state === 'vent') return 1.6; if (now - (this.armT || -9) > 1.5) { this.armT = now; floatText(this.pos.clone().setY(4.5), '刀枪不入！等它过热', '#ffb070', 22); Foley.at('clangS', this.pos, { vol: 0.4, rate: 0.7 }); } return 0.12; }
  eyePos() { const p = this.pos; return new THREE.Vector3(p.x + Math.sin(this.ang) * 1.6, 3.9, p.z + Math.cos(this.ang) * 1.6); }
  think(dt) {
    const S = this.state; this.vel.set(0, 0, 0); this.pos.x = PT.x; this.pos.z = PT.z;
    this.ventM.emissive.setRGB(S === 'vent' ? 1.6 + Math.sin(now * 14) * 0.6 : 0, S === 'vent' ? 0.3 : 0, 0);
    if (!this.raged && this.hp < this.maxHp * 0.5) { this.raged = true; banner('猪神像 · 暴怒！<small>双眼各射一道热光，方向相反——柱子会被烧坏，别总躲同一根</small>', 2.6); Foley.at('roar', this.pos, { vol: 0.8, rate: 0.7 }); }
    if (S === 'loco') {
      this.yaw += angDiff(this.yaw, Math.atan2(player.pos.x - this.pos.x, player.pos.z - this.pos.z)) * (1 - Math.exp(-dt * 2));
      if (this.cd > 0 || player.state === 'dead') return;
      if (Math.random() < 0.65 || this.lastBlast) { this.lastBlast = false; return this.startSweep(); }
      this.lastBlast = true; return this.blast();
    }
    if (S === 'sweepW') { if (this.t > 1.3) { this.setState('sweep'); this.hitT = -9; Foley.at('laser', this.pos, { vol: 0.8, rate: 0.7 }); Foley.at('beam', this.pos, { vol: 0.7, rate: 0.8 }); } return; }
    if (S === 'sweep') return this.runSweep(dt);
    if (S === 'vent') { if (this.t > 3.6) { this.setState('loco'); this.cd = 1.0; } else if (Math.random() < dt * 20) burst(this.pos.clone().setY(2.7).add(new THREE.Vector3(Math.sin(this.yaw + Math.PI) * 1.3, 0, Math.cos(this.yaw + Math.PI) * 1.3)), 0xff6a1a, 1, 2); return; }
    if (S === 'blast') { if (this.t > 2.4) { this.setState('loco'); this.cd = 1.2; } return; }
  }
  startSweep() {
    this.setState('sweepW'); this.a0 = this.yaw; this.dir = Math.random() < 0.5 ? 1 : -1; this.span = this.raged ? 3.4 : 4.4; this.ang = this.a0;
    const n = this.raged ? 2 : 1;
    for (let i = 0; i < n; i++) Tele.add({ shape: 'lane', x: this.pos.x, z: this.pos.z, yaw: this.a0 + i * Math.PI, w: 0.8, len: PT.r, wind: 1.3, lock: 1, col: 'red', src: this, onFire: () => { } });
    this.eyeM.color.setRGB(6, 1.2, 0.2); Foley.at('beam', this.pos, { vol: 0.4, rate: 1.4 });
    floatText(this.pos.clone().setY(5), this.dir > 0 ? '热光眼 · 逆时针' : '热光眼 · 顺时针', '#ff6a3a', 26);
    if (!PIG.told.sweep) { PIG.told.sweep = 1; banner('热光眼扫射！<small>躲到柱子后面、跳过光线、或者在光线扫到时翻滚闪避</small>', 2.8); }
  }
  runSweep(dt) {
    const dur = this.raged ? 2.6 : 3.4, k = Math.min(1, this.t / dur), e = k < 0.15 ? k * k / 0.3 : k - 0.075; this.ang = this.a0 + this.dir * this.span * Math.min(1, e / 0.925); this.yaw = this.ang;
    const beams = this.raged ? [this.ang, this.ang + Math.PI] : [this.ang];
    this.beamM.visible = true; (this.beam2 = this.beam2 || (() => { const b = this.beamM.clone(); scene.add(b); return b; })()).visible = beams.length > 1;
    beams.forEach((A, bi) => {
      const sx = Math.sin(A), cz = Math.cos(A), ox = this.pos.x + sx * 1.6, oz = this.pos.z + cz * 1.6; let L = PT.r + 1, hitF = null;
      for (const f of PIG.pillars) { if (f.broken) continue; const dx = f.x - ox, dz = f.z - oz, t = dx * sx + dz * cz, perp = Math.abs(dx * cz - dz * sx); if (t > 0 && perp < 0.68 && t < L) { L = t; hitF = f; } }
      const M2 = bi ? this.beam2 : this.beamM; M2.position.set(ox, 1.0, oz); M2.rotation.set(0, A, 0); M2.scale.set(1 + Math.sin(now * 40) * 0.2, 1 + Math.sin(now * 40) * 0.2, L);
      if (hitF) { hitF.heat = (hitF.heat || 0) + dt; if (Math.random() < dt * 30) burst(new THREE.Vector3(ox + sx * L, 1, oz + cz * L), 0xff8a3a, 2, 3); if (hitF.heat > 2.0) { breakFurn(hitF, new THREE.Vector2(sx, cz), 'boss'); Foley.at('stone', hitF.g.position, { vol: 0.8 }); floatText(new THREE.Vector3(hitF.x, 3, hitF.z), '柱子被烧塌了！', '#ff8a3a', 22); } }
      else if (Math.random() < dt * 20) burst(new THREE.Vector3(ox + sx * L, 0.3, oz + cz * L), 0xff6a1a, 2, 2);
      const p = player.pos, dx = p.x - ox, dz = p.z - oz, t = dx * sx + dz * cz, perp = Math.abs(dx * cz - dz * sx);
      if (t > 0 && t < L && perp < 0.55 && now - this.hitT > 0.7) {
        if (p.y > 0.9) { if (!this.jumpTold) { this.jumpTold = 1; floatText(p.clone().setY(2.4), '跳过去了！', '#9fe', 24); } }
        else { this.hitT = now; const h0 = player.hp; playerTakeHit({ pos: new THREE.Vector3(ox, 0, oz), parried() { } }, this.T.dmg, { unblockable: 1 }); if (player.hp < h0) { PIG.beams++; burst(p.clone().setY(1), 0xff6a1a, 20, 4); } }
      } else if (t > L && perp < 0.6 && now - (this.blkT || -9) > 1.2) { this.blkT = now; PIG.blocked++; }
      for (const en of enemies) { if (en === this || en.dead) continue; const ex = en.pos.x - ox, ez = en.pos.z - oz, et = ex * sx + ez * cz, ep = Math.abs(ex * cz - ez * sx); if (et > 0 && et < L && ep < 0.6 && !(en._pigT > now)) { en._pigT = now + 0.8; en.takeHit(45, new THREE.Vector2(cz, -sx), { kb: 6, kd: 1 }, 1, false); floatText(en.pos.clone().setY(2.2), '被热光烧到！', '#ff6a3a', 20); } }
    });
    if (k >= 1) { this.beamM.visible = false; if (this.beam2) this.beam2.visible = false; this.eyeM.color.setRGB(0.6, 0.2, 0.1); this.setState('vent'); Foley.at('wind', this.pos, { vol: 0.6, rate: 0.6 }); floatText(this.pos.clone().setY(4.6), '过热！快打！', '#ffd84a', 28); if (!PIG.told.vent) { PIG.told.vent = 1; tip('神像过热（背后发红）——现在伤害 ×1.6！', 2.2); } }
  }
  blast() {
    this.setState('blast'); this.eyeM.color.setRGB(5, 1, 0.2);
    for (let i = 0; i < (this.raged ? 4 : 3); i++) Story.timers.push({ t: i * 0.5, f: () => { if (this.dead || AREA.name !== 'ptemple') return; const x = player.pos.x + player.vel.x * 0.4, z = player.pos.z + player.vel.z * 0.4; Tele.add({ shape: 'circle', x, z, r: 1.8, wind: 0.95, col: 'red', dmg: 16, src: this, onFire: () => { burst(new THREE.Vector3(x, 0.4, z), 0xff6a1a, 26, 5); shock(new THREE.Vector3(x, 0.08, z), 0xff6a1a, 2); Foley.at('explode', new THREE.Vector3(x, 0, z), { vol: 0.5 }); } }); } });
  }
  pose() { this.head.rotation.x = this.state === 'sweep' ? 0.25 : 0; this.body.rotation.z = this.wob * Math.sin(now * 30) * 0.02; }
  deathAnim(dt) {
    this.beamM.visible = false; if (this.beam2) this.beam2.visible = false;
    if (!this.cr) { this.cr = 1; Foley.at('stone', this.pos, { vol: 1 }); Foley.at('quake', this.pos, { vol: 0.8 }); shake = 0.6; }
    if (this.t < 1.6 && Math.random() < dt * 30) burst(this.pos.clone().setY(rand(1, 4)).add(new THREE.Vector3(rand(-1.2, 1.2), 0, rand(-1.2, 1.2))), 0xb08a5a, 4, 4);
    this.body.position.y = 1.2 - Math.min(1.4, this.t * 0.8); this.body.rotation.z = Math.min(0.35, this.t * 0.25);
  }
  parried() { }
  stun() { }
}
BEAST_CLS.pigIdol = PigIdol;
function templeScript(dt) {
  const idol = enemies.find(e => e.type === 'pigIdol'); if (!idol) return;
  if (!PIG.st && idol.hp < idol.maxHp * 0.7) { PIG.st = 1; banner('神殿守卫！', 1.8); [[-9, 6], [9, 6]].forEach(([x, z]) => { const e = spawnAt('zomb', PT.x + x, PT.z + z); e.cd = 1.5; }); }
  else if (PIG.st === 1 && idol.hp < idol.maxHp * 0.35) { PIG.st = 2; [[-9, -6], [9, -6], [0, 10]].forEach(([x, z]) => { const e = spawnAt('ninja', PT.x + x, PT.z + z); e.cd = 1.5; }); }
}
// ================= 天界祭坛：圣主 =================
const FINAL = { allRunes: false, told: {}, qte: null, qteN: 0, phase: 0, meteors: 0 };
(function buildAltar() {
  const G = new THREE.Group(); G.position.set(ALT.x, 0, ALT.z); scene.add(G); AREA_GROUPS.altar = G;
  const R = ALT.r;
  const ft = canvasTex(512, 512, (g, W) => { g.fillStyle = '#2a1a1e'; g.fillRect(0, 0, W, W); g.strokeStyle = '#d8a01a'; g.lineWidth = 6; [250, 200, 120].forEach(r => { g.beginPath(); g.arc(W / 2, W / 2, r, 0, TAU); g.stroke(); }); g.lineWidth = 3; for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; g.beginPath(); g.moveTo(W / 2 + Math.cos(a) * 120, W / 2 + Math.sin(a) * 120); g.lineTo(W / 2 + Math.cos(a) * 250, W / 2 + Math.sin(a) * 250); g.stroke(); } g.fillStyle = '#d8a01a'; g.font = 'bold 120px serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('封', W / 2, W / 2); });
  const fl = mesh(new THREE.CircleGeometry(R + 0.5, 64), M(0xffffff, { map: ft }), 0, 0.002, 0, G, false); fl.rotation.x = -Math.PI / 2; fl.receiveShadow = true;
  mesh(new THREE.CylinderGeometry(R + 0.5, R - 3, 4, 48, 1, true), M(0x3a2a2a, { side: THREE.DoubleSide }), 0, -2, 0, G, false);
  mesh(new THREE.TorusGeometry(R + 0.5, 0.12, 6, 64), glowMat(3, 1.6, 0.3), 0, 0.05, 0, G, false).rotation.x = Math.PI / 2;
  // 十二生肖石台：终战时亮起
  FINAL.peds = RUNES.map((Rn, i) => { const a = i / 12 * TAU, x = Math.sin(a) * (R - 0.6), z = Math.cos(a) * (R - 0.6); box(0.8, 1, 0.8, M(0x5a4a4a), x, 0.5, z, G); const gm = new THREE.MeshBasicMaterial({ color: new THREE.Color(Rn.color).multiplyScalar(0.25), toneMapped: false }); const orb = mesh(new THREE.SphereGeometry(0.25, 12, 8), gm, x, 1.35, z, G, false); return { orb, gm, col: new THREE.Color(Rn.color) }; });
  // 云海与天上的裂缝
  for (let i = 0; i < 50; i++) { const a = rand(0, TAU), r = rand(R + 6, R + 50), s = rand(3, 9); const c = mesh(new THREE.SphereGeometry(s, 10, 8), M(0x4a2a3a, { emissive: 0x1a060c }), Math.cos(a) * r, rand(-14, -6), Math.sin(a) * r, G, false); c.scale.y = 0.35; }
  for (let i = 0; i < 8; i++) { const b = box(0.5, rand(10, 22), 0.5, glowMat(3, 0.8, 0.3), rand(-30, 30), rand(20, 30), -R - rand(15, 30), G); b.rotation.z = rand(-0.8, 0.8); }
  BATCH.push(Object.assign(staticBatch([G], new Set(FINAL.peds.map(p => p.orb))), { cx: ALT.x, cz: ALT.z, r: 140 }));
  BATCH.push({ group: G, cx: ALT.x, cz: ALT.z, r: 140 });
})();
AREA_DEF.altar = () => ({ cx: ALT.x, cz: ALT.z, hx: ALT.r, hz: ALT.r, round: ALT.r, room: false, sun: 0.85, sunC: 0xff9a7a, hemi: [0x8a4a5a, 0x1a0810, 1.3], fog: [0x1a0810, 34, 140], night: true, occl: 1, ep4: 1 });
// 十二符之力：终战第二阶段起，所有护身符同时生效
{ const _has = Runes.has.bind(Runes); Runes.has = function (k) { return (FINAL.allRunes && AREA.name === 'altar' && RUNE[k]) ? true : _has(k); }; }
Object.assign(ETYPES, {
  shendu: { name: '圣主', hp: 3200, dmg: 24, spd: 0, radius: 1.3, scale: 1, beast: 1, elite: 1, hover: 1, dieMsg: '圣主被封印了！' },
  skhan: Object.assign({}, ETYPES.khan, { base: 'khan', name: '暗影忍者', hp: 50, dmg: 10, spd: 4.8, windup: 0.36, scale: 0.97, tint: [0.35, 0.3, 0.5] }),
});
WHO.shendu = { n: '圣主', c: '#ff5a3a', e: () => enemies.find(e => e.type === 'shendu') || player };
class ShenduDragon extends Beast {
  build() {
    const R = this.rig.root, sc = this.mat(0x2a5a32, { roughness: 0.55, emissive: 0x06140a }), bel = this.mat(0xd8b070, { roughness: 0.6 }), red = this.mat(0xb02a1a, { roughness: 0.5 }), hornM = this.mat(0xe8d8b0, { roughness: 0.4 });
    const hd = this.head = new THREE.Group(); R.add(hd);
    mesh(new THREE.SphereGeometry(0.85, 16, 12), sc, 0, 0.15, -0.2, hd).scale.set(1, 0.85, 1.1);
    const sn = box(0.95, 0.5, 1.5, sc, 0, 0.05, 0.9, hd); sn.geometry.translate(0, 0, 0);
    box(0.8, 0.12, 1.3, bel, 0, -0.22, 0.95, hd);
    const jaw = this.jaw = new THREE.Group(); jaw.position.set(0, -0.25, 0.25); hd.add(jaw); box(0.85, 0.22, 1.4, sc, 0, -0.1, 0.65, jaw); box(0.7, 0.06, 1.2, red, 0, 0.02, 0.65, jaw);
    for (let k = -3; k <= 3; k++) { mesh(new THREE.ConeGeometry(0.05, 0.18, 4), hornM, k * 0.12, -0.25, 1.55, hd, false).rotation.x = Math.PI; mesh(new THREE.ConeGeometry(0.05, 0.16, 4), hornM, k * 0.11, 0.08, 1.3, jaw, false); }
    this.eyeM = glowMat(4, 1.2, 0.2); [-1, 1].forEach(k => { mesh(new THREE.SphereGeometry(0.13, 10, 8), this.eyeM, k * 0.42, 0.35, 0.55, hd, false); box(0.3, 0.1, 0.4, sc, k * 0.42, 0.5, 0.5, hd).rotation.z = k * 0.3; });
    [-1, 1].forEach(k => { const h = new THREE.Group(); h.position.set(k * 0.4, 0.7, -0.4); h.rotation.set(-0.8, 0, k * 0.35); hd.add(h); mesh(new THREE.ConeGeometry(0.12, 1.4, 8), hornM, 0, 0.7, 0, h); const b = mesh(new THREE.ConeGeometry(0.07, 0.6, 6), hornM, 0, 0.6, 0.25, h); b.rotation.x = 0.9; });
    [-1, 1].forEach(k => { const pts = []; for (let i = 0; i <= 8; i++) pts.push(new THREE.Vector3(k * (0.45 + i * 0.18), -0.05 - Math.sin(i * 0.6) * 0.25, 1.5 - i * 0.1)); mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 12, 0.025, 4), red, 0, 0, 0, hd, false); });
    for (let i = 0; i < 7; i++) { const s = mesh(new THREE.ConeGeometry(0.12, 0.6, 5), red, 0, 0.7 - i * 0.05, -0.3 - i * 0.22, hd, false); s.rotation.x = -0.9; }
    // 身体：一节节跟着头走
    this.chain = new THREE.Group(); scene.add(this.chain); this.segs = [];
    const N = 28; for (let i = 0; i < N; i++) { const r = 0.82 - i / N * 0.6, g = new THREE.Group(); this.chain.add(g); mesh(new THREE.SphereGeometry(r, 12, 9), sc, 0, 0, 0, g).scale.set(1, 0.92, 1.25); mesh(new THREE.SphereGeometry(r * 0.8, 10, 6), bel, 0, -r * 0.35, 0, g, false).scale.set(0.9, 0.5, 1.2); if (i % 2 === 0) { const sp = mesh(new THREE.ConeGeometry(r * 0.3, r * 1.1, 5), red, 0, r * 0.95, 0, g, false); sp.rotation.x = -0.4; } if (i === 4 || i === 15) [-1, 1].forEach(k => { const L = mesh(new THREE.CylinderGeometry(0.12, 0.08, 1.0, 6), sc, k * r * 1.1, -r * 0.6, 0, g); L.rotation.z = k * 0.8; }); this.segs.push({ g, r, p: new THREE.Vector3() }); }
    this.H = new THREE.Vector3(ALT.x, 6, ALT.z - ALT.r - 4); this.trail = []; this.segs.forEach((S, i) => S.p.set(this.H.x, this.H.y, this.H.z - i * 0.9));
    this.fa = 0; this.kbScale = 0; this.hbY = 0.8; this.st0 = 'fly'; this.state = 'fly';
  }
  goal(x, y, z, k, dt) { const d = new THREE.Vector3(x - this.H.x, y - this.H.y, z - this.H.z); const L = d.length(); if (L > 0.01) { const mv = Math.min(L, k * dt); this.H.addScaledVector(d, mv / L); } return L; }
  update(dt) {
    this.t += dt; this.cd -= dt; this.wob = Math.max(0, this.wob - dt * 4);
    if (this.hitFl > 0) { this.hitFl -= dt; this.flash(this.hitFl > 0 ? 0.5 : 0); }
    const H0 = this.H.clone();
    if (this.dead) this.deathAnim(dt); else this.think(dt);
    this.layout(dt, H0);
    this.pos.set(this.H.x, this.H.y < 2.6 ? 0 : this.H.y, this.H.z);
    if (!this.dead) { const s = toScreen(this.H.clone().setY(this.H.y + 1.6)); this.hb.style.display = s.vis ? 'block' : 'none'; this.hb.style.left = s.x + 'px'; this.hb.style.top = s.y + 'px'; this.hb.querySelector('i').style.width = (this.hp / this.maxHp * 100) + '%'; }
  }
  idle(dt) { const H0 = this.H.clone(); if (this.state === 'fly' || this.state === 'intro') this.flyAround(dt, 0.35); this.layout(dt, H0); this.pos.set(this.H.x, this.H.y < 2.6 ? 0 : this.H.y, this.H.z); }
  layout(dt, H0) {
    const v = this.H.clone().sub(H0); if (v.lengthSq() > 1e-6) this.fwd = v.normalize(); const f = this.fwd || new THREE.Vector3(0, 0, 1);
    const look = this.lookAt || null; const dir = look ? look.clone().sub(this.H).normalize() : f;
    this.rig.root.position.copy(this.H); this.rig.root.rotation.set(0, 0, 0); this.rig.root.lookAt(this.H.clone().add(dir)); this.yaw = Math.atan2(dir.x, dir.z);
    this.jaw.rotation.x = this.mouth || (0.08 + Math.sin(now * 2) * 0.04);
    let prev = this.H; const sp = 0.95;
    this.segs.forEach((S, i) => { const d = S.p.clone().sub(prev); const L = d.length() || 1; if (L > sp) S.p.copy(prev).addScaledVector(d, sp / L); S.p.y = Math.max(S.p.y - dt * 0.6, S.r * 0.8); if (i === 0) S.p.y = Math.max(S.p.y, this.H.y - 0.5); S.g.position.copy(S.p); S.g.lookAt(prev); S.g.position.y += Math.sin(now * 3 - i * 0.4) * 0.05; prev = S.p; });
  }
  flyAround(dt, w = 0.5) { this.fa += dt * w; const r = ALT.r + 4.5; this.goal(ALT.x + Math.sin(this.fa) * r, 6 + Math.sin(this.fa * 2) * 1.2, ALT.z + Math.cos(this.fa) * r, 9, dt); this.lookAt = null; }
  dmgMul() { return this.state === 'tired' || this.state === 'stuck' ? 1.25 : 1; }
  takeHit(dmg, dir, m, kbMul, counter) {
    if (this.dead || this.state === 'qte' || this.state === 'intro') return;
    const floor = this.maxHp * 0.06;
    if (this.hp - dmg * this.dmgMul() <= floor) { this.hp = floor; this.hitFl = 0.12; return this.startQTE(); }
    super.takeHit(dmg, dir, m, kbMul, counter);
  }
  think(dt) {
    const S = this.state, p = player, hp = this.hp / this.maxHp;
    if (FINAL.phase === 0 && hp < 0.66) { FINAL.phase = 1; this.phase2(); }
    if (FINAL.phase === 1 && hp < 0.33) { FINAL.phase = 2; banner('圣主 · 狂怒！<small>喷火时会同时降下火雨——它累了低头时全力进攻</small>', 2.6); Story.bark('shendu', '你以为这样就能封印我？！'); Foley.at('roar', this.H, { vol: 1, rate: 0.7 }); }
    const fast = FINAL.phase >= 2 ? 1.3 : 1;
    if (S === 'fly' || S === 'intro') { this.flyAround(dt, 0.45 * fast); this.mouth = 0; if (S === 'intro' || this.cd > 0 || p.state === 'dead') return; const r = Math.random(); if (r < 0.42) return this.startBreath(); if (r < 0.75) return this.startDive(); return this.startMeteor(); }
    if (S === 'bMove') { const a = Math.atan2(p.pos.x - ALT.x, p.pos.z - ALT.z), tx = ALT.x + Math.sin(a) * (ALT.r - 1.2), tz = ALT.z + Math.cos(a) * (ALT.r - 1.2); this.lookAt = p.pos.clone().setY(1); if (this.goal(tx, 2.2, tz, 14 * fast, dt) < 0.3 || this.t > 2) this.breathW(); return; }
    if (S === 'bWind') { this.lookAt = p.pos.clone().setY(1); this.mouth = Math.min(0.6, this.t); if (this.t > this.wind + 0.6) { this.setState('tired'); this.mouth = 0.15; } else if (this.t > this.wind && Math.random() < dt * 60) { const dir = new THREE.Vector3(Math.sin(this.bYaw), 0, Math.cos(this.bYaw)); const q = this.H.clone().addScaledVector(dir, 1.6); for (let i = 0; i < 3; i++) burst(q.clone().addScaledVector(dir, rand(0, 8)).add(new THREE.Vector3(rand(-1, 1), rand(-1.2, 0), rand(-1, 1))), Math.random() < 0.5 ? 0xff6a1a : 0xffd84a, 2, 4); } return; }
    if (S === 'tired' || S === 'stuck') { this.mouth = 0.2; this.H.y = lerp(this.H.y, S === 'stuck' ? 0.9 : 1.4, 1 - Math.exp(-dt * 4)); this.eyeM.color.setRGB(1, 0.4, 0.1); if (Math.random() < dt * 4) burst(this.H.clone().setY(this.H.y + 1), 0xfff27a, 1, 1.5); if (this.t > (S === 'stuck' ? 2.4 : 2.6) / fast) { this.setState('fly'); this.cd = rand(1.4, 2.2) / fast; this.eyeM.color.setRGB(4, 1.2, 0.2); } return; }
    if (S === 'dWind') { this.lookAt = this.dB.clone().setY(1); this.goal(this.dA.x, 7, this.dA.z, 16, dt); if (this.t > 1.35) { this.setState('dive'); this.hitP = false; Foley.at('roar', this.H, { vol: 0.8, rate: 1.1 }); Foley.at('wind', this.H, { vol: 0.7 }); } return; }
    if (S === 'dive') {
      this.lookAt = null; const L = this.goal(this.dB.x, this.t < 0.25 ? 3 : 1.1, this.dB.z, 26 * fast, dt);
      if (!this.hitP && p.pos.y < 2 && [this.H, ...this.segs.slice(0, 10).map(s => s.p)].some(q => q.y < 2.2 && Math.hypot(q.x - p.pos.x, q.z - p.pos.z) < 1.5)) { this.hitP = true; playerTakeHit({ pos: this.H.clone(), parried() { } }, 24, { kd: 1, unblockable: 1 }); }
      for (const e of enemies) if (e !== this && !e.dead && Math.hypot(this.H.x - e.pos.x, this.H.z - e.pos.z) < 1.6) e.takeHit(60, new THREE.Vector2(this.fwd ? this.fwd.x : 0, this.fwd ? this.fwd.z : 1), { kb: 10, kd: 1 }, 1, false);
      if (L < 0.4) { this.setState('stuck'); shock(this.H.clone().setY(0.1), 0xff6a1a, 4); burst(this.H.clone(), 0x8a6a5a, 40, 6); Foley.at('quake', this.H, { vol: 1 }); Foley.at('stone', this.H, { vol: 0.8 }); shake = 0.6; floatText(this.H.clone().setY(3), '一头撞在祭坛上！快打它的头！', '#ffd84a', 26); }
      return;
    }
    if (S === 'meteor') { this.flyAround(dt, 0.25); this.mouth = 0.5; if (this.t > 2.6) { this.setState('fly'); this.cd = 1.2 / fast; } return; }
    if (S === 'qte') { this.lookAt = p.pos.clone().setY(1.5); this.goal(ALT.x, 3, ALT.z - ALT.r + 3, 6, dt); this.mouth = 0.4 + Math.sin(now * 6) * 0.1; return; }
  }
  startBreath() { this.setState('bMove'); Foley.at('growl', this.H, { vol: 0.7, rate: 0.7 }); if (!FINAL.told.breath) { FINAL.told.breath = 1; tip('圣主俯冲过来要喷火——躲开红色扇形；喷完它会低头喘气，那是进攻的机会', 2.8); } }
  breathW() {
    this.setState('bWind'); this.wind = FINAL.phase >= 2 ? 0.9 : 1.15; this.bYaw = Math.atan2(player.pos.x - this.H.x, player.pos.z - this.H.z);
    Tele.add({ shape: 'sector', x: this.H.x, z: this.H.z, yaw: this.bYaw, r: 10, arc: 0.45, wind: this.wind, lock: 1, col: 'red', dmg: this.T.dmg, src: this, onFire: () => { Foley.at('explode', this.H, { vol: 0.7, rate: 0.7 }); Foley.at('wind', this.H, { vol: 0.8, rate: 0.6 }); shake = 0.35; } });
    Foley.at('roar', this.H, { vol: 0.9 }); if (FINAL.phase >= 2) this.rain(4);
  }
  startDive() {
    const a = rand(0, TAU); this.dA = new THREE.Vector3(ALT.x + Math.sin(a) * (ALT.r + 2), 0, ALT.z + Math.cos(a) * (ALT.r + 2)); const ta = Math.atan2(player.pos.x - this.dA.x, player.pos.z - this.dA.z); this.dB = new THREE.Vector3(this.dA.x + Math.sin(ta) * (ALT.r * 2 + 1), 0, this.dA.z + Math.cos(ta) * (ALT.r * 2 + 1));
    const nb = new THREE.Vector3(ALT.x, 0, ALT.z).sub(this.dB); const nl = nb.length(); if (nl > ALT.r - 1.5) this.dB.add(nb.multiplyScalar((nl - (ALT.r - 1.5)) / nl));
    this.setState('dWind'); Tele.add({ shape: 'lane', x: this.dA.x, z: this.dA.z, yaw: ta, w: 2.8, len: this.dA.distanceTo(this.dB) + 1, wind: 1.35, lock: 1, col: 'red', src: this, onFire: () => { } });
    if (!FINAL.told.dive) { FINAL.told.dive = 1; tip('红色长条：圣主俯冲！闪开之后它会撞在地上——冲过去打头', 2.6); }
  }
  startMeteor() { this.setState('meteor'); Foley.at('roar', this.H, { vol: 0.8, rate: 0.85 }); this.rain(FINAL.phase >= 2 ? 7 : 5); if (!FINAL.told.met) { FINAL.told.met = 1; tip('火雨！看准红圈落点躲开', 2); } }
  rain(n) { for (let i = 0; i < n; i++) Story.timers.push({ t: 0.2 + i * 0.32, f: () => { if (this.dead || AREA.name !== 'altar') return; const near = i % 2 === 0, a = rand(0, TAU), r = rand(0, ALT.r - 1.5); const x = near ? player.pos.x + rand(-1, 1) : ALT.x + Math.sin(a) * r, z = near ? player.pos.z + rand(-1, 1) : ALT.z + Math.cos(a) * r; Tele.add({ shape: 'circle', x, z, r: 1.7, wind: 1.0, col: 'red', dmg: 16, src: this, onFire: () => { burst(new THREE.Vector3(x, 0.5, z), 0xff6a1a, 26, 5); shock(new THREE.Vector3(x, 0.08, z), 0xff6a1a, 2); Foley.at('explode', new THREE.Vector3(x, 0, z), { vol: 0.45 }); } }); FINAL.meteors++; } }); }
  phase2() {
    FINAL.allRunes = true; refreshChips && refreshChips();
    banner('十二符之力！<small>十二个护身符的力量同时觉醒——所有符文效果全部生效</small>', 3);
    Story.bark('uncleP', '成龙！十二个护身符都在你身上——用它们的力量！');
    FINAL.peds.forEach((P, i) => Story.timers.push({ t: i * 0.12, f: () => { P.gm.color.copy(P.col).multiplyScalar(3); burst(P.orb.getWorldPosition(new THREE.Vector3()), P.col.getHex(), 14, 3); Foley.at('magic', player.pos, { vol: 0.25, rate: 0.8 + i * 0.05 }); } }));
    burst(player.pos.clone().setY(1.2), 0xffd84a, 80, 6); shock(player.pos.clone().setY(0.1), 0xffd84a, 5); slowmo = Math.max(slowmo, 0.6);
    [[-6, -6], [6, -6], [0, 7]].forEach(([x, z]) => { const e = spawnAt('skhan', ALT.x + x, ALT.z + z); e.cd = 2; burst(e.pos.clone().setY(1), 0x3a2a5a, 24, 3); });
  }
  startQTE() { if (this.state === 'qte') return; Tele.list && Tele.list.slice().forEach(T => T.src === this && Tele.cancel(T)); this.setState('qte'); qteStart(this); }
  deathAnim(dt) {
    this.H.y += dt * 2.5; this.rig.root.position.copy(this.H); const k = Math.max(0.01, 1 - this.t / 2.2); this.rig.root.scale.setScalar(k); this.chain.scale.setScalar(1); this.segs.forEach((S, i) => { S.g.scale.setScalar(Math.max(0.01, 1 - Math.max(0, this.t - i * 0.05) / 1.6)); });
    if (Math.random() < dt * 40) burst(this.H.clone(), 0xffd84a, 3, 5);
    if (this.t > 2.6) { scene.remove(this.rig.root); scene.remove(this.chain); this.gone = true; }
  }
  parried() { } stun() { }
}
BEAST_CLS.shendu = ShenduDragon;
// ---------- 老爹的封印咒语：按提示键（QTE） ----------
document.head.insertAdjacentHTML('beforeend', `<style>#qte{position:fixed;left:50%;top:22%;transform:translateX(-50%);z-index:30;display:none;text-align:center;font-family:"Noto Sans SC",serif;color:#ffe8a0;pointer-events:none}#qte .ch{font-size:54px;letter-spacing:10px;text-shadow:0 0 18px #ff8a1a}#qte .ch b{color:#fff;text-shadow:0 0 24px #ffd84a}#qte .ch i{font-style:normal;opacity:.28}#qte .k{display:inline-block;margin-top:14px;width:84px;height:84px;line-height:84px;border-radius:16px;border:3px solid #ffd84a;font:bold 46px sans-serif;background:rgba(40,20,0,.75);box-shadow:0 0 30px rgba(255,200,60,.6)}#qte .bar{width:260px;height:8px;margin:12px auto 0;border-radius:4px;background:rgba(0,0,0,.5);overflow:hidden}#qte .bar i{display:block;height:100%;background:#ffd84a}#qte .pad{margin-top:14px;pointer-events:auto}#qte .pad span{display:inline-block;width:56px;height:56px;line-height:56px;margin:4px;border-radius:12px;border:2px solid rgba(255,216,74,.6);font:bold 26px sans-serif;background:rgba(30,15,0,.7);cursor:pointer}#qte .tip{font-size:15px;opacity:.85;margin-top:6px}</style>`);
document.body.insertAdjacentHTML('beforeend', '<div id="qte"><div class="tip">老爹的咒语 · 按提示键！</div><div class="ch"></div><div class="k"></div><div class="bar"><i></i></div><div class="pad"></div></div>');
const QTE_TXT = '妖魔鬼怪快离开', QTE_KEYS = ['W', 'A', 'S', 'D', 'J', 'K'];
function qteStart(boss) {
  FINAL.qteN++; enemies.forEach(e => { if (e !== boss && !e.dead) { burst(e.pos.clone().setY(1), 0xffd84a, 20, 3); e.takeHit(99999, new THREE.Vector2(0, 1), { kb: 1 }, 1, false); } });
  const seq = [...QTE_TXT].map(() => QTE_KEYS[(Math.random() * QTE_KEYS.length) | 0]);
  FINAL.qte = { boss, seq, i: 0, t: 0, per: FINAL.qteN > 1 ? 1.9 : 1.6, wait: 1.6 };
  banner('圣主虚弱了！<small>老爹开始念封印咒语——跟着提示按键，一个都不能错</small>', 2);
  Story.bark('uncleP', FINAL.qteN > 1 ? '再来一次！跟着我念！' : '就是现在！跟着我念——');
  Foley.at('gong', player.pos, { vol: 0.8 }); slowmo = 0;
  const pad = document.querySelector('#qte .pad'); pad.innerHTML = QTE_KEYS.map(k => `<span data-k="${k}">${k}</span>`).join('');
  pad.querySelectorAll('span').forEach(s => s.onpointerdown = (ev) => { ev.preventDefault(); ev.stopPropagation(); qteKey(s.dataset.k); });
  qteDraw();
}
function qteDraw() {
  const Q = FINAL.qte, el = $('qte'); if (!Q) { el.style.display = 'none'; return; }
  el.style.display = 'block';
  el.querySelector('.ch').innerHTML = [...QTE_TXT].map((c, i) => i < Q.i ? `<b>${c}</b>` : `<i>${c}</i>`).join('');
  el.querySelector('.k').textContent = Q.wait > 0 ? '…' : Q.seq[Q.i];
}
function qteKey(k) {
  const Q = FINAL.qte; if (!Q || Q.wait > 0) return;
  if (k === Q.seq[Q.i]) {
    Q.i++; Q.t = 0; Foley.at('spell', player.pos, { vol: 0.5, rate: 0.8 + Q.i * 0.08 }); burst(Q.boss.H.clone(), 0xffd84a, 20, 4); shock(player.pos.clone().setY(0.1), 0xffd84a, 1.5 + Q.i * 0.3);
    if (Q.i >= Q.seq.length) return qteEnd(true);
  } else qteEnd(false);
  qteDraw();
}
function qteEnd(ok) {
  const Q = FINAL.qte; if (!Q) return; FINAL.qte = null; qteDraw(); const b = Q.boss;
  if (ok) {
    FINAL.sealedOK = 1; slowmo = Math.max(slowmo, 1.2); shake = 0.8; Foley.at('gong', player.pos, { vol: 1 }); Foley.at('magic', player.pos, { vol: 1, rate: 0.7 });
    shock(new THREE.Vector3(ALT.x, 0.1, ALT.z), 0xffd84a, ALT.r + 2); burst(b.H.clone(), 0xffd84a, 120, 9);
    b.hp = 0; b.die(new THREE.Vector2(0, 1), {});
  } else {
    Foley.at('clangS', player.pos, { vol: 0.8, rate: 0.6 }); banner('咒语被打断了！<small>圣主恢复了一些力气——再把它打虚弱一次</small>', 2.4); Story.bark('shendu', '哈哈哈！老东西，你的咒语念错了！');
    b.hp = b.maxHp * 0.16; b.setState('fly'); b.cd = 1.5;
  }
}
window.addEventListener('keydown', (e) => { if (!FINAL.qte) return; const k = (e.code || '').replace('Key', ''); if (QTE_KEYS.includes(k)) { e.preventDefault(); e.stopImmediatePropagation(); if (!e.repeat) qteKey(k); } }, true);
function altarScript(dt) {
  const Q = FINAL.qte;
  if (Q) { player.iframe = Math.max(player.iframe, 0.2); if (Q.wait > 0) { Q.wait -= dt; if (Q.wait <= 0) qteDraw(); } else { Q.t += dt; const b = document.querySelector('#qte .bar i'); b.style.width = Math.max(0, 100 - Q.t / Q.per * 100) + '%'; if (Q.t > Q.per) qteEnd(false); } }
  FINAL.peds && FINAL.allRunes && FINAL.peds.forEach((P, i) => P.orb.position.y = 1.35 + Math.sin(now * 3 + i) * 0.1);
}
window.__ep9 = { GY, PT, ALT, SEAL, PIG, FINAL, Zombie, HoundDog, PigIdol, ShenduDragon, addSeal, sealsClear, graveScript, templeScript, altarScript, qteStart, qteKey, qteEnd, graveWeapons, templeWeapons };
