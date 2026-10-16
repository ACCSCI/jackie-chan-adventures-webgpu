// ================= 第四集 · T-13 自适应安保机甲（会学习你的习惯） =================
// 规则（HUD 右侧显示五条“习惯条”，越过阈值就会广播并启用对策；长时间不用会被遗忘）：
//   常往同一侧闪 → 预判那一侧（红圈出现在你习惯闪去的位置）
//   常举盾格挡   → 改用破防抓取（紫色预警，只能闪）
//   轻击连段打满 → 面罩变蓝，招架连段第 3 下（停手或用重击可破）
//   常在空中     → 对空拍击
//   常拉开距离   → 导弹 + 直线突进
// 节奏：每种招式前摇固定；砸地之后有 1 秒散热破绽（伤害 ×1.6）
ETYPES.t13 = { name: 'T-13 自适应安保机甲', hp: 1500, dmg: 16, spd: 2.6, radius: 0.85, scale: 1.3, beast: 1, poise: 1, elite: 1, dieMsg: 'T-13 停机！<small>“分析……失败……对手……无法……预测……”</small>' };
const T13_HABITS = [
  { k: 'dodge', n: '闪避偏向', c: '预判闪避', d: '红圈会出现在你习惯闪去的那一侧' },
  { k: 'block', n: '格挡', c: '破防抓取', d: '紫色预警不能格挡，只能闪' },
  { k: 'combo', n: '轻击连段', c: '连段招架', d: '面罩变蓝时停手，或用重击破招' },
  { k: 'air', n: '滞空', c: '对空拍击', d: '在它附近别老跳' },
  { k: 'range', n: '拉开距离', c: '导弹 + 突进', d: '躲开红圈和直线' },
];
document.head.insertAdjacentHTML('beforeend', `<style>
#t13hud{position:fixed;right:18px;top:120px;width:210px;padding:10px 12px;border-radius:10px;background:rgba(8,14,22,.72);border:1px solid rgba(120,200,255,.35);font:12px "Noto Sans SC",sans-serif;color:#cfe8ff;display:none;pointer-events:none;z-index:6}
#t13hud h4{margin:0 0 6px;font-size:13px;letter-spacing:2px;color:#8fd0ff}
#t13hud .r{margin:5px 0}#t13hud .r span{display:flex;justify-content:space-between}
#t13hud .bar{position:relative;height:6px;background:rgba(255,255,255,.12);border-radius:3px;margin-top:2px;overflow:hidden}
#t13hud .bar i{position:absolute;left:0;top:0;bottom:0;background:#5ab8ff;border-radius:3px}
#t13hud .bar b{position:absolute;top:-1px;bottom:-1px;width:2px;background:#ffd84a;left:60%}
#t13hud .r.on span{color:#ff7a5a}#t13hud .r.on .bar i{background:#ff5a3a}
#t13hud small{display:block;margin-top:6px;color:#8aa;line-height:1.4}
</style>`);
document.body.insertAdjacentHTML('beforeend', '<div id="t13hud"><h4>T-13 · 战术分析</h4><div id="t13rows"></div><small>节奏：出招前摇固定 · 砸地后散热 1 秒（伤害 ×1.6）</small></div>');
const T13_THR = 0.6, T13_FORGET = 0.25;
class T13 extends Beast {
  build() {
    const R = this.rig.root, s = this.scale;
    const ar = this.mat(0x3c4652, { metalness: 0.75, roughness: 0.38, emissive: 0x000000 }, true), wh = this.mat(0xc8ced6, { metalness: 0.55, roughness: 0.35 }, true), yl = this.mat(0xe0a020, { metalness: 0.4, roughness: 0.5 }, true), dk = this.mat(0x1a1e24, { metalness: 0.6, roughness: 0.6 }, true);
    const G = this.body = new THREE.Group(); G.scale.setScalar(s); R.add(G);
    this.J = {}; const J = this.J, grp = (n, par, x, y, z) => { const g = new THREE.Group(); g.position.set(x, y, z); par.add(g); J[n] = g; return g; };
    const pel = grp('pel', G, 0, 1.0, 0); box(0.62, 0.26, 0.42, ar, 0, 0, 0, pel);
    [-1, 1].forEach(k => {
      const n = k < 0 ? 'l' : 'r', h = grp(n + 'h', pel, k * 0.28, -0.06, 0);
      box(0.24, 0.5, 0.28, wh, 0, -0.25, 0, h); const kn = grp(n + 'k', h, 0, -0.5, 0.02);
      mesh(new THREE.SphereGeometry(0.13, 10, 8), dk, 0, 0, 0, kn); box(0.22, 0.46, 0.26, ar, 0, -0.24, 0, kn); box(0.24, 0.1, 0.42, dk, 0, -0.47, 0.07, kn);
      box(0.08, 0.18, 0.2, yl, k * 0.13, -0.18, 0, h);
    });
    const tor = grp('tor', pel, 0, 0.14, 0);
    box(0.9, 0.62, 0.56, ar, 0, 0.42, 0, tor); box(1.06, 0.3, 0.6, wh, 0, 0.72, 0, tor); box(0.56, 0.2, 0.5, dk, 0, 0.12, 0, tor);
    box(0.3, 0.08, 0.04, yl, -0.25, 0.75, 0.31, tor); box(0.3, 0.08, 0.04, yl, 0.25, 0.75, 0.31, tor);
    this.coreM = glowMat(0.4, 2.2, 3.5); mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.06, 16), this.coreM, 0, 0.45, 0.29, tor, false).rotation.x = Math.PI / 2;
    const lbl = canvasTex(128, 64, (c) => { c.fillStyle = '#c8ced6'; c.fillRect(0, 0, 128, 64); c.fillStyle = '#b02020'; c.font = 'bold 44px sans-serif'; c.textAlign = 'center'; c.fillText('T-13', 64, 48); });
    plane(0.4, 0.2, M(0xffffff, { map: lbl }), 0.0, 0.72, 0.305, 0, tor);
    // 背后散热口 + 导弹舱
    this.ventM = glowMat(0.2, 0.05, 0.02); for (let i = 0; i < 3; i++) box(0.6, 0.06, 0.04, this.ventM, 0, 0.3 + i * 0.13, -0.29, tor);
    this.pods = [-1, 1].map(k => { const p = grp(k < 0 ? 'lpod' : 'rpod', tor, k * 0.36, 0.95, -0.22); box(0.3, 0.26, 0.36, ar, 0, 0, 0, p); for (let i = 0; i < 4; i++) mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.05, 8), glowMat(2, 0.3, 0.2), (i % 2 - 0.5) * 0.12, (i < 2 ? 0.05 : -0.06), 0.19, p, false).rotation.x = Math.PI / 2; return p; });
    const hd = grp('head', tor, 0, 0.98, 0.05); box(0.4, 0.32, 0.4, wh, 0, 0.1, 0, hd); box(0.44, 0.08, 0.44, ar, 0, 0.27, 0, hd);
    this.visorM = glowMat(3, 0.3, 0.2); box(0.34, 0.08, 0.04, this.visorM, 0, 0.12, 0.2, hd);
    box(0.04, 0.2, 0.04, dk, 0.16, 0.38, -0.05, hd);
    [-1, 1].forEach(k => {
      const n = k < 0 ? 'l' : 'r', sh = grp(n + 's', tor, k * 0.6, 0.66, 0);
      mesh(new THREE.SphereGeometry(0.2, 12, 8), ar, 0, 0, 0, sh); box(0.34, 0.2, 0.4, wh, k * 0.06, 0.12, 0, sh);
      box(0.2, 0.48, 0.22, ar, 0, -0.3, 0, sh); const el = grp(n + 'e', sh, 0, -0.56, 0);
      mesh(new THREE.SphereGeometry(0.12, 10, 8), dk, 0, 0, 0, el);
      if (k > 0) { box(0.3, 0.5, 0.32, wh, 0, -0.27, 0, el); const cl = grp('claw', el, 0, -0.56, 0); [-1, 0, 1].forEach(f => { const c = box(0.07, 0.24, 0.08, dk, f * 0.09, -0.1, 0.06, cl); c.rotation.x = 0.3; }); }
      else { mesh(new THREE.CylinderGeometry(0.15, 0.17, 0.55, 12), ar, 0, -0.27, 0, el); mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.06, 12), glowMat(0.5, 2, 3), 0, -0.56, 0, el, false); }
    });
    this.kbScale = 0.03; this.hbY = 2.3;
    this.cur = {}; this.hab = { dodgeL: 0, dodgeR: 0, block: 0, combo: 0, air: 0, range: 0 }; this.learned = {}; this.streak = 0; this.streakT = 0; this.seq = null;
    this.slamCd = 6; this.rangeCd = 4; this.aaCd = 0; this.lastPState = null; this.atkN = 0;
    $('t13hud').style.display = 'block'; this.hudT = 0;
  }
  // —— 习惯 ——
  habit(k) { return k === 'dodge' ? Math.max(this.hab.dodgeL, this.hab.dodgeR) : this.hab[k]; }
  dodgeSide() { return this.hab.dodgeL > this.hab.dodgeR ? -1 : 1; }
  learn(dt) {
    const p = player, H = this.hab, dx = p.pos.x - this.pos.x, dz = p.pos.z - this.pos.z, d = Math.hypot(dx, dz) || 1;
    if (p.state === 'dodge' && this.lastPState !== 'dodge' && d < 7) {
      const rx = dz / d, rz = -dx / d, lat = p.dodgeDir.x * rx + p.dodgeDir.y * rz; // >0：往 T-13 视角的右边
      if (Math.abs(lat) > 0.45) { if (lat > 0) { H.dodgeR += 0.2; H.dodgeL = Math.max(0, H.dodgeL - 0.08); } else { H.dodgeL += 0.2; H.dodgeR = Math.max(0, H.dodgeR - 0.08); } }
    }
    this.lastPState = p.state;
    if (p.guard && d < 5) H.block += dt * 0.16;
    if (!p.grounded && d < 6.5) H.air += dt * 0.32;
    if (d > 7.5) H.range += dt * 0.085;
    if ((this.streakT -= dt) <= 0) this.streak = 0;
    for (const k in H) H[k] = clamp(H[k] - dt * 0.022, 0, 1);
    for (const h of T13_HABITS) {
      const v = this.habit(h.k);
      if (!this.learned[h.k] && v >= T13_THR) { this.learned[h.k] = true; this.broadcast(`T-13：分析完毕——检测到习惯【${h.n}${h.k === 'dodge' ? (this.dodgeSide() < 0 ? '·左' : '·右') : ''}】<small>启用对策：${h.c}。${h.d}</small>`, '#ff7a5a'); }
      else if (this.learned[h.k] && v < T13_FORGET) { this.learned[h.k] = false; this.broadcast(`T-13：【${h.n}】数据过期<small>对策「${h.c}」已停用——换个打法，它就跟不上了</small>`, '#7fd8ff'); }
    }
    if ((this.hudT -= dt) <= 0) { this.hudT = 0.15; this.drawHud(); }
  }
  broadcast(html, col) { banner(html, 3); Foley.at('beep', this.pos, { vol: 0.6, rate: 0.8 }); floatText(this.pos.clone().setY(3.4), '分析中…', col, 22); this.visorFlash = 0.6; }
  drawHud() {
    $('t13rows').innerHTML = T13_HABITS.map(h => { const v = this.habit(h.k), on = this.learned[h.k]; const nm = h.k === 'dodge' && v > 0.05 ? h.n + (this.dodgeSide() < 0 ? '·左' : '·右') : h.n;
      return `<div class="r ${on ? 'on' : ''}"><span><b>${nm}</b><em>${on ? '已对策：' + h.c : Math.round(v * 100) + '%'}</em></span><div class="bar"><i style="width:${v * 100}%"></i><b></b></div></div>`; }).join('');
  }
  // —— 受击 ——
  dmgMul() { return this.state === 'vent' ? 1.6 : this.state === 'stun' ? 1.5 : 1; }
  takeHit(dmg, dir, m, kbMul, counter) {
    if (this.dead) return;
    if (this.state === 'parry') {
      if (m.heavy || m.guardBreak) { floatText(this.pos.clone().setY(3), '破招！', '#ffd84a', 30); impact('parry', { pos: this.pos }); super.takeHit(dmg * 1.3, dir, m, kbMul, counter); if (!this.dead) this.stun(1.6, null); return; }
      // 轻击被招架：反手一击
      floatText(this.pos.clone().setY(3), '被看穿了！', '#5ab8ff', 28); impact('parry', { pos: player.pos }); shock(player.pos.clone().setY(1.2), 0x5ab8ff, 1.4);
      this.setState('loco'); this.cd = 0.5; this.parryCount = (this.parryCount || 0) + 1;
      playerTakeHit(this, 12, { unblockable: 1 }); this.hab.combo = Math.min(1, this.hab.combo + 0.1); return;
    }
    if (!m.heavy) { this.streak++; this.streakT = 1.3; if (this.streak >= 4) this.hab.combo = Math.min(1, this.hab.combo + 0.12); }
    else this.streak = 0;
    super.takeHit(dmg, dir, m, kbMul, counter);
    if (this.dead) return;
    if (this.learned.combo && !m.heavy && this.streak >= 2 && (this.state === 'loco' || this.state === 'act') && !this.seq?.noParry) this.enterParry();
  }
  enterParry() { this.cancelTele(); this.seq = null; this.setState('parry'); this.visor = 'blue'; floatText(this.pos.clone().setY(3.2), '招架模式', '#5ab8ff', 24); Foley.at('mech', this.pos, { vol: 0.6 }); }
  parried() { this.release(); this.cancelTele(); this.seq = null; this.stun(1.3, '破绽!'); }
  // —— 招式（前摇固定） ——
  act(steps, dur, o = {}) { this.setState('act'); this.seq = Object.assign({ steps: steps.map(s => ({ t: s[0], f: s[1], done: false })), dur }, o); }
  plan() {
    const p = player, d = Math.hypot(p.pos.x - this.pos.x, p.pos.z - this.pos.z), L = this.learned; this.atkN++;
    if (L.air && !p.grounded && d < 6 && this.aaCd <= 0) return this.antiAir();
    if (d > 7 && this.rangeCd <= 0 && (L.range || Math.random() < 0.35)) return Math.random() < 0.5 ? this.missiles() : this.dash();
    if (d > 6) return this.dash();
    if (this.slamCd <= 0 && d < 4.5) return this.slam();
    if (L.block && Math.random() < 0.65) return this.grab();
    return this.combo();
  }
  predict(wind) { // 预判：在玩家习惯闪去的那一侧放红圈
    if (!this.learned.dodge) return;
    const s = this.dodgeSide();
    Tele.add({ shape: 'circle', x: player.pos.x, z: player.pos.z, r: 1.5, wind, lock: 0.75, col: 'red', src: this, dmg: 16, kd: 1,
      follow: (T) => { const p = player, dx = p.pos.x - this.pos.x, dz = p.pos.z - this.pos.z, d = Math.hypot(dx, dz) || 1; T.x = p.pos.x + dz / d * s * 2.6; T.z = p.pos.z - dx / d * s * 2.6; } });
  }
  combo() {
    const W1 = 0.55, W2 = 0.45; this.pk = 'p1w';
    this.tele = Tele.add({ shape: 'sector', x: this.pos.x, z: this.pos.z, yaw: this.yaw, r: 3.0, arc: 0.75, wind: W1, col: 'amber', src: this, dmg: 14, follow: (T) => { T.x = this.pos.x; T.z = this.pos.z; T.yaw = this.yaw; }, lock: 0.7 });
    this.predict(W1 + 0.3);
    this.act([[0, () => this.pk = 'p1w'], [W1, () => { this.pk = 'p1'; this.lunge(5); Foley.at('swishH', this.pos, { vol: 0.6, rate: 0.7 }); }],
      [W1 + 0.2, () => { this.pk = 'p2w'; this.tele = Tele.add({ shape: 'sector', x: this.pos.x, z: this.pos.z, yaw: this.yaw, r: 3.0, arc: 0.75, wind: W2, col: 'amber', src: this, dmg: 14, follow: (T) => { T.x = this.pos.x; T.z = this.pos.z; T.yaw = this.yaw; }, lock: 0.6 }); this.predict(W2 + 0.3); }],
      [W1 + 0.2 + W2, () => { this.pk = 'p2'; this.lunge(5); Foley.at('swishH', this.pos, { vol: 0.6, rate: 0.75 }); }]], W1 + W2 + 0.95, { track: W1 * 0.7 });
  }
  grab() {
    const W = 0.75; this.pk = 'gw'; Foley.at('mech', this.pos, { vol: 0.6, rate: 0.8 });
    this.tele = Tele.add({ shape: 'sector', x: this.pos.x, z: this.pos.z, yaw: this.yaw, r: 2.7, arc: 0.55, wind: W, col: 'purple', src: this, lock: 0.7, follow: (T) => { T.x = this.pos.x; T.z = this.pos.z; T.yaw = this.yaw; },
      onFire: (T) => { this.tele = null; if (Tele.inside(T, player.pos) && player.pos.y < 1.2) { if (player.iframe > 0) return playerTakeHit(this, 0, {}); player.guard = false; floatText(player.pos.clone().setY(2), '破防抓取！', '#c04dff', 28); playerTakeHit(this, 26, { kd: 1, unblockable: 1 }); shake = 0.35; } } });
    this.predict(W + 0.3);
    this.act([[0, () => this.pk = 'gw'], [W, () => { this.pk = 'g'; this.lunge(6); }]], W + 0.9, { track: W * 0.7 });
  }
  slam() {
    const W = 1.0; this.slamCd = rand(8, 11); this.pk = 'sw'; Foley.at('mech', this.pos, { vol: 0.8, rate: 0.6 });
    this.tele = Tele.add({ shape: 'circle', x: this.pos.x, z: this.pos.z, r: 3.5, wind: W, col: 'red', src: this, dmg: 24, kd: 1 });
    this.act([[0, () => this.pk = 'sw'], [W, () => { this.pk = 's'; shake = 0.5; shock(this.pos.clone().setY(0.05), 0xff6a3a, 3.5); burst(this.pos.clone().setY(0.2), 0xc9a27a, 40, 7); impact('fall', { pos: this.pos, big: true }); Foley.at('explode', this.pos, { vol: 0.5, rate: 0.8 }); }],
      [W + 0.35, () => { this.setState('vent'); this.seq = null; this.pk = 'v'; if (!this.ventTold) { this.ventTold = 1; banner('T-13 过热！<small>砸地后散热 1 秒——这时候打它伤害 ×1.6</small>', 2.2); } Foley.at('thrust', this.pos, { vol: 0.5, rate: 0.6 }); }]], W + 0.4, { noParry: 1 });
  }
  antiAir() {
    const W = 0.42; this.aaCd = 2.2; this.pk = 'aw';
    this.tele = Tele.add({ shape: 'circle', x: player.pos.x, z: player.pos.z, r: 1.6, wind: W, col: 'red', src: this, follow: (T, dt) => { T.x = player.pos.x; T.z = player.pos.z; }, lock: 0.85,
      onFire: (T) => { this.tele = null; if (Tele.inside(T, player.pos) && player.pos.y > 0.25) { floatText(player.pos.clone().setY(2.2), '对空拍击！', '#ff7a5a', 26); playerTakeHit(this, 18, { kd: 1, unblockable: 1 }); } } });
    this.act([[0, () => this.pk = 'aw'], [W, () => { this.pk = 'a'; Foley.at('swishH', this.pos, { vol: 0.7, rate: 0.9 }); }]], W + 0.6, { track: W });
  }
  missiles() {
    this.rangeCd = this.learned.range ? rand(3.5, 5) : rand(8, 11); this.pk = 'mw'; Foley.at('beep', this.pos, { vol: 0.6, rate: 1.2 });
    const shot = (i) => () => {
      Foley.at('thrust', this.pos, { vol: 0.4, rate: 1.4 }); burst(this.J.rpod.getWorldPosition(new THREE.Vector3()), 0xffa040, 8, 3);
      Tele.add({ shape: 'circle', x: player.pos.x, z: player.pos.z, r: 1.7, wind: 1.0, lock: 0.5, col: 'red', src: this, dmg: 14, kd: 1, follow: (T, dt) => { T.x = lerp(T.x, player.pos.x, 1 - Math.exp(-dt * 6)); T.z = lerp(T.z, player.pos.z, 1 - Math.exp(-dt * 6)); },
        onFire: (T) => { const c = T.g.position.clone().setY(0.3); burst(c, 0xff7a2a, 26, 6); shock(c.setY(0.05), 0xff7a2a, 1.6); Foley.at('explode', c, { vol: 0.45 }); shake = Math.max(shake, 0.15); if (Tele.inside(T, player.pos) && player.pos.y < 1.2) playerTakeHit({ pos: c, parried() { } }, 14, { kd: 1, unblockable: 1 }); } });
    };
    this.act([[0, () => this.pk = 'mw'], [0.35, shot(0)], [0.7, shot(1)], [1.05, shot(2)]], 1.6, { track: 1.6 });
  }
  dash() {
    const W = 0.7, p = player, d = Math.hypot(p.pos.x - this.pos.x, p.pos.z - this.pos.z), len = clamp(d + 2.5, 5, 15); this.rangeCd = Math.max(this.rangeCd, this.learned.range ? 2.5 : 5); this.pk = 'dw';
    Foley.at('thrust', this.pos, { vol: 0.5, rate: 0.8 });
    this.tele = Tele.add({ shape: 'lane', x: this.pos.x, z: this.pos.z, yaw: this.yaw, w: 1.9, len, wind: W, lock: 0.75, col: 'red', src: this, follow: (T) => { T.x = this.pos.x; T.z = this.pos.z; T.yaw = this.yaw; },
      onFire: () => { this.tele = null; this.dashLeft = len; this.dashHit = false; this.pk = 'd'; Foley.at('thrust', this.pos, { vol: 0.7, rate: 1.2 }); } });
    this.act([[0, () => this.pk = 'dw']], W + 0.9, { track: W * 0.75, dash: 1 });
  }
  lunge(v) { this.vel.x += Math.sin(this.yaw) * v; this.vel.z += Math.cos(this.yaw) * v; }
  think(dt) {
    const p = player, dx = p.pos.x - this.pos.x, dz = p.pos.z - this.pos.z, d = Math.hypot(dx, dz) || 1;
    this.learn(dt); this.slamCd -= dt; this.rangeCd -= dt; this.aaCd -= dt;
    this.visor = this.state === 'parry' ? 'blue' : this.tele && this.tele.col === 'purple' ? 'purple' : 'red';
    if (this.state === 'loco') {
      this.threat = null; this.pk = 'idle'; this.face(dt, 4);
      let fx = 0, fz = 0; if (d > 2.6) { fx = dx / d; fz = dz / d; } else if (d < 1.8) { fx = -dx / d * 0.5; fz = -dz / d * 0.5; }
      this.steer(dt, fx, fz, this.T.spd * (d > 7 ? 1.4 : 1), 4);
      if (this.cd <= 0 && p.state !== 'dead') this.plan();
      else if (this.learned.air && !p.grounded && d < 6 && this.aaCd <= 0) this.antiAir();
    } else if (this.state === 'act') {
      const S = this.seq; this.threat = this.tele ? (this.tele.col === 'amber' ? 'amber' : 'red') : null;
      if (S.track && this.t < S.track) this.face(dt, 7);
      if (S.dash && this.dashLeft > 0) {
        const sp = 18, step = sp * dt; this.dashLeft -= step; this.vel.set(Math.sin(this.yaw) * sp, 0, Math.cos(this.yaw) * sp);
        if (!this.dashHit && Math.hypot(p.pos.x - this.pos.x, p.pos.z - this.pos.z) < this.radius + 0.5 && p.pos.y < 1.3) { this.dashHit = true; playerTakeHit(this, 18, { kd: 1, unblockable: 1 }); }
        if (Math.random() < dt * 40) burst(this.pos.clone().setY(0.2), 0x7fd8ff, 2, 2);
        if (this.dashLeft <= 0) this.vel.multiplyScalar(0.2);
      } else this.steer(dt, 0, 0, 0, 5);
      for (const s of S.steps) if (!s.done && this.t >= s.t) { s.done = true; s.f(); if (this.state !== 'act') return; }
      if (this.t >= S.dur) { this.setState('loco'); this.seq = null; this.cd = rand(0.6, 1.2); }
    } else if (this.state === 'vent') {
      this.threat = null; this.steer(dt, 0, 0, 0, 6); if (Math.random() < dt * 25) burst(this.pos.clone().setY(2.2 * this.scale * 0.8).addScaledVector(new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw)), 0.5), 0xdddddd, 2, 2);
      if (this.t > 1.0) { this.setState('loco'); this.cd = 0.5; }
    } else if (this.state === 'parry') {
      this.threat = null; this.pk = 'par'; this.face(dt, 8); this.steer(dt, 0, 0, 0, 6);
      if (this.t > 1.4) { this.setState('loco'); this.cd = 0.3; this.streak = 0; }
    }
  }
  // —— 程序化姿态 ——
  pose(dt, v) {
    const J = this.J, P = T13_POSES[this.state === 'stun' ? 'st' : this.state === 'vent' ? 'v' : this.state === 'parry' ? 'par' : this.state === 'act' ? this.pk : 'idle'] || T13_POSES.idle;
    const k = 1 - Math.exp(-dt * (this.state === 'act' && /^(p1|p2|g|s|a|d)$/.test(this.pk) ? 22 : 10));
    for (const n in T13_POSES.idle) this.cur[n] = lerp(this.cur[n] ?? 0, P[n] ?? T13_POSES.idle[n], k);
    const c = this.cur;
    J.tor.rotation.set(c.tx, c.ty, this.wob * Math.sin(now * 35) * 0.05); J.head.rotation.x = c.hx;
    J.ls.rotation.set(c.lsx, 0, c.lsz); J.rs.rotation.set(c.rsx, 0, c.rsz); J.le.rotation.x = c.lex; J.re.rotation.x = c.rex;
    J.pel.position.y = 1.0 + c.py;
    // 走路
    this.ph += dt * v * 2.6; const a = Math.min(1, v / 2) * 0.55;
    const sw = Math.sin(this.ph), crouch = -c.py * 2.2;
    J.lh.rotation.x = sw * a - crouch * 0.6; J.rh.rotation.x = -sw * a - crouch * 0.6;
    J.lk.rotation.x = Math.max(0, -sw) * a * 1.4 + crouch; J.rk.rotation.x = Math.max(0, sw) * a * 1.4 + crouch;
    J.pel.position.y += Math.abs(Math.cos(this.ph)) * 0.04 * a;
    if (v > 0.5 && Math.floor(this.ph / Math.PI) !== this._st) { this._st = Math.floor(this.ph / Math.PI); Foley.at('mech', this.pos, { vol: 0.18, rate: 0.6 }); Impact.thump(60, 35, 0.08, 0.12, 0); }
    // 面罩颜色
    this.visorFlash = Math.max(0, (this.visorFlash || 0) - dt);
    const vf = this.visorFlash > 0 ? 1.5 + Math.sin(now * 40) : 1;
    if (this.visor === 'blue') this.visorM.color.setRGB(0.4, 1.8 * vf, 4 * vf); else if (this.visor === 'purple') this.visorM.color.setRGB(2.6 * vf, 0.5, 4 * vf); else this.visorM.color.setRGB(3 * vf, 0.3, 0.2);
    const vent = this.state === 'vent' ? 1 : 0; this.ventM.color.setRGB(0.2 + vent * 4 * (0.7 + 0.3 * Math.sin(now * 30)), 0.05 + vent * 1.2, 0.02);
    this.coreM.color.setRGB(0.4, this.state === 'stun' ? 0.4 : 2.2, this.state === 'stun' ? 0.6 : 3.5);
  }
  idle(dt) { this.state = this.state === 'dead' ? 'dead' : 'loco'; super.idle(dt); }
  deathAnim(dt) {
    if (!this.cr) { this.cr = 1; $('t13hud').style.display = 'none'; Foley.at('explode', this.pos, { vol: 0.8, rate: 0.7 }); shake = 0.6; }
    if (this.t < 1.6 && Math.random() < dt * 14) { const c = this.pos.clone().add(new THREE.Vector3(rand(-0.6, 0.6), rand(1, 2.6), rand(-0.6, 0.6))); burst(c, Math.random() < 0.5 ? 0xff8a3a : 0x7fd8ff, 10, 4); }
    this.cur.py = lerp(this.cur.py ?? 0, -0.45, 1 - Math.exp(-dt * 3)); this.J.pel.position.y = 1 + this.cur.py; this.J.tor.rotation.x = Math.min(0.7, this.t * 0.5); this.J.head.rotation.x = Math.min(0.6, this.t * 0.6);
    this.visorM.color.setRGB(Math.max(0, 3 - this.t * 2), 0.1, 0.1); this.coreM.color.setRGB(0.1, Math.max(0, 2 - this.t * 1.5), Math.max(0, 3 - this.t * 2));
    // 不缩小消失：残骸留在甲板上
  }
}
const T13_POSES = {
  idle: { tx: 0.08, ty: 0, hx: 0, lsx: -0.3, lsz: 0.25, lex: -0.6, rsx: -0.3, rsz: -0.25, rex: -0.7, py: 0 },
  p1w: { tx: 0, ty: 0.6, rsx: -0.2, rsz: -0.9, rex: -1.8, lsx: -0.8, lsz: 0.3, lex: -1.2, py: -0.08 },
  p1: { tx: 0.25, ty: -0.45, rsx: -1.6, rsz: -0.2, rex: -0.1, lsx: -0.2, lsz: 0.4, lex: -1.0, py: -0.12 },
  p2w: { tx: 0.05, ty: -0.6, lsx: -0.2, lsz: 0.9, lex: -1.8, rsx: -0.8, rsz: -0.3, rex: -1.2, py: -0.08 },
  p2: { tx: 0.25, ty: 0.45, lsx: -1.6, lsz: 0.2, lex: -0.1, rsx: -0.3, rsz: -0.4, rex: -1.0, py: -0.12 },
  gw: { tx: -0.1, ty: 0, lsx: -1.2, lsz: 1.2, lex: -0.3, rsx: -1.2, rsz: -1.2, rex: -0.3, py: -0.1 },
  g: { tx: 0.35, ty: 0, lsx: -1.5, lsz: 0.15, lex: -0.4, rsx: -1.5, rsz: -0.15, rex: -0.4, py: -0.15 },
  sw: { tx: -0.25, ty: 0, hx: -0.3, lsx: -2.8, lsz: 0.2, lex: -0.4, rsx: -2.8, rsz: -0.2, rex: -0.4, py: 0.02 },
  s: { tx: 0.6, ty: 0, hx: 0.2, lsx: -0.9, lsz: 0.3, lex: -0.2, rsx: -0.9, rsz: -0.3, rex: -0.2, py: -0.35 },
  v: { tx: 0.45, ty: 0, hx: 0.4, lsx: -0.2, lsz: 0.35, lex: -0.3, rsx: -0.2, rsz: -0.35, rex: -0.3, py: -0.25 },
  aw: { tx: 0.1, ty: 0.3, hx: -0.5, rsx: 0.4, rsz: -0.6, rex: -1.4, py: -0.18 },
  a: { tx: -0.35, ty: -0.2, hx: -0.6, rsx: -3.0, rsz: -0.1, rex: -0.1, py: 0.05 },
  mw: { tx: -0.2, ty: 0, hx: -0.25, lsx: -1.4, lsz: 0.2, lex: -0.1, rsx: -0.4, rsz: -0.3, rex: -0.6, py: -0.05 },
  dw: { tx: 0.55, ty: 0, hx: -0.3, lsx: 0.6, lsz: 0.3, lex: -0.4, rsx: 0.6, rsz: -0.3, rex: -0.4, py: -0.3 },
  d: { tx: 0.7, ty: 0, hx: -0.4, lsx: 0.9, lsz: 0.2, lex: -0.2, rsx: -1.4, rsz: -0.1, rex: -0.1, py: -0.2 },
  par: { tx: 0.05, ty: 0, hx: 0.1, lsx: -1.4, lsz: -0.5, lex: -1.6, rsx: -1.4, rsz: 0.5, rex: -1.6, py: -0.1 },
  st: { tx: -0.35, ty: 0.2, hx: -0.4, lsx: 0.2, lsz: 0.6, lex: -0.2, rsx: 0.3, rsz: -0.7, rex: -0.2, py: -0.15 },
};
BEAST_CLS.t13 = T13;
{
  const _rs = Menu.resetSession.bind(Menu); Menu.resetSession = function () { _rs(); $('t13hud').style.display = 'none'; };
  const _pl = Story.play.bind(Story); Story.play = function (L, d) { _pl(L, d); $('t13hud').style.display = 'none'; };
  const _uw = updateWaves; updateWaves = function (dt) { _uw(dt); const t = enemies.find(e => e.type === 't13' && !e.dead); $('t13hud').style.display = t && !cutscene ? 'block' : 'none'; };
}
