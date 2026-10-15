const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CH, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const pg = await b.newPage({ viewport: { width: 960, height: 540 } });
  const errs = []; pg.on('pageerror', e => errs.push(e.message)); pg.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 160)); });
  await pg.goto('file://' + require('path').resolve(__dirname, '../dist/index.html') + '?webgl'); await pg.waitForFunction(() => window.__game && window.__game.SKIN.ready, null, { timeout: 60000 });
  const r = await pg.evaluate(() => {
    const g = window.__game, P = g.player; document.getElementById('menu').classList.add('hide'); g.started = true; g.locked = true; g.Story.begin(2); for (let i = 0; i < 40; i++) { g.Story.next(); g.step(20); } g.step(60);
    const out = [];
    g.enemies.forEach(x => { x.cd = 99; x.pos.set(P.pos.x + 8, 0, P.pos.z - 8); }); P.hp = 9999; g.step(90); const e = g.enemies.find(e => !e.dead); P.yaw = P.yawTarget = 0; e.pos.set(P.pos.x, 0, P.pos.z + 1.2);
    g.keys.KeyQ = true; g.step(10); P.st = 10; P.guardPress = 1e9; g.playerTakeHit(e, 10, {}); out.push('parry', Math.round(P.st), P.state, P.guard); g.keys.KeyQ = false; g.step(60);
    P.st = 10; P.guardPress = -9; g.keys.KeyQ = true; g.step(10); g.playerTakeHit(e, 10, {}); out.push('block', Math.round(P.st)); g.keys.KeyQ = false; g.step(60);
    P.st = 40; g.tryDodge(); g.step(2); out.push(P.state); g.playerTakeHit(e, 10, {}); out.push('pdodge', Math.round(P.st));
    g.step(60); P.st = 40; g.tryDodge(); g.step(18); out.push(P.state, P.iframe.toFixed(2)); g.playerTakeHit(e, 10, {}); out.push('dodge', Math.round(P.st), P.state);
    // 影武者掉刀
    const R = Math.random; Math.random = () => 0.1; out.push(g.MODE, g.enemies.map(e => e.k).join());
    for (const k of g.enemies) if (!k.dead && k.k === 'khan') { k.hp = 1; k.takeHit(50, { x: 1, y: 0 }, g.MOVES.push, 1, false); }
    Math.random = R; g.step(30);
    out.push('katanas', g.groundWeapons.filter(w => w.type === 6).length);
    return out;
  });
  console.log(JSON.stringify(r), errs); await b.close();
})();
