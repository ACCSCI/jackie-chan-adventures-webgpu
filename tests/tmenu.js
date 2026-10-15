const { chromium } = require('/vercel/sandbox/node_modules/playwright');
const assert = require('node:assert/strict');
(async () => {
 const b = await chromium.launch({executablePath:process.env.CH,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--autoplay-policy=no-user-gesture-required']});
 const p=await b.newPage({viewport:{width:1280,height:720}}); const errs=[];p.on('pageerror',e=>errs.push(e.message));
 let navigations=0;p.on('framenavigated',f=>{if(f===p.mainFrame())navigations++;});
 await p.goto('file:///data/game/成龙历险记_WebGPU.html?webgl');
 await p.waitForFunction(()=>window.__game?.SKIN.ready,null,{timeout:90000});
 await p.evaluate(()=>window.__menuMarker='preserved');
 await p.locator('#mMain [data-a="fs"]').click();
 await p.waitForTimeout(500);assert.ok(await p.evaluate(()=>!!document.fullscreenElement));
 const fs=await p.evaluate(()=>document.fullscreenElement.tagName);
 for (const mode of ['new','dojo','ep2']) {
  await p.evaluate(a=>window.__game.Menu.act(a),mode);await p.waitForTimeout(100);
  await p.evaluate(()=>window.__game.Menu.act('menu'));await p.waitForTimeout(900);
  const state=await p.evaluate(()=>{const g=window.__game;return {marker:window.__menuMarker,fs:document.fullscreenElement?.tagName,started:g.started,cutscene:g.cutscene,enemies:g.enemies.length,wave:g.wave,menu:!document.getElementById('menu').classList.contains('hide'),voice:!!g.Voice.cur};});
  console.log(mode,state);assert.equal(state.fs,fs);assert.equal(state.marker,'preserved');assert.equal(state.started,false);assert.equal(state.cutscene,false);assert.equal(state.enemies,0);assert.equal(state.wave,-1);assert.ok(state.menu);assert.equal(state.voice,false);
 }
 await p.evaluate(()=>{const g=window.__game;g.Menu.act('dojo');g.Menu.act('restart');});
 assert.equal(await p.evaluate(()=>window.__game.enemies.filter(e=>e.type==='dummy').length),5);
 await p.evaluate(()=>{const g=window.__game;g.Menu.act('menu');g.Menu.act('new');g.Story.skip();});
 await p.waitForTimeout(700);
 console.log('restart story',await p.evaluate(()=>[window.__game.wave,window.__game.enemies.length,!!document.fullscreenElement]));
 await p.evaluate(()=>{const g=window.__game;window.__staleFade=false;g.Story.play([{fade:()=>window.__staleFade=true}],()=>{});g.Menu.act('menu');});
 await p.waitForTimeout(900);assert.equal(await p.evaluate(()=>window.__staleFade),false);
 await p.evaluate(()=>{const g=window.__game;g.Menu.act('new');g.Story.skip();g.player.hp=1;g.player.iframe=0;g.playerTakeHit(g.enemies[0],100,{});g.Menu.act('menu');});
 await p.waitForTimeout(2000);assert.equal(await p.evaluate(()=>document.getElementById('ov').style.display),'none');
 assert.equal(navigations,1);assert.deepEqual(errs,[]);console.log('PASS: fullscreen retained, no navigation, clean resets',errs);
 await b.close();process.exit(0);
})().catch(e=>{console.error(e);process.exit(1);});
