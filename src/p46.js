// ================= 剧情：老爹的古董店 =================
const SC = { x: 0, z: -160 };
const SHOP = { hx: 9, hz: 7, h: 4.6 };
const vases = [], shopDoors = [];
const porc = M(0xe8eef5), jadeM = M(0x5fb08a), redP = M(0xc8301c);
(function buildShop() {
  const G = new THREE.Group(); G.position.set(SC.x, 0, SC.z); scene.add(G);
  const { hx, hz, h } = SHOP;
  // 木地板
  const ft = canvasTex(512, 512, (g, W) => {
    for (let i = 0; i < 8; i++) {
      g.fillStyle = ['#6b4528', '#73492a', '#5f3d22', '#6e4626'][i % 4]; g.fillRect(0, i * 64, W, 64);
      g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(0, i * 64, W, 3);
      const off = (i % 2) * 180; for (let x = off; x < W; x += 360) g.fillRect(x, i * 64, 3, 64);
      g.strokeStyle = 'rgba(40,20,8,.25)'; for (let k = 0; k < 6; k++) { g.beginPath(); const y = i * 64 + 8 + Math.random() * 48; g.moveTo(0, y); g.bezierCurveTo(W * .3, y + 4, W * .6, y - 4, W, y + 2); g.stroke(); }
    }
  }, [3, 3]);
  const floor = mesh(new THREE.PlaneGeometry(hx * 2, hz * 2), MS(0xffffff, { map: ft, roughness: 0.75 }), 0, 0.002, 0, G, false); floor.rotation.x = -Math.PI / 2;
  // 地毯
  const rt = canvasTex(512, 340, (g, W, H) => {
    g.fillStyle = '#7a1612'; g.fillRect(0, 0, W, H); g.strokeStyle = '#e0b04a'; g.lineWidth = 10; g.strokeRect(18, 18, W - 36, H - 36);
    g.lineWidth = 3; g.strokeRect(40, 40, W - 80, H - 80); g.fillStyle = '#e0b04a'; g.font = 'bold 120px "Noto Sans SC",sans-serif'; g.textAlign = 'center'; g.fillText('福', W / 2, H / 2 + 42);
  });
  const rug = mesh(new THREE.PlaneGeometry(6, 4), M(0xffffff, { map: rt }), 0, 0.008, 1.2, G, false); rug.rotation.x = -Math.PI / 2;
  // 墙（单面朝内，摄像机在外时不会挡住视线）
  const wt = canvasTex(256, 256, (g, W) => {
    g.fillStyle = '#5a1d14'; g.fillRect(0, 0, W, W); g.strokeStyle = 'rgba(232,184,74,.28)'; g.lineWidth = 3;
    for (let y = 32; y < W; y += 64) for (let x = 32; x < W; x += 64) { g.beginPath(); g.arc(x + ((y / 64) % 2) * 32, y, 18, 0, TAU); g.stroke(); g.strokeRect(x - 6 + ((y / 64) % 2) * 32, y - 6, 12, 12); }
  }, [6, 2]);
  const wm = M(0xffffff, { map: wt });
  const wall = (w, x, z, ry, y0 = 0, hh = h) => { const m = mesh(new THREE.PlaneGeometry(w, hh), wm, x, y0 + hh / 2, z, G, false); m.rotation.y = ry; return m; };
  wall(hx * 2, 0, -hz, 0); wall(hz * 2, -hx, 0, Math.PI / 2); wall(hz * 2, hx, 0, -Math.PI / 2);
  wall(hx - 1.2, -(hx + 1.2) / 2, hz, Math.PI); wall(hx - 1.2, (hx + 1.2) / 2, hz, Math.PI); wall(2.4, 0, hz, Math.PI, 3, h - 3);
  // 护墙板
  const wood = M(0x3b2214), woodL = M(0x6a3f22), gold = M(0xd8a53a, { emissive: 0x3a2400 });
  [[hx * 2, 0, -hz + 0.04, 0], [hz * 2, -hx + 0.04, 0, 1], [hz * 2, hx - 0.04, 0, 1]].forEach(([w, x, z, r]) => { const b = box(r ? 0.06 : w, 1.0, r ? w : 0.06, wood, x, 0.5, z, G); b.castShadow = false; });
  // 天花板 + 梁
  const ceil = mesh(new THREE.PlaneGeometry(hx * 2, hz * 2), M(0x2a170d), 0, h, 0, G, false); ceil.rotation.x = Math.PI / 2;
  for (let z = -5; z <= 5; z += 2.5) { const b = box(hx * 2, 0.25, 0.3, wood, 0, h - 0.13, z, G); b.castShadow = false; }
  // 门（前墙中间）+ 门外的街景光
  const doorM = M(0x7a2a18), outside = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.6, 0.95, 0.55), toneMapped: false });
  mesh(new THREE.PlaneGeometry(4, 3.4), outside, 0, 1.7, hz + 1.2, G, false).rotation.y = Math.PI;
  [-1, 1].forEach(s => {
    const hinge = new THREE.Group(); hinge.position.set(s * 1.2, 0, hz - 0.05); G.add(hinge);
    const d = box(1.18, 2.95, 0.08, doorM, -s * 0.6, 1.48, 0, hinge);
    box(0.9, 1.0, 0.1, M(0x4a1a0e), -s * 0.6, 2.0, 0, hinge); mesh(new THREE.TorusGeometry(0.07, 0.015, 6, 14), gold, -s * 1.05, 1.4, -0.07, hinge);
    shopDoors.push({ hinge, s, open: 0, target: 0 });
  });
  box(2.8, 0.25, 0.2, wood, 0, 3.05, hz - 0.1, G);
  // 后门布帘（小玉从这里出来）
  const curt = canvasTex(128, 256, (g, W, H) => { g.fillStyle = '#9a1c14'; g.fillRect(0, 0, W, H); g.fillStyle = '#e0b04a'; g.fillRect(0, 40, W, 6); g.fillStyle = 'rgba(0,0,0,.25)'; for (let x = 0; x < W; x += 16) g.fillRect(x, 0, 4, H); });
  mesh(new THREE.PlaneGeometry(1.6, 2.6), M(0xffffff, { map: curt }), -6.2, 1.3, -hz + 0.06, G, false);
  // 柜台
  box(6.2, 1.0, 0.9, woodL, 0, 0.5, -4.2, G); box(6.4, 0.08, 1.05, wood, 0, 1.04, -4.2, G);
  box(0.6, 0.35, 0.45, M(0x8a6a2a), -2.2, 1.25, -4.2, G); // 收银机
  const bud = new THREE.Group(); bud.position.set(1.9, 1.08, -4.2); G.add(bud); // 金佛
  mesh(SPH(0.2), gold, 0, 0.18, 0, bud).scale.set(1.2, 0.9, 1); mesh(SPH(0.12), gold, 0, 0.45, 0, bud);
  [0.6, 0.85, 1.1].forEach((x, i) => mesh(new THREE.CylinderGeometry(0.05, 0.04, 0.08, 10), M(0xf2efe6), x - 0.3, 1.12, -4.0, G)); // 茶杯
  mesh(SPH(0.11), M(0x6a3a22), 0.1, 1.17, -4.25, G).scale.set(1.2, 0.9, 1.2); // 茶壶
  colliders.push({ x0: SC.x - 3.15, x1: SC.x + 3.15, z0: SC.z - 4.7, z1: SC.z - 3.7 });
  // 货架
  const shelf = (x, z, w, ry, rows = 4) => {
    const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; G.add(g);
    [-w / 2, w / 2].forEach(sx => box(0.08, 3.2, 0.5, wood, sx, 1.6, 0, g));
    for (let r = 0; r < rows; r++) {
      const y = 0.25 + r * 0.8; box(w, 0.06, 0.5, wood, 0, y, 0, g);
      for (let k = 0; k < Math.floor(w / 0.55); k++) {
        const ix = -w / 2 + 0.35 + k * 0.55, t = (k * 7 + r * 3 + Math.round(x)) % 4;
        if (t === 0) { const v = mesh(new THREE.LatheGeometry(VASE_PTS(0.11), 14), [porc, jadeM, redP][(k + r) % 3], ix, y + 0.03, 0, g); v.scale.setScalar(1.2); }
        else if (t === 1) box(0.3, 0.22, 0.3, M([0x5a3a1e, 0x24364a, 0x6a1e18][(k + r) % 3]), ix, y + 0.14, 0, g);
        else if (t === 2) mesh(SPH(0.1), [gold, jadeM][(k + r) % 2], ix, y + 0.13, 0, g);
        else { [0, 1, 2].forEach(b => box(0.07, 0.3, 0.24, M([0x7a2a1a, 0x2a4a3a, 0xb08a3a][b]), ix - 0.08 + b * 0.08, y + 0.18, 0, g)); }
      }
    }
    return g;
  };
  shelf(0, -hz + 0.35, 5.6, 0); shelf(-hx + 0.3, -2.5, 4.2, Math.PI / 2); shelf(-hx + 0.3, 3, 3.6, Math.PI / 2); shelf(hx - 0.3, -2.5, 4.2, -Math.PI / 2); shelf(hx - 0.3, 3, 3.6, -Math.PI / 2);
  [[-hx, -4.6, -0.4], [-hx, 1.0, 5.0], [hx - 0.55, -4.6, -0.4], [hx - 0.55, 1.0, 5.0]].forEach(([x0, za, zb]) => colliders.push({ x0: SC.x + x0, x1: SC.x + x0 + 0.55, z0: SC.z + za, z1: SC.z + zb }));
  colliders.push({ x0: SC.x - 2.9, x1: SC.x + 2.9, z0: SC.z - hz, z1: SC.z - hz + 0.65 });
  // 字画
  ['福', '寿', '龍', '武'].forEach((c, i) => {
    const t = canvasTex(128, 320, (g, W, H) => { g.fillStyle = '#efe3c4'; g.fillRect(0, 0, W, H); g.fillStyle = '#6a3a1a'; g.fillRect(0, 0, W, 16); g.fillRect(0, H - 16, W, 16); g.fillStyle = '#1a0e08'; g.font = 'bold 90px "Noto Sans SC",serif'; g.textAlign = 'center'; g.fillText(c, W / 2, H / 2 + 30); g.fillStyle = '#b8241a'; g.fillRect(W - 34, H - 60, 18, 18); });
    const p = mesh(new THREE.PlaneGeometry(0.8, 2), M(0xffffff, { map: t }), i < 2 ? -6.3 + i * 12.6 : 0, 3.1, -hz + 0.05, G, false);
    if (i >= 2) { p.position.set(i === 2 ? -hx + 0.05 : hx - 0.05, 3.3, 0.3); p.rotation.y = i === 2 ? Math.PI / 2 : -Math.PI / 2; p.position.z = 0.3; p.position.y = 3.6; p.scale.setScalar(0.6); }
  });
  // 灯笼 + 暖光
  [[-4, 0], [4, 0], [0, 4.5]].forEach(([x, z]) => {
    mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.8, 4), wood, x, h - 0.4, z, G, false);
    const l = mesh(SPH(0.34, 18, 12), glowMat(2.2, 0.35, 0.15), x, h - 1.05, z, G, false); l.scale.y = 0.85;
    [-0.3, 0.3].forEach(dy => mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.06, 12), gold, x, h - 1.05 + dy, z, G, false));
    const pl = new THREE.PointLight(0xffa860, 5, 13, 1.2); pl.position.set(x, h - 1.3, z); G.add(pl);
  });
  // 可打碎的古董花瓶
  [[-7.9, -6.2, 1.5], [7.9, -6.2, 1.5], [-7.9, 6.2, 1.4], [7.9, 6.2, 1.4], [-2.4, 6.3, 1.1], [2.4, 6.3, 1.1], [-3.8, -4.4, 1.2], [3.8, -4.4, 1.2], [-7.9, 0.3, 1.3], [7.9, 0.3, 1.3]].forEach(([x, z, s], i) => {
    const v = new THREE.Group(); v.position.set(SC.x + x, 0, SC.z + z); scene.add(v);
    const body = mesh(new THREE.LatheGeometry(VASE_PTS(0.26), 18), [porc, redP, jadeM][i % 3], 0, 0, 0, v); body.scale.setScalar(s);
    mesh(new THREE.TorusGeometry(0.2 * s, 0.025 * s, 6, 18), M(0x2a4a9a), 0, 0.45 * s, 0, v).rotation.x = Math.PI / 2;
    const col = { x0: v.position.x - 0.25, x1: v.position.x + 0.25, z0: v.position.z - 0.25, z1: v.position.z + 0.25 }; colliders.push(col);
    vases.push({ g: v, col, broken: false, c: [0xe8eef5, 0xc8301c, 0x5fb08a][i % 3] });
  });
})();
// ================= 静态合批：把场景里不会动的网格按材质合并，绘制调用从上千次降到几十次 =================
function matSig(m) {
  const c = x => x && x.isColor ? x.getHexString() : '';
  return [m.type, c(m.color), c(m.emissive), m.emissiveIntensity, m.map ? m.map.uuid : '', m.transparent, m.opacity, m.side, m.vertexColors, m.toneMapped, m.fog, m.blending, m.depthWrite, m.roughness, m.metalness, m.alphaTest].join('|');
}
function staticBatch(objs, exclude) {
  const out = new THREE.Group(), groups = new Map(), victims = [];
  const skip = o => { for (let p = o; p; p = p.parent) if (exclude.has(p)) return true; return false; };
  objs.forEach(r => r.updateMatrixWorld(true));
  objs.forEach(r => r.traverse(o => {
    if (!o.isMesh || o.isInstancedMesh || o.isSkinnedMesh || !o.visible || skip(o) || Array.isArray(o.material)) return;
    const k = matSig(o.material) + '|' + o.castShadow + o.receiveShadow;
    if (!groups.has(k)) groups.set(k, { mat: o.material, cast: o.castShadow, recv: o.receiveShadow, list: [] });
    groups.get(k).list.push(o);
  }));
  let n = 0;
  for (const G of groups.values()) {
    if (G.list.length < 2) continue;
    const useUv = G.list.some(o => o.geometry.attributes.uv), useCol = !!G.mat.vertexColors;
    const geos = G.list.map(o => {
      const src = o.geometry, g = new THREE.BufferGeometry(), cnt = src.attributes.position.count;
      g.setAttribute('position', src.attributes.position.clone());
      g.setAttribute('normal', src.attributes.normal ? src.attributes.normal.clone() : new THREE.BufferAttribute(new Float32Array(cnt * 3), 3));
      if (useUv) g.setAttribute('uv', src.attributes.uv ? src.attributes.uv.clone() : new THREE.BufferAttribute(new Float32Array(cnt * 2), 2));
      if (useCol) g.setAttribute('color', src.attributes.color ? src.attributes.color.clone() : new THREE.BufferAttribute(new Float32Array(cnt * 3).fill(1), 3));
      if (src.index) g.setIndex(src.index.clone()); else { const ix = new Uint32Array(cnt); for (let i = 0; i < cnt; i++) ix[i] = i; g.setIndex(new THREE.BufferAttribute(ix, 1)); }
      g.applyMatrix4(o.matrixWorld); return g;
    });
    const merged = mergeGeometries(geos, false); if (!merged) continue;
    const mm = new THREE.Mesh(merged, G.mat); mm.castShadow = G.cast; mm.receiveShadow = G.recv; out.add(mm);
    G.list.forEach(o => victims.push(o)); n += G.list.length;
  }
  victims.forEach(o => o.removeFromParent());
  scene.add(out); return { group: out, merged: n };
}
const BATCH = [];
{
  const ex = new Set(shopDoors.map(d => d.hinge));
  const shopRoot = scene.children.find(o => o.isGroup && o.position.z === SC.z && o.position.x === SC.x && o.children.length > 20);
  if (shopRoot) BATCH.push(Object.assign(staticBatch([shopRoot], ex), { cx: SC.x, cz: SC.z, r: 130 }));
  BATCH.push(Object.assign(staticBatch(STREET_OBJS, new Set()), { cx: 0, cz: 0, r: 150 }));
}
// 远处的另一个区域不渲染
function updateBatchVis() { for (const b of BATCH) b.group.visible = Math.hypot(camera.position.x - b.cx, camera.position.z - b.cz) < b.r; }
function VASE_PTS(r) { return [[0.001, 0], [r * 0.55, 0], [r * 0.85, r * 0.6], [r, r * 1.4], [r * 0.75, r * 2.2], [r * 0.38, r * 2.6], [r * 0.42, r * 3.0], [r * 0.5, r * 3.1]].map(([x, y]) => new THREE.Vector2(x, y)); }

