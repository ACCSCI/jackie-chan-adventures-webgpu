const {chromium}=require('/vercel/sandbox/node_modules/playwright');
const assert=require('node:assert/strict');
(async()=>{
 const b=await chromium.launch({executablePath:process.env.CH,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--autoplay-policy=no-user-gesture-required']});
 const p=await b.newPage({viewport:{width:1280,height:720}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await p.goto('file:///data/game/成龙历险记_WebGPU.html?webgl');await p.waitForFunction(()=>window.__game?.SKIN.ready,null,{timeout:90000});await p.mouse.click(5,5);
 await p.waitForFunction(()=>{const I=window.__game.Impact;return Object.entries(I.want).every(([k,n])=>I.buf[k]&&I.buf[k].filter(Boolean).length===n)},null,{timeout:30000}).catch(()=>{});
 const r=await p.evaluate(()=>{
  const g=window.__game,I=g.Impact,out={};
  out.decoded=Object.fromEntries(Object.keys(I.want).map(k=>[k,I.buf[k].filter(Boolean).map(x=>+x.duration.toFixed(2))]));
  const kinds=[['hit',{}],['hit',{heavy:1}],['hit',{mat:'wood'}],['hit',{mat:'metal',heavy:1}],['hit',{mat:'blade'}],['hit',{armor:1}],['hit',{counter:1,kill:1,heavy:1}],['fall',{}],['block',{}],['parry',{}],['hurt',{}],['glass',{}],['break',{mat:'wood'}]];
  out.layers=kinds.map(([k,o])=>{const n=I.n;g.impact(k,o);return I.n-n;});
  // 真实战斗：第一波，打一个敌人
  g.started=true;g.locked=true;g.startWave(0);g.step(5);
  const e=g.enemies.find(x=>!x.dead);e.pos.set(g.player.pos.x,0,g.player.pos.z+1.2);g.player.yaw=0;
  const n0=I.n;g.startMove(g.MOVES_STYLE?g.chooseMove('light'):g.MOVES.j1);for(let i=0;i<40;i++)g.step(1);
  out.combatLayers=I.n-n0;out.hp=[e.hp,e.T.hp];
  return out;
 });
 console.log(JSON.stringify(r));
 assert.ok(r.layers.every(x=>x>=1));assert.deepEqual(errs,[]);
 await b.close();process.exit(0);
})().catch(e=>{console.error(e);process.exit(1)});
