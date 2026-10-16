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

## 第三批：高质量打击主层（`src/websfx3.js`，处理脚本 `tools/websfx3_proc.py`，清单 `manifest3.json`）

| 来源 | 许可 | 用到的素材 | 用途 |
| --- | --- | --- | --- |
| Mixkit 免费音效（https://mixkit.co/free-sound-effects/） | Mixkit Sound Effects Free License：可免费用于商业 / 非商业项目（含游戏），无需署名；**不得把音效单独再分发或打包出售** | #2047 Martial arts fast punch、#2052 Martial arts punch、#2143 Hard and quick punch、#2145 Weak fast blow、#2146 Quick ninja strike、#2147 Karate fighter hitting、#2150 Impact of a blow、#2152 Quick knife slice cutting、#2155 Impact of a strong punch、#2158 Quick saber cut、#2160 Metallic sword strike、#2163 Martial arts kick、#2164 Short boxing punch、#2184 Knife fast hit、#2198 Strong punches to the body、#2199 Body cutting impact、#498 Deep heartbeat impact、#788 Big cinematic impact | 轻 / 重拳、腿法、反击暴击、刀剑命中、倒地 |
| VibeHub 官方 CLI · ElevenLabs 文生音效（eleven_text_to_sound_v2），本项目自行生成 | 生成内容随项目使用 | staff、block、punchH、punchL、slash、parry、fall、fall2、kick2 | 棍击、格挡、完美格挡、刀砍、倒地 |

处理：按起音切片 → 截断淡出 → 峰值标准化到 −1 dBFS → 单声道 48 kHz Opus 64 kbps。
游戏里 HQ 样本作主层，Kenney / qubodup 样本作纹理层，再叠合成低频（`src/p51.js` 的 `impact`）。
Mixkit 素材只以内嵌、经过处理的形式随游戏分发；请不要从仓库或 HTML 中把它们提取出来单独再分发。

## 第四、五集配音与新配乐（`assets/audio/ep45/*.part` → `build/audiodata2.js`）

- 配音：VibeHub 官方 CLI `voice-hd`（MiMo HD 语音，官方预设音色 + 导演提示），本项目自行生成；布莱克上尉加耳机滤波、老爹电话加电话滤波、T-13 加机械回声、黑成龙用成龙同一音色降调加混响。台词表见 `assets/audio/ep45/lines.json`。
- 配乐：MiniMax `music-2.6`（通过 mmx 接口，本项目自行生成的纯音乐）——第十三区潜入（base13）、飞艇 T-13 决战（sky）、雪山栈道（snow）、阴阳台镜像决战（mirror）。