// ================= NPC =================
class NPC {
  constructor(name, cfg, scale, extra) {
    this.name = name; this.rig = makeSkinRig(name === '老爹' ? 'uncle' : 'jade', scale); this.scale = scale;
    this.anim = new Animator(this.rig.ghost); this.target = zeroPose();
    this.base = Object.assign(zeroPose(), { lex: -0.3, rex: -0.3, lsz: 0.08, rsz: -0.08, lkx: 0.08, rkx: 0.08 }, cfg.base || {});
    this.pos = new THREE.Vector3(); this.yaw = 0; this.yawT = 0; this.talk = 0; this.walk = null; this.ph = rand(0, 6); this.spd = 0; this.mood = null;
    this.rig.root.visible = false; scene.add(this.rig.root);
  }
  place(x, z, yaw = 0) { this.pos.set(x, 0, z); this.yaw = this.yawT = yaw; this.walk = null; this.rig.root.visible = true; this.rig.root.position.copy(this.pos); }
  hide() { this.rig.root.visible = false; this.walk = null; }
  walkTo(x, z, spd = 2.6) { this.walk = { x, z, spd }; }
  face(p) { this.yawT = Math.atan2(p.x - this.pos.x, p.z - this.pos.z); }
  update(dt) {
    if (!this.rig.root.visible) return;
    let sp = 0;
    if (this.walk) {
      const dx = this.walk.x - this.pos.x, dz = this.walk.z - this.pos.z, d = Math.hypot(dx, dz);
      if (d < 0.08) this.walk = null; else { sp = this.walk.spd; const k = Math.min(d, sp * dt) / d; this.pos.x += dx * k; this.pos.z += dz * k; this.yawT = Math.atan2(dx, dz); }
    }
    this.spd = lerp(this.spd, sp, 1 - Math.exp(-dt * 8)); this.ph += dt * this.spd * 3.4;
    this.yaw += angDiff(this.yaw, this.yawT) * (1 - Math.exp(-dt * 7));
    const t = locoPose(this.target, this.base, this.spd, this.ph);
    if (this.talk > 0) { this.talk -= dt; const s = Math.sin(now * 6.5); t.rsx = -0.7 + s * 0.25; t.rex = -1.2 + Math.sin(now * 4) * 0.2; t.rsz = -0.2; t.nx += Math.sin(now * 5.3) * 0.07; t.sy += s * 0.05; }
    if (this.mood === 'cheer') { const s = Math.sin(now * 9); t.lsx = -2.8 + s * 0.2; t.rsx = -2.8 - s * 0.2; t.lex = -0.3; t.rex = -0.3; t.hy += Math.abs(s) * 0.06; }
    if (this.mood === 'scold') { t.rsx = -1.6; t.rex = -0.5 + Math.sin(now * 14) * 0.25; t.lsx = -0.4; t.lex = -1.9; t.lsz = 0.5; t.sx += 0.1; }
    if (this.mood === 'scared') { t.lsx = -1.9; t.rsx = -1.9; t.lex = -2.1; t.rex = -2.1; t.lsz = 0.3; t.rsz = -0.3; t.hy -= 0.18; t.lhx -= 0.5; t.rhx -= 0.5; t.lkx += 0.9; t.rkx += 0.9; t.nx += 0.2; }
    this.anim.update(t, dt);
    this.rig.root.position.copy(this.pos); this.rig.root.rotation.y = this.yaw;
    driveSkinNPC(this, dt);
  }
}
const uncle = new NPC('老爹', { shirt: 0x8a7046, pants: 0x3a3226, shoe: 0x1a1410, skin: 0xe9bf98, hair: 0xe9bf98, cuff: 1, collar: 1, belly: 1, bulk: 0.95, base: { sx: 0.2, nx: -0.2, lsx: 0.1, rsx: 0.1, lex: -0.6, rex: -0.6 } }, 0.86, r => {
  const w = M(0xf2f2ee);
  [-1, 1].forEach(s => { const t = mesh(SPH(0.045, 10, 8), w, s * 0.112, 0.18, -0.03, r.neck); t.scale.set(0.6, 1, 1.2); r.headParts.push(t); });
  const b = mesh(new THREE.ConeGeometry(0.035, 0.12, 8), w, 0, 0.03, 0.1, r.neck); b.rotation.x = Math.PI; r.headParts.push(b);
  [-1, 1].forEach(s => { const g = mesh(new THREE.TorusGeometry(0.026, 0.005, 6, 16), M(0x111111), s * 0.045, 0.172, 0.118, r.neck, false); r.headParts.push(g); });
});
const jade = new NPC('小玉', { shirt: 0xf07a22, pants: 0x34508a, shoe: 0xf2f2f2, hair: 0x0f0b08, hairStyle: 'slick', collar: 1, base: { lsx: -0.15, rsx: -0.15 } }, 0.7, r => {
  const hd = mesh(SPH(0.12, 14, 10), M(0xd8661a), 0, 0.42, -0.12, r.spine); hd.scale.set(1.2, 0.8, 0.6);
  [-1, 1].forEach(s => { const f = mesh(SPH(0.05, 10, 8), M(0x0f0b08), s * 0.075, 0.24, 0.07, r.neck); f.scale.set(1, 0.6, 0.6); r.headParts.push(f); });
});
const NPCS = [uncle, jade];

