import subprocess,glob,os,json,base64,hashlib
K='kenney/Audio/'
if not os.path.isdir(K): K=os.path.dirname(glob.glob('kenney/**/impactPunch_heavy_000.ogg',recursive=True)[0])+'/'
Q='qubo/qubodupPunch/'
sets={
 'punchL':[Q+f'qubodupPunch0{i}.flac' for i in range(1,6)]+[K+f'impactPunch_medium_00{i}.ogg' for i in range(5)],
 'punchH':[K+f'impactPunch_heavy_00{i}.ogg' for i in range(5)],
 'body':[K+f'impactSoft_heavy_00{i}.ogg' for i in range(5)],
 'wood':[K+f'impactWood_medium_00{i}.ogg' for i in range(5)],
 'woodH':[K+f'impactWood_heavy_00{i}.ogg' for i in range(5)],
 'metal':[K+f'impactMetal_medium_00{i}.ogg' for i in range(5)],
 'metalH':[K+f'impactMetal_heavy_00{i}.ogg' for i in range(5)],
 'plate':[K+f'impactPlate_medium_00{i}.ogg' for i in range(5)],
 'glass':[K+f'impactGlass_heavy_00{i}.ogg' for i in range(5)],
 'bell':[K+f'impactBell_heavy_00{i}.ogg' for i in range(3)],
 'step':[K+f'footstep_concrete_00{i}.ogg' for i in range(5)],
}
data={};man={}
for k,fs in sets.items():
  data[k]=[]
  for i,f in enumerate(fs):
    o=f'out/{k}_{i}.opus'
    # 去前导静音、峰值标准化、尾部淡出
    flt='silenceremove=start_periods=1:start_threshold=-45dB,apad=pad_dur=0.02,loudnorm=I=-14:TP=-1:LRA=7,afade=t=out:st=0:d=0.001'
    subprocess.run(['ffmpeg','-v','error','-y','-i',f,'-af','silenceremove=start_periods=1:start_threshold=-45dB,dynaudnorm=p=0.95:m=8','-ac','1','-ar','48000','-c:a','libopus','-b:a','56k',o],check=True)
    b=open(o,'rb').read(); data[k].append(base64.b64encode(b).decode())
    man[o]={'src':f,'sha256':hashlib.sha256(open(f,'rb').read()).hexdigest()}
js='// CC0 打击音效：Kenney Impact Sounds (kenney.nl) + qubodup Punch (opengameart.org/content/punch)\nconst WEB_SFX='+json.dumps(data)+';\n'
open('/data/game/v2/websfx.js','w').write(js)
json.dump(man,open('manifest.json','w'),indent=1)
print(len(js), {k:len(v) for k,v in data.items()})
