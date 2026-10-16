// ================= 人物模型（分段式卡通角色） =================
const PK = ['hy', 'hx', 'hry', 'hrz', 'sx', 'sy', 'sz', 'nx', 'ny', 'lsx', 'lsy', 'lsz', 'lex', 'rsx', 'rsy', 'rsz', 'rex', 'lhx', 'lhy', 'lhz', 'lkx', 'rhx', 'rhy', 'rhz', 'rkx'];
const zeroPose = () => { const p = {}; PK.forEach(k => p[k] = 0); return p; };
const GEO = {};
// 带肌肉弧度的四肢（车削体，两端圆头），自上而下长度 len
function limbGeo(r0, r1, len, bulge = 0.1) {
  const key = [r0, r1, len, bulge].join(); if (GEO[key]) return GEO[key];
  const pts = [];
  for (let i = 0; i <= 6; i++) { const a = Math.PI / 2 * (i / 6); pts.push(new THREE.Vector2(Math.sin(a) * r1 + 0.0001, -len - Math.cos(a) * r1 * 0.8)); }
  for (let i = 1; i < 10; i++) { const t = i / 10; pts.push(new THREE.Vector2(lerp(r1, r0, t) * (1 + bulge * Math.sin(Math.PI * t)), -len + len * t)); }
  for (let i = 0; i <= 6; i++) { const a = Math.PI / 2 * (1 - i / 6); pts.push(new THREE.Vector2(Math.sin(a) * r0 + 0.0001, Math.cos(a) * r0 * 0.8)); }
  return GEO[key] = new THREE.LatheGeometry(pts, 16);
}
function torsoGeo(waist, chest, shoulder, h) {
  const key = 't' + [waist, chest, shoulder, h].join(); if (GEO[key]) return GEO[key];
  const prof = [[0.001, -0.02], [waist * 0.95, -0.01], [waist, 0.05], [waist * 1.02, 0.15], [chest * 0.95, 0.28], [chest, 0.36], [shoulder, 0.45], [shoulder * 0.8, 0.52], [0.09, 0.56], [0.001, 0.565]];
  const g = new THREE.LatheGeometry(prof.map(([r, y]) => new THREE.Vector2(r, y * h / 0.56)), 20);
  return GEO[key] = g;
}
const SPH = (r, ws = 16, hs = 12) => GEO['s' + r + ws] || (GEO['s' + r + ws] = new THREE.SphereGeometry(r, ws, hs));

