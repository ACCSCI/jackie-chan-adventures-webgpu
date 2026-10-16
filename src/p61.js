// ================= 第七集 · 马与羊：夜市（芬恩·马符）/ 灵界（守护肉身）/ 梦魇（阿周·羊符） =================
const NM = { x: 0, z: 800, hx: 7.5, hz: 22 };
const SPR = { x: 220, z: 800, r: 12.5 };
const DRM = { x: -220, z: 800, r: 13 };
// ---------- 通用：用蒙皮角色做的 Boss（人形） ----------
class SkinBoss extends Beast {
  build() { this.rig = makeSkinRig(this.T.rig || 'thug', this.scale); this.kbScale = this.T.kb ?? 0.12; this.hbY = 1.95; this.atkK = 1; }
  update(dt) {
    if (this.rig.loaded && !this.tinted) { this.tinted = 1; if (this.T.tint) { const t = new THREE.Color(...this.T.tint); this.rig.mats.forEach(m => m.color && m.color.multiply(t)); } this.onLoaded && this.onLoaded(); }
    super.update(dt);
  }
  act(st, D, hitAt, clip) { this.setState(st); this.D = D; this.hitAt = hitAt; this.clip = clip; }
  // 一次带预警的出招：o = { st, D, hit, clip, tele:{...}, dmg, opts, onHit, lunge }
  strike(o) {
    const k = this.atkK || 1; this.act(o.st || 'atk', o.D * k, o.hit * k, o.clip); this.lunge = o.lunge || 0; this.atkO = o;
    if (o.sw !== false) Foley.at(o.sw || 'swH', this.pos, { vol: 0.6, rate: o.swRate || 0.9, delay: Math.max(0, this.hitAt - 0.12) });
    if (o.kiai) Foley.at(o.kiai, this.pos, { vol: 0.6 });
    const T = Object.assign({ x: this.pos.x, z: this.pos.z, yaw: this.yaw, wind: this.hitAt, lock: 0.65, src: this }, o.tele);
    if (!o.fixed) T.follow = (T) => { T.x = this.pos.x + (o.off || 0) * Math.sin(this.yaw); T.z = this.pos.z + (o.off || 0) * Math.cos(this.yaw); T.yaw = this.yaw; };
    T.onFire = (T) => { this.tele = null; let hit = false; if (Tele.inside(T, player.pos) && player.pos.y < (o.hy || 1.4)) { hit = true; playerTakeHit(this, o.dmg, o.opts || {}); } o.onFire && o.onFire(T, hit); };
    this.tele = Tele.add(T);
  }
  runAtk(dt) {
    this.steer(dt, 0, 0, 0, 8); if (this.t < this.hitAt * 0.6) this.face(dt, 6);
    if (this.lunge && this.t > this.hitAt - 0.12 && this.t < this.hitAt + 0.05) this.vel.set(Math.sin(this.yaw) * this.lunge, 0, Math.cos(this.yaw) * this.lunge);
    if (this.t >= this.D) { const n = this.atkO && this.atkO.next; this.atkO = null; if (n) n(); else { this.setState('loco'); this.cd = rand(0.7, 1.2) * (this.cdK || 1); } }
  }
  chase(dt, near = 2.2, spd = this.T.spd) {
    const p = player, dx = p.pos.x - this.pos.x, dz = p.pos.z - this.pos.z, d = Math.hypot(dx, dz) || 1;
    this.threat = null; this.face(dt, 4);
    let fx = 0, fz = 0; if (d > near) { fx = dx / d; fz = dz / d; } else if (d < near * 0.6) { fx = -dx / d * 0.5; fz = -dz / d * 0.5; }
    [fx, fz] = this.sep(fx, fz, 1.3); this.steer(dt, fx, fz, spd, 4); return d;
  }
  parried() { this.release(); this.cancelTele(); this.stun(1.2, '破绽!'); }
  pose(dt, v) {
    const sk = this.rig.sk; if (!sk || !sk.mixer) return;
    const S = this.state, P = this.T.pose || {};
    if (cutscene && !this.dead) sk.set('cut', { [P.idle || 'idle_box']: 1 }, null, 0.25);
    else if (S === 'loco') sk.set('loco', skLoco(sk, { v, idle: P.idle || 'idle_box', walk: v > 3.2 ? 'run' : 'walk', walkV: v > 3.2 ? 4.5 : 1.3 }), null, 0.2);
    else if (S === 'stun') { sk.set('stun', { drunk_stumble: 1 }, null, 0.2); sk.speed('drunk_stumble', 0.75); }
    else if (S === 'dead') skDown(sk, false, Math.min(this.t, 1.0), 2.1, true);
    else if (S === 'dash') { sk.set('dash', { run: 1 }, null, 0.1); sk.speed('run', 1.8); }
    else if (this.clip) { const c = this.clip, d = sk.dur(c); sk.set(S + c, { [c]: 1 }, null, 0.08); sk.time(c, Math.min(d - 0.01, this.D ? this.t / this.D * d : this.t)); }
    else sk.set('idle', { [P.idle || 'idle_box']: 1 }, null, 0.2);
    sk.update(dt);
  }
  deathAnim() { if (this.t > 0.36 && !this.thud) { this.thud = 1; impact('fall', { pos: this.pos, big: true }); shake = 0.4; } }
}

