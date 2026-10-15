from pathlib import Path
import sys
parts = sorted(Path('assets/audio').glob('audiodata_*.part'))
if not parts:
    raise SystemExit('Missing embedded audio parts')
Path(sys.argv[1]).write_bytes(b''.join(p.read_bytes() for p in parts))
