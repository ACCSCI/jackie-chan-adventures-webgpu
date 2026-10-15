const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CH, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const pg = await b.newPage({ viewport: { width: 1280, height: 720 } });
  const errs = []; pg.on('pageerror', e => errs.push(e.message)); pg.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 200)); });
  await pg.goto('file://' + require('path').resolve(__dirname, '../dist/index.html') + '?webgl'); await pg.waitForFunction(() => window.__game && window.__game.SKIN.ready, null, { timeout: 90000 });
  const ev = (f, a) => pg.evaluate(f, a);
  await ev(() => { const g = window.__game; g.started = true; g.locked = true; g.Dojo.begin(); });
  const r = await ev(() => { const g = window.__game, P = g.player, d = g.enemies.find(e => e.kind === 'atk'); P.pos.set(d.pos.x - 1.6, 0, d.pos.z); P.yaw = P.yawTarget = Math.PI / 2; const hp0 = P.hp; g.step(240); const hp1 = P.hp;
    // 完美格挡：在出手前一瞬按 Q
    let parried = 0; for (let k = 0; k < 400 && !parried; k++) { if (d.wind > 0.6 && d.wind < 0.66) { P.guard = true; P.guardPress = performance.now(); g.keys.KeyQ = true; } g.step(1); parried = g.Dojo.S.parry; }
    return { hp0, hp1, parried, stun: d.stun }; });
  console.log('atk', r);
  await ev(() => { const g = window.__game; g.keys.KeyQ = false; g.Dojo.summon(); g.step(60); });
  await pg.waitForTimeout(1200); await pg.screenshot({ path: '/tmp/d_spar.png' });
  console.log('spar', await ev(() => window.__game.enemies.filter(e => e.type !== 'dummy').map(e => e.type + ':' + e.state).join()));
  // KO 一个木人
  console.log('ko', await ev(() => { const g = window.__game, d = g.enemies.find(e => e.kind === 'post'); d.takeHit(400, { x: 0, y: -1 }, { name: 'x', heavy: 1 }, 1, false); g.step(30); const a = d.dead; g.step(120); return [a, d.dead, d.hp, g.Dojo.S.ko, g.Dojo.done.size]; }));
  console.log(errs.slice(0, 8));
  await b.close(); process.exit(0);
})();
