// ================= 锁定 & 摄像机 =================
function toggleLock() {
  if (lockTarget) { lockTarget = null; return; }
  let best = null, bs = 1e9;
  for (const e of enemies) {
    if (e.dead || e.hidden) continue;
    const dx = e.pos.x - player.pos.x, dz = e.pos.z - player.pos.z, d = Math.hypot(dx, dz);
    const a = Math.abs(angDiff(camYaw, Math.atan2(dx, dz)));
    const s = d + a * 6; if (d < 18 && s < bs) { bs = s; best = e; }
  }
  lockTarget = best; if (!best) tip('附近没有可锁定的敌人', 1);
}
const camPos = new THREE.Vector3(0, 3, -10);
function updateCamera(dt) {
  const sens = 0.0024 * SETTINGS.sens;
  camYaw -= mouseDX * sens; camPitch -= mouseDY * sens; mouseDX = mouseDY = 0;
  if (cutscene && Story.camPos) {
    const k = Story.camSnap ? 1 : 1 - Math.exp(-dt * 3.5); Story.camSnap = false;
    camera.position.lerp(Story.camPos, k); Story.camLookCur.lerp(Story.camLook, k);
    camera.lookAt(Story.camLookCur); camera.fov = lerp(camera.fov, 52, k);
    if (shake > 0) { camera.position.x += rand(-1, 1) * shake * 0.3; camera.position.y += rand(-1, 1) * shake * 0.3; shake = Math.max(0, shake - dt * 1.2); }
    camera.updateProjectionMatrix(); camPos.copy(camera.position); $('lock').style.display = 'none'; return;
  }
  if (lockTarget && lockTarget.dead) lockTarget = null;
  const p = player;
  if (p.view === 'third') {
    camPitch = clamp(camPitch, -1.1, 0.55);
    if (lockTarget) {
      const want = Math.atan2(lockTarget.pos.x - p.pos.x, lockTarget.pos.z - p.pos.z);
      camYaw += angDiff(camYaw, want) * (1 - Math.exp(-dt * 6));
      camPitch = lerp(camPitch, -0.22, 1 - Math.exp(-dt * 4));
    }
    const h = 1.15 + p.rig.cur.hy * 0.7 + p.pos.y * 0.8;
    const tgt = new THREE.Vector3(p.pos.x, h + 0.35, p.pos.z);
    const fwd = new THREE.Vector3(Math.sin(camYaw) * Math.cos(camPitch), Math.sin(camPitch), Math.cos(camYaw) * Math.cos(camPitch));
    const right = new THREE.Vector3(-Math.cos(camYaw), 0, Math.sin(camYaw));
    const dist = 4.3;
    const want = tgt.clone().addScaledVector(fwd, -dist).addScaledVector(right, 0.55);
    want.y = Math.max(0.35, want.y);
    camPos.lerp(want, 1 - Math.exp(-dt * 14));
    if (AREA.room) { camPos.x = clamp(camPos.x, AREA.cx - AREA.hx + 0.25, AREA.cx + AREA.hx - 0.25); camPos.z = clamp(camPos.z, AREA.cz - AREA.hz + 0.25, AREA.cz + AREA.hz - 0.25); camPos.y = Math.min(camPos.y, AREA.h - 0.3); }
    camera.position.copy(camPos);
    camera.lookAt(tgt.clone().addScaledVector(right, 0.55).addScaledVector(fwd, 2));
    camera.fov = lerp(camera.fov, p.state === 'dodge' || (keys.ShiftLeft && Math.hypot(p.vel.x, p.vel.z) > 5) ? 72 : 65, 1 - Math.exp(-dt * 6));
  } else {
    camPitch = clamp(camPitch, -1.35, 1.35);
    if (lockTarget) {
      const want = Math.atan2(lockTarget.pos.x - p.pos.x, lockTarget.pos.z - p.pos.z);
      camYaw += angDiff(camYaw, want) * (1 - Math.exp(-dt * 6));
    }
    if (p.state !== 'down' && p.state !== 'dead') p.yaw = camYaw;
    const eye = 1.7 + p.rig.cur.hy;
    const fwd = new THREE.Vector3(Math.sin(camYaw) * Math.cos(camPitch), Math.sin(camPitch), Math.cos(camYaw) * Math.cos(camPitch));
    camera.position.set(p.pos.x + Math.sin(camYaw) * 0.22, p.pos.y + eye, p.pos.z + Math.cos(camYaw) * 0.22);
    if (p.state === 'down' || p.state === 'dead') camera.position.y = p.pos.y + 0.4;
    camera.lookAt(camera.position.clone().add(fwd));
    camera.fov = lerp(camera.fov, 78, 1 - Math.exp(-dt * 6));
  }
  if (shake > 0) {
    camera.position.x += rand(-1, 1) * shake * 0.3; camera.position.y += rand(-1, 1) * shake * 0.3;
    shake = Math.max(0, shake - dt * 1.2);
  }
  staffCamApply(dt);
  if (window.__camO) { camera.position.copy(window.__camO.p); camera.lookAt(window.__camO.l); camera.fov = window.__camO.fov || 45; } // 调试/截图用固定机位
  camera.updateProjectionMatrix();
  const le = $('lock');
  if (lockTarget) { const s = toScreen(lockTarget.pos.clone().setY(1.2 * lockTarget.scale)); le.style.display = s.vis ? 'block' : 'none'; le.style.left = s.x + 'px'; le.style.top = s.y + 'px'; }
  else le.style.display = 'none';
}

