// ================= 第四集 · 系统：地面预警 / 视线与潜行 / 背后制伏 / 小队包抄 / 背后来袭提示 / 相机避障 =================
// ---------- 带高度的碰撞体（矮掩体只挡蹲下的人；视线、相机避障都用它） ----------
function addColH(G, x0, x1, z0, z1, h) { const c = { x0: G.position.x + x0, x1: G.position.x + x1, z0: G.position.z + z0, z1: G.position.z + z1, h }; colliders.push(c); return c; }
// 线段 (a→b) 与轴对齐矩形的进入参数 t∈[0,1]，不相交返回 -1
function segBox(ax, az, bx, bz, c, pad = 0) {
  let t0 = 0, t1 = 1; const dx = bx - ax, dz = bz - az;
  const ax_ = [[ax, dx, c.x0 - pad, c.x1 + pad], [az, dz, c.z0 - pad, c.z1 + pad]];
  for (const [p, d, lo, hi] of ax_) {
    if (Math.abs(d) < 1e-9) { if (p < lo || p > hi) return -1; continue; }
    let u0 = (lo - p) / d, u1 = (hi - p) / d; if (u0 > u1) { const s = u0; u0 = u1; u1 = s; }
    if (u0 > t0) t0 = u0; if (u1 < t1) t1 = u1; if (t0 > t1) return -1;
  }
  return t0;
}
// 只取当前区域附近的碰撞体（缓存）
const LOSC = { key: '', list: [] };
function areaCols() {
  const k = AREA.name + ':' + colliders.length;
  if (LOSC.key !== k) { LOSC.key = k; const m = 4; LOSC.list = colliders.filter(c => c.x1 > AREA.cx - AREA.hx - m && c.x0 < AREA.cx + AREA.hx + m && c.z1 > AREA.cz - AREA.hz - m && c.z0 < AREA.cz + AREA.hz + m); }
  return LOSC.list;
}
// low=true：矮掩体也挡（目标蹲着）
function losClear(ax, az, bx, bz, low) {
  for (const c of areaCols()) { const h = c.h ?? 3; if (h < 1.3 && !low) continue; if (c.noLos) continue; const t = segBox(ax, az, bx, bz, c); if (t >= 0 && t < 0.999) return false; }
  return true;
}
// 射线最远能到多远（画视野锥用；只有高障碍挡）
function rayLen(ax, az, dx, dz, L) {
  let best = L; const bx = ax + dx * L, bz = az + dz * L;
  for (const c of areaCols()) { if ((c.h ?? 3) < 1.3 || c.noLos) continue; const t = segBox(ax, az, bx, bz, c); if (t >= 0 && t * L < best) best = t * L; }
  return best;
}

