// ================= 棍法 v3：握持点 / 全身驱动 / 二维弹簧弯曲 / 三层残影 =================
// Authoring frame: hand h=[right, up, forward] is relative to the twisted chest; staff
// direction d=[azimuth (right +), elevation] in degrees is in the facing frame.
// g = grip position along the shaft (0 = tail, 1 = tip). sp = staff spin inside the palm
// (0 = long end exits thumb side, 180 = pinky side); sl = how far the fingers may let the
// shaft roll from sp (180 = free twirl). l/lw = left hand shaft fraction / weight.
const D2R = Math.PI / 180;
const STAFF_GRIP = { Right: new THREE.Vector3(.01, .062, .02), Left: new THREE.Vector3(-.01, .062, .02) };
const STAFF_AXIS = { Right: new THREE.Vector3(Math.cos(.55), Math.sin(.55), 0), Left: new THREE.Vector3(-Math.cos(.55), Math.sin(.55), 0) };
const STAFF_CH = ['r', 'u', 'f', 'az', 'el', 'g', 'sp', 'sl', 'l', 'lw', 'hip', 'tw', 'lean', 'drop', 'hf', 'fl', 'fr', 'ik', 'pole', 'free'];
const STAFF_DEF = { h: [.2, .98, .1], d: [165, 40], g: .35, sp: 180, sl: 40, l: .6, lw: 0, hip: 0, tw: 0, lean: 0, drop: 0, hf: 0, fl: 0, fr: 0, ik: 1, pole: 0, free: 0 };
function staffKeys(list) {
  let cur = { ...STAFF_DEF }; const t = [], v = STAFF_CH.map(() => []);
  for (const [time, o] of list) {
    cur = { ...cur, ...o }; t.push(time);
    const flat = { r: cur.h[0], u: cur.h[1], f: cur.h[2], az: cur.d[0] * D2R, el: cur.d[1] * D2R, g: cur.g, sp: cur.sp * D2R, sl: cur.sl * D2R, l: cur.l, lw: cur.lw, hip: cur.hip, tw: cur.tw, lean: cur.lean, drop: cur.drop, hf: cur.hf, fl: cur.fl, fr: cur.fr, ik: cur.ik, pole: cur.pole, free: cur.free };
    STAFF_CH.forEach((c, i) => v[i].push(flat[c]));
  }
  return { t, v };
}
// Time-aware cubic Hermite: flowing arcs through the authored keys instead of stop-start lerps.
function staffSample(K, t, out = {}) {
  const T = K.t, n = T.length; t = clamp(t, T[0], T[n - 1]);
  let i = 0; while (i < n - 2 && t > T[i + 1]) i++;
  const h = Math.max(1e-4, T[i + 1] - T[i]), s = (t - T[i]) / h, s2 = s * s, s3 = s2 * s;
  const h00 = 2 * s3 - 3 * s2 + 1, h10 = s3 - 2 * s2 + s, h01 = -2 * s3 + 3 * s2, h11 = s3 - s2;
  STAFF_CH.forEach((c, k) => {
    const V = K.v[k], tan = j => j <= 0 || j >= n - 1 ? 0 : (V[j + 1] - V[j - 1]) / (T[j + 1] - T[j - 1]);
    out[c] = h00 * V[i] + h10 * h * tan(i) + h01 * V[i + 1] + h11 * h * tan(i + 1);
  });
  out.lw = clamp(out.lw, 0, 1); out.ik = clamp(out.ik, 0, 1); out.pole = clamp(out.pole, 0, 1); out.free = clamp(out.free, 0, 1); out.g = clamp(out.g, 0, 1); out.l = clamp(out.l, 0, 1);
  return out;
}
const SKS = staffKeys;
const STAFF_IDLE = staffSample(SKS([[0, {}], [1, {}]]), 0);
const STAFF_RUN = staffSample(SKS([[0, { h: [.24, .93, -.1], d: [176, -20], g: .3, lean: .1 }], [1, {}]]), 0);
// Charge stances per style (dragon overhead, snake drawn back, drunk planted pole).
const STAFF_CHARGE = [
  staffSample(SKS([[0, { h: [.12, 1.62, -.02], d: [175, 58], g: .08, sp: 0, l: .22, lw: 1, hip: .35, tw: .25, lean: -.12, drop: .1, fl: .12 }], [1, {}]]), 0),
  staffSample(SKS([[0, { h: [.24, 1.02, -.18], d: [2, 4], g: .08, sp: 0, l: .45, lw: 1, hip: .7, tw: .35, lean: .12, drop: .15, fl: .18, fr: -.05 }], [1, {}]]), 0),
  staffSample(SKS([[0, { h: [.06, 1.28, .38], d: [0, -84], g: .1, sp: 0, sl: 90, l: .3, lw: 1, hip: .1, tw: .15, lean: .18, drop: .14, fl: .1 }], [1, {}]]), 0),
];
const STAFF_POSES = {
  // L1 单手斜劈：右上 → 左下，握点滑向棍尾换取长度
  chop1: SKS([[0, {}], [.18, { h: [.32, 1.48, -.02], d: [150, 64], g: .22, sp: 160, hip: .28, tw: .32, lean: -.06, drop: .04 }],
    [.42, { h: [.02, 1.1, .5], d: [-28, -22], g: .05, sp: 40, hip: -.22, tw: -.4, lean: .26, drop: .13, fl: .26 }],
    [.62, { h: [-.12, .9, .42], d: [-70, -48], g: .05, hip: -.3, tw: -.55, lean: .3, drop: .15 }],
    [1, { h: [.02, 1.0, .38], d: [-42, -12], g: .12, hip: -.18, tw: -.32, lean: .14, drop: .08 }]]),
  // L2 反手横扫：左 → 右，胸高平扫
  backhand: SKS([[0, { h: [.02, 1.0, .38], d: [-42, -12], g: .12, sp: 40, hip: -.18, tw: -.32, lean: .14, drop: .08, fl: .26 }],
    [.2, { h: [-.1, 1.15, .32], d: [-112, 6], g: .08, sp: 10, hip: -.38, tw: -.7, lean: .06, drop: .08 }],
    [.45, { h: [.24, 1.16, .5], d: [18, 0], g: .05, sp: 0, hip: .16, tw: .28, lean: .16, drop: .12, fr: .22 }],
    [.66, { h: [.4, 1.12, .24], d: [100, 6], g: .05, hip: .36, tw: .66, lean: .1, drop: .11 }],
    [1, { h: [.32, 1.12, .26], d: [72, 18], g: .4, hip: .22, tw: .4, lean: .06, drop: .06 }]]),
  // L3 背后换手转棍：中段握，棍在身侧立轮两圈，最后从背后交左手
  twirl: SKS([[0, { h: [.32, 1.12, .26], d: [72, 18], g: .4, sp: 0, sl: 180, hip: .22, tw: .4, drop: .06, fr: .22 }],
    [.12, { h: [.34, 1.16, .2], d: [10, 90], g: .5, hip: .12, tw: .2, lean: .04 }],
    [.24, { d: [0, 0], lean: .14, drop: .1 }], [.36, { d: [0, -90] }], [.48, { d: [0, -180], hip: .05 }], [.6, { d: [0, -270], lean: .1 }],
    [.72, { h: [.2, 1.12, -.1], d: [-90, -360], hip: -.2, tw: -.25, drop: .1, fl: .2 }],
    [.86, { h: [.0, 1.1, -.22], d: [-90, -362], g: .5, l: .78, lw: .7, hip: -.35, tw: -.45, lean: -.04 }],
    [1, { h: [.12, 1.18, .25], d: [-80, -360], g: .3, l: .7, lw: 1, hip: -.2, tw: -.25, lean: .06 }]]),
  // L4 双手旋风：身体整圈旋转，棍平端胸前
  whirl: SKS([[0, { h: [.12, 1.18, .25], d: [-80, 0], g: .3, sp: 0, sl: 50, l: .58, lw: 1, hip: -.2, tw: -.25, lean: .06, drop: .08 }],
    [.15, { h: [.05, 1.15, .42], d: [-120, 4], g: .25, l: .52, hip: -.4, tw: -.45, lean: .12, drop: .14 }],
    [.45, { h: [.15, 1.12, .48], d: [40, 2], hip: .1, tw: .2, lean: .2, drop: .16 }],
    [.75, { h: [.22, 1.14, .45], d: [80, 6], hip: .25, tw: .3, lean: .16, drop: .14 }],
    [1, { h: [.18, 1.25, .2], d: [20, 55], g: .2, l: .5, hip: .1, tw: .1, lean: 0, drop: .06 }]]),
  // L5 跳起下劈：双手过头，空中下砸，落地裂地
  leap: SKS([[0, { h: [.18, 1.25, .2], d: [20, 55], g: .2, sp: 0, sl: 40, l: .5, lw: 1, ik: 0, drop: .06 }],
    [.3, { h: [.08, 1.72, -.05], d: [178, 70], g: .05, l: .2, hip: .1, tw: .1, lean: -.2, drop: 0 }],
    [.56, { h: [.02, 1.12, .55], d: [0, -28], g: .05, l: .22, hip: 0, tw: 0, lean: .42, drop: .16 }],
    [.72, { h: [.02, .92, .55], d: [0, -36], ik: 1, lean: .48, drop: .3, fl: .3 }],
    [1, { h: [.1, 1.05, .4], d: [-10, -16], g: .15, l: .4, lean: .2, drop: .14 }]]),
  // 龙形·劈棍（重）：双手抡过头砸地
  smash: SKS([[0, { h: [.12, 1.62, -.02], d: [175, 58], g: .08, sp: 0, l: .22, lw: 1, hip: .35, tw: .25, lean: -.12, drop: .1, fl: .12 }],
    [.3, { h: [.08, 1.76, -.08], d: [180, 76], lean: -.18, drop: .06, hip: .4, tw: .3 }],
    [.5, { h: [.02, 1.0, .58], d: [0, -32], lean: .5, drop: .3, hip: -.1, tw: -.1, fl: .38 }],
    [.7, { h: [.02, .88, .55], d: [0, -36], lean: .52, drop: .34 }],
    [1, { h: [.12, 1.0, .35], d: [-18, -14], g: .2, l: .45, lean: .2, drop: .14, hip: 0, tw: 0 }]]),
  // 醉棍·立棍（重）：插棍、撑上去、离棍扫踢、落地收棍
  pole: SKS([[0, { h: [.2, 1.0, .12], d: [165, 40], g: .35, sp: 180, lw: 0 }],
    [.16, { h: [.06, 1.28, .38], d: [0, -84], g: .1, sp: 0, sl: 90, l: .3, lw: 1, hip: .1, tw: .15, lean: .18, drop: .14, pole: 1 }],
    [.42, { h: [.0, .62, .28], d: [0, -88], ik: 0, lean: .3, drop: 0, lw: 1 }],
    [.55, { free: 0, lw: .2 }], [.6, { free: 1, lw: 0 }], [.86, { free: 1, h: [.25, 1.1, .1] }],
    [.95, { free: 0, pole: 1, h: [.1, 1.2, .3], ik: 1, drop: .12, lean: .1, lw: 0 }],
    [1, { h: [.2, 1.0, .12], d: [165, 40], g: .35, sp: 180, pole: 0, drop: .04 }]]),
  // 扫地棍（蹲轻）、挑天棍（蹲重）、凌空劈（空轻）、落地劈山（空重）
  low: SKS([[0, { h: [.2, .9, .2], d: [-100, -30], g: .1, sp: 0, drop: .35, lean: .3, hip: -.3, tw: -.4, lw: 0, ik: 1 }],
    [.5, { h: [.25, .72, .5], d: [30, -40], hip: .3, tw: .4 }], [.75, { h: [.35, .75, .3], d: [100, -36], hip: .45, tw: .55 }],
    [1, { h: [.25, .85, .2], d: [70, -10], g: .3, hip: .2, tw: .2, drop: .25 }]]),
  rise: SKS([[0, { h: [.2, .95, .2], d: [10, -50], g: .1, sp: 0, l: .35, lw: 1, drop: .3, lean: .3 }],
    [.45, { h: [.08, 1.45, .4], d: [0, 60], drop: .05, lean: -.1 }], [.7, { h: [.1, 1.62, .25], d: [10, 80] }],
    [1, { h: [.15, 1.2, .3], d: [20, 30], g: .25, drop: .06, lean: 0 }]]),
  airchop: SKS([[0, { h: [.25, 1.55, 0], d: [170, 60], g: .1, sp: 0, ik: 0, lean: -.1 }], [.45, { h: [.05, 1.05, .5], d: [0, -40], lean: .35 }], [1, { h: [.1, 1.0, .4], d: [-20, -20] }]]),
  airslam: SKS([[0, { h: [.1, 1.7, -.05], d: [178, 70], g: .05, sp: 0, l: .25, lw: 1, ik: 0, lean: -.15 }], [.4, { h: [.02, 1.0, .55], d: [0, -40], lean: .45, drop: .1 }], [1, { h: [.05, .95, .5], d: [0, -35], drop: .25 }]]),
};
// 灵蛇·戳棍（重）：n 连刺，前手不动、棍身在左手里来回穿梭
function pokeKeys(n) {
  const L = [[0, { h: [.24, 1.02, -.18], d: [2, 4], g: .08, sp: 0, l: .45, lw: 1, hip: .7, tw: .35, lean: .12, drop: .15, fl: .18, fr: -.05 }]];
  for (let i = 0; i < n; i++) {
    const a = .1 + .8 * i / n, b = .1 + .8 * (i + .5) / n, h = [1.12, 1.25, .95, 1.18, 1.32, 1.0, 1.2][i % 7], az = [0, -8, 6, -4, 8, -6, 2][i % 7];
    L.push([a, { h: [.24, 1.0, -.16], d: [az * .4, 4], l: .45, hip: .7, tw: .35, lean: .1, drop: .15 }]);
    L.push([b, { h: [.1, h - .05, .32], d: [az, (h - 1.1) * 25], l: .22, hip: .25, tw: .1, lean: .26, drop: .18, fl: .3 }]);
  }
  L.push([1, { h: [.18, 1.02, .2], d: [0, 0], l: .55, hip: .3, tw: .1, lean: .1, drop: .1 }]);
  return SKS(L);
}
for (let n = 3; n <= 7; n += 2) STAFF_POSES['poke' + n] = pokeKeys(n);
STAFF_POSES.chop = STAFF_POSES.airchop; STAFF_POSES.slam = STAFF_POSES.airslam; STAFF_POSES.thrust = STAFF_POSES.poke3;
function staffPose(kind, t) { return staffSample(STAFF_POSES[kind] || STAFF_POSES.chop1, t); }
function staffMix(a, b, k, out = {}) { for (const c of STAFF_CH) out[c] = lerp(a[c], b[c], k); return out; }

