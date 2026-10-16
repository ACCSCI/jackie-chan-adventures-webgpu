// ================= 第四集 · 非人形敌人：铜鼠 / 镇墓石狮 / 第十三区无人机；人形：伪装守卫 / 陶俑 / 鼠符拉索 =================
Object.assign(ETYPES, {
  guard13: Object.assign({}, ETYPES.thug, { base: 'thug', name: '伪装守卫', hp: 62, dmg: 11, spd: 3.0, windup: 0.52, tint: [0.62, 0.8, 1.15] }),
  terra: Object.assign({}, ETYPES.thug, { base: 'thug', name: '活陶俑', hp: 95, dmg: 14, spd: 2.1, windup: 0.62, scale: 1.08, poise: 1, clay: 0xb4704a }),
  terraG: Object.assign({}, ETYPES.khan, { base: 'khan', name: '陶俑剑士', hp: 70, dmg: 12, spd: 3.2, windup: 0.45, scale: 1.04, clay: 0xa86a48 }),
  ratso4: Object.assign({}, ETYPES.thug, { base: 'thug', name: '拉索 · 鼠符', hp: 520, dmg: 17, spd: 3.0, windup: 0.5, scale: 1.16, tint: [0.75, 0.9, 1.45], poise: 1, elite: 1, summon: 1,
    dieMsg: '击败 拉索！<small>“我的护身符……它自己跑了！”</small>' }),
  rat: { name: '铜鼠', hp: 16, dmg: 6, spd: 5.4, radius: 0.32, scale: 0.55, beast: 1 },
  lion: { name: '镇墓石狮', hp: 950, dmg: 22, spd: 3.1, radius: 1.05, scale: 1.6, beast: 1, poise: 1, elite: 1, dieMsg: '石狮碎了！<small>“它只是一块石头……现在真的是了。”</small>' },
  drone: { name: '第十三区无人机', hp: 34, dmg: 10, spd: 4.2, radius: 0.45, scale: 0.8, beast: 1, hover: 2.3 },
});
ETYPES.ratso4.base = 'thug'; ETYPES.terra.base = 'thug'; ETYPES.terraG.base = 'khan'; ETYPES.guard13.base = 'thug';
WHO.ratso.e = () => enemies.find(e => !e.dead && (e.type === 'ratso' || e.type === 'ratso4')) || enemies.find(e => e.type === 'ratso4') || player;
// 陶俑：整身换成素陶色；死了直接碎掉
{
  const _die = Enemy.prototype.die;
  Enemy.prototype.die = function (dir, m) {
    _die.call(this, dir, m);
    if (this.T.clay) {
      const c = this.pos.clone().setY(1); burst(c, this.T.clay, 46, 6); burst(c.setY(0.4), 0x5a3a28, 20, 4); impact('break', { mat: MAT.pan || null, pos: this.pos }); Foley.at('stone', this.pos, { vol: 0.8 });
      floatText(this.pos.clone().setY(2), '碎了！', '#e8a27a', 26); this.rig.root.visible = false; this.t = 2.79; this.vel.set(0, 0, 0);
    }
  };
}
function clayRig(e) { if (!e.T.clay) return; e.rig.mats.forEach(m => { m.color.setHex(e.T.clay); m.vertexColors = false; m.map = null; m.needsUpdate = true; }); if (e.rig.katana) e.rig.katana.traverse(o => { if (o.material && o.material.color) o.material = M(0x6a4a30); }); }

