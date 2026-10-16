// ================= 输入 =================
const keys = {};
let mouseDX = 0, mouseDY = 0, locked = false, started = false;
const buffer = { type: null, t: -9 };
let now = 0;
const KEYSTOP = ['Tab', 'AltLeft', 'AltRight', 'Space', 'CapsLock', 'KeyQ', 'Enter'];
let cutscene = false;
addEventListener('keydown', e => {
  const typing = e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName);
  // 游戏进行中拦截几乎所有浏览器快捷键（Alt+D、Ctrl+F、F5…）；全屏时再用键盘锁定拦 Ctrl+W 等
  if (KEYSTOP.includes(e.code) || e.key === 'Alt' || (started && !gameOver && !typing && e.code !== 'F12')) e.preventDefault();
  if (!started) return;
  if (e.code === 'Escape') { if (Bag.open) { Bag.toggle(false); return; } if (locked) document.exitPointerLock(); return; }
  if (Bag.open) { if (e.code === 'Tab' && !e.repeat) Bag.toggle(false); return; }
  if (e.code === 'Tab' && !cutscene && !e.repeat) { Bag.toggle(true); return; }
  if (cutscene) { if (!e.repeat) { if (e.code === 'KeyM') Music.toggle(); else if (e.code === 'Tab') Story.skip(); else if (['Space', 'Enter', 'KeyE'].includes(e.code)) Story.next(); } return; }
  keys[e.code] = true;
  if (e.repeat) return;
  switch (e.code) {
    case 'CapsLock': case 'KeyX': toggleMode(); break;
    case 'KeyC': toggleCrouch(); break;
    case 'KeyQ': player.guardPress = now; break;
    case 'Digit1': setStyle(0); break;
    case 'Digit2': setStyle(1); break;
    case 'Digit3': setStyle(2); break;
    case 'AltLeft': case 'AltRight': tryDodge(); break;
    case 'Space': tryJump(); break;
    case 'KeyM': Music.toggle(); break;
    case 'KeyE': pickupOrDrop(); break;
    case 'KeyR': toggleLock(); break;
    case 'KeyH': $('help').classList.toggle('hide'); break;
    case 'KeyK': toggleMoves(); break;
  }
}, { capture: true });
addEventListener('keyup', e => {
  if (KEYSTOP.includes(e.code) || e.key === 'Alt' || (started && !gameOver)) e.preventDefault();
  keys[e.code] = false;
  if (started && locked && !cutscene && !Bag.open && !gameOver && e.code === 'CapsLock' && isMac) toggleMode();
}, { capture: true });
addEventListener('blur', () => { for (const k in keys) keys[k] = false; });
addEventListener('contextmenu', e => e.preventDefault());
addEventListener('mousedown', e => {
  if (!started || !locked) return;
  if (cutscene) { if (e.button === 0) Story.next(); return; }
  if (e.button === 0) { buffer.type = 'light'; buffer.t = now; player.lmbHeld = true; player.lmbT = now; }
  if (e.button === 2) { if (!tryStaffCharge()) { buffer.type = 'heavy'; buffer.t = now; } }
  if (e.button === 1) { e.preventDefault(); toggleLock(); }
});
addEventListener('mouseup', e => { if (e.button === 0) player.lmbHeld = false; if (e.button === 2 && player.state === 'staffCharge') releaseStaffCharge(); });
let lastModeWheel = -Infinity;
addEventListener('wheel', e => {
  if (!started || !locked || cutscene || Bag.open || gameOver || !e.deltaY) return;
  e.preventDefault();
  // A wheel gesture/trackpad burst changes mode once, rather than flickering every event.
  const time = performance.now();
  if (time - lastModeWheel >= 220) toggleMode();
  lastModeWheel = time;
}, { passive: false });
addEventListener('mousemove', e => { if (locked) { mouseDX += e.movementX; mouseDY += e.movementY; } });
document.addEventListener('pointerlockchange', () => {
  locked = document.pointerLockElement === renderer.domElement;
  if (!locked && player.state === 'staffCharge') { setState(player, 'loco'); player.chargeT = 0; }
  if (!locked) player.lmbHeld = false;
  if (started && !locked && !gameOver && !Bag.open) Menu.pause();
});
// ================= HUD 工具 =================
let moveTimer = 0;
function showMove(txt, color) { const m = $('move'); m.textContent = txt; m.style.color = color || '#fff'; m.classList.add('show'); moveTimer = 0.7; }
let tipTimer = 0;
function tip(txt, t = 1.6) { const e = $('tip'); e.textContent = txt; e.style.opacity = 1; tipTimer = t; }
let bannerTimer = 0;
function banner(html, t = 2.5) { const b = $('banner'); b.innerHTML = html; b.classList.add('show'); bannerTimer = t; }
const _v = new THREE.Vector3();
function toScreen(pos) {
  _v.copy(pos).project(camera);
  return { x: (_v.x * .5 + .5) * innerWidth, y: (-_v.y * .5 + .5) * innerHeight, vis: _v.z < 1 && _v.z > -1 };
}
const floaters = [];
function floatText(pos, txt, color = '#fff', size = 22) {
  const d = document.createElement('div'); d.className = 'dmg'; d.textContent = txt; d.style.color = color; d.style.fontSize = size + 'px';
  $('hud').appendChild(d); floaters.push({ d, pos: pos.clone(), t: 0 });
}
function updateFloaters(dt) {
  for (let i = floaters.length - 1; i >= 0; i--) {
    const f = floaters[i]; f.t += dt; f.pos.y += dt * 1.2;
    const s = toScreen(f.pos); f.d.style.left = s.x + 'px'; f.d.style.top = s.y + 'px';
    f.d.style.opacity = s.vis ? 1 - f.t / 0.9 : 0; f.d.style.transform = `translate(-50%,-50%) scale(${1 + Math.max(0, .2 - f.t) * 3})`;
    if (f.t > 0.9) { f.d.remove(); floaters.splice(i, 1); }
  }
}
let shake = 0, hitstop = 0, slowmo = 0;