// ---------- 蓄力 / 棍花 ----------
const STAFF_LEVELS = [.4, .82];
function tryStaffCharge() {
  const p = player;
  if (!p.weapon || wcls() !== 'staff' || p.mode !== 'fist' || !p.grounded || p.crouch || !canAct(p)) return false;
  buffer.type = null; p.move = null; p.staffTrace = null; p.chargeT = 0; p.chargeFull = false; p.chargeLv = 1;
  setState(p, 'staffCharge', .1); p.guard = false;
  showMove(['蓄势 · 劈棍', '蓄势 · 戳棍', '蓄势 · 立棍'][p.style] + ' · 松开右键', STYLES[p.style].css);
  return true;
}
function staffChargeTick(p, dt) {
  p.chargeT = Math.min(1.1, p.chargeT + dt);
  const lv = 1 + STAFF_LEVELS.filter(x => p.chargeT >= x).length;
  if (lv > (p.chargeLv || 1)) {
    p.chargeLv = lv; const pos = p.pos.clone().setY(1.1);
    burst(pos, STYLES[p.style].color, 10 + lv * 6, 3 + lv); shock(p.pos.clone().setY(.08), lv === 3 ? 0xffe2a0 : STYLES[p.style].color, .6 + lv * .3);
    showMove('棍势 · ' + ['', '一', '二', '三'][lv] + '段' + (lv === 3 ? ' · 已满' : ''), STYLES[p.style].css); sfx(lv === 3 ? 'clang' : 'block');
    const d = p.weapon?.mesh.userData.staff; if (d) { d.vx += .8; d.vy -= .6; }
  }
  if (p.chargeT >= 1.1 && !p.chargeFull) p.chargeFull = true;
}
function releaseStaffCharge() {
  const p = player;
  if (p.state !== 'staffCharge') return;
  if (cutscene || !locked || gameOver || wcls() !== 'staff') { setState(p, 'loco'); return; }
  const lv = 1 + STAFF_LEVELS.filter(x => p.chargeT >= x).length, S = WMOVES.staff[p.style], m = S['H' + lv] || S.H;
  if (!startMove({ ...m, chargeLevel: lv / 3 })) setState(p, 'loco', .1);
  p.chargeT = 0; p.chargeLv = 1;
}
// Hold light attack: a fast propeller in front of the body that turns fireballs back
// and shields frontal blows. Stamina drains while spinning.
const FLOWER = { dmg: 4, hits: [0], range: 1.6, arc: 1.2, kb: 1.5, wpn: 1, staff: 'flower', name: '棍花', keys: [] };
function tryStaffFlower() {
  const p = player;
  if (!p.weapon || wcls() !== 'staff' || p.mode !== 'fist' || !p.grounded || p.crouch || p.guard || !canAct(p) || p.st < 8) return false;
  buffer.type = null; p.move = null; p.flowerA = 0; p.flowerHit = 0; setState(p, 'staffSpin', .12);
  showMove(WEAPONS[p.weapon.type].name + '·棍花 · 可弹回火球', STYLES[p.style].css); return true;
}
function staffFlowerTick(p, dt) {
  p.vel.multiplyScalar(Math.exp(-dt * 10));
  p.st -= dt * 14; p.stDelay = .4;
  const rate = Math.min(1, p.stateT / .25) * 3.2;
  p.flowerA = (p.flowerA || 0) + rate * TAU * dt;
  if (p.st <= 0 || !p.lmbHeld) { p.st = Math.max(0, p.st); setState(p, 'loco', .15); return; }
  const fx = Math.sin(p.yaw), fz = Math.cos(p.yaw);
  for (const f of fireballs) {
    if (f.reflect) continue;
    const dx = f.pos.x - p.pos.x, dz = f.pos.z - p.pos.z, d = Math.hypot(dx, dz);
    if (d < 1.7 && (dx * fx + dz * fz) / Math.max(d, 1e-3) > .2) {
      f.parried(); f.vel.set(fx, 0, fz).multiplyScalar(f.vel.length()); f.hitP = true;
      burst(f.pos.clone(), STAFF_STYLE_COL[p.style], 16, 4); shock(f.pos.clone(), STAFF_STYLE_COL[p.style], .8); sfx('clang'); hitstop = Math.max(hitstop, .05); shake = Math.max(shake, .1);
      const s = p.weapon?.mesh.userData.staff; if (s) { s.vx += 2.5; s.vy -= 1.5; }
    }
  }
  if ((p.flowerHit -= dt) <= 0) {
    p.flowerHit = .22;
    const near = new Set(enemies.filter(e => !e.dead && !e.hidden && Math.hypot(e.pos.x - p.pos.x - fx * .8, e.pos.z - p.pos.z - fz * .8) < .9 + e.radius));
    if (near.size) { p.hitDone = [new Set()]; playerHitCheck(FLOWER, 0, near); }
  }
}