// ---------- 非人形敌人基类 ----------
const _bv = new THREE.Vector3();
class Beast {
  constructor(type, x, z) {
    const T = ETYPES[type]; this.T = T; this.type = type; this.k = 'beast'; this.beast = true;
    this.scale = T.scale || 1; this.radius = T.radius || 0.5;
    this.pos = new THREE.Vector3(x, T.hover || 0, z); this.vel = new THREE.Vector3(); this.vy = 0;
    this.yaw = Math.atan2(player.pos.x - x, player.pos.z - z); this.hp = this.maxHp = T.hp; this.state = 'loco'; this.t = 0; this.cd = rand(0.8, 1.8);
    this.dead = false; this.holdToken = false; this.ph = rand(0, 6); this.hitN = 0; this.wob = 0; this.hitFl = 0; this.threat = null;
    this.rig = { root: new THREE.Group(), mats: [] }; this.rig.root.position.copy(this.pos); this.build(); scene.add(this.rig.root);
    this.anim = { kick() { }, update() { }, blend() { }, sp: {}, sv: {} };
    const hb = document.createElement('div'); hb.className = 'ehp' + (T.elite ? ' boss' : ''); hb.innerHTML = `${T.name}<div><i></i></div>`; $('hud').appendChild(hb); this.hb = hb;
    burst(this.pos.clone().setY(0.6), 0xffffff, 10, 2);
  }
  mat(c, o, std) { const m = std ? MS(c, o) : M(c, o); this.rig.mats.push(m); m.userData.e0 = m.emissive ? m.emissive.clone() : null; return m; }
  setState(s) { this.state = s; this.t = 0; }
  release() { if (this.holdToken) { attackTokens--; this.holdToken = false; } }
  flash(k) { this.rig.mats.forEach(m => { if (!m.emissive) return; const e = m.userData.e0; m.emissive.setRGB(k + (e ? e.r : 0), k * 0.12 + (e ? e.g : 0), e ? e.b : 0); }); }
  parried() { this.release(); this.stun(1.1, '破绽!'); }
  stun(t, txt, col = '#4fd1ff') { this.cancelTele(); this.setState('stun'); this.stunT = t; this.threat = null; if (txt) floatText(this.pos.clone().setY(this.pos.y + 1.8 * this.scale), txt, col, 26); }
  cancelTele() { if (this.tele) { Tele.cancel(this.tele); this.tele = null; } }
  knockDown() { }
  dmgMul() { return this.state === 'stun' ? 1.5 : 1; }
  takeHit(dmg, dir, m, kbMul, counter) {
    if (this.dead) return;
    dmg = Math.round(dmg * this.dmgMul()); this.hp -= dmg; this.hitN++; this.wob = 1; this.hitFl = 0.12;
    if (this.hp <= 0) { this.hp = 0; this.die(dir, m); return; }
    const kb = (m.kb || 2) * (kbMul || 1) * (this.kbScale ?? 1);
    this.vel.x += dir.x * kb; this.vel.z += dir.y * kb;
    this.onHit(dmg, dir, m, counter);
  }
  onHit() { }
  die(dir) {
    this.release(); this.cancelTele(); this.dead = true; this.threat = null; this.setState('dead'); this.hb.remove(); kills++;
    if (dir) this.vel.set(dir.x * 4, 0, dir.y * 4);
    if (this.T.dieMsg) banner(this.T.dieMsg, 3);
    this.onDie && this.onDie();
  }
  // 子类实现：think(dt)（决策+移动）、pose(dt, v)（程序化动画）
  update(dt) {
    this.t += dt; this.cd -= dt; this.wob = Math.max(0, this.wob - dt * 4);
    if (this.hitFl > 0) { this.hitFl -= dt; this.flash(this.hitFl > 0 ? 0.5 : 0); }
    if (this.dead) { this.vel.multiplyScalar(Math.exp(-dt * 4)); this.deathAnim(dt); }
    else if (this.state === 'stun') { this.vel.multiplyScalar(Math.exp(-dt * 6)); if ((this.stunT -= dt) <= 0) { this.setState('loco'); this.cd = Math.max(this.cd, 0.4); } if (Math.random() < dt * 8) burst(this.pos.clone().setY(this.pos.y + 1.6 * this.scale), 0xfff27a, 1, 1.5); }
    else this.think(dt);
    if (!this.T.hover || this.dead || this.state === 'down') { this.vy -= 22 * dt; this.pos.y += this.vy * dt; if (this.pos.y < (this.floorY || 0)) { this.pos.y = this.floorY || 0; this.vy = 0; } }
    this.pos.x += this.vel.x * dt; this.pos.z += this.vel.z * dt;
    collideCircle(this.pos, this.radius);
    this.rig.root.position.copy(this.pos); this.rig.root.rotation.y = this.yaw;
    this.pose(dt, Math.hypot(this.vel.x, this.vel.z));
    if (!this.dead) {
      const s = toScreen(this.pos.clone().setY(this.pos.y + (this.hbY || 2.05) * this.scale));
      const far = Math.hypot(this.pos.x - camera.position.x, this.pos.z - camera.position.z) > 28;
      this.hb.style.display = s.vis && !far ? 'block' : 'none'; this.hb.style.left = s.x + 'px'; this.hb.style.top = s.y + 'px';
      this.hb.querySelector('i').style.width = (this.hp / this.maxHp * 100) + '%';
    }
  }
  deathAnim(dt) { if (this.t > 1.2) { const s = 1 - (this.t - 1.2) / 0.5; this.rig.root.scale.setScalar(Math.max(0.01, s)); if (this.t > 1.7) { scene.remove(this.rig.root); this.gone = true; } } }
  idle(dt) { this.yaw += angDiff(this.yaw, Math.atan2(player.pos.x - this.pos.x, player.pos.z - this.pos.z)) * (1 - Math.exp(-dt * 4)); this.rig.root.position.copy(this.pos); this.rig.root.rotation.y = this.yaw; this.pose(dt, 0); }
  face(dt, k = 6, to) { const tx = to ? to.x : player.pos.x, tz = to ? to.z : player.pos.z; this.yaw += angDiff(this.yaw, Math.atan2(tx - this.pos.x, tz - this.pos.z)) * (1 - Math.exp(-dt * k)); }
  steer(dt, fx, fz, sp, k = 5) { this.vel.x = lerp(this.vel.x, fx * sp, 1 - Math.exp(-dt * k)); this.vel.z = lerp(this.vel.z, fz * sp, 1 - Math.exp(-dt * k)); }
  sep(fx, fz, R = 1.2) { for (const o of enemies) { if (o === this || o.dead) continue; const ox = this.pos.x - o.pos.x, oz = this.pos.z - o.pos.z, od = Math.hypot(ox, oz), r = R + (o.radius || 0.4) - 0.4; if (od < r && od > 0.01) { fx += ox / od * (r - od); fz += oz / od * (r - od); } } return [fx, fz]; }
}
// 剧情镜头里：非人形敌人用自己的待机动画
Story.idleEnemies = function (dt) {
  for (const e of enemies) {
    if (e.dead) continue;
    if (e.beast) { e.idle(dt); continue; }
    if (e.type === 'dummy') { e.update(dt); continue; }
    e.yaw += angDiff(e.yaw, Math.atan2(player.pos.x - e.pos.x, player.pos.z - e.pos.z)) * (1 - Math.exp(-dt * 5));
    e.anim.update(locoPose(e.target, e.base, 0, e.ph), dt);
    e.rig.root.position.copy(e.pos); e.rig.root.rotation.y = e.yaw; driveSkinEnemy(e, dt, true);
  }
};
// 生成：按类型选类
const BEAST_CLS = {};
function makeEnemy(type, x, z) { const C = BEAST_CLS[type]; const e = C ? new C(type, x, z) : new Enemy(type, x, z); if (!C) clayRig(e); return e; }
{ // spawnWave 也走 makeEnemy
  const _sw = spawnWave;
  spawnWave = function (i) {
    const W = WAVES[i]; if (!W.list.some(t => BEAST_CLS[t] || ETYPES[t].clay)) return _sw(i);
    wave = i; waveDone = false; $('wave').textContent = W.title;
    W.list.forEach((t, k) => { const a = W.at ? W.at[k] : [(k - (W.list.length - 1) / 2) * 1.6, AREA.hz - 1.5]; const e = makeEnemy(t, AREA.cx + a[0], AREA.cz + a[1]); e.yaw = Math.atan2(player.pos.x - e.pos.x, player.pos.z - e.pos.z); enemies.push(e); });
  };
}
function spawnAt(type, x, z) { const e = makeEnemy(type, x, z); e.yaw = Math.atan2(player.pos.x - x, player.pos.z - z); enemies.push(e); return e; }

