# 重新导出模型/动作后：把 *.min.glb 转成 assets/glb 分片
import base64, glob, os, sys
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
src = sys.argv[1] if len(sys.argv) > 1 else '.'
for f in glob.glob(os.path.join(root, 'assets/glb/*.b64')): os.remove(f)
for k in ['anims', 'jackie', 'uncle', 'jade', 'thug', 'khan', 'tohru']:
    v = base64.b64encode(open(os.path.join(src, k + '.min.glb'), 'rb').read()).decode()
    for i in range(0, len(v), 900000): open(os.path.join(root, f'assets/glb/{k}.{i // 900000}.b64'), 'w').write(v[i:i + 900000])
