const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CH, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const pg = await b.newPage({ viewport: { width: 960, height: 540 } });
  const errs = []; pg.on('pageerror', e => errs.push(e.message)); pg.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 160)); });
  await pg.goto('file://' + require('path').resolve(__dirname, '../dist/index.html') + '?webgl'); await pg.waitForTimeout(3000);
  const ev = (f, a) => pg.evaluate(f, a);
  await ev(() => { const g = window.__game; document.getElementById('menu').classList.add('hide'); g.started = true; g.locked = true; g.Story.begin(); });
  const shot = async (n, steps = 90) => { await ev(s => window.__game.step(s), steps); await pg.waitForTimeout(1500); await pg.screenshot({ path: `/data/game/v2/s_${n}.png` }); };
  const nxt = () => ev(() => { const S = window.__game.Story; S.next(); S.next(); });
  await shot('a0');
  for (let i = 1; i <= 12; i++) { await nxt(); if (i===4||i===8||i===9||i===12) await shot('a' + i); else await ev(() => window.__game.step(30)); }
  await nxt(); await ev(() => window.__game.step(60));
  let info = await ev(() => { const g = window.__game; return { cs: g.cutscene, wave: g.wave, en: g.enemies.length, area: g.AREA.name }; });
  console.log('after intro', info);
  await shot('fight', 120);
  // 测试倒地快速起身
  const kd = await ev(() => { const g = window.__game, P = g.player, e = g.enemies[0]; P.iframe = 0; P.guard = false; g.playerTakeHit(e, 5, { kd: 1 }); g.step(40); const s0 = P.state; g.tryDodge(); const s1 = P.state; g.step(40); return [s0, s1, P.state]; });
  console.log('kipup', kd);
  // 击杀全部
  await ev(() => { const g = window.__game; g.enemies.forEach(e => { e.hp = 1; e.die({ x: 0, y: 1 }); }); g.step(200); });
  info = await ev(() => ({ cs: window.__game.cutscene, broken: window.__game.Story.broken }));
  console.log('after clear', info);
  await shot('b0', 10);
  for (let i = 0; i < 6; i++) { await nxt(); await ev(() => window.__game.step(40)); await pg.waitForTimeout(800); }
  await shot('b6', 30);
  for (let i = 0; i < 6; i++) { await nxt(); await ev(() => window.__game.step(40)); }
  info = await ev(() => { const g = window.__game; return { cs: g.cutscene, wave: g.wave, en: g.enemies.length, area: g.AREA.name, p: g.player.pos.toArray() }; });
  console.log('street', info); await shot('c0', 60);
  await ev(() => { const g = window.__game; g.enemies.forEach(e => { if (!e.dead) e.die({ x: 0, y: 1 }); }); g.step(200); });
  for (let i = 0; i < 5; i++) { await nxt(); await ev(() => window.__game.step(40)); }
  await shot('d5', 40);
  for (let i = 0; i < 5; i++) { await nxt(); await ev(() => window.__game.step(40)); }
  info = await ev(() => { const g = window.__game; return { cs: g.cutscene, wave: g.wave, en: g.enemies.map(e => e.type).join() }; });
  console.log('boss', info);
  await ev(() => { const g = window.__game; g.enemies.forEach(e => { if (!e.dead) e.die({ x: 0, y: 1 }); }); g.step(200); });
  for (let i = 0; i < 2; i++) { await nxt(); await ev(() => window.__game.step(40)); }
  await shot('e2', 40);
  for (let i = 0; i < 6; i++) { await nxt(); await ev(() => window.__game.step(40)); }
  await pg.waitForTimeout(2500);
  for (let i = 0; i < 12; i++) { await nxt(); await ev(() => window.__game.step(40)); await pg.waitForTimeout(150); }
  console.log('dock', await ev(() => { const g = window.__game; return [g.cutscene, g.wave, g.AREA.name, g.enemies.filter(e => !e.dead).map(e => e.type).join()]; }));
  console.log(errs);
  await b.close(); process.exit(0);
})();
