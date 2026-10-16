from pathlib import Path
import sys
# 用法：audiodata.py <输出> [分片目录]（分片在 git 里，每片 <1MB）
d = Path(sys.argv[2] if len(sys.argv) > 2 else 'assets/audio/hd')
parts = sorted(d.glob('audiodata_*.part'))
if not parts:
    raise SystemExit('Missing embedded audio parts in ' + str(d))
Path(sys.argv[1]).write_bytes(b''.join(p.read_bytes() for p in parts))