// ================= 玩家 =================
const player = {
  rig: makeSkinRig('jackie', 1),
  pos: new THREE.Vector3(0, 0, -6), vy: 0, yaw: 0, yawTarget: 0, vel: new THREE.Vector3(),
  hp: 200, maxHp: 200, st: 100, stDelay: 0,
  mode: 'fist', crouch: false, guard: false, guardPress: -9, style: 0,
  view: 'third', state: 'loco', move: null, mt: 0, hitDone: [], clip: null,
  stateT: 0, iframe: 0, grounded: true, weapon: null, counterT: -9,
  walkPh: 0, combo: 0, comboT: 0, buffs: {}, dodgeDir: new THREE.Vector2(), downClip: null,
};
player.anim = new Animator(player.rig.ghost);
player.baseSm = Object.assign(zeroPose(), BASE.stand[0]);
scene.add(player.rig.root);
let camYaw = 0, camPitch = -0.15, lockTarget = null;
const DOWN = downClips(BASE.crouch, BASE.stand[0]);

// 状态切换统一入口：每次切换都做交叉淡入
function setState(p, s, blend = 0.12) { p.state = s; p.stateT = 0; p.anim.blend(blend); }

function setChip(id, val, on) { const c = $(id); c.querySelector('b').textContent = val; c.classList.toggle('on', !!on); }
function refreshChips() {
  $('combatMode').dataset.mode = player.mode;
  $('combatMode').setAttribute('aria-label', player.mode === 'fist' ? '当前拳法，滚轮切换腿法' : '当前腿法，滚轮切换拳法');
  setChip('cMode', player.mode === 'fist' ? '拳法' : '腿法', player.mode === 'kick');
  setChip('cStance', player.crouch ? '蹲下' : '站立', player.crouch);
  setChip('cParry', player.guard ? '举架中' : '按住 Q', player.guard);
  setChip('cWeapon', player.weapon ? `${WEAPONS[player.weapon.type].name}·${styleLabel(player.style)} ${player.weapon.dur >= 999 ? '∞' : player.weapon.dur}` : '空手', !!player.weapon);
  setChip('cRune', Runes.label(), Runes.eq.some(Boolean));
  if ($('movesP') && $('movesP').classList.contains('show') && typeof toggleMoves === 'function') toggleMoves(true);
  document.querySelectorAll('.sty').forEach((e, i) => { e.classList.toggle('act', i === player.style); const l = e.querySelector('.l'); if (l) l.textContent = (i + 1) + ' · ' + styleLabel(i); });
}
function toggleMode() { player.mode = player.mode === 'fist' ? 'kick' : 'fist'; showMove(player.mode === 'fist' ? '— 拳法 —' : '— 腿法 —', '#4fd1ff'); refreshChips(); }
function toggleCrouch() { if (!player.grounded) return; player.crouch = !player.crouch; refreshChips(); }
function toggleView() { /* 只保留第三人称 */ }
function setStyle(i) {
  if (player.style === i) return; player.style = i;
  const s = STYLES[i]; showMove(`— ${styleLabel(i)} —`, s.css);
  burst(player.pos.clone().setY(1.2), s.color, 20, 3); refreshChips();
  if ($('movesP').classList.contains('show')) toggleMoves(true);
}
function useStamina(c) {
  if (Runes.has('monkey')) c *= 0.75;
  if (player.st < c) { const b = $('stb'); b.classList.remove('low'); void b.offsetWidth; b.classList.add('low'); tip('体力不足！', 0.8); return false; }
  player.st -= c; player.stDelay = 0.7; return true;
}
function canAct(p) {
  if (p.state === 'loco' || p.state === 'staffCharge' || p.state === 'staffSpin') return true;
  if (p.state === 'attack') return p.mt >= p.move.cancel;
  if (p.state === 'block') return p.stateT > 0.12;
  return false;
}
// 闪避翻滚
const ROLL = clip(0.55, [
  [0, { hy: -0.15, sx: 0.3 }],
  [0.08, { hy: -0.4, sx: 0.7, nx: 0.5, lhx: -1.3, lkx: 1.8, rhx: -0.6, rkx: 1.6, lsx: -1.2, rsx: -1.2, lex: -1.6, rex: -1.6 }],
  [0.15, { hx: 1.2, hy: -0.5, sx: 0.8, nx: 0.6, lhx: -2.0, lkx: 2.4, rhx: -2.0, rkx: 2.4, lsx: -1.3, rsx: -1.3, lex: -1.9, rex: -1.9 }],
  [0.3, { hx: 3.4, hy: -0.55, sx: 0.8, nx: 0.6, lhx: -2.1, lkx: 2.5, rhx: -2.1, rkx: 2.5, lsx: -1.3, rsx: -1.3, lex: -1.9, rex: -1.9 }],
  [0.42, { hx: 5.6, hy: -0.48, sx: 0.6, lhx: -1.8, lkx: 2.2, rhx: -1.2, rkx: 2.0, lsx: -1.0, rsx: -1.0 }],
  [0.55, Object.assign({}, BASE.crouch, { hx: TAU, hy: -0.3 })]], {});
const AIRFLIP = clip(0.5, [[0, { hy: -0.1 }], [0.1, { sx: 0.6, lhx: -1.9, lkx: 2.3, rhx: -1.9, rkx: 2.3, lsx: -1.0, rsx: -1.0, lex: -1.7, rex: -1.7 }],
  [0.38, { sx: 0.5, lhx: -1.7, lkx: 2.1, rhx: -1.7, rkx: 2.1, lsx: -0.8, rsx: -0.8, lex: -1.5, rex: -1.5 }], [0.5, BASE.stand[0]]], BASE.stand[0]);