// ---------- 网格烘焙与二维弯曲 ----------
// Bake each mesh's local transform once; bend is recomputed from rest vertices every frame.
function initStaffMesh(mesh, type) {
  const W = WEAPONS[type], broom = W.kind === 'broom', iron = W.kind === 'iron';
  mesh.rotation.set(0, 0, 0);
  const data = mesh.userData.staff = { type, min: broom ? -.325 : -.45, max: broom ? 1.49 : 1.35, bend: 0, bx: 0, by: 0, vx: 0, vy: 0, gz: 0, g: .35, lz: 0, lw: 0, spin: Math.PI,
    limit: iron ? .05 : broom ? .27 : .2, stiff: iron ? 520 : broom ? 210 : 300, pieces: [], prevDir: new THREE.Vector3(), prevT: new THREE.Vector3(), ready: false, tipSpeed: 0, swishT: 0, from: null, fromT: 1, lastState: '', footL: null, footR: null };
  data.len = data.max - data.min;
  mesh.traverse(o => {
    if (!o.isMesh) return;
    o.geometry = o.geometry.clone(); o.updateMatrix(); o.geometry.applyMatrix4(o.matrix);
    o.position.set(0, 0, 0); o.rotation.set(0, 0, 0); o.scale.set(1, 1, 1); o.updateMatrix();
    data.pieces.push({ mesh: o, rest: o.geometry.attributes.position.array.slice(), normals: o.geometry.attributes.normal?.array.slice() });
    o.frustumCulled = false;
  });
  return data;
}
// S-shaped bend around the grip: x(z) = b·(z−g)|z−g| / L², both ends lag their motion.
function staffBendAt(d, z) { const u = z - d.gz, L = Math.max(d.max - d.gz, d.gz - d.min, .3), k = u * Math.abs(u) / (L * L); return [d.bx * k, d.by * k, 2 * Math.abs(u) / (L * L)]; }
function applyStaffBend(d) {
  for (const piece of d.pieces) {
    const a = piece.mesh.geometry.attributes.position.array, r = piece.rest, na = piece.mesh.geometry.attributes.normal?.array, nr = piece.normals;
    for (let i = 0; i < a.length; i += 3) {
      const z = r[i + 2], [ox, oy, sl] = staffBendAt(d, z);
      a[i] = r[i] + ox; a[i + 1] = r[i + 1] + oy; a[i + 2] = z;
      if (na) { const nx = nr[i], ny = nr[i + 1], nz = nr[i + 2] - sl * (d.bx * nx + d.by * ny), len = Math.hypot(nx, ny, nz) || 1; na[i] = nx / len; na[i + 1] = ny / len; na[i + 2] = nz / len; }
    }
    piece.mesh.geometry.attributes.position.needsUpdate = true;
    if (na) piece.mesh.geometry.attributes.normal.needsUpdate = true;
  }
}
function bendStaff(mesh, dt, drive, zeta = .5) {
  const d = mesh.userData.staff, steps = Math.max(1, Math.ceil(dt / .008)), h = dt / steps, K = d.stiff, C = 2 * zeta * Math.sqrt(K);
  const tx = clamp(drive.x, -d.limit, d.limit), ty = clamp(drive.y, -d.limit, d.limit);
  for (let i = 0; i < steps; i++) {
    d.vx += (K * (tx - d.bx) - C * d.vx) * h; d.vy += (K * (ty - d.by) - C * d.vy) * h;
    d.bx += d.vx * h; d.by += d.vy * h;
  }
  const m = Math.hypot(d.bx, d.by), cap = d.limit * 1.15; if (m > cap) { d.bx *= cap / m; d.by *= cap / m; }
  d.bend = Math.hypot(d.bx, d.by);
  applyStaffBend(d);
}
function staffPoint(mesh, z, out = new THREE.Vector3()) { const d = mesh.userData.staff, [x, y] = staffBendAt(d, z); return mesh.localToWorld(out.set(x, y, z)); }
function staffLine(mesh, z, out = new THREE.Vector3()) { return mesh.localToWorld(out.set(0, 0, z)); }