// ================= HUD 更新 =================
function updateHUD(dt) {
  $('hpb').classList.toggle('regen', !!player.regen); $('hpb').firstElementChild.style.width = (player.hp / player.maxHp * 100) + '%';
  $('stb').firstElementChild.style.width = Math.max(0, player.st) + '%';
  moveTimer -= dt; if (moveTimer <= 0) $('move').classList.remove('show');
  tipTimer -= dt; if (tipTimer <= 0 && tipTimer > -dt * 1.5) $('tip').style.opacity = 0;
  bannerTimer -= dt; if (bannerTimer <= 0) $('banner').classList.remove('show');
  const c = $('combo');
  if (player.combo >= 2) { c.style.opacity = 1; c.querySelector('.n').textContent = player.combo; } else c.style.opacity = 0;
  const b = []; if (player.style === 0 && player.combo >= 2) b.push(`龙威 +${Math.min(player.combo, 20) * 2}%`);
  if (Runes.has('dog')) b.push(now - Runes.dogCD > 60 ? '狗符就绪' : `狗符 ${Math.ceil(60 - (now - Runes.dogCD))}s`);
  if (now - player.counterT < 1.5) b.push('可反击!');
  $('buffs').textContent = b.join(' · ');
}

// ================= 初始化 & 主循环 =================
spawnWeapon(0, 6, 3); spawnWeapon(1, -7, 5); spawnWeapon(2, 3, -12); spawnWeapon(3, -12, -9); spawnWeapon(8, 9, -6);
refreshChips();
// 拖尾
const trails = [new Trail(), new Trail(), new Trail(), new Trail(), new Trail()];
const _a = new THREE.Vector3(), _b = new THREE.Vector3(), lastTip = [0, 0, 0, 0, 0].map(() => new THREE.Vector3());
function updateTrails(dt, gdt = dt) {
  updateStaffEchoes(gdt); updateStaffCracks(gdt);
  const r = player.rig, col = new THREE.Color(STYLES[player.style].color);
  const eff = [[r.lHand, r.lE], [r.rHand, r.rE], [r.lFoot, r.lK], [r.rFoot, r.rK], [player.weapon ? player.weapon.mesh : null, r.rHand]];
  eff.forEach(([tip, base], i) => {
    const t = trails[i]; t.color.copy(col);
    if (!tip) { t.push(_a.set(0, -99, 0), _a, false); return; }
    tip.getWorldPosition(_a); base.getWorldPosition(_b);
    if (i === 4 && player.weapon?.mesh.userData.staff) { const mesh = player.weapon.mesh, d = mesh.userData.staff; staffPoint(mesh, d.max, _a); staffPoint(mesh, d.min, _b); t.mesh.material.opacity = .35; }
    else if (i === 4) { t.mesh.material.opacity = 1; _b.copy(_a); const ext = new THREE.Vector3(0, 0, WEAPONS[player.weapon.type].len || 0.9).applyQuaternion(tip.getWorldQuaternion(new THREE.Quaternion())); _a.add(ext); _b.addScaledVector(ext, 0.4); }
    else _b.lerpVectors(_a, _b, 0.45);
    const spd = _a.distanceTo(lastTip[i]) / Math.max(dt, 1e-4); lastTip[i].copy(_a);
    const active = !cutscene && player.state === 'attack' && (!(player.move?.staff || player.move?.blade) || player.move.hits.some(h => Math.abs(player.mt - h) < .18));
    const on = active && spd > 5 && (player.view === 'third' || i > 1) && !(i === 4 && (player.weapon?.mesh.userData.staff || player.weapon?.mesh.userData.blade));
    t.mesh.visible = player.view === 'third' || i >= 2;
    t.push(_a, _b, on);
  });
}
// 预热：开局前把各角色/武器在镜头前渲染几帧，提前编译着色器，避免敌人第一次出场时卡顿
let warm = null;
SKIN.load.then(() => {
  if (!SKIN.ready) return;
  warm = new THREE.Group(); warm.userData.n = 0;
  ['thug', 'khan', 'tohru', 'uncle', 'jade'].forEach((n, i) => { const r = makeSkinRig(n, 1); if (n === 'khan') skKatana(r); r.root.position.set((i - 2) * 0.9, 0, 0); warm.add(r.root); });
  warm.scale.setScalar(0.4);
  WEAPONS.forEach((_, i) => { const w = weaponMesh(i); w.position.set(i * 0.3 - 1.4, 0.6, 0.3); warm.add(w); });
  { const f = new THREE.Mesh(FB_GEO, FB_MAT), h = new THREE.Mesh(FB_GEO, FB_HALO), f2 = new THREE.Mesh(FB_GEO, FB_MAT2); f.position.set(-1, 1.6, 0.3); f2.position.set(1, 1.6, 0.3); h.position.set(0, 1.6, 0.3); warm.add(f, h, f2); }
  TAL_MATS.forEach((m, i) => { const t = new THREE.Mesh(TAL_GEO, m); t.position.set(i * 0.5 - 0.5, 1.4, 0.3); warm.add(t); });
  scene.add(warm);
});
function warmTick() {
  if (!warm) return;
  const d = camera.getWorldDirection(new THREE.Vector3());
  warm.position.copy(camera.position).addScaledVector(d, 3); warm.position.y -= 0.5; warm.rotation.y = Math.atan2(-d.x, -d.z);
  if (++warm.userData.n > 6 || started) { scene.remove(warm); warm = null; }
}
const clock = new THREE.Timer();
function loop() {
  clock.update(); const rawDt = clock.getDelta(); let rdt = Math.min(0.05, rawDt); if (started) perfTick(rawDt);
  let dt = rdt;
  if (hitstop > 0) { hitstop -= rdt; dt = rdt * 0.05; }
  if (slowmo > 0) { slowmo -= rdt; dt *= 0.35; }
  if (started && locked && !gameOver || gameOver) {
    now += dt;
    updatePlayer(dt);
    if (cutscene) Story.idleEnemies(dt); else { enemies.forEach(e => e.update(dt)); updateWaves(dt); }
    updatePickups(dt);
    Story.update(dt);
  } else if (!started) {
    now += rdt; camYaw += rdt * 0.15;
    player.anim.update(locoPose(zeroPose(), BASE.stand[0], 0, 0), rdt); driveSkinPlayer(player, rdt);
  }
  updateCamera(rdt);
  updateTrails(rdt, started && locked && !gameOver || gameOver ? dt : 0);
  updateParts(dt); updateRings(dt); updateFloaters(rdt); updateHUD(rdt);
  warmTick(); updateBatchVis(); updateAreas(rdt);
  if (QS.has('nopost')) renderer.render(scene, camera); else pipeline.render();
}
renderer.onDeviceLost = (info) => {
  console.error('WebGPU device lost', info && info.message);
  if (!QS.has('webgl')) location.search = '?webgl';
};
renderer.init().then(() => {
  const gpu = renderer.backend && renderer.backend.isWebGPUBackend;
  $('gpu').textContent = gpu ? '渲染：WebGPU' : '渲染：WebGL2（浏览器不支持 WebGPU，已自动回退）';
  $('gpu').style.color = gpu ? '#7dffb0' : '#ffcf6a';
  renderer.setAnimationLoop(loop);
});
Menu.initialWeapons = groundWeapons.map(w => ({ type: w.type, x: w.pos.x, z: w.pos.z, dur: w.dur }));
window.__game = { SFX, sfx, Impact, impact, Stealth, cases, MU, get snakeAltar() { return snakeAltar; }, Voice, BGM, AudioBus, get AC() { return AC; }, fireballs, spawnFireballs, TP, player, enemies, startMove, MOVES, MOVES_STYLE, setStyle, toggleView, toggleCrouch, toggleMode, startWave, keys, get started() { return started; }, set started(v) { started = v; }, set locked(v) { locked = v; }, setCam(y, p) { camYaw = y; camPitch = p; }, buffer, playerTakeHit,
  step(n, dt = 1 / 60) { for (let i = 0; i < n; i++) { now += dt; updatePlayer(dt); if (cutscene) Story.idleEnemies(dt); else { enemies.forEach(e => e.update(dt)); updateWaves(dt); } updatePickups(dt); Story.update(dt); } updateCamera(dt); updateTrails(dt); },
  Story, Dojo, Menu, ETYPES, spawnTalisman, Runes, Bag, FS, RUNES, WMOVES, WSHARED, WEAPONS, chooseMove, weaponMove, groundWeapons, get MODE() { return MODE; }, get cutscene() { return cutscene; }, get wave() { return wave; }, AREA, tryDodge, tryJump, tryStaffCharge, releaseStaffCharge, equipMesh, STAFF_ECHOES, STYLES, staffPose, STAFF_POSES, staffSample, tryStaffFlower, STAFF_RIBBONS, STAFF_GHOSTS, STAFF_CRACKS, staffResetFx, staffGhost, BLADE_POSES, bladePose, pickupOrDrop, spawnWeapon, SKIN, makeSkinRig, set lock(v) { lockTarget = v; },
  get now() { return now; } };
