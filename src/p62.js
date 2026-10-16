// ================= 第八集 · 猴与兔：马戏团 / 货运站 / 调车转盘 =================
const CIR = { x: 0, z: 960, r: 13 };
const RY = { x: 220, z: 960, hx: 14, hz: 12 };
const TT = { x: -220, z: 960, r: 13 };
const P8 = { mk: false, mkT: 0, inHit: false, told: {}, stage: 0, beams: 0, mkN: 0 };
const stripeTex = (a, b, n = 16) => canvasTex(512, 256, (g, W, H) => { const s = W / n; for (let i = 0; i < n; i++) { g.fillStyle = i % 2 ? a : b; g.fillRect(i * s, 0, s, H); } });
// ---------- 马戏团大帐篷 ----------
(function buildCircus() {
  const G = new THREE.Group(); G.position.set(CIR.x, 0, CIR.z); scene.add(G); AREA_GROUPS.circus = G;
  const R = CIR.r;
  const ft = canvasTex(512, 512, (g, W) => { g.fillStyle = '#b08a5a'; g.fillRect(0, 0, W, W); for (let i = 0; i < 2500; i++) { g.fillStyle = `rgba(${Math.random() < 0.5 ? '90,60,30' : '220,190,140'},.35)`; g.fillRect(Math.random() * W, Math.random() * W, 3, 2); } g.strokeStyle = '#f0e0c0'; g.lineWidth = 10; g.beginPath(); g.arc(W / 2, W / 2, W * 0.3, 0, TAU); g.stroke(); });
  const fl = mesh(new THREE.CircleGeometry(R + 4, 64), M(0xffffff, { map: ft }), 0, 0.002, 0, G, false); fl.rotation.x = -Math.PI / 2; fl.receiveShadow = true;
  // 场地边沿：红白相间的矮墙
  for (let i = 0; i < 32; i++) { const a = i / 32 * TAU; const b = box(R * TAU / 32 + 0.05, 0.5, 0.35, M(i % 2 ? 0xd8302a : 0xf4ecd8), Math.sin(a) * (R + 0.3), 0.25, Math.cos(a) * (R + 0.3), G); b.rotation.y = a; }
  // 帐篷：条纹墙 + 锥形顶
  const wall = mesh(new THREE.CylinderGeometry(R + 9, R + 9, 7, 40, 1, true), M(0xffffff, { map: stripeTex('#c8241e', '#f4ecd8', 24), side: THREE.DoubleSide }), 0, 3.5, 0, G, false);
  const roof = mesh(new THREE.ConeGeometry(R + 9.5, 9, 40, 1, true), M(0xffffff, { map: stripeTex('#c8241e', '#f4ecd8', 24), side: THREE.DoubleSide }), 0, 11.5, 0, G, false);
  box(0.4, 16, 0.4, M(0x6a4a2a), 0, 8, 0, G);
  // 看台
  for (let k = 0; k < 4; k++) for (let i = 0; i < 28; i++) { const a = i / 28 * TAU; if (Math.abs(angDiff(a, 0)) < 0.35) continue; const r = R + 2 + k * 1.4; const b = box(r * TAU / 28 * 0.96, 0.5 + k * 0.6, 1.3, M(k % 2 ? 0x5a3a8a : 0x3a2a6a), Math.sin(a) * r, (0.5 + k * 0.6) / 2, Math.cos(a) * r, G); b.rotation.y = a; }
  // 彩旗与灯泡
  const lb = glowMat(3, 2.4, 1.2);
  for (let i = 0; i < 24; i++) { const a = i / 24 * TAU; const p0 = new THREE.Vector3(0, 15, 0), p1 = new THREE.Vector3(Math.sin(a) * (R + 8), 6.8, Math.cos(a) * (R + 8)); for (let j = 1; j < 6; j++) { const p = p0.clone().lerp(p1, j / 6); p.y -= Math.sin(j / 6 * Math.PI) * 1.2; mesh(new THREE.SphereGeometry(0.12, 6, 4), lb, p.x, p.y, p.z, G, false); } }
  // 火圈、平衡球道具
  [[-6, -5], [6, -4]].forEach(([x, z]) => { const h = mesh(new THREE.TorusGeometry(1.1, 0.08, 8, 24), glowMat(3, 1.2, 0.2), x, 1.6, z, G, false); h.rotation.y = 0.6; box(0.1, 0.6, 0.1, M(0x333333), x, 0.3, z, G); });
  lightPool(0, 0, 7, new THREE.Color(0.35, 0.25, 0.12), G); lightPool(-5, 4, 3.5, new THREE.Color(0.3, 0.05, 0.08), G); lightPool(5, 4, 3.5, new THREE.Color(0.05, 0.12, 0.3), G);
  BATCH.push(Object.assign(staticBatch([G], new Set()), { cx: CIR.x, cz: CIR.z, r: 120 }));
  BATCH.push({ group: G, cx: CIR.x, cz: CIR.z, r: 120 });
  // 可破坏：表演鼓台、道具箱
  const drumM = M(0xd8302a), drumT = M(0xf0d070);
  [[-4, 3], [4, 2.5], [0, -7], [-8, -2], [8, -1]].forEach(([x, z], i) => { const g = new THREE.Group(); mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.8, 18), i % 2 ? drumM : M(0x2a5ad8), 0, 0.4, 0, g); mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.08, 18), drumT, 0, 0.82, 0, g); addFurn('circus', g, CIR.x + x, CIR.z + z, 0.6, 0.6, 0.85, 'boxes', 450, { hp: 2 }); });
  [[-10, 4], [10, 5]].forEach(([x, z]) => addFurn('circus', mkBoxes(2), CIR.x + x, CIR.z + z, 0.42, 0.42, 1.3, 'boxes', 120, { hp: 1 }));
})();
AREA_DEF.circus = () => ({ cx: CIR.x, cz: CIR.z, hx: CIR.r, hz: CIR.r, round: CIR.r, room: false, sun: 0.6, sunC: 0xffd0a0, hemi: [0x8a6a5a, 0x2a1a10, 1.25], fog: [0x1a1010, 30, 100], night: true, occl: 1, ep4: 1 });
function circusWeapons() { [[-3, 6], [3, 6], [-7, -6]].forEach(([x, z], i) => spawnWeapon([W_CHAIR, 0, 3][i], CIR.x + x, CIR.z + z)); }
// ---------- 被猴符变成的小猴子（沿用铜鼠的行为） ----------
Object.assign(ETYPES, { ape: { name: '小猴子（打手）', hp: 34, dmg: 7, spd: 5.0, radius: 0.36, scale: 0.75, beast: 1 } });
class Ape extends Rat {
  build() {
    const R = this.rig.root, s = this.scale, fur = this.mat(0x8a5a32, { roughness: 0.9 }), face = this.mat(0xe8b090, { roughness: 0.8 }), dk = this.mat(0x4a2a14, { roughness: 0.9 });
    const g = this.body = new THREE.Group(); R.add(g); g.scale.setScalar(s);
    mesh(new THREE.SphereGeometry(0.4, 14, 10), fur, 0, 0.5, 0, g).scale.set(0.8, 0.85, 1.1);
    const hd = this.head = new THREE.Group(); hd.position.set(0, 0.78, 0.38); g.add(hd);
    mesh(new THREE.SphereGeometry(0.25, 12, 10), fur, 0, 0, 0, hd);
    mesh(new THREE.SphereGeometry(0.17, 10, 8), face, 0, -0.04, 0.14, hd).scale.set(1.1, 0.9, 0.7);
    [-1, 1].forEach(k => mesh(new THREE.SphereGeometry(0.09, 8, 6), face, k * 0.25, 0.04, 0, hd).scale.set(0.5, 1, 1));
    this.eyeM = glowMat(0.2, 0.15, 0.1); [-1, 1].forEach(k => mesh(new THREE.SphereGeometry(0.035, 6, 4), this.eyeM, k * 0.08, 0.04, 0.24, hd, false));
    this.legs = [[-1, 1], [1, 1], [-1, -1], [1, -1]].map(([sx, sz]) => { const L = new THREE.Group(); L.position.set(sx * 0.22, 0.42, sz * 0.25); g.add(L); mesh(new THREE.CylinderGeometry(0.07, 0.05, 0.42, 6), sz > 0 ? fur : dk, 0, -0.21, 0, L); return L; });
    const pts = []; for (let i = 0; i <= 10; i++) { const t = i / 10; pts.push(new THREE.Vector3(0, 0.5 + t * 0.6 + Math.sin(t * 3) * 0.1, -0.4 - Math.sin(t * Math.PI) * 0.35 + (t > 0.8 ? (t - 0.8) * 0.8 : 0))); }
    this.tail = mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 16, 0.035, 5), fur, 0, 0, 0, g);
    // 小背心 + 小帽子：马戏团风格
    mesh(new THREE.CylinderGeometry(0.33, 0.36, 0.3, 10), this.mat(0xd8302a), 0, 0.55, 0.05, g).rotation.x = Math.PI / 2;
    mesh(new THREE.CylinderGeometry(0.09, 0.11, 0.14, 10), this.mat(0xd8302a), 0.04, 0.26, 0, hd);
    this.kbScale = 1.4; this.hbY = 1.5;
  }
  think(dt) { super.think(dt); if (this.state === 'wind' && this.t < dt * 1.5) Foley.at('chitter', this.pos, { vol: 0.5, rate: 1.6 }); }
  deathAnim(dt) {
    if (!this.cr) { this.cr = 1; this.eyeM.color.setRGB(0, 0, 0); burst(this.pos.clone().setY(0.4), 0xd8a060, 18, 3.5); Foley.at('chitter', this.pos, { vol: 0.5, rate: 1.1 }); }
    this.body.rotation.z = Math.min(Math.PI / 2, this.t * 6);
    if (this.t > 1.2) { const s = 1 - (this.t - 1.2) / 0.5; this.rig.root.scale.setScalar(Math.max(0.01, s)); if (this.t > 1.7) { scene.remove(this.rig.root); this.gone = true; } }
  }
}
BEAST_CLS.ape = Ape;
// 把一个打手“变”成小猴子
function apeify(e) {
  if (!e || e.dead || e.beast) return null;
  const x = e.pos.x, z = e.pos.z; e.release && e.release(); e.rig.root.removeFromParent(); e.hb && e.hb.remove(); e.dead = true; e.gone = true;
  const a = spawnAt('ape', x, z); a.cd = 1.2; burst(new THREE.Vector3(x, 1, z), 0xffd84a, 30, 4); shock(new THREE.Vector3(x, 0.05, z), 0xffd84a, 1.6); Foley.at('magic', a.pos, { vol: 0.6, rate: 1.3 }); Foley.at('chitter', a.pos, { vol: 0.6, rate: 1.4 });
  floatText(a.pos.clone().setY(1.8), '变！', '#ffd84a', 26); P8.apes = (P8.apes || 0) + 1; return a;
}
// ---------- 玩家被猴符射中：变成小猴子几秒 ----------
function monkeyPlayer(on, t = 6) {
  const p = player, R = p.rig.root;
  if (on) {
    if (!P8.mk) {
      P8.mk = true; P8.s0 = R.scale.x; R.scale.setScalar(P8.s0 * 0.62); P8.mkN++;
      if (!P8.tail) { const pts = []; for (let i = 0; i <= 10; i++) { const k = i / 10; pts.push(new THREE.Vector3(0, 0.9 + k * 0.9, -0.15 - Math.sin(k * Math.PI) * 0.5)); } P8.tail = mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 16, 0.05, 6), M(0x8a5a32), 0, 0, 0, R, false); }
      P8.tail.visible = true; if (p.rig.mats) p.rig.mats.forEach(m => m.emissive && m.emissive.setRGB(0.25, 0.12, 0.02));
      if (p.weapon) { const o = p.weapon; o.mesh.removeFromParent(); spawnWeapon(o.type, p.pos.x + Math.sin(p.yaw) * 0.8, p.pos.z + Math.cos(p.yaw) * 0.8, o.dur); p.weapon = null; refreshChips(); }
      banner('你被变成了猴子！<small>伤害减半、拿不了武器——撑过几秒就变回来（闪避和格挡照样能用）</small>', 2.4);
      Foley.at('chitter', p.pos, { vol: 0.8, rate: 1.2 }); Foley.at('magic', p.pos, { vol: 0.6 }); burst(p.pos.clone().setY(1), 0xffd84a, 40, 4);
      Story.bark('jackie', ['我、我变成猴子了！', '吱吱！……我是说，救命！', '又来？！'][Math.min(2, P8.mkN - 1)]);
    }
    P8.mkT = t;
  } else if (P8.mk) {
    P8.mk = false; P8.mkT = 0; P8.mkEnd = now; R.scale.setScalar(P8.s0 || 1); if (P8.tail) P8.tail.visible = false; if (p.rig.mats) p.rig.mats.forEach(m => m.emissive && m.emissive.setRGB(0, 0, 0));
    burst(p.pos.clone().setY(1), 0xffd84a, 30, 4); Foley.at('magic', p.pos, { vol: 0.5, rate: 0.8 }); floatText(p.pos.clone().setY(2.2), '变回来了！', '#ffd84a', 24);
  }
}
{
  const _upd = updatePlayer;
  updatePlayer = function (dt) {
    _upd(dt);
    if (P8.mk) { P8.mkT -= dt; if (player.weapon) { const p = player, o = p.weapon; o.mesh.removeFromParent(); spawnWeapon(o.type, p.pos.x + Math.sin(p.yaw) * 0.8, p.pos.z + Math.cos(p.yaw) * 0.8, o.dur); p.weapon = null; refreshChips(); tip('猴爪拿不住武器！', 1.2); } if (P8.mkT <= 0 || player.state === 'dead' || cutscene) monkeyPlayer(false); }
    if (OIL.list.length) updateOil(dt);
  };
  // 伤害修正：猴子形态 ×0.5；猴符觉醒的空中攻击 ×1.5（由 P8.inHit 标记来源是玩家的出招）
  const _phc = playerHitCheck;
  playerHitCheck = function (...a) { P8.inHit = true; try { return _phc(...a); } finally { P8.inHit = false; } };
  const dmgK = () => { if (!P8.inHit) return 1; let k = P8.mk ? 0.5 : 1; if (!player.grounded && Runes.has('monkey') && MONKEY2.on) k *= 1.5; return k; };
  for (const C of [Enemy, Beast]) { const P = C.prototype, _th = P.takeHit; P.takeHit = function (dmg, ...r) { return _th.call(this, dmg * dmgK(), ...r); }; }
}
const MONKEY2 = { get on() { try { return localStorage.getItem('jc_monkey2') === '1'; } catch (e) { return false; } } };
const RABBIT2 = { get on() { try { return localStorage.getItem('jc_rabbit2') === '1'; } catch (e) { return false; } } };
// ---------- 马戏团长 · 猴符：金色光线把人变猴子，帽子里变出猴子，手杖连击 ----------
WHO.mc = { n: '马戏团长', c: '#ffd84a', e: () => enemies.find(e => e.type === 'mc8') || player };
Object.assign(ETYPES, {
  mc8: { name: '马戏团长 · 猴符', hp: 1400, dmg: 15, spd: 3.5, radius: 0.45, scale: 1.04, beast: 1, elite: 1, rig: 'thug', tint: [1.5, 0.62, 0.55], kb: 0.3, dieMsg: '马戏团长倒下了！<small>“本场演出……到此结束……”</small>' },
});
class Ringmaster extends SkinBoss {
  onLoaded() {
    if (!this.rig.headB) return; const hm = M(0x1a1a1a, { roughness: 0.6 }), band = M(0xd8302a);
    mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.26, 16), hm, 0, 0.3, 0.01, this.rig.headB, false); mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.02, 18), hm, 0, 0.18, 0.01, this.rig.headB, false); mesh(new THREE.CylinderGeometry(0.122, 0.122, 0.05, 16), band, 0, 0.21, 0.01, this.rig.headB, false);
  }
  think(dt) {
    const S = this.state, p = player;
    if (S === 'beamW' || S === 'hat') { this.steer(dt, 0, 0, 0, 8); if (this.tele && !this.tele.fired && this.t < this.hitAt * 0.7) this.face(dt, 5); if (this.t > this.D) { this.setState('loco'); this.cd = rand(0.6, 1.0) * (this.cdK || 1); } return; }
    if (S !== 'loco') return this.runAtk(dt);
    const d = this.chase(dt, 2.2, this.T.spd * (this.raged ? 1.15 : 1));
    if (!this.raged && this.hp < this.maxHp * 0.5) { this.raged = true; this.cdK = 0.75; banner('压轴表演！<small>团长一次射出三道金光——看准缝隙闪过去</small>', 2.4); Story.bark('mc', '女士们先生们——压轴好戏！'); }
    if (this.cd > 0 || p.state === 'dead') return;
    const r = Math.random(), apes = enemies.filter(e => !e.dead && e.type === 'ape').length, thugs = enemies.filter(e => !e.dead && !e.beast);
    const canBeam = !P8.mk && now - (P8.mkEnd || -99) > 4;
    if (thugs.length && apes < 3 && r < 0.15) return this.beam(thugs[Math.floor(Math.random() * thugs.length)]);
    if (apes < 2 && now - (this.lastHat || -99) > 16) return this.hat();
    if (d > 4.5) return r < 0.6 && canBeam ? this.beam() : (this.cd = 0.4);
    if (r < 0.6 || !canBeam) this.caneCombo(); else this.beam();
  }
  caneCombo() {
    this.strike({ st: 'c1', D: 0.75, hit: 0.36, clip: 'jab', lunge: 3, dmg: 12, tele: { shape: 'sector', r: 2.5, arc: 0.7, col: 'amber' },
      next: () => this.strike({ st: 'c2', D: 0.9, hit: 0.45, clip: 'hook', lunge: 3, dmg: 14, tele: { shape: 'sector', r: 2.6, arc: 0.9, col: 'amber' },
        next: () => this.strike({ st: 'c3', D: 1.0, hit: 0.5, clip: 'kick_spin', dmg: 16, kiai: 'kT', opts: { kd: 1 }, tele: { shape: 'circle', r: 2.4, col: 'amber' } }) }) });
  }
  // 金色光线：射中成龙=变猴子；也会把挡在路上的打手变成猴子
  beam(target) {
    const tgt = target || player; this.setState('beamW'); this.D = 1.35; this.hitAt = 0.85; this.clip = null;
    const n = this.raged && !target ? 3 : 1, base = Math.atan2(tgt.pos.x - this.pos.x, tgt.pos.z - this.pos.z); this.yaw = base;
    Foley.at('magic', this.pos, { vol: 0.6, rate: 1.4 }); Foley.at('tele', this.pos, { vol: 0.4 });
    for (let i = 0; i < n; i++) {
      const off = (i - (n - 1) / 2) * 0.42;
      Tele.add({ shape: 'lane', x: this.pos.x, z: this.pos.z, yaw: base + off, w: 1.1, len: 16, wind: this.hitAt, lock: 0.75, col: 'gold', src: this,
        follow: n === 1 ? (T) => { T.x = this.pos.x; T.z = this.pos.z; T.yaw = this.yaw; } : null,
        onFire: (T) => {
          if (this.dead || this.state !== 'beamW') return; P8.beams++;
          const s = Math.sin(T.yaw), c = Math.cos(T.yaw); for (let k = 1; k < 16; k += 1.2) burst(new THREE.Vector3(T.x + s * k, 1.3, T.z + c * k), 0xffd84a, 2, 1.5);
          Foley.at('zap', this.pos, { vol: 0.6, rate: 1.2 });
          if (Tele.inside(T, player.pos)) { const h0 = player.hp; playerTakeHit(this, 6, { unblockable: 1 }); if (player.hp < h0 && player.hp > 0) monkeyPlayer(true, this.raged ? 7 : 6); }
          for (const e of enemies.slice()) if (!e.dead && !e.beast && Tele.inside(T, e.pos)) apeify(e);
        } });
    }
    if (!P8.told.beam) { P8.told.beam = 1; tip('金色光线：被射中会变成猴子！往两边闪，或者完美闪避', 2.4); }
  }
  hat() {
    this.setState('hat'); this.D = 1.4; this.hitAt = 0.9; this.clip = 'npc_cheer'; this.lastHat = now;
    Story.bark('mc', ['看好了——帽子里变出……', '再来一个！'][Math.random() < 0.5 ? 0 : 1]);
    Story.timers.push({ t: 0.9, f: () => { if (this.dead || AREA.name !== 'circus') return; for (let i = 0; i < 2; i++) { const a = this.yaw + (i ? 1 : -1) * 0.9; const e = spawnAt('ape', clamp(this.pos.x + Math.sin(a) * 1.6, CIR.x - CIR.r + 1, CIR.x + CIR.r - 1), clamp(this.pos.z + Math.cos(a) * 1.6, CIR.z - CIR.r + 1, CIR.z + CIR.r - 1)); e.cd = 1; burst(e.pos.clone().setY(1), 0xffd84a, 20, 3); } Foley.at('chitter', this.pos, { vol: 0.7, rate: 1.3 }); } });
  }
}
BEAST_CLS.mc8 = Ringmaster;
function circusScript(dt) {
  const mc = enemies.find(e => e.type === 'mc8'); if (!mc) return;
  if (P8.stage === 0 && mc.hp < mc.maxHp * 0.7) { P8.stage = 1; banner('观众席里冲下来几个打手！', 2); [[-8, 8], [8, 8]].forEach(([x, z]) => { const e = spawnAt('thug', CIR.x + x, CIR.z + z); e.cd = 1.5; }); }
  else if (P8.stage === 1 && mc.hp < mc.maxHp * 0.35 && enemies.filter(e => !e.dead && e !== mc).length <= 2) { P8.stage = 2; [[-9, -6], [9, -6]].forEach(([x, z]) => { const e = spawnAt(Math.random() < 0.5 ? 'khan' : 'thug', CIR.x + x, CIR.z + z); e.cd = 1.5; }); }
}
// ================= 货运站：横穿的列车 =================
const RAIL = { tracks: [-6, 0, 6], trains: [], t: 5, sig: [], stage: 0, hitsE: 0, hitsP: 0, told: {} };
(function buildRail() {
  const G = new THREE.Group(); G.position.set(RY.x, 0, RY.z); scene.add(G); AREA_GROUPS.rail = G;
  const W = RY.hx + 30;
  const gt = canvasTex(256, 256, (g, S) => { g.fillStyle = '#4a4640'; g.fillRect(0, 0, S, S); for (let i = 0; i < 900; i++) { const v = 50 + Math.random() * 60 | 0; g.fillStyle = `rgb(${v},${v - 4},${v - 8})`; g.fillRect(Math.random() * S, Math.random() * S, 3, 3); } }, [12, 10]);
  const fl = mesh(new THREE.PlaneGeometry(W * 2, RY.hz * 2 + 30), M(0xffffff, { map: gt }), 0, 0.001, 0, G, false); fl.rotation.x = -Math.PI / 2; fl.receiveShadow = true;
  const sl = M(0x3a2a1e), rl = M(0x9a9aa2, { metalness: 0.8, roughness: 0.35 });
  RAIL.tracks.forEach(z => {
    for (let x = -W; x < W; x += 1.1) box(0.3, 0.12, 2.5, sl, x, 0.06, z, G);
    [-0.72, 0.72].forEach(o => box(W * 2, 0.12, 0.1, rl, 0, 0.16, z + o, G));
    // 信号灯
    const post = new THREE.Group(); post.position.set(-RY.hx - 0.6, 0, z - 1.6); G.add(post); box(0.15, 3, 0.15, M(0x2a2a2a), 0, 1.5, 0, post); box(0.4, 0.8, 0.3, M(0x1a1a1a), 0, 3.1, 0, post);
    const lm = glowMat(0.2, 2.5, 0.4); mesh(new THREE.SphereGeometry(0.13, 10, 8), lm, 0, 3.1, 0.16, post, false);
    const post2 = post.clone(); post2.position.x = RY.hx + 0.6; post2.rotation.y = Math.PI; G.add(post2);
    const lm2 = lm.clone(); post2.traverse(o => { if (o.isMesh && o.material === lm) o.material = lm2; });
    RAIL.sig.push([lm, lm2]);
  });
  // 两侧集装箱墙
  const cc = [0xc0392b, 0x2a6ab0, 0x2a8a4a, 0xd88a1a, 0x6a6a72];
  [-1, 1].forEach(s => { for (let x = -W + 3; x < W; x += 6.3) for (let k = 0; k < 2; k++) if (Math.random() < 0.85 || k === 0) box(6, 2.6, 2.5, M(cc[(Math.random() * 5) | 0], { roughness: 0.7 }), x + rand(-0.2, 0.2), 1.3 + k * 2.6, s * (RY.hz + 1.8), G); });
  // 灯塔
  [[-RY.hx - 3, -RY.hz - 3], [RY.hx + 3, -RY.hz - 3], [-RY.hx - 3, RY.hz + 3], [RY.hx + 3, RY.hz + 3]].forEach(([x, z]) => { box(0.3, 12, 0.3, M(0x3a3a3a), x, 6, z, G); box(1.6, 0.6, 0.6, glowMat(3, 2.8, 2.2), x, 12, z, G); });
  for (let x = -RY.hx + 3; x < RY.hx; x += 7) RAIL.tracks.forEach((z, i) => i < 2 && lightPool(x, (z + RAIL.tracks[i + 1]) / 2, 4, new THREE.Color(0.22, 0.2, 0.16), G));
  BATCH.push(Object.assign(staticBatch([G], new Set()), { cx: RY.x, cz: RY.z, r: 120 }));
  BATCH.push({ group: G, cx: RY.x, cz: RY.z, r: 120 });
  [[-6, -3], [5, 3], [-2, 9], [9, -9]].forEach(([x, z]) => addFurn('rail', mkBoxes(2), RY.x + x, RY.z + z, 0.42, 0.42, 1.3, 'boxes', 80, { hp: 1 }));
})();
AREA_DEF.rail = () => ({ cx: RY.x, cz: RY.z, hx: RY.hx, hz: RY.hz, room: false, sun: 0.9, sunC: 0xb0c0ff, hemi: [0x8a90b0, 0x2a2a30, 1.45], fog: [0x101420, 30, 110], night: true, occl: 1, ep4: 1, squad: 1 });
function railWeapons() { [[-4, 3], [4, -3], [0, 9]].forEach(([x, z], i) => spawnWeapon([0, 8, 3][i], RY.x + x, RY.z + z)); }
function mkTrain() {
  const g = new THREE.Group(), body = [0x7a2a1a, 0x2a4a7a, 0x4a4a52, 0x2a6a3a];
  const loco = new THREE.Group(); g.add(loco);
  box(5, 2.8, 2.5, M(0x1a1a20, { metalness: 0.4 }), 0, 1.8, 0, loco); box(1.8, 1.2, 2.3, M(0xd8a01a), 1.4, 3.6, 0, loco);
  mesh(new THREE.SphereGeometry(0.28, 12, 8), glowMat(4, 3.6, 2.6), 2.55, 2.2, 0, loco, false); box(0.1, 0.5, 2.6, M(0xd8302a), 2.5, 0.7, 0, loco);
  for (let i = 1; i < 5; i++) box(5.6, 2.6, 2.4, M(body[i % 4], { roughness: 0.8 }), -i * 6, 1.7, 0, g);
  for (let i = 0; i < 5; i++) [-1.8, 1.8].forEach(o => [-1.15, 1.15].forEach(s => mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.15, 12), M(0x222222), -i * 6 + o, 0.45, s, g, false).rotation.x = Math.PI / 2));
  g.traverse(o => { if (o.isMesh) o.castShadow = true; }); return g;
}
// 发车：先亮信号灯 + 地上红色长条预警，2 秒后列车横穿整条轨道
function trainCall(i, dir = Math.random() < 0.5 ? 1 : -1, wind = 2.1) {
  const z = RY.z + RAIL.tracks[i], x0 = RY.x - dir * (RY.hx + 1);
  RAIL.sig[i].forEach(m => m.color.setRGB(4, 0.3, 0.2));
  Tele.add({ shape: 'lane', x: x0, z, yaw: dir > 0 ? Math.PI / 2 : -Math.PI / 2, w: 2.7, len: RY.hx * 2 + 2, wind, lock: 1, col: 'red', src: null,
    onFire: () => { const g = mkTrain(); g.position.set(RY.x - dir * (RY.hx + 32), 0, z); g.rotation.y = dir > 0 ? 0 : Math.PI; scene.add(g); RAIL.trains.push({ g, i, z, dir, x: g.position.x, hitP: false, hitE: new Set() }); Foley.at('quake', player.pos, { vol: 0.8, rate: 1.3 }); Foley.at('kB', player.pos, { vol: 0.5, rate: 0.6 }); } });
  Foley.at('bell', player.pos, { vol: 0.7, rate: 1.4 }); Foley.at('alarm', player.pos, { vol: 0.35, rate: 1.2 });
  if (!RAIL.told.t) { RAIL.told.t = 1; banner('列车来了！<small>信号灯变红、地上出现红色长条——赶紧离开那条轨道；把敌人打上轨道让列车撞飞</small>', 2.8); }
}
function updateRail(dt) {
  const tr = RAIL.trains;
  for (let k = tr.length - 1; k >= 0; k--) {
    const T = tr[k]; T.x += T.dir * 30 * dt; T.g.position.x = T.x; shake = Math.max(shake, 0.08);
    const head = T.x, tail = T.x - T.dir * 27, lo = Math.min(head, tail), hi = Math.max(head, tail);
    const inT = (p) => Math.abs(p.z - T.z) < 1.55 && p.x > lo - 0.5 && p.x < hi + 0.5;
    if (!T.hitP && inT(player.pos) && player.pos.y < 3 && player.state !== 'dead') { T.hitP = true; RAIL.hitsP++; playerTakeHit({ pos: new THREE.Vector3(head - T.dir * 2, 0, T.z), parried() { } }, 45, { kd: 1, unblockable: 1 }); player.vel.x += T.dir * 9; player.vel.z += Math.sign(player.pos.z - T.z || 1) * 7; }
    for (const e of enemies) if (!e.dead && !T.hitE.has(e) && inT(e.pos)) { T.hitE.add(e); RAIL.hitsE++; e.takeHit(e.T.elite ? 120 : 999, new THREE.Vector2(T.dir * 0.6, Math.sign(e.pos.z - T.z || 1)), { kb: 14, kd: 1, heavy: 1, launch: 5 }, 1, false); floatText(e.pos.clone().setY(2.4), '被列车撞飞！', '#ff8a3a', 26); Foley.at('kB', e.pos, { vol: 0.9 }); burst(e.pos.clone().setY(1), 0xffd84a, 20, 5); }
    if (Math.abs(T.x - RY.x) > RY.hx + 60) { scene.remove(T.g); tr.splice(k, 1); RAIL.sig[T.i].forEach(m => m.color.setRGB(0.2, 2.5, 0.4)); }
  }
}
function railScript(dt) {
  RAIL.t -= dt; const alive = enemies.filter(e => !e.dead).length;
  if (RAIL.t <= 0) {
    const busy = new Set(RAIL.trains.map(T => T.i)), free = [0, 1, 2].filter(i => !busy.has(i));
    if (free.length) { const i = free[Math.floor(Math.random() * free.length)]; trainCall(i); if (RAIL.stage >= 1 && free.length > 2 && Math.random() < 0.5) trainCall(free.filter(j => j !== i)[Math.floor(Math.random() * 2)], undefined, 2.4); }
    RAIL.t = rand(5.5, 8);
  }
  if (RAIL.stage === 0 && alive <= 2) { RAIL.stage = 1; banner('增援！<small>瓦尔蒙的手下从车厢里跳了下来</small>', 2); [['thug', -10, -9], ['brute', 10, 9], ['khan', -10, 9]].forEach(([t, x, z]) => { const e = spawnAt(t, RY.x + x, RY.z + z); e.cd = 1.4; }); }
  else if (RAIL.stage === 1 && alive <= 1) { RAIL.stage = 2; [['thug', 11, -9], ['thug', -11, -3], ['brute', 0, 10]].forEach(([t, x, z]) => { const e = spawnAt(t, RY.x + x, RY.z + z); e.cd = 1.4; }); Story.bark('thug', '把他推到铁轨上去！'); }
}
// ================= 调车转盘：瓦尔蒙 · 兔符 =================
const OIL = { list: [], told: 0 };
const oilTex = canvasTex(256, 256, (g, W) => { const gr = g.createRadialGradient(W / 2, W / 2, 10, W / 2, W / 2, W / 2); gr.addColorStop(0, 'rgba(10,8,14,.95)'); gr.addColorStop(0.7, 'rgba(30,20,40,.85)'); gr.addColorStop(1, 'rgba(30,20,40,0)'); g.fillStyle = gr; g.fillRect(0, 0, W, W); g.strokeStyle = 'rgba(120,80,200,.35)'; g.lineWidth = 6; g.beginPath(); g.arc(W / 2 - 20, W / 2 - 10, 50, 0.5, 2.5); g.stroke(); });
function addOil(x, z, r = 2) {
  const m = mesh(new THREE.CircleGeometry(r, 28), new THREE.MeshStandardMaterial({ map: oilTex, transparent: true, depthWrite: false, roughness: 0.05, metalness: 0.6 }), x, 0.03, z, scene, false); m.rotation.x = -Math.PI / 2; m.rotation.z = rand(0, TAU);
  OIL.list.push({ x, z, r, m, t: 22 }); Foley.at('cloth', new THREE.Vector3(x, 0, z), { vol: 0.5, rate: 0.6 });
}
function oilClear() { OIL.list.forEach(o => scene.remove(o.m)); OIL.list.length = 0; }
function updateOil(dt) {
  const p = player; let on = false;
  for (let i = OIL.list.length - 1; i >= 0; i--) { const o = OIL.list[i]; o.t -= dt; if (o.t < 2) o.m.material.opacity = o.t / 2; if (o.t <= 0) { scene.remove(o.m); OIL.list.splice(i, 1); continue; } if (Math.hypot(p.pos.x - o.x, p.pos.z - o.z) < o.r * 0.9 && p.pos.y < 0.2) on = true; }
  if (on && p.state !== 'dodge') { const k = Math.exp(-dt * 5); p.vel.x *= k; p.vel.z *= k; if (Math.random() < dt * 6) burst(p.pos.clone().setY(0.05), 0x2a1a3a, 1, 1); if (!OIL.told) { OIL.told = 1; tip('踩进油里会变慢！闪避翻滚可以滑出去', 2.2); } }
  P8.onOil = on;
}
(function buildTurntable() {
  const G = new THREE.Group(); G.position.set(TT.x, 0, TT.z); scene.add(G); AREA_GROUPS.turntable = G;
  const R = TT.r;
  const ft = canvasTex(512, 512, (g, W) => { g.fillStyle = '#3a3836'; g.fillRect(0, 0, W, W); for (let i = 0; i < 1600; i++) { const v = 40 + Math.random() * 50 | 0; g.fillStyle = `rgb(${v},${v},${v - 4})`; g.fillRect(Math.random() * W, Math.random() * W, 3, 3); } });
  const fl = mesh(new THREE.CircleGeometry(R + 12, 64), M(0xffffff, { map: ft }), 0, 0.001, 0, G, false); fl.rotation.x = -Math.PI / 2; fl.receiveShadow = true;
  // 转盘：铁板圆盘 + 一条轨道，慢慢转
  const disc = TT.disc = new THREE.Group(); G.add(disc);
  const dm = mesh(new THREE.CylinderGeometry(7, 7, 0.12, 48), M(0x5a5450, { metalness: 0.6, roughness: 0.5 }), 0, 0.06, 0, disc, false); dm.receiveShadow = true;
  const rl = M(0x9a9aa2, { metalness: 0.8, roughness: 0.35 }); [-0.72, 0.72].forEach(o => box(14, 0.1, 0.1, rl, 0, 0.17, o, disc));
  for (let x = -6.5; x <= 6.5; x += 1.1) box(0.3, 0.06, 2.5, M(0x3a2a1e), x, 0.13, 0, disc);
  mesh(new THREE.TorusGeometry(7.05, 0.1, 6, 64), M(0xd8a01a), 0, 0.12, 0, G, false).rotation.x = Math.PI / 2;
  // 放射状的停车轨道 + 机车库
  const sl = M(0x3a2a1e);
  for (let i = 0; i < 8; i++) { const a = i / 8 * TAU, gq = new THREE.Group(); gq.rotation.y = a; G.add(gq); for (let x = 7.4; x < R + 10; x += 1.1) box(0.3, 0.12, 2.5, sl, x, 0.06, 0, gq); [-0.72, 0.72].forEach(o => box(R + 3, 0.12, 0.1, rl, 7.2 + (R + 3) / 2, 0.16, o, gq)); }
  const shed = new THREE.Group(); shed.position.set(0, 0, -R - 6); G.add(shed); box(R * 2 + 6, 7, 1, M(0x6a3a2a), 0, 3.5, -3, shed); box(R * 2 + 6, 0.6, 7, M(0x3a3a40), 0, 7, 0, shed);
  for (let i = -2; i <= 2; i++) box(3.6, 5, 0.3, M(0x2a2a30), i * 5, 2.5, -2.4, shed);
  const loco = mkTrain(); loco.children.slice(5).forEach(c => c.visible = false); loco.position.set(-R - 5, 0, 4); loco.rotation.y = 0.3; G.add(loco);
  [[-R - 4, -R - 4], [R + 4, -R - 4], [R + 4, R + 4], [-R - 4, R + 4]].forEach(([x, z]) => { box(0.3, 11, 0.3, M(0x3a3a3a), x, 5.5, z, G); box(1.4, 0.5, 0.5, glowMat(3, 2.6, 2), x, 11, z, G); });
  lightPool(0, 0, 8, new THREE.Color(0.25, 0.22, 0.18), G);
  BATCH.push(Object.assign(staticBatch([G], new Set([disc])), { cx: TT.x, cz: TT.z, r: 120 }));
  BATCH.push({ group: G, cx: TT.x, cz: TT.z, r: 120 });
})();
AREA_DEF.turntable = () => ({ cx: TT.x, cz: TT.z, hx: TT.r, hz: TT.r, round: TT.r, room: false, sun: 0.75, sunC: 0xffc890, hemi: [0x7a6a70, 0x1a1418, 1.2], fog: [0x18120e, 30, 110], night: true, occl: 1, ep4: 1 });
function mkBarrel() { const g = new THREE.Group(); mesh(new THREE.CylinderGeometry(0.38, 0.38, 1.0, 16), M(0x2a3a6a, { metalness: 0.5, roughness: 0.5 }), 0, 0.5, 0, g); [0.15, 0.85].forEach(y => mesh(new THREE.TorusGeometry(0.385, 0.03, 4, 18), M(0x1a1a1a), 0, y, 0, g, false).rotation.x = Math.PI / 2); mesh(new THREE.CircleGeometry(0.3, 14), M(0xd8a01a), 0, 1.005, 0, g, false).rotation.x = -Math.PI / 2; return g; }
[[-9, -3], [9, -4], [-6, 8], [7, 8], [0, -10], [-10, 5], [10, 3]].forEach(([x, z]) => addFurn('turntable', mkBarrel(), TT.x + x, TT.z + z, 0.4, 0.4, 1.0, 'barrel', 60, { hp: 1, oil: 1 }));
FURN_SND.barrel = 'clangS';
function ttReset() { furnReset('turntable'); FURN.list.forEach(f => { if (f.oil) f.oiled = 0; }); oilClear(); }
{
  const _bf = breakFurn;
  breakFurn = function (f, ...a) { const r = _bf(f, ...a); if (f && f.oil && f.broken && !f.oiled) { f.oiled = 1; addOil(f.x, f.z, 2.1); } return r; };
}
function ttWeapons() { [[-4, 6], [5, 6]].forEach(([x, z], i) => spawnWeapon([0, 3][i], TT.x + x, TT.z + z)); }
// ---------- 瓦尔蒙 · 兔符：极速连环冲刺、残影、油瓶；完美闪避触发子弹时间 ----------
Object.assign(ETYPES, {
  valm8: { name: '瓦尔蒙 · 兔符', hp: 1800, dmg: 16, spd: 4.6, radius: 0.44, scale: 1.06, beast: 1, elite: 1, rig: 'thug', tint: [0.78, 0.8, 0.9], kb: 0.25, dieMsg: '瓦尔蒙倒下了！<small>“我的……速度……”</small>' },
});
{ const _ve = WHO.valmont.e; WHO.valmont.e = () => enemies.find(e => e.type === 'valm8') || _ve(); }
const VAL = { told: {}, bt: 0, dodges: 0 };
function afterImage(e, col = 0x7fe9ff) {
  const g = new THREE.Group(); g.position.copy(e.pos); g.rotation.y = e.yaw; scene.add(g);
  const m = new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.4, toneMapped: false, depthWrite: false });
  mesh(new THREE.CapsuleGeometry(0.28, 1.0, 4, 8), m, 0, 1.0, 0, g, false); mesh(new THREE.SphereGeometry(0.17, 8, 6), m, 0, 1.8, 0, g, false);
  (VAL.imgs = VAL.imgs || []).push({ g, m, t: 0 });
}
class ValmontRabbit extends SkinBoss {
  onLoaded() { if (this.rig.headB) [-1, 1].forEach(s => { const ear = mesh(new THREE.CapsuleGeometry(0.035, 0.22, 3, 6), glowMat(0.6, 2.2, 2.6), s * 0.07, 0.3, -0.02, this.rig.headB, false); ear.rotation.z = -s * 0.25; ear.visible = false; (this.ears = this.ears || []).push(ear); }); }
  think(dt) {
    const S = this.state, p = player;
    if (this.raged && Math.random() < dt * 8 && Math.hypot(this.vel.x, this.vel.z) > 3) afterImage(this);
    if (S === 'dashW') { this.steer(dt, 0, 0, 0, 10); if (this.tele && !this.tele.fired && this.t < this.tele.wind * 0.7) this.face(dt, 6); return; }
    if (S === 'dash') return this.runDash(dt);
    if (S === 'hop') return this.runHop(dt);
    if (S !== 'loco') return this.runAtk(dt);
    const d = this.chase(dt, 2.0, this.T.spd * (this.raged ? 1.2 : 1));
    if (!this.raged && this.hp < this.maxHp * 0.5) { this.raged = true; this.cdK = 0.65; this.atkK = 0.82; (this.ears || []).forEach(e => e.visible = true); banner('兔符 · 全速！<small>残影、四连冲——完美闪避他的冲刺会触发子弹时间，趁机还手</small>', 2.6); Story.bark('valmont', '你连我的影子都碰不到！'); burst(this.pos.clone().setY(1.2), 0x7fe9ff, 50, 6); Foley.at('magic', this.pos, { vol: 0.7, rate: 1.4 }); }
    if (this.cd > 0 || p.state === 'dead') return;
    const r = Math.random();
    if (d > 5) return r < 0.6 ? this.startDash(this.raged ? 4 : 3) : r < 0.85 ? this.oilFlask() : this.startHop();
    if (r < 0.45) this.jabRush(); else if (r < 0.7) this.startDash(this.raged ? 3 : 2); else if (r < 0.85) this.startHop(); else this.oilFlask();
  }
  jabRush() {
    const t = (st, clip, dmg, next, o = {}) => ({ st, D: 0.55, hit: 0.26, clip, lunge: 4.5, dmg, sw: 'swishS', swRate: 1.2, tele: { shape: 'sector', r: 2.4, arc: 0.75, col: 'amber' }, next, ...o });
    this.strike(t('j1', 'jab', 10, () => this.strike(t('j2', 'jab', 10, () => this.strike(t('j3', 'kick_round', 15, null, { D: 0.85, hit: 0.42, kiai: 'kT', opts: { kd: 1 } }))))));
  }
  startDash(n) {
    this.setState('dashW'); this.hitP = false; this.run = 0; if (n) this.dashN = n;
    const len = clamp(Math.hypot(player.pos.x - this.pos.x, player.pos.z - this.pos.z) + 3.5, 6, 15); this.runMax = len;
    const first = n != null, wind = first ? 0.7 : (this.raged ? 0.38 : 0.48);
    Foley.at('swishH', this.pos, { vol: 0.6, rate: 1.3 });
    this.tele = Tele.add({ shape: 'lane', x: this.pos.x, z: this.pos.z, yaw: this.yaw, w: 1.6, len, wind, lock: 0.7, col: 'red', src: this,
      follow: (T) => { T.x = this.pos.x; T.z = this.pos.z; T.yaw = this.yaw; }, onFire: () => { this.tele = null; if (this.state === 'dashW') this.setState('dash'); } });
    if (!VAL.told.dash) { VAL.told.dash = 1; tip('兔符 · 连环冲刺！一次接一次——每道红线都要闪；完美闪避=子弹时间', 2.4); }
  }
  runDash(dt) {
    const sp = 24, fx = Math.sin(this.yaw), fz = Math.cos(this.yaw); this.vel.set(fx * sp, 0, fz * sp); this.run += sp * dt;
    if (Math.random() < dt * 25) afterImage(this);
    if (!this.hitP && Math.hypot(player.pos.x - this.pos.x, player.pos.z - this.pos.z) < 1.1 && player.pos.y < 1.4) { this.hitP = true; playerTakeHit(this, 14, { kd: 1, unblockable: 1 }); }
    const nx = this.pos.x + fx * 0.8, nz = this.pos.z + fz * 0.8, out = Math.hypot(nx - TT.x, nz - TT.z) > TT.r - 0.6;
    const bar = FURN.list.find(f => !f.broken && f.area === 'turntable' && furnDist(f, nx, nz) < 0.2); if (bar) breakFurn(bar, new THREE.Vector2(fx, fz), 'boss');
    if (this.run > this.runMax || out) {
      this.vel.multiplyScalar(0.2);
      if (--this.dashN > 0) { this.face(1, 99); this.startDash(); } else { this.setState('loco'); this.cd = rand(0.9, 1.3); }
    }
  }
  // 兔子跳：高高跳起砸向你脚下（红圈）
  startHop() {
    this.setState('hop'); this.hopFrom = this.pos.clone(); const tx = player.pos.x + player.vel.x * 0.3, tz = player.pos.z + player.vel.z * 0.3; this.hopTo = new THREE.Vector3(tx, 0, tz); this.landed = false;
    this.tele = Tele.add({ shape: 'circle', x: tx, z: tz, r: 2.3, wind: 1.05, col: 'red', src: this, dmg: 18, opts: { kd: 1, unblockable: 1 }, onFire: () => { this.tele = null; } });
    Foley.at('swishH', this.pos, { vol: 0.6, rate: 0.8 });
  }
  runHop(dt) {
    const k = Math.min(1, this.t / 1.05); this.pos.x = lerp(this.hopFrom.x, this.hopTo.x, k); this.pos.z = lerp(this.hopFrom.z, this.hopTo.z, k); this.pos.y = Math.sin(k * Math.PI) * 4.5; this.vel.set(0, 0, 0);
    if (k >= 1 && !this.landed) { this.landed = true; this.pos.y = 0; shock(this.pos.clone().setY(0.05), 0x7fe9ff, 2.6); burst(this.pos.clone().setY(0.3), 0xc0c0c0, 24, 4); Foley.at('quake', this.pos, { vol: 0.6, rate: 1.4 }); shake = 0.3; }
    if (this.t > 1.45) { this.setState('loco'); this.cd = rand(0.5, 0.9); }
  }
  // 扔油瓶：紫圈落点，留下一滩油
  oilFlask() {
    const tx = player.pos.x, tz = player.pos.z;
    this.strike({ st: 'oil', D: 0.9, hit: 0.45, clip: 'hook', dmg: 0, sw: 'swishL', fixed: true, tele: { shape: 'circle', x: tx, z: tz, r: 2.0, col: 'purple', wind: 1.0 }, onFire: (T, hit) => { addOil(T.x, T.z, 2.0); burst(new THREE.Vector3(T.x, 0.4, T.z), 0x3a2a5a, 20, 3); Foley.at('glass', new THREE.Vector3(T.x, 0, T.z), { vol: 0.6 }); if (hit) playerTakeHit(this, 8, { unblockable: 1 }); } });
    if (!VAL.told.oil) { VAL.told.oil = 1; tip('紫圈：油瓶！踩进油里会变慢', 2); }
  }
  onHit(dmg, dir, m, counter) { if (this.state === 'dash' && (m.heavy || counter)) { this.vel.multiplyScalar(0.1); this.dashN = 0; this.stun(1.4, '截停！', '#7fe9ff'); } }
  pose(dt, v) {
    const sk = this.rig.sk;
    if (sk && sk.mixer && this.state === 'hop') { sk.set('hop', { kick_spin: 1 }, null, 0.1); sk.time('kick_spin', Math.min(sk.dur('kick_spin') - 0.01, this.t * 0.6)); sk.update(dt); return; }
    if (sk && sk.mixer && this.state === 'dashW') { sk.set('dashW', { idle_box: 1 }, null, 0.1); sk.update(dt); return; }
    super.pose(dt, v);
  }
}
BEAST_CLS.valm8 = ValmontRabbit;
function valScript(dt) {
  if (TT.disc) TT.disc.rotation.y += dt * 0.08;
  const I = VAL.imgs || []; for (let i = I.length - 1; i >= 0; i--) { const A = I[i]; A.t += dt; A.m.opacity = 0.4 * (1 - A.t / 0.45); if (A.t > 0.45) { scene.remove(A.g); I.splice(i, 1); } }
}
// 完美闪避瓦尔蒙的冲刺：子弹时间
{
  const _ge = gameEvent;
  gameEvent = function (k, d) {
    _ge(k, d);
    if (k === 'pdodge' && AREA.name === 'turntable') { const v = enemies.find(e => e.type === 'valm8' && !e.dead); if (v && (v.state === 'dash' || v.state === 'dashW' || v.state === 'hop')) { VAL.bt++; queueMicrotask(() => { slowmo = Math.max(slowmo, 1.4); }); v.cancelTele(); v.dashN = 0; v.vel.multiplyScalar(0.1); if (v.state !== 'hop') v.stun(1.8, '子弹时间！', '#7fe9ff'); showMove('子弹时间！', '#7fe9ff'); } }
    if (k === 'pdodge' && Runes.has('rabbit') && RABBIT2.on) { RABBIT2.t = now + 3; showMove('兔符 · 疾风！', '#7fe9ff'); burst(player.pos.clone().setY(1), 0x7fe9ff, 20, 3); }
  };
  const _ms = moveSpeed; moveSpeed = function () { return _ms() * (Runes.has('rabbit') && RABBIT2.on && now < (RABBIT2.t || 0) ? 1.3 : 1); };
}
window.__ep8 = { CIR, RY, TT, P8, RAIL, OIL, VAL, Ape, Ringmaster, ValmontRabbit, apeify, monkeyPlayer, trainCall, updateRail, railScript, circusScript, valScript, addOil, oilClear, ttReset, circusWeapons, railWeapons, ttWeapons, MONKEY2, RABBIT2 };
