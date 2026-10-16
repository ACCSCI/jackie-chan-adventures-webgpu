// ================= 背包 / 装备栏（Tab） =================
const Bag = {
  open: false,
  toggle(force) {
    const show = force ?? !this.open;
    if (show === this.open) return;
    if (show && (cutscene || gameOver || !started)) return;
    this.open = show; $('bag').classList.toggle('show', show);
    for (const k in keys) keys[k] = false; buffer.type = null;
    if (show) { this.render(); document.exitPointerLock(); }
    else renderer.domElement.requestPointerLock();
  },
  slot(cls, inner, act, title) { return `<div class="bs ${cls}" ${act ? `data-b="${act}"` : ''} ${title ? `title="${title}"` : ''}>${inner}</div>`; },
  wpnHTML(w, act) {
    if (!w) return this.slot('empty', '<i>空</i>', null);
    const W = WEAPONS[w.type], C = WCLASS[W.cls];
    return this.slot('wp', `<b>${W.name}</b><small>${C.name} · 耐久 ${w.dur >= 999 ? '∞' : w.dur}</small><small>伤害 ×${W.dmg} · 距离 +${W.range}</small>`, act);
  },
  render() {
    if (!this.open) return;
    const p = player, R = Runes;
    const eq = R.eq.map((k, i) => k ? this.slot('rn on', `<span class="ri" style="color:${RUNE[k].color}">${RUNE[k].name}</span><b>${RUNE[k].full}</b><small>${RUNE[k].desc}</small>`, 'r:' + k, '点击卸下') : this.slot('empty', `<i>符文栏 ${i + 1}</i>`, null)).join('');
    const grid = RUNES.map(r => R.owned.has(r.key)
      ? this.slot('rg' + (R.has(r.key) ? ' on' : ''), `<span class="ri" style="color:${r.color}">${r.name}</span><b>${r.full}</b><small>${r.desc}</small>`, 'r:' + r.key, R.has(r.key) ? '点击卸下' : '点击装备')
      : this.slot('rg lock', `<span class="ri">?</span><b>未获得</b><small>${r.how}</small>`, null)).join('');
    const st = STYLES[p.style];
    $('bag').innerHTML = `<div class="bbox"><h3>装备 · 背包 <small>Tab / Esc 关闭 · 已收集符文 ${R.owned.size}/12</small></h3>
      <div class="bcols"><div class="bl">
        <h5>武器</h5><div class="wrow"><div><em>手中</em>${this.wpnHTML(p.weapon, p.weapon ? 'w:hand' : null)}</div><div class="sw" data-b="w:swap" title="交换">⇄</div><div><em>背包</em>${this.wpnHTML(p.weapon2, p.weapon2 ? 'w:swap' : null)}</div></div>
        <div class="btn-row">${p.weapon ? '<button data-b="w:stow">收起手中武器</button><button data-b="w:drop1">丢掉手中</button>' : ''}${p.weapon2 ? '<button data-b="w:drop2">丢掉背包里的</button>' : ''}</div>
        <h5>符文栏（最多 3 个，一直生效）</h5><div class="req">${eq}</div>
        <h5>当前拳法 · <span style="color:${st.css}">${styleLabel(p.style)}</span></h5><p class="sp">${STYLE_PASSIVE[p.style]}</p>
      </div><div class="br"><h5>符文（点击装备 / 卸下）</h5><div class="rgrid">${grid}</div></div></div></div>`;
  },
  click(a) {
    const p = player;
    if (a.startsWith('r:')) return Runes.equip(a.slice(2));
    if (a === 'w:swap' || a === 'w:hand' && p.weapon2) swapWeapons();
    else if (a === 'w:hand' || a === 'w:stow') { if (!p.weapon2) { stowWeapon(); } else swapWeapons(); }
    else if (a === 'w:drop1' && p.weapon) { const o = p.weapon; o.mesh.removeFromParent(); spawnWeapon(o.type, p.pos.x + Math.sin(p.yaw) * 0.8, p.pos.z + Math.cos(p.yaw) * 0.8, o.dur); p.weapon = null; }
    else if (a === 'w:drop2' && p.weapon2) { const o = p.weapon2; spawnWeapon(o.type, p.pos.x - Math.sin(p.yaw) * 0.8, p.pos.z - Math.cos(p.yaw) * 0.8, o.dur); p.weapon2 = null; }
    refreshChips(); this.render();
  },
};
$('bag').addEventListener('mousedown', e => e.stopPropagation());
$('bag').addEventListener('click', e => { const b = e.target.closest('[data-b]'); if (b) { e.stopPropagation(); Bag.click(b.dataset.b); } else if (e.target.id === 'bag') Bag.toggle(false); });
const STYLE_PASSIVE = [
  '龙威：基础伤害系数 1.44，受到伤害 -15%；连击数越高伤害越高（每次连击 +2%，最多 +40%）。力量最大、击退最远。',
  '灵蛇：打中敌人就偷取体力（轻击 +4，重击 +8）；走路 +15%、跑步 +20% 更快。出手最快、最省体力。',
  '醉步：受到攻击时有 80% 几率自动闪开（无冷却、不耗体力，出拳出腿中也能闪）。招式刁钻、重击能撞倒敌人。',
];
function equipMesh(w) { const mesh = weaponMesh(w.type); mesh.rotation.set(0.25, 0, 0); if (WEAPONS[w.type].cls === 'staff') { player.rig.root.add(mesh); initStaffMesh(mesh, w.type); } else if (WEAPONS[w.type].cls === 'blade') { player.rig.root.add(mesh); initBladeMesh(mesh, w.type); } else player.rig.grip.add(mesh); w.mesh = mesh; return w; }
function swapWeapons() {
  const p = player, a = p.weapon, b = p.weapon2;
  if (a) { a.mesh.removeFromParent(); a.mesh = null; }
  p.weapon = b ? equipMesh(b) : null; p.weapon2 = a || null;
  if (p.weapon) showMove(`换上「${WEAPONS[p.weapon.type].name}」`, '#ffd04a'); else showMove('— 空手 —', '#fff');
  refreshChips();
}
function stowWeapon() { const p = player; if (!p.weapon || p.weapon2) return false; const a = p.weapon; a.mesh.removeFromParent(); a.mesh = null; p.weapon2 = a; p.weapon = null; refreshChips(); return true; }

