const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CH, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const pg = await b.newPage({ viewport: { width: 960, height: 540 } });
  const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto('file://' + require('path').resolve(__dirname, '../dist/index.html') + '?webgl'); await pg.waitForFunction(() => window.__game && window.__game.SKIN.ready, null, { timeout: 60000 });
  const r = await pg.evaluate(() => {
    const g = window.__game, P = g.player; document.getElementById('menu').classList.add('hide'); g.started = true; g.locked = true; g.Story.begin(1); for (let i = 0; i < 40; i++) { g.Story.next(); g.step(20); } g.step(60);
    const far = () => g.enemies.forEach(e => { e.cd = 99; e.pos.set(P.pos.x + 9, 0, P.pos.z + 9); });
    P.hp = 99999; g.setStyle(2); far(); g.step(30); const e = g.enemies.find(e => !e.dead); const res = {};
    for (const mode of ['loco', 'fist', 'kick']) {
      let d = 0; const N = 100;
      for (let i = 0; i < N; i++) {
        far(); g.step(40); P.iframe = 0; P.guard = false; if (P.mode !== (mode === 'kick' ? 'kick' : 'fist')) g.toggleMode();
        if (mode !== 'loco') { P.st = 100; g.startMove(g.chooseMove('light')); g.step(2); }
        e.pos.set(P.pos.x, 0, P.pos.z + 1.2); const h = P.hp, st = P.state; g.playerTakeHit(e, 1, {}); if (P.hp === h) d++;
        if (i === 0) res[mode + '_state'] = st;
      }
      res[mode] = d + '/' + N;
    }
    return res;
  });
  console.log(JSON.stringify(r), errs); await b.close();
})();
