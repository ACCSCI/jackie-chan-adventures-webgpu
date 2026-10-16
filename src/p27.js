// ================= 武器类别 & 器械套路 =================
// 同类武器共用招式；拿起武器后，三种拳法变为该类别的三种器械套路
Object.assign(WEAPONS[0], { cls: 'staff', dmg: 1.3, range: 1.0, dur: 40, len: 1.3, kind: 'stick' });
Object.assign(WEAPONS[1], { cls: 'blade', dmg: 1.05, range: 0.6, dur: 30, len: 0.9, kind: 'umbrella' });
Object.assign(WEAPONS[2], { cls: 'short', dmg: 1.8, range: 0.3, dur: 25, len: 0.6, kind: 'pan' });
WEAPONS.push(
  { name: '扫帚', cls: 'staff', range: 0.9, dmg: 1.0, dur: 25, sound: 'hit', len: 1.25, kind: 'broom' },          // 3
  { name: '铁棍', cls: 'staff', range: 1.0, dmg: 1.75, dur: 80, sound: 'clang', len: 1.3, kind: 'iron' },         // 4
  { name: '练功棍', cls: 'staff', range: 1.0, dmg: 1.4, dur: 999, sound: 'hit', len: 1.3, kind: 'dojo' },          // 5
  { name: '武士刀', cls: 'blade', range: 0.7, dmg: 1.7, dur: 45, sound: 'hit', len: 0.95, kind: 'katana' },       // 6
  { name: '古剑', cls: 'blade', range: 0.65, dmg: 1.55, dur: 60, sound: 'clang', len: 0.9, kind: 'sword' },       // 7
  { name: '酒瓶', cls: 'short', range: 0.2, dmg: 1.4, dur: 6, sound: 'clang', len: 0.4, kind: 'bottle', fragile: 1 }, // 8
  { name: '鸡毛掸子', cls: 'short', range: 0.45, dmg: 0.7, dur: 99, sound: 'hit', len: 0.65, kind: 'duster' },     // 9
);
const WCLASS = {
  staff: { name: '棍类', styles: ['龙形棍', '灵蛇棍', '醉棍'], desc: '攻击距离最远，腿法模式可撑棍踢' },
  blade: { name: '刀剑类', styles: ['龙形刀', '蛇形剑', '醉剑'], desc: '出手快、伤害高，擅长连斩与突刺' },
  short: { name: '短打类', styles: ['龙形短打', '蛇形短打', '醉八仙'], desc: '贴身近战，砸得狠、出手密' },
};
function wcls() { return player.weapon ? WEAPONS[player.weapon.type].cls : null; }
// 招式工厂：sk = [片段, 起点, 命中帧, 终点, 下半身]
let _wmN = 0;
const _WK = { L1: MOVES.w1.keys, L2: MOVES.w2.keys, L3: MOVES.w3.keys, H: MOVES.wHeavy.keys, low: MOVES.wLow.keys };
function wm(o) {
  const keys = (o.kf || _WK.L1).map(([t, p]) => [t, p]);
  const m = mv(Object.assign({ base: W, wpn: 1, arc: 1.0, kb: 3, cost: 7, range: 1.6 }, o, { keys }));
  m.skKey = 'wm' + (++_wmN); SKM[m.skKey] = o.sk; return m;
}
const SD = ['slash_down', .2, .8, 1.25], SO = ['slash_out', .3, 1.0, 1.8], ST = ['stab', .6, 1.13, 1.8], SI = ['slash_in', .3, .9, 1.6], SIF = ['slash_in', 0, null, 2.2], UP = ['upper', 0, .57, 1.25], QD = ['quad', .1, null, 2.1];
const WMOVES = {
  staff: [
    { L1: wm({ name: '游龙斜劈', staff: 'chop', sk: ['idle_box', 0, null, .2], dur: .48, hit: .46, dmg: 12, cost: 6, lunge: [.22, .55, 2.8] }),
      L2: wm({ name: '横扫千军', staff: 'sweep', sk: ['idle_box', 0, null, .2], dur: .49, hit: .45, dmg: 13, cost: 7, arc: 2.3 }),
      L3: wm({ name: '回身盘龙', staff: 'reverse', sk: ['idle_box', 0, null, .2], dur: .57, hit: .50, dmg: 15, cost: 8, arc: 2.6 }),
      L4: wm({ name: '降龙劈山', staff: 'slam', sk: ['idle_box', 0, null, .2], dur: .68, hit: .55, dmg: 22, cost: 10, kd: 1, kb: 7, lunge: [.25, .56, 4] }),
      H: wm({ name: '蓄势劈山', staff: 'slam', sk: ['idle_box', 0, null, .2], dur: .8, hit: .51, dmg: 30, cost: 20, heavy: 1, kd: 1, kb: 9, lunge: [.25, .53, 4] }) },
    { L1: wm({ name: '灵蛇点首', staff: 'thrust', sk: ['idle_box', 0, null, .2], dur: .32, hit: .44, dmg: 10, cost: 4, lunge: [.2, .5, 3] }),
      L2: wm({ name: '回抽再刺', staff: 'thrust', sk: ['idle_box', 0, null, .2], dur: .34, hit: .46, dmg: 11, cost: 5, lunge: [.2, .5, 3] }),
      L3: wm({ name: '穿云出洞', staff: 'thrust', sk: ['idle_box', 0, null, .2], dur: .5, hit: .50, dmg: 19, cost: 8, kb: 6, lunge: [.2, .5, 6] }),
      H: wm({ name: '蓄势穿云', staff: 'thrust', sk: ['idle_box', 0, null, .2], dur: .7, hit: .5, dmg: 28, cost: 18, heavy: 1, kb: 8, lunge: [.2, .5, 7] }) },
    { L1: wm({ name: '醉卧扫庭', staff: 'low', sk: ['crouch_idle', 0, null, .2], dur: .52, hit: .46, dmg: 13, cost: 6, low: 1 }),
      L2: wm({ name: '借步回身', staff: 'reverse', sk: ['idle_box', 0, null, .2], dur: .54, hit: .48, dmg: 14, cost: 7 }),
      L3: wm({ name: '醉里挑月', staff: 'rise', sk: ['idle_box', 0, null, .2], dur: .6, hit: .52, dmg: 18, cost: 9, launch: 7 }),
      H: wm({ name: '醉仙盘棍', staff: 'spin', sk: ['crouch_idle', 0, null, .2], dur: 1.0, hits: [.32, .62], dmg: 17, cost: 20, heavy: 1, kd: 1, arc: Math.PI }) },
  ],
  blade: [
    { L1: wm({ name: '力劈华山', sk: SD, dur: .42, hit: .45, range: 1.6, arc: .8, dmg: 12, kb: 3, lunge: [.2, .45, 2.5] }),
      L2: wm({ name: '斜斩', sk: SI, kf: _WK.L2, dur: .42, hit: .5, range: 1.6, arc: 1.3, dmg: 12, kb: 3 }),
      L3: wm({ name: '回刀横斩', sk: SO, kf: _WK.L2, dur: .5, hit: .45, range: 1.7, arc: 1.5, dmg: 15, kb: 5, cost: 8 }),
      H: wm({ name: '龙卷刀', sk: SIF, kf: _WK.H, dur: .85, hits: [.35, .6], range: 1.8, arc: Math.PI, dmg: 16, kb: 7, cost: 18, heavy: 1, kd: 1, spin: 1, spin360: [.15, .85] }) },
    { L1: wm({ name: '点刺', sk: ST, kf: _WK.L3, dur: .3, hit: .45, range: 1.8, arc: .5, dmg: 8, kb: 1.2, cost: 4, lunge: [.2, .45, 3] }),
      L2: wm({ name: '连刺', sk: ST, kf: _WK.L3, dur: .3, hit: .45, range: 1.8, arc: .5, dmg: 9, kb: 1.2, cost: 4, lunge: [.2, .45, 3] }),
      L3: wm({ name: '穿心刺', sk: ST, kf: _WK.L3, dur: .48, hit: .5, range: 1.9, arc: .5, dmg: 16, kb: 6, cost: 8, lunge: [.2, .55, 9] }),
      H: wm({ name: '万剑归宗', sk: QD, kf: _WK.L3, dur: .95, hits: [.15, .32, .5, .68, .85], range: 1.7, arc: .8, dmg: 7, kb: 1, cost: 18, heavy: 1, lunge: [.1, .8, 3] }) },
    { L1: wm({ name: '醉斩', sk: SO, kf: _WK.L2, dur: .5, hit: .45, range: 1.6, arc: 1.4, dmg: 12, kb: 3 }),
      L2: wm({ name: '回眸斩', sk: SI, kf: _WK.L2, dur: .46, hit: .5, range: 1.6, arc: 1.4, dmg: 13, kb: 3, cost: 8 }),
      L3: wm({ name: '醉仙踢', sk: ['kick_high', .25, .76, 1.5], kf: _WK.L3, dur: .55, hit: .5, range: 1.9, arc: .9, dmg: 15, kb: 7, cost: 9 }),
      H: wm({ name: '醉剑旋风', sk: ['kick_hurricane', 0, null, 1.8], kf: _WK.H, dur: .95, hits: [.35, .55, .75], range: 1.8, arc: Math.PI, dmg: 12, kb: 5, cost: 20, heavy: 1, spin: 1, jump: 5 }) },
  ],
  short: [
    { L1: wm({ name: '当头一击', sk: SD, dur: .4, hit: .45, range: 1.5, arc: .8, dmg: 12, kb: 3, lunge: [.2, .45, 2.5] }),
      L2: wm({ name: '冲锤', sk: ['heavy_p', 0, .4, .9], kf: _WK.L3, dur: .4, hit: .45, range: 1.5, arc: .9, dmg: 12, kb: 4 }),
      L3: wm({ name: '顶肘砸', sk: ['elbow', .1, .62, 1.35], kf: _WK.L3, dur: .5, hit: .5, range: 1.5, arc: 1.0, dmg: 16, kb: 6, cost: 9, lunge: [.25, .5, 5] }),
      H: wm({ name: '泰山压顶', sk: ['slash_down', .1, .8, 1.3], dur: .8, hit: .55, range: 1.6, arc: 1.0, dmg: 28, kb: 8, cost: 18, heavy: 1, kd: 1, jump: 5, shockW: 1, lunge: [.1, .5, 4] }) },
    { L1: wm({ name: '快打', sk: ['cross', .75, 1.17, 1.65], kf: _WK.L3, dur: .3, hit: .42, range: 1.5, arc: .9, dmg: 8, kb: 1.5, cost: 4, lunge: [.1, .45, 2.5] }),
      L2: wm({ name: '勾打', sk: ['hook', .15, .57, 1.15], kf: _WK.L2, dur: .36, hit: .5, range: 1.5, arc: 1.2, dmg: 9, kb: 2, cost: 5 }),
      L3: wm({ name: '冲打', sk: ['cross', .75, 1.17, 1.65], kf: _WK.L3, dur: .42, hit: .45, range: 1.6, arc: .9, dmg: 13, kb: 5, cost: 7, lunge: [.15, .5, 7] }),
      H: wm({ name: '乱打', sk: QD, kf: _WK.L3, dur: .9, hits: [.15, .32, .5, .68, .85], range: 1.5, arc: .9, dmg: 7, kb: 1, cost: 16, heavy: 1, lunge: [.1, .8, 2.5] }) },
    { L1: wm({ name: '醉勾', sk: ['hook', .15, .57, 1.15], kf: _WK.L2, dur: .4, hit: .5, range: 1.5, arc: 1.2, dmg: 11, kb: 3 }),
      L2: wm({ name: '醉甩', sk: SO, kf: _WK.L2, dur: .46, hit: .45, range: 1.5, arc: 1.4, dmg: 12, kb: 3, cost: 8 }),
      L3: wm({ name: '醉膝撞', sk: ['knee_combo', .3, null, 2.2], kf: _WK.L3, dur: .7, hits: [.35, .7], range: 1.4, arc: 1.0, dmg: 10, kb: 5, cost: 9, lunge: [.2, .6, 3] }),
      H: wm({ name: '醉八仙·回旋', sk: SIF, kf: _WK.H, dur: .85, hits: [.35, .6], range: 1.6, arc: Math.PI, dmg: 15, kb: 7, cost: 18, heavy: 1, kd: 1, spin: 1, spin360: [.15, .85] }) },
  ],
};
for (const c in WMOVES) for (const s of WMOVES[c]) { s.L1.nextM = s.L2; s.L2.nextM = s.L3; if (s.L4) s.L3.nextM = s.L4; }
const WSHARED = {};
for (const c of ['staff', 'blade', 'short']) {
  const S = WSHARED[c] = {};
  S.CL = c === 'staff' ? wm({ name: '扫地棍', base: C, kf: _WK.low, sk: ['sweep', .45, 1.0, 1.95], dur: .65, hit: .5, range: 1.9, arc: Math.PI, dmg: 13, kb: 3, cost: 9, low: 1, kd: 1, spin: 1, spin360: [.12, .8] })
    : c === 'blade' ? wm({ name: '低扫斩', base: C, kf: _WK.low, sk: ['slash_in', .5, 1.25, 1.9, 'crouch_idle'], dur: .5, hit: .5, range: 1.7, arc: 1.6, dmg: 13, kb: 3, cost: 8, low: 1, kd: 1 })
    : wm({ name: '低位捶', base: C, kf: _WK.low, sk: ['cross', .75, 1.17, 1.65, 'crouch_idle'], dur: .34, hit: .42, range: 1.4, arc: 1.0, dmg: 11, kb: 2, cost: 5, low: 1 });
  S.CH = wm({ name: c === 'staff' ? '挑天棍' : c === 'blade' ? '撩天斩' : '升天锤', base: C, kf: _WK.L3, sk: UP, dur: .7, hits: [.45], range: 1.7, arc: 1.0, dmg: 18, kb: 1.5, cost: 18, heavy: 1, launch: 9 });
  S.A = wm({ name: '凌空劈', sk: SD, dur: .45, hit: .45, range: 1.7, arc: 1.0, dmg: 14, kb: 4, cost: 8, air: 1 });
  S.AH = wm({ name: '流星坠', sk: ['slash_down', .1, .8, 1.3], dur: .55, hit: .4, range: 1.8, arc: 1.2, dmg: 20, kb: 6, cost: 14, heavy: 1, kd: 1, air: 1 });
}
Object.assign(WSHARED.staff.CL, { staff: 'low', spin360: null });
Object.assign(WSHARED.staff.CH, { staff: 'rise' });
Object.assign(WSHARED.staff.A, { staff: 'chop', name: '凌空劈棍' });
Object.assign(WSHARED.staff.AH, { staff: 'slam', name: '落地劈山' });
{ // 棍类：撑棍踢
  const S = WSHARED.staff;
  S.KL1 = wm({ name: '撑棍正蹬', sk: ['kick_front', .4, 1.0, 1.5], kf: _WK.L3, dur: .4, hit: .45, range: 2.0, arc: .8, dmg: 11, kb: 3, cost: 7, lunge: [.2, .5, 2] });
  S.KL2 = wm({ name: '撑棍侧踹', sk: ['kick_side', .2, .83, 1.4], kf: _WK.L3, dur: .45, hit: .5, range: 2.1, arc: .8, dmg: 13, kb: 5, cost: 8, lunge: [.2, .5, 3] });
  S.KL3 = wm({ name: '撑棍高踢', sk: ['kick_high', .25, .76, 1.5], kf: _WK.L3, dur: .55, hit: .5, range: 2.1, arc: .9, dmg: 16, kb: 7, cost: 9 });
  S.KH = wm({ name: '撑竿飞踢', sk: ['kick_side', .1, .83, 1.4], kf: _WK.L3, dur: .8, hit: .5, range: 2.2, arc: .9, dmg: 26, kb: 10, cost: 18, heavy: 1, jump: 6, kd: 1, lunge: [.15, .65, 9] });
  S.KL1.nextM = S.KL2; S.KL2.nextM = S.KL3;
}
const WALL = new Set(); for (const c in WMOVES) { WMOVES[c].forEach(s => Object.values(s).forEach(m => WALL.add(m))); Object.values(WSHARED[c]).forEach(m => WALL.add(m)); }
// 根据当前状态挑武器招式；返回 null 表示用普通招式
function weaponMove(type) {
  const p = player, c = wcls(); if (!c) return null;
  const S = WMOVES[c][p.style], H = WSHARED[c], L = type === 'light';
  if (!p.grounded) return L ? H.A : H.AH;
  if (p.guard) return null;
  if (p.crouch) return p.mode === 'fist' ? (L ? H.CL : H.CH) : null;
  if (p.mode === 'kick') return H.KL1 ? (L ? H.KL1 : H.KH) : null;
  return L ? S.L1 : S.H;
}
function styleLabel(i) { const c = wcls(); return c ? WCLASS[c].styles[i] : STYLES[i].name; }

