(() => {
 const g=window.__game,p=g.player,checks=[];
 const check=(name,pass,detail)=>{checks.push({name,pass,detail});if(!pass)throw Error(JSON.stringify(checks));};
 const V=p.pos.constructor;
 const reset=()=>{p.state='loco';p.move=null;p.mt=0;p.vy=0;p.pos.y=0;p.grounded=true;p.guard=false;p.crouch=false;p.iframe=0;p.st=100;p.vel.set(0,0,0);g.buffer.type=null;for(const k in g.keys)g.keys[k]=false;};
 g.started=true;g.Dojo.begin();g.locked=false;
 if(p.weapon)p.weapon.mesh.removeFromParent();p.weapon=g.equipMesh({type:7,dur:999});p.mode='fist';p.style=0;reset();g.step(30);
 const mesh=p.weapon.mesh,d=mesh.userData.blade;
 check('sword is driven in root space',mesh.parent===p.rig.root&&!!d);
 const palm=()=>p.rig.rHand.localToWorld(new V(.01,.062,.02));
 const onHilt=()=>{const l=mesh.worldToLocal(palm());return {off:Math.hypot(l.x,l.y),z:l.z};};
 let h=onHilt();check('fist closes on the hilt at rest',h.off<.012&&Math.abs(h.z-d.gz)<.012,h);
 const fwd=new V(Math.sin(p.yaw),0,Math.cos(p.yaw)),dir=()=>new V(0,0,1).applyQuaternion(mesh.getWorldQuaternion(mesh.quaternion.clone()));
 check('guard points the blade at the opponent',dir().dot(fwd)>.6&&dir().y>.1,dir());
 check('blade tip stays in front of the body',mesh.localToWorld(new V(0,0,d.max)).sub(p.pos).dot(fwd)>.5);
 // every blade-class move has a procedural pose or is an explicit full-body clip
 for(let s=0;s<3;s++)for(const k of ['L1','L2','L3','H']){const m=g.WMOVES.blade[s][k];check('pose '+s+k,m.bladeClip?m.blade==='clip':!!g.BLADE_POSES[m.blade],m.blade);}
 for(const k of ['CL','CH','A','AH'])check('shared pose '+k,!!g.BLADE_POSES[g.WSHARED.blade[k].blade]);
 // dragon chop: two hands on the hilt at the top of the swing
 reset();g.startMove(g.WMOVES.blade[0].L1);let both=9;
 for(let i=0;i<14;i++){g.step(1);if(p.mt>.2&&p.mt<.4){const lh=p.rig.lHand.localToWorld(new V(-.01,.062,.02)),l=mesh.worldToLocal(lh);both=Math.min(both,Math.hypot(l.x,l.y));}}
 check('overhead chop is two-handed',both<.04,both);
 h=onHilt();check('grip holds through the swing',h.off<.015,h);
 // edge leads the cut on a diagonal slash
 reset();g.step(10);g.startMove(g.WMOVES.blade[0].L2);let best=0,prev=null,rib=false;
 for(let i=0;i<30&&p.state==='attack';i++){g.step(1);rib=rib||g.STAFF_RIBBONS.some(r=>r.mesh.visible||r.ink.visible);const tip=mesh.localToWorld(new V(0,0,d.max));if(prev&&p.mt>.35&&p.mt<.6){const v=tip.clone().sub(prev),z=dir();v.addScaledVector(z,-v.dot(z));if(v.length()>.05){const e=new V(0,1,0).applyQuaternion(mesh.getWorldQuaternion(mesh.quaternion.clone()));best=Math.max(best,Math.abs(e.dot(v.normalize())));}}prev=tip;}
 check('edge faces the direction of the cut',best>.8,best);
 check('blade ribbon drawn during the cut',rib);
 // umbrella / katana use the same rig
 for(const t of [6,1]){if(p.weapon)p.weapon.mesh.removeFromParent();p.weapon=g.equipMesh({type:t,dur:999});reset();g.step(20);const m2=p.weapon.mesh,l=m2.worldToLocal(palm());check('hilt grip type '+t,Math.hypot(l.x,l.y)<.012&&Math.abs(l.z-m2.userData.blade.gz)<.012,l);}
 // hit reactions: the blade rides the fist instead of floating
 reset();g.step(5);const attacker=g.enemies.find(e=>e.type==='dummy');p.hp=200;g.playerTakeHit(attacker,5);g.step(3);
 {const m2=p.weapon.mesh,l=m2.worldToLocal(palm());check('blade rides fist in hit state',Math.hypot(l.x,l.y)<.015,l);}
 // unarmed low sweep: one-leg squat, straight sweeping leg on the floor
 if(p.weapon){p.weapon.mesh.removeFromParent();p.weapon=null;}reset();p.crouch=true;g.step(10);g.startMove(g.MOVES.sweep);
 while(p.mt<.5)g.step(1);
 const B=p.rig.bones,W=n=>B[n].getWorldPosition(new V()),hip=W('Hips'),rf=W('RightFoot'),head=W('Head');
 check('sweep drops the hips low',hip.y<.5,hip.y);
 check('sweeping foot skims the floor',rf.y<.2,rf.y);
 check('sweeping leg reaches out',Math.hypot(rf.x-p.pos.x,rf.z-p.pos.z)>.75,Math.hypot(rf.x-p.pos.x,rf.z-p.pos.z));
 check('head stays above the hips',head.y>hip.y+.3,head.y);
 g.step(40);check('sweep returns to crouch',p.state==='loco');
 reset();g.step(5);
 return checks;
})()
