// ================= 第六集 · 牛之护身符「家具城战神」：家具城卖场 / 样板间衣柜 / 装卸区；家具武器、可破坏家具、拉索·牛力 =================
const FC = { x: 420, z: 400, hx: 15, hz: 12, h: 7 };
const KT = { x: 420, z: 520, hx: 12, hz: 10, h: 6 };
const LD = { x: 420, z: 640, hx: 15, hz: 13, h: 9 };
// ---------- 新武器：折叠椅 / 冰箱门 / 落地灯 ----------
WEAPONS.push(
  { name: '折叠椅', cls: 'short', range: 0.45, dmg: 2.0, dur: 9, sound: 'clang', len: 0.7, kind: 'chair' },                 // 10
  { name: '冰箱门', cls: 'short', range: 0.5, dmg: 2.2, dur: 14, sound: 'clang', len: 0.8, kind: 'fridge', shield: 1 },     // 11
  { name: '落地灯', cls: 'staff', range: 1.0, dmg: 1.35, dur: 12, sound: 'hit', len: 1.3, kind: 'lampW', fragile: 1 },     // 12
);
const W_CHAIR = 10, W_FRIDGE = 11, W_LAMP = 12;
Object.assign(MAT, { chair: 'chair', fridge: 'fridge', lampW: 'lampW' });
{
  const _wm = weaponMesh;
  weaponMesh = function (i) {
    const k = WEAPONS[i].kind; if (k !== 'chair' && k !== 'fridge' && k !== 'lampW') return _wm(i);
    const g = new THREE.Group(), steel = MS(0x9aa2ac, { metalness: .7, roughness: .35 });
    const rod = (len, x, y, z, mat, r = 0.014) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 8), mat); m.rotation.x = Math.PI / 2; m.position.set(x, y, z); g.add(m); return m; };
    if (k === 'chair') { // 握住椅背横杆，椅面朝前
      [-0.17, 0.17].forEach(x => { rod(0.95, x, 0, 0.42, steel); rod(0.62, x, -0.05, 0.5, steel).rotation.x = Math.PI / 2 + 0.5; });
      rod(0.36, 0, 0, -0.02, steel).rotation.set(0, 0, Math.PI / 2);
      const seat = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.035, 0.38), M(0x3a5a8a)); seat.position.set(0, 0.02, 0.5); g.add(seat);
      const back = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.03, 0.2), M(0x3a5a8a)); back.position.set(0, 0.01, 0.1); g.add(back);
    } else if (k === 'fridge') { // 冰箱门：白色面板 + 把手 + 内侧门架
      const door = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.05, 0.82), MS(0xeef2f4, { metalness: .2, roughness: .3 })); door.position.set(0, 0.05, 0.36); g.add(door);
      const gasket = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.02, 0.78), M(0x8a9098)); gasket.position.set(0, 0.085, 0.36); g.add(gasket);
      [0.12, 0.36, 0.6].forEach(z => { const s = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.07, 0.02), MS(0xd8e8f0, { transparent: true, opacity: .7 })); s.position.set(0, 0.12, z); g.add(s); });
      rod(0.3, 0, -0.02, 0.0, steel, 0.016);
      const logo = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.005, 0.04), M(0x2a6ad8)); logo.position.set(0, 0.024, 0.68); g.add(logo);
      g.userData.door = door;
    } else { // 落地灯：杆 + 底座 + 灯罩
      rod(1.75, 0, 0, 0.45, steel, 0.016);
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.15, 0.04, 16), M(0x2a2a2e)); base.rotation.x = Math.PI / 2; base.position.z = -0.42; g.add(base);
      const sh = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.2, 0.26, 16, 1, true), M(0xf4e2b8, { emissive: 0x4a3818, side: THREE.DoubleSide })); sh.rotation.x = -Math.PI / 2; sh.position.z = 1.32; g.add(sh);
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), glowMat(3, 2.6, 1.6)); bulb.position.z = 1.3; g.add(bulb);
    }
    g.traverse(o => { if (o.isMesh) o.castShadow = true; });
    return g;
  };
  // 家具武器打击声：主层是真实的家具碰撞声，叠在钝器底层上
  const _imp = impact, FM = { chair: ['chair', 'metal'], fridge: ['fridge', 'metal'], lampW: ['lamp', 'wood'] };
  impact = function (kind, o = {}) {
    const f = o && FM[o.mat];
    if (f && (kind === 'hit' || kind === 'break')) {
      const P = Impact.pan(o.pos);
      if (kind === 'hit') { Impact.layer(f[0], { vol: o.heavy ? 0.95 : 0.75, rate: (o.heavy ? 0.92 : 1.05) + Math.random() * 0.06, pan: P }); return _imp(kind, Object.assign({}, o, { mat: f[1] })); }
      Impact.layer(f[0] === 'lamp' ? 'lamp' : 'junk', { vol: 1, pan: P }); Impact.layer('woodBrk', { vol: 0.5, rate: 1.1, pan: P }); return;
    }
    return _imp(kind, o);
  };
}
// 冰箱门 = 盾牌：举着格挡时，正面的红色（不可格挡）攻击也能挡下（抓取除外）
{
  const _pth = playerTakeHit;
  playerTakeHit = function (e, dmg, opts = {}) {
    const p = player, w = p.weapon && WEAPONS[p.weapon.type];
    if (w && w.shield && p.guard && opts.unblockable && !opts.grab && p.state !== 'dead' && !cutscene && p.iframe <= 0 && e && e.pos && hitSide(p.yaw, e.pos.x, e.pos.z, p.pos.x, p.pos.z) !== 1) {
      floatText(p.pos.clone().setY(1.9), '冰箱门挡住了！', '#bfe8ff', 26); Foley.at('fridge', p.pos, { vol: 1, rate: 0.85 });
      shake = Math.max(shake, 0.25); burst(p.pos.clone().setY(1.2), 0xdfefff, 16, 4);
      p.weapon.dur -= 3; if (p.weapon.dur <= 0) { breakWeapon(); tip('冰箱门被打烂了！', 1.6); } else refreshChips();
      FURN.shieldN = (FURN.shieldN || 0) + 1;
      return _pth(e, Math.round(dmg * 0.4), Object.assign({}, opts, { unblockable: 0, kd: 0 }));
    }
    return _pth(e, dmg, opts);
  };
}

