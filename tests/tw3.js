const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CH, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const pg = await b.newPage({ viewport: { width: 960, height: 540 } });
  const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto('file://' + require('path').resolve(__dirname, '../dist/index.html') + '?webgl'); await pg.waitForFunction(() => window.__game && window.__game.SKIN.ready, null, { timeout: 60000 });
  await pg.evaluate(() => { const g = window.__game, P = g.player; document.getElementById('menu').classList.add('hide'); g.started = true; g.locked = true; g.Dojo.start ? g.Dojo.start() : 0; g.step(30); g.spawnWeapon(7, P.pos.x, P.pos.z); g.pickupOrDrop(); g.step(5); g.setStyle(1); });
  await pg.keyboard.press('KeyK'); await pg.waitForTimeout(300);
  console.log(await pg.evaluate(() => document.getElementById('movesP').innerText));
  await pg.screenshot({ path: '/tmp/moves.png' });
  console.log(errs); await b.close();
})();
