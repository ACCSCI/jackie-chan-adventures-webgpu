const { chromium } = require('/vercel/sandbox/node_modules/playwright');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CH, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] });
  const pg = await b.newPage({ viewport: { width: 1280, height: 720 } });
  const errs = []; pg.on('pageerror', e => errs.push(e.message)); pg.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 200)); });
  await pg.goto('file:///data/game/成龙历险记_WebGPU.html?webgl'); await pg.waitForFunction(() => window.__game && window.__game.SKIN.ready, null, { timeout: 90000 });
  await pg.waitForTimeout(1500);
  const ev = (f, a) => pg.evaluate(f, a);
  const st = () => ev(() => { const g = window.__game; return [g.cutscene, g.wave, g.AREA.name, g.enemies.filter(e => !e.dead && e.type !== 'dummy').map(e => e.type + (e.hidden ? '*' : '')).join()]; });
  const killAll = () => ev(() => { const g = window.__game; g.enemies.forEach(e => { if (e.type !== 'dummy' && !e.dead) e.die({ x: 0, y: 1 }); }); g.step(240); });
  console.log('chapters', await ev(() => [...document.querySelectorAll('#chList .eph')].map(e => e.textContent).join('|')));
  await ev(() => { const g = window.__game; document.getElementById('menu').classList.add('hide'); g.started = true; g.locked = true; g.player.maxHp = g.player.hp = 1e9; g.Story.begin(9); g.step(20); });
  await pg.waitForTimeout(800); await pg.screenshot({ path: '/tmp/m_shop.png' });
  await ev(() => { const g = window.__game; for (let i = 0; i < 10; i++) { g.Story.next(); g.Story.next(); g.step(30); } });
  await pg.waitForTimeout(1500); await ev(() => { const g = window.__game; g.Story.next(); g.Story.next(); g.step(40); });
  await pg.waitForTimeout(800); await pg.screenshot({ path: '/tmp/m_museum0.png' });
  await ev(() => { const g = window.__game; g.Story.skip(); g.step(60); }); console.log('w9', await st());
  await pg.waitForTimeout(600); await pg.screenshot({ path: '/tmp/m_w9.png' });
  // 展柜撞碎
  const cb = await ev(() => { const g = window.__game, c = g.cases[0], p = c.g.getWorldPosition(new g.player.pos.constructor()); const e = g.enemies.find(x => !x.dead); e.pos.set(p.x + 1.3, 0, p.z); e.knockDown({ x: -1, y: 0 }); e.vel.set(-6, 0, 0); for (let i = 0; i < 20; i++) g.step(1); return [c.broken, g.Story.mBroken]; });
  console.log('case', cb);
  await killAll(); await ev(() => { const g = window.__game; for (let i = 0; i < 4; i++) { g.Story.next(); g.Story.next(); g.step(30); } });
  await ev(() => { const g = window.__game; g.Story.skip(); g.step(60); }); console.log('w10', await st());
  // 隐身循环：等忍者隐身 → 伏击
  const sn = await ev(() => { const g = window.__game; g.enemies.forEach(e => { if (!e.dead && e.type !== 'sninja') e.die({ x: 0, y: 1 }); }); const n = g.enemies.filter(e => !e.dead); n.slice(1).forEach(e => e.die({ x: 0, y: 1 })); const e = n[0]; let hid = 0, strike = 0, vis = 0, steps0 = g.Impact.n; for (let i = 0; i < 900; i++) { g.step(1); if (e.hidden) hid++; if (e.sh && e.sh.mode === 'strike') strike++; if (e.rig.root.visible) vis++; } return { hid, strike, vis, hp: g.player.hp < 1e9, layers: g.Impact.n - steps0, mode: e.sh.mode }; });
  console.log('sninja', sn);
  await pg.screenshot({ path: '/tmp/m_w10.png' });
  // 打中隐身者 → 现形
  const rv = await ev(() => { const g = window.__game, e = g.enemies.find(x => !x.dead && x.type === 'sninja'); g.Stealth.vanish(e); const h = e.hp; e.takeHit(5, { x: 0, y: 1 }, { kb: 1 }, 1, false); return [h - e.hp, e.hidden, e.state, e.sh.mode]; });
  console.log('reveal', rv);
  await killAll(); await ev(() => { const g = window.__game; for (let i = 0; i < 12; i++) { g.Story.next(); g.Story.next(); g.step(30); } });
  await pg.waitForTimeout(600); await pg.screenshot({ path: '/tmp/m_chow.png' });
  await ev(() => { const g = window.__game; g.Story.skip(); g.step(30); }); console.log('w11', await st());
  const boss = await ev(() => { const g = window.__game, c = g.enemies.find(e => e.type === 'chow3'); g.enemies.forEach(e => { if (e !== c && !e.dead) e.die({ x: 0, y: 1 }); }); c.hp = c.maxHp * 0.45; let n0 = g.enemies.filter(e => !e.dead).length; for (let i = 0; i < 300; i++) g.step(1); return [c.raged, g.enemies.filter(e => !e.dead).map(e => e.type).join(), c.sh.mode]; });
  console.log('boss rage', boss);
  await pg.screenshot({ path: '/tmp/m_rage.png' });
  await killAll(); await ev(() => { const g = window.__game; for (let i = 0; i < 16; i++) { g.Story.next(); g.Story.next(); g.step(30); } }); await pg.waitForTimeout(2500);
  console.log('ov', await ev(() => [document.getElementById('ov').style.display, document.querySelector('#ov h2') && document.querySelector('#ov h2').textContent, localStorage.getItem('jc_snake2'), localStorage.getItem('jc_prog')]));
  await pg.screenshot({ path: '/tmp/m_ov.png' });
  // 蛇隐：完美闪避触发
  const sk = await ev(() => { const g = window.__game; g.Runes.award && g.Runes.award('snake', true); return [g.Runes.has('snake'), g.RUNES.find(r => r.key === 'snake').full]; });
  console.log('snake', sk);
  console.log(errs.slice(0, 10));
  await b.close(); process.exit(0);
})();