const DASH = clip(0.45, [[0, { hy: -0.1 }], [0.12, { hy: -0.3, sx: 0.35, lhx: -0.9, lkx: 1.0, rhx: 0.4, rkx: 0.6 }], [0.32, { hy: -0.25, sx: 0.25 }], [0.45, BASE.stand[0]]], BASE.stand[0]);
// 倒地受身：倒地后按闪避快速起身
const KIPUP = {
  back: clip(0.5, [[0, LIE_BACK], [0.1, { hy: -0.74, hx: -1.6, sx: -0.6, nx: 0.4, lsx: -2.6, rsx: -2.6, lex: -1.6, rex: -1.6, lhx: -2.4, lkx: 2.5, rhx: -2.4, rkx: 2.5 }],
    [0.22, { hy: -0.42, hx: -0.35, sx: 0.4, nx: 0.2, lsx: 0.6, rsx: 0.6, lex: -0.6, rex: -0.6, lhx: -1.6, lkx: 2.2, rhx: -1.2, rkx: 1.8 }],
    [0.34, BASE.crouch], [0.5, BASE.stand[0]]], BASE.stand[0]),
  front: clip(0.5, [[0, LIE_FRONT], [0.12, { hy: -0.62, hx: 1.0, sx: -0.2, nx: -0.3, lsx: -0.5, rsx: -0.5, lex: -0.3, rex: -0.3, lhx: -1.4, lkx: 2.2, rhx: -0.6, rkx: 1.6 }],
    [0.26, { hy: -0.4, hx: 0.4, sx: 0.4, lsx: -0.8, rsx: -0.8, lhx: -1.5, lkx: 2.1, rhx: -0.9, rkx: 1.7 }],
    [0.36, BASE.crouch], [0.5, BASE.stand[0]]], BASE.stand[0]),
};
function tryDodge() {
  const p = player;
  if (p.state === 'down') {
    if (!p.grounded || p.stateT < 0.32 || p.stateT > 1.4 || p.st < 10) return;
    p.st -= 10;
    const inp = moveInput();
    if (inp.x || inp.z) p.dodgeDir.set(inp.x, inp.z).normalize(); else p.dodgeDir.set(0, 0);
    p.clip = p.downClip === DOWN.front ? KIPUP.front : KIPUP.back;
    setState(p, 'kipup', 0.05); p.iframe = 0.55; p.anim.kick('hy', 2);
    sfx('whoosh'); showMove('受身 · 鲤鱼打挺', '#7dffb0'); burst(p.pos.clone().setY(0.2), 0xc9a27a, 10, 2.5);
    return;
  }
  // 翻滚可随时打断出招（含出招前摇/判定中），这是本作的核心取消手段
  const cancelAtk = p.state === 'attack' || p.state === 'staffCharge' || p.state === 'staffSpin';
  if (!(canAct(p) || cancelAtk || p.state === 'hit' && p.stateT > 0.18)) return;
  if (!p.grounded && (p.airDodge || 0) >= 1) return;
  if (!useStamina(Runes.has('sheep') ? 9 : 18)) return;
  if (cancelAtk) { p.move = null; p.staffTrace = null; p.chargeT = 0; p.chargeLv = 1; buffer.type = null; hitstop = 0; p.anim.kick('sx', -.6); if (p.state === 'attack') showMove('翻滚取消', '#9ff'); }
  const inp = moveInput();
  let dx = inp.x, dz = inp.z;
  if (!dx && !dz) { dx = -Math.sin(p.yaw); dz = -Math.cos(p.yaw); }
  p.dodgeDir.set(dx, dz).normalize();
  if (!p.grounded) { // 空中闪避：空翻 + 横向冲刺，每次腾空一次
    p.airDodge = (p.airDodge || 0) + 1; p.yaw = p.yawTarget = Math.atan2(dx, dz);
    p.clip = AIRFLIP; p.vy = Math.max(p.vy, 3.2); p.flipT = null;
    setState(p, 'dodge', 0.05); p.iframe = Runes.has('sheep') ? 0.5 : 0.36; p.move = null;
    if (!Foley.dodge(true)) sfx('whoosh'); burst(p.pos.clone().setY(p.pos.y + .9), 0xbfefff, 10, 2.5); refreshChips(); return;
  }
  const fwdRoll = p.view === 'third' && (inp.x || inp.z);
  if (fwdRoll) p.yaw = p.yawTarget = Math.atan2(dx, dz);
  p.clip = fwdRoll ? ROLL : DASH;
  setState(p, 'dodge', 0.06); p.iframe = Runes.has('sheep') ? 0.54 : 0.36; p.crouch = false; p.move = null;
  if (!Foley.dodge(false)) sfx('whoosh'); refreshChips();
}
function tryJump(buffered = false) {
  const p = player;
  if (cutscene || gameOver || !['loco', 'attack', 'block', 'parryHit', 'staffCharge', 'staffSpin'].includes(p.state)) { p.jumpUntil = -Infinity; return false; }
  if (!p.grounded) {
    // 二段跳：腾空后再按一次跳，带前空翻；出招中需过了可取消点
    const ok = !buffered && (p.airJumps || 0) < 1 && (p.state === 'loco' || p.state === 'attack' && p.mt >= p.move.cancel);
    if (!ok) { if (!buffered) p.jumpUntil = now + .15; return false; }
    p.airJumps = (p.airJumps || 0) + 1; p.jumpUntil = -Infinity; buffer.type = null; p.move = p.clip = null; p.staffTrace = null;
    setState(p, 'loco', .05); hitstop = 0;
    p.vy = (Runes.has('rooster') ? 8.2 : 7.2); p.flipT = 0; p.anim.kick('hy', -1);
    Foley.jump(true); burst(p.pos.clone().setY(p.pos.y + .2), 0xdff6ff, 12, 2.2); shock(p.pos.clone().setY(p.pos.y + .05), 0xcfefff, .5);
    refreshChips(); return true;
  }
  p.jumpUntil = -Infinity; buffer.type = null; p.move = p.clip = null;
  p.chargeT = 0; p.staffTrace = null; p.guard = false;
  setState(p, 'loco', .055); hitstop = 0;
  p.vy = Runes.has('rooster') ? 8.6 : 7.5; p.grounded = false; p.crouch = false;
  p.anim.kick('hy', -1.2); Foley.jump(false); refreshChips(); return true;
}
function moveInput() {
  if (cutscene) return { x: 0, z: 0 };
  let f = 0, r = 0;
  if (keys.KeyW) f++; if (keys.KeyS) f--; if (keys.KeyD) r++; if (keys.KeyA) r--;
  if (!f && !r) return { x: 0, z: 0 };
  const l = Math.hypot(f, r); f /= l; r /= l;
  const sy = Math.sin(camYaw), cy = Math.cos(camYaw);
  return { x: sy * f - cy * r, z: cy * f + sy * r };
}
function chooseMove(type) {
  const p = player, S = MOVES_STYLE[p.style];
  const wmv = weaponMove(type); if (wmv) return wmv;
  if (!p.grounded) return type === 'light' ? MOVES.airKick : S.heavyK;
  if (p.guard) return type === 'light' ? MOVES.counter : MOVES.push;
  if (p.crouch) {
    if (p.mode === 'fist') return type === 'light' ? MOVES.cjab1 : MOVES.cheavyF;
    return type === 'light' ? MOVES.sweep : MOVES.slide;
  }
  if (p.mode === 'fist') return type === 'light' ? S.jab1 : S.heavyF;
  return type === 'light' ? S.kick1 : S.heavyK;
}
function moveByName(n) { return MOVES_STYLE[player.style][n] || MOVES[n]; }
function findSoftTarget() {
  if (lockTarget) return lockTarget;
  let best = null, bd = 4.5;
  for (const e of enemies) {
    if (e.dead || e.hidden) continue;
    const dx = e.pos.x - player.pos.x, dz = e.pos.z - player.pos.z, d = Math.hypot(dx, dz);
    const a = Math.abs(angDiff(camYaw, Math.atan2(dx, dz)));
    if (d < bd && a < 1.3) { bd = d; best = e; }
  }
  return best;
}
// 为每个招式计算可取消点（最后一次判定后一点点）
function prepMove(m) { if (m.cancel == null) m.cancel = Math.min(0.92, m.hits[m.hits.length - 1] + 0.12); return m; }
function startMove(m) {
  prepMove(m);
  const cost = m.cost * STYLES[player.style].cost;
  if (!useStamina(cost)) return false;
  const p = player;
  const chained = p.state === 'attack';
  p.atkN = (p.atkN || 0) + 1; p.move = m; p.mt = 0; p.hitDone = m.hits.map(() => new Set());
  setState(p, 'attack', chained ? 0.07 : 0.09);
  const t = findSoftTarget();
  if (p.view === 'third') p.yawTarget = t ? Math.atan2(t.pos.x - p.pos.x, t.pos.z - p.pos.z) : camYaw;
  if (m.jump && p.grounded) { p.vy = m.jump; p.grounded = false; }
  let name = m.name;
  if (!m.wpn && !Object.values(MOVES).includes(m)) name = STYLES[p.style].key + '·' + name;
  if ((m === MOVES.counter || m === MOVES.push) && now - p.counterT < 1.5) name = '反击·' + name;
  if (m.wpn && p.weapon) name = WEAPONS[p.weapon.type].name + '·' + name;
  showMove(name, m.heavy ? STYLES[p.style].css : '#fff');
  if (!Foley.swing(m)) sfx('whoosh');
  return true;
}
function moveSpeed() { const m = player.move; let s = STYLES[player.style].spd; if (m && (m.wpn || m.low || m === MOVES.counter || m === MOVES.push)) s = 1 + (s - 1) * .5; if (Runes.has('rabbit')) s *= 1.1; return s; }
// 受击 / 格挡 小片段
const BLOCK_RECOIL = clip(0.3, [[0, BASE.parry], [0.06, Object.assign({}, BASE.parry, { hy: -0.2, sx: -0.25, lsx: -0.85, rsx: -0.85, lex: -2.1, rex: -2.1, nx: -0.2, lhx: -0.2, rhx: 0.5 })], [0.3, BASE.parry]], {});
const PARRY_DEFLECT = clip(0.35, [[0, BASE.parry], [0.07, Object.assign({}, BASE.parry, { rsx: -1.9, rsz: -1.1, rex: -0.4, sy: -0.55, lsx: -1.0, hry: -0.3 })], [0.2, Object.assign({}, BASE.parry, { rsx: -1.4, rsz: -0.8, rex: -0.8, sy: -0.3 })], [0.35, BASE.parry]], {});
function flinchClip(base, side) { // side: 0 前 1 后 2 左 3 右
  const off = [{ sx: -0.45, nx: -0.55, hy: -0.08, lsx: 0.25, rsx: 0.25, lex: -0.8, rex: -0.8, lhx: 0.15 }, { sx: 0.5, nx: 0.45, hy: -0.1, lsx: -0.9, rsx: -0.9 }, { sz: 0.5, ny: -0.5, hrz: -0.12, rsz: -0.6, lsz: 0.4, hy: -0.06 }, { sz: -0.5, ny: 0.5, hrz: 0.12, lsz: 0.6, rsz: -0.4, hy: -0.06 }][side];
  return clip(0.4, [[0, base], [0.07, Object.assign({}, base, off)], [0.2, Object.assign({}, base, Object.fromEntries(Object.entries(off).map(([k, v]) => [k, v * 0.5])))], [0.4, base]], {});
}
function hitSide(yaw, fromX, fromZ, x, z) {
  const rel = angDiff(yaw, Math.atan2(fromX - x, fromZ - z));
  if (Math.abs(rel) < Math.PI / 4) return 0; if (Math.abs(rel) > Math.PI * 3 / 4) return 1; return rel > 0 ? 2 : 3;
}

