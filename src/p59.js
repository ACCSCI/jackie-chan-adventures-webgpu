// ================= 第五集 Boss 强化：刀鲁的镇寺铁杵 / 黑成龙的影剑 =================
function bossClub() { // 镇寺铁杵：铁箍木柄 + 八棱铁头 + 铜钉
  const g = new THREE.Group(), iron = M(0x3a3a40), gold = M(0xb8862e, { emissive: 0x2a1a04 }), wood = M(0x4a2c18);
  mesh(new THREE.CylinderGeometry(.035, .04, .75, 10), wood, 0, 0, .2, g).rotation.x = Math.PI / 2;
  [-.08, .42].forEach(z => mesh(new THREE.CylinderGeometry(.05, .05, .05, 12), gold, 0, 0, z, g).rotation.x = Math.PI / 2);
  const head = mesh(new THREE.CylinderGeometry(.11, .085, .48, 8), iron, 0, 0, .82, g); head.rotation.x = Math.PI / 2;
  [.62, 1.04].forEach(z => mesh(new THREE.CylinderGeometry(.122, .122, .04, 8), gold, 0, 0, z, g).rotation.x = Math.PI / 2);
  for (let i = 0; i < 8; i++) for (const z of [.74, .9]) { const a = i / 8 * Math.PI * 2 + (z > .8 ? .4 : 0), sp = mesh(new THREE.ConeGeometry(.025, .07, 6), gold, Math.cos(a) * .115, Math.sin(a) * .115, z, g); sp.lookAt(Math.cos(a) * 9, Math.sin(a) * 9, z); sp.rotateX(Math.PI / 2); }
  return g;
}
function bossShadowSword() { // 影剑：黑刃紫芒
  const g = new THREE.Group();
  mesh(new THREE.CylinderGeometry(.018, .018, .22, 8), M(0x1a0c22), 0, 0, 0, g).rotation.x = Math.PI / 2;
  const gd = box(.16, .03, .03, M(0x6a4aa8, { emissive: 0x2a1050 }), 0, 0, .11, g);
  const bl = box(.014, .05, .9, M(0x0c0814, { emissive: 0x5a2aa0, emissiveIntensity: 1.6 }), 0, 0, .58, g);
  box(.004, .056, .9, M(0xb48aff, { emissive: 0xb48aff, emissiveIntensity: 2 }), 0, 0, .58, g);
  g.userData.blade = bl; return g;
}
const lerpA = (a, b, k) => a + angDiff(a, b) * k;
// ---------- 刀鲁 ----------
{
  const P = Tohru5.prototype, _up = P.update, _think = P.think, _pose = P.pose;
  P.update = function (dt) {
    if (!this.club && this.rig.loaded && this.rig.grip) { this.club = bossClub(); this.club.scale.setScalar(1.25); this.rig.grip.add(this.club); }
    if (this.club) this.club.visible = this.rig.root.visible;
    return _up.call(this, dt);
  };
  P.think = function (dt) {
    const p = player, dx = p.pos.x - this.pos.x, dz = p.pos.z - this.pos.z, d = Math.hypot(dx, dz) || 1, S = this.state;
    if (this.raged) this.cd -= dt * (this.fury ? 0.9 : 0.45); // 发怒后出手更密
    if (!this.fury && this.raged && this.hp < this.maxHp * 0.25 && S === 'loco') { this.fury = true; this.furyIn(); return; }
    if (S === 'club') return this.runClub(dt);
    if (S === 'spin') return this.runSpin(dt);
    if (S === 'loco' && this.cd <= 0 && p.state !== 'dead' && d < 3.9) {
      const r = Math.random();
      if (r < 0.4) return this.startClub();
      if (r < (this.raged ? 0.62 : 0.52)) return this.startSpin();
    }
    return _think.call(this, dt);
  };
  P.furyIn = function () {
    this.startRoar(); banner('刀鲁 · 金刚怒！<small>铁杵三连更快、旋风扫更大——引他撞柱、拉钟绳！</small>', 2.6);
    for (const m of this.rig.mats) if (m.emissive) m.emissive.setRGB(0.22, 0.04, 0.02);
  };
  // 铁杵三连：横扫（琥珀）→ 回扫（琥珀）→ 举杵砸地裂（红色直线）
  P.startClub = function () { this.setState('club'); this.ci = -1; this.nextClub(); };
  P.nextClub = function () {
    this.ci++; const k = this.fury ? 0.78 : this.raged ? 0.88 : 1;
    if (this.ci >= 3) { this.setState('loco'); this.cd = rand(0.9, 1.4) * k; return; }
    this.t = 0; this.D = (this.ci < 2 ? 0.95 : 1.35) * k; this.hitAt = (this.ci < 2 ? 0.55 : 0.85) * k;
    const f = (T) => { T.x = this.pos.x; T.z = this.pos.z; T.yaw = this.yaw; };
    Foley.at('swH', this.pos, { vol: 0.8, rate: 0.7, delay: Math.max(0, this.hitAt - 0.12) });
    if (this.ci < 2) this.tele = Tele.add({ shape: 'sector', x: this.pos.x, z: this.pos.z, yaw: this.yaw, r: 4.1, arc: 1.15, wind: this.hitAt, lock: 0.65, col: 'amber', src: this, follow: f,
      onFire: (T) => { this.tele = null; Foley.at('hqStaff', this.pos, { vol: 0.8, rate: 0.7 }); if (Tele.inside(T, player.pos) && player.pos.y < 1.4) playerTakeHit(this, 20, {}); } });
    else this.tele = Tele.add({ shape: 'lane', x: this.pos.x, z: this.pos.z, yaw: this.yaw, w: 1.9, len: 7.5, wind: this.hitAt, lock: 0.6, col: 'red', src: this, follow: f,
      onFire: (T) => { this.tele = null; shake = 0.55; impact('fall', { pos: this.pos, big: true }); Foley.at('rock', this.pos, { vol: 0.8 });
        const fx = Math.sin(this.yaw), fz = Math.cos(this.yaw);
        for (let i = 1; i <= 7; i++) burst(new THREE.Vector3(this.pos.x + fx * i, 0.15, this.pos.z + fz * i), 0xd8d0c0, 8, 4);
        shock(new THREE.Vector3(this.pos.x + fx * 1.6, 0.06, this.pos.z + fz * 1.6), 0xffb070, 2.2);
        if (Tele.inside(T, player.pos) && player.pos.y < 1.2) playerTakeHit(this, 30, { kd: 1, unblockable: 1 }); } });
  };
  P.runClub = function (dt) {
    this.steer(dt, 0, 0, 0, 8); if (this.t < this.hitAt * 0.6) this.face(dt, 7);
    if (this.t > this.hitAt - 0.12 && this.t < this.hitAt + 0.05) this.vel.set(Math.sin(this.yaw) * 4, 0, Math.cos(this.yaw) * 4);
    this.threat = this.ci < 2 ? 'amber' : 'red';
    if (this.t >= this.D) this.nextClub();
  };
  // 铁杵旋风：原地抡圆（红圈，只能躲出去）；金刚怒时半径更大并震出冲击环
  P.startSpin = function () {
    this.setState('spin'); this.D = 1.9; this.hitAt = 0.95; this.spun = 0; const R = this.fury ? 5.2 : 4.4;
    Foley.at('kB', this.pos, { vol: 0.7, rate: 0.9 });
    this.tele = Tele.add({ shape: 'circle', x: this.pos.x, z: this.pos.z, r: R, wind: this.hitAt, col: 'red', src: this, follow: (T) => { T.x = this.pos.x; T.z = this.pos.z; },
      onFire: (T) => { this.tele = null; shake = 0.4; Foley.at('swH', this.pos, { vol: 1, rate: 0.6 }); Foley.at('wind', this.pos, { vol: 0.6, rate: 1.3 });
        shock(this.pos.clone().setY(0.1), 0xfff0d0, R); burst(this.pos.clone().setY(0.6), 0xf4f8ff, 40, 7);
        if (Tele.inside(T, player.pos) && player.pos.y < 1.5) playerTakeHit(this, 24, { kd: 1, unblockable: 1 });
        if (this.fury) Tele.add({ shape: 'ring', x: this.pos.x, z: this.pos.z, r: 12, wind: 0.01, speed: 10, col: 'red', src: this, dmg: 14, opts: { kd: 1, unblockable: 1 } }); } });
    if (!this.toldSpin) { this.toldSpin = 1; tip('红圈是铁杵旋风：格挡没用，闪出圈外！', 2.2); }
  };
  P.runSpin = function (dt) {
    this.steer(dt, 0, 0, 0, 8); this.threat = 'red';
    const k = this.t < this.hitAt - 0.35 ? 0 : this.t < this.hitAt + 0.25 ? 1 : 0; this.yaw += dt * 17 * k;
    if (this.t >= this.D) { this.setState('loco'); this.cd = rand(1.0, 1.5) * (this.fury ? 0.7 : 1); }
  };
  P.pose = function (dt, v) {
    const sk = this.rig.sk, S = this.state;
    if (sk && sk.mixer && (S === 'club' || S === 'spin')) {
      if (S === 'spin') { sk.set('spin', { boss_swipe: 1 }, null, 0.1); sk.time('boss_swipe', skMap(['boss_swipe', .3, 1.23, 2.4], Math.min(1, this.t / this.D), this.hitAt / this.D)); }
      else if (this.ci < 2) { const key = 'club' + this.ci; sk.set(key, { boss_swipe: 1 }, null, 0.08); sk.time('boss_swipe', skMap(['boss_swipe', .3, 1.23, 2.4], Math.min(1, this.t / this.D), this.hitAt / this.D)); }
      else { sk.set('club2', { boss_stomp: 1 }, null, 0.1); sk.time('boss_stomp', skMap(['boss_stomp', .1, 1.75, 3.0], Math.min(1, this.t / this.D), this.hitAt / this.D)); }
      sk.update(dt); return;
    }
    return _pose.call(this, dt, v);
  };
  const _st = P.stun; P.stun = function (t, txt, col) { this.ci = 3; return _st.call(this, t * (this.fury ? 0.8 : 1), txt, col); };
}
// ---------- 黑成龙 ----------
{
  const P = ShadowJ.prototype, _up = P.update, _think = P.think, _pose = P.pose, _sum = P.summon;
  P.update = function (dt) {
    if (!this.sword && this.rig.loaded && this.rig.grip) { this.sword = bossShadowSword(); this.rig.grip.add(this.sword); }
    if (this.sword) { this.sword.visible = this.rig.root.visible; if (this.rig.root.visible && Math.random() < dt * 20) burst(this.sword.localToWorld(new THREE.Vector3(0, 0, rand(.3, 1))), 0x9a6aff, 1, 0.6); }
    return _up.call(this, dt);
  };
  P.summon = function () { _sum.call(this); this.phase2 = true; banner('黑成龙拔出影剑 · 影分身斩！<small>连续三道红线突进——每道都要横向闪开</small>', 2.6); };
  P.think = function (dt) {
    const p = player, dx = p.pos.x - this.pos.x, dz = p.pos.z - this.pos.z, d = Math.hypot(dx, dz) || 1, S = this.state;
    if (S === 'wave') return this.runWave(dt);
    if (S === 'dash') return this.runDash(dt);
    if (S === 'loco' && this.cd <= 0 && p.state !== 'dead') {
      if (d > 4.8 && d < 15 && Math.random() < 0.5) return this.startWave();
      if (this.phase2 && d > 3.5 && Math.random() < 0.35) return this.startDash();
    }
    return _think.call(this, dt);
  };
  // 影剑·月牙：远距离剑气（琥珀直线，可格挡；完美格挡把剑气弹回去）
  P.startWave = function () {
    this.setState('wave'); this.D = 0.95; this.hitAt = 0.55; this.cancelTele(); const p = player;
    this.yaw = Math.atan2(p.pos.x - this.pos.x, p.pos.z - this.pos.z);
    Foley.at('swL', this.pos, { vol: 0.7, rate: 0.8, delay: 0.42 });
    this.tele = Tele.add({ shape: 'lane', x: this.pos.x, z: this.pos.z, yaw: this.yaw, w: 1.5, len: 15, wind: this.hitAt, lock: 0.5, col: 'amber', src: this,
      follow: (T) => { T.x = this.pos.x; T.z = this.pos.z; T.yaw = this.yaw; },
      onFire: (T) => { this.tele = null; Foley.at('swH', this.pos, { vol: 0.9, rate: 1.2 }); const fx = Math.sin(T.yaw), fz = Math.cos(T.yaw);
        for (let i = 1; i < 15; i += 1.2) burst(new THREE.Vector3(T.x + fx * i, 1, T.z + fz * i), 0xa07aff, 4, 2);
        if (Tele.inside(T, player.pos) && player.pos.y < 1.6) { playerTakeHit(this, 18, {}); if (this.state === 'stun' && !this.dead) { this.hp = Math.max(1, this.hp - 60); floatText(this.pos.clone().setY(2.2), '剑气弹回！ -60', '#ffd84a', 24); burst(this.pos.clone().setY(1.2), 0xffd84a, 30, 5); } } } });
    if (!this.toldWave) { this.toldWave = 1; tip('琥珀直线是月牙剑气：可以格挡，完美格挡能弹回去！', 2.4); }
  };
  P.runWave = function (dt) { this.steer(dt, 0, 0, 0, 10); if (this.t < this.hitAt * 0.5) this.face(dt, 8); this.threat = 'amber'; if (this.t >= this.D) { this.setState('loco'); this.cd = rand(0.5, 1.0); } };
  // 影分身斩：三道连续红线突进，每道结束时他出现在线的尽头
  P.startDash = function () { this.setState('dash'); this.dn = 0; this.cancelTele(); this.nextDash(); };
  P.nextDash = function () {
    if (this.dn >= 3) { this.setState('loco'); this.cd = rand(0.9, 1.4); return; }
    this.dn++; this.t = 0; this.D = 0.62; const p = player;
    this.yaw = Math.atan2(p.pos.x - this.pos.x, p.pos.z - this.pos.z); const len = clamp(Math.hypot(p.pos.x - this.pos.x, p.pos.z - this.pos.z) + 3, 5, 11);
    this.tele = Tele.add({ shape: 'lane', x: this.pos.x, z: this.pos.z, yaw: this.yaw, w: 1.5, len, wind: 0.48, lock: 0.45, col: 'red', src: this,
      follow: (T) => { T.x = this.pos.x; T.z = this.pos.z; T.yaw = this.yaw; },
      onFire: (T) => { this.tele = null; const fx = Math.sin(T.yaw), fz = Math.cos(T.yaw);
        for (let i = 0; i < T.len; i += 0.8) burst(new THREE.Vector3(T.x + fx * i, 1, T.z + fz * i), 0x6a3aaa, 3, 2);
        Foley.at('swH', this.pos, { vol: 0.9, rate: 1.1 }); Foley.at('slashL', this.pos, { vol: 0.4 });
        if (Tele.inside(T, player.pos) && player.pos.y < 1.5) playerTakeHit(this, 20, { kd: this.dn === 3 ? 1 : 0, unblockable: 1 });
        this.pos.set(T.x + fx * (T.len - 0.5), 0, T.z + fz * (T.len - 0.5));
        const dx = this.pos.x - YY.x, dz = this.pos.z - YY.z, r = Math.hypot(dx, dz); if (r > YY.r - 1) { this.pos.x = YY.x + dx / r * (YY.r - 1); this.pos.z = YY.z + dz / r * (YY.r - 1); }
        collideCircle(this.pos, this.radius); burst(this.pos.clone().setY(1), 0x6a3aaa, 20, 4); } });
  };
  P.runDash = function (dt) { this.steer(dt, 0, 0, 0, 12); this.threat = 'red'; if (this.t < 0.25) this.face(dt, 10); if (this.t >= this.D) this.nextDash(); };
  P.pose = function (dt, v) {
    const sk = this.rig.sk, S = this.state;
    if (sk && sk.mixer && (S === 'wave' || S === 'dash')) {
      const c = S === 'wave' ? 'heavy_p' : 'dodge_fwd', clip = SKIN.clips[c] ? c : 'jab1';
      sk.set(S + (this.dn || 0), { [clip]: 1 }, null, 0.06); sk.time(clip, Math.min(sk.dur(clip) - 0.01, this.t / this.D * sk.dur(clip)));
      sk.update(dt); return;
    }
    return _pose.call(this, dt, v);
  };
}
window.__ep5b = { bossClub, bossShadowSword };
