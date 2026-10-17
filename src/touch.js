// ================= 手机 / 平板触控 =================
// 左半屏浮动摇杆、右半屏拖动视角、右下按键簇；触控下用“软锁定”代替鼠标指针锁定。
// 操作辅助（默认开）：出招自动吸附最近的敌人、自动转镜头跟随目标、格挡判定更宽、连按轻击自动接连招、Boss 战自动锁定。
const TOUCH = { on: QS.has('touch') || (!QS.has('notouch') && (matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 1 && !matchMedia('(pointer: fine)').matches)),
  assist: SETTINGS.assist !== false, stick: null, look: null, sx: 0, sz: 0, mag: 0 };
if (TOUCH.on) {
  document.documentElement.classList.add('touch');
  document.head.insertAdjacentHTML('beforeend', `<style>
html.touch #help,html.touch .chips,html.touch #gpu,html.touch #combatMode{display:none!important}
html.touch #styles{right:12px;bottom:auto;top:100px;transform:scale(.48);transform-origin:top right;opacity:.85}
@media (max-height:560px){#menu{align-items:flex-start;overflow-y:auto;-webkit-overflow-scrolling:touch}#menu .mpanel{padding:10px 0 24px}#menu h1{font-size:34px;letter-spacing:6px}#menu h2{font-size:14px}#menu .ep{margin-bottom:8px}
 .msub button,#pause button{margin:5px 0;padding:8px 14px;font-size:15px}.msub button small{font-size:11px}#pause .pbox{max-height:94vh;overflow-y:auto}}
#tpad{position:fixed;inset:0;z-index:4;touch-action:none;display:none;-webkit-user-select:none;user-select:none}
#tpad.on{display:block}
#tstick{position:fixed;width:128px;height:128px;margin:-64px 0 0 -64px;border-radius:50%;background:rgba(255,255,255,.08);border:2px solid rgba(255,255,255,.28);display:none;pointer-events:none;z-index:5}
#tstick b{position:absolute;left:50%;top:50%;width:56px;height:56px;margin:-28px 0 0 -28px;border-radius:50%;background:rgba(255,255,255,.35);box-shadow:0 0 12px rgba(0,0,0,.4)}
#tstick.run{border-color:rgba(255,211,77,.7)}
#tbtns{position:fixed;inset:0;pointer-events:none;z-index:6;display:none}
#tbtns.on{display:block}
#tbtns .tb{position:absolute;pointer-events:auto;touch-action:none;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-direction:column;
  font:700 14px "Noto Sans SC",sans-serif;color:#fff;background:rgba(14,14,20,.42);border:2px solid rgba(255,255,255,.32);text-shadow:0 1px 2px #000;-webkit-user-select:none;user-select:none}
#tbtns .tb small{font-size:9.5px;opacity:.7;font-weight:500}
#tbtns .tb.dn{background:rgba(255,211,77,.4);border-color:#ffd34d;transform:scale(.94)}
#tbtns .tb.big{font-size:19px;border-width:3px}
#tbtns .tb.sq{border-radius:10px}
#tbtns .tb.hot{border-color:#7dffb0;box-shadow:0 0 14px #7dffb0}
#tbtns .row{position:absolute;display:flex;gap:8px;pointer-events:none}
#tbtns .row .tb{position:relative}
#tskip{position:fixed;right:14px;top:12px;z-index:7;display:none;padding:8px 14px;border-radius:18px;background:rgba(0,0,0,.55);color:#fff;border:1px solid rgba(255,255,255,.35);font:600 13px "Noto Sans SC",sans-serif}
#tskip.on{display:block}
#trot{position:fixed;inset:0;z-index:99;background:#0b0b10;color:#fff;display:none;align-items:center;justify-content:center;flex-direction:column;font:600 17px "Noto Sans SC",sans-serif;gap:10px}
@media (orientation:portrait){html.touch #trot.need{display:flex}}
@media (max-height:500px){html.touch #hud .chips,html.touch .chips{transform:scale(.8);transform-origin:left bottom}}
</style>`);
  const R = (id, l, s, x) => `<div class="tb ${x || ''}" data-k="${id}" style="${s}">${l}</div>`;
  document.body.insertAdjacentHTML('beforeend', `<div id="tpad"></div><div id="tstick"><b></b></div>
<div id="tbtns">
 ${R('light', '轻击<small>连按出连招</small>', 'right:96px;bottom:62px;width:92px;height:92px', 'big')}
 ${R('heavy', '重击<small>按住蓄力</small>', 'right:18px;bottom:150px;width:70px;height:70px')}
 ${R('jump', '跳', 'right:18px;bottom:52px;width:66px;height:66px')}
 ${R('dodge', '闪避', 'right:200px;bottom:30px;width:64px;height:64px')}
 ${R('guard', '格挡<small>按住</small>', 'right:196px;bottom:110px;width:66px;height:66px')}
 ${R('use', 'E<small>拾取/互动</small>', 'right:112px;bottom:166px;width:58px;height:58px')}
 <div class="row" style="right:14px;top:56px">${R('lock', '锁定', 'width:50px;height:36px', 'sq')}${R('mode', '拳/腿', 'width:54px;height:36px', 'sq')}${R('style', '套路', 'width:50px;height:36px', 'sq')}${R('crouch', '蹲', 'width:42px;height:36px', 'sq')}${R('take', 'F 制伏', 'width:58px;height:36px', 'sq')}</div>
 <div class="row" style="left:12px;top:12px">${R('pause', '暂停', 'width:42px;height:36px', 'sq')}${R('bag', '背包', 'width:50px;height:36px', 'sq')}${R('map', '地图', 'width:50px;height:36px', 'sq')}${R('board', '滑板', 'width:50px;height:36px', 'sq')}${R('assist', '辅助：开', 'width:74px;height:36px', 'sq')}</div>
</div><div id="tskip">跳过剧情 ››</div><div id="trot" class="need"><div style="font-size:44px">⟲</div>请把手机横过来玩</div>`);
  { const f = document.querySelector('.mfoot'); if (f) f.textContent = '轻触按钮开始 · 游戏中点左上角「暂停」打开菜单 · 建议横屏全屏'; }
  const KD = (code, up) => dispatchEvent(new KeyboardEvent(up ? 'keyup' : 'keydown', { code, key: code, bubbles: true }));
  const MD = (button, up) => dispatchEvent(new MouseEvent(up ? 'mouseup' : 'mousedown', { button, bubbles: true }));
  const tap = code => { KD(code); KD(code, true); };
  // 软指针锁定
  const setLocked = v => {
    if (locked === v) return; locked = v;
    if (v) { $('pause').classList.remove('show'); return; }
    if (player.state === 'staffCharge') { setState(player, 'loco'); player.chargeT = 0; }
    player.lmbHeld = false; for (const k in keys) keys[k] = false; TOUCH.stick = null;
    if (started && !gameOver && !Bag.open && !WMap.open) Menu.pause();
  };
  const _rq = renderer.domElement.requestPointerLock.bind(renderer.domElement);
  renderer.domElement.requestPointerLock = function () { setLocked(true); try { if (!document.fullscreenElement && document.documentElement.requestFullscreen) document.documentElement.requestFullscreen({ navigationUI: 'hide' }).then(() => screen.orientation?.lock?.('landscape')).catch(() => { }); } catch (e) { } };
  const _ex = document.exitPointerLock.bind(document);
  document.exitPointerLock = function () { setLocked(false); };
  void _rq; void _ex;
  if (SETTINGS.hq === undefined && typeof setQuality === 'function') setQuality(false);
  const pad = $('tpad'), st = $('tstick'), knob = st.firstElementChild, btns = $('tbtns');
  pad.addEventListener('pointerdown', e => {
    e.preventDefault(); initAudio();
    if (cutscene) { Story.next(); return; }
    if (e.clientX < innerWidth * 0.42 && !TOUCH.stick) { TOUCH.stick = { id: e.pointerId, x: e.clientX, y: e.clientY }; st.style.left = e.clientX + 'px'; st.style.top = e.clientY + 'px'; st.style.display = 'block'; knob.style.transform = ''; }
    else if (!TOUCH.look) TOUCH.look = { id: e.pointerId, x: e.clientX, y: e.clientY, t: performance.now(), mv: 0 };
    pad.setPointerCapture(e.pointerId);
  });
  pad.addEventListener('pointermove', e => {
    const S = TOUCH.stick, L = TOUCH.look;
    if (S && S.id === e.pointerId) {
      let dx = e.clientX - S.x, dy = e.clientY - S.y; const l = Math.hypot(dx, dy), m = 56;
      if (l > m * 1.6) { S.x += dx / l * (l - m * 1.6); S.y += dy / l * (l - m * 1.6); st.style.left = S.x + 'px'; st.style.top = S.y + 'px'; dx = e.clientX - S.x; dy = e.clientY - S.y; } // 摇杆跟手
      const k = Math.min(1, Math.hypot(dx, dy) / m); const a = Math.atan2(dy, dx);
      TOUCH.sx = Math.cos(a) * k; TOUCH.sz = -Math.sin(a) * k; TOUCH.mag = k < 0.18 ? 0 : k;
      knob.style.transform = `translate(${Math.cos(a) * k * m}px,${Math.sin(a) * k * m}px)`; st.classList.toggle('run', k > 0.92);
    } else if (L && L.id === e.pointerId) {
      const dx = e.clientX - L.x, dy = e.clientY - L.y; L.x = e.clientX; L.y = e.clientY; L.mv += Math.abs(dx) + Math.abs(dy);
      mouseDX += dx * 2.2; mouseDY += dy * 1.6;
    }
  });
  const end = e => {
    if (TOUCH.stick && TOUCH.stick.id === e.pointerId) { TOUCH.stick = null; TOUCH.mag = 0; st.style.display = 'none'; }
    if (TOUCH.look && TOUCH.look.id === e.pointerId) { const L = TOUCH.look; TOUCH.look = null; if (L.mv < 12 && performance.now() - L.t < 250 && TOUCH.assist) { buffer.type = 'light'; buffer.t = now; } } // 右半屏轻点也算轻击
  };
  pad.addEventListener('pointerup', end); pad.addEventListener('pointercancel', end);
  // 按键
  const HOLD = { light: [() => MD(0), () => MD(0, true)], heavy: [() => MD(2), () => MD(2, true)], guard: [() => KD('KeyQ'), () => KD('KeyQ', true)] };
  const TAP = { jump: () => tap('Space'), dodge: () => tap('AltLeft'), use: () => tap('KeyE'), lock: () => tap('KeyR'), mode: () => tap('KeyX'), crouch: () => tap('KeyC'), take: () => tap('KeyF'),
    style: () => tap('Digit' + ((player.style + 1) % 3 + 1)), bag: () => tap('Tab'), map: () => tap('KeyM'), board: () => tap('KeyB'), pause: () => document.exitPointerLock(),
    assist: () => { TOUCH.assist = !TOUCH.assist; SETTINGS.assist = TOUCH.assist; saveSettings(); btns.querySelector('[data-k=assist]').textContent = '辅助：' + (TOUCH.assist ? '开' : '关'); } };
  btns.querySelectorAll('.tb').forEach(b => {
    const k = b.dataset.k;
    b.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); initAudio(); b.classList.add('dn'); b.setPointerCapture(e.pointerId); if (cutscene && k !== 'pause') { Story.next(); return; } if (HOLD[k]) HOLD[k][0](); else TAP[k] && TAP[k](); });
    const up = e => { if (!b.classList.contains('dn')) return; b.classList.remove('dn'); if (HOLD[k]) HOLD[k][1](); };
    b.addEventListener('pointerup', up); b.addEventListener('pointercancel', up);
  });
  btns.querySelector('[data-k=assist]').textContent = '辅助：' + (TOUCH.assist ? '开' : '关');
  $('tskip').addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); Story.skip(); });
  // 摇杆 → 模拟移动（有幅度，推到底自动疾跑）
  const _mi = moveInput;
  moveInput = function () {
    if (cutscene || !TOUCH.mag) return _mi();
    const f = TOUCH.sz, r = TOUCH.sx, sy = Math.sin(camYaw), cy = Math.cos(camYaw), k = TOUCH.mag;
    const l = Math.hypot(f, r) || 1; return { x: (sy * f - cy * r) / l * k, z: (cy * f + sy * r) / l * k };
  };
  // 每帧：显示/隐藏控件、疾跑、操作辅助
  const _up = updatePlayer;
  updatePlayer = function (dt) {
    keys.ShiftLeft = !!(TOUCH.mag > 0.92 && TOUCH.stick);
    const r = _up.apply(this, arguments); assistTick(dt); return r;
  };
  let uiT = 0;
  const _hud = updateHUD;
  updateHUD = function (dt) {
    const r = _hud.apply(this, arguments);
    if ((uiT -= dt) > 0) return r; uiT = 0.1;
    const play = started && locked && !gameOver && !Bag.open && !WMap.open;
    pad.classList.toggle('on', play || started && cutscene && locked); btns.classList.toggle('on', play && !cutscene); $('tskip').classList.toggle('on', play && cutscene);
    if (!play && TOUCH.stick) { TOUCH.stick = null; TOUCH.mag = 0; st.style.display = 'none'; }
    const tp = $('tip'); btns.querySelector('[data-k=use]').classList.toggle('hot', +tp.style.opacity > 0.5 && /按 ?E|E 键|按住 ?E/.test(tp.textContent));
    return r;
  };
  addEventListener('resize', () => { if (innerWidth > innerHeight) $('trot').classList.remove('need'); else $('trot').classList.add('need'); });
}
// 操作辅助（触控默认开启；键鼠也可用 ?assist 打开）
const ASSIST = { on: () => TOUCH.on ? TOUCH.assist : QS.has('assist'), magT: 0, mx: 0, mz: 0 };
function assistTick(dt) {
  if (!ASSIST.on() || cutscene || !started) return;
  const p = player;
  // 出招吸附：攻击开始时如果最近的敌人在 1.6–4.5 米内，快速滑步贴上去
  if (p.state === 'attack' && p.mt < 0.35 && p.move && !p.move.ring) {
    if (ASSIST.atk !== p.atkN) {
      ASSIST.atk = p.atkN; const t = findSoftTarget() || nearestFoe(4.5);
      if (t) { const dx = t.pos.x - p.pos.x, dz = t.pos.z - p.pos.z, d = Math.hypot(dx, dz); p.yawTarget = Math.atan2(dx, dz); p.yaw = lerpAngle(p.yaw, p.yawTarget, 0.6); if (d > 1.5) { ASSIST.magT = 0.14; const s = Math.min(d - 1.25, 2.6) / 0.14; ASSIST.mx = dx / d * s; ASSIST.mz = dz / d * s; } }
    }
    if (ASSIST.magT > 0) { ASSIST.magT -= dt; p.pos.x += ASSIST.mx * dt; p.pos.z += ASSIST.mz * dt; collideCircle(p.pos, 0.4); }
  } else ASSIST.magT = 0;
  // 镜头：没有拖动视角时缓慢转向最近的敌人（Boss 战自动锁定）
  if (TOUCH.on && !TOUCH.look && !lockTarget) {
    const boss = enemies.find(e => !e.dead && !e.hidden && (e.T?.elite || e.k === 'boss') && Math.hypot(e.pos.x - p.pos.x, e.pos.z - p.pos.z) < 16);
    if (boss) lockTarget = boss;
    else { const t = nearestFoe(9); if (t && !TOUCH.mag) camYaw += angDiff(camYaw, Math.atan2(t.pos.x - p.pos.x, t.pos.z - p.pos.z)) * (1 - Math.exp(-dt * 1.2)); }
  }
}
function nearestFoe(r) { let b = null, bd = r; for (const e of enemies) { if (e.dead || e.hidden) continue; const d = Math.hypot(e.pos.x - player.pos.x, e.pos.z - player.pos.z); if (d < bd) { bd = d; b = e; } } return b; }
function lerpAngle(a, b, k) { return a + angDiff(a, b) * k; }
{ // 辅助：格挡判定更宽（完美格挡窗口 +60%）
  const _pt = playerTakeHit;
  playerTakeHit = function (e, dmg, opts) { if (ASSIST.on() && keys.KeyQ && now - player.guardPress < 0.36 && now - player.guardPress >= 0.2) player.guardPress = now - 0.1; return _pt.apply(this, arguments); };
}
window.__touch = { TOUCH, ASSIST };
