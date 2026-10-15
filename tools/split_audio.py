# 把 audiodata.js 切成 <900KB 的 UTF-8 安全分片（只在 ASCII 字节处切）
import sys
from pathlib import Path
src, out = Path(sys.argv[1]), Path(sys.argv[2]); out.mkdir(parents=True, exist_ok=True)
for p in out.glob('audiodata_*.part'): p.unlink()
b = src.read_bytes(); i = n = 0; LIM = 900_000
while i < len(b):
    j = min(len(b), i + LIM)
    while j < len(b) and b[j] >= 0x80: j -= 1
    (out / f'audiodata_{n:03d}.part').write_bytes(b[i:j]); i = j; n += 1
print(n, 'parts')
