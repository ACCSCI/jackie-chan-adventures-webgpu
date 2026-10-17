// ================= 大地图 5：可见边界栅栏、码头报亭、任务目标标记、全屏地图（M）与自定义标记、古董店自由进出 =================
const walkL = (d, x, z) => { let ok = false; for (const s of d.walk) if (shapeIn(s, x, z, 0)) { ok = true; break; } if (!ok) return false; if (d.hole) for (const s of d.hole) if (shapeIn(s, x, z, 0)) return false; return true; };
const inCol = (x, z, m = 0.3) => colliders.some(c => x >= c.x0 - m && x <= c.x1 + m && z >= c.z0 - m && z <= c.z1 + m);
// ---------- 栅栏：沿可走区域边界自动生成，让“空气墙”变成看得见的栏杆 ----------
WORLD.decorate = function (G, d, B) {
  const F = d.fence || { post: 0x5a3a22, rail: 0x8a6a4a }, gates = Object.values(d.gates), SP = 2.2, runs = [];
  const skip = (x, z) => gates.some(g => Math.hypot(g.x - x, g.z - z) < 5) || (d.noFence || []).some(([a, b, r]) => Math.hypot(a - x, b - z) < r);
  const line = (ax, az, bx, bz, nx, nz) => { const L = Math.hypot(bx - ax, bz - az), n = Math.max(1, Math.round(L / SP)), r = []; for (let i = 0; i <= n; i++) { const t = i / n; r.push([ax + (bx - ax) * t, az + (bz - az) * t, nx, nz]); } runs.push(r); };
  const arc = (cx, cz, R, a0, a1) => { const n = Math.max(3, Math.round(Math.abs(a1 - a0) * R / SP)), r = []; for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; r.push([cx + Math.cos(a) * R, cz + Math.sin(a) * R, Math.cos(a), Math.sin(a)]); } runs.push(r); };
  for (const s of d.walk) {
    if (s.nofence) continue;
    if (s.t === 'rect') { line(s.x0, s.z0, s.x1, s.z0, 0, -1); line(s.x1, s.z0, s.x1, s.z1, 1, 0); line(s.x1, s.z1, s.x0, s.z1, 0, 1); line(s.x0, s.z1, s.x0, s.z0, -1, 0); }
    else if (s.t === 'circ') arc(s.x, s.z, s.r, 0, TAU);
    else { const [ax, az] = s.a, [bx, bz] = s.b, L = Math.hypot(bx - ax, bz - az), ux = (bx - ax) / L, uz = (bz - az) / L, h = s.w / 2;
      for (const sd of [-1, 1]) { const nx = -uz * sd, nz = ux * sd; line(ax + nx * h, az + nz * h, bx + nx * h, bz + nz * h, nx, nz); }
      const b0 = Math.atan2(uz, ux); arc(bx, bz, h, b0 - Math.PI / 2, b0 + Math.PI / 2); arc(ax, az, h, b0 + Math.PI / 2, b0 + Math.PI * 1.5); }
  }
  const posts = [], rails = [], seen = new Set();
  for (const r of runs) {
    const ok = r.map(([x, z, nx, nz]) => walkL(d, x - nx * 0.4, z - nz * 0.4) && !walkL(d, x + nx * 0.9, z + nz * 0.9) && !inCol(d.x + x + nx * 0.3, d.z + z + nz * 0.3, 0.45) && !skip(x, z));
    r.forEach(([x, z, nx, nz], i) => {
      if (!ok[i]) return; const px = x + nx * 0.15, pz = z + nz * 0.15, k = Math.round(px * 2) + ',' + Math.round(pz * 2);
      if (!seen.has(k)) { seen.add(k); posts.push([px, pz]); }
      if (i + 1 < r.length && ok[i + 1]) { const [x2, z2, nx2, nz2] = r[i + 1]; rails.push([px, pz, x2 + nx2 * 0.15, z2 + nz2 * 0.15]); }
    });
  }
  if (!posts.length) return;
  const o = new THREE.Object3D(), pm = new THREE.InstancedMesh(new THREE.BoxGeometry(0.16, 1.15, 0.16).translate(0, 0.575, 0), M(F.post), posts.length);
  posts.forEach(([x, z], i) => { o.position.set(x, 0, z); o.rotation.set(0, 0, 0); o.scale.set(1, 1, 1); o.updateMatrix(); pm.setMatrixAt(i, o.matrix); });
  const rg = mergeGeometries([new THREE.BoxGeometry(1, 0.08, 0.07).translate(0, 1.0, 0), new THREE.BoxGeometry(1, 0.07, 0.06).translate(0, 0.52, 0)], false);
  const rm = new THREE.InstancedMesh(rg, M(F.rail), Math.max(1, rails.length));
  rails.forEach(([x0, z0, x1, z1], i) => { o.position.set((x0 + x1) / 2, 0, (z0 + z1) / 2); o.rotation.set(0, Math.atan2(-(z1 - z0), x1 - x0), 0); o.scale.set(Math.hypot(x1 - x0, z1 - z0) + 0.1, 1, 1); o.updateMatrix(); rm.setMatrixAt(i, o.matrix); });
  rm.count = rails.length; [pm, rm].forEach(m => { m.castShadow = false; m.receiveShadow = true; m.frustumCulled = false; G.add(m); });
  B.fence = { posts: posts.length, rails: rails.length };
};
Object.assign(WORLD.defs.bay, { fence: { post: 0x5a2418, rail: 0xa83a28 } });
Object.assign(WORLD.defs.nev, { fence: { post: 0x6a4a2a, rail: 0x9a7a52 } });
Object.assign(WORLD.defs.him, { fence: { post: 0x4a3020, rail: 0x7a5a3a } });
Object.assign(WORLD.defs.sky, { fence: { post: 0xd8b04a, rail: 0xf4ecd8 } });
WORLD.defs.him.walk[3].nofence = true; WORLD.defs.sky.walk.forEach(s => { if (s.t === 'seg') s.nofence = true; });
// 每张大地图的 build 之后：额外布景 + 栅栏（在合批之前）
for (const k in WORLD.defs) { const d = WORLD.defs[k], b = d.build; d.build = function (G, dd, B) { b.call(this, G, dd, B); if (dd.extra) dd.extra(G, dd, B); WORLD.decorate(G, dd, B); }; }
// 沙漠：可见地面与可走区域对齐，圆形区域补地面盘
WORLD.defs.nev.extra = function (G, d, B) {
  WB.ground(G, 124, 38, '#d8a070', '#e0b080', 12).position.set(0, 0.004, 168);
  WORLD.col(d, 61, 11, 79, 29, 40); WORLD.col(d, -79, 11, -61, 29, 40); // 红岩拱门的两条腿
  for (const s of d.walk) if (s.t === 'circ') { const m = mesh(new THREE.CircleGeometry(s.r + 1.2, 48), M(0xd6a070), s.x, 0.003, s.z, G, false); m.rotation.x = -Math.PI / 2; m.receiveShadow = true; }
};
// 喜马拉雅：村口到雪山栈道的山路补一条雪道
WORLD.defs.him.extra = function (G, d, B) {
  for (const i of [1, 5]) { const s = d.walk[i], L = Math.hypot(s.b[0] - s.a[0], s.b[1] - s.a[1]), m = box(s.w + 1.6, 6, L, M(0xeef2f8), (s.a[0] + s.b[0]) / 2, -3, (s.a[1] + s.b[1]) / 2, G); m.rotation.y = Math.atan2(s.b[0] - s.a[0], s.b[1] - s.a[1]); m.castShadow = false; m.receiveShadow = true; }
};
// 湾区：码头报亭（支线“号外！号外！”的终点）
WORLD.defs.bay.extra = function (G, d, B) {
  const K = new THREE.Group(); K.position.set(122.5, 0, 154.6); K.rotation.y = Math.PI; G.add(K);
  box(3.2, 2.5, 2.2, M(0x2a6a4a), 0, 1.25, 0, K); box(3.8, 0.22, 2.9, M(0xb8302a), 0, 2.62, 0.2, K); box(3.0, 0.9, 0.5, M(0x6a4a2a), 0, 0.45, 1.3, K);
  const paper = M(0xf4f0e4), red = M(0xd84a3a); for (let i = 0; i < 4; i++) { box(0.6, 0.12 + (i % 2) * 0.08, 0.4, i === 1 ? red : paper, -1.05 + i * 0.7, 0.96, 1.3, K); }
  for (let i = 0; i < 3; i++) box(0.5, 0.7, 0.03, i === 1 ? red : paper, -0.8 + i * 0.8, 1.8, 1.13, K);
  const sign = canvasTex(256, 64, (g, W, H) => { g.fillStyle = '#ffd04a'; g.fillRect(0, 0, W, H); g.fillStyle = '#7a1a10'; g.font = 'bold 40px "Noto Sans SC",sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('报亭 NEWS', W / 2, H / 2 + 2); });
  box(2.6, 0.5, 0.06, M(0xffffff, { map: sign, emissive: 0x332200 }), 0, 2.25, 1.13, K);
  const lb = labelSprite('码头报亭', '#9fe8ff', 0.9); lb.position.set(0, 4.1, 0); K.add(lb);
  WORLD.col(d, 120.8, 153.4, 124.2, 155.8, 3);
  // 补上几处没有碰撞的建筑：家具城、马戏团帐篷、火车站拱棚、起重机支腿、博物馆石柱
  WORLD.col(d, 170, -100, 240, -20, 22); WORLD.col(d, -126, -151, -94, -119, 8); WORLD.col(d, -131, -144, -89, -126, 8); WORLD.col(d, -119, -156, -101, -114, 8); WORLD.col(d, -250, -60, -170, -40, 30);
  for (const [x0, z0] of [[-77.6, 164.6], [-56, 164.6], [-56, 170.6], [-77.6, 170.6]]) WORLD.col(d, x0, z0, x0 + 13.6, z0 + 0.8, 30);
  WORLD.col(d, -111.4, 85.4, -107.1, 89.6, 40);
};
// ---------- 支线：收集进度存档 ----------
WORLD.save.got = WORLD.save.got || {}; WORLD.save.mark = WORLD.save.mark || {};
{
  const _st = Quest.start.bind(Quest), _fi = Quest.finish.bind(Quest), _set = Quest.set.bind(Quest), _tk = Quest.tick.bind(Quest);
  Quest.start = function (Q, quiet) {
    _st(Q, quiet); if (Q.q.type !== 'collect') return;
    const got = WORLD.save.got[Q.q.id] || []; Q.objs.forEach((o, i) => o.idx = i);
    Q.objs = Q.objs.filter(o => { if (got.includes(o.idx)) { scene.remove(o.g); return false; } return true; }); Q.got = got.length;
  };
  Quest.finish = function (Q) { delete WORLD.save.got[Q.q.id]; _fi(Q); };
  Quest.set = function (q, v) { if (v === '') delete WORLD.save.got[q.id]; _set(q, v); };
  Quest.tick = function (dt) {
    const before = this.list.map(Q => Q.q.type === 'collect' ? Q.objs.slice() : null); _tk(dt);
    this.list.forEach((Q, k) => { const b = before[k]; if (!b || b.length === Q.objs.length) return; const a = WORLD.save.got[Q.q.id] = WORLD.save.got[Q.q.id] || []; for (const o of b) if (!Q.objs.includes(o) && !a.includes(o.idx)) a.push(o.idx); if (this.st(Q.q) === 'on' || this.st(Q.q) === 'ret') WORLD.saveNow(); });
  };
}
// ---------- 任务目标：HUD 距离 + 小地图 + 3D 青色光柱 ----------
Quest.targets = function (Q) {
  const { q, o, d } = Q, s = this.st(q);
  if (s === 'ret') return [{ x: o.g.position.x, z: o.g.position.z }];
  if (s !== 'on') return [];
  if (q.type === 'reach') return [{ x: d.x + q.to.x, z: d.z + q.to.z }];
  if (q.type === 'collect') return Q.objs.map(c => ({ x: c.x, z: c.z }));
  return Q.foes.filter(e => !e.dead).map(e => ({ x: e.pos.x, z: e.pos.z }));
};
const nearest = (L) => { let b = null, m = 1e9; for (const t of L) { const v = Math.hypot(t.x - player.pos.x, t.z - player.pos.z); if (v < m) { m = v; b = t; } } return b ? Object.assign({ dist: m }, b) : null; };
Quest.objHTML = function () {
  let h = ''; for (const Q of this.list) { const { q } = Q, s = this.st(q); if (s !== 'on' && s !== 'ret') continue;
    const pr = s === 'ret' ? `回去找${q.giver.name}` : q.type === 'collect' ? `${q.item} ${Q.got}/${q.spots.length}` : q.type === 'reach' ? `送到${q.to.label} · 剩 ${Math.max(0, Math.ceil(Q.t))} 秒` : q.type === 'clear' ? `打跑 ${Q.foes.filter(e => !e.dead).length} 人` : '打赢他';
    const n = nearest(this.targets(Q)); h += `<span class="q">◆ ${q.title}：${pr}${n ? ` · <b style="color:#5ae8ff">${Math.round(n.dist)} 米</b>` : ''}</span>`; }
  const d = WORLD.cur, mk = d && WORLD.save.mark[d.key]; if (mk) h += `<span class="q" style="color:#d8a8ff">📍 标记点 · ${Math.round(Math.hypot(d.x + mk.x - player.pos.x, d.z + mk.z - player.pos.z))} 米</span>`;
  return h;
};
{
  const _md = Quest.mapDots.bind(Quest);
  Quest.mapDots = function (dot) {
    _md(dot);
    for (const Q of this.list) { const s = this.st(Q.q); if (s === 'on' && Q.q.type === 'duel') Q.foes.forEach(e => !e.dead && dot(e.pos.x, e.pos.z, '#ff5a4a', 4)); }
    const d = WORLD.cur, mk = d && WORLD.save.mark[d.key]; if (mk) dot(d.x + mk.x, d.z + mk.z, '#c07aff', 6, '◆');
  };
}
const Pillars = {
  pool: [],
  make() { const g = new THREE.Group(), m = new THREE.MeshBasicMaterial({ color: 0x5ae8ff, transparent: true, opacity: 0.4, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, fog: false, side: THREE.DoubleSide });
    mesh(new THREE.CylinderGeometry(0.22, 0.42, 70, 10, 1, true), m, 0, 35, 0, g, false);
    const r = mesh(new THREE.TorusGeometry(0.9, 0.05, 6, 32), new THREE.MeshBasicMaterial({ color: 0x9ff4ff, toneMapped: false, transparent: true, opacity: 0.9, fog: false }), 0, 0.08, 0, g, false); r.rotation.x = Math.PI / 2;
    g.userData = { m, r }; scene.add(g); return g; },
  show(list) {
    list.forEach((t, i) => { const g = this.pool[i] || (this.pool[i] = this.make()); g.visible = true; g.position.set(t.x, 0, t.z); const u = g.userData; u.m.color.set(t.c); u.r.material.color.set(t.c); u.m.opacity = 0.3 + 0.12 * Math.sin(now * 3 + i); u.r.scale.setScalar(1 + 0.2 * Math.sin(now * 4 + i)); });
    for (let i = list.length; i < this.pool.length; i++) this.pool[i].visible = false;
  },
};
{
  const _wt = WORLD.tick;
  WORLD.tick = function (dt) {
    _wt.call(this, dt); const d = this.cur; if (!d) { Pillars.show([]); return; }
    const L = [], p = player;
    for (const Q of Quest.list) for (const t of Quest.targets(Q)) L.push({ x: t.x, z: t.z, c: 0x5ae8ff, dist: Math.hypot(t.x - p.pos.x, t.z - p.pos.z) });
    L.sort((a, b) => a.dist - b.dist); L.length = Math.min(L.length, 8);
    const mk = this.save.mark[d.key];
    if (mk) { const x = d.x + mk.x, z = d.z + mk.z; if (Math.hypot(x - p.pos.x, z - p.pos.z) < 4) { delete this.save.mark[d.key]; this.saveNow(); toast('📍 到达标记点', 1.6); sfx('whoosh'); } else L.push({ x, z, c: 0xc07aff }); }
    Pillars.show(L.filter(t => t.dist == null || t.dist > 2.2));
  };
  const _lv = WORLD.leave;
  WORLD.leave = function () { _lv.call(this); Pillars.show([]); };
}
// ---------- 全屏地图（M）：缩放、拖动、放置自定义标记 ----------
document.head.insertAdjacentHTML('beforeend', `<style>
#wbig{position:fixed;inset:0;z-index:40;display:none;background:rgba(6,9,14,.94);user-select:none;touch-action:none}
#wbig canvas{position:absolute;inset:0;width:100%;height:100%;cursor:crosshair}
#wbig .hd{position:absolute;left:0;right:0;top:12px;text-align:center;color:#ffe9b0;font-size:24px;letter-spacing:5px;text-shadow:0 2px 8px #000;pointer-events:none}
#wbig .hd small{display:block;font-size:13px;letter-spacing:1px;color:#bbb;margin-top:2px}
#wbig .ft{position:absolute;left:0;right:0;bottom:12px;text-align:center;color:#bbb;font-size:13px;pointer-events:none;text-shadow:0 1px 3px #000}
#wbig .bt{position:absolute;right:16px;display:flex;flex-direction:column;gap:8px;top:14px}
#wbig .bt button{min-width:40px;height:36px;border-radius:10px;border:1px solid rgba(255,208,74,.6);background:rgba(0,0,0,.55);color:#ffd04a;font-size:15px;cursor:pointer;padding:0 10px}
#wbig .lg{position:absolute;left:16px;bottom:40px;color:#ddd;font-size:12px;line-height:1.7;background:rgba(0,0,0,.45);padding:8px 12px;border-radius:10px;pointer-events:none}
#wbig .lg i{display:inline-block;width:10px;height:10px;border-radius:50%;margin-right:6px;vertical-align:-1px}
</style>`);
document.body.insertAdjacentHTML('beforeend', `<div id="wbig"><canvas></canvas><div class="hd"></div><div class="bt"><button data-a="x">关闭</button><button data-a="in">＋</button><button data-a="out">－</button><button data-a="fit">全图</button><button data-a="clr">清除标记</button></div>
<div class="lg"><i style="background:#ffd04a"></i>目的地 ★<br><i style="background:#e6dcc8"></i>场景入口<br><i style="background:#9fe8ff"></i>支线 / 任务目标<br><i style="background:#ff5a4a"></i>任务敌人<br><i style="background:#c07aff"></i>你的标记<br><i style="background:#fff"></i>地标（◆已发现 ？未发现）</div>
<div class="ft">滚轮 / ＋－ 缩放 · 拖动平移 · 左键放置标记（点标记删除）· 右键清除标记 · M / Esc 关闭</div></div>`);
const WMap = {
  open: false, z: 1, fx: 0, fy: 0, cache: {}, el: $('wbig'),
  ctx() { if (WORLD.cur) return { d: WORLD.cur, here: null }; const d = typeof Travel !== 'undefined' && AREA && Travel.worldOf(AREA.name); return d ? { d, here: AREA.name } : null; },
  bake(d) {
    if (this.cache[d.key]) return this.cache[d.key];
    WORLD.build(d); const keep = { img: WHUD.img, S: WHUD.S, d: WHUD.d, X: WHUD.X, Z: WHUD.Z }; WHUD.bake(d);
    const r = { img: WHUD.img, S: WHUD.S, X: WHUD.X, Z: WHUD.Z }; Object.assign(WHUD, keep); return (this.cache[d.key] = r);
  },
  toggle(force) {
    const show = force ?? !this.open; if (show === this.open) return;
    if (show) { if (cutscene || gameOver || !started || Bag.open) return; const c = this.ctx(); if (!c) { tip('这里没有地图', 1.4); return; } this.c = c; this.b = this.bake(c.d); this.fit(); }
    this.open = show; this.el.style.display = show ? 'block' : 'none';
    for (const k in keys) keys[k] = false; buffer.type = null;
    if (show) { document.exitPointerLock(); const d = this.c.d; this.el.querySelector('.hd').innerHTML = `${d.title}<small>${d.sub || ''}</small>`; this.loop(); }
    else if (!(typeof TOUCH !== 'undefined' && TOUCH.on)) renderer.domElement.requestPointerLock();
  },
  size() { const cv = this.el.querySelector('canvas'), r = devicePixelRatio || 1, W = innerWidth, H = innerHeight; if (cv.width !== W * r || cv.height !== H * r) { cv.width = W * r; cv.height = H * r; } return { cv, r, W, H }; },
  fit() { const { W, H } = this.size(), im = this.b.img; this.z0 = Math.min(W / im.width, (H - 90) / im.height) * 0.94; this.z = this.z0; this.fx = im.width / 2; this.fy = im.height / 2; },
  zoomAt(k, sx, sy) { const { W, H } = this.size(); sx = sx ?? W / 2; sy = sy ?? H / 2; const ix = this.fx + (sx - W / 2) / this.z, iy = this.fy + (sy - H / 2) / this.z; this.z = clamp(this.z * k, this.z0 * 0.7, 8); this.fx = ix - (sx - W / 2) / this.z; this.fy = iy - (sy - H / 2) / this.z; },
  toImg(sx, sy) { const { W, H } = this.size(); return [this.fx + (sx - W / 2) / this.z, this.fy + (sy - H / 2) / this.z]; },
  toLocal(ix, iy) { const d = this.c.d, S = this.b.S; return [d.hx - (ix - 20) / S, d.hz - (iy - 20) / S]; },
  scr(lx, lz) { const { W, H } = this.size(); return [W / 2 + (this.b.X(lx) - this.fx) * this.z, H / 2 + (this.b.Z(lz) - this.fy) * this.z]; },
  loop() { if (!this.open) return; this.draw(); requestAnimationFrame(() => this.loop()); },
  draw() {
    const { cv, r, W, H } = this.size(), g = cv.getContext('2d'), d = this.c.d, b = this.b, cur = WORLD.cur === d;
    g.setTransform(r, 0, 0, r, 0, 0); g.clearRect(0, 0, W, H);
    g.save(); g.translate(W / 2 - this.fx * this.z, H / 2 - this.fy * this.z); g.scale(this.z, this.z); g.imageSmoothingEnabled = true; g.drawImage(b.img, 0, 0); g.restore();
    const txt = (s, x, y, col, sz = 13, al = 'center') => { g.font = `bold ${sz}px "Noto Sans SC",sans-serif`; g.textAlign = al; g.textBaseline = 'middle'; g.lineWidth = 4; g.strokeStyle = 'rgba(0,0,0,.8)'; g.strokeText(s, x, y); g.fillStyle = col; g.fillText(s, x, y); };
    const dot = (x, y, col, rr, t) => { g.fillStyle = col; g.beginPath(); g.arc(x, y, rr, 0, TAU); g.fill(); g.lineWidth = 1.5; g.strokeStyle = 'rgba(0,0,0,.7)'; g.stroke(); if (t) { g.font = `bold ${rr * 1.5}px sans-serif`; g.fillStyle = '#111'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(t, x, y + 0.5); } };
    const S = WORLD.save, pulse = 0.5 + 0.5 * Math.sin(performance.now() / 250);
    for (const m of d.marks || []) { const [x, y] = this.scr(m.x, m.z), f = S.disc[d.key + ':' + m.id]; txt(f ? '◆ ' + m.name : '？', x, y, f ? '#ffffff' : '#9a9a9a', f ? 12 : 15); }
    for (const k in d.gates) { const G = d.gates[k], [x, y] = this.scr(G.x, G.z), dst = Travel.dest && Travel.dest.to === k && cur;
      if (dst) { dot(x, y, '#ffd04a', 9 + pulse * 2, '★'); txt(G.label, x, y - 20, '#ffd04a', 15); }
      else { dot(x, y, '#e6dcc8', 5); txt(G.label, x, y - 14, '#ffe9b0', 12); }
      if (this.c.here === k) { g.strokeStyle = `rgba(255,90,74,${0.5 + pulse * 0.5})`; g.lineWidth = 3; g.beginPath(); g.arc(x, y, 14 + pulse * 6, 0, TAU); g.stroke(); txt('你在这里', x, y + 22, '#ff8a7a', 14); } }
    if (cur) for (const Q of Quest.list) { const s = Quest.st(Q.q), o = Q.o.g.position, [x, y] = this.scr(o.x - d.x, o.z - d.z);
      if (s === '' || s === 'ret') { dot(x, y, s === 'ret' ? '#7aff9a' : '#9fe8ff', 7, s === 'ret' ? '?' : '!'); txt(Q.q.giver.name, x, y - 16, '#9fe8ff', 11); }
      if (s === 'on') for (const t of Quest.targets(Q)) { const [tx, ty] = this.scr(t.x - d.x, t.z - d.z); dot(tx, ty, Q.q.type === 'clear' || Q.q.type === 'duel' ? '#ff5a4a' : '#5ae8ff', 5, Q.q.type === 'reach' ? '◎' : ''); if (Q.q.type === 'reach') txt(Q.q.to.label, tx, ty - 14, '#5ae8ff', 12); } }
    const mk = S.mark[d.key]; if (mk) { const [x, y] = this.scr(mk.x, mk.z); g.fillStyle = '#c07aff'; g.beginPath(); g.moveTo(x, y); g.arc(x, y - 16, 8, Math.PI * 0.8, Math.PI * 2.2); g.closePath(); g.fill(); g.strokeStyle = '#000'; g.lineWidth = 1.5; g.stroke(); dot(x, y - 16, '#fff', 3); txt('标记点', x, y - 32, '#d8a8ff', 12); }
    if (cur) { const [x, y] = this.scr(player.pos.x - d.x, player.pos.z - d.z); g.save(); g.translate(x, y); g.rotate(-camYaw); g.fillStyle = '#fff'; g.strokeStyle = '#000'; g.lineWidth = 2; g.beginPath(); g.moveTo(0, -11); g.lineTo(7.5, 8); g.lineTo(0, 4); g.lineTo(-7.5, 8); g.closePath(); g.stroke(); g.fill(); g.restore(); txt('你', x, y + 18, '#fff', 12); }
    txt('北 ↑', W - 80, H - 30, '#ffd04a', 14);
  },
  setMark(lx, lz) { const d = this.c.d; if (!walkL(d, lx, lz)) { const n = this.snap(d, lx, lz); if (!n) return tip('那里过不去', 1); [lx, lz] = n; } WORLD.save.mark[d.key] = { x: lx, z: lz }; WORLD.saveNow(); sfx('whoosh'); },
  snap(d, x, z) { let best = null, m = 1e9; for (let r = 1; r < 40; r += 1) { for (let a = 0; a < 16; a++) { const px = x + Math.cos(a / 16 * TAU) * r, pz = z + Math.sin(a / 16 * TAU) * r; if (walkL(d, px, pz)) { const v = r; if (v < m) { m = v; best = [px, pz]; } } } if (best) return best; } return null; },
  clear() { if (this.c) { delete WORLD.save.mark[this.c.d.key]; WORLD.saveNow(); } },
};
{
  const W = WMap, cv = W.el.querySelector('canvas'); let P = null;
  cv.addEventListener('wheel', e => { e.preventDefault(); W.zoomAt(e.deltaY < 0 ? 1.15 : 1 / 1.15, e.clientX, e.clientY); }, { passive: false });
  cv.addEventListener('contextmenu', e => { e.preventDefault(); W.clear(); });
  cv.addEventListener('pointerdown', e => { e.preventDefault(); P = { x: e.clientX, y: e.clientY, mv: 0, b: e.button }; cv.setPointerCapture(e.pointerId); });
  cv.addEventListener('pointermove', e => { if (!P) return; const dx = e.clientX - P.x, dy = e.clientY - P.y; P.mv += Math.abs(dx) + Math.abs(dy); P.x = e.clientX; P.y = e.clientY; if (P.mv > 5) { W.fx -= dx / W.z; W.fy -= dy / W.z; } });
  cv.addEventListener('pointerup', e => { if (!P) return; const p = P; P = null; if (p.mv > 5 || p.b !== 0) return;
    const mk = WORLD.save.mark[W.c.d.key]; if (mk) { const [x, y] = W.scr(mk.x, mk.z); if (Math.hypot(x - e.clientX, y - 16 - e.clientY) < 16 || Math.hypot(x - e.clientX, y - e.clientY) < 10) { W.clear(); return; } }
    const [lx, lz] = W.toLocal(...W.toImg(e.clientX, e.clientY)); W.setMark(lx, lz); });
  W.el.querySelector('.bt').addEventListener('click', e => { const a = e.target.dataset.a; if (a === 'x') W.toggle(false); else if (a === 'in') W.zoomAt(1.3); else if (a === 'out') W.zoomAt(1 / 1.3); else if (a === 'fit') W.fit(); else if (a === 'clr') W.clear(); });
}
// ---------- 古董店：旅行途中可以随时进去，把古董交给老爹 ----------
const Visit = {
  on: false, busy: false, armed: false, door0: null,
  gate() { const d = WORLD.cur; return d && d.gates.shop ? { d, G: d.gates.shop } : null; },
  check() {
    const s = this.gate(); if (!s || this.busy || cutscene || Travel.busy || !Travel.dest || Travel.dest.to === 'shop' || MODE !== 'story') return;
    const { d, G } = s, dist = Math.hypot(player.pos.x - d.x - G.x, player.pos.z - d.z - G.z);
    if (dist > 4.6) this.armed = true; else if (this.armed && dist < 2.3) this.enter();
  },
  enter() {
    const { d } = this.gate(); this.busy = true; this.armed = false; player.vel.set(0, 0, 0); $('fade').style.opacity = 1; Beacon.hide(); sfx('whoosh');
    setTimeout(() => {
      this.wkey = d.key; this.night = WORLD.night; WORLD.leave(); applyArea('shop');
      Story.putPlayer(SC.x, SC.z + SHOP.hz - 1.5, Math.PI); uncle.place(SC.x, SC.z - 5.3, 0); jade.hide();
      this.door0 = shopDoors.map(s => s.target); this.on = true; this.busy = false; this.greet = true; $('fade').style.opacity = 0;
      banner('老爹古董店<small>走到老爹面前按 E 交古董 · 从门口出去继续旅程 · T 直接前往目的地</small>', 3);
    }, 650);
  },
  exit() {
    this.busy = true; $('fade').style.opacity = 1; sfx('whoosh');
    setTimeout(() => {
      this.reset(); const d = WORLD.defs[this.wkey || 'bay']; WORLD.enter(d.key, this.night); uncle.hide(); jade.hide();
      const G = d.gates.shop, y = G.yaw || 0; Story.putPlayer(d.x + G.x + Math.sin(y) * 3.6, d.z + G.z + Math.cos(y) * 3.6, y); camYaw = player.yaw;
      if (Travel.dest) { const D = Travel.dest.gate; Beacon.show(d.x + D.x, d.z + D.z); }
      this.busy = false; $('fade').style.opacity = 0;
    }, 650);
  },
  reset() { if (this.on && this.door0) shopDoors.forEach((s, i) => s.target = this.door0[i] ?? 0); this.on = false; this.door0 = null; $('wtalk').style.display = 'none'; },
  near() { return Math.hypot(player.pos.x - uncle.pos.x, player.pos.z - uncle.pos.z) < 2.7; },
  tick() {
    if (!this.on) return; const p = player, el = $('wtalk');
    const atDoor = Math.abs(p.pos.x - SC.x) < 2.6 && p.pos.z > SC.z + SHOP.hz - 3.2; shopDoors.forEach(s => s.target = atDoor ? 1.75 : 0);
    if (!cutscene && !this.busy) {
      if (this.greet) { this.greet = false; Story.play([{ who: 'uncle', text: '成龙！不去干正事，跑回来做什么？' }], () => { }); return; }
      if (Math.abs(p.pos.x - SC.x) < 1.8 && p.pos.z > SC.z + SHOP.hz - 0.95) { this.exit(); return; }
    }
    uncle.yawT = Math.atan2(p.pos.x - uncle.pos.x, p.pos.z - uncle.pos.z);
    if (this.near() && !cutscene && !this.busy) { const n = Inv.count('relic'), t = n ? `E · 把古董交给老爹（${n} 件）` : 'E · 和老爹说话'; if (el.textContent !== t) el.textContent = t; el.style.display = 'block'; } else el.style.display = 'none';
  },
  talk() {
    const n = Inv.count('relic'); $('wtalk').style.display = 'none';
    if (!n) return Story.play([{ who: 'uncle', text: '没有古董就别来烦我，我在算账！' }], () => { });
    Story.play([{ who: 'jackie', text: '老爹，我给你带了点好东西。' }, { who: 'uncle', text: n > 1 ? '这么多古董！好！好！统统放到架子上去——别打碎了！' : '嗯？这可是宋代的！成龙，你总算干了件正事！' }], () => {
      if (!Inv.take('relic', n)) return; const S = WORLD.save, b = S.relicGiven | 0; S.relicGiven = b + n; WORLD.saveNow(); Bag.render && Bag.render();
      LV.gain(60 * n, new THREE.Vector3(player.pos.x, 2.2, player.pos.z), '古董'); burst(new THREE.Vector3(uncle.pos.x, 1.4, uncle.pos.z), 0x7fe9ff, 24);
      const sc = Math.floor(S.relicGiven / 3) - Math.floor(b / 3), left = 3 - S.relicGiven % 3;
      if (sc > 0) setTimeout(() => Story.play([{ who: 'uncle', text: '拿着，这卷武学残卷是我压箱底的宝贝，好好练！' }], () => Inv.add('scroll', sc)), 300);
      else toast(`交给老爹 ${n} 件古董（累计 ${S.relicGiven} 件）<small>再交 ${left} 件，老爹会送你一卷武学残卷</small>`, 2.6);
    });
  },
};
{
  const _wt = WORLD.tick; WORLD.tick = function (dt) { _wt.call(this, dt); if (this.cur) Visit.check(); };
  const _uw = updateWaves; updateWaves = function (dt) { _uw(dt); if (Visit.on) Visit.tick(dt); };
  const _ar = Travel.arrive.bind(Travel); Travel.arrive = function () { if (Visit.on) { Visit.reset(); uncle.hide(); } return _ar(); };
  const _fa = Travel.fast.bind(Travel); Travel.fast = function () { if (Visit.on && !Visit.busy && !cutscene && this.dest && !this.busy) { player.vel.set(0, 0, 0); return this.arrive(); } return _fa(); };
  const _rs = Menu.resetSession.bind(Menu); Menu.resetSession = function () { Visit.reset(); Visit.busy = false; Visit.armed = false; if (WMap.open) WMap.toggle(false); return _rs(); };
  const _go = Travel.go.bind(Travel); Travel.go = function () { Visit.armed = false; return _go(...arguments); };
}
addEventListener('keydown', e => {
  if (!started || cutscene || e.repeat) return;
  if (e.code === 'KeyE' && Visit.on && Visit.near() && !Visit.busy) { e.stopImmediatePropagation(); e.preventDefault(); Visit.talk(); }
  else if (e.code === 'KeyT' && Visit.on && Travel.dest) Travel.fast();
}, true);
$('wtalk').addEventListener('pointerdown', e => { if (Visit.on && Visit.near() && !cutscene) { e.preventDefault(); e.stopPropagation(); Visit.talk(); } });
// 古董来源：几个宝箱里也藏着古董（每交 3 件，老爹送一卷武学残卷）
for (const [w, id] of [['bay', 'b3'], ['bay', 'b5'], ['nev', 'n4'], ['him', 'h4'], ['sky', 's4']]) { const c = WORLD.defs[w].chests.find(c => c.id === id); if (c) c.items = Object.assign({}, c.items, { relic: 1 }); }
setTimeout(() => { if (window.__game) Object.assign(window.__game, { WMap, Visit, Pillars, shopDoors, SC, SHOP, __shapeIn: shapeIn }); }, 0);
