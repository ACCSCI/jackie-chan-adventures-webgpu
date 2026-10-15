const {chromium}=require('/vercel/sandbox/node_modules/playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
(async()=>{
 const lines=JSON.parse(fs.readFileSync('/data/game/audio/vibehub/lines.json','utf8'));
 const b=await chromium.launch({executablePath:process.env.CH,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--autoplay-policy=no-user-gesture-required']});
 const p=await b.newPage({viewport:{width:1280,height:720}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await p.goto('file:///data/game/成龙历险记_WebGPU.html?webgl');await p.waitForFunction(()=>window.__game?.SKIN.ready,null,{timeout:90000});await p.mouse.click(5,5);
 const results=await p.evaluate(async lines=>{
  const g=window.__game;g.SFX.prefetch();await Promise.all(Object.values(g.SFX.pending));
  const missing=lines.filter(l=>!g.Voice.has(l.who,l.text));
  const voices=await Promise.all(lines.map(async l=>{const b=await g.Voice.get(l.who+'|'+l.text);return {id:l.id,d:b.duration,rate:b.sampleRate};}));
  const bgm=await Promise.all(['menu','calm','battle','boss','temple','museum'].map(async n=>[n,(await g.BGM.get(n)).duration]));
  const sounds=Object.entries(g.SFX.cache).map(([k,v])=>[k,v.duration]);
  const before=g.SFX.plays;g.sfx('hit');g.sfx('fire');const played=g.SFX.plays-before;
  g.Menu.resetSession();const stopped=g.SFX.active.length===0;
  g.started=true;g.Story.toTemple();g.BGM.update(1.3);const temple=g.BGM.name;
  g.Menu.resetSession();g.Menu.act('dojo');g.BGM.update(1.3);const dojo=g.BGM.name;
  g.Menu.act('menu');
  return {missing,voices,bgm,sounds,played,stopped,temple,dojo};
 },lines);
 assert.deepEqual(results.missing,[]);assert.equal(results.voices.length,lines.length);assert.ok(results.voices.every(v=>v.d>0.15&&v.d<35));
 assert.equal(results.bgm.length,6);assert.ok(results.bgm.every(v=>v[1]>10));assert.equal(results.sounds.length,8);assert.ok(results.sounds.every(v=>v[1]>0.1&&v[1]<2));
 assert.equal(results.played,2);assert.ok(results.stopped);assert.equal(results.temple,'temple');assert.equal(results.dojo,'calm');assert.deepEqual(errs,[]);
 console.log(JSON.stringify({voiceLines:results.voices.length,totalSpeechSeconds:results.voices.reduce((s,v)=>s+v.d,0),bgm:results.bgm,sfx:results.sounds,played:results.played,temple:results.temple,dojo:results.dojo,errors:errs},null,2));
 await b.close();process.exit(0);
})().catch(e=>{console.error(e);process.exit(1)});
