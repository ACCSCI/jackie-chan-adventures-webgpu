#!/usr/bin/env bash
# The portable Node builder embeds animation, audio and HUD assets.
set -e
cd "$(dirname "$0")"
node tools/build.cjs
