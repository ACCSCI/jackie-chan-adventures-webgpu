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
  if (st === 'loco' || !started) {
    if (!p.grounded) {
      const t = clamp(0.62 + (7.5 - p.vy) / 15 * 0.55, 0.5, 1.15);
      sk.set('air', { jump: 1 }, null, 0.1); sk.time('jump', t);
    } else {
      const v = Math.hypot(p.vel.x, p.vel.z), sy = Math.sin(p.yaw), cy = Math.cos(p.yaw);
      const fwd = (p.vel.x * sy + p.vel.z * cy) / Math.max(v, 1e-3), side = (p.vel.x * cy - p.vel.z * sy) / Math.max(v, 1e-3);
      let o;
      if (p.crouch) o = { v, idle: 'crouch_idle', walk: 'crouch_walk', walkV: 1.2 };
      else if (p.style === 2 && !p.weapon) o = { v, idle: 'drunk_idle', walk: 'drunk_walk', walkV: 1.4, run: 'run_drunk', runV: 5.4, walkMax: 3.5 };
      else o = { v, idle: p.style === 1 && !p.weapon ? 'capo_idle' : 'idle_box', walk: 'walk', walkV: 1.5, run: ['run_dragon', 'run_snake', 'run_drunk'][p.style], runV: p.style === 1 ? 6.6 : 6.0, walkMax: p.style === 1 ? 4.1 : 3.5 };
      if (Runes.has('rabbit')) o.walkMax *= 1.15;
      if (lockTarget && !p.crouch) Object.assign(o, { dir: 1, fwd, side, back: 'walk_back', strafe: ['strafe_l', 'strafe_r'] });
      if (!started) o.idle = 'idle_box';
      const W = skLoco(sk, o);
      if (p.guard) sk.set('guard', W, { block: 1 }, 0.12); else sk.set('loco', W, null, 0.18);
    }
  } else if (st === 'attack') {
    const m = p.move, map = SKM[m.skKey] || SKM.jab1, t = Math.min(1, p.mt);
    const ct = skMap(map, t, m.hits[0]), id2 = 'atk' + p.atkN;
    if (map[4]) sk.set(id2, { [map[4]]: 1 }, { [map[0]]: 1 }, 0.06); else sk.set(id2, { [map[0]]: 1 }, null, 0.06);
    sk.time(map[0], ct); if (map[4]) sk.speed(map[4], 1);
    // 程序化 360° 转体（Mixamo 片段为原地动作，转身被去掉了）
    const s3 = m.spin360;
    if (s3 && p.view === 'third') { const k = clamp((t - s3[0]) / (s3[1] - s3[0]), 0, 1); rig.inner.rotation.y = k * k * (3 - 2 * k) * TAU * (s3[2] || 1); }
    else rig.inner.rotation.y = 0;
  } else if (st === 'dodge') {
    const t = Math.min(1, p.stateT / p.clip.dur);
    if (p.clip === ROLL) { sk.set('roll', { roll: 1 }, null, 0.05); sk.time('roll', 0.3 + t * 1.65); }
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
  sk.update(dt); skSprings(rig, A);
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
