// ================= 第三集 · 蛇之护身符：旧金山自然历史博物馆（午夜） =================
const MU = { x: 0, z: 170, hx: 15, hz: 12, h: 9 };
// 新敌人：蛇影忍者（会隐身的影武者）/ 拿到蛇之护身符的阿周
Object.assign(ETYPES, {
  sninja: Object.assign({}, ETYPES.khan, { name: '蛇影忍者', hp: 58, dmg: 11, spd: 4.6, windup: 0.38, scale: 0.98, tint: [0.45, 1.35, 0.85], stealth: { vis: [3.2, 5], hide: [1.6, 2.6] } }),
  chow3: Object.assign({}, ETYPES.thug, { base: 'thug', name: '阿周 · 蛇之隐', hp: 680, dmg: 17, spd: 3.6, windup: 0.45, scale: 1.0, tint: [0.7, 1.35, 0.78], poise: 1, elite: 1,
    stealth: { vis: [4.5, 6.5], hide: [2.4, 3.4], boss: 1 }, dieMsg: '击败 阿周！<small>“我都隐身了……怎么还会输？”</small>' }),
});
ETYPES.sninja.base = 'khan';
WHO.chow.e = () => enemies.find(e => !e.dead && (e.type === 'chow' || e.type === 'chow3')) || enemies.find(e => e.type === 'chow3') || player;
let snakeAltar = null, snakeDome = null;
const cases = [];
(function buildMuseum() {
  const G = new THREE.Group(); G.position.set(MU.x, 0, MU.z); scene.add(G); AREA_GROUPS.museum = G;
  const { hx, hz, h } = MU;
  // 大理石棋盘地砖
  const marble = canvasTex(512, 512, (g, W) => {
    for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) { g.fillStyle = (r + c) % 2 ? '#2c4a40' : '#d8d0bc'; g.fillRect(c * 128, r * 128, 128, 128); }
    g.lineWidth = 1.2; for (let k = 0; k < 26; k++) { g.strokeStyle = `rgba(${Math.random() < .5 ? '255,255,255' : '40,40,40'},.18)`; g.beginPath(); let x = Math.random() * W, y = Math.random() * W; g.moveTo(x, y); for (let j = 0; j < 6; j++) { x += rand(-50, 50); y += rand(-30, 30); g.lineTo(x, y); } g.stroke(); }
    g.fillStyle = 'rgba(0,0,0,.25)'; for (let k = 0; k <= 4; k++) { g.fillRect(k * 128 - 1, 0, 2, W); g.fillRect(0, k * 128 - 1, W, 2); }
  }, [hx / 2, hz / 2]);
  const fl = mesh(new THREE.PlaneGeometry(hx * 2, hz * 2), MS(0xffffff, { map: marble, roughness: 0.35, metalness: 0.05 }), 0, 0.002, 0, G, false); fl.rotation.x = -Math.PI / 2; fl.receiveShadow = true;
  // 墙、踢脚线、壁柱、天花板
  const wm = M(0xb8ae9c), dark = M(0x3a3028), trim = M(0xd8cdb4);
  const wall = (w, x, z, ry) => plane(w, h, wm, x, h / 2, z, ry, G);
  wall(hx * 2, 0, -hz, 0); wall(hx * 2, 0, hz, Math.PI); wall(hz * 2, -hx, 0, Math.PI / 2); wall(hz * 2, hx, 0, -Math.PI / 2);
  box(hx * 2, 0.35, 0.12, dark, 0, 0.17, -hz + 0.06, G).castShadow = false; box(hx * 2, 0.35, 0.12, dark, 0, 0.17, hz - 0.06, G).castShadow = false;
  box(0.12, 0.35, hz * 2, dark, -hx + 0.06, 0.17, 0, G).castShadow = false; box(0.12, 0.35, hz * 2, dark, hx - 0.06, 0.17, 0, G).castShadow = false;
  for (let x = -hx + 3; x < hx; x += 4.5) { box(0.7, h, 0.3, trim, x, h / 2, -hz + 0.15, G).castShadow = false; box(0.7, h, 0.3, trim, x, h / 2, hz - 0.15, G).castShadow = false; }
  for (let z = -hz + 3; z < hz; z += 4.5) { box(0.3, h, 0.7, trim, -hx + 0.15, h / 2, z, G).castShadow = false; box(0.3, h, 0.7, trim, hx - 0.15, h / 2, z, G).castShadow = false; }
  box(hx * 2, 0.5, 0.5, trim, 0, h - 0.25, -hz + 0.25, G).castShadow = false; box(hx * 2, 0.5, 0.5, trim, 0, h - 0.25, hz - 0.25, G).castShadow = false;
  const ceil = mesh(new THREE.PlaneGeometry(hx * 2, hz * 2), M(0x2a2a30), 0, h, 0, G, false); ceil.rotation.x = Math.PI / 2;
  // 天窗：月光
  const sky = mesh(new THREE.PlaneGeometry(8, 6), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.35, 0.5, 0.9), toneMapped: false }), 0, h - 0.02, -1, G, false); sky.rotation.x = Math.PI / 2;
  for (let x = -4; x <= 4; x += 2) box(0.12, 0.12, 6, dark, x, h - 0.08, -1, G).castShadow = false;
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 5.2, h, 4, 1, true), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.25, 0.35, 0.7), transparent: true, opacity: 0.07, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false, fog: false }));
  beam.rotation.y = Math.PI / 4; beam.position.set(0, h / 2, -1); G.add(beam);
  lightPool(0, -1, 5.5, new THREE.Color(0.22, 0.3, 0.6), G);
  // 大理石圆柱
  const col = MS(0xe2dccd, { roughness: 0.4 });
  [[-9, -6], [9, -6], [-9, 1.5], [9, 1.5], [-9, 8], [9, 8]].forEach(([x, z]) => {
    mesh(new THREE.CylinderGeometry(0.45, 0.5, h - 0.8, 16), col, x, (h - 0.8) / 2 + 0.4, z, G);
    box(1.2, 0.4, 1.2, trim, x, 0.2, z, G); box(1.2, 0.4, 1.2, trim, x, h - 0.2, z, G).castShadow = false;
    addCol(G, x - 0.55, x + 0.55, z - 0.55, z + 0.55);
  });
  // 展台：青玉盘蛇 + 蛇之护身符 + 玻璃罩
  const alt = new THREE.Group(); alt.position.set(0, 0, -7.5); G.add(alt);
  mesh(new THREE.CylinderGeometry(1.7, 1.9, 0.5, 20), M(0x3a3028), 0, 0.25, 0, alt); mesh(new THREE.CylinderGeometry(1.2, 1.3, 0.9, 20), M(0xd8cdb4), 0, 0.95, 0, alt);
  const jadeM = M(0x2aa86a, { emissive: 0x0a3a1e });
  const pts = []; for (let i = 0; i <= 70; i++) { const t = i / 70, a = t * Math.PI * 5; const r = 0.75 - t * 0.45; pts.push(new THREE.Vector3(Math.cos(a) * r, 1.48 + t * 1.35, Math.sin(a) * r)); }
  mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 140, 0.13, 10), jadeM, 0, 0, 0, alt);
  const hp = pts[pts.length - 1];
  const head = mesh(new THREE.SphereGeometry(0.2, 12, 8), jadeM, hp.x, hp.y + 0.12, hp.z + 0.1, alt); head.scale.set(1, 0.7, 1.5);
  [-1, 1].forEach(s => mesh(new THREE.SphereGeometry(0.035, 8, 6), glowMat(3, 0.4, 0.4), hp.x + s * 0.09, hp.y + 0.2, hp.z + 0.3, alt, false));
  const st = canvasTex(128, 128, (g) => { g.fillStyle = '#2f8a5a'; g.beginPath(); g.arc(64, 64, 60, 0, TAU); g.fill(); g.fillStyle = '#d8ffe0'; g.font = 'bold 76px "Noto Sans SC",serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('蛇', 64, 68); });
  const sm = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.07, 20), [M(0x5adf9a, { emissive: 0x145a32 }), M(0xffffff, { map: st, emissive: 0x225533, emissiveMap: st }), M(0xffffff, { map: st })]);
  sm.rotation.x = Math.PI / 2; const sg = new THREE.Group(); sg.add(sm); sg.position.set(0, 3.25, 0); alt.add(sg); snakeAltar = sg;
  const glass = new THREE.MeshStandardMaterial({ color: 0xcfefff, transparent: true, opacity: 0.16, roughness: 0.05, metalness: 0.2, depthWrite: false });
  snakeDome = mesh(new THREE.CylinderGeometry(1.15, 1.15, 2.4, 20, 1, true), glass, 0, 2.6, 0, alt, false);
  lightPool(0, 0, 3, new THREE.Color(0.15, 0.55, 0.3), alt);
  addCol(G, -1.9, 1.9, -9.4, -5.6);
  // 红绒围栏
  const brass = M(0xd8a83a, { emissive: 0x2a1a04 }), velvet = M(0x8a1424);
  for (let i = 0; i < 6; i++) { const a = Math.PI * 0.15 + i / 5 * Math.PI * 0.7, x = Math.cos(a) * 3, z = -7.5 + Math.sin(a) * 3; mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.95, 8), brass, x, 0.48, z, G); mesh(new THREE.CylinderGeometry(0.16, 0.18, 0.06, 12), brass, x, 0.03, z, G);
    if (i) { const a0 = Math.PI * 0.15 + (i - 1) / 5 * Math.PI * 0.7, x0 = Math.cos(a0) * 3, z0 = -7.5 + Math.sin(a0) * 3, r = mesh(new THREE.CylinderGeometry(0.03, 0.03, Math.hypot(x - x0, z - z0), 6), velvet, (x + x0) / 2, 0.82, (z + z0) / 2, G, false); r.rotation.z = Math.PI / 2; r.rotation.y = -Math.atan2(z - z0, x - x0); } }
  // 霸王龙骨架（展品）
  const bone = M(0xe6dcc2), dino = new THREE.Group(); dino.position.set(6.5, 0, 5); dino.rotation.y = -0.5; G.add(dino);
  box(6.4, 0.5, 2.2, M(0x4a4036), 0, 0.25, 0, dino);
  const spine = []; for (let i = 0; i <= 22; i++) { const t = i / 22, x = -3.3 + t * 6.8; spine.push(new THREE.Vector3(x, 2.5 + Math.sin(t * Math.PI) * 0.9 - (t < 0.3 ? (0.3 - t) * 2.5 : 0), 0)); }
  spine.forEach((p, i) => mesh(new THREE.SphereGeometry(0.17 - Math.abs(i - 13) * 0.004, 8, 6), bone, p.x, p.y, p.z, dino));
  for (let i = 9; i <= 16; i++) { const p = spine[i]; const r = mesh(new THREE.TorusGeometry(0.55 - Math.abs(i - 12) * 0.05, 0.035, 5, 12, Math.PI), bone, p.x, p.y - 0.05, 0, dino); r.rotation.set(0, Math.PI / 2, Math.PI); }
  const sk = new THREE.Group(); sk.position.set(3.8, 3.3, 0); dino.add(sk);
  box(1.1, 0.5, 0.5, bone, 0, 0, 0, sk); const jaw = box(0.95, 0.15, 0.42, bone, 0.05, -0.35, 0, sk); jaw.rotation.z = -0.25;
  for (let k = 0; k < 5; k++) mesh(new THREE.ConeGeometry(0.03, 0.12, 4), bone, 0.45 - k * 0.18, -0.3, 0.18, sk, false).rotation.x = Math.PI;
  [-1, 1].forEach(s => { mesh(new THREE.CylinderGeometry(0.11, 0.08, 1.4, 8), bone, 0.4, 1.7, s * 0.4, dino).rotation.z = 0.25; mesh(new THREE.CylinderGeometry(0.08, 0.06, 1.3, 8), bone, 0.15, 0.95, s * 0.4, dino).rotation.z = -0.35; box(0.5, 0.1, 0.25, bone, 0.35, 0.55, s * 0.4, dino); mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.5, 6), bone, 2.6, 2.1, s * 0.25, dino).rotation.z = 0.9; });
  mesh(new THREE.CylinderGeometry(0.03, 0.03, 2.2, 6), M(0x555555), -1, 1.3, 0, dino, false); mesh(new THREE.CylinderGeometry(0.03, 0.03, 2.4, 6), M(0x555555), 1.8, 1.4, 0, dino, false);
  addCol(G, 3.2, 9.8, 2.8, 7.4);
  plane(2.2, 0.5, new THREE.MeshBasicMaterial({ map: _tex.sign('霸王龙 · 白垩纪', 512, 120, '#2a2420', '#e8d8b0') }), 4.8, 0.35, 7.25, 0.15, G);
  // 展柜（可被撞碎）
  const woodC = M(0x3a2618), inner = [M(0x2c7aa8), M(0xc8301c, { emissive: 0x2a0602 }), M(0xb88a3a, { emissive: 0x2a1a04 }), M(0x5fb08a)];
  [[-13.2, -8], [-13.2, -1.5], [-13.2, 5], [13.2, -8], [13.2, -1.5], [-4.5, 9.5]].forEach(([x, z], i) => {
    const g = new THREE.Group(); g.position.set(x, 0, z); G.add(g);
    box(1.1, 0.95, 1.1, woodC, 0, 0.47, 0, g);
    const gl = mesh(new THREE.BoxGeometry(1.0, 0.85, 1.0), glass, 0, 1.38, 0, g, false);
    const it = i % 4;
    if (it === 0) { const v = mesh(new THREE.SphereGeometry(0.22, 12, 10), inner[0], 0, 1.25, 0, g); v.scale.y = 1.3; mesh(new THREE.CylinderGeometry(0.08, 0.12, 0.2, 10), inner[0], 0, 1.55, 0, g); }
    else if (it === 1) { mesh(new THREE.BoxGeometry(0.5, 0.2, 0.3), inner[1], 0, 1.05, 0, g); mesh(new THREE.SphereGeometry(0.12, 10, 8), inner[1], 0, 1.25, 0, g); }
    else if (it === 2) { mesh(new THREE.CylinderGeometry(0.22, 0.18, 0.35, 3), inner[2], 0, 1.15, 0, g); [-1, 1].forEach(s => mesh(new THREE.TorusGeometry(0.06, 0.015, 4, 8), inner[2], s * 0.22, 1.25, 0, g, false)); }
    else { mesh(new THREE.TorusGeometry(0.16, 0.05, 6, 16), inner[3], 0, 1.2, 0, g).rotation.x = 0.4; }
    lightPool(0, 0, 1.4, new THREE.Color(0.5, 0.38, 0.18), g);
    const c = { x0: G.position.x + x - 0.6, x1: G.position.x + x + 0.6, z0: G.position.z + z - 0.6, z1: G.position.z + z + 0.6 }; colliders.push(c);
    cases.push({ g, gl, col: c, broken: false, top: g.children.slice(1) });
  });
  // 标牌
  plane(7, 1.1, new THREE.MeshBasicMaterial({ map: _tex.sign('古代中国珍宝特展', 640, 110, '#1a2a24', '#e8d8a0') }), 0, 6.6, -hz + 0.32, 0, G);
  plane(5.4, 0.9, new THREE.MeshBasicMaterial({ map: _tex.sign('旧金山自然历史博物馆', 640, 110, '#2a2420', '#e8d8b0') }), 0, 6.8, hz - 0.32, Math.PI, G);
  plane(1.2, 0.4, new THREE.MeshBasicMaterial({ map: _tex.sign('安全出口', 256, 90, '#0a5a2a', '#e8ffe8'), toneMapped: false }), -hx + 0.32, 3, 9, Math.PI / 2, G);
  // 壁挂卷轴
  [[-hx + 0.32, -5, Math.PI / 2], [hx - 0.32, -5, -Math.PI / 2], [hx - 0.32, 5, -Math.PI / 2]].forEach(([x, z, r], i) => {
    const sc = canvasTex(128, 320, (g, W, H) => { g.fillStyle = '#e8dcc0'; g.fillRect(0, 0, W, H); g.fillStyle = '#2a2a2a'; g.font = 'bold 44px "Noto Sans SC",serif'; g.textAlign = 'center'; ['龍虎蛇', '山水間', '福壽康'][i].split('').forEach((ch, k) => g.fillText(ch, W / 2, 80 + k * 90)); });
    plane(1.1, 2.8, M(0xffffff, { map: sc }), x, 4, z, r, G);
  });
  // 夜间展灯
  [[-13.2, -8], [-13.2, -1.5], [13.2, -8], [13.2, -1.5], [0, 6]].forEach(([x, z]) => lightPool(x, z, 2.8, new THREE.Color(0.22, 0.16, 0.08), G));
  BATCH.push(Object.assign(staticBatch([G], new Set([snakeAltar, snakeDome, beam, ...cases.map(c => c.g)])), { cx: MU.x, cz: MU.z, r: 90 }));
  BATCH.push({ group: G, cx: MU.x, cz: MU.z, r: 90 });
})();
spawnWeapon(4, MU.x - 6, MU.z + 9); spawnWeapon(3, MU.x + 11.5, MU.z - 4); spawnWeapon(0, MU.x - 11, MU.z + 2);
AREA_DEF.museum = () => ({ cx: MU.x, cz: MU.z, hx: MU.hx - 0.5, hz: MU.hz - 0.5, room: true, h: MU.h, sun: 0.9, sunC: 0x9ab8ff, hemi: [0x9aaee0, 0x2a2a34, 1.25], fog: [0x0c1018, 28, 80], night: true });

