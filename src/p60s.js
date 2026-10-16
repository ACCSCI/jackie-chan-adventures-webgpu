// ================= 第六集 · 波次 / 剧情 / 路由 / 结算 =================
WAVES.push(
  { title: '第二十一章 · 家具城开业', sub: '环境打击：把敌人打到家具上更疼、打到沙发上会弹飞；按 E 推倒货架、拆冰箱门当盾牌', list: ['thug', 'thug', 'thug', 'chow'], at: [[-2, 6], [2.5, 5], [0, 3], [-5, 2]], objective: () => MALL.stage >= 2 && !enemies.some(e => !e.dead), script: (dt) => { if (!cutscene) mallScript(dt); } },
  { title: '第二十二章 · 样板间 · 衣柜伏兵', sub: '衣柜在晃就是有人要跳出来——冲过去按 E 把柜门踹回去！', list: ['thug', 'thug', 'khan'], at: [[-2, 1], [2, 1], [0, -3.5]], objective: () => WARD.queue <= 0 && !WARD.list.some(w => w.state === 'shake') && !enemies.some(e => !e.dead), script: (dt) => { if (!cutscene) kitchenScript(dt); } },
  { title: '第二十三章 · 装卸区 · 拉索', sub: '他正面打不动：绕到背后，或者引他冲撞高货架；红线是扔过来的家具，冰箱门能挡', list: ['ratsoOx'], at: [[0, -7]], boss: 1 },
);
CHAPTERS.push(
  { w: 21, n: '第二十一章', t: '家具城开业', d: '第六集 · 折叠椅、冰箱门与货架', ep: 6 },
  { w: 22, n: '第二十二章', t: '样板间 · 衣柜伏兵', d: '第六集 · 关门打狗', ep: 6 },
  { w: 23, n: '第二十三章', t: '装卸区 · 拉索', d: '第六集 · 牛力与高货架', ep: 6 },
);
EP_TITLE[6] = '第六集 · 牛之护身符';
{
  const _uw = updateWaves;
  updateWaves = function (dt) {
    const A = AREA.name, ep6 = A === 'mall' || A === 'kitchen' || A === 'loading';
    if (ep6 && !gameOver) { updateFurn(dt); if (!cutscene) { updateDockProj(dt); updateOxBowl(); } }
    _uw(dt);
  };
}
// ---------- 牛符觉醒：重击把敌人打成“保龄球”，飞出去撞倒路上的其他敌人 ----------
const OX2 = { get on() { try { return localStorage.getItem('jc_ox2') === '1'; } catch (e) { return false; } } };
function oxDesc() { const R = RUNE.ox; if (R && OX2.on) { R.full = '牛符 · 神力（觉醒）'; R.desc = '伤害 +20%，击退 +30%；重击把敌人打成“保龄球”，撞倒路上的其他敌人；把敌人撞上家具的伤害翻倍'; } }
oxDesc();
{
  const _ge = gameEvent;
  gameEvent = function (k, d) {
    _ge(k, d);
    if (k === 'hit' && d && d.e && d.m && d.m.heavy && Runes.has('ox') && OX2.on && MODE === 'story' && !d.e.beast) { d.e._bowl = now + 0.8; d.e._bowlHit = new Set([d.e]); }
  };
}
function updateOxBowl() {
  for (const e of enemies) {
    if (!(e._bowl > now) || e.beast) continue;
    const sp = Math.hypot(e.vel.x, e.vel.z); if (sp < 3) continue;
    for (const o of enemies) {
      if (o.dead || o.beast || e._bowlHit.has(o) || o.type === 'dummy') continue;
      if (Math.hypot(o.pos.x - e.pos.x, o.pos.z - e.pos.z) > (o.radius || 0.4) + 0.7) continue;
      e._bowlHit.add(o); o.takeHit(14, new THREE.Vector2(e.vel.x / sp, e.vel.z / sp), { kb: 7, kd: 1, heavy: 1, launch: 3 }, 1, false);
      o._bowl = now + 0.5; o._bowlHit = e._bowlHit; floatText(o.pos.clone().setY(2.2), '牛符 · 保龄球！', '#ff8a3a', 24); Foley.at('bodyFall', o.pos, { vol: 0.7 }); shake = Math.max(shake, 0.2);
    }
  }
}
{ // 觉醒后撞家具伤害翻倍
  const P = Enemy.prototype, _th = P.takeHit;
  P.takeHit = function (dmg, dir, m, kbMul, counter) { if (m && m.heavy && m.kd && !m.wpn && kbMul === 1 && !counter && Runes.has('ox') && OX2.on && MODE === 'story' && (now - (this._slamT || -9) < 0.05)) dmg *= 2; return _th.call(this, dmg, dir, m, kbMul, counter); };
}
// ---------- 剧情 ----------
let ratsoOxActor = null;
const EP6_PROLOGUE = [
  { who: 'narr', text: '第六集 · 牛之护身符', act: () => sfx('clang'), shot: () => [SC.x + 2.5, 2.2, SC.z + 1, SC.x, 1.3, SC.z - 4] },
  { who: 'uncle', text: '找到了！牛之护身符——藏在一头木雕铜牛的肚子里！', act: () => uncle.mood = 'cheer' },
  { who: 'jackie', text: '那头铜牛在哪儿？', to: 'uncle' },
  { who: 'uncle', text: '被人当摆设卖掉了！卖给了一家新开的家具城！', act: () => uncle.mood = 'scold' },
  { who: 'jade', text: '家具城？我要去试那张会按摩的沙发！', act: () => { uncle.mood = null; jade.mood = 'cheer'; } },
  { who: 'jackie', text: '不行。', to: 'jade' },
  { who: 'uncle', text: '牛符能让人力大无穷！要是被黑手帮拿到——', act: () => { jade.mood = null; uncle.mood = 'scold'; } },
  { who: 'jackie', text: '他们就能把我当沙发扔。', to: 'uncle' },
  { who: 'uncle', text: '还有！家具城的东西很贵，一样都不许打坏！一定要！' },
  { who: 'jackie', text: '知道了，老爹。', to: 'uncle', act: () => uncle.mood = null },
  { fade: () => Story.toMall() },
];
const MALL_INTRO = [
  { who: 'narr', text: '龙城家具城 · 开业第一天', shot: () => [FC.x + 6, 4.5, FC.z + 10, FC.x, 1.5, FC.z - 2] },
  { who: 'pa', text: '欢迎光临龙城家具城！开业大酬宾，全场五折！' },
  { who: 'jackie', text: '铜牛……铜牛……应该就在里面。', to: 'narr', shot: () => [FC.x + 1.8, 1.9, FC.z + 7.5, FC.x, 1.3, FC.z + 10] },
  { who: 'thug', text: '成龙来了！拉索老大说了，别让他靠近仓库！', act: () => spawnWave(21), shot: () => [FC.x + 2, 2.4, FC.z + 9, FC.x, 1.2, FC.z + 3] },
  { who: 'jackie', text: '各位，这里的东西都很贵，我们能不能出去打？', to: 'thug' },
  { who: 'thug', text: '上！' },
  { who: 'uncleP', text: '成龙！货架可以推倒，冰箱门可以拆下来当盾牌！' },
  { who: 'uncleP', text: '把他们打到家具上更疼！打到沙发上，还会弹起来！' },
  { who: 'jackie', text: '老爹，你刚才说一样都不许打坏！', to: 'narr' },
  { who: 'uncleP', text: '打坏了……记黑手帮账上！' },
];
EP6_PROLOGUE.push(...MALL_INTRO);
const KITCHEN_INTRO = [
  { fade: () => Story.toKitchen() },
  { who: 'narr', text: '（卖场深处，是一排排厨房样板间和大衣柜）', shot: () => [KT.x, 3.6, KT.z + 9, KT.x, 1.2, KT.z - 3] },
  { who: 'jackie', text: '这么多衣柜……', to: 'narr' },
  { who: 'pa', text: '温馨提示：衣柜样品，请勿入内躲藏。' },
  { who: 'jackie', text: '……为什么要特别广播这一句？', to: 'narr' },
  { who: 'narr', text: '（衣柜里传来咯吱咯吱的声音）', act: () => { const w = WARD.list[1]; w.state = 'open'; w.t = 1.4; w.g.rotation.z = 0.03; Foley.at('door', player.pos, { vol: 0.6, rate: 1.3 }); spawnWave(22); }, shot: () => [KT.x - 7, 2.2, KT.z + 3.5, KT.x - 11, 1.4, KT.z + 0.5] },
  { who: 'uncleP', text: '衣柜在晃，就是有人要跳出来！冲过去按 E，把门踹回去！' },
];
const DOCK6_INTRO = [
  { fade: () => Story.toLoading() },
  { who: 'narr', text: '家具城 · 后面的装卸区', shot: () => [LD.x + 8, 5, LD.z + 11, LD.x, 1.5, LD.z - 2] },
  { who: 'ratso', text: '嘿嘿嘿，成龙！看我找到了什么——', act: () => { spawnWave(23); const r = enemies.find(e => e.type === 'ratsoOx'); if (r) { r.pos.set(LD.x, 0, LD.z - 6); r.yaw = 0; ratsoOxActor = r; } }, shot: () => [LD.x + 1.6, 2.2, LD.z - 1.5, LD.x, 1.8, LD.z - 6] },
  { who: 'narr', text: '（拉索举起一枚刻着牛头的护身符，单手就把一张沙发举过了头顶）', act: () => { const r = ratsoOxActor; if (r) { r.held = mkSofa(0x7a5aa8); r.held.scale.setScalar(0.75); r.held.position.set(0, 1.95, 0.1); r.held.rotation.y = Math.PI / 2; r.rig.root.add(r.held); r.heldN = '沙发'; r.heldK = 0; shock(r.pos.clone().setY(0.1), 0xff8a3a, 3); burst(r.pos.clone().setY(2.4), 0xff8a3a, 40, 5); } Foley.at('kB', player.pos, { vol: 0.8 }); Foley.at('magic', player.pos, { vol: 0.5 }); } },
  { who: 'jackie', text: '拉索，你什么时候练的？', to: 'ratso' },
  { who: 'ratso', text: '我没练！是牛符！我现在力大无穷！', act: () => { const r = ratsoOxActor; if (r && r.held) { const h = r.held; r.held = null; h.removeFromParent(); burst(r.pos.clone().setY(1), 0xd8c098, 30, 5); Foley.at('sofa', r.pos, { vol: 1 }); shake = 0.3; } } },
  { who: 'uncleP', text: '牛符让他刀枪不入——正面打他没用！绕到背后打！' },
  { who: 'uncleP', text: '引他去撞那些高货架！他扔东西过来就闪开，拿冰箱门也能挡！' },
  { who: 'ratso', text: '说完了没有？我要开始扔了！' },
];
const EP6_ENDING = [
  { who: 'narr', text: '（拉索一屁股坐在地上，牛符从他手里滚了出来）', shot: () => { const d = enemies.find(e => e.type === 'ratsoOx') || player; return [d.pos.x + 2.6, 1.7, d.pos.z + 2.2, d.pos.x, 0.9, d.pos.z]; } },
  { who: 'ratso', text: '我的力气……跑哪儿去了……' },
  { who: 'jackie', text: '在这儿。', to: 'ratso', act: () => { const p = player.pos; burst(p.clone().setY(1.2), 0xff8a3a, 50, 5); shock(p.clone().setY(0.1), 0xff8a3a, 3); Foley.at('magic', p, { vol: 0.8 }); } },
  { who: 'narr', text: '（成龙握住牛符，一股力量从手心涌了上来——他单手就把倒下的货架扶了起来）', act: () => { shake = 0.3; Foley.at('shelf', player.pos, { vol: 0.8, rate: 0.8 }); } },
  { who: 'jackie', text: '哇……我现在可以帮老爹搬一百箱古董了。', to: 'narr' },
  { who: 'uncleP', text: '不许！古董不能乱搬！' },
  { who: 'pa', text: '顾客请注意：本次损坏的商品，请到服务台结账。' },
  { who: 'jackie', text: '……能记黑手帮账上吗？', to: 'narr' },
  { who: 'jade', text: '成龙！那张按摩沙发我试过了，超舒服！', act: () => { jade.place(player.pos.x - 2, player.pos.z + 2.4, 0); jade.mood = 'cheer'; } },
  { who: 'jackie', text: '小玉！', to: 'jade', act: () => jade.mood = null },
  { who: 'uncleP', text: '牛符找回来了！六个了，还有六个！' },
];
Object.assign(Story, {
  toMall() { this.setArea('mall'); this.putPlayer(FC.x, FC.z + FC.hz - 2.2, Math.PI); uncle.hide(); jade.hide(); furnReset('mall'); MALL.stage = 0; MALL.shelves.forEach(f => f.ia.forEach(o => o.on = true)); MALL.fridges.forEach(f => f.ia.on = true); FURN.bill = 0; FURN.broke = 0; FURN.shieldN = 0; FURN.bounce = 0; MALL.shelfHits = 0; mallWeapons(); },
  toKitchen() { this.setArea('kitchen'); this.putPlayer(KT.x, KT.z + KT.hz - 2, Math.PI); uncle.hide(); jade.hide(); furnReset('kitchen'); Object.assign(WARD, { queue: 8, t: 3, slammed: 0, opened: 0 }); kitchenWeapons(); },
  toLoading() { this.setArea('loading'); this.putPlayer(LD.x, LD.z + LD.hz - 2.5, Math.PI); uncle.hide(); jade.hide(); furnReset('loading'); DOCK6.proj.forEach(P => scene.remove(P.m)); DOCK6.proj.length = 0; DOCK6.crash = 0; loadingWeapons(); },
  beginEp6(ch) {
    if (ch === 21) {
      this.setArea('shop'); this.putPlayer(SC.x + 0.4, SC.z - 1.6, Math.PI);
      uncle.place(SC.x, SC.z - 5.3, 0); jade.place(SC.x + 1.7, SC.z - 3.8, -0.6);
      this.play(EP6_PROLOGUE, () => startWave(21));
    } else if (ch === 22) { this.play(KITCHEN_INTRO, () => startWave(22)); }
    else { this.play(DOCK6_INTRO, () => startWave(23)); }
  },
  onClearEp6(w, T) {
    if (w === 21) T(1.4, KITCHEN_INTRO, () => startWave(22));
    else if (w === 22) T(1.4, DOCK6_INTRO, () => startWave(23));
    else T(2.6, EP6_ENDING, () => { try { localStorage.setItem('jc_ox2', '1'); } catch (e) { } oxDesc(); Runes.award('ox', true); gameEnd(true, 6); });
  },
});
{
  const _b5 = Story.beginEp5.bind(Story), _c5 = Story.onClearEp5.bind(Story);
  Story.beginEp5 = function (ch) { if (ch >= 21) return this.beginEp6(ch); return _b5(ch); };
  Story.onClearEp5 = function (w, T) { if (w >= 21) return this.onClearEp6(w, T); return _c5(w, T); };
  try { if (localStorage.getItem('jc_clear5') === '1') saveProgress(21); } catch (e) { }
}
{
  const _pick = BGM.pick.bind(BGM);
  BGM.pick = function () {
    const r = _pick(); if (!started || MODE !== 'story') return r;
    const has = k => typeof BGM_DATA !== 'undefined' && BGM_DATA[k];
    if ((AREA.name === 'mall' || AREA.name === 'kitchen') && has('mall')) return 'mall';
    if (AREA.name === 'loading' && has('ratso')) return 'ratso';
    return r;
  };
}
{
  const _rs = Menu.resetSession.bind(Menu);
  Menu.resetSession = function () { _rs(); furnReset(); DOCK6.proj.forEach(P => scene.remove(P.m)); DOCK6.proj.length = 0; WARD.queue = 0; MALL.stage = 0; FURN.bill = 0; ratsoOxActor = null; };
}
{
  const _ge = gameEnd;
  gameEnd = function (win, ep = 1) {
    if (!(win && ep === 6)) return _ge(win, ep);
    gameOver = true;
    try { sessionStorage.removeItem('jc_ch'); localStorage.setItem('jc_clear', '1'); localStorage.setItem('jc_clear6', '1'); saveProgress(23); } catch (e) { }
    const mins = Math.floor(playTime / 60), secs = Math.floor(playTime % 60), bill = FURN.bill.toLocaleString('zh-CN');
    const say = FURN.bill > 60000 ? '老爹：“六万多？！记黑手帮账上！一定要！”' : FURN.bill > 25000 ? '老爹：“打坏这么多……下次小心点！”' : '老爹：“嗯，这次还算爱惜东西。”';
    clearTimeout(gameEndTimer);
    gameEndTimer = setTimeout(() => {
      document.exitPointerLock(); $('pause').classList.remove('show'); $('ov').style.display = 'flex';
      $('ov').querySelector('.box').innerHTML = `<h1>完</h1><h2>第六集 · 牛之护身符</h2><p>击倒敌人 ${kills} 名 · 关上衣柜 ${WARD.slammed} 次 · 货架砸中 ${MALL.shelfHits || 0} 人 · 冰箱门挡下 ${FURN.shieldN} 次 · 用时 ${mins} 分 ${secs} 秒</p><p style="font-size:20px;color:#ffd27a">损坏赔偿：¥${bill}</p><p>${say}<br>“六个了……还有六个！”</p><p style="color:#ff8a3a">牛符觉醒！装备牛符后，重击会把敌人打成“保龄球”，撞倒路上的其他敌人；把敌人撞上家具伤害翻倍</p><p style="opacity:.75;font-size:13px">下一集：马与羊——唐人街夜市的芬恩，和会钻进梦里的阿周</p><div class="obtns"><div class="go" data-a="ep7">开始第七集</div><div class="go alt" data-a="menu">返回主界面</div><div class="go alt" data-a="dojo">去练功房</div></div>`;
    }, 1500);
  };
  const _act = Menu.act.bind(Menu);
  Menu.act = function (a, b) { if (a === 'ep6') { this.resetSession(); this.start(() => Story.begin(21)); return; } return _act(a, b); };
}
Menu.refresh();
Object.assign(window.__ep6, { OX2, WARD, DOCK6, wardSlam, wardShake, updateDockProj, updateOxBowl, EP6_PROLOGUE, MALL_INTRO, KITCHEN_INTRO, DOCK6_INTRO, EP6_ENDING });