// ---------- 骨骼工具 ----------
const _sv = Array.from({ length: 12 }, () => new THREE.Vector3()), _sq = Array.from({ length: 8 }, () => new THREE.Quaternion());
const STAFF_UP = new THREE.Vector3(0, 1, 0);
function staffAimBone(bone, child, dir) {
  const start = bone.getWorldPosition(new THREE.Vector3());
  const current = child.getWorldPosition(new THREE.Vector3()).sub(start).normalize();
  const world = bone.getWorldQuaternion(new THREE.Quaternion());
  world.premultiply(new THREE.Quaternion().setFromUnitVectors(current, dir.clone().normalize()));
  bone.quaternion.copy(bone.parent.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(world));
  bone.updateWorldMatrix(false, true);
}
function boneRotWorld(bone, axis, angle) {
  if (!bone || !angle) return;
  const pq = bone.parent.getWorldQuaternion(new THREE.Quaternion()), wq = pq.clone().multiply(bone.quaternion);
  wq.premultiply(new THREE.Quaternion().setFromAxisAngle(axis, angle));
  bone.quaternion.copy(pq.invert().multiply(wq)); bone.updateWorldMatrix(false, true);
}
function setBoneWorldQ(bone, q) { bone.quaternion.copy(bone.parent.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(q)); bone.updateWorldMatrix(false, true); }
// Two-bone IK with a pole; returns the reachable end position.
function staffTwoBone(upper, lower, end, target, pole) {
  const start = upper.getWorldPosition(new THREE.Vector3()), mid = lower.getWorldPosition(new THREE.Vector3()), tip = end.getWorldPosition(new THREE.Vector3());
  const a = start.distanceTo(mid), b = mid.distanceTo(tip), axis = target.clone().sub(start);
  const d = clamp(axis.length(), Math.abs(a - b) + .001, a + b - .004); axis.normalize();
  const pv = pole.clone().addScaledVector(axis, -pole.dot(axis)); if (pv.lengthSq() < 1e-6) pv.set(0, -1, 0); pv.normalize();
  const along = (a * a - b * b + d * d) / (2 * d);
  const knee = start.clone().addScaledVector(axis, along).addScaledVector(pv, Math.sqrt(Math.max(0, a * a - along * along)));
  staffAimBone(upper, lower, knee.sub(start));
  const reach = start.clone().addScaledVector(axis, d);
  staffAimBone(lower, end, reach.clone().sub(lower.getWorldPosition(new THREE.Vector3())));
  return reach;
}
// Hand orientation: rotate the animated hand minimally so the shaft lies in the palm plane,
// then let the shaft roll inside the fingers within ±sl of the authored spin.
function staffHandQ(neutral, side, dir, sp, sl, d) {
  const n = new THREE.Vector3(0, 0, 1).applyQuaternion(neutral), n2 = n.clone().addScaledVector(dir, -n.dot(dir));
  if (n2.lengthSq() < 1e-6) n2.copy(n); n2.normalize();
  const H1 = new THREE.Quaternion().setFromUnitVectors(n, n2).multiply(neutral);
  const a0 = STAFF_AXIS[side].clone().applyQuaternion(H1);
  let phi = Math.atan2(a0.clone().cross(dir).dot(n2), a0.dot(dir));
  const key = side === 'Right' ? 'spin' : 'lspin';
  if (sl >= Math.PI - 1e-3) { if (d && d[key] != null) phi = d[key] + angDiff(d[key], phi); }
  else phi = sp + clamp(angDiff(sp, phi), -sl, sl);
  if (d) d[key] = phi;
  const axisL = STAFF_AXIS[side].clone().applyAxisAngle(new THREE.Vector3(0, 0, 1), phi);
  const H = new THREE.Quaternion().setFromUnitVectors(axisL.clone().applyQuaternion(H1), dir).multiply(H1);
  return { H, phi, axisL };
}
// Solve one arm so its palm (not the wrist) lands on `grip`.
function staffArmGrip(rig, side, grip, dir, sp, sl, d, weight = 1) {
  const B = rig.bones, upper = B[side + 'Arm'], lower = B[side + 'ForeArm'], hand = B[side + 'Hand'];
  if (!upper || !lower || !hand || weight <= 0) return null;
  const orig = [upper.quaternion.clone(), lower.quaternion.clone(), hand.quaternion.clone()];
  const rq = rig.root.getWorldQuaternion(new THREE.Quaternion()), rs = rig.root.scale.x;
  const pole = new THREE.Vector3(side === 'Right' ? -1 : 1, -.7, -.45).applyQuaternion(rq);
  const off = STAFF_GRIP[side];
  let Hq = hand.getWorldQuaternion(new THREE.Quaternion()), sol = null;
  for (let pass = 0; pass < 2; pass++) {
    const wrist = grip.clone().sub(off.clone().applyQuaternion(Hq).multiplyScalar(rs));
    staffTwoBone(upper, lower, hand, wrist, pole);
    hand.quaternion.copy(orig[2]); hand.updateWorldMatrix(false, true);
    sol = staffHandQ(hand.getWorldQuaternion(new THREE.Quaternion()), side, dir, sp, sl, pass ? d : null);
    Hq = sol.H;
  }
  setBoneWorldQ(hand, Hq);
  if (weight < 1) { [upper, lower, hand].forEach((b, i) => b.quaternion.slerpQuaternions(orig[i], b.quaternion.clone(), weight)); upper.updateWorldMatrix(false, true); }
  const palm = hand.localToWorld(off.clone().multiplyScalar(1 / hand.getWorldScale(new THREE.Vector3()).x * rs));
  return { palm, Hq: hand.getWorldQuaternion(new THREE.Quaternion()), axisL: sol.axisL };
}
// Root-local point from the chest-relative authoring frame.
function staffBodyPoint(P, r, u, f, spin = 0) {
  const v = new THREE.Vector3(-r, u, f), yaw = -(P.hip + P.tw);
  v.y -= .95; v.applyAxisAngle(STAFF_UP, yaw); v.applyAxisAngle(new THREE.Vector3(1, 0, 0).applyAxisAngle(STAFF_UP, yaw), P.lean); v.y += .95;
  v.y -= P.drop; v.z += P.hf; if (spin) v.applyAxisAngle(STAFF_UP, spin);
  return v;
}
function staffDir(P, spin = 0) { const v = new THREE.Vector3(-Math.sin(P.az) * Math.cos(P.el), Math.sin(P.el), Math.cos(P.az) * Math.cos(P.el)); if (spin) v.applyAxisAngle(STAFF_UP, spin); return v; }
// Pelvis yaw, spine twist / lean, hips drop and weight shift. Head stays on target.
function staffBody(rig, P, w) {
  const B = rig.bones, rq = rig.root.getWorldQuaternion(new THREE.Quaternion());
  const up = STAFF_UP.clone(), right = new THREE.Vector3(1, 0, 0).applyQuaternion(rq);
  if (B.Hips) {
    // Not every blended clip writes Hips.position each frame; never stack offsets on our own output.
    if (rig._hipsLast && B.Hips.position.equals(rig._hipsLast)) B.Hips.position.copy(rig._hipsBase); else (rig._hipsBase ||= new THREE.Vector3()).copy(B.Hips.position);
    B.Hips.updateWorldMatrix(false, true);
    const hp = B.Hips.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0, -P.drop * w, P.hf * w).applyQuaternion(rq).multiplyScalar(rig.root.scale.x));
    B.Hips.position.copy(B.Hips.parent.worldToLocal(hp)); B.Hips.updateWorldMatrix(false, true); (rig._hipsLast ||= new THREE.Vector3()).copy(B.Hips.position);
    boneRotWorld(B.Hips, up, -P.hip * w);
  }
  const lean = P.lean * w, tw = -P.tw * w;
  [[B.Spine, .3, .4], [B.Spine1, .35, .35], [B.Spine2, .35, .25]].forEach(([b, kt, kl]) => { if (!b) return; boneRotWorld(b, up, tw * kt); boneRotWorld(b, right.clone().applyAxisAngle(up, -(P.hip + P.tw) * w), lean * kl); });
  boneRotWorld(B.Neck, up, -(tw - P.hip * w) * .35); boneRotWorld(B.Head, up, -(tw - P.hip * w) * .3);
  boneRotWorld(B.Head, right, -lean * .45);
}
// Feet stay planted in world space and take quick procedural steps when the authored stance
// (animation + per-key offset) drifts too far; legs are solved with two-bone IK.
function staffLegs(p, rig, P, d, w, dt, anim) {
  const B = rig.bones, rq = rig.root.getWorldQuaternion(new THREE.Quaternion());
  for (const side of ['Left', 'Right']) {
    const key = side === 'Left' ? 'footL' : 'footR', up = B[side + 'UpLeg'], leg = B[side + 'Leg'], foot = B[side + 'Foot'];
    if (!up || !leg || !foot) continue;
    const a = anim[side];
    const desired = a.local.clone().add(new THREE.Vector3(0, 0, side === 'Left' ? P.fl : P.fr));
    let F = d[key];
    if (!F || w <= .001) { d[key] = F = { pos: rig.root.localToWorld(desired.clone()), from: null, to: null, t: 1 }; if (w <= .001) continue; }
    const want = rig.root.localToWorld(desired.clone());
    const other = d[side === 'Left' ? 'footR' : 'footL'];
    if (F.t >= 1 && F.pos.distanceTo(want) > .17 && (!other || other.t >= 1)) { F.from = F.pos.clone(); F.t = 0; }
    if (F.t < 1) { F.t = Math.min(1, F.t + dt / .12); const k = staffEase(F.t); F.pos.lerpVectors(F.from, want, k); F.pos.y = want.y + Math.sin(Math.PI * F.t) * .09; }
    const target = a.world.clone().lerp(F.pos, w);
    const pole = new THREE.Vector3(side === 'Left' ? .3 : -.3, 0, 1).applyAxisAngle(STAFF_UP, -P.hip * .7).applyQuaternion(rq);
    staffTwoBone(up, leg, foot, target, pole);
    setBoneWorldQ(foot, a.q);
  }
}
const staffEase = t => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };

// The rig has mitten hands without finger bones: a small skin-coloured fist wraps the shaft
// at the palm so the grip reads as closed fingers instead of a flat hand balancing a pole.
function staffFists(rig) {
  if (rig.staffFist) return rig.staffFist;
  const col = 0xeab48c;
  const mk = side => { const m = new THREE.Mesh(new THREE.SphereGeometry(1, 14, 10), M(col)); m.scale.set(.046, .036, .033); m.castShadow = true; m.visible = false; rig[side === 'Right' ? 'rHand' : 'lHand'].add(m); m.position.copy(STAFF_GRIP[side]); return m; };
  return rig.staffFist = { Right: mk('Right'), Left: mk('Left') };
}
function staffFistPose(f, axisL, on) { f.visible = on; if (on) f.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), axisL); }
// ---------- 主驱动 ----------
const STAFF_STYLE_COL = [0xffc040, 0x3fe6b4, 0xb877ff];
function driveStaff(p, dt) {
  const w = p.weapon;
  if (!w || WEAPONS[w.type].cls !== 'staff' || !p.rig.loaded) {
    if (p.rig.loaded) { const f = staffFists(p.rig); staffFistPose(f.Right, STAFF_AXIS.Right, !!w && !!w.mesh); f.Left.visible = false; }
    p.staffTrace = null; return;
  }
  const rig = p.rig, mesh = w.mesh, d = mesh.userData.staff || initStaffMesh(mesh, w.type), B = rig.bones;
  const attack = !cutscene && p.state === 'attack' && p.move?.staff, charge = !cutscene && p.state === 'staffCharge', spin = !cutscene && p.state === 'staffSpin';
  const own = !cutscene && (p.state === 'loco' || attack || charge || spin) && !p.guard;
  rig.root.updateMatrixWorld(true);
  const rq = rig.root.getWorldQuaternion(new THREE.Quaternion()), rqi = rq.clone().invert();
  const fists = staffFists(rig);
  if (!own && rig._hipsLast && B.Hips?.position.equals(rig._hipsLast)) { B.Hips.position.copy(rig._hipsBase); rig._hipsLast = null; rig.root.updateMatrixWorld(true); }
  if (!own) {
    staffFistPose(fists.Right, STAFF_AXIS.Right, true); fists.Left.visible = false;
    // Hit reactions, dodges, guard and cutscenes: the shaft simply rides in the palm.
    const gq = rig.grip.getWorldQuaternion(new THREE.Quaternion()), dirW = new THREE.Vector3(0, 0, 1).applyQuaternion(gq);
    d.gz = d.min + d.g * d.len;
    mesh.position.copy(rig.root.worldToLocal(rig.grip.getWorldPosition(new THREE.Vector3()).addScaledVector(dirW, -d.gz * rig.root.scale.x)));
    mesh.quaternion.copy(rqi.clone().multiply(gq)); mesh.updateWorldMatrix(true, true);
    bendStaff(mesh, dt, { x: 0, y: 0 }); p.staffTrace = null; d.ready = false; d.footL = d.footR = null; d.ikW = 0; d.lastState = p.state; return;
  }
  // ---- choose pose ----
  const run = Math.min(1, Math.hypot(p.vel.x, p.vel.z) / 5.5);
  let P;
  if (attack) {
    const m = p.move, t = clamp(p.mt, 0, 1);
    P = staffPose(m.staff, t);
    if (m.staff === 'pole') { P = { ...P }; if (!d.poleBase || d.poleAtk !== p.atkN) { d.poleAtk = p.atkN; d.poleBase = rig.root.localToWorld(new THREE.Vector3(-.06, 0, .46)); } }
  } else if (charge) {
    P = { ...STAFF_CHARGE[p.style] }; const k = clamp(p.chargeT / 1.1, 0, 1);
    P.drop += k * .06; P.lean += (p.style === 0 ? -.05 : .05) * k; P.tw += k * .1;
    if (p.style === 2) d.poleBase = rig.root.localToWorld(new THREE.Vector3(-.06, 0, .46));
  } else if (spin) {
    P = { ...STAFF_IDLE, r: .06, u: 1.22, f: .42, g: .5, sl: Math.PI, lw: 0, hip: .05, tw: .05, lean: .08, drop: .08, ik: 1, fl: .15, pole: 0, free: 0 };
    P.az = Math.PI / 2 + Math.sin(p.flowerA * .23) * .2; P.el = -(p.flowerA || 0); P.sp = 0;
  } else {
    P = staffMix(STAFF_IDLE, STAFF_RUN, staffEase(run));
    if (p.crouch) { P.u -= .3; P.drop = 0; }
    if (!p.grounded) { P.el += .2; P.az -= .1; }
    P.ik = 0;
  }
  // Blend out of attacks into the carry: the wrist rolls the shaft half a turn back under the arm.
  if (d.lastState !== p.state || attack && d.lastAtk !== p.atkN) {
    if (d.cur && (!attack || d.lastState !== 'attack')) { d.from = { ...d.cur }; d.fromT = 0; }
    d.lastAtk = p.atkN;
  }
  d.lastState = p.state;
  if (d.from && d.fromT < 1) {
    d.fromT = Math.min(1, d.fromT + dt / (attack ? .08 : .34)); const k = staffEase(d.fromT);
    const out = staffMix(d.from, P, k);
    if (!attack && !charge && !spin) out.el -= Math.sin(Math.PI * k) * 1.2;
    out.sl = Math.max(P.sl, d.from.sl, Math.sin(Math.PI * k) * Math.PI);
    P = out;
  }
  d.cur = { ...P };
  const spinY = attack && p.move.spin360 && p.view === 'third' ? rig.inner.rotation.y : 0;
  // ---- capture animated feet before the body is moved ----
  const anim = {};
  for (const side of ['Left', 'Right']) { const f = B[side + 'Foot']; if (f) { const wp = f.getWorldPosition(new THREE.Vector3()); anim[side] = { world: wp, local: rig.root.worldToLocal(wp.clone()), q: f.getWorldQuaternion(new THREE.Quaternion()) }; } }
  const ikTarget = (attack || charge || spin) && p.grounded ? P.ik : 0;
  d.ikW = lerp(d.ikW || 0, ikTarget, 1 - Math.exp(-dt * 14));
  const bodyW = attack || charge || spin ? 1 : .35;
  const hitPush = Math.max(0, d.hitKick || 0); d.hitKick = Math.max(0, (d.hitKick || 0) - dt * 6);
  const PB = { ...P, drop: P.drop + hitPush * .04, lean: P.lean + hitPush * .08, hf: P.hf + hitPush * .05 };
  staffBody(rig, PB, bodyW);
  if (B.LeftFoot && anim.Left) staffLegs(p, rig, PB, d, d.ikW, dt, anim);
  rig.root.updateMatrixWorld(true);
  // ---- shaft placement ----
  const dirL = staffDir(P, spinY), dirW = dirL.clone().applyQuaternion(rq);
  d.g = P.g; d.gz = d.min + P.g * d.len;
  const free = P.free > .5 && d.poleBase;
  let gripW;
  if (P.pole > .001 && d.poleBase) {
    const top = d.poleBase.clone().addScaledVector(dirW.clone().set(0, -1, 0), -(d.max - d.gz));
    const authored = rig.root.localToWorld(staffBodyPoint(PB, P.r, P.u, P.f, spinY));
    gripW = authored.lerp(top, P.pole);
  } else gripW = rig.root.localToWorld(staffBodyPoint(PB, P.r, P.u, P.f, spinY));
  if (P.pole > .001 && d.poleBase) dirW.lerp(new THREE.Vector3(0, -1, 0), P.pole).normalize();
  let Sq;
  fists.Left.visible = false; fists.Right.visible = !free;
  if (free) {
    // Planted pole stands on its own while the body kicks around it.
    Sq = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, -1, 0));
    const origin = d.poleBase.clone().addScaledVector(new THREE.Vector3(0, 1, 0), d.max);
    mesh.position.copy(rig.root.worldToLocal(origin)); mesh.quaternion.copy(rqi.clone().multiply(Sq));
  } else {
    const R = staffArmGrip(rig, 'Right', gripW, dirW, P.sp, P.sl, d);
    if (!R) return;
    staffFistPose(fists.Right, R.axisL, true);
    Sq = R.Hq.clone().multiply(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), R.axisL));
    const origin = R.palm.clone().addScaledVector(dirW, -d.gz * rig.root.scale.x);
    mesh.position.copy(rig.root.worldToLocal(origin)); mesh.quaternion.copy(rqi.clone().multiply(Sq));
  }
  mesh.updateWorldMatrix(true, true);
  // ---- left hand slides along the shaft to its authored station ----
  const lw = attack || charge ? P.lw : 0;
  d.lw = lerp(d.lw || 0, lw, 1 - Math.exp(-dt * 22)); d.lz = d.min + P.l * d.len;
  if (d.lw > .02 && !free) {
    // Slide the support hand along the shaft to the nearest station the arm can actually reach.
    const sh = B.LeftArm.getWorldPosition(new THREE.Vector3()), reach = (B.LeftArm.getWorldPosition(new THREE.Vector3()).distanceTo(B.LeftForeArm.getWorldPosition(new THREE.Vector3())) + B.LeftForeArm.getWorldPosition(new THREE.Vector3()).distanceTo(B.LeftHand.getWorldPosition(new THREE.Vector3())) + .05) * .97;
    const sideSign = Math.sign(d.lz - d.gz) || 1;
    let z = d.lz, best = z, bestD = Infinity;
    for (let i = 0; i < 40; i++) {
      const dist = staffLine(mesh, z).distanceTo(sh); if (dist < bestD) { bestD = dist; best = z; }
      if (dist <= reach) { best = z; break; }
      z -= sideSign * .025; if ((z - d.gz) * sideSign < .1) break;
    }
    d.lz = best;
    const target = staffLine(mesh, d.lz), dirS = new THREE.Vector3(0, 0, 1).applyQuaternion(mesh.getWorldQuaternion(new THREE.Quaternion()));
    const neutral = B.LeftHand.getWorldQuaternion(new THREE.Quaternion()), sp = new THREE.Vector3(...STAFF_AXIS.Left.toArray()).applyQuaternion(neutral).dot(dirS) >= 0 ? 0 : Math.PI;
    const L = staffArmGrip(rig, 'Left', target, dirS, sp, .7, d, d.lw);
    if (L) staffFistPose(fists.Left, L.axisL, d.lw > .45);
  }
  // ---- 2-D spring bend from tip velocity (lag) ----
  const tip = staffLine(mesh, d.max), tail = staffLine(mesh, d.min);
  const tipVel = d.ready ? tip.clone().sub(d.prevT).divideScalar(Math.max(dt, 1e-4)) : new THREE.Vector3();
  const mq = mesh.getWorldQuaternion(new THREE.Quaternion()), mx = new THREE.Vector3(1, 0, 0).applyQuaternion(mq), my = new THREE.Vector3(0, 1, 0).applyQuaternion(mq);
  const rootVel = new THREE.Vector3(p.vel.x, p.vy, p.vel.z);
  const rel = tipVel.clone().sub(rootVel), spd = rel.length();
  const gain = attack || spin ? .0105 : .006;
  bendStaff(mesh, dt, { x: -rel.dot(mx) * gain, y: -rel.dot(my) * gain }, attack || spin ? .28 : .5);
  d.tipSpeed = lerp(d.tipSpeed, d.ready ? spd : 0, .5);
  d.prevT.copy(tip); d.ready = true;
  // Whoosh whose pitch follows the shaft's angular speed.
  d.swishT -= dt;
  if ((attack || spin) && d.tipSpeed > 9 && d.swishT <= 0) { staffSwish(d.tipSpeed, WEAPONS[w.type].kind); d.swishT = spin ? .16 : .2; }
  mesh.updateWorldMatrix(true, true);
  const same = p.staffTrace && p.staffTrace.atk === p.atkN;
  const prevA = same ? p.staffTrace.a : tail, prevB = same ? p.staffTrace.b : tip;
  p.staffTrace = { a: tail, b: tip, prevA, prevB, atk: p.atkN, progress: attack ? p.mt : 0 };
}
function staffSwish(speed, kind) {
  const rate = clamp(.62 + speed / 34, .7, 1.55), vol = clamp(.25 + speed / 40, .3, 1) * (kind === 'iron' ? .85 : 1);
  if (typeof SFX !== 'undefined' && AC && SFX.cache.whoosh) {
    AudioBus.init(); const s = AC.createBufferSource(), g = AC.createGain(); s.buffer = SFX.cache.whoosh;
    s.playbackRate.value = rate * (kind === 'iron' ? .82 : kind === 'broom' ? 1.12 : 1); g.gain.value = vol; s.connect(g); g.connect(AudioBus.sfx); s.start(); return;
  }
  if (!AC) return;
  const t = AC.currentTime, src = AC.createBufferSource(), f = AC.createBiquadFilter(), gn = AC.createGain();
  src.buffer = noiseBuf; f.type = 'bandpass'; f.Q.value = 2.2; f.frequency.setValueAtTime(500 * rate, t); f.frequency.exponentialRampToValueAtTime(1900 * rate, t + .12);
  gn.gain.setValueAtTime(.001, t); gn.gain.exponentialRampToValueAtTime(.3 * vol, t + .03); gn.gain.exponentialRampToValueAtTime(.001, t + .2);
  src.connect(f); f.connect(gn); gn.connect(AC.destination); src.start(t); src.stop(t + .22);
}
// Moving shaft against a standing body capsule (straight shaft; bend is visual only).
// Substeps prevent fast sweeps skipping a target between simulation ticks.
function staffHitCheck(p, dt) {
  const m = p.move, trace = p.staffTrace;
  if (!trace || !m?.staff) return;
  const previous = p.mt - dt / (m.dur / moveSpeed());
  if (m.ring || m.quake) for (let hi = 0; hi < m.hits.length; hi++) {
    const ht = m.hits[hi]; if (!(p.mt >= ht && previous < ht)) continue;
    if (m.quake) staffQuake(p, m, hi); else staffRing(p, m, hi);
  }
  if (m.ring) return;
  for (let hi = 0; hi < m.hits.length; hi++) {
    const ht = m.hits[hi], win = m.hitWin || .1, lo = ht - win, high = ht + win;
    if (p.mt < lo || previous > high) continue;
    const targets = new Set(), span = Math.max(trace.a.distanceTo(trace.prevA), trace.b.distanceTo(trace.prevB));
    const steps = Math.min(16, Math.max(2, Math.ceil(span / .12)));
    const from = clamp((lo - previous) / Math.max(.001, p.mt - previous), 0, 1), to = clamp((high - previous) / Math.max(.001, p.mt - previous), 0, 1);
    for (let i = 0; i <= steps; i++) {
      const t = lerp(from, to, i / steps), a = trace.prevA.clone().lerp(trace.a, t), b = trace.prevB.clone().lerp(trace.b, t);
      const shaft = new THREE.Line3(a, b), closest = new THREE.Vector3();
      for (const e of enemies) {
        if (e.dead || e.hidden || p.hitDone[hi].has(e)) continue;
        for (const y of [.35, .8, 1.25]) {
          const center = e.pos.clone(); center.y += y * e.scale;
          shaft.closestPointToPoint(center, true, closest);
          if (closest.distanceTo(center) < e.radius + .18) { targets.add(e); break; }
        }
      }
    }
    if (targets.size) { playerHitCheck(m, hi, targets); staffOnHit(p, m); }
    if (!p.weapon) break;
  }
}
function staffOnHit(p, m) {
  const d = p.weapon?.mesh.userData.staff; if (!d) return;
  const k = m.heavy ? 1.6 : 1; d.vx += (Math.random() - .5) * 4 * k; d.vy += (Math.random() < .5 ? -1 : 1) * 3 * k; d.hitKick = m.heavy ? 1.3 : 1;
}
// Dragon smash / leap slam: ground crack + dust ring, area damage around the impact point.
function staffQuake(p, m, hi) {
  const lv = m.chargeLevel ? Math.round(m.chargeLevel * 3) : 1, R = (m.quakeR || 1.6) + (lv - 1) * .6;
  const tip = p.staffTrace ? p.staffTrace.b.clone() : p.pos.clone(); tip.y = .04;
  const fwd = new THREE.Vector3(Math.sin(p.yaw), 0, Math.cos(p.yaw)), c = p.pos.clone().addScaledVector(fwd, 1.5); c.y = .05;
  if (tip.distanceTo(c) < 1.2) c.lerp(tip, .5);
  shock(c, 0xc9a27a, R * .7); shock(c, STAFF_STYLE_COL[p.style], R * .45); burst(c, 0xc9a27a, 24 + lv * 10, 4 + lv); burst(c.clone().setY(.3), 0x2a2018, 10, 3);
  staffCrack(c, R, p.yaw);
  shake = Math.max(shake, .22 + lv * .07); staffCamPunch(fwd, .12 + lv * .05, 4 + lv * 1.5); impact('fall', { pos: c, big: true });
  const near = new Set(enemies.filter(e => !e.dead && !e.hidden && e.pos.distanceTo(c) < R + e.radius && Math.abs(e.pos.y - p.pos.y) < 1.2));
  if (near.size) { playerHitCheck(m, hi, near); staffOnHit(p, m); }
}
// Drunk pole: sweeping kick off the planted staff hits everything around.
function staffRing(p, m, hi) {
  const near = new Set(enemies.filter(e => !e.dead && !e.hidden && Math.hypot(e.pos.x - p.pos.x, e.pos.z - p.pos.z) < (m.ringR || 2.1) + e.radius));
  burst(p.pos.clone().setY(.9), STAFF_STYLE_COL[p.style], 14, 4); shock(p.pos.clone().setY(.4 + p.pos.y), STAFF_STYLE_COL[p.style], 1.2);
  if (near.size) playerHitCheck(m, hi, near);
}
// Camera punch: FOV kick plus a short shake along the hit direction.
let staffFovKick = 0; const staffShakeDir = new THREE.Vector3(); let staffShakeT = 0, staffShakeA = 0;
function staffCamPunch(dir, amp, fov) { staffShakeDir.copy(dir).normalize(); staffShakeT = 0; staffShakeA = Math.max(staffShakeA * Math.exp(-staffShakeT * 9), amp); staffFovKick = Math.max(staffFovKick, fov); }
function staffCamApply(dt) {
  if (staffShakeA > .001) { staffShakeT += dt; const a = staffShakeA * Math.exp(-staffShakeT * 10) * Math.sin(staffShakeT * 55); camera.position.addScaledVector(staffShakeDir, a); if (staffShakeT > .45) staffShakeA = 0; }
  if (staffFovKick > .01) { camera.fov -= staffFovKick; staffFovKick *= Math.exp(-dt * 14); }
}