function updatePlayer(dt) {
  const p = player, A = p.anim;
  if (cutscene) {
    buffer.type = null;
    p.vel.set(0, 0, 0); p.vy = 0; p.pos.y = 0; p.grounded = true;
    const target = A.target || (A.target = zeroPose());
    Object.assign(target, zeroPose(), BASE.stand[0]);
    A.update(target, dt);
    p.rig.root.position.copy(p.pos); p.rig.root.rotation.y = p.yaw;
    driveSkinPlayer(p, dt);
    return;
  }
  if (p.jumpUntil >= now && p.grounded) tryJump(true);
  p.stDelay -= dt; if (p.stDelay <= 0) p.st = Math.min(100, p.st + dt * (p.guard ? 12 : 28));
  if (Runes.has('horse') && p.state !== 'dead' && p.hp > 0) p.hp = Math.min(p.maxHp, p.hp + 1.5 * dt);
  p.iframe -= dt; p.comboT -= dt; if (p.comboT <= 0) p.combo = 0;
  p.stateT += dt;
  const inp = moveInput(), moving = !!(inp.x || inp.z);
  // 格挡（按住 Q）
  const wantGuard = !!keys.KeyQ && p.grounded;
  if (wantGuard !== p.guard && (p.state === 'loco' || p.state === 'block' || p.state === 'attack' && p.mt >= p.move.cancel)) {
    p.guard = wantGuard; if (p.guard) p.crouch = false;
    if (p.state === 'attack') setState(p, 'loco', 0.1);
    refreshChips();
  }
  // 按住轻击：棍花
  if (p.lmbHeld && now - p.lmbT > .28 && p.state !== 'staffSpin' && wcls() === 'staff' && tryStaffFlower()) buffer.type = null;
  // 输入缓冲
  const inputWindow = p.state === 'attack' && (p.move?.staff || p.move?.blade) ? .6 : .35;
  if (buffer.type && now - buffer.t > inputWindow) buffer.type = null;
  if (buffer.type && canAct(p)) {
    const type = buffer.type; buffer.type = null;
    let m = chooseMove(type);
    if (p.state === 'attack') {
      const cur = p.move;
      if (type === 'light' && (cur.nextM || cur.next) && !cur.heavy) m = cur.nextM || moveByName(cur.next);
      else if (type === 'light' && !cur.nextM && !cur.next && !cur.heavy) m = null; // 连段结束，等收招
      else if (type === 'heavy' && cur.heavy) m = null;
    }
    if (m) startMove(m); else if (type === 'light') { buffer.type = type; buffer.t = now - 0.2; }
  }
  // 平滑姿态基准
  const standBase = p.weapon && p.mode === 'fist' ? BASE.weapon : BASE.stand[p.style];
  const baseT = p.guard ? BASE.parry : p.crouch ? BASE.crouch : standBase;
  approachPose(p.baseSm, baseT, dt, 11);
  const target = A.target || (A.target = zeroPose());
  if (p.state === 'loco') {
    const run = (keys.ShiftLeft || keys.ShiftRight) && !p.crouch && !p.guard;
    let spd = p.crouch ? 1.7 : p.guard ? 2.0 : run ? 6.3 : 3.4;
    if (Runes.has('rabbit')) spd *= 1.15;
    if (p.style === 1 && !p.guard) spd *= run ? 1.2 : 1.15; // 灵蛇：走跑更快
    if (run && moving) { p.st -= dt * 6; p.stDelay = 0.3; if (p.st <= 0) spd = 3.4; }
    const acc = 1 - Math.exp(-dt * (moving ? 10 : 12));
    p.vel.x = lerp(p.vel.x, moving ? inp.x * spd : 0, acc); p.vel.z = lerp(p.vel.z, moving ? inp.z * spd : 0, acc);
    if (p.view === 'third') {
      if (lockTarget) p.yawTarget = Math.atan2(lockTarget.pos.x - p.pos.x, lockTarget.pos.z - p.pos.z);
      else if (moving) p.yawTarget = Math.atan2(inp.x, inp.z);
    }
    const vmag = Math.hypot(p.vel.x, p.vel.z);
    // 锁定时横移：按相对朝向的前进速度驱动步伐
    p.walkPh += dt * (vmag * 3.4);
    { const n = Math.floor(p.walkPh / Math.PI); if (n !== p._stepN) { p._stepN = n; if (p.grounded && vmag > 1.2) { Foley.step(vmag); p.noise = Math.max(p.noise || 0, p.crouch ? 0 : vmag > 5 ? 9 : 4); } } }
    locoPose(target, p.baseSm, vmag, p.walkPh, { crouch: p.crouch, noArmSwing: p.guard });
    if (p.style === 2 && !p.guard && !p.crouch) { target.hrz += Math.sin(now * 1.7) * 0.1; target.sz += Math.sin(now * 1.7 + 1) * 0.13; target.nx += Math.sin(now * 2.3) * 0.08; }
    if (p.style === 1 && !p.guard && !p.crouch) { target.lsy += Math.sin(now * 2.5) * 0.25; target.rsy += Math.sin(now * 2.5 + 2) * 0.25; }
    if (p.flipT != null) { p.flipT += dt; if (p.flipT > .52) p.flipT = null; }
    if (!p.grounded) { const up = clamp(p.vy / 7, -1, 1); target.lhx = -0.9 - up * 0.3; target.lkx = 1.5 + up * 0.4; target.rhx = -0.3; target.rkx = 1.1; target.lsx -= 0.4 * up; target.rsx -= 0.4 * up; }
    p.yaw += angDiff(p.yaw, p.yawTarget) * (1 - Math.exp(-dt * 13));
  } else if (p.state === 'staffCharge') {
    staffChargeTick(p, dt);
    // 龙形/灵蛇可边走边蓄力（醉棍是插地立棍，原地蓄）
    if (p.style !== 2 && moving) {
      const acc = 1 - Math.exp(-dt * 9), spd = 2.3;
      p.vel.x = lerp(p.vel.x, inp.x * spd, acc); p.vel.z = lerp(p.vel.z, inp.z * spd, acc);
      if (p.view === 'third') p.yawTarget = lockTarget ? Math.atan2(lockTarget.pos.x - p.pos.x, lockTarget.pos.z - p.pos.z) : Math.atan2(inp.x, inp.z);
      p.yaw += angDiff(p.yaw, p.yawTarget) * (1 - Math.exp(-dt * 8));
      p.walkPh += dt * Math.hypot(p.vel.x, p.vel.z) * 3.4;
    } else p.vel.multiplyScalar(Math.exp(-dt * 15));
    Object.assign(target, p.baseSm);
  } else if (p.state === 'staffSpin') {
    staffFlowerTick(p, dt);
    Object.assign(target, p.baseSm);
  } else if (p.state === 'attack') {
    const m = p.move, ms = moveSpeed(), step = dt / (m.dur / ms);
    p.mt += step;
    const t = Math.min(1, p.mt);
    sampleKeys(m.keys, t, target);
    // 出招前段快速转向目标
    if (p.view === 'first') p.yaw = p.yawTarget = camYaw;
    else if (t < m.hits[0]) p.yaw += angDiff(p.yaw, p.yawTarget) * (1 - Math.exp(-dt * 26));
    let ls = 0;
    if (m.lunge && t > m.lunge[0] && t < m.lunge[1]) ls = m.lunge[2] * Math.sin(Math.PI * (t - m.lunge[0]) / (m.lunge[1] - m.lunge[0])) * 1.3;
    const tgt = findSoftTarget();
    if (tgt && Math.hypot(tgt.pos.x - p.pos.x, tgt.pos.z - p.pos.z) < 1.0 + tgt.radius) ls = Math.min(ls, 0); // 贴身不再前冲
    p.vel.x = Math.sin(p.yaw) * ls; p.vel.z = Math.cos(p.yaw) * ls;
    if (m.pole) { // 立棍：撑上棍顶（无敌）→ 离棍扫踢 → 落地
      const y = t < .18 ? 0 : t < .42 ? .92 * staffEase((t - .18) / .24) : t < .82 ? .92 - .12 * Math.sin((t - .42) / .4 * Math.PI) : .92 * (1 - staffEase((t - .82) / .13));
      p.vy = (y - p.pos.y) / Math.max(dt, 1e-4) + 22 * dt; if (t > .14 && t < .7) p.iframe = Math.max(p.iframe, .06);
    }
    if (!m.staff) m.hits.forEach((ht, i) => { if (t >= ht && t - step < ht + 0.001) playerHitCheck(m, i); });
    // 收招阶段可被移动打断
    if (t >= m.cancel + 0.08 && moving && !buffer.type) setState(p, 'loco', 0.2);
    else if (p.mt >= 1 || (m.air && p.grounded && p.mt > 0.3)) setState(p, 'loco', 0.18);
  } else if (p.state === 'dodge') {
    const c = p.clip, t = p.stateT / c.dur;
    const sp = 10 * Math.pow(1 - Math.min(1, t), 1.3) + 0.5;
    p.vel.x = p.dodgeDir.x * sp; p.vel.z = p.dodgeDir.y * sp;
    sampleKeys(c.keys, Math.min(1, t), target);
    if (t >= 1) { A.out.hx = wrap(A.out.hx); setState(p, 'loco', 0.16); }
  } else if (p.state === 'hit' || p.state === 'block' || p.state === 'parryHit') {
    p.vel.multiplyScalar(Math.exp(-dt * 7));
    sampleKeys(p.clip.keys, Math.min(1, p.stateT / p.clip.dur), target);
    if (p.stateT >= p.clip.dur) setState(p, 'loco', 0.15);
  } else if (p.state === 'kipup') {
    const k = Math.min(1, p.stateT / p.clip.dur);
    const sp = 4.5 * (1 - k); p.vel.x = p.dodgeDir.x * sp; p.vel.z = p.dodgeDir.y * sp;
    p.iframe = Math.max(p.iframe, 0.05);
    sampleKeys(p.clip.keys, k, target);
    if (k >= 1) setState(p, 'loco', 0.12);
  } else if (p.state === 'stagger') {
    p.vel.multiplyScalar(Math.exp(-dt * 5));
    sampleKeys(p.clip.keys, Math.min(1, p.stateT / p.clip.dur), target);
    if (p.stateT >= p.clip.dur) setState(p, 'loco', 0.2);
  } else if (p.state === 'down' || p.state === 'dead') {
    p.vel.multiplyScalar(Math.exp(-dt * 3.5));
    let tt = p.stateT;
    if (p.state === 'dead') tt = Math.min(tt, 1.0);
    if (!p.grounded) { p.stateT = Math.min(p.stateT, 0.3); tt = p.stateT; }
    sampleKeys(p.downClip.keys, Math.min(1, tt / p.downClip.dur), target);
    if (p.state === 'down' && tt >= 0.36 && tt - dt < 0.36) { shake = Math.max(shake, 0.12); burst(p.pos.clone().setY(0.15), 0xc9a27a, 14, 3); }
    p.iframe = Math.max(p.iframe, p.state === 'down' ? 0.3 : 0);
    if (p.state === 'down' && p.grounded && tt >= 0.34 && tt - dt < 0.34) tip(isMac ? '按 Option(Alt) 快速起身' : '按 Alt 快速起身', 0.9);
    if (p.state === 'down' && tt >= p.downClip.dur) setState(p, 'loco', 0.15);
  }
  // 被动回血（类似使命召唤）：4 秒没掉血就自动快速回血，挨打立即中断
  if (p.hp < (p.prevHp ?? p.hp) - 0.01) p.hurtT = now;
  const regen = p.hp > 0 && p.state !== 'dead' && p.hp < p.maxHp && now - (p.hurtT ?? -99) > REGEN_DELAY;
  if (regen) {
    p.hp = Math.min(p.maxHp, p.hp + REGEN_RATE * dt);
    p.breathFx = (p.breathFx || 0) - dt;
    if (p.breathFx <= 0) { p.breathFx = 0.35; burst(p.pos.clone().setY(rand(0.4, 1.4)), 0x7dffb0, 3, 1); }
  }
  p.regen = regen; p.prevHp = p.hp;
  A.update(target, dt);
  // 物理
  const glide = Runes.has('rooster') && keys.Space && p.vy < 0 && !p.grounded && (p.state === 'loco' || p.state === 'attack');
  p.vy -= (glide ? 5 : 22) * dt; if (glide) { p.vy = Math.max(p.vy, -2.2); if (Math.random() < 0.3) burst(p.pos.clone().setY(0.6), 0xffd04a, 2, 1); }
  p.pos.x += p.vel.x * dt; p.pos.z += p.vel.z * dt; p.pos.y += p.vy * dt;
  if (p.pos.y <= 0) {
    if (!p.grounded && p.vy < -4) { shake = Math.max(shake, 0.05); A.kick('hy', -1.5); A.kick('sx', 2); Foley.land(p.vy < -9); }
    p.pos.y = 0; p.vy = 0; p.grounded = true; p.airJumps = 0; p.airDodge = 0; p.flipT = null;
    if (p.jumpUntil >= now) tryJump(true);
  } else p.grounded = false;
  for (const e of enemies) {
    if (e.dead) continue;
    const dx = p.pos.x - e.pos.x, dz = p.pos.z - e.pos.z, d = Math.hypot(dx, dz), rr = 0.45 + e.radius;
    if (d < rr && d > 0.001) { const push = (rr - d); const w = e.T.poise ? 0.9 : 0.5; p.pos.x += dx / d * push * w; p.pos.z += dz / d * push * w; e.pos.x -= dx / d * push * (1 - w); e.pos.z -= dz / d * push * (1 - w); }
  }
  collideCircle(p.pos, 0.4);
  p.rig.root.position.copy(p.pos);
  p.rig.root.rotation.y = p.yaw;
  driveSkinPlayer(p, dt);
  if (p.state === 'attack' && p.move?.staff) staffHitCheck(p, dt);
}

