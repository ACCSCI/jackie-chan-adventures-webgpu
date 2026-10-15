# 打击音效来源（全部 CC0 公共领域）

| 包 | 作者 | 许可 | 地址 | 用途 |
| --- | --- | --- | --- | --- |
| Impact Sounds 1.0（130 个） | Kenney (kenney.nl) | CC0 1.0 | https://kenney.nl/assets/impact-sounds | 重拳、肉体闷响、木/金属/玻璃/板材撞击、铃、脚步 |
| Punch（qubodupPunch01–05） | Iwan “qubodup” Gabovitch | CC0 1.0 | https://opengameart.org/content/punch | 轻拳脚命中 |

处理：去除前导静音、动态标准化、转单声道 48kHz Opus 56kbps（`tools/websfx_proc.py`）。
游戏内按招式轻重、器械材质、反击、击杀、霸体分层叠加，并加合成低频冲击与压限（`src/p51.js`）。
CC0 无需署名，此处仍注明以示感谢。