// ================= 隐身机制 =================
// 隐身时：模型、血条、锁定全部消失，但会留下脚印灰尘与脚步声（立体声定位）；
// 出手前 0.5 秒闪烁现形并发出“嘶——”的蛇声 → 格挡/闪避；隐身时被打中会现形并长时间硬直。
function hiss(pos, vol = 0.45) {
  if (!AC) return; AudioBus.init();
  const t = AC.currentTime, len = 0.55;
  if (!hiss.buf) { const b = AC.createBuffer(1, AC.sampleRate * len | 0, AC.sampleRate), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; hiss.buf = b; }
  const s = AC.createBufferSource(); s.buffer = hiss.buf; s.playbackRate.value = 0.9 + Math.random() * 0.2;
  const f = AC.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 5200; f.Q.value = 1.4;
  const g = AC.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.07); g.gain.setValueAtTime(vol, t + 0.32); g.gain.exponentialRampToValueAtTime(0.0001, t + len);
  s.connect(f); f.connect(g); g.connect(Impact.out(Impact.pan(pos), 1)); s.start(t); s.stop(t + len); Impact.track(s);
}
const Stealth = {
  init(e) { const S = e.T.stealth; e.sh = { mode: 'vis', t: 0, dur: rand(S.vis[0], S.vis[1]) * 0.5, step: 0, side: 1 }; e.hidden = false; },
  set(e, h) { e.hidden = h; e.rig.root.visible = !h; if (h) { if (lockTarget === e) lockTarget = null; e.hb.style.display = 'none'; } },
  vanish(e) {
    const S = e.T.stealth; this.set(e, true); e.release(); e.flash(0);
    Object.assign(e.sh, { mode: 'hide', t: 0, dur: rand(S.hide[0], S.hide[1]) * (e.raged ? 0.75 : 1), side: Math.random() < 0.5 ? 1 : -1 });
    burst(e.pos.clone().setY(1), 0x4be37a, 24, 4); hiss(e.pos, 0.25); e.cd = 99;
  },
  reveal(e, stun) {
    const S = e.T.stealth; this.set(e, false);
    Object.assign(e.sh, { mode: 'vis', t: 0, dur: rand(S.vis[0], S.vis[1]) * (e.raged ? 0.7 : 1) });
    burst(e.pos.clone().setY(1.1 * e.scale), 0x4be37a, 30, 4.5);
    if (stun && !e.dead) {
      floatText(e.pos.clone().setY(2.3 * e.scale), '现形！', '#7dffb0', 28); e.release(); e.flash(0);
      e.clip = staggerClip(e.base, true); e.setState('stagger', 0.05); shock(e.pos.clone().setY(0.1), 0x4be37a, 1.6);
    }
    e.cd = rand(0.8, 1.4);
  },
  strike(e) {
    e.sh.mode = 'strike'; e.atk = EATK[e.k][0]; e.setState('attack', 0.1); e.didHit = false; e.cd = 0;
    hiss(e.pos, e.T.stealth.boss ? 0.6 : 0.45);
  },
  pre(e, dt) {
    const p = player, S = e.T.stealth, sh = e.sh, dist = Math.hypot(p.pos.x - e.pos.x, p.pos.z - e.pos.z);
    if (e.dead) { if (e.hidden) this.set(e, false); return; }
    if (S.boss && !e.raged && e.hp < e.maxHp * 0.5) {
      e.raged = true; banner('阿周：“蛇之力……再来两个兄弟！”<small>他隐身得更频繁了——听脚步声和嘶嘶声！</small>', 2.6);
      [-1, 1].forEach(s => { const x = clamp(e.pos.x + s * 3, AREA.cx - AREA.hx + 1.5, AREA.cx + AREA.hx - 1.5), z = clamp(e.pos.z - 2, AREA.cz - AREA.hz + 1.5, AREA.cz + AREA.hz - 1.5); const n = new Enemy('sninja', x, z); n.yaw = Math.atan2(p.pos.x - x, p.pos.z - z); enemies.push(n); });
      shake = 0.3; shock(e.pos.clone().setY(0.1), 0x4be37a, 3);
    }
    sh.t += dt;
    if (sh.mode === 'vis') { if (e.state === 'loco' && sh.t > sh.dur && dist > 2 && p.state !== 'dead') this.vanish(e); }
    else if (sh.mode === 'hide') {
      e.cd = 99;
      if (e.state !== 'loco') { this.reveal(e, false); return; }
      if ((sh.step -= dt) <= 0) { // 脚印：灰尘 + 脚步声
        sh.step = S.boss ? 0.3 : 0.36;
        burst(e.pos.clone().setY(0.04), 0xb8c8b0, S.boss ? 4 : 3, 1.1);
        Impact.layer('step', { vol: S.boss ? 0.5 : 0.32, rate: 1.15, pan: Impact.pan(e.pos) });
      }
      if (sh.t > sh.dur && dist < 2.9) this.strike(e);
      else if (sh.t > sh.dur + 3) this.strike(e);
    } else if (sh.mode === 'strike' && e.state !== 'attack') { this.reveal(e, false); }
  },
  post(e, dt) {
    if (e.dead) return; const sh = e.sh, p = player;
    if (sh.mode === 'hide') {
      // 绕到侧面伏击（不从正后方，留出格挡空间）
      const a = p.yaw + sh.side * 1.75, tx = p.pos.x + Math.sin(a) * 1.9, tz = p.pos.z + Math.cos(a) * 1.9;
      const dx = tx - e.pos.x, dz = tz - e.pos.z, d = Math.hypot(dx, dz) || 1, sp = e.T.spd * 1.2 * Math.min(1, d);
      e.vel.x = lerp(e.vel.x, dx / d * sp, 1 - Math.exp(-dt * 6)); e.vel.z = lerp(e.vel.z, dz / d * sp, 1 - Math.exp(-dt * 6));
      e.hb.style.display = 'none';
    } else if (sh.mode === 'strike' && e.state === 'attack') {
      const w = e.atk.wind;
      if (e.t < w) { const on = ((now * 28) | 0) % 2 === 0 || e.t > w * 0.75; e.rig.root.visible = on; e.hidden = !on; if (!on) e.hb.style.display = 'none'; const k = 0.6 * Math.min(1, e.t / w); e.rig.mats.forEach(m => m.emissive.setRGB(k * 0.15, k, k * 0.45)); }
      else if (e.hidden || !e.rig.root.visible) this.set(e, false);
    }
  },
};
{
  const _up = Enemy.prototype.update, _th = Enemy.prototype.takeHit, _pa = Enemy.prototype.parried;
  Enemy.prototype.update = function (dt) {
    if (this.T.stealth) { if (!this.sh) Stealth.init(this); Stealth.pre(this, dt); }
    if (player.sneakT > 0 && this.state === 'loco' && !this.dead) this.cd = Math.max(this.cd, 0.25); // 玩家蛇隐：敌人不敢出手
    _up.call(this, dt);
    if (this.T.stealth) Stealth.post(this, dt);
  };
  Enemy.prototype.takeHit = function (dmg, dir, m, kbMul, counter) {
    const ambush = this.T.stealth && this.sh && (this.hidden || (this.sh.mode === 'strike' && this.state === 'attack' && this.t < this.atk.wind));
    _th.call(this, dmg, dir, m, kbMul, counter || ambush);
    if (ambush && !this.dead) { Stealth.reveal(this, true); impact('parry', { pos: this.pos }); }
    else if (ambush && this.dead) Stealth.set(this, false);
  };
  Enemy.prototype.parried = function () { _pa.call(this); if (this.T.stealth && this.sh && this.sh.mode !== 'vis') { Stealth.set(this, false); Object.assign(this.sh, { mode: 'vis', t: 0 }); } };
}

