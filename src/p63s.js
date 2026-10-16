// ================= 第九集 · 波次 / 剧情 / 路由 / 结算（大结局） =================
WAVES.push(
  { title: '第三十章 · 旧墓园 · 不死之身', sub: '不死者血打空会倒地 3 秒再爬起来——趁它倒地，用攻击（重击更远）把它打进金色封印圈', list: ['zomb', 'zomb', 'zomb'], at: [[-4, -6], [4, -6], [0, -9]], objective: () => SEAL.stage >= 2 && !enemies.some(e => !e.dead), script: (dt) => { if (!cutscene) graveScript(dt); } },
  { title: '第三十一章 · 猪神殿 · 热光眼', sub: '神像平时刀枪不入：躲过热光扫射（柱子后面 / 跳过去 / 翻滚），它过热时背后发红——那时猛打', list: ['pigIdol'], at: [[0, 0]], boss: 1, objective: () => { const i = enemies.find(e => e.type === 'pigIdol'); return !!i && i.dead && !enemies.some(e => !e.dead); }, script: (dt) => { if (!cutscene) templeScript(dt); } },
  { title: '第三十二章 · 天界祭坛 · 圣主', sub: '圣主飞在天上打不到：等它喷完火低头、或俯冲撞地时打它的头。虚弱时跟着老爹念咒语封印它', list: ['shendu'], at: [[0, -ALT.r - 4]], boss: 1, script: (dt) => { if (!cutscene) altarScript(dt); } },
);
CHAPTERS.push(
  { w: 30, n: '第三十章', t: '旧墓园 · 不死之身', d: '第九集 · 狗符与封印阵', ep: 9 },
  { w: 31, n: '第三十一章', t: '猪神殿 · 热光眼', d: '第九集 · 柱子后面躲一躲', ep: 9 },
  { w: 32, n: '第三十二章', t: '天界祭坛 · 圣主', d: '大结局 · 十二符之力', ep: 9 },
);
EP_TITLE[9] = '第九集 · 狗、猪与圣主';
{
  const _uw = updateWaves;
  updateWaves = function (dt) {
    const A = AREA.name;
    if ((A === 'grave' || A === 'ptemple') && !gameOver) { updateFurn(dt); updateSeals(dt); }
    _uw(dt);
  };
}
// ---------- 狗符觉醒 / 猪符觉醒 ----------
const DOG2 = { get on() { try { return localStorage.getItem('jc_dog2') === '1'; } catch (e) { return false; } } };
const PIG2 = { get on() { try { return localStorage.getItem('jc_pig2') === '1'; } catch (e) { return false; } } };
function ep9RuneDesc() {
  const D = RUNE['dog'];
  const Pg = RUNE['pig'];
  if (D && DOG2.on) { D.full = '狗符 · 不死之身（觉醒）'; D.desc = '受到致命伤时留 1 口气并回复 30% 生命，冷却缩短到 30 秒；触发时震飞周围的敌人'; }
  if (Pg && PIG2.on) { Pg.full = '猪符 · 热光眼（觉醒）'; Pg.desc = '重击命中后眼射热光，打中前方 7 米直线上的敌人；觉醒后连射两发'; }
}
ep9RuneDesc();
{
  const _pth = playerTakeHit;
  playerTakeHit = function (...a) {
    const cd0 = Runes.dogCD; const r = _pth(...a);
    if (Runes.dogCD !== cd0 && DOG2.on) { Runes.dogCD -= 30; const p = player.pos; shock(p.clone().setY(0.1), 0x8cff7a, 4); burst(p.clone().setY(1), 0x8cff7a, 50, 6); showMove('狗符 · 不死！', '#8cff7a'); for (const e of enemies) { if (e.dead || e.type === 'dummy') continue; const dx = e.pos.x - p.x, dz = e.pos.z - p.z, d = Math.hypot(dx, dz); if (d < 4) e.takeHit(30, new THREE.Vector2(dx / (d || 1), dz / (d || 1)), { kb: 9, kd: 1 }, 1, false); } }
    return r;
  };
  const _rb = runeBeam;
  runeBeam = function (...a) { const r = _rb(...a); if (PIG2.on) Story.timers.push({ t: 0.18, f: () => _rb(...a) }); return r; };
}
// ---------- 剧情 ----------
const EP9_PROLOGUE = [
  { who: 'narr', text: '第九集 · 狗、猪与圣主', act: () => sfx('clang'), shot: () => [SC.x + 2.5, 2.2, SC.z + 1, SC.x, 1.3, SC.z - 4] },
  { who: 'uncle', text: '十个护身符都齐了，只差最后两个——狗，和猪。' },
  { who: 'jackie', text: '它们在哪儿？', to: 'uncle' },
  { who: 'uncle', text: '狗符埋在唐人街的旧墓园里。拿着它的人……不会死。' },
  { who: 'jade', text: '不会死？那不是很好吗？' },
  { who: 'uncle', text: '不好！墓园里埋着的东西，也会跟着爬起来！', act: () => uncle.mood = 'scold' },
  { who: 'jackie', text: '……我们能不能白天去？', to: 'uncle' },
  { who: 'uncle', text: '不能！今晚月圆，不死之力最强——圣主的手下一定会去抢！' },
  { who: 'jackie', text: '圣主？', to: 'uncle' },
  { who: 'uncle', text: '十二个护身符原本都属于他。他想把它们全拿回去，重返人间！' },
  { who: 'uncle', text: '记住！不死者倒下的时候，把它们打进金色的封印圈！一定要！', act: () => uncle.mood = null },
  { fade: () => Story.toGrave() },
  { who: 'narr', text: '唐人街旧墓园 · 月圆之夜', shot: () => [GY.x + 7, 5, GY.z + 11, GY.x, 1, GY.z] },
  { who: 'jackie', text: '……我就知道是晚上。', to: 'narr', shot: () => [GY.x + 1.6, 1.9, GY.z + GY.hz - 4, GY.x, 1.3, GY.z + GY.hz - 1] },
  { who: 'narr', text: '（泥土翻动，一只只发绿的手从坟堆里伸了出来）', act: () => { spawnWave(30); enemies.forEach(e => burst(e.pos.clone().setY(0.3), 0x7dff9a, 20, 3)); Foley.at('growl', player.pos, { vol: 0.7 }); }, shot: () => [GY.x + 2, 2.6, GY.z + 2, GY.x, 1, GY.z - 7] },
  { who: 'uncleP', text: '成龙！老爹已经在地上画好了封印阵——金色的圈！' },
  { who: 'uncleP', text: '不死者被打倒三秒后会爬起来！趁它们倒地，把它们打进圈里！' },
  { who: 'jackie', text: '打倒一次还不够？', to: 'narr' },
  { who: 'uncleP', text: '不够！快打！' },
];
const PIG9_INTRO = [
  { who: 'narr', text: '（不死犬被金光吞没，一枚刻着狗头的护身符落在了封印阵中央）', shot: () => [player.pos.x + 2.6, 2, player.pos.z + 2.6, player.pos.x, 1, player.pos.z] },
  { who: 'jackie', text: '狗符，到手。', to: 'narr', act: () => { const p = player.pos; burst(p.clone().setY(1.2), 0x8cff7a, 40, 4); Foley.at('magic', p, { vol: 0.6 }); } },
  { who: 'uncleP', text: '最后一个，猪符——在城外的猪神殿里，嵌在神像的额头上！' },
  { fade: () => Story.toTemple() },
  { who: 'narr', text: '猪神殿', act: () => spawnWave(31), shot: () => [PT.x + 6, 4, PT.z + 11, PT.x, 2.5, PT.z] },
  { who: 'jackie', text: '这尊神像……为什么一直盯着我看？', to: 'narr', shot: () => [PT.x + 1.6, 1.9, PT.z + PT.r - 4, PT.x, 2.6, PT.z] },
  { who: 'narr', text: '（神像的双眼亮起了红光）', act: () => { const i = enemies.find(e => e.type === 'pigIdol'); if (i) i.eyeM.color.setRGB(6, 1.2, 0.2); Foley.at('beam', player.pos, { vol: 0.5, rate: 0.7 }); }, shot: () => [PT.x + 1.2, 3.2, PT.z + 4, PT.x, 3.8, PT.z] },
  { who: 'uncleP', text: '猪符能射出热光！躲到柱子后面，或者跳过去！' },
  { who: 'uncleP', text: '神像射完一轮会过热——背后发红的时候，狠狠地打！' },
  { who: 'jackie', text: '打神像……会不会遭报应？', to: 'narr' },
  { who: 'uncleP', text: '它先打你的！' },
];
const FINAL_INTRO = [
  { who: 'narr', text: '（神像轰然裂开，猪符滚到了成龙脚边）', shot: () => [player.pos.x + 2.6, 2, player.pos.z + 2.6, player.pos.x, 1, player.pos.z] },
  { who: 'jackie', text: '十二个……全齐了。', to: 'narr', act: () => { const p = player.pos; burst(p.clone().setY(1.2), 0xff6a5a, 40, 4); Foley.at('magic', p, { vol: 0.6 }); } },
  { who: 'narr', text: '（就在这时，十二枚护身符同时发出刺眼的光——地面裂开了）', act: () => { shake = 0.6; Foley.at('quake', player.pos, { vol: 1 }); burst(player.pos.clone().setY(1), 0xffd84a, 80, 7); } },
  { who: 'shendu', text: '谢谢你，成龙。替我把十二个护身符都找齐了。' },
  { who: 'uncleP', text: '圣主！他要借护身符的力量回到人间！' },
  { fade: () => Story.toAltar() },
  { who: 'narr', text: '天界祭坛', act: () => { spawnWave(32); const d = enemies.find(e => e.type === 'shendu'); if (d) d.setState('intro'); }, shot: () => [ALT.x + 9, 6, ALT.z + 11, ALT.x, 3, ALT.z] },
  { who: 'shendu', text: '五百年了……我终于又看见人间了。', act: () => Foley.at('roar', player.pos, { vol: 0.9, rate: 0.7 }), shot: () => { const d = enemies.find(e => e.type === 'shendu'); const h = d ? d.H : new THREE.Vector3(ALT.x, 6, ALT.z - ALT.r); return [player.pos.x + 1.5, 2.2, player.pos.z + 2.5, h.x, h.y, h.z]; } },
  { who: 'jackie', text: '你看够了吧？可以回去了。', to: 'shendu' },
  { who: 'shendu', text: '口气不小。把护身符交出来！' },
  { who: 'uncleP', text: '成龙！它飞在天上你打不到——等它喷完火、或者一头撞在地上，打它的头！' },
  { who: 'uncleP', text: '等它虚弱了，老爹念咒语封印它！你跟着我念！' },
  { who: 'jackie', text: '我们什么时候练过这个？！', to: 'narr' },
  { who: 'uncleP', text: '现在！', act: () => { const d = enemies.find(e => e.type === 'shendu'); if (d) { d.setState('fly'); d.cd = 1.5; } } },
];
const EP9_ENDING = [
  { who: 'narr', text: '（金色的封印阵越收越紧，圣主的身体一节一节化成了光点）', shot: () => [ALT.x + 8, 5, ALT.z + 10, ALT.x, 3, ALT.z] },
  { who: 'shendu', text: '不——！我还会回来的……' },
  { who: 'jackie', text: '下次请提前预约。', to: 'narr' },
  { who: 'narr', text: '（天空的裂缝合上了。十二枚护身符静静地落在成龙手里）', act: () => { const p = player.pos; RUNES.forEach((Rn, i) => Story.timers.push({ t: i * 0.1, f: () => burst(p.clone().setY(1.2), new THREE.Color(Rn.color).getHex(), 12, 4) })); Foley.at('magic', p, { vol: 0.8 }); } },
  { fade: () => Story.toShopEnd() },
  { who: 'narr', text: '老爹的古董店 · 第二天早上', shot: () => [SC.x + 2.5, 2.2, SC.z + 1, SC.x, 1.3, SC.z - 4] },
  { who: 'uncle', text: '十二个护身符，一个不少！', act: () => uncle.mood = 'cheer' },
  { who: 'jade', text: '成龙，我们下次去哪儿冒险？', act: () => jade.mood = 'cheer' },
  { who: 'jackie', text: '下次？下次我要先睡一个星期。', to: 'jade', act: () => jade.mood = null },
  { who: 'uncle', text: '还有一件事！', act: () => uncle.mood = 'scold' },
  { who: 'jackie', text: '……什么事？', to: 'uncle' },
  { who: 'uncle', text: '家具城的赔偿单、夜市的摊子钱，还有马戏团的帐篷——全都寄到店里来了！' },
  { who: 'jackie', text: '不是说记黑手帮账上吗？！', to: 'uncle' },
  { who: 'uncle', text: '黑手帮……破产了。', act: () => uncle.mood = null },
  { who: 'narr', text: '全剧终' },
];
Object.assign(Story, {
  toGrave() { this.setArea('grave'); this.putPlayer(GY.x, GY.z + GY.hz - 2, Math.PI); uncle.hide(); jade.hide(); sealsClear(); [[-6, -2], [6, -3], [0, 5], [-7, 7], [7, 6]].forEach(([x, z]) => addSeal(GY.x + x, GY.z + z)); Object.assign(SEAL, { stage: 0, sealed: 0, revived: 0 }); graveWeapons(); },
  toTemple() { sealsClear(); this.setArea('ptemple'); this.putPlayer(PT.x, PT.z + PT.r - 4.5, Math.PI); uncle.hide(); jade.hide(); furnReset('ptemple'); PIG.pillars.forEach(f => f.heat = 0); Object.assign(PIG, { st: 0, beams: 0, blocked: 0 }); templeWeapons(); },
  toAltar() { this.setArea('altar'); this.putPlayer(ALT.x, ALT.z + ALT.r - 3, Math.PI); uncle.hide(); jade.hide(); Object.assign(FINAL, { allRunes: false, phase: 0, qte: null, qteN: 0, sealedOK: 0, meteors: 0 }); FINAL.peds.forEach(P => P.gm.color.copy(P.col).multiplyScalar(0.25)); qteDraw(); },
  toShopEnd() { FINAL.allRunes = false; this.setArea('shop'); this.putPlayer(SC.x + 0.4, SC.z - 1.6, Math.PI); uncle.place(SC.x, SC.z - 5.3, 0); jade.place(SC.x + 1.7, SC.z - 3.8, -0.6); },
  beginEp9(ch) {
    if (ch === 30) {
      this.setArea('shop'); this.putPlayer(SC.x + 0.4, SC.z - 1.6, Math.PI);
      uncle.place(SC.x, SC.z - 5.3, 0); jade.place(SC.x + 1.7, SC.z - 3.8, -0.6);
      this.play(EP9_PROLOGUE, () => startWave(30));
    } else if (ch === 31) { this.toGrave(); this.play(PIG9_INTRO.slice(2), () => startWave(31)); }
    else { this.toTemple(); this.play(FINAL_INTRO.slice(2), () => startWave(32)); }
  },
  onClearEp9(w, T) {
    if (w === 30) T(1.6, PIG9_INTRO, () => startWave(31));
    else if (w === 31) T(2.0, FINAL_INTRO, () => startWave(32));
    else T(2.8, EP9_ENDING, () => { try { localStorage.setItem('jc_dog2', '1'); localStorage.setItem('jc_pig2', '1'); } catch (e) { } ep9RuneDesc(); Runes.award('dog', true); Runes.award('pig', true); gameEnd(true, 9); });
  },
});
{
  const _b8 = Story.beginEp8.bind(Story), _c8 = Story.onClearEp8.bind(Story);
  Story.beginEp8 = function (ch) { if (ch >= 30) return this.beginEp9(ch); return _b8(ch); };
  Story.onClearEp8 = function (w, T) { if (w >= 30) return this.onClearEp9(w, T); return _c8(w, T); };
  try { if (localStorage.getItem('jc_clear8') === '1') saveProgress(30); } catch (e) { }
}
{
  const _pick = BGM.pick.bind(BGM);
  BGM.pick = function () {
    const has = k => typeof BGM_DATA !== 'undefined' && BGM_DATA[k];
    if (FINAL.credits && has('ending')) return 'ending';
    const r = _pick(); if (!started || MODE !== 'story') return r;
    const m = { grave: 'spirit', ptemple: 'shrine', altar: 'finale' }[AREA.name];
    if (AREA.name === 'shop' && FINAL.sealedOK && has('ending')) return 'ending';
    return m && has(m) ? m : r;
  };
}
{
  const _rs = Menu.resetSession.bind(Menu);
  Menu.resetSession = function () { _rs(); sealsClear(); FINAL.allRunes = false; FINAL.qte = null; FINAL.credits = false; FINAL.sealedOK = 0; qteDraw(); SEAL.stage = 0; PIG.st = 0; $('credits') && $('credits').remove(); };
}
// ---------- 大结局：致谢滚动字幕 ----------
document.head.insertAdjacentHTML('beforeend', `<style>#credits{position:fixed;inset:0;z-index:40;background:radial-gradient(ellipse at center,#2a1406 0%,#000 75%);overflow:hidden;color:#f4e2b8;font-family:"Noto Sans SC",sans-serif;text-align:center}#credits .roll{position:absolute;left:0;right:0;top:100%;animation:croll 62s linear forwards}#credits h1{font-size:44px;color:#ffd84a;letter-spacing:8px;margin:0 0 10px}#credits h3{font-size:16px;color:#ffb070;margin:34px 0 6px;letter-spacing:4px}#credits p{margin:4px 0;font-size:18px}#credits .runes{font-size:30px;letter-spacing:6px;margin-top:20px}#credits .x{position:absolute;right:18px;bottom:16px;padding:8px 18px;border:1px solid #ffd84a;border-radius:10px;cursor:pointer;color:#ffd84a;background:rgba(0,0,0,.4)}@keyframes croll{to{transform:translateY(calc(-100% - 100vh))}}</style>`);
function rollCredits(done) {
  FINAL.credits = true; document.exitPointerLock && document.exitPointerLock();
  const rn = RUNES.map(r => `<span style="color:${r.color}">${r.name}</span>`).join('');
  const html = `<div class="roll"><h1>成龙历险记</h1><p>护身符之战 · 全剧终</p><div class="runes">${rn}</div>
  <h3>游戏制作</h3><p>Marco（ACCSCI）</p><p>与 Notion AI 一起完成</p>
  <h3>致敬</h3><p>动画《成龙历险记》（Jackie Chan Adventures）</p><p>本作为同人练习作品，仅供学习交流</p>
  <h3>引擎</h3><p>three.js · WebGPU / WebGL2</p>
  <h3>角色动作</h3><p>Adobe Mixamo</p>
  <h3>配音</h3><p>VibeHub（成龙、老爹、小玉、旁白）</p><p>MiniMax Speech（反派、路人、广播）</p>
  <h3>配乐</h3><p>MiniMax Music</p>
  <h3>音效</h3><p>Mixkit · VibeHub（ElevenLabs）· Kenney Impact Sounds（CC0）· qubodup（CC0）</p><p>爆炸音效：Michel Baradari（CC-BY 3.0）</p>
  <h3>主演</h3><p>成龙 · 老爹 · 小玉</p><p>瓦尔蒙 · 刀鲁 · 芬恩 · 拉索 · 阿周 · 刀龙 · 圣主</p>
  <h3>特别感谢</h3><p>每一位玩到这里的你</p>
  <h3>&nbsp;</h3><p style="font-size:26px;color:#ffd84a">“还有一件事！”</p><p>—— 老爹</p></div><div class="x">返回</div>`;
  const el = document.createElement('div'); el.id = 'credits'; el.innerHTML = html; document.body.appendChild(el);
  const end = () => { if (!el.isConnected) return; el.remove(); FINAL.credits = false; done && done(); };
  el.querySelector('.x').onclick = end; el.querySelector('.roll').addEventListener('animationend', () => setTimeout(end, 1500));
}
{
  const _ge = gameEnd;
  gameEnd = function (win, ep = 1) {
    if (!(win && ep === 9)) return _ge(win, ep);
    gameOver = true;
    try { sessionStorage.removeItem('jc_ch'); localStorage.setItem('jc_clear', '1'); localStorage.setItem('jc_clear9', '1'); localStorage.setItem('jc_allclear', '1'); saveProgress(32); } catch (e) { }
    const mins = Math.floor(playTime / 60), secs = Math.floor(playTime % 60);
    clearTimeout(gameEndTimer);
    gameEndTimer = setTimeout(() => {
      $('pause').classList.remove('show');
      rollCredits(() => {
        $('ov').style.display = 'flex';
        $('ov').querySelector('.box').innerHTML = `<h1>全剧终</h1><h2>第九集 · 狗、猪与圣主</h2><p>击倒敌人 ${kills} 名 · 封印不死者 ${SEAL.sealed} 个 · 柱子挡下热光 ${PIG.blocked} 次 · 念咒 ${FINAL.qteN} 次 · 用时 ${mins} 分 ${secs} 秒</p><p>十二个护身符，一个不少！<br>老爹：“还有一件事！”</p><p style="color:#8cff7a">狗符觉醒！不死之身冷却 30 秒，触发时震飞周围敌人</p><p style="color:#ff6a5a">猪符觉醒！热光眼连射两发</p><p style="opacity:.75;font-size:13px">感谢游玩！所有章节都可以在“章节选择”里重玩</p><div class="obtns"><div class="go" data-a="menu">返回主界面</div><div class="go alt" data-a="dojo">去练功房</div></div>`;
      });
    }, 1800);
  };
  const _act = Menu.act.bind(Menu);
  Menu.act = function (a, b) { if (a === 'ep9') { this.resetSession(); this.start(() => Story.begin(30)); return; } return _act(a, b); };
}
Menu.refresh();
Object.assign(window.__ep9, { DOG2, PIG2, rollCredits, EP9_PROLOGUE, PIG9_INTRO, FINAL_INTRO, EP9_ENDING });