// ================= 符文（十二生肖护身符）：装备后持续生效 =================
const RUNES = [
  { key: 'rooster', name: '鸡', full: '鸡符 · 浮空', color: '#ffd04a', desc: '空中按住 Space 缓缓滑翔；跳得更高', how: '通关第一集结局' },
  { key: 'sheep', name: '羊', full: '羊符 · 灵魂出窍', color: '#e8e8ff', desc: '闪避无敌时间 +50%，闪避体力消耗减半', how: '练功房完成 3 项挑战' },
  { key: 'horse', name: '马', full: '马符 · 治愈', color: '#7dffb0', desc: '每秒恢复 1.5 生命', how: '击退码头的黑手帮' },
  { key: 'pig', name: '猪', full: '猪符 · 热光眼', color: '#ff6a5a', desc: '重击命中后眼射热光，打中前方 7 米直线上的敌人', how: '打败芬恩、拉索、阿周三人组' },
  { key: 'rabbit', name: '兔', full: '兔符 · 神速', color: '#7fe9ff', desc: '移动速度 +15%，出招速度 +10%', how: '第一章小玉送的护身符' },
  { key: 'ox', name: '牛', full: '牛符 · 神力', color: '#ff8a3a', desc: '伤害 +20%，击退 +30%', how: '第一章小玉送的护身符' },
  { key: 'dog', name: '狗', full: '狗符 · 不死之身', color: '#8cff7a', desc: '受到致命伤时留 1 口气并回复 30% 生命（冷却 60 秒）', how: '小玉送的狗符（捡到还能回满血）' },
  { key: 'snake', name: '蛇', full: '蛇符 · 隐身', color: '#4be37a', desc: '敌人更难盯上你：敌人出手间隔 +35%', how: '在唐人街击退影武者' },
  { key: 'rat', name: '鼠', full: '鼠符 · 赋予生命', color: '#c0b0a0', desc: '武器有灵：耐久消耗减半', how: '守住老爹的古董店' },
  { key: 'tiger', name: '虎', full: '虎符 · 阴阳平衡', color: '#ffb84a', desc: '完美格挡、完美闪避的判定时间 +50%', how: '打败刀鲁' },
  { key: 'dragon', name: '龙', full: '龙符 · 喷火', color: '#ff7a2a', desc: '每套连招的最后一击喷出火焰，烧伤前方敌人', how: '练功房完成全部 10 项挑战' },
  { key: 'monkey', name: '猴', full: '猴符 · 灵巧', color: '#d8a060', desc: '所有体力消耗 -25%', how: '练功房完成 6 项挑战' },
];
const RUNE = Object.fromEntries(RUNES.map(r => [r.key, r]));
const Runes = {
  owned: new Set(), eq: [null, null, null], dogCD: -99,
  load() {
    try { JSON.parse(localStorage.getItem('jc_runes') || '[]').forEach(k => RUNE[k] && this.owned.add(k)); const e = JSON.parse(localStorage.getItem('jc_runeEq') || '[]'); for (let i = 0; i < 3; i++) this.eq[i] = e[i] && this.owned.has(e[i]) ? e[i] : null; } catch (e) { }
  },
  save() { try { localStorage.setItem('jc_runes', JSON.stringify([...this.owned])); localStorage.setItem('jc_runeEq', JSON.stringify(this.eq)); } catch (e) { } },
  has(k) { return this.eq.includes(k); },
  // 获得新符文：有空格就自动装上
  award(k, silent) {
    const R = RUNE[k]; if (!R) return false;
    const fresh = !this.owned.has(k); this.owned.add(k);
    let auto = false; if (fresh && !this.has(k)) { const i = this.eq.indexOf(null); if (i >= 0) { this.eq[i] = k; auto = true; } }
    this.save(); refreshChips(); Bag.render();
    if (fresh && !silent) {
      toast(`<b style="color:${R.color}">获得「${R.full}」</b><small>${R.desc}</small><small>${auto ? '已自动装备' : '按 Tab 打开背包装备（最多 3 个）'}</small>`);
      burst(player.pos.clone().setY(1.2), new THREE.Color(R.color).getHex(), 40, 5); sfx('clang');
    }
    return fresh;
  },
  equip(k) { if (!this.owned.has(k)) return; const j = this.eq.indexOf(k); if (j >= 0) { this.eq[j] = null; } else { const i = this.eq.indexOf(null); if (i < 0) { tip('符文栏已满（3 个）——先卸下一个', 1.6); return; } this.eq[i] = k; } this.save(); refreshChips(); this.render(); },
  render() { Bag.render(); },
  label() { const l = this.eq.filter(Boolean).map(k => RUNE[k].name); return l.length ? l.join('·') : '无'; },
};
Runes.load();
let toastT = null;
function toast(html, t = 3.2) { const e = $('toast'); e.innerHTML = html; e.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => e.classList.remove('show'), t * 1000); }

