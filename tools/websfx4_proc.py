# 第四批 HQ 音效：刀剑命中/挥空、低频冲击（替代合成“咚”）、家具城环境打击、后续章节用的生物/法术/环境声
# 来源：Mixkit 免费音效（Mixkit Sound Effects Free License）+ VibeHub/ElevenLabs 生成（见 assets/audio/web/CREDITS.md）
import subprocess,os,json,base64,hashlib,numpy as np
MK='/data/game/audio/mixkit2/'; MK1='/data/game/audio/mixkit/'; EL='/data/game/audio/hq/'
sr=48000
def load(p):
  r=subprocess.run(['ffmpeg','-v','error','-i',p,'-ac','1','-ar','48000','-f','f32le','-'],capture_output=True,check=True); return np.frombuffer(r.stdout,np.float32).copy()
def onsets(x,th=0.25,gap=0.12):
  w=int(sr*.004); env=np.sqrt(np.convolve(x**2,np.ones(w)/w,'same')); t=env.max()*th; on=env>t; res=[]; last=-1e9
  for i in np.flatnonzero(on[1:]&~on[:-1])+1:
    if i-last>gap*sr: res.append(i); last=i
  if on[0]: res=[0]+res
  return res
def M(i,mx,which=[0],th=.3): return (MK+f'{i}.mp3',mx,which,th)
def E3(k,mx,which=[0],th=.3): return (EL+f'raw3/{k}.mp3',mx,which,th)
S={
 'slashL':[M(2166,.4),M(2762,.4),M(2763,.4),M(2789,.45),(MK1+'2152.mp3',.4,[0],.3),(MK1+'2158.mp3',.4,[0],.3)],
 'slashH':[M(2788,.6),M(2794,.6),(MK1+'2199.mp3',.55,[0],.3),E3('swordHeavy',.65)],
 'swL':[M(2792,.32,[0],.05),M(1487,.3,[0],.05),M(1485,.32,[0],.05),M(1506,.4,[0],.05)],
 'swH':[M(1476,.5,[0],.05),M(1473,.45,[0],.05),M(1472,.4,[0],.05),M(1478,.35,[0],.05)],
 'sub':[M(2299,.4),M(3049,.4),M(2294,.38)],
 'boom':[M(2186,1.4),M(2901,1.8)],
 'clangS':[M(2761,.35),M(2764,.4),M(2765,.35)],
 'woodBrk':[M(3141,.9),M(2943,.6),M(3136,1.2),E3('chairSmash',1.1)],
 'chair':[E3('chairSmash',1.1),M(2182,.35)],
 'fridge':[E3('fridgeBash',1.1),M(1864,.7)],
 'fridgeOpen':[M(1861,.7)],
 'door':[M(196,.45),M(192,.5),M(194,.9)],
 'boxHit':[E3('boxCrush',.9)],
 'shelf':[E3('shelfFall',1.8)],
 'lamp':[E3('lampSmash',1),M(759,.9)],
 'sofa':[E3('sofaThump',.9)],
 'junk':[M(3210,.8),M(389,.7)],
 'bodyFall':[M(2498,.5),M(757,.6),M(753,.5)],
 'rock':[M(400,1.6),M(1272,1.6)],
 'quake':[M(2958,2.4),M(3046,1.5)],
 'roar':[M(13,1.4),M(6,1.3),M(1972,2.6),M(1966,1.4)],
 'dragon':[M(16,2.6),M(309,3.0)],
 'fireW':[M(1348,1.4),M(1347,1.6),M(1340,1.2)],
 'magic':[M(2345,2.2),M(883,1.2),M(873,1.2),M(2581,2.4)],
 'tele':[M(868,1.3)],
 'chainM':[M(879,2.4)],
 'beam':[M(2589,2.2)],
 'thunder':[M(1279,2.2),M(1286,2.8)],
 'explodeB':[M(2782,2.6),M(2800,1.6)],
 'neigh':[M(76,1.9),M(85,1.8)],
 'gallop':[M(83,3.0,[0],.05)],
 'wind':[M(2610,1.8),M(2623,2.2),M(1489,1.2)],
 'ghost':[M(1979,2.0),M(2623,2.2)],
 'beastHurt':[M(2208,.9),M(1959,2.0)],
}
tmp='/data/game/dbg/wsfx4'; os.makedirs(tmp,exist_ok=True)
data={};man={}
for k,L in S.items():
  data[k]=[]
  for f,mx,which,th in L:
    x=load(f); all_on=onsets(x,th); ons=[all_on[i] for i in which if i<len(all_on)] if which is not None else all_on
    for o in ons:
      a=max(0,o-int(sr*.004)); nxt=[q for q in all_on if q>o+int(sr*.08)] if mx<.7 and not k.startswith(('sw','sub','slash')) else []
      b=min(len(x),a+int(sr*mx),(nxt[0]-int(sr*.01)) if nxt else len(x))
      seg=x[a:b].copy(); n=len(seg); fo=min(int(sr*.08),n//3); seg[n-fo:]*=np.linspace(1,0,fo)**2
      seg*=10**(-1/20)/max(1e-6,np.abs(seg).max())
      w=f'{tmp}/{k}_{len(data[k])}.f32'; seg.astype(np.float32).tofile(w); op=w[:-4]+'.opus'
      subprocess.run(['ffmpeg','-v','error','-y','-f','f32le','-ar','48000','-ac','1','-i',w,'-c:a','libopus','-b:a','64k',op],check=True)
      data[k].append(base64.b64encode(open(op,'rb').read()).decode())
      man[f'{k}_{len(data[k])-1}']={'src':f.replace('/data/game/audio/',''),'t':round(a/sr,3),'len':round(n/sr,3),'sha256':hashlib.sha256(open(f,'rb').read()).hexdigest()}
js='// 第四批 HQ 音效（Mixkit 免费音效 + VibeHub/ElevenLabs 生成，见 assets/audio/web/CREDITS.md）\nconst WEB_SFX4='+json.dumps(data)+';\n'
open('/data/game/repo/src/websfx4.js','w').write(js)
json.dump(man,open('/data/game/repo/assets/audio/web/manifest4.json','w'),indent=1)
print(len(js)//1024,'KB', {k:len(v) for k,v in data.items()})