// ================= 剧情系统 =================
const WHO = {
  jackie: { n: '成龙', c: '#ffd34d', e: () => player },
  uncle: { n: '老爹', c: '#8cff7a', e: () => uncle },
  jade: { n: '小玉', c: '#ff9a3c', e: () => jade },
  thug: { n: '黑手帮打手', c: '#a9b4c8', e: () => enemies.find(e => !e.dead && e.type === 'thug') || player },
  tohru: { n: '刀鲁', c: '#ff5a4a', e: () => enemies.find(e => e.k === 'boss' && !e.dead) || enemies.find(e => e.k === 'boss') || player },
  finn: { n: '芬恩', c: '#ff8a7a', e: () => enemies.find(e => e.type === 'finn') || player },
  ratso: { n: '拉索', c: '#8ab8ff', e: () => enemies.find(e => e.type === 'ratso') || player },
  chow: { n: '阿周', c: '#9cff8a', e: () => enemies.find(e => e.type === 'chow') || player },
  narr: { n: '', c: '#fff', e: () => null },
};
const Story = {
  broken: 0, lines: null, i: 0, shown: 0, done: null, camPos: null, camLook: new THREE.Vector3(), camLookCur: new THREE.Vector3(), camSnap: false,
  timers: [], barkT: 8, busy: false, prevWho: null, chapter: 0,
  begin(ch) {
    if (ch == null) { ch = 0; try { ch = +(sessionStorage.getItem('jc_ch') || 0); } catch (e) { } }
    try { sessionStorage.removeItem('jc_ch'); sessionStorage.removeItem('jc_nx'); } catch (e) { }
    MODE = 'story'; this.chapter = ch; this.raged = false;
    if (ch >= 3) { this.broken = +(localStorage.getItem('jc_broken') || 0) || 0; }
    if (ch === 0) {
      this.setArea('shop'); this.putPlayer(SC.x + 0.4, SC.z - 1.6, Math.PI);
      uncle.place(SC.x, SC.z - 5.3, 0); jade.hide();
      this.play(INTRO, () => { startWave(0); tip('老爹：千万别打碎我的花瓶！', 2.5); });
    } else if (ch === 1) { this.toStreet(); this.play(STREET_INTRO, () => startWave(1)); }
    else if (ch === 2) { this.toStreet(); uncle.place(3.5, -22.5, Math.PI); this.play(BOSS_INTRO, () => startWave(2)); }
    else if (ch === 3) { this.toDock(); this.play(DOCK_START, () => startWave(3)); }
    else if (ch === 4) { this.toDock(); jade.place(DK.x + 12, DK.z - 2, -1.2); this.play(DOCK_MID, () => startWave(4)); }
    else if (ch === 5) { this.toWarehouse(); this.play(WH_INTRO, () => startWave(5)); }
    else this.beginEp2(ch);
  },
  setArea(name) { applyArea(name); },
  putPlayer(x, z, yaw) {
    const p = player; p.pos.set(x, 0, z); p.vel.set(0, 0, 0); p.vy = 0; p.yaw = p.yawTarget = yaw; camYaw = yaw; camPitch = -0.15; lockTarget = null;
    if (p.state !== 'loco') setState(p, 'loco', 0.05);
    camPos.set(x - Math.sin(yaw) * 4, 2.2, z - Math.cos(yaw) * 4);
  },
  toStreet() { this.setArea('street'); this.putPlayer(0, -24.5, 0); uncle.hide(); jade.place(-1.6, -26.3, 0.3); },
  play(lines, done) {
    this.lines = lines; this.i = -1; this.done = done; cutscene = true; this.camSnap = !this.camPos; this.prevWho = null;
    document.body.classList.add('cine'); keys.KeyQ = false;
    player.guard = player.crouch = false; buffer.type = null;
    player.move = player.clip = null; player.jumpUntil = -Infinity; player.chargeT = 0; player.staffTrace = null; player.mt = 0; player.combo = 0;
    player.vel.set(0, 0, 0); player.vy = 0; player.pos.y = 0; player.grounded = true;
    player.yawTarget = player.yaw; player.rig.inner.rotation.y = 0;
    setState(player, 'loco', 0.12);
    for (const k in player.anim.sp) player.anim.sp[k] = 0;
    for (const k in player.anim.sv) player.anim.sv[k] = 0;
    mouseDX = mouseDY = 0; refreshChips();
    for (const k in keys) keys[k] = false;
    this.advance();
  },
  advance() {
    this.i++;
    if (this.i >= this.lines.length) { this.end(); return; }
    const L = this.lines[this.i];
    if (L.act) L.act();
    if (L.fade) { this.busy = true; $('dlg').classList.remove('show'); $('fade').style.opacity = 1; this._fadeTimer = setTimeout(() => { L.fade(); this.camSnap = true; this.aim(L); $('fade').style.opacity = 0; this.busy = false; this.advance(); }, 650); return; }
    if (L.wait) { this.busy = true; $('dlg').classList.remove('show'); this.timers.push({ t: L.wait, f: () => { this.busy = false; this.advance(); } }); this.aim(L); return; }
    this.shown = 0; this.aim(L);
    const W = WHO[L.who];
    if (L.who === 'narr') { $('dlg').classList.remove('show'); $('narr').textContent = ''; $('narr').classList.add('show'); }
    else { $('narr').classList.remove('show'); $('dlg').classList.add('show'); $('dlgWho').textContent = W.n; $('dlgWho').style.color = W.c; $('dlgTxt').textContent = ''; }
    sfx('whoosh');
  },
  aim(L) {
    const W = WHO[L.who || 'narr'];
    const S = W.e && W.e();
    const toKey = L.to || (L.who === 'jackie' ? this.prevWho || 'uncle' : 'jackie');
    const T = WHO[toKey] && WHO[toKey].e();
    if (S && T && S !== T) {
      if (S instanceof NPC) S.face(T.pos); else if (S === player) { player.yaw = player.yawTarget = Math.atan2(T.pos.x - player.pos.x, T.pos.z - player.pos.z); } else S.yaw = Math.atan2(T.pos.x - S.pos.x, T.pos.z - S.pos.z);
      if (!L.noFace) { if (T instanceof NPC) T.face(S.pos); else if (T === player) player.yaw = player.yawTarget = Math.atan2(S.pos.x - player.pos.x, S.pos.z - player.pos.z); }
    }
    if (S instanceof NPC) S.talk = 2.2;
    if (L.who && L.who !== 'narr') this.prevWho = L.who;
    if (L.shot) { const [px, py, pz, lx, ly, lz] = L.shot(); this.camPos = new THREE.Vector3(px, py, pz); this.camLook.set(lx, ly, lz); }
    else if (S) {
      const sc = S.scale || 1, head = new THREE.Vector3(S.pos.x, 1.45 * sc, S.pos.z);
      let dx, dz; if (T && T !== S) { dx = T.pos.x - S.pos.x; dz = T.pos.z - S.pos.z; } else { dx = Math.sin(S.yaw); dz = Math.cos(S.yaw); }
      const d = Math.hypot(dx, dz) || 1; dx /= d; dz /= d;
      const side = (this.i % 2 ? 1 : -1) * 0.9 * sc, dist = 2.4 * Math.max(1, sc * 0.9);
      this.camPos = new THREE.Vector3(head.x + dx * dist - dz * side, head.y + 0.15, head.z + dz * dist + dx * side);
      if (AREA.room) { this.camPos.x = clamp(this.camPos.x, AREA.cx - AREA.hx, AREA.cx + AREA.hx); this.camPos.z = clamp(this.camPos.z, AREA.cz - AREA.hz, AREA.cz + AREA.hz); }
      this.camLook.copy(head).add(new THREE.Vector3(0, -0.12, 0));
    }
    if (this.camSnap) this.camLookCur.copy(this.camLook);
  },
  next() {
    if (!cutscene || this.busy || !this.lines) return;
    const L = this.lines[this.i]; const txt = this.text(L);
    if (this.shown < txt.length) { this.shown = txt.length; $(L.who === 'narr' ? 'narr' : 'dlgTxt').textContent = txt; return; }
    this.advance();
  },
  skip() {
    if (!cutscene || this.busy || !this.lines) return;
    for (let k = this.i + 1; k < this.lines.length; k++) { const L = this.lines[k]; if (L.act) L.act(); if (L.fade) L.fade(); }
    this.i = this.lines.length; this.end();
  },
  text(L) { return typeof L.text === 'function' ? L.text() : (L.text || ''); },
  end() {
    cutscene = false; this.lines = null; document.body.classList.remove('cine');
    $('dlg').classList.remove('show'); $('narr').classList.remove('show');
    camYaw = player.yaw; camPitch = -0.15; NPCS.forEach(n => n.talk = 0);
    const d = this.done; this.done = null; if (d) d();
  },
  bark(who, txt) { const W = WHO[who]; const b = $('bark'); b.innerHTML = `<b style="color:${W.c}">${W.n}</b>：${txt}`; b.classList.add('show'); clearTimeout(this._bt); this._bt = setTimeout(() => b.classList.remove('show'), 2200); if (WHO[who].e() instanceof NPC) WHO[who].e().talk = 1.5; },
  onClear(w) {
    const T = (t, L, f) => this.timers.push({ t, f: () => this.play(L, f) });
    if (MODE === 'story' && RUNE_CLEAR[w]) setTimeout(() => Runes.award(RUNE_CLEAR[w]), w === 5 ? 200 : 900);
    if (w === 0) { try { localStorage.setItem('jc_broken', String(this.broken)); } catch (e) { } T(1.4, SHOP_AFTER, () => startWave(1)); }
    else if (w === 1) T(1.4, BOSS_INTRO, () => startWave(2));
    else if (w === 2) T(2.2, TOHRU_DOWN, () => startWave(3));
    else if (w === 3) T(1.6, DOCK_MID, () => startWave(4));
    else if (w === 4) T(1.8, DOCK_AFTER, () => startWave(5));
    else if (w === 5) T(2.2, ENDING, () => gameEnd(true, 1));
    else this.onClearEp2(w, T);
  },
  idleEnemies(dt) {
    for (const e of enemies) {
      if (e.dead) continue;
      if (e.type === 'dummy') { e.update(dt); continue; }
      e.yaw += angDiff(e.yaw, Math.atan2(player.pos.x - e.pos.x, player.pos.z - e.pos.z)) * (1 - Math.exp(-dt * 5));
      e.anim.update(locoPose(e.target, e.base, 0, e.ph), dt);
      e.rig.root.position.copy(e.pos); e.rig.root.rotation.y = e.yaw; driveSkinEnemy(e, dt, true);
    }
  },
  update(dt) {
    for (let i = this.timers.length - 1; i >= 0; i--) { const T = this.timers[i]; T.t -= dt; if (T.t <= 0) { this.timers.splice(i, 1); T.f(); } }
    NPCS.forEach(n => n.update(dt));
    shopDoors.forEach(d => { d.open += (d.target - d.open) * (1 - Math.exp(-dt * 18)); d.hinge.rotation.y = d.s * d.open; });
    if (cutscene && this.lines && this.i >= 0 && this.i < this.lines.length) {
      const L = this.lines[this.i], txt = this.text(L);
      if (!L.fade && !L.wait && this.shown < txt.length) {
        this.shown = Math.min(txt.length, this.shown + dt * 38);
        $(L.who === 'narr' ? 'narr' : 'dlgTxt').textContent = txt.slice(0, Math.ceil(this.shown));
      }
    }
    // 打碎古董
    if (AREA.name === 'shop') {
      for (const v of vases) {
        if (v.broken) continue;
        const ents = [player, ...enemies];
        for (const e of ents) {
          const fast = e === player ? ['dodge', 'down', 'kipup', 'hit'].includes(e.state) && Math.hypot(e.vel.x, e.vel.z) > 2 : Math.hypot(e.vel.x, e.vel.z) > 3.2 || e.state === 'down' || e.state === 'dead';
          if (!fast) continue;
          const d = Math.hypot(e.pos.x - v.g.position.x, e.pos.z - v.g.position.z);
          if (d < 0.32 + (e.radius || 0.4) + 0.12) { this.breakVase(v); break; }
        }
      }
      if (!cutscene && !waveDone) { this.barkT -= dt; if (this.barkT <= 0) { this.barkT = rand(9, 14); this.bark('uncle', ['成龙！用功夫，别用我的古董！', '哎呀呀呀呀呀！', '小心那张桌子！清朝的！', '快点打完，我还要做生意！'][Math.floor(rand(0, 4))]); } }
    } else if (!cutscene && !waveDone && jade.rig.root.visible) {
      this.barkT -= dt; if (this.barkT <= 0) { this.barkT = rand(10, 15); this.bark('jade', ['成龙加油！', '后面！后面！', '哇——这招太帅了！', '用醉拳！用醉拳！'][Math.floor(rand(0, 4))]); }
    }
    if (jade.rig.root.visible && !cutscene) jade.mood = waveDone ? null : AREA.name === 'dock' || AREA.name === 'wh' ? 'scared' : 'cheer';
    if (wave === 5 && !waveDone && !cutscene && !this.raged) {
      const b = enemies.find(e => e.type === 'boss2' && !e.dead);
      if (b && b.hp < b.maxHp * 0.5) {
        this.raged = true; shake = 0.5; sfx('heavy'); shock(b.pos, 0xff3a2a, 3); b.anim.kick('hy', -2);
        banner('刀鲁召唤了影武者！<small>先清掉小兵，再找刀鲁的破绽</small>', 2.5); this.bark('tohru', '影武者——出来！');
        [[-5, 2], [5, 2], [0, 6]].forEach(([dx, dz]) => { const e = new Enemy('khan', clamp(AREA.cx + dx, AREA.cx - AREA.hx + 1, AREA.cx + AREA.hx - 1), clamp(player.pos.z + dz, AREA.cz - AREA.hz + 1, AREA.cz + AREA.hz - 1)); e.yaw = Math.atan2(player.pos.x - e.pos.x, player.pos.z - e.pos.z); enemies.push(e); });
        if (!talismans.length) spawnTalisman(2, AREA.cx + rand(-4, 4), AREA.cz + 5);
      }
    }
  },
  breakVase(v) {
    v.broken = true; v.g.visible = false; this.broken++;
    const i = colliders.indexOf(v.col); if (i >= 0) colliders.splice(i, 1);
    const p = v.g.position.clone().setY(0.6);
    burst(p, v.c, 26, 4.5); burst(p, 0x2a4a9a, 10, 3); shock(v.g.position, 0xffffff, 1.2); impact('glass', { pos: p }); shake = Math.max(shake, 0.1);
    floatText(p.clone().setY(1.4), '啪嚓！', '#ffe9a0');
    this.bark('uncle', ['我的明朝花瓶！', '那可是宋朝的！', '从你工资里扣！', '哎呀呀呀呀呀！我的古董！'][Math.floor(rand(0, 4))]);
  },
};
const doorShot = () => [SC.x + 1.6, 1.7, SC.z + 1.2, SC.x, 1.4, SC.z + SHOP.hz - 0.5];
const INTRO = [
  { who: 'narr', text: '旧金山 · 唐人街 —— 老爹的古董店', shot: () => [SC.x - 6.5, 3.4, SC.z + 5.5, SC.x, 1.1, SC.z - 3] },
  { who: 'uncle', text: '成龙！这只明朝花瓶，你又放到清朝的架子上去了！', act: () => uncle.mood = 'scold' },
  { who: 'jackie', text: '老爹，我刚从考古现场回来，连口水都还没喝……' },
  { who: 'uncle', text: '喝水？古董不会自己掸灰！', act: () => uncle.mood = null },
  { who: 'jade', text: '成龙成龙！快看我在旧箱子里找到了什么！', act: () => { jade.place(SC.x - 6.2, SC.z - 6.4, 0); jade.walkTo(SC.x - 1.6, SC.z - 2.2, 3.2); } },
  { who: 'jackie', text: '小玉？你不是应该在学校吗？', to: 'jade' },
  { who: 'jade', text: '今天是……呃……文化交流日！先别管这个——一块刻着公鸡的石头！' },
  { who: 'uncle', text: '唔……这是十二生肖护身符之一！邪恶的势力一定在找它！' },
  { who: 'narr', text: '砰——！！', act: () => { shopDoors.forEach(d => d.target = 1.75); sfx('heavy'); sfx('clang'); shake = 0.5; burst(new THREE.Vector3(SC.x, 1.2, SC.z + SHOP.hz - 0.4), 0xc9a27a, 40, 5); spawnWave(0); jade.mood = 'scared'; }, shot: doorShot },
  { who: 'thug', text: '老头！把护身符交出来！老板说了，不交就拆了这家店！' },
  { who: 'jackie', text: '不不不不……这里是古董店！拜托，别在这里打！', to: 'thug' },
  { who: 'uncle', text: '成龙！保护护身符——也保护我的古董！', act: () => uncle.mood = 'scold' },
  { who: 'jade', text: '我躲到柜台后面去！', act: () => { uncle.mood = null; jade.mood = null; jade.walkTo(SC.x + 1.2, SC.z - 5.4, 3.6); } },
];
const SHOP_AFTER = [
  { who: 'uncle', text: () => Story.broken ? `我的古董……${Story.broken} 件！整整 ${Story.broken} 件！` : '还好还好……一件古董都没碎。成龙，你今天表现不错。', act: () => { uncle.mood = Story.broken ? 'scold' : null; } },
  { who: 'jade', text: '成龙，不好了！刚才有个家伙趁乱把公鸡护身符抢走，往街上跑了！', act: () => { uncle.mood = null; jade.walkTo(player.pos.x - 1.2, player.pos.z - 0.8, 3); } },
  { who: 'jackie', text: '小玉，你和老爹待在店里，哪儿也不许去！', to: 'jade' },
  { who: 'jade', text: '好——的——' },
  { fade: () => { Story.toStreet(); player.hp = Math.min(player.maxHp, player.hp + 30); } },
  { who: 'narr', text: '唐人街 · 黄昏', shot: () => [5, 3.2, -14, 0, 1.2, -26] },
  { who: 'jackie', text: '跑哪儿去了……', to: 'narr', shot: () => [0.6, 1.7, -21.5, 0, 1.4, -24.5] },
];
const STREET_INTRO = [
  { who: 'jade', text: '在那边！屋顶上有影子在动！' },
  { who: 'jackie', text: '小玉！我不是让你待在店里吗？！', to: 'jade' },
  { who: 'jade', text: '我带了援兵——老爹柜台里的两张护身符！快接着！', act: () => { spawnTalisman(0, player.pos.x - 1.5, player.pos.z + 2.5); spawnTalisman(1, player.pos.x + 1.5, player.pos.z + 2.5); } },
  { who: 'narr', text: '（屋檐下，黑影一个接一个地落了下来……）', act: () => { spawnWave(1); sfx('whoosh'); }, shot: () => [0, 2.6, -27, 0, 1.4, -10] },
  { who: 'jackie', text: '哦，这下不太妙……', to: 'jade' },
];
SHOP_AFTER.push(...STREET_INTRO);
const BOSS_INTRO = [
  { who: 'jade', text: '那些忍者……全都变成影子消失了！', act: () => jade.mood = null },
  { who: 'uncle', text: '哎呀呀呀呀呀！那是影武者！只有恶魔才能召唤它们！', act: () => { if (!uncle.rig.root.visible) uncle.place(1.5, -26.5, 0); uncle.walkTo(player.pos.x + 2, player.pos.z - 1.2, 1.8); } },
  { who: 'jackie', text: '老爹？你怎么也跑出来了？', to: 'uncle' },
  { who: 'uncle', text: '店都被你们拆了，我不出来看着怎么行！' },
  { who: 'narr', text: '咚……咚……咚……（地面在震动）', act: () => { shake = 0.4; sfx('heavy'); spawnWave(2); NPCS.forEach(n => n.mood = 'scared'); } },
  { who: 'tohru', text: '小矮子。把护身符交出来。' },
  { who: 'jackie', text: '这下……真的惨了。', to: 'tohru' },
  { who: 'uncle', text: '小心他的重踏！那是挡不住的——要闪！', act: () => uncle.mood = null },
  { who: 'jade', text: '接着！狗符能把你的血补满！', act: () => { jade.mood = null; spawnTalisman(2, player.pos.x - 1.2, player.pos.z - 1.5); } },
];
// 店里的武器
spawnWeapon(1, SC.x - 7.6, SC.z + 5.2); spawnWeapon(2, SC.x + 2.5, SC.z - 3.3); spawnWeapon(9, SC.x - 3.5, SC.z + 4.6); spawnWeapon(7, SC.x + 5.5, SC.z + 3.8);