// ================= 夜市 =================
const MKT = { stage: 0, told: {} };
const neonTex = (txt, col) => canvasTex(512, 160, (g, W, H) => { g.fillStyle = '#0a0a12'; g.fillRect(0, 0, W, H); g.shadowColor = col; g.shadowBlur = 24; g.strokeStyle = col; g.lineWidth = 6; g.strokeRect(10, 10, W - 20, H - 20); g.fillStyle = col; g.font = 'bold 84px "Noto Sans SC",sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(txt, W / 2, H / 2 + 4); });
function mkStall(kind) {
  const g = new THREE.Group(), cols = { fruit: 0xd84a2a, noodle: 0x2a7ad8, toy: 0xd8a82a, lantern: 0xd82a6a, fish: 0x2aa86a };
  const c = M(cols[kind] || 0xd84a2a), wood = M(0x6a4a2a), cloth = M(0xf2ead8);
  box(2.0, 0.85, 1.0, wood, 0, 0.42, 0, g); box(2.1, 0.06, 1.1, cloth, 0, 0.88, 0, g);
  [[-0.95, -0.45], [0.95, -0.45], [-0.95, 0.45], [0.95, 0.45]].forEach(([x, z]) => box(0.06, 2.2, 0.06, wood, x, 1.1, z, g));
  const roof = box(2.4, 0.06, 1.5, c, 0, 2.25, 0.1, g); roof.rotation.x = -0.18;
  for (let i = -2; i <= 2; i++) box(0.46, 0.18, 0.02, i % 2 ? c : cloth, i * 0.47, 2.08, 0.82, g);
  if (kind === 'fruit') for (let i = 0; i < 14; i++) mesh(new THREE.SphereGeometry(0.09, 8, 6), M([0xff6a2a, 0xffd84a, 0x6ad84a, 0xd82a3a][i % 4]), rand(-0.85, 0.85), 0.98, rand(-0.4, 0.4), g);
  else if (kind === 'noodle') { for (let i = -1; i <= 1; i++) mesh(new THREE.CylinderGeometry(0.22, 0.16, 0.22, 14), MS(0x9aa0a8, { metalness: .7, roughness: .35 }), i * 0.6, 1.02, 0, g); const st = mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.5, 12), M(0xc8a060), 0.6, 1.16, -0.2, g); }
  else if (kind === 'toy') for (let i = 0; i < 8; i++) box(0.16, 0.2, 0.16, M([0xff5a8a, 0x5ab0ff, 0xffd84a, 0x8aff5a][i % 4]), rand(-0.8, 0.8), 1.0, rand(-0.35, 0.35), g);
  else if (kind === 'lantern') for (let i = -2; i <= 2; i++) mesh(new THREE.SphereGeometry(0.15, 10, 8), glowMat(3, 0.6, 0.3), i * 0.4, 1.7, 0.6, g, false);
  else for (let i = 0; i < 4; i++) { const f = mesh(new THREE.ConeGeometry(0.07, 0.4, 6), MS(0x9ab0c0, { metalness: .5 }), -0.6 + i * 0.4, 0.95, 0, g); f.rotation.z = Math.PI / 2; }
  return g;
}
(function buildMarket() {
  const G = new THREE.Group(); G.position.set(NM.x, 0, NM.z); scene.add(G); AREA_GROUPS.market = G;
  const { hx, hz } = NM;
  const ft = _tex.concrete(true); ft.repeat.set(2, 8);
  const fl = mesh(new THREE.PlaneGeometry(hx * 2 + 8, hz * 2 + 4), MS(0xffffff, { map: ft, roughness: 0.6, metalness: 0.15 }), 0, 0.002, 0, G, false); fl.rotation.x = -Math.PI / 2; fl.receiveShadow = true;
  // 两侧楼房 + 霓虹招牌
  const signs = [['夜 市', '#ff4a8a'], ['牛肉面', '#4ae0ff'], ['糖 水', '#ffd84a'], ['烧 烤', '#ff7a2a'], ['奶 茶', '#8aff6a'], ['海 鲜', '#4a9aff'], ['麻辣烫', '#ff4a4a'], ['小 吃', '#d88aff']];
  [-1, 1].forEach(s => {
    for (let z = -hz; z < hz; z += 7.4) {
      const h = rand(9, 15), b = box(6, h, 7, M([0x3a3440, 0x40383a, 0x34383e][(z / 7 | 0) & 1 ? 0 : 1]), s * (hx + 4), h / 2, z + 3.7, G);
      for (let y = 3.5; y < h - 1; y += 2.4) for (let k = -1; k <= 1; k++) if (Math.random() < 0.7) box(0.05, 1.1, 1.2, Math.random() < 0.5 ? glowMat(1.6, 1.2, 0.6) : M(0x101418), s * (hx + 0.97), y, z + 3.7 + k * 2, G).castShadow = false;
      const [t, c] = signs[(Math.abs(z) / 7 | 0) % signs.length]; const sg = plane(3.2, 1.0, new THREE.MeshBasicMaterial({ map: neonTex(t, c), toneMapped: false }), s * (hx + 0.95), 4.2, z + 3.7, -s * Math.PI / 2, G);
    }
    addColH(G, s > 0 ? hx : -hx - 8, s > 0 ? hx + 8 : -hx, -hz - 2, hz + 2, 16);
  });
  // 头顶灯笼串
  const lanM = glowMat(3.2, 0.7, 0.25), wire = M(0x222222);
  for (let z = -hz + 2; z < hz; z += 4.2) {
    const a = new THREE.Vector3(-hx, 5.2, z), b = new THREE.Vector3(hx, 5.2, z + 1.5), mid = a.clone().lerp(b, 0.5); mid.y -= 0.8;
    const crv = new THREE.QuadraticBezierCurve3(a, mid, b); mesh(new THREE.TubeGeometry(crv, 12, 0.015, 3), wire, 0, 0, 0, G, false);
    for (let i = 1; i < 7; i++) { const p = crv.getPoint(i / 7); mesh(new THREE.SphereGeometry(0.2, 10, 8), lanM, p.x, p.y - 0.3, p.z, G, false).scale.y = 1.25; }
    lightPool(0, z + 0.7, 4.2, new THREE.Color(0.32, 0.1, 0.05), G);
  }
  // 牌坊
  [-hz - 0.5, hz + 0.5].forEach(z => { [-hx, hx].forEach(x => box(0.5, 6, 0.5, M(0xa82a1a), x, 3, z, G)); box(hx * 2 + 1.5, 0.6, 0.6, M(0xa82a1a), 0, 6, z, G); box(hx * 2 + 2.5, 0.25, 1.2, M(0x2a2a2e), 0, 6.45, z, G); });
  plane(4, 1.1, new THREE.MeshBasicMaterial({ map: neonTex('唐人街夜市', '#ffd84a'), toneMapped: false, side: THREE.DoubleSide }), 0, 5.2, hz + 0.75, Math.PI, G);
  BATCH.push(Object.assign(staticBatch([G], new Set()), { cx: NM.x, cz: NM.z, r: 110 }));
  BATCH.push({ group: G, cx: NM.x, cz: NM.z, r: 110 });
  // 摊位（可破坏：把敌人打上去）
  const kinds = ['fruit', 'noodle', 'toy', 'lantern', 'fish'];
  let k = 0; for (let z = -hz + 4; z < hz - 2; z += 6.5) [-1, 1].forEach(s => { const g = mkStall(kinds[k++ % 5]); g.rotation.y = s > 0 ? -Math.PI / 2 : Math.PI / 2; addFurn('market', g, NM.x + s * (hx - 1.0), NM.z + z + (s > 0 ? 2 : 0), 0.55, 1.05, 1.0, 'stall', 699, { hp: 2 }); });
  [[-2, -12], [2.5, 3], [-1.5, 14]].forEach(([x, z]) => addFurn('market', mkBoxes(2), NM.x + x, NM.z + z, 0.42, 0.42, 1.3, 'boxes', 99, { hp: 1 }));
})();
FURN_SND.stall = 'woodBrk';
AREA_DEF.market = () => ({ cx: NM.x, cz: NM.z, hx: NM.hx - 0.4, hz: NM.hz - 0.5, room: false, sun: 0.7, sunC: 0x9ab0ff, hemi: [0x6a5a8a, 0x2a1a20, 1.2], fog: [0x140c18, 26, 95], night: true, occl: 1, follow: 1, ep4: 1, squad: 1 });
function marketWeapons() { [[-3, 16], [3, 12], [0, -2], [-4, -14]].forEach(([x, z], i) => spawnWeapon([W_CHAIR, 3, 8, 0][i], NM.x + x, NM.z + z)); }

