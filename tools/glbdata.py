# 把 assets/glb/*.b64 分片拼回 GLB_DATA（分片是为了让单个文件 < 1MB）
import glob, json, os, re, sys
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
parts = {}
for f in sorted(glob.glob(os.path.join(root, 'assets/glb/*.b64')), key=lambda p: (os.path.basename(p).split('.')[0], int(os.path.basename(p).split('.')[1]))):
    k = os.path.basename(f).split('.')[0]; parts[k] = parts.get(k, '') + open(f).read()
order = ['anims', 'jackie', 'uncle', 'jade', 'thug', 'khan', 'tohru']
open(sys.argv[1], 'w').write('const GLB_DATA = ' + json.dumps({k: parts[k] for k in order}) + ';\n')
