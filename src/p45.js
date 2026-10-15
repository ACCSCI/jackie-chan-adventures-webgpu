// ================= 背景音乐：原创功夫风合成 BGM + 支持载入自己的音乐 =================
const Music = {
  on: true, custom: null, started: false, step: 0, nextT: 0, bpm: 128, intensity: 0.5, timer: null, out: null,
  // D 宫五声音阶
  pent: [62, 64, 66, 69, 71, 74, 76, 78, 81, 83, 86],
  mel: {
    A: [5, -2, 4, 5, 7, -2, 5, 4, 3, -2, 4, 3, 2, -2, 0, -2],
    B: [3, 4, 5, -2, 5, 7, 8, 7, 5, -2, 4, -2, 5, -2, -2, -1],
    C: [7, 8, 7, 5, 4, 5, 4, 3, 2, 3, 2, 0, 1, -2, 0, -1],
    D: [0, -2, 2, 3, 5, -2, 4, 3, 4, -2, 5, -2, 7, -2, -2, -1],
    E: [8, -2, 9, 8, 7, 5, 7, -2, 8, 7, 5, 4, 5, -2, -2, -1],
  },
  form: ['A', 'B', 'A', 'C', 'D', 'B', 'E', 'C'],
  // 每两小节一个和弦根音（D, Bm, G, A 循环）
  roots: [38, 35, 43, 45], chords: [[62, 66, 69], [59, 62, 66], [55, 59, 62], [57, 61, 64]],
  init() {
    if (this.out || !AC) return;
    const comp = AC.createDynamicsCompressor(); comp.threshold.value = -18; comp.ratio.value = 4;
    this.out = AC.createGain(); this.out.gain.value = 0.32; this.out.connect(comp); comp.connect(AC.destination);
    this.verb = AC.createDelay(); this.verb.delayTime.value = 0.23; const fb = AC.createGain(); fb.gain.value = 0.28; const vf = AC.createBiquadFilter(); vf.type = 'lowpass'; vf.frequency.value = 2200;
    this.verb.connect(vf); vf.connect(fb); fb.connect(this.verb); vf.connect(this.out);
  },
  start() {
    if (!AC) return; this.init();
    if (this.custom) { this.custom.play().catch(() => {}); return; }
    if (this.timer) return;
    this.nextT = AC.currentTime + 0.1; this.step = 0;
    this.timer = setInterval(() => this.schedule(), 25);
  },
  stopSynth() { clearInterval(this.timer); this.timer = null; },
  toggle() {
    this.on = !this.on;
    if (this.custom) { this.custom.muted = !this.on; }
    if (this.out) this.out.gain.setTargetAtTime(this.on ? 0.32 : 0, AC.currentTime, 0.1);
    tip(this.on ? '音乐：开' : '音乐：关', 1); refreshMusicChip();
  },
  loadFile(file) {
    const url = URL.createObjectURL(file);
    if (this.custom) { this.custom.pause(); URL.revokeObjectURL(this.custom.src); }
    const a = new Audio(url); a.loop = true; a.volume = 0.55; a.muted = !this.on; this.custom = a; this.customName = file.name;
    this.stopSynth(); if (AC) a.play().catch(() => {});
    refreshMusicChip();
  },
  hz: m => 440 * Math.pow(2, (m - 69) / 12),
  env(g, t, a, peak, d) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + d); },
  // —— 乐器 ——
  lead(t, m, len) { // 类二胡：锯齿波 + 颤音 + 滑音
    const o = AC.createOscillator(), f = AC.createBiquadFilter(), g = AC.createGain(), lfo = AC.createOscillator(), lg = AC.createGain();
    o.type = 'sawtooth'; o.frequency.setValueAtTime(this.hz(m - 1), t); o.frequency.exponentialRampToValueAtTime(this.hz(m), t + 0.05);
    lfo.frequency.value = 5.5; lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(this.hz(m) * 0.012, t + len * 0.6); lfo.connect(lg); lg.connect(o.frequency);
    f.type = 'lowpass'; f.frequency.value = 2400; f.Q.value = 3;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.16, t + 0.03); g.gain.setValueAtTime(0.13, t + len * 0.7); g.gain.exponentialRampToValueAtTime(0.0001, t + len + 0.08);
    o.connect(f); f.connect(g); g.connect(this.out); g.connect(this.verb);
    o.start(t); lfo.start(t); o.stop(t + len + 0.1); lfo.stop(t + len + 0.1);
  },
  pluck(t, m, v = 0.09) { // 类琵琶：三角波快速衰减
    const o = AC.createOscillator(), o2 = AC.createOscillator(), g = AC.createGain();
    o.type = 'triangle'; o2.type = 'square'; o.frequency.value = o2.frequency.value = this.hz(m); o2.detune.value = 1200;
    const g2 = AC.createGain(); g2.gain.value = 0.15; o2.connect(g2); g2.connect(g);
    this.env(g, t, 0.004, v, 0.22); o.connect(g); g.connect(this.out); g.connect(this.verb);
    o.start(t); o2.start(t); o.stop(t + 0.3); o2.stop(t + 0.3);
  },
  bass(t, m, len) {
    const o = AC.createOscillator(), f = AC.createBiquadFilter(), g = AC.createGain();
    o.type = 'square'; o.frequency.value = this.hz(m); f.type = 'lowpass'; f.frequency.setValueAtTime(900, t); f.frequency.exponentialRampToValueAtTime(220, t + len);
    this.env(g, t, 0.005, 0.22, len); o.connect(f); f.connect(g); g.connect(this.out); o.start(t); o.stop(t + len + 0.05);
  },
  noise(t, len, type, freq, v, q = 1) {
    const s = AC.createBufferSource(), f = AC.createBiquadFilter(), g = AC.createGain(); s.buffer = noiseBuf;
    f.type = type; f.frequency.value = freq; f.Q.value = q; this.env(g, t, 0.002, v, len);
    s.connect(f); f.connect(g); g.connect(this.out); s.start(t); s.stop(t + len + 0.02);
  },
  kick(t) { const o = AC.createOscillator(), g = AC.createGain(); o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.12); this.env(g, t, 0.002, 0.55, 0.18); o.connect(g); g.connect(this.out); o.start(t); o.stop(t + 0.22); },
  snare(t) { this.noise(t, 0.13, 'highpass', 1500, 0.22); const o = AC.createOscillator(), g = AC.createGain(); o.frequency.setValueAtTime(220, t); o.frequency.exponentialRampToValueAtTime(140, t + 0.06); this.env(g, t, 0.002, 0.15, 0.07); o.connect(g); g.connect(this.out); o.start(t); o.stop(t + 0.1); },
  hat(t, v = 0.05) { this.noise(t, 0.035, 'highpass', 8000, v); },
  block(t) { const o = AC.createOscillator(), g = AC.createGain(); o.type = 'sine'; o.frequency.value = 1250; this.env(g, t, 0.001, 0.12, 0.05); o.connect(g); g.connect(this.out); o.start(t); o.stop(t + 0.08); },
  gong(t) {
    [110, 147, 233, 311].forEach((fq, i) => { const o = AC.createOscillator(), g = AC.createGain(); o.frequency.setValueAtTime(fq * 1.03, t); o.frequency.exponentialRampToValueAtTime(fq, t + 0.4); this.env(g, t, 0.01, 0.07 / (i + 1), 2.2); o.connect(g); g.connect(this.out); g.connect(this.verb); o.start(t); o.stop(t + 2.4); });
    this.noise(t, 1.2, 'bandpass', 3000, 0.06, 0.5);
  },
  tom(t, fq) { const o = AC.createOscillator(), g = AC.createGain(); o.frequency.setValueAtTime(fq, t); o.frequency.exponentialRampToValueAtTime(fq * 0.6, t + 0.2); this.env(g, t, 0.002, 0.3, 0.22); o.connect(g); g.connect(this.out); o.start(t); o.stop(t + 0.26); },
  schedule() {
    if (!AC || this.custom) return;
    const spb = 60 / this.bpm / 2; // 八分音符
    while (this.nextT < AC.currentTime + 0.15) { this.playStep(this.step, this.nextT, spb); this.nextT += spb; this.step++; }
  },
  playStep(s, t, spb) {
    const I = this.intensity, bar = Math.floor(s / 8), pos = s % 8, phrase = Math.floor(s / 16) % this.form.length;
    const ch = Math.floor(bar / 2) % 4;
    if (s % 128 === 0) this.gong(t);
    // 鼓
    if (I > 0.3) {
      if (pos === 0 || pos === 3 || (pos === 6 && I > 0.8)) this.kick(t);
      if (pos === 2 || pos === 6) this.snare(t);
      this.hat(t, pos % 2 ? 0.035 : 0.055); if (I > 0.8) this.hat(t + spb / 2, 0.025);
      if (pos === 5 || (pos === 7 && bar % 2)) this.block(t);
      if (I > 1.05 && bar % 4 === 3 && pos >= 4) this.tom(t, [220, 180, 150, 120][pos - 4]);
    } else if (pos === 0) this.block(t);
    // 低音
    const root = this.roots[ch];
    const bp = [1, 0, 0, 1, 0, 1, 1, 0];
    if (bp[pos]) this.bass(t, root + (pos === 5 ? 12 : pos === 6 ? 7 : 0), spb * 0.9);
    // 琵琶分解和弦（十六分）
    if (I > 0.3) {
      const c = this.chords[ch];
      for (let k = 0; k < 2; k++) { const n = c[(pos * 2 + k) % 3] + ((pos * 2 + k) % 6 > 2 ? 12 : 0); this.pluck(t + k * spb / 2, n, 0.05 + 0.03 * (k === 0)); }
    }
    // 主旋律
    if (I > 0.5 || phrase % 2 === 0) {
      const mel = this.mel[this.form[phrase]], idx = s % 16, d = mel[idx];
      if (d >= 0) {
        let len = 1; while (idx + len < 16 && mel[idx + len] === -2) len++;
        const note = this.pent[d];
        if (I > 0.5) this.lead(t, note, len * spb * 0.95);
        else this.pluck(t, note + 12, 0.1);
      }
    }
  },
};
function refreshMusicChip() {
  const c = $('cMusic'); if (!c) return;
  c.querySelector('b').textContent = !Music.on ? '关' : Music.custom ? '自定义' : '原创BGM';
  c.classList.toggle('on', Music.on);
}
(function musicUI() {
  const inp = $('bgmFile'), btn = $('bgmBtn');
  if (!btn) return;
  btn.addEventListener('click', e => { e.stopPropagation(); inp.click(); });
  inp.addEventListener('click', e => e.stopPropagation());
  inp.addEventListener('change', e => { const f = inp.files[0]; if (f) { initAudio(); Music.init(); Music.loadFile(f); btn.textContent = '🎵 已载入：' + f.name.slice(0, 24); } });
})();
