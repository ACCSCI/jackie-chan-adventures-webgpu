const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CH, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const pg = await b.newPage({ viewport: { width: 960, height: 540 } });
  const errs = []; pg.on('pageerror', e => errs.push(e.message)); pg.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 160)); });
  await pg.goto('file://' + require('path').resolve(__dirname, '../dist/index.html') + '?webgl'); await pg.waitForFunction(() => window.__game && window.__game.SKIN.ready, null, { timeout: 60000 });
  const ev = (f, a) => pg.evaluate(f, a);
  await ev(() => { const g = window.__game; document.getElementById('menu').classList.add('hide'); g.started = true; g.locked = true; g.Story.begin(); for (let i = 0; i < 30; i++) { g.Story.next(); g.step(20); } g.step(60); g.enemies.forEach(e => { e.cd = 99; }); document.getElementById('hud').style.visibility = 'hidden'; });
  let n = 0; const shots = [];
  const shot = async (tag) => { const f = `/tmp/c_${n++}.png`; await pg.waitForTimeout(700); await pg.screenshot({ path: f }); shots.push([f, tag]); };
  const mv = async (expr, frac = 0) => {
    const r = await ev(([ex, fr]) => { const g = window.__game, P = g.player; g.enemies.forEach(e => e.cd = 99); const m = eval(ex); if (P.state !== 'loco') g.step(60); P.st = 100; g.startMove(m); let k = 0; while (P.mt < m.hits[0] + fr && k++ < 200) g.step(1); g.setCam(P.yaw + 1.3, -0.12); g.step(1, 0.0001); return P.state + ' ' + P.mt.toFixed(2) + ' ' + m.name; }, [expr, frac]);
    await shot(r);
  };
  await mv('g.MOVES_STYLE[0].jab1'); await mv('g.MOVES_STYLE[0].jab2'); await mv('g.MOVES_STYLE[0].kick2'); await mv('g.MOVES_STYLE[0].kick3');
  await mv('g.MOVES_STYLE[0].heavyK'); await mv('g.MOVES_STYLE[0].heavyF'); await mv('g.MOVES.cheavyF');
  await ev(() => { const g = window.__game; g.step(60); g.toggleCrouch(); g.step(30); }); await mv('g.MOVES.cjab1'); await mv('g.MOVES.sweep');
  await ev(() => { const g = window.__game; g.step(60); g.toggleCrouch(); g.keys.KeyQ = true; g.keys.KeyW = true; g.step(40); g.setCam(g.player.yaw + 1.3, -0.12); g.step(1, 0.0001); }); await shot('guard walk');
  await ev(() => { const g = window.__game; g.keys.KeyQ = false; g.keys.KeyW = false; g.step(40); const P = g.player; g.spawnWeapon(0, P.pos.x, P.pos.z); g.pickupOrDrop(); g.step(10); }); await mv('g.MOVES.w1'); await mv('g.MOVES.w2');
  await ev(() => { const g = window.__game, P = g.player; g.step(60); g.tryDodge(); g.step(14); g.setCam(P.yaw + 1.3, -0.12); g.step(1, 0.0001); }); await shot('dodge');
  await ev(() => { const g = window.__game, P = g.player; g.step(60); P.iframe = 0; g.playerTakeHit(g.enemies.find(e => !e.dead), 1, { kd: 1 }); g.step(50); g.setCam(P.yaw + 1.3, -0.12); g.step(1, 0.0001); }); await shot('down');
  await ev(() => { const g = window.__game, P = g.player; g.step(90); P.hp = 9999; const e = g.enemies.find(e => !e.dead); e.cd = 0; e.pos.set(P.pos.x + 1.4, 0, P.pos.z); let k = 0; while (e.state !== 'attack' && k++ < 200) { e.cd = 0; g.step(1); } while (e.t < e.atk.hit && k++ < 400) g.step(1); g.setCam(Math.atan2(e.pos.x - P.pos.x, e.pos.z - P.pos.z) + 1.4, -0.1); g.step(1, 0.0001); }); await shot('enemy atk');
  await ev(() => { const g = window.__game; g.toggleView(); g.step(30); }); await shot('first person');
  console.log(JSON.stringify(shots), errs);
  await b.close();
})();