function playerHitCheck(m, hi, staffTargets = null) {
  const p = player, st = STYLES[p.style];
  let range = m.range, dmgMul = st.dmg, sound = m.heavy ? 'heavy' : 'hit';
  if (m.shockW && hi === 0) { const sp = p.pos.clone(); sp.y = 0.1; sp.x += Math.sin(p.yaw) * 1.2; sp.z += Math.cos(p.yaw) * 1.2; shock(sp, st.color, 2.2); burst(sp, 0xc9a27a, 18, 4); shake = Math.max(shake, 0.25); }
  if (m.wpn && p.weapon) { const w = WEAPONS[p.weapon.type]; range += w.range; dmgMul *= w.dmg; if (w.sound === 'clang') sound = 'clang'; }
  if (Runes.has('ox')) dmgMul *= 1.2;
  if (p.style === 0) dmgMul *= 1 + Math.min(p.combo, 20) * 0.02; // 龙威：连击越多伤害越高
  const counter = now - p.counterT < 1.5 && (m === MOVES.counter || m === MOVES.push || m.heavy);
  if (counter) dmgMul *= 2.2;
  const sneak = sneakBonus(); if (sneak) { dmgMul *= 1.8; showMove('蛇隐暗袭！', '#4be37a'); }
  let any = false, killN = 0, armorN = 0, hitPos = null;
  for (const e of enemies) {
    if (e.dead || p.hitDone[hi].has(e)) continue;
    const dx = e.pos.x - p.pos.x, dz = e.pos.z - p.pos.z;
    const d = Math.hypot(dx, dz) - e.radius;
    if (staffTargets ? !staffTargets.has(e) : d > range) continue;
    if (!staffTargets && Math.abs(e.pos.y - p.pos.y) > 1.6) continue;
    const a = Math.abs(angDiff(p.yaw, Math.atan2(dx, dz)));
    if (!staffTargets && m.arc < Math.PI && a > m.arc) continue;
    p.hitDone[hi].add(e); any = true;
    const dmg = Math.round(m.dmg * dmgMul * rand(0.9, 1.1));
    const kbDir = new THREE.Vector2(dx, dz).normalize();
    const armored = e.T.poise && !counter && !m.heavy && !m.guardBreak && e.state !== 'down';
    e.takeHit(dmg, kbDir, m, st.kb * (m.heavy ? 1 : 0.7) * (Runes.has('ox') ? 1.3 : 1), counter);
    if (e.dead) killN++; else if (armored) armorN++;
    if (p.style === 1) p.st = Math.min(100, p.st + (m.heavy ? 8 : 4)); // 灵蛇：偷体力
    const hp = e.pos.clone(); hp.y += m.low ? 0.45 : 1.25 * e.scale; hitPos = hitPos || hp;
    burst(hp, m.heavy || counter ? st.color : 0xfff1b0, m.heavy ? 26 : 14, m.heavy ? 7 : 4.5);
    if (m.heavy || counter) shock(hp, st.color, 1.2);
    floatText(hp, dmg, counter ? '#4fd1ff' : m.heavy ? st.css : '#fff', m.heavy || counter ? 30 : 22);
    p.combo++; p.comboT = 2.2; gameEvent('hit', { e, dmg, m, counter });
    if (m.wpn && p.weapon && !(Runes.has('rat') && Math.random() < 0.5)) { p.weapon.dur--; if (p.weapon.dur <= 0) breakWeapon(); }
  }
  if (any && m.heavy && Runes.has('pig')) runeBeam();
  if (hi === m.hits.length - 1 && Runes.has('dragon') && !m.heavy && !m.next && !m.nextM && !m.air && (m.keys !== MOVES.counter.keys)) runeFire();
  if (any) {
    const wk = m.wpn && p.weapon ? (WEAPONS[p.weapon.type].kind || ['stick', 'umbrella', 'pan'][p.weapon.type]) : null;
    impact('hit', { heavy: !!m.heavy, mat: wk ? MAT[wk] : null, counter: counter || sneak, kill: killN > 0, armor: armorN > 0 && !killN, pos: hitPos, fallback: sound });
    // 停顿：重击/反击/击杀更长，打霸体更短更“弹手”
    hitstop = killN ? 0.11 : counter ? 0.1 : m.stop ?? (m.heavy ? 0.085 : armorN ? 0.025 : 0.045);
    if ((m.staff || m.blade) && hitPos) staffCamPunch(hitPos.clone().sub(p.pos).setY(0), m.heavy ? .06 : .03, m.fov || (m.heavy ? 2.5 : 1.2));
    if (m.blade) bladeOnHit(p, m);
    shake = Math.max(shake, killN ? 0.24 : m.heavy || counter ? 0.2 : 0.07);
    if (killN && !enemies.some(e => !e.dead && e.type !== 'dummy')) slowmo = Math.max(slowmo, 0.35); // 本波最后一击
    p.anim.kick('sx', m.heavy ? 1.5 : 0.8); // 打实的反作用
    refreshChips();
  }
}

