// ================= 等级 · 经验 · 十二符咒槽 · 物品栏 =================
// 成龙默认 0 级，每升一级解锁一个符咒槽（最多 12 级 = 12 个槽全开）。打怪、支线、宝箱、发现地标都给经验。
const LV = {
  max: 12, lv: 0, xp: 0, total: 0,
  need(l = this.lv) { return 60 + 70 * l; },
  slots() { return Math.min(12, this.lv); },
  load() {
    try {
      const s = localStorage.getItem('jc_lv');
      if (s) { const o = JSON.parse(s); this.lv = clamp(o.lv | 0, 0, 12); this.xp = o.xp | 0; this.total = o.total | 0; }
      else if (Runes.owned.size) { this.lv = Math.min(12, Math.max(3, Math.floor(Runes.owned.size * 0.75))); } // 老存档：至少保留原来的 3 个槽
    } catch (e) { }
  },
  save() { try { localStorage.setItem('jc_lv', JSON.stringify({ lv: this.lv, xp: this.xp, total: this.total })); } catch (e) { } },
  gain(n, pos, why) {
    if (!n || MODE === 'dojo') return; n = Math.round(n); this.total += n;
    if (pos) floatText(pos.clone().setY(pos.y + 2.6), `+${n} 经验`, '#c79bff', 18);
    if (this.lv >= this.max) { this.xp = 0; this.save(); this.hud(); return; }
    this.xp += n;
    while (this.lv < this.max && this.xp >= this.need()) { this.xp -= this.need(); this.lv++; this.levelUp(); }
    if (this.lv >= this.max) this.xp = 0;
    this.save(); this.hud();
  },
  levelUp() {
    const p = player; p.hp = p.maxHp; p.st = 100;
    banner(`等级提升！Lv ${this.lv}<small>解锁第 ${this.lv} 个符咒槽${this.lv >= 12 ? '——十二个槽全部开启！' : ''} · 生命、体力回满 · 按 Tab 装上符咒</small>`, 3);
    burst(p.pos.clone().setY(1.2), 0xc79bff, 60, 6); shock(p.pos.clone().setY(0.1), 0xc79bff, 4); Foley.at && Foley.at('magic', p.pos, { vol: 0.8, rate: 1.2 }); sfx('clang');
    Runes.autoFill(); Bag.render();
  },
  hud() {
    let el = $('lvb'); if (!el) return;
    el.querySelector('b').textContent = 'Lv ' + this.lv;
    el.querySelector('i').style.width = (this.lv >= this.max ? 100 : this.xp / this.need() * 100) + '%';
    el.title = this.lv >= this.max ? '已满级' : `经验 ${this.xp} / ${this.need()}`;
  },
};
document.head.insertAdjacentHTML('beforeend', `<style>
#lvb{display:flex;align-items:center;gap:6px;margin-top:3px;font-size:11px;color:#d8c4ff}#lvb b{min-width:34px}#lvb .xb{flex:1;height:5px;background:rgba(255,255,255,.12);border-radius:3px;overflow:hidden}#lvb i{display:block;height:100%;width:0;background:linear-gradient(90deg,#8a5cff,#d9b8ff);transition:width .3s}
#bag .bbox.v2{width:min(1120px,96vw)}
#bag .v2cols{display:flex;gap:22px;align-items:flex-start}
#bag .wheel{flex:0 0 430px;height:430px;position:relative;border-radius:50%;background:radial-gradient(circle,rgba(255,208,74,.10) 0 30%,rgba(255,255,255,.03) 31% 64%,rgba(255,208,74,.07) 65% 66%,transparent 67%);border:1px solid rgba(255,208,74,.25)}
#bag .wheel .ctr{position:absolute;left:50%;top:50%;width:150px;transform:translate(-50%,-50%);text-align:center}
#bag .wheel .ctr .lv{font-size:34px;font-weight:900;color:#d9b8ff;line-height:1}#bag .wheel .ctr small{display:block;color:#aaa;font-size:11px;margin-top:4px}
#bag .wheel .ctr .xb{height:6px;background:rgba(255,255,255,.12);border-radius:3px;overflow:hidden;margin:6px 8px}#bag .wheel .ctr .xb i{display:block;height:100%;background:linear-gradient(90deg,#8a5cff,#d9b8ff)}
#bag .slot{position:absolute;width:74px;height:74px;margin:-37px 0 0 -37px;border-radius:50%;border:2px solid rgba(255,255,255,.18);background:rgba(20,18,28,.92);display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:pointer;transition:.12s;text-align:center}
#bag .slot:hover{border-color:#ffd04a;transform:scale(1.07)}
#bag .slot .g{font-size:30px;font-weight:900;line-height:1}#bag .slot small{font-size:10px;color:#aaa;line-height:1.1;margin-top:2px}
#bag .slot.lock{cursor:default;opacity:.45;border-style:dashed}#bag .slot.lock:hover{transform:none;border-color:rgba(255,255,255,.18)}
#bag .slot.on{box-shadow:0 0 14px var(--c);border-color:var(--c)}
#bag .slot.drop{border-color:#7dffb0}
#bag .rside{flex:1;min-width:0}
#bag .igrid{display:grid;grid-template-columns:repeat(6,1fr);gap:6px}
#bag .it{border:1px solid rgba(255,255,255,.16);border-radius:9px;background:rgba(255,255,255,.04);height:74px;display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:pointer;position:relative;text-align:center;padding:2px}
#bag .it:hover{border-color:#ffd04a;background:rgba(255,208,74,.08)}#bag .it .g{font-size:26px;font-weight:900;line-height:1}#bag .it small{font-size:10px;color:#bbb;line-height:1.15}
#bag .it .n{position:absolute;right:5px;top:3px;font-size:11px;color:#ffd04a}
#bag .it.empty{cursor:default;opacity:.25}
#bag .info{min-height:40px;font-size:12px;color:#ccc;margin-top:8px;line-height:1.5;border-top:1px solid rgba(255,255,255,.08);padding-top:6px}
</style>`);
document.querySelector('#hud .bars') && document.querySelector('#hud .bars').insertAdjacentHTML('beforeend', '<div id="lvb"><b>Lv 0</b><div class="xb"><i></i></div></div>');
// ---------- 物品 ----------
const ITEMS = {
  bun: { name: '叉烧包', g: '包', c: '#ffd9a0', desc: '回复 40 生命（V 键快速使用）', use() { return healP(40); } },
  tea: { name: '菊花茶', g: '茶', c: '#a8ff8a', desc: '体力回满，8 秒内体力消耗减半', use() { player.st = 100; ITEMBUFF.tea = now + 8; return true; } },
  wine: { name: '跌打酒', g: '酒', c: '#ff9a6a', desc: '生命回满', use() { return healP(999); } },
  scroll: { name: '武学残卷', g: '卷', c: '#e8d8a8', desc: '阅读获得 120 经验', use() { LV.gain(120, player.pos); return true; } },
  relic: { name: '古董', g: '宝', c: '#7fe9ff', desc: '可以交给老爹的古董（支线道具）', use() { tip('这是老爹想要的古董，留着交给他', 1.6); return false; } },
};
const ITEMBUFF = { tea: 0 };
function healP(n) { const p = player; if (p.hp >= p.maxHp) { tip('生命已经是满的', 1.2); return false; } p.hp = Math.min(p.maxHp, p.hp + n); burst(p.pos.clone().setY(1.2), 0x7dffb0, 24, 3); floatText(p.pos.clone().setY(2.2), '+' + Math.min(n, p.maxHp) + ' 生命', '#7dffb0', 20); return true; }
const Inv = {
  items: {},
  load() { try { this.items = JSON.parse(localStorage.getItem('jc_items') || '{}') || {}; } catch (e) { this.items = {}; } if (!localStorage.getItem('jc_items')) this.items = { bun: 2 }; },
  save() { try { localStorage.setItem('jc_items', JSON.stringify(this.items)); } catch (e) { } },
  add(k, n = 1, silent) { const I = ITEMS[k]; if (!I) return; this.items[k] = (this.items[k] || 0) + n; this.save(); if (!silent) toast(`<b style="color:${I.c}">获得「${I.name}」×${n}</b><small>${I.desc}</small>`, 2.4); Bag.render(); },
  count(k) { return this.items[k] | 0; },
  take(k, n = 1) { if ((this.items[k] | 0) < n) return false; this.items[k] -= n; if (this.items[k] <= 0) delete this.items[k]; this.save(); return true; },
  use(k) { const I = ITEMS[k]; if (!I || !this.count(k)) return; if (I.use()) { this.take(k); sfx('whoosh'); showMove('使用「' + I.name + '」', I.c); } Bag.render(); },
};
Inv.load();
addEventListener('keydown', e => { if (e.code !== 'KeyV' || e.repeat || !started || cutscene || gameOver || Bag.open) return; if (Inv.count('bun')) Inv.use('bun'); else if (Inv.count('wine')) Inv.use('wine'); else tip('没有回血的食物了', 1.2); });
// 体力消耗减半（菊花茶）
{
  const _upP = updatePlayer;
  updatePlayer = function (dt) { const s0 = player.st; _upP(dt); if (ITEMBUFF.tea > now && player.st < s0) player.st = s0 - (s0 - player.st) * 0.5; };
}
// ---------- 符咒：12 个槽，按等级开放；没装上的放在物品栏里 ----------
Object.assign(Runes, {
  eq: Array(12).fill(null),
  load() {
    try {
      JSON.parse(localStorage.getItem('jc_runes') || '[]').forEach(k => RUNE[k] && this.owned.add(k));
      const e = JSON.parse(localStorage.getItem('jc_runeEq') || '[]');
      for (let i = 0; i < 12; i++) this.eq[i] = e[i] && this.owned.has(e[i]) && !this.eq.includes(e[i]) ? e[i] : null;
    } catch (e) { }
  },
  free() { for (let i = 0; i < LV.slots(); i++) if (!this.eq[i]) return i; return -1; },
  autoFill() { for (const r of RUNES) if (this.owned.has(r.key) && !this.has(r.key)) { const i = this.free(); if (i < 0) break; this.eq[i] = r.key; } this.save(); refreshChips(); },
  clampSlots() { for (let i = LV.slots(); i < 12; i++) this.eq[i] = null; },
  award(k, silent) {
    const R = RUNE[k]; if (!R) return false;
    const fresh = !this.owned.has(k); this.owned.add(k);
    let auto = false; if (fresh && !this.has(k)) { const i = this.free(); if (i >= 0) { this.eq[i] = k; auto = true; } }
    this.save(); refreshChips(); Bag.render();
    if (fresh && !silent) {
      toast(`<b style="color:${R.color}">获得「${R.full}」</b><small>${R.desc}</small><small>${auto ? '已自动装进符咒槽' : LV.slots() ? '符咒槽已满——放进了物品栏（升级解锁更多槽）' : '放进了物品栏——成龙升到 1 级就能装上（打怪获得经验）'}</small>`);
      burst(player.pos.clone().setY(1.2), new THREE.Color(R.color).getHex(), 40, 5); sfx('clang');
    }
    return fresh;
  },
  equip(k, slot) {
    if (!this.owned.has(k)) return;
    const j = this.eq.indexOf(k);
    if (j >= 0 && slot == null) { this.eq[j] = null; }
    else {
      let i = slot != null ? slot : this.free();
      if (i < 0 || i >= LV.slots()) { tip(LV.slots() ? `符咒槽已满（${LV.slots()} 个）——先卸下一个，或升级解锁更多槽` : '还没有符咒槽——成龙升到 1 级解锁（打怪获得经验）', 2); return; }
      if (j >= 0) this.eq[j] = this.eq[i]; this.eq[i] = k;
    }
    this.save(); refreshChips(); Bag.render();
  },
  label() { const l = this.eq.filter(Boolean).map(k => RUNE[k].name); return l.length ? (l.length > 4 ? l.slice(0, 4).join('·') + `…${l.length}` : l.join('·')) : '无'; },
});
Runes.eq = Array(12).fill(null); Runes.load(); LV.load(); Runes.clampSlots(); Runes.autoFill(); LV.hud();
// ---------- 新背包界面：左边十二符咒轮盘，右上武器栏，右下物品栏 ----------
Object.assign(Bag, {
  render() {
    if (!this.open) return;
    const p = player, R = Runes, n = LV.slots();
    const slots = R.eq.map((k, i) => {
      const a = i / 12 * TAU, x = 215 + Math.sin(a) * 172, y = 215 - Math.cos(a) * 172;
      if (i >= n) return `<div class="slot lock" style="left:${x}px;top:${y}px" title="成龙 ${i + 1} 级解锁"><span class="g">🔒</span><small>Lv ${i + 1}</small></div>`;
      if (!k) return `<div class="slot" data-slot="${i}" style="left:${x}px;top:${y}px" data-info="符咒槽 ${i + 1}：从右边物品栏点选或拖进来"><small>槽 ${i + 1}</small></div>`;
      const r = RUNE[k]; return `<div class="slot on" data-b="r:${k}" data-slot="${i}" draggable="true" data-drag="${k}" style="left:${x}px;top:${y}px;--c:${r.color}" data-info="<b style='color:${r.color}'>${r.full}</b> · ${r.desc}（点击卸下）"><span class="g" style="color:${r.color}">${r.name}</span><small>${r.full.split(' · ')[1] || ''}</small></div>`;
    }).join('');
    const xpTxt = LV.lv >= LV.max ? '已满级' : `${LV.xp} / ${LV.need()}`;
    const cells = [];
    RUNES.forEach(r => { if (R.owned.has(r.key) && !R.has(r.key)) cells.push(`<div class="it" data-b="r:${r.key}" draggable="true" data-drag="${r.key}" data-info="<b style='color:${r.color}'>${r.full}</b> · ${r.desc}（点击装上，或拖到左边的槽）"><span class="g" style="color:${r.color}">${r.name}</span><small>${r.full.split(' · ')[1] || ''}</small></div>`); });
    for (const k in Inv.items) { const I = ITEMS[k]; if (I && Inv.items[k] > 0) cells.push(`<div class="it" data-b="i:${k}" data-info="<b style='color:${I.c}'>${I.name}</b> · ${I.desc}${k === 'relic' ? '' : '（点击使用）'}"><span class="n">×${Inv.items[k]}</span><span class="g" style="color:${I.c}">${I.g}</span><small>${I.name}</small></div>`); }
    while (cells.length < 18 || cells.length % 6) cells.push('<div class="it empty"></div>');
    const st = STYLES[p.style], missing = 12 - R.owned.size;
    $('bag').innerHTML = `<div class="bbox v2"><h3>装备 · 背包 <small>Tab / Esc 关闭 · 已收集符咒 ${R.owned.size}/12 · 已装 ${R.eq.filter(Boolean).length}/${n}</small></h3>
      <div class="v2cols"><div class="wheel">${slots}<div class="ctr"><div class="lv">Lv ${LV.lv}</div><div class="xb"><i style="width:${LV.lv >= LV.max ? 100 : LV.xp / LV.need() * 100}%"></i></div><small>经验 ${xpTxt}</small><small>符咒槽 ${n} / 12</small><small style="color:#d8c4ff">${n < 12 ? '打怪、支线、宝箱升级 → 解锁更多槽' : '十二符咒之力！'}</small></div></div>
      <div class="rside">
        <h5>武器栏</h5><div class="wrow"><div><em>手中</em>${this.wpnHTML(p.weapon, p.weapon ? 'w:hand' : null)}</div><div class="sw" data-b="w:swap" title="交换">⇄</div><div><em>背包</em>${this.wpnHTML(p.weapon2, p.weapon2 ? 'w:swap' : null)}</div></div>
        <div class="btn-row">${p.weapon ? '<button data-b="w:stow">收起手中武器</button><button data-b="w:drop1">丢掉手中</button>' : ''}${p.weapon2 ? '<button data-b="w:drop2">丢掉背包里的</button>' : ''}</div>
        <h5>物品栏 <small style="color:#999;font-weight:normal">符咒（点击装上 / 拖到左边的槽）· 道具（点击使用，V 键快速吃包子）${missing ? ` · 还有 ${missing} 个符咒没找到` : ''}</small></h5>
        <div class="igrid">${cells.join('')}</div>
        <div class="info" id="bagInfo">当前拳法 · <span style="color:${st.css}">${styleLabel(p.style)}</span>：${STYLE_PASSIVE[p.style]}</div>
      </div></div></div>`;
    const box = $('bag');
    box.querySelectorAll('[data-info]').forEach(el => el.onmouseenter = () => { $('bagInfo').innerHTML = el.dataset.info; });
    box.querySelectorAll('[data-drag]').forEach(el => el.ondragstart = (ev) => { ev.dataTransfer.setData('text/plain', el.dataset.drag); });
    box.querySelectorAll('.slot[data-slot]').forEach(el => {
      el.ondragover = (ev) => { ev.preventDefault(); el.classList.add('drop'); }; el.ondragleave = () => el.classList.remove('drop');
      el.ondrop = (ev) => { ev.preventDefault(); const k = ev.dataTransfer.getData('text/plain'); if (RUNE[k]) Runes.equip(k, +el.dataset.slot); };
    });
    const ig = box.querySelector('.igrid'); ig.ondragover = (ev) => ev.preventDefault(); ig.ondrop = (ev) => { ev.preventDefault(); const k = ev.dataTransfer.getData('text/plain'); if (RUNE[k] && Runes.has(k)) Runes.equip(k); };
  },
});
{
  const _ck = Bag.click.bind(Bag);
  Bag.click = function (a) { if (a.startsWith('i:')) return Inv.use(a.slice(2)); return _ck(a); };
}
// ---------- 打怪得经验 ----------
const XPW = { seen: new WeakSet() };
function xpFor(e) {
  if (e.type === 'dummy' || e.fake || e.noXp) return 0;
  const hp = e.maxHp || 60, boss = (WAVES[wave] && WAVES[wave].boss && hp >= 300) || hp >= 700;
  return Math.round(clamp(boss ? hp * 0.16 : hp * 0.22, 6, 520) * (e.xpMul || 1));
}
{
  const _uw = updateWaves;
  updateWaves = function (dt) {
    for (const e of enemies) if (e.dead && !XPW.seen.has(e)) { XPW.seen.add(e); if (MODE !== 'dojo') LV.gain(xpFor(e), e.pos); }
    _uw(dt);
  };
}
// 章节通关奖励经验
{
  const _oc = Story.onClear.bind(Story);
  Story.onClear = function (w) { if (MODE === 'story' && WAVES[w]) LV.gain(WAVES[w].boss ? 80 : 40, null, 'chapter'); return _oc(w); };
}