function makeRig(c) {
  const root = new THREE.Group();
  const skin = M(c.skin || 0xf2c49b), shirt = M(c.shirt), pants = M(c.pants), shoe = M(c.shoe || 0x241812), hairM = M(c.hair || 0x15100c);
  const dark = M(0x1a1210), white = M(0xfaf6ee), sleeve = c.sleeve === 'skin' ? skin : shirt;
  const hips = new THREE.Group(); hips.position.y = 0.98; root.add(hips);
  // 骨盆
  const pel = mesh(SPH(0.17, 18, 12), pants, 0, -0.02, 0, hips); pel.scale.set(1.05, 0.75, 0.75);
  if (c.belt) { const b = mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.06, 20), M(c.belt), 0, 0.06, 0, hips); b.scale.z = 0.72; box(0.07, 0.05, 0.02, M(0xd8a53a), 0, 0.06, 0.125, hips); }
  const spine = new THREE.Group(); spine.position.y = 0.08; hips.add(spine);
  // 躯干
  const bulk = c.bulk || 1;
  const torso = mesh(torsoGeo(0.15 * bulk, 0.205 * bulk, 0.215 * bulk, 0.56), shirt, 0, -0.02, 0, spine); torso.scale.z = 0.62;
  if (c.belly) { const bl = mesh(SPH(0.2), shirt, 0, 0.14, 0.05, spine); bl.scale.set(1.05, 0.95, 0.8); }
  if (c.suit) { // 西装：白衬衫 V 领 + 领带 + 翻领
    const v = mesh(new THREE.ConeGeometry(0.08, 0.26, 3), white, 0, 0.42, 0.115, spine); v.rotation.set(Math.PI, 0, 0); v.scale.z = 0.25;
    box(0.035, 0.24, 0.015, M(c.tie || 0x8a1a1a), 0, 0.38, 0.135, spine);
    [-1, 1].forEach(s => { const l = box(0.05, 0.22, 0.02, M(0x101114), s * 0.06, 0.4, 0.13, spine); l.rotation.z = s * 0.35; });
  }
  if (c.vest) { [-1, 1].forEach(s => { const v = box(0.13, 0.46, 0.04, M(c.vest), s * 0.12, 0.27, 0.125, spine); v.rotation.z = -s * 0.08; }); }
  if (c.collar) { const co = mesh(new THREE.TorusGeometry(0.075, 0.025, 8, 18), shirt, 0, 0.52, 0, spine); co.rotation.x = Math.PI / 2; }
  if (c.sash) { const s = mesh(new THREE.CylinderGeometry(0.16, 0.165, 0.08, 20), M(c.sash), 0, 0.05, 0, spine); s.scale.z = 0.7; box(0.06, 0.25, 0.02, M(c.sash), 0.08, -0.1, -0.12, spine).rotation.z = 0.2; }
  // 脖子+头
  const neck = new THREE.Group(); neck.position.y = 0.55; spine.add(neck);
  mesh(new THREE.CylinderGeometry(0.055, 0.065, 0.12, 12), skin, 0, 0.02, 0, neck);
  const headParts = [];
  const hp = (m) => (headParts.push(m), m);
  const head = hp(mesh(SPH(0.122, 20, 16), c.hood ? hairM : skin, 0, 0.16, 0.005, neck)); head.scale.set(0.95, 1.1, 1.02);
  const jaw = hp(mesh(SPH(0.09, 16, 12), c.hood ? hairM : skin, 0, 0.1, 0.035, neck)); jaw.scale.set(1.05, 0.8, 1);
  if (!c.hood) {
    [-1, 1].forEach(s => { const e = hp(mesh(SPH(0.03, 10, 8), skin, s * 0.118, 0.155, 0, neck)); e.scale.set(0.5, 1, 0.8); });
    const nose = hp(mesh(SPH(0.022, 10, 8), skin, 0, 0.14, 0.125, neck)); nose.scale.set(1, 0.9, 1.1);
    if (c.glasses) {
      [-1, 1].forEach(s => { const g = hp(mesh(SPH(0.032, 12, 8), M(0x050505), s * 0.045, 0.175, 0.105, neck)); g.scale.set(1.2, 0.75, 0.4); });
      hp(box(0.13, 0.012, 0.012, M(0x050505), 0, 0.185, 0.118, neck));
    } else {
      [-1, 1].forEach(s => {
        const w = hp(mesh(SPH(0.02, 10, 8), white, s * 0.045, 0.172, 0.105, neck, false)); w.scale.set(1.2, 0.8, 0.5);
        hp(mesh(SPH(0.011, 8, 6), dark, s * 0.045, 0.171, 0.114, neck, false));
        const br = hp(box(0.05, 0.012, 0.015, hairM, s * 0.047, 0.205, 0.112, neck)); br.rotation.z = s * -0.12;
      });
    }
    hp(box(0.05, 0.008, 0.01, M(0x8a4a3a), 0, 0.095, 0.118, neck));
  }
  // 发型
  if (c.hairStyle === 'jackie') {
    const cap = hp(mesh(new THREE.SphereGeometry(0.13, 20, 12, 0, TAU, 0, 1.75), hairM, 0, 0.175, -0.008, neck)); cap.scale.set(1, 1.08, 1.05);
    for (let i = 0; i < 5; i++) { const f = hp(mesh(SPH(0.045, 10, 8), hairM, -0.07 + i * 0.035, 0.255, 0.08, neck)); f.scale.set(1.0, 0.55, 0.8); f.rotation.z = 0.5; }
    [-1, 1].forEach(s => { const sb = hp(mesh(SPH(0.04, 10, 8), hairM, s * 0.11, 0.2, 0.01, neck)); sb.scale.set(0.5, 1.2, 1.2); });
  } else if (c.hairStyle === 'slick') {
    const cap = hp(mesh(new THREE.SphereGeometry(0.128, 20, 12, 0, TAU, 0, 1.55), hairM, 0, 0.18, -0.015, neck)); cap.scale.set(1, 1.05, 1.08);
  } else if (c.hood) {
    [-1, 1].forEach(s => { const e = hp(mesh(SPH(0.02, 10, 8), glowMat(5, 0.25, 0.15), s * 0.045, 0.175, 0.112, neck, false)); e.scale.set(1.5, 0.55, 0.5); });
    const tail = hp(box(0.06, 0.3, 0.02, hairM, 0.03, 0.05, -0.13, neck)); tail.rotation.x = 0.5;
  } else if (c.topknot) {
    hp(mesh(SPH(0.04), hairM, 0, 0.305, -0.03, neck));
    const tail = hp(mesh(limbGeo(0.02, 0.012, 0.25, 0), hairM, 0, 0.3, -0.06, neck)); tail.rotation.x = 0.9;
  }
  // 手臂
  function arm(side) {
    const s = new THREE.Group(); s.position.set(0.25 * side * bulk, 0.47, 0); spine.add(s);
    mesh(SPH(0.07 * bulk), sleeve, 0, 0, 0, s);
    mesh(limbGeo(0.063 * bulk, 0.05 * bulk, 0.28, 0.15), sleeve, 0, -0.01, 0, s);
    const e = new THREE.Group(); e.position.y = -0.3; s.add(e);
    if (c.cuff) { const cf = mesh(new THREE.TorusGeometry(0.052, 0.018, 8, 16), shirt, 0, 0.0, 0, e); cf.rotation.x = Math.PI / 2; }
    mesh(limbGeo(0.05 * bulk, 0.038 * bulk, 0.25, 0.12), c.forearm === 'shirt' ? shirt : skin, 0, 0, 0, e);
    const hand = new THREE.Group(); hand.position.y = -0.3; e.add(hand);
    const palm = mesh(SPH(0.052, 12, 10), skin, 0, 0.005, 0, hand); palm.scale.set(0.85, 1.1, 1.0);
    for (let i = 0; i < 4; i++) mesh(SPH(0.019, 8, 6), skin, -0.03 + i * 0.02, -0.035, 0.03, hand, false);
    const th = mesh(SPH(0.02, 8, 6), skin, -side * 0.04, -0.01, 0.035, hand, false); th.scale.set(0.8, 1.4, 0.8);
    if (c.forearm === 'shirt' && c.suit) mesh(new THREE.CylinderGeometry(0.042, 0.042, 0.03, 12), white, 0, 0.05, 0, hand);
    return [s, e, hand];
  }
  function leg(side) {
    const h = new THREE.Group(); h.position.set(0.1 * side * bulk, -0.05, 0); hips.add(h);
    mesh(limbGeo(0.085 * bulk, 0.065 * bulk, 0.42, 0.12), pants, 0, 0, 0, h);
    const k = new THREE.Group(); k.position.y = -0.44; h.add(k);
    mesh(SPH(0.066 * bulk), pants, 0, 0, 0, k);
    mesh(limbGeo(0.065 * bulk, 0.05 * bulk, 0.38, 0.1), pants, 0, 0, 0, k);
    if (c.wraps) mesh(new THREE.CylinderGeometry(0.055, 0.058, 0.12, 12), M(c.wraps), 0, -0.34, 0, k);
    const foot = mesh(new THREE.CapsuleGeometry(0.055, 0.14, 4, 10), shoe, 0, -0.44, 0.045, k); foot.rotation.x = Math.PI / 2; foot.scale.set(1.05, 1, 0.8);
    box(0.11, 0.025, 0.25, dark, 0, -0.475, 0.045, k);
    return [h, k, foot];
  }
  const [lS, lE, lHand] = arm(1), [rS, rE, rHand] = arm(-1);
  const [lH, lK, lFoot] = leg(1), [rH, rK, rFoot] = leg(-1);
  if (c.katana) {
    const kg = new THREE.Group(); rHand.add(kg); kg.rotation.x = 0.2;
    mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.22, 8), M(0x2a1030), 0, 0, 0.0, kg).rotation.x = Math.PI / 2;
    const gd = mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.015, 12), M(0xb08a3a), 0, 0, 0.11, kg); gd.rotation.x = Math.PI / 2;
    const bl = box(0.012, 0.035, 0.75, M(0xc8cfe0, { emissive: 0x302050 }), 0, 0, 0.5, kg);
  }
  const mats = [];
  root.traverse(o => { if (o.isMesh && o.material.emissive && !mats.includes(o.material)) mats.push(o.material); });
  return { root, hips, spine, neck, lS, lE, rS, rE, lH, lK, rH, rK, rHand, lHand, lFoot, rFoot, headParts, mats, cur: zeroPose() };
}