// ================= 全屏 + 键盘锁定（像端游一样拦截快捷键） =================
const FS = {
  locked: false,
  async enter() {
    try { if (!document.fullscreenElement) await document.documentElement.requestFullscreen({ navigationUI: 'hide' }); } catch (e) { tip('浏览器不允许全屏', 2); return; }
    try { if (navigator.keyboard && navigator.keyboard.lock) { await navigator.keyboard.lock(); this.locked = true; } } catch (e) { this.locked = false; }
    this.ui();
  },
  async exit() { try { navigator.keyboard && navigator.keyboard.unlock && navigator.keyboard.unlock(); } catch (e) { } this.locked = false; try { if (document.fullscreenElement) await document.exitFullscreen(); } catch (e) { } this.ui(); },
  toggle() { document.fullscreenElement ? this.exit() : this.enter(); },
  ui() {
    const on = !!document.fullscreenElement;
    document.querySelectorAll('.fsBtn').forEach(b => b.innerHTML = on ? '退出全屏' : '全屏游戏<small>拦截浏览器快捷键 · 按住 Esc 退出</small>');
    const s = $('setFs'); if (s) s.textContent = on ? '开' : '关';
  },
};
document.addEventListener('fullscreenchange', () => { if (!document.fullscreenElement) { FS.locked = false; try { navigator.keyboard && navigator.keyboard.unlock && navigator.keyboard.unlock(); } catch (e) { } } FS.ui(); });
FS.ui();

// ================= 符文主动效果：猪符热光 / 龙符喷火 =================
const RUNE_BEAM_M = { name: '热光眼', dmg: 14, kb: 2, hits: [0], range: 7 }, RUNE_FIRE_M = { name: '龙火', dmg: 12, kb: 3, hits: [0], range: 3.5 };
function runeAoe(m, test, col) {
  const p = player; let n = 0;
  for (const e of enemies) {
    if (e.dead) continue;
    const dx = e.pos.x - p.pos.x, dz = e.pos.z - p.pos.z, f = dx * Math.sin(p.yaw) + dz * Math.cos(p.yaw), sd = dx * Math.cos(p.yaw) - dz * Math.sin(p.yaw);
    if (!test(f, sd, e)) continue;
    const dmg = Math.round(m.dmg * rand(0.9, 1.1)); e.takeHit(dmg, new THREE.Vector2(dx, dz).normalize(), m, 1, false);
    const hp = e.pos.clone(); hp.y += 1.2 * e.scale; floatText(hp, dmg, col, 22); burst(hp, new THREE.Color(col).getHex(), 12, 3); n++;
    gameEvent('hit', { e, dmg, m, counter: false });
  }
  return n;
}
const _beamMat = new THREE.MeshBasicMaterial({ color: 0xff3a2a, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false });
function runeBeam() {
  const p = player, L = 7;
  runeAoe(RUNE_BEAM_M, (f, sd, e) => f > 0 && f < L + e.radius && Math.abs(sd) < 0.6 + e.radius, '#ff6a5a');
  const g = new THREE.Group(); g.position.set(p.pos.x, p.pos.y + 1.62, p.pos.z); g.rotation.y = p.yaw; scene.add(g);
  for (const x of [-0.05, 0.05]) { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, L, 6), _beamMat.clone()); b.rotation.x = Math.PI / 2; b.position.set(x, 0, L / 2); g.add(b); }
  sfx('whoosh'); let k = 0; const fade = () => { k++; g.children.forEach(c => c.material.opacity = 0.9 * (1 - k / 8)); if (k < 8) setTimeout(fade, 30); else { scene.remove(g); g.children.forEach(c => { c.geometry.dispose(); c.material.dispose(); }); } }; setTimeout(fade, 40);
}
function runeFire() {
  const p = player;
  runeAoe(RUNE_FIRE_M, (f, sd, e) => f > 0 && f < 3.5 + e.radius && Math.abs(Math.atan2(sd, f)) < 1.0, '#ff9a3a');
  for (let i = 1; i <= 5; i++) { const q = p.pos.clone(); q.x += Math.sin(p.yaw) * i * 0.65; q.z += Math.cos(p.yaw) * i * 0.65; q.y = 1.2; setTimeout(() => burst(q, i % 2 ? 0xff7a2a : 0xffd04a, 10, 2 + i * 0.4), i * 25); }
  sfx('heavy');
}
// 获得符文：剧情通关节点 & 练功房挑战
const RUNE_CLEAR = ['rat', 'snake', 'tiger', 'horse', 'pig', 'rooster'];
function dojoRunes(n) { if (n >= 3) Runes.award('sheep'); if (n >= 6) Runes.award('monkey'); if (n >= 10) Runes.award('dragon'); }
