# 第二批 CC0 音效：挥空/刀剑/布料/脚步/生物/科幻/爆炸/魔法。源包放在 /data/sfxsrc（见 assets/audio/web/CREDITS.md）
# 处理：去前导静音 → 截断到每类最大时长并淡出 → 峰值标准化到 -1dBFS → 单声道 48k Opus
import subprocess,os,json,base64,hashlib,re,glob
R='/data/sfxsrc/'; O=R+'oga/'; K=R+'kenney_rpg-audio/Audio/'; KS=R+'kenney_sci-fi-sounds/Audio/'; KI=R+'kenney_interface-sounds/Audio/'
def g(p): 
  r=sorted(glob.glob(p)); assert r,p; return r
sw=O+'swoshes/swoshes/' if os.path.isdir(O+'swoshes/swoshes') else O+'swoshes/'
S={
 'swishL':([sw+f'swosh-{i:02d}.flac' for i in (1,2,4,6,9,10,25,27)],.35,56),
 'swishH':([sw+f'swosh-{i:02d}.flac' for i in (3,13,24,29,30,33,37,40)],.8,56),
 'swishS':(g(O+'swishes/swishes/swish-[0-9]*.wav')[:8],.25,48),
 'swordSw':([O+f'sword_-_starninjas_1/sword - StarNinjas/sword.{i}.ogg' for i in (3,4,6,7)]+g(O+'80-CC0-RPG-SFX_0/blade_0*.ogg'),.7,64),
 'clash':([O+f'sword_clash_-_starninjas_0/sword_clash.{i}.ogg' for i in (2,3,5,10,4)],.9,64),
 'cloth':(g(K+'cloth*.ogg')+g(K+'clothBelt*.ogg'),.45,40),
 'foot':(g(K+'footstep0*.ogg')[:8],.3,40),
 'draw':(g(K+'drawKnife*.ogg'),.6,56),
 'roar':(g(O+'80-CC0-creature-SFX_0/roar_0*.ogg')+g(O+'80-CC0-RPG-SFX_0/creature_roar_0*.ogg'),1.8,56),
 'growl':(g(O+'80-CC0-creature-SFX_0/monster_0*.ogg')[:5]+g(O+'80-CC0-creature-SFX_0/troll_0*.ogg'),1.4,48),
 'chitter':(g(O+'80-CC0-creature-SFX_0/bug_0*.ogg'),.9,48),
 'cHurt':(g(O+'80-CC0-creature-SFX_0/hurt_0*.ogg')+g(O+'80-CC0-RPG-SFX_0/creature_hurt_0*.ogg'),.8,48),
 'stone':(g(O+'80-CC0-RPG-SFX_0/stones_0*.ogg')+g(O+'80-CC0-RPG-SFX_0/item_stone_0*.ogg')[:2],.9,56),
 'chain':(g(O+'80-CC0-RPG-SFX_0/chain_0*.ogg'),.9,56),
 'spell':(g(O+'80-CC0-RPG-SFX_0/spell_0*.ogg')+g(O+'80-CC0-RPG-SFX_0/spell_fire_0*.ogg')[:4],1.3,56),
 'gong':(g(O+'100-CC0-SFX_0/gong_0*.ogg'),3.5,64),
 'explode':(g(O+'sci-fi-sfx/explosion_0*.ogg')+[O+'100-CC0-SFX_0/explosion.ogg','/data/sfxsrc/oga/explosions/explosions/explode.wav'],2.2,64),
 'laser':(g(O+'sci-fi-sfx/shoot_0*.ogg')+g(KS+'laserLarge_00[0-2].ogg'),.6,56),
 'zap':(g(KS+'forceField_00*.ogg')[:3]+g(O+'sci-fi-sfx/teleport_0*.ogg'),1.0,56),
 'beep':(g(O+'sci-fi-sfx/beep_0*.ogg')+g(O+'sci-fi-sfx/retro_beep_0[1-3].ogg'),.5,40),
 'mech':(g(O+'sci-fi-sfx/misc_0[1-6].ogg'),.9,48),
 'thrust':(g(KS+'thrusterFire_00*.ogg')[:3],1.0,48),
 'alarm':(g(KS+'computerNoise_00*.ogg')[:2]+g(KI+'error_00[1-3].ogg'),.7,40),
 'ui':(g(KI+'confirmation_00*.ogg')[:3]+g(KI+'select_00[1-3].ogg'),.5,40),
}
tmp='/tmp/wsfx2'; os.makedirs(tmp,exist_ok=True)
data={};man={}
for k,(fs,mx,br) in S.items():
  data[k]=[]
  for i,f in enumerate(fs):
    a=f'{tmp}/{k}_{i}.wav'
    subprocess.run(['ffmpeg','-v','error','-y','-i',f,'-af',f'silenceremove=start_periods=1:start_threshold=-50dB,atrim=0:{mx},afade=t=out:st={max(0,mx-0.08)}:d=0.08','-ac','1','-ar','48000',a],check=True)
    vd=subprocess.run(['ffmpeg','-i',a,'-af','volumedetect','-f','null','-'],capture_output=True,text=True).stderr
    peak=float(re.search(r'max_volume: (-?[\d.]+)',vd).group(1)); gain=-1-peak
    o=f'{tmp}/{k}_{i}.opus'
    subprocess.run(['ffmpeg','-v','error','-y','-i',a,'-af',f'volume={gain}dB','-c:a','libopus','-b:a',f'{br}k',o],check=True)
    data[k].append(base64.b64encode(open(o,'rb').read()).decode())
    man[f'{k}_{i}']={'src':f.replace(R,''),'sha256':hashlib.sha256(open(f,'rb').read()).hexdigest()}
js='// 第二批 CC0 音效（qubodup / artisticdude / StarNinjas / rubberduck / Kenney，见 assets/audio/web/CREDITS.md）\nconst WEB_SFX2='+json.dumps(data)+';\n'
open('/data/game/repo/src/websfx2.js','w').write(js)
json.dump(man,open('/data/game/repo/assets/audio/web/manifest2.json','w'),indent=1)
print(len(js), {k:len(v) for k,v in data.items()})