function applyPose(r, p) {
  r.hips.position.y = 0.98 + p.hy; r.hips.rotation.set(p.hx, p.hry, p.hrz);
  r.spine.rotation.set(p.sx, p.sy, p.sz); r.neck.rotation.set(p.nx, p.ny, 0);
  r.lS.rotation.set(p.lsx, p.lsy, p.lsz); r.lE.rotation.x = p.lex;
  r.rS.rotation.set(p.rsx, p.rsy, p.rsz); r.rE.rotation.x = p.rex;
  r.lH.rotation.set(p.lhx, p.lhy, p.lhz); r.lK.rotation.x = p.lkx;
  r.rH.rotation.set(p.rhx, p.rhy, p.rhz); r.rK.rotation.x = p.rkx;
}

// ================= 动画核心：Catmull-Rom 关键帧 + 交叉淡入 + 弹簧叠加 =================
function catmull(p0, p1, p2, p3, u) { const u2 = u * u, u3 = u2 * u; return 0.5 * (2 * p1 + (-p0 + p2) * u + (2 * p0 - 5 * p1 + 4 * p2 - p3) * u2 + (-p0 + 3 * p1 - 3 * p2 + p3) * u3); }
const _sk = zeroPose();
function sampleKeys(keys, t, out = _sk) {
  const n = keys.length;
  if (t <= keys[0][0]) { for (const k of PK) out[k] = keys[0][1][k]; return out; }
  if (t >= keys[n - 1][0]) { for (const k of PK) out[k] = keys[n - 1][1][k]; return out; }
  let i = 0; while (i < n - 2 && t > keys[i + 1][0]) i++;
  const a = keys[Math.max(0, i - 1)][1], b = keys[i][1], c = keys[i + 1][1], d = keys[Math.min(n - 1, i + 2)][1];
  const u = (t - keys[i][0]) / (keys[i + 1][0] - keys[i][0]);
  for (const k of PK) out[k] = catmull(a[k], b[k], c[k], d[k], u);
  return out;
}
const SPRING_KEYS = ['sx', 'sy', 'sz', 'nx', 'ny', 'hy', 'hrz', 'lsx', 'rsx', 'lsz', 'rsz', 'lex', 'rex'];
class Animator {
  constructor(rig) {
    this.rig = rig; this.out = zeroPose(); this.from = zeroPose(); this.fin = zeroPose();
    this.bt = 1; this.bd = 0; this.sp = {}; this.sv = {};
    SPRING_KEYS.forEach(k => { this.sp[k] = 0; this.sv[k] = 0; });
    rig.cur = this.out;
  }
  // 从当前姿态开始交叉淡入到新动画
  blend(d) {
    for (const k of PK) this.from[k] = this.out[k];
    this.from.hry = wrap(this.from.hry); this.from.hx = wrap(this.from.hx);
    this.bt = 0; this.bd = d;
  }
  kick(k, v) { this.sv[k] += v; }
  update(target, dt) {
    const o = this.out;
    if (this.bt < this.bd) {
      this.bt += dt; let u = Math.min(1, this.bt / this.bd); u = u * u * (3 - 2 * u);
      for (const k of PK) o[k] = this.from[k] + (target[k] - this.from[k]) * u;
    } else for (const k of PK) o[k] = target[k];
    const f = this.fin; for (const k of PK) f[k] = o[k];
    const h = Math.min(dt, 1 / 60), steps = Math.max(1, Math.ceil(dt / h));
    for (const k of SPRING_KEYS) {
      for (let s = 0; s < steps; s++) { const a = -170 * this.sp[k] - 15 * this.sv[k]; this.sv[k] += a * dt / steps; this.sp[k] += this.sv[k] * dt / steps; }
      f[k] += this.sp[k];
    }
    applyPose(this.rig, f);
  }
}
// 平滑的姿态基准（站立/蹲下/格挡/拳法之间切换不跳变）
function approachPose(cur, target, dt, k) { const a = 1 - Math.exp(-dt * k); for (const key of PK) cur[key] += (target[key] - cur[key]) * a; return cur; }
// 移动混合：待机→走→跑 按速度连续混合
function locoPose(out, base, speed, phase, o = {}) {
  for (const k of PK) out[k] = base[k];
  const w = clamp(speed / 3.0, 0, 1), r = clamp((speed - 3.8) / 2.4, 0, 1);
  const s = Math.sin(phase), c = Math.cos(phase);
  // 呼吸
  out.sx += Math.sin(now * 2.2) * 0.02 * (1 - w); out.lsx += Math.sin(now * 2.2) * 0.03 * (1 - w); out.rsx += Math.sin(now * 2.2 + .5) * 0.03 * (1 - w);
  if (w <= 0.001) return out;
  const amp = o.crouch ? 0.35 : 0.5 + r * 0.35;
  if (!o.crouch) {
    out.lhx = lerp(base.lhx, -0.08, w); out.rhx = lerp(base.rhx, -0.08, w);
    out.lkx = lerp(base.lkx, 0.12, w); out.rkx = lerp(base.rkx, 0.12, w);
    out.hry = lerp(base.hry, 0, w); out.sy = lerp(base.sy, 0, w);
  }
  out.lhx -= s * amp * w; out.rhx += s * amp * w;
  out.lkx += Math.max(0, c) * amp * 1.5 * w; out.rkx += Math.max(0, -c) * amp * 1.5 * w;
  out.hy -= Math.abs(s) * (0.035 + r * 0.04) * w;
  out.hry += s * 0.12 * w; out.sy -= s * 0.2 * w; out.hrz += c * 0.04 * w;
  out.sx += 0.08 * w + 0.28 * r; out.nx -= 0.12 * r;
  out.lsx -= s * 0.1 * w; out.rsx += s * 0.1 * w;
  if (r > 0 && !o.noArmSwing) {
    out.lsx = lerp(out.lsx, -0.25 + s * 0.85, r); out.rsx = lerp(out.rsx, -0.25 - s * 0.85, r);
    out.lex = lerp(out.lex, -1.5, r); out.rex = lerp(out.rex, -1.5, r); out.lsz = lerp(out.lsz, 0.1, r); out.rsz = lerp(out.rsz, -0.1, r);
  }
  return out;
}
// 关键帧（秒）→ 归一化
function clip(dur, keys, base) { return { dur, keys: keys.map(([t, p]) => [t / dur, Object.assign(zeroPose(), base, p)]) }; }
// 倒地 / 起身 时间线（秒）
const LIE_BACK = { hy: -0.8, hx: -1.48, sx: 0.05, nx: 0.25, lsx: -0.4, lsz: 1.1, lex: -0.5, rsx: -0.4, rsz: -1.1, rex: -0.5, lhx: -0.3, lkx: 0.5, rhx: 0.05, rkx: 0.15 };
const LIE_FRONT = { hy: -0.83, hx: 1.45, nx: -0.6, lsx: -2.4, lsz: 0.3, lex: -0.6, rsx: -2.2, rsz: -0.3, rex: -0.4, lhx: 0.05, lkx: 0.3, rhx: -0.1, rkx: 0.5 };
function downClips(crouchBase, standBase) {
  const back = clip(2.1, [
    [0, { sx: -0.5, nx: -0.6, lsx: 0.4, rsx: 0.4, lsz: 0.7, rsz: -0.7, lex: -0.4, rex: -0.4 }],
    [0.18, { hy: -0.25, hx: -0.6, sx: -0.3, nx: -0.4, lsx: -0.6, rsx: -0.6, lsz: 0.9, rsz: -0.9, lhx: -0.9, lkx: 0.8, rhx: -0.5, rkx: 0.6 }],
    [0.36, LIE_BACK],
    [0.46, Object.assign({}, LIE_BACK, { hy: -0.72, hx: -1.3, lhx: -0.6, rhx: -0.4 })],
    [0.6, LIE_BACK], [1.15, LIE_BACK],
    [1.45, { hy: -0.62, hx: -0.55, sx: 0.55, nx: 0.1, lsx: 0.7, lex: -0.3, rsx: 0.7, rex: -0.3, lhx: -1.6, lkx: 2.2, rhx: -1.0, rkx: 1.4 }],
    [1.75, crouchBase], [2.1, standBase]], {});
  const front = clip(2.1, [
    [0, { sx: 0.5, nx: 0.5, lsx: -0.6, rsx: -0.6 }],
    [0.18, { hy: -0.3, hx: 0.6, sx: 0.3, lsx: -1.5, rsx: -1.5, lhx: 0.3, lkx: 0.6, rhx: 0.1, rkx: 0.8 }],
    [0.36, LIE_FRONT],
    [0.46, Object.assign({}, LIE_FRONT, { hy: -0.76, hx: 1.3 })],
    [0.6, LIE_FRONT], [1.15, LIE_FRONT],
    [1.45, { hy: -0.6, hx: 0.9, sx: 0.3, lsx: -1.0, lex: 0, rsx: -1.0, rex: 0, lhx: -1.5, lkx: 2.3, rhx: -0.6, rkx: 2.0 }],
    [1.75, crouchBase], [2.1, standBase]], {});
  return { back, front };
}
// ================= 姿态基准 =================
const BASE = {
  stand: [
    { hy: -0.05, hry: 0.25, sy: -0.25, lsx: -0.6, lsz: -0.15, lex: -1.9, rsx: -0.3, rsz: 0.15, rex: -2.1, lhx: -0.35, lkx: 0.45, rhx: 0.25, rkx: 0.35 }, // 龙
    { hy: -0.14, hry: 0.3, sy: -0.3, sx: 0.15, lsx: -1.15, lsz: -0.1, lex: -0.5, rsx: -0.75, rsz: 0.1, rex: -1.0, lhx: -0.5, lkx: 0.7, rhx: 0.3, rkx: 0.6 },   // 蛇
    { hy: -0.08, hry: 0.2, sy: -0.1, sx: -0.1, lsx: -0.35, lsz: -0.3, lex: -1.1, rsx: -1.7, rsz: 0.35, rex: -2.0, lhx: -0.3, lkx: 0.5, rhx: 0.35, rkx: 0.4, nx: -0.15 } // 醉
  ],
  crouch: { hy: -0.43, sx: 0.35, lsx: -0.7, lsz: -0.15, lex: -1.8, rsx: -0.5, rsz: 0.15, rex: -2.0, lhx: -1.5, lkx: 1.7, rhx: -0.4, rkx: 1.9, nx: -0.25 },
  parry: { hy: -0.12, sx: 0.1, lsx: -1.3, lsz: -0.55, lex: -1.5, rsx: -1.3, rsz: 0.55, rex: -1.5, lhx: -0.4, lkx: 0.5, rhx: 0.3, rkx: 0.4 },
  weapon: { hy: -0.08, hry: 0.2, sy: -0.2, lsx: -0.6, lsz: -0.2, lex: -1.6, rsx: -0.9, rsz: 0.2, rex: -1.2, lhx: -0.35, lkx: 0.45, rhx: 0.25, rkx: 0.35 },
};
// 所有基准姿态补全为完整姿态（缺省关节为 0），避免出现 NaN
for (const k in BASE) { if (Array.isArray(BASE[k])) BASE[k] = BASE[k].map(b => Object.assign(zeroPose(), b)); else BASE[k] = Object.assign(zeroPose(), BASE[k]); }
const STYLES = [
  { name: '龙形拳', key: '龙', color: 0xffbf3c, css: '#ffbf3c', spd: 1.0, dmg: 1.44, taken: .85, kb: 1.5, cost: 1.0 },
  { name: '蛇形拳', key: '蛇', color: 0x4be37a, css: '#4be37a', spd: 1.3, dmg: 0.8, kb: 0.8, cost: 0.7 },
  { name: '醉拳', key: '醉', color: 0xc889ff, css: '#c889ff', spd: 0.92, dmg: 1.05, kb: 1.2, cost: 0.9 },
];