// ---------- 残影：① 弧面光带  ② 棍身残影  ③ 人物残影 （全部固定对象池） ----------
const STAFF_ECHOES = [];
let staffEchoT = 0, staffEchoIndex = 0;
const RIB_N = 9, RIB_SUB = 4, RIB_MAX = (RIB_N - 1) * RIB_SUB + 1;
const STAFF_RIBBONS = [], staffRibHist = [];
let staffRibTex = null;
function staffRibbonTexture() {
  if (staffRibTex) return staffRibTex;
  const c = document.createElement('canvas'); c.width = 64; c.height = 32; const g = c.getContext('2d'), img = g.createImageData(64, 32);
  for (let y = 0; y < 32; y++) for (let x = 0; x < 64; x++) {
    const u = x / 63, v = y / 31, a = Math.pow(1 - u, 1.6) * Math.pow(v, 1.4) * (v > .9 ? 1.25 : 1), i = (y * 64 + x) * 4;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = 255; img.data[i + 3] = clamp(a, 0, 1) * 255;
  }
  g.putImageData(img, 0, 0); staffRibTex = new THREE.CanvasTexture(c); staffRibTex.colorSpace = THREE.SRGBColorSpace; return staffRibTex;
}
function staffMakeRibbon(additive) {
  const geo = new THREE.BufferGeometry(), pos = new Float32Array(RIB_MAX * 2 * 3), uv = new Float32Array(RIB_MAX * 2 * 2), idx = [];
  for (let i = 0; i < RIB_MAX - 1; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage)); geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2).setUsage(THREE.DynamicDrawUsage)); geo.setIndex(idx);
  const mat = new THREE.MeshBasicMaterial({ map: staffRibbonTexture(), color: 0xffffff, transparent: true, depthWrite: false, side: THREE.DoubleSide, toneMapped: false, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending });
  const mesh = new THREE.Mesh(geo, mat); mesh.frustumCulled = false; mesh.visible = false; mesh.renderOrder = 5; scene.add(mesh); return mesh;
}
function staffInitFx() {
  if (STAFF_ECHOES.length) return;
  for (let i = 0; i < 7; i++) {
    const g = new THREE.CylinderGeometry(.042, .042, 1.8, 7, 18); g.rotateX(Math.PI / 2); g.translate(0, 0, .45);
    const mat = new THREE.MeshBasicMaterial({ color: 0xffe0a0, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false });
    const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; mesh.matrixAutoUpdate = false; mesh.visible = false; scene.add(mesh);
    STAFF_ECHOES.push({ mesh, life: 0, rest: g.attributes.position.array.slice() });
  }
  // [plus side glow, plus side edge, minus side glow, minus side ink]
  for (let i = 0; i < 4; i++) STAFF_RIBBONS.push({ mesh: staffMakeRibbon(true), ink: staffMakeRibbon(false), n: 0 });
  for (let i = 0; i < 9; i++) staffRibHist.push({ a: [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()], age: 99 });
}
const staffCR = (p0, p1, p2, p3, t, out) => {
  const t2 = t * t, t3 = t2 * t;
  return out.set(
    .5 * (2 * p1.x + (-p0.x + p2.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
    .5 * (2 * p1.y + (-p0.y + p2.y) * t + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3),
    .5 * (2 * p1.z + (-p0.z + p2.z) * t + (2 * p0.z - 5 * p1.z + 4 * p2.z - p3.z) * t2 + (-p0.z + 3 * p1.z - 3 * p2.z + p3.z) * t3));
};
let staffRibHead = 0, staffRibCount = 0;
function staffFxMode(p) {
  const m = p.move;
  const ink = p.state === 'attack' && m && (m.heavy || m.finisher);
  return { col: STAFF_STYLE_COL[p.style], ink };
}
function updateStaffEchoes(dt) {
  staffInitFx();
  for (const e of STAFF_ECHOES) { e.life -= dt; e.mesh.visible = e.life > 0; if (e.mesh.visible) e.mesh.material.opacity = e.peak * (e.life / .2) ** 1.5; }
  updateStaffGhosts(dt); staffGhostTick(player, dt);
  const p = player, m = p.move, w = p.weapon, d = w?.mesh.userData.staff;
  const swinging = !!d && !cutscene && !gameOver && (p.state === 'attack' && m?.staff && m.hits.some(h => Math.abs(p.mt - h) < .2) || p.state === 'staffSpin') && d.tipSpeed > 5.5;
  // ① ribbon history (fixed ring buffer); ages advance with game time so hit-stop freezes it.
  for (const h of staffRibHist) h.age += dt;
  if (swinging) {
    const mesh = w.mesh, h = staffRibHist[staffRibHead = (staffRibHead + 1) % staffRibHist.length], gz = d.gz;
    const plus = Math.max(.01, d.max - gz), minus = gz - d.min;
    staffPoint(mesh, gz + plus * .3, h.a[0]); staffPoint(mesh, d.max + .03, h.a[1]);
    staffPoint(mesh, gz - Math.max(.01, minus) * .3, h.a[2]); staffPoint(mesh, d.min - .03, h.a[3]);
    h.age = 0; h.minus = minus > .55;
  }
  const mode = d ? staffFxMode(p) : { col: 0xffffff, ink: false }, life = .16;
  const order = []; for (let i = 0; i < staffRibHist.length; i++) { const h = staffRibHist[(staffRibHead - i + staffRibHist.length * 2) % staffRibHist.length]; if (h.age > life) break; order.push(h); }
  STAFF_RIBBONS.forEach((R, ri) => {
    const side = ri >> 1, layer = ri & 1, use = order.filter(h => side === 0 || h.minus);
    const visible = use.length >= 3 && p.view === 'third';
    R.mesh.visible = visible && !(layer === 0 && mode.ink); R.ink.visible = visible && layer === 0 && mode.ink;
    if (!visible) return;
    const M = R.ink.visible ? R.ink : R.mesh, pos = M.geometry.attributes.position.array, uv = M.geometry.attributes.uv.array;
    const n = use.length, inner = side * 2, outer = side * 2 + 1, tmp = new THREE.Vector3(), q = new THREE.Vector3();
    let k = 0;
    for (let i = 0; i < n - 1 && k < RIB_MAX; i++) for (let s = 0; s < RIB_SUB && k < RIB_MAX; s++) {
      const t = s / RIB_SUB, P = j => use[clamp(j, 0, n - 1)].a;
      for (const [c, vv] of [[inner, 0], [outer, 1]]) {
        staffCR(P(i - 1)[c], P(i)[c], P(i + 1)[c], P(i + 2)[c], t, tmp);
        if (layer === 1 && vv === 0) { staffCR(P(i - 1)[outer], P(i)[outer], P(i + 1)[outer], P(i + 2)[outer], t, q); tmp.lerp(q, .72); }
        pos.set([tmp.x, tmp.y, tmp.z], (k * 2 + vv) * 3);
        uv.set([(i + t) / (n - 1) * .85 + use[i].age / life * .15, vv], (k * 2 + vv) * 2);
      }
      k++;
    }
    M.geometry.setDrawRange(0, Math.max(0, (k - 1) * 6)); M.geometry.attributes.position.needsUpdate = true; M.geometry.attributes.uv.needsUpdate = true;
    const fade = clamp(1 - (order[0]?.age || 0) / life, 0, 1);
    if (M === R.ink) { M.material.color.setHex(0x0b0907); M.material.opacity = .62 * fade; }
    else { M.material.color.setHex(layer === 1 && mode.ink ? 0xffd27a : mode.col); M.material.opacity = (layer === 1 ? 1 : .55) * fade; }
  });
  // ② shaft afterimages
  if (!swinging || (staffEchoT -= dt) > 0) { if (!swinging) staffEchoT = 0; return; }
  staffEchoT = m?.staff === 'twirl' || p.state === 'staffSpin' ? .045 : .03;
  const e = STAFF_ECHOES[staffEchoIndex++ % STAFF_ECHOES.length], a = e.mesh.geometry.attributes.position.array;
  for (let i = 0; i < a.length; i += 3) { const z = e.rest[i + 2], [ox, oy] = staffBendAt(d, z); a[i] = e.rest[i] + ox; a[i + 1] = e.rest[i + 1] + oy; a[i + 2] = z; }
  e.mesh.geometry.attributes.position.needsUpdate = true;
  e.mesh.material.color.setHex(mode.ink ? 0xffd27a : mode.col).multiplyScalar(mode.ink ? .9 : 1.3);
  e.mesh.matrix.copy(w.mesh.matrixWorld); e.mesh.matrixWorldNeedsUpdate = true; e.mesh.visible = true; e.life = .2; e.peak = mode.ink ? .5 : .42; e.mesh.material.opacity = e.peak;
}
function staffResetFx() {
  for (const e of STAFF_ECHOES) { e.life = 0; e.mesh.visible = false; }
  for (const R of STAFF_RIBBONS) { R.mesh.visible = R.ink.visible = false; }
  for (const h of staffRibHist) h.age = 99;
  for (const g of STAFF_GHOSTS) { g.life = 0; g.root.visible = false; }
  staffFovKick = 0; staffShakeA = 0;
}
// ③ character afterimages: 3 frozen copies of the skinned body, additive and fading.
const STAFF_GHOSTS = [];
let staffGhostI = 0;
// Finishers drop up to three copies along the path leading into the last impact.
let staffGhostAtk = -1, staffGhostN = 0, staffGhostCD = 0;
function staffGhostTick(p, dt) {
  const m = p.move; staffGhostCD -= dt;
  if (p.state !== 'attack' || !m?.staff || !m.finisher || p.view !== 'third' || cutscene) return;
  if (staffGhostAtk !== p.atkN) { staffGhostAtk = p.atkN; staffGhostN = 0; }
  const last = m.hits[m.hits.length - 1], first = m.ring ? m.hits[0] - .12 : last - .24;
  if (staffGhostN < 3 && p.mt > first && p.mt < last + .04 && staffGhostCD <= 0) { staffGhost(p, m); staffGhostN++; staffGhostCD = .05; }
}
function staffGhost(p, m) {
  if (!p.rig.loaded || !SKIN.chars[p.rig.name]) return;
  if (!STAFF_GHOSTS.length) for (let i = 0; i < 3; i++) {
    const root = SkeletonUtils.clone(SKIN.chars[p.rig.name].scene), mat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false });
    const bones = {}; root.traverse(o => { if (o.isBone) bones[o.name] = o; if (o.isMesh) { o.material = mat; o.frustumCulled = false; o.castShadow = false; } });
    root.matrixAutoUpdate = false; root.visible = false; scene.add(root); STAFF_GHOSTS.push({ root, mat, bones, life: 0, staff: null });
  }
  const G = STAFF_GHOSTS[staffGhostI++ % STAFF_GHOSTS.length], src = p.rig.inner.children.find(o => o.isObject3D && o !== p.weapon?.mesh) || p.rig.inner.children[0];
  if (!src) return;
  src.traverse(o => { if (o.isBone && G.bones[o.name]) { G.bones[o.name].position.copy(o.position); G.bones[o.name].quaternion.copy(o.quaternion); G.bones[o.name].scale.copy(o.scale); } });
  src.updateMatrixWorld(true); G.root.matrix.copy(src.matrixWorld); G.root.matrixWorldNeedsUpdate = true; G.root.visible = true; G.root.updateMatrixWorld(true);
  G.life = .32; G.peak = m && (m.heavy || m.finisher) ? .3 : .22; G.mat.color.setHex(STAFF_STYLE_COL[p.style]); G.mat.opacity = G.peak;
}
function updateStaffGhosts(dt) { for (const G of STAFF_GHOSTS) { if (G.life <= 0) continue; G.life -= dt; G.root.visible = G.life > 0; G.mat.opacity = G.peak * Math.max(0, G.life / .32) ** 1.3; } }