// ================= 展柜：被撞碎 =================
const MUSEUM_BARK = ['成龙！那是唐朝的！', '展柜！小心展柜！', '我什么都没看见……', '博物馆的保险够赔吗？'];
function breakCase(c) {
  c.broken = true; c.top.forEach(o => o.visible = false); const i = colliders.indexOf(c.col); if (i >= 0) colliders.splice(i, 1);
  const p = c.g.getWorldPosition(new THREE.Vector3()).setY(1.3);
  burst(p, 0xcfefff, 34, 5); burst(p, 0xd8a83a, 8, 3); impact('glass', { pos: p }); shake = Math.max(shake, 0.12);
  floatText(p.clone().setY(1.9), '哗啦！', '#cfefff'); Story.mBroken = (Story.mBroken || 0) + 1;
  if (uncle.rig.root.visible) Story.bark('uncle', ['文物！文物啊！', '从你工资里扣！', '哎呀呀呀呀呀！'][Math.floor(rand(0, 3))]);
  else if (jade.rig.root.visible) Story.bark('jade', MUSEUM_BARK[Math.floor(rand(0, 4))]);
}
function resetCases() { for (const c of cases) { c.broken = false; c.top.forEach(o => o.visible = true); if (!colliders.includes(c.col)) colliders.push(c.col); } }
{
  const _su = Story.update.bind(Story);
  Story.update = function (dt) {
    _su(dt);
    if (AREA.name !== 'museum') return;
    for (const c of cases) {
      if (c.broken) continue; const cp = c.g.getWorldPosition(new THREE.Vector3());
      for (const e of [player, ...enemies]) {
        const fast = e === player ? ['dodge', 'down', 'kipup', 'hit'].includes(e.state) && Math.hypot(e.vel.x, e.vel.z) > 2 : Math.hypot(e.vel.x, e.vel.z) > 3.2 || e.state === 'down' || e.state === 'dead';
        if (!fast) continue;
        if (Math.abs(e.pos.x - cp.x) < 0.6 + (e.radius || 0.4) + 0.1 && Math.abs(e.pos.z - cp.z) < 0.6 + (e.radius || 0.4) + 0.1) { breakCase(c); break; }
      }
    }
  };
}

