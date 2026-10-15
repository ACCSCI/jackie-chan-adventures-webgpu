// ================= 敌人 =================
const ETYPES = {
  thug: { name: '黑手帮打手', hp: 70, dmg: 12, spd: 2.8, range: 1.5, windup: 0.55, scale: 1, rig: { shirt: 0x24262b, pants: 0x1b1c20, glasses: 1, hair: 0x1b120a, forearm: 'shirt', suit: 1, hairStyle: 'slick', shoe: 0x0c0c0c }, high: 1, poise: 0 },
  khan: { name: '影武者', hp: 50, dmg: 10, spd: 4.0, range: 1.7, windup: 0.42, scale: 1, rig: { shirt: 0x1d1530, pants: 0x161026, hair: 0x120c1e, hood: 1, katana: 1, forearm: 'shirt', shoe: 0x0b0814, sash: 0x4a1f6a, wraps: 0x2c2244 }, blade: 1, poise: 0 },
  boss: { name: '大块头·刀鲁', hp: 520, dmg: 24, spd: 2.3, range: 2.2, windup: 0.8, scale: 1.5, rig: { shirt: 0xe2b38a, skin: 0xe2b38a, pants: 0x1a2440, hair: 0x111111, topknot: 1, sleeve: 'skin', vest: 0x2a3d66, sash: 0x8a1c1c, bulk: 1.15, belly: 1, wraps: 0x2a3d66 }, poise: 1 },
  // 黑手帮三人组 / 暴怒刀鲁（复用已有模型，换色调和数值）
  finn: { base: 'thug', name: '芬恩', hp: 150, dmg: 14, spd: 3.3, windup: 0.5, scale: 1.06, tint: [1.35, 0.8, 0.75], elite: 1 },
  ratso: { base: 'thug', name: '拉索', hp: 185, dmg: 16, spd: 2.9, windup: 0.55, scale: 1.14, tint: [0.8, 0.95, 1.4], elite: 1 },
  chow: { base: 'thug', name: '阿周', hp: 130, dmg: 13, spd: 3.7, windup: 0.45, scale: 0.98, tint: [0.85, 1.3, 0.85], elite: 1 },
  boss2: { base: 'boss', name: '暴怒·刀鲁', hp: 820, dmg: 27, spd: 2.7, scale: 1.55, tint: [1.25, 0.85, 0.82], dieMsg: '刀鲁倒下了！<small>“这次……真的爬不起来了。”</small>' },
};
for (const k in ETYPES) if (ETYPES[k].base) ETYPES[k] = Object.assign({}, ETYPES[ETYPES[k].base], ETYPES[k]);
ETYPES.boss.dieMsg = '击败 刀鲁！<small>“魔法是会反噬的！” —— 老爹</small>';
const enemies = [];
let attackTokens = 0;
// 敌人基准姿态
const EBASE = {
  thug: Object.assign(zeroPose(), { hy: -0.06, hry: 0.2, sy: -0.15, lsx: -0.7, lsz: -0.1, lex: -1.7, rsx: -0.45, rsz: 0.1, rex: -1.9, lhx: -0.3, lkx: 0.4, rhx: 0.2, rkx: 0.3 }),
  khan: Object.assign(zeroPose(), { hy: -0.2, sx: 0.3, nx: -0.2, lsx: -0.6, lsz: 0.25, lex: -1.0, rsx: -0.9, rsz: 0.2, rex: -0.7, lhx: -0.6, lkx: 0.9, rhx: 0.3, rkx: 0.7, hry: 0.3, sy: -0.25 }),
  boss: Object.assign(zeroPose(), { hy: -0.06, lsz: 0.35, rsz: -0.35, lsx: -0.5, rsx: -0.5, lex: -1.3, rex: -1.3, lhx: -0.2, lkx: 0.3, rhx: 0.15, rkx: 0.25, sx: 0.12 }),
};
const ECROUCH = Object.assign(zeroPose(), BASE.crouch);
// 敌人攻击时间线（秒）：hit=判定时刻，wind=蓄力结束(发红光)
function eatk(type, o) { const c = clip(o.dur, o.keys, EBASE[type]); return Object.assign({}, o, c); }
const EATK = {
  thug: [
    eatk('thug', { name: 'punch', dur: 1.05, wind: 0.5, hit: 0.6, range: 1.5, high: 1, lunge: [0.5, 0.62, 5], keys: [[0, {}], [0.3, { rsx: 0.45, rex: -2.1, sy: -0.55, hry: 0.4, hy: -0.1, lsx: -0.95 }], [0.5, { rsx: 0.6, rex: -2.2, sy: -0.7, hry: 0.45, hy: -0.12, lsx: -1.0 }], [0.6, { rsx: -1.6, rex: -0.05, sy: 0.65, hry: -0.15, rhx: 0.45, lhx: -0.65, lkx: 0.6, lsx: -0.5 }], [0.78, { rsx: -1.35, rex: -0.4, sy: 0.45, rhx: 0.3 }], [1.05, {}]] }),
    eatk('thug', { name: 'kick', dur: 1.1, wind: 0.5, hit: 0.62, range: 1.75, kd: 0, lunge: [0.5, 0.65, 3], keys: [[0, {}], [0.3, { rhx: -0.7, rkx: 1.8, sx: 0.15, hy: -0.04 }], [0.5, { rhx: -1.0, rkx: 2.0, sx: -0.05, lsx: -0.9, rsx: -0.2 }], [0.62, { rhx: -1.6, rkx: 0.05, sx: -0.3, lkx: 0.15, hry: 0 }], [0.82, { rhx: -0.8, rkx: 1.3 }], [1.1, {}]] }),
  ],
  khan: [
    eatk('khan', { name: 'slash', dur: 0.95, wind: 0.38, hit: 0.47, range: 1.75, lunge: [0.38, 0.5, 4], keys: [[0, {}], [0.24, { rsx: -2.7, rsz: 0.7, rex: -0.6, sy: -0.6, hy: -0.22, sx: 0.0 }], [0.38, { rsx: -2.9, rsz: 0.8, rex: -0.4, sy: -0.7, hy: -0.24 }], [0.47, { rsx: -0.8, rsz: -0.7, rex: -0.05, sy: 0.85, sx: 0.5, hy: -0.32, lhx: -0.9, lkx: 1.0 }], [0.66, { rsx: -0.6, rsz: -0.6, sy: 0.6, sx: 0.45, hy: -0.3 }], [0.95, {}]] }),
    eatk('khan', { name: 'lunge', dur: 1.05, wind: 0.45, hit: 0.56, range: 2.3, lunge: [0.45, 0.6, 12], keys: [[0, {}], [0.3, { rsx: 0.35, rex: -1.8, sy: -0.8, hy: -0.32, sx: 0.35 }], [0.45, { rsx: 0.45, rex: -1.9, sy: -0.85, hy: -0.35, sx: 0.4 }], [0.56, { rsx: -1.55, rex: 0, sy: 0.6, sx: 0.55, hy: -0.36, lhx: -1.1, lkx: 1.0, rhx: 0.65, rkx: 0.2 }], [0.8, { rsx: -1.3, sy: 0.4, sx: 0.4, hy: -0.3 }], [1.05, {}]] }),
  ],
  boss: [
    eatk('boss', { name: 'punch', dur: 1.35, wind: 0.7, hit: 0.82, range: 2.2, kd: 1, lunge: [0.7, 0.86, 6], keys: [[0, {}], [0.45, { rsx: 0.6, rex: -2.2, sy: -0.75, hry: 0.5, hy: -0.15, lsx: -1.1 }], [0.7, { rsx: 0.75, rex: -2.3, sy: -0.85, hry: 0.55, hy: -0.18 }], [0.82, { rsx: -1.6, rex: 0, sy: 0.75, hry: -0.25, rhx: 0.5, lhx: -0.7, lkx: 0.7 }], [1.05, { rsx: -1.4, rex: -0.3, sy: 0.55 }], [1.35, {}]] }),
    eatk('boss', { name: 'slam', dur: 1.7, wind: 1.0, hit: 1.1, range: 3.4, kd: 1, unblockable: 1, aoe: 1, keys: [[0, {}], [0.6, { lsx: -2.9, rsx: -2.9, lsz: 0.2, rsz: -0.2, lex: -0.5, rex: -0.5, sx: -0.35, hy: 0.0, nx: -0.3, lhx: -0.1, rhx: 0.1 }], [1.0, { lsx: -3.0, rsx: -3.0, lex: -0.4, rex: -0.4, sx: -0.45, hy: 0.02 }], [1.1, { lsx: -0.9, rsx: -0.9, lex: 0, rex: 0, sx: 0.75, hy: -0.4, lhx: -0.9, lkx: 1.1, rhx: 0.2, rkx: 0.6 }], [1.4, { lsx: -0.8, rsx: -0.8, sx: 0.65, hy: -0.38, lhx: -0.9, lkx: 1.1 }], [1.7, {}]] }),
  ],
};
// 瓦尔蒙（龙之力）：双掌推出火球
const FIRE_ATK = eatk('thug', { name: 'fire', dur: 1.25, wind: 0.72, hit: 0.8, range: 16, proj: 1, keys: [[0, {}], [0.4, { lsx: -0.6, rsx: -0.6, lex: -2.2, rex: -2.2, lsz: 0.5, rsz: -0.5, sx: -0.25, hy: -0.12, sy: 0.3 }], [0.72, { lsx: -0.7, rsx: -0.7, lex: -2.3, rex: -2.3, lsz: 0.55, rsz: -0.55, sx: -0.3, hy: -0.15, sy: 0.35 }], [0.8, { lsx: -1.55, rsx: -1.55, lex: -0.05, rex: -0.05, lsz: 0.1, rsz: -0.1, sx: 0.35, hy: -0.2, sy: 0, lhx: -0.6, lkx: 0.7, rhx: 0.4 }], [1.0, { lsx: -1.4, rsx: -1.4, lex: -0.2, rex: -0.2, sx: 0.25, hy: -0.18 }], [1.25, {}]] });
const FB_GEO = new THREE.SphereGeometry(0.26, 14, 10), FB_MAT = glowMat(5, 1.5, 0.3);
const FB_HALO = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.3, 0.4, 0.06), transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
const fireballs = [];
function spawnFireballs(e) {
  const n = e.hp < e.maxHp * 0.5 ? 3 : 1, base = Math.atan2(player.pos.x - e.pos.x, player.pos.z - e.pos.z);
  for (let i = 0; i < n; i++) {
    const a = base + (i - (n - 1) / 2) * 0.3;
    const g = new THREE.Mesh(FB_GEO, FB_MAT), h = new THREE.Mesh(FB_GEO, FB_HALO); h.scale.setScalar(1.9); g.add(h);
    const pos = new THREE.Vector3(e.pos.x + Math.sin(a) * 0.9, 1.25 * e.scale, e.pos.z + Math.cos(a) * 0.9); g.position.copy(pos); scene.add(g);
    fireballs.push({ g, pos, vel: new THREE.Vector3(Math.sin(a) * 11, 0, Math.cos(a) * 11), t: 0, src: e, dmg: Math.round(e.T.dmg * 0.9), reflect: false, hitP: false,
      parried() { this.reflect = true; this.vel.multiplyScalar(-1.4); this.t = 0; this.g.material = FB_MAT2; floatText(this.pos.clone().setY(2), '火球反弹!', '#4fd1ff', 26); } });
  }
  sfx('fire'); burst(e.pos.clone().setY(1.3 * e.scale), 0xff7a2a, 16, 4);
}
const FB_MAT2 = glowMat(1.2, 3.5, 5);
function updateFireballs(dt) {
  const p = player;
  for (let i = fireballs.length - 1; i >= 0; i--) {
    const f = fireballs[i]; f.t += dt; f.pos.addScaledVector(f.vel, dt); f.g.position.copy(f.pos); f.g.rotation.y += dt * 8;
    if (Math.random() < dt * 35) burst(f.pos.clone(), f.reflect ? 0x4fd1ff : 0xff7a2a, 1, 1);
    let dead = f.t > 2 || Math.abs(f.pos.x - AREA.cx) > AREA.hx + 1 || Math.abs(f.pos.z - AREA.cz) > AREA.hz + 1;
    if (!f.reflect && !f.hitP && p.state !== 'dead' && Math.hypot(p.pos.x - f.pos.x, p.pos.z - f.pos.z) < 0.75 && p.pos.y < 1.3) {
      f.hitP = true; const hp0 = p.hp, st0 = p.st;
      playerTakeHit(f, f.dmg, { high: 1 });
      if (!f.reflect && (p.hp < hp0 || p.st < st0)) { dead = true; sfx('firehit'); burst(f.pos.clone(), 0xff7a2a, 18, 4); }
    }
    if (f.reflect) for (const e of enemies) {
      if (e.dead || e.type === 'dummy') continue;
      if (Math.hypot(e.pos.x - f.pos.x, e.pos.z - f.pos.z) < 0.5 + e.radius) {
        const d = new THREE.Vector2(f.vel.x, f.vel.z).normalize();
        e.takeHit(e.T.fire ? 45 : 30, d, { kb: 5, heavy: 1, guardBreak: 1 }, 1, false); floatText(e.pos.clone().setY(2.3 * e.scale), '-' + (e.T.fire ? 45 : 30), '#4fd1ff', 24);
        shock(f.pos.clone().setY(0.1), 0x4fd1ff, 1.6); sfx('firehit'); dead = true; break;
      }
    }
    if (dead) { if (f.t > 0.05) burst(f.pos.clone(), f.reflect ? 0x4fd1ff : 0xff7a2a, 10, 3); scene.remove(f.g); fireballs.splice(i, 1); }
  }
}
const EDOWN = { thug: downClips(ECROUCH, EBASE.thug), khan: downClips(ECROUCH, EBASE.khan), boss: downClips(ECROUCH, EBASE.boss) };
function staggerClip(base, long) {
  return long
    ? clip(1.5, [[0, base], [0.12, { rsx: -2.8, rsz: 0.7, lsx: -2.2, lsz: -0.4, sx: -0.55, nx: -0.6, hy: -0.04, lhx: 0.35, lkx: 0.4 }], [0.45, { rsx: -1.6, lsx: -1.2, sx: -0.25, hy: -0.2, lhx: -0.3, lkx: 0.8, rhx: 0.5, rkx: 0.6, nx: -0.2 }], [0.8, { sx: 0.45, hy: -0.3, nx: 0.5, hrz: 0.12, sz: -0.25, lsx: -0.3, rsx: -0.3, lex: -0.4, rex: -0.4, lhx: -0.5, lkx: 1.0 }], [1.15, { sx: 0.35, hy: -0.25, nx: 0.3, hrz: -0.12, sz: 0.25, lsx: -0.4, rsx: -0.4 }], [1.5, base]], base)
    : clip(0.65, [[0, base], [0.08, { sx: -0.6, nx: -0.6, hy: -0.08, lsx: 0.5, rsx: 0.5, lsz: 0.5, rsz: -0.5, lex: -0.5, rex: -0.5, lhx: 0.3, lkx: 0.4, rhx: -0.3, rkx: 0.5 }], [0.35, { sx: 0.25, hy: -0.22, nx: 0.2, lhx: -0.5, lkx: 0.9, rhx: 0.4, rkx: 0.6 }], [0.65, base]], base);
}
class Enemy {
  constructor(type, x, z) {
    const T = ETYPES[type]; this.T = T; this.type = type; const k = this.k = T.base || type;
    this.rig = makeSkinRig(k === 'boss' ? 'tohru' : k, T.scale); this.scale = T.scale; if (T.rig.katana) skKatana(this.rig);
    if (T.tint) { const tc = new THREE.Color(...T.tint); this.rig.mats.forEach(m => m.color.multiply(tc)); }
    this.anim = new Animator(this.rig.ghost); this.base = EBASE[k]; this.target = zeroPose();
    this.radius = 0.4 * T.scale;
    this.pos = new THREE.Vector3(x, 0, z); this.vel = new THREE.Vector3(); this.vy = 0;
    this.yaw = Math.atan2(-x, -z); this.hp = this.maxHp = T.hp; this.state = 'loco'; this.t = 0; this.cd = rand(0.8, 2.2);
    this.strafe = Math.random() < .5 ? 1 : -1; this.fireCd = 2.5; this.dead = false; this.holdToken = false; this.ph = rand(0, 6); this.hitN = 0;
    scene.add(this.rig.root);
    const hb = document.createElement('div'); hb.className = 'ehp' + (k === 'boss' || T.elite ? ' boss' : '');
    hb.innerHTML = `${T.name}<div><i></i></div>`; $('hud').appendChild(hb); this.hb = hb;
    burst(this.pos.clone().setY(1), type === 'khan' ? 0x7a3cff : 0xffffff, 20, 3);
  }
  setState(s, blend = 0.12) { this.state = s; this.t = 0; this.anim.blend(blend); }
  release() { if (this.holdToken) { attackTokens--; this.holdToken = false; } }
  flash(k) { this.rig.mats.forEach(m => m.emissive.setRGB(k, k * 0.12, 0)); }
  parried() { this.release(); this.flash(0); this.clip = staggerClip(this.base, true); this.setState('stagger', 0.05); this.vel.set(-Math.sin(this.yaw) * 2, 0, -Math.cos(this.yaw) * 2); floatText(this.pos.clone().setY(2.2 * this.scale), '破绽!', '#4fd1ff', 24); }
  knockDown(dir, launch) {
    this.release(); this.flash(0);
    const side = hitSide(this.yaw, this.pos.x - dir.x, this.pos.z - dir.y, this.pos.x, this.pos.z);
    this.downClip = side === 1 ? EDOWN[this.k].front : EDOWN[this.k].back;
    this.setState('down', 0.05); this.vy = launch || 3.5; this.pos.y = Math.max(this.pos.y, 0.01);
  }
  takeHit(dmg, dir, m, kbMul, counter) {
    this.hp -= dmg; this.hitN++;
    const A = this.anim;
    const side = hitSide(this.yaw, this.pos.x - dir.x, this.pos.z - dir.y, this.pos.x, this.pos.z);
    const kb = m.kb * kbMul;
    if (this.hp <= 0) { this.hp = 0; this.die(dir, m); return; }
    // 已倒地：追打只有弹簧抖动
    if (this.state === 'down') { A.kick('sx', 6); A.kick('hy', -1.5); this.vel.x += dir.x * kb * 0.3; this.vel.z += dir.y * kb * 0.3; if (m.launch) this.vy = m.launch * 0.7; return; }
    const poise = this.T.poise && !counter;
    if (poise && !m.heavy && !m.guardBreak) { // 霸体：只有叠加抖动
      A.kick(side < 2 ? 'sx' : 'sz', [-4, 4, 4, -4][side]); A.kick('nx', -4); this.vel.x += dir.x * 0.5; this.vel.z += dir.y * 0.5; return;
    }
    this.release(); this.flash(0);
    this.vel.set(dir.x * kb * (poise ? 0.4 : 1), 0, dir.y * kb * (poise ? 0.4 : 1));
    if (m.launch && !poise) { this.knockDown(dir, m.launch); return; }
    if ((m.kd && !poise) || (poise && m.guardBreak) || (counter && m.heavy)) { this.knockDown(dir, m.launch || 3.5); return; }
    if (m.heavy) { this.clip = staggerClip(this.base, false); this.setState('stagger', 0.04); A.kick('sx', -6); return; }
    // 轻击：左右交替的方向受击，叠加弹簧
    const s2 = side === 0 ? (this.hitN % 2 ? 2 : 3) : side;
    this.hitSide = s2; this.clip = flinchClip(this.base, s2 === 2 || s2 === 3 ? s2 : side);
    if (side === 0) { A.kick('sx', -7); A.kick('ny', this.hitN % 2 ? -6 : 6); A.kick('nx', -8); }
    else A.kick(side === 1 ? 'sx' : 'sz', [0, 7, 7, -7][side]);
    this.setState('hit', 0.04);
  }
  die(dir) {
    this.release(); this.dead = true; this.flash(0);
    // 影武者有几率掉落武士刀（剧情模式，地上最多 2 把）
    if (this.k === 'khan' && MODE === 'story' && Math.random() < 0.35 && groundWeapons.filter(w => w.type === 6).length < 2) {
      spawnWeapon(6, this.pos.x + rand(-0.6, 0.6), this.pos.z + rand(-0.6, 0.6));
      if (this.rig.katana) this.rig.katana.visible = false; tip('影武者掉落了「武士刀」！按 E 拾取', 2);
    }
    const side = hitSide(this.yaw, this.pos.x - dir.x, this.pos.z - dir.y, this.pos.x, this.pos.z);
    this.downClip = side === 1 ? EDOWN[this.k].front : EDOWN[this.k].back;
    this.setState('dead', 0.05); this.vel.set(dir.x * 6, 0, dir.y * 6); this.vy = 3.5; this.pos.y = Math.max(this.pos.y, 0.01);
    this.hb.remove(); kills++;
    if (this.T.dieMsg) banner(this.T.dieMsg, 3);
  }
  update(dt) {
    const p = player, T = this.T, A = this.anim, tg = this.target;
    this.t += dt; this.cd -= dt;
    const dx = p.pos.x - this.pos.x, dz = p.pos.z - this.pos.z, dist = Math.hypot(dx, dz);
    const toP = Math.atan2(dx, dz);
    const airborne = this.pos.y > 0.02;
    if (this.state === 'dead' || this.state === 'down') {
      this.vel.multiplyScalar(Math.exp(-dt * (airborne ? 0.5 : 4)));
      if (airborne) this.t = Math.min(this.t, 0.3);
      let tt = this.t;
      if (this.state === 'dead') tt = Math.min(tt, 1.0);
      sampleKeys(this.downClip.keys, Math.min(1, tt / this.downClip.dur), tg);
      if (tt >= 0.36 && tt - dt < 0.36) { burst(this.pos.clone().setY(0.15), 0xc9a27a, 12, 3); shake = Math.max(shake, 0.06); }
      if (this.state === 'down' && tt >= this.downClip.dur) { this.setState('loco', 0.15); this.cd = rand(0.3, 0.9); }
      if (this.state === 'dead' && this.t > 2.2) { const s = 1 - (this.t - 2.2) / 0.6; this.rig.root.scale.setScalar(Math.max(0.01, s) * this.scale); if (this.t > 2.8) { scene.remove(this.rig.root); this.gone = true; } }
    } else if (this.state === 'hit' || this.state === 'stagger') {
      this.vel.multiplyScalar(Math.exp(-dt * (this.state === 'hit' ? 7 : 4)));
      sampleKeys(this.clip.keys, Math.min(1, this.t / this.clip.dur), tg);
      if (this.clip.dur > 1) this.flash(0.12 + 0.1 * Math.sin(now * 25));
      if (this.t >= this.clip.dur) { this.flash(0); this.setState('loco', 0.18); this.cd = Math.max(this.cd, 0.4); }
    } else if (this.state === 'loco') {
      this.yaw += angDiff(this.yaw, toP) * (1 - Math.exp(-dt * 7));
      const want = T.range * 0.85;
      let fx = 0, fz = 0;
      if (p.state !== 'dead') {
        if (dist > want + 1.6 || (this.cd <= 0 && dist > want)) { fx = dx / dist; fz = dz / dist; }
        else if (dist < want * 0.7) { fx = -dx / dist * 0.6; fz = -dz / dist * 0.6; }
        else { fx = -dz / dist * this.strafe * 0.45; fz = dx / dist * this.strafe * 0.45; if (Math.random() < dt * 0.4) this.strafe *= -1; }
      }
      for (const o of enemies) { if (o === this || o.dead) continue; const ox = this.pos.x - o.pos.x, oz = this.pos.z - o.pos.z, od = Math.hypot(ox, oz); if (od < 1.6 && od > 0.01) { fx += ox / od * (1.6 - od); fz += oz / od * (1.6 - od); } }
      const sp = T.spd * (dist > 6 ? 1.3 : 1);
      this.vel.x = lerp(this.vel.x, fx * sp, 1 - Math.exp(-dt * 5)); this.vel.z = lerp(this.vel.z, fz * sp, 1 - Math.exp(-dt * 5));
      const vm = Math.hypot(this.vel.x, this.vel.z);
      // 横移时步伐减半，避免“滑步感”
      const fwdV = (this.vel.x * Math.sin(this.yaw) + this.vel.z * Math.cos(this.yaw));
      this.ph += dt * vm * 3.4 * (fwdV < -0.2 ? -1 : 1);
      locoPose(tg, this.base, vm, this.ph, { noArmSwing: this.type !== 'thug' });
      const maxTok = T.elite ? 3 : 2;
      if (T.fire && !this.raged && this.hp < this.maxHp * 0.5) { this.raged = true; this.fireCd = 0; banner('瓦尔蒙：“龙之力……全都是我的！”<small>火球变成三连发了——蹲下或闪避！</small>', 2.5); shock(this.pos.clone().setY(0.1), 0xff7a2a, 3); burst(this.pos.clone().setY(1.2), 0xff7a2a, 40, 6); shake = 0.3; }
      if (T.fire && p.state !== 'dead' && (this.fireCd -= dt) <= 0 && dist > 3.2 && dist < 15) {
        this.atk = FIRE_ATK; this.fireCd = this.raged ? rand(2.2, 3.2) : rand(3.5, 5); this.setState('attack', 0.14); this.didHit = false;
      } else if (this.cd <= 0 && dist < T.range + 0.4 && p.state !== 'dead' && (attackTokens < maxTok || this.k === 'boss')) {
        const list = EATK[this.k];
        this.atk = this.k === 'boss' ? list[Math.random() < (this.type === 'boss2' ? 0.5 : 0.4) ? 1 : 0] : list[Math.random() < 0.3 ? 1 : 0];
        if (this.k === 'thug' && this.atk.name === 'kick' && dist > 1.9) this.atk = list[0];
        this.setState('attack', 0.14); this.atkN = (this.atkN || 0) + 1; attackTokens++; this.holdToken = true; this.didHit = false;
      }
    } else if (this.state === 'attack') {
      const a = this.atk;
      sampleKeys(a.keys, Math.min(1, this.t / a.dur), tg);
      if (this.t < a.wind * 0.75) this.yaw += angDiff(this.yaw, toP) * (1 - Math.exp(-dt * 9));
      // 蓄力红光
      if (a.proj && this.t < a.wind && Math.random() < dt * 30) burst(this.pos.clone().add(new THREE.Vector3(Math.sin(this.yaw) * 0.5, 1.25 * this.scale, Math.cos(this.yaw) * 0.5)), 0xff7a2a, 2, 1.5);
      if (this.t < a.wind) this.flash(Math.min(1, this.t / a.wind) * 0.55 * (0.65 + 0.35 * Math.sin(now * 40)));
      else this.flash(0);
      let ls = 0; if (a.lunge && this.t > a.lunge[0] && this.t < a.lunge[1]) ls = a.lunge[2] * Math.sin(Math.PI * (this.t - a.lunge[0]) / (a.lunge[1] - a.lunge[0]));
      if (dist < 0.9 + this.radius) ls = 0;
      this.vel.x = lerp(this.vel.x, Math.sin(this.yaw) * ls, 1 - Math.exp(-dt * 20)); this.vel.z = lerp(this.vel.z, Math.cos(this.yaw) * ls, 1 - Math.exp(-dt * 20));
      if (this.t >= a.wind && this.t - dt < a.wind) sfx('whoosh');
      if (!this.didHit && this.t >= a.hit) {
        this.didHit = true;
        if (a.proj) spawnFireballs(this);
        else if (a.aoe) {
          const c = this.pos.clone().add(new THREE.Vector3(Math.sin(this.yaw), 0, Math.cos(this.yaw)).multiplyScalar(1.4));
          shock(c, 0xff6a3a, 2.2); shake = 0.35; sfx('heavy'); burst(c.setY(0.2), 0xc9a27a, 30, 6); A.kick('hy', -2);
          if (Math.hypot(p.pos.x - c.x, p.pos.z - c.z) < a.range && p.pos.y < 1.0) playerTakeHit(this, Math.round(T.dmg * 1.4), { kd: 1, unblockable: 1 });
        } else {
          const ang = Math.abs(angDiff(this.yaw, toP));
          if (dist < a.range + 0.45 && ang < 1.0 && p.pos.y < 1.4) playerTakeHit(this, T.dmg, { high: a.high, kd: a.kd });
        }
      }
      if (this.t >= a.hit + 0.1) this.release();
      if (this.t >= a.dur) { this.setState('loco', 0.2); this.cd = this.k === 'boss' ? (this.type === 'boss2' ? rand(0.7, 1.5) : rand(1.0, 2.0)) : T.elite ? rand(0.8, 1.8) : rand(1.3, 2.8); if (Runes.has('snake')) this.cd *= 1.35; }
    }
    A.update(tg, dt);
    // 物理
    this.vy -= 22 * dt; this.pos.y += this.vy * dt;
    if (this.pos.y < 0) { if (this.vy < -6) { shake = Math.max(shake, 0.1); A.kick('hy', -2); } this.pos.y = 0; this.vy = 0; }
    this.pos.x += this.vel.x * dt; this.pos.z += this.vel.z * dt;
    collideCircle(this.pos, this.radius);
    this.rig.root.position.copy(this.pos); this.rig.root.rotation.y = this.yaw;
    driveSkinEnemy(this, dt);
    if (!this.dead) {
      const s = toScreen(this.pos.clone().setY(this.pos.y + 2.05 * this.scale));
      const far = Math.hypot(this.pos.x - camera.position.x, this.pos.z - camera.position.z) > 28;
      this.hb.style.display = s.vis && !far ? 'block' : 'none';
      this.hb.style.left = s.x + 'px'; this.hb.style.top = s.y + 'px';
      this.hb.querySelector('i').style.width = (this.hp / this.maxHp * 100) + '%';
    }
  }
}

