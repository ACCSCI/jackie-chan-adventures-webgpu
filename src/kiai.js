// ================= 发力喊声 / 受击闷哼（“啊打！”“呀！”）=================
// 主角：重击、收招、反击、空中下劈、蓄力满段必喊，轻击偶尔喊；敌人：出手前和受击时按体型/身份选声，全局限流避免吵。
const Kiai = {
  on: SETTINGS.kiai !== false, lastP: -9, lastE: -9, lastH: -9, lightN: 0,
  t() { return AC ? AC.currentTime : 0; },
  say(k, o = {}) { if (!this.on || !AC || cutscene) return false; return Impact.layer(k, Object.assign({ vol: .85, pan: 0 }, o)); },
  player(m) {
    if (!m || !this.on) return; const t = this.t(); if (t - this.lastP < .55) return;
    const big = m.heavy || m.finisher || m.slam || m === MOVES.counter || m === MOVES.push || (m.hits && m.hits.length >= 3);
    if (!big) { this.lightN++; if (this.lightN % 3 !== 0 || Math.random() > .55) return; }
    this.lastP = t; this.lightN = 0;
    const dur = m.dur / Math.max(.3, moveSpeed()), lead = Math.max(0, (m.hits?.[0] ?? .3) * dur - .14);
    const long = (m.finisher || m.slam || m === MOVES.counter) && Math.random() < .6;
    this.say(long ? 'kJL' : 'kJ', { vol: big ? .9 : .7, rate: .97 + Math.random() * .08, delay: Math.min(lead, .25) });
  },
  hurt(heavy) { const t = this.t(); if (t - this.lastH < 1.1 || Math.random() > (heavy ? .85 : .45)) return; this.lastH = t; this.say('kJh', { vol: .75, rate: .95 + Math.random() * .1 }); },
  effort() { const t = this.t(); if (t - this.lastP < .8 || Math.random() > .3) return; this.lastP = t; this.say('kJe', { vol: .55 }); },
  voiceOf(e) {
    const ty = e.type || '';
    if (/^(rat|lion|drone|t13|terra|terraG|dummy)$/.test(ty) || e.T?.clay) return null;
    if (ty === 'darkj') return { atk: 'kJ', hurt: 'kJh', rate: .8 };
    if (/ninja|shade/.test(ty)) return { atk: 'kN', hurt: 'kTh', rate: ty === 'shade' ? .85 : 1.05 };
    if ((e.scale || 1) >= 1.25 || /tohru|brute|boss/.test(ty)) return { atk: 'kB', hurt: 'kBh', rate: .95 };
    return { atk: 'kT', hurt: 'kTh', rate: .95 + ((e.id || ty.length) % 5) * .03 };
  },
  enemy(e, kind) {
    if (!this.on || !e || e.hidden) return; const v = this.voiceOf(e); if (!v) return;
    const t = this.t(), boss = !!(e.T?.elite || e.T?.beast && (e.scale || 1) > 1.2);
    if (t - this.lastE < (kind === 'die' ? .3 : .7)) return;
    const pr = kind === 'atk' ? (boss ? .55 : .3) : kind === 'die' ? .8 : (boss ? .3 : .35); if (Math.random() > pr) return;
    this.lastE = t; this.say(kind === 'atk' ? v.atk : v.hurt, { vol: kind === 'atk' ? .6 : .65, rate: v.rate * (.97 + Math.random() * .06), pan: Impact.pan(e.pos), lp: v.rate < .9 ? 3600 : 0 });
  },
};
{ // 主角
  const _sm = startMove; startMove = function (m) { const r = _sm.apply(this, arguments); if (r && player.move === m) Kiai.player(m); return r; };
  const _pt = playerTakeHit; playerTakeHit = function (e, dmg, opts = {}) { const hp = player.hp; const r = _pt.apply(this, arguments); if (player.hp < hp) Kiai.hurt(!!opts.kd || hp - player.hp >= 15); return r; };
  const _d = Foley.dodge.bind(Foley); Foley.dodge = function (air) { Kiai.effort(); return _d(air); };
}
{ // 敌人：普通敌人在 setState('attack')，Beast 在进入任何出手状态时
  const _es = Enemy.prototype.setState; Enemy.prototype.setState = function (s, b) { if (s === 'attack' && this.state !== 'attack') Kiai.enemy(this, 'atk'); return _es.call(this, s, b); };
  const ATK = /^(swipe|stomp|grab|cwind|combo|attack|slam|lunge|throw|spin|smash|wind|cast)$/;
  const _bs = Beast.prototype.setState; Beast.prototype.setState = function (s, b) { if (ATK.test(s) && this.state !== s) Kiai.enemy(this, 'atk'); return _bs.call(this, s, b); };
  for (const C of [Enemy, Beast]) {
    const _th = C.prototype.takeHit; C.prototype.takeHit = function () { const was = this.dead; const r = _th.apply(this, arguments); if (!was) Kiai.enemy(this, this.dead ? 'die' : 'hurt'); return r; };
  }
}