// ---------- 可破坏家具 ----------
const FURN = { list: [], debris: [], bill: 0, broke: 0, told: {}, shieldN: 0 };
const PG6 = new THREE.Group(); scene.add(PG6);
BATCH.push({ group: PG6, cx: FC.x, cz: KT.z, r: 5000 });
const cardM = M(0xc49a62), cardD = M(0xa8804c), tapeM = M(0xd8c8a0), steelM = MS(0x8a929c, { metalness: .6, roughness: .45 }), orangeM = M(0xe07a2a);
const boxTex = canvasTex(128, 128, (g, W) => { g.fillStyle = '#c49a62'; g.fillRect(0, 0, W, W); g.fillStyle = '#d8c8a0'; g.fillRect(0, W * 0.44, W, W * 0.12); g.strokeStyle = 'rgba(60,40,20,.5)'; g.lineWidth = 3; g.strokeRect(3, 3, W - 6, W - 6); g.fillStyle = 'rgba(40,30,20,.55)'; g.font = 'bold 22px sans-serif'; g.fillText('↑↑', 12, 30); g.fillText('易碎', 70, 110); });
const cboxM = M(0xffffff, { map: boxTex });
function mkBoxes(n = 3) { const g = new THREE.Group(); let y = 0; for (let i = 0; i < n; i++) { const s = rand(0.55, 0.8); box(s, s * 0.8, s, cboxM, rand(-0.08, 0.08), y + s * 0.4, rand(-0.08, 0.08), g).rotation.y = rand(-0.3, 0.3); y += s * 0.8; } g.userData.h = y; return g; }
function mkSofa(col) {
  const g = new THREE.Group(), c = M(col), d = M(new THREE.Color(col).multiplyScalar(0.75).getHex());
  box(2.2, 0.42, 0.95, c, 0, 0.32, 0, g); box(2.2, 0.6, 0.25, d, 0, 0.72, -0.38, g);
  [-1.02, 1.02].forEach(x => box(0.22, 0.6, 0.95, d, x, 0.45, 0, g));
  [-0.53, 0.53].forEach(x => box(1.0, 0.14, 0.75, M(new THREE.Color(col).multiplyScalar(1.1).getHex()), x, 0.6, 0.06, g));
  [[-1, -0.4], [1, -0.4], [-1, 0.4], [1, 0.4]].forEach(([x, z]) => box(0.08, 0.12, 0.08, M(0x2a1a10), x, 0.06, z, g));
  return g;
}
function mkLamp() { const g = new THREE.Group(); mesh(new THREE.CylinderGeometry(0.18, 0.2, 0.05, 16), M(0x2a2a2e), 0, 0.03, 0, g); mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.6, 8), steelM, 0, 0.82, 0, g); mesh(new THREE.CylinderGeometry(0.16, 0.3, 0.36, 16, 1, true), M(0xf4e2b8, { emissive: 0x6a5020, side: THREE.DoubleSide }), 0, 1.68, 0, g, false); mesh(new THREE.SphereGeometry(0.06, 8, 6), glowMat(3, 2.6, 1.6), 0, 1.62, 0, g, false); return g; }
function mkTable(col = 0x8a5a32) { const g = new THREE.Group(), w = M(col); box(1.6, 0.06, 0.9, w, 0, 0.74, 0, g); [[-0.72, -0.38], [0.72, -0.38], [-0.72, 0.38], [0.72, 0.38]].forEach(([x, z]) => box(0.06, 0.72, 0.06, w, x, 0.36, z, g)); box(0.3, 0.2, 0.3, M(0x5a8a5a), 0.3, 0.87, 0, g); mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.16, 10), MS(0xe8eef4, { metalness: .1, roughness: .2, transparent: true, opacity: .6 }), -0.4, 0.85, 0.1, g); return g; }
function mkShelf(len = 3.6) { // 货架：钢架 + 三层隔板 + 纸箱/货品
  const g = new THREE.Group(), H = 2.7;
  [-len / 2 + 0.05, len / 2 - 0.05].forEach(x => [-0.36, 0.36].forEach(z => box(0.07, H, 0.07, orangeM, x, H / 2, z, g)));
  [0.15, 1.0, 1.85, 2.65].forEach(y => box(len, 0.05, 0.8, steelM, 0, y, 0, g));
  for (const y of [0.18, 1.03, 1.88]) for (let x = -len / 2 + 0.45; x < len / 2 - 0.3; x += rand(0.6, 0.9)) { const s = rand(0.42, 0.62); box(s, s * 0.85, s * 0.9, Math.random() < 0.7 ? cboxM : M([0x6a8ab0, 0xb04a3a, 0x5a9a5a, 0xe8d8b0][Math.random() * 4 | 0]), x, y + s * 0.43, rand(-0.1, 0.1), g).rotation.y = rand(-0.2, 0.2); }
  return g;
}
function mkFridge() {
  const g = new THREE.Group(), wh = MS(0xeef2f4, { metalness: .2, roughness: .3 });
  box(0.9, 1.95, 0.75, wh, 0, 0.975, 0, g); box(0.86, 0.02, 0.02, M(0x9aa0a8), 0, 1.3, 0.38, g);
  const piv = new THREE.Group(); piv.position.set(-0.45, 0, 0.39); g.add(piv);
  const door = box(0.88, 1.9, 0.07, wh, 0.44, 0.97, 0.03, piv); box(0.04, 0.5, 0.05, steelM, 0.8, 1.4, 0.09, piv);
  const inside = box(0.8, 1.8, 0.02, glowMat(1.4, 1.5, 1.6), 0, 0.97, 0.36, g); inside.castShadow = false;
  g.userData.door = door; g.userData.piv = piv; return g;
}
function mkWardrobe(col = 0x7a5a3a) {
  const g = new THREE.Group(), w = M(col), dk = M(new THREE.Color(col).multiplyScalar(0.6).getHex());
  box(1.6, 2.3, 0.65, w, 0, 1.15, 0, g); box(1.66, 0.08, 0.7, dk, 0, 2.32, 0, g);
  const doors = [-1, 1].map(s => { const p = new THREE.Group(); p.position.set(s * 0.79, 0, 0.33); g.add(p); box(0.77, 2.15, 0.05, w, -s * 0.385, 1.15, 0.02, p); box(0.03, 0.3, 0.05, M(0xd8b04a), -s * 0.7, 1.2, 0.06, p); box(0.6, 1.6, 0.01, dk, -s * 0.385, 1.15, 0.05, p); return p; });
  box(1.5, 2.1, 0.02, M(0x1a1410), 0, 1.15, 0.29, g);
  g.userData.doors = doors; return g;
}
// 注册一件家具：world 坐标、半宽/半深（已按朝向）、高度、类型、价格、耐打次数
function addFurn(area, g, x, z, hx, hz, h, kind, price, o = {}) {
  g.position.set(x, 0, z); PG6.add(g);
  const f = Object.assign({ area, g, x, z, hx, hz, h, kind, price, hp: o.hp ?? 2, hp0: o.hp ?? 2, broken: false, col: null, solid: o.solid !== false, solid0: o.solid !== false, ry: g.rotation.y }, o);
  if (f.solid) { f.col = { x0: x - hx, x1: x + hx, z0: z - hz, z1: z + hz, h }; colliders.push(f.col); if (o.pillar) f.col.pillar = true; }
  FURN.list.push(f); return f;
}
const FURN_SND = { boxes: 'boxHit', shelf: 'shelf', lamp: 'lamp', table: 'woodBrk', sofa: 'sofa', fridge: 'fridge', wardrobe: 'door', rack: 'shelf', crate: 'woodBrk', tv: 'lamp' };
function furnDebris(f, dir, n = 8, col) {
  const mats = f.kind === 'boxes' || f.kind === 'crate' ? [cboxM, cardD] : f.kind === 'lamp' || f.kind === 'tv' ? [M(0xf4e2b8), steelM] : f.kind === 'shelf' || f.kind === 'rack' ? [cboxM, steelM, orangeM] : [M(0x8a5a32), cardD];
  for (let i = 0; i < n; i++) {
    const s = rand(0.12, 0.38), m = box(s, s * rand(0.4, 1), s, mats[i % mats.length], f.x + rand(-f.hx, f.hx) * 0.6, rand(0.3, Math.min(2, f.h)), f.z + rand(-f.hz, f.hz) * 0.6, PG6);
    FURN.debris.push({ m, v: new THREE.Vector3((dir ? dir.x : 0) * rand(2, 5) + rand(-2.5, 2.5), rand(2.5, 6), (dir ? dir.y : 0) * rand(2, 5) + rand(-2.5, 2.5)), av: new THREE.Vector3(rand(-8, 8), rand(-8, 8), rand(-8, 8)), t: 0, s });
  }
  burst(new THREE.Vector3(f.x, Math.min(1.2, f.h * 0.5), f.z), col || 0xd8c098, 26, 5);
}
function breakFurn(f, dir, why) {
  if (f.broken) return; f.broken = true;
  if (f.col) { const i = colliders.indexOf(f.col); if (i >= 0) colliders.splice(i, 1); f.col = null; }
  f.g.visible = false; furnDebris(f, dir, f.kind === 'shelf' || f.kind === 'rack' ? 16 : 9);
  const pos = new THREE.Vector3(f.x, 1, f.z);
  Foley.at(FURN_SND[f.kind] || 'woodBrk', pos, { vol: 1 }); if (f.kind !== 'boxes') Foley.at('woodBrk', pos, { vol: 0.5, rate: 1.1, delay: 0.05 });
  impact('fall', { pos, big: f.kind === 'shelf' || f.kind === 'rack' }); shake = Math.max(shake, f.kind === 'rack' ? 0.5 : 0.18);
  if (f.price) { FURN.bill += f.price; FURN.broke++; floatText(pos.clone().setY(2.2), `赔偿 ¥${f.price}`, '#ffd27a', 20); }
  if (!FURN.told.bill && f.price && ['mall', 'kitchen', 'loading'].includes(f.area)) { FURN.told.bill = 1; Story.bark('pa', '顾客请注意：损坏商品，照价赔偿。'); }
  f.onBreak && f.onBreak(dir, why);
}
function furnReset(area) {
  for (const f of FURN.list) {
    if (area && f.area !== area) continue;
    f.broken = false; f.hp = f.hp0; f.g.visible = true; f.g.position.set(f.x, 0, f.z); f.g.rotation.set(0, f.ry, 0); f.fallT = null; f.solid = f.solid0;
    f.reset && f.reset();
    if (f.solid && !f.col) { f.col = { x0: f.x - f.hx, x1: f.x + f.hx, z0: f.z - f.hz, z1: f.z + f.hz, h: f.h }; if (f.pillar) f.col.pillar = true; colliders.push(f.col); }
  }
  FURN.debris.forEach(d => d.m.removeFromParent()); FURN.debris.length = 0;
}
// 点到家具 AABB 的距离
function furnDist(f, x, z) { const dx = Math.max(0, Math.abs(x - f.x) - f.hx), dz = Math.max(0, Math.abs(z - f.z) - f.hz); return Math.hypot(dx, dz); }
// 敌人被打飞撞上家具：额外伤害 + 家具坏掉；沙发会把人弹起来
function slamCheck() {
  for (const e of enemies) {
    if (e.cliff || e.type === 'dummy' || e.beast) continue;
    const sp = Math.hypot(e.vel.x, e.vel.z); if (sp < 3.2 || now - (e._slamT || -9) < 0.6) continue;
    for (const f of FURN.list) {
      if (f.broken || f.area !== AREA.name || f.kind === 'fridge' || f.kind === 'wardrobe' || f.fallT != null) continue;
      if (furnDist(f, e.pos.x, e.pos.z) > (e.radius || 0.4) + 0.35) continue;
      e._slamT = now; const dir = new THREE.Vector2(e.vel.x / sp, e.vel.z / sp);
      if (f.kind === 'sofa') { // 沙发：弹飞
        Foley.at('sofa', e.pos, { vol: 0.9 }); floatText(e.pos.clone().setY(2), '弹！', '#ffb0e0', 26);
        if (!e.dead) { e.takeHit(8, dir, { kb: 2, kd: 1, launch: 7.5, heavy: 1 }, 1, false); } e.vy = 7.5; FURN.bounce = (FURN.bounce || 0) + 1;
        if (!FURN.told.sofa) { FURN.told.sofa = 1; tip('把敌人打到沙发上——会被弹飞！', 2); }
        break;
      }
      const big = f.kind === 'shelf' || f.kind === 'rack' || f.kind === 'table';
      if (!e.dead) e.takeHit(big ? 22 : 14, dir, { kb: 1.5, kd: 1, heavy: 1 }, 1, false);
      floatText(e.pos.clone().setY(2.3), big ? '撞翻了！ +22' : '砸进纸箱！ +14', '#ffcf6a', 24); slowmo = Math.max(slowmo, 0.12);
      if (--f.hp <= 0 || f.kind !== 'shelf') breakFurn(f, dir, 'slam'); else { Foley.at('shelf', e.pos, { vol: 0.8 }); shake = 0.2; }
      if (!FURN.told.slam) { FURN.told.slam = 1; tip('环境打击！把敌人打飞撞上家具，伤害更高', 2.2); }
      break;
    }
  }
}
// 玩家的拳脚/武器打中家具
{
  const _phc = playerHitCheck;
  playerHitCheck = function (m, hi, st) {
    const r = _phc.apply(this, arguments);
    const p = player; if (!FURN.list.length || !p.hitDone || !p.hitDone[hi]) return r;
    let range = m.range || 1.5; if (m.wpn && p.weapon) range += WEAPONS[p.weapon.type].range;
    for (const f of FURN.list) {
      if (f.broken || f.area !== AREA.name || f.kind === 'sofa' || f.kind === 'fridge' || f.kind === 'wardrobe' || f.kind === 'rack' || f.fallT != null || p.hitDone[hi].has(f)) continue;
      const d = furnDist(f, p.pos.x, p.pos.z); if (d > range) continue;
      const a = Math.atan2(f.x - p.pos.x, f.z - p.pos.z); if (d > 0.4 && Math.abs(angDiff(p.yaw, a)) > (m.arc || 1) + 0.3) continue;
      p.hitDone[hi].add(f); f.hp -= m.heavy ? 2 : 1;
      const pos = new THREE.Vector3(f.x, 1, f.z);
      if (f.hp <= 0) breakFurn(f, new THREE.Vector2(Math.sin(p.yaw), Math.cos(p.yaw)), 'hit');
      else { Foley.at(FURN_SND[f.kind] || 'boxHit', pos, { vol: 0.6, rate: 1.1 }); f.g.rotation.z = rand(-0.05, 0.05); burst(pos, 0xd8c098, 6, 3); }
    }
    return r;
  };
}
function updateFurn(dt) {
  for (let i = FURN.debris.length - 1; i >= 0; i--) {
    const d = FURN.debris[i]; d.t += dt;
    if (d.m.position.y > d.s * 0.3 || d.v.y > 0) { d.v.y -= 20 * dt; d.m.position.addScaledVector(d.v, dt); d.m.rotation.x += d.av.x * dt; d.m.rotation.y += d.av.y * dt; d.m.rotation.z += d.av.z * dt; if (d.m.position.y < d.s * 0.3) { d.m.position.y = d.s * 0.3; d.v.y = Math.abs(d.v.y) > 2 ? -d.v.y * 0.3 : 0; d.v.x *= 0.5; d.v.z *= 0.5; d.av.multiplyScalar(0.4); } }
    if (d.t > 12) { d.m.removeFromParent(); FURN.debris.splice(i, 1); }
  }
  // 推倒的货架：倒下动画 + 砸中车道上的人
  for (const f of FURN.list) {
    if (f.fallT == null || f.fallT > 1) continue;
    f.fallT += dt * 1.6; const k = Math.min(1, f.fallT), e = k * k;
    f.g.rotation.set(0, 0, 0); f.g.rotation.y = f.ry; f.fallAxis === 'x' ? (f.g.rotation.x = f.fallS * e * Math.PI / 2 * 0.97) : (f.g.rotation.z = -f.fallS * e * Math.PI / 2 * 0.97);
    if (k >= 1 && !f.landed) { f.landed = 1; f.onLand && f.onLand(); }
  }
  if (!cutscene) slamCheck();
}