// ---------- 裂地贴花（2 个池化平面） ----------
const STAFF_CRACKS = [];
function staffCrack(pos, R, yaw) {
  if (!STAFF_CRACKS.length) for (let i = 0; i < 2; i++) {
    const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d');
    g.strokeStyle = 'rgba(20,14,8,0.95)'; g.lineCap = 'round';
    for (let k = 0; k < 11; k++) {
      let a = k / 11 * TAU + Math.random() * .4, x = 128, y = 128, wdt = 7;
      g.beginPath(); g.moveTo(x, y);
      for (let s = 0; s < 6; s++) { a += (Math.random() - .5) * .9; const L = 12 + Math.random() * 14; x += Math.cos(a) * L; y += Math.sin(a) * L; g.lineWidth = wdt; g.lineTo(x, y); wdt *= .72; }
      g.stroke();
    }
    const gr = g.createRadialGradient(128, 128, 4, 128, 128, 40); gr.addColorStop(0, 'rgba(15,10,6,.85)'); gr.addColorStop(1, 'rgba(15,10,6,0)'); g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
    const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }));
    mesh.rotation.x = -Math.PI / 2; mesh.visible = false; mesh.renderOrder = 2; scene.add(mesh); STAFF_CRACKS.push({ mesh, life: 0 });
  }
  const C = STAFF_CRACKS.find(c => c.life <= 0) || STAFF_CRACKS[0];
  C.mesh.position.set(pos.x, .02, pos.z); C.mesh.rotation.z = yaw + Math.random(); C.mesh.scale.setScalar(R * 1.6); C.life = 2.2; C.mesh.visible = true; C.mesh.material.opacity = 1;
}
function updateStaffCracks(dt) { for (const C of STAFF_CRACKS) { if (C.life <= 0) continue; C.life -= dt; C.mesh.material.opacity = clamp(C.life / .8, 0, 1); C.mesh.visible = C.life > 0; } }