// ---------- 地面预警 ----------
// 颜色语义：红 = 必须闪/跳（不可格挡）  琥珀 = 可格挡/可完美格挡  青 = 提示（无伤害或可蹲防）  紫 = 抓取（破防，不可格挡）
const TELE_COL = { red: 0xff2a2a, amber: 0xffa21e, cyan: 0x2ee6ff, purple: 0xc04dff, green: 0x4dff7a, gold: 0xffd84a };
const TELE_MAT = {};
for (const k in TELE_COL) {
  const c = new THREE.Color(TELE_COL[k]);
  const mk = (op, add) => new THREE.MeshBasicMaterial({ color: c.clone().multiplyScalar(add ? 1.6 : 1), transparent: true, opacity: op, depthWrite: false, side: THREE.DoubleSide, toneMapped: false, fog: false, blending: add ? THREE.AdditiveBlending : THREE.NormalBlending, polygonOffset: true, polygonOffsetFactor: -2 });
  TELE_MAT[k] = { edge: mk(0.95, true), base: mk(0.16, false), fill: mk(0.42, true) };
}
const Tele = {
  list: [],
  // o: { shape:'circle'|'sector'|'lane'|'ring', x, z, yaw, r, arc, len, w, wind, col, dmg, opts, src, follow(T,dt), lock(0..1：之后不再跟随), onFire(T), hold }
  add(o) {
    const T = Object.assign({ shape: 'circle', yaw: 0, r: 2, arc: 0.8, len: 8, w: 2, wind: 1, col: 'red', t: 0, fired: false, after: 0.18, lock: 0.8 }, o);
    const G = new THREE.Group(); G.position.set(T.x, 0.035 + (Tele.list.length % 6) * 0.004, T.z); G.rotation.y = T.yaw; scene.add(G); T.g = G;
    const Mt = TELE_MAT[T.col] || TELE_MAT.red, flat = (geo, mat) => { const m = new THREE.Mesh(geo, mat); m.rotation.x = -Math.PI / 2; m.renderOrder = 3; m.frustumCulled = false; G.add(m); return m; };
    if (T.shape === 'circle') {
      flat(new THREE.CircleGeometry(T.r, 40), Mt.base); flat(new THREE.RingGeometry(T.r - 0.09, T.r, 48), Mt.edge);
      T.fillM = flat(new THREE.CircleGeometry(T.r, 40), Mt.fill);
    } else if (T.shape === 'sector') {
      const a0 = -Math.PI / 2 - T.arc, al = T.arc * 2;
      flat(new THREE.RingGeometry(0.02, T.r, 32, 1, a0, al), Mt.base); flat(new THREE.RingGeometry(T.r - 0.1, T.r, 32, 1, a0, al), Mt.edge);
      [-1, 1].forEach(s => { const e = flat(new THREE.PlaneGeometry(0.08, T.r).translate(0, -T.r / 2, 0), Mt.edge); e.rotation.z = -s * T.arc; e.rotation.order = 'XYZ'; });
      T.fillM = flat(new THREE.RingGeometry(0.02, T.r, 32, 1, a0, al), Mt.fill);
    } else if (T.shape === 'lane') {
      flat(new THREE.PlaneGeometry(T.w, T.len).translate(0, -T.len / 2, 0), Mt.base);
      [-1, 1].forEach(s => flat(new THREE.PlaneGeometry(0.09, T.len).translate(s * (T.w / 2 - 0.045), -T.len / 2, 0), Mt.edge));
      flat(new THREE.PlaneGeometry(T.w, 0.1).translate(0, -T.len + 0.05, 0), Mt.edge);
      // 车道上的箭头
      for (let d = 1.2; d < T.len - 0.5; d += 1.8) { const s = new THREE.Shape(); s.moveTo(-T.w * 0.28, 0); s.lineTo(0, -0.55); s.lineTo(T.w * 0.28, 0); s.lineTo(T.w * 0.28, 0.0); s.lineTo(0, -0.3); s.lineTo(-T.w * 0.28, 0); flat(new THREE.ShapeGeometry(s).translate(0, -d, 0), Mt.edge); }
      T.fillM = flat(new THREE.PlaneGeometry(T.w, T.len).translate(0, -T.len / 2, 0), Mt.fill);
    } else if (T.shape === 'ring') {
      flat(new THREE.RingGeometry(T.r - 0.12, T.r, 64), Mt.edge); flat(new THREE.RingGeometry(0.6, T.r, 64), Mt.base);
      T.fillM = flat(new THREE.RingGeometry(0.85, 1, 64), Mt.fill); T.band = 0.6; // 爆发后：扩散的冲击环
    }
    T.fillM.scale.set(0.001, 0.001, 1);
    this.list.push(T); return T;
  },
  cancel(T) { if (!T || T.dead) return; T.dead = true; this.drop(T); },
  drop(T) { scene.remove(T.g); T.g.traverse(o => { if (o.geometry) o.geometry.dispose(); }); const i = this.list.indexOf(T); if (i >= 0) this.list.splice(i, 1); },
  clear() { [...this.list].forEach(T => this.cancel(T)); },
  // 判定：与画出来的形状完全一致（+ 角色半径）
  inside(T, pos, rad = 0.3) {
    const dx = pos.x - T.g.position.x, dz = pos.z - T.g.position.z, d = Math.hypot(dx, dz);
    if (T.shape === 'circle') return d <= T.r + rad;
    if (T.shape === 'sector') return d <= T.r + rad && (d < 0.5 || Math.abs(angDiff(T.yaw, Math.atan2(dx, dz))) <= T.arc + rad / Math.max(1, d));
    if (T.shape === 'lane') { const s = Math.sin(T.yaw), c = Math.cos(T.yaw), f = dx * s + dz * c, sd = dx * c - dz * s; return f >= -rad && f <= T.len + rad && Math.abs(sd) <= T.w / 2 + rad; }
    if (T.shape === 'ring') return Math.abs(d - T.ringR) < T.band + rad;
    return false;
  },
  update(dt) {
    for (let i = this.list.length - 1; i >= 0; i--) {
      const T = this.list[i]; if (T.dead) continue;
      T.t += dt; const k = Math.min(1, T.t / T.wind);
      if (!T.fired) {
        if (T.follow && k < T.lock) T.follow(T, dt);
        T.g.position.x = T.x; T.g.position.z = T.z; T.g.rotation.y = T.yaw;
        const e = k * k * (3 - 2 * k);
        if (T.shape === 'lane') T.fillM.scale.set(1, Math.max(0.001, e), 1); else if (T.shape !== 'ring') T.fillM.scale.set(Math.max(0.001, e), Math.max(0.001, e), 1);
        else T.fillM.scale.set(0.6 + e * 0.4, 0.6 + e * 0.4, 1);
        // 最后 25%：边缘闪烁（读秒）
        const Mt = TELE_MAT[T.col]; Mt.edge.opacity = 0.95;
        T.g.children.forEach(m => { if (m.material === Mt.edge) m.visible = k < 0.75 || ((now * 18) | 0) % 2 === 0; });
        if (T.t >= T.wind && !T.hold) this.fire(T);
      } else if (T.shape === 'ring') {
        T.ringR += T.speed * dt; T.fillM.geometry.dispose(); T.fillM.geometry = new THREE.RingGeometry(Math.max(0.01, T.ringR - T.band), T.ringR + T.band * 0.35, 72); T.fillM.scale.set(1, 1, 1); T.g.children.forEach(m => { if (m !== T.fillM) m.visible = false; });
        if (!T.hitDone && Tele.inside(T, player.pos) && player.pos.y < (T.jumpH ?? 0.35)) { T.hitDone = true; playerTakeHit(T.src || Tele.srcOf(T), T.dmg, T.opts || { kd: 1, unblockable: 1 }); }
        if (T.onTick) T.onTick(T, dt);
        if (T.ringR > T.r) this.drop(T);
      } else if ((T.after -= dt) <= 0) this.drop(T);
      else T.g.children.forEach(m => m.visible = true);
    }
  },
  fire(T) {
    T.fired = true; T.g.children.forEach(m => m.visible = true); T.fillM.scale.set(1, 1, 1);
    if (T.shape === 'ring') T.ringR = 0.8;
    if (T.onFire) T.onFire(T);
    else if (T.shape !== 'ring' && T.dmg && Tele.inside(T, player.pos) && player.pos.y < (T.airH ?? 1.2)) playerTakeHit(T.src || Tele.srcOf(T), T.dmg, T.opts || (T.col === 'amber' ? {} : { unblockable: 1, kd: T.kd }));
  },
  // 没有 src 时给 playerTakeHit 用的“伪攻击者”
  srcOf(T) { return { pos: T.g.position.clone(), parried() { } }; },
};

