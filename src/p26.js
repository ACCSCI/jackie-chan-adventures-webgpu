// ================= Mixamo 动作驱动：根据游戏状态挑选/对齐动作片段 =================
// [片段, 起点秒, 命中帧秒(null=线性), 终点秒, 下半身(可选)]
const SKM = {
  jab1: ['jab', .12, .46, .9], jab2: ['cross', .75, 1.17, 1.65], hook: ['hook', .15, .57, 1.15],
  heavyF0: ['heavy_p', 0, .4, .9], heavyF1: ['quad', .1, null, 2.1], heavyF2: ['elbow', .1, .62, 1.35],
  kick1: ['kick_front', .4, 1.0, 1.5], kick2: ['kick_side', .2, .83, 1.4], kick3: ['kick_round', .1, .68, 1.45], heavyK: ['kick_spin', 1.0, 1.83, 2.6],
  cjab1: ['jab', .12, .46, .9, 'crouch_idle'], cjab2: ['cross', .75, 1.17, 1.65, 'crouch_idle'], cheavyF: ['upper', 0, .57, 1.25],
  sweep: ['sweep', .45, 1.0, 1.95], slide: ['kick_low', .25, .69, 1.25],
  counter: ['cross', .8, 1.17, 1.55], push: ['heavy_p', 0, .4, .9], airKick: ['kick_front', .6, 1.0, 1.4],
  w1: ['slash_down', .2, .8, 1.25], w2: ['slash_out', .3, 1.0, 1.8], w3: ['stab', .6, 1.13, 1.8], wHeavy: ['slash_in', 0, null, 2.2], wLow: ['slash_in', .5, 1.25, 1.9, 'crouch_idle'],
};
const SKE = {
  thug: { punch: ['cross', .45, 1.17, 1.9], kick: ['kick_front', .3, 1.0, 1.6] },
  khan: { slash: ['slash_out', .3, 1.0, 1.9], lunge: ['stab', .45, 1.13, 1.95] },
  boss: { punch: ['boss_swipe', .3, 1.23, 2.4], slam: ['boss_stomp', .1, 1.75, 3.0] },
};
// 给每个招式记下自己的键名
MOVES_STYLE.forEach((S, i) => { for (const k in S) S[k].skKey = k === 'heavyF' ? 'heavyF' + i : k; });
for (const k in MOVES) MOVES[k].skKey = k;
// 招式进度 t(0..1) → 片段时间：命中帧对齐
function skMap(m, t, hit) {
  const [c, a, p, b] = m;
  if (p == null) return a + (b - a) * t;
  return t < hit ? a + (p - a) * (t / hit) : p + (b - p) * ((t - hit) / Math.max(0.01, 1 - hit));
}
const _v3 = new THREE.Vector3();
// 移动混合：idle / walk / run（锁定时用后退、横移）
function skLoco(sk, o) {
  const v = o.v, idleW = clamp(1 - v / 0.9, 0, 1), mv = 1 - idleW;
  const runK = o.run ? clamp((v - o.walkMax) / Math.max(0.1, o.runV - o.walkMax), 0, 1) : 0;
  const W = {}; W[o.idle] = idleW + 1e-4;
  let walk = o.walk;
  if (o.dir) { // 局部速度方向
    const f = o.fwd, r = o.side, a = Math.abs(f), b = Math.abs(r);
    if (f < -0.3 && a >= b && o.back) walk = o.back; else if (b > a * 1.2 && o.strafe) walk = r > 0 ? o.strafe[1] : o.strafe[0];
  }
  if (mv > 0) { W[walk] = (W[walk] || 0) + mv * (1 - runK); if (runK > 0) W[o.run] = (W[o.run] || 0) + mv * runK; }
  sk.speed(o.idle, 1);
  sk.speed(walk, clamp(v / o.walkV, 0.55, 2.2));
  if (o.run) sk.speed(o.run, clamp(v / o.runV, 0.75, 1.6));
  return W;
}
function skSprings(rig, A) {
  const B = rig.bones; if (!B.Spine) return;
  const s = A.sp;
  B.Spine.rotation.x += s.sx * 0.45; B.Spine.rotation.z -= s.sz * 0.35;
  if (B.Neck) { B.Neck.rotation.x += s.nx * 0.4; B.Neck.rotation.y += s.ny * 0.4; }
  B.Hips.rotation.z += s.hrz * 0.3;
}
function skHitClip(side, n) { return side === 2 ? 'hit_left' : side === 3 ? 'hit_right' : side === 1 ? 'hit_big' : (n % 2 ? 'hit_stomach' : 'hit_light'); }
// 倒地：摔倒 → 躺地 → 起身
function skDown(sk, front, tt, dur, dead) {
  const kd = front ? 'kd_front' : 'kd_back', gu = front ? 'getup_front' : 'getup_back';
  const k = dur / 2.1, f1 = 0.4 * k, f2 = 1.15 * k;
  if (tt < f2 || dead) { sk.set('down' + kd, { [kd]: 1 }, null, 0.08); sk.time(kd, tt < f1 ? tt / f1 * 1.45 : 1.45 + Math.min(1, (tt - f1) / (f2 - f1)) * 0.6); }
  else { const g0 = front ? 2.2 : 3.0; sk.set('up' + gu, { [gu]: 1 }, null, 0.22); sk.time(gu, g0 + (tt - f2) / (dur - f2) * (6.2 - g0)); }
}
function driveSkinPlayer(p, dt) {
  const rig = p.rig, sk = rig.sk; if (!sk || !sk.mixer) return;
  const st = p.state, A = p.anim;
  if (cutscene) {
    rig.inner.rotation.y = 0;
    const speaking = Story.lines && Story.lines[Story.i]?.who === 'jackie';
    sk.set('cinematic', { idle_rel: 1 }, speaking ? { npc_talk: 1 } : null, 0.18);
    sk.speed('idle_rel', 0.65); sk.speed('npc_talk', 0.65);
    sk.update(dt); driveStaff(p, dt);
    return;
  }
  if (st === 'loco' || !started) {
    if (!p.grounded && p.flipT != null) { sk.set('roll', { roll: 1 }, null, 0.06); sk.time('roll', 0.3 + Math.min(1, p.flipT / .52) * 1.65); }
    else if (!p.grounded) {
      const t = clamp(0.62 + (7.5 - p.vy) / 15 * 0.55, 0.5, 1.15);
      sk.set('air', { jump: 1 }, null, 0.1); sk.time('jump', t);
    } else {
      const v = Math.hypot(p.vel.x, p.vel.z), sy = Math.sin(p.yaw), cy = Math.cos(p.yaw);
      const fwd = (p.vel.x * sy + p.vel.z * cy) / Math.max(v, 1e-3), side = (p.vel.x * cy - p.vel.z * sy) / Math.max(v, 1e-3);
      let o;
      if (p.crouch) o = { v, idle: 'crouch_idle', walk: 'crouch_walk', walkV: 1.2 };
      else if (p.style === 2 && !p.weapon) o = { v, idle: 'drunk_idle', walk: 'drunk_walk', walkV: 1.4, run: 'run_drunk', runV: 5.4, walkMax: 3.5 };
      else o = { v, idle: p.style === 1 && !p.weapon ? 'capo_idle' : 'idle_box', walk: 'walk', walkV: 1.5, run: ['run_dragon', 'run_snake', 'run_drunk'][p.style], runV: p.style === 1 ? 6.6 : 6.0, walkMax: p.style === 1 ? 4.1 : 3.5 };
      if (p.weapon && wcls() === 'staff' && !p.crouch) o.idle = 'idle_rel';
      if (Runes.has('rabbit')) o.walkMax *= 1.15;
      if (lockTarget && !p.crouch) Object.assign(o, { dir: 1, fwd, side, back: 'walk_back', strafe: ['strafe_l', 'strafe_r'] });
      if (!started) o.idle = 'idle_box';
      const W = skLoco(sk, o);
      if (p.guard) sk.set('guard', W, { block: 1 }, 0.12); else sk.set('loco', W, null, 0.18);
    }
  } else if (st === 'staffCharge' && Math.hypot(p.vel.x, p.vel.z) > .25) {
    const v = Math.hypot(p.vel.x, p.vel.z), sy = Math.sin(p.yaw), cy = Math.cos(p.yaw);
    const fwd = (p.vel.x * sy + p.vel.z * cy) / v, side = (p.vel.x * cy - p.vel.z * sy) / v;
    const W = skLoco(sk, { v, idle: 'idle_box', walk: 'walk', walkV: 1.5, walkMax: 3.5, dir: 1, fwd, side, back: 'walk_back', strafe: ['strafe_l', 'strafe_r'] });
    sk.set('chargeWalk', W, null, .15);
  } else if (st === 'staffCharge' || st === 'staffSpin') {
    sk.set(st, { idle_box: 1 }, null, .12); sk.speed('idle_box', .6);
  } else if (st === 'attack') {
    const m = p.move, map = m === MOVES.sweep ? ['crouch_idle', 0, null, 0.1] : SKM[m.skKey] || SKM.jab1, t = Math.min(1, p.mt);
    const ct = skMap(map, t, m.hits[0]), id2 = 'atk' + p.atkN;
    if (m.staff || m.blade && !m.bladeClip) {
      // 下半身用格斗站姿，重心/踏步/转腰由 driveStaff 程序化叠加；立棍与跳劈换全身片段
      const ph = m.pole ? (t < .42 ? null : t < .58 ? ['crouch_idle', 0] : t < .88 ? ['kick_hurricane', .25 + (t - .58) / .3 * 1.1] : null) : (m.jump || m.air) && !p.grounded ? ['jump', .55 + t * .6] : null;
      if (ph && SKIN.clips[ph[0]]) { sk.set(id2 + ph[0], { [ph[0]]: 1 }, null, .08); if (ph[1]) sk.time(ph[0], ph[1]); }
      else { const lower = m.low ? 'crouch_idle' : 'idle_box'; sk.set(id2, { [lower]: 1 }, { idle_box: 1 }, .065); sk.speed(lower, 1); }
    } else if (map[4]) sk.set(id2, { [map[4]]: 1 }, { [map[0]]: 1 }, 0.06); else sk.set(id2, { [map[0]]: 1 }, null, 0.06);
    sk.time(map[0], ct); if (map[4]) sk.speed(map[4], 1);
    // 程序化 360° 转体（Mixamo 片段为原地动作，转身被去掉了）
    const s3 = m.spin360;
    if (s3 && p.view === 'third') { const k = clamp((t - s3[0]) / (s3[1] - s3[0]), 0, 1); rig.inner.rotation.y = k * k * (3 - 2 * k) * TAU * (s3[2] || 1); }
    else rig.inner.rotation.y = 0;
  } else if (st === 'dodge') {
    const t = Math.min(1, p.stateT / p.clip.dur);
    if (p.clip === ROLL || p.clip === AIRFLIP) { sk.set('roll', { roll: 1 }, null, 0.05); sk.time('roll', 0.3 + t * 1.65); }
    else {
      const sy = Math.sin(p.yaw), cy = Math.cos(p.yaw), f = p.dodgeDir.x * sy + p.dodgeDir.y * cy;
      if (f < -0.4) { sk.set('dback', { dodge_back: 1 }, null, 0.05); sk.time('dodge_back', 0.25 + t * 1.5); }
      else if (f > 0.4) { sk.set('roll', { roll: 1 }, null, 0.05); sk.time('roll', 0.3 + t * 1.65); }
      else { sk.set('dside', { dodge_side: 1 }, null, 0.05); sk.time('dodge_side', 0.1 + t * 1.4); }
    }
  } else if (st === 'hit') {
    const c = skHitClip(p.hitSide || 0, p.hitN || 0), t = Math.min(1, p.stateT / p.clip.dur);
    sk.set('hit' + c + (p.hitN || 0), { [c]: 1 }, null, 0.05); sk.time(c, t * 0.85);
  } else if (st === 'block' || st === 'parryHit') {
    const t = Math.min(1, p.stateT / p.clip.dur), W = { idle_box: 1 };
    sk.set(st, W, { block_hit: 1 }, 0.05); sk.time('block_hit', t * (st === 'block' ? 0.6 : 0.75));
  } else if (st === 'stagger') {
    const t = Math.min(1, p.stateT / p.clip.dur);
    sk.set('stagger', { hit_big: 1 }, null, 0.06); sk.time('hit_big', t * 1.4);
  } else if (st === 'kipup') {
    const t = Math.min(1, p.stateT / p.clip.dur);
    sk.set('kipup', { kipup: 1 }, null, 0.06); sk.time('kipup', 0.3 + t * 1.3);
  } else if (st === 'down' || st === 'dead') {
    let tt = p.stateT; if (st === 'dead') tt = Math.min(tt, 1.0);
    skDown(sk, p.downClip === DOWN.front, tt, p.downClip.dur, st === 'dead');
  }
  if (st !== 'attack') rig.inner.rotation.y = 0;
  // 空翻（二段跳/空中闪避）借用翻滚片段：片段里胯部会贴地，空中时把整体抬回去
  if (rig._iy == null) rig._iy = rig.inner.position.y;
  const airK = !p.grounded && p.flipT != null ? Math.min(1, p.flipT / .52) : st === 'dodge' && p.clip === AIRFLIP ? Math.min(1, p.stateT / p.clip.dur) : -1;
  rig.inner.position.y = rig._iy + (airK >= 0 ? .42 * Math.sin(Math.PI * Math.min(1, airK * 1.15)) : 0);
  const sweep = st === 'attack' && p.move === MOVES.sweep;
  sk.update(dt); if (!sweep) skSprings(rig, A); // 扫腿姿势完全程序化，弹簧会把旧招式关键帧的冲量带进来
  if (sweep) skLowSweep(rig, p.mt);
  driveStaff(p, dt); driveBlade(p, dt);
}
// 扫堂腿：单腿全蹲（支撑腿膝盖朝前外）、扫腿贴地伸直勾脚、上身前俯双手探地、绕支撑脚整圈旋转。
// 整套姿势用 IK 程序化求解后再按权重与蹲姿片段混合，起落各有过渡。
function skLowSweep(rig, t) {
  const B = rig.bones, need = ['Hips', 'Spine', 'LeftUpLeg', 'LeftLeg', 'LeftFoot', 'RightUpLeg', 'RightLeg', 'RightFoot'];
  if (need.some(n => !B[n])) return;
  const w = staffEase(t / .13) * staffEase((1 - t) / .22);
  if (w <= .001) return;
  const names = ['Hips', 'Spine', 'Spine1', 'Spine2', 'Neck', 'Head', 'LeftUpLeg', 'LeftLeg', 'LeftFoot', 'RightUpLeg', 'RightLeg', 'RightFoot', 'LeftArm', 'LeftForeArm', 'LeftHand', 'RightArm', 'RightForeArm', 'RightHand'].filter(n => B[n]);
  const orig = names.map(n => B[n].quaternion.clone()), hip0 = B.Hips.position.clone();
  rig.root.updateMatrixWorld(true);
  const fq = rig.inner.getWorldQuaternion(new THREE.Quaternion()), base = rig.root.getWorldPosition(new THREE.Vector3()), S = rig.root.scale.x;
  const P = (x, y, z) => new THREE.Vector3(x, y, z).applyQuaternion(fq).multiplyScalar(S).add(base);
  const D = (x, y, z) => new THREE.Vector3(x, y, z).normalize().applyQuaternion(fq);
  const X = D(1, 0, 0), Y = new THREE.Vector3(0, 1, 0);
  // 扫腿过程中重心随旋转再压低一点，出腿瞬间身体前俯最深
  const k = staffEase((t - .1) / .25), dip = Math.sin(Math.PI * clamp((t - .1) / .7, 0, 1));
  B.Hips.position.copy(B.Hips.parent.worldToLocal(P(-.02, .43 - .03 * dip, -.05))); B.Hips.updateWorldMatrix(false, true);
  // 躯干逐节对准绝对方向（不叠加片段自身的弯腰）：前俯、略向扫腿一侧拧
  boneRotWorld(B.Hips, Y, -.25);
  const chain = [['Hips', 'Spine', .55], ['Spine', 'Spine1', .75], ['Spine1', 'Spine2', .85], ['Spine2', 'Neck', .8], ['Neck', 'Head', .45]];
  for (const [a, c, th] of chain) if (B[a] && B[c]) { const t2 = th + (a === 'Neck' ? 0 : .08 * dip); staffAimBone(B[a], B[c], D(-.06, Math.cos(t2), Math.sin(t2))); }
  rig.root.updateMatrixWorld(true);
  // 支撑腿：全蹲，脚掌贴地，膝盖朝前外侧
  staffTwoBone(B.LeftUpLeg, B.LeftLeg, B.LeftFoot, P(.17, .085, .12), D(.55, .15, 1));
  if (B.LeftToeBase) staffAimBone(B.LeftFoot, B.LeftToeBase, D(.35, -.08, 1));
  // 扫腿：贴地伸直，膝盖朝上，勾脚以脚掌内侧领扫
  const reachZ = lerp(.05, .3, k);
  staffTwoBone(B.RightUpLeg, B.RightLeg, B.RightFoot, P(-.9, .1, reachZ), D(0, 1, .25));
  if (B.RightToeBase) staffAimBone(B.RightFoot, B.RightToeBase, D(-.25, .75, .6));
  // 双手向前下方探地保持平衡
  if (B.LeftArm && B.LeftForeArm && B.LeftHand) staffTwoBone(B.LeftArm, B.LeftForeArm, B.LeftHand, P(.28, .16, .5), D(1, .2, -.4));
  if (B.RightArm && B.RightForeArm && B.RightHand) staffTwoBone(B.RightArm, B.RightForeArm, B.RightHand, P(-.14, .2, .56), D(-1, .2, -.4));
  for (const [side, x] of [['Left', .1], ['Right', -.1]]) { const h = B[side + 'Hand'], c = h && h.children.find(o => o.isBone); if (c) staffAimBone(h, c, D(x, -.9, .4)); }
  // 抬头盯住前方
  if (B.Head && B.HeadTop_End) staffAimBone(B.Head, B.HeadTop_End, D(.02, .9, .42));
  // 与片段姿势按权重混合
  names.forEach((n, i) => { const q = B[n].quaternion.clone(); B[n].quaternion.copy(orig[i]).slerp(q, w); });
  B.Hips.position.lerpVectors(hip0, B.Hips.position.clone(), w);
  rig.root.updateMatrixWorld(true);
}
function driveSkinEnemy(e, dt, cut) {
  const rig = e.rig, sk = rig.sk; if (!sk || !sk.mixer) return;
  const st = e.state, boss = e.k === 'boss';
  if (cut || st === 'loco') {
    const v = cut ? 0 : Math.hypot(e.vel.x, e.vel.z), sy = Math.sin(e.yaw), cy = Math.cos(e.yaw);
    const fwd = (e.vel.x * sy + e.vel.z * cy) / Math.max(v, 1e-3), side = (e.vel.x * cy - e.vel.z * sy) / Math.max(v, 1e-3);
    let o = boss ? { v, idle: cut ? 'boss_roar' : 'boss_idle', walk: 'boss_walk', walkV: 1.2 }
      : { v, idle: 'idle_box', walk: 'walk', walkV: 1.5, run: 'run', runV: 5.0, walkMax: 3.0, dir: 1, fwd, side, back: 'walk_back', strafe: ['strafe_l', 'strafe_r'] };
    sk.set(cut ? 'cut' : 'loco', skLoco(sk, o), null, 0.2);
  } else if (st === 'attack') {
    const a = e.atk, map = (SKE[e.k] || {})[a.name] || SKE.thug.punch;
    sk.set('atk' + a.name + e.atkN, { [map[0]]: 1 }, null, 0.12);
    sk.time(map[0], skMap(map, Math.min(1, e.t / a.dur), a.hit / a.dur));
  } else if (st === 'hit') {
    const c = skHitClip(e.hitSide || 0, e.hitN), t = Math.min(1, e.t / e.clip.dur);
    sk.set('hit' + c + e.hitN, { [c]: 1 }, null, 0.05); sk.time(c, t * 0.85);
  } else if (st === 'stagger') {
    const t = Math.min(1, e.t / e.clip.dur), long = e.clip.dur > 1;
    const c = long ? 'drunk_stumble' : 'hit_big';
    sk.set('stg' + c, { [c]: 1 }, null, 0.06); sk.time(c, long ? 0.4 + t * 2.0 : t * 1.4);
  } else if (st === 'down' || st === 'dead') {
    let tt = e.t; if (st === 'dead') tt = Math.min(tt, 1.0);
    skDown(sk, e.downClip === EDOWN[e.k].front, tt, e.downClip.dur, st === 'dead');
  }
  sk.update(dt); skSprings(rig, e.anim);
}
function driveSkinNPC(n, dt) {
  const sk = n.rig.sk; if (!sk || !sk.mixer) return;
  const v = n.spd;
  const W = skLoco(sk, { v, idle: 'idle_rel', walk: 'walk', walkV: 1.5, run: 'run', runV: 4.5, walkMax: 2.4 });
  if (n.mood === 'cheer') { sk.set('cheer', { npc_cheer: 1 }, null, 0.25); sk.speed('npc_cheer', 1); }
  else if (n.mood === 'scared') { sk.set('scared', { npc_scared: 1 }, null, 0.3); sk.speed('npc_scared', 1); }
  else if (n.mood === 'scold') { sk.set('scold', W, { npc_argue: 1 }, 0.25); sk.speed('npc_argue', 1.2); }
  else if (n.talk > 0 && v < 0.5) { sk.set('talk', W, { npc_talk: 1 }, 0.25); sk.speed('npc_talk', 1); }
  else sk.set('loco', W, null, 0.25);
  sk.update(dt);
}
// 影武者的武士刀挂在右手
function skKatana(rig) {
  const kg = new THREE.Group(); rig.grip.add(kg); rig.katana = kg;
  mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.22, 8), M(0x2a1030), 0, 0, 0, kg).rotation.x = Math.PI / 2;
  const gd = mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.015, 12), M(0xb08a3a), 0, 0, 0.11, kg); gd.rotation.x = Math.PI / 2;
  box(0.012, 0.035, 0.75, M(0xc8cfe0, { emissive: 0x302050 }), 0, 0, 0.5, kg);
}
