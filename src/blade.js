// ================= 刀剑：单手拳心握柄 / 刃口跟随挥砍方向 / 副手剑指或双手握 =================
// 与棍法共用一套姿态编写方式（见 staff.js 顶部）：h 为右手拳心、d 为刃尖方向；
// x/xw 是左手剑指目标及权重；lw 为左手上柄双手握的权重。刃口方向不必编写——
// 每帧取刃身的横向运动方向（劈砍时刃口朝前进方向），停下来后回到手腕自然的朝向。
const BLADE_KIND = { sword: { gz: .02, tip: .91, two: -.08 }, katana: { gz: .08, tip: .95, two: -.05 }, umbrella: { gz: -.02, tip: 1.0, two: -.08 } };
const BSK = list => SKS(list.map(([t, o], i) => [t, i === 0 ? { sp: 0, sl: 22, g: 0, lw: 0, ...o } : o]));
const BLADE_GUARD = { h: [.2, 1.1, .34], d: [-8, 26], x: [-.1, 1.2, .3], xw: .85, hip: -.18, tw: -.12, lean: .04, drop: .04 };
const BLADE_IDLE = staffSample(BSK([[0, BLADE_GUARD], [1, {}]]), 0);
const BLADE_RUN = staffSample(BSK([[0, { h: [.24, .95, -.06], d: [176, -32], xw: 0, lean: .1 }], [1, {}]]), 0);
const BLADE_CROUCH = staffSample(BSK([[0, { ...BLADE_GUARD, h: [.22, .82, .36], d: [-6, 14], x: [-.1, .95, .3] }], [1, {}]]), 0);
const BG = BLADE_GUARD;
const BLADE_POSES = {
  // —— 龙形刀：大开大合 ——
  // 力劈华山：双手举刀过顶、劈到胸前收住
  chop: BSK([[0, BG], [.22, { h: [.1, 1.66, -.02], d: [178, 62], lw: 1, xw: 0, hip: .12, tw: .18, lean: -.1, drop: .02 }],
    [.45, { h: [.04, 1.2, .52], d: [0, -10], hip: -.1, tw: -.08, lean: .26, drop: .14, fl: .26 }],
    [.62, { h: [.02, 1.0, .46], d: [-4, -42], lean: .3, drop: .16 }],
    [1, { h: [.12, 1.05, .36], d: [-6, 6], lw: 0, xw: .6, lean: .1, drop: .06 }]]),
  // 斜斩：右上 → 左下
  diag: BSK([[0, { h: [.12, 1.05, .36], d: [-6, 6], x: [-.12, 1.15, .28], xw: .6, hip: -.1, tw: -.1, lean: .1, drop: .06, fl: .26 }],
    [.25, { h: [.36, 1.55, .1], d: [125, 50], x: [-.3, 1.2, .2], hip: .3, tw: .38, lean: -.04 }],
    [.5, { h: [.02, 1.12, .56], d: [-40, -22], hip: -.2, tw: -.4, lean: .22, drop: .12, fr: .2 }],
    [.72, { h: [-.16, .95, .36], d: [-115, -40], x: [-.35, 1.25, -.05], hip: -.3, tw: -.55, lean: .25 }],
    [1, { h: [-.02, 1.05, .36], d: [-60, 0], hip: -.15, tw: -.3, lean: .1 }]]),
  // 回刀横斩：左 → 右，胸高平抹
  sweepR: BSK([[0, { h: [-.02, 1.05, .36], d: [-60, 0], x: [-.35, 1.25, -.05], xw: .6, hip: -.15, tw: -.3, lean: .1, drop: .08 }],
    [.2, { h: [-.2, 1.22, .26], d: [-140, 4], hip: -.35, tw: -.65 }],
    [.45, { h: [.22, 1.22, .58], d: [25, 0], x: [-.3, 1.2, .1], hip: .1, tw: .2, lean: .15, drop: .1, fr: .25 }],
    [.65, { h: [.46, 1.18, .2], d: [115, 6], x: [-.38, 1.25, .15], hip: .38, tw: .6 }],
    [1, { h: [.32, 1.15, .26], d: [60, 18], hip: .2, tw: .3, lean: .06 }]]),
  // 龙卷刀：刀平伸体侧，整个人转圈
  tornado: BSK([[0, BG], [.12, { h: [.46, 1.2, .26], d: [72, 0], x: [-.4, 1.2, .1], xw: .9, hip: .2, tw: .3, drop: .12, lean: .1 }],
    [.5, { h: [.48, 1.16, .28], d: [78, -4], drop: .16, lean: .14 }], [.88, { h: [.46, 1.2, .26], d: [72, 0], drop: .12 }],
    [1, { h: [.22, 1.12, .34], d: [0, 12], hip: 0, tw: 0, drop: .06 }]]),
  // —— 蛇形剑：直刺 ——
  stab1: BSK([[0, BG], [.25, { h: [.24, 1.12, -.02], d: [0, 4], x: [-.15, 1.22, .2], hip: -.02, tw: .1, lean: 0 }],
    [.45, { h: [.08, 1.24, .66], d: [0, -1], x: [-.42, 1.3, -.1], hip: -.38, tw: -.3, lean: .22, drop: .1, fr: .3 }],
    [.72, { h: [.1, 1.22, .6], d: [0, 0] }], [1, BG]]),
  stab2: BSK([[0, BG], [.25, { h: [.25, 1.0, -.04], d: [-4, 0], x: [-.15, 1.15, .2], hip: 0, tw: .12 }],
    [.45, { h: [.06, 1.02, .66], d: [-6, -8], x: [-.42, 1.28, -.12], hip: -.4, tw: -.32, lean: .28, drop: .16, fr: .3 }],
    [.72, { h: [.08, 1.02, .6], d: [-4, -6] }], [1, BG]]),
  pierce: BSK([[0, BG], [.3, { h: [.26, 1.08, -.1], d: [0, 2], x: [-.12, 1.2, .25], hip: .05, tw: .15, drop: .12 }],
    [.5, { h: [.05, 1.12, .76], d: [0, -4], x: [-.45, 1.32, -.2], hip: -.45, tw: -.35, lean: .36, drop: .24, fr: .45 }],
    [.78, { h: [.06, 1.12, .7], d: [0, -3] }], [1, BG]]),
  // —— 醉剑：身随剑倒 ——
  drunk1: BSK([[0, BG], [.2, { h: [-.15, 1.25, .3], d: [-110, 25], x: [.05, 1.45, .1], xw: .7, lean: -.12, tw: -.5, hip: -.2 }],
    [.45, { h: [.3, 1.3, .52], d: [35, 8], tw: .25, lean: .05, hip: .05 }],
    [.7, { h: [.48, 1.22, .12], d: [125, 22], x: [-.3, 1.4, .25], tw: .55, lean: .18, hip: .3, drop: .1 }],
    [1, { h: [.3, 1.15, .26], d: [70, 20], tw: .3, hip: .15, lean: .08 }]]),
  drunk2: BSK([[0, { h: [.3, 1.15, .26], d: [70, 20], x: [-.3, 1.4, .25], xw: .7, tw: .3, hip: .15, lean: .08 }],
    [.22, { h: [.38, 1.52, -.02], d: [160, 55], tw: .55, hip: .3, lean: -.16 }],
    [.5, { h: [0, .95, .5], d: [-30, -38], x: [-.1, 1.5, -.15], tw: -.4, hip: -.2, lean: .32, drop: .16, fl: .25 }],
    [.75, { h: [-.15, .9, .35], d: [-90, -30], tw: -.5, lean: .3 }],
    [1, { h: [-.02, 1.05, .36], d: [-50, 5], tw: -.2, hip: -.1, lean: .1, drop: .06 }]]),
  // —— 通用：蹲轻低扫、蹲重撩天、空中劈、流星坠 ——
  low: BSK([[0, { h: [-.12, .86, .3], d: [-100, -25], x: [-.3, 1.0, .1], xw: .7, drop: .1, lean: .3, tw: -.4, hip: -.2 }],
    [.5, { h: [.25, .64, .55], d: [20, -35], tw: .2, hip: .05 }], [.75, { h: [.45, .68, .25], d: [110, -30], tw: .5, hip: .3 }],
    [1, { h: [.3, .8, .3], d: [40, -10], tw: .2, hip: .1 }]]),
  rise: BSK([[0, { h: [.1, .85, .42], d: [-10, -50], xw: 0, drop: .25, lean: .3 }],
    [.45, { h: [.12, 1.62, .3], d: [8, 72], drop: 0, lean: -.12 }], [.7, { h: [.12, 1.7, .2], d: [5, 85] }],
    [1, { h: [.15, 1.25, .3], d: [10, 35], lean: 0 }]]),
  air: BSK([[0, { h: [.22, 1.6, -.02], d: [170, 60], xw: 0, ik: 0, lean: -.1 }], [.45, { h: [.05, 1.08, .52], d: [0, -40], lean: .35 }], [1, { h: [.1, 1.0, .4], d: [-15, -20] }]]),
  meteor: BSK([[0, { h: [.06, 1.62, .18], d: [0, -78], lw: 1, xw: 0, ik: 0, lean: -.05 }], [.4, { h: [.04, 1.0, .45], d: [0, -84], lean: .4, drop: .15 }], [1, { h: [.05, .95, .42], d: [0, -82], drop: .25 }]]),
};
// 万剑归宗：n 连刺，高低左右交错，副手剑指始终领在身后
function bladeFlurry(n) {
  const L = [[0, BG]];
  for (let i = 0; i < n; i++) {
    const a = .1 + .8 * i / n, b = .1 + .8 * (i + .5) / n, h = [1.2, 1.05, 1.32, 1.1, 1.25][i % 5], az = [0, -10, 8, -5, 6][i % 5];
    L.push([a, { h: [.24, 1.08, -.02], d: [az * .4, 2], x: [-.35, 1.3, -.1], hip: -.05, tw: .1, lean: .05, drop: .1 }]);
    L.push([b, { h: [.08, h, .66], d: [az, (h - 1.15) * 20], hip: -.38, tw: -.3, lean: .25, drop: .14, fr: .3 }]);
  }
  L.push([1, BG]); return BSK(L);
}
BLADE_POSES.flurry = bladeFlurry(5);
function bladePose(kind, t) { return staffSample(BLADE_POSES[kind] || BLADE_POSES.chop, t); }