// ================= 蛇符觉醒（第三集通关奖励） =================
const SNAKE2 = { get on() { try { return localStorage.getItem('jc_snake2') === '1'; } catch (e) { return false; } } };
function snakeDesc() { const R = RUNES.find(r => r.key === 'snake'); if (R && SNAKE2.on) { R.full = '蛇符 · 隐身（觉醒）'; R.desc = '敌人出手间隔 +35%；完美闪避/完美格挡后隐身 2.5 秒：敌人不敢出手，隐身中的第一击伤害 ×1.8'; } }
snakeDesc();
player.sneakT = 0;
{
  const _ge = gameEvent;
  gameEvent = function (k, d) {
    _ge(k, d);
    if ((k === 'pdodge' || k === 'parry') && Runes.has('snake') && SNAKE2.on) {
      player.sneakT = 2.5; showMove('蛇隐！ 敌人看不见你', '#4be37a'); burst(player.pos.clone().setY(1.1), 0x4be37a, 26, 3.5); hiss(player.pos, 0.3);
    }
  };
  const _upd = updatePlayer;
  updatePlayer = function (dt) {
    _upd(dt); const p = player;
    if (p.sneakT > 0) {
      p.sneakT -= dt; const k = p.sneakT > 0 ? 0.25 + 0.12 * Math.sin(now * 12) : 0;
      if (p.rig && p.rig.mats) p.rig.mats.forEach(m => { if (m.emissive) m.emissive.setRGB(k * 0.1, k, k * 0.5); });
      document.body.classList.toggle('sneak', p.sneakT > 0);
    }
  };
}
document.head.insertAdjacentHTML('beforeend', '<style>body.sneak::after{content:"";position:fixed;inset:0;pointer-events:none;box-shadow:inset 0 0 140px rgba(60,230,130,.45);z-index:5}</style>');
// 隐身中的第一击（由 playerHitCheck 读取）
function sneakBonus() { if (player.sneakT > 0) { player.sneakT = 0.0001; return true; } return false; }

