(() => {
 const g=window.__game,p=g.player,checks=[];
 const check=(name,pass,detail)=>{checks.push({name,pass,detail});if(!pass)throw Error(JSON.stringify(checks));};
 g.keys.KeyW=true; g.keys.KeyQ=true;g.buffer.type='heavy';p.vel.set(4,0,3);p.vy=4;
 g.Story.play([{who:'jackie',to:'jade',text:'测试对话'},{who:'jade',text:'测试回应'}]);
 const before=p.pos.clone(),mode=p.mode,hp=p.hp;
 window.dispatchEvent(new WheelEvent('wheel',{deltaY:100}));
 window.dispatchEvent(new KeyboardEvent('keydown',{code:'Space'}));
 window.dispatchEvent(new KeyboardEvent('keyup',{code:'CapsLock'}));
 g.step(45);
 check('cutscene resets combat',p.state==='loco' && p.move===null && !p.guard && !p.crouch && !g.buffer.type);
 check('cutscene prevents motion',p.pos.distanceTo(before)<.0001 && p.vel.length()===0 && p.vy===0);
 check('cutscene ignores mode input',p.mode===mode);
 check('cutscene uses dialogue animation',p.rig.sk.key==='cinematic');
 g.Story.end();g.step(1);
 check('gameplay animation resumes',p.rig.sk.key==='loco');
 g.setCam(p.yaw+1.2,-.3);g.step(90);p.crouch=true;p.st=100;g.startMove(g.MOVES.sweep);g.step(13);
 return checks;
})()