function initBladeMesh(mesh, type) {
  const K = BLADE_KIND[WEAPONS[type].kind] || BLADE_KIND.sword;
  mesh.rotation.set(0, 0, 0); mesh.position.set(0, 0, 0);
  mesh.traverse(o => { if (o.isMesh) o.frustumCulled = false; });
  // gz/max/min/bx/by keep the staff ribbon helpers working unchanged (a blade never bends).
  return mesh.userData.blade = { type, gz: K.gz, two: K.two, min: K.gz - .12, max: K.tip, bx: 0, by: 0, tipSpeed: 0, edge: null, prevT: new THREE.Vector3(), ready: false, swishT: 0, cur: null, from: null, fromT: 1, lastState: '', lastAtk: -1, footL: null, footR: null, ikW: 0, lw: 0, xw: 0 };
}
// Blade frame: local z = blade direction, local y = edge.
function bladeQ(dir, edge) {
  const z = dir.clone().normalize(), y = edge.clone().addScaledVector(z, -edge.dot(z)).normalize(), x = new THREE.Vector3().crossVectors(y, z);
  return new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, z));
}
const BLADE_KNUCKLE = new THREE.Vector3(0, 1, 0);
function bladeNaturalEdge(Hq, axisL, dir) { const e = BLADE_KNUCKLE.clone().addScaledVector(axisL, -BLADE_KNUCKLE.dot(axisL)).applyQuaternion(Hq); return e.addScaledVector(dir, -e.dot(dir)).normalize(); }
function bladeRide(p, rig, mesh, d) {
  // Hit reactions, dodges, guard, cutscenes and kick clips: the hilt simply sits in the fist.
  const hand = rig.bones.RightHand, Hq = hand.getWorldQuaternion(new THREE.Quaternion()), rq = rig.root.getWorldQuaternion(new THREE.Quaternion());
  const dir = STAFF_AXIS.Right.clone().applyQuaternion(Hq), edge = bladeNaturalEdge(Hq, STAFF_AXIS.Right, dir);
  const palm = rig.rHand.localToWorld(STAFF_GRIP.Right.clone());
  mesh.position.copy(rig.root.worldToLocal(palm.addScaledVector(dir, -d.gz * rig.root.scale.x)));
  mesh.quaternion.copy(rq.invert().multiply(bladeQ(dir, edge))); mesh.updateWorldMatrix(true, true);
  d.edge = edge; d.ready = false; d.tipSpeed = 0;
}
function driveBlade(p, dt) {
  const w = p.weapon;
  if (!w || WEAPONS[w.type].cls !== 'blade' || !w.mesh || !p.rig.loaded) { p.bladeTrace = null; return; }
  const rig = p.rig, mesh = w.mesh, d = mesh.userData.blade || initBladeMesh(mesh, w.type), B = rig.bones;
  if (!B.RightArm || !B.RightForeArm || !B.RightHand) return;
  const m = p.move, attack = !cutscene && p.state === 'attack' && !!m?.blade, clipMove = attack && m.bladeClip;
  const own = !cutscene && (p.state === 'loco' || attack && !clipMove) && !p.guard;
  rig.root.updateMatrixWorld(true);
  const fists = staffFists(rig); fists.Left.visible = false; staffFistPose(fists.Right, STAFF_AXIS.Right, true);
  if (!own) {
    if (rig._hipsLast && B.Hips?.position.equals(rig._hipsLast)) { B.Hips.position.copy(rig._hipsBase); rig._hipsLast = null; rig.root.updateMatrixWorld(true); }
    bladeRide(p, rig, mesh, d); d.footL = d.footR = null; d.ikW = 0; d.lastState = p.state; d.cur = null;
    p.bladeTrace = clipMove ? { a: staffLine(mesh, d.gz + .1), b: staffLine(mesh, d.max), atk: p.atkN } : null; return;
  }
  const rq = rig.root.getWorldQuaternion(new THREE.Quaternion()), rqi = rq.clone().invert();
  // ---- pose ----
  let P;
  if (attack) P = bladePose(m.blade, clamp(p.mt, 0, 1));
  else {
    const run = Math.min(1, Math.hypot(p.vel.x, p.vel.z) / 5.5);
    P = p.crouch ? { ...BLADE_CROUCH } : staffMix(BLADE_IDLE, BLADE_RUN, staffEase(run));
    if (!p.grounded) { P.el += .25; P.xw *= .5; }
    P.ik = 0;
  }
  if (d.lastState !== p.state || attack && d.lastAtk !== p.atkN) { if (d.cur) { d.from = { ...d.cur }; d.fromT = 0; } d.lastAtk = p.atkN; }
  d.lastState = p.state;
  if (d.from && d.fromT < 1) { d.fromT = Math.min(1, d.fromT + dt / (attack ? .07 : .22)); P = staffMix(d.from, P, staffEase(d.fromT)); }
  d.cur = { ...P };
  const spinY = attack && m.spin360 && p.view === 'third' ? rig.inner.rotation.y : 0;
  // ---- body / feet (shared with the staff) ----
  const anim = {};
  for (const side of ['Left', 'Right']) { const f = B[side + 'Foot']; if (f) { const wp = f.getWorldPosition(new THREE.Vector3()); anim[side] = { world: wp, local: rig.root.worldToLocal(wp.clone()), q: f.getWorldQuaternion(new THREE.Quaternion()) }; } }
  d.ikW = lerp(d.ikW, attack && p.grounded ? P.ik : 0, 1 - Math.exp(-dt * 14));
  const hitPush = Math.max(0, d.hitKick || 0); d.hitKick = Math.max(0, hitPush - dt * 6);
  const PB = { ...P, drop: P.drop + hitPush * .03, lean: P.lean + hitPush * .06 };
  staffBody(rig, PB, attack ? 1 : .45);
  if (B.LeftFoot && anim.Left) staffLegs(p, rig, PB, d, d.ikW, dt, anim);
  rig.root.updateMatrixWorld(true);
  // ---- sword arm: fist on the hilt, blade toward d, edge toward the cut ----
  const dirW = staffDir(P, spinY).applyQuaternion(rq), gripW = rig.root.localToWorld(staffBodyPoint(PB, P.r, P.u, P.f, spinY));
  const R = staffArmGrip(rig, 'Right', gripW, dirW, P.sp, P.sl, null);
  if (!R) return;
  const natural = bladeNaturalEdge(R.Hq, R.axisL, dirW);
  const tip = R.palm.clone().addScaledVector(dirW, (d.max - d.gz) * rig.root.scale.x);
  const vel = d.ready ? tip.clone().sub(d.prevT).divideScalar(Math.max(dt, 1e-4)).sub(new THREE.Vector3(p.vel.x, p.vy || 0, p.vel.z)) : new THREE.Vector3();
  d.prevT.copy(tip); d.ready = true;
  const across = vel.clone().addScaledVector(dirW, -vel.dot(dirW)), spd = across.length();
  let edge = d.edge ? d.edge.clone().addScaledVector(dirW, -d.edge.dot(dirW)) : natural.clone();
  if (edge.lengthSq() < 1e-6) edge.copy(natural); edge.normalize();
  if (spd > 2.5) { const want = across.divideScalar(spd); if (want.dot(edge) < 0) want.negate(); edge.lerp(want, (1 - Math.exp(-dt * 28)) * clamp(spd / 8, 0, 1)).normalize(); }
  else edge.lerp(natural.dot(edge) < 0 ? natural.clone().negate() : natural, 1 - Math.exp(-dt * 5)).normalize();
  // Keep the wrist honest: the fist may roll the hilt at most ±75° away from its natural set.
  let roll = Math.atan2(natural.clone().cross(edge).dot(dirW), natural.dot(edge));
  const lim = 75 * D2R; if (Math.abs(roll) > lim) { roll = Math.sign(roll) * lim; edge.copy(natural).applyAxisAngle(dirW, roll); }
  d.edge = edge;
  const Hq = new THREE.Quaternion().setFromAxisAngle(dirW, roll).multiply(R.Hq);
  const pole = new THREE.Vector3(-1, -.7, -.45).applyQuaternion(rq), rs = rig.root.scale.x;
  staffTwoBone(B.RightArm, B.RightForeArm, B.RightHand, gripW.clone().sub(STAFF_GRIP.Right.clone().applyQuaternion(Hq).multiplyScalar(rs)), pole);
  setBoneWorldQ(B.RightHand, Hq);
  const palm = B.RightHand.localToWorld(STAFF_GRIP.Right.clone().multiplyScalar(rs / B.RightHand.getWorldScale(new THREE.Vector3()).x));
  staffFistPose(fists.Right, R.axisL, true);
  mesh.position.copy(rig.root.worldToLocal(palm.clone().addScaledVector(dirW, -d.gz * rs)));
  mesh.quaternion.copy(rqi.clone().multiply(bladeQ(dirW, edge))); mesh.updateWorldMatrix(true, true);
  // ---- off hand: both hands on the hilt, or sword-fingers held out for balance ----
  d.lw = lerp(d.lw, attack ? P.lw : 0, 1 - Math.exp(-dt * 20)); d.xw = lerp(d.xw, P.xw * (1 - d.lw), 1 - Math.exp(-dt * 12));
  if (d.lw > .02 && B.LeftArm) {
    const target = staffLine(mesh, d.gz + d.two), neutral = B.LeftHand.getWorldQuaternion(new THREE.Quaternion());
    const sp = STAFF_AXIS.Left.clone().applyQuaternion(neutral).dot(dirW) >= 0 ? 0 : Math.PI;
    const L = staffArmGrip(rig, 'Left', target, dirW, sp, .7, null, d.lw);
    if (L) staffFistPose(fists.Left, L.axisL, d.lw > .45);
  } else if (d.xw > .02 && B.LeftArm && B.LeftForeArm && B.LeftHand) {
    const orig = [B.LeftArm.quaternion.clone(), B.LeftForeArm.quaternion.clone()];
    const target = rig.root.localToWorld(staffBodyPoint(PB, P.xr, P.xu, P.xf, spinY));
    staffTwoBone(B.LeftArm, B.LeftForeArm, B.LeftHand, target, new THREE.Vector3(1, -.6, -.5).applyQuaternion(rq));
    [B.LeftArm, B.LeftForeArm].forEach((b, i) => b.quaternion.slerpQuaternions(orig[i], b.quaternion.clone(), d.xw));
    B.LeftArm.updateWorldMatrix(false, true);
  }
  // ---- swish + trace for the ribbon trail ----
  d.tipSpeed = lerp(d.tipSpeed, attack ? vel.length() : 0, .5);
  d.swishT -= dt; if (attack && d.tipSpeed > 9 && d.swishT <= 0) { staffSwish(d.tipSpeed * 1.25, WEAPONS[w.type].kind, true); d.swishT = .18; }
  p.bladeTrace = { a: staffLine(mesh, d.gz + .1), b: staffLine(mesh, d.max), atk: p.atkN };
}
function bladeOnHit(p, m) { const d = p.weapon?.mesh.userData.blade; if (d) d.hitKick = m.heavy ? 1.3 : 1; }