// ================= 武器拾取 =================
const groundWeapons = [];
function spawnWeapon(type, x, z, dur) {
  const mesh = weaponMesh(type); scene.add(mesh);
  const w = { type, mesh, pos: new THREE.Vector3(x, 0, z), dur: dur ?? WEAPONS[type].dur };
  mesh.position.set(x, 0.15, z); mesh.rotation.set(0, rand(0, TAU), 0);
  groundWeapons.push(w); return w;
}
function nearestWeapon() {
  let best = null, bd = 1.8;
  for (const w of groundWeapons) { const d = Math.hypot(w.pos.x - player.pos.x, w.pos.z - player.pos.z); if (d < bd) { bd = d; best = w; } }
  return best;
}
function pickupOrDrop() {
  const p = player; if (p.state !== 'loco') return;
  const w = nearestWeapon();
  if (!w) { // 附近没有武器：有备用就换手，没有就丢下
    if (p.weapon2) { swapWeapons(); return; }
    if (p.weapon) { const old = p.weapon; old.mesh.removeFromParent(); spawnWeapon(old.type, p.pos.x + Math.sin(p.yaw) * 0.8, p.pos.z + Math.cos(p.yaw) * 0.8, old.dur); p.weapon = null; tip('丢下武器'); refreshChips(); }
    return;
  }
  let msg = '';
  if (p.weapon) {
    if (!p.weapon2) { stowWeapon(); msg = `（「${WEAPONS[p.weapon2.type].name}」收进背包）`; }
    else { const old = p.weapon; old.mesh.removeFromParent(); spawnWeapon(old.type, p.pos.x + Math.sin(p.yaw) * 0.8, p.pos.z + Math.cos(p.yaw) * 0.8, old.dur); p.weapon = null; msg = `（丢下「${WEAPONS[old.type].name}」，背包满了）`; }
  }
  groundWeapons.splice(groundWeapons.indexOf(w), 1); scene.remove(w.mesh);
  p.weapon = equipMesh({ type: w.type, dur: w.dur });
  if (p.mode !== 'fist') toggleMode();
  tip(`拿起了「${WEAPONS[w.type].name}」${msg || '——成龙式就地取材！'}`, 2);
  refreshChips();
}
function breakWeapon() {
  const w = player.weapon; burst(player.pos.clone().setY(1.2), 0xaa7744, 24, 5);
  w.mesh.removeFromParent(); player.weapon = null; sfx('clang');
  if (WEAPONS[w.type].fragile) { burst(player.pos.clone().setY(1.3), 0x3fa060, 30, 6); tip(`「${WEAPONS[w.type].name}」砸碎了！`); } else tip(`「${WEAPONS[w.type].name}」坏了！ 糟了糟了！`);
  refreshChips();
}