// ================= 家具城卖场 =================
const MALL = { stage: 0, fridges: [], shelves: [], told: {} };
const tileTex = (a, b, n = 8) => canvasTex(512, 512, (g, W) => { const s = W / n; for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) { g.fillStyle = (r + c) % 2 ? a : b; g.fillRect(c * s, r * s, s, s); } g.strokeStyle = 'rgba(0,0,0,.12)'; g.lineWidth = 2; for (let k = 0; k <= n; k++) { g.beginPath(); g.moveTo(0, k * s); g.lineTo(W, k * s); g.moveTo(k * s, 0); g.lineTo(k * s, W); g.stroke(); } for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(0,0,0,${Math.random() * .05})`; g.fillRect(Math.random() * W, Math.random() * W, 3, 3); } });
function mallBanner(txt, w, h, bg = '#d8282a', fg = '#ffe27a') { return new THREE.MeshBasicMaterial({ map: _tex.sign(txt, 512, Math.round(512 * h / w), bg, fg), side: THREE.DoubleSide }); }
(function buildMall() {
  const G = new THREE.Group(); G.position.set(FC.x, 0, FC.z); scene.add(G); AREA_GROUPS.mall = G;
  const { hx, hz, h } = FC;
  const ft = tileTex('#e8e4dc', '#d8d2c6', 8); ft.repeat.set(hx / 2.5, hz / 2.5);
  const fl = mesh(new THREE.PlaneGeometry(hx * 2, hz * 2), MS(0xffffff, { map: ft, roughness: 0.35, metalness: 0.05 }), 0, 0.002, 0, G, false); fl.rotation.x = -Math.PI / 2; fl.receiveShadow = true;
  // 黄色导购路线（地面箭头）
  const path = M(0xf0c020, { emissive: 0x302400 });
  for (let z = hz - 2; z > -hz + 2; z -= 2.2) { const a = box(0.5, 0.01, 1.2, path, 0, 0.006, z, G); a.castShadow = false; }
  const wallM = M(0xf2efe8), stripe = M(0x2a62c8), ceilM = M(0xe8e8ea);
  const W = (x0, z0, x1, z1, mat = wallM) => wallBox(G, x0, z0, x1, z1, h, mat, { noShadow: true });
  W(-hx - 0.3, -hz - 0.3, hx + 0.3, -hz); W(-hx - 0.3, hz, -2.5, hz + 0.3); W(2.5, hz, hx + 0.3, hz + 0.3); W(-hx - 0.3, -hz, -hx, hz); W(hx, -hz, hx + 0.3, hz);
  [[0, -hz + 0.02, 0, hx * 2], [0, hz - 0.02, Math.PI, hx * 2], [-hx + 0.02, 0, Math.PI / 2, hz * 2], [hx - 0.02, 0, -Math.PI / 2, hz * 2]].forEach(([x, z, ry, w]) => { plane(w, 0.5, stripe, x, 1.2, z, ry, G); plane(w, 0.12, M(0xf0c020), x, 1.5, z, ry, G); });
  const ceil = mesh(new THREE.PlaneGeometry(hx * 2, hz * 2), ceilM, 0, h, 0, G, false); ceil.rotation.x = Math.PI / 2;
  const lampM = glowMat(2.2, 2.1, 1.9);
  for (let x = -hx + 3; x <= hx - 3; x += 5) for (let z = -hz + 3; z <= hz - 3; z += 4.5) { box(1.8, 0.06, 0.5, lampM, x, h - 0.04, z, G).castShadow = false; lightPool(x, z, 2.6, new THREE.Color(0.14, 0.13, 0.11), G); }
  // 招牌 + 开业横幅
  plane(9, 1.5, mallBanner('龙 城 家 具 城', 9, 1.5, '#2a62c8', '#ffe27a'), 0, h - 1.4, -hz + 0.06, 0, G);
  plane(10, 1.1, mallBanner('开业大酬宾 · 全场五折', 10, 1.1), 0, h - 2.1, hz - 0.06, Math.PI, G);
  plane(5, 0.9, mallBanner('客厅 · 沙发区', 5, 0.9, '#f0c020', '#2a2a2a'), -hx + 0.06, 4.2, 3, Math.PI / 2, G);
  plane(5, 0.9, mallBanner('家电 · 冰箱', 5, 0.9, '#f0c020', '#2a2a2a'), hx - 0.06, 4.2, -5, -Math.PI / 2, G);
  for (let i = -3; i <= 3; i++) { const f = mesh(new THREE.ConeGeometry(0.35, 0.6, 3), M([0xd8282a, 0xf0c020, 0x2a62c8][(i + 3) % 3]), i * 3, h - 0.6, 0, G, false); f.rotation.x = Math.PI; }
  // 入口收银台
  [[-6, hz - 2.5], [6, hz - 2.5]].forEach(([x, z]) => { box(2.4, 1.0, 0.8, M(0xf2efe8), x, 0.5, z, G); box(2.5, 0.06, 0.9, M(0x2a62c8), x, 1.03, z, G); box(0.4, 0.3, 0.3, M(0x2a2a2e), x + 0.6, 1.2, z, G); addColH(G, x - 1.2, x + 1.2, z - 0.4, z + 0.4, 1.1); });
  // 立柱
  [[-7.5, -2], [7.5, -2], [-7.5, 6], [7.5, 6]].forEach(([x, z]) => { box(0.7, h, 0.7, M(0xdcd8d0), x, h / 2, z, G); plane(0.71, 0.4, stripe, x, 1.2, z + 0.36, 0, G); addColH(G, x - 0.35, x + 0.35, z - 0.35, z + 0.35, h).pillar = true; });
  // 地毯（沙发区）
  const rug = mesh(new THREE.PlaneGeometry(7, 6), M(0x8a3a3a), -10.5, 0.01, 3, G, false); rug.rotation.x = -Math.PI / 2; rug.receiveShadow = true;
  const rug2 = mesh(new THREE.PlaneGeometry(6, 5), M(0x3a5a7a), 9.5, 0.01, 5, G, false); rug2.rotation.x = -Math.PI / 2;
  BATCH.push(Object.assign(staticBatch([G], new Set()), { cx: FC.x, cz: FC.z, r: 90 }));
  BATCH.push({ group: G, cx: FC.x, cz: FC.z, r: 90 });
  // —— 可互动家具（世界坐标）——
  const X = x => FC.x + x, Z = z => FC.z + z;
  // 沙发区（西）：两张沙发 + 茶几 + 落地灯
  const s1 = mkSofa(0x5a7aa8); addFurn('mall', s1, X(-11), Z(1), 1.1, 0.48, 0.9, 'sofa', 0, { hp: 99 });
  const s2 = mkSofa(0xa85a5a); s2.rotation.y = Math.PI; addFurn('mall', s2, X(-11), Z(5.5), 1.1, 0.48, 0.9, 'sofa', 0, { hp: 99 });
  addFurn('mall', mkTable(0x6a4a2a), X(-11), Z(3.25), 0.8, 0.45, 0.8, 'table', 899, { hp: 2 });
  [[-13.6, 1], [-13.6, 5.5], [-8.2, 0.6]].forEach(([x, z]) => addFurn('mall', mkLamp(), X(x), Z(z), 0.2, 0.2, 1.8, 'lamp', 299, { hp: 1, solid: false }));
  // 餐桌区（东南）
  [[8, 4], [11.5, 6.5]].forEach(([x, z]) => addFurn('mall', mkTable(), X(x), Z(z), 0.8, 0.45, 0.8, 'table', 1299, { hp: 2 }));
  // 纸箱堆
  [[-4, 6.5, 3], [4.2, 7.5, 2], [-3.5, -8.5, 3], [3.5, 1.5, 2], [11.5, -10, 3], [-12.5, -9.5, 3], [-1.6, 2.6, 2]].forEach(([x, z, n]) => addFurn('mall', mkBoxes(n), X(x), Z(z), 0.42, 0.42, 1.6, 'boxes', 199, { hp: 1 }));
  // 中央三排货架：按 E 推倒（往远离你的一侧倒）
  [-5, 0, 5].forEach((x, i) => {
    const g = mkShelf(3.6), f = addFurn('mall', g, X(x), Z(-4.5), 1.8, 0.42, 2.7, 'shelf', 3999, { hp: 3, pillar: true });
    MALL.shelves.push(f);
    f.reset = () => { f.landed = 0; f.ia.forEach(o => o.on = false); };
    f.onLand = () => {
      shake = 0.55; impact('fall', { pos: new THREE.Vector3(f.x, 0, f.z), big: true }); Foley.at('shelf', new THREE.Vector3(f.x, 0, f.z), { vol: 1 }); Foley.at('boxHit', new THREE.Vector3(f.x, 0, f.z), { vol: 0.8, delay: 0.08 });
      furnDebris(f, new THREE.Vector2(0, f.fallS), 14); FURN.bill += f.price; FURN.broke++; floatText(new THREE.Vector3(f.x, 2, f.z + f.fallS * 2), `赔偿 ¥${f.price}`, '#ffd27a', 20);
    };
    f.ia = [-1, 1].map(s => Interact.add({ area: 'mall', x: f.x, z: f.z + s * 1.05, r: 1.5, on: false, prompt: '按 E 推倒货架——车道上的人都会被砸倒', use() { pushShelf(f, -s); } }));
  });
  // 冰箱区（东墙）：按 E 拆下冰箱门
  [-9, -6.8, -4.6].forEach((z, i) => {
    const g = mkFridge(); g.rotation.y = -Math.PI / 2; const f = addFurn('mall', g, X(13.9), Z(z), 0.4, 0.45, 2, 'fridge', 2999, { hp: 99 });
    MALL.fridges.push(f);
    f.ia = Interact.add({ area: 'mall', x: f.x - 1.1, z: f.z, r: 1.3, on: true, prompt: '按 E 拆下冰箱门——举着它格挡，连红色攻击都能挡住！', use() { takeFridgeDoor(f); }, reset() { this.on = true; } });
    f.reset = () => { f.taken = 0; g.userData.door.visible = true; g.userData.piv.rotation.y = 0; };
  });
})();
AREA_DEF.mall = () => ({ cx: FC.x, cz: FC.z, hx: FC.hx - 0.5, hz: FC.hz - 0.5, room: true, h: FC.h, sun: 1.3, sunC: 0xfff4e0, hemi: [0xfff8f0, 0x8a8478, 1.45], fog: [0xd8d4cc, 30, 90], night: false, occl: 1, follow: 1, ep4: 1, squad: 1 });
function pushShelf(f, s) {
  if (f.fallT != null || f.broken) return;
  f.ia.forEach(o => o.on = false); f.fallT = 0; f.fallAxis = 'x'; f.fallS = s; f.solid = false;
  if (f.col) { const i = colliders.indexOf(f.col); if (i >= 0) colliders.splice(i, 1); f.col = null; }
  Foley.at('shelf', player.pos, { vol: 0.7, rate: 0.8 }); Foley.at('kJ', player.pos, { vol: 0.6 });
  // 车道：沿倒下方向，宽 = 货架长，长 = 高
  Tele.add({ shape: 'lane', x: f.x, z: f.z + s * 0.3, yaw: s > 0 ? 0 : Math.PI, w: 3.8, len: 3.1, wind: 0.5, col: 'amber', lock: 0,
    onFire: (T) => {
      let n = 0;
      for (const e of enemies) { if (e.dead || !Tele.inside(T, e.pos, e.radius || 0.4)) continue; n++; const dir = new THREE.Vector2(0, s); if (e.beast) e.takeHit(90, dir, { kb: 1 }, 1, false); else e.takeHit(65, dir, { kb: 4, kd: 1, heavy: 1, launch: 2 }, 1, false); floatText(e.pos.clone().setY(2.3), '货架砸中！ +65', '#ffcf6a', 26); }
      if (Tele.inside(T, player.pos) && player.pos.y < 1.5) playerTakeHit({ pos: new THREE.Vector3(f.x, 0, f.z), parried() { } }, 18, { kd: 1, unblockable: 1 });
      if (n >= 2) showMove(`货架砸倒 ${n} 人！`, '#ffcf6a'); MALL.shelfHits = (MALL.shelfHits || 0) + n;
    } });
}
function takeFridgeDoor(f) {
  const d = f.g.userData; if (f.taken) return; f.taken = 1; f.ia.on = false; d.piv.rotation.y = -1.9; Foley.at('fridgeOpen', player.pos, { vol: 0.9 });
  Story.timers.push({ t: 0.35, f: () => { d.door.visible = false; Foley.at('fridge', player.pos, { vol: 0.8 }); Foley.at('kJe', player.pos, { vol: 0.6 }); burst(new THREE.Vector3(f.x - 0.5, 1.2, f.z), 0xdfefff, 18, 3); const w = spawnWeapon(W_FRIDGE, f.x - 1.2, f.z); if (!player.weapon && Math.hypot(player.pos.x - w.pos.x, player.pos.z - w.pos.z) < 2.2) { groundWeapons.splice(groundWeapons.indexOf(w), 1); scene.remove(w.mesh); player.weapon = equipMesh({ type: W_FRIDGE, dur: w.dur }); if (player.mode !== 'fist') toggleMode(); tip('拿起了「冰箱门」——举着它格挡，红色攻击也能挡住！', 2.4); refreshChips(); } else tip('冰箱门掉在地上了——按 E 拾取', 2); FURN.bill += 999; } });
}
// 地上的折叠椅、落地灯
function mallWeapons() {
  [[-2.5, 9.5], [2.5, 9.5], [-9, -1.5], [9.5, 1.5], [0, -9], [-6.5, 9]].forEach(([x, z]) => spawnWeapon(W_CHAIR, FC.x + x, FC.z + z));
  [[-13, 8.5], [12.5, -1.5]].forEach(([x, z]) => spawnWeapon(W_LAMP, FC.x + x, FC.z + z));
}
function mallScript(dt) {
  const alive = enemies.filter(e => !e.dead).length;
  const at = (dx, dz) => [FC.x + dx, FC.z + dz];
  if (MALL.stage === 0 && alive <= 1) {
    MALL.stage = 1; banner('增援！<small>影武者从货架后面翻了出来</small>', 2.2);
    [['ninja', -9, -10], ['ninja', 9, -10], ['khan', 0, -10.5]].forEach(([t, dx, dz]) => { const [x, z] = at(dx, dz); const e = spawnAt(t, x, z); e.cd = 1.4; burst(e.pos.clone().setY(1), 0x5a3a8a, 18, 3); });
    MALL.shelves.forEach(f => f.ia.forEach(o => { if (f.fallT == null) o.on = true; }));
    tip('货架后面有人——站到货架旁按 E 把它推倒！', 2.6);
  } else if (MALL.stage === 1 && alive <= 1) {
    MALL.stage = 2; banner('最后一批！<small>芬恩和铁臂打手</small>', 2.2);
    [['finn', -2, 10], ['brute', 3, 10], ['thug', -6, 9]].forEach(([t, dx, dz]) => { const [x, z] = at(dx, dz); const e = spawnAt(t, x, z); e.cd = 1.6; burst(e.pos.clone().setY(1), 0xffffff, 18, 3); });
    Story.bark('finn', '成龙！这把椅子，坐着舒服吗？');
  }
}
window.__ep6 = { FC, KT, LD, FURN, MALL, breakFurn, pushShelf, takeFridgeDoor, furnReset, slamCheck };

// ================= 样板间 · 厨房与衣柜伏兵 =================
const WARD = { list: [], queue: 0, t: 0, slammed: 0, opened: 0, told: {} };
(function buildKitchen() {
  const G = new THREE.Group(); G.position.set(KT.x, 0, KT.z); scene.add(G); AREA_GROUPS.kitchen = G;
  const { hx, hz, h } = KT;
  const ft = _tex.planks(['#b8946a', '#a8845c', '#c49c70', '#ad8a62']); ft.repeat.set(hx / 3, hz / 3);
  const fl = mesh(new THREE.PlaneGeometry(hx * 2, hz * 2), MS(0xffffff, { map: ft, roughness: 0.55 }), 0, 0.002, 0, G, false); fl.rotation.x = -Math.PI / 2; fl.receiveShadow = true;
  const wallM = M(0xf4efe4), ceilM = M(0xeceae4), stripe = M(0x2a62c8);
  const W = (x0, z0, x1, z1, mat = wallM) => wallBox(G, x0, z0, x1, z1, h, mat, { noShadow: true });
  W(-hx - 0.3, -hz - 0.3, hx + 0.3, -hz); W(-hx - 0.3, hz, -2, hz + 0.3); W(2, hz, hx + 0.3, hz + 0.3); W(-hx - 0.3, -hz, -hx, hz); W(hx, -hz, hx + 0.3, hz);
  [[0, hz - 0.02, Math.PI, hx * 2], [-hx + 0.02, 0, Math.PI / 2, hz * 2], [hx - 0.02, 0, -Math.PI / 2, hz * 2]].forEach(([x, z, ry, w]) => plane(w, 0.3, stripe, x, 0.15, z, ry, G));
  const ceil = mesh(new THREE.PlaneGeometry(hx * 2, hz * 2), ceilM, 0, h, 0, G, false); ceil.rotation.x = Math.PI / 2;
  const lampM = glowMat(2.2, 2.0, 1.7);
  for (let x = -8; x <= 8; x += 4) for (const z of [-5, 1, 6]) { mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.06, 16), lampM, x, h - 0.04, z, G, false); lightPool(x, z, 2.4, new THREE.Color(0.15, 0.12, 0.08), G); }
  // 北墙：三套厨房样板间（地柜 + 吊柜 + 灶台 + 隔断）
  const cab = [0xf2efe8, 0x6a8a6a, 0xa8423a];
  [-7.5, 0, 7.5].forEach((x, i) => {
    const c = M(cab[i]), top = M(0x2a2a2e), back = plane(6.4, h, M([0xe8dcc4, 0xd8e4d8, 0xf0d8d0][i]), x, h / 2, -hz + 0.03, 0, G);
    box(6, 0.9, 0.65, c, x, 0.45, -hz + 0.35, G); box(6.05, 0.05, 0.7, top, x, 0.92, -hz + 0.35, G);
    box(6, 0.8, 0.38, c, x, 2.15, -hz + 0.2, G);
    for (let k = -2; k <= 2; k++) box(0.04, 0.3, 0.02, MS(0xc0c8d0, { metalness: .7 }), x + k * 1.2, 0.7, -hz + 0.68, G);
    box(0.7, 0.03, 0.5, M(0x1a1a1c), x - 1.4, 0.95, -hz + 0.35, G); [-0.15, 0.15].forEach(dx => mesh(new THREE.TorusGeometry(0.1, 0.012, 6, 16), M(0x5a5a5e), x - 1.4 + dx, 0.97, -hz + 0.35, G, false).rotation.x = Math.PI / 2);
    mesh(new THREE.CylinderGeometry(0.15, 0.13, 0.12, 14), MS(0x8a8e94, { metalness: .8, roughness: .3 }), x - 1.25, 1.03, -hz + 0.3, G);
    box(0.5, 0.04, 0.35, MS(0xd0d4d8, { metalness: .8, roughness: .2 }), x + 1.2, 0.93, -hz + 0.35, G);
    addColH(G, x - 3, x + 3, -hz, -hz + 0.7, 1);
    plane(2.6, 0.55, mallBanner(['简约北欧', '田园清新', '中式红韵'][i] + ' ¥' + [12999, 15999, 19999][i], 2.6, 0.55, '#ffffff', '#2a2a2a'), x, 3.2, -hz + 0.04, 0, G);
    if (i < 2) wallBox(G, x + 3.6, -hz, x + 3.9, -hz + 3.2, 2.6, M(0xdcd8d0), { noShadow: true });
  });
  // 中岛
  [[-5, -2.5], [5, -2.5]].forEach(([x, z]) => { box(2.6, 0.9, 1.1, M(0xf2efe8), x, 0.45, z, G); box(2.7, 0.06, 1.2, M(0x3a3a3e), x, 0.93, z, G); addColH(G, x - 1.3, x + 1.3, z - 0.55, z + 0.55, 1); });
  plane(6, 0.9, mallBanner('样板间 · 请勿入内', 6, 0.9, '#f0c020', '#2a2a2a'), 0, h - 1.2, hz - 0.05, Math.PI, G);
  BATCH.push(Object.assign(staticBatch([G], new Set()), { cx: KT.x, cz: KT.z, r: 80 }));
  BATCH.push({ group: G, cx: KT.x, cz: KT.z, r: 80 });
  const X = x => KT.x + x, Z = z => KT.z + z;
  // 衣柜：西墙三个朝东，东墙三个朝西
  [[-11.35, -4, Math.PI / 2], [-11.35, 0.5, Math.PI / 2], [-11.35, 5, Math.PI / 2], [11.35, -4, -Math.PI / 2], [11.35, 0.5, -Math.PI / 2], [11.35, 5, -Math.PI / 2]].forEach(([x, z, yaw], i) => {
    const g = mkWardrobe([0x7a5a3a, 0xe8e0d0, 0x4a3a2e][i % 3]); g.rotation.y = yaw;
    const f = addFurn('kitchen', g, X(x), Z(z), 0.34, 0.82, 2.4, 'wardrobe', 0, { hp: 99 });
    const w = { f, g, x: X(x), z: Z(z), yaw, state: 'idle', t: 0, cd: 0, tele: null, i };
    w.fx = w.x + Math.sin(yaw) * 1.05; w.fz = w.z + Math.cos(yaw) * 1.05;
    w.ia = Interact.add({ area: 'kitchen', x: w.fx, z: w.fz, r: 1.5, on: false, prompt: '按 E 把柜门踹回去！', use() { wardSlam(w); } });
    f.reset = () => { w.state = 'idle'; w.t = 0; w.cd = 0; w.ia.on = false; if (w.tele) { Tele.cancel(w.tele); w.tele = null; } g.userData.doors.forEach(d => d.rotation.y = 0); g.rotation.z = 0; g.position.x = w.x; };
    WARD.list.push(w);
  });
  // 餐桌 + 纸箱
  [[-2.5, 3], [2.5, 3], [0, 6.5]].forEach(([x, z]) => addFurn('kitchen', mkTable([0x8a5a32, 0xd8c8a8, 0x5a3a22][Math.abs(x) | 0 % 3]), X(x), Z(z), 0.8, 0.45, 0.8, 'table', 1599, { hp: 2 }));
  [[-8, 8], [8, 8], [-7.5, 2.5], [7.5, 2.5], [0, -5.5]].forEach(([x, z]) => addFurn('kitchen', mkBoxes(2 + (Math.random() * 2 | 0)), X(x), Z(z), 0.42, 0.42, 1.5, 'boxes', 199, { hp: 1 }));
})();
AREA_DEF.kitchen = () => ({ cx: KT.x, cz: KT.z, hx: KT.hx - 0.5, hz: KT.hz - 0.5, room: true, h: KT.h, sun: 1.2, sunC: 0xfff0d8, hemi: [0xfff4e8, 0x8a7a68, 1.4], fog: [0xd8d0c4, 28, 80], night: false, occl: 1, follow: 1, ep4: 1, squad: 1 });
function kitchenWeapons() { [[-5, -1.6], [5, -1.6], [0, -7.8]].forEach(([x, z]) => spawnWeapon(2, KT.x + x, KT.z + z)); [[-4.2, -3.2], [4.4, -3.2]].forEach(([x, z]) => spawnWeapon(8, KT.x + x, KT.z + z)); spawnWeapon(W_CHAIR, KT.x - 2.5, KT.z + 4.4); spawnWeapon(W_CHAIR, KT.x + 2.5, KT.z + 4.4); }
function wardShake(w) {
  w.state = 'shake'; w.t = 0; w.ia.on = true; WARD.queue--;
  w.tele = Tele.add({ shape: 'circle', x: w.fx, z: w.fz, r: 1.25, wind: 2.1, col: 'amber', onFire: () => { w.tele = null; wardOpen(w); } });
  if (!WARD.told.shake) { WARD.told.shake = 1; tip('衣柜在晃！冲过去按 E 把门踹回去——关门打狗！', 2.6); }
}
function wardSlam(w) {
  if (w.state !== 'shake') return;
  if (w.tele) { Tele.cancel(w.tele); w.tele = null; }
  w.state = 'idle'; w.cd = 5; w.ia.on = false; WARD.slammed++; kills++;
  const p = new THREE.Vector3(w.x, 1.2, w.z);
  w.g.userData.doors.forEach(d => d.rotation.y = 0); w.g.rotation.z = 0;
  Foley.at('door', p, { vol: 1, rate: 0.85 }); Foley.at('kN', p, { vol: 0.7, rate: 0.9, delay: 0.08 }); impact('hit', { heavy: true, pos: p });
  shake = 0.3; hitstop = 0.08; burst(p, 0xd8c098, 22, 4); floatText(p.clone().setY(2.6), '砰！关门！', '#ffd27a', 30);
  showMove('关门打狗！', '#ffd27a'); player.hp = Math.min(player.maxHp || 100, player.hp + 4);
  if (WARD.slammed === 1) Story.bark('jackie', '对不起！这个衣柜……有人了！');
}
function wardOpen(w) {
  w.state = 'open'; w.t = 0; w.ia.on = false; WARD.opened++;
  w.g.userData.doors.forEach((d, k) => d.rotation.y = (k ? -1 : 1) * 1.9); w.g.rotation.z = 0;
  const types = ['ninja', 'khan', 'ninja', 'thug'], e = spawnAt(types[WARD.opened % 4], w.fx, w.fz); e.cd = 0.5;
  Foley.at('door', new THREE.Vector3(w.fx, 1, w.fz), { vol: 0.9 }); burst(new THREE.Vector3(w.fx, 1, w.fz), 0x5a3a8a, 18, 3);
  if (Math.hypot(player.pos.x - w.fx, player.pos.z - w.fz) < 1.55) playerTakeHit(e, 12, {});
}
function kitchenScript(dt) {
  for (const w of WARD.list) {
    w.t += dt; w.cd -= dt;
    if (w.state === 'shake') { w.g.rotation.z = Math.sin(w.t * 38) * 0.02 * (0.5 + w.t); w.g.position.x = w.x + Math.sin(w.t * 31) * 0.03; if ((w.rat = (w.rat || 0) - dt) <= 0) { w.rat = rand(0.18, 0.32); Foley.at('door', new THREE.Vector3(w.x, 1, w.z), { vol: 0.35, rate: rand(1.2, 1.5) }); } }
    else if (w.state === 'open' && w.t > 2.4) { w.state = 'idle'; w.cd = 6; w.g.userData.doors.forEach(d => d.rotation.y = 0); w.g.position.x = w.x; }
  }
  const alive = enemies.filter(e => !e.dead).length, shaking = WARD.list.filter(w => w.state === 'shake').length;
  if ((WARD.t -= dt) <= 0 && WARD.queue > 0 && shaking < 2 && alive < 4) {
    const idle = WARD.list.filter(w => w.state === 'idle' && w.cd <= 0); if (idle.length) { wardShake(idle[Math.random() * idle.length | 0]); WARD.t = rand(2.6, 4.2); }
  }
}

// ================= 装卸区 =================
const DOCK6 = { proj: [], racks: [], told: {} };
(function buildLoading() {
  const G = new THREE.Group(); G.position.set(LD.x, 0, LD.z); scene.add(G); AREA_GROUPS.loading = G;
  const { hx, hz, h } = LD;
  const ft = _tex.concrete(); ft.repeat.set(hx / 4, hz / 4);
  const fl = mesh(new THREE.PlaneGeometry(hx * 2, hz * 2), MS(0xffffff, { map: ft, roughness: 0.85 }), 0, 0.002, 0, G, false); fl.rotation.x = -Math.PI / 2; fl.receiveShadow = true;
  const yl = M(0xe0b020, { emissive: 0x201800 }), dark = M(0x2a2c30), wallM = M(0x8a8e94), ceilM = M(0x3a3c40);
  for (const z of [-hz + 3.2, hz - 1.2]) { const s = box(hx * 2 - 1, 0.01, 0.25, yl, 0, 0.006, z, G); s.castShadow = false; }
  for (const x of [-hx + 1, hx - 1]) { const s = box(0.25, 0.01, hz * 2 - 2, yl, x, 0.006, 0, G); s.castShadow = false; }
  const W = (x0, z0, x1, z1, mat = wallM) => wallBox(G, x0, z0, x1, z1, h, mat, { noShadow: true });
  W(-hx - 0.3, -hz - 0.3, hx + 0.3, -hz); W(-hx - 0.3, hz, hx + 0.3, hz + 0.3); W(-hx - 0.3, -hz, -hx, hz); W(hx, -hz, hx + 0.3, hz);
  const ceil = mesh(new THREE.PlaneGeometry(hx * 2, hz * 2), ceilM, 0, h, 0, G, false); ceil.rotation.x = Math.PI / 2;
  for (let x = -hx + 2; x <= hx - 2; x += 4) box(0.25, 0.5, hz * 2, dark, x, h - 0.4, 0, G).castShadow = false;
  const lampM = glowMat(2.0, 1.9, 1.6);
  for (let x = -10; x <= 10; x += 5) for (const z of [-7, 0, 7]) { box(1.4, 0.1, 0.4, lampM, x, h - 0.7, z, G).castShadow = false; lightPool(x, z, 3, new THREE.Color(0.13, 0.12, 0.1), G); }
  // 北墙卷帘门（中间那扇半开，外面是货车）
  [-9, 0, 9].forEach((x, i) => {
    box(6, 0.4, 0.4, yl, x, 5.2, -hz + 0.2, G); [-3, 3].forEach(s => box(0.35, 5.2, 0.4, yl, x + s, 2.6, -hz + 0.2, G));
    const up = i === 1 ? 3.4 : 0, tex = _tex.rib('#7a7e84', '#6a6e74', 24);
    plane(5.6, 5 - up, M(0xffffff, { map: tex }), x, (5 - up) / 2 + up, -hz + 0.05, 0, G);
    plane(1.6, 0.5, mallBanner(`${i + 1} 号门`, 1.6, 0.5, '#e0b020', '#1a1a1a'), x, 5.75, -hz + 0.42, 0, G);
  });
  box(5.2, 3.2, 0.2, M(0x0c0e12), 0, 1.7, -hz - 0.4, G);
  // 叉车
  const fk = new THREE.Group(); fk.position.set(11, 0, 8.5); fk.rotation.y = -2.4; G.add(fk);
  box(1.3, 0.9, 2, M(0xe0a020), 0, 0.75, 0, fk); box(1.2, 1.2, 0.08, dark, 0, 1.8, -0.2, fk); [-0.55, 0.55].forEach(x => { box(0.08, 2.4, 0.08, dark, x, 1.2, 1.05, fk); box(0.12, 0.05, 1.1, dark, x * 0.6, 0.1, 1.6, fk); });
  [[-0.7, -0.6], [0.7, -0.6], [-0.7, 0.6], [0.7, 0.6]].forEach(([x, z]) => mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.22, 12), M(0x1a1a1c), x, 0.28, z, fk).rotation.z = Math.PI / 2);
  addColH(G, 10.1, 11.9, 7.4, 9.6, 2);
  // 墙边码放的家具（装饰）
  for (let i = 0; i < 6; i++) { const b = mkBoxes(3); b.position.set(-hx + 1 + (i % 2) * 0.9, 0, -6 + i * 2.2); G.add(b); }
  addColH(G, -hx, -hx + 1.8, -7, 6, 2.2);
  BATCH.push(Object.assign(staticBatch([G], new Set()), { cx: LD.x, cz: LD.z, r: 90 }));
  BATCH.push({ group: G, cx: LD.x, cz: LD.z, r: 90 });
  // 高架货架（柱子）：拉索冲撞会撞上去晕住；撞两次就塌
  const X = x => LD.x + x, Z = z => LD.z + z;
  [[-7, -3], [7, -3], [-7, 5], [7, 5]].forEach(([x, z]) => {
    const g = new THREE.Group(), H = 4.6;
    [-2.1, 2.1].forEach(dx => [-0.55, 0.55].forEach(dz => box(0.12, H, 0.12, M(0x2a5ab0), dx, H / 2, dz, g)));
    [0.2, 1.6, 3.0, 4.4].forEach(y => { box(4.3, 0.1, 0.12, orangeM, 0, y, -0.55, g); box(4.3, 0.1, 0.12, orangeM, 0, y, 0.55, g); box(4.2, 0.04, 1.1, M(0x8a6a42), 0, y + 0.07, 0, g); });
    for (const y of [0.27, 1.67, 3.07]) for (let k = -1.5; k <= 1.5; k += 1.0) box(0.8, 0.8 + Math.random() * 0.3, 0.9, cboxM, k, y + 0.42, 0, g);
    const f = addFurn('loading', g, X(x), Z(z), 2.2, 0.62, H, 'rack', 6999, { hp: 2, pillar: true });
    DOCK6.racks.push(f);
  });
  [[-11, 9], [-3, 10], [3, 10.5], [12, -9.5], [-12, -10]].forEach(([x, z]) => addFurn('loading', mkBoxes(3), X(x), Z(z), 0.42, 0.42, 1.8, 'boxes', 199, { hp: 1 }));
})();
AREA_DEF.loading = () => ({ cx: LD.x, cz: LD.z, hx: LD.hx - 0.5, hz: LD.hz - 0.5, room: true, h: LD.h, sun: 1.1, sunC: 0xffe8c8, hemi: [0xd8d0c0, 0x3a3630, 1.2], fog: [0x1a1814, 30, 90], night: true, occl: 1, follow: 1, ep4: 1 });
function loadingWeapons() { spawnWeapon(W_FRIDGE, LD.x - 3, LD.z + 8.5); spawnWeapon(W_CHAIR, LD.x + 4, LD.z + 8); spawnWeapon(4, LD.x - 10, LD.z + 2); }

// ================= 拉索 · 牛力（第六集 Boss） =================
Object.assign(ETYPES, {
  ratsoOx: { name: '拉索 · 牛力', hp: 2300, dmg: 22, spd: 2.7, radius: 0.7, scale: 1.32, beast: 1, poise: 1, elite: 1, dieMsg: '拉索倒下了！<small>“我的力气……跑哪儿去了……”</small>' },
});
{ const _re = WHO.ratso.e; WHO.ratso.e = () => enemies.find(e => e.type === 'ratsoOx') || _re(); }
WHO.pa = { n: '家具城广播', c: '#ffd27a', e: () => player };
const THROW_MK = [() => { const g = mkSofa(0x7a5aa8); g.scale.setScalar(0.75); return g; }, () => mkBoxes(2), () => mkTable(), () => { const g = mkFridge(); g.scale.setScalar(0.8); return g; }, () => { const g = mkWardrobe(); g.scale.setScalar(0.62); return g; }];
const THROW_N = ['沙发', '纸箱', '餐桌', '冰箱', '衣柜'];
class RatsoOx extends Beast {
  build() { this.rig = makeSkinRig('thug', this.scale); this.kbScale = 0.08; this.hbY = 1.95; this.throws = 0; this.frontT = -9; }
  dmgMul() {
    if (this.state === 'stun') return 1.6;
    const a = Math.abs(angDiff(this.yaw, Math.atan2(player.pos.x - this.pos.x, player.pos.z - this.pos.z)));
    if (a < 1.25 && this.state !== 'charge') {
      if (now - this.frontT > 1.6) { this.frontT = now; floatText(this.pos.clone().setY(2.9), '正面硬如牛！', '#ff8a3a', 22); Foley.at('clangS', this.pos, { vol: 0.35, rate: 0.7 }); }
      if (!DOCK6.told.front) { DOCK6.told.front = 1; tip('拉索正面霸体（伤害 ×0.3）——绕到背后打，或引他冲撞货架！', 2.8); }
      return 0.3;
    }
    if (a > 2.0 && now - (this.backT || -9) > 1.6) { this.backT = now; floatText(this.pos.clone().setY(2.9), '背后！', '#7dffb0', 22); }
    return a > 2.0 ? 1.3 : 0.75;
  }
  update(dt) {
    if (this.rig.loaded && !this.tinted) {
      this.tinted = 1; const t = new THREE.Color(0.8, 0.95, 1.4); this.rig.mats.forEach(m => m.color && m.color.multiply(t));
      if (this.rig.headB) { const gm = M(0xffb050, { emissive: 0xff6a10, emissiveIntensity: 0.4 }); this.horns = [-1, 1].map(s => { const c = mesh(new THREE.ConeGeometry(0.05, 0.28, 8), gm, s * 0.11, 0.2, 0.02, this.rig.headB, false); c.rotation.z = -s * 0.9; c.visible = false; return c; }); }
    }
    super.update(dt);
    if (this.held) this.held.visible = this.rig.root.visible && !this.dead;
  }
  think(dt) {
    const p = player, dx = p.pos.x - this.pos.x, dz = p.pos.z - this.pos.z, d = Math.hypot(dx, dz) || 1, S = this.state;
    if (!this.raged && this.hp < this.maxHp * 0.55 && S === 'loco') { this.raged = true; this.startRoar(); return; }
    if (this.raged) this.cd -= dt * 0.35;
    if (S === 'loco') {
      this.threat = null; this.face(dt, 3.2);
      let fx = 0, fz = 0; if (d > 2.4) { fx = dx / d; fz = dz / d; } else if (d < 1.5) { fx = -dx / d * 0.4; fz = -dz / d * 0.4; }
      [fx, fz] = this.sep(fx, fz, 1.5);
      this.steer(dt, fx, fz, this.T.spd * (this.raged ? 1.15 : 1), 3);
      if (this.cd <= 0 && p.state !== 'dead') {
        const r = Math.random();
        if (d > 7) { if (r < 0.5) this.startLift(); else if (r < 0.9) this.startCharge(); else this.cd = 0.3; }
        else if (d < 3.2) { if (r < 0.5) this.startPunch(); else if (r < 0.8) this.startSlam(); else this.startLift(); }
        else if (r < 0.4) this.startLift(); else if (r < 0.75) this.startCharge(); else this.startSlam();
      }
    } else if (S === 'punch' || S === 'slam') {
      this.steer(dt, 0, 0, 0, 8); if (this.t < this.hitAt * 0.6) this.face(dt, 6);
      if (this.t > this.hitAt - 0.1 && this.t < this.hitAt + 0.1) this.vel.set(Math.sin(this.yaw) * 4, 0, Math.cos(this.yaw) * 4);
      if (this.t >= this.D) { if (S === 'punch' && this.raged && !this.combo2) { this.combo2 = 1; this.startPunch(); return; } this.combo2 = 0; this.setState('loco'); this.cd = rand(0.8, 1.3); }
    } else if (S === 'lift') {
      this.steer(dt, 0, 0, 0, 8); this.threat = 'red';
      if (this.tele && !this.tele.fired && this.t < this.tele.wind * this.tele.lock) this.face(dt, 5);
      if (this.t > 2.2) { this.setState('loco'); this.cd = 0.5; }
    } else if (S === 'cwind') {
      this.steer(dt, 0, 0, 0, 8); this.threat = 'red';
      if (this.tele && !this.tele.fired && this.t < this.tele.wind * this.tele.lock) this.face(dt, 5);
    } else if (S === 'charge') {
      this.threat = null; const sp = this.raged ? 15.5 : 13.5, fx = Math.sin(this.yaw), fz = Math.cos(this.yaw);
      this.vel.set(fx * sp, 0, fz * sp); this.run = (this.run || 0) + sp * dt;
      if (!this.hitP && Math.hypot(p.pos.x - this.pos.x, p.pos.z - this.pos.z) < this.radius + 0.6 && p.pos.y < 1.5) { this.hitP = true; playerTakeHit(this, 24, { kd: 1, unblockable: 1 }); }
      for (const e of enemies) if (e !== this && !e.dead && !e.beast && Math.hypot(e.pos.x - this.pos.x, e.pos.z - this.pos.z) < this.radius + 0.6) e.takeHit(30, new THREE.Vector2(fx, fz), { kb: 9, kd: 1, heavy: 1, launch: 4 }, 1, false);
      if (Math.random() < dt * 25) burst(this.pos.clone().setY(0.1), 0xb8b0a0, 2, 3);
      const nx = this.pos.x + fx * (this.radius + 0.3), nz = this.pos.z + fz * (this.radius + 0.3);
      for (const f of FURN.list) if (!f.broken && f.area === 'loading' && f.kind === 'boxes' && furnDist(f, nx, nz) < 0.3) breakFurn(f, new THREE.Vector2(fx, fz), 'boss');
      const rack = FURN.list.find(f => !f.broken && f.area === 'loading' && f.kind === 'rack' && furnDist(f, nx, nz) < 0.15);
      const wall = Math.abs(nx - AREA.cx) > AREA.hx - 0.1 || Math.abs(nz - AREA.cz) > AREA.hz - 0.1;
      if (rack || wall) this.crash(rack);
      else if (this.run > this.runMax) { this.setState('loco'); this.cd = rand(0.8, 1.3); this.vel.multiplyScalar(0.3); }
    } else if (S === 'roar') { this.steer(dt, 0, 0, 0, 8); this.threat = 'red'; if (this.t > 2.4) { this.setState('loco'); this.cd = 0.6; } }
  }
  act(st, D, hitAt) { this.setState(st); this.D = D; this.hitAt = hitAt; }
  startPunch() {
    const k = this.combo2 ? 0.8 : 1; this.act('punch', 1.2 * k, 0.62 * k); Foley.at('swH', this.pos, { vol: 0.7, rate: 0.7, delay: Math.max(0, this.hitAt - 0.12) });
    this.tele = Tele.add({ shape: 'sector', x: this.pos.x, z: this.pos.z, yaw: this.yaw, r: 3.1, arc: 0.9, wind: this.hitAt, lock: 0.65, col: 'amber', src: this,
      follow: (T) => { T.x = this.pos.x; T.z = this.pos.z; T.yaw = this.yaw; }, onFire: (T) => { this.tele = null; if (Tele.inside(T, player.pos) && player.pos.y < 1.4) playerTakeHit(this, 20, {}); } });
  }
  startSlam() {
    this.act('slam', 1.7, 0.95); Foley.at('kB', this.pos, { vol: 0.7, rate: 0.85 });
    const fx = Math.sin(this.yaw), fz = Math.cos(this.yaw);
    this.tele = Tele.add({ shape: 'circle', x: this.pos.x + fx * 1.4, z: this.pos.z + fz * 1.4, r: 3.0, wind: 0.95, col: 'red', src: this,
      onFire: (T) => { this.tele = null; shake = 0.5; const c = new THREE.Vector3(T.x, 0.05, T.z); shock(c, 0xffb070, 3); burst(c.clone().setY(0.2), 0xb8b0a0, 40, 7); impact('fall', { pos: c, big: true }); Foley.at('quake', c, { vol: 0.7 });
        if (Tele.inside(T, player.pos) && player.pos.y < 1.2) playerTakeHit(this, 26, { kd: 1, unblockable: 1 });
        if (this.raged) Tele.add({ shape: 'ring', x: T.x, z: T.z, r: 10, wind: 0.01, speed: 9, col: 'red', src: this, dmg: 12, opts: { kd: 1, unblockable: 1 } }); } });
  }
  // 举起一件家具（红色直线）扔过来；拿着冰箱门格挡可以挡住
  startLift() {
    this.setState('lift'); this.cancelTele(); const k = Math.random() * THROW_MK.length | 0;
    if (this.held) this.held.removeFromParent();
    this.held = THROW_MK[k](); this.held.position.set(0, 1.95, 0.1); this.held.rotation.y = Math.PI / 2; this.rig.root.add(this.held); this.heldN = THROW_N[k]; this.heldK = k;
    Foley.at('kB', this.pos, { vol: 0.8 }); Foley.at('shelf', this.pos, { vol: 0.4, rate: 1.3 });
    const len = 20, wind = this.raged ? 1.0 : 1.2;
    this.tele = Tele.add({ shape: 'lane', x: this.pos.x, z: this.pos.z, yaw: this.yaw, w: 1.9, len, wind, lock: 0.7, col: 'red', src: this,
      follow: (T) => { T.x = this.pos.x; T.z = this.pos.z; T.yaw = this.yaw; }, onFire: (T) => { this.tele = null; this.throwIt(T.yaw); } });
    if (this.throws % 3 === 0) Story.bark('ratso', ['接着！', '大减价——全都送你！', '尝尝这个！'][(this.throws / 3 | 0) % 3]);
    if (!DOCK6.told.throw) { DOCK6.told.throw = 1; tip('他要扔家具！红线上闪开——举着冰箱门格挡也能硬接', 2.6); }
  }
  throwIt(yaw) {
    const h = this.held; if (!h) return; this.held = null; this.throws++;
    const wp = new THREE.Vector3(); h.getWorldPosition(wp); h.removeFromParent(); h.position.copy(wp); h.rotation.set(0, yaw + Math.PI / 2, 0); h.scale.multiplyScalar(this.scale); scene.add(h);
    DOCK6.proj.push({ m: h, x: wp.x, z: wp.z, y: wp.y, dx: Math.sin(yaw), dz: Math.cos(yaw), t: 0, hit: new Set(), src: this, n: this.heldN });
    Foley.at('swH', this.pos, { vol: 1, rate: 0.55 }); Foley.at('kBh', this.pos, { vol: 0.7 }); shake = Math.max(shake, 0.15);
    if (this.raged && this.throws % 2 === 1) Story.timers.push({ t: 0.5, f: () => { if (!this.dead && this.state === 'lift') { this.startLift(); } } });
  }
  startCharge() {
    this.setState('cwind'); this.hitP = false; this.run = 0; const p = player;
    this.runMax = clamp(Math.hypot(p.pos.x - this.pos.x, p.pos.z - this.pos.z) + 5, 8, 24);
    Foley.at('roar', this.pos, { vol: 0.5, rate: 0.9 }); Foley.at('kB', this.pos, { vol: 0.6 });
    this.tele = Tele.add({ shape: 'lane', x: this.pos.x, z: this.pos.z, yaw: this.yaw, w: 2.2, len: this.runMax, wind: this.raged ? 0.85 : 1.05, lock: 0.7, col: 'red', src: this,
      follow: (T) => { T.x = this.pos.x; T.z = this.pos.z; T.yaw = this.yaw; }, onFire: () => { this.tele = null; if (this.state === 'cwind') this.setState('charge'); } });
    if (!DOCK6.told.charge) { DOCK6.told.charge = 1; tip('站到货架前面引他冲过来——撞上货架他会晕好久！', 2.6); }
  }
  crash(rack) {
    this.vel.set(-Math.sin(this.yaw) * 3, 0, -Math.cos(this.yaw) * 3); shake = rack ? 0.6 : 0.3; impact('fall', { pos: this.pos, big: true }); Foley.at('shelf', this.pos, { vol: 1 });
    burst(this.pos.clone().setY(1.6).addScaledVector(new THREE.Vector3(Math.sin(this.yaw), 0, Math.cos(this.yaw)), 1.2), 0xd8c098, 40, 7);
    if (rack) {
      DOCK6.crash = (DOCK6.crash || 0) + 1;
      if (--rack.hp <= 0) { breakFurn(rack, new THREE.Vector2(Math.sin(this.yaw), Math.cos(this.yaw)), 'boss'); this.hp = Math.max(1, this.hp - 120); floatText(this.pos.clone().setY(3.1), '货架塌了！ -120', '#ffcf6a', 28); this.stun(3.6, '被埋了！ 快打！', '#ffd84a'); Story.bark('ratso', '哎哟……谁把货架放这儿的！'); }
      else { this.hp = Math.max(1, this.hp - 60); floatText(this.pos.clone().setY(3.1), '-60', '#ffcf6a', 26); this.stun(2.8, '撞晕了！ 快打！', '#ffd84a'); rack.g.rotation.z = 0.04; }
    } else this.stun(1.0, '撞墙了！', '#ffd84a');
  }
  startRoar() {
    this.setState('roar'); this.cancelTele(); Foley.at('roar', this.pos, { vol: 1, rate: 0.75 }); Foley.at('kB', this.pos, { vol: 1 }); shake = 0.35;
    banner('拉索 · 牛力全开！<small>扔得更多、冲得更快——跺地会震出冲击环，要跳起来</small>', 2.6);
    Story.bark('ratso', '牛力——全开！兄弟们，上！');
    if (this.horns) this.horns.forEach(h => h.visible = true);
    for (const m of this.rig.mats) if (m.emissive) m.emissive.setRGB(0.25, 0.08, 0.0), m.userData.e0 = m.emissive.clone();
    Story.timers.push({ t: 1.0, f: () => { if (this.dead) return; [['thug', -1], ['brute', 1]].forEach(([t, s]) => { const a = this.yaw + s * 1.7; const e = spawnAt(t, clamp(this.pos.x + Math.sin(a) * 3, LD.x - 13, LD.x + 13), clamp(this.pos.z + Math.cos(a) * 3, LD.z - 11, LD.z + 11)); e.cd = 1.4; burst(e.pos.clone().setY(1), 0xffffff, 20, 3); }); } });
  }
  parried() { this.release(); this.cancelTele(); this.stun(1.2, '破绽!'); }
  stun(t, txt, col) { super.stun(t, txt, col); if (this.held && this.state === 'stun') { const h = this.held; this.held = null; const wp = new THREE.Vector3(); h.getWorldPosition(wp); h.removeFromParent(); burst(wp, 0xd8c098, 24, 5); Foley.at('woodBrk', wp, { vol: 0.8 }); } }
  pose(dt, v) {
    const sk = this.rig.sk; if (!sk || !sk.mixer) return;
    const S = this.state;
    if (cutscene && !this.dead) sk.set('cut', { boss_idle: 1 }, null, 0.25);
    else if (S === 'loco') sk.set('loco', skLoco(sk, { v, idle: 'boss_idle', walk: 'boss_walk', walkV: 1.2 }), null, 0.2);
    else if (S === 'punch') { sk.set('punch' + (this.combo2 || 0), { boss_swipe: 1 }, null, 0.1); sk.time('boss_swipe', skMap(['boss_swipe', .3, 1.23, 2.4], Math.min(1, this.t / this.D), this.hitAt / this.D)); }
    else if (S === 'slam') { sk.set(S, { boss_stomp: 1 }, null, 0.1); sk.time('boss_stomp', skMap(['boss_stomp', .1, 1.75, 3.0], Math.min(1, this.t / this.D), this.hitAt / this.D)); }
    else if (S === 'lift' || S === 'cwind' || S === 'roar') { sk.set(S, { boss_roar: 1 }, null, 0.15); sk.time('boss_roar', Math.min(sk.dur('boss_roar') - 0.01, 0.2 + this.t * (S === 'roar' ? 1 : 1.4))); }
    else if (S === 'charge') { sk.set('charge', { boss_walk: 1 }, null, 0.1); sk.speed('boss_walk', 3.2); }
    else if (S === 'stun') { sk.set('stun', { drunk_stumble: 1 }, null, 0.2); sk.speed('drunk_stumble', 0.75); }
    else if (S === 'dead') skDown(sk, false, Math.min(this.t, 1.0), 2.1, true);
    sk.update(dt);
  }
  deathAnim(dt) { if (this.t > 0.36 && !this.thud) { this.thud = 1; impact('fall', { pos: this.pos, big: true }); shake = 0.5; burst(this.pos.clone().setY(0.3), 0xb8b0a0, 40, 6); } }
}
BEAST_CLS.ratsoOx = RatsoOx;
function updateDockProj(dt) {
  for (let i = DOCK6.proj.length - 1; i >= 0; i--) {
    const P = DOCK6.proj[i]; P.t += dt; const sp = 17;
    P.x += P.dx * sp * dt; P.z += P.dz * sp * dt; P.y = Math.max(0.7, P.y - dt * 1.6);
    P.m.position.set(P.x, P.y - 0.6, P.z); P.m.rotation.x += dt * 5;
    const pos = new THREE.Vector3(P.x, P.y, P.z);
    let done = false;
    if (!P.hit.has(player) && Math.hypot(player.pos.x - P.x, player.pos.z - P.z) < 1.15 && player.pos.y < 1.7) { P.hit.add(player); playerTakeHit({ pos: new THREE.Vector3(P.x - P.dx * 2, 0, P.z - P.dz * 2), parried() { } }, 22, { kd: 1, unblockable: 1 }); done = player.weapon && WEAPONS[player.weapon.type].shield && player.guard; }
    for (const e of enemies) if (e !== P.src && !e.dead && !P.hit.has(e) && Math.hypot(e.pos.x - P.x, e.pos.z - P.z) < 1.1) { P.hit.add(e); e.takeHit(e.beast ? 40 : 35, new THREE.Vector2(P.dx, P.dz), { kb: 8, kd: 1, heavy: 1, launch: 3 }, 1, false); floatText(e.pos.clone().setY(2.2), '被' + P.n + '砸中！', '#ffcf6a', 22); }
    const f = FURN.list.find(f => !f.broken && f.area === AREA.name && (f.kind === 'rack' || f.kind === 'boxes') && furnDist(f, P.x, P.z) < 0.2);
    if (f && f.kind === 'boxes') breakFurn(f, new THREE.Vector2(P.dx, P.dz), 'proj');
    const wall = Math.abs(P.x - AREA.cx) > AREA.hx + 0.2 || Math.abs(P.z - AREA.cz) > AREA.hz + 0.2;
    if (done || wall || (f && f.kind === 'rack') || P.t > 2.5) {
      burst(pos, 0xd8c098, 30, 6); Foley.at(['sofa', 'boxHit', 'woodBrk', 'fridge', 'door'][P.src.heldK ?? 2] || 'woodBrk', pos, { vol: 1 }); Foley.at('woodBrk', pos, { vol: 0.6, delay: 0.04 }); impact('fall', { pos, big: true });
      shake = Math.max(shake, 0.25); FURN.bill += 1999; for (let k = 0; k < 6; k++) { const s = rand(0.15, 0.4), m = box(s, s * 0.6, s, [cboxM, cardD, steelM][k % 3], P.x, P.y, P.z, PG6); FURN.debris.push({ m, v: new THREE.Vector3(-P.dx * rand(1, 4) + rand(-2, 2), rand(2, 5), -P.dz * rand(1, 4) + rand(-2, 2)), av: new THREE.Vector3(rand(-8, 8), rand(-8, 8), rand(-8, 8)), t: 0, s }); }
      scene.remove(P.m); DOCK6.proj.splice(i, 1);
    }
  }
}
