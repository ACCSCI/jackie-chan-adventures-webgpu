const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CH, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const pg = await b.newPage({ viewport: { width: 960, height: 540 } });
  const errs = []; pg.on('pageerror', e => errs.push(e.message)); pg.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 160)); });
  await pg.goto('file://' + require('path').resolve(__dirname, '../dist/index.html') + '?webgl'); await pg.waitForFunction(() => window.__game && window.__game.SKIN.ready, null, { timeout: 60000 });
  const ev = (f, a) => pg.evaluate(f, a);
  await ev(() => { const g = window.__game; document.getElementById('menu').classList.add('hide'); g.started = true; g.locked = true; g.Story.begin(); for (let i = 0; i < 30; i++) { g.Story.next(); g.step(20); } g.step(60); g.enemies.forEach(e => { e.cd = 99; }); });
  const out = {};
  // 1. 全部武器招式跑一遍
  out.moves = await ev(() => {
    const g = window.__game, P = g.player, res = []; window.SETW = t => { if (P.weapon) { P.weapon.mesh.removeFromParent(); P.weapon = null; } g.groundWeapons.forEach(w => w.mesh.removeFromParent()); g.groundWeapons.length = 0; g.spawnWeapon(t, P.pos.x, P.pos.z, 999); g.pickupOrDrop(); g.step(5); };
    for (const [t, c] of [[0, 'staff'], [6, 'blade'], [2, 'short']]) {
      SETW(t);
      const list = []; g.WMOVES[c].forEach(s => list.push(...Object.values(s))); list.push(...Object.values(g.WSHARED[c]));
      for (const m of list) {
        g.enemies.forEach(e => e.cd = 99);
        const e = g.enemies.find(e => !e.dead); if (e) { e.pos.set(P.pos.x + Math.sin(P.yaw) * 1.3, 0, P.pos.z + Math.cos(P.yaw) * 1.3); e.hp = 999; e.state = 'loco'; e.t = 0; e.vy = 0; e.pos.y = 0; }
        g.step(80); P.st = 100; P.pos.y = 0; if (m.air) { P.vy = 6; P.grounded = false; g.step(3); }
        const hp0 = e ? e.hp : 0; const ok = g.startMove(m); let k = 0; while (P.state === 'attack' && P.move === m && k++ < 200) g.step(1);
        res.push(m.name + (ok ? '' : '!') + ':' + (e ? Math.round(hp0 - e.hp) : '-'));
      }
    }
    return res.join(' ');
  });
  // 2. chooseMove 映射
  out.choose = await ev(() => {
    const g = window.__game, P = g.player, r = [];
    SETW(4); g.step(80);
    for (let s = 0; s < 3; s++) { g.setStyle(s); r.push(g.chooseMove('light').name + '/' + g.chooseMove('heavy').name); }
    g.toggleMode(); r.push(g.chooseMove('light').name); g.toggleMode();
    r.push(document.getElementById('cWeapon').textContent, [...document.querySelectorAll('.sty .l')].map(e => e.textContent).join(','));
    if (P.weapon) g.pickupOrDrop(); g.step(5); g.groundWeapons.forEach(w => w.mesh.removeFromParent()); g.groundWeapons.length = 0; r.push(g.chooseMove('light').name, [...document.querySelectorAll('.sty .l')].map(e => e.textContent).join(','));
    return r;
  });
  // 3. 呼吸 & 完美格挡
  out.breath = await ev(() => {
    const g = window.__game, P = g.player; g.setStyle(0); g.enemies.forEach(e => { e.cd = 99; e.pos.set(P.pos.x + 9, 0, P.pos.z + 9); }); g.step(60); P.hp = 100; P.st = 10; g.keys.KeyF = true; g.step(120); const h = P.hp; g.keys.KeyF = false;
    P.st = 10; const e = g.enemies.find(e => !e.dead); g.keys.KeyQ = true; g.step(10); P.guardPress = performance.now() / 1000; P.guardPress = 1e9; g.playerTakeHit(e, 10, {}); const st1 = P.st; g.keys.KeyQ = false; g.step(60);
    return [Math.round(h), Math.round(st1), P.state];
  });
  // 4. 截图：扫堂腿转身 & 武器
  let n = 0; const shots = [];
  const shot = async (tag) => { const f = `/tmp/w_${n++}.png`; await pg.waitForTimeout(600); await pg.screenshot({ path: f }); shots.push([f, tag]); };
  for (const fr of [0.25, 0.45, 0.65]) {
    const r = await ev((fr) => { const g = window.__game, P = g.player; g.enemies.forEach(e => { e.cd = 99; e.pos.set(P.pos.x + 6, 0, P.pos.z + 6); }); g.step(60); if (!P.crouch) g.toggleCrouch(); g.step(30); P.st = 100; g.startMove(g.MOVES.sweep); let k = 0; while (P.mt < fr && k++ < 200) g.step(1); g.setCam(P.yaw + 1.3, -0.3); g.step(1, 0.0001); return 'sweep ' + P.mt.toFixed(2) + ' rotY ' + P.rig.inner.rotation.y.toFixed(2); }, fr);
    await shot(r);
  }
  await ev(() => { const g = window.__game; g.step(60); g.toggleCrouch(); g.step(30); });
  for (const t of [3, 4, 5, 6, 7, 8, 9, 1]) {
    const r = await ev((t) => { const g = window.__game, P = g.player; document.getElementById('hud').style.visibility = 'hidden'; g.enemies.forEach(e => { e.cd = 99; e.pos.set(P.pos.x + 9, 0, P.pos.z + 9); }); SETW(t); g.step(60); const m = g.chooseMove('light'); P.st = 100; g.startMove(m); let k = 0; while (P.mt < m.hits[0] && k++ < 200) g.step(1); g.setCam(P.yaw + 1.3, -0.12); g.step(1, 0.0001); return g.WEAPONS[t].name + ' ' + m.name; }, t);
    await shot(r);
  }
  // 地上的武器
  await ev(() => { const g = window.__game, P = g.player; g.step(60); if (P.weapon) { P.weapon.mesh.removeFromParent(); P.weapon = null; } g.toggleView(); P.yaw = 0; for (let t = 0; t < 10; t++) { const w = g.spawnWeapon(t, P.pos.x - 1.6 + (t % 5) * 0.8, P.pos.z + 1.3 + Math.floor(t / 5) * 0.9); } g.setCam(0, -0.85); g.step(1, 0.0001); g.groundWeapons.forEach((w, i) => w.mesh.rotation.y = Math.PI / 2); g.step(1, 0.0001); }); await shot('ground');
  console.log(JSON.stringify(out, null, 1)); console.log(JSON.stringify(shots), errs);
  await b.close();
})();