// ---------- 芬恩 · 马符：马踏冲刺 + 绿色治疗圈（要打断） ----------
Object.assign(ETYPES, {
  finn7: { name: '芬恩 · 马符', hp: 1300, dmg: 16, spd: 3.6, radius: 0.45, scale: 1.06, beast: 1, elite: 1, rig: 'thug', tint: [1.35, 0.8, 0.75], kb: 0.3, dieMsg: '芬恩倒下了！<small>“马符……怎么不灵了……”</small>' },
});
{ const _fe = WHO.finn.e; WHO.finn.e = () => enemies.find(e => e.type === 'finn7') || _fe(); }
class FinnHorse extends SkinBoss {
  think(dt) {
    const S = this.state, p = player;
    if (S === 'heal') return this.runHeal(dt);
    if (S === 'dashW') { this.steer(dt, 0, 0, 0, 8); if (this.tele && !this.tele.fired && this.t < this.tele.wind * 0.7) this.face(dt, 5); return; }
    if (S === 'dash') return this.runDash(dt);
    if (S !== 'loco') return this.runAtk(dt);
    const d = this.chase(dt, 2.0, this.T.spd * (this.raged ? 1.15 : 1));
    if (!this.raged && this.hp < this.maxHp * 0.5) { this.raged = true; this.cdK = 0.75; banner('芬恩 · 马力全开！<small>治疗更快、冲刺连踏——治疗圈一亮就冲上去打断他</small>', 2.4); }
    if (this.cd > 0 || p.state === 'dead') return;
    this.healCd = (this.healCd ?? 6) - 0; const r = Math.random();
    if (now - (this.lastHeal || -99) > (this.raged ? 9 : 12) && (this.hp < this.maxHp * 0.85 || enemies.some(e => !e.dead && e !== this && e.hp < e.maxHp * 0.6))) return this.startHeal();
    if (d > 5.5) return r < 0.7 ? this.startDash() : (this.cd = 0.4);
    if (r < 0.55) this.kickCombo(); else if (r < 0.8) this.startDash(); else this.sweep();
  }
  kickCombo() {
    this.strike({ st: 'k1', D: 0.85, hit: 0.42, clip: 'kick_side', lunge: 4, dmg: 14, tele: { shape: 'sector', r: 2.7, arc: 0.85, col: 'amber' },
      next: () => this.strike({ st: 'k2', D: 1.0, hit: 0.5, clip: 'kick_round', lunge: 4, dmg: 16, kiai: 'kT', tele: { shape: 'sector', r: 2.9, arc: 0.95, col: 'amber' } }) });
  }
  sweep() { this.strike({ st: 'sw', D: 1.2, hit: 0.62, clip: 'sweep', dmg: 15, opts: { kd: 1, unblockable: 1 }, hy: 0.6, tele: { shape: 'circle', r: 2.5, col: 'red' } }); if (!MKT.told.sw) { MKT.told.sw = 1; tip('红圈扫堂腿：格挡没用，跳起来或闪开！', 2.2); } }
  startDash() {
    this.setState('dashW'); this.hitP = false; this.run = 0; this.dashN = this.raged ? 2 : 1;
    const len = clamp(Math.hypot(player.pos.x - this.pos.x, player.pos.z - this.pos.z) + 4, 7, 16); this.runMax = len;
    Foley.at('neigh', this.pos, { vol: 0.55 }); Foley.at('gallop', this.pos, { vol: 0.7 });
    this.tele = Tele.add({ shape: 'lane', x: this.pos.x, z: this.pos.z, yaw: this.yaw, w: 1.8, len, wind: 0.85, lock: 0.7, col: 'red', src: this,
      follow: (T) => { T.x = this.pos.x; T.z = this.pos.z; T.yaw = this.yaw; }, onFire: () => { this.tele = null; if (this.state === 'dashW') this.setState('dash'); } });
    if (!MKT.told.dash) { MKT.told.dash = 1; tip('马符 · 马踏！红线冲过来——往两边闪', 2); }
  }
  runDash(dt) {
    const sp = 15, fx = Math.sin(this.yaw), fz = Math.cos(this.yaw); this.vel.set(fx * sp, 0, fz * sp); this.run += sp * dt;
    if (Math.random() < dt * 30) burst(this.pos.clone().setY(0.1), 0x7dffb0, 2, 3);
    if (!this.hitP && Math.hypot(player.pos.x - this.pos.x, player.pos.z - this.pos.z) < 1.1 && player.pos.y < 1.4) { this.hitP = true; playerTakeHit(this, 18, { kd: 1, unblockable: 1 }); }
    const nx = this.pos.x + fx * 0.8, nz = this.pos.z + fz * 0.8;
    const st = FURN.list.find(f => !f.broken && f.area === 'market' && furnDist(f, nx, nz) < 0.2);
    if (st) breakFurn(st, new THREE.Vector2(fx, fz), 'boss');
    if (this.run > this.runMax || Math.abs(nx - AREA.cx) > AREA.hx || Math.abs(nz - AREA.cz) > AREA.hz) {
      this.vel.multiplyScalar(0.3);
      if (--this.dashN > 0) { this.face(1, 99); this.startDash(); this.dashN = 0; } else { this.setState('loco'); this.cd = rand(0.8, 1.2); }
    }
  }
  startHeal() {
    this.setState('heal'); this.lastHeal = now; this.healDmg = 0; this.cancelTele(); this.clip = null;
    this.tele = Tele.add({ shape: 'circle', x: this.pos.x, z: this.pos.z, r: 4.2, wind: 3.4, col: 'green', src: this, onFire: () => { this.tele = null; } });
    Foley.at('magic', this.pos, { vol: 0.7, rate: 1.2 }); Foley.at('neigh', this.pos, { vol: 0.4, rate: 1.2 });
    Story.bark('finn', this.raged ? '马符，再来一次！' : '马符——治好我！');
    if (!MKT.told.heal) { MKT.told.heal = 1; banner('马符 · 治疗！<small>绿圈里的人都在回血——冲进去打他：重击或连打 70 伤害就能打断</small>', 2.6); }
  }
  runHeal(dt) {
    this.steer(dt, 0, 0, 0, 8); this.threat = null;
    const k = this.raged ? 1.4 : 1;
    this.hp = Math.min(this.maxHp, this.hp + this.maxHp * 0.035 * k * dt);
    for (const e of enemies) if (e !== this && !e.dead && Math.hypot(e.pos.x - this.pos.x, e.pos.z - this.pos.z) < 4.2) e.hp = Math.min(e.maxHp || e.T.hp, e.hp + 12 * k * dt);
    if (Math.random() < dt * 30) burst(this.pos.clone().setY(rand(0.3, 2)), 0x7dffb0, 1, 2);
    if (this.t > 3.4) { this.setState('loco'); this.cd = 0.6; }
  }
  onHit(dmg, dir, m, counter) {
    if (this.state === 'heal') {
      this.healDmg += dmg;
      if (m.heavy || counter || this.healDmg >= 70) { this.cancelTele(); this.stun(2.2, '打断！', '#7dffb0'); Foley.at('clangS', this.pos, { vol: 0.6 }); MKT.breaks = (MKT.breaks || 0) + 1; if (MKT.breaks === 1) Story.bark('finn', '喂！别打断我！'); }
    }
  }
  pose(dt, v) {
    const sk = this.rig.sk; if (sk && sk.mixer && this.state === 'heal') { sk.set('heal', { npc_cheer: 1 }, null, 0.2); sk.update(dt); return; }
    if (sk && sk.mixer && this.state === 'dashW') { sk.set('dashW', { idle_box: 1 }, null, 0.15); sk.update(dt); return; }
    super.pose(dt, v);
  }
}
BEAST_CLS.finn7 = FinnHorse;
function marketScript(dt) {
  const fin = enemies.find(e => e.type === 'finn7'); if (!fin) return;
  const others = enemies.filter(e => !e.dead && e !== fin).length;
  const at = (dz) => [NM.x + rand(-3, 3), clamp(player.pos.z + dz, NM.z - NM.hz + 2, NM.z + NM.hz - 2)];
  if (MKT.stage === 0 && fin.hp < fin.maxHp * 0.75) { MKT.stage = 1; banner('增援！<small>黑手帮的打手从巷子里冲了出来</small>', 2); [['thug', -9], ['thug', 9], ['khan', -10]].forEach(([t, dz]) => { const [x, z] = at(dz); const e = spawnAt(t, x, z); e.cd = 1.4; }); }
  else if (MKT.stage === 1 && fin.hp < fin.maxHp * 0.4 && others <= 1) { MKT.stage = 2; banner('又来了！<small>铁臂打手</small>', 2); [['brute', -9], ['thug', 9]].forEach(([t, dz]) => { const [x, z] = at(dz); const e = spawnAt(t, x, z); e.cd = 1.6; }); Story.bark('finn', '兄弟们，围住他！'); }
}