// ---------- 铜鼠 ----------
const RAT_ATK = { n: 0 };
class Rat extends Beast {
  build() {
    const R = this.rig.root, s = this.scale, b = this.mat(0xb07a36, { metalness: 0.75, roughness: 0.35, emissive: 0x1a0c02 }, true), d = this.mat(0x5a3a1a, { metalness: 0.6, roughness: 0.5 }, true);
    const g = this.body = new THREE.Group(); R.add(g); g.scale.setScalar(s);
    const bd = mesh(new THREE.SphereGeometry(0.42, 14, 10), b, 0, 0.42, 0, g); bd.scale.set(0.85, 0.72, 1.25);
    const hd = this.head = new THREE.Group(); hd.position.set(0, 0.5, 0.5); g.add(hd);
    mesh(new THREE.SphereGeometry(0.24, 12, 8), b, 0, 0, 0.05, hd).scale.set(1, 0.9, 1.1);
    mesh(new THREE.ConeGeometry(0.15, 0.36, 10), b, 0, -0.04, 0.3, hd).rotation.x = Math.PI / 2;
    mesh(new THREE.SphereGeometry(0.045, 6, 4), d, 0, -0.04, 0.48, hd, false);
    [-1, 1].forEach(k => { const ear = mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.03, 12), b, k * 0.16, 0.2, -0.02, hd); ear.rotation.z = Math.PI / 2 - k * 0.3; ear.rotation.y = 0.3 * k; });
    this.eyeM = glowMat(2.5, 0.6, 0.1); [-1, 1].forEach(k => mesh(new THREE.SphereGeometry(0.035, 6, 4), this.eyeM, k * 0.1, 0.06, 0.22, hd, false));
    this.legs = [[-1, 1], [1, 1], [-1, -1], [1, -1]].map(([sx, sz]) => { const L = new THREE.Group(); L.position.set(sx * 0.24, 0.3, sz * 0.3); g.add(L); mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.3, 6), d, 0, -0.15, 0, L); return L; });
    const pts = []; for (let i = 0; i <= 8; i++) pts.push(new THREE.Vector3(Math.sin(i * 0.7) * 0.1, 0.35 + Math.sin(i / 8 * Math.PI) * 0.15, -0.5 - i * 0.09));
    this.tail = mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 16, 0.035, 5), d, 0, 0, 0, g);
    this.kbScale = 1.6; this.hbY = 1.6;
  }
  think(dt) {
    const p = player, dx = p.pos.x - this.pos.x, dz = p.pos.z - this.pos.z, d = Math.hypot(dx, dz) || 1;
    if (this.state === 'hit') { this.vel.multiplyScalar(Math.exp(-dt * 5)); if (this.t > 0.35) this.setState('loco'); return; }
    if (this.state === 'wind') {
      this.face(dt, 10); this.steer(dt, 0, 0, 0, 10); this.threat = 'amber'; this.eyeM.color.setRGB(4, 0.4 + Math.sin(now * 40), 0.1);
      if (this.t > 0.42) { this.setState('lunge'); Foley.at('chitter', this.pos, { vol: 0.5, rate: 1.3 }); this.vel.set(Math.sin(this.yaw) * 8, 0, Math.cos(this.yaw) * 8); this.vy = 3; this.pos.y = 0.01; this.bit = false; }
      return;
    }
    if (this.state === 'lunge') {
      this.threat = null; this.eyeM.color.setRGB(2.5, 0.6, 0.1);
      if (!this.bit && d < 0.75 + this.radius && Math.abs(p.pos.y - this.pos.y) < 1.2) { this.bit = true; playerTakeHit(this, this.T.dmg, {}); }
      if (this.t > 0.38) { this.setState('loco'); this.cd = rand(1.1, 2.2); RAT_ATK.n = Math.max(0, RAT_ATK.n - 1); this.vel.multiplyScalar(0.3); }
      return;
    }
    // 绕着玩家乱窜，随机切线方向
    if (Math.random() < dt * 0.8) this.strafe = Math.random() < 0.5 ? 1 : -1;
    const want = 2.2; let fx, fz;
    if (d > want + 1) { fx = dx / d; fz = dz / d; } else { const s = this.strafe || 1; fx = -dz / d * s + (d < want ? -dx / d * 0.5 : dx / d * 0.2); fz = dx / d * s + (d < want ? -dz / d * 0.5 : dz / d * 0.2); }
    [fx, fz] = this.sep(fx, fz, 0.8);
    this.steer(dt, fx, fz, this.T.spd * (0.85 + 0.3 * Math.sin(now * 3 + this.ph)), 7);
    if (Math.hypot(this.vel.x, this.vel.z) > 0.3) this.yaw += angDiff(this.yaw, Math.atan2(this.vel.x, this.vel.z)) * (1 - Math.exp(-dt * 10));
    if (this.cd <= 0 && d < 3 && RAT_ATK.n < 2 && p.state !== 'dead') { RAT_ATK.n++; this.setState('wind'); this.inAtk = true; }
  }
  setState(s) { if (this.inAtk && (s === 'hit' || s === 'stun' || s === 'dead') ) { RAT_ATK.n = Math.max(0, RAT_ATK.n - 1); this.inAtk = false; } if (s === 'loco') this.inAtk = false; super.setState(s); }
  onHit() { this.threat = null; this.setState('hit'); this.vy = 3.5; this.pos.y = Math.max(this.pos.y, 0.01); Foley.at('cHurt', this.pos, { vol: 0.35, rate: 1.6 }); }
  pose(dt, v) {
    this.ph += dt * (4 + v * 4.5); const a = Math.min(1, v / 2) * 0.9;
    this.legs.forEach((L, i) => L.rotation.x = Math.sin(this.ph + (i === 0 || i === 3 ? 0 : Math.PI)) * a);
    this.body.position.y = Math.abs(Math.sin(this.ph)) * 0.04 * a;
    this.tail.rotation.y = Math.sin(this.ph * 0.7) * 0.4;
    const crouch = this.state === 'wind' ? Math.min(1, this.t / 0.3) : 0;
    this.body.rotation.x = -crouch * 0.25 + (this.state === 'lunge' ? -0.3 : 0) + (this.state === 'hit' ? Math.sin(this.t * 25) * 0.5 : 0);
    this.body.rotation.z = this.wob * Math.sin(now * 40) * 0.3;
    this.head.rotation.x = -crouch * 0.2;
  }
  deathAnim(dt) {
    if (!this.cr) { this.cr = 1; burst(this.pos.clone().setY(0.3), 0xb07a36, 18, 3.5); Foley.at('chain', this.pos, { vol: 0.4, rate: 1.4 }); }
    this.body.rotation.z = Math.min(Math.PI / 2, this.t * 6);
    super.deathAnim(dt);
  }
}
BEAST_CLS.rat = Rat;