// ================= 波次与章节 =================
WAVES.push(
  { title: '第九章 · 午夜博物馆', sub: '黑手帮抢先潜入——小心别撞碎展柜！', list: ['thug', 'thug', 'khan', 'thug', 'khan', 'thug'], at: [[-4, -3], [4, -3], [0, -4.5], [-6, 2], [6, 0], [0, 4]] },
  { title: '第十章 · 蛇影忍者', sub: '看不见的敌人——看脚印、听脚步，出手前会闪一下', list: ['sninja', 'sninja', 'brute', 'sninja'], at: [[-5, -3], [5, -3], [0, -4], [0, 4.5]] },
  { title: '第十一章 · 隐身的阿周', sub: '听到“嘶——”就格挡或闪避；打中隐身的他会现形！', list: ['chow3', 'sninja'], at: [[0, -4.5], [-5, -1]], boss: 1 },
);
CHAPTERS.push(
  { w: 9, n: '第九章', t: '午夜博物馆', d: '第三集 · 夜闯古代中国珍宝展', ep: 3 },
  { w: 10, n: '第十章', t: '蛇影忍者', d: '第三集 · 看不见的忍者', ep: 3 },
  { w: 11, n: '第十一章', t: '隐身的阿周', d: '第三集 · 蛇之护身符落进了阿周手里', ep: 3 },
);

