// ================= 第七集 · 波次 / 剧情 / 路由 / 结算 =================
WHO.vendor = { n: '摊主阿婆', c: '#ffb07a', e: () => player };
WAVES.push(
  { title: '第二十四章 · 唐人街夜市 · 芬恩', sub: '芬恩有马符：绿色圈是治疗——用重击、反击或大伤害打断他！红线是马踏冲刺，可能连踏两次', list: ['finn7', 'thug', 'thug'], at: [[0, -8], [-2.5, -4], [2.5, -5]], boss: 1, objective: () => { const f = enemies.find(e => e.type === 'finn7'); return !!f && f.dead && !enemies.some(e => !e.dead); }, script: (dt) => { if (!cutscene) marketScript(dt); } },
  { title: '第二十五章 · 灵界 · 守护肉身', sub: '你的灵魂被打出了肉身！游魂会扑向肉身吸取灵魂之力——优先打掉正在吸的（红光）', list: [], objective: () => SOUL.spawnQ <= 0 && !enemies.some(e => !e.dead), script: (dt) => { if (!cutscene && !gameOver) spiritScript(dt); } },
  { title: '第二十六章 · 梦魇 · 阿周', sub: '阿周会瞬移、分身：打中假的会消散；地上冒出的红圈是梦里的手。半血后巨眼睁开——它看你时按住格挡', list: ['chow7'], at: [[0, -7]], boss: 1, script: (dt) => { if (!cutscene) dreamScript(dt); } },
);
CHAPTERS.push(
  { w: 24, n: '第二十四章', t: '唐人街夜市 · 芬恩', d: '第七集 · 马符与治疗圈', ep: 7 },
  { w: 25, n: '第二十五章', t: '灵界 · 守护肉身', d: '第七集 · 灵魂出窍', ep: 7 },
  { w: 26, n: '第二十六章', t: '梦魇 · 阿周', d: '第七集 · 羊符与巨眼', ep: 7 },
);
EP_TITLE[7] = '第七集 · 马与羊';
{
  const _uw = updateWaves;
  updateWaves = function (dt) {
    updateSoulBody(dt);
    if (AREA.name === 'market' && !gameOver) updateFurn(dt);
    if (AREA.name !== 'spirit') { const h = $('soulhud'); if (h && h.style.display !== 'none') h.style.display = 'none'; }
    _uw(dt);
  };
}
// ---------- 马符觉醒 / 羊符觉醒 ----------
const HORSE2 = { get on() { try { return localStorage.getItem('jc_horse2') === '1'; } catch (e) { return false; } } };
const SHEEP2 = { get on() { try { return localStorage.getItem('jc_sheep2') === '1'; } catch (e) { return false; } } };
function ep7RuneDesc() {
  const H = RUNE['horse'];
  const S = RUNE['sheep'];
  if (H && HORSE2.on) { H.full = '马符 · 治愈（觉醒）'; H.desc = '每秒恢复 1.5 生命；完美格挡、完美闪避各回复 6 生命'; }
  if (S && SHEEP2.on) { S.full = '羊符 · 灵魂出窍（觉醒）'; S.desc = '闪避无敌时间 +50%，闪避体力消耗减半；完美闪避留下灵魂残影，1 秒后爆开（25 伤害）'; }
}
ep7RuneDesc();
const GHOSTS = [];
{
  const _ge = gameEvent;
  gameEvent = function (k, d) {
    _ge(k, d);
    if ((k === 'pdodge' || k === 'parry') && Runes.has('horse') && HORSE2.on && player.hp > 0) { player.hp = Math.min(player.maxHp, player.hp + 6); floatText(player.pos.clone().setY(2.1), '+6', '#7dffb0', 20); }
    if (k === 'pdodge' && Runes.has('sheep') && SHEEP2.on) {
      const g = new THREE.Group(); g.position.copy(player.pos); scene.add(g);
      const mat = new THREE.MeshBasicMaterial({ color: 0xbfd0ff, transparent: true, opacity: 0.45, toneMapped: false, depthWrite: false });
      mesh(new THREE.CapsuleGeometry(0.3, 0.9, 4, 10), mat, 0, 0.95, 0, g, false); mesh(new THREE.SphereGeometry(0.2, 10, 8), mat, 0, 1.75, 0, g, false);
      GHOSTS.push({ g, mat, t: 0 }); showMove('灵魂残影！', '#e8e8ff');
    }
  };
  const _upd = updatePlayer;
  updatePlayer = function (dt) {
    _upd(dt);
    for (let i = GHOSTS.length - 1; i >= 0; i--) {
      const G = GHOSTS[i]; G.t += dt; G.mat.opacity = 0.3 + 0.2 * Math.sin(G.t * 20);
      if (G.t >= 1) {
        const p = G.g.position.clone().setY(0); scene.remove(G.g); GHOSTS.splice(i, 1);
        shock(p.clone().setY(0.1), 0xe8e8ff, 2.5); burst(p.clone().setY(1), 0xbfd0ff, 36, 5); Foley.at('magic', p, { vol: 0.7 }); shake = Math.max(shake, 0.15);
        for (const e of enemies) { if (e.dead || e.type === 'dummy') continue; const dx = e.pos.x - p.x, dz = e.pos.z - p.z, d = Math.hypot(dx, dz); if (d > 2.5) continue; e.takeHit(25, new THREE.Vector2(dx / (d || 1), dz / (d || 1)), { kb: 5 }, 1, false); }
      }
    }
  };
}
// ---------- 剧情 ----------
const EP7_PROLOGUE = [
  { who: 'narr', text: '第七集 · 马与羊', act: () => sfx('clang'), shot: () => [SC.x + 2.5, 2.2, SC.z + 1, SC.x, 1.3, SC.z - 4] },
  { who: 'uncle', text: '一下子有两个护身符的消息！马符，和羊符！', act: () => uncle.mood = 'cheer' },
  { who: 'jackie', text: '两个？在哪儿？', to: 'uncle' },
  { who: 'uncle', text: '马符在唐人街夜市，被人当成药材摊的镇摊之宝！', act: () => uncle.mood = null },
  { who: 'jade', text: '那羊符呢？' },
  { who: 'uncle', text: '羊符……能让人的灵魂离开身体。拿着它的人，可以走进别人的梦里！', act: () => uncle.mood = 'scold' },
  { who: 'jackie', text: '听起来不太妙。', to: 'uncle' },
  { who: 'uncle', text: '所以要小心！马符能治伤，羊符能出窍——落在黑手帮手里，后患无穷！' },
  { who: 'jade', text: '夜市！我要吃鱼蛋！', act: () => { uncle.mood = null; jade.mood = 'cheer'; } },
  { who: 'jackie', text: '小玉，留在店里。', to: 'jade', act: () => jade.mood = null },
  { fade: () => Story.toMarket() },
  { who: 'narr', text: '唐人街夜市 · 晚上十点', shot: () => [NM.x + 3, 4, NM.z + NM.hz - 2, NM.x, 1.5, NM.z] },
  { who: 'vendor', text: '鱼蛋、烧卖、糖葫芦！后生仔，来一串？' },
  { who: 'jackie', text: '不了阿婆，我找人。', to: 'narr', shot: () => [NM.x + 1.6, 1.9, NM.z + NM.hz - 4, NM.x, 1.3, NM.z + NM.hz - 1] },
  { who: 'finn', text: '找我吗，成龙？', act: () => { spawnWave(24); const f = enemies.find(e => e.type === 'finn7'); if (f) { f.pos.set(NM.x, 0, NM.z + NM.hz - 10); f.yaw = 0; shock(f.pos.clone().setY(0.05), 0x7dffb0, 2.4); burst(f.pos.clone().setY(1.2), 0x7dffb0, 30, 4); } }, shot: () => [NM.x + 1.8, 2.1, NM.z + NM.hz - 7, NM.x, 1.4, NM.z + NM.hz - 10] },
  { who: 'finn', text: '马符已经是我的了！看着——', act: () => { const f = enemies.find(e => e.type === 'finn7'); if (f) { shock(f.pos.clone().setY(0.05), 0x7dffb0, 3); Foley.at('magic', f.pos, { vol: 0.7 }); } } },
  { who: 'narr', text: '（一圈绿光从芬恩脚下升起——他脸上的旧伤疤一下子消失了）' },
  { who: 'jackie', text: '……这东西能治青春痘吗？', to: 'finn' },
  { who: 'finn', text: '能治你被我打出来的伤！兄弟们，上！' },
  { who: 'uncleP', text: '成龙！看见绿圈就要打断他！用重击，或者反击！' },
  { who: 'uncleP', text: '不然你打多少，他就补多少！' },
];
const SPIRIT_INTRO = [
  { who: 'finn', text: '马符……怎么不灵了……', shot: () => { const d = enemies.find(e => e.type === 'finn7') || player; return [d.pos.x + 2.4, 1.7, d.pos.z + 2.2, d.pos.x, 0.9, d.pos.z]; } },
  { who: 'jackie', text: '马符，到手。', to: 'finn', act: () => { const p = player.pos; burst(p.clone().setY(1.2), 0x7dffb0, 40, 4); Foley.at('magic', p, { vol: 0.6 }); } },
  { who: 'chow', text: '别急着高兴，成龙。', act: () => Foley.at('ghost', player.pos, { vol: 0.6 }), shot: () => [player.pos.x + 2.6, 2.2, player.pos.z + 3, player.pos.x, 1.3, player.pos.z] },
  { who: 'narr', text: '（阿周从灯笼后面走出来，手里举着一枚刻着羊头的护身符）' },
  { who: 'chow', text: '羊符！出来吧——你的灵魂！', act: () => { const p = player.pos; shock(p.clone().setY(0.1), 0xe8e8ff, 3.5); burst(p.clone().setY(1.2), 0xe8e8ff, 60, 6); Foley.at('magic', p, { vol: 1 }); Foley.at('ghost', p, { vol: 0.8, rate: 0.8 }); shake = 0.4; } },
  { fade: () => Story.toSpirit() },
  { who: 'narr', text: '灵界', shot: () => [SPR.x + 6, 5, SPR.z + 9, SPR.x, 0.6, SPR.z] },
  { who: 'jackie', text: '那是……我？我怎么躺在那儿？！', to: 'narr', shot: () => [SPR.x + 2.6, 2, SPR.z + 3.4, SPR.x, 0.4, SPR.z] },
  { who: 'uncleP', text: '成龙！你的灵魂被羊符打出来了！快回到身体里去！' },
  { who: 'jackie', text: '老爹？你能听见我？', to: 'narr' },
  { who: 'uncleP', text: '老爹什么都知道！听着——那些游魂想占你的肉身！' },
  { who: 'narr', text: '（四周的黑暗里，飘出一团团紫色的影子）', act: () => Foley.at('ghost', player.pos, { vol: 0.7 }), shot: () => [SPR.x, 6, SPR.z + 12, SPR.x, 0.8, SPR.z] },
  { who: 'uncleP', text: '守住你的身体！它们吸干了灵魂之力，你就永远回不去了！' },
  { who: 'jackie', text: '我还没交房租呢！', to: 'narr' },
];
const DREAM_INTRO = [
  { who: 'narr', text: '（最后一团游魂散去，肉身的光圈亮了起来——可成龙还没来得及回去，整个灵界就开始扭曲）', act: () => { Foley.at('ghost', player.pos, { vol: 0.8, rate: 0.6 }); shake = 0.3; }, shot: () => [SPR.x + 4, 3.5, SPR.z + 6, SPR.x, 0.6, SPR.z] },
  { who: 'chow', text: '想回去？先来我的梦里坐坐！' },
  { fade: () => Story.toDream() },
  { who: 'narr', text: '梦魇', shot: () => [DRM.x + 7, 5, DRM.z + 9, DRM.x, 1.5, DRM.z] },
  { who: 'jackie', text: '黑白格子地板，漂浮的门，倒着走的钟……阿周，你的梦好奇怪。', to: 'narr', act: () => { spawnWave(26); const c = enemies.find(e => e.type === 'chow7'); if (c) { c.pos.set(DRM.x, 0, DRM.z - 6); c.yaw = 0; } }, shot: () => [DRM.x + 1.6, 2, DRM.z + DRM.r - 4, DRM.x, 1.4, DRM.z + DRM.r - 1] },
  { who: 'chow', text: '在梦里，我想变几个就变几个！', act: () => { const c = enemies.find(e => e.type === 'chow7'); if (c) { shock(c.pos.clone().setY(0.05), 0x7dffb0, 2.6); burst(c.pos.clone().setY(1.2), 0x7dffb0, 40, 5); } }, shot: () => [DRM.x + 1.6, 2.2, DRM.z - 2, DRM.x, 1.6, DRM.z - 6] },
  { who: 'uncleP', text: '成龙！梦里的东西一半是假的——打中假的会消散，找出真身！' },
  { who: 'uncleP', text: '天上要是睁开一只大眼睛，就闭上眼——按住格挡！' },
  { who: 'jackie', text: '在梦里闭眼……那不是睡得更死了？', to: 'narr' },
  { who: 'uncleP', text: '照做就是了！一定要！' },
];
const EP7_ENDING = [
  { who: 'narr', text: '（阿周跪倒在格子地板上，梦境像玻璃一样碎开）', act: () => { shake = 0.4; Foley.at('glass', player.pos, { vol: 0.8 }); }, shot: () => { const d = enemies.find(e => e.type === 'chow7') || player; return [d.pos.x + 2.6, 1.7, d.pos.z + 2.2, d.pos.x, 0.9, d.pos.z]; } },
  { who: 'chow', text: '这……这只是一场梦……对吧？' },
  { who: 'jackie', text: '对你来说，是噩梦。', to: 'chow' },
  { fade: () => Story.toMarket(true) },
  { who: 'narr', text: '唐人街夜市 · 午夜', shot: () => [player.pos.x + 2.4, 1.8, player.pos.z + 2.6, player.pos.x, 1.1, player.pos.z] },
  { who: 'jackie', text: '……我回来了？我回来了！手、脚、鼻子，都在！', to: 'narr', act: () => { const p = player.pos; burst(p.clone().setY(1.2), 0xe8e8ff, 50, 5); shock(p.clone().setY(0.1), 0x7dffb0, 3); Foley.at('magic', p, { vol: 0.8 }); } },
  { who: 'narr', text: '（羊符从阿周手里掉下来，滚到了成龙脚边。马符在另一只手里，暖暖地发着绿光）' },
  { who: 'jade', text: '成龙！我刚才梦见你被一只大眼睛追着跑！', act: () => { jade.place(player.pos.x - 2, player.pos.z + 2.4, 0); jade.mood = 'cheer'; } },
  { who: 'jackie', text: '小玉！你怎么在这儿？……等等，你也进了那个梦？', to: 'jade', act: () => jade.mood = null },
  { who: 'jade', text: '我吃鱼蛋吃睡着了。' },
  { who: 'vendor', text: '后生仔，我的摊子……谁来赔？' },
  { who: 'uncleP', text: '马符、羊符，一次两个！八个了，还有四个！' },
  { who: 'uncleP', text: '还有！摊子的钱，记黑手帮账上！' },
];
Object.assign(Story, {
  toMarket(after) { if (SOUL.form) spiritForm(false); SOUL.on = false; this.setArea('market'); this.putPlayer(NM.x, NM.z + NM.hz - 2.5, Math.PI); uncle.hide(); jade.hide(); if (!after) { furnReset('market'); Object.assign(MKT, { stage: 0, told: {} }); FURN.bill = 0; FURN.broke = 0; marketWeapons(); } },
  toSpirit() { this.setArea('spirit'); this.putPlayer(SPR.x, SPR.z + 3.5, Math.PI); uncle.hide(); jade.hide(); soulBody(); if (!SOUL.form) spiritForm(true); Object.assign(SOUL, { sp: 100, spawnQ: 14, t: 0, on: true, lost: false, drain: false, spawnT: 2, told: {} }); },
  toDream() { if (!SOUL.form) spiritForm(true); SOUL.on = false; this.setArea('dream'); this.putPlayer(DRM.x, DRM.z + DRM.r - 2.5, Math.PI); uncle.hide(); jade.hide(); Object.assign(DREAM, { eyeT: 0, eyeOn: false, told: {}, fakes: 0, stare: 0, shut: 0 }); },
  beginEp7(ch) {
    if (ch === 24) {
      this.setArea('shop'); this.putPlayer(SC.x + 0.4, SC.z - 1.6, Math.PI);
      uncle.place(SC.x, SC.z - 5.3, 0); jade.place(SC.x + 1.7, SC.z - 3.8, -0.6);
      this.play(EP7_PROLOGUE, () => startWave(24));
    } else if (ch === 25) { this.toMarket(); this.play(SPIRIT_INTRO, () => startWave(25)); }
    else { this.toSpirit(); SOUL.on = false; this.play(DREAM_INTRO, () => startWave(26)); }
  },
  onClearEp7(w, T) {
    if (w === 24) T(1.4, SPIRIT_INTRO, () => startWave(25));
    else if (w === 25) { SOUL.on = false; T(1.2, DREAM_INTRO, () => startWave(26)); }
    else T(2.6, EP7_ENDING, () => { try { localStorage.setItem('jc_horse2', '1'); localStorage.setItem('jc_sheep2', '1'); } catch (e) { } ep7RuneDesc(); Runes.award('horse', true); Runes.award('sheep', true); gameEnd(true, 7); });
  },
});
{
  const _b6 = Story.beginEp6.bind(Story), _c6 = Story.onClearEp6.bind(Story);
  Story.beginEp6 = function (ch) { if (ch >= 24) return this.beginEp7(ch); return _b6(ch); };
  Story.onClearEp6 = function (w, T) { if (w >= 24) return this.onClearEp7(w, T); return _c6(w, T); };
  try { if (localStorage.getItem('jc_clear6') === '1') saveProgress(24); } catch (e) { }
}
{
  const _pick = BGM.pick.bind(BGM);
  BGM.pick = function () {
    const r = _pick(); if (!started || MODE !== 'story') return r;
    const has = k => typeof BGM_DATA !== 'undefined' && BGM_DATA[k];
    const m = { market: 'market', spirit: 'spirit', dream: 'nightmare' }[AREA.name];
    return m && has(m) ? m : r;
  };
}
{
  const _rs = Menu.resetSession.bind(Menu);
  Menu.resetSession = function () {
    _rs(); if (SOUL.form) spiritForm(false); Object.assign(SOUL, { on: false, lost: false, spawnQ: 0, sp: 100 }); Object.assign(DREAM, { eyeOn: false, eyeT: 0 });
    (DREAM.handsL || []).forEach(H => scene.remove(H.g)); if (DREAM.handsL) DREAM.handsL.length = 0; GHOSTS.forEach(G => scene.remove(G.g)); GHOSTS.length = 0; MKT.stage = 0;
    const h = $('soulhud'); if (h) h.style.display = 'none'; $('hurt') && ($('hurt').style.boxShadow = '');
  };
}
{
  const _ge = gameEnd;
  gameEnd = function (win, ep = 1) {
    if (!(win && ep === 7)) return _ge(win, ep);
    gameOver = true;
    try { sessionStorage.removeItem('jc_ch'); localStorage.setItem('jc_clear', '1'); localStorage.setItem('jc_clear7', '1'); saveProgress(26); } catch (e) { }
    const mins = Math.floor(playTime / 60), secs = Math.floor(playTime % 60), sp = Math.max(0, SOUL.sp) | 0;
    clearTimeout(gameEndTimer);
    gameEndTimer = setTimeout(() => {
      document.exitPointerLock(); $('pause').classList.remove('show'); $('ov').style.display = 'flex';
      $('ov').querySelector('.box').innerHTML = `<h1>完</h1><h2>第七集 · 马与羊</h2><p>击倒敌人 ${kills} 名 · 肉身剩余灵魂之力 ${sp}% · 巨眼前闭眼 ${DREAM.shut || 0} 次 · 用时 ${mins} 分 ${secs} 秒</p><p>老爹：“马符、羊符，一次两个！”<br>“八个了……还有四个！”</p><p style="color:#7dffb0">马符觉醒！完美格挡、完美闪避各回复 6 生命</p><p style="color:#e8e8ff">羊符觉醒！完美闪避留下灵魂残影，1 秒后爆开（25 伤害）</p><p style="opacity:.75;font-size:13px">下一集：猴与兔——会把人变成猴子的马戏团，和快得看不见的瓦尔蒙</p><div class="obtns"><div class="go" data-a="ep8">开始第八集</div><div class="go alt" data-a="menu">返回主界面</div><div class="go alt" data-a="dojo">去练功房</div></div>`;
    }, 1500);
  };
  const _act = Menu.act.bind(Menu);
  Menu.act = function (a, b) { if (a === 'ep7') { this.resetSession(); this.start(() => Story.begin(24)); return; } return _act(a, b); };
}
Menu.refresh();
Object.assign(window.__ep7, { HORSE2, SHEEP2, GHOSTS, EP7_PROLOGUE, SPIRIT_INTRO, DREAM_INTRO, EP7_ENDING });
