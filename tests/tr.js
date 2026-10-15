const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CH, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const pg = await b.newPage({ viewport: { width: 1280, height: 720 } });
  const errs = []; pg.on('pageerror', e => errs.push(e.message)); pg.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 160)); });
  await pg.goto('file://' + require('path').resolve(__dirname, '../dist/index.html') + '?webgl'); await pg.waitForFunction(() => window.__game && window.__game.SKIN.ready, null, { timeout: 60000 });
  const ev = (f, a) => pg.evaluate(f, a);
  await ev(() => { const g = window.__game; document.getElementById('menu').classList.add('hide'); g.started = true; g.locked = true; g.Story.begin(1); for (let i = 0; i < 40; i++) { g.Story.next(); g.step(20); } g.step(60); });
  const out = await ev(() => {
    const g = window.__game, P = g.player, R = g.Runes, o = {};
    const far = () => g.enemies.forEach(e => { e.cd = 99; e.pos.set(P.pos.x + 9, 0, P.pos.z + 9); });
    far(); P.hp = 9999; g.step(60);
    // 跑速
    const runSpd = (s) => { g.setStyle(s); far(); g.keys.KeyW = true; g.keys.ShiftLeft = true; g.step(60); const v = Math.hypot(P.vel.x, P.vel.z); g.keys.KeyW = false; g.keys.ShiftLeft = false; g.step(30); return +v.toFixed(2); };
    o.run = [runSpd(0), runSpd(1), runSpd(2)];
    R.award('rabbit', 1); R.eq = ['rabbit', null, null]; o.runRabbit = runSpd(0); R.eq = [null, null, null];
    // 醉步自动闪避
    g.setStyle(2); far(); g.step(30); const e = g.enemies.find(e => !e.dead); let dodged = 0, n = 0;
    for (let i = 0; i < 60; i++) { P.drunkT = -9; P.iframe = 0; g.step(40); P.state = 'loco'; P.guard = false; e.pos.set(P.pos.x, 0, P.pos.z + 1.2); const hp0 = P.hp; g.playerTakeHit(e, 1, {}); n++; if (P.hp === hp0) dodged++; far(); }
    o.drunk = dodged + '/' + n;
    // 冷却：连续两次
    P.drunkT = -9; g.step(40); P.state = 'loco'; let c2 = 0; const R0 = Math.random; Math.random = () => 0.1; for (let i = 0; i < 2; i++) { P.iframe = 0; P.state = 'loco'; const h = P.hp; g.playerTakeHit(e, 1, {}); if (P.hp === h) c2++; } Math.random = R0; o.drunkCD = c2;
    // 蛇偷体力
    g.setStyle(1); far(); g.step(60); e.pos.set(P.pos.x + Math.sin(P.yaw) * 1.2, 0, P.pos.z + Math.cos(P.yaw) * 1.2); e.hp = 999; e.state = 'loco'; P.st = 50; const m = g.MOVES_STYLE[1].jab1; g.startMove(m); const st0 = P.st; let k = 0; while (P.state === 'attack' && k++ < 100) g.step(1); o.snake = [Math.round(st0), Math.round(P.st)];
    // 龙威
    g.setStyle(0); g.step(60); P.combo = 10; P.comboT = 5; o.dragonHud = document.getElementById('buffs').textContent;
    // 狗符
    R.award('dog', 1); R.eq = ['dog', 'pig', 'dragon']; R.owned.add('pig'); R.owned.add('dragon'); R.dogCD = -99; P.hp = 5; P.iframe = 0; P.state = 'loco'; g.setStyle(0); g.playerTakeHit(e, 50, {}); o.dog = [P.hp, P.state];
    // 猪符热光
    far(); g.step(80); const e2 = g.enemies.find(x => !x.dead); e2.pos.set(P.pos.x + Math.sin(P.yaw) * 5, 0, P.pos.z + Math.cos(P.yaw) * 5); e2.hp = 999; e2.state = 'loco'; const e1 = g.enemies.find(x => !x.dead && x !== e2); e1.pos.set(P.pos.x + Math.sin(P.yaw) * 1.2, 0, P.pos.z + Math.cos(P.yaw) * 1.2); e1.hp = 999; e1.state = 'loco';
    P.st = 100; g.startMove(g.MOVES_STYLE[0].heavyF); k = 0; while (P.state === 'attack' && k++ < 200) g.step(1); o.pig = 999 - e2.hp;
    // 龙火：连段最后一下
    e1.hp = 999; e1.state = 'loco'; e1.pos.set(P.pos.x + Math.sin(P.yaw) * 2.6, 0, P.pos.z + Math.cos(P.yaw) * 2.6); g.step(60); P.st = 100; g.startMove(g.MOVES_STYLE[0].hook); k = 0; while (P.state === 'attack' && k++ < 200) g.step(1); o.fire = 999 - e1.hp;
    R.eq = [null, null, null]; R.owned.clear(); R.save();
    // 双武器
    far(); g.step(60); g.spawnWeapon(0, P.pos.x, P.pos.z); g.pickupOrDrop(); g.step(10); g.spawnWeapon(6, P.pos.x, P.pos.z); g.pickupOrDrop(); g.step(10);
    o.w = [P.weapon && g.WEAPONS[P.weapon.type].name, P.weapon2 && g.WEAPONS[P.weapon2.type].name]; g.pickupOrDrop(); g.step(5); o.w.push(g.WEAPONS[P.weapon.type].name, g.WEAPONS[P.weapon2.type].name, document.getElementById('cWeapon').textContent);
    return o;
  });
  // 背包界面
  await ev(() => { const g = window.__game; g.Runes.award('rabbit', 1); g.Runes.award('ox', 1); g.Runes.award('tiger', 1); g.Runes.award('rooster'); });
  await pg.keyboard.press('Tab'); await pg.waitForTimeout(400);
  const bag1 = await ev(() => [window.__game.Bag.open, document.getElementById('bag').classList.contains('show')]);
  await pg.screenshot({ path: '/tmp/bag.png' });
  await pg.click('#bag [data-b="r:rooster"]'); const eq = await ev(() => window.__game.Runes.eq.join());
  await pg.keyboard.press('Tab'); await pg.waitForTimeout(200);
  const bag2 = await ev(() => window.__game.Bag.open);
  // 跑步截图
  const shots = [];
  for (const s of [0, 1, 2]) {
    await ev((s) => { const g = window.__game, P = g.player; g.started = true; g.locked = true; if (P.weapon) { P.weapon.mesh.removeFromParent(); P.weapon = null; } P.weapon2 = null; g.setStyle(s); g.enemies.forEach(e => { e.cd = 99; }); document.getElementById('hud').style.visibility = 'hidden'; document.getElementById('toast').style.display = 'none'; g.keys.KeyW = true; g.keys.ShiftLeft = true; g.setCam(0, -0.1); g.step(50); g.setCam(g.player.yaw + 1.5, -0.1); g.step(1, 0.0001); }, s);
    await pg.waitForTimeout(400); await pg.screenshot({ path: `/tmp/run${s}.png` }); shots.push(`/tmp/run${s}.png`);
    await ev(() => { const g = window.__game; g.keys.KeyW = false; g.keys.ShiftLeft = false; g.step(30); });
  }
  console.log(JSON.stringify(out), JSON.stringify({ bag1, eq, bag2 }), errs);
  await b.close();
})();
