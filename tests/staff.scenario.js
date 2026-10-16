(() => {
 const g=window.__game,p=g.player,checks=[];
 const check=(name,pass,detail)=>{checks.push({name,pass,detail});if(!pass)throw Error(JSON.stringify(checks));};
 const reset=()=>{p.state='loco';p.move=null;p.mt=0;p.vy=0;p.pos.y=0;p.grounded=true;p.guard=false;p.crouch=false;p.iframe=0;p.st=100;g.buffer.type=null;for(const k in g.keys)g.keys[k]=false;};
 g.started=true;g.Dojo.begin();g.locked=false;document.body.classList.remove('menu','cine');document.getElementById('menu').classList.add('hide');
 if(p.weapon)p.weapon.mesh.removeFromParent();p.weapon=g.equipMesh({type:5,dur:999});p.mode='fist';p.style=0;reset();g.step(20);
 check('single hand carry shaft is rooted',p.weapon.mesh.parent===p.rig.root);
 const world=name=>p.rig.bones[name].getWorldPosition(p.pos.clone());
 // The palm (not the wrist bone) sits on the shaft axis at the authored grip station.
 const palm=()=>p.rig.rHand.localToWorld(p.pos.clone().set(.01,.062,.02));
 const onShaft=(pt)=>{const m=p.weapon.mesh,l=m.worldToLocal(pt.clone());return {off:Math.hypot(l.x,l.y),z:l.z};};
 const grip=palm(),gs=onShaft(grip),sd0=p.weapon.mesh.userData.staff;
 check('right palm grips shaft at rest',gs.off<.01&&Math.abs(gs.z-sd0.gz)<.01,gs);
 check('wrist is not the grip point',world('RightHand').distanceTo(grip)>.04,world('RightHand').distanceTo(grip));
 check('idle grip near one third of the shaft',Math.abs((sd0.gz-sd0.min)/sd0.len-.35)<.03,sd0.gz);
 const left=world('LeftHand');check('offhand free at rest',left.distanceTo(grip)>.15,left.distanceTo(grip));
 g.startMove(g.WMOVES.staff[0].L1);g.step(2);g.buffer.type='heavy';g.buffer.t=g.now;g.tryJump();
 check('jump cancels attack before hit',!p.grounded&&p.state==='loco'&&p.move===null&&g.buffer.type===null);
 g.step(1);check('jump begins immediately',p.pos.y>0&&p.vy>0,p.pos.y);
 reset();p.pos.y=.015;p.vy=-1;p.grounded=false;g.tryJump();g.step(2);
 check('jump buffers through landing',!p.grounded&&p.vy>0,p.vy);
 reset();g.locked=true;window.dispatchEvent(new MouseEvent('mousedown',{button:2}));check('mouse starts charge',p.state==='staffCharge');g.locked=false;g.step(30);
 check('charge accumulates',p.chargeT>.45,p.chargeT);
 g.tryJump();check('jump cancels charge',p.state==='loco'&&!p.grounded&&p.move===null);
 reset();g.locked=true;g.tryStaffCharge();g.locked=false;g.step(50);g.locked=true;window.dispatchEvent(new MouseEvent('mouseup',{button:2}));g.locked=false;
 check('release produces powered heavy',p.state==='attack'&&p.move.chargeLevel>.7&&p.move.dmg>g.WMOVES.staff[0].H.dmg);
 for(let s=0;s<3;s++){const S=g.WMOVES.staff[s];check('five hit light chain '+s,S.L1.nextM===S.L2&&S.L3.nextM===S.L4&&S.L4.nextM===S.L5&&!S.L5.nextM&&S.L1.staff==='chop1'&&S.L5.staff==='leap');}
 check('style heavies differ',g.WMOVES.staff[0].H3.staff==='smash'&&g.WMOVES.staff[1].H3.staff==='poke7'&&g.WMOVES.staff[2].H3.staff==='pole');
 reset();g.locked=true;g.tryStaffCharge();g.locked=false;g.step(12);g.locked=true;window.dispatchEvent(new MouseEvent('mouseup',{button:2}));g.locked=false;
 check('short charge gives level one',p.state==='attack'&&p.move.staff==='smash'&&Math.abs(p.move.chargeLevel-1/3)<.01,p.move&&p.move.chargeLevel);
 reset();g.startMove(g.WMOVES.staff[0].L2);let bend=0;
 for(let i=0;i<24;i++){g.step(1);bend=Math.max(bend,Math.abs(p.weapon.mesh.userData.staff.bend));}
 const lim=p.weapon.mesh.userData.staff.limit;
 check('wood staff bends visibly but bounded',bend>.05&&bend<=lim*1.16&&lim>=.15&&lim<=.25,{bend,lim});
 check('ribbon trail drawn during sweep',g.STAFF_RIBBONS.some(r=>r.mesh.visible||r.ink.visible));
 check('echo pool bounded',g.STAFF_ECHOES.length===7,g.STAFF_ECHOES.length);
 g.step(60);check('staff returns straight',Math.abs(p.weapon.mesh.userData.staff.bend)<.002,p.weapon.mesh.userData.staff.bend);
 const attacker=g.enemies.find(e=>e.type==='dummy');reset();p.hp=200;p.style=1;g.playerTakeHit(attacker,20);const ordinary=200-p.hp;
 reset();p.hp=200;p.style=0;g.playerTakeHit(attacker,20);const dragon=200-p.hp;
 check('dragon damage reduction',ordinary===20&&dragon===17,{ordinary,dragon});
 check('dragon outgoing damage buff',Math.abs(g.STYLES[0].dmg-1.44)<.001,g.STYLES[0].dmg);
 reset();p.hp=200;g.setCam(p.yaw+Math.PI+.35,-.2);g.step(30);
 reset();p.yaw=p.yawTarget=0;g.startMove(g.WMOVES.staff[0].L2);p.yawTarget=0;g.step(13);
 const sd=p.weapon.mesh.userData.staff;
 const lpalm=p.rig.lHand.localToWorld(p.pos.clone().set(-.01,.062,.02)),ls=onShaft(lpalm);
 check('one-handed backhand leaves offhand off',sd.lw<.3,sd.lw);
 reset();p.yaw=p.yawTarget=0;g.startMove(g.WMOVES.staff[0].L4);p.yawTarget=0;g.step(20);
 const lp=onShaft(p.rig.lHand.localToWorld(p.pos.clone().set(-.01,.062,.02)));
 check('offhand slides onto shaft for two-handed whirl',sd.lw>.9&&lp.off<.035&&Math.abs(lp.z-sd.lz)<.04,{lw:sd.lw,lp,lz:sd.lz});
 // mid-shaft grip bends both ends in opposite directions (S-shape)
 sd.gz=(sd.min+sd.max)/2;sd.bx=.1;sd.by=0;const ends=[sd.min,sd.max].map(z=>{const u=z-sd.gz,L=Math.max(sd.max-sd.gz,sd.gz-sd.min);return sd.bx*u*Math.abs(u)/(L*L);});
 check('S-shaped bend around a middle grip',ends[0]<0&&ends[1]>0,ends);
 reset();const target=g.enemies.find(e=>e.type==='dummy'&&e.kind!=='atk');
 const saved={home:target.home.clone(),pos:target.pos.clone(),hp:target.hp,root:target.root.position.clone()};
 const originalPosition=p.pos.clone();p.pos.set(-170,0,-2);p.yaw=p.yawTarget=0;
 const strike=(distance,dt)=>{reset();p.pos.set(-170,0,-2);p.yaw=p.yawTarget=0;target.home.set(-170,0,-2+distance);target.pos.copy(target.home);target.root.position.copy(target.home);target.hp=target.maxHp;target.dead=false;const hp=target.hp;g.startMove(g.WMOVES.staff[0].L2);p.yawTarget=0;for(let i=0;i<Math.ceil(.65/dt);i++)g.step(1,dt);return hp-target.hp;};
 const near=strike(1.6,1/60),far=strike(2.8,1/60),lowFps=strike(1.6,1/20);
 check('shaft sweep actually hits opponent',near>0,near);
 check('shaft does not hit beyond its reach',far===0,far);
 check('fast sweep does not tunnel at 20fps',lowFps>0,lowFps);
 target.home.copy(saved.home);target.pos.copy(saved.pos);target.root.position.copy(saved.root);target.hp=saved.hp;p.pos.copy(originalPosition);reset();
 g.Story.play([{who:'jackie',text:'棍术测试'}]);g.step(15);
 check('staff cinematic blocks gameplay',p.state==='loco'&&p.move===null&&p.rig.sk.key==='cinematic');
 g.Story.end();g.step(30);
 const d=p.weapon.mesh.userData.staff;check('finite geometry',d.pieces.every(o=>Array.from(o.mesh.geometry.attributes.position.array).every(Number.isFinite)));
 reset();p.st=100;const chain=g.WMOVES.staff[0];g.startMove(chain.L1);
 for(const next of [chain.L2,chain.L3,chain.L4,chain.L5]) {g.buffer.type='light';g.buffer.t=g.now;for(let i=0;i<50&&p.move!==next;i++){p.st=100;g.step(1);}check('buffer links to '+next.name,p.move===next);}
 // hold light → staff flower turns a fireball around
 reset();p.yaw=p.yawTarget=0;p.lmbHeld=true;check('hold light starts flower',g.tryStaffFlower()&&p.state==='staffSpin');g.step(10);
 const boss=g.enemies.find(e=>e.type==='dummy');g.spawnFireballs(boss);const fb=g.fireballs[g.fireballs.length-1];fb.pos.set(p.pos.x,1.2,p.pos.z+1.4);fb.vel.set(0,0,-11);fb.reflect=false;
 g.step(2);check('flower reflects fireball',fb.reflect===true&&fb.vel.z>0,{r:fb.reflect,v:fb.vel.z});
 p.lmbHeld=false;g.step(2);check('release ends flower',p.state==='loco');
 // drunk pole: vault gives i-frames and lands again
 reset();p.style=2;g.startMove({...g.WMOVES.staff[2].H1,chargeLevel:1/3});let maxY=0,inv=false;for(let i=0;i<80;i++){g.step(1);maxY=Math.max(maxY,p.pos.y);if(p.mt>.3&&p.mt<.5&&p.iframe>0)inv=true;}
 check('pole vault rises with i-frames and lands',maxY>.6&&inv&&p.pos.y<.01,{maxY,inv,y:p.pos.y});p.style=0;
 reset();g.startMove(g.WMOVES.staff[0].L5);for(let i=0;i<60;i++)g.step(1);check('finisher leaves character afterimages',g.STAFF_GHOSTS.length===3);
 reset();g.Menu.resetSession();
 check('new session clears jump charge and echoes',p.jumpUntil===-Infinity&&p.chargeT===0&&p.staffTrace===null&&g.STAFF_ECHOES.every(e=>!e.mesh.visible)&&g.STAFF_GHOSTS.every(o=>!o.root.visible));
 return checks;
})()
