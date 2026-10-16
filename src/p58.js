// ================= 第五集 · 波次 / 剧情 / 路由 / 结算 =================
WAVES.push(
  { title: '第十八章 · 雪山栈道', sub: '在崖边用重击把敌人打下山！青色风带按 C 蹲下，红线是落石', list: ['thug', 'thug', 'ninja', 'thug'], at: [[0.5, 13], [-2, 11.5], [2.5, 10.5], [0, 9]], objective: () => SNOW.stage >= 2 && !enemies.some(e => !e.dead), script: (dt) => { snowScript(dt); } },
  { title: '第十九章 · 雪峰寺 · 刀鲁', sub: '引刀鲁站到钟底下，按 E 拉断钟绳！红色只能躲，琥珀色可以格挡，紫色是抓取', list: ['tohru5'], at: [[0, -7]], boss: 1, script: () => { if (BELL.state === 'hang' && !BELL_POSTS[0].on) BELL_POSTS.forEach(o => o.on = true); } },
  { title: '第二十章 · 阴阳台 · 黑成龙', sub: '看上方的阴阳盘：攻守平衡才打得动他——一味猛攻或一味防守，伤害都会大减', list: ['darkj'], at: [[0, -6]], boss: 1, script: () => { YYS.on = true; } },
);
CHAPTERS.push(
  { w: 18, n: '第十八章', t: '雪山栈道', d: '第五集 · 悬崖、山风与落石', ep: 5 },
  { w: 19, n: '第十九章', t: '雪峰寺 · 刀鲁', d: '第五集 · 拉断钟绳，罩住刀鲁', ep: 5 },
  { w: 20, n: '第二十章', t: '阴阳台 · 黑成龙', d: '第五集 · 镜像连招与阴阳盘', ep: 5 },
);
EP_TITLE[5] = '第五集 · 虎之护身符';
// 第十八章：把 updateSnow（风、落石、坠崖）放在每帧，坠崖下落动画在敌人更新之后
{
  const _uw = updateWaves;
  updateWaves = function (dt) { if (AREA.name === 'snow' && !cutscene && !gameOver) updateSnow(dt); _uw(dt); if (AREA.name === 'snow') updateCliffFalls(dt); };
}
let darkActor = null;
const EP5_PROLOGUE = [
  { who: 'narr', text: '第五集 · 虎之护身符', act: () => sfx('clang'), shot: () => [SC.x + 2.5, 2.2, SC.z + 1, SC.x, 1.3, SC.z - 4] },
  { who: 'uncle', text: '找到了！虎之护身符——就在喜马拉雅山上的一座古寺里！', act: () => uncle.mood = 'cheer' },
  { who: 'jackie', text: '喜马拉雅山？那里很冷吧……', to: 'uncle' },
  { who: 'uncle', text: '冷不冷不重要！虎符有阴阳之力，能把一个人分成好的一半和坏的一半！', act: () => uncle.mood = 'scold' },
  { who: 'jade', text: '那成龙坏的那一半，会不会比较酷？', act: () => { uncle.mood = null; jade.mood = 'cheer'; } },
  { who: 'jackie', text: '小玉！', to: 'jade' },
  { who: 'uncle', text: '听好！拿虎符的时候一定要用布包着，千万不能用手直接碰！一定要！', act: () => { jade.mood = null; uncle.mood = 'scold'; } },
  { who: 'jackie', text: '知道了，用布包着。', to: 'uncle' },
  { who: 'uncle', text: '还有！黑手帮也在找它——刀鲁已经先上山了。', act: () => uncle.mood = null },
  { who: 'jade', text: '我也去！我最会堆雪人了！', act: () => jade.mood = 'cheer' },
  { who: 'jackie', text: '不行。', to: 'jade' },
  { fade: () => Story.toSnow() },
];
const SNOW_INTRO = [
  { who: 'narr', text: '喜马拉雅山 · 悬崖栈道', shot: () => [SN.x - 2, 4.5, SN.z + 28, SN.x + 1, 1.5, SN.z + 14] },
  { who: 'jackie', text: '好冷……好高……好冷……', to: 'narr', shot: () => [SN.x + 3.4, 1.9, SN.z + 22, SN.x, 1.3, SN.z + 25.5] },
  { who: 'thug', text: '成龙来了！老大说了，一个都别让他过去！', act: () => spawnWave(18), shot: () => [SN.x + 2, 2.4, SN.z + 20, SN.x, 1.2, SN.z + 12] },
  { who: 'uncleP', text: '成龙！听得见吗？栈道外面就是悬崖——在崖边用重击，就能把他们打下山！' },
  { who: 'uncleP', text: '山上风大，青色的风带过来就蹲下！红线是落石，滚过来的时候赶快躲开！' },
  { who: 'jackie', text: '老爹，你怎么什么都知道？', to: 'narr' },
  { who: 'uncleP', text: '我上网查的！一定要！小心！' },
];
EP5_PROLOGUE.push(...SNOW_INTRO);
const BELL_INTRO = [
  { who: 'narr', text: '（栈道的尽头，一座积雪的古寺静静地立在山顶）', shot: () => [SN.x, 3, SN.z - 20, SN.x, 3, SN.z - 34] },
  { who: 'jackie', text: '……终于到了。我的脚趾头已经没感觉了。', to: 'narr' },
  { fade: () => Story.toBell() },
  { who: 'narr', text: '喜马拉雅山 · 雪峰寺', shot: () => [BT.x + 7, 4.5, BT.z + 11, BT.x, 3, BT.z - 2] },
  { who: 'tohru', text: '成龙。你不能过去。', act: () => { spawnWave(19); const t = enemies.find(e => e.type === 'tohru5'); if (t) { t.pos.set(BT.x, 0, BT.z - 7); t.yaw = 0; } Foley.at('roar', player.pos, { vol: 0.5, rate: 0.6 }); }, shot: () => [BT.x + 1.5, 2.4, BT.z - 1.5, BT.x, 2.2, BT.z - 7] },
  { who: 'jackie', text: '刀鲁！这么冷的天，你还穿这么少？', to: 'tohru' },
  { who: 'tohru', text: '虎之护身符属于圣主。' },
  { who: 'uncleP', text: '成龙！寺里那口大钟——引他站到钟底下，拉断钟绳，把刀鲁罩住！', shot: () => [BT.x + 4, 3, BT.z + 6.5, BT.x, 3.5, BT.z] },
  { who: 'uncleP', text: '小心！那口钟有八百年历史，不许砸坏！' },
  { who: 'jackie', text: '老爹，到底是要用钟砸他，还是不许砸坏？', to: 'narr' },
  { who: 'uncleP', text: '都要！' },
];
const SHADOW_INTRO = [
  { who: 'narr', text: '（刀鲁倒在雪地里。大钟里“叮”的一声，滚出一枚闪着金光的护身符）', act: () => { BELL.g && burst(new THREE.Vector3(BT.x, 0.4, BT.z + 1.6), 0xffd84a, 40, 4); }, shot: () => [BT.x + 2.5, 1.8, BT.z + 4.5, BT.x, 0.4, BT.z + 1.6] },
  { who: 'jackie', text: '虎之护身符！', to: 'narr' },
  { who: 'uncleP', text: '用布包着！千万不能用手——' },
  { who: 'jackie', text: '布……布……我的布在哪……', to: 'narr', act: () => { Story.putPlayer(BT.x, BT.z + 2.6, Math.PI); } },
  { who: 'narr', text: '（成龙一把抓住了护身符——一道金光闪过，把他劈成了两半）', act: () => { const p = player.pos; shake = 0.6; slowmo = 0.4; burst(p.clone().setY(1.2), 0xffd84a, 70, 7); burst(p.clone().setY(1.2), 0x6a3aaa, 70, 7); shock(p.clone().setY(0.1), 0xffd84a, 4); Foley.at('spell', p, { vol: 1, rate: 0.7 }); Foley.at('gong', p, { vol: 0.8, rate: 0.6 }); darkActor = spawnAt('darkj', BT.x - 1.6, BT.z + 1.0); darkActor.hb.style.display = 'none'; darkActor.yaw = Math.atan2(player.pos.x - darkActor.pos.x, player.pos.z - darkActor.pos.z); }, shot: () => [BT.x + 2.8, 1.9, BT.z + 4.8, BT.x - 0.5, 1.2, BT.z + 1.6] },
  { who: 'darkj', text: '终于……自由了。' },
  { who: 'jackie', text: '你……你是谁？', to: 'darkj' },
  { who: 'darkj', text: '我就是你。你心里那个，不想再当好人的成龙。' },
  { who: 'darkj', text: '你总是在道歉、在帮忙、在逃跑……我受够了。护身符，归我了！' },
  { who: 'narr', text: '（黑成龙夺过护身符，几个起落跳上了后山的阴阳台）', act: () => { if (darkActor) { burst(darkActor.pos.clone().setY(1), 0x6a3aaa, 40, 5); darkOut(); } Foley.at('swishH', player.pos, { vol: 0.7 }); } },
  { who: 'uncleP', text: '糟了糟了！虎符把你的阴和阳分开了！' },
  { who: 'uncleP', text: '要把你们合回一个人，就要攻守平衡！只攻不守、只守不攻，都打不赢他！' },
  { fade: () => Story.toYY() },
];
const YY_INTRO = [
  { who: 'narr', text: '后山 · 阴阳台（夜）', shot: () => [YY.x + 9, 6, YY.z + 11, YY.x, 0.5, YY.z] },
  { who: 'darkj', text: '来吧。你所有的招式我都知道——因为它们也是我的。', act: () => { spawnWave(20); const d = enemies.find(e => e.type === 'darkj'); if (d) { d.pos.set(YY.x, 0, YY.z - 6); d.yaw = 0; } }, shot: () => [YY.x + 1.6, 1.9, YY.z - 2.5, YY.x, 1.3, YY.z - 6] },
  { who: 'jackie', text: '那你一定也知道……我很怕痛。', to: 'darkj' },
  { who: 'darkj', text: '所以这一次，我先出手。' },
  { who: 'uncleP', text: '成龙！看上面的阴阳盘！打一打、守一守，保持平衡，才伤得了他！' },
  { who: 'uncleP', text: '还有！他会学你的招式——你出什么，他就还你什么！' },
];
const EP5_ENDING = [
  { who: 'narr', text: '（黑成龙单膝跪地，身上的黑雾一阵阵散开）', shot: () => { const d = enemies.find(e => e.type === 'darkj') || player; return [d.pos.x + 2.6, 1.7, d.pos.z + 2.2, d.pos.x, 0.9, d.pos.z]; } },
  { who: 'darkj', text: '为什么……你明明那么胆小……' },
  { who: 'jackie', text: '我是胆小。可是我每次都会站起来——你就是我，所以你也会。', to: 'darkj' },
  { who: 'narr', text: '（两个成龙同时握住了虎之护身符。金光和黑影卷成一个太极——合二为一）', act: () => { const d = enemies.find(e => e.type === 'darkj'); const c = d ? d.pos.clone().lerp(player.pos, 0.5) : player.pos.clone(); shake = 0.5; slowmo = 0.5; burst(c.clone().setY(1.2), 0xffd84a, 60, 6); burst(c.clone().setY(1.2), 0x6a3aaa, 60, 6); shock(c.clone().setY(0.1), 0xffffff, 5); Foley.at('spell', c, { vol: 1, rate: 0.9 }); Foley.at('gong', c, { vol: 0.7 }); if (d) { d.rig.root.visible = false; d.gone = true; scene.remove(d.rig.root); } } },
  { who: 'jackie', text: '……我回来了。完完整整的我。', to: 'narr' },
  { who: 'narr', text: '（夜空里传来直升机的轰鸣，一束探照灯打在阴阳台上）', act: () => { Foley.at('thrust', player.pos, { vol: 0.6, rate: 0.5 }); } },
  { who: 'jade', text: '成龙！布莱克上尉的直升机可快了！', act: () => { jade.place(player.pos.x - 2, player.pos.z + 2.4, 0); jade.mood = 'cheer'; } },
  { who: 'jackie', text: '小玉？！你怎么——', to: 'jade' },
  { who: 'jade', text: '我跟上尉说你需要后援。我就是后援！', act: () => jade.mood = null },
  { who: 'uncleP', text: '虎符拿回来了？好！五个了，还有七个！' },
  { who: 'uncleP', text: '还有！以后不许再跟自己吵架！' },
  { who: 'jackie', text: '……是，老爹。', to: 'narr' },
];
function darkOut() { const d = darkActor; if (!d) return; d.rig.root.removeFromParent(); d.hb.remove(); d.dead = true; d.gone = true; const i = enemies.indexOf(d); if (i >= 0) enemies.splice(i, 1); darkActor = null; }
Object.assign(Story, {
  toSnow() { this.setArea('snow'); this.putPlayer(SN.x, SN.z + SN.hz - 2.5, Math.PI); uncle.hide(); jade.hide(); Object.assign(SNOW, { stage: 0, gustT: 6, rockT: 10, falls: 0 }); SNOW.gusts.length = 0; },
  toBell() { this.setArea('bell'); this.putPlayer(BT.x, BT.z + 10.5, Math.PI); uncle.hide(); jade.hide(); bellReset(); },
  toYY() { this.setArea('yy'); this.putPlayer(YY.x, YY.z + 7, Math.PI); uncle.hide(); jade.hide(); Object.assign(YYS, { b: 0, on: false, last: null }); YYS.rec.length = 0; },
  beginEp5(ch) {
    if (ch === 18) {
      this.setArea('shop'); this.putPlayer(SC.x + 0.4, SC.z - 1.6, Math.PI);
      uncle.place(SC.x, SC.z - 5.3, 0); jade.place(SC.x + 1.7, SC.z - 3.8, -0.6);
      this.play(EP5_PROLOGUE, () => startWave(18));
    } else if (ch === 19) { this.toBell(); this.play(BELL_INTRO.slice(3), () => startWave(19)); }
    else { this.toYY(); this.play(YY_INTRO, () => startWave(20)); }
  },
  onClearEp5(w, T) {
    if (w === 18) T(1.4, BELL_INTRO, () => startWave(19));
    else if (w === 19) { BELL_POSTS.forEach(o => o.on = false); T(2.4, SHADOW_INTRO.concat(YY_INTRO), () => startWave(20)); }
    else T(2.6, EP5_ENDING, () => { YYS.on = false; try { localStorage.setItem('jc_tiger2', '1'); } catch (e) { } tigerDesc(); gameEnd(true, 5); });
  },
});
{
  const _b4 = Story.beginEp4.bind(Story), _c4 = Story.onClearEp4.bind(Story);
  Story.beginEp4 = function (ch) { if (ch >= 18) return this.beginEp5(ch); return _b4(ch); };
  Story.onClearEp4 = function (w, T) { if (w >= 18) return this.onClearEp5(w, T); return _c4(w, T); };
  try { if (localStorage.getItem('jc_clear4') === '1') saveProgress(18); } catch (e) { }
}
// 配乐：潜入 / 飞艇 Boss / 雪山 / 镜像 Boss（mmx 生成的新曲子；没有数据时退回原来的）
{
  const _pick = BGM.pick.bind(BGM);
  BGM.pick = function () {
    const r = _pick(); if (!started || MODE !== 'story') return r;
    const fight = r === 'battle' || r === 'boss', has = k => typeof BGM_DATA !== 'undefined' && BGM_DATA[k];
    if (AREA.name === 'base' && (r === 'museum' || r === 'temple') && has('base13')) return 'base13';
    if (wave === 17 && fight && AREA.name === 'deck' && has('sky')) return 'sky';
    if (AREA.name === 'snow' && has('snow')) return 'snow';
    if (AREA.name === 'yy' && has('mirror') && (fight || cutscene)) return 'mirror';
    return r;
  };
}
{
  const _rs = Menu.resetSession.bind(Menu);
  Menu.resetSession = function () { _rs(); bellReset(); YYS.on = false; YYS.b = 0; YYS.rec.length = 0; SNOW.gusts.length = 0; SNOW.rocks.forEach(r => scene.remove(r.m)); SNOW.rocks.length = 0; SNOW.stage = 0; darkActor = null; TIGER2.t = -9; };
}
// ================= 结算 / 菜单 =================
{
  const _ge = gameEnd;
  gameEnd = function (win, ep = 1) {
    if (!(win && ep === 5)) return _ge(win, ep);
    gameOver = true;
    try { sessionStorage.removeItem('jc_ch'); localStorage.setItem('jc_clear', '1'); localStorage.setItem('jc_clear5', '1'); saveProgress(20); } catch (e) { }
    const mins = Math.floor(playTime / 60), secs = Math.floor(playTime % 60);
    clearTimeout(gameEndTimer);
    gameEndTimer = setTimeout(() => {
      document.exitPointerLock(); $('pause').classList.remove('show'); $('ov').style.display = 'flex';
      $('ov').querySelector('.box').innerHTML = `<h1>完</h1><h2>第五集 · 虎之护身符</h2><p>击倒敌人 ${kills} 名 · 打下悬崖 ${SNOW.falls || 0} 人 · 大钟用了 ${BELL.used || 0} 次 · 用时 ${mins} 分 ${secs} 秒<br>老爹：“五个了……还有七个！”</p><p style="color:#ffb84a">虎符觉醒！装备虎符后，完美格挡 / 完美闪避后 4 秒内，每次命中都有影子追击（50% 伤害）</p><p style="opacity:.6;font-size:13px">下一集预告：敬请期待</p><div class="obtns"><div class="go" data-a="menu">返回主界面</div><div class="go alt" data-a="dojo">去练功房</div></div>`;
    }, 1500);
  };
  const _act = Menu.act.bind(Menu);
  Menu.act = function (a, b) { if (a === 'ep5') { this.resetSession(); this.start(() => Story.begin(18)); return; } return _act(a, b); };
}
Menu.refresh();
