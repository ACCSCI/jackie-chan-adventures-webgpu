(() => {
 const g=window.__game,p=g.player,E=window.__ep5,checks=[];
 const check=(name,pass,detail)=>{checks.push({name,pass,detail});if(!pass)throw Error(JSON.stringify(checks));};
 const F=n=>{for(let i=0;i<n;i++){if(g.cutscene)g.Story.skip();p.st=100;p.hp=p.maxHp||100;g.step(1);}};
 g.Story.begin(18);F(40);
 check('chapter 18 on the cliff path',g.AREA.name==='snow'&&g.wave===18,g.AREA.name+g.wave);
 const live=()=>g.enemies.filter(e=>!e.dead&&e.type!=='dummy'&&!e.beast);const a=live()[0];a.pos.set(E.SN.x+4.6,0,p.pos.z-2);a.takeHit(1,{x:1,y:0},{kb:6},1,false);E.updateSnow(1/60);
 check('knocked off the cliff = instant KO',a.dead&&!!a.cliff,[a.type,a.state,a.vel.x,a.pos.x-E.SN.x,g.AREA.hx]);
 const b=live()[0];b.pos.set(E.SN.x+4.5,0,p.pos.z-3);b.state='loco';E.SNOW.gusts.push({z:b.pos.z,w:5,t:0});E.updateSnow(1/60);
 check('gust blows enemies over the edge',b.dead&&!!b.cliff);
 g.Story.begin(19);F(40);
 const t=g.enemies.find(e=>e.type==='tohru5');
 check('chapter 19 spawns Tohru at the bell temple',g.AREA.name==='bell'&&!!t);
 t.pos.set(E.BT.x+0.6,0,E.BT.z);t.setState('loco');E.BELL.state='drop';E.bellLand();
 check('bell traps Tohru',t.state==='trap'&&E.BELL.state==='down');
 const hp=t.hp;t.takeHit(30,{x:0,y:1},{kb:1},1,false);
 check('trapped Tohru takes no damage',t.hp===hp);
 for(let i=0;i<260;i++)E.updateBell(1/60);
 check('bell lifts and Tohru is dazed (x1.8)',t.state==='stun'&&Math.abs(t.dmgMul()-1.8)<1e-6&&t.rig.root.visible,t.state);
 g.Story.begin(20);F(40);
 const d=g.enemies.find(e=>e.type==='darkj');
 check('chapter 20 spawns the dark Jackie',g.AREA.name==='yy'&&!!d&&E.YYS.on);
 E.YYS.rec.length=0;for(let i=0;i<3;i++){p.state='loco';p.move=null;g.startMove(g.MOVES_STYLE[0].jab1);g.step(30);}
 check('player moves are recorded for mirroring',E.YYS.rec.length>=3,E.YYS.rec);
 E.YYS.b=0;check('balanced = x1.25',E.yyMul()===1.25);E.YYS.b=0.9;check('unbalanced = x0.35',E.yyMul()===0.35);E.YYS.b=0;
 return checks;
})()