// ---------- 背后来袭提示（屏幕边缘的箭头） ----------
document.head.insertAdjacentHTML('beforeend', `<style>
.edgeArr{position:fixed;width:0;height:0;pointer-events:none;z-index:7;display:none}
.edgeArr i{position:absolute;left:-17px;top:-22px;width:34px;height:44px;background:radial-gradient(circle at 50% 70%,#ff3a2a 0 38%,transparent 40%);clip-path:polygon(50% 0,100% 100%,50% 76%,0 100%);filter:drop-shadow(0 0 8px #f00)}
.edgeArr.am i{background:#ffb02a;filter:drop-shadow(0 0 8px #fa0)}
.gicon{position:absolute;transform:translate(-50%,-100%);font:900 30px/1 "Noto Sans SC",sans-serif;color:#ffd84a;text-shadow:0 0 6px #000,0 0 2px #000;pointer-events:none;display:none;text-align:center}
.gicon b{display:block;margin:2px auto 0;width:44px;height:6px;border-radius:3px;background:rgba(0,0,0,.6);overflow:hidden}
.gicon b i{display:block;height:100%;background:#ffd84a;width:0}
.gicon.red{color:#ff4030}.gicon.red b i{background:#ff4030}
.gicon.radio{color:#7fd8ff;font-size:16px}.gicon.radio b i{background:#7fd8ff}
#stealthHud{position:fixed;left:50%;top:64px;transform:translateX(-50%);font:700 14px "Noto Sans SC",sans-serif;color:#cfe;text-shadow:0 1px 3px #000;pointer-events:none;display:none;letter-spacing:1px}
#stealthHud.alarm{color:#ff5040;animation:alarmBlink .5s steps(2) infinite}
@keyframes alarmBlink{50%{opacity:.35}}
body.alarm::before{content:"";position:fixed;inset:0;pointer-events:none;z-index:4;box-shadow:inset 0 0 160px rgba(255,20,20,.55);animation:alarmBlink 1s ease-in-out infinite}
#hackBar{position:fixed;left:50%;bottom:150px;transform:translateX(-50%);width:260px;height:12px;border:2px solid #9fe;border-radius:7px;background:rgba(0,0,0,.5);display:none;pointer-events:none}
#hackBar i{display:block;height:100%;width:0;background:linear-gradient(90deg,#2ee6ff,#aff);border-radius:4px}
#hackBar span{position:absolute;left:0;right:0;top:-22px;text-align:center;font:700 13px "Noto Sans SC",sans-serif;color:#cff;text-shadow:0 1px 3px #000}
</style>`);
document.body.insertAdjacentHTML('beforeend', '<div id="stealthHud"></div><div id="hackBar"><span>破解金库中…（按住 E）</span><i></i></div>');
const EdgeArrows = {
  pool: [],
  get(i) { while (this.pool.length <= i) { const d = document.createElement('div'); d.className = 'edgeArr'; d.innerHTML = '<i></i>'; document.body.appendChild(d); this.pool.push(d); } return this.pool[i]; },
  threat(e) {
    if (e.dead || e.hidden) return null;
    if (e.threat) return e.threat;
    if (e.state === 'attack' && e.atk && e.t < e.atk.wind + 0.05) return 'red';
    return null;
  },
  update() {
    let n = 0;
    if (started && !cutscene && !gameOver && player.view === 'third') {
      const W = innerWidth, H = innerHeight, cx = W / 2, cy = H / 2, R = Math.min(W, H) * 0.42;
      const f = [Math.sin(camYaw), Math.cos(camYaw)], r = [-Math.cos(camYaw), Math.sin(camYaw)];
      for (const e of enemies) {
        const th = this.threat(e); if (!th) continue;
        const vx = e.pos.x - camera.position.x, vz = e.pos.z - camera.position.z;
        if (Math.hypot(e.pos.x - player.pos.x, e.pos.z - player.pos.z) > 10) continue;
        const s = toScreen(e.pos.clone().setY(e.pos.y + 1.1 * (e.scale || 1)));
        const on = s.vis && s.x > 40 && s.x < W - 40 && s.y > 40 && s.y < H - 40;
        if (on) continue;
        const lx = -(vx * r[0] + vz * r[1]), lz = vx * f[0] + vz * f[1], a = Math.atan2(lx, lz);
        const d = this.get(n++); d.style.display = 'block'; d.className = 'edgeArr' + (th === 'amber' ? ' am' : '');
        d.style.left = (cx + Math.sin(a) * R * (W / H > 1 ? 1.35 : 1)) + 'px'; d.style.top = (cy - Math.cos(a) * R) + 'px';
        d.style.transform = `rotate(${a}rad) scale(${1 + 0.15 * Math.sin(now * 20)})`;
      }
    }
    for (let i = n; i < this.pool.length; i++) this.pool[i].style.display = 'none';
  },
};

