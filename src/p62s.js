// ================= 第八集 · 波次 / 剧情 / 路由 / 结算 =================
WAVES.push(
  { title: '第二十七章 · 马戏团 · 猴符', sub: '金色长条=变身光线：射中会变成猴子（伤害减半、拿不了武器）。团长也会把打手变成猴子', list: ['mc8', 'thug', 'thug'], at: [[0, -6], [-3, -3], [3, -3]], boss: 1, objective: () => { const m = enemies.find(e => e.type === 'mc8'); return !!m && m.dead && !enemies.some(e => !e.dead); }, script: (dt) => { if (!cutscene) circusScript(dt); } },
  { title: '第二十八章 · 货运站 · 横穿的列车', sub: '信号灯变红、地上亮红条就是列车要来了——离开那条轨道；把敌人打上轨道，让列车撞飞他们', list: ['thug', 'thug', 'khan', 'thug'], at: [[-5, -9], [5, -9], [0, -10], [-9, -3]], objective: () => RAIL.stage >= 2 && !enemies.some(e => !e.dead), script: (dt) => { if (!cutscene) railScript(dt); } },
  { title: '第二十九章 · 调车转盘 · 瓦龙', sub: '他极快：红线是冲刺（会连冲好几次）、红圈是兔子跳、紫圈是油瓶。完美闪避他的冲刺=子弹时间', list: ['valm8'], at: [[0, -7]], boss: 1, script: (dt) => { if (!cutscene) valScript(dt); } },
);
CHAPTERS.push(
  { w: 27, n: '第二十七章', t: '马戏团 · 猴符', d: '第八集 · 变身光线与小猴子', ep: 8 },
  { w: 28, n: '第二十八章', t: '货运站 · 横穿的列车', d: '第八集 · 红灯、铁轨与列车', ep: 8 },
  { w: 29, n: '第二十九章', t: '调车转盘 · 瓦龙', d: '第八集 · 兔符与子弹时间', ep: 8 },
);
EP_TITLE[8] = '第八集 · 猴与兔';
{
  const _uw = updateWaves;
  updateWaves = function (dt) {
    const A = AREA.name;
    if ((A === 'circus' || A === 'rail' || A === 'turntable') && !gameOver) { updateFurn(dt); if (A === 'rail') updateRail(dt); }
    _uw(dt);
  };
}
function ep8RuneDesc() {
  const Mk = RUNE['monkey'];
  const Rb = RUNE['rabbit'];
  if (Mk && MONKEY2.on) { Mk.full = '猴符 · 灵巧（觉醒）'; Mk.desc = '所有体力消耗 -25%；空中攻击伤害 +50%'; }
  if (Rb && RABBIT2.on) { Rb.full = '兔符 · 神速（觉醒）'; Rb.desc = '移动速度 +15%，出招速度 +10%；完美闪避后 3 秒内出招速度再 +30%'; }
}
ep8RuneDesc();
// ---------- 剧情 ----------
const EP8_PROLOGUE = [
  { who: 'narr', text: '第八集 · 猴与兔', act: () => sfx('clang'), shot: () => [SC.x + 2.5, 2.2, SC.z + 1, SC.x, 1.3, SC.z - 4] },
  { who: 'jade', text: '成龙！快看报纸！马戏团的观众，一夜之间全变成了猴子！', act: () => jade.mood = 'cheer' },
  { who: 'jackie', text: '全变成猴子？', to: 'jade', act: () => jade.mood = null },
  { who: 'uncle', text: '猴之护身符！能把人变成动物！一定是它！', act: () => uncle.mood = 'scold' },
  { who: 'jackie', text: '报纸上还说什么？', to: 'jade' },
  { who: 'jade', text: '还说——马戏团今晚加演！' },
  { who: 'uncle', text: '还有！瓦龙拿到了兔之护身符，速度快得连影子都看不见！' },
  { who: 'jackie', text: '一个变猴子，一个跑得快……今晚不会太轻松。', to: 'uncle' },
  { who: 'uncle', text: '去马戏团！小心别被变成猴子！一定要！', act: () => uncle.mood = null },
  { fade: () => Story.toCircus() },
  { who: 'narr', text: '龙城马戏团 · 夜场', shot: () => [CIR.x + 7, 5, CIR.z + 10, CIR.x, 1.5, CIR.z] },
  { who: 'mc', text: '女士们先生们！欢迎来到今晚的特别演出！', act: () => { spawnWave(27); const m = enemies.find(e => e.type === 'mc8'); if (m) { m.pos.set(CIR.x, 0, CIR.z - 4); m.yaw = 0; } }, shot: () => [CIR.x + 1.8, 2.1, CIR.z - 0.5, CIR.x, 1.6, CIR.z - 4] },
  { who: 'mc', text: '今晚的嘉宾——成龙先生！让我们把他……变成一只猴子！', act: () => { const m = enemies.find(e => e.type === 'mc8'); if (m) { burst(m.pos.clone().setY(2), 0xffd84a, 40, 4); Foley.at('magic', m.pos, { vol: 0.7 }); } } },
  { who: 'jackie', text: '我能不能只当观众？', to: 'mc', shot: () => [player.pos.x + 1.6, 1.9, player.pos.z - 2, player.pos.x, 1.3, player.pos.z] },
  { who: 'uncleP', text: '成龙！金光射中就会变猴子！看见金色长条就往两边闪！' },
  { who: 'uncleP', text: '变成猴子打人不疼，还拿不了武器——撑几秒就变回来了！' },
];
const RAIL_INTRO = [
  { who: 'narr', text: '（团长倒在木屑里，帽子滚了老远——里面掉出一枚刻着猴头的护身符）', shot: () => { const d = enemies.find(e => e.type === 'mc8') || player; return [d.pos.x + 2.4, 1.7, d.pos.z + 2.2, d.pos.x, 0.9, d.pos.z]; } },
  { who: 'mc', text: '本场演出……到此结束……' },
  { who: 'jackie', text: '猴符，到手。', to: 'mc', act: () => { const p = player.pos; burst(p.clone().setY(1.2), 0xd8a060, 40, 4); Foley.at('magic', p, { vol: 0.6 }); } },
  { who: 'uncleP', text: '成龙！小玉说瓦龙在货运站，要坐火车离开龙城！' },
  { who: 'jackie', text: '小玉？她又跑出去了？', to: 'narr' },
  { who: 'uncleP', text: '……先抓瓦龙，再抓小玉！' },
  { fade: () => Story.toRail() },
  { who: 'narr', text: '龙城货运站 · 深夜', shot: () => [RY.x + 9, 6, RY.z + 12, RY.x, 1, RY.z] },
  { who: 'thug', text: '老大说了，在火车开走之前拦住成龙！', act: () => spawnWave(28), shot: () => [RY.x + 2, 2.4, RY.z + 6, RY.x, 1.2, RY.z - 5] },
  { who: 'jackie', text: '这里到处是铁轨……', to: 'narr' },
  { who: 'uncleP', text: '火车来之前信号灯会变红！地上亮红条，就快离开那条轨道！' },
  { who: 'uncleP', text: '把那些打手打到铁轨上——让火车帮你！' },
  { who: 'jackie', text: '老爹，这样不太好吧……', to: 'narr' },
  { who: 'uncleP', text: '他们抗揍！' },
];
const VAL8_INTRO = [
  { who: 'narr', text: '（最后一列货车呼啸而过——铁轨尽头，是一座调车转盘）', act: () => Foley.at('quake', player.pos, { vol: 0.6, rate: 1.2 }), shot: () => [player.pos.x + 3, 2.5, player.pos.z + 4, player.pos.x, 1.2, player.pos.z] },
  { fade: () => Story.toTurntable() },
  { who: 'narr', text: '调车转盘', shot: () => [TT.x + 8, 5, TT.z + 9, TT.x, 1, TT.z] },
  { who: 'valmont', text: '成龙先生，你来得比我想的慢。', act: () => { spawnWave(29); const v = enemies.find(e => e.type === 'valm8'); if (v) { v.pos.set(TT.x, 0, TT.z - 6); v.yaw = 0; } }, shot: () => [TT.x + 1.6, 2.1, TT.z - 2.5, TT.x, 1.6, TT.z - 6] },
  { who: 'valmont', text: '也难怪——现在这个世界上，没有人比我更快。' },
  { who: 'narr', text: '（瓦龙身影一晃，下一秒已经站在了成龙身后）', act: () => { const v = enemies.find(e => e.type === 'valm8'); if (v) { afterImage(v); v.pos.set(player.pos.x + 0.4, 0, player.pos.z + 1.6); v.yaw = Math.PI; burst(v.pos.clone().setY(1), 0x7fe9ff, 30, 4); Foley.at('swishH', v.pos, { vol: 0.8, rate: 1.3 }); } }, shot: () => [player.pos.x + 2.6, 1.9, player.pos.z + 0.6, player.pos.x, 1.3, player.pos.z + 0.8] },
  { who: 'jackie', text: '……刚才那是什么？', to: 'valmont' },
  { who: 'uncleP', text: '兔符！他快，你要更准！完美闪避，就能看清他的动作！' },
  { who: 'uncleP', text: '还有，地上的油桶别乱打——打翻了会滑！' },
  { who: 'valmont', text: '说完了？那我们开始吧。', act: () => { const v = enemies.find(e => e.type === 'valm8'); if (v) { v.pos.set(TT.x, 0, TT.z - 5); v.yaw = 0; } } },
];
const EP8_ENDING = [
  { who: 'narr', text: '（瓦龙终于停了下来，扶着膝盖大口喘气）', shot: () => { const d = enemies.find(e => e.type === 'valm8') || player; return [d.pos.x + 2.6, 1.7, d.pos.z + 2.2, d.pos.x, 0.9, d.pos.z]; } },
  { who: 'valmont', text: '我的……速度……' },
  { who: 'jackie', text: '跑得快，也要看路。', to: 'valmont' },
  { who: 'narr', text: '（兔符从他口袋里滑了出来，落在转盘上转了好几圈）', act: () => { const p = player.pos; burst(p.clone().setY(1.2), 0x7fe9ff, 50, 5); shock(p.clone().setY(0.1), 0xd8a060, 3); Foley.at('magic', p, { vol: 0.8 }); } },
  { who: 'jade', text: '成龙！我抓到瓦龙的火车票了！', act: () => { jade.place(player.pos.x - 2, player.pos.z + 2.4, 0); jade.mood = 'cheer'; } },
  { who: 'jackie', text: '小玉！你什么时候……', to: 'jade', act: () => jade.mood = null },
  { who: 'jade', text: '我一直躲在车厢里！还遇见了几只猴子，它们人很好。' },
  { who: 'uncleP', text: '猴符、兔符！十个了，还有两个！' },
  { who: 'uncleP', text: '最后两个……是狗和猪。老爹有种不好的预感……' },
];
Object.assign(Story, {
  toCircus() { this.setArea('circus'); this.putPlayer(CIR.x, CIR.z + CIR.r - 2.5, Math.PI); uncle.hide(); jade.hide(); furnReset('circus'); Object.assign(P8, { stage: 0, beams: 0, mkN: 0, apes: 0 }); monkeyPlayer(false); circusWeapons(); },
  toRail() { monkeyPlayer(false); this.setArea('rail'); this.putPlayer(RY.x, RY.z + RY.hz - 4.5, Math.PI); uncle.hide(); jade.hide(); furnReset('rail'); RAIL.trains.forEach(T => scene.remove(T.g)); RAIL.trains.length = 0; RAIL.sig.forEach(s => s.forEach(m => m.color.setRGB(0.2, 2.5, 0.4))); Object.assign(RAIL, { t: 5, stage: 0, hitsE: 0, hitsP: 0 }); railWeapons(); },
  toTurntable() { this.setArea('turntable'); this.putPlayer(TT.x, TT.z + TT.r - 2.5, Math.PI); uncle.hide(); jade.hide(); RAIL.trains.forEach(T => scene.remove(T.g)); RAIL.trains.length = 0; ttReset(); Object.assign(VAL, { bt: 0 }); ttWeapons(); },
  beginEp8(ch) {
    if (ch === 27) {
      this.setArea('shop'); this.putPlayer(SC.x + 0.4, SC.z - 1.6, Math.PI);
      uncle.place(SC.x, SC.z - 5.3, 0); jade.place(SC.x + 1.7, SC.z - 3.8, -0.6);
      this.play(EP8_PROLOGUE, () => startWave(27));
    } else if (ch === 28) { this.toCircus(); this.play(RAIL_INTRO.slice(3), () => startWave(28)); }
    else { this.toRail(); this.play(VAL8_INTRO, () => startWave(29)); }
  },
  onClearEp8(w, T) {
    if (w === 27) T(1.4, RAIL_INTRO, () => startWave(28));
    else if (w === 28) T(1.4, VAL8_INTRO, () => startWave(29));
    else T(2.6, EP8_ENDING, () => { try { localStorage.setItem('jc_monkey2', '1'); localStorage.setItem('jc_rabbit2', '1'); } catch (e) { } ep8RuneDesc(); Runes.award('monkey', true); Runes.award('rabbit', true); gameEnd(true, 8); });
  },
});
{
  const _b7 = Story.beginEp7.bind(Story), _c7 = Story.onClearEp7.bind(Story);
  Story.beginEp7 = function (ch) { if (ch >= 27) return this.beginEp8(ch); return _b7(ch); };
  Story.onClearEp7 = function (w, T) { if (w >= 27) return this.onClearEp8(w, T); return _c7(w, T); };
  try { if (localStorage.getItem('jc_clear7') === '1') saveProgress(27); } catch (e) { }
}
{
  const _pick = BGM.pick.bind(BGM);
  BGM.pick = function () {
    const r = _pick(); if (!started || MODE !== 'story') return r;
    const has = k => typeof BGM_DATA !== 'undefined' && BGM_DATA[k];
    const m = { circus: 'circus', rail: 'race', turntable: 'rabbit' }[AREA.name];
    return m && has(m) ? m : r;
  };
}
{
  const _rs = Menu.resetSession.bind(Menu);
  Menu.resetSession = function () {
    _rs(); monkeyPlayer(false); RAIL.trains.forEach(T => scene.remove(T.g)); RAIL.trains.length = 0; oilClear(); (VAL.imgs || []).forEach(A => scene.remove(A.g)); if (VAL.imgs) VAL.imgs.length = 0; P8.stage = 0; RAIL.stage = 0;
  };
}
{
  const _ge = gameEnd;
  gameEnd = function (win, ep = 1) {
    if (!(win && ep === 8)) return _ge(win, ep);
    gameOver = true;
    try { sessionStorage.removeItem('jc_ch'); localStorage.setItem('jc_clear', '1'); localStorage.setItem('jc_clear8', '1'); saveProgress(29); } catch (e) { }
    const mins = Math.floor(playTime / 60), secs = Math.floor(playTime % 60);
    clearTimeout(gameEndTimer);
    gameEndTimer = setTimeout(() => {
      document.exitPointerLock(); $('pause').classList.remove('show'); $('ov').style.display = 'flex';
      $('ov').querySelector('.box').innerHTML = `<h1>完</h1><h2>第八集 · 猴与兔</h2><p>击倒敌人 ${kills} 名 · 变成猴子 ${P8.mkN} 次 · 列车撞飞敌人 ${RAIL.hitsE} 名 · 子弹时间 ${VAL.bt} 次 · 用时 ${mins} 分 ${secs} 秒</p><p>老爹：“猴符、兔符！十个了……还有两个！”</p><p style="color:#d8a060">猴符觉醒！空中攻击伤害 +50%</p><p style="color:#7fe9ff">兔符觉醒！完美闪避后 3 秒内出招速度再 +30%</p><p style="opacity:.75;font-size:13px">下一集（大结局）：狗、猪与圣主——月圆之夜的墓园、会射热光的神像，和十二符的真正主人</p><div class="obtns"><div class="go" data-a="ep9">开始第九集</div><div class="go alt" data-a="menu">返回主界面</div><div class="go alt" data-a="dojo">去练功房</div></div>`;
    }, 1500);
  };
  const _act = Menu.act.bind(Menu);
  Menu.act = function (a, b) { if (a === 'ep8') { this.resetSession(); this.start(() => Story.begin(27)); return; } return _act(a, b); };
}
Menu.refresh();
Object.assign(window.__ep8, { ev: (k, d) => gameEvent(k, d), EP8_PROLOGUE, RAIL_INTRO, VAL8_INTRO, EP8_ENDING });
