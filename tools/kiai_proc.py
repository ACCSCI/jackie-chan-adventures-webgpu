# 发力喊声 / 受击闷哼（VibeHub/ElevenLabs 生成）：按停顿切成单声，追加到 src/websfx4.js 的 WEB_SFX4
import subprocess,os,json,base64,numpy as np,re
sr=48000; K='/data/game/audio/hq/kiai/'
def load(p):
  r=subprocess.run(['ffmpeg','-v','error','-i',p,'-ac','1','-ar','48000','-f','f32le','-'],capture_output=True,check=True); return np.frombuffer(r.stdout,np.float32).copy()
def segs(x,th):
  w=int(sr*.015); env=np.sqrt(np.convolve(x**2,np.ones(w)/w,'same')); on=env>env.max()*th; out=[]; st=None
  for k in range(0,len(x),240):
    if on[k] and st is None: st=k
    if not on[k] and st is not None: out.append([st,k]); st=None
  if st is not None: out.append([st,len(x)])
  m=[]
  for s in out:
    if m and s[0]-m[-1][1]<.07*sr: m[-1][1]=s[1]
    else: m.append(s)
  return [s for s in m if s[1]-s[0]>.08*sr]
F={'kJ':[('jcAtah',1),('jcHyah',1),('jcHa',3),('jcWah',2)],'kJL':[('jcLong',1),('jcAtah',1)],'kJh':[('jcHurt',3)],'kJe':[('jcEffort',3)],
   'kT':[('thKiai',3),('thKiai2',3)],'kTh':[('thHurt',3),('thHurt2',3)],'kB':[('bigKiai',2)],'kBh':[('bigHurt',3)],'kN':[('ninKiai',3)]}
data={}; tmp='/data/game/dbg/kiai'; os.makedirs(tmp,exist_ok=True)
for k,L in F.items():
  data[k]=[]
  for f,n in L:
    x=load(K+f+'.mp3'); best=None
    for th in [.05,.08,.12,.18,.25,.33]:
      s=segs(x,th)
      if best is None or abs(len(s)-n)<abs(len(best)-n): best=s
      if len(s)==n: best=s; break
    for a,b in best:
      a=max(0,a-int(sr*.01)); b=min(len(x),b+int(sr*.06)); seg=x[a:b].copy()
      if len(seg)>sr*1.5: seg=seg[:int(sr*1.5)]
      fo=min(int(sr*.05),len(seg)//3); seg[-fo:]*=np.linspace(1,0,fo)
      seg*=10**(-1/20)/max(1e-6,np.abs(seg).max())
      w=f'{tmp}/{k}_{len(data[k])}.f32'; seg.astype(np.float32).tofile(w); op=w[:-4]+'.opus'
      subprocess.run(['ffmpeg','-v','error','-y','-f','f32le','-ar','48000','-ac','1','-i',w,'-af','acompressor=threshold=-18dB:ratio=3:attack=3:release=80','-c:a','libopus','-b:a','56k',op],check=True)
      data[k].append(base64.b64encode(open(op,'rb').read()).decode())
p='/data/game/repo/src/websfx4.js'; s=open(p).read()
s=re.sub(r'\nconst WEB_SFX4_KIAI=.*','',s,flags=re.S)
s+='const WEB_SFX4_KIAI='+json.dumps(data)+';\nObject.assign(WEB_SFX4, WEB_SFX4_KIAI);\n'
open(p,'w').write(s); print({k:len(v) for k,v in data.items()}, len(s)//1024,'KB')