// ---------- 潜行：守卫、摄像头、激光、警报 ----------
const CONE_MAT = {
  calm: new THREE.MeshBasicMaterial({ color: new THREE.Color(0.65, 0.88, 1), transparent: true, opacity: 0.24, depthWrite: false, toneMapped: false, fog: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -1 }),
  sus: new THREE.MeshBasicMaterial({ color: new THREE.Color(1, 0.6, 0.1), transparent: true, opacity: 0.3, depthWrite: false, toneMapped: false, fog: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -1 }),
  alert: new THREE.MeshBasicMaterial({ color: new THREE.Color(1, 0.15, 0.1), transparent: true, opacity: 0.34, depthWrite: false, toneMapped: false, fog: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -1 }),
};
class VisionCone {
  constructor(n = 22) {
    this.n = n; const g = new THREE.BufferGeometry(); this.pos = new Float32Array((n + 2) * 3);
    g.setAttribute('position', new THREE.BufferAttribute(this.pos, 3)); const idx = []; for (let i = 0; i < n; i++) idx.push(0, i + 1, i + 2); g.setIndex(idx);
    this.mesh = new THREE.Mesh(g, CONE_MAT.calm); this.mesh.frustumCulled = false; this.mesh.renderOrder = 2; scene.add(this.mesh);
  }
  set(x, z, yaw, half, range, mat, y = 0.04) {
    const P = this.pos; P[0] = x; P[1] = y; P[2] = z;
    for (let i = 0; i <= this.n; i++) { const a = yaw - half + (i / this.n) * half * 2, dx = Math.sin(a), dz = Math.cos(a), L = rayLen(x, z, dx, dz, range); P[(i + 1) * 3] = x + dx * L; P[(i + 1) * 3 + 1] = y; P[(i + 1) * 3 + 2] = z + dz * L; }
    this.mesh.geometry.attributes.position.needsUpdate = true; this.mesh.material = mat; this.mesh.visible = true;
  }
  hide() { this.mesh.visible = false; }
  dispose() { scene.remove(this.mesh); this.mesh.geometry.dispose(); }
}
function gIcon() { const d = document.createElement('div'); d.className = 'gicon'; d.innerHTML = '<span></span><b><i></i></b>'; $('hud').appendChild(d); return d; }
function placeIcon(d, pos, txt, cls, fill) {
  const s = toScreen(pos); if (!s.vis) { d.style.display = 'none'; return; }
  d.style.display = 'block'; d.style.left = s.x + 'px'; d.style.top = s.y + 'px'; d.className = 'gicon ' + (cls || '');
  d.firstChild.textContent = txt; d.lastChild.style.display = fill == null ? 'none' : 'block'; if (fill != null) d.lastChild.firstChild.style.width = (fill * 100) + '%';
}
const SNEAK = {
  on: false, alarm: false, guards: [], cams: [], lasers: [], fuses: [], power: true, seen: false, fought: false, alarmed: false, ko: 0, kills0: 0,
  hud: null, sirenT: 0, reinf: null, alert: 0,
  start(cfg) {
    this.stop(); Object.assign(this, { on: true, alarm: false, power: true, seen: false, fought: false, alarmed: false, ko: 0, alert: 0, reinf: cfg.reinf || null, cfg });
    (cfg.cams || []).forEach(c => this.cams.push(Object.assign({ yaw0: c.yaw, amp: 0.7, spd: 0.5, ph: rand(0, 6), det: 0, cone: new VisionCone(16), icon: gIcon(), range: 9, half: 0.42 }, c)));
    (cfg.lasers || []).forEach(L => this.lasers.push(L));
    this.lasers.forEach(L => { L.on = true; if (L.mesh) L.mesh.visible = true; });
    $('stealthHud').style.display = 'block';
  },
  stop() {
    this.guards.forEach(g => { if (g.cone) g.cone.dispose(); if (g.icon) g.icon.remove(); }); this.guards.length = 0;
    this.cams.forEach(c => { c.cone.dispose(); c.icon.remove(); if (c.lens) c.lens.material = c.lensOn; }); this.cams.length = 0;
    this.lasers.forEach(L => { if (L.mesh) L.mesh.visible = false; }); this.lasers.length = 0;
    this.on = false; this.alarm = false; document.body.classList.remove('alarm'); $('stealthHud').style.display = 'none'; $('stealthHud').classList.remove('alarm'); $('hackBar').style.display = 'none';
  },
  // 把一个敌人变成巡逻守卫
  guard(e, route, o = {}) {
    e.g = Object.assign({ mode: 'patrol', route, wi: 0, wait: 0, det: 0, last: null, look: 0, searchT: 0, radio: null, radioDone: false, range: 11, half: 0.62, seenBodies: new Set() }, o);
    e.g.cone = new VisionCone(); e.g.icon = gIcon(); e.hb.style.display = 'none';
    if (route && route.length) e.yaw = Math.atan2(route[0][0] - e.pos.x, route[0][1] - e.pos.z);
    this.guards.push(e); return e;
  },
  status() {
    const alive = this.guards.filter(g => !g.dead).length;
    if (this.alarm) return `⚠ 警报！ 增援正在赶来 · 剩余守卫 ${enemies.filter(e => !e.dead).length}`;
    const s = this.seen ? '已暴露' : '未被发现'; return `潜入中 · ${s} · 守卫 ${alive}/${this.guards.length}${this.power ? '' : ' · 摄像头已断电'}`;
  },
  canSee(x, z, yaw, range, half, eyeH = 1.6) {
    const p = player, dx = p.pos.x - x, dz = p.pos.z - z, d = Math.hypot(dx, dz);
    if (p.state === 'dead') return 0;
    const crouch = p.crouch && p.grounded, R = range * (crouch ? 0.62 : 1);
    if (d > R) return 0;
    const a = Math.abs(angDiff(yaw, Math.atan2(dx, dz)));
    if (a > half && !(d < 2.2 && a < 1.7)) return 0;
    if (!losClear(x, z, p.pos.x, p.pos.z, crouch)) return 0;
    return (1.25 - d / R) * (crouch ? 0.6 : 1) * (Math.hypot(p.vel.x, p.vel.z) > 4.5 ? 1.35 : 1);
  },
  toCombat(e, why) {
    const g = e.g; if (!g || g.mode === 'combat') return;
    g.mode = 'combat'; g.det = 1; this.seen = true; e.cd = Math.max(e.cd, 0.6);
    floatText(e.pos.clone().setY(2.3 * e.scale), '！', '#ff4030', 34);
    if (!this.alarm && !g.radioDone && !g.noRadio) { g.radio = 2.5; if (why !== 'quiet') Story.bark('thug', ['有人闯进来了！', '在这儿！', '是成龙！呼叫总部！'][Math.floor(rand(0, 3))]); }
    // 附近能看到他的同伴一起进入战斗
    for (const o of this.guards) if (o !== e && !o.dead && o.g.mode !== 'combat' && o.pos.distanceTo(e.pos) < 9 && losClear(o.pos.x, o.pos.z, e.pos.x, e.pos.z)) { o.g.mode = 'search'; o.g.last = player.pos.clone(); o.g.det = Math.max(o.g.det, 0.7); }
  },
  raise(why) {
    if (this.alarm) return; this.alarm = true; this.alarmed = true; this.seen = true;
    banner(`⚠ 警报拉响！<small>${why || '守卫用无线电叫来了增援'}</small>`, 2.6); shake = 0.15;
    document.body.classList.add('alarm'); $('stealthHud').classList.add('alarm');
    Foley.at('alarm', player.pos, { vol: 0.7 }); this.sirenT = 2.2;
    this.guards.forEach(g => { if (!g.dead && g.g.mode !== 'combat') { g.g.mode = 'combat'; g.g.radio = null; } });
    if (this.reinf) this.reinf();
  },
  update(dt) {
    if (!this.on) return;
    const p = player;
    // 噪声：跑步 9 m / 走路 4 m / 蹲行 0；打斗声 12 m；随时间衰减
    p.noise = Math.max(0, (p.noise || 0) - dt * 14);
    if (p.state === 'attack' && p.move && p.mt > 0.3 && p.mt < 0.5) p.noise = Math.max(p.noise, 7);
    if (this.alarm && (this.sirenT -= dt) <= 0) { this.sirenT = 2.2; Foley.at('alarm', p.pos, { vol: 0.45 }); }
    for (const e of this.guards) {
      const g = e.g;
      if (e.dead) { g.cone.hide(); g.icon.style.display = 'none'; continue; }
      const head = e.pos.clone().setY(2.35 * e.scale);
      if (g.mode === 'combat') {
        g.cone.hide(); e.hb.style.display = '';
        if (g.radio != null) {
          if (e.state === 'down' || e.state === 'dead') { g.radio = null; g.radioDone = true; floatText(head, '无线电被打断！', '#7fd8ff', 20); }
          else if (e.state === 'loco' || e.state === 'attack') { g.radio -= dt; if (g.radio <= 0) { g.radio = null; g.radioDone = true; this.raise(); } }
          if (g.radio != null) placeIcon(g.icon, head.setY(head.y + 0.25), '📻 呼叫增援', 'radio', 1 - g.radio / 2.5); else g.icon.style.display = 'none';
        } else g.icon.style.display = 'none';
        continue;
      }
      // 视野
      const look = e.yaw + (g.mode === 'patrol' && g.wait > 0 ? Math.sin(now * 1.3 + e.ph) * 0.55 : 0) + g.look;
      const vis = e.state === 'loco' ? this.canSee(e.pos.x, e.pos.z, look, g.range, g.half) : 0;
      g.cone.set(e.pos.x, e.pos.z, look, g.half, g.range, g.mode === 'patrol' ? CONE_MAT.calm : CONE_MAT.sus);
      if (vis > 0) { g.det += vis * dt * (g.mode === 'patrol' ? 1.1 : 1.9) * (1 + this.alert * 0.25); g.last = p.pos.clone(); g.lost = 0; }
      else g.det = Math.max(0, g.det - dt * (g.mode === 'patrol' ? 0.35 : 0.12));
      // 听觉
      const hd = Math.hypot(p.pos.x - e.pos.x, p.pos.z - e.pos.z);
      if (p.noise > 0 && hd < p.noise * (losClear(e.pos.x, e.pos.z, p.pos.x, p.pos.z) ? 1 : 0.55)) { if (g.mode === 'patrol') floatText(head, '？', '#ffd84a', 26); g.mode = 'search'; g.last = p.pos.clone(); g.searchT = 0; g.det = Math.max(g.det, 0.32); }
      // 发现倒下的同伴
      for (const o of this.guards) if (o !== e && o.dead && !g.seenBodies.has(o) && o.pos.distanceTo(e.pos) < g.range * 0.8) {
        const a = Math.abs(angDiff(look, Math.atan2(o.pos.x - e.pos.x, o.pos.z - e.pos.z)));
        if (a < g.half + 0.2 && losClear(e.pos.x, e.pos.z, o.pos.x, o.pos.z)) { g.seenBodies.add(o); if (!o.bodyFound) { o.bodyFound = true; this.alert++; floatText(head, '有人倒下了！', '#ffb02a', 22); } g.mode = 'search'; g.last = o.pos.clone(); g.searchT = 0; g.det = Math.max(g.det, 0.55); }
      }
      if (g.det >= 1) { this.toCombat(e); continue; }
      if (g.det > 0.3 && g.mode === 'patrol') { g.mode = 'search'; g.searchT = 0; }
      if (g.mode === 'search' && g.det < 0.05 && g.searchT > 6) { g.mode = 'patrol'; g.look = 0; }
      if (g.det > 0.02 || g.mode === 'search') placeIcon(g.icon, head, g.det > 0.6 ? '！' : '？', g.det > 0.6 ? 'red' : '', Math.min(1, g.det)); else g.icon.style.display = 'none';
    }
    // 摄像头
    for (const c of this.cams) {
      if (!this.power || this.alarm) { c.cone.hide(); c.icon.style.display = 'none'; if (c.lens && !this.power) c.lens.material = c.lensOff; continue; }
      c.ph += dt * c.spd; const yaw = c.yaw0 + Math.sin(c.ph) * c.amp; if (c.head) c.head.rotation.y = yaw - (c.parentYaw || 0);
      const v = this.canSee(c.x, c.z, yaw, c.range, c.half, 3);
      c.det = v > 0 ? c.det + v * dt * 1.4 : Math.max(0, c.det - dt * 0.4);
      c.cone.set(c.x, c.z, yaw, c.half, c.range, c.det > 0.05 ? CONE_MAT.alert : CONE_MAT.sus);
      if (c.det > 0.02) placeIcon(c.icon, new THREE.Vector3(c.x, 3.4, c.z), '◉', 'red', Math.min(1, c.det)); else c.icon.style.display = 'none';
      if (c.det >= 1) { this.raise('摄像头拍到了你！'); }
    }
    // 激光绊线
    for (const L of this.lasers) {
      if (!L.on) continue;
      if (L.mesh) L.mesh.material.opacity = 0.65 + 0.3 * Math.sin(now * 14 + L.x0);
      if (this.alarm) continue;
      const t = segBox(L.x0, L.z0, L.x1, L.z1, { x0: p.pos.x - 0.28, x1: p.pos.x + 0.28, z0: p.pos.z - 0.28, z1: p.pos.z + 0.28 });
      if (t < 0) continue;
      const lowOK = L.y < 0.6 && p.pos.y > L.y + 0.15, highOK = L.y > 0.6 && (p.crouch || (p.state === 'dodge' && (p.clip === ROLL)) || (p.state === 'attack' && p.move && p.move.low));
      if (!lowOK && !highOK) { burst(new THREE.Vector3(p.pos.x, L.y, p.pos.z), 0xff2a2a, 16, 3); this.raise(L.y < 0.6 ? '你碰到了激光绊线！（跳过去）' : '你碰到了激光绊线！（蹲下钻过去）'); }
    }
    $('stealthHud').textContent = this.status();
  },
};
// 守卫的非战斗行为：巡逻 / 搜索（战斗交给原来的 AI）
{
  const _up = Enemy.prototype.update, _th = Enemy.prototype.takeHit, _die = Enemy.prototype.die;
  Enemy.prototype.update = function (dt) {
    if (this.ko && this.state === 'dead') this.t = Math.min(this.t, 1.6); // 被制伏的守卫留在原地
    const g = this.g;
    if (!g || g.mode === 'combat' || this.state !== 'loco' || this.dead) return _up.call(this, dt);
    // 自己走路（不拿出手令牌、不追玩家）
    const tg = this.target, A = this.anim; this.t += dt;
    let tx, tz, spd = 1.5, stop = false;
    if (g.mode === 'search' && g.last) {
      tx = g.last.x; tz = g.last.z; spd = g.det > 0.5 ? 2.6 : 1.9; g.searchT += dt;
      if (Math.hypot(tx - this.pos.x, tz - this.pos.z) < 1.2) { stop = true; g.look = Math.sin(g.searchT * 1.6) * 1.1; }
      if (g.det > 0.3 && SNEAK.canSee(this.pos.x, this.pos.z, this.yaw, g.range, g.half) > 0) stop = true; // 盯住可疑的方向
    } else if (g.route && g.route.length) {
      const w = g.route[g.wi]; tx = w[0]; tz = w[1];
      if (g.wait > 0) { g.wait -= dt; stop = true; if (g.wait <= 0) g.wi = (g.wi + 1) % g.route.length; }
      else if (Math.hypot(tx - this.pos.x, tz - this.pos.z) < 0.4) { g.wait = w[2] ?? 1.6; }
    } else stop = true;
    let fx = 0, fz = 0;
    if (g.det > 0.3 && g.last) { this.yaw += angDiff(this.yaw, Math.atan2(g.last.x - this.pos.x, g.last.z - this.pos.z)) * (1 - Math.exp(-dt * 4)); }
    if (!stop && tx != null) { const dx = tx - this.pos.x, dz = tz - this.pos.z, d = Math.hypot(dx, dz) || 1; fx = dx / d; fz = dz / d; if (!(g.det > 0.3)) this.yaw += angDiff(this.yaw, Math.atan2(dx, dz)) * (1 - Math.exp(-dt * 5)); }
    else if (g.route && g.route[g.wi] && g.route[g.wi][3] != null && !(g.det > 0.3)) this.yaw += angDiff(this.yaw, g.route[g.wi][3]) * (1 - Math.exp(-dt * 3));
    this.vel.x = lerp(this.vel.x, fx * spd, 1 - Math.exp(-dt * 6)); this.vel.z = lerp(this.vel.z, fz * spd, 1 - Math.exp(-dt * 6));
    const vm = Math.hypot(this.vel.x, this.vel.z); this.ph += dt * vm * 3.4;
    locoPose(tg, this.base, vm, this.ph, { noArmSwing: false }); A.update(tg, dt);
    this.vy -= 22 * dt; this.pos.y = Math.max(0, this.pos.y + this.vy * dt); if (this.pos.y === 0) this.vy = 0;
    this.pos.x += this.vel.x * dt; this.pos.z += this.vel.z * dt; collideCircle(this.pos, this.radius);
    this.rig.root.position.copy(this.pos); this.rig.root.rotation.y = this.yaw; driveSkinEnemy(this, dt);
    this.hb.style.display = 'none';
  };
  Enemy.prototype.takeHit = function (dmg, dir, m, kbMul, counter) {
    const g = this.g, unaware = g && g.mode !== 'combat' && !this.dead;
    if (unaware) { dmg = Math.round(dmg * 3); counter = true; showMove('偷袭！ 伤害 ×3', '#7fd8ff'); }
    _th.call(this, dmg, dir, m, kbMul, counter);
    if (g && !this.dead) SNEAK.toCombat(this, 'hit');
    if (g) SNEAK.fought = true;
  };
  Enemy.prototype.die = function (dir, m) {
    _die.call(this, dir, m);
    if (this.g) { this.g.cone.hide(); this.g.icon.style.display = 'none'; this.g.radio = null; }
    if (this.keepBody) this.ko = true;
  };
}
// ---------- 背后制伏（F） ----------
const TAKEDOWN_M = Object.assign({}, MOVES.push, { name: '背后制伏', dmg: 0, cost: 0, lunge: null, takedown: 1 });
function takedownTarget() {
  const p = player; if (p.state !== 'loco' || !p.grounded) return null;
  let best = null, bd = 1.7;
  for (const e of enemies) {
    if (e.dead || e.beast || e.T.elite || e.k === 'boss') continue;
    const unaware = e.g ? e.g.mode !== 'combat' : false, stunned = e.state === 'stagger' || (e.state === 'hit' && e.T.poise !== 1);
    if (!unaware && !stunned) continue;
    const d = Math.hypot(p.pos.x - e.pos.x, p.pos.z - e.pos.z); if (d > bd) continue;
    const behind = Math.abs(angDiff(e.yaw, Math.atan2(p.pos.x - e.pos.x, p.pos.z - e.pos.z)));
    if (behind < 1.9 && !(stunned && d < 1.4)) continue;
    best = e; bd = d;
  }
  return best;
}
function doTakedown() {
  const e = takedownTarget(); if (!e) return false;
  const p = player; p.yaw = p.yawTarget = Math.atan2(e.pos.x - p.pos.x, e.pos.z - p.pos.z);
  if (!startMove(TAKEDOWN_M)) return false;
  p.hitDone.forEach(s => enemies.forEach(o => s.add(o)));
  e.release(); e.keepBody = true; e.vel.set(0, 0, 0);
  if (e.g) e.g.radio = null;
  Story.timers.push({ t: 0.26, f: () => {
    if (e.dead) return;
    const dir = new THREE.Vector2(e.pos.x - p.pos.x, e.pos.z - p.pos.z).normalize();
    e.hp = 0; e.die(dir, TAKEDOWN_M); e.vel.multiplyScalar(0.25); e.vy = 1.5; e.ko = true;
    impact('hit', { heavy: true, counter: true, pos: e.pos }); hitstop = 0.09; shake = Math.max(shake, 0.12);
    floatText(e.pos.clone().setY(1.6), '制伏！', '#7fd8ff', 28); burst(e.pos.clone().setY(1.2), 0x7fd8ff, 18, 3);
    SNEAK.ko++; gameEvent('takedown', { e });
  } });
  return true;
}
addEventListener('keydown', e => {
  if (e.code !== 'KeyF' || e.repeat || !started || !locked || cutscene || gameOver || Bag.open) return;
  doTakedown();
}, { capture: true });

