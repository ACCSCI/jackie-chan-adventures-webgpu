// ================= HD 配音 + BGM + 音效（VibeHub 官方 CLI，数据：VO_DATA / BGM_DATA / SFX_DATA） =================
function b64ToAB(b) { const s = atob(b), u = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); return u.buffer; }
const AudioBus = {
  out: null, bgm: null, vo: null, sfx: null,
  init() {
    if (this.out || !AC) return;
    this.out = AC.createGain(); this.out.connect(AC.destination);
    this.bgm = AC.createGain(); this.bgm.gain.value = 0; this.bgm.connect(this.out);
    this.vo = AC.createGain(); this.vo.gain.value = 1.15; this.vo.connect(this.out);
    this.sfx = AC.createGain(); this.sfx.gain.value = 0.8; this.sfx.connect(this.out);
  },
};
// 短音效提前解码；战斗调用同步播放，不等网络或解码。未就绪时沿用合成器音效。
const SFX = {
  cache: {}, pending: {}, active: [], last: {}, plays: 0,
  get ok() { return typeof SFX_DATA !== 'undefined'; },
  prefetch() {
    if (!AC || !this.ok) return;
    for (const k of Object.keys(SFX_DATA)) if (!this.pending[k]) {
      this.pending[k] = AC.decodeAudioData(b64ToAB(SFX_DATA[k])).then(b => this.cache[k] = b).catch(() => null);
    }
  },
  play(k) {
    if (!AC || !this.cache[k]) return false;
    const t = AC.currentTime;
    if (t - (this.last[k] ?? -99) < 0.045) return true;
    this.last[k] = t; AudioBus.init();
    if (this.active.length >= 12) { const old = this.active.shift(); try { old.stop(); } catch (e) {} }
    const s = AC.createBufferSource(); s.buffer = this.cache[k];
    s.playbackRate.value = 0.96 + Math.random() * 0.08; s.connect(AudioBus.sfx);
    s.onended = () => { const i = this.active.indexOf(s); if (i >= 0) this.active.splice(i, 1); };
    this.active.push(s); s.start(); this.plays++; return true;
  },
  stop() { for (const s of this.active) { try { s.stop(); } catch (e) {} } this.active.length = 0; this.last = {}; },
};
{
  const synthesizedSfx = sfx;
  sfx = function (type) { if (!SFX.play(type)) synthesizedSfx(type); };
}
const Voice = {
  on: SETTINGS.voice !== false, cache: {}, cur: null, tok: 0,
  has(who, txt) { return !!VO_DATA[who + '|' + txt]; },
  get(key) { if (!this.cache[key]) this.cache[key] = AC.decodeAudioData(b64ToAB(VO_DATA[key])); return this.cache[key]; },
  prefetch(lines) { if (!AC) return; for (const L of lines || []) { if (!L.who || typeof L.text !== 'string') continue; const k = L.who + '|' + L.text; if (VO_DATA[k]) this.get(k).catch(() => { }); } },
  play(who, txt, bark) {
    if (!AC || !this.on) return; const key = who + '|' + txt; if (!VO_DATA[key]) return;
    if (bark && this.cur && !this.cur.bark) return; // 不打断剧情对白
    this.stop(); AudioBus.init(); const tok = ++this.tok;
    this.get(key).then(buf => {
      if (tok !== this.tok) return;
      const s = AC.createBufferSource(); s.buffer = buf; s.connect(AudioBus.vo); s.start(); s.bark = bark; this.cur = s; BGM.duck = 1;
      s.onended = () => { if (this.cur === s) { this.cur = null; BGM.duck = 0; } };
    }).catch(() => { });
  },
  stop() { this.tok++; if (this.cur) { try { this.cur.stop(); } catch (e) { } this.cur = null; } BGM.duck = 0; },
};
const BGM = {
  cache: {}, name: null, cur: null, want: null, wantT: 0, duck: 0, vol: 0.5,
  get ok() { return typeof BGM_DATA !== 'undefined' && Object.keys(BGM_DATA).length > 0; },
  get(n) { if (!this.cache[n]) this.cache[n] = AC.decodeAudioData(b64ToAB(BGM_DATA[n])); return this.cache[n]; },
  pick() {
    if (!started) return 'menu';
    if (MODE === 'dojo') return 'calm';
    const fight = !cutscene && !gameOver && enemies.some(e => !e.dead && e.type !== 'dummy');
    if (fight) return WAVES[wave] && WAVES[wave].boss ? 'boss' : 'battle';
    if (gameOver) return this.name || 'calm';
    return AREA.name === 'temple' ? 'temple' : 'calm';
  },
  switchTo(n) {
    if (!BGM_DATA[n] || n === this.name) return; this.name = n; AudioBus.init();
    const t = AC.currentTime, old = this.cur;
    if (old) { old.g.gain.cancelScheduledValues(t); old.g.gain.setValueAtTime(old.g.gain.value, t); old.g.gain.linearRampToValueAtTime(0, t + 1.6); setTimeout(() => { try { old.s.stop(); } catch (e) { } }, 1800); }
    this.cur = null;
    this.get(n).then(buf => {
      if (this.name !== n) return;
      const s = AC.createBufferSource(), g = AC.createGain(); s.buffer = buf; s.loop = true; s.connect(g); g.connect(AudioBus.bgm);
      const t2 = AC.currentTime; g.gain.setValueAtTime(0, t2); g.gain.linearRampToValueAtTime(1, t2 + 1.4);
      s.start(0, n === 'menu' || !old ? 0 : Math.random() * Math.min(40, buf.duration * 0.3)); this.cur = { s, g };
    }).catch(() => { });
  },
  update(dt) {
    if (!AC || !this.ok) return; AudioBus.init();
    const on = Music.on && !Music.custom;
    const target = on ? this.vol * (this.duck ? 0.45 : 1) : 0;
    AudioBus.bgm.gain.setTargetAtTime(target, AC.currentTime, 0.25);
    const p = this.pick();
    if (p !== this.want) { this.want = p; this.wantT = 0; }
    this.wantT += dt;
    if (p !== this.name && (this.wantT > 1.2 || !this.name || p === 'boss')) this.switchTo(p);
  },
};
// 有生成的 BGM 时，不再启动合成器配乐（自定义音乐仍可用）
{
  const _start = Music.start.bind(Music);
  Music.start = function () { if (!AC) return; this.init(); if (BGM.ok && !this.custom) return; _start(); };
  const _load = Music.loadFile.bind(Music);
  Music.loadFile = function (f) { _load(f); };
}
// 剧情对白与喊话配音
{
  const _adv = Story.advance.bind(Story), _play = Story.play.bind(Story), _bark = Story.bark.bind(Story), _end = Story.end.bind(Story);
  Story.play = function (lines, done) { Voice.prefetch(lines); _play(lines, done); };
  Story.advance = function () {
    Voice.stop(); _adv();
    const L = this.lines && this.lines[this.i];
    if (L && L.who && !L.fade && !L.wait) Voice.play(L.who, this.text(L));
  };
  Story.end = function () { Voice.stop(); _end(); };
  Story.bark = function (who, txt) { _bark(who, txt); Voice.play(who, txt, true); };
}
// 主菜单：第一次点击 / 按键就开始放菜单音乐
{
  const kick = () => { initAudio(); if (AC && AC.state === 'suspended') AC.resume(); AudioBus.init(); SFX.prefetch(); };
  document.addEventListener('pointerdown', kick, { capture: true }); document.addEventListener('keydown', kick, { capture: true });
}