// ================= 护身符 =================
const TALIS = [ // 世界里可捡的护身符 → 符文
  { name: '兔符', key: 'rabbit', color: 0x7fe9ff },
  { name: '牛符', key: 'ox', color: 0xff8a3a },
  { name: '狗符', key: 'dog', color: 0x8cff7a },
];
const talismans = [];
// 性能：灯光数量一变，所有材质都要重新编译着色器（=卡顿）。所以护身符的灯一开始就放好，只改亮度
const TAL_LIGHTS = [0, 1, 2].map(() => { const l = new THREE.PointLight(0xffffff, 0, 6); l.position.set(0, -50, 0); scene.add(l); return l; });
const TAL_GEO = new THREE.CylinderGeometry(0.35, 0.35, 0.08, 8);
const TAL_MATS = TALIS.map(T => M(T.color, { emissive: T.color, emissiveIntensity: 1.5 }));
function spawnTalisman(i, x, z) {
  const T = TALIS[i];
  const m = new THREE.Mesh(TAL_GEO, TAL_MATS[i]);
  m.rotation.x = Math.PI / 2; const g = new THREE.Group(); g.add(m); g.position.set(x, 1.1, z); scene.add(g);
  const light = TAL_LIGHTS.find(l => !l.userData.used); if (light) { light.userData.used = true; light.color.setHex(T.color); light.intensity = 6; }
  talismans.push({ i, g, pos: g.position, light });
}
function updatePickups(dt) {
  for (let j = talismans.length - 1; j >= 0; j--) {
    const t = talismans[j]; t.g.rotation.y += dt * 2; t.g.position.y = 1.1 + Math.sin(now * 3) * 0.15; if (t.light) t.light.position.copy(t.g.position);
    if (Math.hypot(t.pos.x - player.pos.x, t.pos.z - player.pos.z) < 1.0) {
      const T = TALIS[t.i]; scene.remove(t.g); talismans.splice(j, 1);
      if (t.light) { t.light.intensity = 0; t.light.userData.used = false; t.light.position.set(0, -50, 0); }
      if (T.key === 'dog') { player.hp = player.maxHp; floatText(player.pos.clone().setY(1.8), '生命回满', '#8cff7a', 22); }
      if (!Runes.award(T.key)) tip(`${T.name}（已拥有）${T.key === 'dog' ? '——生命回满！' : ''}`, 1.6);
      burst(player.pos.clone().setY(1.2), T.color, 40, 5); shock(player.pos, T.color, 2);
    }
  }
  for (const w of groundWeapons) { w.mesh.rotation.y += dt * 0.8; w.mesh.position.y = 0.15 + Math.sin(now * 2 + w.pos.x) * 0.05; }
  const w = nearestWeapon();
  if (w && player.state === 'loco' && tipTimer <= 0) { $('tip').textContent = `按 E 拾取「${WEAPONS[w.type].name}」${player.weapon && !player.weapon2 ? '（手中武器收进背包）' : ''}`; $('tip').style.opacity = 1; }
  else if (tipTimer <= 0) $('tip').style.opacity = 0;
}

