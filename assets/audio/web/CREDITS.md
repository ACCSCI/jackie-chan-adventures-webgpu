# 打击音效来源（全部 CC0 公共领域）

| 包 | 作者 | 许可 | 地址 | 用途 |
| --- | --- | --- | --- | --- |
| Impact Sounds 1.0（130 个） | Kenney (kenney.nl) | CC0 1.0 | https://kenney.nl/assets/impact-sounds | 重拳、肉体闷响、木/金属/玻璃/板材撞击、铃、脚步 |
| Punch（qubodupPunch01–05） | Iwan “qubodup” Gabovitch | CC0 1.0 | https://opengameart.org/content/punch | 轻拳脚命中 |

处理：去除前导静音、动态标准化、转单声道 48kHz Opus 56kbps（`tools/websfx_proc.py`）。
游戏内按招式轻重、器械材质、反击、击杀、霸体分层叠加，并加合成低频冲击与压限（`src/p51.js`）。
CC0 无需署名，此处仍注明以示感谢。

## 第二批拟音（`src/websfx2.js`，处理脚本 `tools/websfx2_proc.py`，清单 `manifest2.json`）

| 包 | 作者 | 许可 | 地址 | 用途 |
| --- | --- | --- | --- | --- |
| Swish – bamboo stick weapon swooshes（43 个） | qubodup | CC0 | https://opengameart.org/content/swish-bamboo-stick-weapon-swhoshes | 棍/拳脚挥空（轻/重） |
| Swishes Sound Pack | artisticdude | CC0 | https://opengameart.org/content/swishes-sound-pack | 快拳短促破风 |
| 20 Sword Sound Effects (Attacks and Clashes) | StarNinjas | CC0 | https://opengameart.org/content/20-sword-sound-effects-attacks-and-clashes | 刀剑挥砍、兵刃相交 |
| 80 CC0 RPG SFX / 80 CC0 Creature SFX / 50 CC0 Sci-Fi SFX / 100 CC0 SFX | rubberduck | CC0 | https://opengameart.org/users/rubberduck | 生物吼叫/受伤、石块、锁链、法术、铜锣、科幻机械、爆炸 |
| RPG Audio / Sci-Fi Sounds / Interface Sounds | Kenney | CC0 | https://kenney.nl/assets | 布料、脚步、拔刀、力场、推进器、警报、界面 |
| 2 High Quality Explosions | Michel Baradari (apollo-music.de) | CC-BY 3.0 | https://opengameart.org/content/2-high-quality-explosions | 大爆炸（需署名：Sounds (c) by Michel Baradari） |

处理：去前导静音 → 按类别截断并淡出 → 峰值标准化到 −1 dBFS → 单声道 48 kHz Opus 40–64 kbps。
拟音调度见 `src/p51.js` 的 `Foley`：徒手挥空对齐首个命中帧、器械挥空按棍梢/刃尖速度选样本与音高、闪避布料声、落地与脚步（脚步同时产生「噪声」供敌人听觉使用）。