// ---------- 可交互物（电闸 / 控制台），按 E ----------
const Interact = {
  list: [], hold: null, holdT: 0,
  add(o) { this.list.push(Object.assign({ r: 1.5, on: true }, o)); return o; },
  near() { const p = player; return this.list.find(o => o.on && o.area === AREA.name && Math.hypot(p.pos.x - o.x, p.pos.z - o.z) < o.r) || null; },
  update(dt) {
    const o = started && !cutscene && !gameOver && player.state === 'loco' ? this.near() : null;
    const hb = $('hackBar');
    if (o && o.holdDur) {
      if (keys.KeyE) { o.prog = Math.min(1, (o.prog || 0) + dt / o.holdDur); if (o.tick) o.tick(dt); if (o.prog >= 1) { o.on = false; o.use(); } }
      hb.style.display = o.on ? 'block' : 'none'; hb.lastChild.style.width = ((o.prog || 0) * 100) + '%'; hb.firstChild.textContent = o.label;
      if (tipTimer <= 0) { $('tip').textContent = o.prompt; $('tip').style.opacity = 1; }
    } else {
      hb.style.display = 'none';
      if (o && tipTimer <= 0) { $('tip').textContent = o.prompt; $('tip').style.opacity = 1; }
      else if (tipTimer <= 0 && takedownTarget()) { $('tip').textContent = '按 F 背后制伏（悄无声息地放倒他）'; $('tip').style.opacity = 1; }
    }
  },
};
{
  const _pk = pickupOrDrop;
  pickupOrDrop = function () { const o = Interact.near(); if (o && !o.holdDur && player.state === 'loco') { o.on = false; o.use(); return; } if (o && o.holdDur) return; _pk(); };
}