// ================= 波次（由剧情驱动） =================
const WAVES = [
  { title: '第一章 · 老爹的古董店', sub: '黑手帮闯进来了——小心别打碎古董！', list: ['thug', 'thug', 'thug'] },
  { title: '第二章 · 唐人街追击', sub: '影武者从阴影中出现……', list: ['khan', 'khan', 'thug', 'khan', 'khan'] },
  { title: '第三章 · 大块头 刀鲁', sub: '小心他的重踏——挡不住，只能闪！', list: ['boss', 'khan', 'khan'], boss: 1 },
  { title: '第四章 · 渔人码头', sub: '深夜的码头，黑手帮在等着你', list: ['thug', 'thug', 'khan', 'thug', 'thug'] },
  { title: '第四章 · 黑手帮三人组', sub: '芬恩、拉索、阿周——一起上！', list: ['finn', 'ratso', 'chow'], at: [[-2.5, -9], [0, -10], [2.5, -9]], boss: 1 },
  { title: '第五章 · 仓库决战', sub: '刀鲁卷土重来——护身符就在他身后！', list: ['boss2', 'khan', 'khan'], at: [[0, -6], [-4, -3], [4, -3]], boss: 1 },
  { title: '第六章 · 龙王庙之夜', sub: '黑手帮已经先到一步', list: ['thug', 'thug', 'khan', 'thug', 'khan', 'thug'] },
  { title: '第七章 · 赤影忍者', sub: '红衣忍者出手更快——铁臂打手只有重击才打得动', list: ['ninja', 'ninja', 'brute', 'ninja', 'ninja'], at: [[-4, -4], [4, -4], [0, -5.5], [-7, 0], [7, 0]] },
  { title: '第八章 · 龙之力 · 瓦尔蒙', sub: '火球可以蹲下躲开——完美格挡能把它打回去！', list: ['valmont', 'ninja', 'ninja'], at: [[0, -5.5], [-4.5, -3], [4.5, -3]], boss: 1 },
];
// 章节（主界面“章节选择”用）：w = 从第几波开始
const CHAPTERS = [
  { w: 0, n: '第一章', t: '老爹的古董店', d: '黑手帮闯进古董店抢护身符' },
  { w: 1, n: '第二章', t: '唐人街追击', d: '黄昏的唐人街，影武者现身' },
  { w: 2, n: '第三章', t: '大块头 刀鲁', d: '第一次和刀鲁正面交手' },
  { w: 3, n: '第四章', t: '渔人码头', d: '深夜码头 · 黑手帮三人组' },
  { w: 5, n: '第五章', t: '仓库决战', d: '暴怒的刀鲁守着公鸡护身符' },
  { w: 6, n: '第六章', t: '龙王庙之夜', d: '第二集 · 夜探唐人街龙王庙', ep: 2 },
  { w: 7, n: '第七章', t: '赤影忍者', d: '第二集 · 红衣忍者与铁臂打手', ep: 2 },
  { w: 8, n: '第八章', t: '龙之力 · 瓦尔蒙', d: '第二集 · 黑手帮老大夺走了龙之护身符', ep: 2 },
];
function chapterOf(w) { let c = 0; CHAPTERS.forEach((C, i) => { if (w >= C.w) c = i; }); return c; }
let wave = -1, waveDelay = 0, kills = 0, gameOver = false, waveDone = true;
function spawnWave(i) {
  wave = i; waveDone = false; const W = WAVES[i];
  $('wave').textContent = W.title;
  W.list.forEach((t, k) => {
    let x, z;
    if (W.at) { x = AREA.cx + W.at[k][0]; z = AREA.cz + W.at[k][1]; }
    else if (AREA.room) { x = AREA.cx + (k - (W.list.length - 1) / 2) * 1.6; z = AREA.cz + AREA.hz - 1.2 - (k % 2) * 0.8; }
    else {
      const a = (k / W.list.length) * TAU + rand(-0.3, 0.3) + Math.atan2(AREA.cx - player.pos.x, AREA.cz - player.pos.z);
      const r = t === 'boss' ? 9 : rand(Math.min(12, AREA.hz - 2), Math.min(16, AREA.hz + 2));
      x = clamp(player.pos.x + Math.sin(a) * r, AREA.cx - AREA.hx + 1.5, AREA.cx + AREA.hx - 1.5); z = clamp(player.pos.z + Math.cos(a) * r, AREA.cz - AREA.hz + 1.5, AREA.cz + AREA.hz - 1.5);
    }
    const e = new Enemy(t, x, z); e.yaw = Math.atan2(player.pos.x - x, player.pos.z - z); enemies.push(e);
  });
}
function startWave(i) { if (wave !== i || waveDone) spawnWave(i); const W = WAVES[i]; saveProgress(i); banner(`${W.title}<small>${W.sub}</small>`, 3); }
function updateWaves(dt) {
  { const alive = enemies.some(e => !e.dead && e.type !== 'dummy'); const tgt = !alive ? 0.45 : WAVES[wave] && WAVES[wave].boss ? 1.2 : 1.0; Music.intensity += (tgt - Music.intensity) * Math.min(1, dt * 0.8); }
  for (let i = enemies.length - 1; i >= 0; i--) if (enemies[i].gone) enemies.splice(i, 1);
  updateFireballs(dt);
  if (gameOver || wave < 0 || waveDone) return;
  if (!enemies.some(e => !e.dead && e.type !== 'dummy')) { waveDone = true; Story.onClear(wave); }
}
let gameEndTimer = null;
function gameEnd(win, ep = 1) {
  gameOver = true;
  try { if (win) { sessionStorage.removeItem('jc_ch'); localStorage.setItem('jc_clear', '1'); if (ep === 1) saveProgress(6); else localStorage.setItem('jc_clear2', '1'); } else sessionStorage.setItem('jc_ch', String(Math.max(0, wave))); } catch (e) { }
  const mins = Math.floor(playTime / 60), secs = Math.floor(playTime % 60);
  clearTimeout(gameEndTimer);
  gameEndTimer = setTimeout(() => {
    document.exitPointerLock(); $('pause').classList.remove('show');
    $('ov').style.display = 'flex';
    $('ov').querySelector('.box').innerHTML = win && ep === 2
      ? `<h1>完</h1><h2>第二集 · 龙之护身符</h2><p>击倒敌人 ${kills} 名 · 用时 ${mins} 分 ${secs} 秒<br>老爹：“两个找回来了……还有十个！”</p><p style="opacity:.6;font-size:13px">下一集预告：蛇之护身符（敬请期待）</p><div class="obtns"><div class="go" data-a="menu">返回主界面</div><div class="go alt" data-a="dojo">去练功房</div></div>`
      : win
      ? `<h1>完</h1><h2>第一集 · 公鸡护身符</h2><p>击倒敌人 ${kills} 名 · 打碎古董 ${Story.broken} 件 · 用时 ${mins} 分 ${secs} 秒<br>老爹：“一个护身符找回来了……还有十一个！”</p><p style="opacity:.6;font-size:13px">下一集：龙之护身符——瓦尔蒙亲自出手了！</p><div class="obtns"><div class="go" data-a="ep2">继续第二集 ▶</div><div class="go alt" data-a="menu">返回主界面</div><div class="go alt" data-a="dojo">去练功房</div></div>`
      : `<h1>糟了糟了！</h1><h2>成龙倒下了 · ${WAVES[wave] ? WAVES[wave].title : ''}</h2><p>击倒敌人 ${kills} 名。小提示：倒地后按 Alt 快速起身；敌人发红光出手前一瞬按 Q 完美格挡；去练功房可以随便练连招。</p><div class="obtns"><div class="go" data-a="retry">从本章重来</div><div class="go alt" data-a="menu">返回主界面</div></div>`;
  }, win ? 1500 : 1800);
}