// ================= 第三集剧情 =================
const EP3_PROLOGUE = [
  { who: 'narr', text: '第三集 · 蛇之护身符', act: () => sfx('clang'), shot: () => [SC.x + 2.5, 2.2, SC.z + 1, SC.x, 1.3, SC.z - 4] },
  { who: 'jade', text: '成龙！你看报纸！博物馆的古代中国珍宝展，有一块刻着蛇的石牌！', act: () => jade.mood = 'cheer' },
  { who: 'uncle', text: '给我看看……没错！是蛇之护身符！拿着它的人可以隐身！', act: () => { jade.mood = null; uncle.mood = 'scold'; } },
  { who: 'jackie', text: '隐身？要是让黑手帮拿到了……', to: 'uncle' },
  { who: 'uncle', text: '你就看不见他们，他们却看得见你！今晚闭馆以后，你去把它借回来！', act: () => uncle.mood = null },
  { who: 'jackie', text: '借？老爹，那叫偷！', to: 'uncle' },
  { who: 'uncle', text: '那叫保护文物！快去快去！', act: () => uncle.mood = 'scold' },
  { who: 'jade', text: '我也去！' },
  { who: 'jackie', text: '不行。', to: 'jade' },
  { fade: () => Story.toMuseum() },
];
const MUSEUM_INTRO = [
  { who: 'narr', text: '旧金山 · 自然历史博物馆 · 午夜', shot: () => [MU.x + 10, 6, MU.z + 10, MU.x, 2, MU.z - 5] },
  { who: 'narr', text: '（月光从天窗洒下来，恐龙骨架的影子投在大理石地板上）', shot: () => [MU.x + 1.5, 3.5, MU.z - 2.5, MU.x, 3, MU.z - 7.5] },
  { who: 'jackie', text: '（小声）蛇之护身符……应该就在大厅中间的展台上。', to: 'narr', shot: () => [MU.x + 1.2, 1.7, MU.z + 6.8, MU.x, 1.4, MU.z + 9] },
  { who: 'jade', text: '成龙！我从通风口爬进来的！', act: () => { jade.place(MU.x - 2, MU.z + 10.5, Math.PI); jade.walkTo(MU.x - 1.6, MU.z + 9.6, 3); } },
  { who: 'jackie', text: '小玉！……算了，躲好，什么都别碰。', to: 'jade' },
  { who: 'thug', text: '是成龙！别让他靠近那个展台！', act: () => { spawnWave(9); jade.mood = 'scared'; sfx('whoosh'); }, shot: () => [MU.x + 3, 2.4, MU.z + 6, MU.x, 1.4, MU.z - 3] },
  { who: 'jade', text: '小心那些玻璃展柜！撞碎了可赔不起！', act: () => { jade.mood = null; jade.walkTo(MU.x - 11.5, MU.z + 9.5, 3.4); } },
];
EP3_PROLOGUE.push(...MUSEUM_INTRO);
const SNINJA_INTRO = [
  { who: 'jackie', text: '呼……这次应该没人了吧？', to: 'jade' },
  { who: 'narr', text: '（展厅的灯，一盏接一盏地熄灭了）', act: () => { shake = 0.15; sfx('block'); }, shot: () => [MU.x + 2, 2.6, MU.z + 3, MU.x, 1.4, MU.z - 5] },
  { who: 'jade', text: '成龙……地上的灰尘在动！' },
  { who: 'narr', text: '（青色的影子从柱子后面浮现，又消失在了空气里）', act: () => { spawnWave(10); enemies.forEach(e => { if (!e.dead) burst(e.pos.clone().setY(1), 0x4be37a, 24, 4); }); hiss(player.pos, 0.4); jade.mood = 'scared'; } },
  { who: 'jackie', text: '隐身的忍者？！', to: 'narr' },
  { who: 'jade', text: '看地上的脚印，听脚步声！它们出手之前会闪一下，那时候格挡！', act: () => jade.mood = null },
];
const CHOW_INTRO = [
  { who: 'narr', text: '（展台的玻璃罩“咔嚓”一声裂开了）', act: () => { if (snakeDome) { burst(snakeDome.getWorldPosition(new THREE.Vector3()), 0xcfefff, 40, 5); snakeDome.visible = false; } impact('glass', { pos: player.pos }); }, shot: () => [MU.x + 2.2, 2.4, MU.z - 3.2, MU.x, 2.2, MU.z - 7.5] },
  { who: 'chow', text: '嘿嘿嘿……找这个吗，成龙？', act: () => { spawnWave(11); const c = enemies.find(e => e.type === 'chow3'); if (c) { c.pos.set(MU.x, 0, MU.z - 5); c.yaw = 0; } if (snakeAltar) snakeAltar.visible = false; } },
  { who: 'narr', text: '（阿周举起一块青绿色的护身符——下一秒，他整个人消失了）', act: () => { const c = enemies.find(e => e.type === 'chow3'); if (c) { if (!c.sh) Stealth.init(c); Stealth.vanish(c); } hiss(player.pos, 0.5); } },
  { who: 'jackie', text: '阿周？！你在哪儿？', to: 'narr' },
  { who: 'chow', text: '在你后面！不对，在你前面！哈哈哈，你永远猜不到！' },
  { who: 'jade', text: '他隐身的时候也会留下脚印！打中他就会现形！' },
  { who: 'uncle', text: '成龙！听着！隐身的人出手之前，蛇的力量会发出嘶嘶声！听到就格挡！', act: () => { uncle.place(MU.x + 1.6, MU.z + 10.6, Math.PI); uncle.mood = 'scold'; } },
  { who: 'jackie', text: '老爹？你怎么也来了？', to: 'uncle' },
  { who: 'uncle', text: '我来确认你没有打碎任何文物！', act: () => uncle.mood = null },
  { who: 'jade', text: '狗符给你！撑不住了就去捡！', act: () => { if (!jade.rig.root.visible) jade.place(MU.x - 11.5, MU.z + 9.5, Math.PI); spawnTalisman(2, MU.x + 5, MU.z + 9); } },
];
const EP3_ENDING = [
  { who: 'narr', text: '（阿周摔倒在恐龙骨架下面，蛇之护身符从他手里飞了出去）', act: () => { const c = enemies.find(e => e.type === 'chow3'); if (c) Stealth.set(c, false); burst((c ? c.pos : player.pos).clone().setY(0.5), 0x4be37a, 34, 4); sfx('clang'); } },
  { who: 'chow', text: '不公平……我都隐身了……' },
  { who: 'jackie', text: '隐身是隐身，可你的脚步声，跟大象一样响。', to: 'chow' },
  { who: 'narr', text: '（警报声响起，阿周一溜烟从窗户逃走了）', act: () => { const c = enemies.find(e => e.type === 'chow3'); burst((c ? c.pos : player.pos).clone().setY(1), 0x333344, 40, 4); if (c) c.rig.root.visible = false; sfx('whoosh'); } },
  { who: 'uncle', text: '别追了！护身符要紧！', act: () => { jade.place(player.pos.x - 2, player.pos.z + 2.4, 0); uncle.place(player.pos.x + 2, player.pos.z + 2.2, 0); } },
  { who: 'narr', text: '（蛇之护身符落进成龙手里，青光一闪——他的手消失了一瞬间）', act: () => { burst(player.pos.clone().setY(1.3), 0x4be37a, 40, 4); shock(player.pos.clone().setY(0.1), 0x4be37a, 2); hiss(player.pos, 0.4); } },
  { who: 'jackie', text: '哇！我的手！……又回来了。', to: 'jade' },
  { who: 'jade', text: '酷！成龙，下次让我试试！', act: () => jade.mood = 'cheer' },
  { who: 'uncle', text: '不行！三个找回来了，还有九个！', act: () => { jade.mood = null; uncle.mood = 'scold'; } },
  { who: 'uncle', text: '还有一件事！' },
  { who: 'uncle', text: () => (Story.mBroken || 0) > 0 ? '还有你撞碎的那些展柜！赔偿金，从你工资里扣！' : '恐龙骨架的尾巴被你踢歪了！修理费，从你工资里扣！' },
  { who: 'jackie', text: '……我知道，从我的工资里扣。', to: 'uncle' },
  { who: 'jade', text: '哈哈哈哈！', act: () => { uncle.mood = null; jade.mood = 'cheer'; } },
];
Object.assign(Story, {
  toMuseum() {
    this.setArea('museum'); this.putPlayer(MU.x, MU.z + 8.5, Math.PI); uncle.hide(); jade.hide();
    resetCases(); this.mBroken = 0; if (snakeAltar) snakeAltar.visible = true; if (snakeDome) snakeDome.visible = true;
  },
  beginEp3(ch) {
    if (ch === 9) {
      this.setArea('shop'); this.putPlayer(SC.x + 0.4, SC.z - 1.6, Math.PI);
      uncle.place(SC.x, SC.z - 5.3, 0); jade.place(SC.x + 1.7, SC.z - 3.8, -0.6);
      this.play(EP3_PROLOGUE, () => startWave(9));
    } else if (ch === 10) { this.toMuseum(); jade.place(MU.x - 11.5, MU.z + 9.5, Math.PI); this.play(SNINJA_INTRO, () => startWave(10)); }
    else { this.toMuseum(); jade.place(MU.x - 11.5, MU.z + 9.5, Math.PI); this.play(CHOW_INTRO, () => startWave(11)); }
  },
  onClearEp3(w, T) {
    if (w === 9) T(1.6, SNINJA_INTRO, () => startWave(10));
    else if (w === 10) T(1.8, CHOW_INTRO, () => startWave(11));
    else T(2.2, EP3_ENDING, () => { try { localStorage.setItem('jc_snake2', '1'); } catch (e) { } snakeDesc(); gameEnd(true, 3); });
  },
});
{
  const _ua = updateAreas;
  updateAreas = function (dt) { _ua(dt); if (snakeAltar && snakeAltar.visible && AREA.name === 'museum') { snakeAltar.rotation.y += dt * 1.2; snakeAltar.position.y = 3.25 + Math.sin(now * 2) * 0.06; } };
  const _rs = Menu.resetSession.bind(Menu);
  Menu.resetSession = function () { _rs(); resetCases(); player.sneakT = 0; document.body.classList.remove('sneak'); if (player.rig && player.rig.mats) player.rig.mats.forEach(m => m.emissive && m.emissive.setRGB(0, 0, 0)); Story.mBroken = 0; };
}
Menu.refresh();