// ---------- 小队：包抄站位 + 协同夹击 + 喊话 ----------
const SQUAD_BARK = ['包抄他！', '从后面上！', '一起上！', '左边！', '右边！', '别让他跑了！', '围住他！'];
const Squad = {
  t: 0, barkT: 4,
  update(dt) {
    if (!AREA.squad || cutscene) { if (this.t !== -1) { enemies.forEach(e => e.slot = null); this.t = -1; } return; }
    if (this.t < 0) this.t = 0;
    if ((this.t -= dt) > 0) return; this.t = 0.3;
    const p = player;
    const list = enemies.filter(e => !e.dead && !e.beast && (!e.g || e.g.mode === 'combat') && e.type !== 'dummy');
    list.forEach(e => e.slot = null);
    const free = list.filter(e => !e.holdToken && e.state === 'loco');
    const n = free.length; if (!n) return;
    const base = p.yaw + Math.PI; // 先占玩家背后
    const slots = [];
    for (let i = 0; i < n; i++) { const k = i === 0 ? 0 : (i % 2 ? 1 : -1) * Math.ceil(i / 2); const a = base + k * (TAU / Math.max(3, n + 1)); const R = 2.9 + (i > 3 ? 0.9 : 0);
      let x = p.pos.x + Math.sin(a) * R, z = p.pos.z + Math.cos(a) * R; x = clamp(x, AREA.cx - AREA.hx + 0.8, AREA.cx + AREA.hx - 0.8); z = clamp(z, AREA.cz - AREA.hz + 0.8, AREA.cz + AREA.hz - 0.8); slots.push({ x, z, a }); }
    const used = new Set();
    for (const s of slots) { let best = null, bd = 1e9; for (const e of free) { if (used.has(e)) continue; const d = Math.hypot(e.pos.x - s.x, e.pos.z - s.z); if (d < bd) { bd = d; best = e; } } if (best) { used.add(best); best.slot = s; } }
    // 夹击：有人正面出手时，背后那个提前出手
    const atk = list.find(e => e.holdToken && e.state === 'attack' && e.t < 0.2);
    if (atk) { const back = free.find(e => e.slot && Math.abs(angDiff(e.slot.a, base)) < 0.5 && Math.hypot(e.pos.x - p.pos.x, e.pos.z - p.pos.z) < 3.6); if (back && back.cd > 0.3) { back.cd = 0.3; if (Math.random() < 0.5) floatText(back.pos.clone().setY(2.3 * back.scale), '夹击！', '#ffb02a', 20); } }
    if ((this.barkT -= 0.3) <= 0 && n >= 2) { this.barkT = rand(5, 9); const e = free[Math.floor(rand(0, n))]; floatText(e.pos.clone().setY(2.35 * e.scale), SQUAD_BARK[Math.floor(rand(0, SQUAD_BARK.length))], '#e8e8e8', 19); }
  },
};

