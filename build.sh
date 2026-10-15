#!/usr/bin/env bash
# 构建：拼接源码 → esbuild 打包 → 内联进单个 HTML（dist/index.html）
set -e
cd "$(dirname "$0")"
mkdir -p dist build
python3 tools/glbdata.py build/glbdata.js
python3 tools/audiodata.py build/audiodata.js
S=src
cat $S/p1.js $S/p2.js build/glbdata.js $S/p25.js $S/p26.js $S/p27.js $S/p3.js $S/p4.js $S/p45.js $S/p46.js $S/p47.js $S/p48.js $S/p49.js build/audiodata.js $S/p50.js $S/websfx.js $S/p51.js $S/p52.js $S/p5.js > build/main.js
npx esbuild build/main.js --bundle --format=iife --minify --target=es2022 --outfile=build/bundle.js --log-level=warning
python3 - <<'PY'
s = open('src/shell.html', encoding='utf-8').read()
b = open('build/bundle.js', encoding='utf-8').read().replace('</script', '<\\/script')
open('dist/index.html', 'w', encoding='utf-8').write(s.replace('/*GAME*/', b))
PY
ls -la dist/index.html
