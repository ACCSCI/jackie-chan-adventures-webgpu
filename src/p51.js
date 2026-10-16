// ================= 分层打击音效（CC0：Kenney Impact Sounds + qubodup Punch，见 WEB_SFX） =================
// 每次命中按「招式轻重 / 器械材质 / 反击 / 击杀 / 霸体」叠加 2–4 层：肉击样本 + 材质样本 + 合成低频冲击，
// 每层随机变体、微调音高、按屏幕位置声像，避免连击时“同一个声音”。
const Impact = {
  buf: {}, last: {}, active: [], n: 0,
  get ok() { return typeof WEB_SFX !== 'undefined'; },
  get want() { return this.ok ? Object.fromEntries(Object.entries(WEB_SFX).map(([k, v]) => [k, v.length])) : {}; },
  prefetch() {
    if (!AC || !this.ok) return;
    for (const k in WEB_SFX) {
      if (this.buf[k]) continue; this.buf[k] = [];
      WEB_SFX[k].forEach((b, i) => AC.decodeAudioData(b64ToAB(b)).then(x => this.buf[k][i] = x).catch(() => { }));
    }
  },
  ready(k) { return !!(this.buf[k] && this.buf[k].some(Boolean)); },
  pick(k) {
    const a = this.buf[k]; if (!a) return null;
    const idx = []; a.forEach((b, i) => b && idx.push(i)); if (!idx.length) return null;
    let i = idx[(Math.random() * idx.length) | 0];
    if (idx.length > 1 && i === this.last[k]) i = idx[(idx.indexOf(i) + 1 + ((Math.random() * (idx.length - 1)) | 0)) % idx.length];
    this.last[k] = i; return a[i];
  },
  track(s) {
    this.active.push(s); s.onended = () => { const i = this.active.indexOf(s); if (i >= 0) this.active.splice(i, 1); };
    if (this.active.length > 24) { const o = this.active.shift(); try { o.stop(); } catch (e) { } }
  },
  bus() { // 叠层后统一过一道压限，避免多层同时 0dB 爆音
    if (!this._bus) { const c = AC.createDynamicsCompressor(); c.threshold.value = -10; c.knee.value = 6; c.ratio.value = 8; c.attack.value = 0.002; c.release.value = 0.12; const g = AC.createGain(); g.gain.value = 0.9; c.connect(g); g.connect(AudioBus.sfx); this._bus = c; }
    return this._bus;
  },
  out(pan, vol, lp) {
    let g = AC.createGain(); g.gain.value = vol; let head = g;
    if (lp) { const f = AC.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = lp; f.connect(g); head = f; }
    if (AC.createStereoPanner) { const p = AC.createStereoPanner(); p.pan.value = pan || 0; g.connect(p); p.connect(this.bus()); } else g.connect(this.bus());
    return head;
  },
  layer(k, o = {}) {
    if (!AC) return false; AudioBus.init();
    const b = this.pick(k); if (!b) return false;
    const s = AC.createBufferSource(); s.buffer = b;
    s.playbackRate.value = (o.rate || 1) * (0.94 + Math.random() * 0.12);
    s.connect(this.out(o.pan, o.vol ?? 1, o.lp)); s.start(AC.currentTime + (o.delay || 0)); this.track(s); this.n++; return true;
  },
  // 合成低频“砰”：给拳脚补上样本里缺的胸腔感
  thump(f0, f1, dur, vol, pan) {
    if (!AC) return; AudioBus.init();
    const t = AC.currentTime, o = AC.createOscillator(), g = AC.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(this.out(pan, 1)); o.start(t); o.stop(t + dur + 0.02); this.track(o);
  },
  pan(pos) {
    if (!pos || typeof camera === 'undefined') return 0;
    const v = pos.clone().project(camera); return Math.max(-0.75, Math.min(0.75, v.x * 0.6));
  },
};
const MAT = { stick: 'wood', umbrella: 'wood', broom: 'wood', dojo: 'wood', pan: 'metal', iron: 'metal', sword: 'metal', bottle: 'glass', katana: 'blade', duster: 'soft' };
function impact(kind, o = {}) {
  const I = Impact, P = I.pan(o.pos), L = (k, x = {}) => I.layer(k, Object.assign({ pan: P }, x));
  switch (kind) {
    case 'hit': {
      const H = o.heavy, mat = o.mat;
      let ok;
      if (o.armor) { // 打在铁臂这类霸体身上：闷、短、不爽快——提示该用重击
        ok = L('body', { vol: 0.9, lp: 900, rate: 0.85 }); L('punchL', { vol: 0.35, rate: 0.8 }); I.thump(90, 50, 0.08, 0.25, P);
      } else if (mat === 'wood') {
        ok = L(H ? 'woodH' : 'wood', { vol: 1 }); L('punchL', { vol: 0.45, delay: 0.006 }); I.thump(H ? 120 : 160, 50, H ? 0.14 : 0.08, H ? 0.5 : 0.3, P);
      } else if (mat === 'metal') {
        ok = L(H ? 'metalH' : 'metal', { vol: 0.9 }); L('punchL', { vol: 0.4, delay: 0.006 }); I.thump(130, 50, 0.1, 0.35, P);
      } else if (mat === 'glass') {
        ok = L('plate', { vol: 0.7, rate: 1.3 }); L('punchL', { vol: 0.6 });
      } else if (mat === 'blade' || mat === 'metal' && o.sword) {
        ok = L('metal', { vol: 0.35, rate: 1.45 }); L('swordSw', { vol: .3, rate: 1.4 }); L(H ? 'punchH' : 'punchL', { vol: 0.75 }); I.thump(150, 60, 0.07, 0.25, P);
      } else if (mat === 'soft') {
        ok = L('punchL', { vol: 0.45, rate: 1.3, lp: 3500 });
      } else if (H) {
        ok = L('punchH', { vol: 1 }); L('body', { vol: 0.55, delay: 0.012, lp: 1800 }); I.thump(115, 40, 0.17, 0.6, P);
      } else {
        ok = L('punchL', { vol: 0.95 }); I.thump(150, 55, 0.08, 0.32, P);
      }
      if (!ok) { sfx(o.fallback || (H ? 'heavy' : 'hit')); return; }
      if (o.counter) { L('punchH', { vol: 0.8, rate: 0.82, delay: 0.01 }); L('plate', { vol: 0.25, rate: 0.7 }); I.thump(95, 35, 0.22, 0.75, P); }
      if (o.kill) { L('body', { vol: 0.75, rate: 0.78, delay: 0.035 }); I.thump(85, 32, 0.26, 0.7, P); }
      break;
    }
    case 'fall': // 被打倒落地
      if (!L('body', { vol: o.big ? 1 : 0.75, rate: o.big ? 0.75 : 0.9, lp: 1600 })) return;
      L('step', { vol: 0.5, rate: 0.8 }); I.thump(75, 32, o.big ? 0.3 : 0.2, o.big ? 0.6 : 0.4, P); break;
    case 'block':
      if (!L('plate', { vol: 0.65, rate: 0.9 })) { sfx('block'); return; }
      L('punchL', { vol: 0.45, rate: 0.85, lp: 2200 }); I.thump(120, 60, 0.06, 0.25, P); break;
    case 'parry':
      if (!L('metalH', { vol: 1 })) { sfx('clang'); return; }
      L('clash', { vol: .55, rate: 1.1 });
      L('bell', { vol: 0.32, rate: 1.15, delay: 0.01 }); I.thump(140, 45, 0.12, 0.4, P); break;
    case 'hurt':
      sfx('hurt'); L(o.heavy ? 'punchH' : 'punchL', { vol: 0.8, rate: 0.9 }); I.thump(100, 40, 0.14, 0.45, P); break;
    case 'glass':
      if (!L('glass', { vol: 1 })) { sfx('clang'); return; }
      L('plate', { vol: 0.3, rate: 1.2 }); break;
    case 'break': // 武器坏掉
      if (o.mat === 'glass') return impact('glass', o);
      if (!L(o.mat === 'metal' ? 'metalH' : 'woodH', { vol: 1, rate: 0.85 })) { sfx('clang'); return; }
      L('wood', { vol: 0.5, rate: 1.3, delay: 0.05 }); break;
  }
}
{ const _pf = SFX.prefetch.bind(SFX); SFX.prefetch = function () { _pf(); Impact.prefetch(); }; }
{ const _st = SFX.stop.bind(SFX); SFX.stop = function () { _st(); for (const s of Impact.active) { try { s.stop(); } catch (e) { } } Impact.active.length = 0; }; }
// ================= 第二批 CC0 拟音：挥空 / 刀剑 / 布料 / 脚步 / 生物 / 科幻（WEB_SFX2） =================
if (typeof WEB_SFX2 !== 'undefined') Object.assign(WEB_SFX, WEB_SFX2);
const Foley = {
  L(k, o) { return Impact.layer(k, o || {}); },
  // 徒手出招：挥空声对准第一个命中帧前一点点，而不是按键瞬间
  swing(m) {
    if (m.staff || m.blade) return true; // 器械由棍梢/刃尖速度驱动 staffSwish
    const p = player, dur = m.dur / Math.max(.3, moveSpeed()), lead = Math.max(0, (m.hits?.[0] ?? .3) * dur - (m.heavy ? .16 : .1));
    const k = m.heavy ? 'swishH' : m.wpn ? 'swishL' : 'swishS';
    const ok = this.L(k, { vol: m.heavy ? .75 : .55, rate: m.heavy ? .85 : 1.05, delay: lead, pan: 0 });
    if (m.heavy || m.spin360) this.L('cloth', { vol: .35, rate: 1.1 });
    return ok;
  },
  dodge(air) { const a = this.L('swishH', { vol: .6, rate: air ? .9 : .75 }); this.L('cloth', { vol: .5 }); return a; },
  jump(second) { this.L('cloth', { vol: .35, rate: second ? 1.2 : 1 }); if (second) this.L('swishH', { vol: .45, rate: 1.15 }); },
  land(hard) { this.L('foot', { vol: hard ? .7 : .4, rate: .85 }); if (hard) Impact.thump(80, 40, .12, .3, 0); },
  step(v) { this.L('foot', { vol: clamp(.08 + v * .035, .1, .3), rate: .95 + Math.random() * .1, lp: v > 5 ? 0 : 3200 }); },
  at(k, pos, o = {}) { return Impact.layer(k, Object.assign({ pan: Impact.pan(pos) }, o)); },
};
{ // 通用 whoosh 改用真实挥空样本（未解码时回退到原合成/生成音效）
  const prevSfx = sfx;
  sfx = function (type) { if (type === 'whoosh' && Foley.L('swishL', { vol: .6 })) return; prevSfx(type); };
}
