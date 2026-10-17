// ================= 大地图交通工具：滑板（湾区 / 沙漠）、雪板（喜马拉雅）、筋斗云（天界） =================
// B 召唤并站上去 / 再按收起；方向键转向，Shift 加速，滚轮调速度上限（跑步的 1~5 倍），Space 腾空、空中再按踢板转圈；左键“滑板冲撞”；被打中会摔下来
document.head.insertAdjacentHTML('beforeend', `<style>#bspd{position:absolute;left:50%;top:54px;transform:translateX(-50%);padding:4px 14px;border-radius:14px;background:rgba(0,0,0,.5);border:1px solid rgba(255,184,74,.6);color:#ffd9a0;font-size:13px;display:none;white-space:nowrap}#bspd b{color:#ffb84a;font-size:16px}#bspd i{display:inline-block;height:6px;width:90px;margin:0 6px 1px;background:rgba(255,255,255,.15);border-radius:3px;vertical-align:middle;position:relative;overflow:hidden}#bspd i u{position:absolute;left:0;top:0;bottom:0;background:linear-gradient(90deg,#ffd04a,#ff6a2a)}#bspd i s{position:absolute;top:-2px;bottom:-2px;width:2px;background:#fff}body.cine #bspd{display:none!important}</style>`);
$('hud').insertAdjacentHTML('beforeend', '<div id="bspd"></div>');
const BOARD_KIND = { bay: 'skate', nev: 'skate', him: 'snow', sky: 'cloud' };
const BOARD_NAME = { skate: '滑板', snow: '雪板', cloud: '筋斗云' };
const Board = {
  on: false, kind: 'skate', heading: 0, sp: 0, lvl: 5, ramT: 0, ramCD: 0, flipT: -1, hit: null, meshes: {}, fx: 0, borrowed: {}, bumpT: 0,
  RUN: 6.3, DECK: { skate: 0.13, snow: 0.07, cloud: 0.32 },
  mesh(kind) {
    if (this.meshes[kind]) return this.meshes[kind];
    const g = new THREE.Group(), K = new THREE.Group(); g.add(K); g.userData.K = K;
    if (kind === 'skate') {
      box(0.24, 0.035, 0.84, M(0xf07a22), 0, 0.105, 0, K); box(0.22, 0.008, 0.78, M(0x1a1a1a), 0, 0.126, 0, K);
      for (const z of [-1, 1]) { const tip = box(0.24, 0.035, 0.14, M(0xf07a22), 0, 0.125, z * 0.47, K); tip.rotation.x = -z * 0.35; box(0.16, 0.03, 0.05, M(0xb8b8c0), 0, 0.075, z * 0.28, K);
        for (const x of [-1, 1]) { const w = mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.04, 12), M(0xffd04a), x * 0.1, 0.035, z * 0.28, K); w.rotation.z = Math.PI / 2; } }
    } else if (kind === 'snow') {
      box(0.3, 0.04, 1.36, M(0xd8302a), 0, 0.04, 0, K); box(0.08, 0.006, 1.2, M(0x1a1a1a), 0, 0.063, 0, K);
      for (const z of [-1, 1]) { const t = mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.025, 16, 1, false, 0, Math.PI), M(0xd8302a), 0, 0.04, z * 0.67, K); t.rotation.y = z > 0 ? -Math.PI / 2 : Math.PI / 2; box(0.22, 0.06, 0.1, M(0x1a1a1a), 0, 0.075, z * 0.22, K); }
    } else {
      const w = new THREE.MeshStandardMaterial({ color: 0xfff6e0, emissive: 0xffd07a, emissiveIntensity: 0.35, roughness: 0.9 });
      [[0, 0, 0, 0.42], [0.22, 0.02, 0.28, 0.32], [-0.22, 0.02, 0.26, 0.3], [0.2, 0, -0.3, 0.3], [-0.2, 0.03, -0.28, 0.33], [0, 0.04, 0.5, 0.26], [0, 0.02, -0.55, 0.24], [0, -0.12, 0, 0.3]].forEach(([x, y, z, r]) => mesh(new THREE.SphereGeometry(r, 14, 10), w, x, 0.2 + y, z, K, false).scale.set(1, 0.55, 1));
      const tail = mesh(new THREE.ConeGeometry(0.16, 0.9, 10), w, 0, 0.18, -0.95, K, false); tail.rotation.x = -Math.PI / 2; g.userData.tail = tail;
    }
    g.traverse(o => { if (o.isMesh) { o.castShadow = true; } }); g.visible = false; scene.add(g); return (this.meshes[kind] = g);
  },
  can() { const p = player; return WORLD.cur && started && !cutscene && !gameOver && !Visit.on && !Travel.busy && p.hp > 0 && (p.state === 'loco' || p.state === 'board') && !Bag.open && !WMap.open; },
  toggle() { if (this.on) this.off(); else this.mount(); },
  mount() {
    if (!this.can()) return; const p = player, kind = BOARD_KIND[WORLD.cur.key] || 'skate';
    if (!p.grounded) return tip('先落地再上板', 1);
    this.kind = kind; this.on = true; this.heading = p.yaw; this.sp = Math.min(2, Math.hypot(p.vel.x, p.vel.z) / this.RUN); this.flipT = -1; this.ramT = 0;
    p.guard = p.crouch = false; p.move = null; buffer.type = null; setState(p, 'board', 0.15); refreshChips && refreshChips();
    const g = this.mesh(kind); g.visible = true; g.position.copy(p.pos); g.rotation.set(0, this.heading, 0);
    burst(p.pos.clone().setY(0.3), kind === 'cloud' ? 0xffe08a : kind === 'snow' ? 0xffffff : 0xffb84a, 18, 2.5); sfx('whoosh');
    if (!this.borrowed[kind]) { this.borrowed[kind] = 1; if (kind === 'skate') { Story.bark('jackie', '小玉，你的滑板借我用一下，马上还回来！'); setTimeout(() => Story.bark('jade', '喂！那是我的滑板！'), 3300); } else Story.bark('jackie', kind === 'snow' ? '这块雪板是谁的？对不起，我马上还回来！' : '这朵云……借我站一下，马上还回来！'); }
    else if (Math.random() < 0.5) Story.bark('jackie', kind === 'skate' ? (Math.random() < 0.5 ? '好久没玩滑板了……应该不难吧？' : '站稳了，出发！') : kind === 'snow' ? '雪板？我拍戏的时候学过……一点点。' : '哇——这云真的能站人！');
    if (!this._tipped) { this._tipped = 1; tip(`${BOARD_NAME[kind]}：WASD 转向 · Shift 加速 · 滚轮调速 · Space 跳（空中再按踢板转圈）· 左键冲撞 · B 收起`, 4); }
  },
  hideMesh() { for (const k in this.meshes) this.meshes[k].visible = false; const r = player.rig; if (r && r._iy != null) { r.inner.position.y = r._iy; r.inner.rotation.y = 0; } $('bspd').style.display = 'none'; },
  off(quiet) {
    if (!this.on) return; this.on = false; const p = player; this.hideMesh();
    if (p.state === 'board') { setState(p, 'loco', 0.15); p.vel.multiplyScalar(0.35); }
    if (!quiet) { sfx('whoosh'); burst(p.pos.clone().setY(0.3), 0xffffff, 10, 2); }
  },
  fall(why) {
    if (!this.on) return; const p = player, k = this.kind, g = this.meshes[k], h = this.heading, v = this.sp * this.RUN;
    this.on = false; $('bspd').style.display = 'none'; const r = p.rig; if (r && r._iy != null) { r.inner.position.y = r._iy; r.inner.rotation.y = 0; }
    // 板子自己飞出去翻滚几圈再消失
    if (g) { const t0 = now, ox = g.position.x, oz = g.position.z; const fly = () => { const t = now - t0; if (t > 1.1 || this.on) { if (!this.on) g.visible = false; return; } g.position.set(ox + Math.sin(h) * v * 0.5 * t, Math.max(0, 1.6 * t - 4 * t * t) + 0.05, oz + Math.cos(h) * v * 0.5 * t); g.rotation.z += 0.3; g.rotation.x += 0.18; requestAnimationFrame(fly); }; fly(); }
    if (p.hp > 0 && p.state !== 'dead') { p.downClip = DOWN.back; setState(p, 'down', 0.05); p.vy = Math.max(p.vy, 3.2); p.grounded = false; p.vel.set(Math.sin(h) * v * 0.45, 0, Math.cos(h) * v * 0.45); }
    shake = Math.max(shake, 0.2); sfx('heavy'); setTimeout(() => Story.bark('jackie', Math.random() < 0.5 ? '哎哟！不好玩，不好玩！' : '哎呀……我的腰！'), 350);
    if (why === 'wall') toast('撞上了！速度太快啦', 1.4);
  },
  ram() {
    if (now < this.ramCD) return; this.ramCD = now + 1.1; this.ramT = 0.75; this.hit = new Set(); if (this.sp < 1.5) this.sp = 1.5;
    showMove('滑板冲撞！', '#ffb84a'); sfx('whoosh'); player.anim.kick('sx', 3); if (Math.random() < 0.35) Story.bark('jackie', '让一让！让一让！');
  },
  pre(dt) {
    const p = player, sk = p.rig.sk, R = this.RUN;
    if (buffer.type) { this.ram(); buffer.type = null; }
    const inp = moveInput(), moving = !!(inp.x || inp.z), boost = (keys.ShiftLeft || keys.ShiftRight) && p.st > 1, air = !p.grounded;
    if (moving) {
      const want = Math.atan2(inp.x, inp.z), d = angDiff(this.heading, want);
      if (Math.abs(d) > 2.5 && this.sp > 0.4) this.sp = Math.max(0, this.sp - 3.2 * dt);
      else {
        const turn = (air ? 1.2 : 3.4) / (1 + this.sp * 0.28); this.heading += clamp(d, -turn * dt, turn * dt);
        const tgt = boost ? Math.min(5, this.lvl + 1.5) : this.lvl;
        if (!air) { if (this.sp < Math.min(2, tgt)) this.sp = Math.min(Math.min(2, tgt), this.sp + 4 * dt); else if (this.sp < tgt) this.sp = Math.min(tgt, this.sp + (boost ? 1.3 : 0.45) * dt); else this.sp = Math.max(tgt, this.sp - 1.6 * dt); }
      }
      if (boost) { p.st -= dt * 7; p.stDelay = 0.4; }
    } else if (!air) this.sp = Math.max(0, this.sp - (this.kind === 'cloud' ? 0.9 : 0.6) * dt);
    const eff = this.sp + (this.ramT > 0 ? 1.6 : 0);
    p.vel.x = Math.sin(this.heading) * eff * R; p.vel.z = Math.cos(this.heading) * eff * R; p.yaw = p.yawTarget = this.heading;
    if (sk && sk.mixer) { if (this.ramT > 0) sk.set('boardRam', { crouch_idle: 1 }, null, 0.1); else if (air) sk.set('boardAir', { crouch_idle: 0.8, idle_box: 0.2 }, null, 0.12); else sk.set('board', { crouch_idle: 0.45, idle_box: 0.55 }, null, 0.2); }
  },
  post(dt, x0, z0) {
    const p = player; if (!this.on) return;
    if (p.state !== 'board') { if (p.state === 'dead') { this.on = false; this.hideMesh(); } else this.off(true); return; }
    if (cutscene || !WORLD.cur) { this.off(true); return; }
    this.ramT -= dt; this.bumpT -= dt;
    const exp = Math.hypot(p.vel.x, p.vel.z) * dt, got = Math.hypot(p.pos.x - x0, p.pos.z - z0);
    if (exp > 0.06 && got < exp * 0.3 && this.bumpT <= 0) { this.bumpT = 0.4; if (this.sp >= 3.6 && this.ramT <= 0) return this.fall('wall'); this.sp *= 0.3; shake = Math.max(shake, 0.08); Foley && Foley.land && Foley.land(false); }
    // 冲撞：冲撞技期间，或者速度很快时撞到敌人
    if (this.ramT > 0 || this.sp >= 3.2) for (const e of enemies) {
      if (e.dead || (this.hit && this.hit.has(e))) continue; const dx = e.pos.x - p.pos.x, dz = e.pos.z - p.pos.z, d = Math.hypot(dx, dz);
      if (d > 1.0 + (e.radius || 0.4) || (dx * Math.sin(this.heading) + dz * Math.cos(this.heading)) < -0.2) continue;
      (this.hit = this.hit || new Set()).add(e); if (this.ramT <= 0) setTimeout(() => this.hit && this.hit.delete(e), 1500);
      if (e.dormant && typeof wakePack === 'function') wakePack(e);
      const dir = new THREE.Vector2(Math.sin(this.heading), Math.cos(this.heading)), dmg = Math.round(12 + this.sp * 5), pos = e.pos.clone().setY(1.2 * (e.scale || 1));
      e.takeHit(dmg, dir, { kb: 5 + this.sp * 1.6, launch: 4 + this.sp * 0.6, kd: true, heavy: true, guardBreak: true }, 1, false);
      impact('hit', { pos, heavy: true }); floatText(pos, '-' + dmg, '#ffb84a', 24); shake = Math.max(shake, 0.2); hitstop = 0.05; this.sp *= 0.82; player.iframe = Math.max(player.iframe, 0.25);
    }
    // 板子 + 人的站姿
    const g = this.meshes[this.kind], K = g.userData.K, r = p.rig, bob = this.kind === 'cloud' ? Math.sin(now * 3) * 0.05 : 0;
    g.position.set(p.pos.x, p.pos.y + bob, p.pos.z); g.rotation.set(0, this.heading, 0);
    let spin = 0;
    if (this.flipT >= 0) { this.flipT += dt; const k = Math.min(1, this.flipT / 0.5), e = k * k * (3 - 2 * k); K.rotation.z = e * TAU; K.position.y = Math.sin(k * Math.PI) * 0.25; spin = e * TAU; if (k >= 1) { this.flipT = -1; K.rotation.z = 0; K.position.y = 0; } }
    if (p.grounded && this.flipT >= 0) { this.flipT = -1; K.rotation.z = 0; K.position.y = 0; }
    K.rotation.x = this.kind === 'skate' && !p.grounded && this.flipT < 0 ? -0.25 : 0;
    const lean = clamp(angDiff(this._ph ?? this.heading, this.heading) / Math.max(dt, 1e-3) * 0.08, -0.35, 0.35); this._ph = this.heading; K.rotation.z += this.flipT < 0 ? -lean * (this.kind === 'cloud' ? 0.5 : 1) : 0;
    if (r && r._iy != null) { r.inner.position.y = r._iy + this.DECK[this.kind] + bob + (this.flipT >= 0 ? K.position.y : 0); r.inner.rotation.y = (this.kind === 'cloud' ? -0.35 : -1.25) + spin; }
    // 尾迹
    this.fx -= dt; if (this.fx <= 0 && this.sp > 1.2 && (p.grounded || this.kind === 'cloud')) { this.fx = 0.05; const b = p.pos.clone(); b.x -= Math.sin(this.heading) * 0.6; b.z -= Math.cos(this.heading) * 0.6; b.y = 0.1 + bob; burst(b, this.kind === 'cloud' ? 0xffe8a0 : this.kind === 'snow' ? 0xffffff : 0xcab89a, this.kind === 'skate' ? 2 : 4, 1 + this.sp * 0.3); }
    if (g.userData.tail) g.userData.tail.scale.set(1, 1 + this.sp * 0.4, 1);
    // HUD
    const el = $('bspd'), t = `${BOARD_NAME[this.kind]} <b>${(this.sp + (this.ramT > 0 ? 1.6 : 0)).toFixed(1)}×</b><i><u style="width:${this.sp / 5 * 100}%"></u><s style="left:${this.lvl / 5 * 100}%"></s></i>上限 ${this.lvl.toFixed(1)}× · 滚轮调速`;
    if (this._h !== t) { this._h = t; el.innerHTML = t; } el.style.display = 'block';
  },
  jump() {
    const p = player; if (!this.on || p.state !== 'board') return;
    if (p.grounded) { p.vy = this.kind === 'cloud' ? 8.5 : 7.2; p.grounded = false; Foley.jump(false); p.anim.kick('hy', -1); burst(p.pos.clone().setY(0.1), 0xffffff, 8, 2); }
    else if (this.flipT < 0 && p.vy > -6) { this.flipT = 0; p.vy = Math.max(p.vy, 3); sfx('whoosh'); showMove(this.kind === 'cloud' ? '腾云转身！' : '踢板转圈！', '#ffd04a'); }
  },
};
{
  const _up = updatePlayer;
  updatePlayer = function (dt) {
    const p = player; if (Board.on && p.state === 'board' && !cutscene) Board.pre(dt);
    const x0 = p.pos.x, z0 = p.pos.z; _up(dt); if (Board.on) Board.post(dt, x0, z0);
  };
  const _th = playerTakeHit;
  playerTakeHit = function (e, dmg, opts) {
    const was = Board.on && player.state === 'board'; const r = _th.apply(this, arguments);
    if (was && Board.on && player.state !== 'board') { if (player.state === 'dead') { Board.on = false; Board.hideMesh(); } else Board.fall('hit'); }
    return r;
  };
  const _lv = WORLD.leave; WORLD.leave = function () { Board.off(true); return _lv.apply(this, arguments); };
  const _pl = Story.play; Story.play = function () { if (Board.on) Board.off(true); return _pl.apply(this, arguments); };
  const _rs = Menu.resetSession.bind(Menu); Menu.resetSession = function () { Board.on = false; Board.hideMesh(); Board.borrowed = {}; return _rs(); };
}
addEventListener('keydown', e => {
  if (!started || e.repeat || cutscene) return;
  if (e.code === 'KeyB' && !Bag.open && !WMap.open) { e.preventDefault(); if (!WORLD.cur) { tip('滑板只能在大地图上用', 1.2); return; } Board.toggle(); return; }
  if (Board.on && player.state === 'board' && e.code === 'Space') { e.stopImmediatePropagation(); e.preventDefault(); Board.jump(); }
}, true);
addEventListener('wheel', e => {
  if (!Board.on || !started || cutscene || Bag.open || WMap.open || !e.deltaY) return;
  e.stopImmediatePropagation(); e.preventDefault(); Board.lvl = clamp(Board.lvl + (e.deltaY < 0 ? 0.5 : -0.5), 1, 5);
}, { capture: true, passive: false });
setTimeout(() => { if (window.__game) Object.assign(window.__game, { Board }); }, 0);