// ================= 灵界：守护肉身 =================
const SOUL = { body: null, sp: 100, spawnQ: 0, t: 0, told: {}, on: false, lost: false };
(function buildSpirit() {
  const G = new THREE.Group(); G.position.set(SPR.x, 0, SPR.z); scene.add(G); AREA_GROUPS.spirit = G;
  const R = SPR.r;
  const ft = canvasTex(512, 512, (g, W) => { const gr = g.createRadialGradient(W / 2, W / 2, 20, W / 2, W / 2, W / 2); gr.addColorStop(0, '#5a4a8a'); gr.addColorStop(0.7, '#2a2050'); gr.addColorStop(1, '#100c24'); g.fillStyle = gr; g.fillRect(0, 0, W, W); g.strokeStyle = 'rgba(180,200,255,.35)'; g.lineWidth = 3; for (let r = 60; r < 256; r += 48) { g.beginPath(); g.arc(W / 2, W / 2, r, 0, TAU); g.stroke(); } for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; g.beginPath(); g.moveTo(W / 2 + Math.cos(a) * 60, W / 2 + Math.sin(a) * 60); g.lineTo(W / 2 + Math.cos(a) * 250, W / 2 + Math.sin(a) * 250); g.stroke(); } g.fillStyle = 'rgba(220,230,255,.8)'; g.font = 'bold 40px "Noto Sans SC",serif'; g.textAlign = 'center'; '鼠牛虎兔龙蛇马羊猴鸡狗猪'.split('').forEach((c, i) => { const a = i / 12 * TAU - Math.PI / 2; g.fillText(c, W / 2 + Math.cos(a) * 220, W / 2 + Math.sin(a) * 220 + 14); }); });
  const fl = mesh(new THREE.CircleGeometry(R + 0.5, 64), M(0xffffff, { map: ft, emissive: 0x18142a }), 0, 0.002, 0, G, false); fl.rotation.x = -Math.PI / 2; fl.receiveShadow = true;
  mesh(new THREE.CylinderGeometry(R + 0.5, R - 1, 3, 48, 1, true), M(0x2a2050, { side: THREE.DoubleSide }), 0, -1.5, 0, G, false);
  const rim = mesh(new THREE.TorusGeometry(R + 0.5, 0.08, 6, 64), glowMat(0.8, 1.2, 2.6), 0, 0.05, 0, G, false); rim.rotation.x = Math.PI / 2;
  // 漂浮的石块与鬼火
  for (let i = 0; i < 40; i++) { const a = rand(0, TAU), r = rand(R + 4, R + 40), y = rand(-6, 14), s = rand(0.5, 2.6); const m = mesh(new THREE.DodecahedronGeometry(s, 0), M(0x3a3060, { emissive: 0x0a0818 }), Math.cos(a) * r, y, Math.sin(a) * r, G, false); m.rotation.set(rand(0, 3), rand(0, 3), 0); }
  for (let i = 0; i < 18; i++) { const a = i / 18 * TAU; mesh(new THREE.SphereGeometry(0.16, 8, 6), glowMat(0.6, 1.4, 3), Math.cos(a) * (R + 1.5), 1.6 + Math.sin(i) * 0.6, Math.sin(a) * (R + 1.5), G, false); }
  BATCH.push(Object.assign(staticBatch([G], new Set()), { cx: SPR.x, cz: SPR.z, r: 120 }));
  BATCH.push({ group: G, cx: SPR.x, cz: SPR.z, r: 120 });
})();
AREA_DEF.spirit = () => ({ cx: SPR.x, cz: SPR.z, hx: SPR.r, hz: SPR.r, round: SPR.r, room: false, sun: 0.9, sunC: 0xa8b8ff, hemi: [0x8a80d8, 0x1a1430, 1.3], fog: [0x120e26, 28, 110], night: true, ep4: 1, occl: 1 });
// 肉身：躺在阵中央的成龙
function soulBody() {
  if (SOUL.body) return SOUL.body;
  const rig = makeSkinRig('jackie', 1); rig.root.position.set(SPR.x, 0, SPR.z); scene.add(rig.root);
  const glow = mesh(new THREE.RingGeometry(1.0, 1.25, 40), new THREE.MeshBasicMaterial({ color: 0x9ab8ff, transparent: true, opacity: 0.6, toneMapped: false, side: THREE.DoubleSide, depthWrite: false }), SPR.x, 0.04, SPR.z, scene, false); glow.rotation.x = -Math.PI / 2;
  SOUL.body = { rig, glow, pos: new THREE.Vector3(SPR.x, 0, SPR.z) }; return SOUL.body;
}
function updateSoulBody(dt) {
  const B = SOUL.body; if (!B) return; const sk = B.rig.sk; const vis = AREA.name === 'spirit';
  B.rig.root.visible = vis; B.glow.visible = vis && SOUL.on; if (!vis || !sk || !sk.mixer) return;
  sk.set('lie', { kd_back: 1 }, null, 0.01); sk.time('kd_back', 2.04); sk.update(dt);
  B.glow.material.opacity = 0.35 + 0.25 * Math.sin(now * 3) + (SOUL.drain ? 0.4 : 0); B.glow.material.color.setHex(SOUL.drain ? 0xff6a8a : 0x9ab8ff);
}
// 灵魂形态：玩家半透明发蓝
function spiritForm(on) {
  player.rig.root.traverse(o => { if (o.isMesh && o.material) { const m = o.material; if (on) { if (m.userData.sp0 == null) m.userData.sp0 = { t: m.transparent, o: m.opacity }; m.transparent = true; m.opacity = 0.62; if (m.emissive) m.emissive.setRGB(0.05, 0.12, 0.35); } else if (m.userData.sp0) { m.transparent = m.userData.sp0.t; m.opacity = m.userData.sp0.o; if (m.emissive) m.emissive.setRGB(0, 0, 0); m.userData.sp0 = null; } m.needsUpdate = true; } });
  SOUL.form = on;
}
// HUD：肉身灵魂值
document.head.insertAdjacentHTML('beforeend', `<style>#soulhud{position:fixed;left:50%;top:78px;transform:translateX(-50%);width:320px;padding:7px 12px;border-radius:12px;background:rgba(10,8,26,.72);border:1px solid rgba(150,180,255,.4);font:12px "Noto Sans SC",sans-serif;color:#dfe6ff;display:none;pointer-events:none;z-index:6;text-align:center}#soulhud .bar{height:10px;border-radius:5px;background:#1a1a30;overflow:hidden;margin-top:4px}#soulhud .bar i{display:block;height:100%;width:100%;background:linear-gradient(90deg,#6a8aff,#bfe0ff)}</style>`);
document.body.insertAdjacentHTML('beforeend', '<div id="soulhud"><b>肉身 · 灵魂之力</b> <span id="soult"></span><div class="bar"><i id="soulb"></i></div></div>');
// 游魂：飘向肉身，靠近后附身吸取灵魂之力；会顺手抓挠靠近的成龙
Object.assign(ETYPES, {
  wraith: { name: '游魂', hp: 45, dmg: 9, spd: 2.6, radius: 0.4, scale: 1, beast: 1, hover: 0.35 },
  wraithB: { name: '大游魂', hp: 120, dmg: 13, spd: 2.2, radius: 0.55, scale: 1.35, beast: 1, hover: 0.35, elite: 1 },
});
class Wraith extends Beast {
  build() {
    const R = this.rig.root, s = this.scale, body = this.mat(0xc8d8ff, { emissive: 0x2a3a8a, transparent: true, opacity: 0.72 });
    const g = this.body = new THREE.Group(); R.add(g); g.scale.setScalar(s);
    const robe = mesh(new THREE.ConeGeometry(0.45, 1.5, 12, 1, true), body, 0, 0.8, 0, g, false); robe.material.side = THREE.DoubleSide;
    mesh(new THREE.SphereGeometry(0.3, 12, 10), body, 0, 1.7, 0, g, false);
    this.eyeM = glowMat(0.4, 2.2, 3.5); [-1, 1].forEach(k => mesh(new THREE.SphereGeometry(0.05, 6, 5), this.eyeM, k * 0.11, 1.74, 0.26, g, false));
    this.arms = [-1, 1].map(k => { const a = new THREE.Group(); a.position.set(k * 0.3, 1.35, 0); g.add(a); mesh(new THREE.CylinderGeometry(0.05, 0.03, 0.7, 6), body, 0, -0.3, 0.1, a, false).rotation.x = 0.6; return a; });
    for (let i = 0; i < 5; i++) mesh(new THREE.ConeGeometry(0.1, 0.4, 5), body, Math.cos(i * 1.3) * 0.35, 0.05, Math.sin(i * 1.3) * 0.35, g, false).rotation.x = Math.PI;
    this.kbScale = 0.8; this.hbY = 2.1;
  }
  think(dt) {
    const B = SOUL.body, p = player; if (!B) return;
    const tb = Math.hypot(B.pos.x - this.pos.x, B.pos.z - this.pos.z), dp = Math.hypot(p.pos.x - this.pos.x, p.pos.z - this.pos.z);
    if (this.state === 'drain') {
      this.steer(dt, 0, 0, 0, 6); this.face(dt, 6, B.pos); SOUL.drainN++;
      if (SOUL.drainN <= 3) SOUL.sp -= dt * (this.T.elite ? 3.2 : 2.0); if (Math.random() < dt * 20) burst(B.pos.clone().setY(0.6), 0xff6a8a, 1, 2);
      if (!SOUL.told.drain) { SOUL.told.drain = 1; tip('游魂在吸你肉身的灵魂之力！快把它打走！', 2.2); Story.bark('jackie', '喂！那是我的身体！'); }
      if (dp < 1.6 && this.cd <= 0) this.claw();
      return;
    }
    if (this.state === 'claw') { this.steer(dt, 0, 0, 0, 8); this.face(dt, 6); if (this.t > 0.95) { this.setState(this.prevS || 'loco'); this.cd = rand(1.2, 2); } return; }
    // 先去肉身；成龙挡在路上就抓他
    if (dp < 1.5 && this.cd <= 0) return this.claw();
    const tx = B.pos.x - this.pos.x, tz = B.pos.z - this.pos.z, l = Math.hypot(tx, tz) || 1;
    this.face(dt, 4, B.pos);
    let fx = tx / l, fz = tz / l; [fx, fz] = this.sep(fx, fz, 1.1);
    this.steer(dt, fx, fz, this.T.spd, 3);
    if (tb < 1.35) { this.setState('drain'); Foley.at('ghost', this.pos, { vol: 0.5, rate: 1.1 }); }
  }
  claw() {
    this.prevS = this.state === 'drain' ? 'drain' : 'loco'; this.setState('claw'); this.cd = 1.5;
    this.tele = Tele.add({ shape: 'sector', x: this.pos.x, z: this.pos.z, yaw: this.yaw, r: 1.9, arc: 0.8, wind: 0.55, lock: 0.7, col: 'amber', src: this, follow: (T) => { T.x = this.pos.x; T.z = this.pos.z; T.yaw = this.yaw; },
      onFire: (T) => { this.tele = null; if (Tele.inside(T, player.pos)) playerTakeHit(this, this.T.dmg, {}); } });
  }
  onHit(dmg, dir) { if (this.state === 'drain' || this.state === 'claw') { this.cancelTele(); this.setState('loco'); this.cd = 0.8; } this.vel.x += dir.x * 3; this.vel.z += dir.y * 3; Foley.at('ghost', this.pos, { vol: 0.35, rate: 1.5 }); }
  pose(dt) {
    const g = this.body; g.position.y = Math.sin(now * 2.4 + this.ph) * 0.12; g.rotation.z = Math.sin(now * 1.7 + this.ph) * 0.08;
    const a = this.state === 'claw' ? Math.sin(Math.min(1, this.t / 0.55) * Math.PI) * -1.6 : this.state === 'drain' ? -1.1 + Math.sin(now * 8) * 0.2 : Math.sin(now * 3 + this.ph) * 0.2;
    this.arms.forEach(A => A.rotation.x = a);
  }
  parried() { this.release(); this.cancelTele(); this.stun(1.2, '破绽!'); }
  die(dir) { super.die(dir); burst(this.pos.clone().setY(1.2), 0xbfd8ff, 30, 4); Foley.at('ghost', this.pos, { vol: 0.6, rate: 0.7 }); }
  deathAnim(dt) { const s = Math.max(0.01, 1 - this.t / 0.6); this.rig.root.scale.setScalar(s); this.body.position.y += dt * 2; if (this.t > 0.6) { scene.remove(this.rig.root); this.gone = true; } }
}
BEAST_CLS.wraith = Wraith; BEAST_CLS.wraithB = Wraith;
function spiritScript(dt) {
  SOUL.t += dt; SOUL.drainN = 0;
  if (SOUL.spawnQ > 0 && (SOUL.spawnT = (SOUL.spawnT ?? 2) - dt) <= 0 && enemies.filter(e => !e.dead).length < 6) {
    const n = Math.min(SOUL.spawnQ, SOUL.t > 40 ? 3 : 2); SOUL.spawnT = SOUL.t > 40 ? 4.2 : 5.2;
    for (let i = 0; i < n; i++) { const a = rand(0, TAU), big = SOUL.spawnQ <= 3 && Math.random() < 0.5; const e = spawnAt(big ? 'wraithB' : 'wraith', SPR.x + Math.cos(a) * (SPR.r - 1), SPR.z + Math.sin(a) * (SPR.r - 1)); e.cd = 1; shock(e.pos.clone().setY(0.05), 0xc04dff, 1.4); burst(e.pos.clone().setY(1), 0xc04dff, 16, 3); SOUL.spawnQ--; }
    Foley.at('ghost', player.pos, { vol: 0.4 });
  }
  SOUL.drain = enemies.some(e => !e.dead && e.state === 'drain');
  const h = $('soulhud'); h.style.display = SOUL.on && !cutscene && !gameOver ? 'block' : 'none';
  $('soulb').style.width = Math.max(0, SOUL.sp) + '%'; $('soult').textContent = `${Math.max(0, SOUL.sp) | 0}% · 剩余游魂 ${SOUL.spawnQ + enemies.filter(e => !e.dead).length}`;
  if (SOUL.sp <= 0 && !SOUL.lost) { SOUL.lost = true; SOUL.on = false; banner('肉身被占据了……<small>灵魂之力耗尽</small>', 2.5); player.hp = 0; setState(player, 'dead', 0.05); gameEnd(false); }
}