// ---------- 镇墓石狮 ----------
const stoneTex = canvasTex(256, 256, (g, W) => { g.fillStyle = '#8f8a80'; g.fillRect(0, 0, W, W); for (let i = 0; i < 1400; i++) { const v = 110 + Math.random() * 60 | 0; g.fillStyle = `rgba(${v},${v - 4},${v - 12},.5)`; g.fillRect(Math.random() * W, Math.random() * W, 2 + Math.random() * 3, 2 + Math.random() * 3); } g.strokeStyle = 'rgba(40,36,30,.5)'; g.lineWidth = 1.5; for (let i = 0; i < 10; i++) { g.beginPath(); let x = Math.random() * W, y = Math.random() * W; g.moveTo(x, y); for (let j = 0; j < 5; j++) { x += rand(-25, 25); y += rand(-25, 25); g.lineTo(x, y); } g.stroke(); } });
class Lion extends Beast {
  build() {
    const R = this.rig.root, st = this.mat(0xffffff, { map: stoneTex, emissive: 0x000000 }), dk = this.mat(0x6a655c, { map: stoneTex });
    const g = this.body = new THREE.Group(); R.add(g);
    const torso = mesh(new THREE.CapsuleGeometry(0.62, 1.3, 6, 12), st, 0, 1.25, -0.1, g); torso.rotation.x = Math.PI / 2; torso.scale.set(1.05, 1, 0.95);
    const chest = mesh(new THREE.SphereGeometry(0.78, 14, 10), st, 0, 1.45, 0.7, g); chest.scale.set(1, 1.05, 0.85);
    const hd = this.head = new THREE.Group(); hd.position.set(0, 2.05, 1.15); g.add(hd);
    box(0.95, 0.85, 0.8, st, 0, 0, 0, hd); box(0.7, 0.42, 0.45, st, 0, -0.18, 0.5, hd);
    const jaw = this.jaw = new THREE.Group(); jaw.position.set(0, -0.36, 0.35); hd.add(jaw); box(0.62, 0.16, 0.5, dk, 0, -0.06, 0.18, jaw);
    for (let k = -2; k <= 2; k++) mesh(new THREE.ConeGeometry(0.04, 0.14, 4), M(0xe8e2d0), k * 0.12, -0.05, 0.75, hd, false).rotation.x = Math.PI;
    box(0.9, 0.18, 0.25, dk, 0, 0.32, 0.42, hd); // 眉骨
    this.eyeM = glowMat(3, 0.5, 0.15); [-1, 1].forEach(k => mesh(new THREE.SphereGeometry(0.09, 8, 6), this.eyeM, k * 0.24, 0.12, 0.42, hd, false));
    // 卷毛鬃：一圈圈小球
    for (let r = 0; r < 3; r++) for (let i = 0; i < 9; i++) { const a = (i / 8 - 0.5) * Math.PI * 1.4; mesh(new THREE.SphereGeometry(0.2, 8, 6), dk, Math.sin(a) * (0.62 + r * 0.05), 0.42 - r * 0.38, -0.25 - r * 0.12 + Math.cos(a) * 0.08, hd); }
    [-1, 1].forEach(k => mesh(new THREE.SphereGeometry(0.16, 8, 6), dk, k * 0.5, 0.45, 0.1, hd));
    this.legs = [[-1, 1], [1, 1], [-1, -1], [1, -1]].map(([sx, sz]) => { const L = new THREE.Group(); L.position.set(sx * 0.5, 1.15, sz * 0.75 + (sz > 0 ? 0.15 : 0)); g.add(L); mesh(new THREE.CylinderGeometry(0.24, 0.2, 1.05, 10), st, 0, -0.55, 0, L); const paw = box(0.42, 0.22, 0.52, dk, 0, -1.05, 0.08, L); for (let t = -1; t <= 1; t++) mesh(new THREE.SphereGeometry(0.07, 6, 4), dk, t * 0.13, -1.1, 0.34, L); return L; });
    const tl = this.tail = new THREE.Group(); tl.position.set(0, 1.55, -1.05); g.add(tl);
    for (let i = 0; i < 6; i++) mesh(new THREE.SphereGeometry(0.19 - i * 0.012, 8, 6), dk, 0, 0.12 + i * 0.12 + Math.sin(i) * 0.05, -0.1 - Math.sin(i / 5 * Math.PI) * 0.25, tl);
    this.kbScale = 0.05; this.hbY = 2.0; this.roarCd = 4; this.mode = null;
  }
  think(dt) {
    const p = player, dx = p.pos.x - this.pos.x, dz = p.pos.z - this.pos.z, d = Math.hypot(dx, dz) || 1;
    const half = this.hp < this.maxHp * 0.5;
    if (half && !this.raged) { this.raged = true; this.roarCd = 0.5; }
    if (this.state === 'loco') {
      this.threat = null;
      this.face(dt, 4);
      let fx = 0, fz = 0; if (d > 3.2) { fx = dx / d; fz = dz / d; } else if (d < 2.2) { fx = -dx / d * 0.5; fz = -dz / d * 0.5; }
      this.steer(dt, fx, fz, this.T.spd, 3);
      this.roarCd -= dt;
      if (this.cd <= 0 && p.state !== 'dead') {
        if (this.raged && this.roarCd <= 0) this.startRoar();
        else if (d > 6.5 && Math.random() < 0.7) this.startCharge();
        else if (d > 3.5 && d < 10) this.startPounce();
        else if (d <= 3.8) this.startSwipe();
        else this.startCharge();
      }
    } else if (this.state === 'cwind') { // 冲撞蓄力：车道跟着狮子转
      this.steer(dt, 0, 0, 0, 8); this.threat = 'red';
      if (this.tele && !this.tele.fired && this.t < this.tele.wind * this.tele.lock) this.face(dt, 5);
      if (Math.random() < dt * 20) burst(this.pos.clone().setY(0.1).addScaledVector(new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw)), 1.2), 0x9a9080, 2, 2);
    } else if (this.state === 'charge') {
      this.threat = null; const sp = 15, fx = Math.sin(this.yaw), fz = Math.cos(this.yaw);
      this.vel.set(fx * sp, 0, fz * sp); this.run = (this.run || 0) + sp * dt;
      if (!this.hitP && Math.hypot(p.pos.x - this.pos.x, p.pos.z - this.pos.z) < this.radius + 0.55 && p.pos.y < 1.3) { this.hitP = true; playerTakeHit(this, 24, { kd: 1, unblockable: 1 }); }
      if (Math.random() < dt * 30) burst(this.pos.clone().setY(0.1), 0x9a9080, 2, 3);
      // 前方撞柱子？
      const nx = this.pos.x + fx * (this.radius + 0.25), nz = this.pos.z + fz * (this.radius + 0.25);
      const pil = areaCols().find(c => nx > c.x0 && nx < c.x1 && nz > c.z0 && nz < c.z1);
      const wall = Math.abs(nx - AREA.cx) > AREA.hx - 0.1 || Math.abs(nz - AREA.cz) > AREA.hz - 0.1;
      if (pil || wall) this.crash(pil && pil.pillar);
      else if (this.run > this.runMax) { this.setState('loco'); this.cd = rand(0.9, 1.6); this.vel.multiplyScalar(0.3); }
    } else if (this.state === 'pwind') { // 扑击：蹲伏 → 腾空 → 落在红圈里
      const T = this.tele, w = T ? T.wind : 0.85, k = this.t / w; this.threat = 'red';
      if (k < 0.5) { this.steer(dt, 0, 0, 0, 8); this.face(dt, 8, T); this.from = this.pos.clone(); }
      else if (T) { const u = Math.min(1, (k - 0.5) / 0.5); this.pos.x = lerp(this.from.x, T.x, u); this.pos.z = lerp(this.from.z, T.z, u); this.pos.y = Math.sin(u * Math.PI) * 2.6; this.vy = 0; this.vel.set(0, 0, 0); }
      if (k >= 1 || !T) { this.setState('loco'); this.cd = rand(0.9, 1.5); this.pos.y = 0; shake = 0.3; shock(this.pos.clone().setY(0.05), 0x9a9080, 2.4); burst(this.pos.clone().setY(0.2), 0x9a9080, 26, 5); impact('fall', { pos: this.pos, big: true }); }
    } else if (this.state === 'swind') { this.steer(dt, 0, 0, 0, 8); this.threat = 'amber'; if (this.t < 0.35) this.face(dt, 8); if (this.tele) { this.tele.yaw = this.yaw; this.tele.x = this.pos.x; this.tele.z = this.pos.z; } if (this.t > 0.95) { this.setState('loco'); this.cd = rand(0.8, 1.4); } }
    else if (this.state === 'roar') { this.steer(dt, 0, 0, 0, 8); this.threat = 'red'; if (this.t > 2.3) { this.setState('loco'); this.cd = 0.8; } }
  }
  startCharge() {
    this.setState('cwind'); this.hitP = false; this.run = 0; const p = player;
    const len = clamp(Math.hypot(p.pos.x - this.pos.x, p.pos.z - this.pos.z) + 5, 8, 18); this.runMax = len;
    Foley.at('growl', this.pos, { vol: 0.8, rate: 0.7 });
    this.tele = Tele.add({ shape: 'lane', x: this.pos.x, z: this.pos.z, yaw: this.yaw, w: 2.4, len, wind: 1.0, lock: 0.7, col: 'red', src: this,
      follow: (T) => { T.x = this.pos.x; T.z = this.pos.z; T.yaw = this.yaw; }, onFire: () => { this.tele = null; if (this.state === 'cwind') { this.setState('charge'); Foley.at('roar', this.pos, { vol: 0.5, rate: 1.2 }); } } });
  }
  crash(pillar) {
    this.vel.set(-Math.sin(this.yaw) * 3, 0, -Math.cos(this.yaw) * 3); shake = pillar ? 0.5 : 0.3; impact('fall', { pos: this.pos, big: true }); Foley.at('stone', this.pos, { vol: 1 });
    burst(this.pos.clone().setY(1.5).addScaledVector(new THREE.Vector3(Math.sin(this.yaw), 0, Math.cos(this.yaw)), 1.2), 0xb8b0a0, 40, 7);
    if (pillar) { this.hp -= 45; floatText(this.pos.clone().setY(2.6), '-45', '#ffcf6a', 26); this.stun(2.8, '撞晕了！ 快打！', '#ffd84a'); gameEvent('lionCrash'); if (this.hp <= 0) { this.hp = 1; } }
    else this.stun(1.1, '撞墙了！', '#ffd84a');
  }
  startPounce() {
    this.setState('pwind'); const p = player; Foley.at('growl', this.pos, { vol: 0.7, rate: 0.9 });
    this.tele = Tele.add({ shape: 'circle', x: p.pos.x, z: p.pos.z, r: 2.2, wind: 0.9, lock: 0.5, col: 'red', src: this, dmg: 20, kd: 1,
      follow: (T, dt) => { T.x = lerp(T.x, player.pos.x, 1 - Math.exp(-dt * 5)); T.z = lerp(T.z, player.pos.z, 1 - Math.exp(-dt * 5)); }, onFire: (T) => { this.tele = null; if (Tele.inside(T, player.pos) && player.pos.y < 1.2) playerTakeHit(this, 20, { kd: 1, unblockable: 1 }); } });
  }
  startSwipe() {
    this.setState('swind'); Foley.at('swishH', this.pos, { vol: 0.6, rate: 0.6, delay: 0.45 });
    this.tele = Tele.add({ shape: 'sector', x: this.pos.x, z: this.pos.z, yaw: this.yaw, r: 3.4, arc: 0.85, wind: 0.6, col: 'amber', src: this,
      onFire: (T) => { this.tele = null; if (Tele.inside(T, player.pos) && player.pos.y < 1.3) playerTakeHit(this, 15, {}); } });
  }
  startRoar() {
    this.setState('roar'); this.roarCd = 13; Foley.at('roar', this.pos, { vol: 1, rate: 0.75 });
    if (!this.roared) { this.roared = 1; banner('石狮怒吼！<small>红色冲击环——在它扫过脚下时跳起来！</small>', 2.4); }
    Tele.add({ shape: 'ring', x: this.pos.x, z: this.pos.z, r: 12, wind: 0.9, speed: 8.5, col: 'red', src: this, dmg: 16, opts: { kd: 1, unblockable: 1 }, onFire: () => { shake = 0.35; shock(this.pos.clone().setY(0.1), 0xff4a3a, 4); } });
    Story.timers.push({ t: 1.1, f: () => { if (this.dead) return; for (let i = 0; i < 3; i++) { const a = this.yaw + (i - 1) * 1.2; const r = spawnAt('rat', this.pos.x + Math.sin(a) * 2.2, this.pos.z + Math.cos(a) * 2.2); r.cd = 1.2; } floatText(this.pos.clone().setY(3), '铜鼠出笼！', '#e0a050', 24); } });
  }
  parried() { this.release(); this.stun(1.2, '破绽!'); }
  onHit(dmg, dir, m) { if (this.state === 'stun') return; }
  pose(dt, v) {
    const run = this.state === 'charge'; this.ph += dt * (2 + v * (run ? 1.1 : 2.2)); const a = Math.min(1, v / 2.5) * (run ? 0.85 : 0.55);
    this.legs.forEach((L, i) => L.rotation.x = Math.sin(this.ph + (run ? (i < 2 ? 0 : Math.PI * 0.8) : (i === 0 || i === 3 ? 0 : Math.PI))) * a);
    const w = this.state === 'cwind' || (this.state === 'pwind' && this.t < 0.45) ? Math.min(1, this.t / 0.3) : 0;
    const sw = this.state === 'swind' ? this.t : -1;
    this.body.position.y = -w * 0.35 + Math.abs(Math.sin(this.ph)) * 0.05 * a;
    this.body.rotation.x = w * 0.18 + (this.state === 'roar' ? -0.25 * Math.min(1, this.t / 0.5) : 0) + (this.state === 'stun' ? Math.sin(now * 3) * 0.06 + 0.12 : 0);
    this.body.rotation.z = this.wob * Math.sin(now * 30) * 0.04 + (this.state === 'stun' ? Math.sin(now * 2.2) * 0.12 : 0);
    // 扇击：抬起右前爪横扫
    const fl = this.legs[1];
    if (sw >= 0) { const k = sw < 0.5 ? sw / 0.5 : sw < 0.7 ? 1 - (sw - 0.5) / 0.2 * 1.6 : -0.6 + (sw - 0.7) / 0.25 * 0.6; fl.rotation.x = -1.6 * Math.max(0, k) + 0.4 * Math.min(0, k); fl.rotation.z = sw > 0.5 && sw < 0.75 ? 0.6 : 0; } else fl.rotation.z = 0;
    const roar = this.state === 'roar' ? Math.min(1, this.t / 0.4) * (this.t < 1.8 ? 1 : Math.max(0, 1 - (this.t - 1.8) / 0.4)) : 0;
    this.jaw.rotation.x = 0.5 * roar + (this.state === 'cwind' ? 0.25 : 0);
    this.head.rotation.y = this.state === 'loco' ? clamp(angDiff(this.yaw, Math.atan2(player.pos.x - this.pos.x, player.pos.z - this.pos.z)), -0.5, 0.5) : 0;
    this.head.rotation.x = roar * -0.3 + w * 0.15;
    this.tail.rotation.x = Math.sin(now * 2) * 0.15;
    const e = this.state === 'stun' ? 0.2 : this.threat ? 3.5 + Math.sin(now * 30) : 3; this.eyeM.color.setRGB(e, 0.5, 0.15);
  }
  deathAnim(dt) {
    if (!this.cr) { this.cr = 1; Foley.at('stone', this.pos, { vol: 1 }); shake = 0.5; }
    if (this.t < 1.4 && Math.random() < dt * 30) burst(this.pos.clone().setY(rand(0.4, 2)).add(new THREE.Vector3(rand(-1, 1), 0, rand(-1, 1))), 0xb8b0a0, 4, 4);
    this.body.position.y = -Math.min(0.9, this.t * 0.7); this.body.rotation.z = Math.min(0.5, this.t * 0.4);
    if (this.t > 1.6) { this.rig.root.visible = false; if (!this.cr2) { this.cr2 = 1; burst(this.pos.clone().setY(1), 0xb8b0a0, 60, 8); burst(this.pos.clone().setY(0.4), 0x6a655c, 30, 5); } }
    if (this.t > 1.8) { scene.remove(this.rig.root); this.gone = true; }
  }
}
BEAST_CLS.lion = Lion;

