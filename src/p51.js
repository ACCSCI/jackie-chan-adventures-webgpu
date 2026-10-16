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
  out(pan, vol, lp, hp) {
    let g = AC.createGain(); g.gain.value = vol; let head = g;
    if (lp) { const f = AC.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = lp; f.connect(head); head = f; }
    if (hp) { const f = AC.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = hp; f.connect(head); head = f; }
    if (AC.createStereoPanner) { const p = AC.createStereoPanner(); p.pan.value = pan || 0; g.connect(p); p.connect(this.bus()); } else g.connect(this.bus());
    return head;
  },
  layer(k, o = {}) {
    if (!AC) return false; AudioBus.init();
    const b = this.pick(k); if (!b) return false;
    const s = AC.createBufferSource(); s.buffer = b;
    s.playbackRate.value = (o.rate || 1) * (0.94 + Math.random() * 0.12);
    s.connect(this.out(o.pan, o.vol ?? 1, o.lp, o.hp)); s.start(AC.currentTime + (o.delay || 0)); this.track(s); this.n++; return true;
  },
  // 低频冲击：用真实低音冲击样本（Mixkit bass hit / stomp）代替合成正弦“咚”，音高按原参数映射
  thump(f0, f1, dur, vol, pan) {
    if (!AC) return; this.layer('sub', { rate: clamp(f0 / 110, .8, 1.35), vol: Math.min(.7, vol * .65), lp: 1600, pan });
  },
  pan(pos) {
    if (!pos || typeof camera === 'undefined') return 0;
    const v = pos.clone().project(camera); return Math.max(-0.75, Math.min(0.75, v.x * 0.6));
  },
};
const MAT = { stick: 'wood', umbrella: 'wood', broom: 'wood', dojo: 'wood', pan: 'metal', iron: 'metal', sword: 'blade', bottle: 'glass', katana: 'blade', duster: 'soft' };
function impact(kind, o = {}) {
  const I = Impact, P = I.pan(o.pos), L = (k, x = {}) => I.layer(k, Object.assign({ pan: P }, x));
  switch (kind) {
    case 'hit': {
      const H = o.heavy, mat = o.mat, HQ = I.ready('hqL');
      let ok;
      if (o.armor) { // 打在铁臂这类霸体身上：闷、短、不爽快——提示该用重击
        ok = L('body', { vol: 0.9, lp: 900, rate: 0.85 }); L(HQ ? 'hqL' : 'punchL', { vol: 0.35, rate: 0.8, lp: 2500 }); I.thump(90, 50, 0.08, 0.25, P);
      } else if (mat === 'wood') {
        ok = HQ && L('hqStaff', { vol: H ? 1 : 0.85, rate: H ? 0.9 : 1 }); const wk = L(H ? 'woodH' : 'wood', { vol: HQ ? 0.4 : 1, lp: 6000 }); ok = ok || wk;
        L(HQ ? 'hqL' : 'punchL', { vol: 0.45, delay: 0.006 }); if (H) I.thump(110, 50, 0.14, 0.5, P);
      } else if (mat === 'metal') { // 平底锅 / 铁棍：钝器闷响 + 短金属擦击，不再用会“叮——”的金属板样本
        ok = L(HQ ? 'hqStaff' : 'woodH', { vol: 0.9, rate: 0.78, lp: 5000 }); L('clangS', { vol: H ? 0.4 : 0.3, rate: 0.9, lp: 4200, delay: 0.004 });
        L(HQ ? (H ? 'hqH' : 'hqL') : 'punchL', { vol: 0.55, delay: 0.006 }); I.thump(H ? 100 : 130, 50, 0.1, H ? 0.5 : 0.3, P);
      } else if (mat === 'glass') {
        ok = L('lamp', { vol: 0.7, rate: 1.2 }) || L('glass', { vol: 0.7 }); L(HQ ? 'hqL' : 'punchL', { vol: 0.6 });
      } else if (mat === 'blade') { // 古剑 / 武士刀：真实刀剑砍中声为主，肉击只做底
        ok = L(H ? 'slashH' : 'slashL', { vol: H ? 1 : 0.9, rate: H ? 0.94 : 1.03 }) || L('hqBlade', { vol: 0.95, rate: H ? 0.92 : 1.04 });
        L(H ? 'hqH' : 'hqL', { vol: H ? 0.38 : 0.26, delay: 0.006 }); if (H) I.thump(105, 45, 0.14, 0.45, P);
      } else if (mat === 'soft') {
        ok = L(HQ ? 'hqL' : 'punchL', { vol: 0.45, rate: 1.3, lp: 3500 });
      } else if (HQ) { // 徒手：高质量肉击为主层，Kenney 样本只做质感，低频冲击样本补胸腔
        ok = L(o.kick ? 'hqK' : H ? 'hqH' : 'hqL', { vol: 1, rate: o.kick ? 0.97 : 1 });
        if (H) { L('body', { vol: 0.22, delay: 0.012, lp: 2400 }); I.thump(110, 40, 0.18, 0.45, P); }
        else L('punchL', { vol: 0.22, lp: 5000 });
      } else if (H) {
        ok = L('punchH', { vol: 1 }); L('body', { vol: 0.55, delay: 0.012, lp: 1800 }); I.thump(115, 40, 0.17, 0.6, P);
      } else {
        ok = L('punchL', { vol: 0.95 });
      }
      if (!ok) { sfx(o.fallback === 'clang' ? 'hit' : o.fallback || (H ? 'heavy' : 'hit')); return; }
      if (!o.armor && mat !== 'soft') L('hqL', { vol: H ? 0.42 : 0.34, rate: 1.32 + Math.random() * .1, hp: 2200 }); // 清脆的高频“啪”：让打击脆而不闷
      if (o.counter) { if (!L('hqCrit', { vol: 0.6, lp: 7000 })) L('punchH', { vol: 0.8, rate: 0.82, delay: 0.01 }); I.thump(95, 35, 0.22, 0.7, P); }
      if (o.kill) { if (!L('hqH', { vol: 0.5, rate: 0.8, delay: 0.03 })) L('body', { vol: 0.75, rate: 0.78, delay: 0.035 }); I.thump(85, 32, 0.26, 0.6, P); }
      break;
    }
    case 'fall': // 被打倒落地
      if (!L('hqFall', { vol: o.big ? 1 : 0.8, rate: o.big ? 0.85 : 1 }) && !L('bodyFall', { vol: 0.8 }) && !L('body', { vol: o.big ? 1 : 0.75, rate: o.big ? 0.75 : 0.9, lp: 1600 })) return;
      L('step', { vol: 0.35, rate: 0.8 }); if (o.big) I.thump(75, 32, 0.3, 0.55, P); break;
    case 'block':
      if (L('hqBlock', { vol: 0.9 })) { I.thump(120, 60, 0.06, 0.2, P); break; }
      if (!L('punchL', { vol: 0.5, rate: 0.85, lp: 2200 })) { sfx('block'); return; }
      break;
    case 'parry':
      if (!L('hqParry', { vol: 0.8 }) && !L('clangS', { vol: 0.9 })) { sfx('block'); return; }
      L('hqBlock', { vol: 0.55 }); L('clangS', { vol: .28, rate: 1.1, lp: 5000 }); I.thump(140, 45, 0.12, 0.35, P); break;
    case 'hurt':
      if (!L(o.heavy ? 'hqH' : 'hqL', { vol: 0.75, rate: 0.9, lp: 3000 })) L(o.heavy ? 'punchH' : 'punchL', { vol: 0.8, rate: 0.9 });
      I.thump(100, 40, 0.14, o.heavy ? 0.45 : 0.25, P); break;
    case 'glass':
      if (!L('lamp', { vol: 0.9 }) && !L('glass', { vol: 1 })) return;
      break;
    case 'break': // 武器坏掉
      if (o.mat === 'glass') return impact('glass', o);
      if (!L(o.mat === 'metal' ? 'junk' : 'woodBrk', { vol: 0.9 }) && !L('woodH', { vol: 1, rate: 0.85 })) return;
      break;
  }
}
{ const _pf = SFX.prefetch.bind(SFX); SFX.prefetch = function () { _pf(); Impact.prefetch(); }; }
{ const _st = SFX.stop.bind(SFX); SFX.stop = function () { _st(); for (const s of Impact.active) { try { s.stop(); } catch (e) { } } Impact.active.length = 0; }; }
// ================= 第二批 CC0 拟音：挥空 / 刀剑 / 布料 / 脚步 / 生物 / 科幻（WEB_SFX2） =================
if (typeof WEB_SFX2 !== 'undefined') Object.assign(WEB_SFX, WEB_SFX2);
if (typeof WEB_SFX3 !== 'undefined') Object.assign(WEB_SFX, WEB_SFX3);
if (typeof WEB_SFX4 !== 'undefined') Object.assign(WEB_SFX, WEB_SFX4);
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
{ // 通用打击/过场音效全部走 HQ 样本，不再落到合成振荡器（“叮叮咚咚”）
  const prevSfx = sfx, L = (k, o) => Impact.layer(k, Object.assign({ pan: 0 }, o || {}));
  const MAP = {
    hit: () => L('hqL', { vol: .85 }),
    heavy: () => { const a = L('boom', { vol: .75 }); Impact.thump(100, 40, .2, .55, 0); return a; },
    block: () => L('hqBlock', { vol: .8 }),
    clang: () => { const a = L('clangS', { vol: .75, rate: .95 }); L('boom', { vol: .35, rate: 1.2 }); return a; },
    hurt: () => L('hqL', { vol: .7, rate: .9, lp: 3000 }),
  };
  sfx = function (type) { if (MAP[type] && MAP[type]()) return; prevSfx(type); };
}