// ---------- 相机避障（墙/高障碍挡住时把相机拉近）+ 长地图阳光跟随 ----------
{
  const _uc = updateCamera;
  updateCamera = function (dt) {
    _uc(dt);
    if (cutscene || player.view !== 'third' || window.__camO) return;
    const p = player, ty = 1.4 + p.pos.y * 0.8, tx = p.pos.x, tz = p.pos.z;
    const cx = camera.position.x, cy = camera.position.y, cz = camera.position.z;
    let best = 1;
    for (const c of areaCols()) {
      const h = c.h ?? 3; if (h < 1.0 || c.noCam) continue;
      const t = segBox(tx, tz, cx, cz, c, 0.18); if (t < 0 || t >= best) continue;
      const y = ty + (cy - ty) * t; if (y < h + 0.15) best = t;
    }
    if (best < 1) { const k = Math.max(0.12, best - 0.04); camera.position.set(tx + (cx - tx) * k, ty + (cy - ty) * k, tz + (cz - tz) * k); camPos.copy(camera.position); }
  };
  const _ua = updateAreas;
  updateAreas = function (dt) {
    _ua(dt);
    if (AREA.follow) { const p = player; sun.position.set(p.pos.x - 20, 28, p.pos.z + 14); sun.target.position.set(p.pos.x, 0, p.pos.z); sun.target.updateMatrixWorld(); }
    EdgeArrows.update();
  };
  const _uw = updateWaves;
  updateWaves = function (dt) {
    const W = WAVES[wave], obj = W && W.objective && !waveDone && !gameOver;
    if (obj) waveDone = true; _uw(dt); if (obj) waveDone = false;
    Tele.update(dt); SNEAK.update(dt); Squad.update(dt);
    if (W && W.script && !waveDone && !gameOver) W.script(dt);
    if (obj && W.objective()) { waveDone = true; Story.onClear(wave); }
  };
  const _pu = updatePickups;
  updatePickups = function (dt) { _pu(dt); if (!cutscene) Interact.update(dt); };
  const _rs = Menu.resetSession.bind(Menu);
  Menu.resetSession = function () { _rs(); Tele.clear(); SNEAK.stop(); Interact.list.forEach(o => { if (o.reset) o.reset(); }); };
}