// ================= 梦魇：阿周 · 羊符 =================
(function buildDream() {
  const G = new THREE.Group(); G.position.set(DRM.x, 0, DRM.z); scene.add(G); AREA_GROUPS.dream = G;
  const R = DRM.r;
  const ft = canvasTex(512, 512, (g, W) => { const n = 12, s = W / n; for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) { g.fillStyle = (r + c) % 2 ? '#e8e0f0' : '#1a1024'; g.fillRect(c * s, r * s, s, s); } g.fillStyle = 'rgba(80,0,40,.25)'; g.fillRect(0, 0, W, W); });
  const fl = mesh(new THREE.CircleGeometry(R + 0.4, 64), M(0xffffff, { map: ft }), 0, 0.002, 0, G, false); fl.rotation.x = -Math.PI / 2; fl.receiveShadow = true;
  const rim = mesh(new THREE.TorusGeometry(R + 0.4, 0.1, 6, 64), glowMat(2.4, 0.3, 1.4), 0, 0.05, 0, G, false); rim.rotation.x = Math.PI / 2;
  // 漂浮的门、钟、床、楼梯：梦里的碎片
  const wood = M(0x5a3a2a), wh = M(0xe8e0d0);
  for (let i = 0; i < 9; i++) { const a = i / 9 * TAU + 0.3, r = R + rand(5, 12), y = rand(2, 9); const d = new THREE.Group(); d.position.set(Math.cos(a) * r, y, Math.sin(a) * r); d.rotation.set(rand(-0.5, 0.5), rand(0, TAU), rand(-0.6, 0.6)); G.add(d); box(1.2, 2.3, 0.1, i % 2 ? wood : wh, 0, 0, 0, d); box(0.1, 0.1, 0.12, M(0xd8b04a), 0.4, 0, 0.06, d); }
  const clk = new THREE.Group(); clk.position.set(0, 9, -R - 8); clk.rotation.x = 0.25; G.add(clk);
  mesh(new THREE.CylinderGeometry(4, 4, 0.4, 40), wh, 0, 0, 0, clk, false).rotation.x = Math.PI / 2; mesh(new THREE.TorusGeometry(4, 0.25, 8, 40), M(0x2a1a2a), 0, 0, 0.2, clk, false);
  for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; box(0.18, 0.6, 0.1, M(0x1a1024), Math.sin(a) * 3.4, Math.cos(a) * 3.4, 0.25, clk).rotation.z = -a; }
  DRM.hands = [box(0.15, 2.6, 0.1, M(0x1a1024), 0, 1.1, 0.35, clk), box(0.2, 1.8, 0.1, M(0x6a1a3a), 0, 0.7, 0.4, clk)];
  DRM.hands.forEach(h => { h.geometry.translate(0, h.geometry.parameters.height / 2 - 0.1, 0); h.position.y = 0; });
  // 天上的巨眼（第二阶段睁开）
  const eye = DRM.eye = new THREE.Group(); eye.position.set(0, 13, -R - 4); G.add(eye);
  DRM.eyeW = mesh(new THREE.SphereGeometry(3, 24, 16), M(0xf0e8e8, { emissive: 0x401020 }), 0, 0, 0, eye, false); DRM.eyeW.scale.set(1.6, 0.05, 1);
  DRM.pupil = mesh(new THREE.SphereGeometry(1.1, 16, 12), glowMat(3, 0.2, 1.2), 0, 0, 2.6, eye, false); DRM.pupil.visible = false;
  BATCH.push(Object.assign(staticBatch([G], new Set([clk, eye])), { cx: DRM.x, cz: DRM.z, r: 120 }));
  BATCH.push({ group: G, cx: DRM.x, cz: DRM.z, r: 120 });
})();
AREA_DEF.dream = () => ({ cx: DRM.x, cz: DRM.z, hx: DRM.r, hz: DRM.r, round: DRM.r, room: false, sun: 1.0, sunC: 0xffb0d8, hemi: [0x8a5a9a, 0x200a1a, 1.25], fog: [0x1a0a1c, 30, 120], night: true, ep4: 1, occl: 1 });
Object.assign(ETYPES, {
  chow7: { name: '阿周 · 梦魇', hp: 1700, dmg: 15, spd: 3.9, radius: 0.42, scale: 0.98, beast: 1, elite: 1, rig: 'thug', tint: [0.85, 1.3, 0.85], kb: 0.35, dieMsg: '阿周倒下了！<small>“这……这只是一场梦……对吧？”</small>' },
  chowF: { name: '阿周？', hp: 1, dmg: 12, spd: 3.9, radius: 0.42, scale: 0.98, beast: 1, rig: 'thug', tint: [0.85, 1.3, 0.85], kb: 1 },
});
{ const _ce = WHO.chow.e; WHO.chow.e = () => enemies.find(e => e.type === 'chow7') || _ce(); }
const DREAM = { eyeT: 0, eyeOn: false, told: {}, fakes: 0 };
class ChowNight extends SkinBoss {
  onLoaded() { this.rig.root.traverse(o => { if (o.isMesh) o.castShadow = true; }); }
  think(dt) {
    const S = this.state;
    if (S === 'blink') { this.steer(dt, 0, 0, 0, 10); if (this.t > 0.5) { this.setState('loco'); this.cd = 0.3; } return; }
    if (S !== 'loco') return this.runAtk(dt);
    const d = this.chase(dt, 2.0);
    if (!this.raged && this.hp < this.maxHp * 0.5) { this.raged = true; this.cdK = 0.8; DREAM.eyeOn = true; DREAM.eyeT = 5; banner('梦魇加深……<small>天上的巨眼睁开了：它盯着你时，按住格挡（闭上眼睛）</small>', 2.8); Story.bark('chow', '在梦里，我说了算！'); }
    if (this.cd > 0 || player.state === 'dead') return;
    const r = Math.random(), fakes = enemies.filter(e => e.type === 'chowF' && !e.dead).length;
    if (!fakes && now - (this.lastIll || -99) > (this.raged ? 11 : 15)) return this.illusion();
    if (d > 6 || r < 0.22) return this.blinkTo();
    if (r < 0.62) this.slashCombo(); else this.handsUp();
  }
  slashCombo() {
    this.strike({ st: 's1', D: 0.7, hit: 0.36, clip: 'jab', lunge: 5, dmg: 12, tele: { shape: 'sector', r: 2.4, arc: 0.8, col: 'amber' },
      next: () => this.strike({ st: 's2', D: 0.75, hit: 0.38, clip: 'hook', lunge: 5, dmg: 13, tele: { shape: 'sector', r: 2.5, arc: 0.85, col: 'amber' },
        next: this.raged ? () => this.strike({ st: 's3', D: 1.0, hit: 0.52, clip: 'kick_spin', lunge: 4, dmg: 18, kiai: 'kT', opts: { kd: 1 }, tele: { shape: 'sector', r: 2.8, arc: 1.0, col: 'amber' } }) : null }) });
  }
  blinkTo() { // 瞬移到玩家身后
    this.setState('blink'); burst(this.pos.clone().setY(1), 0x9cff8a, 24, 4); Foley.at('tele', this.pos, { vol: 0.6 });
    const a = player.yaw + Math.PI + rand(-0.6, 0.6); const x = player.pos.x + Math.sin(a) * 2.6, z = player.pos.z + Math.cos(a) * 2.6;
    const dx = x - DRM.x, dz = z - DRM.z, l = Math.hypot(dx, dz), Rr = DRM.r - 1; this.pos.set(l > Rr ? DRM.x + dx / l * Rr : x, 0, l > Rr ? DRM.z + dz / l * Rr : z);
    this.face(1, 99); burst(this.pos.clone().setY(1), 0x9cff8a, 24, 4);
    if (!DREAM.told.blink) { DREAM.told.blink = 1; tip('阿周会瞬移到你背后——留意身后的琥珀色预警', 2); }
  }
  handsUp() { // 梦魇之手：连续三次红圈追着脚下冒出来
    this.act('cast', 2.1, 2.1, 'boss_roar'); this.lunge = 0; Story.bark('chow', ['抓住他！', '别想跑！'][Math.random() * 2 | 0]);
    for (let i = 0; i < 3; i++) Story.timers.push({ t: 0.15 + i * 0.55, f: () => { if (this.dead || AREA.name !== 'dream') return; const x = player.pos.x + player.vel.x * 0.35, z = player.pos.z + player.vel.z * 0.35;
      Tele.add({ shape: 'circle', x, z, r: 1.5, wind: 0.75, col: 'red', src: this, onFire: (T) => { burst(new THREE.Vector3(T.x, 0.4, T.z), 0x3a0a2a, 30, 5); shock(new THREE.Vector3(T.x, 0.05, T.z), 0xff3a8a, 1.6); Foley.at('rock', new THREE.Vector3(T.x, 0, T.z), { vol: 0.5, rate: 1.3 }); dreamHand(T.x, T.z); if (Tele.inside(T, player.pos) && player.pos.y < 1.2) playerTakeHit(this, 16, { kd: 1, unblockable: 1 }); } }); } });
    if (!DREAM.told.hands) { DREAM.told.hands = 1; tip('梦魇之手！红圈会追着你的脚下冒出来——一直移动', 2.2); }
  }
  illusion() { // 分身：两个假的一起出手；打中真身全部消散，打中假的它就碎
    this.lastIll = now; this.act('cast', 1.1, 1.1, 'boss_roar'); Foley.at('magic', this.pos, { vol: 0.7, rate: 0.8 });
    Story.bark('chow', '猜猜哪个是我？');
    Story.timers.push({ t: 0.5, f: () => {
      if (this.dead) return; const base = Math.atan2(this.pos.x - player.pos.x, this.pos.z - player.pos.z), R = 4;
      const slots = [0, 1, 2].map(i => base + (i - 1) * 2.1).sort(() => Math.random() - 0.5);
      slots.forEach((a, i) => {
        const x = player.pos.x + Math.sin(a) * R, z = player.pos.z + Math.cos(a) * R;
        const e = i === 0 ? this : spawnAt('chowF', x, z); e.pos.set(x, 0, z); e.yaw = Math.atan2(player.pos.x - x, player.pos.z - z); e.cd = 0.4 + i * 0.25; burst(e.pos.clone().setY(1), 0x9cff8a, 26, 4);
        if (e !== this) { e.boss = this; e.hb.style.display = 'none'; DREAM.fakes++; }
      });
      if (!DREAM.told.ill) { DREAM.told.ill = 1; banner('分身术！<small>三个阿周里只有一个是真的——打中真身，假的全部消散（真身脚下有影子）</small>', 2.6); }
    } });
  }
  onHit() { if (this.state !== 'dead') enemies.filter(e => e.type === 'chowF' && !e.dead).forEach(e => e.vanish(true)); }
  pose(dt, v) { const sk = this.rig.sk; if (sk && sk.mixer && this.state === 'blink') { sk.set('blink', { idle_box: 1 }, null, 0.05); sk.update(dt); return; } super.pose(dt, v); }
}
class ChowFake extends ChowNight {
  onLoaded() { this.rig.root.traverse(o => { if (o.isMesh) { o.castShadow = false; } }); this.rig.mats.forEach(m => { m.transparent = true; m.opacity = 0.9; }); }
  think(dt) { if (this.state === 'loco' && this.cd <= 0) { this.slashCombo(); return; } if (this.state !== 'loco') return this.runAtk(dt); this.chase(dt, 2.0); if (now - this.born > 9) this.vanish(false); }
  update(dt) { if (this.born == null) this.born = now; super.update(dt); if (!this.dead) this.rig.root.visible = Math.random() > 0.04; }
  takeHit(dmg, dir) { if (this.dead) return; floatText(this.pos.clone().setY(2.2), '假的！', '#9cff8a', 24); this.vanish(true); }
  vanish(hit) { if (this.dead) return; this.cancelTele(); this.dead = true; this.gone = true; this.hb.remove(); burst(this.pos.clone().setY(1), 0x9cff8a, 30, 5); Foley.at('tele', this.pos, { vol: 0.4, rate: 1.4 }); scene.remove(this.rig.root); }
}
BEAST_CLS.chow7 = ChowNight; BEAST_CLS.chowF = ChowFake;
function dreamHand(x, z) {
  const g = new THREE.Group(); g.position.set(x, -1.5, z); scene.add(g); const m = M(0x1a0a1a, { emissive: 0x2a0018 });
  mesh(new THREE.CylinderGeometry(0.22, 0.32, 2.2, 8), m, 0, 1.1, 0, g, false); for (let i = 0; i < 5; i++) { const f = mesh(new THREE.ConeGeometry(0.07, 0.6, 5), m, Math.cos(i * 1.25) * 0.2, 2.4, Math.sin(i * 1.25) * 0.2, g, false); f.rotation.set(Math.sin(i) * 0.4, 0, Math.cos(i) * 0.4); }
  DREAM.handsL = DREAM.handsL || []; DREAM.handsL.push({ g, t: 0 });
}
function dreamScript(dt) {
  for (let i = (DREAM.handsL || []).length - 1; i >= 0; i--) { const H = DREAM.handsL[i]; H.t += dt; H.g.position.y = H.t < 0.2 ? -1.5 + H.t / 0.2 * 1.5 : H.t < 1 ? 0 : -(H.t - 1) * 3; if (H.t > 1.6) { scene.remove(H.g); DREAM.handsL.splice(i, 1); } }
  if (DRM.hands) { DRM.hands[0].rotation.z = -now * 2.2; DRM.hands[1].rotation.z = -now * 0.5; }
  const chow = enemies.find(e => e.type === 'chow7' && !e.dead);
  // 巨眼凝视：睁眼 1.6 秒（紫色），在你身上定格时没按格挡就被吓住
  if (DREAM.eyeOn && chow && !cutscene) {
    DREAM.eyeT -= dt; const W = DRM.eyeW;
    if (DREAM.eyeT <= 1.6 && DREAM.eyeT > 0) { W.scale.y = lerp(W.scale.y, 0.75, 1 - Math.exp(-dt * 8)); DRM.pupil.visible = true; if (!DREAM.stare) { DREAM.stare = 1; Foley.at('ghost', player.pos, { vol: 0.8, rate: 0.6 }); Foley.at('beam', player.pos, { vol: 0.4, rate: 0.6 }); floatText(player.pos.clone().setY(2.4), '巨眼在看你——按住格挡闭眼！', '#c04dff', 26); } $('hurt') && ($('hurt').style.boxShadow = 'inset 0 0 120px rgba(192,77,255,.55)'); }
    if (DREAM.eyeT <= 0) {
      DREAM.eyeT = rand(8, 11); DREAM.stare = 0; DRM.pupil.visible = false; W.scale.y = 0.05; $('hurt') && ($('hurt').style.boxShadow = '');
      if (player.guard || player.iframe > 0) { floatText(player.pos.clone().setY(2), '闭眼！没被吓到', '#9fe', 24); DREAM.shut = (DREAM.shut || 0) + 1; }
      else { playerTakeHit({ pos: player.pos.clone().add(new THREE.Vector3(0, 0, -1)), parried() { } }, 14, { unblockable: 1 }); player.st = Math.max(0, player.st - 50); floatText(player.pos.clone().setY(2.3), '被吓住了！', '#c04dff', 28); slowmo = Math.max(slowmo, 0.3); }
    }
  } else if (DRM.eyeW) { DRM.eyeW.scale.y = 0.05; DRM.pupil.visible = false; }
}
window.__ep7 = { NM, SPR, DRM, MKT, SOUL, DREAM, FinnHorse, Wraith, ChowNight, soulBody, spiritForm, marketScript, spiritScript, dreamScript };
