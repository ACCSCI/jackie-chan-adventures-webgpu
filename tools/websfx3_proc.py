# 第三批：高质量打击层。来源：Mixkit 免费音效（Mixkit Sound Effects Free License）+ VibeHub/ElevenLabs 生成（见 assets/audio/web/CREDITS.md）
# 处理：按起音切分多段样本 → 每段截到最大时长并淡出 → 峰值 -1dBFS → 单声道 48k Opus 64k
import subprocess,os,json,base64,hashlib,numpy as np
MK='/data/game/audio/mixkit/'; EL='/data/game/audio/hq/'
def load(p):
  r=subprocess.run(['ffmpeg','-v','error','-i',p,'-ac','1','-ar','48000','-f','f32le','-'],capture_output=True,check=True); return np.frombuffer(r.stdout,np.float32).copy()
def onsets(x,th=0.25,gap=0.12):
  sr=48000; w=int(sr*.004); env=np.sqrt(np.convolve(x**2,np.ones(w)/w,'same')); t=env.max()*th; on=env>t; res=[]; last=-1e9
  for i in np.flatnonzero(on[1:]&~on[:-1])+1:
    if i-last>gap*sr: res.append(i); last=i
  if on[0]: res=[0]+res
  return res
# key: [(file, max_len, which_onsets or None=all, th)]
S={
 'hqL':[(MK+'2047.mp3',.32,None,.3),(MK+'2052.mp3',.32,None,.3),(MK+'2143.mp3',.3,None,.3),(MK+'2164.mp3',.32,[0],.3),(MK+'2145.mp3',.3,[0],.3),(EL+'raw/punchL.mp3',.3,None,.3)],
 'hqH':[(MK+'2155.mp3',.6,[0],.3),(MK+'2150.mp3',.55,[0],.3),(MK+'2198.mp3',.5,None,.35),(EL+'raw/punchH.mp3',.55,[0],.3)],
 'hqK':[(MK+'2163.mp3',.5,[0],.3),(MK+'2146.mp3',.45,[0],.3),(MK+'2147.mp3',.45,None,.4),(EL+'raw2/kick2.mp3',.5,[0],.3)],
 'hqCrit':[(MK+'788.mp3',1.6,[0],.3),(MK+'498.mp3',1.2,[0],.3)],
 'hqBlade':[(MK+'2152.mp3',.45,[0],.3),(MK+'2158.mp3',.5,[0],.3),(MK+'2199.mp3',.5,[0],.3),(MK+'2184.mp3',.45,[0],.3),(EL+'raw/slash.mp3',.45,[0],.3)],
 'hqStaff':[(EL+'raw/staff.mp3',.38,None,.3)],
 'hqBlock':[(EL+'raw/block.mp3',.35,None,.3)],
 'hqParry':[(EL+'raw/parry.mp3',.7,[0],.3),(MK+'2160.mp3',.7,[0],.3)],
 'hqFall':[(EL+'raw/fall.mp3',.6,[0],.3),(EL+'raw2/fall2.mp3',.6,[0],.3)],
}
tmp='/tmp/wsfx3'; os.makedirs(tmp,exist_ok=True)
data={};man={};sr=48000
for k,L in S.items():
  data[k]=[]
  for f,mx,which,th in L:
    x=load(f); ons=onsets(x,th)
    if which is not None: ons=[ons[i] for i in which if i<len(ons)]
    for j,o in enumerate(ons):
      a=max(0,o-int(sr*.004)); nxt=[q for q in onsets(x,th) if q>o+int(sr*.05)]
      b=min(len(x),a+int(sr*mx),(nxt[0]-int(sr*.01)) if nxt else len(x))
      seg=x[a:b].copy(); n=len(seg); fo=min(int(sr*.06),n//3); seg[n-fo:]*=np.linspace(1,0,fo)**2
      seg*=10**(-1/20)/max(1e-6,np.abs(seg).max())
      w=f'{tmp}/{k}_{len(data[k])}.f32'; seg.astype(np.float32).tofile(w); op=w[:-4]+'.opus'
      subprocess.run(['ffmpeg','-v','error','-y','-f','f32le','-ar','48000','-ac','1','-i',w,'-c:a','libopus','-b:a','64k',op],check=True)
      data[k].append(base64.b64encode(open(op,'rb').read()).decode())
      man[f'{k}_{len(data[k])-1}']={'src':f.replace('/data/game/audio/',''),'t':round(a/sr,3),'len':round(n/sr,3),'sha256':hashlib.sha256(open(f,'rb').read()).hexdigest()}
js='// 第三批高质量打击层（Mixkit 免费音效 + VibeHub/ElevenLabs 生成，见 assets/audio/web/CREDITS.md）\nconst WEB_SFX3='+json.dumps(data)+';\n'
open('/data/game/repo/src/websfx3.js','w').write(js)
json.dump(man,open('/data/game/repo/assets/audio/web/manifest3.json','w'),indent=1)
print(len(js), {k:len(v) for k,v in data.items()})