// ---------- 第十三区无人机 ----------
const LASER_MAT = new THREE.MeshBasicMaterial({ color: new THREE.Color(3, 0.2, 0.15), transparent: true, opacity: 0.6, depthWrite: false, toneMapped: false, blending: THREE.AdditiveBlending, fog: false });
const LASER_MAT2 = new THREE.MeshBasicMaterial({ color: new THREE.Color(4, 1.2, 1), transparent: true, opacity: 0.95, depthWrite: false, toneMapped: false, blending: THREE.AdditiveBlending, fog: false });
const LASER_GEO = new THREE.CylinderGeometry(0.018, 0.018, 1, 5).translate(0, 0.5, 0).rotateX(Math.PI / 2);
const BOLT_GEO = new THREE.SphereGeometry(0.16, 10, 8), BOLT_MAT = glowMat(4, 0.6, 0.4), BOLT_MAT2 = glowMat(0.6, 2.5, 4);
const Bolts = {
  list: [],
  add(from, dir, owner, dmg) { const m = new THREE.Mesh(BOLT_GEO, BOLT_MAT); m.position.copy(from); m.scale.set(1, 1, 2.2); scene.add(m); this.list.push({ m, pos: m.position, vel: dir.clone().multiplyScalar(17), owner, dmg, t: 0, back: false, parried() { Bolts.reflect(this); } }); Foley.at('laser', from, { vol: 0.45 }); },
  reflect(b) { b.back = true; b.m.material = BOLT_MAT2; b.t = 0; floatText(b.pos.clone(), '弹回去！', '#7fd8ff', 24); },
  update(dt) {
    const p = player, chest = p.pos.clone().setY(p.pos.y + 1.15);
    for (let i = this.list.length - 1; i >= 0; i--) {
      const b = this.list[i]; b.t += dt;
      if (b.back && b.owner && !b.owner.dead) { const tg = b.owner.pos.clone(); tg.y += 0.1; const d = tg.sub(b.pos); const L = d.length(); b.vel.lerp(d.multiplyScalar(22 / Math.max(L, 0.01)), 1 - Math.exp(-dt * 10)); if (L < 0.6) { b.owner.shotDown(); this.kill(i); continue; } }
      b.pos.addScaledVector(b.vel, dt); b.m.lookAt(b.pos.clone().add(b.vel));
      if (!b.back && !b.hitChk && b.pos.distanceTo(chest) < 0.55) { b.hitChk = true; const hp0 = p.hp, st0 = p.state; playerTakeHit(b, b.dmg, {}); if (b.back) continue; if (p.iframe > 0 && st0 === 'dodge') continue; this.kill(i); burst(b.pos, 0xff6a4a, 10, 3); continue; }
      if (b.t > 2.2 || b.pos.y < 0 || areaCols().some(c => (c.h ?? 3) > b.pos.y && b.pos.x > c.x0 && b.pos.x < c.x1 && b.pos.z > c.z0 && b.pos.z < c.z1)) { burst(b.pos, 0xff6a4a, 6, 2); this.kill(i); }
    }
  },
  kill(i) { scene.remove(this.list[i].m); this.list.splice(i, 1); },
  clear() { while (this.list.length) this.kill(0); },
};
class Drone extends Beast {
  build() {
    const R = this.rig.root, s = this.scale, mt = this.mat(0x30363e, { metalness: 0.8, roughness: 0.35, emissive: 0x000000 }, true), wh = this.mat(0xd8dde2, { metalness: 0.4, roughness: 0.4 }, true);
    const g = this.body = new THREE.Group(); R.add(g); g.scale.setScalar(s);
    mesh(new THREE.CylinderGeometry(0.42, 0.5, 0.18, 16), mt, 0, 0, 0, g); mesh(new THREE.SphereGeometry(0.34, 14, 8, 0, TAU, 0, Math.PI / 2), wh, 0, 0.08, 0, g);
    box(0.5, 0.06, 0.22, mt, 0, 0.2, -0.05, g);
    const lbl = canvasTex(128, 64, (c) => { c.fillStyle = '#d8dde2'; c.fillRect(0, 0, 128, 64); c.fillStyle = '#20406a'; c.font = 'bold 40px sans-serif'; c.textAlign = 'center'; c.fillText('S13', 64, 46); });
    plane(0.34, 0.17, M(0xffffff, { map: lbl }), 0, 0.22, 0.31, 0, g).rotation.x = -0.6;
    this.eyeM = glowMat(3, 0.3, 0.2); this.eye = mesh(new THREE.SphereGeometry(0.1, 10, 8), this.eyeM, 0, -0.05, 0.45, g, false);
    mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.12, 10), mt, 0, -0.05, 0.38, g).rotation.x = Math.PI / 2;
    this.rotors = [];
    for (let i = 0; i < 4; i++) { const a = Math.PI / 4 + i * Math.PI / 2, x = Math.sin(a) * 0.62, z = Math.cos(a) * 0.62; const arm = box(0.07, 0.05, 0.62, mt, x / 2, 0.02, z / 2, g); arm.rotation.y = a; mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.12, 8), mt, x, 0.06, z, g); const r = mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.01, 18), new THREE.MeshBasicMaterial({ color: 0x9aa4b0, transparent: true, opacity: 0.35, depthWrite: false }), x, 0.13, z, g, false); this.rotors.push(r); const bl = box(0.56, 0.01, 0.05, mt, 0, 0, 0, r); }
    this.laser = new THREE.Mesh(LASER_GEO, LASER_MAT); this.laser.visible = false; this.laser.frustumCulled = false; scene.add(this.laser);
    this.orbitA = rand(0, TAU); this.orbitDir = Math.random() < 0.5 ? 1 : -1; this.kbScale = 0.5; this.hbY = 0.9; this.cd = rand(1.2, 2.6);
  }
  eyePos() { return this.eye.getWorldPosition(_bv).clone(); }
  think(dt) {
    const p = player, dx = p.pos.x - this.pos.x, dz = p.pos.z - this.pos.z, d = Math.hypot(dx, dz) || 1;
    const hov = this.T.hover + Math.sin(now * 2 + this.ph) * 0.12;
    if (this.state === 'down') { // 坠地：3.5 秒后重新升空
      this.threat = null; this.laser.visible = false; this.vel.multiplyScalar(Math.exp(-dt * 4)); this.floorY = 0.3;
      if (this.t > 3.5) { this.setState('loco'); this.cd = 1.5; floatText(this.pos.clone().setY(1.2), '重新升空', '#9ab', 18); Foley.at('mech', this.pos, { vol: 0.4 }); }
      return;
    }
    this.floorY = 0; this.pos.y = lerp(this.pos.y, hov, 1 - Math.exp(-dt * 2.5)); this.vy = 0;
    if (this.state === 'loco') {
      this.laser.visible = false; this.threat = null;
      this.orbitA += dt * 0.45 * this.orbitDir; if (Math.random() < dt * 0.15) this.orbitDir *= -1;
      const R = 5.6, tx = p.pos.x + Math.sin(this.orbitA) * R, tz = p.pos.z + Math.cos(this.orbitA) * R;
      let fx = tx - this.pos.x, fz = tz - this.pos.z; const fd = Math.hypot(fx, fz) || 1; fx /= fd; fz /= fd; const k = Math.min(1, fd / 2);
      [fx, fz] = this.sep(fx * k, fz * k, 1.6);
      this.steer(dt, fx, fz, this.T.spd, 2.5); this.face(dt, 5);
      if (this.cd <= 0 && d < 13 && p.state !== 'dead' && Drone.aiming < 2) { this.setState('aim'); Drone.aiming++; Foley.at('beep', this.pos, { vol: 0.4 }); }
    } else if (this.state === 'aim' || this.state === 'lock') {
      this.steer(dt, 0, 0, 0, 3); this.threat = 'amber';
      const e = this.eyePos(); if (this.state === 'aim') { this.face(dt, 8); this.aimAt = p.pos.clone().setY(p.pos.y + 1.15); }
      const L = this.aimAt.clone().sub(e), len = L.length(); this.laser.position.copy(e); this.laser.lookAt(this.aimAt); this.laser.scale.set(1, 1, len); this.laser.visible = true;
      this.laser.material = this.state === 'lock' && ((now * 20) | 0) % 2 ? LASER_MAT2 : LASER_MAT;
      if (this.state === 'aim' && this.t > 0.9) { this.setState('lock'); Foley.at('beep', this.pos, { vol: 0.5, rate: 1.5 }); }
      else if (this.state === 'lock' && this.t > 0.3) { Bolts.add(e, L.normalize(), this, this.T.dmg); this.endAim(); this.cd = rand(2.6, 3.8); this.vel.addScaledVector(L, -1.5); }
    }
  }
  endAim() { if (this.state === 'aim' || this.state === 'lock') Drone.aiming = Math.max(0, Drone.aiming - 1); this.laser.visible = false; this.threat = null; this.setState('loco'); }
  setState(s) { if ((this.state === 'aim' || this.state === 'lock') && s !== 'lock' && s !== 'aim' && s !== 'loco') { Drone.aiming = Math.max(0, Drone.aiming - 1); this.laser.visible = false; } super.setState(s); }
  shotDown() { if (this.dead) return; this.takeHit(16, new THREE.Vector2(0, 0), { kb: 0 }, 0); if (!this.dead) this.fall(); floatText(this.pos.clone().setY(this.pos.y + 0.6), '击落！', '#7fd8ff', 26); }
  fall() { if (this.state === 'aim' || this.state === 'lock') this.endAim(); this.setState('down'); this.vy = -2; burst(this.pos.clone(), 0xffd84a, 14, 4); Foley.at('zap', this.pos, { vol: 0.6 }); }
  onHit() { if (this.state !== 'down') this.fall(); Foley.at('mech', this.pos, { vol: 0.4, rate: 1.3 }); }
  pose(dt, v) {
    const spin = this.state === 'down' ? 0.3 : 40; this.rotors.forEach((r, i) => r.rotation.y += dt * spin * (i % 2 ? 1 : -1));
    this.body.rotation.x = clamp((this.vel.x * Math.sin(this.yaw) + this.vel.z * Math.cos(this.yaw)) * 0.06, -0.3, 0.3) + (this.state === 'down' ? 0.35 : 0);
    this.body.rotation.z = clamp(-(this.vel.x * Math.cos(this.yaw) - this.vel.z * Math.sin(this.yaw)) * 0.06, -0.3, 0.3) + this.wob * Math.sin(now * 40) * 0.2 + (this.state === 'down' ? 0.25 : 0);
    const e = this.state === 'down' ? 0.3 : this.state === 'lock' ? 5 : this.state === 'aim' ? 3 + Math.sin(now * 30) : 2; this.eyeM.color.setRGB(e, 0.3, 0.2);
    if (this.state === 'down' && Math.random() < dt * 6) burst(this.pos.clone().setY(this.pos.y + 0.3), 0x666666, 1, 1);
  }
  idle(dt) { this.laser.visible = false; super.idle(dt); }
  deathAnim(dt) {
    this.laser.visible = false;
    if (!this.cr) { this.cr = 1; burst(this.pos.clone(), 0xff8a3a, 30, 6); Foley.at('explode', this.pos, { vol: 0.55, rate: 1.4 }); shake = Math.max(shake, 0.15); this.vy = 2; }
    this.body.rotation.x += dt * 6; super.deathAnim(dt);
  }
  die(dir) { this.laser.visible = false; super.die(dir); }
}
Drone.aiming = 0;
BEAST_CLS.drone = Drone;
// 拉索的鼠符：每隔一段时间召唤铜鼠
{
  const _up = Enemy.prototype.update;
  Enemy.prototype.update = function (dt) {
    _up.call(this, dt);
    if (this.T.summon && !this.dead && !cutscene) {
      this.sumT = (this.sumT ?? 6) - dt;
      if (this.sumT <= 0 && enemies.filter(e => !e.dead && e.type === 'rat').length < 3) {
        this.sumT = this.hp < this.maxHp * 0.5 ? 8 : 12;
        floatText(this.pos.clone().setY(2.6 * this.scale), '鼠符 · 点铜成鼠！', '#e0a050', 24); shock(this.pos.clone().setY(0.1), 0xe0a050, 2.5); Foley.at('spell', this.pos, { vol: 0.6 });
        for (let i = 0; i < 2; i++) { const a = this.yaw + (i ? 1.3 : -1.3); spawnAt('rat', this.pos.x + Math.sin(a) * 1.6, this.pos.z + Math.cos(a) * 1.6).cd = 1.4; }
      }
    }
  };
}
{
  const _uw = updateWaves; updateWaves = function (dt) { _uw(dt); Bolts.update(dt); };
  const _pl = Story.play.bind(Story); Story.play = function (L, d) { Tele.clear(); Bolts.clear(); enemies.forEach(e => { e.threat = null; if (e.laser) e.laser.visible = false; }); _pl(L, d); };
  const _rs = Menu.resetSession.bind(Menu); Menu.resetSession = function () { _rs(); Bolts.clear(); RAT_ATK.n = 0; Drone.aiming = 0; };
}
// 剧情模式之外（练功房）也能召唤新敌人做测试
window.__ep4 = { makeEnemy, spawnAt, Tele, SNEAK, Squad, Bolts, BEAST_CLS };
