(() => {
 const g=window.__game,p=g.player,checks=[];
 const check=(name,pass,detail)=>{checks.push({name,pass,detail});if(!pass)throw Error(JSON.stringify(checks));};
 const V=p.pos.constructor;
 const reset=()=>{p.state='loco';p.move=null;p.mt=0;p.vy=0;p.pos.y=0;p.grounded=true;p.airJumps=0;p.airDodge=0;p.flipT=null;p.guard=false;p.crouch=false;p.iframe=0;p.st=100;p.vel.set(0,0,0);g.buffer.type=null;for(const k in g.keys)g.keys[k]=false;p.pos.set(-170,0,3.2);};
 g.started=true;g.Dojo.begin();g.locked=false;
 if(p.weapon){p.weapon.mesh.removeFromParent();p.weapon=null;}p.mode='fist';p.style=0;reset();g.step(10);
 // double jump with a front flip
 g.tryJump();g.step(14);const y1=p.pos.y;check('first jump airborne',!p.grounded&&y1>.5,y1);
 check('second jump accepted',g.tryJump()===true&&p.flipT===0);
 let peak=0;for(let i=0;i<20;i++){g.step(1);peak=Math.max(peak,p.pos.y);}check('double jump climbs higher',peak>y1+.6,peak);
 check('no third jump',g.tryJump()===false);
 let land=0;while(!p.grounded&&land++<200)g.step(1);check('lands and resets air jumps',p.grounded&&p.airJumps===0&&p.flipT==null);
 // air dodge: one flip dash per airtime with i-frames
 reset();g.step(2);g.tryJump();g.step(12);g.keys.KeyW=true;const x0=p.pos.clone();g.tryDodge();
 check('air dodge starts a flip',p.state==='dodge'&&p.iframe>.3&&!p.grounded);
 g.step(12);check('air dodge carries the body',p.pos.clone().sub(x0).setY(0).length()>1.2);
 const st=p.st;p.state='loco';g.tryDodge();check('only one air dodge',p.state!=='dodge'||p.st===st);
 // roll cancels attacks at any point, even before the active frame
 reset();g.step(2);g.startMove(g.MOVES_STYLE?g.chooseMove('heavy'):g.MOVES.jab1);g.step(2);
 check('in heavy windup',p.state==='attack'&&p.mt<p.move.cancel);
 g.keys.KeyW=true;g.tryDodge();check('roll cancels the windup',p.state==='dodge'&&!p.move);
 // planted-staff kicks keep the shaft tip on the floor
 reset();p.weapon=g.equipMesh({type:0,dur:999});g.step(20);p.mode='kick';
 for(const k of ['KL1','KH']){reset();p.mode='kick';g.startMove(g.WSHARED.staff[k]);let low=9;const mesh=p.weapon.mesh,d=mesh.userData.staff;
  for(let i=0;i<14;i++){g.step(1);if(p.mt>.2&&p.mt<.36){const a=mesh.localToWorld(new V(0,0,d.max)),b=mesh.localToWorld(new V(0,0,d.min));low=Math.min(low,Math.min(a.y,b.y));}}
  check('staff planted on the floor '+k,low<.08,low);}
 // dragon charge: stays low, glows red, walkable
 reset();p.mode='fist';p.style=0;g.tryStaffCharge();g.keys.KeyW=true;const c0=p.pos.clone();const mesh=p.weapon.mesh,d=mesh.userData.staff;let top=0;
 for(let i=0;i<70;i++){g.step(1);if(i<25)continue;const a=mesh.localToWorld(new V(0,0,d.max)),b=mesh.localToWorld(new V(0,0,d.min));top=Math.max(top,a.y,b.y);}
 check('charge while walking',p.state==='staffCharge'&&p.pos.distanceTo(c0)>1.5,p.pos.distanceTo(c0));
 check('staff not raised overhead',top<1.5,top);
 const m0=d.heatMats&&d.heatMats[0].m;check('staff glows red when charged',!!m0&&m0.emissive.r>.5&&m0.emissive.r>m0.emissive.g*2,m0&&m0.emissive);
 g.keys.KeyW=false;g.locked=true;g.releaseStaffCharge();g.locked=false;check('release still swings',p.state==='attack');
 reset();g.step(60);check('heat fades after',d.heat<.05,d.heat);
 p.weapon.mesh.removeFromParent();p.weapon=null;reset();
 return checks;
})();