function playerTakeHit(e, dmg, opts = {}) {
  const p = player, A = p.anim;
  if (p.state === 'dead' || cutscene) return;
  dmg = Math.max(1, Math.round(dmg * (STYLES[p.style].taken ?? 1)));
  const pos = p.pos.clone().setY(1.3);
  const side = hitSide(p.yaw, e.pos.x, e.pos.z, p.pos.x, p.pos.z);
  if (p.iframe > 0) {
    if (p.state === 'dodge' && p.stateT < (Runes.has('tiger') ? 0.37 : 0.25) && now - p.counterT > 1) {
      floatText(pos, '完美闪避!', '#9ff', 28); gameEvent('pdodge'); slowmo = 0.45; p.counterT = now; p.st = 100; floatText(pos.clone().setY(1.7), '体力全满', '#7dffb0', 18);
      showMove('完美闪避！ 重击可反击', '#9ff'); burst(pos, 0x9fffff, 20, 3);
    } else { floatText(pos, '闪避!', '#9ff'); if (p.state === 'dodge' && p.st < 100) { p.st = 100; floatText(pos.clone().setY(1.7), '体力全满', '#7dffb0', 18); } }
    return;
  }
  if (opts.high && p.crouch) { floatText(pos, '蹲闪!', '#9ff'); return; }
  if (p.state === 'staffSpin' && side === 0 && !opts.unblockable) { p.st -= dmg * .6; p.stDelay = .6; impact('block', { pos }); burst(pos, STAFF_STYLE_COL[p.style], 10, 3); floatText(pos, '棍花挡下!', STYLES[p.style].css, 22); const s = p.weapon?.mesh.userData.staff; if (s) { s.vx += 2; s.vy += 1.5; } if (p.st <= 0) { p.st = 0; setState(p, 'loco'); } return; }
  if (p.style === 2 && p.grounded && !p.guard && (p.state === 'loco' || p.state === 'hit' || p.state === 'attack') && Math.random() < 0.8) {
    // 醉步：80% 自动闪开（无冷却、不耗体力，出拳出腿时也能闪）
    p.drunkT = now; floatText(pos, '醉步闪避!', '#c889ff', 24);
    const ax = p.pos.x - e.pos.x, az = p.pos.z - e.pos.z, l = Math.hypot(ax, az) || 1, sd = Math.random() < .5 ? 1 : -1;
    p.dodgeDir.set((-az / l * sd + ax / l * 0.5), (ax / l * sd + az / l * 0.5)).normalize();
    p.clip = DASH; setState(p, 'dodge', 0.05); p.iframe = 0.3; p.move = null; sfx('whoosh');
    A.kick('sz', 6 * sd); A.kick('hrz', -3 * sd); burst(pos, 0xc889ff, 12, 3); return;
  }
  if (p.guard && side !== 1 && !opts.unblockable && (p.state === 'loco' || p.state === 'block' || p.state === 'parryHit')) {
    const kd = new THREE.Vector2(p.pos.x - e.pos.x, p.pos.z - e.pos.z).normalize();
    if (now - p.guardPress < (Runes.has('tiger') ? 0.33 : 0.22)) {
      floatText(pos, '完美格挡!', '#4fd1ff', 28); gameEvent('parry'); impact('parry', { pos }); shock(pos, 0x4fd1ff, 1.5); burst(pos, 0x4fd1ff, 30, 6);
      slowmo = 0.45; p.counterT = now; p.st = 100; floatText(pos.clone().setY(1.75), '体力全满', '#7dffb0', 18);
      e.parried(); showMove('完美格挡！ 立即反击', '#4fd1ff');
      p.clip = PARRY_DEFLECT; setState(p, 'parryHit', 0.04); A.kick('sy', -4);
      return;
    }
    p.st -= dmg * 1.2; p.stDelay = 0.8; impact('block', { pos }); burst(pos, 0xffffff, 8, 3);
    p.hp -= Math.round(dmg * 0.15); floatText(pos, '格挡', '#ddd');
    p.vel.set(kd.x * 3, 0, kd.y * 3);
    if (p.st <= 0) {
      p.st = 0; p.guard = false; refreshChips(); floatText(pos, '破防!', '#f55', 26);
      p.clip = clip(0.9, [[0, BASE.parry], [0.12, { sx: -0.6, nx: -0.5, hy: -0.15, lsx: -2.4, rsx: -2.4, lsz: 0.6, rsz: -0.6, lex: -0.3, rex: -0.3, lhx: 0.3, lkx: 0.5, rhx: -0.3, rkx: 0.4 }], [0.6, { sx: 0.3, hy: -0.25, nx: 0.3, lsx: -0.3, rsx: -0.3, lhx: -0.5, lkx: 0.8, rhx: 0.3, rkx: 0.6 }], [0.9, BASE.stand[0]]], BASE.stand[0]);
      setState(p, 'stagger', 0.05);
    } else { p.clip = BLOCK_RECOIL; setState(p, 'block', 0.04); A.kick('sx', -3); }
    hurtFx(0.3); return;
  }
  p.hp -= dmg; impact('hurt', { pos, heavy: dmg >= 15 }); hurtFx(1); floatText(pos, '-' + dmg, '#ff4b3a');
  shake = Math.max(shake, 0.18);
  const kd = new THREE.Vector2(p.pos.x - e.pos.x, p.pos.z - e.pos.z).normalize();
  p.move = null; p.combo = 0;
  if (p.hp <= 0 && Runes.has('dog') && now - Runes.dogCD > 60) {
    Runes.dogCD = now; p.hp = Math.round(p.maxHp * 0.3); p.iframe = 1.5;
    floatText(pos, '狗符 · 不死之身!', '#8cff7a', 30); shock(p.pos.clone().setY(0.1), 0x8cff7a, 2.5); burst(pos, 0x8cff7a, 40, 5); slowmo = 0.5;
  }
  if (p.hp <= 0 && MODE === 'dojo') { p.hp = p.maxHp; tip('练功房里不会倒下——血量已回满', 2); }
  if (p.hp <= 0) { p.hp = 0; p.downClip = side === 1 ? DOWN.front : DOWN.back; setState(p, 'dead', 0.05); p.vel.set(kd.x * 6, 0, kd.y * 6); gameEnd(false); return; }
  if (opts.kd) {
    p.downClip = side === 1 ? DOWN.front : DOWN.back; p.crouch = false; p.guard = false;
    setState(p, 'down', 0.05); p.vel.set(kd.x * 7, 0, kd.y * 7); p.vy = 3; p.pos.y = 0.01; p.grounded = false;
  } else {
    p.hitSide = side; p.hitN = (p.hitN || 0) + 1; p.clip = flinchClip(p.crouch ? BASE.crouch : p.baseSm, side); setState(p, 'hit', 0.04); p.vel.set(kd.x * 3.2, 0, kd.y * 3.2);
    A.kick(side < 2 ? 'sx' : 'sz', [-7, 7, 7, -7][side]); A.kick('nx', side === 0 ? -9 : 5);
  }
  refreshChips();
}
const REGEN_DELAY = 4, REGEN_RATE = 14;
function hurtFx(k) { $('vign').style.boxShadow = `inset 0 0 160px rgba(200,0,0,${0.7 * k})`; setTimeout(() => $('vign').style.boxShadow = 'inset 0 0 160px rgba(200,0,0,0)', 160); }