// ================= 招式表 =================
// keys: [时间比例, 姿态覆盖]；hits: 判定时间比例；lunge:[开始,结束,速度]
function mv(o) {
  const base = o.base;
  o.keys = o.keys.map(([t, p]) => [t, Object.assign(zeroPose(), base, p)]);
  o.hits = o.hits || [o.hit];
  return o;
}
function buildMoves(base, style) {
  const B = base;
  const S = {};
  // —— 站立拳法 ——
  S.jab1 = mv({ base: B, name: '左刺拳', dur: .3, hit: .4, range: 1.6, arc: .9, dmg: 8, kb: 1.5, cost: 6, high: 1, next: 'jab2', lunge: [.1, .4, 2.5],
    keys: [[0, {}], [.35, { lsx: -1.6, lex: -0.1, lsz: -0.05, sy: -0.55, hry: 0.4 }], [.65, { lsx: -1.3, lex: -0.5, sy: -0.4 }], [1, {}]] });
  S.jab2 = mv({ base: B, name: '右直拳', dur: .34, hit: .42, range: 1.7, arc: .9, dmg: 10, kb: 2, cost: 7, high: 1, next: 'hook', lunge: [.1, .45, 3],
    keys: [[0, {}], [.4, { rsx: -1.6, rex: 0, rsz: 0.05, sy: 0.6, hry: -0.1, rhx: 0.4 }], [.7, { rsx: -1.2, rex: -0.6, sy: 0.3 }], [1, {}]] });
  S.hook = mv({ base: B, name: '摆拳勾打', dur: .45, hit: .5, range: 1.7, arc: 1.3, dmg: 14, kb: 4, cost: 9, high: 1, lunge: [.2, .5, 3],
    keys: [[0, {}], [.25, { lsx: -1.2, lsz: -1.1, lex: -1.5, sy: 0.6, hry: 0.5 }], [.5, { lsx: -1.45, lsz: -0.2, lex: -1.4, lsy: 0.9, sy: -0.9, hry: -0.2 }], [.8, { sy: -0.5 }], [1, {}]] });
  // 拳法重击：三种拳法各不相同
  if (style === 0) S.heavyF = mv({ base: B, name: '龙爪冲拳', dur: .72, hit: .55, range: 2.0, arc: .9, dmg: 30, kb: 9, cost: 20, heavy: 1, lunge: [.38, .6, 9],
    keys: [[0, {}], [.35, { rsx: 0.6, rex: -2.2, sy: -0.7, hy: -0.18, lhx: -0.2 }], [.55, { rsx: -1.62, rex: 0, sy: 0.75, hy: -0.15, lhx: -0.75, lkx: 0.7, rhx: 0.6 }], [.85, { rsx: -1.4, sy: 0.5 }], [1, {}]] });
  if (style === 1) S.heavyF = mv({ base: B, name: '灵蛇连击', dur: .75, hits: [.25, .45, .68], range: 1.8, arc: 1.0, dmg: 10, kb: 1.5, cost: 16, heavy: 1, lunge: [.1, .7, 3.5],
    keys: [[0, {}], [.25, { lsx: -1.6, lex: 0, sy: -0.5 }], [.35, { lsx: -1.0, lex: -0.8, sy: 0 }], [.45, { rsx: -1.6, rex: 0, sy: 0.55 }], [.56, { rsx: -1.0, rex: -0.8 }], [.68, { lsx: -1.5, rsx: -1.5, lex: 0, rex: 0, lsz: 0.1, rsz: -0.1, sx: 0.3 }], [1, {}]] });
  if (style === 2) S.heavyF = mv({ base: B, name: '醉步肩撞', dur: .8, hit: .52, range: 1.7, arc: 1.1, dmg: 24, kb: 7, cost: 18, heavy: 1, kd: 1, lunge: [.3, .6, 9],
    keys: [[0, {}], [.3, { hrz: 0.35, sx: -0.35, hy: -0.18, rsx: -1.8, rex: -2.3, nx: 0.3 }], [.52, { hry: -1.3, sz: 0.45, sx: 0.45, lsx: -0.2, lsz: 0.6, lex: -0.5, hy: -0.2, lhx: -0.8, lkx: 0.8 }], [.8, { hry: -0.8, hrz: -0.2 }], [1, {}]] });
  // —— 站立腿法 ——
  S.kick1 = mv({ base: B, name: '正蹬', dur: .38, hit: .45, range: 1.9, arc: .8, dmg: 10, kb: 3, cost: 7, next: 'kick2', lunge: [.2, .5, 2],
    keys: [[0, {}], [.25, { rhx: -1.0, rkx: 1.6 }], [.45, { rhx: -1.65, rkx: 0.05, sx: -0.25, lkx: 0.15, hry: 0 }], [.7, { rhx: -0.9, rkx: 1.4 }], [1, {}]] });
  S.kick2 = mv({ base: B, name: '侧踹', dur: .45, hit: .5, range: 2.1, arc: .8, dmg: 13, kb: 5, cost: 8, next: 'kick3', lunge: [.2, .5, 3],
    keys: [[0, {}], [.25, { hry: -1.3, lhx: -0.6, lkx: 1.8, sz: 0.2 }], [.5, { hry: -1.45, lhz: 1.45, lhx: 0, lkx: 0, sz: 0.5, sy: 0.6, rkx: 0.2 }], [.75, { hry: -1.2, lhz: 0.6, lkx: 1.2 }], [1, {}]] });
  S.kick3 = mv({ base: B, name: '旋风回旋踢', dur: .6, hit: .55, range: 2.1, arc: Math.PI, dmg: 16, kb: 6, cost: 10, spin: 1, lunge: [.1, .5, 2],
    keys: [[0, {}], [.25, { hry: 2.0, rhz: -0.6, rkx: 1.2, hy: 0.02 }], [.55, { hry: 3.9, rhz: -1.45, rhx: -0.2, rkx: 0, sz: -0.45, hy: 0.05 }], [.85, { hry: 5.9, rhz: -0.4 }], [1, { hry: TAU + B.hry }]] });
  S.heavyK = mv({ base: B, name: '飞身踢', dur: .8, hit: .5, range: 2.1, arc: .9, dmg: 26, kb: 9, cost: 18, heavy: 1, jump: 5.5, kd: 1, lunge: [.15, .65, 8],
    keys: [[0, {}], [.2, { lhx: -1.2, lkx: 2.0, rhx: -1.0, rkx: 1.8, hy: 0, hry: 0, sy: 0 }], [.45, { rhx: -1.65, rkx: 0, lhx: -0.3, lkx: 2.2, sx: -0.3, lsx: 0.5, rsx: 0.5, lex: -0.3, rex: -0.3, hry: 0, sy: 0 }], [.8, { rhx: -1.0, rkx: 1.0 }], [1, {}]] });
  return S;
}
const C = BASE.crouch, PR = BASE.parry, W = BASE.weapon;
const MOVES_STYLE = [0, 1, 2].map(i => buildMoves(BASE.stand[i], i));
const MOVES = {
  // —— 蹲姿拳法 ——
  cjab1: mv({ base: C, name: '低位冲拳', dur: .3, hit: .4, range: 1.6, arc: .9, dmg: 8, kb: 1.5, cost: 6, low: 1, next: 'cjab2', keys: [[0, {}], [.4, { lsx: -1.35, lex: 0, sy: -0.55 }], [1, {}]] }),
  cjab2: mv({ base: C, name: '低位捶', dur: .32, hit: .4, range: 1.6, arc: .9, dmg: 9, kb: 2, cost: 6, low: 1, keys: [[0, {}], [.4, { rsx: -1.35, rex: 0, sy: 0.55 }], [1, {}]] }),
  cheavyF: mv({ base: C, name: '升龙拳', dur: .85, hits: [.38, .52], range: 1.7, arc: 1.0, dmg: 16, kb: 1.5, cost: 20, heavy: 1, jump: 7, launch: 9,
    keys: [[0, {}], [.25, { hy: -0.5, rsx: 0.3, rex: -2.1, sx: 0.55 }], [.5, { hy: 0.1, sx: -0.2, sy: 0.6, rsx: -3.0, rex: -0.2, lsx: -0.5, lhx: -0.3, lkx: 0.6, rhx: 0.1, rkx: 1.0 }], [.85, { hy: 0, rsx: -2.5, sx: 0, lhx: -0.3, lkx: 0.4, rhx: 0.1, rkx: 0.4 }], [1, {}]] }),
  // —— 蹲姿腿法 ——
  sweep: mv({ base: C, name: '扫堂腿', dur: .65, hit: .5, range: 2.2, arc: Math.PI, dmg: 12, kb: 2, cost: 9, low: 1, kd: 1, spin: 1, spin360: [.12, .8], next: 'sweep',
    keys: [[0, {}], [.2, { hy: -0.58, sx: 0.75, lsx: -1.0, lex: 0, rsx: -1.0, rex: 0, hry: 0.6, rhz: -1.5, rhx: 0, rkx: 0, lhx: -1.6, lkx: 2.3 }], [.6, { hy: -0.58, sx: 0.75, lsx: -1.0, lex: 0, rsx: -1.0, rex: 0, hry: 3.8, rhz: -1.5, rhx: 0, rkx: 0, lhx: -1.6, lkx: 2.3 }], [.9, { hy: -0.5, hry: 5.9, rhz: -0.6 }], [1, { hry: TAU }]] }),
  slide: mv({ base: C, name: '滑铲蹬腿', dur: .75, hit: .45, range: 1.9, arc: .8, dmg: 20, kb: 6, cost: 16, heavy: 1, low: 1, kd: 1, lunge: [.15, .6, 9],
    keys: [[0, {}], [.25, { hy: -0.62, sx: -0.6, rhx: -1.45, rkx: 0, lhx: -0.7, lkx: 1.9, lsx: 0.7, rsx: 0.7, lex: -0.3, rex: -0.3 }], [.65, { hy: -0.62, sx: -0.6, rhx: -1.45, rkx: 0, lhx: -0.7, lkx: 1.9, lsx: 0.7, rsx: 0.7 }], [1, {}]] }),
  // —— 招架姿态 ——
  counter: mv({ base: PR, name: '拆招掌', dur: .3, hit: .38, range: 1.7, arc: 1.0, dmg: 10, kb: 3, cost: 6, next: 'counter', keys: [[0, {}], [.38, { rsx: -1.58, rsz: 0, rex: -0.1, sy: 0.55, lsx: -1.0, lsz: -0.3, lex: -1.9 }], [1, {}]] }),
  push: mv({ base: PR, name: '卸力推掌', dur: .62, hit: .45, range: 1.8, arc: 1.1, dmg: 18, kb: 12, cost: 16, heavy: 1, guardBreak: 1, kd: 1, lunge: [.35, .5, 4],
    keys: [[0, {}], [.3, { lsx: 0.25, rsx: 0.25, lsz: 0, rsz: 0, lex: -2.4, rex: -2.4, sx: -0.15 }], [.45, { lsx: -1.5, rsx: -1.5, lex: 0, rex: 0, lsz: 0.18, rsz: -0.18, sx: 0.2, lhx: -0.7, lkx: 0.7 }], [.8, { lsx: -1.3, rsx: -1.3, lex: -0.3, rex: -0.3 }], [1, {}]] }),
  // —— 空中 ——
  airKick: mv({ base: BASE.stand[0], name: '凌空踢', dur: .42, hit: .4, range: 1.9, arc: 1.0, dmg: 14, kb: 5, cost: 8, air: 1,
    keys: [[0, { lhx: -1, lkx: 2, rhx: -1, rkx: 2 }], [.4, { rhx: -1.6, rkx: 0, lkx: 2.0, lhx: -1.0, sx: -0.3, hry: 0, sy: 0 }], [1, { lhx: -0.6, lkx: 1.2, rhx: -0.6, rkx: 1.2 }]] }),
  // —— 武器 ——
  w1: mv({ base: W, name: '力劈', dur: .46, hit: .45, range: 1.6, arc: .8, dmg: 12, kb: 3, cost: 7, wpn: 1, next: 'w2', lunge: [.2, .45, 2.5],
    keys: [[0, {}], [.2, { rsx: -2.9, rex: -0.5, lsx: -2.6, lex: -0.6, sx: -0.15 }], [.45, { rsx: -1.1, rex: 0, lsx: -1.0, lex: -0.3, sx: 0.35 }], [1, {}]] }),
  w2: mv({ base: W, name: '横扫千军', dur: .5, hit: .45, range: 1.7, arc: 1.5, dmg: 13, kb: 4, cost: 8, wpn: 1, next: 'w3',
    keys: [[0, {}], [.2, { sy: -1.0, rsx: -1.4, rsz: 0.9, rex: -0.3, hry: -0.3 }], [.5, { sy: 1.2, rsx: -1.4, rsz: -0.7, rex: -0.1, hry: 0.5 }], [1, {}]] }),
  w3: mv({ base: W, name: '直捣黄龙', dur: .45, hit: .45, range: 2.0, arc: .7, dmg: 15, kb: 6, cost: 8, wpn: 1, lunge: [.25, .5, 6],
    keys: [[0, {}], [.25, { rsx: -0.6, rex: -1.8, sy: -0.5 }], [.45, { rsx: -1.55, rex: 0, sy: 0.6, lhx: -0.8, lkx: 0.7 }], [1, {}]] }),
  wHeavy: mv({ base: W, name: '旋风棍', dur: .95, hits: [.3, .55, .8], range: 1.9, arc: Math.PI, dmg: 12, kb: 5, cost: 20, wpn: 1, heavy: 1, spin: 1,
    keys: [[0, {}], [.15, { rsx: -1.5, rsz: -0.4, rex: 0, lsx: -1.4, lsz: 0.5, hry: 0 }], [.5, { rsx: -1.5, rsz: -0.4, rex: 0, lsx: -1.4, lsz: 0.5, hry: 6.28 }], [.85, { rsx: -1.5, rsz: -0.4, rex: 0, lsx: -1.4, lsz: 0.5, hry: 12.0 }], [1, { hry: 12.57 + W.hry }]] }),
  wLow: mv({ base: C, name: '盘龙扫', dur: .6, hit: .5, range: 1.9, arc: Math.PI, dmg: 13, kb: 3, cost: 9, wpn: 1, low: 1, kd: 1, spin: 1,
    keys: [[0, {}], [.2, { hy: -0.5, sx: 0.6, rsx: -1.3, rsz: -0.5, rex: 0, hry: 0.5 }], [.6, { hy: -0.5, sx: 0.6, rsx: -1.3, rsz: -0.5, rex: 0, hry: 4.0 }], [1, { hry: TAU }]] }),
};
const WEAPONS = [
  { name: '木棍', range: 1.0, dmg: 1.45, dur: 40, sound: 'hit' },
  { name: '雨伞', range: 0.7, dmg: 1.15, dur: 30, sound: 'hit' },
  { name: '平底锅', range: 0.3, dmg: 1.8, dur: 25, sound: 'clang' },
];
function weaponMesh(i) {
  const g = new THREE.Group(), kind = WEAPONS[i].kind || ['stick', 'umbrella', 'pan'][i];
  const cyl = (r1, r2, len, col, z, seg = 8, mat) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, len, seg, WEAPONS[i].cls === 'staff' ? 24 : 1), mat || M(col)); m.rotation.x = Math.PI / 2; m.position.z = z; g.add(m); return m; };
  const metal = (c, r = .3) => MS(c, { metalness: .85, roughness: r });
  if (kind === 'stick') cyl(0.028, 0.028, 1.8, 0x7a4a22, 0.45);
  if (kind === 'umbrella') { cyl(0.015, 0.015, 1.1, 0x333333, 0.45, 6); cyl(0.0, 0.12, 0.75, 0xd23a3a, 0.7); }
  if (kind === 'pan') {
    cyl(0.02, 0.025, 0.35, 0x222222, 0.17, 6);
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.15, 0.05, 20), metal(0x555a60)); p.position.z = 0.5; g.add(p);
  }
  if (kind === 'broom') {
    cyl(0.022, 0.022, 1.45, 0xc9a86a, 0.4);
    const h = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.42, 10, 1, true), M(0xd8b552)); h.rotation.x = -Math.PI / 2; h.position.z = 1.28; h.scale.set(1, 1, 0.45); g.add(h);
    cyl(0.04, 0.04, 0.05, 0xa0302a, 1.1, 8);
  }
  if (kind === 'iron') { cyl(0.026, 0.026, 1.8, 0, 0.45, 10, metal(0x4a4e55, .4)); for (const z of [-0.42, 1.32]) cyl(0.036, 0.036, 0.14, 0, z, 10, metal(0xc9a03a, .25)); }
  if (kind === 'dojo') { cyl(0.028, 0.03, 1.8, 0x8a2a22, 0.45, 10); for (const z of [-0.4, 0.05, 1.3]) cyl(0.032, 0.032, 0.08, 0x151515, z, 10); }
  if (kind === 'katana') {
    cyl(0.018, 0.018, 0.26, 0x22101a, 0.02, 8);
    const gd = cyl(0.05, 0.05, 0.015, 0, 0.16, 12, metal(0xb08a3a)); gd.rotation.x = Math.PI / 2;
    const bl = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.036, 0.78), MS(0xd8dee8, { metalness: .9, roughness: .15 })); bl.position.z = 0.56; bl.rotation.x = 0.04; g.add(bl);
  }
  if (kind === 'sword') {
    cyl(0.016, 0.016, 0.2, 0x3a2416, 0.0, 8); cyl(0.028, 0.028, 0.04, 0, -0.11, 8, metal(0xc9a03a));
    const gd = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.035, 0.035), metal(0xc9a03a, .25)); gd.position.z = 0.12; g.add(gd);
    const bl = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.008, 0.7), MS(0xcfd6dc, { metalness: .9, roughness: .2 })); bl.position.z = 0.48; g.add(bl);
    const tp = new THREE.Mesh(new THREE.ConeGeometry(0.028, 0.08, 4), MS(0xcfd6dc, { metalness: .9, roughness: .2 })); tp.rotation.x = Math.PI / 2; tp.position.z = 0.87; tp.scale.set(1, 0.25, 1); g.add(tp);
    const ts = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.16, 6), M(0xd02a2a)); ts.position.set(0, -0.08, -0.15); g.add(ts);
  }
  if (kind === 'bottle') {
    const glass = MS(0x2f8a4a, { metalness: .1, roughness: .15, transparent: true, opacity: .85 });
    cyl(0.018, 0.02, 0.16, 0, 0.04, 8, glass); cyl(0.022, 0.05, 0.08, 0, 0.16, 10, glass); cyl(0.05, 0.05, 0.24, 0, 0.32, 12, glass);
    cyl(0.052, 0.052, 0.09, 0, 0.32, 12, MS(0xe8e0c0));
  }
  if (kind === 'duster') {
    cyl(0.014, 0.014, 0.75, 0x5a3418, 0.22, 6);
    for (let k = 0; k < 9; k++) { const f = new THREE.Mesh(new THREE.ConeGeometry(0.075, 0.42, 6), M([0x8a4a1a, 0x2a5a3a, 0xa8702a][k % 3])); f.rotation.x = Math.PI / 2; const a = k * 0.7; f.position.set(Math.cos(a) * 0.035, Math.sin(a) * 0.035, 0.5 + k * 0.022); g.add(f); }
  }
  g.traverse(o => { if (o.isMesh) o.castShadow = true; });
  return g;
}
